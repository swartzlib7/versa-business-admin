/**
 * Record save pipeline (1.0.15, state_records_pipeline.md § Architecture
 * decision). Every records write - create, update, add line, clone, convert -
 * goes through here, from the screen, the API, agents and scripts alike.
 *
 *   prepareRecordWrite (before saving)
 *     1. Statistics: derived header fields (Frequency start, Target per step)
 *     2. Integrated-record rule: a record with an External ID keeps what the
 *        integration wrote - steps 3-5 are skipped
 *     3. Line Formula fields and calculated defaults, per line
 *     4. Header Summary fields (totals of the lines)
 *     5. Header Formula fields and calculated defaults
 *     6. Allocation: a bill's Allocated / Remaining, and the over-allocation
 *        check (a save is refused when it would take a bill past its total)
 *   afterRecordWrite (after saving)
 *     7. Bills this record allocates to get their Allocated / Remaining again
 *     8. Statistics fed by this record type are recomputed
 *
 * Future triggers / flows plug in as more steps here.
 */
import "@/lib/catalog/install-durable";
import { adapter } from "@/lib/data/adapter";
import { listAllFieldDefinitions, listFieldDefinitions, type FieldDefinition } from "@/lib/fixtures/catalog";
import { getInstance, listInstances, updateInstance, type RecordInstance } from "@/lib/fixtures/record-instances";
import { getRecordType } from "@/lib/fixtures/record-types";
import { foldRecordTypeApiName } from "@/lib/catalog/name-aliases";
import { deriveStatHeaderData } from "@/lib/statistics/model";
import { computeSummaryValues } from "@/lib/records/summary-fields";
import { applyRowCalculations, fieldsForPlacement } from "@/lib/records/calculated-fields";
import { refreshAfterRecordWrite } from "@/lib/statistics/record-source";
import { isSampleExternalId } from "@/lib/sample-data/pack";

export type WriteLine = { id?: string; line_group?: string; data: Record<string, string> };

export type PrepareResult =
  | { ok: true; data: Record<string, string>; lines?: WriteLine[] }
  | { ok: false; code: string; message: string };

const CENT = 0.01;
const money = (n: number) => String(Math.round(n * 100) / 100);
const num = (v: unknown) => {
  const n = Number(String(v ?? "").trim());
  return String(v ?? "").trim() !== "" && Number.isFinite(n) ? n : 0;
};

export function objectFor(typeApiName: string): string {
  const folded = foldRecordTypeApiName(typeApiName);
  return getRecordType(folded)?.object_api_name || folded;
}

/**
 * Integrated = came from another system (Wave today): it has an External ID.
 * Sample-pack records (`ba_sample:` ids, 1.0.16) are VBA's own and calculate
 * like any other record.
 */
export function isIntegrated(data: Record<string, unknown> | null | undefined): boolean {
  const id = String(data?.external_id ?? "").trim();
  return id !== "" && !isSampleExternalId(id);
}

async function getRecord(id: string): Promise<RecordInstance | null> {
  if (adapter.getRecord) return adapter.getRecord(id);
  return getInstance(id) ?? null;
}

async function listRecords(typeApiName: string): Promise<RecordInstance[]> {
  if (adapter.listRecords) return adapter.listRecords({ type_api_name: typeApiName });
  return listInstances({ type_api_name: typeApiName });
}

// ── Allocation (bill matching) ─────────────────────────────────────────────

type AllocationField = FieldDefinition & {
  allocation: NonNullable<FieldDefinition["allocation"]>;
  lookup_object_api_name: string;
};

function allocationFields(): AllocationField[] {
  return listAllFieldDefinitions().filter(
    (f): f is AllocationField => f.data_type === "lookup" && !!f.allocation && !!f.lookup_object_api_name,
  );
}

