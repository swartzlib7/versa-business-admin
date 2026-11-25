/**
 * Write the install site pack (src/lib/site-pack/site-pack.json) from this instance's live site.
 * Takes the site settings plus every record they reference (Pages records, Elements), following
 * Element targets. Record ids become `{{site:<key>}}` tokens. Demo canvases and the settings in
 * SITE_PACK_EXCLUDED_SETTINGS stay out.
 *
 * Usage: npm run site:export   (reads DATABASE_URL from .env.local), then commit the JSON
 * and site-pack-history.json (hashes of page bodies the previous pack shipped).
 */
import fs from "node:fs";
import path from "node:path";

(globalThis as Record<string, unknown>).__versaSampleDataHydrated__ = true;
const ENV_LOADER = "./load-env-local.mjs";

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g;
type History = {
  about?: string;
  pages: Record<string, string[]>;
  canvases?: Record<string, Array<Record<string, unknown>>>;
  offered?: string[];
};

// Audit stamps name users of the exporting instance; a pack never carries them.
const DROP_DATA = new Set(["id", "name", "status", "created_at", "updated_at", "external_id", "created_by", "last_modified_by"]);

type Row = {
  id: string;
  type_api_name: string;
  parent_kind: string;
  parent_api_name: string;
  name: string;
  status: string;
  data?: Record<string, unknown>;
};

function slug(text: string): string {
  return text
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const { loadEnvLocal } = await import(ENV_LOADER);
  loadEnvLocal();
  const root = process.cwd();
  const { hydrateSiteSettings, getPublicSiteSettings } = await import(`${root}/src/lib/fixtures/site-settings.ts`);
  const { adapter } = await import(`${root}/src/lib/data/adapter.ts`);
  const { DEMO_CANVAS_IDS } = await import(`${root}/src/lib/sample-data/demo-canvas.ts`);
  const { SITE_PACK_EXCLUDED_SETTINGS, sitePackToken, sitePackItems } = await import(`${root}/src/lib/site-pack/index.ts`);

  await hydrateSiteSettings();
  const site = { ...(await getPublicSiteSettings()) } as Record<string, unknown>;
  for (const key of SITE_PACK_EXCLUDED_SETTINGS) delete site[key];
  const demoIds = new Set<string>(DEMO_CANVAS_IDS);
  const builder = site.page_builder as { canvases?: { id?: string }[]; custom?: unknown };
  if (builder?.canvases) {
    builder.canvases = builder.canvases.filter((canvas) => !(canvas.id && demoIds.has(canvas.id)));
    builder.custom = builder.canvases[0];
  }

  const rows = (await adapter.listRecords({})) as Row[];
  const byId = new Map(rows.map((row) => [row.id, row]));
  const picked = new Map<string, Row>();
  const visit = (text: string) => {
    for (const id of text.match(UUID) ?? []) {
      const row = byId.get(id);
      if (!row || picked.has(id)) continue;
      picked.set(id, row);
      visit(JSON.stringify(row.data ?? {}));
    }
  };
  visit(JSON.stringify(site));

  const keys = new Map<string, string>();
  const used = new Set<string>();
  for (const row of picked.values()) {
    const base = `${slug(row.type_api_name)}:${slug(row.name) || "record"}`;
    let key = base;
    for (let n = 2; used.has(key); n += 1) key = `${base}-${n}`;
    used.add(key);
    keys.set(row.id, key);
  }
  const tokenize = (text: string) => text.replace(UUID, (id) => (keys.has(id) ? sitePackToken(keys.get(id)!) : id));

  const records = [...picked.values()].map((row) => {
    const data: Record<string, string> = {};
    for (const [field, value] of Object.entries(row.data ?? {})) {
      if (DROP_DATA.has(field)) continue;
      data[field] = typeof value === "string" ? value : JSON.stringify(value);
    }
    return {
      key: keys.get(row.id)!,
      type_api_name: row.type_api_name,
      parent_kind: row.parent_kind,
      parent_api_name: row.parent_api_name,
      name: row.name,
      status: row.status,
      data: JSON.parse(tokenize(JSON.stringify(data))),
    };
  });
  const settings = JSON.parse(tokenize(JSON.stringify(site)));

  const leftovers = [...new Set(JSON.stringify({ records, settings }).match(UUID) ?? [])];
  if (leftovers.length) console.warn(`Ids with no record (left as is): ${leftovers.join(", ")}`);

  const version = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version as string;
  const out = path.join(root, "src/lib/site-pack/site-pack.json");
  const pack = { version, exported_at: new Date().toISOString(), records, settings };

  // 1.0.16: remember the bodies the previous pack shipped, so existing installs
  // replace a page only while it is still exactly as shipped (refreshSitePackPages).
  const historyPath = path.join(root, "src/lib/site-pack/site-pack-history.json");
  const history = fs.existsSync(historyPath)
    ? (JSON.parse(fs.readFileSync(historyPath, "utf8")) as History)
    : ({ pages: {} } as History);
  if (fs.existsSync(out)) {
    const { bodyHash } = await import(`${root}/src/lib/site-pack/page-refresh.ts`);
    const previous = JSON.parse(fs.readFileSync(out, "utf8")) as {
      version: string;
      exported_at: string;
      records: Array<{ key: string; type_api_name: string; data: Record<string, string> }>;
      settings: Record<string, unknown>;
    };
    const next = new Map(records.map((record) => [record.key, record.data.body_html]));
    for (const old of previous.records) {
      if (old.type_api_name !== "page" || typeof old.data.body_html !== "string") continue;
      if (next.get(old.key) === old.data.body_html) continue;
      const hash = bodyHash(old.data.body_html);
      const list = (history.pages[old.key] ??= []);
      if (!list.includes(hash)) list.push(hash);
    }
    // 1.0.19: canvases as the previous pack shipped them (a setting still equal to one of
    // these takes the new value on upgrade).
    type Canvas = Record<string, unknown> & { id?: string };
    const canvasesOf = (settings: Record<string, unknown>) =>
      ((settings.page_builder as { canvases?: Canvas[] } | undefined)?.canvases ?? []) as Canvas[];
    const nextCanvases = new Map(canvasesOf(settings).map((canvas) => [canvas.id, JSON.stringify(canvas)]));
    history.canvases ??= {};
    for (const old of canvasesOf(previous.settings)) {
      if (!old.id || nextCanvases.get(old.id) === JSON.stringify(old)) continue;
      const list = (history.canvases[old.id] ??= []);
      if (!list.some((seen) => JSON.stringify(seen) === JSON.stringify(old))) list.push(old);
    }
    // `offered` stays as 1.0.19 left it: the items of the packs before the ledger
    // (site_pack_added). Only an install with no ledger reads it, and such an install is on
    // 1.0.18 or older, so it has never had an item a later pack added. Growing the list would
    // make an upgrade that skips versions skip those items too.
    history.offered ??= sitePackItems(previous as never);
    fs.writeFileSync(historyPath, `${JSON.stringify(history, null, 2)}\n`);
  }
  fs.writeFileSync(out, `${JSON.stringify(pack, null, 2)}\n`);
  console.log(`Site pack ${version}: ${records.length} records -> ${path.relative(root, out)}`);
  for (const record of records) console.log(`  ${record.key}`);
  process.exit(0);
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
