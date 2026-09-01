/**
 * #252 Settings functionality slice - fixture-mode site settings.
 * Beta :3200 runs DATA_SOURCE=fixture; branding persistence must work
 * there too (S5). In-memory singleton seeded from static theme defaults;
 * process-lifetime persistence only (resets on restart) - same semantics
 * as the fixture orgs store from Slice F.
 *
 * Backed by globalThis: Next.js server bundles can duplicate module-level
 * state across the layout bundle and route-handler bundles (observed live:
 * PUT from the route updated its copy while the root layout rendered its
 * own stale copy). globalThis is shared across all bundle instances in
 * the same server process, so PUT -> hard reload sees the new brand (S4).
 */

import { theme } from '@/lib/theme';

export interface FixtureSiteSettings {
  brand_name: string;
  brand_color: string;
}

const GLOBAL_KEY = '__versaSiteSettingsFixture__';

function readStore(): FixtureSiteSettings | null {
  return (globalThis as Record<string, unknown>)[GLOBAL_KEY] as
    | FixtureSiteSettings
    | null
    ?? null;
}

function writeStore(value: FixtureSiteSettings): void {
  (globalThis as Record<string, unknown>)[GLOBAL_KEY] = value;
}

export function getSiteSettingsFixture(): FixtureSiteSettings {
  const existing = readStore();
  if (!existing) {
    const seeded: FixtureSiteSettings = {
      brand_name: theme.brand.name,
      brand_color: theme.colors.brand,
    };
    writeStore(seeded);
    return { ...seeded };
  }
  return { ...existing };
}

export function upsertSiteSettingsFixture(
  input: Partial<FixtureSiteSettings>,
): FixtureSiteSettings {
  const current = getSiteSettingsFixture();
  const next: FixtureSiteSettings = {
    brand_name: input.brand_name ?? current.brand_name,
    brand_color: input.brand_color ?? current.brand_color,
  };
  writeStore(next);
  return { ...next };
}
