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
    return { brand_name: theme.brand.name, brand_color: theme.colors.brand };
  }
  const row = rows[0];
  return { brand_name: row.brandName, brand_color: row.brandColor };
}

export async function upsertSiteSettingsDb(
  input: Partial<SiteSettingsShape>,
): Promise<SiteSettingsShape> {
  const db = getDb();
  const existing = await getSiteSettingsDb();
  const next = {
    brand_name: input.brand_name ?? existing.brand_name,
    brand_color: input.brand_color ?? existing.brand_color,
  };
  await db
    .insert(siteSettingsTable)
    .values({
      id: SITE_SETTINGS_ID,
      brandName: next.brand_name,
      brandColor: next.brand_color,
    })
    .onConflictDoUpdate({
      target: siteSettingsTable.id,
      set: {
        brandName: next.brand_name,
        brandColor: next.brand_color,
        updatedAt: new Date(),
      },
    });
  return next;
}
