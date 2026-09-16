import { NextResponse } from "next/server";
import { getSessionFromRequest, isAuthenticated, isAdmin } from "@/lib/auth";
import {
  deleteSampleData,
  insertSampleData,
  sampleDataStatus,
} from "@/lib/sample-data/apply";

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 },
    );
  }
  return NextResponse.json({ data: await sampleDataStatus() });
}

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
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Request body must be JSON." } },
      { status: 400 },
    );
  }
  const action = body.action;
  if (action !== "insert" && action !== "delete") {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_ACTION",
          message: "action must be insert or delete.",
        },
      },
      { status: 400 },
    );
  }
  try {
    const data =
      action === "insert" ? await insertSampleData() : await deleteSampleData();
    return NextResponse.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sample data failed.";
    return NextResponse.json(
      { error: { code: "SAMPLE_DATA_FAILED", message } },
      { status: 400 },
    );
  }
}
