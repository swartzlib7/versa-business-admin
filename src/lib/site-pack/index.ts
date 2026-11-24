/**
 * Install site pack (SP-01): the public site a fresh install opens with. Design and rules:
 * docs/production/state/state_page_builder.md § Open design: site in the database.
 * `site-pack.json` is written by `npm run site:export`; do not hand-edit it.
 */

import pack from "@/lib/site-pack/site-pack.json";
import history from "@/lib/site-pack/site-pack-history.json";
import { decidePageRefresh } from "@/lib/site-pack/page-refresh";

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
  "site_pack_added",
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

/** Pack keys → record ids on this install (records carrying the pack `external_id`). */
async function packRecordIds(): Promise<Map<string, string>> {
  const { adapter } = await import("@/lib/data/adapter");
  const fixture = await import("@/lib/fixtures/record-instances");
  const existing = adapter.listRecords ? await adapter.listRecords({}) : fixture.listInstances({});
  const ids = new Map<string, string>();
  for (const row of existing) {
    const ext = String(row.data?.external_id ?? "");
    if (ext.startsWith(SITE_PACK_PREFIX)) ids.set(ext.slice(SITE_PACK_PREFIX.length), row.id);
  }
  return ids;
}

/**
 * Create pack records in reference order, adding each new id to `ids`. With `strict`,
 * a record whose references cannot be resolved throws; without it, it is skipped and named.
 */
async function createPackRecords(
  records: SitePackRecord[],
  ids: Map<string, string>,
  strict: boolean,
): Promise<{ created: string[]; unresolved: string[] }> {
  const { adapter } = await import("@/lib/data/adapter");
  const fixture = await import("@/lib/fixtures/record-instances");
  const create = adapter.createRecord
    ? (input: Parameters<typeof fixture.createInstance>[0]) => adapter.createRecord!(input)
    : async (input: Parameters<typeof fixture.createInstance>[0]) => fixture.createInstance(input);
  let pending = records.filter((record) => !ids.has(record.key));
  const created: string[] = [];
  while (pending.length) {
    const ready = pending.filter((record) =>
      tokensIn(JSON.stringify(record.data)).every((key) => ids.has(key)),
    );
    if (!ready.length) {
      if (strict) throw new Error(`Site pack: unresolved references in ${pending.map((r) => r.key).join(", ")}`);
      return { created, unresolved: pending.map((r) => r.key) };
    }
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
      created.push(record.key);
    }
    pending = pending.filter((record) => !ready.includes(record));
  }
  return { created, unresolved: [] };
}

type PackCanvas = Record<string, unknown> & { id?: string; slug?: string };

function packCanvases(settings: Record<string, unknown>): PackCanvas[] {
  const builder = settings.page_builder as { canvases?: PackCanvas[] } | undefined;
  return Array.isArray(builder?.canvases) ? builder.canvases : [];
}

/** Every item of the pack, as the ledger names them ("record:<key>", "canvas:<id>"). */
export function sitePackItems(current: SitePack = sitePack()): string[] {
  return [
    ...current.records.map((record) => `record:${record.key}`),
    ...packCanvases(current.settings).flatMap((canvas) => (canvas.id ? [`canvas:${canvas.id}`] : [])),
  ];
}

/**
 * Create the pack records (reusing any that already carry the pack `external_id`), then
 * write the pack settings. Runs only when the install has no site yet.
 */
export async function installSitePack(): Promise<{ records: number }> {
  const current = sitePack();
  if (!current.records.length && !Object.keys(current.settings).length) return { records: 0 };
  const ids = await packRecordIds();
  const { created } = await createPackRecords(current.records, ids, true);

  const settings = JSON.parse(resolveTokens(JSON.stringify(current.settings), ids));
  // 1.0.19: the install has every item of this pack; the upgrade step adds only newer ones.
  settings.site_pack_added = sitePackItems(current);
  const { upsertSiteSettingsFixture, flushSiteSettings } = await import("@/lib/fixtures/site-settings");
  upsertSiteSettingsFixture(settings);
  await flushSiteSettings();
  const { isPostgresDataSource } = await import("@/lib/db/data-source");
  if (isPostgresDataSource()) {
    // Brand and sky have their own columns; public pages read them from there.
    const { upsertSiteSettingsDb } = await import("@/lib/db/settings-store");
    await upsertSiteSettingsDb(settings);
  }
  return { records: created.length };
}

const PENDING_KEY = "__versaSitePackPending__";

/** Set by boot when the install has no site yet. */
export function markSitePackPending(): void {
  (globalThis as Record<string, unknown>)[PENDING_KEY] = true;
}

