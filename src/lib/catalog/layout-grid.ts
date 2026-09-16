/** Shared grid counts for the Layout Editor and runtime forms. */
export const LAYOUT_COLUMN_COUNTS = [1, 2, 4, 6, 8] as const;
export type LayoutColumnCount = (typeof LAYOUT_COLUMN_COUNTS)[number];

export function normalizeLayoutColumns(raw: unknown): LayoutColumnCount {
  const n = Number(raw);
  if (n === 1 || n === 2 || n === 4 || n === 6 || n === 8) return n;
  return 2;
}

export function normalizeLayoutSpan(raw: unknown, columns: LayoutColumnCount): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) return 1;
  return Math.min(n, columns);
}

export function nextLayoutColumns(current: unknown): LayoutColumnCount {
  const cur = normalizeLayoutColumns(current);
  const i = LAYOUT_COLUMN_COUNTS.indexOf(cur);
  return LAYOUT_COLUMN_COUNTS[(i + 1) % LAYOUT_COLUMN_COUNTS.length];
}

export function nextLayoutSpan(current: unknown, columns: LayoutColumnCount): number {
  const cur = normalizeLayoutSpan(current, columns);
  return cur >= columns ? 1 : cur + 1;
}

/** Runtime form grid — same column count as the Layout Editor canvas. */
export function sectionGridClass(columns: LayoutColumnCount): string {
  switch (columns) {
    case 1:
      return "grid grid-cols-1 gap-3";
    case 2:
      return "grid grid-cols-2 gap-3";
    case 4:
      return "grid grid-cols-4 gap-3";
    case 6:
      return "grid grid-cols-6 gap-3";
    case 8:
      return "grid grid-cols-8 gap-3";
  }
}

/**
 * Field span classes. Tailwind needs a static map — do not interpolate
 * `col-span-${n}` or the JIT will drop the class.
 */
export function fieldSpanClass(span: number, columns: LayoutColumnCount): string | undefined {
  return editorFieldSpanClass(span, columns);
}

/** Editor canvas uses the true column count (no responsive collapse). */
export function editorSectionGridClass(columns: LayoutColumnCount): string {
  switch (columns) {
    case 1:
      return "grid-cols-1";
    case 2:
      return "grid-cols-2";
    case 4:
      return "grid-cols-4";
    case 6:
      return "grid-cols-6";
    case 8:
      return "grid-cols-8";
  }
}

export function editorFieldSpanClass(span: number, columns: LayoutColumnCount): string | undefined {
  const s = normalizeLayoutSpan(span, columns);
  if (s <= 1) return undefined;
  if (s === 2) return "col-span-2";
  if (s === 3) return "col-span-3";
  if (s === 4) return "col-span-4";
  if (s === 5) return "col-span-5";
  if (s === 6) return "col-span-6";
  if (s === 7) return "col-span-7";
  return "col-span-8";
}

/** Stored empty cell so a column can have a hole: [1][2] / [ ][3]. */
export const BLANK_API_PREFIX = "__blank__";

export function isBlankLayoutApiName(apiName: string): boolean {
  return apiName.startsWith(BLANK_API_PREFIX);
}

let blankSeq = 0;
export function newBlankApiName(): string {
  blankSeq += 1;
  return `${BLANK_API_PREFIX}${Date.now()}-${blankSeq}`;
}

export type FlowField = { api_name: string; span: number };

export type FieldPlacement = {
  api_name: string;
  span: number;
  row: number;
  col: number;
  index: number;
};

/** CSS-grid auto-flow positions (row-major, wrap when span does not fit). */
export function placeLayoutFields(
  fields: FlowField[],
  columns: LayoutColumnCount,
): FieldPlacement[] {
  const placed: FieldPlacement[] = [];
  let row = 0;
  let col = 0;
  fields.forEach((field, index) => {
    const span = normalizeLayoutSpan(field.span, columns);
    if (col + span > columns) {
      row += 1;
      col = 0;
    }
    placed.push({ api_name: field.api_name, span, row, col, index });
    col += span;
    if (col >= columns) {
      row += 1;
      col = 0;
    }
  });
  return placed;
}

export type GridCell =
  | { kind: "field"; api_name: string; span: number; index: number }
  | { kind: "empty" }
  | { kind: "covered" };

