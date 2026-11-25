/**
 * The integration queue (1.0.20, state_integrations.md §3.3, §3.5).
 *
 * After a save or delete, for every active Integration that sends: is the type's line
 * on, and does the record pass its filter? Push: queue one outbound Exchange row per
 * item (a later save replaces a row still waiting). Pull: nothing is queued for
 * changes (the puller asks for current data); a delete is recorded so a pull can
 * return it. Never calls out, so a slow or unreachable partner never slows a save.
 */
import type { RecordInstance } from "@/lib/fixtures/record-instances";
import type { StatLineRow } from "@/lib/db/stat-lines-store";
import { parsePairingFilter, recordMatchesFilter } from "@/lib/public/pairing-filter";
import { lineFor } from "@/lib/integrations/token-auth";
import { findOpenRow, writeRow } from "@/lib/integrations/exchange-store";
import { itemLabel, neverSent, recordItem, statLineItem, type ExchangeItem } from "@/lib/integrations/items";

async function sendingIntegrations(): Promise<RecordInstance[]> {
  const { isPostgresDataSource } = await import("@/lib/db/data-source");
  if (!isPostgresDataSource()) return [];
  const { adapter } = await import("@/lib/data/adapter");
  if (!adapter.listRecords) return [];
  const rows = await adapter.listRecords({ type_api_name: "vendor_integration" });
  return rows.filter((row) => row.status === "active" && String(row.data?.direction ?? "") === "send");
}

async function enqueue(integration: RecordInstance, item: ExchangeItem): Promise<void> {
  const mode = String(integration.data?.mode ?? "push");
  if (mode === "pull" && item.action !== "delete") return;
  const existing = mode === "push" ? await findOpenRow(integration.id, item.table, item.id) : null;
  await writeRow(
    {
      ...(existing?.data ?? {}),
      name: itemLabel(item),
      origin: "outbound",
      status: existing?.data.status ?? "new",
      action: item.action,
      integration_id: integration.id,
      source_table: item.table,
      source_id: item.id,
      source_version: item.updated_at,
      payload: JSON.stringify(item),
      error_message: "",
    },
    existing?.id,
  );
}

/** After a record save (`upsert`) or delete. */
export async function queueRecordChange(record: RecordInstance, action: "upsert" | "delete"): Promise<void> {
  if (neverSent(record)) return;
  const integrations = await sendingIntegrations();
  for (const integration of integrations) {
    const line = lineFor(integration, record.type_api_name);
    if (!line) continue;
    if (!recordMatchesFilter(record, parsePairingFilter(line.data.flow_filter))) continue;
    await enqueue(integration, recordItem(record, action));
  }
}

/** After a graph line changes. The statistic must itself be sent, with its lines. */
export async function queueStatLineChange(headerId: string, line: StatLineRow, action: "upsert" | "delete"): Promise<void> {
  const integrations = await sendingIntegrations();
  if (!integrations.length) return;
  const { adapter } = await import("@/lib/data/adapter");
  const header = adapter.getRecord ? await adapter.getRecord(headerId).catch(() => null) : null;
  if (!header || neverSent(header)) return;
  for (const integration of integrations) {
    const flow = lineFor(integration, "statistics");
    if (!flow || String(flow.data.flow_include_lines ?? "true") === "false") continue;
    if (!recordMatchesFilter(header, parsePairingFilter(flow.data.flow_filter))) continue;
    await enqueue(integration, statLineItem(headerId, line, action));
  }
}

/**
 * Resend all (push): queue every record that passes an Integration's lines, with
 * their graph lines. The receiver's upsert makes it safe to run any time.
 */
export async function resendAll(integration: RecordInstance): Promise<number> {
  const { adapter } = await import("@/lib/data/adapter");
  const { listStatLinesDb } = await import("@/lib/db/stat-lines-store");
  if (!adapter.listRecords) return 0;
  let count = 0;
  for (const line of integration.lines ?? []) {
    const type = String(line.data?.flow_record_type ?? "").trim();
    if (!type || String(line.data?.flow_enabled ?? "true") === "false") continue;
    const conditions = parsePairingFilter(line.data?.flow_filter);
    const records = await adapter.listRecords({ type_api_name: type });
    for (const record of records) {
      if (neverSent(record) || !recordMatchesFilter(record, conditions)) continue;
      await enqueue(integration, { ...recordItem(record, "upsert"), force: true });
      count += 1;
      if (type === "statistics" && String(line.data?.flow_include_lines ?? "true") !== "false") {
        for (const ln of await listStatLinesDb(record.id)) {
          if (String(ln.value ?? "").trim() === "") continue;
          await enqueue(integration, { ...statLineItem(record.id, ln, "upsert"), force: true });
          count += 1;
        }
      }
    }
  }
  return count;
}
