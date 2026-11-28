/**
 * Lookup filters (1.0.15, widened 1.0.25). A lookup field can offer only some records:
 *
 * - `{ field, value }`: records whose `field` equals a fixed value (Vendor: org_type = vendor).
 * - `{ field, from_field }` (1.0.25): records whose `field` equals this record's own `from_field`
 *   (Ship to: a Location whose Organization is this record's Customer). On a line, `from_field`
 *   is read from the same line. Until `from_field` has a value, nothing is offered.
 *
 * Shared by the pickers (browser) and the save pipeline (server). No I/O here.
 */
export type LookupFilter = { field: string; value: string; from_field?: string };

const text = (v: unknown) => (v === null || v === undefined ? "" : String(v)).trim();

/** A filter as stored: trimmed; `from_field` wins over `value`. null when it names no field. */
export function cleanLookupFilter(raw: unknown): LookupFilter | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const field = text(r.field);
  if (!field) return null;
  const from = text(r.from_field);
  return from ? { field, value: "", from_field: from } : { field, value: String(r.value ?? "") };
}

/**
 * The value a target record must hold in `filter.field`. `waiting`: the filter depends on a
 * field of this record that is still empty (nothing can be offered yet).
 */
export function lookupFilterWant(
  filter: LookupFilter,
  values?: Record<string, unknown> | null,
): { want: string; waiting: boolean } {
  if (filter.from_field) {
    const want = text(values?.[filter.from_field]);
    return { want, waiting: want === "" };
  }
  return { want: filter.value, waiting: false };
}

/** Does a target row (record or organization, as the API returns it) pass the filter? */
export function lookupRowMatches(filter: LookupFilter, row: Record<string, unknown>, want: string): boolean {
  const data = (row.data && typeof row.data === "object" ? row.data : {}) as Record<string, unknown>;
  const have = data[filter.field] ?? row[filter.field];
  return text(have) === text(want);
}

/** "customer_org_id" → "Customer": names the field a filter waits for, in a picker's placeholder. */
export function dependsOnLabel(filter: LookupFilter): string {
  const name = (filter.from_field ?? "").replace(/_(organization|org)?_?id$/, "").replace(/_/g, " ").trim();
  return name ? name[0].toUpperCase() + name.slice(1) : "the field this depends on";
}