const INSTALL_KEY = "__versaSitePackInstall__";

/**
 * Boot step: install the pack once, after Rendering Drivers exist. Start-up code can load
 * in more than one bundle; every caller gets the same run, so the later steps (page
 * refresh, additions) wait until a fresh install is complete.
 */
export function installSitePackIfPending(): Promise<void> {
  const g = globalThis as Record<string, unknown>;
  const running = g[INSTALL_KEY] as Promise<void> | undefined;
  if (running) return running;
  if (!g[PENDING_KEY]) return Promise.resolve();
  g[PENDING_KEY] = false;
  const run = installSitePack()
    .then((result) => console.log(`Site pack installed: ${result.records} records.`))
    .catch((err) => console.error("Site pack install failed:", err));
  g[INSTALL_KEY] = run;
  return run;
}

/**
 * Boot step (1.0.16): bring site-pack Pages records up to this release's
 * bodies on an existing install. Only pages still exactly as an earlier pack
 * shipped them are replaced; edited pages stay and are named in the log.
 */
export async function refreshSitePackPages(): Promise<{ updated: string[]; kept: string[] }> {
  // Start-up can load this module more than once in a process; refresh once.
  const g = globalThis as Record<string, unknown>;
  if (g.__versaSitePackRefreshed__) return { updated: [], kept: [] };
  g.__versaSitePackRefreshed__ = true;
  await installSitePackIfPending();
  const current = sitePack();
  const shipped = (history as { pages?: Record<string, string[]> }).pages ?? {};
  const { adapter } = await import("@/lib/data/adapter");
  if (!adapter.listRecords || !adapter.updateRecord) return { updated: [], kept: [] };
  const existing = await adapter.listRecords({});
  const byKey = new Map<string, (typeof existing)[number]>();
  const ids = new Map<string, string>();
  for (const row of existing) {
    const ext = String(row.data?.external_id ?? "");
    if (!ext.startsWith(SITE_PACK_PREFIX)) continue;
    byKey.set(ext.slice(SITE_PACK_PREFIX.length), row);
    ids.set(ext.slice(SITE_PACK_PREFIX.length), row.id);
  }
  // Ids on this install back to pack tokens, so bodies compare with what was shipped.
  const toTokens = (text: string) => {
    let out = text;
    for (const [key, id] of ids) out = out.split(id).join(sitePackToken(key));
    return out;
  };
  const updated: string[] = [];
  const kept: string[] = [];
  for (const record of current.records) {
    if (record.type_api_name !== "page") continue;
    const row = byKey.get(record.key);
    const packBody = record.data.body_html;
    if (!row || typeof packBody !== "string") continue;
    const installBody = toTokens(String(row.data?.body_html ?? ""));
    const decision = decidePageRefresh(installBody, packBody, shipped[record.key] ?? []);
    if (decision === "current") continue;
    if (decision === "edited") {
      kept.push(record.name);
      continue;
    }
    const data = { ...(row.data ?? {}), body_html: resolveTokens(packBody, ids) } as Record<string, string>;
    const result = await adapter.updateRecord(row.id, { data });
    if (result.ok) updated.push(record.name);
  }
  if (updated.length) console.log(`Site pack: updated ${updated.join(", ")}.`);
  if (kept.length) console.log(`Site pack: ${kept.join(", ")} edited on this install; left as is.`);
  return { updated, kept };
}

type PackHistory = {
  pages?: Record<string, string[]>;
  /** Canvases as earlier packs shipped them (pack tokens), by canvas id. */
  canvases?: Record<string, PackCanvas[]>;
  /** Items earlier packs shipped: an install from before 1.0.19 has had these already. */
  offered?: string[];
};

/** JSON with sorted keys, so equal values compare equal. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

/**
 * The canvas changes of one start-up, worked out without touching storage (unit-tested).
 * - A pack canvas this install never had is added, unless its address is taken or the
 *   install has no room; then it is named in `skipped`.
 * - On a canvas the install has, a setting still exactly as an earlier pack shipped it
 *   takes this pack's value. A setting changed on the install is kept.
 * `installCanvases` are in pack-token form; the result is too.
 */
