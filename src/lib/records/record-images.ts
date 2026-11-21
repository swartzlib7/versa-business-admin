/**
 * Image files for an image_gallery field. The record stores `{ id, name }` entries.
 * Design: state_zone_erd.md § Open design: Promotion & Marketing posts.
 */
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { RecordImageRef } from "@/lib/records/record-image-refs";
import { uploadsDir } from "@/lib/records/uploads-dir";

export { RECORD_IMAGE_MAX, parseRecordImages, type RecordImageRef } from "@/lib/records/record-image-refs";

export const RECORD_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function isAllowedRecordImage(type: string): boolean {
  return type in EXT;
}

function fileFor(id: string): string | null {
  const dir = uploadsDir("record-images");
  if (!ID.test(id) || !fs.existsSync(dir)) return null;
  const found = fs.readdirSync(dir).find((name) => name.startsWith(`${id}.`));
  return found ? path.join(dir, found) : null;
}

export function recordImageFile(id: string): { path: string; mime: string } | null {
  const file = fileFor(id);
  if (!file) return null;
  const ext = path.extname(file).slice(1);
  const mime = Object.entries(EXT).find(([, value]) => value === ext)?.[0];
  if (!mime) return null;
  return { path: file, mime };
}

export async function saveRecordImage(file: File): Promise<RecordImageRef> {
  if (!isAllowedRecordImage(file.type)) throw new Error("Use a PNG, JPEG, WebP, or GIF.");
  if (file.size > RECORD_IMAGE_MAX_BYTES) throw new Error("Image must be 2 MB or smaller.");
  const id = randomUUID();
  const name = file.name.replace(/[/\\]/g, "").slice(0, 120) || "Image";
  const dir = uploadsDir("record-images");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${id}.${EXT[file.type]}`), Buffer.from(await file.arrayBuffer()));
  return { id, name };
}

export function deleteRecordImage(id: string): void {
  const file = fileFor(id);
  if (file) fs.unlinkSync(file);
}
