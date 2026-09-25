import { NextResponse } from "next/server";
import { adapter } from "@/lib/data";
import { verifyLoginChallenge } from "@/lib/auth-challenge";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// POST /api/public/subscribe — a visitor email becomes a public Contact (open, challenge-gated).
export async function POST(request: Request) {
  let body: {
    email?: unknown;
    website?: unknown;
    source?: unknown;
    challenge?: Record<string, unknown>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Request body must be valid JSON." } },
      { status: 400 },
    );
  }

  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ data: { subscribed: true } });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";
  if (!EMAIL.test(email)) {
    return NextResponse.json(
      { error: { code: "INVALID_EMAIL", message: "Enter a valid email address." } },
      { status: 400 },
    );
  }

  if (!verifyLoginChallenge(body.challenge ?? {})) {
    return NextResponse.json(
      { error: { code: "CHALLENGE_FAILED", message: "Verification failed. Refresh the page and try again." } },
      { status: 400 },
    );
  }

  if (!adapter.listRecords || !adapter.createRecord) {
    return NextResponse.json(
      { error: { code: "UNAVAILABLE", message: "Sign-up is not available right now." } },
      { status: 503 },
    );
  }

  const contacts = await adapter.listRecords({ type_api_name: "contact" });
  const existing = contacts.find(
    (row) => String(row.data?.email ?? "").trim().toLowerCase() === email,
  );
  if (existing) return NextResponse.json({ data: { subscribed: true } });

  const source = typeof body.source === "string" ? body.source.trim().slice(0, 200) : "";
  const created = await adapter.createRecord({
    type_api_name: "contact",
    parent_kind: "faculty",
    parent_api_name: "public",
    name: email,
    status: "active",
    data: {
      email,
      contact_kind: "public",
      notes: source ? `Signed up on ${source}` : "Signed up on the public site",
    },
  });
  if (!created.ok) {
    return NextResponse.json(
      { error: { code: created.code, message: "Could not save the sign-up." } },
      { status: 500 },
    );
  }
  return NextResponse.json({ data: { subscribed: true } }, { status: 201 });
}
