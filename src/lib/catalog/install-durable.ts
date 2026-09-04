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

function applyAll(overlay: CatalogOverlay): void {
  hydrating = true;
  try {
    resetCatalog();
    resetRecordTypes();
    applyCatalogOverlay(overlay);
    applyRecordTypeOverlay(overlay);
    applyLayoutOverlay(overlay);
  } finally {
    hydrating = false;
  }
}

function persistNow(): void {
  if (hydrating) return;
  const overlay = liveOverlay();
  writeOverlayFile(overlay);
  if ((process.env.DATA_SOURCE ?? "fixture") === "postgres") {
    void writeOverlayPostgres(overlay);
  }
}

export function ensureDurableCatalog(): void {
  if (hydrated) return;
  hydrated = true;
  const fromFile = readOverlayFile();
  if (fromFile) applyAll(fromFile);
  const stampIfNeeded = (overlay: CatalogOverlay | null) => {
    if ((overlay?.seed_pack ?? "") !== CATALOG_SEED_PACK) persistNow();
  };
  if ((process.env.DATA_SOURCE ?? "fixture") === "postgres") {
    void readOverlayPostgres().then((fromDb) => {
      if (fromDb) applyAll(fromDb);
      stampIfNeeded(fromDb ?? fromFile);
    });
  } else {
    stampIfNeeded(fromFile);
  }
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
