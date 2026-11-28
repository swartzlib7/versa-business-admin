/**
 * Print templates (1.0.27, state_printing.md). A template is a `print_template` record: which
 * record type it prints, when it is the one to use, the page, and a layout (JSON) of header and
 * footer bands and body blocks. This module is pure (no I/O): the layout's shape, its checks,
 * which bands show on which page, and which template a record prints with.
 */

export const PRINT_TEMPLATE_TYPE = "print_template";

export type ShowsOn = "every" | "first" | "after_first" | "last" | "pages";
export type Align = "left" | "center" | "right";

export type TextBlock = { type: "text"; text: string; size?: number; bold?: boolean; align?: Align; muted?: boolean };
export type FieldsBlock = { type: "fields"; fields: string[]; columns?: number; labels?: boolean; size?: number };
export type OrganizationBlock = {
  type: "organization";
  /** "own" (the Primary Org) or a lookup field of the record that holds an organization. */
  source: string;
  /** A lookup field holding a Location; "primary" = the organization's Primary address. */
  location?: string;
  title?: string;
  show?: Array<"logo" | "name" | "address" | "phone" | "email">;
  align?: Align;
};
export type LinesColumn = { field: string; label?: string; width?: number; align?: Align };
export type LinesBlock = {
  type: "lines";
  columns: LinesColumn[];
  /** Lines group; empty = the type's main lines. */
  group?: string;
  /** Header fields shown right-aligned under the table (Subtotal, Tax, Amount). */
  totals?: Array<{ field: string; label?: string; bold?: boolean }>;
  /** Only lines where this field has a value (e.g. lines with a Product). */
  only_with?: string;
};
export type SignatureBlock = { type: "signature"; label?: string; lines?: string[] };
export type PageNumberBlock = { type: "page_number"; format?: string; align?: Align };
export type SpacerBlock = { type: "spacer"; height?: number };
export type DividerBlock = { type: "divider" };
export type ColumnsBlock = { type: "columns"; columns: Block[][]; widths?: number[] };

export type Block =
  | TextBlock
  | FieldsBlock
  | OrganizationBlock
  | LinesBlock
  | SignatureBlock
  | PageNumberBlock
  | SpacerBlock
  | DividerBlock
  | ColumnsBlock;

export type Band = { id?: string; area: "header" | "footer"; shows_on: ShowsOn; pages?: string; blocks: Block[] };
export type Layout = { bands: Band[]; body: Block[] };

export const BLOCK_TYPES = ["text", "fields", "organization", "lines", "signature", "page_number", "spacer", "divider", "columns"] as const;
export const SHOWS_ON: ShowsOn[] = ["every", "first", "after_first", "last", "pages"];

/** Page sizes in points (1/72 inch), portrait. */
export const PAGE_SIZES: Record<string, [number, number]> = {
  letter: [612, 792],
  a4: [595.28, 841.89],
  legal: [612, 1008],
};

export type PageSettings = {
  size: keyof typeof PAGE_SIZES | string;
  orientation: "portrait" | "landscape";
  margin_mm: number;
  font: "helvetica" | "times" | "hack";
};

const text = (v: unknown) => (v === null || v === undefined ? "" : String(v)).trim();

/** "1, 3, 5-7" → {1,3,5,6,7}. Unreadable parts are ignored. */
export function parsePages(spec: string | undefined): Set<number> {
  const out = new Set<number>();
  for (const part of text(spec).split(",")) {
    const m = /^\s*(\d+)\s*(?:-\s*(\d+))?\s*$/.exec(part);
    if (!m) continue;
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    for (let n = Math.min(a, b); n <= Math.max(a, b) && n - Math.min(a, b) < 500; n++) out.add(n);
  }
  return out;
}

/** Does a band show on page `page` (1-based) of `pages`? `pages` unknown (null) = not the last. */
export function bandShows(band: Pick<Band, "shows_on" | "pages">, page: number, pages: number | null): boolean {
  switch (band.shows_on) {
    case "first":
      return page === 1;
    case "after_first":
      return page > 1;
    case "last":
      return pages !== null && page === pages;
    case "pages":
      return parsePages(band.pages).has(page);
    default:
      return true;
  }
}

/** The page settings stored on a template record, with defaults. */
export function pageSettings(data: Record<string, unknown>): PageSettings {
  const size = text(data.page_size).toLowerCase();
  const margin = Number(text(data.margin_mm));
  const font = text(data.font).toLowerCase();
  return {
    size: PAGE_SIZES[size] ? size : "letter",
    orientation: text(data.orientation).toLowerCase() === "landscape" ? "landscape" : "portrait",
    margin_mm: Number.isFinite(margin) && margin >= 5 && margin <= 50 ? margin : 15,
    font: font === "times" || font === "hack" ? font : "helvetica",
  };
}

export type TemplateRow = { id: string; name: string; status?: string; data: Record<string, string> };

/** Does the template's Use when match the record? An empty condition matches every record. */
export function useWhenMatches(template: TemplateRow, record: { data?: Record<string, unknown> | null; status?: string }): boolean {
  const field = text(template.data.use_when_field);
  if (!field) return true;
  const want = text(template.data.use_when_value).toLowerCase();
  const wants = want.split(",").map((w) => w.trim()).filter(Boolean);
  const have = text(field === "status" ? record.data?.status ?? record.status : record.data?.[field]).toLowerCase();
  return wants.length ? wants.includes(have) : have === "";
}

const isActive = (t: TemplateRow) => !["archived", "inactive"].includes(text(t.data.status || t.status || "active").toLowerCase());
const orderOf = (t: TemplateRow) => {
  const n = Number(text(t.data.sort_order));
  return Number.isFinite(n) ? n : 1000;
};

