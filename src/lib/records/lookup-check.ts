/**
 * Lookups hold only records their filter offers (1.0.25).
 *
 * A lookup field with a filter (Vendor: org_type = vendor; Ship to: a Location whose Organization is
 * this record's Customer) offers only matching records on screen. A save through the API could still
 * set any id, so the save pipeline checks it too: when the lookup's value, or the field its filter
 * reads, changes, the chosen record must match. Values that did not change are left alone, so data
 * saved before a filter existed still saves.
 */
import { adapter } from "@/lib/data/adapter";
import { cleanLookupFilter, lookupFilterWant, lookupRowMatches, type LookupFilter } from "@/lib/catalog/lookup-filter";
import { listFieldDefinitions, type FieldDefinition } from "@/lib/fixtures/catalog";
import { getInstance } from "@/lib/fixtures/record-instances";
import { getRecordType } from "@/lib/fixtures/record-types";

type Row = Record<string, unknown> & { id?: string; name?: string };
type Values = Record<string, unknown>;

const text = (v: unknown) => (v === null || v === undefined ? "" : String(v)).trim();

async function target(object: string, id: string): Promise<Row | null> {
  if (object === "organization") {
    return adapter.getOrganization ? ((await adapter.getOrganization(id)) as unknown as Row | null) : null;
  }
  const record = adapter.getRecord ? await adapter.getRecord(id) : getInstance(id);
  return (record as unknown as Row | null) ?? null;
}

function labelOf(object: string, apiName: string): string {
  return listFieldDefinitions(object).find((f) => f.api_name === apiName)?.label ?? apiName;
}

async function problemFor(
  object: string,
  field: FieldDefinition,
  filter: LookupFilter,
  id: string,
  values: Values,
): Promise<string | null> {
  const targetObject = getRecordType(field.lookup_object_api_name ?? "")?.object_api_name || field.lookup_object_api_name || "";
  const { want, waiting } = lookupFilterWant(filter, values);
  const fromLabel = filter.from_field ? labelOf(object, filter.from_field) : "";
  if (waiting) {
    return `${field.label}: fill in ${fromLabel} first. ${field.label} offers only records that match it. Nothing was saved.`;
  }
  const row = await target(targetObject, id);
  if (!row) return null; // a missing record is not this check's concern
  if (lookupRowMatches(filter, row, want)) return null;
  const name = text(row.name) || id;
  const fieldLabel = labelOf(targetObject, filter.field);
  return filter.from_field
    ? `${field.label}: "${name}" is not offered for this ${fromLabel}: its ${fieldLabel} must be the record's ${fromLabel}. Nothing was saved.`
    : `${field.label}: "${name}" is not offered here: only records whose ${fieldLabel} is "${filter.value}". Nothing was saved.`;
}

const changed = (field: FieldDefinition, filter: LookupFilter, now: Values, before: Values | null | undefined) =>
  text(now[field.api_name]) !== text(before?.[field.api_name]) ||
  (!!filter.from_field && text(now[filter.from_field]) !== text(before?.[filter.from_field]));

/** The first lookup that holds a record its filter does not offer, as a message; null when all match. */
export async function lookupFilterProblem(args: {
  object: string;
  data: Record<string, string>;
  lines?: Array<{ id?: string; data: Record<string, string> }>;
  current?: { data?: Values | null; lines?: Array<{ id: string; data?: Values | null }> } | null;
}): Promise<string | null> {
  const filtered = listFieldDefinitions(args.object)
    .map((field) => ({ field, filter: cleanLookupFilter(field.lookup_filter) }))
    .filter((x): x is { field: FieldDefinition; filter: LookupFilter } => !!x.filter && !!x.field.lookup_object_api_name);
  if (!filtered.length) return null;

  for (const { field, filter } of filtered.filter((x) => x.field.zone_role !== "list")) {
    const id = text(args.data[field.api_name]);
    if (!id || !changed(field, filter, args.data, args.current?.data)) continue;
    const problem = await problemFor(args.object, field, filter, id, args.data);
    if (problem) return problem;
  }
  const lineFields = filtered.filter((x) => x.field.zone_role === "list");
  if (!lineFields.length || !args.lines) return null;
  const before = new Map((args.current?.lines ?? []).map((line) => [line.id, line.data ?? {}]));
  for (const line of args.lines) {
    const old = line.id ? before.get(line.id) : undefined;
    for (const { field, filter } of lineFields) {
      const id = text(line.data[field.api_name]);
      if (!id || !changed(field, filter, line.data, old)) continue;
      const problem = await problemFor(args.object, field, filter, id, line.data);
      if (problem) return `Line: ${problem}`;
    }
  }
  return null;
}
