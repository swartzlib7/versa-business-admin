/**
 * Shared logo display math — used by BrandMark (client) and the public hero
 * (server). Keep this module free of "use client" so both can import it.
 */

export const LOGO_BASE_PX = {
  menu: 32,
  homeMobile: 315,
  homeDesktop: 420,
  footer: 150,
} as const;

export const LOGO_SCALE_MIN = 0.75;
export const LOGO_SCALE_MAX = 1.25;
export const LOGO_SCALE_DEFAULT = 1;
export const DEFAULT_GLOW_COLOR = "#ffffff";
export const DEFAULT_GLOW_SPREAD = 0.5;

export function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function clampLogoScale(n: number | undefined | null): number {
  if (n == null || !Number.isFinite(n)) return LOGO_SCALE_DEFAULT;
  return Math.max(LOGO_SCALE_MIN, Math.min(LOGO_SCALE_MAX, n));
}

export function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function logoGlowFilter(
  glow: number,
  color = DEFAULT_GLOW_COLOR,
  spread = DEFAULT_GLOW_SPREAD,
): string | undefined {
  const g = clamp01(glow);
  if (g <= 0) return undefined;
  const s = clamp01(spread);
  const radius = Math.round(6 + s * 34);
  const rgb = hexToRgb(color) ?? [255, 255, 255];
  const alpha = (0.35 + g * 0.6).toFixed(2);
  return `drop-shadow(0 0 ${radius}px rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha}))`;
}

export const LOGO_PX_MIN = 512;
export const LOGO_PX_MAX = 1024;
/** Preview well matches the home-page logo at 100% (center slot). */
export const LOGO_PREVIEW_BOX_PX = LOGO_BASE_PX.homeDesktop;
export const SKY_PREVIEW_MIN_PX = 448;
export const SKY_PREVIEW_MAX_PX = 4096;
export const SKY_ZOOM_MIN = 0.25;
export const SKY_ZOOM_MAX = 2;
export const SKY_ZOOM_STEP = 0.25;
export const SKY_ZOOM_DEFAULT = 1;
export const SKY_DENSITY_LEVEL_MIN = 1;
export const SKY_DENSITY_LEVEL_MAX = 10;
export const SKY_DENSITY_LEVEL_DEFAULT = 5;
/** Stored 0–1 value for density level 5 (Classic's original field). */
export const SKY_DENSITY_DEFAULT = (SKY_DENSITY_LEVEL_DEFAULT - 1) / 9;

export function clampSkyZoom(n: unknown): number {
  const x = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(x)) return SKY_ZOOM_DEFAULT;
  const stepped = Math.round(x / SKY_ZOOM_STEP) * SKY_ZOOM_STEP;
  return Math.max(SKY_ZOOM_MIN, Math.min(SKY_ZOOM_MAX, Number(stepped.toFixed(2))));
}

export function clampSkyDensity(n: unknown): number {
  const x = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(x)) return SKY_DENSITY_DEFAULT;
  return Math.max(0, Math.min(1, x));
}

export function skyDensityLevel(density: unknown): number {
  const d = clampSkyDensity(density);
  return Math.max(
    SKY_DENSITY_LEVEL_MIN,
    Math.min(SKY_DENSITY_LEVEL_MAX, Math.round(1 + d * 9)),
  );
}

export function skyDensityFromLevel(level: unknown): number {
  const n = typeof level === "number" ? level : Number(level);
  const L = Number.isFinite(n)
    ? Math.max(SKY_DENSITY_LEVEL_MIN, Math.min(SKY_DENSITY_LEVEL_MAX, Math.round(n)))
    : SKY_DENSITY_LEVEL_DEFAULT;
  return (L - 1) / 9;
}

export const SKY_FREQ_STEPS = [1 / 3, 0.5, 1, 2, 3] as const;
export const SKY_FREQ_MIN = SKY_FREQ_STEPS[0];
export const SKY_FREQ_MAX = SKY_FREQ_STEPS[SKY_FREQ_STEPS.length - 1];
export const SKY_FREQ_DEFAULT = 1;

export function clampSkyFrequency(n: unknown, fallback = SKY_FREQ_DEFAULT): number {
  const x = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(x)) return fallback;
  let best: number = SKY_FREQ_STEPS[0];
  let bestD = Infinity;
  for (const step of SKY_FREQ_STEPS) {
    const d = Math.abs(step - x);
    if (d < bestD) {
      bestD = d;
      best = step;
    }
  }
  return best;
}

export function skyFreqIndex(n: unknown): number {
  const f = clampSkyFrequency(n);
  const i = SKY_FREQ_STEPS.findIndex((step) => step === f);
  return i < 0 ? 2 : i;
}

export function formatSkyFrequency(n: unknown): string {
  const f = clampSkyFrequency(n);
  if (f === 1 / 3) return "⅓×";
  if (f === 0.5) return "½×";
  return `${f}×`;
}

export type SkyEffectId = "meteors" | "satellites" | "comets";

export type SkyEffectStyle = {
  enabled: boolean;
  zoom: number;
  frequency: number;
};

export type SkyEffects = Record<SkyEffectId, SkyEffectStyle>;

