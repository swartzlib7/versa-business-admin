import { captureStatLineDb, listStatLinesDb } from "@/lib/db/stat-lines-store";
import { getSiteSettingsFixture, upsertSiteSettingsFixture } from "@/lib/fixtures/site-settings";
import {
  MAX_CANVASES,
  clearedPageBuilder,
  nextCanvasSlug,
  normalizePageBuilder,
  rowElementCount,
  type CustomCanvas,
} from "@/lib/public/page-builder";
import { DRIVER_PAIRING_TYPE, RENDER_DRIVER_TYPE, pairingPayload } from "@/lib/public/driver-pairings";
import { ensureRenderDriverRecords } from "@/lib/public/ensure-render-drivers";
import { DEMO_CANVAS_IDS, demoCanvas } from "@/lib/sample-data/demo-canvas";
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

/** Bind demo Elements onto the demo canvas. Primary is never touched. */
export async function installDemoCanvas(opts?: { keepCanvas?: boolean }): Promise<void> {
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
    { key: "integration", name: "Integrations", code: "integration-header", type: "vendor_integration", target: "*", mode: "all" as const },
    { key: "schedule", name: "Schedules", code: "schedule-header", type: "schedule", target: "*", mode: "all" as const },
    { key: "tickets", name: "Support Requests", code: "inspection-header", type: "inspection_report", target: "*", mode: "all" as const },
    { key: "project", name: "Projects", code: "project-header", type: "executive_project", target: "*", mode: "all" as const },
  ] as const;

  const { adapter } = await import("@/lib/data/adapter");
  const pairings: Record<string, string> = {};
  for (const spec of specs) {
    const externalId = sampleExternalId("pairing", spec.key);
    const data = {
      ...pairingPayload({
        driverRecordId: driverId(spec.code),
        codeKey: spec.code,
        targetType: spec.type,
        targetId: spec.target,
        selectionMode: "mode" in spec ? spec.mode : "one",
      }),
      external_id: externalId,
    };
    const existing = rows.find((item) => item.data?.external_id === externalId);
    if (existing) {
      if (adapter.updateRecord) await adapter.updateRecord(existing.id, { name: spec.name, data });
      pairings[spec.key] = existing.id;
      continue;
    }
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

  const demo = demoCanvas({
      pages: {
        facets: page("facets"),
        integrations: page("integrations"),
        inspections: page("inspections"),
        knowledge: page("knowledge"),
        about: page("about"),
      },
      statistics,
      location,
      integration: idFor(rows, sampleExternalId("integration", "quickbooks")),
      schedule: idFor(rows, sampleExternalId("schedule", "buffer")),
      inspection: idFor(rows, sampleExternalId("inspection", "support")),
      project: idFor(rows, sampleExternalId("project", "rollout")),
      pairings: {
        facets: pairings.facets,
        integrations: pairings.integrations,
        inspections: pairings.inspections,
        knowledge: pairings.knowledge,
        about: pairings.about,
        statistics: pairings.statistics,
        location: pairings.location,
        integration: pairings.integration,
        schedule: pairings.schedule,
        tickets: pairings.tickets,
        project: pairings.project,
      },
  });
  const current = normalizePageBuilder(getSiteSettingsFixture().page_builder);
  const demoIds = new Set<string>(DEMO_CANVAS_IDS);
  const isDemo = (canvas: CustomCanvas) => Boolean(canvas.id && demoIds.has(canvas.id));
  if (opts?.keepCanvas && current.canvases.some(isDemo)) return;
  const kept = current.canvases.filter((canvas) => !isDemo(canvas) && !isPlaceholderCanvas(canvas));
  const slug = kept.some((canvas) => canvas.slug === demo.slug)
    ? nextCanvasSlug({ ...current, canvases: kept }, demo.label)
    : demo.slug;
  const canvases = kept.length < MAX_CANVASES ? [...kept, { ...demo, slug }] : kept;
  upsertSiteSettingsFixture({
    demo_mode: true,
    page_builder: { ...current, custom: canvases[0], canvases },
    email_delivery: { credential_id: idFor(rows, sampleExternalId("credential", "mail")) },
  });
}

/** The blank Overview a cleared install ships with. Demo install replaces it. */
function isPlaceholderCanvas(canvas: CustomCanvas): boolean {
  return (
    canvas.id === "cv-overview" &&
    canvas.content_mode !== "html" &&
    !canvas.html_page_id &&
    canvas.sections.every((row) => rowElementCount(row) === 0)
  );
}

/** Demo off removes the demo canvases only. Primary and staff canvases stay as they are. */
export function resetDemoCanvas(): void {
  const current = normalizePageBuilder(getSiteSettingsFixture().page_builder);
  const demoIds = new Set<string>(DEMO_CANVAS_IDS);
  const kept = current.canvases.filter((canvas) => !(canvas.id && demoIds.has(canvas.id)));
  const canvases = kept.length ? kept : clearedPageBuilder().canvases;
  upsertSiteSettingsFixture({
    demo_mode: false,
    page_builder: { ...current, custom: canvases[0], canvases },
    email_delivery: { credential_id: "" },
  });
}

