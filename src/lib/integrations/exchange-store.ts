/**
 * Exchange rows (1.0.20, state_integrations.md §3.3): one `vendor_exchange` record per
 * item that came in or went out. They are ordinary records (Collaboration → Vendor →
 * Exchange), written straight to the store (never through the save pipeline, so they
 * never queue themselves). Lookups here are SQL on the record header, so a save does
 * not have to load every Exchange row.
 */
import { and, asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { record as recordTable, recordType as recordTypeTable } from "@/lib/db/schema";
import { createRecordDb, updateRecordDb } from "@/lib/db/records-store";

export type ExchangeRow = { id: string; data: Record<string, string>; created_at: string; updated_at: string };


function headerOf(value: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v != null) out[k] = typeof v === "string" ? v : JSON.stringify(v);
    }
  }
  return out;
}

async function select(where: ReturnType<typeof sql>, limit?: number): Promise<ExchangeRow[]> {
  const db = getDb();
  const query = db
    .select({ id: recordTable.id, header: recordTable.header, createdAt: recordTable.createdAt, updatedAt: recordTable.updatedAt })
    .from(recordTable)
    .innerJoin(recordTypeTable, eq(recordTable.recordTypeId, recordTypeTable.id))
    .where(and(eq(recordTypeTable.apiName, "vendor_exchange"), where))
    .orderBy(asc(recordTable.createdAt), asc(recordTable.id));
  const rows = limit ? await query.limit(limit) : await query;
  return rows.map((r) => ({
    id: r.id,
    data: headerOf(r.header),
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString(),
  }));
}

/** The open (new or pending) outbound row for one item, if any. */
export async function findOpenRow(integrationId: string, table: string, sourceId: string): Promise<ExchangeRow | null> {
  const rows = await select(
    sql`${recordTable.header}->>'integration_id' = ${integrationId}
      AND ${recordTable.header}->>'source_table' = ${table}
      AND ${recordTable.header}->>'source_id' = ${sourceId}
      AND ${recordTable.header}->>'origin' = 'outbound'
      AND ${recordTable.header}->>'status' IN ('new', 'pending')`,
    1,
  );
  return rows[0] ?? null;
}

/** Open outbound rows of an Integration, oldest first. */
export async function listOpenRows(integrationId: string, limit = 500): Promise<ExchangeRow[]> {
  return select(
    sql`${recordTable.header}->>'integration_id' = ${integrationId}
      AND ${recordTable.header}->>'origin' = 'outbound'
      AND ${recordTable.header}->>'status' IN ('new', 'pending')`,
    limit,
  );
}

/** Outbound delete rows recorded for a send + pull Integration since a time (served to pulls). */
export async function listDeleteRowsSince(integrationId: string, since: Date | null): Promise<ExchangeRow[]> {
  const rows = await select(
    sql`${recordTable.header}->>'integration_id' = ${integrationId}
      AND ${recordTable.header}->>'origin' = 'outbound'
      AND ${recordTable.header}->>'action' = 'delete'`,
  );
  return since ? rows.filter((r) => Date.parse(r.created_at) >= since.getTime()) : rows;
}

/**
 * For each source id, the newest `updated_at` already applied (inbound) or served
 * (outbound) for an Integration: a repeat of the same version is not applied or logged again.
 */
export async function lastVersions(integrationId: string, origin: "inbound" | "outbound"): Promise<Map<string, string>> {
  const rows = await select(
    sql`${recordTable.header}->>'integration_id' = ${integrationId}
      AND ${recordTable.header}->>'origin' = ${origin}
      AND ${recordTable.header}->>'status' IN ('ok', 'skipped')`,
  );
  const out = new Map<string, string>();
  for (const row of rows) {
    const key = `${row.data.source_table}:${row.data.source_id}`;
    const version = row.data.source_version ?? "";
    if (version && (!out.has(key) || out.get(key)! < version)) out.set(key, version);
  }
  return out;
}

export async function writeRow(data: Record<string, string>, existingId?: string): Promise<void> {
  // The Exchange Status field is the record's own status (`header.status`).
  const full: Record<string, string> = { attempts: "0", status: "new", ...data };
  if (existingId) {
    const res = await updateRecordDb(existingId, { data: full, name: full.name, status: full.status });
    if (!res.ok) console.warn("Exchange row update failed:", res.message);
    return;
  }
  const res = await createRecordDb({
    type_api_name: "vendor_exchange",
    parent_kind: "collaboration",
    parent_api_name: "vendor",
    name: full.name || "Exchange",
    status: full.status,
    data: full,
  });
  if (!res.ok) console.warn("Exchange row create failed:", res.message);
}

/** One Exchange row as stored now (to see whether a save changed it during a send). */
export async function readRow(id: string): Promise<ExchangeRow | null> {
  const rows = await select(sql`${recordTable.id} = ${id}`, 1);
  return rows[0] ?? null;
}

/** Change some fields of an Exchange row (status, attempts, error, external id). */
export async function patchRow(row: ExchangeRow, patch: Record<string, string>): Promise<void> {
  await writeRow({ ...row.data, ...patch }, row.id);
}
