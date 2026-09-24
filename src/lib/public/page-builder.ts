import type { CSSProperties } from "react";
import { foldDriverId, foldHomeSectionId, foldRecordTypeApiName } from "@/lib/catalog/name-aliases";

/** Canvas row columns. Every count from 1 through 8. */
export const CANVAS_COLUMN_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export type CanvasColumnCount = (typeof CANVAS_COLUMN_COUNTS)[number];

export type SlotKind = "empty" | "feature" | "record";
/** Locked name: Cell. SlotKind kept so existing bindings still type-check. */
export type BindingKind = SlotKind;

export type PageBuilderCell = {
  id: string;
  enabled?: boolean;
  kind: BindingKind;
  featureId?: string;
  recordType?: string;
  recordId?: string;
  driver?: string;
  recordMode?: "single" | "multi" | "all";
  recordIds?: string[];
  /** Chosen render output on this Cell. Statistics uses this as the Grid (1/2/4/8/12). */
  renderOutput?: string;
  /** Statistics Element: 1-based page to show. Default 1. */
  pageNumber?: number;
  /** Statistics Element: show page controls on the visitor page. Default on. */
  showPager?: boolean;
  /** Unique Driver pairing this Cell paints. Many Cells may share one pairing. */
  pairingId?: string;
};

/** A Canvas Row. Type name kept as PageBuilderSection for persisted JSON + verifiers. */
export type PageBuilderSection = {
  id: string;
  label: string;
  kind: SlotKind;
  featureId?: string;
  recordType?: string;
  recordId?: string;
  driver?: string;
  /** PB-13 (Stephen, 2026-09-14 02:48): how the record type paints.
   *  single = one record id (recordId); multi = picked recordIds; all = whole type. */
  recordMode?: "single" | "multi" | "all";
  /** PB-13: picked record ids for recordMode "multi". */
  recordIds?: string[];
  /** PB-15: section content width as % of the canvas (25-100, default 100). Desktop. */
  width_pct?: number;
  /** Same width, applied below 1024px. Missing means 100%. */
  mobile_width_pct?: number;
  /** Row columns — 1 through 8. Each column is a Cell. */
  columns?: CanvasColumnCount;
  /** PB-19: Row visibility. Default on. */
  enabled?: boolean;
  /** PB-19: Cells in this Row. Length grows with columns; extras stay parked. */
  cells?: PageBuilderCell[];
  /** Builder-only. True hides the row body on the canvas. New rows start collapsed. */
  collapsed?: boolean;
  /** Builder-only cell paint height in pixels. The visitor page uses height_unit. */
  display_px?: number;
  /** Visitor row height. `px` uses height_px. `vh` uses height_vh as a percent of the viewport. */
  height_unit?: RowHeightUnit;
  height_px?: number;
  height_vh?: number;
  /** True when staff typed the hash; blanking it returns to auto-from-label. */
  idManual?: boolean;
};

export type PageBuilderRow = PageBuilderSection;

export type CanvasMarginUnit = "px" | "pct";
export type RowHeightUnit = "px" | "vh";

export type CustomCanvas = {
  enabled: boolean;
  slug: string;
  label: string;
  sections: PageBuilderSection[];
  /** Canvas content width as % of the inner frame (0–100). 0 disables the canvas. */
  width_pct?: number;
  /** Inset from all four viewport edges. Desktop. */
  margin?: number;
  margin_unit?: CanvasMarginUnit;
  /** Width and inset below 1024px. Missing width is 100%; missing margin is 16px. */
  mobile_width_pct?: number;
  mobile_margin?: number;
  mobile_margin_unit?: CanvasMarginUnit;
  /** Default columns for new Rows (1 through 8). */
  columns?: CanvasColumnCount;
  /** True when staff typed the slug; blanking it returns to auto-from-label. */
  slugManual?: boolean;
};

export type PageBuilderState = {
  /** PB-06 legacy mirror of canvases[0] (existing fixtures + Public header default read this). */
  custom: CustomCanvas;
  /** PB-06: every custom canvas. canvases[0] always mirrors custom. Cap MAX_CANVASES. */
  canvases: CustomCanvas[];
  /** PB-05 primary canvas: homepage (VBA Home) section order. Hero is always first and locked. */
  home_section_order?: string[];
  /** PB-17: primary canvas sections as real slots (width, columns, binding). */
  home_sections?: PageBuilderSection[];
  /** PB-19: Hero is a locked first Row on the Primary Canvas; toggle hides it. Default on. */
  home_hero_enabled?: boolean;
  /** Primary canvas width 0–100. 0 disables the homepage body. */
  home_width_pct?: number;
  home_margin?: number;
  home_margin_unit?: CanvasMarginUnit;
  /** Primary canvas width and inset below 1024px. */
  home_mobile_width_pct?: number;
  home_mobile_margin?: number;
  home_mobile_margin_unit?: CanvasMarginUnit;
  /** Default columns for new Primary Rows. */
  home_columns?: CanvasColumnCount;
  /** Visitor name for the Primary Page. Slug stays `/`. */
  home_label?: string;
};

export const DEFAULT_HOME_LABEL = "Home";

export function primaryCanvasLabel(
  state?: Pick<PageBuilderState, "home_label"> | null,
): string {
  const label = String(state?.home_label ?? "").trim();
  return label || DEFAULT_HOME_LABEL;
}

export function normalizeHomeLabel(raw: unknown): string {
  if (typeof raw !== "string") return DEFAULT_HOME_LABEL;
  const label = raw.trim().slice(0, 80);
  return label || DEFAULT_HOME_LABEL;
}

/** PB-06: how many custom canvases staff can run alongside the primary homepage. */
export const MAX_CANVASES = 4;

/** Homepage slot ids the primary canvas can order. Hero stays first on the visitor page.
 *  Sections are removable — this catalog is the addable set, not a locked row list.
 *  systems/operations retired (Stephen 2026-09-14): landscape = Integrations; Operations removed. */
export const HOMEPAGE_SLOT_ORDER = [
  'facets',
  'integrations',
  'inspections-reports',
  'statistics',
  'knowledge',
  'contacts',
] as const;

/** Retired primary-canvas ids — dropped on normalize, never re-injected. */
export const RETIRED_HOME_SECTION_IDS = ['systems', 'operations', 'about'] as const;

/** Default primary-canvas order = today's homepage order, so nothing moves until staff rearrange. */
export const DEFAULT_HOME_SECTION_ORDER: string[] = [...HOMEPAGE_SLOT_ORDER];

export const PAGE_BUILDER_FEATURES = [
  { id: "cycle-strip", label: "Cycle Strip", kind: "feature" as const, driver: "cycle-strip" },
  { id: "glossary", label: "Glossary of Terms", kind: "feature" as const, driver: "glossary-book" },
  { id: "org-board", label: "Org Board", kind: "feature" as const, driver: "org-board" },
] as const;

