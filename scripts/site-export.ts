/**
 * Write the install site pack (src/lib/site-pack/site-pack.json) from this instance's live site.
 * Takes the site settings plus every record they reference (Pages records, Elements), following
 * Element targets. Record ids become `{{site:<key>}}` tokens. Demo canvases and the settings in
 * SITE_PACK_EXCLUDED_SETTINGS stay out.
 *
 * Usage: npm run site:export   (reads DATABASE_URL from .env.local), then commit the JSON.
 */
import fs from "node:fs";
import path from "node:path";

(globalThis as Record<string, unknown>).__versaSampleDataHydrated__ = true;
const ENV_LOADER = "./load-env-local.mjs";

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g;
const DROP_DATA = new Set(["id", "name", "status", "created_at", "updated_at", "external_id"]);

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
  const { SITE_PACK_EXCLUDED_SETTINGS, sitePackToken } = await import(`${root}/src/lib/site-pack/index.ts`);

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
  fs.writeFileSync(out, `${JSON.stringify(pack, null, 2)}\n`);
  console.log(`Site pack ${version}: ${records.length} records -> ${path.relative(root, out)}`);
  for (const record of records) console.log(`  ${record.key}`);
  process.exit(0);
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
