/**
 * The integration engine (1.0.20, state_integrations.md §3.6, §3.8). One loop per
 * process, started at boot. Every few seconds it looks for active Integrations whose
 * interval ("Every (seconds)") has passed:
 *   send + push    → send waiting Exchange rows to the partner's POST /api/exchange
 *   receive + pull → ask the partner's GET /api/exchange for each line, apply, move the marker
 * Nothing is lost on failure: rows stay queued (push) and the marker stays put (pull).
 * One VBA process per database: the loop guards itself within the process only.
 */
import type { RecordInstance } from "@/lib/fixtures/record-instances";
import { readRecordSecret } from "@/lib/secrets/read-secret";
import { listOpenRows, patchRow, readRow, type ExchangeRow } from "@/lib/integrations/exchange-store";
import { installTimeZone } from "@/lib/settings/install-time-zone";
import { isTimeZone } from "@/lib/statistics/time-zone";
import { ALREADY_HERE, EXCHANGE_VERSION, type ExchangeItem, type ItemResult } from "@/lib/integrations/items";
import { applyItems } from "@/lib/integrations/receive";
import { endpointProblem, MAX_ITEMS, retryDelayMs } from "@/lib/integrations/rules";

const KEY = "__vbaIntegrationEngine__";
const TICK_MS = 5_000;
const FAILURES_BEFORE_ERROR = 5;
const MAX_BODY_BYTES = 5 * 1024 * 1024;

type State = {
  timer?: ReturnType<typeof setInterval>;
  busy: boolean;
  lastRun: Map<string, number>;
  failures: Map<string, number>;
  /** One run at a time per Integration: a run waits for the one before it. */
  running: Map<string, Promise<string>>;
};

function state(): State {
  const g = globalThis as Record<string, unknown>;
  const s = (g[KEY] ??= { busy: false, lastRun: new Map(), failures: new Map(), running: new Map() }) as State;
  s.running ??= new Map();
  return s;
}

export function startIntegrationEngine(): void {
  const s = state();
  if (s.timer) return;
  s.timer = setInterval(() => void tick(), TICK_MS);
  s.timer.unref?.();
}

/** Run one Integration now (the Integration's "Run now" / tests). */
export async function runIntegrationNow(id: string): Promise<string> {
  const { adapter } = await import("@/lib/data/adapter");
  const integration = adapter.getRecord ? await adapter.getRecord(id) : null;
  if (!integration || integration.type_api_name !== "vendor_integration") return "Integration not found.";
  return runOne(integration, true);
}

async function tick(): Promise<void> {
  const s = state();
  if (s.busy) return;
  s.busy = true;
  try {
    const { adapter } = await import("@/lib/data/adapter");
    if (!adapter.listRecords) return;
    const integrations = await adapter.listRecords({ type_api_name: "vendor_integration" });
    const now = Date.now();
    for (const integration of integrations) {
      if (integration.status !== "active") continue;
      const every = Math.max(5, Number(integration.data?.interval_seconds) || 60) * 1000;
      if (now - (s.lastRun.get(integration.id) ?? 0) < every) continue;
      s.lastRun.set(integration.id, now);
      await runOne(integration).catch((err) => console.warn(`Integration ${integration.name}:`, err));
    }
  } catch (err) {
    console.warn("Integration engine:", err);
  } finally {
    s.busy = false;
  }
}

/** Runs of one Integration never overlap: a background run and Run now queue behind each other. */
function runOne(integration: RecordInstance, now = false): Promise<string> {
  const s = state();
  const before = s.running.get(integration.id) ?? Promise.resolve("");
  const next = before.catch(() => "").then(async () => {
    // Read the Integration again: the run before may have changed it (status, pull markers).
    const { adapter } = await import("@/lib/data/adapter");
    const current = (adapter.getRecord ? await adapter.getRecord(integration.id).catch(() => null) : null) ?? integration;
    if (current.status !== "active" && !now) return "Not active.";
    return runOneNow(current, now);
  });
  s.running.set(integration.id, next);
  void next.finally(() => {
    if (s.running.get(integration.id) === next) s.running.delete(integration.id);
  });
  return next;
}

async function runOneNow(integration: RecordInstance, now: boolean): Promise<string> {
  const direction = String(integration.data?.direction ?? "");
  const mode = String(integration.data?.mode ?? "push");
  if (direction === "send" && mode === "push") return sendWaiting(integration, now);
  if (direction === "receive" && mode === "pull") return pullAll(integration);
  return "Nothing to run: this side is called by the partner.";
}

/** The token this side presents (Credential Configuration: {"token": "vba_…"}). */
async function callingToken(integration: RecordInstance): Promise<string | null> {
  const credentialId = String(integration.data?.credential_id ?? "");
  if (!credentialId) return null;
  const raw = (await readRecordSecret(credentialId, "configuration").catch(() => null))?.trim() ?? "";
  if (raw.startsWith("vba_")) return raw;
  try {
    const token = String((JSON.parse(raw) as { token?: unknown }).token ?? "");
    return token.startsWith("vba_") ? token : null;
  } catch {
    return null;
  }
}

