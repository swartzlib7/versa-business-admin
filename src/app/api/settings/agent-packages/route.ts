import { NextResponse } from "next/server";
import { getSessionFromRequest, isAuthenticated, isAdmin } from "@/lib/auth";
import {
  installAgentPackage,
  listInstalledPackages,
  uninstallAgentPackage,
  type AgentPackageManifest,
} from "@/lib/catalog/agent-packages";

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 },
    );
  }
  return NextResponse.json({ data: { installed: listInstalledPackages() } });
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
  if (action === "install") {
    const manifest = body.package as AgentPackageManifest | undefined;
    if (!manifest || typeof manifest !== "object") {
      return NextResponse.json(
        { error: { code: "PACKAGE_REQUIRED", message: "package manifest is required." } },
        { status: 400 },
      );
    }
    const result = await installAgentPackage(manifest);
    if (!result.ok) {
      return NextResponse.json({ error: { code: result.code, message: result.message } }, { status: 400 });
    }
    return NextResponse.json({ data: { installed: result.installed } });
  }
  if (action === "uninstall") {
    if (typeof body.package_id !== "string") {
      return NextResponse.json(
        { error: { code: "PACKAGE_ID_REQUIRED", message: "package_id is required." } },
        { status: 400 },
      );
    }
    const result = await uninstallAgentPackage(body.package_id, (body.package as AgentPackageManifest | undefined)?.catalog);
    if (!result.ok) {
      return NextResponse.json({ error: { code: result.code, message: result.message } }, { status: 400 });
    }
    return NextResponse.json({ data: { installed: result.installed } });
  }
  return NextResponse.json(
    { error: { code: "INVALID_ACTION", message: "action must be install or uninstall." } },
    { status: 400 },
  );
}
