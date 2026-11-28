/**
 * Printing a record (1.0.27): which templates it can print with, the PDF, and saving the PDF
 * to its Documents & Photos. Used by GET/POST /api/records/<id>/print and
 * GET /api/records/<id>/print-templates.
 */
import { adapter } from "@/lib/data/adapter";
import { getInstance, listInstances, type RecordInstance } from "@/lib/fixtures/record-instances";
import { foldRecordTypeApiName } from "@/lib/catalog/name-aliases";
import { checkLayout, pageSettings, PRINT_TEMPLATE_TYPE, templatesFor, type TemplateRow } from "@/lib/print/template";
import { layoutFieldSets } from "@/lib/print/layout-fields";
import { loadPrintContext } from "@/lib/print/values";
import { renderPdf } from "@/lib/print/render";

type Fail = { ok: false; status: number; code: string; message: string };
const fail = (status: number, code: string, message: string): Fail => ({ ok: false, status, code, message });
const text = (v: unknown) => (v === null || v === undefined ? "" : String(v)).trim();

async function getRecord(id: string): Promise<RecordInstance | null> {
  return adapter.getRecord ? adapter.getRecord(id) : (getInstance(id) ?? null);
}

async function allTemplates(): Promise<TemplateRow[]> {
  const rows = adapter.listRecords ? await adapter.listRecords({ type_api_name: PRINT_TEMPLATE_TYPE }) : listInstances({ type_api_name: PRINT_TEMPLATE_TYPE });
  return rows.map((r) => ({ id: r.id, name: r.name, status: r.status, data: r.data ?? {} }));
}

export type TemplateChoice = { id: string; name: string; matches: boolean; default: boolean };

/** The templates a record can print with, the one to use first. */
export async function printTemplatesFor(recordId: string): Promise<{ ok: true; record: RecordInstance; templates: TemplateChoice[] } | Fail> {
  const record = await getRecord(recordId);
  if (!record) return fail(404, "NOT_FOUND", `Record '${recordId}' not found.`);
  const list = templatesFor(await allTemplates(), foldRecordTypeApiName(record.type_api_name), record);
  // The default is the first that fits; when none fits, the menu still lists them all.
  return { ok: true, record, templates: list.map((t, i) => ({ id: t.id, name: t.name, matches: t.matches, default: i === 0 && t.matches })) };
}

export type Printed = { ok: true; pdf: Buffer; pages: number; filename: string; template: { id: string; name: string } };

/** The record as a PDF, with the template asked for or the first that fits. */
export async function printRecord(recordId: string, templateId?: string | null): Promise<Printed | Fail> {
  const found = await printTemplatesFor(recordId);
  if (!found.ok) return found;
  const { record } = found;
  const templates = await allTemplates();
  const fallback = found.templates.find((t) => t.default);
  const template = templateId ? templates.find((t) => t.id === templateId) : templates.find((t) => t.id === fallback?.id);
  if (!template) {
    if (templateId) return fail(404, "TEMPLATE_NOT_FOUND", `Print template '${templateId}' not found.`);
    if (found.templates.length) {
      return fail(404, "NO_MATCHING_TEMPLATE", `No print template's Use when fits this record. Choose one: ${found.templates.map((t) => `${t.name} (${t.id})`).join(", ")}, with ?template=<id>.`);
    }
    return fail(404, "NO_PRINT_TEMPLATE", `There is no print template for this record type. Add one in Custom Records → Print Templates (Prints: this type).`);
  }
  const type = foldRecordTypeApiName(record.type_api_name);
  if (text(template.data.target_record_type) !== type) {
    return fail(400, "WRONG_TEMPLATE", `"${template.name}" prints ${text(template.data.target_record_type) || "another type"}, not this record's type (${type}).`);
  }
  const sets = layoutFieldSets(type);
  const checked = checkLayout(template.data.layout ?? "", sets.header, sets.lines);
  if (!checked.ok) return fail(400, "PRINT_TEMPLATE_INVALID", `"${template.name}": ${checked.message}`);
  const ctx = await loadPrintContext(record);
  const { pdf, pages } = await renderPdf(checked.layout, pageSettings(template.data), ctx);
  const label = text(record.data?.document_number) || text(record.data?.shipment_number) || record.name || record.id;
  const filename = `${template.name} ${label}`.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120) + ".pdf";
  return { ok: true, pdf, pages, filename, template: { id: template.id, name: template.name } };
}

/** Print and keep the PDF in the record's Documents & Photos. */
export async function savePrintToDocuments(recordId: string, templateId: string | null, userId: string | null) {
  const printed = await printRecord(recordId, templateId);
  if (!printed.ok) return printed;
  const { attachFiles } = await import("@/lib/records/attach-files");
  const file = new File([new Uint8Array(printed.pdf)], printed.filename, { type: "application/pdf" });
  const attached = await attachFiles({ kind: "record", id: recordId, userId }, [file], null);
  if (!attached.ok) return attached;
  return { ok: true as const, file: attached.files[0], field: attached.field, template: printed.template, pages: printed.pages };
}
