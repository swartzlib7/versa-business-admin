import { NextResponse } from "next/server";
import { getSessionFromRequest, isAuthenticated, isAdmin } from "@/lib/auth";
import {
  createRecordType,
  listEditorParents,
  listRecordTypes,
  type ParentKind,
  type RecordStructure,
} from "@/lib/fixtures/record-types";
import { ensureObjectForRecordType } from "@/lib/fixtures/catalog";

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 },
    );
  }
  const { searchParams } = new URL(request.url);
  const parent_kind = searchParams.get("parent_kind") ?? undefined;
  const parent_api_name = searchParams.get("parent_api_name") ?? undefined;
  const include_inactive = searchParams.get("include_inactive") === "1";
  const data = listRecordTypes({
    parent_kind,
    parent_api_name,
    active_only: !include_inactive,
  });
  return NextResponse.json({ data, count: data.length, parents: listEditorParents() });
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
  const result = createRecordType({
    api_name: String(body.api_name || ""),
    label: String(body.label || ""),
    description: body.description != null ? String(body.description) : undefined,
    parent_kind: body.parent_kind as ParentKind,
    parent_api_name: String(body.parent_api_name || ""),
    structure: body.structure as RecordStructure | undefined,
    show_as_tab: body.show_as_tab as boolean | undefined,
    sort_order: body.sort_order != null ? Number(body.sort_order) : undefined,
  });
  if (!result.ok) {
    return NextResponse.json(
      { error: { code: result.code, message: result.message } },
      { status: 400 },
    );
  }
  ensureObjectForRecordType({
    api_name: result.type.api_name,
    label: result.type.label,
    description: result.type.description,
    faculty: result.type.parent_kind === "faculty" ? result.type.parent_api_name : undefined,
  });
  return NextResponse.json(
    { data: result.type, meta: { persistence: "fixture_process_memory" } },
    { status: 201 },
  );
}