/**
 * The templates a record can print with, best first: active templates for its type, those whose
 * Use when matches first, each group by Order then name. `matches` marks the ones that match.
 */
export function templatesFor(
  templates: TemplateRow[],
  recordType: string,
  record: { data?: Record<string, unknown> | null; status?: string },
): Array<TemplateRow & { matches: boolean }> {
  return templates
    .filter((t) => text(t.data.target_record_type) === recordType && isActive(t))
    .map((t) => ({ ...t, matches: useWhenMatches(t, record) }))
    .sort((a, b) => Number(b.matches) - Number(a.matches) || orderOf(a) - orderOf(b) || a.name.localeCompare(b.name));
}

// ── Checking a layout ──────────────────────────────────────────────────────

export type LayoutCheck = { ok: true; layout: Layout } | { ok: false; message: string };

/**
 * Parse and check a layout. `headerFields` / `lineFields` are the target type's field api names
 * (header and lines), used to refuse names the type does not have.
 */
export function checkLayout(raw: unknown, headerFields: Set<string>, lineFields: Set<string>): LayoutCheck {
  let value: unknown = raw;
  if (typeof raw === "string") {
    if (!raw.trim()) return { ok: true, layout: { bands: [], body: [] } };
    try {
      value = JSON.parse(raw);
    } catch (err) {
      return { ok: false, message: `Layout is not valid JSON: ${err instanceof Error ? err.message : String(err)}.` };
    }
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, message: 'Layout must be an object: { "bands": [...], "body": [...] }.' };
  const v = value as Record<string, unknown>;
  const bands = v.bands ?? [];
  const body = v.body ?? [];
  if (!Array.isArray(bands) || !Array.isArray(body)) return { ok: false, message: 'Layout: "bands" and "body" must be lists.' };
  const problems: string[] = [];
  const known = new Set([...headerFields, ...lineFields, "name", "status"]);
  const headerish = new Set([...headerFields, "name", "status"]);
  const checkBlocks = (blocks: unknown[], where: string, inBand: boolean) => {
    blocks.forEach((b, i) => {
      const at = `${where} block ${i + 1}`;
      if (!b || typeof b !== "object") return problems.push(`${at} is not an object.`);
      const block = b as Record<string, unknown>;
      const type = text(block.type);
      if (!(BLOCK_TYPES as readonly string[]).includes(type)) return problems.push(`${at}: unknown type "${type}". Types: ${BLOCK_TYPES.join(", ")}.`);
      const field = (name: unknown, set: Set<string>, what: string) => {
        const n = text(name);
        if (n && !set.has(n)) problems.push(`${at} (${type}): no ${what} "${n}" on this record type.`);
      };
      if (type === "text") {
        if (typeof block.text !== "string") problems.push(`${at} (text): "text" is required.`);
        for (const m of String(block.text ?? "").matchAll(/\{([a-z0-9_]+)\}/gi)) {
          if (!["page", "pages", "today"].includes(m[1]) && !known.has(m[1])) problems.push(`${at} (text): no field "${m[1]}" for {${m[1]}}.`);
        }
      } else if (type === "fields") {
        if (!Array.isArray(block.fields) || !block.fields.length) problems.push(`${at} (fields): "fields" must list field api names.`);
        else block.fields.forEach((f) => field(f, headerish, "field"));
      } else if (type === "organization") {
        const source = text(block.source);
        if (!source) problems.push(`${at} (organization): "source" is "own" or a lookup field holding an organization.`);
        else if (source !== "own") field(source, headerish, "field");
        const loc = text(block.location);
        if (loc && loc !== "primary") field(loc, headerish, "field");
      } else if (type === "lines") {
        if (inBand) problems.push(`${at}: the lines table goes in the body, not in a header or footer.`);
        if (!Array.isArray(block.columns) || !block.columns.length) problems.push(`${at} (lines): "columns" must list { "field": … }.`);
        else (block.columns as Array<Record<string, unknown>>).forEach((c) => field(c?.field, lineFields, "lines field"));
        if (Array.isArray(block.totals)) (block.totals as Array<Record<string, unknown>>).forEach((t) => field(t?.field, headerish, "field"));
        if (block.only_with !== undefined) field(block.only_with, lineFields, "lines field");
      } else if (type === "columns") {
        if (!Array.isArray(block.columns) || !block.columns.every(Array.isArray)) problems.push(`${at} (columns): "columns" must be a list of block lists.`);
        else (block.columns as unknown[][]).forEach((col, c) => checkBlocks(col, `${at} column ${c + 1}`, inBand));
      }
    });
  };
  bands.forEach((band, i) => {
    const at = `Band ${i + 1}`;
    if (!band || typeof band !== "object") return problems.push(`${at} is not an object.`);
    const b = band as Record<string, unknown>;
    if (b.area !== "header" && b.area !== "footer") problems.push(`${at}: "area" is "header" or "footer".`);
    if (!SHOWS_ON.includes(b.shows_on as ShowsOn)) problems.push(`${at}: "shows_on" is one of ${SHOWS_ON.join(", ")}.`);
    if (b.shows_on === "pages" && !parsePages(String(b.pages ?? "")).size) problems.push(`${at}: "pages" lists page numbers, e.g. "1, 3".`);
    if (!Array.isArray(b.blocks)) problems.push(`${at}: "blocks" must be a list.`);
    else checkBlocks(b.blocks, at, true);
  });
  checkBlocks(body, "Body", false);
  if (problems.length) return { ok: false, message: problems.slice(0, 8).join(" ") + (problems.length > 8 ? ` (${problems.length - 8} more)` : "") };
  return { ok: true, layout: { bands: bands as Band[], body: body as Block[] } };
}
