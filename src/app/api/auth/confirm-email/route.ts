import { NextResponse } from "next/server";
import { adapter } from "@/lib/data/adapter";
import { consumeAccountToken } from "@/lib/auth/account-tokens";

export async function POST(request: Request) {
  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid JSON." } }, { status: 400 });
  }
  const ticket = await consumeAccountToken(String(body.token ?? ""), "email_change");
  const nextEmail = String(ticket?.payload.email ?? "").trim().toLowerCase();
  if (!ticket || !nextEmail || !adapter.updateUser) {
    return NextResponse.json(
      { error: { code: "TOKEN_INVALID", message: "This confirmation link is invalid or has expired." } },
      { status: 400 },
    );
  }
  try {
    const user = await adapter.updateUser(ticket.userId, { email: nextEmail });
    if (!user) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "User was not found." } }, { status: 404 });
    }
    return NextResponse.json({ data: { email: user.email } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.startsWith("CONFLICT:")) {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "That email is already in use." } },
        { status: 409 },
      );
    }
    throw err;
  }
}
