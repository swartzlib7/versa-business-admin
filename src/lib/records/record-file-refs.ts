/** Attachments value stored on a record (1.0.14). No disk access, so forms can import it. */

export const RECORD_FILE_MAX = 10;

export type RecordFileRef = { id: string; name: string; mime: string; size: number };

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseRecordFiles(raw: string): RecordFileRef[] {
  if (!raw.trim()) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const files: RecordFileRef[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = String(row.id ?? "");
    if (!ID.test(id)) continue;
    const size = Number(row.size);
    files.push({
      id,
      name: String(row.name ?? "File").slice(0, 160) || "File",
      mime: String(row.mime ?? "application/octet-stream").slice(0, 120),
      size: Number.isFinite(size) && size >= 0 ? size : 0,
    });
    if (files.length >= RECORD_FILE_MAX) break;
  }
  return files;
}

export function isImageMime(mime: string): boolean {
  return mime === "image/png" || mime === "image/jpeg" || mime === "image/webp" || mime === "image/gif";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