export type LayoutGridOptions = {
  extraTop?: number;
  extraBottom?: number;
};

export function layoutGridCells(
  fields: FlowField[],
  columns: LayoutColumnCount,
  extraOrOpts: number | LayoutGridOptions = 1,
): {
  rows: number;
  extraTop: number;
  at: (row: number, col: number) => GridCell;
} {
  const extraTop = typeof extraOrOpts === "number" ? 0 : Math.max(0, extraOrOpts.extraTop ?? 0);
  const extraBottom =
    typeof extraOrOpts === "number" ? extraOrOpts : Math.max(0, extraOrOpts.extraBottom ?? 1);
  const placed = placeLayoutFields(fields, columns);
  const maxRow = placed.reduce((m, p) => Math.max(m, p.row), -1);
  const contentRows = Math.max(maxRow + 1, 0);
  const rows = extraTop + contentRows + extraBottom;
  const starts = new Map<string, FieldPlacement>();
  const covered = new Set<string>();
  for (const p of placed) {
    starts.set(`${p.row}:${p.col}`, p);
    for (let i = 1; i < p.span; i++) covered.add(`${p.row}:${p.col + i}`);
  }
  return {
    rows,
    extraTop,
    at(row, col) {
      const logical = row - extraTop;
      if (logical < 0) return { kind: "empty" };
      const key = `${logical}:${col}`;
      if (covered.has(key)) return { kind: "covered" };
      const p = starts.get(key);
      if (p) return { kind: "field", api_name: p.api_name, span: p.span, index: p.index };
      return { kind: "empty" };
    },
  };
}

/** Visual editor row → stored grid row. Rows above content prepend a new top row. */
export function visualToDropCell(
  visualRow: number,
  extraTop: number,
): { row: number; prependRow: boolean } {
  if (visualRow < extraTop) return { row: 0, prependRow: true };
  return { row: visualRow - extraTop, prependRow: false };
}

export function trimTrailingBlanks<T extends FlowField>(fields: T[]): T[] {
  const next = [...fields];
  while (next.length && isBlankLayoutApiName(next[next.length - 1].api_name)) {
    next.pop();
  }
  return next;
}

/** Leave a hole so neighbors do not pack into the vacated cell. */
export function replaceFieldWithBlanks<T extends FlowField>(
  fields: T[],
  apiName: string,
  makeBlank: (span: number) => T,
): T[] {
  return fields.map((f) => {
    if (f.api_name !== apiName) return f;
    const span = Math.max(1, Number(f.span) || 1);
    return { ...makeBlank(span), span };
  });
}

/**
 * Place `incoming` at (targetRow, targetCol). Empty cells become stored blanks
 * so a later field can sit under another in the same column.
 */
export function insertFieldAtCell<T extends FlowField>(
  existing: T[],
  columns: LayoutColumnCount,
  targetRow: number,
  targetCol: number,
  incoming: T,
  makeBlank: (span: number) => T,
  opts?: { prependRow?: boolean },
): T[] {
  const working = opts?.prependRow
    ? [
        ...Array.from({ length: columns }, () => makeBlank(1)),
        ...existing.filter((f) => f.api_name !== incoming.api_name),
      ]
    : existing;
  const span = normalizeLayoutSpan(incoming.span, columns);
  const col = Math.max(0, Math.min(targetCol, columns - span));
  const row = opts?.prependRow ? 0 : Math.max(0, targetRow);
  const placed = placeLayoutFields(working, columns);
  const rows = Math.max(placed.reduce((m, p) => Math.max(m, p.row), -1), row) + 1;
  const grid: Array<Array<T | undefined>> = Array.from({ length: rows }, () =>
    Array.from({ length: columns }, () => undefined),
  );
  for (const p of placed) {
    grid[p.row][p.col] = { ...working[p.index], span: p.span };
  }
  grid[row][col] = { ...incoming, span };
  const out: T[] = [];
  for (let r = 0; r < rows; r++) {
    let c = 0;
    while (c < columns) {
      const cell = grid[r][c];
      if (cell) {
        const s = normalizeLayoutSpan(cell.span, columns);
        out.push({ ...cell, span: s });
        c += s;
      } else {
        out.push(makeBlank(1));
        c += 1;
      }
    }
  }
  return trimTrailingBlanks(out);
}
