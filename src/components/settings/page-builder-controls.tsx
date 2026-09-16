"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { BooleanSwitch } from "@/components/ui/boolean-switch";
import {
  BarChart3,
  BookOpen,
  Boxes,
  ClipboardCheck,
  Columns2,
  FileText,
  GripVertical,
  Info,
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
import { nextLayoutColumns, type LayoutColumnCount } from "@/lib/catalog/layout-grid";
import {
  cellBindingLabel,
  clampCanvasMargin,
  clampCanvasMarginUnit,
  clampCanvasWidth,
  clampRowHeight,
  clampSectionWidth,
  ensureRowCells,
  visibleCells,
  type CanvasMarginUnit,
  type PageBuilderCell,
  type PageBuilderSection,
} from "@/lib/public/page-builder";
import { cn } from "@/lib/utils";

export const ELEMENT_ICONS: Record<string, LucideIcon> = {
  "cycle-strip": Orbit,
  glossary: BookOpen,
  "org-board": LayoutGrid,
  statistics: Boxes,
  page: FileText,
  inspection_report: ClipboardCheck,
  contact: Mail,
  location: Mail,
  "home:facets": Layers,
  "home:integrations": Plug,
  "home:inspections-reports": ClipboardCheck,
  "home:statistics": BarChart3,
  "home:knowledge": Library,
  "home:about": Info,
  "home:contacts": Mail,
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

export type CellDragSource = { rowId: string; cellIndex: number };

export function RowVisibilityToggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  label?: string;
}) {
  return (
    <BooleanSwitch
      checked={on}
      onChange={onChange}
      label={label ?? (on ? "On" : "Off")}
    />
  );
}

export function RowCellStrip({
  row,
  selectedIndex,
  onSelect,
  onToggleCell,
  onDropChip,
  onDropCell,
  onCellDragStart,
  onCellDragEnd,
  onClearCell,
  chipDrag,
  cellDrag,
  height,
  paintCell,
}: {
  row: PageBuilderSection;
  selectedIndex: number;
  onSelect: (index: number) => void;
  onToggleCell: (index: number, on: boolean) => void;
  onDropChip?: (index: number) => void;
  onDropCell?: (index: number, source: CellDragSource) => void;
  onCellDragStart?: (source: CellDragSource) => void;
  onCellDragEnd?: () => void;
  onClearCell?: (index: number) => void;
  chipDrag?: string | null;
  cellDrag?: CellDragSource | null;
  /** Cell paint area height (Row body). */
  height?: number;
  paintCell?: (cell: PageBuilderCell, index: number) => ReactNode;
}) {
  const cells = visibleCells(ensureRowCells(row));
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const accepting = Boolean(chipDrag || cellDrag);

  return (
    <div
      className="grid gap-2.5"
      style={{
        gridTemplateColumns: `repeat(${Math.max(1, cells.length)}, minmax(0, 1fr))`,
        height: height ? `${height}px` : undefined,
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
        const label = empty ? "Drop element" : cellBindingLabel(cell);
        const painted = paintCell?.(cell, index);
        const showsPaint = Boolean(painted);
        return (
          <button
            key={cell.id}
            type="button"
            draggable={filled}
            onClick={() => onSelect(index)}
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
              e.dataTransfer.dropEffect = chipDrag ? "copy" : "move";
              setOverIndex(index);
            }}
            onDragLeave={() => setOverIndex((cur) => (cur === index ? null : cur))}
            onDrop={(e) => {
              if (!accepting) return;
              e.preventDefault();
              e.stopPropagation();
              setOverIndex(null);
              if (chipDrag && onDropChip) {
                onDropChip(index);
                return;
              }
              if (cellDrag && onDropCell) onDropCell(index, cellDrag);
            }}
            className={cn(
              "group relative flex h-full min-h-0 flex-col rounded-xl border-2 p-2 text-left transition-colors",
              !height && "min-h-[7.5rem]",
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
            )}
            title={filled ? "Drag to another Cell or Row" : "Drop an Element here"}
          >
            <div className="mb-2 flex items-start justify-between gap-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {filled ? (
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground/70" aria-hidden />
                ) : null}
                Cell {index + 1}
              </span>
              <span className="inline-flex items-center gap-0.5">
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
              </span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {showsPaint ? (
                <div className="min-h-0 flex-1 overflow-hidden">{painted}</div>
              ) : empty ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 bg-background/80 text-muted-foreground">
                    <Plus className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
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
}: {
  columns: LayoutColumnCount | number | undefined;
  onChange: (next: LayoutColumnCount) => void;
  disabled?: boolean;
  title?: string;
}) {
  const n: LayoutColumnCount =
    columns === 1 || columns === 2 || columns === 4 || columns === 6 || columns === 8
      ? columns
      : columns === 3
        ? 2
        : 1;
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={disabled}
      onClick={() => onChange(nextLayoutColumns(n))}
      className="h-7 gap-1 border border-primary/30 bg-primary/5 text-xs"
      title={title ?? (disabled ? "This driver paints its own layout" : "Cycle 1 / 2 / 4 / 6 / 8 columns")}
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
      <label className="block space-y-1 text-sm">
        <span className="font-medium">
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
      <div className="space-y-1 text-sm">
        <div className="flex items-center justify-between gap-2">
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

/** Drag the bottom edge of a Canvas Row to set height_px. */
export function RowHeightHandle({
  height,
  onChange,
}: {
  height: number | undefined;
  onChange: (px: number) => void;
}) {
  const px = clampRowHeight(height);
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize row height"
      title={`Row height ${px}px — drag to resize`}
      className="flex h-3 cursor-row-resize items-center justify-center border-t-2 border-primary/30 bg-primary/10 text-[10px] text-muted-foreground hover:bg-primary/20"
      onPointerDown={(e) => {
        e.preventDefault();
        const startY = e.clientY;
        const startH = px;
        const target = e.currentTarget;
        target.setPointerCapture(e.pointerId);
        const move = (ev: PointerEvent) => {
          onChange(clampRowHeight(startH + (ev.clientY - startY)));
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
    </div>
  );
}