/**
 * `error` "" = a successful call (clears the failure count); null = nothing was due (keeps it).
 * `result`: the Last result line staff read (what was sent, or each pull's window and count).
 */
async function setOutcome(integration: RecordInstance, error: string | null, stop = false, result?: string): Promise<void> {
  const s = state();
  const { touchRecordFieldDb } = await import("@/lib/db/records-store");
  await touchRecordFieldDb(integration.id, "last_run_at", new Date().toISOString());
  const line = result ?? (error ? `Failed: ${error}` : undefined);
  if (line !== undefined) await touchRecordFieldDb(integration.id, "last_result", line);
  if (error === null) return;
  await touchRecordFieldDb(integration.id, "last_error", error);
  if (!error) {
    s.failures.delete(integration.id);
    return;
  }
  const count = (s.failures.get(integration.id) ?? 0) + 1;
  s.failures.set(integration.id, count);
  if (stop || count >= FAILURES_BEFORE_ERROR) {
    const { adapter } = await import("@/lib/data/adapter");
    await adapter.updateRecord?.(integration.id, { status: "error" });
    s.failures.delete(integration.id);
    console.warn(`Integration ${integration.name} stopped (status Error): ${error}`);
  }
}

async function call(
  integration: RecordInstance,
  method: "GET" | "POST",
  pathAndQuery: string,
  body?: unknown,
): Promise<{ ok: true; json: Record<string, unknown> } | { ok: false; error: string; stop: boolean }> {
  const endpoint = String(integration.data?.endpoint_url ?? "").trim().replace(/\/+$/, "");
  const problem = endpointProblem(endpoint);
  if (problem) return { ok: false, error: problem, stop: true };
  const token = await callingToken(integration);
  if (!token) return { ok: false, error: "No access token: set the Credential's Configuration to {\"token\": \"vba_…\"}.", stop: true };
  const payload = body === undefined ? undefined : JSON.stringify(body);
  if (payload && Buffer.byteLength(payload) > MAX_BODY_BYTES) return { ok: false, error: "Batch larger than 5 MB.", stop: false };
  let res: Response;
  try {
    res = await fetch(`${endpoint}${pathAndQuery}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
      body: payload,
      signal: AbortSignal.timeout(60_000),
      redirect: "error",
    });
  } catch (err) {
    return { ok: false, error: `Partner not reachable: ${err instanceof Error ? err.message : String(err)}`, stop: false };
  }
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  const message = String((json?.error as { message?: string } | undefined)?.message ?? res.statusText);
  if (res.status === 401 || res.status === 403) return { ok: false, error: `Partner refused the token (${res.status}): ${message}`, stop: true };
  if (!res.ok) return { ok: false, error: `Partner answered ${res.status}: ${message}`, stop: false };
  if (!json || json.vba_exchange !== EXCHANGE_VERSION) {
    return { ok: false, error: "The partner speaks another exchange version: upgrade both installs to the same release.", stop: true };
  }
  return { ok: true, json };
}

function due(row: ExchangeRow, now: number): boolean {
  if (row.data.status === "new") return true;
  const attempts = Number(row.data.attempts) || 0;
  return now - Date.parse(row.updated_at) >= retryDelayMs(attempts);
}

/** Push: send waiting rows, oldest first, in batches. `ignoreBackoff`: Run now sends what is waiting at once. */
async function sendWaiting(integration: RecordInstance, ignoreBackoff = false): Promise<string> {
  const now = Date.now();
  const open = await listOpenRows(integration.id, 1000);
  const waiting = ignoreBackoff ? open : open.filter((row) => due(row, now));
  if (!waiting.length) {
    const quiet = open.length ? `Nothing due yet: ${open.length} waiting to retry.` : "Nothing waiting to send.";
    await setOutcome(integration, null, false, quiet);
    return quiet;
  }
  let sent = 0;
  let records = 0;
  let values = 0;
  let skipped = 0;
  let refused = 0;
  let retry = 0;
  for (let i = 0; i < waiting.length; i += MAX_ITEMS) {
    const batch = waiting.slice(i, i + MAX_ITEMS);
    const items = batch.map((row) => JSON.parse(row.data.payload) as ExchangeItem);
    const answer = await call(integration, "POST", "/api/exchange", { vba_exchange: EXCHANGE_VERSION, time_zone: installTimeZone(), items });
    if (!answer.ok) {
      for (const sentRow of batch) {
        // Read the row again: a save during the send may have newer values that must not be overwritten.
        const row = (await readRow(sentRow.id)) ?? sentRow;
        await patchRow(row, { status: "pending", attempts: String((Number(row.data.attempts) || 0) + 1), error_message: answer.error });
      }
      await setOutcome(integration, answer.error, answer.stop);
      return answer.error;
    }
    const results = (answer.json.results ?? []) as ItemResult[];
    for (const sentRow of batch) {
      // A save during the send may have put newer values on this row: then it stays waiting for the next run.
      const row = (await readRow(sentRow.id)) ?? sentRow;
      if (row.data.source_version !== sentRow.data.source_version || row.data.action !== sentRow.data.action) {
        retry += 1;
        continue;
      }
      const result = results.find((r) => r.table === row.data.source_table && r.id === row.data.source_id);
      if (!result || result.status === "retry") {
        retry += 1;
        await patchRow(row, { status: "pending", attempts: String((Number(row.data.attempts) || 0) + 1), error_message: result?.message ?? "No answer for this item." });
        continue;
      }
      if (result.status === "skipped") skipped += 1;
      if (result.status === "error") refused += 1;
      if (result.status === "ok") {
        if (row.data.source_table === "stat_line") values += 1;
        else records += 1;
      }
      await patchRow(row, {
        status: result.status === "skipped" ? "skipped" : result.status,
        external_id: result.external_id ?? row.data.external_id ?? "",
        error_message: result.message ?? "",
      });
      if (result.status === "ok") sent += 1;
    }
  }
  const parts = [
    `Sent ${sent}` + (sent ? ` (${[records ? `${records} record${records === 1 ? "" : "s"}` : "", values ? `${values} statistic value${values === 1 ? "" : "s"}` : ""].filter(Boolean).join(", ")})` : ""),
    skipped ? `${skipped} skipped by the partner's filter` : "",
    refused ? `${refused} refused (see Exchange)` : "",
    retry ? `${retry} waiting to retry` : "",
  ].filter(Boolean);
  const summary = `${parts.join("; ")}.`;
  await setOutcome(integration, "", false, summary);
  return summary;
}

/** "2026-11-24 10:05 UTC" */
function at(iso: string): string {
  return Number.isNaN(Date.parse(iso)) ? iso : `${new Date(iso).toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

/** Pull: for each line, ask for changes since its marker; move the marker only after every page is stored. */
async function pullAll(integration: RecordInstance): Promise<string> {
  const { adapter } = await import("@/lib/data/adapter");
  const lines = integration.lines ?? [];
  const userId = null;
  let moved = false;
  const summaries: string[] = [];
  const nextLines = lines.map((line) => ({ id: line.id, line_group: line.line_group, data: { ...line.data } }));
  for (const line of nextLines) {
    const type = String(line.data.flow_record_type ?? "").trim();
    if (!type || String(line.data.flow_enabled ?? "true") === "false") continue;
    const since = String(line.data.flow_pull_marker ?? "").trim();
    let cursor: string | null = "0";
    let marker = "";
    let asOf = "";
    let fresh = 0;
    let repeats = 0;
    let skipped = 0;
    let refused = 0;
    while (cursor !== null) {
      const q = new URLSearchParams({ type, cursor });
      if (since) q.set("since", since);
      if (line.data.flow_filter?.trim()) q.set("filter", line.data.flow_filter);
      if (marker) q.set("marker", marker);
      const answer = await call(integration, "GET", `/api/exchange?${q}`);
      if (!answer.ok) {
        await setOutcome(integration, answer.error, answer.stop);
        return answer.error;
      }
      marker = String(answer.json.marker ?? marker);
      asOf = String(answer.json.as_of ?? asOf);
      const items = (answer.json.items ?? []) as ExchangeItem[];
      const senderTimeZone = isTimeZone(answer.json.time_zone) ? answer.json.time_zone : undefined;
      const results = await applyItems({ integration, userId, pulling: true, senderTimeZone }, items);
      for (const r of results) {
        if (r.status === "ok" && r.message === ALREADY_HERE) repeats += 1;
        else if (r.status === "ok") fresh += 1;
        else if (r.status === "skipped") skipped += 1;
        else refused += 1;
      }
      cursor = (answer.json.next_cursor as string | null) ?? null;
    }
    if (marker && marker !== since) {
      line.data.flow_pull_marker = marker;
      moved = true;
    }
    // The window this run covered, in the partner's clock: from the stored edge (or the beginning) to its "as of".
    const counts = [
      fresh ? `${fresh} new or changed` : "no changes",
      repeats ? `${repeats} already here` : "",
      skipped ? `${skipped} skipped by this filter` : "",
      refused ? `${refused} refused (see Exchange)` : "",
    ].filter(Boolean).join(", ");
    summaries.push(`${type}: ${counts}, from ${since ? at(since) : "the beginning"} to ${at(asOf || marker)} (partner's clock)`);
  }
  if (moved && adapter.updateRecord) await adapter.updateRecord(integration.id, { lines: nextLines });
  const summary = summaries.length ? `${summaries.join("; ")}.` : "No record types switched on.";
  await setOutcome(integration, "", false, summary);
  return summary;
}
