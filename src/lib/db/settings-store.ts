/**
 * #252 Settings functionality slice (Stephen round-2 item 10).
 * Instance-wide white-label singleton: brand.name + colors.brand only
 * (COA ruling S1 - exactly the 2 exposed controls). Single row keyed
 * id=site; GET falls back to static theme defaults when unset (S5).
 */

import { eq } from 'drizzle-orm';
import { getDb } from './client';
import { siteSettings as siteSettingsTable } from './schema';
import { theme } from '@/lib/theme';

export const SITE_SETTINGS_ID = 'site';

export interface SiteSettingsShape {
  brand_name: string;
  brand_color: string;
  brand_logo_opacity: number;
  brand_logo_glow: number;
  brand_logo_glow_color: string;
  brand_logo_glow_spread: number;
  brand_logo_scale_menu: number;
  brand_logo_scale_home: number;
  brand_logo_scale_footer: number;
  constellation_variant: 'classic' | 'realistic';
  constellation_density: number;
}

export async function getSiteSettingsDb(): Promise<SiteSettingsShape> {
  const db = getDb();
  const rows = await db
    .select()
    .from(siteSettingsTable)
    .where(eq(siteSettingsTable.id, SITE_SETTINGS_ID))
    .limit(1);
  if (!rows.length) {
    // S5: unset singleton reads as static theme defaults.
    return {
      brand_name: theme.brand.name,
      brand_color: theme.colors.brand,
      brand_logo_opacity: 1,
      brand_logo_glow: 0,
      brand_logo_glow_color: '#ffffff',
      brand_logo_glow_spread: 0.5,
      brand_logo_scale_menu: 1,
      brand_logo_scale_home: 1,
      brand_logo_scale_footer: 1,
      constellation_variant: 'classic',
      constellation_density: 0,
    };
  }
  const row = rows[0];
  return {
    brand_name: row.brandName,
    brand_color: row.brandColor,
    brand_logo_opacity: Number(row.brandLogoOpacity ?? 1),
    brand_logo_glow: Number(row.brandLogoGlow ?? 0),
    brand_logo_glow_color: row.brandLogoGlowColor || '#ffffff',
    brand_logo_glow_spread: Number(row.brandLogoGlowSpread ?? 0.5),
    brand_logo_scale_menu: Number(row.brandLogoScaleMenu ?? 1),
    brand_logo_scale_home: Number(row.brandLogoScaleHome ?? 1),
    brand_logo_scale_footer: Number(row.brandLogoScaleFooter ?? 1),
    constellation_variant: row.constellationVariant === 'realistic' ? 'realistic' : 'classic',
    constellation_density: Number(row.constellationDensity ?? 0),
  };
}

export async function upsertSiteSettingsDb(
  input: Partial<SiteSettingsShape>,
): Promise<SiteSettingsShape> {
  const db = getDb();
  const existing = await getSiteSettingsDb();
  const next = {
    brand_name: input.brand_name ?? existing.brand_name,
    brand_color: input.brand_color ?? existing.brand_color,
    brand_logo_opacity: input.brand_logo_opacity ?? existing.brand_logo_opacity,
    brand_logo_glow: input.brand_logo_glow ?? existing.brand_logo_glow,
    brand_logo_glow_color: input.brand_logo_glow_color ?? existing.brand_logo_glow_color,
    brand_logo_glow_spread: input.brand_logo_glow_spread ?? existing.brand_logo_glow_spread,
    brand_logo_scale_menu: input.brand_logo_scale_menu ?? existing.brand_logo_scale_menu,
    brand_logo_scale_home: input.brand_logo_scale_home ?? existing.brand_logo_scale_home,
    brand_logo_scale_footer: input.brand_logo_scale_footer ?? existing.brand_logo_scale_footer,
    constellation_variant: input.constellation_variant ?? existing.constellation_variant,
    constellation_density: input.constellation_density ?? existing.constellation_density,
  };
  await db
    .insert(siteSettingsTable)
    .values({
      id: SITE_SETTINGS_ID,
      brandName: next.brand_name,
      brandColor: next.brand_color,
      brandLogoOpacity: String(next.brand_logo_opacity),
      brandLogoGlow: String(next.brand_logo_glow),
      brandLogoGlowColor: next.brand_logo_glow_color,
      brandLogoGlowSpread: String(next.brand_logo_glow_spread),
      brandLogoScaleMenu: String(next.brand_logo_scale_menu),
      brandLogoScaleHome: String(next.brand_logo_scale_home),
      brandLogoScaleFooter: String(next.brand_logo_scale_footer),
      constellationVariant: next.constellation_variant,
      constellationDensity: String(next.constellation_density),
    })
    .onConflictDoUpdate({
      target: siteSettingsTable.id,
      set: {
        brandName: next.brand_name,
        brandColor: next.brand_color,
        brandLogoOpacity: String(next.brand_logo_opacity),
        brandLogoGlow: String(next.brand_logo_glow),
        brandLogoGlowColor: next.brand_logo_glow_color,
        brandLogoGlowSpread: String(next.brand_logo_glow_spread),
        brandLogoScaleMenu: String(next.brand_logo_scale_menu),
        brandLogoScaleHome: String(next.brand_logo_scale_home),
        brandLogoScaleFooter: String(next.brand_logo_scale_footer),
        constellationVariant: next.constellation_variant,
        constellationDensity: String(next.constellation_density),
        updatedAt: new Date(),
      },
    });
  return next;
}
