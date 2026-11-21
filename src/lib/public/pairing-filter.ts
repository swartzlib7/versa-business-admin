/**
 * Element filter (1.0.16): which records a "Filter" Element paints.
 *
 * `filter_json` on a Driver pairing is a JSON array of conditions; a record
 * paints when it meets every one:
 *
 *   [{ "field": "external_id", "op": "starts_with", "value": "ba_sample:" }]
 *
 * `field` is a header field (`data.<field>`), or `name` / `status` on the
 * record itself. Ops: `eq` (default), `ne`, `starts_with`, `contains`,
 * `empty`, `not_empty`. Text compares ignore case. An empty or unreadable
 * filter matches every record.
 */

export type PairingFilterOp = "eq" | "ne" | "starts_with" | "contains" | "empty" | "not_empty";

export type PairingFilterCondition = { field: string; op: PairingFilterOp; value: string };

const OPS = new Set<PairingFilterOp>(["eq", "ne", "starts_with", "contains", "empty", "not_empty"]);

/** The Demo canvas: sample-pack records only. */
export const SAMPLE_ONLY_FILTER_JSON = JSON.stringify([
  { field: "external_id", op: "starts_with", value: "ba_sample:" },
]);

export function parsePairingFilter(raw: string | undefined | null): PairingFilterCondition[] {
  const text = (raw ?? "").trim();
  if (!text) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [];
  }
  const list = Array.isArray(parsed) ? parsed : [parsed];
  const out: PairingFilterCondition[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const field = String(row.field ?? "").trim();
    if (!field) continue;
    const op = String(row.op ?? "eq").trim() as PairingFilterOp;
    out.push({ field, op: OPS.has(op) ? op : "eq", value: String(row.value ?? "") });
  }
  return out;
}

type FilterableRecord = { name?: string; status?: string; data?: Record<string, unknown> };

function fieldValue(record: FilterableRecord, field: string): string {
  const fromData = record.data?.[field];
  if (fromData !== undefined && fromData !== null) return String(fromData);
  if (field === "name") return String(record.name ?? "");
  if (field === "status") return String(record.status ?? "");
  return "";
}

export function recordMatchesFilter(record: FilterableRecord, conditions: PairingFilterCondition[]): boolean {
  for (const c of conditions) {
    const have = fieldValue(record, c.field).trim().toLowerCase();
    const want = c.value.trim().toLowerCase();
    const ok =
      c.op === "ne" ? have !== want
      : c.op === "starts_with" ? have.startsWith(want)
      : c.op === "contains" ? have.includes(want)
      : c.op === "empty" ? have === ""
      : c.op === "not_empty" ? have !== ""
      : have === want;
    if (!ok) return false;
  }
  return true;
}

/**
 * Records an Element paints: "one" = the bound record, "filter" = records
 * matching the filter, "all" = every record of the type.
 */
export function selectPairedRecords<T extends FilterableRecord & { id: string }>(
  records: T[],
  fields: { selection_mode: string; target_record_id?: string; filter_json?: string },
): T[] {
  const target = fields.target_record_id && fields.target_record_id !== "*" ? fields.target_record_id : "";
  if (fields.selection_mode === "one") return target ? records.filter((row) => row.id === target) : records;
  if (fields.selection_mode === "filter") {
    const conditions = parsePairingFilter(fields.filter_json);
    return records.filter((row) => recordMatchesFilter(row, conditions));
  }
  return records;
}
