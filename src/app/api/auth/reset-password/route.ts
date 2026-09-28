import { NextResponse } from "next/server";
import { adapter } from "@/lib/data/adapter";
import { consumeAccountToken } from "@/lib/auth/account-tokens";
import { createSessionCookieHeader, createSessionToken } from "@/lib/auth";
import { isInstallDefaultPassword } from "@/lib/install-password";
import { passwordProblem } from "@/lib/password-policy";

export async function POST(request: Request) {
  let body: { token?: string; password?: string; confirm?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid JSON." } }, { status: 400 });
  }
  const password = String(body.password ?? "");
  const problem = passwordProblem(password);
  if (problem) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: problem } }, { status: 400 });
  }
  if (password !== String(body.confirm ?? "")) {
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
  const ticket = await consumeAccountToken(String(body.token ?? ""), "password_reset");
  if (!ticket || !adapter.updateUser) {
    return NextResponse.json(
      { error: { code: "TOKEN_INVALID", message: "This reset link is invalid or has expired." } },
      { status: 400 },
    );
  }
  const user = await adapter.updateUser(ticket.userId, { password });
  if (!user) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "User was not found." } }, { status: 404 });
  }
  const headers = new Headers();
  headers.append("Set-Cookie", createSessionCookieHeader(createSessionToken(user), request));
  return NextResponse.json({ data: { ok: true } }, { headers });
}