export function planCanvasChanges(args: {
  packCanvases: PackCanvas[];
  installCanvases: PackCanvas[];
  shipped: Record<string, PackCanvas[]>;
  known: (item: string) => boolean;
  maxCanvases: number;
}): { canvases: PackCanvas[]; added: string[]; updated: string[]; skipped: string[] } {
  const canvases = args.installCanvases.map((canvas) => ({ ...canvas }));
  const added: string[] = [];
  const updated: string[] = [];
  const skipped: string[] = [];
  for (const pack of args.packCanvases) {
    if (!pack.id) continue;
    const mine = canvases.find((canvas) => canvas.id === pack.id);
    if (!mine) {
      if (args.known(`canvas:${pack.id}`)) continue;
      const label = String(pack.label ?? pack.id);
      if (canvases.some((canvas) => canvas.slug && canvas.slug === pack.slug)) {
        skipped.push(`${label} (/p/${pack.slug} is taken)`);
        continue;
      }
      if (canvases.length >= args.maxCanvases) {
        skipped.push(`${label} (${args.maxCanvases} canvases already)`);
        continue;
      }
      canvases.push({ ...pack });
      added.push(`canvas:${pack.id}`);
      continue;
    }
    const earlier = args.shipped[pack.id] ?? [];
    const changed: string[] = [];
    for (const [key, value] of Object.entries(pack)) {
      if (key === "id") continue;
      if (canonical(mine[key]) === canonical(value)) continue;
      if (earlier.some((old) => canonical(old[key]) === canonical(mine[key]))) {
        mine[key] = value;
        changed.push(key);
      }
    }
    if (changed.length) updated.push(`${String(pack.label ?? pack.id)} (${changed.join(", ")})`);
  }
  return { canvases, added, updated, skipped };
}

/**
 * Boot step (1.0.19): bring an existing install up to this release's site pack.
 * Adds pack records and canvases it never had (once: one deleted on the install stays
 * deleted), and updates canvas settings still exactly as an earlier pack shipped them.
 * Page bodies are refreshPages' job (refreshSitePackPages). Nothing edited here is overwritten.
 */
export async function applySitePackAdditions(): Promise<{ added: string[]; updated: string[]; skipped: string[] }> {
  const g = globalThis as Record<string, unknown>;
  if (g.__versaSitePackAdditions__) return { added: [], updated: [], skipped: [] };
  g.__versaSitePackAdditions__ = true;
  await installSitePackIfPending();
  const current = sitePack();
  const past = history as PackHistory;
  const { getSiteSettingsFixture, upsertSiteSettingsFixture, flushSiteSettings } = await import(
    "@/lib/fixtures/site-settings"
  );
  const site = getSiteSettingsFixture();
  const ledger = new Set(site.site_pack_added ?? past.offered ?? []);
  const known = (item: string) => ledger.has(item);

  // Records first: new canvases point at new pages.
  const ids = await packRecordIds();
  const wanted = current.records.filter((record) => !ids.has(record.key) && !known(`record:${record.key}`));
  const { created, unresolved } = await createPackRecords(wanted, ids, false);

  const { MAX_CANVASES } = await import("@/lib/public/page-builder");
  const reverse = new Map([...ids].map(([key, id]) => [id, key]));
  const toTokens = (value: unknown) =>
    JSON.parse(
      JSON.stringify(value).replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, (id) =>
        reverse.has(id) ? sitePackToken(reverse.get(id)!) : id,
      ),
    );
  const builder = (site.page_builder ?? {}) as { canvases?: PackCanvas[]; custom?: PackCanvas };
  const plan = planCanvasChanges({
    packCanvases: packCanvases(current.settings),
    installCanvases: toTokens(builder.canvases ?? []) as PackCanvas[],
    shipped: past.canvases ?? {},
    known,
    maxCanvases: MAX_CANVASES,
  });

  const addedItems = [...created.map((key) => `record:${key}`), ...plan.added];
  const changedCanvases = plan.added.length > 0 || plan.updated.length > 0;
  const firstLedger = site.site_pack_added === undefined;
  if (changedCanvases || addedItems.length || firstLedger) {
    const canvases = JSON.parse(resolveTokens(JSON.stringify(plan.canvases), ids)) as PackCanvas[];
    upsertSiteSettingsFixture({
      ...(changedCanvases
        ? { page_builder: { ...(site.page_builder as object), canvases, custom: canvases[0] } as never }
        : {}),
      site_pack_added: [...new Set([...ledger, ...addedItems])],
    });
    await flushSiteSettings();
  }
  const added = [...created, ...plan.added];
  if (added.length) console.log(`Site pack: added ${added.join(", ")}.`);
  if (plan.updated.length) console.log(`Site pack: updated canvas ${plan.updated.join("; ")}.`);
  const skipped = [...plan.skipped, ...unresolved.map((key) => `${key} (refers to a pack record removed on this install)`)];
  if (skipped.length) console.log(`Site pack: not added ${skipped.join("; ")}.`);
  return { added, updated: plan.updated, skipped };
}
