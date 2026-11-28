/**
 * Applying received items (1.0.20, state_integrations.md §3.6, §4). Push and pull use
 * the same code: match on External ID, the receive line's filter, the statistics
 * rules S1–S8, and a delete only marks the copy (I12). Every stored, skipped or
 * refused item writes an inbound Exchange row; a repeat of a version already applied
 * changes nothing and writes nothing.
 */
import type { RecordInstance } from "@/lib/fixtures/record-instances";
import { listFieldDefinitions } from "@/lib/fixtures/catalog";
import { getRecordType } from "@/lib/fixtures/record-types";
import { parsePairingFilter, recordMatchesFilter } from "@/lib/public/pairing-filter";
import { lineFor } from "@/lib/integrations/token-auth";
import { lastVersions, writeRow } from "@/lib/integrations/exchange-store";
import { copyExternalId } from "@/lib/integrations/rules";
import { ALREADY_HERE, itemLabel, type ExchangeItem, type ItemResult, type RecordItem, type StatLineItem } from "@/lib/integrations/items";

type Ctx = {
  integration: RecordInstance;
  userId: string | null;
  /** Pull: an item that would wait for its statistic is an error now (the marker moves on). */
  pulling?: boolean;
  /** 1.0.21: the sending install's zone, from the request (push) or the answer (pull). */
  senderTimeZone?: string;
};

const STANDARD = new Set(["name", "status", "external_id", "source_deleted_at"]);

export async function applyItems(ctx: Ctx, items: ExchangeItem[]): Promise<ItemResult[]> {
  const { adapter } = await import("@/lib/data/adapter");
  const seen = await lastVersions(ctx.integration.id, "inbound");
  const copies = new Map<string, Map<string, RecordInstance>>();
  const copiesOf = async (type: string) => {
    if (!copies.has(type)) {
      const rows = adapter.listRecords ? await adapter.listRecords({ type_api_name: type }) : [];
      copies.set(type, new Map(rows.map((r) => [String(r.data?.external_id ?? ""), r])));
    }
    return copies.get(type)!;
  };
  // Records (statistics among them) before graph lines (S1).
  const ordered = [...items.filter((i) => i.table === "record"), ...items.filter((i) => i.table === "stat_line")];
  const results: ItemResult[] = [];
  for (const item of ordered) {
    let result: ItemResult;
    try {
      result = item.table === "record" ? await applyRecord(ctx, item, seen, copiesOf) : await applyLine(ctx, item, seen, copiesOf);
    } catch (err) {
      result = { table: item.table, id: item.id, status: "error", message: err instanceof Error ? err.message : String(err) };
    }
    if (ctx.pulling && result.status === "retry") result = { ...result, status: "error" };
    if (result.status !== "retry" && !(result as ItemResult & { quiet?: boolean }).quiet) {
      await writeRow({
        name: itemLabel(item),
        origin: "inbound",
        status: result.status,
        action: item.action,
        integration_id: ctx.integration.id,
        source_table: item.table,
        source_id: item.id,
        source_version: item.updated_at,
        payload: JSON.stringify(item),
        external_id: result.external_id ?? "",
        error_message: result.message ?? "",
      });
    }
    delete (result as ItemResult & { quiet?: boolean }).quiet;
    results.push(result);
  }
  return results;
}

type CopiesOf = (type: string) => Promise<Map<string, RecordInstance>>;

