import {
  DEFAULT_ROW_HEIGHT_PX,
  defaultPageBuilder,
  type CanvasColumnCount,
  type CustomCanvas,
  type PageBuilderCell,
  type PageBuilderSection,
} from "@/lib/public/page-builder";

export type DemoCanvasIds = {
  pages: {
    facets: string;
    integrations: string;
    inspections: string;
    knowledge: string;
    about: string;
  };
  statistics: string;
  location: string;
  integration: string;
  schedule: string;
  inspection: string;
  project: string;
  pairings: {
    facets: string;
    integrations: string;
    inspections: string;
    knowledge: string;
    about: string;
    statistics: string;
    location: string;
    integration: string;
    schedule: string;
    tickets: string;
    project: string;
  };
};

function boundCell(
  id: string,
  bind: {
    pairingId: string;
    driver: string;
    recordType: string;
    recordId: string;
    renderOutput: string;
  },
): PageBuilderCell {
  return {
    id,
    enabled: true,
    kind: "record",
    recordType: bind.recordType,
    recordId: bind.recordId,
    recordMode: "single",
    driver: bind.driver,
    pairingId: bind.pairingId,
    renderOutput: bind.renderOutput,
  };
}

function row(
  id: string,
  label: string,
  columns: CanvasColumnCount,
  cells: PageBuilderCell[],
): PageBuilderSection {
  return {
    id,
    label,
    idManual: true,
    kind: "record",
    enabled: true,
    collapsed: false,
    width_pct: 100,
    mobile_width_pct: 100,
    columns,
    display_px: DEFAULT_ROW_HEIGHT_PX,
    height_unit: "px",
    height_px: DEFAULT_ROW_HEIGHT_PX,
    height_vh: 70,
    cells,
  };
}

/** Demo-owned canvases. Demo off removes only these. Retired `cv-demo-overview` and `cv-demo-showcase` are still cleaned up. */
export const DEMO_CANVAS_IDS = ["cv-demo", "cv-demo-overview", "cv-demo-showcase"] as const;

/** The demo canvas, bound to demo Elements. Demo mode never writes Primary. */
export function demoCanvas(ids: DemoCanvasIds): CustomCanvas {
  const base = defaultPageBuilder();
  const page = "page-header";
  const stat = "statistics-header";
  const loc = "location-header";
  const integration = "integration-header";
  const schedule = "schedule-header";
  const tickets = "inspection-header";
  const project = "project-header";
  const home = [
    row("facets", "Facets", 1, [
      boundCell("facets-c1", {
        pairingId: ids.pairings.facets,
        driver: page,
        recordType: "page",
        recordId: ids.pages.facets,
        renderOutput: "html-block",
      }),
    ]),
    row("integrations", "Integrations", 1, [
      boundCell("integrations-c1", {
        pairingId: ids.pairings.integration,
        driver: integration,
        recordType: "vendor_integration",
        recordId: ids.integration,
        renderOutput: "table",
      }),
    ]),
    row("schedules", "Schedules", 1, [
      boundCell("schedules-c1", {
        pairingId: ids.pairings.schedule,
        driver: schedule,
        recordType: "schedule",
        recordId: ids.schedule,
        renderOutput: "board",
      }),
    ]),
    row("inspections-reports", "Support Requests", 1, [
      boundCell("inspections-reports-c1", {
        pairingId: ids.pairings.tickets,
        driver: tickets,
        recordType: "inspection_report",
        recordId: ids.inspection,
        renderOutput: "tickets",
      }),
    ]),
    row("projects", "Projects", 1, [
      boundCell("projects-c1", {
        pairingId: ids.pairings.project,
        driver: project,
        recordType: "executive_project",
        recordId: ids.project,
        renderOutput: "table",
      }),
    ]),
    row("statistics", "Statistics", 1, [
      boundCell("statistics-c1", {
        pairingId: ids.pairings.statistics,
        driver: stat,
        recordType: "statistics",
        recordId: ids.statistics,
        renderOutput: "grid-2",
      }),
    ]),
    row("knowledge", "Knowledge", 1, [
      boundCell("knowledge-c1", {
        pairingId: ids.pairings.knowledge,
        driver: page,
        recordType: "page",
        recordId: ids.pages.knowledge,
        renderOutput: "html-block",
      }),
    ]),
    row("contacts", "Contacts", 1, [
      boundCell("contacts-c1", {
        pairingId: ids.pairings.location,
        driver: loc,
        recordType: "location",
        recordId: ids.location,
        renderOutput: "location-map",
      }),
    ]),
  ];
  const customSections = [
    row("intro", "Intro", 2, [
      boundCell("intro-c1", {
        pairingId: ids.pairings.about,
        driver: page,
        recordType: "page",
        recordId: ids.pages.about,
        renderOutput: "html-block",
      }),
      boundCell("intro-c2", {
        pairingId: ids.pairings.about,
        driver: page,
        recordType: "page",
        recordId: ids.pages.about,
        renderOutput: "record-card",
      }),
    ]),
    row("detail", "Detail", 2, [
      boundCell("detail-c1", {
        pairingId: ids.pairings.location,
        driver: loc,
        recordType: "location",
        recordId: ids.location,
        renderOutput: "location-card",
      }),
      boundCell("detail-c2", {
        pairingId: ids.pairings.statistics,
        driver: stat,
        recordType: "statistics",
        recordId: ids.statistics,
        renderOutput: "grid-1",
      }),
    ]),
  ];
  const custom = {
    ...base.custom,
    id: DEMO_CANVAS_IDS[0],
    enabled: true,
    slug: "demo",
    slugManual: true,
    label: "Demo",
    sections: [...customSections, ...home].map((section) => ({ ...section, in_menu: true })),
    menu_enabled: true,
    seo: { title: "Demo", description: "Sample content canvas.", og_image_url: "", noindex: true },
  };
  return custom;
}
