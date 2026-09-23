import { NextResponse } from "next/server";
import { adapter } from "@/lib/data";
import {
  createSessionCookieHeader,
  createSessionToken,
  getSessionFromRequest,
} from "@/lib/auth";
import { isInstallDefaultPassword } from "@/lib/install-password";
import { passwordProblem } from "@/lib/password-policy";

export async function POST(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Sign in first." } },
      { status: 401 },
    );
  }
  let body: { password?: string; confirm?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Request body must be valid JSON." } },
      { status: 400 },
    );
  }
  const password = String(body.password ?? "");
  const confirm = String(body.confirm ?? "");
  const problem = passwordProblem(password);
  if (problem) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: problem } },
      { status: 400 },
    );
  }
  if (password !== confirm) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "The two passwords do not match." } },
      { status: 400 },
    );
  }
  if (isInstallDefaultPassword(password)) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Choose a password that is not the install default." } },
      { status: 400 },
    );
  }
  if (!adapter.updateUser) {
    return NextResponse.json(
      { error: { code: "NOT_IMPLEMENTED", message: "Password change is not available." } },
      { status: 501 },
    );
  }
  const user = await adapter.updateUser(session.userId, { password });
  if (!user) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "User was not found." } },
      { status: 404 },
    );
  }
  const token = createSessionToken(user, { mustChangePassword: false });
  const headers = new Headers();
  headers.append("Set-Cookie", createSessionCookieHeader(token, request));
  return NextResponse.json({ data: { ok: true } }, { headers });
}
