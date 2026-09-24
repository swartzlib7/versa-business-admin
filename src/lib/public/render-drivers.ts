/**
 * Driver catalog — one released driver per Shape + Record type.
 * Extra paint styles are Render outputs on that driver, not extra drivers.
 * Spatial Twin, Cells, and the visitor canvas all read this list.
 *
 * Touchpoints: docs/production/state/state_page_builder.md (PB-53)
 */

export type DriverRenderOutput = {
  id: string;
  label: string;
  tiles?: number;
};

export type DriverBindShape = "header" | "lines_list" | "line_single" | "lines_only";

export type ElementSelectionMode = "one" | "filter" | "all";

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
  /** Single Records Editor type, or `*` for type-level embeds. */
  recordType: string;
  compatibleTypes: string[];
  elementModes: ElementSelectionMode[];
  inputs: DriverInputDecl[];
  supportsFilter?: boolean;
  supportsPagination?: boolean;
  description?: string;
};

export const STAT_GRAPH_OUTPUTS: DriverRenderOutput[] = [
  { id: "grid-1", label: "1", tiles: 1 },
  { id: "grid-2", label: "2", tiles: 2 },
  { id: "grid-4", label: "4", tiles: 4 },
  { id: "grid-8", label: "8", tiles: 8 },
  { id: "grid-12", label: "12", tiles: 12 },
];

export const GRAPH_LAYOUTS = [1, 2, 4, 8, 12] as const;
export type GraphLayout = (typeof GRAPH_LAYOUTS)[number];

const CARD_INPUTS: DriverInputDecl[] = [
  { name: "title", kind: "text", required: true },
  { name: "subtitle", kind: "text" },
  { name: "body", kind: "html" },
];

function entry(
  id: string,
  label: string,
  bindShape: DriverBindShape,
  recordType: string,
  outputs: DriverRenderOutput[],
  extra: Partial<DriverCatalogEntry> & { elementModes: ElementSelectionMode[] },
): DriverCatalogEntry {
  const compatible =
    extra.compatibleTypes ?? (recordType === "*" ? ["*"] : [recordType]);
  return {
    id,
    label,
    outputs,
    bindShape,
    recordType,
    compatibleTypes: compatible,
    inputs: extra.inputs ?? [],
    supportsFilter: extra.elementModes.includes("filter") || extra.supportsFilter,
    supportsPagination: extra.supportsPagination,
    description: extra.description,
    elementModes: extra.elementModes,
  };
}

export const DRIVER_RENDER_CATALOG: Record<string, DriverCatalogEntry> = {
  "page-header": entry("page-header", "Page header", "header", "page", [
    { id: "html-block", label: "HTML block" },
    { id: "record-card", label: "Record card" },
  ], {
    elementModes: ["one"],
    inputs: [{ name: "body", kind: "html", required: true }, ...CARD_INPUTS],
    description: "Header paint for a Pages record.",
  }),
  "statistics-header": entry("statistics-header", "Statistics header", "header", "statistics", STAT_GRAPH_OUTPUTS, {
    elementModes: ["one", "filter"],
    inputs: [{ name: "header", kind: "record", required: true }, { name: "line_count", kind: "number" }],
    supportsPagination: true,
    description: "Statistics header and its lines, paged in the same grid as the Spatial Twin.",
  }),
  "inspection-header": entry("inspection-header", "Inspections & Reports", "header", "inspection_report", [
    { id: "tickets", label: "Table" },
  ], {
    elementModes: ["one", "all"],
    inputs: CARD_INPUTS,
    description: "Inspections and reports as a table.",
  }),
  "integration-header": entry("integration-header", "Integration", "header", "vendor_integration", [
    { id: "table", label: "Table" },
  ], {
    elementModes: ["one", "all"],
    description: "Integrations in a table with the vendor and its logo.",
  }),
  "schedule-header": entry("schedule-header", "Schedule", "header", "schedule", [
    { id: "board", label: "Board" },
  ], {
    elementModes: ["one", "all"],
    description: "A calendar board of planned points on the frequency spectrum.",
  }),
  "project-header": entry("project-header", "Project", "header", "executive_project", [
    { id: "table", label: "Table" },
    { id: "cards", label: "Cards" },
  ], {
    elementModes: ["one", "all"],
    description: "Projects as a table with task counts, or as cards that open the tasks.",
  }),
  "inspection-lines": entry("inspection-lines", "Inspections lines", "lines_list", "inspection_report", [
    { id: "lines-list", label: "Lines list" },
  ], {
    elementModes: ["one", "filter", "all"],
    inputs: [{ name: "lines", kind: "record_list", required: true }],
    supportsPagination: true,
    description: "Lines list for an Inspections & Reports record.",
  }),
  "inspection-line": entry("inspection-line", "Inspections line", "line_single", "inspection_report", [
    { id: "line-card", label: "Line card" },
  ], {
    elementModes: ["one"],
    inputs: CARD_INPUTS,
    description: "One inspection line as a card.",
  }),
  "embed-header": entry("embed-header", "Embed header", "header", "*", [
    { id: "glossary-book", label: "Glossary book" },
    { id: "org-board", label: "Org Board" },
  ], {
    elementModes: ["all"],
    compatibleTypes: ["*", "glossary", "org_board"],
    description: "Type-level Glossary or Org Board embed.",
  }),
  "location-header": entry("location-header", "Location", "header", "location", [
    { id: "location-card", label: "Location Card" },
    { id: "location-map", label: "Location with Map" },
  ], {
    elementModes: ["one"],
    description: "A location card, or the same card with a map.",
  }),
};

