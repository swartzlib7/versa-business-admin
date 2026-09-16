/**
 * Driver catalog — each driver owns one or more **render outputs**.
 * Statistics grid layouts (1 / 2 / 4 / 8 / 12) are outputs of `stat-graph`.
 * Spatial Twin, Page Builder Cells, and the visitor canvas all read this list.
 *
 * Code is the behavior source. `render_driver` records mirror this registry.
 * Touchpoints: docs/coa/DRIVER_TOUCHPOINTS.md
 */

export type DriverRenderOutput = {
  id: string;
  label: string;
  /** Tile count for grid-style outputs (Statistics). */
  tiles?: number;
};

export type DriverBindShape = "header" | "lines_list" | "line_single" | "lines_only";

export type DriverInputKind = "text" | "html" | "number" | "image" | "record" | "record_list";

export type DriverInputDecl = {
  name: string;
  kind: DriverInputKind;
  required?: boolean;
};

export type DriverCatalogEntry = {
  id: string;
  label: string;
  outputs: DriverRenderOutput[];
  bindShape: DriverBindShape;
  compatibleTypes: string[];
  inputs: DriverInputDecl[];
  supportsFilter?: boolean;
  supportsPagination?: boolean;
  description?: string;
};

const SINGLE = (
  id: string,
  label: string,
  bindShape: DriverBindShape,
  compatibleTypes: string[],
  inputs: DriverInputDecl[],
  extra?: Partial<DriverCatalogEntry>,
): DriverCatalogEntry => ({
  id,
  label,
  outputs: [{ id: "default", label }],
  bindShape,
  compatibleTypes,
  inputs,
  ...extra,
});

export const STAT_GRAPH_OUTPUTS: DriverRenderOutput[] = [
  { id: "grid-1", label: "1 up", tiles: 1 },
  { id: "grid-2", label: "2 up", tiles: 2 },
  { id: "grid-4", label: "4 up", tiles: 4 },
  { id: "grid-8", label: "8 up", tiles: 8 },
  { id: "grid-12", label: "12 up", tiles: 12 },
];

/** Same numbers the Statistics Spatial Twin pager uses — sourced here, not hardcoded in the twin. */
export const GRAPH_LAYOUTS = [1, 2, 4, 8, 12] as const;
export type GraphLayout = (typeof GRAPH_LAYOUTS)[number];

const CARD_INPUTS: DriverInputDecl[] = [
  { name: "title", kind: "text", required: true },
  { name: "subtitle", kind: "text" },
  { name: "body", kind: "html" },
];

export const DRIVER_RENDER_CATALOG: Record<string, DriverCatalogEntry> = {
  "html-block": SINGLE("html-block", "HTML block", "header", ["page"], [
    { name: "body", kind: "html", required: true },
  ], { description: "Renders the HTML page body." }),
  "record-card": SINGLE("record-card", "Record card", "header", [
    "page",
    "statistics",
    "inspection_report",
    "cycle_strip",
  ], CARD_INPUTS, { description: "Simple card from mapped fields." }),
  "stat-graph": {
    id: "stat-graph",
    label: "Statistics graph",
    outputs: STAT_GRAPH_OUTPUTS,
    bindShape: "header",
    compatibleTypes: ["statistics"],
    inputs: [{ name: "header", kind: "record", required: true }],
    description: "Statistics Spatial Twin grids (1 / 2 / 4 / 8 / 12).",
  },
  "header-card": SINGLE("header-card", "Header card", "header", [
    "statistics",
    "inspection_report",
  ], CARD_INPUTS, { description: "Header as a designed card." }),
  "header-line-stats": SINGLE("header-line-stats", "Header line stats", "header", [
    "statistics",
    "inspection_report",
  ], [
    { name: "header", kind: "record", required: true },
    { name: "line_count", kind: "number" },
  ], { supportsFilter: true, description: "Rollup: line counts and attribute counts." }),
  "lines-list": SINGLE("lines-list", "Lines list", "lines_list", [
    "statistics",
    "inspection_report",
  ], [{ name: "lines", kind: "record_list", required: true }], {
    supportsFilter: true,
    supportsPagination: true,
    description: "Iterate lines; optional filter and page.",
  }),
  "line-card": SINGLE("line-card", "Line card", "line_single", [
    "statistics",
    "inspection_report",
  ], CARD_INPUTS, { description: "One line as a designed card." }),
  "cycle-strip": SINGLE("cycle-strip", "Cycle Strip", "lines_only", ["cycle_strip"], [
    { name: "steps", kind: "record_list", required: true },
  ], { description: "All Cycle Strip steps as a horizontal strip." }),
  // Legacy homepage aliases — still paint until the pairing cutover. Not Palette chips.
  "glossary-book": SINGLE("glossary-book", "Glossary book", "header", [], []),
  "org-board": SINGLE("org-board", "Org Board", "header", [], []),
  "home:facets": SINGLE("home:facets", "Facets", "header", ["page"], []),
  "home:integrations": SINGLE("home:integrations", "Integrations", "header", [], []),
  "home:inspections-reports": SINGLE("home:inspections-reports", "Inspections & Reports", "header", ["inspection_report"], []),
  "home:statistics": SINGLE("home:statistics", "Statistics", "header", ["statistics"], []),
  "home:knowledge": SINGLE("home:knowledge", "Knowledge", "header", [], []),
  "home:about": SINGLE("home:about", "About", "header", ["page"], []),
  "home:contacts": SINGLE("home:contacts", "Contacts", "header", ["contact", "location"], []),
};