export const DEFAULT_SKY_EFFECTS: SkyEffects = {
  meteors: { enabled: true, zoom: SKY_ZOOM_DEFAULT, frequency: SKY_FREQ_DEFAULT },
  satellites: { enabled: true, zoom: SKY_ZOOM_DEFAULT, frequency: SKY_FREQ_DEFAULT },
  comets: { enabled: false, zoom: SKY_ZOOM_DEFAULT, frequency: SKY_FREQ_DEFAULT },
};

export function resolveSkyEffects(raw: unknown): SkyEffects {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const one = (id: SkyEffectId, fallbackEnabled: boolean): SkyEffectStyle => {
    const row = obj[id];
    const r = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
    return {
      enabled: typeof r.enabled === "boolean" ? r.enabled : fallbackEnabled,
      zoom: clampSkyZoom(r.zoom),
      frequency: clampSkyFrequency(r.frequency),
    };
  };
  return {
    meteors: one("meteors", true),
    satellites: one("satellites", true),
    comets: one("comets", false),
  };
}

/** Nested `{ meteors, satellites, comets }` object from the API body. */
export function parseSkyEffects(raw: unknown): SkyEffects | undefined {
  if (raw == null || typeof raw !== "object") return undefined;
  return resolveSkyEffects(raw);
}
export const LOGO_MAX_BYTES = 500 * 1024;
export const LOGO_UPLOAD_HINT = `PNG, JPG, SVG, or WebP. Both width and height must be ${LOGO_PX_MIN}–${LOGO_PX_MAX} px. Max 500 KB. Initials are used when empty.`;

export type LogoSurfaceId = "menu" | "home" | "footer";

export type LogoSurfaceStyle = {
  opacity: number;
  glow: number;
  glowColor: string;
  glowSpread: number;
  scale: number;
};

export type LogoSurfaces = Record<LogoSurfaceId, LogoSurfaceStyle>;

export const DEFAULT_LOGO_SURFACE: LogoSurfaceStyle = {
  opacity: 1,
  glow: 0,
  glowColor: DEFAULT_GLOW_COLOR,
  glowSpread: DEFAULT_GLOW_SPREAD,
  scale: LOGO_SCALE_DEFAULT,
};

export function normalizeLogoSurface(
  raw: unknown,
  fallback: Partial<LogoSurfaceStyle> = {},
): LogoSurfaceStyle {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const color =
    typeof row.glowColor === "string" && hexToRgb(row.glowColor)
      ? row.glowColor
      : fallback.glowColor ?? DEFAULT_GLOW_COLOR;
  return {
    opacity: clamp01(
      typeof row.opacity === "number" ? row.opacity : (fallback.opacity ?? 1),
    ),
    glow: clamp01(typeof row.glow === "number" ? row.glow : (fallback.glow ?? 0)),
    glowColor: color,
    glowSpread: clamp01(
      typeof row.glowSpread === "number"
        ? row.glowSpread
        : (fallback.glowSpread ?? DEFAULT_GLOW_SPREAD),
    ),
    scale: clampLogoScale(
      typeof row.scale === "number" ? row.scale : fallback.scale,
    ),
  };
}

export function resolveLogoSurfaces(
  raw: Record<string, unknown> | null | undefined,
): LogoSurfaces {
  const r = raw ?? {};
  const nested =
    r.brand_logo_surfaces && typeof r.brand_logo_surfaces === "object"
      ? (r.brand_logo_surfaces as Record<string, unknown>)
      : {};
  const legacy: Partial<LogoSurfaceStyle> = {
    opacity: typeof r.brand_logo_opacity === "number" ? r.brand_logo_opacity : 1,
    glow: typeof r.brand_logo_glow === "number" ? r.brand_logo_glow : 0,
    glowColor:
      typeof r.brand_logo_glow_color === "string" ? r.brand_logo_glow_color : DEFAULT_GLOW_COLOR,
    glowSpread:
      typeof r.brand_logo_glow_spread === "number"
        ? r.brand_logo_glow_spread
        : DEFAULT_GLOW_SPREAD,
  };
  const scaleFallback = (id: LogoSurfaceId, flat: string) => {
    const nestedScale = (nested[id] as { scale?: unknown } | undefined)?.scale;
    const flatScale = r[flat];
    if (typeof nestedScale === "number") return nestedScale;
    if (typeof flatScale === "number") return flatScale;
    return 1;
  };
  return {
    menu: normalizeLogoSurface(nested.menu, {
      ...legacy,
      scale: scaleFallback("menu", "brand_logo_scale_menu"),
    }),
    home: normalizeLogoSurface(nested.home, {
      ...legacy,
      scale: scaleFallback("home", "brand_logo_scale_home"),
    }),
    footer: normalizeLogoSurface(nested.footer, {
      ...legacy,
      scale: scaleFallback("footer", "brand_logo_scale_footer"),
    }),
  };
}

export function logoSurfaceFilter(surface: LogoSurfaceStyle): string | undefined {
  return logoGlowFilter(surface.glow, surface.glowColor, surface.glowSpread);
}

/** `raw` is the nested `{ menu, home, footer }` object from the API body. */
export function parseLogoSurfaces(raw: unknown): LogoSurfaces | undefined {
  if (raw == null || typeof raw !== "object") return undefined;
  return resolveLogoSurfaces({ brand_logo_surfaces: raw });
}

export function logoPx(base: number, scale: number | undefined | null): number {
  return Math.round(base * clampLogoScale(scale));
}


