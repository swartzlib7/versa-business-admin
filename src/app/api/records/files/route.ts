import { NextResponse } from "next/server";
import { getSessionFromRequest, isAdmin, isAuthenticated } from "@/lib/auth";
import { allowedAttachmentTypes, attachmentMaxBytes, saveRecordFile } from "@/lib/records/record-files";

/** GET: what an attachments field accepts (types and size limit). */
export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 },
    );
  }
  return NextResponse.json({ data: { types: allowedAttachmentTypes(), max_bytes: attachmentMaxBytes() } });
}

/** POST multipart `file`: store one attachment and return its reference. */
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
      { error: { code: "INVALID_FORM", message: "Expected a file upload." } },
      { status: 400 },
    );
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: { code: "INVALID_FILE", message: "Choose a file." } },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json({ data: await saveRecordFile(file) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save the file.";
    return NextResponse.json({ error: { code: "INVALID_FILE", message } }, { status: 400 });
  }
}