export const HOME_SECTION_LABELS: Record<(typeof HOMEPAGE_SLOT_ORDER)[number], string> = {
  facets: "Facets",
  integrations: "Integrations",
  "inspections-reports": "Inspections & Reports",
  statistics: "Statistics",
  knowledge: "Knowledge",
  contacts: "Contacts",
};

/** PB-17: primary-canvas homepage sections as feature drivers (home:<id>). */
export const HOME_SECTION_FEATURES = HOMEPAGE_SLOT_ORDER.map((id) => ({
  id: `home:${id}`,
  label: HOME_SECTION_LABELS[id],
  kind: "feature" as const,
  driver: `home:${id}`,
}));

/** Historical driver-layout map. Row column cycle is never gated by this. */
export const DRIVER_SUPPORTS_COLUMNS: Record<string, boolean> = {
  "cycle-strip": false,
  "glossary-book": false,
  "org-board": false,
  "stat-graph": true,
  "html-block": false,
  "contacts-cards": false,
};

export function driverSupportsColumns(driver?: string): boolean {
  if (!driver) return true;
  return DRIVER_SUPPORTS_COLUMNS[driver] !== false;
}

export const PAGE_BUILDER_RECORD_TYPES = [
  {
    id: "statistics",
    label: "Statistics",
    kind: "record" as const,
    driver: "stat-graph",
  },
  {
    id: "page",
    label: "Page",
    kind: "record" as const,
    driver: "html-block",
  },
  {
    id: "inspection_report",
    label: "Inspections & Reports",
    kind: "record" as const,
    driver: "header-card",
  },
  {
    id: "contact",
    label: "Contacts",
    kind: "record" as const,
    driver: "contacts-cards",
  },
  {
    id: "location",
    label: "Location",
    kind: "record" as const,
    driver: "contacts-cards",
  },
] as const;

function resolveStoredDriver(
  kind: SlotKind,
  featureId: string | undefined,
  recordType: string | undefined,
  rawDriver: unknown,
): string | undefined {
  const stored =
    typeof rawDriver === "string" && rawDriver.trim()
      ? foldDriverId(rawDriver.trim())
      : "";
  if (stored && !stored.startsWith("home:")) return stored;
  const fallback = defaultDriverFor(kind, featureId, recordType);
  if (!fallback || fallback.startsWith("home:")) return undefined;
  return fallback;
}

/** Seed a Cell after the type/driver modal. Staff then configure on the canvas. */
export function cellSeedFromDriver(raw: string): Partial<PageBuilderCell> {
  const sep = raw.indexOf("::");
  const driverId = sep > 0 ? raw.slice(0, sep) : raw;
  const renderOutput = sep > 0 ? raw.slice(sep + 2) || undefined : undefined;
  const feature = PAGE_BUILDER_FEATURES.find(
    (row) => row.driver === driverId || row.id === driverId,
  );
  if (feature) {
    return {
      kind: "feature",
      featureId: feature.id,
      driver: feature.driver,
      recordType: undefined,
      recordId: undefined,
      recordMode: undefined,
      recordIds: undefined,
      renderOutput,
    };
  }
  const byDriver = PAGE_BUILDER_RECORD_TYPES.find((row) => row.driver === driverId);
  if (byDriver) {
    return {
      kind: "record",
      recordType: byDriver.id,
      driver: byDriver.driver,
      featureId: undefined,
      renderOutput,
    };
  }
  return {
    kind: "record",
    driver: driverId,
    featureId: undefined,
    renderOutput,
  };
}

export function defaultDriverFor(
  kind: SlotKind,
  featureId?: string,
  recordType?: string,
): string {
  if (kind === "feature") {
    const driver = PAGE_BUILDER_FEATURES.find((row) => row.id === featureId)?.driver ?? "";
    return driver.startsWith("home:") ? "" : driver;
  }
  if (kind === "record") {
    return PAGE_BUILDER_RECORD_TYPES.find((row) => row.id === recordType)?.driver ?? "";
  }
  return "";
}

export function slotBindingLabel(section: PageBuilderSection): string {
  if (section.kind === "feature") {
    return (
      PAGE_BUILDER_FEATURES.find((row) => row.id === section.featureId)?.label ??
      HOME_SECTION_FEATURES.find((row) => row.id === section.featureId)?.label ??
      "Feature"
    );
  }
  if (section.kind === "record") {
    const typeLabel =
      PAGE_BUILDER_RECORD_TYPES.find((row) => row.id === section.recordType)?.label ?? "Record";
    return section.recordId ? `${typeLabel} · ${section.recordId}` : typeLabel;
  }
  return "Empty cell";
}

export function cellBindingLabel(cell: PageBuilderCell): string {
  return slotBindingLabel({
    id: cell.id,
    label: cell.id,
    kind: cell.kind,
    featureId: cell.featureId,
    recordType: cell.recordType,
    recordId: cell.recordId,
    driver: cell.driver,
  });
}

export function emptyCell(id: string): PageBuilderCell {
  return { id, enabled: true, kind: "empty" };
}

function cellBindingFields(cell: PageBuilderCell): Omit<PageBuilderCell, "id"> {
  return {
    enabled: cell.enabled,
    kind: cell.kind,
    featureId: cell.featureId,
    recordType: cell.recordType,
    recordId: cell.recordId,
    driver: cell.driver,
    recordMode: cell.recordMode,
    recordIds: cell.recordIds,
    renderOutput: cell.renderOutput,
    pairingId: cell.pairingId,
  };
}

/** Swap Element bindings between two Cells (same Row or different Rows). Cell ids stay put. */
export function swapCellBindings(
  fromRow: PageBuilderSection,
  fromIndex: number,
  toRow: PageBuilderSection,
  toIndex: number,
): { from: PageBuilderSection; to: PageBuilderSection } {
  const source = ensureRowCells(fromRow);
  const same = fromRow.id === toRow.id;
  const dest = same ? source : ensureRowCells(toRow);
  const fromCells = [...(source.cells ?? [])];
  const toCells = same ? fromCells : [...(dest.cells ?? [])];
  const src = fromCells[fromIndex];
  const dst = toCells[toIndex];
  if (!src || !dst) return { from: source, to: dest };
  const srcBind = cellBindingFields(src);
  const dstBind = cellBindingFields(dst);
  fromCells[fromIndex] = { ...src, ...dstBind, id: src.id };
  toCells[toIndex] = { ...dst, ...srcBind, id: dst.id };
  const nextFrom = ensureRowCells({ ...source, cells: fromCells });
  const nextTo = same ? nextFrom : ensureRowCells({ ...dest, cells: toCells });
  return { from: nextFrom, to: nextTo };
}

/** `__blank__` rows cannot be turned On and do not paint on the visitor canvas. */
export function isRowOn(row: PageBuilderSection): boolean {
  if (isBlankSlotLabel(row.label ?? "")) return false;
  return row.enabled !== false;
}

export function isCellOn(cell: PageBuilderCell): boolean {
  return cell.enabled !== false;
}

