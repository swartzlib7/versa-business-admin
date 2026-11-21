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
import { getValueSetByApiName, listValueSetItems } from "@/lib/fixtures/catalog";
import type { RecordFileRef } from "@/lib/records/record-file-refs";
import { uploadsDir } from "@/lib/records/uploads-dir";

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
