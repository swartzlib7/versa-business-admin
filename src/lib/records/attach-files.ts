/**
 * Files on records and organizations (1.0.23).
 *
 * - `checkAttachmentFields`: every save of an Attachments field (record pipeline, organization
 *   create and update) keeps only files stored on this install, at most 10.
 * - `attachFiles` / `detachFile`: POST /api/{records|organizations}/<id>/files and
 *   DELETE …/files/<file id>. The field is the one named (`field`), or the type's only
 *   Attachments field. Records save through the record pipeline like any other edit.
 */
import { adapter } from "@/lib/data/adapter";
import { listFieldDefinitions, type FieldDefinition } from "@/lib/fixtures/catalog";
import { getInstance, updateInstance, type RecordInstance } from "@/lib/fixtures/record-instances";
import { getRecordType } from "@/lib/fixtures/record-types";
import { afterRecordWrite, objectFor, prepareRecordWrite } from "@/lib/records/pipeline";
import { RECORD_FILE_MAX, parseRecordFiles, type RecordFileRef } from "@/lib/records/record-file-refs";
import { checkAttachmentFields, deleteRecordFile, saveRecordFile } from "@/lib/records/record-files";
import type { Organization } from "@/lib/data/types";

type Fail = { ok: false; status: number; code: string; message: string };
const fail = (status: number, code: string, message: string): Fail => ({ ok: false, status, code, message });

function attachmentFieldsOf(objectApiName: string): FieldDefinition[] {
  return listFieldDefinitions(objectApiName).filter((f) => f.data_type === "attachments");
}
/** Something that holds Attachments fields: a record or an organization. */
type Holder = {
  label: string;
  fields: FieldDefinition[];
  value: (field: string) => string;
  save: (field: string, refs: RecordFileRef[]) => Promise<{ ok: true; saved: RecordInstance | Organization } | Fail>;
};

async function recordHolder(id: string, userId?: string | null): Promise<Holder | null> {
  const current = (adapter.getRecord ? await adapter.getRecord(id) : getInstance(id)) ?? null;
  if (!current) return null;
  return {
    label: getRecordType(current.type_api_name)?.label ?? current.type_api_name,
    fields: attachmentFieldsOf(objectFor(current.type_api_name)),
    value: (field) => String(current.data?.[field] ?? ""),
    save: async (field, refs) => {
      const prepared = await prepareRecordWrite({
        typeApiName: current.type_api_name,
        data: {
          ...(current.data ?? {}),
          [field]: refs.length ? JSON.stringify(refs) : "",
          ...(userId ? { last_modified_by: String(userId) } : {}),
          updated_at: new Date().toISOString(),
        },
        current,
      });
      if (!prepared.ok) return fail(400, prepared.code, prepared.message);
      const result = adapter.updateRecord
        ? await adapter.updateRecord(current.id, { data: prepared.data })
        : updateInstance(current.id, { data: prepared.data });
      if (!result.ok) return fail(400, result.code, result.message);
      await afterRecordWrite(result.instance, current);
      return { ok: true, saved: result.instance };
    },
  };
}

async function organizationHolder(id: string): Promise<Holder | null> {
  const current = adapter.getOrganization ? await adapter.getOrganization(id) : null;
  if (!current || !adapter.updateOrganization) return null;
  return {
    label: "Organization",
    fields: attachmentFieldsOf("organization"),
    value: (field) => String(current.data?.[field] ?? ""),
    save: async (field, refs) => {
      const data: Record<string, unknown> = { [field]: refs.length ? JSON.stringify(refs) : "" };
      const checked = checkAttachmentFields("organization", data, current.data);
      if (!checked.ok) return fail(400, "VALIDATION_ERROR", checked.message);
      try {
        const saved = await adapter.updateOrganization!(id, { data });
        return saved ? { ok: true, saved } : fail(404, "NOT_FOUND", `Organization '${id}' not found.`);
      } catch (err) {
        return fail(400, "VALIDATION_ERROR", err instanceof Error ? err.message.replace(/^VALIDATION:\s*/, "") : String(err));
      }
    },
  };
}

