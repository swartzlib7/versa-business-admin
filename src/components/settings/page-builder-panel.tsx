"use client";

import { useEffect, useState } from "react";
import { BooleanSwitch } from "@/components/ui/boolean-switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, GripVertical, Plus, X } from "lucide-react";
import {
  DEFAULT_CUSTOM_CANVAS,
  DEFAULT_HOME_SECTION_ORDER,
  HOME_SECTION_LABELS,
  HOMEPAGE_SLOT_ORDER,
  MAX_CANVASES,
  PAGE_BUILDER_FEATURES,
  PAGE_BUILDER_RECORD_TYPES,
  blankCanvas,
  canvasFrameStyle,
  canvasIsDisabled,
  clampCanvasWidth,
  clampRowHeight,
  clampSectionColumns,
  clampSectionWidth,
  DEFAULT_CANVAS_WIDTH_PCT,
  DEFAULT_HOME_WIDTH_PCT,
  defaultDriverFor,
  defaultHomeSection,
  defaultHomeSections,
  ensureRowCells,
  isBlankSlotLabel,
  nextCanvasSlug,
  normalizePageBuilder,
  cellBindingLabel,
  clearCellBinding,
  patchRowCell,
  slotBindingLabel,
  swapCellBindings,
  usedFeatureIds,
  visibleCells,
  type CanvasMarginUnit,
  type CustomCanvas,
  type PageBuilderCell,
  type PageBuilderSection,
  type SlotKind,
} from "@/lib/public/page-builder";
import { CanvasSlotDriver, type CanvasSlotStat } from "@/components/public/canvas-slot-drivers";
import {
  CanvasSizeControls,
  ColumnCycleToggle,
  RowCellStrip,
  RowHeightHandle,
  RowVisibilityToggle,
  SectionWidthSlider,
  iconForBinding,
  selectedCell,
  type CellDragSource,
} from "@/components/settings/page-builder-controls";
import { ELEMENT_TYPE_PALETTE, elementTypeById } from "@/lib/public/element-types";
import {
  driverEntry,
  driverShapeLabel,
  encodeDriverDrop,
  pairableDriverList,
  parseDriverDrop,
} from "@/lib/public/render-drivers";
import {
  ElementBindWizard,
  type BindWizardRequest,
} from "@/components/settings/element-bind-wizard";
import type { CycleStep } from "@/lib/public/site-types";
import type { HomeContentBundle, HomeSectionContent } from "@/lib/public/demo-content";
import { useTwinSlot } from "@/components/zones/twin-slot-context";

const fieldClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm";
const BLANK_LABEL = "__blank__";

type PreviewData = {
  cycleSteps: CycleStep[];
  stat: CanvasSlotStat | null;
};

function homeIdForCell(cell: PageBuilderCell, rowId: string): string {
  if (cell.driver?.startsWith("home:")) return cell.driver.slice(5);
  if (cell.featureId?.startsWith("home:")) return cell.featureId.slice(5);
  return rowId;
}