/** Sum of every line portion pointing at `targetId`, optionally leaving one record out. */
async function allocatedTo(targetId: string, targetObject: string, exceptRecordId?: string): Promise<number> {
  let total = 0;
  const byType = new Map<string, AllocationField[]>();
  for (const f of allocationFields()) {
    if (f.lookup_object_api_name !== targetObject) continue;
    byType.set(f.object_api_name, [...(byType.get(f.object_api_name) ?? []), f]);
  }
  for (const [type, fields] of byType) {
    for (const record of await listRecords(type)) {
      if (record.id === exceptRecordId) continue;
      for (const line of record.lines ?? []) {
        for (const f of fields) {
          if (String(line.data?.[f.api_name] ?? "") === targetId) total += num(line.data?.[f.allocation.amount_field]);
        }
      }
    }
  }
  return total;
}

/** The record's own lines: is any bill taken past its total? */
async function overAllocation(
  objectApiName: string,
  recordId: string | undefined,
  lines: WriteLine[],
): Promise<string | null> {
  const fields = allocationFields().filter((f) => f.object_api_name === objectApiName);
  for (const f of fields) {
    const mine = new Map<string, number>();
    for (const line of lines) {
      const target = String(line.data?.[f.api_name] ?? "").trim();
      if (target) mine.set(target, (mine.get(target) ?? 0) + num(line.data?.[f.allocation.amount_field]));
    }
    for (const [targetId, portion] of mine) {
      const target = await getRecord(targetId);
      if (!target) return `${f.label}: the linked record no longer exists.`;
      const total = num(target.data?.[f.allocation.target_total_field]);
      const others = await allocatedTo(targetId, f.lookup_object_api_name, recordId);
      if (others + portion > total + CENT) {
        const left = Math.max(0, total - others);
        return `${target.name || "That bill"} has ${money(left)} left to allocate; these lines take ${money(portion)}.`;
      }
    }
  }
  return null;
}

/** For a target type (a bill): its Allocated / Remaining, and the "Amount below allocated" check. */
async function allocationTotals(
  objectApiName: string,
  recordId: string | undefined,
  data: Record<string, string>,
): Promise<{ data: Record<string, string> } | { problem: string }> {
  const pointing = allocationFields().filter((f) => f.lookup_object_api_name === objectApiName);
  if (!pointing.length) return { data };
  const config = pointing[0].allocation;
  // Only records the lookup offers (e.g. document_kind = bill) carry allocation totals.
  const filter = pointing[0].lookup_filter;
  if (filter?.field && String(data[filter.field] ?? "") !== filter.value) {
    const cleared = { ...data, [config.target_allocated_field]: "" };
    if (config.target_remaining_field) cleared[config.target_remaining_field] = "";
    return { data: cleared };
  }
  // A new bill has nothing allocated yet.
  const allocated = recordId ? await allocatedTo(recordId, objectApiName) : 0;
  const total = num(data[config.target_total_field]);
  if (allocated > total + CENT) {
    return { problem: `The amount can't be lower than the ${money(allocated)} already allocated to lines.` };
  }
  const next = { ...data, [config.target_allocated_field]: money(allocated) };
  if (config.target_remaining_field) next[config.target_remaining_field] = money(total - allocated);
  return { data: next };
}

// ── The pipeline ───────────────────────────────────────────────────────────

export async function prepareRecordWrite(args: {
  typeApiName: string;
  data: Record<string, string>;
  /** Lines sent with this write (undefined = lines unchanged). */
  lines?: WriteLine[];
  /** The record as stored before this write (null for a new record). */
  current?: RecordInstance | null;
}): Promise<PrepareResult> {
  const type = foldRecordTypeApiName(args.typeApiName);
  const object = objectFor(type);
  const fields = listFieldDefinitions(object);
  let data = { ...args.data };
  let lines = args.lines?.map((line) => ({ ...line, data: { ...line.data } }));

  // 1. Statistics derived fields
  if (type === "statistics") data = deriveStatHeaderData(data);

  // 2-5. Calculations, unless the record is integrated
  if (!isIntegrated(data)) {
    const lineFields = fieldsForPlacement(fields, "list");
    if (lines) {
      const before = new Map((args.current?.lines ?? []).map((line) => [line.id, line.data ?? {}]));
      lines = lines.map((line) => ({
        ...line,
        data: applyRowCalculations(lineFields, line.data, line.id ? before.get(line.id) ?? null : null),
      }));
    }
    const effective = lines ?? (args.current?.lines ?? []).map((line) => ({ data: line.data ?? {} }));
    if (fields.some((f) => f.data_type === "summary" && f.summary)) {
      data = { ...data, ...computeSummaryValues(fields, effective.map((line) => line.data)) };
    }
    data = applyRowCalculations(fieldsForPlacement(fields, "header"), data, args.current?.data ?? null);
  }

  // 6. Allocation: this record's lines, and this record as a bill.
  // 1.0.20: a copy received from another VBA install (External ID "<integration id>:<source id>")
  // keeps the source's figures: none of the invoices that allocate to it exist here.
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:./.test(String(data.external_id ?? ""))) {
    return { ok: true, data, lines };
  }
  const effectiveLines = lines ?? (args.current?.lines ?? []).map((line) => ({ id: line.id, data: line.data ?? {} }));
  const over = await overAllocation(object, args.current?.id, effectiveLines);
  if (over) return { ok: false, code: "OVER_ALLOCATED", message: over };
  const totals = await allocationTotals(object, args.current?.id, data);
  if ("problem" in totals) return { ok: false, code: "BELOW_ALLOCATED", message: totals.problem };
  data = totals.data;

  return { ok: true, data, lines };
}

