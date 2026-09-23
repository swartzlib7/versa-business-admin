import { captureStatLineDb, listStatLinesDb } from "@/lib/db/stat-lines-store";
import { upsertSiteSettingsFixture } from "@/lib/fixtures/site-settings";
import { clearedPageBuilder } from "@/lib/public/page-builder";
import { DRIVER_PAIRING_TYPE, RENDER_DRIVER_TYPE, pairingPayload } from "@/lib/public/driver-pairings";
import { ensureRenderDriverRecords } from "@/lib/public/ensure-render-drivers";
import { demoPageBuilder } from "@/lib/sample-data/demo-canvas";
import { sampleExternalId } from "@/lib/sample-data/pack";

const VISITS = [8, 12, 15, 18, 22, 27];

type Listed = { id: string; data?: Record<string, unknown> };

async function recordsOf(type?: string): Promise<Listed[]> {
  const { adapter } = await import("@/lib/data/adapter");
  if (!adapter.listRecords) return [];
  return adapter.listRecords(type ? { type_api_name: type } : {});
}

function idFor(rows: Listed[], externalId: string): string {
  const row = rows.find((item) => item.data?.external_id === externalId);
  if (!row) throw new Error(`Sample record missing: ${externalId}`);
  return row.id;
}

/** Bind demo Elements onto the Primary canvas and the Overview canvas. */
export async function installDemoCanvas(): Promise<void> {
  await ensureRenderDriverRecords();
  const rows = await recordsOf();
  const drivers = await recordsOf(RENDER_DRIVER_TYPE);
  const driverId = (code: string) => {
    const row = drivers.find((item) => item.data?.code_key === code);
    if (!row) throw new Error(`Rendering driver missing: ${code}`);
    return row.id;
  };
  const page = (key: string) => idFor(rows, sampleExternalId("page", key));
  const statistics = idFor(rows, sampleExternalId("stat", "visits"));
  const location = idFor(rows, sampleExternalId("location", "hq"));

  const specs = [
    { key: "facets", name: "Facets", code: "page-header", type: "page", target: page("facets") },
    { key: "integrations", name: "Integrations", code: "page-header", type: "page", target: page("integrations") },
    { key: "inspections", name: "Inspections & Reports", code: "page-header", type: "page", target: page("inspections") },
    { key: "knowledge", name: "Knowledge", code: "page-header", type: "page", target: page("knowledge") },
    { key: "about", name: "About", code: "page-header", type: "page", target: page("about") },
    { key: "statistics", name: "Sample monthly visits", code: "statistics-header", type: "statistics", target: statistics },
    { key: "location", name: "Sample HQ", code: "location-header", type: "location", target: location },
  ] as const;

  const { adapter } = await import("@/lib/data/adapter");
  const pairings: Record<string, string> = {};
  for (const spec of specs) {
    const externalId = sampleExternalId("pairing", spec.key);
    const existing = rows.find((item) => item.data?.external_id === externalId);
    if (existing) {
      pairings[spec.key] = existing.id;
      continue;
    }
    const data = {
      ...pairingPayload({
        driverRecordId: driverId(spec.code),
        codeKey: spec.code,
        targetType: spec.type,
        targetId: spec.target,
        selectionMode: "one",
      }),
      external_id: externalId,
    };
    const created = adapter.createRecord
      ? await adapter.createRecord({
          type_api_name: DRIVER_PAIRING_TYPE,
          parent_kind: "environment",
          parent_api_name: "custom",
          name: spec.name,
          status: "active",
          data,
        })
      : { ok: false as const, code: "NO_ADAPTER", message: "Records adapter is not available." };
    if (!created.ok) throw new Error(created.message);
    pairings[spec.key] = created.instance.id;
  }

  const lines = await listStatLinesDb(statistics);
  const filled = new Set(
    lines.filter((line) => line.value.trim() !== "").map((line) => line.slot),
  );
  for (let slot = 0; slot < VISITS.length; slot += 1) {
    if (filled.has(slot)) continue;
    const captured = await captureStatLineDb({
      headerId: statistics,
      series: 1,
      slot,
      value: VISITS[slot],
      source: "script",
    });
    if (!captured.ok) throw new Error(captured.message);
  }

  upsertSiteSettingsFixture({
    demo_mode: true,
    page_builder: demoPageBuilder({
      pages: {
        facets: page("facets"),
        integrations: page("integrations"),
        inspections: page("inspections"),
        knowledge: page("knowledge"),
        about: page("about"),
      },
      statistics,
      location,
      pairings: {
        facets: pairings.facets,
        integrations: pairings.integrations,
        inspections: pairings.inspections,
        knowledge: pairings.knowledge,
        about: pairings.about,
        statistics: pairings.statistics,
        location: pairings.location,
      },
    }),
  });
}

export function resetDemoCanvas(): void {
  upsertSiteSettingsFixture({
    demo_mode: false,
    page_builder: clearedPageBuilder(),
  });
}

