/**
 * Template maker support (1.0.28, state_printing.md §6): a type's templates with where each came
 * from (Shipped, Edited, Own), and Reset to shipped. Duplicate is Clone (record-actions.ts):
 * the copy loses `shipped_key`, so it is Own.
 */
import { adapter } from "@/lib/data/adapter";
import { getInstance, listInstances, type RecordInstance } from "@/lib/fixtures/record-instances";
import { foldRecordTypeApiName } from "@/lib/catalog/name-aliases";
import { PRINT_TEMPLATE_TYPE } from "@/lib/print/template";
import { PRINT_PACK, contentHash, originOf, packData, type Origin } from "@/lib/print/pack-templates";

const text = (v: unknown) => (v === null || v === undefined ? "" : String(v)).trim();


export type TemplateListItem = {
  id: string;
  name: string;
  status: string;
  data: Record<string, string>;
  origin: Origin;
  /** Reset to shipped is possible: a shipped template that was edited and this release still ships. */
  can_reset: boolean;
};

async function allTemplates(): Promise<RecordInstance[]> {
  return adapter.listRecords ? adapter.listRecords({ type_api_name: PRINT_TEMPLATE_TYPE }) : listInstances({ type_api_name: PRINT_TEMPLATE_TYPE });
}

/** Templates for one record type (or all), by Order then name. */
export async function listTemplates(type?: string | null): Promise<TemplateListItem[]> {
  const want = type ? foldRecordTypeApiName(type) : "";
  return (await allTemplates())
    .filter((r) => !want || text(r.data?.target_record_type) === want)
    .map((r) => {
      const data = r.data ?? {};
      const origin = originOf(data);
      return {
        id: r.id,
        name: r.name,
        status: text(data.status) || r.status,
        data,
        origin,
        can_reset: origin === "edited" && PRINT_PACK.some((t) => t.key === text(data.shipped_key)),
      };
    })
    .sort((a, b) => (Number(a.data.sort_order) || 1000) - (Number(b.data.sort_order) || 1000) || a.name.localeCompare(b.name));
}

type Fail = { ok: false; status: number; code: string; message: string };

/** Put a shipped template back as this release ships it (status and notes are kept). */
export async function resetToShipped(id: string, userId: string | null): Promise<{ ok: true; template: RecordInstance } | Fail> {
  const row = adapter.getRecord ? await adapter.getRecord(id) : getInstance(id) ?? null;
  if (!row || foldRecordTypeApiName(row.type_api_name) !== PRINT_TEMPLATE_TYPE) {
    return { ok: false, status: 404, code: "NOT_FOUND", message: `Print template '${id}' not found.` };
  }
  const pack = PRINT_PACK.find((t) => t.key === text(row.data?.shipped_key));
  if (!pack) {
    return { ok: false, status: 409, code: "NOT_SHIPPED", message: `"${row.name}" was made on this install; there is no shipped version to go back to.` };
  }
  const want = packData(pack);
  const data = {
    ...(row.data ?? {}),
    ...want,
    shipped_hash: contentHash(want),
    updated_at: new Date().toISOString(),
    ...(userId ? { last_modified_by: userId } : {}),
  };
  const { prepareRecordWrite, afterRecordWrite } = await import("@/lib/records/pipeline");
  const prepared = await prepareRecordWrite({ typeApiName: PRINT_TEMPLATE_TYPE, data, current: row, checkFields: false });
  if (!prepared.ok) return { ok: false, status: 400, code: prepared.code, message: prepared.message };
  const result = adapter.updateRecord ? await adapter.updateRecord(row.id, { name: pack.name, data: prepared.data }) : null;
  if (!result || !result.ok) return { ok: false, status: 400, code: "UPDATE_FAILED", message: result && !result.ok ? result.message : "Could not save." };
  await afterRecordWrite(result.instance, row);
  return { ok: true, template: result.instance };
}