/** Allocation targets (bill ids) referenced by a record's lines. */
function allocationTargets(record: RecordInstance | null | undefined): Array<{ id: string; type: string }> {
  if (!record) return [];
  const object = objectFor(record.type_api_name);
  const out = new Map<string, string>();
  for (const f of allocationFields().filter((x) => x.object_api_name === object)) {
    for (const line of record.lines ?? []) {
      const target = String(line.data?.[f.api_name] ?? "").trim();
      if (target) out.set(target, f.lookup_object_api_name);
    }
  }
  return [...out].map(([id, type]) => ({ id, type }));
}

/** Re-total one bill after a line pointing at it changed (writes the bill directly). */
async function refreshAllocationTarget(targetId: string): Promise<void> {
  const target = await getRecord(targetId);
  if (!target) return;
  const totals = await allocationTotals(objectFor(target.type_api_name), target.id, { ...(target.data ?? {}) });
  if ("problem" in totals) return; // over-allocated by an older save; leave it for the operator to see
  const changed = Object.entries(totals.data).some(([k, v]) => String(target.data?.[k] ?? "") !== v);
  if (!changed) return;
  if (adapter.updateRecord) {
    const result = await adapter.updateRecord(target.id, { data: totals.data });
    // 1.0.20: a re-totalled bill is a change like any other for integrations.
    if (result.ok) await queueForIntegrations(result.instance, "upsert");
  } else updateInstance(target.id, { data: totals.data });
}

export async function afterRecordWrite(
  saved: RecordInstance,
  previous?: RecordInstance | null,
): Promise<void> {
  // 7. Bills referenced before or after this write
  const targets = new Map<string, string>();
  for (const t of [...allocationTargets(previous), ...allocationTargets(saved)]) targets.set(t.id, t.type);
  for (const id of targets.keys()) {
    try {
      await refreshAllocationTarget(id);
    } catch (err) {
      console.warn("Allocation refresh failed for", id, err);
    }
  }
  // 8. Statistics fed by this type (or this statistic itself)
  await refreshAfterRecordWrite(saved.type_api_name, saved.id);
  // 9. 1.0.20: integrations that send this record (state_integrations.md §3.5)
  await queueForIntegrations(saved, "upsert");
}

async function queueForIntegrations(record: RecordInstance, action: "upsert" | "delete"): Promise<void> {
  try {
    const { queueRecordChange } = await import("@/lib/integrations/queue");
    await queueRecordChange(record, action);
  } catch (err) {
    console.warn("Integration queue failed for", record.id, err);
  }
}

/** After a delete: bills the record allocated to, and statistics fed by its type. */
export async function afterRecordDelete(deleted: RecordInstance): Promise<void> {
  for (const t of allocationTargets(deleted)) {
    try {
      await refreshAllocationTarget(t.id);
    } catch (err) {
      console.warn("Allocation refresh failed for", t.id, err);
    }
  }
  await refreshAfterRecordWrite(deleted.type_api_name, deleted.id);
  await queueForIntegrations(deleted, "delete");
}
