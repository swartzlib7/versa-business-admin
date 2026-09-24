"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { BooleanSwitch } from "@/components/ui/boolean-switch";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { ChevronDown, Eye, EyeOff, GripVertical, Plus, X } from "lucide-react";
import {
  DEFAULT_CUSTOM_CANVAS,
  DEFAULT_HOME_LABEL,
  DEFAULT_HOME_SECTION_ORDER,
  HOME_SECTION_LABELS,
  MAX_CANVASES,
  blankCanvas,
  canvasMetricVars,
  canvasIsDisabled,
  clampCanvasWidth,
  clampRowHeight,
  clampSectionColumns,
  clampSectionWidth,
  DEFAULT_CANVAS_WIDTH_PCT,
  DEFAULT_HOME_WIDTH_PCT,
  DEFAULT_MOBILE_CANVAS_MARGIN,
  DEFAULT_MOBILE_CANVAS_WIDTH_PCT,
  blankHomeSection,
  defaultHomeSections,
  ensureRowCells,
  isBlankSlotLabel,
  isRowOn,
  nextCanvasSlug,
  normalizePageBuilder,
  uniqueKey,
  normalizeHomeLabel,
  cellBindingLabel,
  clearCellBinding,
  removeEmptyColumn,
  patchRowCell,
  swapCellBindings,
  usedFeatureIds,
  rowElementCount,
  visibleCells,
  type CanvasMarginUnit,
  type CustomCanvas,
  type PageBuilderCell,
  type PageBuilderSection,
} from "@/lib/public/page-builder";
import { CanvasSlotDriver } from "@/components/public/canvas-slot-drivers";
import {
  CanvasSizeControls,
  ColumnCycleToggle,
  ElementPickModal,
  type PickedElement,
  ElementConfigSection,
  RowCellConfigGrid,
  RowCellStrip,
  RowHeightHandle,
  RowVisibilityToggle,
  SectionWidthSlider,
  type CellDragSource,
} from "@/components/settings/page-builder-controls";
import type { CycleStep } from "@/lib/public/site-types";
import { fetchCellPaint } from "@/lib/public/resolve-cell-paint-client";
import type { ResolvedCellPaint } from "@/lib/public/resolve-cell-paint";
import { useTwinSlot } from "@/components/zones/twin-slot-context";
import type { BindWizardRequest } from "@/components/settings/element-bind-wizard";
import { defaultOutputId } from "@/lib/public/render-drivers";

const BLANK_LABEL = "__blank__";

/** Label / On / hash edits must not rebuild Cells — that remounts paint on every keystroke. */
function rowPatchNeedsCells(patch: Partial<PageBuilderSection>): boolean {
  return (
    "columns" in patch ||
    "cells" in patch ||
    "kind" in patch ||
    "featureId" in patch ||
    "recordType" in patch ||
    "recordId" in patch ||
    "recordMode" in patch ||
    "recordIds" in patch ||
    "driver" in patch
  );
}

type PreviewData = {
  cycleSteps: CycleStep[];
};

function rowUnderPointer(list: "home" | "custom", x: number, y: number): number | null {
  const hit = document.elementFromPoint(x, y);
  const row = hit?.closest<HTMLElement>(`[data-pb-row-list="${list}"] [data-pb-row]`);
  if (!row) return null;
  const index = Number(row.dataset.pbRow);
  return Number.isInteger(index) ? index : null;
}

function CellPaint({
  cell,
  cycleSteps,
}: {
  cell: PageBuilderCell;
  cellIndex: number;
  row: PageBuilderSection;
  cycleSteps: CycleStep[];
}) {
  const [paint, setPaint] = useState<ResolvedCellPaint>({});
  useEffect(() => {
    if (!cell.pairingId) {
      setPaint({});
      return;
    }
    let cancelled = false;
    void fetchCellPaint(cell).then((next) => {
      if (!cancelled) setPaint(next);
    });
    return () => {
      cancelled = true;
    };
  }, [cell.pairingId, cell.renderOutput]);
  if (cell.kind === "empty" || !paint.driver) return null;
  return (
    <div className="h-full min-h-0 w-full min-w-0 overflow-auto p-1">
      <CanvasSlotDriver
        driver={paint.driver}
        cycleSteps={cycleSteps}
        stat={paint.stat ?? null}
        html={paint.html}
        pageCard={paint.pageCard}
        contact={paint.contact}
        integration={paint.integration}
        schedule={paint.schedule}
        inspection={paint.inspection}
        project={paint.project}
        renderOutput={paint.renderOutput}
        pager={cell.showPager !== false}
        pageNumber={cell.pageNumber ?? 1}
        compact
      />
    </div>
  );
}

