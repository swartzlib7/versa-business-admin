import fs from "node:fs";
import { NextResponse } from "next/server";
import { getSessionFromRequest, isAdmin, isAuthenticated } from "@/lib/auth";
import { deleteRecordImage, recordImageFile } from "@/lib/records/record-images";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 },
    );
  }
  const { id } = await context.params;
  const image = recordImageFile(id);
  if (!image) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Image not found." } },
      { status: 404 },
    );
  }
  const body = fs.readFileSync(image.path);
  return new NextResponse(new Uint8Array(body), {
    headers: { "Content-Type": image.mime, "Cache-Control": "private, max-age=3600" },
  });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
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
  deleteRecordImage((await context.params).id);
  return NextResponse.json({ data: { deleted: true } });
}
