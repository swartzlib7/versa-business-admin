import { adapter } from "@/lib/data/adapter";
import { createInstance, listInstances } from "@/lib/fixtures/record-instances";
import {
  getSiteSettingsFixture,
  upsertSiteSettingsFixture,
} from "@/lib/fixtures/site-settings";
import { DRIVER_PAIRING_TYPE, RENDER_DRIVER_TYPE } from "@/lib/public/driver-pairings";
import {
  DRIVER_RENDER_CATALOG,
  PAIRABLE_DRIVER_IDS,
  foldLegacyDriver,
  type DriverCatalogEntry,
} from "@/lib/public/render-drivers";
import { normalizePageBuilder, remapPairingIds } from "@/lib/public/page-builder";

const LEFTOVER_DRIVER_KEYS = [
  "recipe_key",
  "recipe_label",
  "recipe_tiles",
  "inputs_json",
  "outputs_json",
  "supports_filter",
  "supports_pagination",
] as const;

function headerData(row: DriverCatalogEntry) {
  return {
    name: row.label,
    code_key: row.id,
    bind_shape: row.bindShape,
    compatible_record_type: row.recordType,
    description: row.description ?? "",
    created_by: "user-coa",
    last_modified_by: "user-coa",
  };
}

function asData(data: Record<string, unknown> | undefined): Record<string, string> {
  const leftover = new Set<string>(LEFTOVER_DRIVER_KEYS);
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(data ?? {})) {
    if (leftover.has(key) || value == null) continue;
    next[key] = typeof value === "string" ? value : String(value);
  }
  return next;
}

async function listByType(type: string) {
  return adapter.listRecords
    ? await adapter.listRecords({ type_api_name: type })
    : listInstances({ type_api_name: type });
}

/** Seed one driver per Shape + type. Fold leftover code-key rows onto those records. */
export async function ensureRenderDriverRecords(): Promise<void> {
  const existing = await listByType(RENDER_DRIVER_TYPE);
  const byKey = new Map(
    existing.map((row) => [String(row.data?.code_key ?? "").trim(), row] as const).filter(([key]) => key),
  );

  for (const id of PAIRABLE_DRIVER_IDS) {
    const row = DRIVER_RENDER_CATALOG[id];
    const seedId = `rd-${id}`;
    const have = byKey.get(row.id) ?? existing.find((r) => r.id === seedId);
    if (!have) {
      const input = {
        id: seedId,
        type_api_name: RENDER_DRIVER_TYPE,
        parent_kind: "environment" as const,
        parent_api_name: "custom",
        name: row.label,
        status: "active",
        data: headerData(row),
      };
      try {
        if (adapter.createRecord) await adapter.createRecord(input, { createdBy: "user-coa" });
        else createInstance(input);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (!/duplicate key|already exists/i.test(message)) throw err;
      }
    }
  }

  const refreshed = await listByType(RENDER_DRIVER_TYPE);
  const newByKey = new Map(
    refreshed.map((row) => [String(row.data?.code_key ?? "").trim(), row] as const).filter(([key]) => key),
  );

  const pairings = await listByType(DRIVER_PAIRING_TYPE);
  const pairingRemap = new Map<string, string>();

  for (const pairing of pairings) {
    const oldDriverId = String(pairing.data?.driver_id ?? "").trim();
    if (!oldDriverId) continue;
    const oldDriver = refreshed.find((d) => d.id === oldDriverId);
    const oldKey = String(oldDriver?.data?.code_key ?? oldDriverId.replace(/^rd-/, "")).trim();
    const targetType = String(pairing.data?.target_record_type ?? "").trim();
    const folded = foldLegacyDriver(oldKey, targetType);
    const nextDriver = newByKey.get(folded.id);
    if (!nextDriver || nextDriver.id === oldDriverId) continue;
    const data = asData(pairing.data as Record<string, unknown> | undefined);
    data.driver_id = nextDriver.id;
    if (adapter.updateRecord) {
      await adapter.updateRecord(pairing.id, { data });
    }
  }

  const keepIds = new Set(
    PAIRABLE_DRIVER_IDS.map((id) => newByKey.get(id)?.id).filter((id): id is string => Boolean(id)),
  );
  for (const row of refreshed) {
    const key = String(row.data?.code_key ?? "").trim();
    if (keepIds.has(row.id) || PAIRABLE_DRIVER_IDS.includes(key as (typeof PAIRABLE_DRIVER_IDS)[number])) {
      const wanted = DRIVER_RENDER_CATALOG[key];
      if (!wanted) continue;
      const data = asData(row.data as Record<string, unknown> | undefined);
      let changed = data.bind_shape !== wanted.bindShape || data.code_key !== wanted.id;
      data.code_key = wanted.id;
      data.bind_shape = wanted.bindShape;
      if (!String(data.compatible_record_type ?? "").trim()) {
        data.compatible_record_type = wanted.recordType;
        changed = true;
      }
      if ((row.lines?.length ?? 0) > 0 || changed) {
        if (adapter.updateRecord) {
          await adapter.updateRecord(row.id, {
            data,
            ...(row.lines?.length ? { lines: [] } : {}),
          });
        }
      }
      continue;
    }
    if (adapter.deleteRecord) await adapter.deleteRecord(row.id);
  }

  const pb = normalizePageBuilder(getSiteSettingsFixture().page_builder);
  let cellChanged = false;
  const rewrite = (rows: typeof pb.home_sections) =>
    (rows ?? []).map((section) => ({
      ...section,
      cells: (section.cells ?? []).map((cell) => {
        if (!cell.driver) return cell;
        const folded = foldLegacyDriver(cell.driver, cell.recordType);
        if (folded.id === cell.driver && !folded.output) return cell;
        cellChanged = true;
        return {
          ...cell,
          driver: folded.id,
          renderOutput: cell.renderOutput || folded.output,
        };
      }),
    }));
  const home_sections = rewrite(pb.home_sections);
  const canvases = (pb.canvases ?? []).map((canvas) => ({
    ...canvas,
    sections: rewrite(canvas.sections),
  }));
  if (cellChanged) {
    const next = {
      ...pb,
      home_sections,
      canvases,
      custom: canvases[0]
        ? { ...pb.custom, ...canvases[0], sections: canvases[0].sections }
        : { ...pb.custom, sections: rewrite(pb.custom.sections) },
    };
    upsertSiteSettingsFixture({ page_builder: remapPairingIds(next, pairingRemap) });
  }
}
