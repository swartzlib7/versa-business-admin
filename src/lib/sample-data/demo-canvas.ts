import {
  defaultPageBuilder,
  type CanvasColumnCount,
  type CustomCanvas,
  type PageBuilderCell,
  type PageBuilderSection,
  type RowHeading,
} from "@/lib/public/page-builder";

/**
 * 1.0.16 Demo canvas: a guided tour, one row per capability
 * (state_demo_content.md §4.1). Every row paints sample records only.
 */
export type DemoCanvasIds = {
  pages: { welcome: string; knowledge: string };
  statistics: { visits: string; miles: string };
  invoice: string;
  location: string;
  pairings: {
    welcome: string;
    knowledge: string;
    orgboard: string;
    project: string;
    job: string;
    statistics: string;
    miles: string;
    assets: string;
    schedule: string;
    signup: string;
    location: string;
  };
};

/** Row ids of the tour. An installed Demo canvas without these is replaced on upgrade. */
export const DEMO_TOUR_ROW_IDS = [
  "overview",
  "organization",
  "projects",
  "jobs-and-money",
  "statistics",
  "assets",
  "schedules",
  "knowledge",
  // "contact" folds to "contacts" when a canvas is saved (name-aliases.ts).
  "contacts",
] as const;

function boundCell(
  id: string,
  bind: { pairingId: string; driver: string; recordType: string; recordId?: string; renderOutput: string; mode?: "single" | "all" },
): PageBuilderCell {
  return {
    id,
    enabled: true,
    kind: "record",
    recordType: bind.recordType,
    ...(bind.recordId ? { recordId: bind.recordId } : {}),
    recordMode: bind.mode ?? "single",
    driver: bind.driver,
    pairingId: bind.pairingId,
    renderOutput: bind.renderOutput,
    ...(bind.recordType === "statistics" ? { showPager: false } : {}),
  };
}

function row(
  id: string,
  label: string,
  columns: CanvasColumnCount,
  cells: PageBuilderCell[],
  heading?: RowHeading,
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
    display_px: 520,
    // Rows are as tall as what they show (DM-12).
    height_unit: "fit",
    height_px: 520,
    height_vh: 70,
    in_menu: true,
    ...(heading ? { heading } : {}),
    cells,
  };
}

/** Demo-owned canvases. Demo off removes only these. Retired `cv-demo-overview` and `cv-demo-showcase` are still cleaned up. */
export const DEMO_CANVAS_IDS = ["cv-demo", "cv-demo-overview", "cv-demo-showcase"] as const;

