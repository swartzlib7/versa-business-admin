import { NextResponse } from "next/server";
import { getSessionFromRequest, isAuthenticated, isAdmin } from "@/lib/auth";
import {
  getSiteSettingsFixture,
  upsertSiteSettingsFixture,
} from "@/lib/fixtures/site-settings";
import { defaultNavHrefs, sanitizeMenuOrder } from "@/lib/nav";

function modesFromStore() {
  const settings = getSiteSettingsFixture();
  return {
    demo_mode: settings.demo_mode !== false,
    maintenance_mode: settings.maintenance_mode === true,
    menu_order: sanitizeMenuOrder(settings.menu_order) ?? defaultNavHrefs(),
    public_login_enabled: settings.public_login_enabled !== false,
    glossary_in_menu: settings.glossary_in_menu !== false,
    org_board_enabled: settings.org_board_enabled !== false,
  };
}

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 },
    );
  }
  return NextResponse.json({ data: modesFromStore() });
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
  const patch: {
    demo_mode?: boolean;
    maintenance_mode?: boolean;
    menu_order?: string[];
    public_login_enabled?: boolean;
    glossary_in_menu?: boolean;
    org_board_enabled?: boolean;
  } = {};
  if (typeof body.demo_mode === "boolean") patch.demo_mode = body.demo_mode;
  if (typeof body.maintenance_mode === "boolean") {
    patch.maintenance_mode = body.maintenance_mode;
  }
  if (typeof body.public_login_enabled === "boolean") {
    patch.public_login_enabled = body.public_login_enabled;
  }
  if (typeof body.glossary_in_menu === "boolean") {
    patch.glossary_in_menu = body.glossary_in_menu;
  }
  if (typeof body.org_board_enabled === "boolean") {
    patch.org_board_enabled = body.org_board_enabled;
  }
  if (body.menu_order !== undefined) {
    const order = sanitizeMenuOrder(body.menu_order);
    if (!order) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_MENU_ORDER",
            message: "menu_order must be an array of known menu hrefs.",
          },
        },
        { status: 400 },
      );
    }
    patch.menu_order = order;
  }
  if (body.demo_mode != null && typeof body.demo_mode !== "boolean") {
    return NextResponse.json(
      { error: { code: "INVALID_DEMO_MODE", message: "demo_mode must be a boolean." } },
      { status: 400 },
    );
  }
  if (body.maintenance_mode != null && typeof body.maintenance_mode !== "boolean") {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_MAINTENANCE_MODE",
          message: "maintenance_mode must be a boolean.",
        },
      },
      { status: 400 },
    );
  }
  if (body.public_login_enabled != null && typeof body.public_login_enabled !== "boolean") {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_PUBLIC_LOGIN",
          message: "public_login_enabled must be a boolean.",
        },
      },
      { status: 400 },
    );
  }
  upsertSiteSettingsFixture(patch);
  return NextResponse.json({ data: modesFromStore() });
}
