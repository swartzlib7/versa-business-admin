/**
 * Record actions (1.0.15, state_records_pipeline.md § Actions): Clone (any
 * record type) and Convert to invoice (Transactions). Both create the new
 * record through the save pipeline, like any other write.
 */
import { randomUUID } from "node:crypto";
import { adapter } from "@/lib/data/adapter";
import { listFieldDefinitions } from "@/lib/fixtures/catalog";
import { createInstance, getInstance, updateInstance, type RecordInstance } from "@/lib/fixtures/record-instances";
import { foldRecordTypeApiName } from "@/lib/catalog/name-aliases";
import { afterRecordWrite, isIntegrated, objectFor, prepareRecordWrite, type WriteLine } from "@/lib/records/pipeline";

export type ActionResult =
  | { ok: true; instance: RecordInstance }
  | { ok: false; status: number; code: string; message: string };

const AUDIT = ["id", "external_id", "created_by", "created_at", "last_modified_by", "updated_at"];

async function getRecord(id: string): Promise<RecordInstance | null> {
  return adapter.getRecord ? adapter.getRecord(id) : (getInstance(id) ?? null);
}

/** Header and lines copied for a new record: new line ids, links between lines kept. */
function copyContent(source: RecordInstance): { data: Record<string, string>; lines: WriteLine[] } {
  const fields = listFieldDefinitions(objectFor(source.type_api_name));
  const drop = new Set([
    ...AUDIT,
    ...fields.filter((f) => f.read_only).map((f) => f.api_name),
  ]);
  const data: Record<string, string> = {};
  for (const [k, v] of Object.entries(source.data ?? {})) if (!drop.has(k)) data[k] = String(v ?? "");
  // Lines get new ids; a line that points at another line (e.g. a parent task) follows the copy.
  const idMap = new Map((source.lines ?? []).map((line) => [line.id, randomUUID()]));
  // A copy does not take another share of a bill: allocation links start empty.
  const allocationLinks = fields.filter((f) => f.allocation).map((f) => f.api_name);
  const lines: WriteLine[] = (source.lines ?? []).map((line) => {
    const lineData: Record<string, string> = {};
    for (const [k, v] of Object.entries(line.data ?? {})) {
      const text = String(v ?? "");
      lineData[k] = allocationLinks.includes(k) ? "" : (idMap.get(text) ?? text);
    }
    return { id: idMap.get(line.id), line_group: line.line_group, data: lineData };
  });
  return { data, lines };
}

async function createThroughPipeline(
  source: RecordInstance,
  name: string,
  status: string,
  data: Record<string, string>,
  lines: WriteLine[],
  userId: string | null,
): Promise<ActionResult> {
  const stamped = {
    ...data,
    ...(userId ? { created_by: userId, last_modified_by: userId } : {}),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const prepared = await prepareRecordWrite({ typeApiName: source.type_api_name, data: stamped, lines, current: null });
  if (!prepared.ok) return { ok: false, status: 400, code: prepared.code, message: prepared.message };
  const input = {
    type_api_name: source.type_api_name,
    parent_kind: source.parent_kind,
    parent_api_name: source.parent_api_name,
    name,
    status,
    data: prepared.data,
    lines: prepared.lines ?? lines,
    ...(source.org_id ? { org_id: source.org_id } : {}),
  };
  const result = adapter.createRecord
    ? await adapter.createRecord(input, { createdBy: userId })
    : createInstance(input);
  if (!result.ok) return { ok: false, status: 400, code: result.code, message: result.message };
  await afterRecordWrite(result.instance, null);
  return { ok: true, instance: result.instance };
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Clone any record: "Copy of …", new id, audit reset, External ID cleared. */
export async function cloneRecord(id: string, userId: string | null): Promise<ActionResult> {
  const source = await getRecord(id);
  if (!source) return { ok: false, status: 404, code: "NOT_FOUND", message: `Record '${id}' not found.` };
  const { data, lines } = copyContent(source);
  let status = source.status;
  if (foldRecordTypeApiName(source.type_api_name) === "treasury_transaction") {
    // A copied document starts as a draft of its own.
    for (const k of ["document_number", "paid_date", "converted_from_id"]) delete data[k];
    data.status = "draft";
    status = "draft";
  }
  const name = `Copy of ${source.name || "record"}`;
  data.name = name;
  return createThroughPipeline(source, name, status, data, lines, userId);
}

/** Quote or estimate -> invoice. Not for integrated records (Wave owns those). */
export async function convertToInvoice(id: string, userId: string | null): Promise<ActionResult> {
  const source = await getRecord(id);
  if (!source) return { ok: false, status: 404, code: "NOT_FOUND", message: `Record '${id}' not found.` };
  if (foldRecordTypeApiName(source.type_api_name) !== "treasury_transaction") {
    return { ok: false, status: 400, code: "NOT_A_TRANSACTION", message: "Only Treasury transactions convert to an invoice." };
  }
  const kind = String(source.data?.document_kind ?? "");
  if (kind !== "quote" && kind !== "estimate") {
    return { ok: false, status: 400, code: "NOT_CONVERTIBLE", message: "Only a quote or an estimate converts to an invoice." };
  }
  if (isIntegrated(source.data)) {
    return {
      ok: false,
      status: 409,
      code: "INTEGRATED",
      message: "This record came from an integration (it has an External ID). Convert it there, not in VBA.",
    };
  }
  if (String(source.data?.status ?? "") === "converted") {
    return { ok: false, status: 409, code: "ALREADY_CONVERTED", message: "This estimate is already converted to an invoice." };
  }
  const { data, lines } = copyContent(source);
  for (const k of ["document_number", "paid_date", "expiry_date", "due_date"]) delete data[k];
  // "Bracket estimate" -> "Bracket invoice"; otherwise "<name> (invoice)".
  const invoiceName = /\b(estimate|quote)\b/i.test(source.name)
    ? source.name.replace(/\b(estimate|quote)\b/i, (w) => (w[0] === w[0].toUpperCase() ? "Invoice" : "invoice"))
    : `${source.name} (invoice)`;
  Object.assign(data, {
    document_kind: "invoice",
    status: "draft",
    transaction_date: today(),
    converted_from_id: source.id,
    name: invoiceName,
  });
  const created = await createThroughPipeline(source, invoiceName, "draft", data, lines, userId);
  if (!created.ok) return created;
  const marked = { ...(source.data ?? {}), status: "converted", updated_at: new Date().toISOString(), ...(userId ? { last_modified_by: userId } : {}) };
  if (adapter.updateRecord) await adapter.updateRecord(source.id, { status: "converted", data: marked });
  else updateInstance(source.id, { status: "converted", data: marked });
  return created;
}