export function PageBuilderPanel() {
  const twin = useTwinSlot();
  const [custom, setCustom] = useState<CustomCanvas>(DEFAULT_CUSTOM_CANVAS);
  // PB-06: every custom canvas; index 0 mirrors custom.
  const [canvases, setCanvases] = useState<CustomCanvas[]>([DEFAULT_CUSTOM_CANVAS]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [cellDrag, setCellDrag] = useState<CellDragSource | null>(null);
  const [addCell, setAddCell] = useState<{
    canvas: "primary" | "custom";
    rowId: string;
    cellIndex: number;
  } | null>(null);
  const [preview, setPreview] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData>({ cycleSteps: [] });
  const [homeOrder, setHomeOrder] = useState<string[]>(DEFAULT_HOME_SECTION_ORDER);
  const [homeSections, setHomeSections] = useState<PageBuilderSection[]>(defaultHomeSections());
  const [homeDrag, setHomeDrag] = useState<number | null>(null);
  const [homeDrop, setHomeDrop] = useState<number | null>(null);
  const [builderTab, setBuilderTab] = useState<"primary" | number>("primary");
  const [homeHero, setHomeHero] = useState(true);
  const [homeWidth, setHomeWidth] = useState(DEFAULT_HOME_WIDTH_PCT);
  const [homeMargin, setHomeMargin] = useState(0);
  const [homeMarginUnit, setHomeMarginUnit] = useState<CanvasMarginUnit>("px");
  const [homeMobileWidth, setHomeMobileWidth] = useState(DEFAULT_MOBILE_CANVAS_WIDTH_PCT);
  const [homeMobileMargin, setHomeMobileMargin] = useState(DEFAULT_MOBILE_CANVAS_MARGIN);
  const [homeMobileMarginUnit, setHomeMobileMarginUnit] = useState<CanvasMarginUnit>("px");
  const [homeColumns, setHomeColumns] = useState(1);
  const [homeLabel, setHomeLabel] = useState(DEFAULT_HOME_LABEL);
  const [cellFocus, setCellFocus] = useState<Record<string, number>>({});
  const [rowConfirm, setRowConfirm] = useState<
    | { kind: "home"; id: string; label: string }
    | { kind: "custom"; index: number; label: string }
    | null
  >(null);
  // PB-13: record browser (search + multi-pick) for record-type sections.
  const [browserKey, setBrowserKey] = useState<string | null>(null);
  const [browserRows, setBrowserRows] = useState<{ id: string; name: string }[]>([]);
  const [browserSearch, setBrowserSearch] = useState("");
  const [browserLoading, setBrowserLoading] = useState(false);
  const [slugDraft, setSlugDraft] = useState<string | null>(null);
  const [anchorDraft, setAnchorDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    setSlugDraft(null);
    setAnchorDraft({});
  }, [builderTab]);

  useEffect(() => {
    fetch("/api/settings/system", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("load failed"))))
      .then((json: { data?: { page_builder?: unknown } }) => {
        const pb = normalizePageBuilder(json.data?.page_builder);
        setCustom(pb.custom);
        setCanvases(pb.canvases ?? [pb.custom]);
        setHomeOrder(pb.home_section_order ?? DEFAULT_HOME_SECTION_ORDER);
        setHomeSections(pb.home_sections ?? defaultHomeSections());
        setHomeHero(pb.home_hero_enabled !== false);
        setHomeWidth(pb.home_width_pct ?? DEFAULT_HOME_WIDTH_PCT);
        setHomeMargin(pb.home_margin ?? 0);
        setHomeMarginUnit(pb.home_margin_unit ?? "px");
        setHomeMobileWidth(pb.home_mobile_width_pct ?? DEFAULT_MOBILE_CANVAS_WIDTH_PCT);
        setHomeMobileMargin(pb.home_mobile_margin ?? DEFAULT_MOBILE_CANVAS_MARGIN);
        setHomeMobileMarginUnit(pb.home_mobile_margin_unit ?? "px");
        setHomeColumns(clampSectionColumns(pb.home_columns ?? 1));
        setHomeLabel(pb.home_label ?? DEFAULT_HOME_LABEL);
        setLoaded(true);
      })
      .catch(() => {
        setError("Could not load Page Builder.");
        setLoaded(true);
      });
  }, []);

  useEffect(() => {
    fetch("/api/settings/system", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("cycle"))))
      .then((json: { data?: Record<string, unknown> }) => {
        const raw = Array.isArray(json.data?.cycle_steps) ? (json.data?.cycle_steps as CycleStep[]) : [];
        const steps = raw.filter((s) => {
          const showNumber = s.numberEnabled && s.number.trim();
          const showTitle = s.titleEnabled && s.title.trim();
          const showDesc = s.descEnabled && s.desc.trim();
          return Boolean(showNumber || showTitle || showDesc);
        });
        setPreviewData((prev) => ({ ...prev, cycleSteps: steps }));
      })
      .catch(() => undefined);
  }, []);

  const persist = async (
    next: CustomCanvas,
    nextHomeOrder?: string[],
    nextHomeSections?: PageBuilderSection[],
  ) => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      // PB-06: canvases travels alongside custom (index 0 mirrors custom).
      const canvasesOut = canvases.map((c, i) => (i === 0 ? next : c));
      const res = await fetch("/api/settings/system", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          page_builder: {
            custom: next,
            canvases: canvasesOut,
            home_section_order: nextHomeOrder ?? homeOrder,
            home_sections: nextHomeSections ?? homeSections,
            home_hero_enabled: homeHero,
            home_width_pct: homeWidth,
            home_margin: homeMargin,
            home_margin_unit: homeMarginUnit,
            home_mobile_width_pct: homeMobileWidth,
            home_mobile_margin: homeMobileMargin,
            home_mobile_margin_unit: homeMobileMarginUnit,
            home_columns: homeColumns,
            home_label: normalizeHomeLabel(homeLabel),
          },
        }),
      });
      if (!res.ok) throw new Error("save failed");
      const json = await res.json();
      const pb = normalizePageBuilder(json.data?.page_builder);
      setCustom(pb.custom);
      setCanvases(pb.canvases ?? [pb.custom]);
      setHomeSections(pb.home_sections ?? homeSections);
      setHomeHero(pb.home_hero_enabled !== false);
      setHomeWidth(pb.home_width_pct ?? DEFAULT_HOME_WIDTH_PCT);
      setHomeMargin(pb.home_margin ?? 0);
      setHomeMarginUnit(pb.home_margin_unit ?? "px");
      setHomeMobileWidth(pb.home_mobile_width_pct ?? DEFAULT_MOBILE_CANVAS_WIDTH_PCT);
      setHomeMobileMargin(pb.home_mobile_margin ?? DEFAULT_MOBILE_CANVAS_MARGIN);
      setHomeMobileMarginUnit(pb.home_mobile_margin_unit ?? "px");
      setHomeColumns(clampSectionColumns(pb.home_columns ?? homeColumns));
      setHomeLabel(pb.home_label ?? DEFAULT_HOME_LABEL);
      setSaved(true);
    } catch {
      setError("Could not save Page Builder.");
    } finally {
      setSaving(false);
    }
  };

  /** PB-06: custom edits mirror into canvases[0] so one Save persists both shapes. */
  const commitCustom = (next: CustomCanvas) => {
    setCustom(next);
    setCanvases((cur) => cur.map((c, i) => (i === 0 ? next : c)));
  };

  /** PB-06: patch a non-primary custom canvas (enable / label / slug). */
  const updateCanvasAt = (index: number, patch: Partial<CustomCanvas>) => {
    setCanvases((cur) => cur.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  /** PB-06: add a spare canvas (draft until Save canvas). */
  const addCanvas = () => {
    if (canvases.length >= MAX_CANVASES) return;
    const seed = blankCanvas(canvases.length + 1);
    const canvas: CustomCanvas = {
      ...seed,
      slug: nextCanvasSlug({ custom, canvases }, seed.label),
    };
    setCanvases((cur) => [...cur, canvas]);
  };

  /** PB-06: remove a spare canvas (index > 0; draft until Save canvas). */
  const removeCanvas = (index: number) => {
    if (index <= 0) return;
    setCanvases((cur) => cur.filter((_, i) => i !== index));
  };

  const addSection = (afterIndex?: number) => {
    if (editCanvas.sections.length >= 8) return;
    const id = uniqueKey(
      BLANK_LABEL,
      editCanvas.sections.map((row) => row.id),
      "row",
    );
    const row: PageBuilderSection = {
      id,
      idManual: false,
      label: BLANK_LABEL,
      kind: "empty",
      enabled: false,
      collapsed: true,
      width_pct: 100,
      columns: clampSectionColumns(editCanvas.columns),
    };
    if (afterIndex === undefined) {
      commitEdit({ ...editCanvas, sections: [...editCanvas.sections, row] });
      return;
    }
    const next = [...editCanvas.sections];
    next.splice(afterIndex + 1, 0, row);
    commitEdit({ ...editCanvas, sections: next });
  };

  const setSection = (index: number, patch: Partial<PageBuilderSection>) => {
    const prev = editCanvas.sections[index];
    commitEdit({
      ...editCanvas,
      sections: editCanvas.sections.map((row, i) => {
        if (i !== index) return row;
        const merged: PageBuilderSection = { ...row, ...patch };
        return rowPatchNeedsCells(patch) ? ensureRowCells(merged) : merged;
      }),
    });
    if (prev && patch.id && patch.id !== prev.id) {
      setCellFocus((cur) => {
        if (!(prev.id in cur)) return cur;
        const next = { ...cur };
        next[patch.id as string] = cur[prev.id];
        delete next[prev.id];
        return next;
      });
    }
  };

  const focusCell = (rowId: string) => cellFocus[rowId] ?? 0;

  const removeSection = (index: number) => {
    if (editCanvas.sections.length <= 1) return;
    const row = editCanvas.sections[index];
    const label = row?.label && !isBlankSlotLabel(row.label) ? row.label : "this row";
    setRowConfirm({ kind: "custom", index, label });
  };

  const startAddCell = (canvas: "primary" | "custom", rowId: string, cellIndex: number) => {
    setCellFocus((cur) => ({ ...cur, [rowId]: cellIndex }));
    setAddCell({ canvas, rowId, cellIndex });
  };

  const pickElementForCell = (element: PickedElement) => {
    if (!addCell) return;
    applyCellBind(
      {
        recordType: (element.recordType || "page") as BindWizardRequest["recordType"],
        rowId: addCell.rowId,
        cellIndex: addCell.cellIndex,
        canvas: addCell.canvas,
      },
      {
        kind: "record",
        featureId: undefined,
        recordType: element.recordType,
        recordId: element.recordId === "*" ? undefined : element.recordId,
        recordMode: element.recordId === "*" ? "all" : "single",
        driver: element.codeKey,
        pairingId: element.id,
        enabled: true,
        renderOutput: defaultOutputId(element.codeKey),
      },
    );
    setAddCell(null);
  };

  const applyCellBind = (req: BindWizardRequest, patch: Partial<PageBuilderCell>) => {
    if (req.canvas === "primary") {
      const row = homeSections.find((s) => s.id === req.rowId);
      if (row) patchHomeSection(req.rowId, patchRowCell(row, req.cellIndex, patch));
      return;
    }
    const index = editCanvas.sections.findIndex((s) => s.id === req.rowId);
    const row = editCanvas.sections[index];
    if (row) setSection(index, patchRowCell(row, req.cellIndex, patch));
  };

  const startConfigureCell = (
    canvas: "primary" | "custom",
    rowId: string,
    cellIndex: number,
  ) => {
    setAddCell({ canvas, rowId, cellIndex });
  };

  const moveSection = (from: number, to: number) => {
    if (from === to) return;
    const next = [...editCanvas.sections];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    commitEdit({ ...editCanvas, sections: next });
  };

  const moveHomeSection = (from: number, to: number) => {
    if (from === to) return;
    const next = [...homeOrder];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    setHomeOrder(next);
  };

  const rowDragRef = useRef<{ list: "home" | "custom"; from: number } | null>(null);
  const onRowGripDown = (list: "home" | "custom", index: number) => (e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    rowDragRef.current = { list, from: index };
    if (list === "home") {
      setHomeDrag(index);
      setHomeDrop(index);
    } else {
      setDragIndex(index);
      setDropIndex(index);
    }
    const onMove = (ev: PointerEvent) => {
      const drag = rowDragRef.current;
      if (!drag) return;
      const next = rowUnderPointer(drag.list, ev.clientX, ev.clientY);
      if (next === null) return;
      if (drag.list === "home") setHomeDrop((cur) => (cur === next ? cur : next));
      else setDropIndex((cur) => (cur === next ? cur : next));
    };
    const onUp = (ev: PointerEvent) => {
      const drag = rowDragRef.current;
      rowDragRef.current = null;
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      if (handle.hasPointerCapture(ev.pointerId)) handle.releasePointerCapture(ev.pointerId);
      const dest = drag ? rowUnderPointer(drag.list, ev.clientX, ev.clientY) : null;
      if (drag && dest !== null && dest !== drag.from) {
        if (drag.list === "home") moveHomeSection(drag.from, dest);
        else moveSection(drag.from, dest);
      }
      setHomeDrag(null);
      setHomeDrop(null);
      setDragIndex(null);
      setDropIndex(null);
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
  };

  const patchHomeSection = (id: string, patch: Partial<PageBuilderSection>) => {
    setHomeSections((cur) =>
      cur.map((row) => {
        if (row.id !== id) return row;
        const merged = { ...row, ...patch };
        return rowPatchNeedsCells(patch) ? ensureRowCells(merged) : merged;
      }),
    );
  };

  const renameHomeRow = (oldId: string, nextId: string, extra?: Partial<PageBuilderSection>) => {
    if (!nextId || nextId === oldId) {
      if (extra) patchHomeSection(oldId, extra);
      return;
    }
    setHomeOrder((cur) => cur.map((rowId) => (rowId === oldId ? nextId : rowId)));
    setHomeSections((cur) =>
      cur.map((row) => {
        if (row.id !== oldId) return row;
        const merged = { ...row, ...extra, id: nextId };
        return extra && rowPatchNeedsCells(extra) ? ensureRowCells(merged) : merged;
      }),
    );
    setCellFocus((cur) => {
      if (!(oldId in cur)) return cur;
      const next = { ...cur, [nextId]: cur[oldId] };
      delete next[oldId];
      return next;
    });
  };

  const relocateCustomCell = (source: CellDragSource, destRowId: string, destIndex: number) => {
    if (source.rowId === destRowId && source.cellIndex === destIndex) return;
    const fromRow = editCanvas.sections.find((r) => r.id === source.rowId);
    const toRow = editCanvas.sections.find((r) => r.id === destRowId);
    if (!fromRow || !toRow) return;
    const { from, to } = swapCellBindings(fromRow, source.cellIndex, toRow, destIndex);
    commitEdit({
      ...editCanvas,
      sections: editCanvas.sections.map((r) => {
        if (r.id === source.rowId) return from;
        if (r.id === destRowId) return to;
        return r;
      }),
    });
    setCellFocus((cur) => ({ ...cur, [destRowId]: destIndex }));
  };

  const relocateHomeCell = (source: CellDragSource, destRowId: string, destIndex: number) => {
    if (source.rowId === destRowId && source.cellIndex === destIndex) return;
    setHomeSections((cur) => {
      const fromRow = cur.find((r) => r.id === source.rowId);
      const toRow = cur.find((r) => r.id === destRowId);
      if (!fromRow || !toRow) return cur;
      const { from, to } = swapCellBindings(fromRow, source.cellIndex, toRow, destIndex);
      return cur.map((r) => {
        if (r.id === source.rowId) return from;
        if (r.id === destRowId) return to;
        return r;
      });
    });
    setCellFocus((cur) => ({ ...cur, [destRowId]: destIndex }));
  };

  const removeHomeSection = (id: string, label: string) => {
    setRowConfirm({ kind: "home", id, label });
  };

  const addBlankHomeRow = () => {
    let n = homeOrder.length + 1;
    let id = `row-${n}`;
    while (homeOrder.includes(id) || homeSections.some((row) => row.id === id)) {
      n += 1;
      id = `row-${n}`;
    }
    const row = {
      ...blankHomeSection(id, BLANK_LABEL),
      enabled: false,
      collapsed: true,
      columns: clampSectionColumns(homeColumns),
    };
    setHomeOrder((cur) => [...cur, id]);
    setHomeSections((cur) => [...cur, row]);
  };

  const editIndex = typeof builderTab === "number" ? builderTab : 0;
  const editCanvas = canvases[editIndex] ?? custom;
  const commitEdit = (next: CustomCanvas) => {
    if (editIndex <= 0) commitCustom(next);
    else updateCanvasAt(editIndex, next);
  };

  const publishTwin = (
    row: PageBuilderSection,
    cell: PageBuilderCell,
    cellIndex: number,
    canvas: "primary" | "custom",
  ) => {
    const commit = (outputId: string) => {
      if (canvas === "primary") {
        patchHomeSection(row.id, patchRowCell(row, cellIndex, { renderOutput: outputId }));
      } else {
        const index = editCanvas.sections.findIndex((s) => s.id === row.id);
        if (index >= 0) setSection(index, patchRowCell(row, cellIndex, { renderOutput: outputId }));
      }
    };
    if (cell.kind === "empty" || !cell.pairingId) {
      twin.setPreview(null);
      return;
    }
    void fetchCellPaint(cell).then((paint) => {
      if (!paint.driver) {
        twin.setPreview(null);
        return;
      }
      if (paint.driver === "stat-graph") {
        twin.setPreview({
          kind: "stat-graph",
          values: paint.stat?.values ?? { name: cellBindingLabel(cell) },
          headerId: paint.stat?.headerId ?? paint.recordId ?? null,
          lines: paint.stat?.lines,
          renderOutput: cell.renderOutput,
          onRenderOutput: commit,
        });
        return;
      }
      twin.setPreview({
        kind: "canvas-driver",
        driver: paint.driver,
        label: cellBindingLabel(cell),
        cycleSteps: previewData.cycleSteps,
        html: paint.html,
        contact: paint.contact,
        renderOutput: cell.renderOutput,
        onRenderOutput: commit,
      });
    });
  };

  const openPreview = async () => {
    setPreview(true);
    if (previewLoaded) return;
    try {
      const res = await fetch("/api/settings/system", { credentials: "include" });
      if (res.ok) {
        const json: { data?: Record<string, unknown> } = await res.json();
        const raw = Array.isArray(json.data?.cycle_steps) ? (json.data?.cycle_steps as CycleStep[]) : [];
        const steps = raw.filter((s) => {
          const showNumber = s.numberEnabled && s.number.trim();
          const showTitle = s.titleEnabled && s.title.trim();
          const showDesc = s.descEnabled && s.desc.trim();
          return Boolean(showNumber || showTitle || showDesc);
        });
        setPreviewData((prev) => ({ ...prev, cycleSteps: steps }));
      }
    } catch {
      // Preview degrades to Empty-slot hints; no editor error for preview data.
    }
    setPreviewLoaded(true);
  };

  const openRecordBrowser = async (rowId: string, cellIndex: number, recordType: string) => {
    const key = `${rowId}:${cellIndex}`;
    setBrowserKey((cur) => (cur === key ? null : key));
    setBrowserSearch("");
    setBrowserLoading(true);
    try {
      const res = await fetch(
        `/api/records?type=${encodeURIComponent(recordType)}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("records");
      const json: { data?: { id: string; name: string }[] } = await res.json();
      setBrowserRows((json.data ?? []).map((r) => ({ id: r.id, name: r.name || r.id })));
    } catch {
      setBrowserRows([]);
    } finally {
      setBrowserLoading(false);
    }
  };

  const togglePickedRecord = (
    canvas: "primary" | "custom",
    rowId: string,
    cellIndex: number,
    recordId: string,
  ) => {
    const row =
      canvas === "primary"
        ? homeSections.find((s) => s.id === rowId)
        : editCanvas.sections.find((s) => s.id === rowId);
    if (!row) return;
    const cell = visibleCells(ensureRowCells(row))[cellIndex];
    if (!cell) return;
    const picked = new Set(cell.recordIds ?? []);
    if (picked.has(recordId)) picked.delete(recordId);
    else picked.add(recordId);
    const next = patchRowCell(row, cellIndex, { recordIds: [...picked] });
    if (canvas === "primary") patchHomeSection(rowId, next);
    else {
      const index = editCanvas.sections.findIndex((s) => s.id === rowId);
      if (index >= 0) setSection(index, next);
    }
  };

  return (
    <div className="space-y-6">
      {addCell ? (
        <ElementPickModal onCancel={() => setAddCell(null)} onPick={pickElementForCell} />
      ) : null}
      <ConfirmDialog
        open={rowConfirm !== null}
        title="Remove row"
        description={`Remove “${rowConfirm?.label ?? "this row"}” permanently? This cannot be undone.`}
        confirmLabel="Remove"
        tone="danger"
        onCancel={() => setRowConfirm(null)}
        onConfirm={() => {
          if (!rowConfirm) return;
          if (rowConfirm.kind === "home") {
            setHomeOrder((cur) => cur.filter((row) => row !== rowConfirm.id));
            setHomeSections((cur) => cur.filter((row) => row.id !== rowConfirm.id));
          } else {
            commitEdit({
              ...editCanvas,
              sections: editCanvas.sections.filter((_, i) => i !== rowConfirm.index),
            });
          }
          setRowConfirm(null);
        }}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {saved ? <p className="text-sm text-muted-foreground">Saved. Hard-refresh the public site to see the menu.</p> : null}
      <p className="text-xs text-muted-foreground">
        Plus on an empty Cell picks a Rendering Driver, then which records to show.
        Drag a bound Element to another Cell or Row to move it (occupied Cells swap).
      </p>

      <div className="flex flex-wrap items-center gap-1 border-b border-border pb-2">
        <Button
          type="button"
          variant={builderTab === "primary" ? "default" : "ghost"}
          size="sm"
          onClick={() => setBuilderTab("primary")}
        >
          Primary Canvas
        </Button>
        {canvases.map((c, i) => (
          <Button
            key={`tab-${i}`}
            type="button"
            variant={builderTab === i ? "default" : "ghost"}
            size="sm"
            onClick={() => setBuilderTab(i)}
          >
            {c.label?.trim() || `Custom Canvas ${i + 1}`}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            addCanvas();
            setBuilderTab(canvases.length);
          }}
          disabled={!loaded || canvases.length >= MAX_CANVASES}
          title={canvases.length >= MAX_CANVASES ? `Up to ${MAX_CANVASES} custom canvases` : "Add a custom canvas"}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className={`space-y-3 rounded-lg border border-border p-4 ${builderTab === "primary" ? "" : "hidden"}`}>
        <p className="text-sm font-medium">Primary canvas</p>
        <p className="text-sm text-muted-foreground">
          VBA Home — Rows are removable. Hero is locked first and can be turned Off.
          Drag the handle to reorder. Menu visibility still follows Page Builder → Menu → Public.
        </p>
        {loaded ? (
          <>
          <label className="block space-y-1 text-sm">
            <span>Label</span>
            <input
              className="w-full rounded-md border border-border bg-background px-3 py-2"
              value={homeLabel}
              onChange={(e) => setHomeLabel(e.target.value)}
              onBlur={() => setHomeLabel(normalizeHomeLabel(homeLabel))}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Slug</span>
            <input
              className="w-full rounded-md border border-border bg-background px-3 py-2"
              value="/"
              disabled
            />
            <span className="text-xs text-muted-foreground">
              Visitor URL: / — the Primary Page. Custom canvases use /p/{"{slug}"}.
            </span>
          </label>
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
            <div className="space-y-1 text-sm">
              <span className="block text-muted-foreground">Default columns for new Rows</span>
              <ColumnCycleToggle columns={homeColumns} onChange={setHomeColumns} />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => persist(custom, homeOrder, homeSections)}
              disabled={saving || !loaded}
            >
              {saving ? "Saving…" : "Save canvas"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="justify-self-end"
              onClick={addBlankHomeRow}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add row
            </Button>
          </div>
          <CanvasSizeControls
            surface="Desktop"
            width={homeWidth}
            margin={homeMargin}
            marginUnit={homeMarginUnit}
            onWidth={setHomeWidth}
            onMargin={setHomeMargin}
            onMarginUnit={setHomeMarginUnit}
          />
          <CanvasSizeControls
            surface="Mobile"
            width={homeMobileWidth}
            margin={homeMobileMargin}
            marginUnit={homeMobileMarginUnit}
            onWidth={setHomeMobileWidth}
            onMargin={setHomeMobileMargin}
            onMarginUnit={setHomeMobileMarginUnit}
          />
          {canvasIsDisabled(homeWidth) ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
              Width is 0% — the primary canvas is disabled on the visitor homepage.
            </p>
          ) : null}
          <div
            className="pb-section-pad space-y-3 rounded-lg border-2 border-dashed border-primary/35 bg-primary/[0.03]"
            style={canvasMetricVars({
              widthPct: homeWidth,
              margin: homeMargin,
              marginUnit: homeMarginUnit,
              mobileWidthPct: homeMobileWidth,
              mobileMargin: homeMobileMargin,
              mobileMarginUnit: homeMobileMarginUnit,
            })}
          >
            <div className="pb-canvas-inner space-y-3" data-pb-row-list="home">
            <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded border border-dashed border-primary/40 bg-background px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  Locked
                </span>
                <span className="text-sm font-medium">Hero</span>
                <RowVisibilityToggle on={homeHero} onChange={setHomeHero} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Brand lockup + Cycle Strip. Cannot reorder or remove. Off hides it on the visitor Page.
              </p>
            </div>
            {homeOrder.map((id, index) => {
              const slot = homeSections.find((s) => s.id === id) ?? {
                id,
                label: HOME_SECTION_LABELS[id as keyof typeof HOME_SECTION_LABELS] ?? id,
                kind: "empty" as const,
              };
              const isDrop = homeDrop === index && homeDrag !== null && homeDrag !== index;
              const homeRow = ensureRowCells(slot);
              return (
                <div
                  key={id}
                  data-pb-row={index}
                  onDragOver={(e) => {
                    if (cellDrag) e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (cellDrag) {
                      const empties = visibleCells(homeRow);
                      const emptyAt = empties.findIndex((c) => c.kind === "empty");
                      const dest = emptyAt >= 0 ? emptyAt : focusCell(id);
                      relocateHomeCell(cellDrag, id, dest);
                      setCellDrag(null);
                    }
                  }}
                  className={`rounded-lg border-2 bg-background ${
                    isDrop ? "border-primary ring-2 ring-primary/40" : "border-primary/30"
                  }`}
                >
                  <div className={`flex flex-wrap items-center gap-2 bg-primary/5 px-2 py-1.5 ${homeRow.collapsed ? "" : "border-b border-primary/20"}`}>
                    <span
                      onPointerDown={onRowGripDown("home", index)}
                      className={`touch-none select-none rounded border border-border p-1 text-muted-foreground ${homeDrag === index ? "cursor-grabbing" : "cursor-grab"}`}
                      title="Drag to reorder"
                    >
                      <GripVertical className="h-3.5 w-3.5" />
                    </span>
                    <button
                      type="button"
                      className="rounded p-1 text-muted-foreground hover:text-foreground"
                      aria-expanded={!homeRow.collapsed}
                      aria-label={homeRow.collapsed ? "Expand row" : "Collapse row"}
                      onClick={() => patchHomeSection(id, { collapsed: !homeRow.collapsed })}
                    >
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${homeRow.collapsed ? "-rotate-90" : ""}`} />
                    </button>
                    <Input
                      className="h-8 min-w-[8rem] max-w-[16rem]"
                      value={slot.label}
                      onChange={(e) => {
                        const label = e.target.value;
                        patchHomeSection(id, {
                          label,
                          ...(isBlankSlotLabel(label) ? { enabled: false } : {}),
                        });
                      }}
                      onBlur={() => {
                        if (homeRow.idManual) return;
                        const others = homeSections.filter((s) => s.id !== id).map((s) => s.id);
                        const nextId = uniqueKey(homeRow.label, others, "row");
                        if (nextId === id) return;
                        renameHomeRow(id, nextId);
                      }}
                      aria-label="Row label"
                    />
                    <label className="flex min-w-[8rem] max-w-[12rem] items-center gap-1 text-xs text-muted-foreground">
                      <span>#</span>
                      <Input
                        className="h-8 min-w-0"
                        value={anchorDraft[id] ?? id}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setAnchorDraft((cur) => ({ ...cur, [id]: raw }));
                        }}
                        onBlur={(e) => {
                          const raw = e.target.value;
                          setAnchorDraft((cur) => {
                            if (!(id in cur)) return cur;
                            const next = { ...cur };
                            delete next[id];
                            return next;
                          });
                          const others = homeSections.filter((s) => s.id !== id).map((s) => s.id);
                          if (!raw.trim()) {
                            const nextId = uniqueKey(homeRow.label, others, "row");
                            renameHomeRow(id, nextId, { idManual: false });
                            return;
                          }
                          const nextId = uniqueKey(raw, others, "row");
                          renameHomeRow(id, nextId, { idManual: true });
                        }}
                        aria-label="Row anchor"
                      />
                    </label>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {visibleCells(homeRow).some((cell) => cell.pairingId) ? "paired" : "empty"}
                    </span>
                    <ColumnCycleToggle
                      columns={homeRow.columns}
                      filled={rowElementCount(homeRow)}
                      onChange={(n) => {
                        patchHomeSection(id, { columns: n });
                        setCellFocus((cur) => ({ ...cur, [id]: Math.min(cur[id] ?? 0, n - 1) }));
                      }}
                    />
                    <SectionWidthSlider
                      compact
                      label="Desktop"
                      value={slot.width_pct}
                      onChange={(pct) => patchHomeSection(id, { width_pct: pct })}
                    />
                    <SectionWidthSlider
                      compact
                      label="Mobile"
                      mobile
                      value={slot.mobile_width_pct}
                      onChange={(pct) => patchHomeSection(id, { mobile_width_pct: pct })}
                    />
                    <span
                      className="ml-auto inline-flex items-center gap-1"
                      title={
                        isBlankSlotLabel(homeRow.label)
                          ? "Name the row before turning it On"
                          : undefined
                      }
                    >
                      <RowVisibilityToggle
                        on={isRowOn(homeRow)}
                        disabled={isBlankSlotLabel(homeRow.label)}
                        onChange={(on) => {
                          if (isBlankSlotLabel(homeRow.label) && on) return;
                          patchHomeSection(id, { enabled: on });
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeHomeSection(id, slot.label)}
                        aria-label={`Remove ${slot.label}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </span>
                  </div>
                  {homeRow.collapsed ? null : (
                  <div className="px-3 pt-3">
                    <div
                      className="mx-auto min-w-0"
                      style={{ width: `${clampSectionWidth(homeRow.width_pct)}%` }}
                    >
                    <RowCellStrip
                      row={homeRow}
                      selectedIndex={focusCell(id)}
                      heightCss={`${clampRowHeight(homeRow.display_px)}px`}
                      cellDrag={cellDrag}
                      onSelect={(cellIndex) => {
                        setCellFocus((cur) => ({ ...cur, [id]: cellIndex }));
                        const cell = visibleCells(homeRow)[cellIndex];
                        if (cell) publishTwin(homeRow, cell, cellIndex, "primary");
                      }}
                      onToggleCell={(cellIndex, on) =>
                        patchHomeSection(id, patchRowCell(homeRow, cellIndex, { enabled: on }))
                      }
                      onClearCell={(cellIndex) =>
                        patchHomeSection(id, clearCellBinding(homeRow, cellIndex))
                      }
                      onRemoveEmptyColumn={(cellIndex) => {
                        const next = removeEmptyColumn(homeRow, cellIndex);
                        if (!next) return;
                        patchHomeSection(id, { columns: next.columns, cells: next.cells });
                        setCellFocus((cur) => ({
                          ...cur,
                          [id]: Math.min(cur[id] ?? 0, Math.max((next.columns ?? 1) - 1, 0)),
                        }));
                      }}
                      onAddCell={(cellIndex) => startAddCell("primary", id, cellIndex)}
                      onDropCell={(cellIndex, source) => relocateHomeCell(source, id, cellIndex)}
                      onCellDragStart={(source) => setCellDrag(source)}
                      onCellDragEnd={() => setCellDrag(null)}
                      paintCell={(cell, cellIndex) =>
                        cell.kind === "empty" || !cell.pairingId ? null : (
                          <CellPaint
                            cell={cell}
                            cellIndex={cellIndex}
                            row={homeRow}
                            cycleSteps={previewData.cycleSteps}
                          />
                        )
                      }
                    />
                    <RowHeightHandle
                      displayPx={homeRow.display_px}
                      onDisplayChange={(px) => patchHomeSection(id, { display_px: px })}
                      heightPx={homeRow.height_px}
                      heightVh={homeRow.height_vh}
                      unit={homeRow.height_unit}
                      onChange={(next) => patchHomeSection(id, next)}
                    />
                    {isBlankSlotLabel(homeRow.label) ? null : (
                      <ElementConfigSection>
                        <RowCellConfigGrid
                          row={homeRow}
                          usedFeatures={(cellId) =>
                            usedFeatureIds({ sections: homeSections }, undefined, cellId)
                          }
                          browserKey={browserKey}
                          browserRows={browserRows}
                          browserSearch={browserSearch}
                          browserLoading={browserLoading}
                          onPatch={(cellIndex, patch) =>
                            patchHomeSection(id, patchRowCell(homeRow, cellIndex, patch))
                          }
                          onClear={(cellIndex) =>
                            patchHomeSection(id, clearCellBinding(homeRow, cellIndex))
                          }
                          onBrowse={(cellIndex, recordType) =>
                            void openRecordBrowser(id, cellIndex, recordType)
                          }
                          onSearch={setBrowserSearch}
                          onToggleRecord={(cellIndex, recordId) =>
                            togglePickedRecord("primary", id, cellIndex, recordId)
                          }
                          onConfigure={(cellIndex) =>
                            startConfigureCell("primary", id, cellIndex)
                          }
                        />
                      </ElementConfigSection>
                    )}
                    </div>
                  </div>
                  )}
                </div>
              );
            })}
            </div>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="justify-self-start"
              onClick={addBlankHomeRow}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add row
            </Button>
            <Button
              type="button"
              onClick={() => persist(custom, homeOrder, homeSections)}
              disabled={saving || !loaded}
            >
              {saving ? "Saving…" : "Save canvas"}
            </Button>
            <div />
          </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Loading…</p>
        )}
      </div>

      <div className={`space-y-4 rounded-lg border border-border p-4 ${builderTab === "primary" ? "hidden" : ""}`}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">{editCanvas.label || `Custom Canvas ${editIndex + 1}`}</p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => (preview ? setPreview(false) : void openPreview())}
              aria-pressed={preview}
              title={preview ? "Close preview" : "Preview this canvas"}
              aria-label={preview ? "Close preview" : "Preview this canvas"}
            >
              {preview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <BooleanSwitch
              checked={!canvasIsDisabled(editCanvas.width_pct, editCanvas.enabled)}
              onChange={(on) =>
                commitEdit({
                  ...editCanvas,
                  enabled: on,
                  width_pct:
                    on && clampCanvasWidth(editCanvas.width_pct) === 0
                      ? DEFAULT_CANVAS_WIDTH_PCT
                      : editCanvas.width_pct,
                })
              }
              label={!canvasIsDisabled(editCanvas.width_pct, editCanvas.enabled) ? "On" : "Off"}
            />
            {editIndex > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  removeCanvas(editIndex);
                  setBuilderTab("primary");
                }}
                aria-label="Remove this canvas"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {editCanvas.label?.trim() || "Custom canvas"} — Rows are removable. Drag the handle to
          reorder. Menu visibility still follows Page Builder → Menu → Public.
        </p>
        {loaded ? (
        <>
        <label className="block space-y-1 text-sm">
          <span>Label</span>
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2"
            value={editCanvas.label}
            onChange={(e) => commitEdit({ ...editCanvas, label: e.target.value })}
            onBlur={() => {
              if (editCanvas.slugManual) return;
              const others = canvases.filter((_, i) => i !== editIndex).map((c) => c.slug);
              const slug = uniqueKey(editCanvas.label, others, "overview");
              if (slug === editCanvas.slug) return;
              commitEdit({ ...editCanvas, slug });
            }}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Slug</span>
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2"
            value={slugDraft ?? editCanvas.slug}
            onChange={(e) => setSlugDraft(e.target.value)}
            onBlur={(e) => {
              const raw = e.target.value;
              setSlugDraft(null);
              const others = canvases.filter((_, i) => i !== editIndex).map((c) => c.slug);
              if (!raw.trim()) {
                const slug = uniqueKey(editCanvas.label, others, "overview");
                commitEdit({ ...editCanvas, slug, slugManual: false });
                return;
              }
              const slug = uniqueKey(raw, others, "overview");
              commitEdit({ ...editCanvas, slug, slugManual: true });
            }}
          />
          <span className="text-xs text-muted-foreground">Visitor URL: /p/{editCanvas.slug || "overview"}</span>
        </label>
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
          <div className="space-y-1 text-sm">
            <span className="block text-muted-foreground">Default columns for new Rows</span>
            <ColumnCycleToggle
              columns={editCanvas.columns}
              onChange={(n) => commitEdit({ ...editCanvas, columns: n })}
            />
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => persist(editIndex === 0 ? editCanvas : custom, homeOrder, homeSections)}
            disabled={saving || !loaded}
          >
            {saving ? "Saving…" : "Save canvas"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="justify-self-end"
            onClick={() => addSection()}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add row
          </Button>
        </div>
        <CanvasSizeControls
          surface="Desktop"
          width={editCanvas.width_pct}
          margin={editCanvas.margin}
          marginUnit={editCanvas.margin_unit}
          onWidth={(pct) =>
            commitEdit({
              ...editCanvas,
              width_pct: pct,
              enabled: pct === 0 ? false : true,
            })
          }
          onMargin={(value) => commitEdit({ ...editCanvas, margin: value })}
          onMarginUnit={(unit) => commitEdit({ ...editCanvas, margin_unit: unit })}
        />
        <CanvasSizeControls
          surface="Mobile"
          width={editCanvas.mobile_width_pct}
          margin={editCanvas.mobile_margin}
          marginUnit={editCanvas.mobile_margin_unit}
          onWidth={(pct) => commitEdit({ ...editCanvas, mobile_width_pct: pct })}
          onMargin={(value) => commitEdit({ ...editCanvas, mobile_margin: value })}
          onMarginUnit={(unit) => commitEdit({ ...editCanvas, mobile_margin_unit: unit })}
        />
        {canvasIsDisabled(editCanvas.width_pct, editCanvas.enabled) ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
            This canvas is off — visitors will not see /p/{editCanvas.slug || "overview"}.
          </p>
        ) : null}
        <div className="space-y-3">
          <div
            className="pb-section-pad space-y-3 rounded-lg border-2 border-dashed border-primary/35 bg-primary/[0.03]"
            style={canvasMetricVars({
              widthPct: editCanvas.width_pct,
              margin: editCanvas.margin,
              marginUnit: editCanvas.margin_unit,
              mobileWidthPct: editCanvas.mobile_width_pct,
              mobileMargin: editCanvas.mobile_margin,
              mobileMarginUnit: editCanvas.mobile_margin_unit,
            })}
          >
            <div className="pb-canvas-inner space-y-3" data-pb-row-list="custom">
          {editCanvas.sections.map((row, index) => {
            const blank = isBlankSlotLabel(row.label);
            const isDrop = dropIndex === index && dragIndex !== null && dragIndex !== index;
            const customRow = ensureRowCells(row);
            return (
                <div
                  key={row.id}
                  data-pb-row={index}
                  onDragOver={(e) => {
                    if (cellDrag && !blank) e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (cellDrag && !blank) {
                      const empties = visibleCells(ensureRowCells(row));
                      const emptyAt = empties.findIndex((c) => c.kind === "empty");
                      const dest = emptyAt >= 0 ? emptyAt : focusCell(row.id);
                      relocateCustomCell(cellDrag, row.id, dest);
                      setCellDrag(null);
                    }
                  }}
                  className={`rounded-lg border-2 bg-background ${
                    isDrop ? "border-primary ring-2 ring-primary/40" : "border-primary/30"
                  }`}
                >
                  <div className={`flex flex-wrap items-center gap-2 bg-primary/5 px-2 py-1.5 ${row.collapsed ? "" : "border-b border-primary/20"}`}>
                    <span
                      onPointerDown={onRowGripDown("custom", index)}
                      className={`touch-none select-none rounded border border-border p-1 text-muted-foreground ${dragIndex === index ? "cursor-grabbing" : "cursor-grab"}`}
                      title="Drag to reorder"
                      aria-label={`Reorder ${row.label || "row"}`}
                    >
                      <GripVertical className="h-3.5 w-3.5" />
                    </span>
                    <button
                      type="button"
                      className="rounded p-1 text-muted-foreground hover:text-foreground"
                      aria-expanded={!row.collapsed}
                      aria-label={row.collapsed ? "Expand row" : "Collapse row"}
                      onClick={() => setSection(index, { collapsed: !row.collapsed })}
                    >
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${row.collapsed ? "-rotate-90" : ""}`} />
                    </button>
                    <Input
                      className="h-8 min-w-[8rem] max-w-[16rem]"
                      value={row.label}
                      onChange={(e) => {
                        const label = e.target.value;
                        setSection(index, {
                          label,
                          ...(isBlankSlotLabel(label) ? { enabled: false } : {}),
                        });
                      }}
                      onBlur={() => {
                        if (row.idManual) return;
                        const others = editCanvas.sections
                          .filter((_, i) => i !== index)
                          .map((s) => s.id);
                        const id = uniqueKey(row.label, others, "row");
                        if (id === row.id) return;
                        setSection(index, { id });
                      }}
                      aria-label="Row label"
                    />
                    <label className="flex min-w-[8rem] max-w-[12rem] items-center gap-1 text-xs text-muted-foreground">
                      <span>#</span>
                      <Input
                        className="h-8 min-w-0"
                        value={anchorDraft[row.id] ?? row.id}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setAnchorDraft((cur) => ({ ...cur, [row.id]: raw }));
                        }}
                        onBlur={(e) => {
                          const raw = e.target.value;
                          setAnchorDraft((cur) => {
                            if (!(row.id in cur)) return cur;
                            const next = { ...cur };
                            delete next[row.id];
                            return next;
                          });
                          const others = editCanvas.sections
                            .filter((_, i) => i !== index)
                            .map((s) => s.id);
                          if (!raw.trim()) {
                            const id = uniqueKey(row.label, others, "row");
                            if (id === row.id && !row.idManual) return;
                            setSection(index, { id, idManual: false });
                            return;
                          }
                          const id = uniqueKey(raw, others, "row");
                          if (id === row.id && row.idManual) return;
                          setSection(index, { id, idManual: true });
                        }}
                        aria-label="Row anchor"
                      />
                    </label>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {visibleCells(customRow).some((cell) => cell.pairingId) ? "paired" : "empty"}
                    </span>
                    <ColumnCycleToggle
                      columns={customRow.columns}
                      filled={rowElementCount(customRow)}
                      onChange={(n) => {
                        setSection(index, { columns: n });
                        setCellFocus((cur) => ({ ...cur, [row.id]: Math.min(cur[row.id] ?? 0, n - 1) }));
                      }}
                    />
                    <SectionWidthSlider
                      compact
                      label="Desktop"
                      value={row.width_pct}
                      onChange={(pct) => setSection(index, { width_pct: pct })}
                    />
                    <SectionWidthSlider
                      compact
                      label="Mobile"
                      mobile
                      value={row.mobile_width_pct}
                      onChange={(pct) => setSection(index, { mobile_width_pct: pct })}
                    />
                    <span
                      className="ml-auto inline-flex items-center gap-1"
                      title={blank ? "Name the row before turning it On" : undefined}
                    >
                      <RowVisibilityToggle
                        on={isRowOn(row)}
                        disabled={blank}
                        onChange={(on) => {
                          if (blank && on) return;
                          setSection(index, { enabled: on });
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSection(index)}
                        disabled={editCanvas.sections.length <= 1}
                        aria-label="Remove row"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </span>
                  </div>
                  {row.collapsed ? null : (
                  <div className="px-3 pt-3">
                  <div
                    className="mx-auto min-w-0"
                    style={{ width: `${clampSectionWidth(row.width_pct)}%` }}
                  >
                  <RowCellStrip
                    row={customRow}
                    selectedIndex={focusCell(row.id)}
                    heightCss={`${clampRowHeight(row.display_px)}px`}
                    cellDrag={cellDrag}
                    onSelect={(cellIndex) => {
                      setCellFocus((cur) => ({ ...cur, [row.id]: cellIndex }));
                      const cell = visibleCells(ensureRowCells(row))[cellIndex];
                      if (cell) publishTwin(row, cell, cellIndex, "custom");
                    }}
                    onToggleCell={(cellIndex, on) =>
                      setSection(index, patchRowCell(row, cellIndex, { enabled: on }))
                    }
                    onClearCell={(cellIndex) =>
                      setSection(index, clearCellBinding(row, cellIndex))
                    }
                    onRemoveEmptyColumn={(cellIndex) => {
                      const next = removeEmptyColumn(row, cellIndex);
                      if (!next) return;
                      setSection(index, { columns: next.columns, cells: next.cells });
                      setCellFocus((cur) => ({
                        ...cur,
                        [row.id]: Math.min(cur[row.id] ?? 0, Math.max((next.columns ?? 1) - 1, 0)),
                      }));
                    }}
                    onAddCell={(cellIndex) => startAddCell("custom", row.id, cellIndex)}
                    onDropCell={(cellIndex, source) => relocateCustomCell(source, row.id, cellIndex)}
                    onCellDragStart={(source) => setCellDrag(source)}
                    onCellDragEnd={() => setCellDrag(null)}
                    paintCell={(cell, cellIndex) =>
                      cell.kind === "empty" || !cell.pairingId ? null : (
                        <CellPaint
                          cell={cell}
                          cellIndex={cellIndex}
                          row={row}
                          cycleSteps={previewData.cycleSteps}
                        />
                      )
                    }
                  />
                  <RowHeightHandle
                    displayPx={row.display_px}
                    onDisplayChange={(px) => setSection(index, { display_px: px })}
                    heightPx={row.height_px}
                    heightVh={row.height_vh}
                    unit={row.height_unit}
                    onChange={(next) => setSection(index, next)}
                  />
                  {blank ? (
                    <p className="text-xs text-muted-foreground">
                      Name this Row before turning it On. Config columns appear under each Cell.
                    </p>
                  ) : (
                    <ElementConfigSection>
                      <RowCellConfigGrid
                        row={row}
                        usedFeatures={(cellId) => usedFeatureIds(editCanvas, undefined, cellId)}
                        browserKey={browserKey}
                        browserRows={browserRows}
                        browserSearch={browserSearch}
                        browserLoading={browserLoading}
                        onPatch={(cellIndex, patch) =>
                          setSection(index, patchRowCell(row, cellIndex, patch))
                        }
                        onClear={(cellIndex) =>
                          setSection(index, clearCellBinding(row, cellIndex))
                        }
                        onBrowse={(cellIndex, recordType) =>
                          void openRecordBrowser(row.id, cellIndex, recordType)
                        }
                        onSearch={setBrowserSearch}
                        onToggleRecord={(cellIndex, recordId) =>
                          togglePickedRecord("custom", row.id, cellIndex, recordId)
                        }
                        onConfigure={(cellIndex) =>
                          startConfigureCell("custom", row.id, cellIndex)
                        }
                      />
                    </ElementConfigSection>
                  )}
                    </div>
                  </div>
                  )}
                </div>
            );
          })}
          <div
            data-pb-row={editCanvas.sections.length}
            className={`h-2 rounded-sm transition-colors ${
              dropIndex === editCanvas.sections.length && dragIndex !== null
                ? "bg-primary/30 ring-1 ring-primary/50"
                : dragIndex !== null
                  ? "bg-muted/40"
                  : ""
            }`}
          />
            </div>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="justify-self-start"
              onClick={() => addSection()}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add row
            </Button>
            <Button
              type="button"
              onClick={() => persist(editIndex === 0 ? editCanvas : custom, homeOrder, homeSections)}
              disabled={saving || !loaded}
            >
              {saving ? "Saving…" : "Save canvas"}
            </Button>
            <div />
          </div>
        </div>
        </>
        ) : (
          <p className="text-xs text-muted-foreground">Loading canvas…</p>
        )}
      </div>

      {preview ? (
        <div className="space-y-3 rounded-lg border border-primary/40 bg-muted/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">
                Preview · {editCanvas.label || "Overview"} (visitor view · {clampCanvasWidth(editCanvas.width_pct)}%
                width)
              </p>
              <p className="text-xs text-muted-foreground">
                Slug: /p/{custom.slug || "overview"} · drafts only — nothing here is saved to the visitor
                site until you press Save canvas.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setPreview(false)}>
              <EyeOff className="mr-1 h-4 w-4" /> Close
            </Button>
          </div>
          <div
            className="pb-section-pad space-y-3 rounded-lg border-2 border-dashed border-primary/35 bg-primary/[0.03]"
            style={canvasMetricVars({
              widthPct: editCanvas.width_pct,
              margin: editCanvas.margin,
              marginUnit: editCanvas.margin_unit,
              mobileWidthPct: editCanvas.mobile_width_pct,
              mobileMargin: editCanvas.mobile_margin,
              mobileMarginUnit: editCanvas.mobile_margin_unit,
            })}
          >
            <div className="pb-canvas-inner space-y-3">
            {custom.sections.filter(isRowOn).map((row) => (
              <div key={`preview-${row.id}`} className="rounded-md border-2 border-primary/30 bg-background p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{custom.label}</p>
                    <h2 className="mt-1 text-xl font-semibold">{row.label}</h2>
                    <div className="mt-3 space-y-3">
                      {visibleCells(ensureRowCells(row)).map((cell, cellIndex) =>
                        cell.kind === "empty" || !cell.pairingId ? (
                          <p key={cell.id} className="text-sm text-muted-foreground">
                            Empty cell · /p/{custom.slug || "overview"}#{row.id}
                          </p>
                        ) : (
                          <CellPaint
                            key={cell.id}
                            cell={cell}
                            cellIndex={cellIndex}
                            row={row}
                            cycleSteps={previewData.cycleSteps}
                          />
                        ),
                      )}
                    </div>
              </div>
            ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
