/**
 * Install site pack (SP-01): the public site a fresh install opens with. Design and rules:
 * docs/production/state/state_page_builder.md § Open design: site in the database.
 * `site-pack.json` is written by `npm run site:export`; do not hand-edit it.
 */

import pack from "@/lib/site-pack/site-pack.json";

/** Pack records carry this `external_id` prefix. Demo off removes `ba_sample:` only. */
export const SITE_PACK_PREFIX = "ba_site:";

/** Site settings the pack never carries: per-install secrets, modes, and uploaded files. */
export const SITE_PACK_EXCLUDED_SETTINGS = [
  "email_delivery",
  "demo_mode",
  "maintenance_mode",
  "brand_logo_url",
  "brand_music_url",
  "brand_music_name",
] as const;

export type SitePackRecord = {
  key: string;
  type_api_name: string;
  parent_kind: string;
  parent_api_name: string;
  name: string;
  status: string;
  data: Record<string, string>;
};

export type SitePack = {
  version: string;
  exported_at: string;
  records: SitePackRecord[];
  settings: Record<string, unknown>;
};

/** Record ids inside the pack are written as `{{site:<key>}}`. */
export function sitePackToken(key: string): string {
  return `{{site:${key}}}`;
}

const TOKEN = /\{\{site:([a-z0-9:-]+)\}\}/g;

function tokensIn(text: string): string[] {
  return [...text.matchAll(TOKEN)].map((m) => m[1]);
}

function resolveTokens(text: string, ids: Map<string, string>): string {
  return text.replace(TOKEN, (whole, key: string) => ids.get(key) ?? whole);
}

export function sitePack(): SitePack {
  return pack as unknown as SitePack;
}

/**
 * Create the pack records (reusing any that already carry the pack `external_id`), then
 * write the pack settings. Runs only when the install has no site yet.
 */
export async function installSitePack(): Promise<{ records: number }> {
  const current = sitePack();
  if (!current.records.length && !Object.keys(current.settings).length) return { records: 0 };
  const { adapter } = await import("@/lib/data/adapter");
  const fixture = await import("@/lib/fixtures/record-instances");
  const existing = adapter.listRecords ? await adapter.listRecords({}) : fixture.listInstances({});
  const create = adapter.createRecord
    ? (input: Parameters<typeof fixture.createInstance>[0]) => adapter.createRecord!(input)
    : async (input: Parameters<typeof fixture.createInstance>[0]) => fixture.createInstance(input);

  const ids = new Map<string, string>();
  for (const row of existing) {
    const ext = String(row.data?.external_id ?? "");
    if (ext.startsWith(SITE_PACK_PREFIX)) ids.set(ext.slice(SITE_PACK_PREFIX.length), row.id);
  }

  let pending = current.records.filter((record) => !ids.has(record.key));
  let created = 0;
  while (pending.length) {
    const ready = pending.filter((record) =>
      tokensIn(JSON.stringify(record.data)).every((key) => ids.has(key)),
    );
    if (!ready.length) throw new Error(`Site pack: unresolved references in ${pending.map((r) => r.key).join(", ")}`);
    for (const record of ready) {
      const data = JSON.parse(resolveTokens(JSON.stringify(record.data), ids)) as Record<string, string>;
      const made = await create({
        type_api_name: record.type_api_name,
        parent_kind: record.parent_kind,
        parent_api_name: record.parent_api_name,
        name: record.name,
        status: record.status,
        data: { ...data, external_id: `${SITE_PACK_PREFIX}${record.key}` },
      });
      if (!made.ok) throw new Error(`Site pack: ${record.key}: ${made.message}`);
      ids.set(record.key, made.instance.id);
      created += 1;
    }
    pending = pending.filter((record) => !ready.includes(record));
  }

  const settings = JSON.parse(resolveTokens(JSON.stringify(current.settings), ids));
  const { upsertSiteSettingsFixture, flushSiteSettings } = await import("@/lib/fixtures/site-settings");
  upsertSiteSettingsFixture(settings);
  await flushSiteSettings();
  const { isPostgresDataSource } = await import("@/lib/db/data-source");
  if (isPostgresDataSource()) {
    // Brand and sky have their own columns; public pages read them from there.
    const { upsertSiteSettingsDb } = await import("@/lib/db/settings-store");
    await upsertSiteSettingsDb(settings);
  }
  return { records: created };
}

const PENDING_KEY = "__versaSitePackPending__";

/** Set by boot when the install has no site yet. */
export function markSitePackPending(): void {
  (globalThis as Record<string, unknown>)[PENDING_KEY] = true;
}

/** Boot step: install the pack once, after Rendering Drivers exist. */
export async function installSitePackIfPending(): Promise<void> {
  const g = globalThis as Record<string, unknown>;
  if (!g[PENDING_KEY]) return;
  g[PENDING_KEY] = false;
  try {
    const result = await installSitePack();
    console.log(`Site pack installed: ${result.records} records.`);
  } catch (err) {
    console.error("Site pack install failed:", err);
  }
}