async function applyRecord(ctx: Ctx, item: RecordItem, seen: Map<string, string>, copiesOf: CopiesOf): Promise<ItemResult & { quiet?: boolean }> {
  const base = { table: item.table, id: item.id };
  const line = lineFor(ctx.integration, item.type);
  if (!line) return { ...base, status: "error", message: `This install does not take ${item.type} from this integration.` };
  const registry = getRecordType(item.type);
  if (!registry) return { ...base, status: "error", message: `Record type ${item.type} does not exist here.` };
  const external = copyExternalId(ctx.integration.id, item.id);
  const copy = (await copiesOf(item.type)).get(external) ?? null;
  const applied = seen.get(`record:${item.id}`);
  if (copy && !item.force && applied && item.action === "upsert" && item.updated_at <= applied) {
    // The same version, or an older one arriving late (two quick saves queued twice): never go backwards.
    return { ...base, status: "ok", external_id: copy.id, message: ALREADY_HERE, quiet: true };
  }

  const { adapter } = await import("@/lib/data/adapter");
  if (item.action === "delete") {
    // I12: a delete at the source marks the copy; nothing is deleted here.
    if (!copy) return { ...base, status: "ok", message: "No copy here." };
    const res = await adapter.updateRecord!(copy.id, { data: { ...copy.data, source_deleted_at: new Date().toISOString() } });
    return res.ok ? { ...base, status: "ok", external_id: copy.id, message: "Marked deleted at source." } : { ...base, status: "error", message: res.message };
  }

  if (!recordMatchesFilter({ id: item.id, name: item.name, status: item.status, data: item.data }, parsePairingFilter(line.data.flow_filter))) {
    return { ...base, status: "skipped", message: "Outside this integration's filter." };
  }

  const { objectFor } = await import("@/lib/records/pipeline");
  const known = new Set(listFieldDefinitions(objectFor(item.type)).map((d) => d.api_name));
  const data: Record<string, string> = {};
  const dropped: string[] = [];
  for (const [field, value] of Object.entries(item.data ?? {})) {
    if (STANDARD.has(field)) continue;
    if (known.has(field)) data[field] = value;
    else dropped.push(field);
  }
  // 1.0.21: a statistic from a sender before 1.0.21 carries no zone; it was stamped in the sender's.
  if (item.type === "statistics" && !String(data.time_zone ?? "").trim() && ctx.senderTimeZone) data.time_zone = ctx.senderTimeZone;
  const notes = [
    dropped.length ? `Not on this install, left out: ${dropped.join(", ")}.` : "",
    item.left_out?.length ? `Not carried by the sender: ${item.left_out.join(", ")}.` : "",
  ].filter(Boolean).join(" ");

  const { prepareRecordWrite, afterRecordWrite } = await import("@/lib/records/pipeline");
  const lines = item.lines?.map((l) => ({ line_group: l.line_group, data: l.data }));
  if (!copy) {
    const full = { ...data, external_id: external, source_deleted_at: "" };
    const prepared = await prepareRecordWrite({ typeApiName: item.type, data: full, lines, checkFields: false });
    if (!prepared.ok) return { ...base, status: "error", message: prepared.message };
    const made = await adapter.createRecord!(
      {
        type_api_name: item.type,
        parent_kind: registry.parent_kind,
        parent_api_name: registry.parent_api_name,
        name: item.name,
        status: item.status || "active",
        data: prepared.data as Record<string, string>,
        ...(prepared.lines ? { lines: prepared.lines } : lines ? { lines } : {}),
      },
      { createdBy: ctx.userId },
    );
    if (!made.ok) return { ...base, status: "error", message: made.message };
    (await copiesOf(item.type)).set(external, made.instance);
    await afterRecordWrite(made.instance, null).catch(() => undefined);
    return { ...base, status: "ok", external_id: made.instance.id, message: notes || undefined };
  }
  // The source wins (§3.9): its fields replace the copy's; the copy keeps its own id and stamps.
  const full = { ...copy.data, ...data, external_id: external, source_deleted_at: "" };
  const prepared = await prepareRecordWrite({ typeApiName: item.type, data: full, lines, current: copy, checkFields: false });
  if (!prepared.ok) return { ...base, status: "error", message: prepared.message };
  const res = await adapter.updateRecord!(copy.id, {
    name: item.name,
    status: item.status || copy.status,
    data: prepared.data as Record<string, string>,
    ...(prepared.lines ? { lines: prepared.lines } : lines ? { lines } : {}),
  });
  if (!res.ok) return { ...base, status: "error", message: res.message };
  (await copiesOf(item.type)).set(external, res.instance);
  await afterRecordWrite(res.instance, copy).catch(() => undefined);
  return { ...base, status: "ok", external_id: copy.id, message: notes || undefined };
}

async function applyLine(ctx: Ctx, item: StatLineItem, seen: Map<string, string>, copiesOf: CopiesOf): Promise<ItemResult & { quiet?: boolean }> {
  const base = { table: item.table, id: item.id };
  const line = lineFor(ctx.integration, "statistics");
  if (!line || String(line.data.flow_include_lines ?? "true") === "false") {
    return { ...base, status: "error", message: "This install does not take graph lines from this integration." };
  }
  const header = (await copiesOf("statistics")).get(copyExternalId(ctx.integration.id, item.header_id));
  // S1: the statistic first. Push retries; a pull reports it (see applyItems).
  if (!header) return { ...base, status: "retry", message: "Statistic not received yet." };
  const appliedLine = seen.get(`stat_line:${item.id}`);
  if (!item.force && item.action === "upsert" && appliedLine && item.updated_at <= appliedLine) {
    return { ...base, status: "ok", message: ALREADY_HERE, quiet: true };
  }

  const { stampFor, upsertStatLineDb } = await import("@/lib/db/stat-lines-store");
  if (item.action === "delete") {
    // I12 / S8: the line stays with its value, marked.
    const kept = await upsertStatLineDb({ headerId: header.id, series: item.series, slot: item.slot, value: null, source: "integration-deleted", keepValue: true });
    return { ...base, status: "ok", external_id: kept.id, message: "Marked deleted at source." };
  }
  // S2: the same (series, slot) must fall on the same date here, or nothing is written.
  const mine = await stampFor(header.id, item.series, item.slot);
  if (item.stamp && mine && Date.parse(mine) !== Date.parse(item.stamp)) {
    const hereZone = String(header.data?.time_zone ?? "").trim() || "no zone set";
    const sourceZone = item.time_zone || ctx.senderTimeZone || "zone not sent";
    return {
      ...base,
      status: "error",
      message: `Header settings differ: series ${item.series} slot ${item.slot} is ${item.stamp} at the source (${sourceZone}) and ${mine} here (${hereZone}).`,
    };
  }
  // S3, S5: by (series, slot), stored as sent; S4: source "integration" is never recomputed.
  const value = String(item.value ?? "").trim();
  const saved = await upsertStatLineDb({ headerId: header.id, series: item.series, slot: item.slot, value: value === "" ? null : value, source: "integration" });
  return { ...base, status: "ok", external_id: saved.id };
}
