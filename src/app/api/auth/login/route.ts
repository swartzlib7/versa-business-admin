import { NextResponse } from "next/server";
import {
  verifyCredentialsAsync,
  createSessionToken,
  createSessionCookieHeader,
} from "@/lib/auth";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Request body must be valid JSON." } },
      { status: 400 },
    );
  }

  if (!body.email || !body.password) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Email and password are required." } },
      { status: 400 },
    );
  }

  const user = await verifyCredentialsAsync(body.email, body.password);
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid email or password." } },
      { status: 401 },
    );
  }

  const token = createSessionToken(user);
  const headers = new Headers();
  headers.append("Set-Cookie", createSessionCookieHeader(token));

  return NextResponse.json(
    {
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        type: user.type,
      },
    },
    { headers },
  );
}