export const PAIRABLE_DRIVER_IDS = [
  "page-header",
  "statistics-header",
  "location-header",
  "integration-header",
  "schedule-header",
  "inspection-header",
  "project-header",
] as const;

export type FoldedDriverRef = { id: string; output?: string; recordType?: string };

/** Old code keys → the unique Shape + type driver (and default output). */
export const LEGACY_DRIVER_FOLD: Record<string, FoldedDriverRef> = {
  "html-block": { id: "page-header", output: "html-block", recordType: "page" },
  "record-card": { id: "page-header", output: "record-card" },
  "stat-graph": { id: "statistics-header", output: "grid-1" },
  "header-card": { id: "statistics-header", output: "grid-1" },
  "header-line-stats": { id: "statistics-header", output: "grid-1" },
  "lines-list": { id: "statistics-header", output: "grid-1" },
  "line-card": { id: "statistics-header", output: "grid-1" },
  "glossary-book": { id: "embed-header", output: "glossary-book", recordType: "*" },
  "org-board": { id: "embed-header", output: "org-board", recordType: "*" },
  "contacts-cards": { id: "location-header", output: "location-card", recordType: "location" },
  "cycle-strip": { id: "cycle-strip", output: "cycle-strip", recordType: "cycle_strip" },
};

export function foldLegacyDriver(
  codeKey: string,
  recordType?: string,
): FoldedDriverRef {
  const key = codeKey.trim();
  if (DRIVER_RENDER_CATALOG[key]) return { id: key };
  const base = LEGACY_DRIVER_FOLD[key];
  if (!base) return { id: key };
  if (key === "record-card") {
    if (recordType === "statistics") return { id: "statistics-header", output: "grid-1" };
    if (recordType === "inspection_report") return { id: "inspection-header", output: "record-card" };
    return { id: "page-header", output: "record-card" };
  }
  if (key === "header-card" && recordType === "inspection_report") {
    return { id: "inspection-header", output: "header-card" };
  }
  if (key === "header-line-stats" && recordType === "inspection_report") {
    return { id: "inspection-header", output: "header-line-stats" };
  }
  if (key === "lines-list" && recordType === "inspection_report") {
    return { id: "inspection-lines", output: "lines-list" };
  }
  if (key === "line-card" && recordType === "inspection_report") {
    return { id: "inspection-line", output: "line-card" };
  }
  return base;
}

export function catalogIdFromPair(shape: string, recordType: string): string | undefined {
  return Object.values(DRIVER_RENDER_CATALOG).find(
    (row) => row.bindShape === shape && row.recordType === recordType,
  )?.id;
}

export function driverPairKey(shape: string, recordType: string): string {
  return `${shape.trim()}\0${recordType.trim()}`;
}

/** Slot-driver paint id (legacy names stay as output / paint kinds). */
export function paintKind(codeKey: string | undefined, renderOutput?: string): string {
  if (!codeKey) return "";
  const folded = foldLegacyDriver(codeKey);
  const out = renderOutput || folded.output || "";
  if (
    out === "html-block" ||
    out === "stat-graph" ||
    out === "contacts-cards" ||
    out === "glossary-book" ||
    out === "org-board" ||
    out === "cycle-strip"
  ) {
    return out;
  }
  if (folded.id === "page-header") return out === "record-card" ? "record-card" : "html-block";
  if (folded.id === "statistics-header") return "stat-graph";
  if (folded.id === "location-header") return "location-card";
  if (folded.id === "integration-header") return "integration-table";
  if (folded.id === "schedule-header") return "schedule-board";
  if (folded.id === "inspection-header") return "inspection-tickets";
  if (folded.id === "project-header") return out === "cards" ? "project-cards" : "project-table";
  if (folded.id === "cycle-strip") return "cycle-strip";
  if (folded.id === "embed-header") return out || "glossary-book";
  if (LEGACY_DRIVER_FOLD[codeKey]) return paintKind(folded.id, out || folded.output);
  return codeKey;
}

export function driverEntry(driver?: string): DriverCatalogEntry | undefined {
  if (!driver) return undefined;
  const id = foldLegacyDriver(driver).id;
  return DRIVER_RENDER_CATALOG[id] ?? DRIVER_RENDER_CATALOG[driver];
}

export function outputsForDriver(driver?: string): DriverRenderOutput[] {
  return driverEntry(driver)?.outputs ?? [{ id: "default", label: driver || "Default" }];
}

export function defaultOutputId(driver?: string): string {
  const folded = driver ? foldLegacyDriver(driver) : undefined;
  if (folded?.output && isKnownOutput(folded.id, folded.output)) return folded.output;
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

export function driverShapeLabel(shape: DriverBindShape): string {
  if (shape === "header") return "Header only";
  if (shape === "lines_only") return "Lines only";
  return "Header + lines";
}

export function pairableDriversForType(recordType: string, bindShape?: DriverBindShape): DriverCatalogEntry[] {
  return pairableDriverList().filter((row) => {
    if (row.recordType === "*") {
      if (recordType !== "*" && recordType !== "glossary" && recordType !== "org_board") return false;
    } else if (!row.compatibleTypes.includes(recordType) && row.recordType !== recordType) {
      return false;
    }
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