/** How many tiles a home-section collection can fill (cards, or stats). */
export function homeCollectionCount(content: { cards?: unknown[]; stats?: unknown[] } | undefined): number {
  if (!content) return 0;
  if (Array.isArray(content.stats) && content.stats.length) return content.stats.length;
  if (Array.isArray(content.cards)) return content.cards.length;
  return 0;
}

function cellOwnsHomeCollection(
  cell: PageBuilderCell,
  sectionId: string | undefined,
): boolean {
  if (!sectionId || cell.kind === "empty") return false;
  const hid = cell.driver?.startsWith("home:")
    ? cell.driver.slice(5)
    : cell.featureId?.startsWith("home:")
      ? cell.featureId.slice(5)
      : "";
  return hid === sectionId;
}

/**
 * Map a Cell to one collection tile (one Facet card, one stat, …).
 * Empty Cells and the owning home:* Cell share the list in order.
 * A Cell with a different Element keeps that Element (returns undefined).
 */
export function collectionItemIndex(
  row: PageBuilderSection,
  cellIndex: number,
  content: { id?: string; cards?: unknown[]; stats?: unknown[] } | undefined,
): number | undefined {
  const count = homeCollectionCount(content);
  if (!count || !content?.id) return undefined;
  const cells = visibleCells(ensureRowCells(row));
  let n = 0;
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const owner = cellOwnsHomeCollection(cell, content.id);
    const vacant = cell.kind === "empty";
    if (!owner && !vacant) {
      if (i === cellIndex) return undefined;
      continue;
    }
    if (i === cellIndex) return n < count ? n : undefined;
    n += 1;
  }
  return undefined;
}

function clampStatPageNumber(raw: unknown): number | undefined {
  const n = typeof raw === "number" ? raw : Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return Math.min(999, Math.round(n));
}

function bindingFromRow(row: PageBuilderSection): PageBuilderCell {
  return {
    id: `${row.id}-c1`,
    enabled: true,
    kind: row.kind ?? "empty",
    featureId: row.featureId,
    recordType: row.recordType,
    recordId: row.recordId,
    driver: row.driver,
    recordMode: row.recordMode,
    recordIds: row.recordIds,
  };
}

function normalizeCell(raw: unknown, fallbackId: string): PageBuilderCell {
  if (!raw || typeof raw !== "object") return emptyCell(fallbackId);
  const rec = raw as Record<string, unknown>;
  const kind = normalizeKind(rec.kind);
  const id =
    typeof rec.id === "string" && rec.id.trim() ? rec.id.trim().slice(0, 64) : fallbackId;
  const rawFeature =
    typeof rec.featureId === "string" ? foldDriverId(rec.featureId) : undefined;
  const knownFeature =
    Boolean(rawFeature) &&
    !String(rawFeature).startsWith("home:") &&
    PAGE_BUILDER_FEATURES.some((row) => row.id === rawFeature);
  const featureId = rawFeature && knownFeature ? rawFeature : undefined;
  const foldedType =
    typeof rec.recordType === "string" ? foldRecordTypeApiName(rec.recordType) : "";
  const pairingId =
    typeof rec.pairingId === "string" && rec.pairingId.trim()
      ? rec.pairingId.trim().slice(0, 80)
      : undefined;
  const knownRecordType = PAGE_BUILDER_RECORD_TYPES.some((row) => row.id === foldedType);
  const recordType =
    foldedType && (knownRecordType || Boolean(pairingId)) ? foldedType : undefined;
  const recordId =
    typeof rec.recordId === "string" && rec.recordId.trim()
      ? rec.recordId.trim().slice(0, 80)
      : undefined;
  const rawMode = rec.recordMode;
  const recordMode =
    rawMode === "multi" || rawMode === "all" || rawMode === "single" ? rawMode : undefined;
  const recordIds = Array.isArray(rec.recordIds)
    ? rec.recordIds
        .filter((row): row is string => typeof row === "string" && row.trim().length > 0)
        .map((row) => row.trim().slice(0, 80))
        .slice(0, 24)
    : undefined;
  const nextKind = pairingId ? "record" : kind === "feature" && !featureId ? "empty" : kind;
  return {
    id,
    enabled: rec.enabled !== false,
    kind: nextKind,
    featureId: nextKind === "feature" ? featureId : undefined,
    recordType: nextKind === "record" ? recordType : undefined,
    recordId: nextKind === "record" ? recordId : undefined,
    recordMode: nextKind === "record" ? recordMode : undefined,
    recordIds: nextKind === "record" ? recordIds : undefined,
    driver: resolveStoredDriver(nextKind, featureId, recordType, rec.driver),
    renderOutput:
      typeof rec.renderOutput === "string" && rec.renderOutput.trim()
        ? rec.renderOutput.trim().slice(0, 64)
        : undefined,
    pairingId,
    pageNumber: clampStatPageNumber(rec.pageNumber),
    showPager: rec.showPager === false ? false : rec.showPager === true ? true : undefined,
  };
}

/**
 * When columns shrink, parked Cells stay in the array — but a bound Element
 * sitting past the visible count looks lost. Pull parked bindings left into
 * empty visible Cells (Cell ids stay put). Visible layout is not rearranged
 * while every parked Cell is empty.
 */
export function pullParkedBindingsIntoVisibleHoles(
  cells: PageBuilderCell[],
  columns: number,
): PageBuilderCell[] {
  if (cells.length <= columns) return cells;
  const next = cells.map((cell) => ({ ...cell }));
  const holes: number[] = [];
  for (let i = 0; i < columns; i++) {
    if (next[i]?.kind === "empty") holes.push(i);
  }
  if (!holes.length) return next;
  let hole = 0;
  for (let i = columns; i < next.length && hole < holes.length; i++) {
    if (next[i].kind === "empty") continue;
    const dest = holes[hole];
    const destBind = cellBindingFields(next[dest]);
    const srcBind = cellBindingFields(next[i]);
    next[dest] = { ...next[dest], ...srcBind, id: next[dest].id };
    next[i] = { ...next[i], ...destBind, id: next[i].id };
    hole += 1;
  }
  return next;
}

/** Ensure a Row has `columns` Cells. Extra Cells stay parked (not deleted). Syncs cell 0 onto legacy fields. */
export function ensureRowCells(row: PageBuilderSection): PageBuilderSection {
  const columns = clampSectionColumns(row.columns);
  const rawCells = Array.isArray(row.cells) ? row.cells : [];
  let cells: PageBuilderCell[] = rawCells.map((cell, i) =>
    normalizeCell(cell, `${row.id}-c${i + 1}`),
  );
  if (!cells.length) cells.push(normalizeCell(bindingFromRow(row), `${row.id}-c1`));
  while (cells.length < columns) {
    cells.push(emptyCell(`${row.id}-c${cells.length + 1}`));
  }
  cells = pullParkedBindingsIntoVisibleHoles(cells, columns);
  const first = cells[0];
  return {
    ...row,
    enabled: row.enabled !== false,
    columns,
    cells,
    kind: first?.kind ?? "empty",
    featureId: first?.featureId,
    recordType: first?.recordType,
    recordId: first?.recordId,
    recordMode: first?.recordMode,
    recordIds: first?.recordIds,
    driver: first?.driver,
  };
}

