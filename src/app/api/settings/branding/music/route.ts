import { NextResponse } from "next/server";
import { getSessionFromRequest, isAuthenticated, isAdmin } from "@/lib/auth";
import { upsertSiteSettingsFixture } from "@/lib/fixtures/site-settings";
import { BRAND_MUSIC_HREF, MUSIC_MAX_BYTES } from "@/lib/public/brand-music";
import {
  assertMusicSize,
  isAllowedMusicFile,
  resolveMusicMime,
  writeBrandMusic,
} from "@/lib/public/brand-music-store";

export async function POST(request: Request) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 },
    );
  }
  if (!isAdmin(session)) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Admin session required." } },
      { status: 403 },
    );
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_FORM", message: "Expected a music file upload." } },
      { status: 400 },
    );
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: { code: "INVALID_MUSIC", message: "Choose an audio file." } },
      { status: 400 },
    );
  }
  if (!assertMusicSize(file.size)) {
    return NextResponse.json(
      {
        error: {
          code: "MUSIC_TOO_LARGE",
          message: `Music must be ${Math.round(MUSIC_MAX_BYTES / (1024 * 1024))} MB or smaller.`,
        },
      },
      { status: 400 },
    );
  }
  if (!isAllowedMusicFile(file.type || "", file.name)) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_MUSIC_TYPE",
          message: "Use MP3, WAV, OGG, or M4A.",
        },
      },
      { status: 400 },
    );
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const mime = resolveMusicMime(file.type || "", file.name);
  const name = file.name.replace(/[/\\]/g, "").slice(0, 120) || "brand-music";
  writeBrandMusic(bytes, { mime, name });
  const settings = upsertSiteSettingsFixture({
    brand_music_url: BRAND_MUSIC_HREF,
    brand_music_name: name,
  });
  return NextResponse.json({
    data: {
      brand_music_url: settings.brand_music_url ?? BRAND_MUSIC_HREF,
      brand_music_name: settings.brand_music_name ?? name,
      brand_music_loop: settings.brand_music_loop !== false,
      brand_music_autoplay: settings.brand_music_autoplay !== false,
    },
  });
}
