/**
 * Durable catalog overlay — fields, layouts, value sets, custom record types.
 *
 * System seed stays in TypeScript fixtures. Tenant customizations persist
 * to .data/catalog.json (and catalog_overlay in Postgres when DATA_SOURCE=postgres).
 * Hydrate = seed ∪ overlay (system rows never deleted; custom rows come from overlay).
 */
import fs from "fs";
import path from "path";
import type { FieldDefinition, LayoutDefinition, ObjectDefinition, ValueSet, ValueSetItem } from "@/lib/fixtures/catalog";
import type { RecordTypeDefinition } from "@/lib/fixtures/record-types";
import type { LayoutConfig } from "@/lib/catalog/layout-storage";

export const CATALOG_OVERLAY_ID = "site";
/** D4 v1 — stamp of the product seed pack last merged into this overlay. */
export const CATALOG_SEED_PACK = "0.7.106";

export interface CatalogOverlay {
  version: 1;
  seed_pack?: string;
  saved_at: string;
  fields: FieldDefinition[];
  valueSets: ValueSet[];
  valueSetItems: ValueSetItem[];
  layouts: LayoutDefinition[];
  objects: ObjectDefinition[];
  recordTypes: RecordTypeDefinition[];
  layoutConfigs: LayoutConfig[];
}

const FILE_PATH = path.join(process.cwd(), ".data", "catalog.json");
const GLOBAL_KEY = "__versaCatalogOverlay__";

function readMemory(): CatalogOverlay | null {
  return (
    ((globalThis as Record<string, unknown>)[GLOBAL_KEY] as CatalogOverlay | null) ??
    null
  );
}

function writeMemory(value: CatalogOverlay): void {
  (globalThis as Record<string, unknown>)[GLOBAL_KEY] = value;
}

export function emptyOverlay(): CatalogOverlay {
  return {
    version: 1,
    seed_pack: CATALOG_SEED_PACK,
    saved_at: new Date().toISOString(),
    fields: [],
    valueSets: [],
    valueSetItems: [],
    layouts: [],
    objects: [],
    recordTypes: [],
    layoutConfigs: [],
  };
}

export function readOverlayFile(): CatalogOverlay | null {
  const mem = readMemory();
  if (mem) return mem;
  try {
    const raw = fs.readFileSync(FILE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<CatalogOverlay>;
    if (!parsed || typeof parsed !== "object") return null;
    const overlay: CatalogOverlay = {
      version: 1,
      seed_pack: typeof parsed.seed_pack === "string" ? parsed.seed_pack : undefined,
      saved_at: typeof parsed.saved_at === "string" ? parsed.saved_at : new Date().toISOString(),
      fields: Array.isArray(parsed.fields) ? parsed.fields : [],
      valueSets: Array.isArray(parsed.valueSets) ? parsed.valueSets : [],
      valueSetItems: Array.isArray(parsed.valueSetItems) ? parsed.valueSetItems : [],
      layouts: Array.isArray(parsed.layouts) ? parsed.layouts : [],
      objects: Array.isArray(parsed.objects) ? parsed.objects : [],
      recordTypes: Array.isArray(parsed.recordTypes) ? parsed.recordTypes : [],
      layoutConfigs: Array.isArray(parsed.layoutConfigs) ? parsed.layoutConfigs : [],
    };
    writeMemory(overlay);
    return overlay;
  } catch {
    return null;
  }
}

export function writeOverlayFile(overlay: CatalogOverlay): void {
  const next = {
    ...overlay,
    version: 1 as const,
    seed_pack: overlay.seed_pack ?? CATALOG_SEED_PACK,
    saved_at: new Date().toISOString(),
  };
  writeMemory(next);
  try {
    fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
    fs.writeFileSync(FILE_PATH, JSON.stringify(next, null, 2));
  } catch (err) {
    console.error("Failed to persist catalog overlay:", err);
  }
}

export async function readOverlayPostgres(): Promise<CatalogOverlay | null> {
  try {
    const { getDb } = await import("@/lib/db/client");
    const { catalogOverlay } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");
    const db = getDb();
    const rows = await db
      .select()
      .from(catalogOverlay)
      .where(eq(catalogOverlay.id, CATALOG_OVERLAY_ID))
      .limit(1);
    if (!rows.length) return null;
    const body = rows[0].body as Partial<CatalogOverlay>;
    if (!body || typeof body !== "object") return null;
    return {
      version: 1,
      seed_pack: typeof body.seed_pack === "string" ? body.seed_pack : undefined,
      saved_at: typeof body.saved_at === "string" ? body.saved_at : new Date().toISOString(),
      fields: Array.isArray(body.fields) ? body.fields : [],
      valueSets: Array.isArray(body.valueSets) ? body.valueSets : [],
      valueSetItems: Array.isArray(body.valueSetItems) ? body.valueSetItems : [],
      layouts: Array.isArray(body.layouts) ? body.layouts : [],
      objects: Array.isArray(body.objects) ? body.objects : [],
      recordTypes: Array.isArray(body.recordTypes) ? body.recordTypes : [],
      layoutConfigs: Array.isArray(body.layoutConfigs) ? body.layoutConfigs : [],
    };
  } catch (err) {
    console.error("Catalog overlay postgres read skipped:", err);
    return null;
  }
}

export async function writeOverlayPostgres(overlay: CatalogOverlay): Promise<void> {
  try {
    const { getDb } = await import("@/lib/db/client");
    const { catalogOverlay } = await import("@/lib/db/schema");
    const db = getDb();
    const next = {
      ...overlay,
      version: 1 as const,
      seed_pack: overlay.seed_pack ?? CATALOG_SEED_PACK,
      saved_at: new Date().toISOString(),
    };
    await db
      .insert(catalogOverlay)
      .values({ id: CATALOG_OVERLAY_ID, body: next })
      .onConflictDoUpdate({
        target: catalogOverlay.id,
        set: { body: next, updatedAt: new Date() },
      });
  } catch (err) {
    console.error("Catalog overlay postgres write skipped:", err);
  }
}
