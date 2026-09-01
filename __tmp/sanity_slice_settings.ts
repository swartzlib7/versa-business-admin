// #252 Settings functionality slice sanity - structural assertions (no DB).
// Run: npx tsx __tmp/sanity_slice_settings.ts
import { readFileSync } from 'fs';
let pass = 0, fail = 0;
function ok(cond: boolean, label: string) {
  if (cond) { pass++; } else { fail++; console.log('FAIL: ' + label); }
}
const rd = (p: string) => readFileSync(p, 'utf8');

// 1. Schema + migration 0005
const schema = rd('src/lib/db/schema.ts');
ok(schema.includes("'site_settings',"), 'schema: site_settings table');
ok(schema.includes('brandName: text('), 'schema: brand_name column');
ok(schema.includes('brandColor: text('), 'schema: brand_color column');
const mig = rd('drizzle/0005_i5_6_33_slice_settings_site_settings.sql');
ok(mig.includes('CREATE TABLE "site_settings"'), 'migration 0005: CREATE TABLE site_settings');
ok(mig.includes('"brand_name"'), 'migration 0005: brand_name column');
ok(mig.includes('"brand_color"'), 'migration 0005: brand_color column');
const journal = JSON.parse(rd('drizzle/meta/_journal.json'));
ok(journal.entries.some((e: { tag: string }) => e.tag === '0005_i5_6_33_slice_settings_site_settings'), 'journal: 0005 registered');

// 2. Settings store (postgres path)
const store = rd('src/lib/db/settings-store.ts');
ok(store.includes('export async function getSiteSettingsDb'), 'store: getSiteSettingsDb');
ok(store.includes('export async function upsertSiteSettingsDb'), 'store: upsertSiteSettingsDb');
ok(store.includes('onConflictDoUpdate'), 'store: upsert via onConflictDoUpdate');
ok(store.includes("SITE_SETTINGS_ID = 'site'"), 'store: singleton id site');
ok(store.includes('theme.brand.name'), 'store: S5 default fallback to static theme');

// 3. Fixture branch (beta :3200 runs fixture mode)
const fix = rd('src/lib/fixtures/site-settings.ts');
ok(fix.includes('export function getSiteSettingsFixture'), 'fixture: getSiteSettingsFixture');
ok(fix.includes('export function upsertSiteSettingsFixture'), 'fixture: upsertSiteSettingsFixture');
ok(fix.includes('theme.brand.name'), 'fixture: S5 seeded from static theme');

// 4. API route - gating + validation + DATA_SOURCE dispatch
const route = rd('src/app/api/settings/branding/route.ts');
ok(route.includes('isAuthenticated(session)'), 'route: GET+PUT auth gate');
ok(route.includes('isAdmin(session)'), 'route: PUT admin gate (S3)');
ok(route.includes('INVALID_BRAND_COLOR'), 'route: hex color validation');
ok(route.includes('INVALID_BRAND_NAME'), 'route: brand_name non-empty validation');
ok(route.includes('getSiteSettingsFixture'), 'route: fixture dispatch');
ok(route.includes('getSiteSettingsDb'), 'route: postgres dispatch');

// 5. Root layout - server read + force-dynamic (S4)
const layout = rd('src/app/layout.tsx');
ok(layout.includes('force-dynamic'), 'layout: force-dynamic (S4 no build-time bake)');
ok(layout.includes('getSiteSettingsDb'), 'layout: server-read postgres');
ok(layout.includes('getSiteSettingsFixture'), 'layout: server-read fixture');
ok(layout.includes('BrandProvider'), 'layout: BrandProvider wraps app');
ok(layout.includes('catch'), 'layout: branding failure falls back to static defaults');

// 6. Brand provider
const bp = rd('src/components/shell/brand-provider.tsx');
ok(bp.includes('export function BrandProvider'), 'provider: BrandProvider');
ok(bp.includes('export function useBrand'), 'provider: useBrand hook');
ok(bp.includes('export function brandInitials'), 'provider: brandInitials helper');

// 7. Identity surfaces consume brand (S2 - sidebar, login, settings only)
const sidebar = rd('src/components/shell/sidebar.tsx');
ok(sidebar.includes('useBrand()'), 'sidebar: useBrand');
ok(sidebar.includes('brand.brand_name'), 'sidebar: dynamic brand name');
ok(sidebar.includes('brandInitials(brand.brand_name)'), 'sidebar: dynamic initials');
ok(sidebar.includes('brand.brand_color'), 'sidebar: dynamic logo color');
const login = rd('src/app/login/page.tsx');
ok(login.includes('useBrand()'), 'login: useBrand');
ok(login.includes('brand.brand_name'), 'login: dynamic brand name');
ok(login.includes('brandInitials(brand.brand_name)'), 'login: dynamic initials');
const settings = rd('src/app/settings/page.tsx');
ok(settings.includes('useBrand()'), 'settings: useBrand');
ok(settings.includes('/api/settings/branding'), 'settings: PUT wiring');
ok(settings.includes('brand_name: brandName.trim()'), 'settings: save sends brand_name');
ok(settings.includes('brand_color: brandColor'), 'settings: save sends brand_color');
ok(settings.includes('saveError'), 'settings: save error surface');
ok(settings.includes('disabled={saving}'), 'settings: save button disabled while saving');
ok(!settings.includes('<Input'), 'settings: plain inputs (base-ui focus bug fix)');

// 8. Rename scope guard - exactly 2 sub-tab labels, ids stable
ok(settings.includes('label: "Records" }'), 'rename: Configuration -> Records (branding sub-tab)');
ok((settings.match(/label: "Records"/g) || []).length === 2, 'rename: exactly 2 label occurrences');
ok((settings.match(/id: "configuration"/g) || []).length === 2, 'rename: sub-tab ids stable');
ok(!settings.includes('label: "Configuration"'), 'rename: no Configuration labels remain in settings');

// 9. S2 scope guard - static theme usages untouched elsewhere
const themeLib = rd('src/lib/theme.ts');
ok(themeLib.includes("brand: '#6366f1'"), 'S2: static theme lib unchanged');
ok(!sidebar.includes('brandInitials(brand.brand_name) && false'), 'sidebar: no dead markers');

console.log('Slice Settings sanity: ' + pass + ' passed, ' + fail + ' failed');
if (fail > 0) process.exit(1);
