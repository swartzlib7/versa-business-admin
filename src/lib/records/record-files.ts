/**
 * Attachment files for an `attachments` field (1.0.14). The record stores
 * `{ id, name, mime, size }` entries (record-file-refs.ts). Each file is kept
 * as `<id>.bin` with a `<id>.json` sidecar (name, type, size) in
 * `<uploads>/record-files/` (uploads-dir.ts).
 *
 * Allowed types: the active items of the `file_mime` value set (Records
 * Editor → Value sets), so an admin can add a type without a code change.
 * HTML and SVG are never served, even if added there, because a browser would
 * run them as a page.
 */
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getValueSetByApiName, listFieldDefinitions, listValueSetItems } from "@/lib/fixtures/catalog";
import type { RecordFileRef } from "@/lib/records/record-file-refs";
import { uploadsDir } from "@/lib/records/uploads-dir";

import { RECORD_FILE_MAX, parseRecordFiles } from "@/lib/records/record-file-refs";

export { RECORD_FILE_MAX, parseRecordFiles, type RecordFileRef } from "@/lib/records/record-file-refs";

/** Per-file limit. VBA_ATTACHMENT_MAX_MB overrides the default 20 MB. */
export function attachmentMaxBytes(): number {
  const mb = Number(process.env.VBA_ATTACHMENT_MAX_MB);
  return (Number.isFinite(mb) && mb > 0 ? mb : 20) * 1024 * 1024;
}

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Browsers sometimes send no type (e.g. .heic, .csv on some systems). */
const BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  txt: "text/plain",
  csv: "text/csv",
  json: "application/json",
  zip: "application/zip",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

const NEVER = new Set(["text/html", "application/xhtml+xml", "image/svg+xml", "text/javascript", "application/javascript"]);

/** Shown in the browser; everything else downloads. */
const INLINE = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp", "image/gif", "text/plain"]);

export function allowedAttachmentTypes(): Array<{ mime: string; label: string }> {
  const vs = getValueSetByApiName("file_mime");
  const items = vs ? listValueSetItems(vs.id).filter((item) => item.active !== false) : [];
  return items
    .map((item) => ({ mime: item.api_value.trim().toLowerCase(), label: item.label }))
    .filter((item) => item.mime && !NEVER.has(item.mime));
}

export function resolveMime(file: { type: string; name: string }): string {
  const given = (file.type || "").trim().toLowerCase();
  if (given && given !== "application/octet-stream") return given;
  const ext = path.extname(file.name).slice(1).toLowerCase();
  return BY_EXTENSION[ext] ?? given;
}

export async function saveRecordFile(file: File): Promise<RecordFileRef> {
  const mime = resolveMime(file);
  const allowed = allowedAttachmentTypes();
  if (!allowed.some((item) => item.mime === mime)) {
    const names = allowed.map((item) => item.label).join(", ");
    throw new Error(`That file type is not allowed. Allowed: ${names || "none (check the file_mime value set)"}.`);
  }
  const max = attachmentMaxBytes();
  if (file.size > max) throw new Error(`A file must be ${Math.round(max / (1024 * 1024))} MB or smaller.`);
  const id = randomUUID();
  const name = file.name.replace(/[/\\\u0000-\u001f]/g, "").slice(0, 160) || "File";
  const dir = uploadsDir("record-files");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${id}.bin`), Buffer.from(await file.arrayBuffer()));
  const ref: RecordFileRef = { id, name, mime, size: file.size };
  fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify({ ...ref, saved_at: new Date().toISOString() }));
  return ref;
}

export function recordFile(id: string): (RecordFileRef & { path: string; inline: boolean }) | null {
  if (!ID.test(id)) return null;
  const dir = uploadsDir("record-files");
  const bin = path.join(dir, `${id}.bin`);
  const meta = path.join(dir, `${id}.json`);
  if (!fs.existsSync(bin) || !fs.existsSync(meta)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(meta, "utf8")) as Partial<RecordFileRef>;
    const mime = String(parsed.mime ?? "application/octet-stream").toLowerCase();
    if (NEVER.has(mime)) return null;
    return {
      id,
      name: String(parsed.name ?? "File"),
      mime,
      size: Number(parsed.size ?? fs.statSync(bin).size),
      path: bin,
      inline: INLINE.has(mime),
    };
  } catch {
    return null;
  }
}

/**
 * 1.0.23: what an Attachments field may hold when it is saved. A JSON list (or nothing) of
 * files stored on this install, at most RECORD_FILE_MAX; each entry is rewritten from the
 * stored file, so name, type and size are always the real ones. Repeats are dropped. An
 * entry the record already had is kept as it was even if its file is gone, so a record with
 * a missing file can still be saved (and the entry removed).
 */
export function checkRecordFiles(
  label: string,
  raw: string,
  already: RecordFileRef[] = [],
): { ok: true; value: string } | { ok: false; message: string } {
  if (!raw.trim()) return { ok: true, value: "" };
  const shape = `${label} takes a JSON list of uploaded files, e.g. [{"id":"<file id>"}]. Upload with POST /api/records/<record id>/files.`;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, message: shape };
  }
  if (!Array.isArray(parsed)) return { ok: false, message: shape };
  const refs: RecordFileRef[] = [];
  for (const item of parsed) {
    const id = String((item as { id?: unknown } | null)?.id ?? "");
    if (!id) return { ok: false, message: shape };
    if (refs.some((ref) => ref.id === id)) continue;
    const file = recordFile(id);
    const kept = file ? null : already.find((ref) => ref.id === id);
    if (kept) {
      refs.push(kept);
      continue;
    }
    if (!file) return { ok: false, message: `${label}: file ${id} is not stored on this install. Upload it first.` };
    refs.push({ id, name: file.name, mime: file.mime, size: file.size });
  }
  if (refs.length > RECORD_FILE_MAX) {
    return { ok: false, message: `${label} holds up to ${RECORD_FILE_MAX} files; this save has ${refs.length}.` };
  }
  return { ok: true, value: refs.length ? JSON.stringify(refs) : "" };
}

/**
 * Check the Attachments fields this save changes. Values are written back as the checked
 * JSON text. A field the save does not send, or sends unchanged, is not checked.
 */
export function checkAttachmentFields(
  objectApiName: string,
  data: Record<string, unknown>,
  current?: Record<string, unknown> | null,
): { ok: true } | { ok: false; message: string } {
  for (const field of listFieldDefinitions(objectApiName).filter((f) => f.data_type === "attachments")) {
    const sent = data[field.api_name];
    if (sent === undefined) continue;
    const next = sent === null ? "" : typeof sent === "string" ? sent : JSON.stringify(sent);
    const before = String(current?.[field.api_name] ?? "");
    if (next === before) continue;
    const checked = checkRecordFiles(field.label, next, parseRecordFiles(before));
    if (!checked.ok) return { ok: false, message: checked.message };
    data[field.api_name] = checked.value;
  }
  return { ok: true };
}

export function deleteRecordFile(id: string): void {
  if (!ID.test(id)) return;
  const dir = uploadsDir("record-files");
  for (const name of [`${id}.bin`, `${id}.json`]) {
    const file = path.join(dir, name);
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
}

/** Content-Disposition with a safe ASCII name and the full UTF-8 name. */
export function contentDisposition(name: string, inline: boolean): string {
  const ascii = name.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `${inline ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}