/** Drop one empty visible column and lower the row's column count by one. */
export function removeEmptyColumn(row: PageBuilderSection, index: number): PageBuilderSection | null {
  const prepared = ensureRowCells(row);
  const columns = clampSectionColumns(prepared.columns);
  if (columns <= 1 || index < 0 || index >= columns) return null;
  const cells = [...(prepared.cells ?? [])];
  const cell = cells[index];
  if (!cell || cell.kind !== "empty" || String(cell.pairingId ?? "").trim()) return null;
  cells.splice(index, 1);
  return ensureRowCells({
    ...prepared,
    columns: clampCanvasColumns(columns - 1),
    cells,
  });
}

/** Cells on this Row that already have an Element. Includes parked cells. */
export function rowElementCount(row: PageBuilderSection): number {
  const cells = ensureRowCells(row).cells ?? [];
  return cells.filter((cell) => Boolean(String(cell.pairingId ?? "").trim()) || cell.kind !== "empty").length;
}

/** Visible Cells for a Row (first `columns` entries). */
export function visibleCells(row: PageBuilderSection): PageBuilderCell[] {
  const next = ensureRowCells(row);
  return (next.cells ?? []).slice(0, clampSectionColumns(next.columns));
}

export type PairingCellUsage = {
  canvas: string;
  rowId: string;
  rowLabel: string;
  cellIndex: number;
};

/** Cells that still store this pairingId. Delete of the pairing must fail while any exist. */
export function remapPairingIds(
  state: PageBuilderState,
  remap: Map<string, string>,
): PageBuilderState {
  if (!remap.size) return state;
  const rewrite = (rows: PageBuilderSection[] | undefined): PageBuilderSection[] =>
    (rows ?? []).map((row) => ({
      ...row,
      cells: (row.cells ?? []).map((cell) => {
        const next = cell.pairingId ? remap.get(cell.pairingId) : undefined;
        return next ? { ...cell, pairingId: next } : cell;
      }),
    }));
  const home_sections = rewrite(state.home_sections);
  const canvases = (state.canvases ?? []).map((canvas) => ({
    ...canvas,
    sections: rewrite(canvas.sections),
  }));
  const custom = canvases[0]
    ? { ...state.custom, ...canvases[0], sections: canvases[0].sections }
    : { ...state.custom, sections: rewrite(state.custom.sections) };
  return { ...state, home_sections, canvases, custom };
}

export function pairingCellUsages(
  state: PageBuilderState,
  pairingId: string,
): PairingCellUsage[] {
  const id = pairingId.trim();
  if (!id) return [];
  const found: PairingCellUsage[] = [];
  const walk = (canvas: string, rows: PageBuilderSection[] | undefined) => {
    for (const row of rows ?? []) {
      (row.cells ?? []).forEach((cell, cellIndex) => {
        if (cell.pairingId === id) {
          found.push({
            canvas,
            rowId: row.id,
            rowLabel: row.label || row.id,
            cellIndex,
          });
        }
      });
    }
  };
  walk("Primary Canvas", state.home_sections);
  for (const canvas of state.canvases ?? []) {
    walk(canvas.label || canvas.slug, canvas.sections);
  }
  return found;
}

export function patchRowCell(
  row: PageBuilderSection,
  cellIndex: number,
  patch: Partial<PageBuilderCell>,
): PageBuilderSection {
  const next = ensureRowCells(row);
  const cells = [...(next.cells ?? [])];
  const cur = cells[cellIndex] ?? emptyCell(`${row.id}-c${cellIndex + 1}`);
  cells[cellIndex] = { ...cur, ...patch };
  return ensureRowCells({ ...next, cells });
}

/** Unbind the Element. Cell id and On/Off stay; pairing and binding fields go. */
export function clearCellBinding(
  row: PageBuilderSection,
  cellIndex: number,
): PageBuilderSection {
  const next = ensureRowCells(row);
  const cells = [...(next.cells ?? [])];
  const cur = cells[cellIndex];
  if (!cur || cur.kind === "empty") return next;
  cells[cellIndex] = { ...emptyCell(cur.id), enabled: cur.enabled };
  return ensureRowCells({ ...next, cells });
}

/** Default Add-row name. Hidden on the visitor canvas; On is locked until staff rename it. */
export function isBlankSlotLabel(label: string): boolean {
  const raw = label.trim();
  if (!raw) return false;
  return raw === '__blank__' || /^__blank__\s*\d+$/.test(raw);
}

/** Visitor + builder heading for a Primary Canvas row. Catalog names are the fallback. */
export function homeRowLabel(
  sections: PageBuilderSection[] | undefined,
  id: string,
  fallback?: string,
): string {
  const raw = sections?.find((row) => row.id === id)?.label?.trim();
  if (raw && !isBlankSlotLabel(raw)) return raw.slice(0, 48);
  const catalog = (HOME_SECTION_LABELS as Record<string, string>)[id];
  return fallback ?? catalog ?? id;
}

export function homeRowLabelMap(
  sections?: PageBuilderSection[],
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const row of sections ?? []) {
    map[row.id] = homeRowLabel(sections, row.id);
  }
  return map;
}

/** Default canvas width when unset (80% of the inner frame). */
export const DEFAULT_CANVAS_WIDTH_PCT = 80;
export const DEFAULT_CANVAS_MARGIN = 0;
export const DEFAULT_HOME_WIDTH_PCT = 100;
/** Phones and tablets start full-bleed with a small inset, not the desktop frame. */
export const DEFAULT_MOBILE_CANVAS_WIDTH_PCT = 100;
export const DEFAULT_MOBILE_CANVAS_MARGIN = 16;

/** Canvas width 0–100 (step 5). 0 disables the canvas. Missing → default 80. */
export function clampCanvasWidth(pct: unknown): number {
  if (pct === undefined || pct === null || pct === "") return DEFAULT_CANVAS_WIDTH_PCT;
  const n = typeof pct === "number" ? Math.round(pct) : Number.parseInt(String(pct ?? ""), 10);
  if (!Number.isFinite(n)) return DEFAULT_CANVAS_WIDTH_PCT;
  const stepped = Math.round(n / 5) * 5;
  return Math.min(100, Math.max(0, stepped));
}

/** Mobile canvas width. Missing stays 100 so a desktop 75% frame does not shrink the phone. */
export function clampMobileCanvasWidth(pct: unknown): number {
  if (pct === undefined || pct === null || pct === "") return DEFAULT_MOBILE_CANVAS_WIDTH_PCT;
  return clampCanvasWidth(pct);
}

export function clampCanvasMarginUnit(raw: unknown): CanvasMarginUnit {
  return raw === "pct" ? "pct" : "px";
}

export function clampCanvasMargin(raw: unknown, unit: CanvasMarginUnit = "px"): number {
  const n = typeof raw === "number" ? Math.round(raw) : Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  if (unit === "pct") return Math.min(25, n);
  return Math.min(200, n);
}

