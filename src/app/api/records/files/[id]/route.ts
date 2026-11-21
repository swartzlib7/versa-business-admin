import fs from "node:fs";
import { NextResponse } from "next/server";
import { getSessionFromRequest, isAdmin, isAuthenticated } from "@/lib/auth";
import { contentDisposition, deleteRecordFile, recordFile } from "@/lib/records/record-files";

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
  const file = recordFile((await context.params).id);
  if (!file) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "File not found." } }, { status: 404 });
  }
  const download = new URL(request.url).searchParams.get("download") === "1";
  return new NextResponse(new Uint8Array(fs.readFileSync(file.path)), {
    headers: {
      "Content-Type": file.mime,
      "Content-Length": String(fs.statSync(file.path).size),
      "Content-Disposition": contentDisposition(file.name, file.inline && !download),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=3600",
    },
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
  deleteRecordFile((await context.params).id);
  return NextResponse.json({ data: { deleted: true } });
}
