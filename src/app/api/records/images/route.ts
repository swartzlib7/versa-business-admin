import { NextResponse } from "next/server";
import { getSessionFromRequest, isAdmin, isAuthenticated } from "@/lib/auth";
import { saveRecordImage } from "@/lib/records/record-images";

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
      { error: { code: "INVALID_FORM", message: "Expected an image upload." } },
      { status: 400 },
    );
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: { code: "INVALID_IMAGE", message: "Choose an image file." } },
      { status: 400 },
    );
  }
  try {
    const image = await saveRecordImage(file);
    return NextResponse.json({ data: image });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save the image.";
    return NextResponse.json({ error: { code: "INVALID_IMAGE", message } }, { status: 400 });
  }
}
