/**
 * Number automatically, Postgres side (1.0.26, state_shipments.md §5). Called inside the
 * transaction that inserts a new record: for each header field with `auto_number` left empty,
 * the counter row for (type, field, prefix) is locked, the next number is the higher of the
 * counter and the highest number already stored with that prefix, plus one, and the counter
 * moves on. Two inserts at once wait for each other on the lock, so they never share a number;
 * an insert that fails rolls the counter back, so no number is lost. A deleted record's number
 * is not given again.
 */
import { sql } from "drizzle-orm";
import { listFieldDefinitions } from "@/lib/fixtures/catalog";
import { getRecordType } from "@/lib/fixtures/record-types";
import { cleanAutoNumber } from "@/lib/records/auto-number";

/** The transaction handle drizzle passes to `db.transaction(async (tx) => …)`. */
type Tx = { execute: (query: ReturnType<typeof sql>) => Promise<unknown> };

const rowsOf = (result: unknown): Array<Record<string, unknown>> =>
  Array.isArray(result) ? result : ((result as { rows?: Array<Record<string, unknown>> })?.rows ?? []);

/** Postgres regular expression for "<prefix><digits>", the prefix taken literally. */
export function numberPattern(prefix: string): string {
  return "^" + prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([0-9]{1,15})$";
}

/** Fills the empty Number automatically fields of `header` (in place). */
export async function takeRecordNumbers(
  tx: Tx,
  type: { id: string; apiName: string },
  header: Record<string, string>,
): Promise<void> {
  const object = getRecordType(type.apiName)?.object_api_name || type.apiName;
  const fields = listFieldDefinitions(object).filter(
    (f) => f.auto_number && f.zone_role !== "list" && !String(header[f.api_name] ?? "").trim(),
  );
  for (const field of fields) {
    const rule = cleanAutoNumber(field.auto_number);
    if (!rule) continue;
    await tx.execute(sql`
      INSERT INTO record_number_counter (type_api_name, field_api_name, prefix, last_value)
      VALUES (${type.apiName}, ${field.api_name}, ${rule.prefix}, 0)
      ON CONFLICT DO NOTHING`);
    const locked = rowsOf(
      await tx.execute(sql`
        SELECT last_value FROM record_number_counter
        WHERE type_api_name = ${type.apiName} AND field_api_name = ${field.api_name} AND prefix = ${rule.prefix}
        FOR UPDATE`),
    );
    const pattern = numberPattern(rule.prefix);
    const highest = rowsOf(
      await tx.execute(sql`
        SELECT COALESCE(MAX(((regexp_match(header->>${field.api_name}, ${pattern}, 'i'))[1])::bigint), 0) AS m
        FROM record WHERE record_type_id = ${type.id}`),
    );
    const next = Math.max(Number(locked[0]?.last_value ?? 0), Number(highest[0]?.m ?? 0)) + 1;
    header[field.api_name] = rule.prefix + String(next).padStart(rule.digits, "0");
    await tx.execute(sql`
      UPDATE record_number_counter SET last_value = ${next}, updated_at = now()
      WHERE type_api_name = ${type.apiName} AND field_api_name = ${field.api_name} AND prefix = ${rule.prefix}`);
  }
}
