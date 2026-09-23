"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { BooleanSwitch } from "@/components/ui/boolean-switch";
import {
  BarChart3,
  BookOpen,
  Boxes,
  ChevronDown,
  ClipboardCheck,
  Columns2,
  FileText,
  GripVertical,
  Layers,
  LayoutGrid,
  Library,
  Mail,
  Orbit,
  Plug,
  Plus,
  Rows3,
  X,
  type LucideIcon,
} from "lucide-react";
import { recordTypeLabel } from "@/lib/public/element-types";
import {
  defaultOutputId,
  isKnownOutput,
  outputsForDriver,
} from "@/lib/public/render-drivers";
import {
  codeKeyFromDriverRecord,
  pairingFromRecord,
  type ListedRecord,
} from "@/lib/public/driver-pairings";
import {
  CANVAS_COLUMN_COUNTS,
  nextCanvasColumns,
  clampCanvasColumns,
  type CanvasColumnCount,
  cellBindingLabel,
  clampCanvasMargin,
  clampCanvasMarginUnit,
  clampCanvasWidth,
  clampRowHeight,
  clampRowHeightUnit,
  clampRowHeightVh,
  MIN_ROW_HEIGHT_PX,
  MAX_ROW_HEIGHT_PX,
  MIN_ROW_HEIGHT_VH,
  MAX_ROW_HEIGHT_VH,
  type RowHeightUnit,
  clampSectionWidth,
  ensureRowCells,
  slotBindingLabel,
  visibleCells,
  type CanvasMarginUnit,
  type PageBuilderCell,
  type PageBuilderSection,
} from "@/lib/public/page-builder";
import { cn } from "@/lib/utils";

export const ELEMENT_ICONS: Record<string, LucideIcon> = {
  "cycle-strip": Orbit,
  glossary: BookOpen,
  "glossary-book": BookOpen,
  "org-board": LayoutGrid,
  "org_board": LayoutGrid,
  statistics: Boxes,
  "stat-graph": BarChart3,
  page: FileText,
  "html-block": FileText,
  inspection_report: ClipboardCheck,
  "header-card": ClipboardCheck,
  contact: Mail,
  location: Mail,
  "contacts-cards": Mail,
  facets: Layers,
  integrations: Plug,
  knowledge: Library,
};

export function iconForBinding(cell: {
  featureId?: string;
  recordType?: string;
  driver?: string;
  id?: string;
}): LucideIcon {
  return (
    ELEMENT_ICONS[cell.featureId || ""] ||
    ELEMENT_ICONS[cell.recordType || ""] ||
    ELEMENT_ICONS[cell.driver || ""] ||
    ELEMENT_ICONS[cell.id || ""] ||
    Boxes
  );
}

export type PickedElement = {
  id: string;
  name: string;
  codeKey: string;
  recordType: string;
  recordId: string;
};

/** Canvas add-to-cell picker. Element records only — not Rendering Drivers. */
export function ElementPickModal({
  onCancel,
  onPick,
}: {
  onCancel: () => void;
  onPick: (element: PickedElement) => void;
}) {
  const [items, setItems] = useState<PickedElement[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const list = (type: string) =>
      fetch(`/api/records?type=${type}&parent_kind=environment&parent=custom`, {
        credentials: "include",
        signal: controller.signal,
      }).then((r) => (r.ok ? r.json() : { data: [] }));
    void Promise.all([list("driver_pairing"), list("render_driver")])
      .then(([pairJson, drvJson]: [{ data?: ListedRecord[] }, { data?: ListedRecord[] }]) => {
        const drivers = drvJson.data ?? [];
        const next: PickedElement[] = [];
        for (const row of pairJson.data ?? []) {
          if (row.status === "archived") continue;
          const fields = pairingFromRecord(row);
          if (!fields) continue;
          const driver = drivers.find((item) => item.id === fields.driver_id);
          next.push({
            id: row.id,
            name: row.name?.trim() || "Element",
            codeKey: codeKeyFromDriverRecord(driver),
            recordType: fields.target_record_type,
            recordId: fields.target_record_id,
          });
        }
        setItems(next);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => controller.abort();
  }, []);
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-labelledby="element-pick-title"
        className="flex max-h-[90vh] w-full max-w-6xl flex-col rounded-lg border border-border bg-background p-5 shadow-lg"
      >
        <h2 id="element-pick-title" className="text-base font-semibold">
          Add element
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose an Element record. Record type, then the Element name. Rendering Drivers are not listed here.
        </p>
        {loaded && items.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No Elements yet. Create them on Canvas → Elements, then add one to this Cell.
          </p>
        ) : (
          <div className="mt-4 grid max-h-[28rem] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 lg:grid-cols-6">
            {items.map((item) => {
              const Icon = iconForBinding({ driver: item.codeKey, recordType: item.recordType });
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onPick(item)}
                  className="flex min-h-[6.5rem] flex-col items-start gap-1.5 rounded-lg border border-border bg-muted/30 p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-xs text-muted-foreground">{recordTypeLabel(item.recordType)}</span>
                  <span className="text-sm font-medium leading-tight">{item.name}</span>
                </button>
              );
            })}
          </div>
        )}
        <div className="mt-5 flex justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