export function canvasIsDisabled(
  widthPct: number | undefined,
  enabled?: boolean,
): boolean {
  if (enabled === false) return true;
  return clampCanvasWidth(widthPct ?? DEFAULT_CANVAS_WIDTH_PCT) === 0;
}

export function canvasFrameStyle(
  widthPct: number | undefined,
  margin: number | undefined,
  unit: CanvasMarginUnit | undefined,
): {
  pad: { padding: string };
  inner: { width: string; marginLeft: string; marginRight: string; minWidth: number };
} {
  const u = clampCanvasMarginUnit(unit);
  const m = clampCanvasMargin(margin, u);
  const w = clampCanvasWidth(widthPct);
  return {
    pad: { padding: u === "pct" ? `${m}%` : `${m}px` },
    inner: {
      width: w === 0 ? "0" : `${w}%`,
      marginLeft: "auto",
      marginRight: "auto",
      minWidth: 0,
    },
  };
}

/** Desktop metrics from 1024px up; mobile metrics below that. Variables inherit. */
export function canvasMetricVars(input: {
  widthPct?: number;
  margin?: number;
  marginUnit?: CanvasMarginUnit;
  mobileWidthPct?: number;
  mobileMargin?: number;
  mobileMarginUnit?: CanvasMarginUnit;
}): CSSProperties {
  const desk = canvasFrameStyle(input.widthPct, input.margin, input.marginUnit);
  const mobileUnit =
    input.mobileMargin === undefined && input.mobileMarginUnit === undefined
      ? "px"
      : clampCanvasMarginUnit(input.mobileMarginUnit);
  const mobileMargin =
    input.mobileMargin === undefined
      ? DEFAULT_MOBILE_CANVAS_MARGIN
      : clampCanvasMargin(input.mobileMargin, mobileUnit);
  const mob = canvasFrameStyle(
    clampMobileCanvasWidth(input.mobileWidthPct),
    mobileMargin,
    mobileUnit,
  );
  return {
    "--pb-w": desk.inner.width,
    "--pb-w-m": mob.inner.width,
    "--pb-pad": desk.pad.padding,
    "--pb-pad-m": mob.pad.padding,
  } as CSSProperties;
}

/** Canvas columns are 1 through 8. */
export function clampCanvasColumns(cols: unknown): CanvasColumnCount {
  const n = typeof cols === "number" ? Math.round(cols) : Number.parseInt(String(cols ?? ""), 10);
  if (n >= 1 && n <= 8) return n as CanvasColumnCount;
  return 1;
}

/** Lowest column count that still shows every filled cell, then 1..8 above it. */
export function nextCanvasColumns(current: unknown, filled = 0): CanvasColumnCount {
  const floor = Math.min(8, Math.max(1, Math.floor(filled) || 1)) as CanvasColumnCount;
  const cur = clampCanvasColumns(current);
  const allowed = CANVAS_COLUMN_COUNTS.filter((n) => n >= floor);
  if (!allowed.includes(cur)) return allowed[0];
  return allowed[(allowed.indexOf(cur) + 1) % allowed.length];
}

/** PB-15: section content width as % of the canvas (25-100, default 100). */
export const DEFAULT_SECTION_WIDTH_PCT = 100;

export function clampSectionWidth(pct: unknown): number {
  const n = typeof pct === "number" ? Math.round(pct) : Number.parseInt(String(pct ?? ""), 10);
  if (!Number.isFinite(n)) return DEFAULT_SECTION_WIDTH_PCT;
  const stepped = Math.round(n / 5) * 5;
  return Math.min(100, Math.max(25, stepped));
}

/** Row width below 1024px. Missing stays 100. */
export function clampMobileSectionWidth(pct: unknown): number {
  if (pct === undefined || pct === null || pct === "") return DEFAULT_SECTION_WIDTH_PCT;
  return clampSectionWidth(pct);
}

export function rowWidthVars(desktop: unknown, mobile: unknown): CSSProperties {
  return {
    "--pb-row-w": `${clampSectionWidth(desktop)}%`,
    "--pb-row-w-m": `${clampMobileSectionWidth(mobile)}%`,
  } as CSSProperties;
}

export function clampSectionColumns(cols: unknown, canvasDefault?: unknown): CanvasColumnCount {
  if (cols === undefined || cols === null || cols === "") {
    return clampCanvasColumns(canvasDefault ?? 1);
  }
  return clampCanvasColumns(cols);
}

/** PB-15: width of a section inside its canvas (percent of the canvas, centered). */
export function sectionWidthClass(pct: number | undefined): string {
  switch (clampSectionWidth(pct)) {
    case 25: return "w-[25%] mx-auto";
    case 30: return "w-[30%] mx-auto";
    case 35: return "w-[35%] mx-auto";
    case 40: return "w-[40%] mx-auto";
    case 45: return "w-[45%] mx-auto";
    case 50: return "w-[50%] mx-auto";
    case 55: return "w-[55%] mx-auto";
    case 60: return "w-[60%] mx-auto";
    case 65: return "w-[65%] mx-auto";
    case 70: return "w-[70%] mx-auto";
    case 75: return "w-[75%] mx-auto";
    case 80: return "w-[80%] mx-auto";
    case 85: return "w-[85%] mx-auto";
    case 90: return "w-[90%] mx-auto";
    case 95: return "w-[95%] mx-auto";
    default: return "w-full";
  }
}

/** Tailwind grid classes for a canvas row (1 through 8). */
export function sectionColumnsClass(cols: number | undefined): string {
  switch (clampSectionColumns(cols)) {
    case 2: return "grid grid-cols-1 gap-6 lg:grid-cols-2";
    case 3: return "grid grid-cols-1 gap-6 lg:grid-cols-3";
    case 4: return "grid grid-cols-1 gap-6 lg:grid-cols-4";
    case 5: return "grid grid-cols-1 gap-6 lg:grid-cols-5";
    case 6: return "grid grid-cols-1 gap-6 lg:grid-cols-6";
    case 7: return "grid grid-cols-1 gap-6 lg:grid-cols-7";
    case 8: return "grid grid-cols-1 gap-6 lg:grid-cols-8";
    default: return "grid grid-cols-1 gap-6";
  }
}

/** PB-10: Tailwind width classes for a canvas width percent (viewport-relative). */
export function canvasWidthClass(pct: number | undefined): string {
  switch (clampCanvasWidth(pct)) {
    case 50: return "w-[50vw] max-w-full";
    case 60: return "w-[60vw] max-w-full";
    case 70: return "w-[70vw] max-w-full";
    case 80: return "w-[80vw] max-w-full";
    case 90: return "w-[90vw] max-w-full";
    default: return "w-[95vw] max-w-full";
  }
}

/** @deprecated PB-16: use sectionColumnsClass. Kept as alias for saved canvas-level default. */
export function canvasColumnsClass(cols: number | undefined): string {
  return sectionColumnsClass(cols);
}

/** PB-12 (Stephen, 2026-09-14 02:48): a feature can appear only ONCE per canvas.
 *  Returns the feature ids already bound on this canvas (excluding one section id). */