export type Target = { kind: "record" | "organization"; id: string; userId?: string | null };

async function holderFor(target: Target): Promise<Holder | Fail> {
  const holder = target.kind === "record" ? await recordHolder(target.id, target.userId) : await organizationHolder(target.id);
  const noun = target.kind === "record" ? "Record" : "Organization";
  return holder ?? fail(404, "NOT_FOUND", `${noun} '${target.id}' not found.`);
}

function pickField(holder: Holder, requested?: string | null): { ok: true; field: FieldDefinition } | Fail {
  const { label, fields } = holder;
  if (!fields.length) {
    return fail(400, "NO_ATTACHMENTS_FIELD", `${label} records have no Attachments field. An admin can add one in Records Editor → ${label} → Fields (type Attachments).`);
  }
  const name = requested?.trim();
  if (name) {
    const field = fields.find((f) => f.api_name === name);
    if (field) return { ok: true, field };
    return fail(400, "UNKNOWN_FIELD", `${label} has no Attachments field "${name}". Its Attachments fields: ${fields.map((f) => f.api_name).join(", ")}.`);
  }
  if (fields.length > 1) {
    return fail(400, "FIELD_REQUIRED", `${label} has more than one Attachments field; send "field": one of ${fields.map((f) => f.api_name).join(", ")}.`);
  }
  return { ok: true, field: fields[0] };
}

export type AttachResult = { ok: true; saved: RecordInstance | Organization; field: string; files: RecordFileRef[] } | Fail;

/** Store the files and add them to the Attachments field. Nothing is stored if any file is refused. */
export async function attachFiles(target: Target, files: File[], requestedField: string | null): Promise<AttachResult> {
  const holder = await holderFor(target);
  if ("ok" in holder) return holder;
  const picked = pickField(holder, requestedField);
  if (!picked.ok) return picked;
  const { field } = picked;
  if (!files.length) return fail(400, "INVALID_FILE", 'Send one or more files in the multipart field "file".');
  const existing = parseRecordFiles(holder.value(field.api_name));
  if (existing.length + files.length > RECORD_FILE_MAX) {
    return fail(400, "TOO_MANY_FILES", `${field.label} holds up to ${RECORD_FILE_MAX} files; it has ${existing.length} and this adds ${files.length}.`);
  }
  const added: RecordFileRef[] = [];
  try {
    for (const file of files) added.push(await saveRecordFile(file));
  } catch (err) {
    for (const ref of added) deleteRecordFile(ref.id);
    return fail(400, "INVALID_FILE", err instanceof Error ? err.message : "Could not save the file.");
  }
  const saved = await holder.save(field.api_name, [...existing, ...added]);
  if (!saved.ok) {
    for (const ref of added) deleteRecordFile(ref.id);
    return saved;
  }
  return { ok: true, saved: saved.saved, field: field.api_name, files: added };
}

/**
 * Take one file off (whichever Attachments field holds it). The stored file stays, as when a
 * person removes it on the form (a cloned record may share it), unless `deleteFile`.
 */
export async function detachFile(target: Target, fileId: string, deleteFile: boolean): Promise<AttachResult> {
  const holder = await holderFor(target);
  if ("ok" in holder) return holder;
  for (const field of holder.fields) {
    const refs = parseRecordFiles(holder.value(field.api_name));
    const removed = refs.find((ref) => ref.id === fileId);
    if (!removed) continue;
    const saved = await holder.save(field.api_name, refs.filter((ref) => ref.id !== fileId));
    if (!saved.ok) return saved;
    if (deleteFile) deleteRecordFile(fileId);
    return { ok: true, saved: saved.saved, field: field.api_name, files: [removed] };
  }
  return fail(404, "NOT_ATTACHED", `File ${fileId} is not attached here.`);
}