export type CellDragSource = { rowId: string; cellIndex: number };

export function RowVisibilityToggle({
  on,
  onChange,
  label,
  disabled,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <BooleanSwitch
      checked={on}
      onChange={onChange}
      disabled={disabled}
      label={label ?? (on ? "On" : "Off")}
    />
  );
}

export function RowCellStrip({
  row,
  selectedIndex,
  onSelect,
  onToggleCell,
  onAddCell,
  onDropCell,
  onCellDragStart,
  onCellDragEnd,
  onClearCell,
  onRemoveEmptyColumn,
  cellDrag,
  heightCss,
  paintCell,
}: {
  row: PageBuilderSection;
  selectedIndex: number;
  onSelect: (index: number) => void;
  onToggleCell: (index: number, on: boolean) => void;
  onAddCell?: (index: number) => void;
  onDropCell?: (index: number, source: CellDragSource) => void;
  onCellDragStart?: (source: CellDragSource) => void;
  onCellDragEnd?: () => void;
  onClearCell?: (index: number) => void;
  /** Remove this empty column and lower the row column count by one. */
  onRemoveEmptyColumn?: (index: number) => void;
  cellDrag?: CellDragSource | null;
  /** Builder-only paint height. Does not change the visitor height. */
  heightCss?: string;
  paintCell?: (cell: PageBuilderCell, index: number) => ReactNode;
}) {
  const cells = visibleCells(ensureRowCells(row));
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const accepting = Boolean(cellDrag);

  return (
    <div
      className="grid gap-2.5"
      style={{
        gridTemplateColumns: `repeat(${Math.max(1, cells.length)}, minmax(0, 1fr))`,
        height: heightCss,
      }}
    >
      {cells.map((cell, index) => {
        const on = cell.enabled !== false;
        const selected = selectedIndex === index;
        const empty = cell.kind === "empty";
        const filled = !empty;
        const over = overIndex === index;
        const draggingThis =
          cellDrag?.rowId === row.id && cellDrag.cellIndex === index;
        const Icon = iconForBinding(cell);
        const label = empty ? "Add element" : cellBindingLabel(cell);
        const painted = empty ? null : paintCell?.(cell, index);
        const showsPaint = Boolean(painted);
        return (
          <button
            key={cell.id}
            type="button"
            draggable={filled}
            onClick={() => {
              if (empty && onAddCell) {
                onAddCell(index);
                return;
              }
              onSelect(index);
            }}
            onDragStart={(e) => {
              if (!filled) {
                e.preventDefault();
                return;
              }
              const source = { rowId: row.id, cellIndex: index };
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("application/x-pb-cell", JSON.stringify(source));
              onCellDragStart?.(source);
            }}
            onDragEnd={() => {
              setOverIndex(null);
              onCellDragEnd?.();
            }}
            onDragOver={(e) => {
              if (!accepting) return;
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = "move";
              setOverIndex(index);
            }}
            onDragLeave={() => setOverIndex((cur) => (cur === index ? null : cur))}
            onDrop={(e) => {
              if (!accepting) return;
              e.preventDefault();
              e.stopPropagation();
              setOverIndex(null);
              if (cellDrag && onDropCell) onDropCell(index, cellDrag);
            }}
            className={cn(
              "group relative flex h-full min-h-0 w-full min-w-0 flex-col whitespace-normal rounded-xl border-2 p-2 text-left transition-colors",
              !heightCss && "min-h-[7.5rem]",
              empty && !showsPaint
                ? "border-dashed border-primary/35 bg-primary/5"
                : "border-solid border-primary/25 bg-gradient-to-b from-background to-primary/[0.04] shadow-sm",
              selected && "border-primary ring-2 ring-primary/30",
              !selected && (filled || showsPaint) && "border-primary/30",
              accepting && "border-dashed border-primary/45",
              over && "border-primary bg-primary/10 shadow-md",
              draggingThis && "opacity-40",
              on ? "" : "opacity-60",
              filled && "cursor-grab active:cursor-grabbing",
              empty && "cursor-pointer",
            )}
            title={filled ? "Drag to another Cell or Row" : "Add an Element"}
            aria-label={empty ? `Add element to Cell ${index + 1}` : undefined}
          >
            <div className="mb-2 flex items-start justify-between gap-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {filled ? (
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground/70" aria-hidden />
                ) : null}
                Cell {index + 1}
              </span>
              <span className="inline-flex items-center gap-0.5">
                <span
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onDragStart={(e) => e.preventDefault()}
                >
                  <BooleanSwitch
                    checked={on}
                    onChange={(next) => onToggleCell(index, next)}
                    label={on ? "On" : "Off"}
                  />
                </span>
                {empty && onRemoveEmptyColumn && cells.length > 1 ? (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Remove empty column ${index + 1}`}
                    title="Remove this empty column"
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onRemoveEmptyColumn(index);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        onRemoveEmptyColumn(index);
                      }
                    }}
                    onDragStart={(e) => e.preventDefault()}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </span>
                ) : null}
                {filled && onClearCell ? (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Remove element from Cell ${index + 1}`}
                    title="Remove element from this Cell"
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onClearCell(index);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        onClearCell(index);
                      }
                    }}
                    onDragStart={(e) => e.preventDefault()}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </span>
                ) : null}
              </span>
            </div>
            <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
              {showsPaint ? (
                <div className="min-h-0 w-full min-w-0 flex-1 overflow-auto">{painted}</div>
              ) : empty ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2.5">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary/45 bg-primary/15 text-primary shadow-sm transition-transform group-hover:scale-105 group-hover:border-primary group-hover:bg-primary/25 group-hover:shadow-md">
                    <Plus className="h-8 w-8" strokeWidth={2.25} aria-hidden />
                  </span>
                  <span className="text-xs font-semibold text-primary">{label}</span>
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="line-clamp-2 text-center text-sm font-semibold leading-tight">
                    {label}
                  </span>
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function selectedCell(row: PageBuilderSection, index: number): PageBuilderCell {
  const cells = visibleCells(ensureRowCells(row));
  return cells[index] ?? cells[0] ?? { id: `${row.id}-c1`, kind: "empty", enabled: true };
}

export function ColumnCycleToggle({
  columns,
  onChange,
  disabled,
  title,
  filled = 0,
}: {
  columns: CanvasColumnCount | number | undefined;
  onChange: (next: CanvasColumnCount) => void;
  disabled?: boolean;
  title?: string;
  /** Cells that already have an Element. The cycle will not drop below that count. */
  filled?: number;
}) {
  const n = clampCanvasColumns(columns);
  const floor = Math.min(8, Math.max(1, Math.floor(filled) || 1));
  const steps = CANVAS_COLUMN_COUNTS.filter((step) => step >= floor);
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={disabled}
      onClick={() => onChange(nextCanvasColumns(n, filled))}
      className="h-7 gap-1 border border-primary/30 bg-primary/5 text-xs"
      title={
        title ??
        (disabled
          ? "This driver paints its own layout"
          : `Cycle ${steps.join(" / ")} columns. Filled cells stay on the row.`)
      }
    >
      {n === 1 ? (
        <Rows3 className="h-3.5 w-3.5" />
      ) : n === 2 ? (
        <Columns2 className="h-3.5 w-3.5" />
      ) : (
        <LayoutGrid className="h-3.5 w-3.5" />
      )}
      {n} Col
    </Button>
  );
}

