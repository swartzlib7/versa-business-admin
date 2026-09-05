import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAuthenticated, isAdmin } from '@/lib/auth';
import {
  getSiteSettingsDb,
  upsertSiteSettingsDb,
} from '@/lib/db/settings-store';
import {
  getBrandLogoOverlay,
  getSiteSettingsFixture,
  upsertBrandLogoFile,
  upsertSiteSettingsFixture,
} from '@/lib/fixtures/site-settings';
import { parseLogoSurfaces, parseSkyEffects, clampSkyZoom } from '@/lib/brand-display';

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
  const fromSettings =
    'brand_logo_url' in settings
      ? (settings as { brand_logo_url?: string | null }).brand_logo_url
      : undefined;
  const brand_logo_url = fromSettings || getBrandLogoOverlay();
  return NextResponse.json({
    data: { ...settings, brand_logo_url: brand_logo_url ?? null },
  });
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
  let brandLogoUrl: string | null | undefined;
  if (body.brand_logo_url === null || body.brand_logo_url === "") {
    brandLogoUrl = null;
  } else if (body.brand_logo_url != null) {
    const raw = String(body.brand_logo_url);
    const ok =
      raw.startsWith("data:image/") ||
      raw.startsWith("https://") ||
      raw.startsWith("http://");
    if (!ok || raw.length > 700000) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_BRAND_LOGO",
            message: "Logo must be an image upload (under ~500 KB) or an image URL.",
          },
        },
        { status: 400 },
      );
    }
    brandLogoUrl = raw;
  }
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
  // Logo display controls (Stephen 2026-09-05): translucency + glow, 0..1.
  const clamp01 = (v: unknown): number | undefined => {
    if (v == null) return undefined;
    const n = Number(v);
    if (!Number.isFinite(n)) return undefined;
    return Math.max(0, Math.min(1, n));
  };
  const clampScale = (v: unknown): number | undefined => {
    if (v == null) return undefined;
    const n = Number(v);
    if (!Number.isFinite(n)) return undefined;
    return Math.max(0.75, Math.min(1.25, n));
  };
  const brandLogoOpacity = clamp01(body.brand_logo_opacity);
  const brandLogoGlow = clamp01(body.brand_logo_glow);
  const brandLogoGlowSpread = clamp01(body.brand_logo_glow_spread);
  const brandLogoScaleMenu = clampScale(body.brand_logo_scale_menu);
  const brandLogoScaleHome = clampScale(body.brand_logo_scale_home);
  const brandLogoScaleFooter = clampScale(body.brand_logo_scale_footer);
  const constellationDensity = clamp01(body.constellation_density);
  const constellationZoom =
    body.constellation_zoom != null ? clampSkyZoom(body.constellation_zoom) : undefined;
  const constellationEffects = parseSkyEffects(body.constellation_effects);
  if (body.constellation_effects != null && constellationEffects == null) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_SKY_EFFECTS',
          message: 'constellation_effects must be an object with meteors, satellites, and comets.',
        },
      },
      { status: 400 },
    );
  }
  let brandLogoGlowColor: string | undefined;
  if (body.brand_logo_glow_color != null) {
    const raw = String(body.brand_logo_glow_color).trim();
    if (!HEX_COLOR_RE.test(raw)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_GLOW_COLOR',
            message: 'brand_logo_glow_color must be a hex color like #ffffff.',
          },
        },
        { status: 400 },
      );
    }
    brandLogoGlowColor = raw;
  }
  // Constellation variant (Stephen 2026-09-05): classic | realistic.
  const constellationVariant =
    body.constellation_variant === 'realistic' || body.constellation_variant === 'classic'
      ? (body.constellation_variant as 'realistic' | 'classic')
      : undefined;
  const brandLogoSurfaces = parseLogoSurfaces(body.brand_logo_surfaces);
  if (body.brand_logo_surfaces != null && brandLogoSurfaces == null) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_LOGO_SURFACES',
          message: 'brand_logo_surfaces must be an object with menu, home, and footer styles.',
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
          brand_logo_opacity: brandLogoOpacity,
          brand_logo_glow: brandLogoGlow,
          brand_logo_glow_color: brandLogoGlowColor,
          brand_logo_glow_spread: brandLogoGlowSpread,
          brand_logo_scale_menu: brandLogoScaleMenu,
          brand_logo_scale_home: brandLogoScaleHome,
          brand_logo_scale_footer: brandLogoScaleFooter,
          constellation_variant: constellationVariant,
          constellation_density: constellationDensity,
          constellation_zoom: constellationZoom,
          constellation_effects: constellationEffects,
          brand_logo_surfaces: brandLogoSurfaces,
        })
      : upsertSiteSettingsFixture({
          brand_name: brandName,
          brand_color: brandColor,
          brand_logo_url: brandLogoUrl,
          brand_logo_opacity: brandLogoOpacity,
          brand_logo_glow: brandLogoGlow,
          brand_logo_glow_color: brandLogoGlowColor,
          brand_logo_glow_spread: brandLogoGlowSpread,
          brand_logo_scale_menu: brandLogoScaleMenu,
          brand_logo_scale_home: brandLogoScaleHome,
          brand_logo_scale_footer: brandLogoScaleFooter,
          constellation_variant: constellationVariant,
          constellation_density: constellationDensity,
          constellation_zoom: constellationZoom,
          constellation_effects: constellationEffects,
          brand_logo_surfaces: brandLogoSurfaces,
        });
    if (isPostgres() && brandLogoUrl !== undefined) {
      upsertBrandLogoFile(brandLogoUrl);
    }
    const fromSettings =
      "brand_logo_url" in settings
        ? (settings as { brand_logo_url?: string | null }).brand_logo_url
        : undefined;
    const brand_logo_url =
      fromSettings ||
      (brandLogoUrl !== undefined ? brandLogoUrl : getBrandLogoOverlay());
    return NextResponse.json({
      data: { ...settings, brand_logo_url: brand_logo_url ?? null },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: { code: 'UPSERT_FAILED', message } },
      { status: 500 },
    );
  }
}
