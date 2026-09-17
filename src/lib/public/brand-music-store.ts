import fs from "fs";
import path from "path";
import { BRAND_MUSIC_HREF, MUSIC_MAX_BYTES } from "@/lib/public/brand-music";
import { SEED_BRAND_MUSIC_FILE, SEED_BRAND_MUSIC_NAME } from "@/lib/public/brand-seed";

const FILE_PATH = path.join(process.cwd(), ".data", "brand-music");
const META_PATH = path.join(process.cwd(), ".data", "brand-music.meta.json");
const SEED_PATH = path.join(process.cwd(), "public", "seed", SEED_BRAND_MUSIC_FILE);

const ALLOWED_MIME = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/ogg",
  "audio/mp4",
  "audio/aac",
  "audio/webm",
  "audio/x-m4a",
  "audio/m4a",
]);

const EXT_MIME: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".webm": "audio/webm",
};

export type BrandMusicMeta = {
  mime: string;
  name: string;
};

export function isAllowedMusicFile(mime: string, name: string): boolean {
  if (ALLOWED_MIME.has(mime.toLowerCase())) return true;
  const ext = path.extname(name).toLowerCase();
  return Boolean(EXT_MIME[ext]);
}

export function resolveMusicMime(mime: string, name: string): string {
  const lower = mime.toLowerCase();
  if (ALLOWED_MIME.has(lower)) return lower === "audio/mp3" ? "audio/mpeg" : mime;
  return EXT_MIME[path.extname(name).toLowerCase()] ?? "audio/mpeg";
}

export function assertMusicSize(bytes: number): boolean {
  return bytes > 0 && bytes <= MUSIC_MAX_BYTES;
}

function readOperatorBrandMusic(): { bytes: Buffer; meta: BrandMusicMeta } | null {
  try {
    if (!fs.existsSync(FILE_PATH)) return null;
    const bytes = fs.readFileSync(FILE_PATH);
    if (!bytes.length) return null;
    let meta: BrandMusicMeta = { mime: "audio/mpeg", name: "brand-music" };
    if (fs.existsSync(META_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(META_PATH, "utf8")) as Partial<BrandMusicMeta>;
      if (typeof parsed.mime === "string" && parsed.mime) meta.mime = parsed.mime;
      if (typeof parsed.name === "string" && parsed.name) meta.name = parsed.name;
    }
    return { bytes, meta };
  } catch {
    return null;
  }
}

function readSeedBrandMusic(): { bytes: Buffer; meta: BrandMusicMeta } | null {
  try {
    if (!fs.existsSync(SEED_PATH)) return null;
    const bytes = fs.readFileSync(SEED_PATH);
    if (!bytes.length) return null;
    return { bytes, meta: { mime: "audio/mpeg", name: SEED_BRAND_MUSIC_NAME } };
  } catch {
    return null;
  }
}

export function hasOperatorBrandMusic(): boolean {
  return readOperatorBrandMusic() != null;
}

export function readBrandMusic(): { bytes: Buffer; meta: BrandMusicMeta } | null {
  return readOperatorBrandMusic() ?? readSeedBrandMusic();
}

export function presentBrandMusic(fixture: {
  brand_music_url?: string | null;
  brand_music_name?: string | null;
}): {
  brand_music_url: string | null;
  brand_music_name: string | null;
  brand_music_is_seed: boolean;
} {
  const music = readBrandMusic();
  if (!music) {
    return { brand_music_url: null, brand_music_name: null, brand_music_is_seed: false };
  }
  return {
    brand_music_url:
      typeof fixture.brand_music_url === "string" && fixture.brand_music_url
        ? fixture.brand_music_url
        : BRAND_MUSIC_HREF,
    brand_music_name: music.meta.name,
    brand_music_is_seed: !hasOperatorBrandMusic(),
  };
}

export function writeBrandMusic(bytes: Buffer, meta: BrandMusicMeta): void {
  fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
  fs.writeFileSync(FILE_PATH, bytes);
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2));
}

export function clearBrandMusic(): void {
  try {
    if (fs.existsSync(FILE_PATH)) fs.unlinkSync(FILE_PATH);
    if (fs.existsSync(META_PATH)) fs.unlinkSync(META_PATH);
  } catch {
    /* ignore */
  }
}
