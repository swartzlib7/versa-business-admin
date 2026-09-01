import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAuthenticated, isAdmin } from '@/lib/auth';
import {
  getSiteSettingsDb,
  upsertSiteSettingsDb,
} from '@/lib/db/settings-store';
import {
  getSiteSettingsFixture,
  upsertSiteSettingsFixture,
} from '@/lib/fixtures/site-settings';

// #252 Settings functionality slice (Stephen round-2 item 10): branding
// persistence singleton. GET is authenticated; writes are admin-only
// (S3 - matches element-config PUT gating precedent). DATA_SOURCE=fixture
// (beta :3200) routes to the in-memory fixture singleton (S5).

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function isPostgres(): boolean {
  return (process.env.DATA_SOURCE ?? 'fixture') === 'postgres';
}

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }
  const settings = isPostgres()
    ? await getSiteSettingsDb()
    : getSiteSettingsFixture();
  return NextResponse.json({ data: settings });
}

export async function PUT(request: Request) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }
  if (!isAdmin(session)) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin session required.' } },
      { status: 403 },
    );
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Request body must be JSON.' } },
      { status: 400 },
    );
  }
  const brandName =
    body.brand_name != null ? String(body.brand_name).trim() : undefined;
  const brandColor =
    body.brand_color != null ? String(body.brand_color).trim() : undefined;
  if (brandName != null && brandName.length === 0) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_BRAND_NAME',
          message: 'brand_name must be a non-empty string.',
        },
      },
      { status: 400 },
    );
  }
  if (brandColor != null && !HEX_COLOR_RE.test(brandColor)) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_BRAND_COLOR',
          message: 'brand_color must be a hex color like #6366f1.',
        },
      },
      { status: 400 },
    );
  }
  try {
    const settings = isPostgres()
      ? await upsertSiteSettingsDb({
          brand_name: brandName,
          brand_color: brandColor,
        })
      : upsertSiteSettingsFixture({
          brand_name: brandName,
          brand_color: brandColor,
        });
    return NextResponse.json({ data: settings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: { code: 'UPSERT_FAILED', message } },
      { status: 500 },
    );
  }
}
