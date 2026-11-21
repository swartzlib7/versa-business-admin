/**
 * Where uploaded files live (1.0.14). Default `.data/` in the app folder.
 * Set VBA_UPLOADS_DIR to keep uploads elsewhere, for example a mounted drive
 * or a synced Google Drive / OneDrive folder. Inside it:
 *   record-images/  Image gallery pictures
 *   record-files/   Attachments (any allowed file type)
 * The backup script (`npm run backup`) can include or skip this folder.
 */
import path from "node:path";

export function uploadsRoot(): string {
  const configured = process.env.VBA_UPLOADS_DIR?.trim();
  return configured ? path.resolve(configured) : path.join(process.cwd(), ".data");
}

export function uploadsDir(kind: "record-images" | "record-files"): string {
  return path.join(uploadsRoot(), kind);
}
