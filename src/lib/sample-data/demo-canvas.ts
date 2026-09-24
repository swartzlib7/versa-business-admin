import {
  DEFAULT_ROW_HEIGHT_PX,
  defaultPageBuilder,
  type CanvasColumnCount,
  type PageBuilderCell,
  type PageBuilderSection,
  type PageBuilderState,
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

/** Primary menu rows plus the Overview canvas, bound to demo Elements. */
export function demoPageBuilder(ids: DemoCanvasIds): PageBuilderState {
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
    enabled: true,
    slug: "overview",
    slugManual: true,
    label: "Overview",
    width_pct: 75,
    margin: 48,
    margin_unit: "px" as const,
    mobile_width_pct: 100,
    mobile_margin: 16,
    mobile_margin_unit: "px" as const,
    sections: customSections,
  };
  return {
    ...base,
    home_hero_enabled: true,
    home_width_pct: 75,
    home_margin: 48,
    home_margin_unit: "px",
    home_mobile_width_pct: 100,
    home_mobile_margin: 16,
    home_mobile_margin_unit: "px",
    home_section_order: home.map((section) => section.id),
    home_sections: home,
    custom,
    canvases: [custom],
  };
}