/** Drivers staff may pair from the wizard (not legacy home:* / route features). */
export const PAIRABLE_DRIVER_IDS = [
  "html-block",
  "record-card",
  "stat-graph",
  "header-card",
  "header-line-stats",
  "lines-list",
  "line-card",
  "cycle-strip",
] as const;

export function driverEntry(driver?: string): DriverCatalogEntry | undefined {
  if (!driver) return undefined;
  return DRIVER_RENDER_CATALOG[driver];
}

export function outputsForDriver(driver?: string): DriverRenderOutput[] {
  return driverEntry(driver)?.outputs ?? [{ id: "default", label: driver || "Default" }];
}

export function defaultOutputId(driver?: string): string {
  return outputsForDriver(driver)[0]?.id ?? "default";
}

export function outputIdFromTiles(tiles: number): string {
  return `grid-${tiles}`;
}

export function tilesFromOutputId(id?: string | null): GraphLayout {
  if (!id) return 1;
  const n = Number.parseInt(id.replace(/^grid-/, ""), 10);
  return (GRAPH_LAYOUTS as readonly number[]).includes(n) ? (n as GraphLayout) : 1;
}

export function isKnownOutput(driver: string | undefined, outputId: string | undefined): boolean {
  if (!outputId) return false;
  return outputsForDriver(driver).some((row) => row.id === outputId);
}

export function pairableDriverList(): DriverCatalogEntry[] {
  return PAIRABLE_DRIVER_IDS.map((id) => DRIVER_RENDER_CATALOG[id]).filter(
    (row): row is DriverCatalogEntry => Boolean(row),
  );
}

const DRIVER_DROP_SEP = "::";

export function encodeDriverDrop(driverId: string, outputId: string): string {
  return `${driverId}${DRIVER_DROP_SEP}${outputId}`;
}

export function parseDriverDrop(payload: string): { driverId: string; outputId?: string } {
  const sep = payload.indexOf(DRIVER_DROP_SEP);
  if (sep <= 0) return { driverId: payload };
  const outputId = payload.slice(sep + DRIVER_DROP_SEP.length);
  return { driverId: payload.slice(0, sep), outputId: outputId || undefined };
}

/** Header language from the overnight lock: header only / header+lines / lines only. */
export function driverShapeLabel(shape: DriverBindShape): string {
  if (shape === "header") return "Header only";
  if (shape === "lines_only") return "Lines only";
  return "Header + lines";
}

export function pairableDriversForType(recordType: string, bindShape?: DriverBindShape): DriverCatalogEntry[] {
  return PAIRABLE_DRIVER_IDS.map((id) => DRIVER_RENDER_CATALOG[id]).filter((row) => {
    if (!row.compatibleTypes.includes(recordType)) return false;
    if (bindShape && row.bindShape !== bindShape) return false;
    return true;
  });
}

export function derivedRecordOutputs(hasLines: boolean): { id: string; label: string }[] {
  const base = [
    { id: "name", label: "Name" },
    { id: "status", label: "Status" },
  ];
  if (!hasLines) return base;
  return [
    ...base,
    { id: "line_count", label: "Line count" },
    { id: "count_by:status", label: "Count by status" },
  ];
}