/** The demo canvas, bound to demo Elements. Demo mode never writes Primary. */
export function demoCanvas(ids: DemoCanvasIds): CustomCanvas {
  const base = defaultPageBuilder();
  const p = ids.pairings;
  const sections = [
    row("overview", "Overview", 1, [
      boundCell("overview-c1", { pairingId: p.welcome, driver: "page-header", recordType: "page", recordId: ids.pages.welcome, renderOutput: "html-block" }),
    ]),
    row(
      "organization",
      "Organization",
      1,
      [boundCell("organization-c1", { pairingId: p.orgboard, driver: "org-board-header", recordType: "*", renderOutput: "org-records", mode: "all" })],
      {
        kicker: "Organization",
        title: "Every post has a hat. Every hat has a home.",
        lede: "The org board is the menu. Each division keeps its own records, and each hat says who holds it and what it produces.",
        note: "Staff edit this in Executive → Hats and Communications → Staff",
      },
    ),
    row(
      "projects",
      "Projects",
      1,
      [boundCell("projects-c1", { pairingId: p.project, driver: "project-header", recordType: "executive_project", renderOutput: "gantt", mode: "all" })],
      {
        kicker: "Projects",
        title: "See the whole project on one line of time.",
        lede: "Tasks, subtasks and who is waiting on whom. The colours come from each task's status, so the chart is never out of date.",
        note: "Staff edit this in Executive → Projects",
      },
    ),
    row(
      "jobs-and-money",
      "Jobs and money",
      1,
      [boundCell("jobs-and-money-c1", { pairingId: p.job, driver: "transaction-header", recordType: "treasury_transaction", recordId: ids.invoice, renderOutput: "job-money" })],
      {
        kicker: "Jobs and money",
        title: "Price the job, invoice it, and see what it really cost.",
        lede: "Lines carry unit cost and markup, so the price works itself out. Vendor bills are split across job lines, and VBA stops a bill being used twice.",
        note: "Staff edit this in Treasury → Transactions",
      },
    ),
    row(
      "statistics",
      "Statistics",
      2,
      [
        boundCell("statistics-c1", { pairingId: p.statistics, driver: "statistics-header", recordType: "statistics", recordId: ids.statistics.visits, renderOutput: "grid-1" }),
        boundCell("statistics-c2", { pairingId: p.miles, driver: "statistics-header", recordType: "statistics", recordId: ids.statistics.miles, renderOutput: "grid-1" }),
      ],
      {
        kicker: "Statistics",
        title: "Know if you are up or down, and what it takes to make target.",
        lede: "Each statistic can carry a target and shows the pace needed to reach it. A statistic can also fill itself from records: business miles come straight from the mileage log.",
        note: "Staff edit this in Statistics",
      },
    ),
    row(
      "assets",
      "Assets",
      1,
      [boundCell("assets-c1", { pairingId: p.assets, driver: "asset-header", recordType: "treasury_records_assets_materiel", renderOutput: "asset-card", mode: "all" })],
      {
        kicker: "Assets and mileage",
        title: "The van, its paperwork and its miles in one record.",
        lede: "Registration and insurance live on the asset. Trips go on the mileage log, and the business share is added up for you.",
        note: "Staff edit this in Treasury → Records, Assets and Materiel, and Custom Records → Vehicle Mileage Logs",
      },
    ),
    row(
      "schedules",
      "Schedules",
      1,
      [boundCell("schedules-c1", { pairingId: p.schedule, driver: "schedule-header", recordType: "schedule", renderOutput: "board", mode: "all" })],
      {
        kicker: "Schedules",
        title: "Recurring work, on the calendar, without a reminder app.",
        note: "Staff edit this in Schedules",
      },
    ),
    row(
      "knowledge",
      "Knowledge",
      1,
      [boundCell("knowledge-c1", { pairingId: p.knowledge, driver: "page-header", recordType: "page", recordId: ids.pages.knowledge, renderOutput: "html-block" })],
      {
        kicker: "Knowledge",
        title: "What a new hire needs, where they will look for it.",
        note: "Staff edit this in Pages",
      },
    ),
    row(
      "contacts",
      "Contact",
      2,
      [
        boundCell("contacts-c1", { pairingId: p.signup, driver: "contact-header", recordType: "contact", renderOutput: "signup-form", mode: "all" }),
        boundCell("contacts-c2", { pairingId: p.location, driver: "location-header", recordType: "location", recordId: ids.location, renderOutput: "location-map" }),
      ],
      {
        kicker: "Contact",
        title: "Questions land in the contact list.",
        lede: "A sign-up saves a public Contact. The address comes from the Location record.",
        note: "Staff edit this in Locations and Contacts",
      },
    ),
  ];
  return {
    ...base.custom,
    id: DEMO_CANVAS_IDS[0],
    enabled: true,
    slug: "demo",
    slugManual: true,
    label: "Demo",
    sections,
    menu_enabled: true,
    seo: {
      title: "Versa - Business Admin demo",
      description: "A guided tour of Versa - Business Admin with sample records.",
      og_image_url: "",
      noindex: true,
    },
  };
}

/** True when an installed Demo canvas is the current tour (else it is replaced). */
export function isCurrentDemoCanvas(canvas: { sections?: Array<{ id: string }> }): boolean {
  const ids = new Set((canvas.sections ?? []).map((section) => section.id));
  return DEMO_TOUR_ROW_IDS.every((id) => ids.has(id));
}
