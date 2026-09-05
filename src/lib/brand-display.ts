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

export function logoPx(base: number, scale: number | undefined | null): number {
  return Math.round(base * clampLogoScale(scale));
}
