/** Shipped visitor defaults. Operator upload replaces; Remove restores these. */

export const SEED_BRAND_LOGO_HREF = "/seed/versa-agi-shield-helix_v1-512.png";
export const SEED_BRAND_LOGO_NAME = "Versa AGi shield";
export const SEED_BRAND_MUSIC_FILE = "ethereal-tech.mp3";
export const SEED_BRAND_MUSIC_NAME = "Ethereal Tech.mp3";

export function resolveBrandLogoUrl(stored: string | null | undefined): string {
  if (typeof stored === "string" && stored && stored !== SEED_BRAND_LOGO_HREF) {
    return stored;
  }
  return SEED_BRAND_LOGO_HREF;
}

export function isSeedBrandLogoUrl(url: string | null | undefined): boolean {
  return !url || url === SEED_BRAND_LOGO_HREF;
}
