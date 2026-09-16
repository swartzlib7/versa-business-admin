import { adapter } from "@/lib/data/adapter";
import { createInstance, listInstances } from "@/lib/fixtures/record-instances";
import { RENDER_DRIVER_TYPE } from "@/lib/public/driver-pairings";
import {
  DRIVER_RENDER_CATALOG,
  PAIRABLE_DRIVER_IDS,
  type DriverCatalogEntry,
} from "@/lib/public/render-drivers";

function recipeLinesFor(row: DriverCatalogEntry) {
  return row.outputs.map((out) => ({
    line_group: "recipes",
    data: {
      recipe_key: out.id,
      recipe_label: out.label,
      recipe_tiles: out.tiles != null ? String(out.tiles) : "",
    },
  }));
}

function headerData(row: DriverCatalogEntry) {
  return {
    name: row.label,
    code_key: row.id,
    bind_shape: row.bindShape,
    compatible_record_type: row.compatibleTypes.join(","),
    inputs_json: JSON.stringify(row.inputs),
    outputs_json: JSON.stringify(row.outputs),
    supports_filter: row.supportsFilter ? "true" : "false",
    supports_pagination: row.supportsPagination ? "true" : "false",
    description: row.description ?? "",
    created_by: "user-coa",
    last_modified_by: "user-coa",
  };
}

/** Idempotent seed of Rendering Driver headers + recipe lines from the code registry. */
export async function ensureRenderDriverRecords(): Promise<void> {
  const existing = adapter.listRecords
    ? await adapter.listRecords({ type_api_name: RENDER_DRIVER_TYPE })
    : listInstances({ type_api_name: RENDER_DRIVER_TYPE });
  const byKey = new Map(
    existing.map((row) => [String(row.data?.code_key ?? "").trim(), row] as const).filter(([key]) => key),
  );

  for (const id of PAIRABLE_DRIVER_IDS) {
    const row = DRIVER_RENDER_CATALOG[id];
    const seedId = `rd-${id}`;
    const have = byKey.get(row.id) ?? existing.find((r) => r.id === seedId);
    const lines = recipeLinesFor(row);
    if (!have) {
      const input = {
        id: seedId,
        type_api_name: RENDER_DRIVER_TYPE,
        parent_kind: "environment" as const,
        parent_api_name: "custom",
        name: row.label,
        status: "active",
        data: headerData(row),
        lines,
      };
      if (adapter.createRecord) {
        await adapter.createRecord(input, { createdBy: "user-coa" });
      } else {
        createInstance(input);
      }
      continue;
    }
    const full = adapter.getRecord ? await adapter.getRecord(have.id) : have;
    if ((full?.lines?.length ?? 0) > 0) continue;
    if (adapter.updateRecord) {
      await adapter.updateRecord(have.id, { lines });
    }
  }
}
