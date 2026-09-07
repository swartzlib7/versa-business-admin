import { NextResponse } from "next/server";
import { getSessionFromRequest, isAuthenticated, isAdmin } from "@/lib/auth";
import {
  getSiteSettingsFixture,
  upsertSiteSettingsFixture,
} from "@/lib/fixtures/site-settings";
import {
  LOCKED_OPERATOR_HREFS,
  defaultNavHrefs,
  defaultPublicNavHrefs,
  publicFlagsFromEnabled,
  sanitizeMenuEnabled,
  sanitizeMenuOrder,
  withToggledHref,
} from "@/lib/nav";

function modesFromStore() {
  const settings = getSiteSettingsFixture();
  const menu_enabled = sanitizeMenuEnabled(
    settings.menu_enabled,
    defaultNavHrefs(),
    LOCKED_OPERATOR_HREFS,
  );
  const public_menu_enabled = sanitizeMenuEnabled(
    settings.public_menu_enabled,
    defaultPublicNavHrefs(),
  );
  const flags = publicFlagsFromEnabled(public_menu_enabled);
  return {
    demo_mode: settings.demo_mode !== false,
    maintenance_mode: settings.maintenance_mode === true,
    menu_order: sanitizeMenuOrder(settings.menu_order) ?? defaultNavHrefs(),
    menu_enabled,
    public_menu_order:
      sanitizeMenuOrder(settings.public_menu_order, defaultPublicNavHrefs()) ??
      defaultPublicNavHrefs(),
    public_menu_enabled,
    public_login_enabled: settings.public_login_enabled !== false,
    glossary_in_menu: flags.glossary_in_menu,
    org_board_enabled: flags.org_board_enabled,
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
  const current = modesFromStore();
  const patch: {
    demo_mode?: boolean;
    maintenance_mode?: boolean;
    menu_order?: string[];
    menu_enabled?: string[];
    public_menu_order?: string[];
    public_menu_enabled?: string[];
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
  if (body.menu_enabled !== undefined) {
    if (!Array.isArray(body.menu_enabled)) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_MENU_ENABLED",
            message: "menu_enabled must be an array of known menu hrefs.",
          },
        },
        { status: 400 },
      );
    }
    patch.menu_enabled = sanitizeMenuEnabled(
      body.menu_enabled,
      defaultNavHrefs(),
      LOCKED_OPERATOR_HREFS,
    );
  }
  if (body.public_menu_order !== undefined) {
    const order = sanitizeMenuOrder(body.public_menu_order, defaultPublicNavHrefs());
    if (!order) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_PUBLIC_MENU_ORDER",
            message: "public_menu_order must be an array of known public menu hrefs.",
          },
        },
        { status: 400 },
      );
    }
    patch.public_menu_order = order;
  }
  let publicEnabled = current.public_menu_enabled;
  if (body.public_menu_enabled !== undefined) {
    if (!Array.isArray(body.public_menu_enabled)) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_PUBLIC_MENU_ENABLED",
            message: "public_menu_enabled must be an array of known public menu hrefs.",
          },
        },
        { status: 400 },
      );
    }
    publicEnabled = sanitizeMenuEnabled(body.public_menu_enabled, defaultPublicNavHrefs());
  }
  if (typeof body.glossary_in_menu === "boolean") {
    publicEnabled = withToggledHref(publicEnabled, "/terms", body.glossary_in_menu);
  }
  if (typeof body.org_board_enabled === "boolean") {
    publicEnabled = withToggledHref(publicEnabled, "/board", body.org_board_enabled);
  }
  if (
    body.public_menu_enabled !== undefined ||
    typeof body.glossary_in_menu === "boolean" ||
    typeof body.org_board_enabled === "boolean"
  ) {
    patch.public_menu_enabled = publicEnabled;
    const flags = publicFlagsFromEnabled(publicEnabled);
    patch.glossary_in_menu = flags.glossary_in_menu;
    patch.org_board_enabled = flags.org_board_enabled;
  }
  upsertSiteSettingsFixture(patch);
  return NextResponse.json({ data: modesFromStore() });
}