export function CanvasSizeControls({
  width,
  margin,
  marginUnit,
  onWidth,
  onMargin,
  onMarginUnit,
}: {
  width: number | undefined;
  margin: number | undefined;
  marginUnit: CanvasMarginUnit | undefined;
  onWidth: (pct: number) => void;
  onMargin: (value: number) => void;
  onMarginUnit: (unit: CanvasMarginUnit) => void;
}) {
  const w = clampCanvasWidth(width);
  const unit = clampCanvasMarginUnit(marginUnit);
  const m = clampCanvasMargin(margin, unit);
  return (
    <div className="grid gap-3 rounded-lg border-2 border-primary/30 bg-primary/5 p-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm">
        <span className="flex h-8 items-center font-medium">
          Width {w}%{w === 0 ? " — disabled" : ""}
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={w}
          onChange={(e) => onWidth(clampCanvasWidth(e.target.value))}
          className="w-full accent-primary"
          title="Canvas width. 0% disables this canvas."
        />
        <span className="text-xs text-muted-foreground">0% disables the canvas. 100% fills the inner frame.</span>
      </label>
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex h-8 items-center justify-between gap-2">
          <span className="font-medium">
            Margin {m}
            {unit === "pct" ? "%" : "px"}
          </span>
          <div className="inline-flex rounded-md border border-primary/30">
            <button
              type="button"
              className={`px-2 py-0.5 text-xs ${unit === "px" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              onClick={() => {
                onMarginUnit("px");
                onMargin(clampCanvasMargin(m, "px"));
              }}
            >
              px
            </button>
            <button
              type="button"
              className={`px-2 py-0.5 text-xs ${unit === "pct" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              onClick={() => {
                onMarginUnit("pct");
                onMargin(clampCanvasMargin(m, "pct"));
              }}
            >
              %
            </button>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={unit === "pct" ? 25 : 200}
          step={unit === "pct" ? 1 : 4}
          value={m}
          onChange={(e) => onMargin(clampCanvasMargin(e.target.value, unit))}
          className="w-full accent-primary"
          title="Space on all four edges of the screen"
        />
        <span className="text-xs text-muted-foreground">Inset from all four edges of the screen.</span>
      </div>
    </div>
  );
}

export function SectionWidthSlider({
  value,
  onChange,
  compact,
}: {
  value: number | undefined;
  onChange: (pct: number) => void;
  compact?: boolean;
}) {
  const pct = clampSectionWidth(value);
  return (
    <label className={compact ? "flex min-w-[8rem] flex-1 items-center gap-2 text-xs" : "block space-y-1 text-sm"}>
      <span className="shrink-0 text-muted-foreground">Width {pct}%</span>
      <input
        type="range"
        min={25}
        max={100}
        step={5}
        value={pct}
        onChange={(e) => onChange(clampSectionWidth(e.target.value))}
        className="w-full accent-primary"
        title="Content width as a percent of the canvas"
      />
    </label>
  );
}

function HeightNumber({
  label,
  value,
  min,
  max,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onCommit: (next: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  return (
    <label className="inline-flex items-center gap-1">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => onCommit(Number(draft))}
        className="h-6 w-16 rounded border border-border bg-background px-1 text-xs text-foreground"
        aria-label={label}
      />
    </label>
  );
}

/** Builder drag sizes the canvas display only. The fields below are the visitor height. */
export function RowHeightHandle({
  displayPx,
  onDisplayChange,
  heightPx,
  heightVh,
  unit,
  onChange,
}: {
  displayPx: number | undefined;
  onDisplayChange: (px: number) => void;
  heightPx: number | undefined;
  heightVh: number | undefined;
  unit: RowHeightUnit | undefined;
  onChange: (next: { height_unit: RowHeightUnit; height_px: number; height_vh: number }) => void;
}) {
  const mode = clampRowHeightUnit(unit);
  const px = clampRowHeight(heightPx);
  const vh = clampRowHeightVh(heightVh);
  const display = clampRowHeight(displayPx);
  return (
    <div className="border-t border-border text-[11px] text-muted-foreground">
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize builder row height"
        title={`Builder display ${display}px — drag to resize. Does not change the visitor height.`}
        className="flex h-4 cursor-row-resize items-center justify-center bg-primary/10"
        onPointerDown={(e) => {
          e.preventDefault();
          const startY = e.clientY;
          const start = display;
          const target = e.currentTarget;
          target.setPointerCapture(e.pointerId);
          const move = (ev: PointerEvent) => {
            onDisplayChange(clampRowHeight(start + (ev.clientY - startY)));
          };
          const up = () => {
            target.releasePointerCapture(e.pointerId);
            target.removeEventListener("pointermove", move);
            target.removeEventListener("pointerup", up);
          };
          target.addEventListener("pointermove", move);
          target.addEventListener("pointerup", up);
        }}
      >
        <span className="h-0.5 w-8 rounded-full bg-primary/50" />
        <span className="ml-2">Builder {display}px</span>
      </div>
      <div className="flex flex-wrap items-center gap-3 px-2 py-2">
      <span>Visitor height</span>
      <span className="basis-full text-[10px]">
        The visitor row is one screen. Pixels taller than that screen are cut to it. Viewport % is not.
      </span>
      <HeightNumber
        label="px"
        value={px}
        min={MIN_ROW_HEIGHT_PX}
        max={MAX_ROW_HEIGHT_PX}
        onCommit={(next) =>
          onChange({ height_unit: mode, height_px: clampRowHeight(next), height_vh: vh })
        }
      />
      <HeightNumber
        label="viewport %"
        value={vh}
        min={MIN_ROW_HEIGHT_VH}
        max={MAX_ROW_HEIGHT_VH}
        onCommit={(next) =>
          onChange({ height_unit: mode, height_px: px, height_vh: clampRowHeightVh(next) })
        }
      />
      <label className="inline-flex items-center gap-1">
        <span>Use</span>
        <select
          value={mode}
          onChange={(e) =>
            onChange({
              height_unit: e.target.value === "vh" ? "vh" : "px",
              height_px: px,
              height_vh: vh,
            })
          }
          className="h-6 rounded border border-border bg-background px-1 text-xs text-foreground"
          aria-label="Which height the visitor page uses"
        >
          <option value="px">px</option>
          <option value="vh">viewport %</option>
        </select>
      </label>
      </div>
    </div>
  );
}

export function ElementConfigSection({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4 mt-2">
      <button
        type="button"
        className="flex w-full items-center gap-1 rounded-md border border-border bg-muted/30 px-2 py-1.5 text-left text-xs font-medium text-foreground"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open ? "" : "-rotate-90")} />
        Element configuration
      </button>
      {open ? <div className="pt-2">{children}</div> : null}
    </div>
  );
}

const configFieldClass =
  "w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs";

export function RowCellConfigGrid({
  row,
  usedFeatures,
  browserKey,
  browserRows,
  browserSearch,
  browserLoading,
  onPatch,
  onClear,
  onBrowse,
  onSearch,
  onToggleRecord,
  onConfigure,
}: {
  row: PageBuilderSection;
  usedFeatures: (cellId: string) => Set<string>;
  browserKey: string | null;
  browserRows: { id: string; name: string }[];
  browserSearch: string;
  browserLoading: boolean;
  onPatch: (cellIndex: number, patch: Partial<PageBuilderCell>) => void;
  onClear: (cellIndex: number) => void;
  onBrowse: (cellIndex: number, recordType: string) => void;
  onSearch: (value: string) => void;
  onToggleRecord: (cellIndex: number, recordId: string) => void;
  onConfigure?: (cellIndex: number, driverId?: string) => void;
}) {
  const cells = visibleCells(ensureRowCells(row));
  return (
    <div
      className="grid gap-2.5"
      style={{
        gridTemplateColumns: `repeat(${Math.max(1, cells.length)}, minmax(0, 1fr))`,
      }}
    >
      {cells.map((cell, index) => (
        <CellConfigColumn
          key={cell.id}
          cell={cell}
          used={usedFeatures(cell.id)}
          browserOpen={browserKey === `${row.id}:${index}`}
          browserRows={browserRows}
          browserSearch={browserSearch}
          browserLoading={browserLoading}
          onPatch={(patch) => onPatch(index, patch)}
          onClear={() => onClear(index)}
          onBrowse={() => onBrowse(index, cell.recordType ?? "page")}
          onSearch={onSearch}
          onToggleRecord={(recordId) => onToggleRecord(index, recordId)}
          onConfigure={() => onConfigure?.(index, cell.driver)}
        />
      ))}
    </div>
  );
}

function CellConfigColumn({
  cell,
  used,
  browserOpen,
  browserRows,
  browserSearch,
  browserLoading,
  onPatch,
  onClear,
  onBrowse,
  onSearch,
  onToggleRecord,
  onConfigure,
}: {
  cell: PageBuilderCell;
  used: Set<string>;
  browserOpen: boolean;
  browserRows: { id: string; name: string }[];
  browserSearch: string;
  browserLoading: boolean;
  onPatch: (patch: Partial<PageBuilderCell>) => void;
  onClear: () => void;
  onBrowse: () => void;
  onSearch: (value: string) => void;
  onToggleRecord: (recordId: string) => void;
  onConfigure?: () => void;
}) {
  void used;
  void browserOpen;
  void browserRows;
  void browserSearch;
  void browserLoading;
  void onBrowse;
  void onSearch;
  void onToggleRecord;
  if (cell.kind === "empty") {
    return (
      <p className="text-[11px] text-muted-foreground">Plus on the Cell to choose an Element record.</p>
    );
  }
  const outputs = outputsForDriver(cell.driver);
  const outputValue = isKnownOutput(cell.driver, cell.renderOutput)
    ? cell.renderOutput
    : defaultOutputId(cell.driver);
  return (
    <div className="space-y-2 rounded-md border border-border/70 bg-background/80 p-2">
      <p className="text-[11px] font-medium">
        {cell.driver || "Element"}
        {cell.pairingId ? "" : " · needs record selection"}
      </p>
      <p className="text-[11px] text-muted-foreground">
        {slotBindingLabel({
          id: cell.id,
          label: cell.id,
          kind: cell.kind,
          featureId: cell.featureId,
          recordType: cell.recordType,
          recordId: cell.recordId,
          driver: cell.driver,
        })}
      </p>
      {outputs.length > 1 && outputs.every((out) => out.id.startsWith("grid-")) ? (
        <label className="block space-y-1 text-xs">
          <span className="text-muted-foreground">Grid</span>
          <select
            className={configFieldClass}
            value={outputValue}
            onChange={(e) => onPatch({ renderOutput: e.target.value })}
          >
            {outputs.map((out) => (
              <option key={out.id} value={out.id}>
                {out.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {outputs.length > 1 && !outputs.every((out) => out.id.startsWith("grid-")) ? (
        <fieldset className="space-y-1 text-xs">
          <legend className="text-muted-foreground">Render option</legend>
          {outputs.map((out) => (
            <label key={out.id} className="flex items-center gap-2">
              <input
                type="radio"
                name={`cell-render-${cell.id}`}
                value={out.id}
                checked={outputValue === out.id}
                onChange={() => onPatch({ renderOutput: out.id })}
              />
              {out.label}
            </label>
          ))}
        </fieldset>
      ) : null}
      {outputs.some((out) => out.id.startsWith("grid-")) ? (
        <>
          <label className="block space-y-1 text-xs">
            <span className="text-muted-foreground">Page</span>
            <input
              type="number"
              min={1}
              className={configFieldClass}
              value={cell.pageNumber ?? 1}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                onPatch({ pageNumber: Number.isFinite(n) && n >= 1 ? Math.min(999, n) : 1 });
              }}
            />
          </label>
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">Pagination on display</span>
            <BooleanSwitch
              checked={cell.showPager !== false}
              onChange={(on) => onPatch({ showPager: on })}
              label={cell.showPager !== false ? "On" : "Off"}
            />
          </div>
        </>
      ) : null}
      {!cell.pairingId ? (
        <Button type="button" variant="outline" size="sm" onClick={onConfigure}>
          Choose records
        </Button>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Record selection is on Canvas → Elements. This Cell paints that Element.
        </p>
      )}
      <Button type="button" variant="ghost" size="sm" onClick={onClear}>
        Remove element
      </Button>
    </div>
  );
}
