/**
 * Shipped print templates (1.0.27, state_printing.md §4): Invoice, Estimate, Quote and Packing
 * Slip. On every start, a template missing on the install is added, and one still exactly as an
 * earlier release shipped it (its content hash equals `shipped_hash`) is brought up to this
 * release's version. A template edited on the install is kept and named in the log. Status is
 * never changed: archive a shipped template to stop offering it (deleting it brings it back).
 */
import { adapter } from "@/lib/data/adapter";
import { listInstances, type RecordInstance } from "@/lib/fixtures/record-instances";
import { PRINT_TEMPLATE_TYPE } from "@/lib/print/template";
import { PRINT_PACK, contentHash, packData } from "@/lib/print/pack-templates";

const text = (v: unknown) => (v === null || v === undefined ? "" : String(v)).trim();

// ── Install and update ─────────────────────────────────────────────────────

async function listTemplates(): Promise<RecordInstance[]> {
  return adapter.listRecords ? adapter.listRecords({ type_api_name: PRINT_TEMPLATE_TYPE }) : listInstances({ type_api_name: PRINT_TEMPLATE_TYPE });
}

/** Boot step: add missing shipped templates, update unedited ones. Once per process. */
export async function ensurePrintTemplates(): Promise<{ added: string[]; updated: string[]; kept: string[] }> {
  const g = globalThis as Record<string, unknown>;
  if (g.__vbaPrintPackDone__) return { added: [], updated: [], kept: [] };
  g.__vbaPrintPackDone__ = true;
  if (!adapter.createRecord || !adapter.updateRecord) return { added: [], updated: [], kept: [] };
  const { prepareRecordWrite } = await import("@/lib/records/pipeline");
  const existing = await listTemplates();
  const added: string[] = [];
  const updated: string[] = [];
  const kept: string[] = [];
  for (const t of PRINT_PACK) {
    const want = packData(t);
    const hash = contentHash(want);
    const row = existing.find((r) => text(r.data?.shipped_key) === t.key);
    if (!row) {
      const data = { ...want, status: "active", shipped_key: t.key, shipped_hash: hash, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      const prepared = await prepareRecordWrite({ typeApiName: PRINT_TEMPLATE_TYPE, data, current: null, checkFields: false });
      if (!prepared.ok) {
        console.error(`Print templates: could not add ${t.name}: ${prepared.message}`);
        continue;
      }
      const made = await adapter.createRecord({
        type_api_name: PRINT_TEMPLATE_TYPE,
        parent_kind: "environment",
        parent_api_name: "custom",
        name: t.name,
        status: "active",
        data: prepared.data,
      });
      if (made.ok) added.push(t.name);
      else console.error(`Print templates: could not add ${t.name}: ${made.message}`);
      continue;
    }
    const now = contentHash(row.data ?? {});
    if (now === hash) continue;
    if (now !== text(row.data?.shipped_hash)) {
      kept.push(row.name || t.name);
      continue;
    }
    const data = { ...(row.data ?? {}), ...want, shipped_hash: hash, updated_at: new Date().toISOString() };
    const prepared = await prepareRecordWrite({ typeApiName: PRINT_TEMPLATE_TYPE, data, current: row, checkFields: false });
    if (!prepared.ok) {
      console.error(`Print templates: could not update ${t.name}: ${prepared.message}`);
      continue;
    }
    const result = await adapter.updateRecord(row.id, { name: t.name, data: prepared.data });
    if (result.ok) updated.push(t.name);
  }
  if (added.length) console.log(`Print templates: added ${added.join(", ")}.`);
  if (updated.length) console.log(`Print templates: updated ${updated.join(", ")}.`);
  if (kept.length) console.log(`Print templates: ${kept.join(", ")} edited on this install; left as is.`);
  return { added, updated, kept };
}
