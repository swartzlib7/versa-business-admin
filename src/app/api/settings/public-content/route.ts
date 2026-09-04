import { NextResponse } from "next/server";
import { getSessionFromRequest, isAuthenticated, isAdmin } from "@/lib/auth";
import {
  getSiteSettingsFixture,
  upsertSiteSettingsFixture,
} from "@/lib/fixtures/site-settings";
import { DEFAULT_CYCLE_STEPS, type CycleStep } from "@/lib/public/site-types";
import { normalizePublicContent } from "@/lib/public/site-content";

function payload() {
  return normalizePublicContent(getSiteSettingsFixture());
}

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 },
    );
  }
  return NextResponse.json({ data: payload() });
}

export async function PUT(request: Request) {
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
  let cycle_steps: CycleStep[] | undefined;
  if (Array.isArray(body.cycle_steps)) {
    cycle_steps = body.cycle_steps.slice(0, 10).map((raw) => {
      const row = (raw ?? {}) as Record<string, unknown>;
      return {
        title: String(row.title ?? "").slice(0, 40),
        desc: String(row.desc ?? "").slice(0, 120),
        enabled: row.enabled === true,
      };
    });
    while (cycle_steps.length < DEFAULT_CYCLE_STEPS.length) {
      cycle_steps.push({ title: "", desc: "", enabled: false });
    }
  }
  upsertSiteSettingsFixture({
    hero_headline: body.hero_headline != null ? String(body.hero_headline) : undefined,
    hero_subhead: body.hero_subhead != null ? String(body.hero_subhead) : undefined,
    cycle_enabled: typeof body.cycle_enabled === "boolean" ? body.cycle_enabled : undefined,
    cycle_steps,
    contact_email: body.contact_email != null ? String(body.contact_email) : undefined,
    contact_phone: body.contact_phone != null ? String(body.contact_phone) : undefined,
    contact_address: body.contact_address != null ? String(body.contact_address) : undefined,
  });
  return NextResponse.json({ data: payload() });
}
