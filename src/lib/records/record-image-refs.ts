/** Gallery value stored on a record. No disk access, so forms can import it. */

export const RECORD_IMAGE_MAX = 10;

export type RecordImageRef = { id: string; name: string };

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseRecordImages(raw: string): RecordImageRef[] {
  if (!raw.trim()) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const images: RecordImageRef[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const id = String((item as { id?: unknown }).id ?? "");
    if (!ID.test(id)) continue;
    const name = String((item as { name?: unknown }).name ?? "Image").slice(0, 120);
    images.push({ id, name: name || "Image" });
    if (images.length >= RECORD_IMAGE_MAX) break;
  }
  return images;
}