export function usedFeatureIds(
  canvas: { sections?: PageBuilderSection[] } | undefined | null,
  exceptSectionId?: string,
  exceptCellId?: string,
): Set<string> {
  const used = new Set<string>();
  for (const row of canvas?.sections ?? []) {
    if (row.id === exceptSectionId && !exceptCellId) continue;
    const cells = visibleCells(ensureRowCells(row));
    for (const cell of cells) {
      if (exceptCellId && cell.id === exceptCellId) continue;
      if (cell.kind === "feature" && cell.featureId) used.add(cell.featureId);
    }
  }
  return used;
}

function emptySection(id: string, label: string): PageBuilderSection {
  return ensureRowCells({
    id,
    label,
    kind: "empty",
    enabled: true,
    idManual: false,
    width_pct: DEFAULT_SECTION_WIDTH_PCT,
    columns: 1,
    display_px: DEFAULT_ROW_HEIGHT_PX,
    height_unit: "px",
    height_px: DEFAULT_ROW_HEIGHT_PX,
    height_vh: DEFAULT_ROW_HEIGHT_VH,
  });
}

/** Staff-added Primary row. Not a catalog hash. */
export function blankHomeSection(id: string, label: string): PageBuilderSection {
  return emptySection(id, label);
}

export function defaultHomeSection(id: (typeof HOMEPAGE_SLOT_ORDER)[number]): PageBuilderSection {
  return { ...emptySection(id, HOME_SECTION_LABELS[id]), idManual: true };
}

export function defaultHomeSections(): PageBuilderSection[] {
  return HOMEPAGE_SLOT_ORDER.map((id) => defaultHomeSection(id));
}

/** Earlier defaults. Folded to the current default on load. */
export const PREVIOUS_DEFAULT_ROW_HEIGHTS_PX = [240, 336];
/** Cell paint area — total Row body height. */
export const DEFAULT_ROW_HEIGHT_PX = 650;
export const MIN_ROW_HEIGHT_PX = 140;
export const MAX_ROW_HEIGHT_PX = 900;

export function clampRowHeight(raw: unknown): number {
  const n = typeof raw === "number" ? Math.round(raw) : Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n) || PREVIOUS_DEFAULT_ROW_HEIGHTS_PX.includes(n)) return DEFAULT_ROW_HEIGHT_PX;
  return Math.min(MAX_ROW_HEIGHT_PX, Math.max(MIN_ROW_HEIGHT_PX, n));
}

export const DEFAULT_ROW_HEIGHT_VH = 40;
export const MIN_ROW_HEIGHT_VH = 10;
export const MAX_ROW_HEIGHT_VH = 100;

export function clampRowHeightUnit(raw: unknown): RowHeightUnit {
  return raw === "vh" ? "vh" : "px";
}

export function clampRowHeightVh(raw: unknown): number {
  const n = typeof raw === "number" ? Math.round(raw) : Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n)) return DEFAULT_ROW_HEIGHT_VH;
  return Math.min(MAX_ROW_HEIGHT_VH, Math.max(MIN_ROW_HEIGHT_VH, n));
}

/**
 * Visitor cell height inside a one-viewport Row.
 * Pixels are cut down to the viewport. Viewport % is a share of the screen and is not cut again.
 */
export function rowHeightCss(row: {
  height_px?: number;
  height_vh?: number;
  height_unit?: unknown;
}): string {
  if (clampRowHeightUnit(row.height_unit) === "vh") return `${clampRowHeightVh(row.height_vh)}svh`;
  return `min(${clampRowHeight(row.height_px)}px, 100svh)`;
}

export const DEFAULT_CUSTOM_CANVAS: CustomCanvas = {
  enabled: true,
  slug: "overview",
  slugManual: false,
  label: "Overview",
  sections: [emptySection("intro", "Intro"), emptySection("detail", "Detail")],
  width_pct: DEFAULT_CANVAS_WIDTH_PCT,
  margin: DEFAULT_CANVAS_MARGIN,
  margin_unit: "px",
  columns: 1,
};

/** After Demo off: one empty row on Primary, one on the shipped custom canvas. */
export function clearedPageBuilder(): PageBuilderState {
  const base = defaultPageBuilder();
  const home = blankHomeSection("row", "Row");
  const custom: CustomCanvas = {
    ...base.custom,
    sections: [emptySection("intro", "Intro")],
  };
  return {
    ...base,
    home_section_order: [home.id],
    home_sections: [home],
    custom,
    canvases: [custom],
  };
}

export function defaultPageBuilder(): PageBuilderState {
  const custom: CustomCanvas = {
    ...DEFAULT_CUSTOM_CANVAS,
    sections: DEFAULT_CUSTOM_CANVAS.sections.map((s) => ({ ...s })),
  };
  return {
    custom,
    canvases: [custom],
    home_section_order: [...DEFAULT_HOME_SECTION_ORDER],
    home_sections: defaultHomeSections(),
    home_hero_enabled: true,
    home_width_pct: DEFAULT_HOME_WIDTH_PCT,
    home_margin: DEFAULT_CANVAS_MARGIN,
    home_margin_unit: "px",
    home_columns: 1,
    home_label: DEFAULT_HOME_LABEL,
  };
}

/** PB-06: spare-canvas factory used by normalize + the operator panel. */
export function blankCanvas(index: number): CustomCanvas {
  return {
    enabled: true,
    slug: `canvas-${index}`,
    slugManual: false,
    label: `Canvas ${index}`,
    sections: DEFAULT_CUSTOM_CANVAS.sections.map((s) => ({ ...s, idManual: false })),
    width_pct: DEFAULT_CANVAS_WIDTH_PCT,
    margin: DEFAULT_CANVAS_MARGIN,
    margin_unit: "px",
    columns: 1,
  };
}

/** PB-06: enabled custom canvases, safest read across old persisted shapes. */
export function enabledCanvases(state: PageBuilderState | undefined | null): CustomCanvas[] {
  const list = state?.canvases?.length ? state.canvases : state?.custom ? [state.custom] : [];
  return list.filter((c) => c && !canvasIsDisabled(c.width_pct, c.enabled));
}

/** PB-06: find an ENABLED canvas by slug (visitor /p/[slug] resolution). */
export function canvasForSlug(state: PageBuilderState | undefined | null, slug: string): CustomCanvas | null {
  return enabledCanvases(state).find((c) => c.slug === slug) ?? null;
}

