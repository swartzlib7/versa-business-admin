import { NextResponse } from "next/server";
import { readBrandMusic } from "@/lib/public/brand-music-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const music = readBrandMusic();
  if (!music) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "No brand music is configured." } },
      { status: 404 },
    );
  }
  const body = new Uint8Array(music.bytes);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": music.meta.mime || "audio/mpeg",
      "Content-Length": String(music.bytes.length),
      "Cache-Control": "private, max-age=60",
      "Content-Disposition": `inline; filename="${music.meta.name.replace(/"/g, "")}"`,
    },
  });
}