function CellPaint({
  cell,
  homeContent,
  cycleSteps,
  stat,
}: {
  cell: PageBuilderCell;
  cellIndex: number;
  row: PageBuilderSection;
  homeContent?: HomeSectionContent;
  cycleSteps: CycleStep[];
  stat: CanvasSlotStat | null;
}) {
  if (cell.kind === "empty") return null;
  return (
    <div className="h-full min-h-0 overflow-hidden p-1">
      <CanvasSlotDriver
        driver={cell.driver}
        cycleSteps={cycleSteps}
        stat={stat}
        homeContent={homeContent}
        renderOutput={cell.renderOutput}
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
  const [chipDrag, setChipDrag] = useState<string | null>(null);
  const [openDriver, setOpenDriver] = useState<string | null>(null);
  const [cellDrag, setCellDrag] = useState<CellDragSource | null>(null);
  const [preview, setPreview] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData>({ cycleSteps: [], stat: null });
  const [homeOrder, setHomeOrder] = useState<string[]>(DEFAULT_HOME_SECTION_ORDER);
  const [homeSections, setHomeSections] = useState<PageBuilderSection[]>(defaultHomeSections());
  const [homeContent, setHomeContent] = useState<HomeContentBundle | null>(null);
  const [homeDrag, setHomeDrag] = useState<number | null>(null);
  const [homeDrop, setHomeDrop] = useState<number | null>(null);
  const [builderTab, setBuilderTab] = useState<"primary" | number>("primary");
  const [homeHero, setHomeHero] = useState(true);
  const [homeWidth, setHomeWidth] = useState(DEFAULT_HOME_WIDTH_PCT);
  const [homeMargin, setHomeMargin] = useState(0);
  const [homeMarginUnit, setHomeMarginUnit] = useState<CanvasMarginUnit>("px");
  const [cellFocus, setCellFocus] = useState<Record<string, number>>({});
  const [wizard, setWizard] = useState<BindWizardRequest | null>(null);
  // PB-13: record browser (search + multi-pick) for record-type sections.
  const [browserSectionId, setBrowserSectionId] = useState<string | null>(null);
  const [browserRows, setBrowserRows] = useState<{ id: string; name: string }[]>([]);
  const [browserSearch, setBrowserSearch] = useState("");
  const [browserLoading, setBrowserLoading] = useState(false);

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
        setLoaded(true);
      })
      .catch(() => {
        setError("Could not load Page Builder.");
        setLoaded(true);
      });
  }, []);

  useEffect(() => {
    fetch("/api/public/home-content")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("home-content"))))
      .then((json: { data?: HomeContentBundle }) => {
        if (json.data) setHomeContent(json.data);
      })
      .catch(() => undefined);
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
    let n = editCanvas.sections.length + 1;
    let id = `blank-${n}`;
    while (editCanvas.sections.some((s) => s.id === id)) {
      n += 1;
      id = `blank-${n}`;
    }
    const row: PageBuilderSection = {
      id,
      label: BLANK_LABEL,
      kind: "empty",
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
    commitEdit({
      ...editCanvas,
      sections: editCanvas.sections.map((row, i) =>
        i === index ? ensureRowCells({ ...row, ...patch }) : row,
      ),
    });
  };

  const focusCell = (rowId: string) => cellFocus[rowId] ?? 0;

  const setCell = (index: number, patch: Partial<PageBuilderCell>) => {
    const row = editCanvas.sections[index];
    if (!row) return;
    const cellIndex = focusCell(row.id);
    setSection(index, patchRowCell(row, cellIndex, patch));
  };

  const removeSection = (index: number) => {
    if (editCanvas.sections.length <= 1) return;
    commitEdit({
      ...editCanvas,
      sections: editCanvas.sections.filter((_, i) => i !== index),
    });
  };

  const openTypeWizard = (
    canvas: "primary" | "custom",
    rowId: string,
    chipId: string,
    cellIndex?: number,
    row?: PageBuilderSection,
  ) => {
    const { driverId, outputId } = parseDriverDrop(chipId);
    const driver = driverEntry(driverId);
    const typeFromDriver = driver?.compatibleTypes
      .map((t) => elementTypeById(t))
      .find((t) => t);
    const type =
      typeFromDriver ??
      ELEMENT_TYPE_PALETTE.find((t) => t.id === driverId || t.recordType === driverId);
    if (!type || !row) return;
    const cells = visibleCells(ensureRowCells(row));
    const foundEmpty = cells.findIndex((c) => c.kind === "empty");
    const cellAt = cellIndex ?? (foundEmpty >= 0 ? foundEmpty : focusCell(rowId));
    setCellFocus((cur) => ({ ...cur, [rowId]: cellAt }));
    setWizard({
      recordType: type.id,
      rowId,
      cellIndex: cellAt,
      canvas,
      preferredDriver: driver?.id,
      preferredOutput: outputId,
    });
  };

  const applyChip = (index: number, chipId: string, cellIndex?: number) => {
    const row = editCanvas.sections[index];
    if (!row) return;
    openTypeWizard("custom", row.id, chipId, cellIndex, row);
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

  const patchHomeSection = (id: string, patch: Partial<PageBuilderSection>) => {
    setHomeSections((cur) =>
      cur.map((row) => (row.id === id ? ensureRowCells({ ...row, ...patch }) : row)),
    );
  };

  const applyChipHome = (rowId: string, chipId: string, cellIndex?: number) => {
    const row = homeSections.find((s) => s.id === rowId);
    if (!row) return;
    openTypeWizard("primary", rowId, chipId, cellIndex, row);
  };

  const applyWizardBind = (patch: Partial<PageBuilderCell>) => {
    if (!wizard) return;
    if (wizard.canvas === "primary") {
      const row = homeSections.find((s) => s.id === wizard.rowId);
      if (row) patchHomeSection(wizard.rowId, patchRowCell(row, wizard.cellIndex, patch));
    } else {
      const index = editCanvas.sections.findIndex((s) => s.id === wizard.rowId);
      const row = editCanvas.sections[index];
      if (row) setSection(index, patchRowCell(row, wizard.cellIndex, patch));
    }
    setWizard(null);
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

  const removeHomeSection = (id: string) => {
    setHomeOrder((cur) => cur.filter((row) => row !== id));
    setHomeSections((cur) => cur.filter((row) => row.id !== id));
  };

  const addHomeSection = (id: (typeof HOMEPAGE_SLOT_ORDER)[number]) => {
    if (homeOrder.includes(id)) return;
    setHomeOrder((cur) => [...cur, id]);
    setHomeSections((cur) =>
      cur.some((row) => row.id === id) ? cur : [...cur, defaultHomeSection(id)],
    );
  };

  const editIndex = typeof builderTab === "number" ? builderTab : 0;
  const editCanvas = canvases[editIndex] ?? custom;
  const commitEdit = (next: CustomCanvas) => {
    if (editIndex <= 0) commitCustom(next);
    else updateCanvasAt(editIndex, next);
  };

  const homeContentFor = (id: string): HomeSectionContent | undefined =>
    homeContent?.sections.find((s) => s.id === id);

  const publishTwin = (
    row: PageBuilderSection,
    cell: PageBuilderCell,
    cellIndex: number,
    canvas: "primary" | "custom",
  ) => {
    const content = homeContentFor(row.id) ?? homeContentFor(homeIdForCell(cell, row.id));
    const commit = (outputId: string) => {
      if (canvas === "primary") {
        patchHomeSection(row.id, patchRowCell(row, cellIndex, { renderOutput: outputId }));
      } else {
        const index = editCanvas.sections.findIndex((s) => s.id === row.id);
        if (index >= 0) setSection(index, patchRowCell(row, cellIndex, { renderOutput: outputId }));
      }
    };
    if (cell.kind === "empty" || !cell.driver) {
      twin.setPreview(null);
      return;
    }
    if (cell.driver === "stat-graph") {
      twin.setPreview({
        kind: "stat-graph",
        values: previewData.stat?.values ?? { name: cellBindingLabel(cell) },
        headerId: cell.recordId ?? previewData.stat?.headerId ?? null,
        lines: previewData.stat?.lines,
        renderOutput: cell.renderOutput,
        onRenderOutput: commit,
      });
      return;
    }
    twin.setPreview({
      kind: "canvas-driver",
      driver: cell.driver,
      label: cellBindingLabel(cell),
      homeContent: content ?? homeContentFor(homeIdForCell(cell, row.id)),
      cycleSteps: previewData.cycleSteps,
      renderOutput: cell.renderOutput,
      onRenderOutput: commit,
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

  // PB-13: record browser — search + multi-pick for record-type sections.
  const openRecordBrowser = async (sectionId: string) => {
    setBrowserSectionId((cur) => (cur === sectionId ? null : sectionId));
    setBrowserSearch("");
    if (browserRows.length || browserLoading) return;
    setBrowserLoading(true);
    try {
      const res = await fetch("/api/records?type=statistics", { credentials: "include" });
      if (!res.ok) throw new Error("records");
      const json: { data?: { id: string; name: string }[] } = await res.json();
      setBrowserRows((json.data ?? []).map((r) => ({ id: r.id, name: r.name || r.id })));
    } catch {
      setBrowserRows([]);
    } finally {
      setBrowserLoading(false);
    }
  };

  const togglePickedRecord = (sectionIndex: number, recordId: string) => {
    const row = editCanvas.sections[sectionIndex];
    if (!row) return;
    const cell = selectedCell(row, focusCell(row.id));
    const picked = new Set(cell.recordIds ?? []);
    if (picked.has(recordId)) picked.delete(recordId);
    else picked.add(recordId);
    setCell(sectionIndex, { recordIds: [...picked] });
  };

  // Resolve the stat binding's record + lines while Preview is open.
  // Keyed on the bound record id so typing elsewhere does not refetch.
  const statBindingId = preview
    ? custom.sections.find(
        (row) =>
          row.kind === "record" &&
          row.driver === "stat-graph" &&
          row.recordId &&
          !isBlankSlotLabel(row.label),
      )?.recordId ?? ""
    : "";

  useEffect(() => {
    if (!statBindingId) return;
    let cancelled = false;
    const headerId = statBindingId;
    void (async () => {
      try {
        const recRes = await fetch(`/api/records/${encodeURIComponent(headerId)}`, {
          credentials: "include",
        });
        if (!recRes.ok) throw new Error("record");
        const recJson = await recRes.json();
        const rec = recJson?.data as { type_api_name?: string; data?: Record<string, string> } | undefined;
        if (!rec || rec.type_api_name !== "statistics") throw new Error("type");
        const linesRes = await fetch(`/api/statistics/${encodeURIComponent(headerId)}/lines`, {
          credentials: "include",
        });
        const linesJson = linesRes.ok ? await linesRes.json() : null;
        const rawLines = Array.isArray(linesJson?.data) ? linesJson.data : [];
        const lines = rawLines.map((row: { series?: unknown; slot?: unknown; value?: unknown }) => ({
          series: Number(row.series) || 0,
          slot: Number(row.slot) || 0,
          value: Number(row.value) || 0,
        }));
        if (!cancelled) {
          setPreviewData((prev) => ({ ...prev, stat: { headerId, values: rec.data ?? {}, lines } }));
        }
      } catch {
        if (!cancelled) setPreviewData((prev) => ({ ...prev, stat: null }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [statBindingId]);

  return (
    <div className="space-y-6">
      {wizard ? (
        <ElementBindWizard
          request={wizard}
          onCancel={() => setWizard(null)}
          onBind={applyWizardBind}
        />
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {saved ? <p className="text-sm text-muted-foreground">Saved. Hard-refresh the public site to see the menu.</p> : null}

      <div className="space-y-2">
        <p className="text-sm font-medium">Drivers</p>
        <p className="text-xs text-muted-foreground">
          Click a driver, then drag a recipe onto a Cell. Pick the record in the wizard — the
          canvas does not search records. Drag a bound Element to another Cell or Row to move it
          (occupied Cells swap).
        </p>
        <div className="flex flex-col gap-1.5">
          {pairableDriverList().map((item) => {
            const Icon = iconForBinding({
              id: item.id,
              recordType: item.compatibleTypes[0],
              driver: item.id,
            });
            const open = openDriver === item.id;
            return (
              <div key={item.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => setOpenDriver(open ? null : item.id)}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs ${
                    open
                      ? "border-primary/60 bg-primary/10 text-foreground"
                      : "border-border bg-muted/40 text-muted-foreground"
                  }`}
                  title={item.description ?? item.label}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                  <span className="text-[10px] opacity-70">{driverShapeLabel(item.bindShape)}</span>
                </button>
                {open ? (
                  <div className="flex flex-wrap gap-1.5 pl-4">
                    {item.outputs.map((out) => {
                      const dropId = encodeDriverDrop(item.id, out.id);
                      return (
                        <span
                          key={out.id}
                          draggable
                          onDragStart={(e) => {
                            setChipDrag(dropId);
                            e.dataTransfer.effectAllowed = "copy";
                          }}
                          onDragEnd={() => setChipDrag(null)}
                          className={`inline-flex cursor-grab select-none items-center rounded-md border px-2 py-1 text-[11px] active:cursor-grabbing ${
                            chipDrag === dropId
                              ? "border-primary/60 bg-primary/10 text-foreground"
                              : "border-border bg-background text-muted-foreground"
                          }`}
                        >
                          {out.label}
                        </span>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

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
          <CanvasSizeControls
            width={homeWidth}
            margin={homeMargin}
            marginUnit={homeMarginUnit}
            onWidth={setHomeWidth}
            onMargin={setHomeMargin}
            onMarginUnit={setHomeMarginUnit}
          />
          {canvasIsDisabled(homeWidth) ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
              Width is 0% — the primary canvas is disabled on the visitor homepage.
            </p>
          ) : null}
          <div
            className="space-y-3 rounded-lg border-2 border-dashed border-primary/35 bg-primary/[0.03] p-2"
            style={canvasFrameStyle(homeWidth, homeMargin, homeMarginUnit).pad}
          >
            <div className="space-y-3" style={canvasFrameStyle(homeWidth, homeMargin, homeMarginUnit).inner}>
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
                kind: "feature" as const,
                featureId: `home:${id}`,
                driver: `home:${id}`,
              };
              const content = homeContentFor(id);
              const isDrop = homeDrop === index && homeDrag !== null && homeDrag !== index;
              const homeRow = ensureRowCells(slot);
              return (
                <div
                  key={id}
                  onDragOver={(e) => {
                    if (homeDrag !== null) {
                      e.preventDefault();
                      setHomeDrop(index);
                      return;
                    }
                    if (chipDrag || cellDrag) e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (chipDrag) {
                      applyChipHome(id, chipDrag);
                      setChipDrag(null);
                    } else if (cellDrag) {
                      const empties = visibleCells(homeRow);
                      const emptyAt = empties.findIndex((c) => c.kind === "empty");
                      const dest = emptyAt >= 0 ? emptyAt : focusCell(id);
                      relocateHomeCell(cellDrag, id, dest);
                      setCellDrag(null);
                    } else if (homeDrag !== null && homeDrag !== index) {
                      moveHomeSection(homeDrag, index);
                    }
                    setHomeDrag(null);
                    setHomeDrop(null);
                  }}
                  className={`rounded-lg border-2 bg-background ${
                    isDrop ? "border-primary ring-2 ring-primary/40" : "border-primary/30"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 border-b border-primary/20 bg-primary/5 px-2 py-1.5">
                    <span
                      draggable
                      onDragStart={(e) => {
                        setHomeDrag(index);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => {
                        setHomeDrag(null);
                        setHomeDrop(null);
                      }}
                      className="cursor-grab rounded border border-border p-1 text-muted-foreground active:cursor-grabbing"
                      title="Drag to reorder"
                    >
                      <GripVertical className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm font-medium">{slot.label}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {content?.source === "record" ? "record" : "fixture-gap"}
                    </span>
                    <RowVisibilityToggle
                      on={homeRow.enabled !== false}
                      onChange={(on) => patchHomeSection(id, { enabled: on })}
                    />
                    <ColumnCycleToggle
                      columns={homeRow.columns}
                      onChange={(n) => {
                        patchHomeSection(id, { columns: n });
                        setCellFocus((cur) => ({ ...cur, [id]: Math.min(cur[id] ?? 0, n - 1) }));
                      }}
                      title="Row columns — each column is a Cell"
                    />
                    <SectionWidthSlider
                      compact
                      value={slot.width_pct}
                      onChange={(pct) => patchHomeSection(id, { width_pct: pct })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeHomeSection(id)}
                      aria-label={`Remove ${slot.label}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="px-3 pt-3">
                    <div
                      className="mx-auto min-w-0"
                      style={{ width: `${clampSectionWidth(homeRow.width_pct)}%` }}
                    >
                    <RowCellStrip
                      row={homeRow}
                      selectedIndex={focusCell(id)}
                      height={clampRowHeight(homeRow.height_px)}
                      chipDrag={chipDrag}
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
                      onDropChip={(cellIndex) => {
                        if (chipDrag) applyChipHome(id, chipDrag, cellIndex);
                        setChipDrag(null);
                      }}
                      onDropCell={(cellIndex, source) => relocateHomeCell(source, id, cellIndex)}
                      onCellDragStart={(source) => setCellDrag(source)}
                      onCellDragEnd={() => setCellDrag(null)}
                      paintCell={(cell, cellIndex) => (
                        <CellPaint
                          cell={cell}
                          cellIndex={cellIndex}
                          row={homeRow}
                          homeContent={homeContentFor(homeIdForCell(cell, id)) ?? content}
                          cycleSteps={previewData.cycleSteps}
                          stat={previewData.stat}
                        />
                      )}
                    />
                    </div>
                  </div>
                  <RowHeightHandle
                    height={homeRow.height_px}
                    onChange={(px) => patchHomeSection(id, { height_px: px })}
                  />
                </div>
              );
            })}
            </div>
          </div>
          {HOMEPAGE_SLOT_ORDER.filter((id) => !homeOrder.includes(id)).length ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Add row</span>
              {HOMEPAGE_SLOT_ORDER.filter((id) => !homeOrder.includes(id)).map((id) => (
                <Button key={id} type="button" variant="outline" size="sm" onClick={() => addHomeSection(id)}>
                  {HOME_SECTION_LABELS[id]}
                </Button>
              ))}
            </div>
          ) : null}
          <Button
            type="button"
            className="mt-3"
            onClick={() => persist(custom, homeOrder, homeSections)}
            disabled={saving || !loaded}
          >
            {saving ? "Saving…" : "Save primary canvas"}
          </Button>
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
        {loaded ? (
        <>
        <label className="block space-y-1 text-sm">
          <span>Label</span>
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2"
            value={editCanvas.label}
            onChange={(e) => commitEdit({ ...editCanvas, label: e.target.value })}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Slug</span>
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2"
            value={editCanvas.slug}
            onChange={(e) => commitEdit({ ...editCanvas, slug: e.target.value })}
          />
          <span className="text-xs text-muted-foreground">Visitor URL: /p/{editCanvas.slug || "overview"}</span>
        </label>
        <CanvasSizeControls
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
        {canvasIsDisabled(editCanvas.width_pct, editCanvas.enabled) ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
            This canvas is off — visitors will not see /p/{editCanvas.slug || "overview"}.
          </p>
        ) : null}
        <div className="space-y-1 text-sm">
          <span className="block text-muted-foreground">Default columns for new Rows</span>
          <ColumnCycleToggle
            columns={editCanvas.columns}
            onChange={(n) => commitEdit({ ...editCanvas, columns: n })}
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm">Canvas Rows (each Row splits into Cells)</p>
          <div
            className="space-y-2 rounded-lg border-2 border-dashed border-primary/35 bg-primary/[0.03] p-2"
            style={canvasFrameStyle(editCanvas.width_pct, editCanvas.margin, editCanvas.margin_unit).pad}
          >
            <div
              className="space-y-2"
              style={canvasFrameStyle(editCanvas.width_pct, editCanvas.margin, editCanvas.margin_unit).inner}
            >
          {editCanvas.sections.map((row, index) => {
            const blank = isBlankSlotLabel(row.label);
            const isDrop = dropIndex === index && dragIndex !== null && dragIndex !== index;
            const dropClass = isDrop
              ? "bg-primary/30 ring-1 ring-primary/50"
              : dragIndex !== null
                ? "bg-muted/40"
                : "";
            return (
              <div key={`${row.id}-${index}`}>
                <div
                  onDragOver={(e) => {
                    if (dragIndex !== null || ((chipDrag || cellDrag) && !blank)) {
                      e.preventDefault();
                      if (dragIndex !== null) setDropIndex(index);
                    }
                  }}
                  onDragLeave={() => setDropIndex((cur) => (cur === index ? null : cur))}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (chipDrag && !blank) {
                      applyChip(index, chipDrag);
                      setChipDrag(null);
                    } else if (cellDrag && !blank) {
                      const empties = visibleCells(ensureRowCells(row));
                      const emptyAt = empties.findIndex((c) => c.kind === "empty");
                      const dest = emptyAt >= 0 ? emptyAt : focusCell(row.id);
                      relocateCustomCell(cellDrag, row.id, dest);
                      setCellDrag(null);
                    } else if (dragIndex !== null && dragIndex !== index) {
                      moveSection(dragIndex, index);
                    }
                    setDragIndex(null);
                    setDropIndex(null);
                  }}
                  className={`flex flex-col space-y-2 rounded-lg border-2 p-3 ${
                    chipDrag && !blank ? "border-dashed border-primary/60 bg-primary/5" : ""
                  } ${isDrop ? "border-primary ring-2 ring-primary/40" : "border-primary/30"} ${
                    blank ? "border-dashed bg-muted/20" : "bg-primary/[0.03]"
                  } ${dropClass}`}
                >
                  <div className="flex flex-wrap items-center gap-2 rounded-md bg-primary/5 px-1 py-1">
                    <span
                      draggable
                      onDragStart={(e) => {
                        setDragIndex(index);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => {
                        setDragIndex(null);
                        setDropIndex(null);
                      }}
                      className="cursor-grab select-none rounded border border-border p-1 text-muted-foreground active:cursor-grabbing"
                      title="Drag to reorder"
                      aria-label={`Reorder ${row.label || "row"}`}
                    >
                      <GripVertical className="h-3.5 w-3.5" />
                    </span>
                    <Input
                      className="min-w-0 flex-1"
                      value={row.label}
                      onChange={(e) => setSection(index, { label: e.target.value })}
                      aria-label="Row label"
                    />
                    <RowVisibilityToggle
                      on={row.enabled !== false}
                      onChange={(on) => setSection(index, { enabled: on })}
                    />
                    <ColumnCycleToggle
                      columns={row.columns ?? editCanvas.columns}
                      onChange={(n) => {
                        setSection(index, { columns: n });
                        setCellFocus((cur) => ({ ...cur, [row.id]: Math.min(cur[row.id] ?? 0, n - 1) }));
                      }}
                      title="Row columns — each column is a Cell"
                    />
                    <SectionWidthSlider
                      compact
                      value={row.width_pct}
                      onChange={(pct) => setSection(index, { width_pct: pct })}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSection(index, {
                          label: BLANK_LABEL,
                          kind: "empty",
                          featureId: undefined,
                          recordType: undefined,
                          recordId: undefined,
                          driver: undefined,
                        })
                      }
                      title="Turn this Row into a spacer (__blank__)"
                      aria-label="Add a blank spacer row"
                    >
                      + blank
                    </Button>
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
                  </div>
                  <div
                    className="mx-auto min-w-0"
                    style={{ width: `${clampSectionWidth(row.width_pct)}%` }}
                  >
                  <RowCellStrip
                    row={row}
                    selectedIndex={focusCell(row.id)}
                    height={clampRowHeight(row.height_px)}
                    chipDrag={chipDrag}
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
                    onDropChip={(cellIndex) => {
                      if (chipDrag) applyChip(index, chipDrag, cellIndex);
                      setChipDrag(null);
                    }}
                    onDropCell={(cellIndex, source) => relocateCustomCell(source, row.id, cellIndex)}
                    onCellDragStart={(source) => setCellDrag(source)}
                    onCellDragEnd={() => setCellDrag(null)}
                    paintCell={(cell, cellIndex) => (
                      <CellPaint
                        cell={cell}
                        cellIndex={cellIndex}
                        row={row}
                        homeContent={homeContentFor(homeIdForCell(cell, row.id))}
                        cycleSteps={previewData.cycleSteps}
                        stat={previewData.stat}
                      />
                    )}
                  />
                  </div>
                  {blank ? (
                    <p className="text-xs text-muted-foreground">
                      Spacer row · stays empty on the visitor page · drag to reposition · rename it to bring
                      the binding fields back.
                    </p>
                  ) : (
                    <>
                      <label className="block space-y-1 text-xs">
                        <span className="text-muted-foreground">
                          Element in Cell {focusCell(row.id) + 1}
                        </span>
                        <select
                          className={fieldClass}
                          value={selectedCell(row, focusCell(row.id)).kind}
                          onChange={(e) => {
                            const kind = e.target.value as SlotKind;
                            if (kind === "feature") {
                              const featureId = PAGE_BUILDER_FEATURES[0].id;
                              setCell(index, {
                                kind,
                                featureId,
                                recordType: undefined,
                                recordId: undefined,
                                driver: defaultDriverFor("feature", featureId),
                              });
                              return;
                            }
                            if (kind === "record") {
                              const recordType = PAGE_BUILDER_RECORD_TYPES[0].id;
                              setCell(index, {
                                kind,
                                featureId: undefined,
                                recordType,
                                driver: defaultDriverFor("record", undefined, recordType),
                              });
                              return;
                            }
                            setSection(index, clearCellBinding(row, focusCell(row.id)));
                          }}
                        >
                          <option value="empty">Empty</option>
                          <option value="feature">Feature</option>
                          <option value="record">Record type</option>
                        </select>
                      </label>
                      {selectedCell(row, focusCell(row.id)).kind === "feature" ? (
                        <label className="block space-y-1 text-xs">
                          <span className="text-muted-foreground">Feature</span>
                          <select
                            className={fieldClass}
                            value={selectedCell(row, focusCell(row.id)).featureId ?? PAGE_BUILDER_FEATURES[0].id}
                            onChange={(e) =>
                              setCell(index, {
                                featureId: e.target.value,
                                driver: defaultDriverFor("feature", e.target.value),
                              })
                            }
                          >
                            {PAGE_BUILDER_FEATURES.map((item) => (
                              <option
                                key={item.id}
                                value={item.id}
                                disabled={usedFeatureIds(editCanvas, row.id).has(item.id)}
                              >
                                {item.label}
                                {usedFeatureIds(editCanvas, row.id).has(item.id) ? " (already on page)" : ""}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}
                      {selectedCell(row, focusCell(row.id)).kind === "record" ? (
                        <>
                          <label className="block space-y-1 text-xs">
                            <span className="text-muted-foreground">Record type</span>
                            <select
                              className={fieldClass}
                              value={selectedCell(row, focusCell(row.id)).recordType ?? PAGE_BUILDER_RECORD_TYPES[0].id}
                              onChange={(e) =>
                                setCell(index, {
                                  recordType: e.target.value,
                                  driver: defaultDriverFor("record", undefined, e.target.value),
                                })
                              }
                            >
                              {PAGE_BUILDER_RECORD_TYPES.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="block space-y-1 text-xs">
                            <span className="text-muted-foreground">Records to show</span>
                            <select
                              className={fieldClass}
                              value={selectedCell(row, focusCell(row.id)).recordMode ?? "single"}
                              onChange={(e) => {
                                const mode = e.target.value as "single" | "multi" | "all";
                                const cell = selectedCell(row, focusCell(row.id));
                                setCell(index, {
                                  recordMode: mode === "single" ? undefined : mode,
                                  recordIds: mode === "multi" ? cell.recordIds ?? [] : undefined,
                                });
                              }}
                            >
                              <option value="single">Single record (by id)</option>
                              <option value="multi">Pick records</option>
                              <option value="all">All records</option>
                            </select>
                          </label>
                          {(selectedCell(row, focusCell(row.id)).recordMode ?? "single") === "single" ? (
                            <label className="block space-y-1 text-xs">
                              <span className="text-muted-foreground">Record id</span>
                              <input
                                className={fieldClass}
                                value={selectedCell(row, focusCell(row.id)).recordId ?? ""}
                                placeholder="statistics header id"
                                onChange={(e) => setCell(index, { recordId: e.target.value })}
                              />
                            </label>
                          ) : null}
                          {selectedCell(row, focusCell(row.id)).recordMode === "multi" ? (
                            <div className="space-y-1.5 rounded-md border border-border p-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs text-muted-foreground">Record browser</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => void openRecordBrowser(row.id)}
                                >
                                  {browserSectionId === row.id ? "Close" : "Browse"}
                                </Button>
                              </div>
                              {browserSectionId === row.id ? (
                                browserLoading ? (
                                  <p className="text-xs text-muted-foreground">Loading records…</p>
                                ) : (
                                  <>
                                    <input
                                      className={fieldClass}
                                      value={browserSearch}
                                      placeholder="Search by name or id…"
                                      onChange={(e) => setBrowserSearch(e.target.value)}
                                    />
                                    <div className="max-h-40 space-y-0.5 overflow-y-auto">
                                      {browserRows
                                        .filter((r) => {
                                          const q = browserSearch.trim().toLowerCase();
                                          return (
                                            !q ||
                                            r.name.toLowerCase().includes(q) ||
                                            r.id.toLowerCase().includes(q)
                                          );
                                        })
                                        .map((r) => {
                                          const picked = (selectedCell(row, focusCell(row.id)).recordIds ?? []).includes(r.id);
                                          return (
                                            <label
                                              key={r.id}
                                              className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-xs hover:bg-muted/50"
                                            >
                                              <input
                                                type="checkbox"
                                                checked={picked}
                                                onChange={() => togglePickedRecord(index, r.id)}
                                              />
                                              <span className="truncate">{r.name}</span>
                                              <span className="ml-auto shrink-0 text-muted-foreground">
                                                {r.id}
                                              </span>
                                            </label>
                                          );
                                        })}
                                      {browserRows.length === 0 ? (
                                        <p className="text-xs text-muted-foreground">No records found.</p>
                                      ) : null}
                                    </div>
                                  </>
                                )
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  {(row.recordIds ?? []).length} picked
                                </p>
                              )}
                            </div>
                          ) : null}
                          {selectedCell(row, focusCell(row.id)).recordMode === "all" ? (
                            <p className="text-xs text-muted-foreground">
                              Shows every Statistics record in this Cell.
                            </p>
                          ) : null}
                        </>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        Driver: {selectedCell(row, focusCell(row.id)).driver || "none"} ·{" "}
                        {slotBindingLabel({
                          ...row,
                          ...selectedCell(row, focusCell(row.id)),
                        })}
                      </p>
                    </>
                  )}
                  <RowHeightHandle
                    height={row.height_px}
                    onChange={(px) => setSection(index, { height_px: px })}
                  />
                </div>
              </div>
            );
          })}
          <div
            onDragOver={(e) => {
              if (dragIndex === null) return;
              e.preventDefault();
              setDropIndex(editCanvas.sections.length);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex !== null) moveSection(dragIndex, editCanvas.sections.length);
              setDragIndex(null);
              setDropIndex(null);
            }}
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
          <Button type="button" variant="outline" size="sm" onClick={() => addSection()}>
            Add row
          </Button>
        </div>
        <Button
          type="button"
          onClick={() => persist(editIndex === 0 ? editCanvas : custom, homeOrder, homeSections)}
          disabled={saving || !loaded}
        >
          {saving ? "Saving…" : "Save canvas"}
        </Button>
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
            className="space-y-3 rounded-lg border-2 border-dashed border-primary/35 bg-primary/[0.03] p-2"
            style={canvasFrameStyle(editCanvas.width_pct, editCanvas.margin, editCanvas.margin_unit).pad}
          >
            <div
              className="space-y-3"
              style={canvasFrameStyle(editCanvas.width_pct, editCanvas.margin, editCanvas.margin_unit).inner}
            >
            {custom.sections.map((row) => (
              <div key={`preview-${row.id}`} className="rounded-md border-2 border-primary/30 bg-background p-4">
                {isBlankSlotLabel(row.label) ? (
                  <div className="h-6" aria-hidden="true" />
                ) : (
                  <>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{custom.label}</p>
                    <h2 className="mt-1 text-xl font-semibold">{row.label}</h2>
                    <div className="mt-3">
                      {row.kind === "empty" ? (
                        <p className="text-sm text-muted-foreground">
                          Empty slot · /p/{custom.slug || "overview"}#{row.id}
                        </p>
                      ) : (
                        <CanvasSlotDriver
                          driver={row.driver}
                          cycleSteps={previewData.cycleSteps}
                          stat={
                            row.recordId &&
                            previewData.stat &&
                            previewData.stat.headerId === row.recordId
                              ? previewData.stat
                              : null
                          }
                        />
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
