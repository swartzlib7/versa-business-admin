/**
 * Server-only: wire catalog memory to the durable overlay store.
 * Import from Node route handlers / root layout — never from client components.
 */
import {
  applyCatalogOverlay,
  exportCatalogLive,
  installCatalogDurableHooks,
  resetCatalog,
} from "@/lib/fixtures/catalog";
import {
  applyLayoutOverlay,
  exportLayoutConfigs,
  installLayoutDurableHooks,
} from "@/lib/catalog/layout-storage";
import {
  applyRecordTypeOverlay,
  exportRecordTypesLive,
  installRecordTypeDurableHooks,
  resetRecordTypes,
} from "@/lib/fixtures/record-types";
import {
  emptyOverlay,
  readOverlayFile,
  readOverlayPostgres,
  writeOverlayFile,
  writeOverlayPostgres,
  CATALOG_SEED_PACK,
  type CatalogOverlay,
} from "@/lib/catalog/durable";
import { isPostgresDataSource } from "@/lib/db/data-source";

const FLAG = "__versaCatalogDurableInstalled__";

let hydrating = false;
let hydrated = false;

function liveOverlay(): CatalogOverlay {
  return {
    ...emptyOverlay(),
    ...exportCatalogLive(),
    ...exportRecordTypesLive(),
    seed_pack: CATALOG_SEED_PACK,
    layoutConfigs: exportLayoutConfigs(),
  };
}

async function stampOverlay(overlay: CatalogOverlay): Promise<CatalogOverlay> {
  const { resolveCatalogOverlayId } = await import("@/lib/catalog/overlay-scope");
  const organization_id = await resolveCatalogOverlayId();
  return { ...overlay, organization_id };
}

function applyAll(overlay: CatalogOverlay, opts?: { systemSeedWins?: boolean }): void {
  hydrating = true;
  try {
    resetCatalog();
    resetRecordTypes();
    applyCatalogOverlay({ ...overlay, systemSeedWins: opts?.systemSeedWins });
    applyRecordTypeOverlay({ ...overlay, systemSeedWins: opts?.systemSeedWins });
    applyLayoutOverlay(overlay);
  } finally {
    hydrating = false;
  }
}

function persistNow(): void {
  if (hydrating) return;
  const overlay = liveOverlay();
  writeOverlayFile(overlay);
  if (isPostgresDataSource()) {
    void stampOverlay(overlay).then((stamped) => {
      writeOverlayFile(stamped);
      void writeOverlayPostgres(stamped);
    });
  } else {
    void stampOverlay(overlay).then((stamped) => writeOverlayFile(stamped));
  }
}

export function ensureDurableCatalog(): void {
  if (hydrated) return;
  hydrated = true;
  const fromFile = readOverlayFile();
  const rebaseFile = !!fromFile && (fromFile.seed_pack ?? "") !== CATALOG_SEED_PACK;
  if (fromFile) applyAll(fromFile, { systemSeedWins: rebaseFile });
  const stampIfNeeded = (overlay: CatalogOverlay | null) => {
    if ((overlay?.seed_pack ?? "") !== CATALOG_SEED_PACK) persistNow();
  };
  if (isPostgresDataSource()) {
    void readOverlayPostgres().then((fromDb) => {
      const rebaseDb = !!fromDb && (fromDb.seed_pack ?? "") !== CATALOG_SEED_PACK;
      if (fromDb) applyAll(fromDb, { systemSeedWins: rebaseDb });
      stampIfNeeded(fromDb ?? fromFile);
    });
  } else {
    stampIfNeeded(fromFile);
  }
  void import("@/lib/sample-data/apply").then((mod) => {
    void mod.hydrateSampleData();
  });
}

function persistHook(): void {
  if (!hydrated) ensureDurableCatalog();
  persistNow();
}

function hydrateHook(): void {
  ensureDurableCatalog();
}

export function installDurableCatalog(): void {
  const g = globalThis as Record<string, unknown>;
  if (g[FLAG]) {
    ensureDurableCatalog();
    return;
  }
  g[FLAG] = true;
  installCatalogDurableHooks({ hydrate: hydrateHook, persist: persistHook });
  installRecordTypeDurableHooks({ hydrate: hydrateHook, persist: persistHook });
  installLayoutDurableHooks({ hydrate: hydrateHook, persist: persistHook });
  ensureDurableCatalog();
}

installDurableCatalog();