/** URL token from a label. Empty input uses fallback. */
export function slugifyKey(raw: string, emptyFallback = "row"): string {
  const slug = raw
    .toLowerCase()
    .trim()
    .replace(/^#+/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || emptyFallback;
}

/** First unused slugifyKey among `used`. Suffix -2, -3, … on collision. */
export function uniqueKey(
  raw: string,
  used: Iterable<string>,
  emptyFallback = "row",
): string {
  const taken = new Set(used);
  const base = slugifyKey(raw, emptyFallback);
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

/** True when `id` is not the auto token (or auto-N) for `source`. */
export function isManualKey(id: string, source: string, emptyFallback = "row"): boolean {
  const auto = slugifyKey(source, emptyFallback);
  return id !== auto && !id.startsWith(`${auto}-`);
}

/** PB-06: first slug not used by any canvas, derived from raw (slugify + -2/-3 suffix). */
export function nextCanvasSlug(state: PageBuilderState | undefined | null, raw: string): string {
  const used =
    state?.canvases?.length ? state.canvases : state?.custom ? [state.custom] : [];
  return uniqueKey(
    raw,
    used.map((c) => c.slug),
    "overview",
  );
}

function slugify(raw: string): string {
  return slugifyKey(raw, "overview");
}

function sectionId(raw: string, used: Set<string>): string {
  const next = uniqueKey(raw, used, "row");
  used.add(next);
  return next;
}

function normalizeKind(raw: unknown): SlotKind {
  if (raw === "feature" || raw === "record" || raw === "empty") return raw;
  return "empty";
}

function normalizeSection(rec: Record<string, unknown>, used: Set<string>): PageBuilderSection | null {
  const label = typeof rec.label === "string" && rec.label.trim() ? rec.label.trim().slice(0, 48) : "";
  if (!label) return null;
  const id =
    typeof rec.id === "string" && rec.id.trim()
      ? sectionId(foldHomeSectionId(rec.id), used)
      : sectionId(label, used);
  const kind = normalizeKind(rec.kind);
  const rawFeature =
    typeof rec.featureId === "string" ? foldDriverId(rec.featureId) : undefined;
  const knownFeature =
    Boolean(rawFeature) &&
    !String(rawFeature).startsWith("home:") &&
    PAGE_BUILDER_FEATURES.some((row) => row.id === rawFeature);
  const featureId = rawFeature && knownFeature ? rawFeature : undefined;
  const foldedType =
    typeof rec.recordType === "string" ? foldRecordTypeApiName(rec.recordType) : "";
  const recordType =
    foldedType && PAGE_BUILDER_RECORD_TYPES.some((row) => row.id === foldedType)
      ? foldedType
      : undefined;
  const recordId =
    typeof rec.recordId === "string" && rec.recordId.trim() ? rec.recordId.trim().slice(0, 80) : undefined;
  // PB-13: record binding mode + multi-pick list (single stays the default shape).
  const rawMode = rec.recordMode;
  const recordMode =
    rawMode === "multi" || rawMode === "all" || rawMode === "single" ? rawMode : undefined;
  const recordIds = Array.isArray(rec.recordIds)
    ? rec.recordIds
        .filter((row): row is string => typeof row === "string" && row.trim().length > 0)
        .map((row) => row.trim().slice(0, 80))
        .slice(0, 24)
    : undefined;
  const driver = defaultDriverFor(kind, featureId, recordType);
  const width_pct = clampSectionWidth(rec.width_pct);
  const mobile_width_pct = clampMobileSectionWidth(rec.mobile_width_pct);
  const columns = clampSectionColumns(rec.columns);
  const collapsed = rec.collapsed === true;
  const display_px = clampRowHeight(rec.display_px);
  const height_px = clampRowHeight(rec.height_px);
  const height_unit = clampRowHeightUnit(rec.height_unit);
  const height_vh = clampRowHeightVh(rec.height_vh);
  const enabled = rec.enabled !== false && !isBlankSlotLabel(label);
  const cells = Array.isArray(rec.cells) ? rec.cells : undefined;
  const idManual =
    rec.idManual === true
      ? true
      : rec.idManual === false
        ? false
        : isManualKey(id, label, "row");
  if (kind === "feature" && !featureId) {
    return ensureRowCells({
      id,
      label,
      kind: "empty",
      width_pct,
      mobile_width_pct,
      columns,
      collapsed,
      display_px,
      height_unit,
      height_px,
      height_vh,
      enabled,
      idManual,
      cells: cells as PageBuilderCell[] | undefined,
    });
  }
  if (kind === "feature") {
    return ensureRowCells({
      id,
      label,
      kind,
      featureId,
      driver,
      width_pct,
      mobile_width_pct,
      columns,
      collapsed,
      display_px,
      height_unit,
      height_px,
      height_vh,
      enabled,
      idManual,
      cells: cells as PageBuilderCell[] | undefined,
    });
  }
  if (kind === "record") {
    return ensureRowCells({
      id,
      label,
      kind,
      recordType: recordType ?? PAGE_BUILDER_RECORD_TYPES[0].id,
      recordId,
      recordMode,
      recordIds,
      driver,
      width_pct,
      mobile_width_pct,
      columns,
      collapsed,
      display_px,
      height_unit,
      height_px,
      height_vh,
      enabled,
      idManual,
      cells: cells as PageBuilderCell[] | undefined,
    });
  }
  return ensureRowCells({
    id,
    label,
    kind: "empty",
    width_pct,
    mobile_width_pct,
    columns,
    collapsed,
    display_px,
    height_unit,
    height_px,
    height_vh,
    enabled,
    idManual,
    cells: cells as PageBuilderCell[] | undefined,
  });
}

function normalizeCanvas(
  rec: Record<string, unknown>,
  fallback: CustomCanvas,
  usedSlugs: Set<string>,
): CustomCanvas {
  const used = new Set<string>();
  const sectionsIn = Array.isArray(rec.sections) ? rec.sections : fallback.sections;
  const sections: PageBuilderSection[] = [];
  for (const row of sectionsIn.slice(0, 8)) {
    if (!row || typeof row !== "object") continue;
    const next = normalizeSection(row as Record<string, unknown>, used);
    if (next) sections.push(next);
  }
  if (!sections.length) sections.push(...fallback.sections.map((s) => ({ ...s })));
  const label =
    typeof rec.label === "string" && rec.label.trim()
      ? rec.label.trim().slice(0, 48)
      : fallback.label;
  const slug = uniqueCanvasSlug(
    typeof rec.slug === "string" && rec.slug.trim() ? rec.slug : label,
    usedSlugs,
  );
  const slugManual =
    rec.slugManual === true
      ? true
      : rec.slugManual === false
        ? false
        : isManualKey(slug, label, "overview");
  return {
    enabled: rec.enabled !== false,
    slug,
    slugManual,
    label,
    sections,
    width_pct: clampCanvasWidth(rec.width_pct),
    margin: clampCanvasMargin(rec.margin, clampCanvasMarginUnit(rec.margin_unit)),
    margin_unit: clampCanvasMarginUnit(rec.margin_unit),
    mobile_width_pct: clampMobileCanvasWidth(rec.mobile_width_pct),
    mobile_margin: clampCanvasMargin(
      rec.mobile_margin === undefined ? DEFAULT_MOBILE_CANVAS_MARGIN : rec.mobile_margin,
      rec.mobile_margin_unit === undefined ? "px" : clampCanvasMarginUnit(rec.mobile_margin_unit),
    ),
    mobile_margin_unit:
      rec.mobile_margin_unit === undefined ? "px" : clampCanvasMarginUnit(rec.mobile_margin_unit),
    columns: clampCanvasColumns(rec.columns),
  };
}

/** PB-06: slugify + dedupe against canvases already claimed in this normalize pass. */
function uniqueCanvasSlug(raw: string, usedSlugs: Set<string>): string {
  const base = slugify(raw);
  if (!usedSlugs.has(base)) {
    usedSlugs.add(base);
    return base;
  }
  let n = 2;
  while (usedSlugs.has(`${base}-${n}`)) n += 1;
  const next = `${base}-${n}`;
  usedSlugs.add(next);
  return next;
}

export function normalizePageBuilder(input: unknown): PageBuilderState {
  const fallback = defaultPageBuilder();
  if (!input || typeof input !== "object") return fallback;
  const raw = input as { custom?: unknown; canvases?: unknown };
  const usedSlugs = new Set<string>();

  // Custom canvas 1 keeps legacy priority (persisted fixtures + header default).
  const customRec =
    raw.custom && typeof raw.custom === "object" ? (raw.custom as Record<string, unknown>) : {};
  const custom = normalizeCanvas(customRec, fallback.custom, usedSlugs);

  // PB-06: extra canvases. Entries whose slug source collides with an already-claimed
  // canvas are skipped, so the old canvases[0]-mirrors-custom shape never duplicates.
  const canvases: CustomCanvas[] = [custom];
  const canvasesIn = Array.isArray(raw.canvases) ? raw.canvases : [];
  for (const row of canvasesIn.slice(0, MAX_CANVASES)) {
    if (!row || typeof row !== "object") continue;
    const rec = row as Record<string, unknown>;
    const srcSlug = slugify(
      typeof rec.slug === "string" && rec.slug.trim()
        ? rec.slug
        : typeof rec.label === "string"
          ? rec.label
          : "",
    );
    if (canvases.some((c) => c.slug === srcSlug)) continue;
    canvases.push(
      normalizeCanvas(rec, blankCanvas(canvases.length + 1), usedSlugs),
    );
    if (canvases.length >= MAX_CANVASES) break;
  }
  const rawOrderRaw = (raw as { home_section_order?: unknown }).home_section_order;
  const hadSavedOrder = Array.isArray(rawOrderRaw);
  const rawOrder = hadSavedOrder
    ? rawOrderRaw
        .filter((row): row is string => typeof row === "string")
        .map((id) => foldHomeSectionId(id))
    : [];
  const seenOrder = new Set<string>();
  const order: string[] = [];
  const catalogIds = HOMEPAGE_SLOT_ORDER as readonly string[];
  const retired = new Set<string>(RETIRED_HOME_SECTION_IDS);
  for (const id of rawOrder) {
    if (!id || seenOrder.has(id) || retired.has(id)) continue;
    order.push(id);
    seenOrder.add(id);
  }
  // First persist (field missing) seeds the default catalog. A saved empty
  // list stays empty — deleted rows are not restored.
  if (!hadSavedOrder) {
    for (const id of HOMEPAGE_SLOT_ORDER) {
      if (!seenOrder.has(id)) {
        order.push(id);
        seenOrder.add(id);
      }
    }
  }
  const rawHome = (raw as { home_sections?: unknown }).home_sections;
  const homeUsed = new Set<string>();
  const homeById = new Map<string, PageBuilderSection>();
  if (Array.isArray(rawHome)) {
    for (const row of rawHome) {
      if (!row || typeof row !== "object") continue;
      const next = normalizeSection(row as Record<string, unknown>, homeUsed);
      if (next && !retired.has(next.id)) {
        homeById.set(next.id, next);
      }
    }
  }
  const home_sections = order.map((id) => {
    const saved = homeById.get(id);
    const catalogLabel = (HOME_SECTION_LABELS as Record<string, string>)[id];
    if (saved) {
      return {
        ...saved,
        id,
        label: saved.label || catalogLabel || saved.id,
        idManual: saved.idManual === true || catalogIds.includes(id),
      };
    }
    if ((catalogIds as readonly string[]).includes(id)) {
      return defaultHomeSection(id as (typeof HOMEPAGE_SLOT_ORDER)[number]);
    }
    return blankHomeSection(id, "Row");
  });

  return {
    custom,
    canvases,
    home_section_order: order,
    home_sections,
    home_hero_enabled: (raw as { home_hero_enabled?: unknown }).home_hero_enabled !== false,
    home_width_pct: clampCanvasWidth(
      (raw as { home_width_pct?: unknown }).home_width_pct ?? DEFAULT_HOME_WIDTH_PCT,
    ),
    home_margin: clampCanvasMargin(
      (raw as { home_margin?: unknown }).home_margin,
      clampCanvasMarginUnit((raw as { home_margin_unit?: unknown }).home_margin_unit),
    ),
    home_margin_unit: clampCanvasMarginUnit((raw as { home_margin_unit?: unknown }).home_margin_unit),
    home_mobile_width_pct: clampMobileCanvasWidth(
      (raw as { home_mobile_width_pct?: unknown }).home_mobile_width_pct,
    ),
    home_mobile_margin: clampCanvasMargin(
      (raw as { home_mobile_margin?: unknown }).home_mobile_margin === undefined
        ? DEFAULT_MOBILE_CANVAS_MARGIN
        : (raw as { home_mobile_margin?: unknown }).home_mobile_margin,
      (raw as { home_mobile_margin_unit?: unknown }).home_mobile_margin_unit === undefined
        ? "px"
        : clampCanvasMarginUnit((raw as { home_mobile_margin_unit?: unknown }).home_mobile_margin_unit),
    ),
    home_mobile_margin_unit:
      (raw as { home_mobile_margin_unit?: unknown }).home_mobile_margin_unit === undefined
        ? "px"
        : clampCanvasMarginUnit((raw as { home_mobile_margin_unit?: unknown }).home_mobile_margin_unit),
    home_columns: clampSectionColumns((raw as { home_columns?: unknown }).home_columns ?? 1),
    home_label: normalizeHomeLabel((raw as { home_label?: unknown }).home_label),
  };
}

export function customCanvasHref(canvas: CustomCanvas): string {
  return `/p/${canvas.slug}`;
}

export function isCustomCanvasPath(pathname: string, canvas: CustomCanvas): boolean {
  const path = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  return path === customCanvasHref(canvas);
}

/**
 * PB-05: homepage (primary canvas) render order. Builder order first, then any catalog
 * section the builder order does not know about (forward-compatible), in default order.
 * Visibility still comes from the Public menu (or Demo mode); hero is always first.
 */
export function homepageBuilderSectionOrder(
  saved: string[] | null | undefined,
  visibleIds: string[],
): string[] {
  const catalog = new Set<string>(HOMEPAGE_SLOT_ORDER);
  const order = Array.isArray(saved) ? saved : [...HOMEPAGE_SLOT_ORDER];
  return order.filter((id) => (catalog.has(id) ? visibleIds.includes(id) : Boolean(id)));
}
