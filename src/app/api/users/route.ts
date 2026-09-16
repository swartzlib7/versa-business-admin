import { NextResponse } from "next/server";
import { adapter } from "@/lib/data";
import { getSessionFromRequest, isAuthenticated, isAdmin } from "@/lib/auth";
import type { CreateUserInput } from "@/lib/data/adapter";

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const typeFilter = searchParams.get("type");

  const data = await adapter.listUsers(typeFilter ?? undefined);

  return NextResponse.json({
    data,
    count: data.length,
  });
}

/** Phase 3 - create user (admin only). */
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
      { error: { code: "FORBIDDEN", message: "Admin role required to create users." } },
      { status: 403 },
    );
  }
  if (!adapter.createUser) {
    return NextResponse.json(
      { error: { code: "NOT_IMPLEMENTED", message: "User create is not available." } },
      { status: 501 },
    );
  }

  let body: CreateUserInput;
  try {
    body = (await request.json()) as CreateUserInput;
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON body." } },
      { status: 400 },
    );
  }

  try {
    const user = await adapter.createUser(body);
    return NextResponse.json({ data: user }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.startsWith("VALIDATION:")) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: msg.replace(/^VALIDATION:\s*/, "") } },
        { status: 400 },
      );
    }
    if (msg.startsWith("CONFLICT:")) {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: msg.replace(/^CONFLICT:\s*/, "") } },
        { status: 409 },
      );
    }
    console.error("POST /api/users", e);
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to create user." } },
      { status: 500 },
    );
  }
}
