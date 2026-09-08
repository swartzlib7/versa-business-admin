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
import {
  LEGACY_CATALOG_OVERLAY_ID,
  resolveCatalogOverlayId,
} from "@/lib/catalog/overlay-scope";

export const CATALOG_OVERLAY_ID = LEGACY_CATALOG_OVERLAY_ID;
/** D4 v1 — stamp of the product seed pack last merged into this overlay. */
export const CATALOG_SEED_PACK = "0.7.133";

export type InstalledAgentPackage = {
  id: string;
  version: string;
  enabled: boolean;
  installed_at: string;
};

export interface CatalogOverlay {
  version: 1;
  seed_pack?: string;
  organization_id?: string;
  saved_at: string;
  fields: FieldDefinition[];
  valueSets: ValueSet[];
  valueSetItems: ValueSetItem[];
  layouts: LayoutDefinition[];
  objects: ObjectDefinition[];
  recordTypes: RecordTypeDefinition[];
  layoutConfigs: LayoutConfig[];
  /** D5 — packages merged into this overlay. Uninstall hides; it does not delete tenant rows. */
  installed_packages?: InstalledAgentPackage[];
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
    installed_packages: [],
  };
}

function parseOverlayBody(raw: Partial<CatalogOverlay> | null | undefined): CatalogOverlay | null {
  if (!raw || typeof raw !== "object") return null;
  return {
    version: 1,
    seed_pack: typeof raw.seed_pack === "string" ? raw.seed_pack : undefined,
    organization_id: typeof raw.organization_id === "string" ? raw.organization_id : undefined,
    saved_at: typeof raw.saved_at === "string" ? raw.saved_at : new Date().toISOString(),
    fields: Array.isArray(raw.fields) ? raw.fields : [],
    valueSets: Array.isArray(raw.valueSets) ? raw.valueSets : [],
    valueSetItems: Array.isArray(raw.valueSetItems) ? raw.valueSetItems : [],
    layouts: Array.isArray(raw.layouts) ? raw.layouts : [],
    objects: Array.isArray(raw.objects) ? raw.objects : [],
    recordTypes: Array.isArray(raw.recordTypes) ? raw.recordTypes : [],
    layoutConfigs: Array.isArray(raw.layoutConfigs) ? raw.layoutConfigs : [],
    installed_packages: Array.isArray(raw.installed_packages)
      ? raw.installed_packages.filter(
          (row): row is InstalledAgentPackage =>
            !!row &&
            typeof row === "object" &&
            typeof (row as InstalledAgentPackage).id === "string" &&
            typeof (row as InstalledAgentPackage).version === "string",
        )
      : [],
  };
}

export function readOverlayFile(): CatalogOverlay | null {
  const mem = readMemory();
  if (mem) return mem;
  try {
    const raw = fs.readFileSync(FILE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<CatalogOverlay>;
    const overlay = parseOverlayBody(parsed);
    if (!overlay) return null;
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

async function readOverlayRow(
  db: Awaited<ReturnType<typeof import("@/lib/db/client").getDb>>,
  catalogOverlay: typeof import("@/lib/db/schema").catalogOverlay,
  eq: typeof import("drizzle-orm").eq,
  id: string,
): Promise<CatalogOverlay | null> {
  const rows = await db.select().from(catalogOverlay).where(eq(catalogOverlay.id, id)).limit(1);
  if (!rows.length) return null;
  return parseOverlayBody(rows[0].body as Partial<CatalogOverlay>);
}

export async function readOverlayPostgres(): Promise<CatalogOverlay | null> {
  try {
    const { getDb } = await import("@/lib/db/client");
    const { catalogOverlay } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");
    const db = getDb();
    const orgId = await resolveCatalogOverlayId();
    const scoped = await readOverlayRow(db, catalogOverlay, eq, orgId);
    if (scoped) return { ...scoped, organization_id: orgId };
    if (orgId === LEGACY_CATALOG_OVERLAY_ID) return null;
    const legacy = await readOverlayRow(db, catalogOverlay, eq, LEGACY_CATALOG_OVERLAY_ID);
    if (!legacy) return null;
    const migrated = { ...legacy, organization_id: orgId };
    await writeOverlayPostgres(migrated);
    return migrated;
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
    const orgId = overlay.organization_id || (await resolveCatalogOverlayId());
    const next = {
      ...overlay,
      version: 1 as const,
      organization_id: orgId,
      seed_pack: overlay.seed_pack ?? CATALOG_SEED_PACK,
      saved_at: new Date().toISOString(),
    };
    await db
      .insert(catalogOverlay)
      .values({ id: orgId, body: next })
      .onConflictDoUpdate({
        target: catalogOverlay.id,
        set: { body: next, updatedAt: new Date() },
      });
  } catch (err) {
    console.error("Catalog overlay postgres write skipped:", err);
  }
}
