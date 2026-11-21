/**
 * "Linked from" (1.0.15, state_records_pipeline.md): every record whose lookup
 * field points at a given record, grouped by record type and field. Reads
 * through the records adapter (no new index yet; a SQL query with a GIN index
 * can replace the scan when lists grow).
 */
import "@/lib/catalog/install-durable";
import { adapter } from "@/lib/data/adapter";
import { listAllFieldDefinitions } from "@/lib/fixtures/catalog";
import { getInstance, listInstances, type RecordInstance } from "@/lib/fixtures/record-instances";
import { listRecordTypes } from "@/lib/fixtures/record-types";
import { parseIdList } from "@/lib/records/list-values";
import { objectFor } from "@/lib/records/pipeline";

export type LinkedRecord = {
  id: string;
  name: string;
  status: string;
  /** Header Amount when the type has one (e.g. a transaction total). */
  amount: string;
  /** For a lines field: how many lines point here. */
  lines: number;
  /** Document kind when the type has one (estimate, invoice, bill…); totals are per kind. */
  kind: string;
};

export type LinkedGroup = {
  type_api_name: string;
  type_label: string;
  field_api_name: string;
  field_label: string;
  placement: "header" | "lines";
  records: LinkedRecord[];
  /** Total of Amount, one entry per document kind ("" when the type has no kinds). */
  totals: Array<{ kind: string; amount: string }>;
};

const points = (raw: unknown, id: string, multi: boolean) =>
  multi ? parseIdList(String(raw ?? "")).includes(id) : String(raw ?? "").trim() === id;

export async function linkedFrom(id: string): Promise<{ record: RecordInstance; groups: LinkedGroup[] } | null> {
  const record = adapter.getRecord ? await adapter.getRecord(id) : (getInstance(id) ?? null);
  if (!record) return null;
  const target = objectFor(record.type_api_name);
  const fields = listAllFieldDefinitions().filter(
    (f) => (f.data_type === "lookup" || f.data_type === "multi_lookup") && f.lookup_object_api_name === target,
  );
  const types = listRecordTypes();
  const groups: LinkedGroup[] = [];
  const cache = new Map<string, RecordInstance[]>();
  for (const f of fields) {
    const type = types.find((t) => t.object_api_name === f.object_api_name || t.api_name === f.object_api_name);
    const typeApi = type?.api_name ?? f.object_api_name;
    if (!cache.has(typeApi)) {
      cache.set(
        typeApi,
        adapter.listRecords ? await adapter.listRecords({ type_api_name: typeApi }) : listInstances({ type_api_name: typeApi }),
      );
    }
    const multi = f.data_type === "multi_lookup";
    const onLines = f.zone_role === "list";
    const records: LinkedRecord[] = [];
    for (const r of cache.get(typeApi) ?? []) {
      if (r.id === id && !onLines) continue;
      const lines = onLines ? (r.lines ?? []).filter((line) => points(line.data?.[f.api_name], id, multi)).length : 0;
      if (onLines ? lines === 0 : !points(r.data?.[f.api_name], id, multi)) continue;
      records.push({
        id: r.id,
        name: r.name || String(r.data?.name ?? r.id),
        status: String(r.data?.status ?? r.status ?? ""),
        amount: String(r.data?.amount ?? ""),
        lines,
        kind: String(r.data?.document_kind ?? ""),
      });
    }
    if (!records.length) continue;
    // Adding an estimate to an invoice means nothing: total each kind on its own.
    const byKind = new Map<string, number>();
    for (const r of records) {
      if (r.amount === "") continue;
      byKind.set(r.kind, (byKind.get(r.kind) ?? 0) + (Number(r.amount) || 0));
    }
    groups.push({
      type_api_name: typeApi,
      type_label: type?.label ?? typeApi,
      field_api_name: f.api_name,
      field_label: f.label,
      placement: onLines ? "lines" : "header",
      records,
      totals: [...byKind].map(([kind, amount]) => ({ kind, amount: String(Math.round(amount * 100) / 100) })),
    });
  }
  return { record, groups };
}
