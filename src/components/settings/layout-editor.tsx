"use client";

import { useCallback, useEffect, useMemo, useState, type DragEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { theme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import {
  GripVertical,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Columns2,
  Rows3,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  LayoutGrid,
  ArrowUpDown,
} from "lucide-react";

/* ── Types ── */
export type LayoutSection = {
  id: string;
  label: string;
  columns: 1 | 2;
  fields: LayoutField[];
  /** M2: zone for header_lines types — header | lines (undefined = single-zone pure type). */
  zone?: "header" | "lines";
};

export type LayoutField = {
  api_name: string;
  label: string;
  visible: boolean;
  span: 1 | 2; // grid span (1 = half-width in 2-col, 2 = full-width)
};

export type LayoutConfig = {
  object_api_name: string;
  layout_type: "detail" | "edit" | "list";
  sections: LayoutSection[];
};

type FieldDef = {
  api_name: string;
  label: string;
  data_type: string;
  is_system: boolean;
  /** M2: header_lines placement — header | list (null = single-zone pure type). */
  zone_role?: "header" | "list" | null;
};

type LayoutEditorProps = {
  objectApiName: string;
  objectLabel: string;
  layoutType: "detail" | "edit";
  fields: FieldDef[];
  initialConfig?: LayoutConfig;
  onSave?: (config: LayoutConfig) => void;
  onReset?: () => void;
  onLayoutTypeChange?: (layoutType: "detail" | "edit") => void;
  /** M2: record type structure — drives zone-aware layout for header_lines. */
  structure?: "list" | "header" | "header_lines";
};

/* ── Helpers ── */
let sectionCounter = 0;
function newSectionId(): string {
  sectionCounter += 1;
  return `sec-${Date.now()}-${sectionCounter}`;
}

/** Column (0|1) occupied by the field at `index` in a 2-col auto-flow grid (span=2 fields occupy a full row). */
function columnIndexOf(fields: LayoutField[], index: number, columns: 1 | 2): 0 | 1 {
  if (columns === 1) return 0;
  let col: 0 | 1 = 0;
  for (let i = 0; i < index; i++) {
    if (fields[i].span === 2) col = 0;
    else col = col === 0 ? 1 : 0;
  }
  return col;
}

/** Insertion index that places a dropped field into `targetCol` (before its first field, else end). */
function insertionIndexForColumn(fields: LayoutField[], columns: 1 | 2, targetCol: 0 | 1): number {
  if (columns === 1) return fields.length;
  for (let i = 0; i < fields.length; i++) {
    if (columnIndexOf(fields, i, columns) === targetCol) return i;
  }
  return fields.length;
}

function buildDefaultSections(fields: FieldDef[], structure?: "list" | "header" | "header_lines"): LayoutSection[] {
  const toField = (f: FieldDef): LayoutField => ({
    api_name: f.api_name,
    label: f.label,
    visible: true,
    span: (f.data_type === "long_text" ? 2 : 1) as 1 | 2,
  });
  if (structure === "header_lines") {
    const headerFields = fields
      .filter((f) => f.zone_role == null || f.zone_role === "header")
      .map(toField);
    const linesFields = fields
      .filter((f) => f.zone_role === "list")
      .map(toField);
    const sections: LayoutSection[] = [];
    if (headerFields.length) {
      sections.push({ id: newSectionId(), label: "Header", columns: 2, fields: headerFields, zone: "header" });
    }
    if (linesFields.length) {
      sections.push({ id: newSectionId(), label: "Lines", columns: 2, fields: linesFields, zone: "lines" });
    }
    if (sections.length) return sections;
  }
  return [
    {
      id: newSectionId(),
      label: "General",
      columns: 2,
      fields: fields.map(toField),
    },
  ];
}

/* ── Component ── */
export function LayoutEditor({
  objectApiName,
  objectLabel,
  layoutType,
  fields,
  initialConfig,
  onSave,
  onReset,
  onLayoutTypeChange,
  structure,
}: LayoutEditorProps) {
  const isHeaderLines = structure === "header_lines";
  const [sections, setSections] = useState<LayoutSection[]>(() =>
    initialConfig?.sections ?? buildDefaultSections(fields, structure)
  );
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [dragSectionId, setDragSectionId] = useState<string | null>(null);
  const [dropSectionId, setDropSectionId] = useState<string | null>(null);
  const [dragField, setDragField] = useState<{ sectionId: string; apiName: string } | null>(null);
  const [dropFieldTarget, setDropFieldTarget] = useState<{ sectionId: string; apiName: string } | null>(null);
  const [dragUnassigned, setDragUnassigned] = useState<string | null>(null);
  const [dropCol, setDropCol] = useState<0 | 1 | null>(null);

  // Reset when initialConfig changes
  useEffect(() => {
    if (initialConfig) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronize an externally loaded saved layout.
      setSections(initialConfig.sections);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset dirty state with the external layout.
      setDirty(false);
    }
  }, [initialConfig]);

  const allFieldApiNames = useMemo(
    () => new Set(sections.flatMap((s) => s.fields.map((f) => f.api_name))),
    [sections]
  );

  const unassignedFields = useMemo(
    () => fields.filter((f) => !allFieldApiNames.has(f.api_name)),
    [fields, allFieldApiNames]
  );

  /* ── Section operations ── */
  const addSection = useCallback(() => {
    setSections((prev) => {
      const zone = isHeaderLines
        ? (prev[prev.length - 1]?.zone ?? "header")
        : undefined;
      return [
        ...prev,
        { id: newSectionId(), label: "New Section", columns: 2, fields: [], zone },
      ];
    });
    setDirty(true);
  }, [isHeaderLines]);

  const removeSection = useCallback((sectionId: string) => {
    setSections((prev) => {
      const sec = prev.find((s) => s.id === sectionId);
      if (!sec) return prev;
      // Move fields back to unassigned (they'll be lost from layout but not deleted)
      return prev.filter((s) => s.id !== sectionId);
    });
    setDirty(true);
  }, []);

  const updateSectionLabel = useCallback((sectionId: string, label: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, label } : s))
    );
    setDirty(true);
  }, []);

  const toggleSectionColumns = useCallback((sectionId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, columns: s.columns === 1 ? 2 : 1 }
          : s
      )
    );
    setDirty(true);
  }, []);

  const moveSection = useCallback((sectionId: string, direction: "up" | "down") => {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === sectionId);
      if (idx < 0) return prev;
      const target = direction === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
    setDirty(true);
  }, []);

  /* ── Field operations ── */
  const toggleFieldVisibility = useCallback((sectionId: string, apiName: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              fields: s.fields.map((f) =>
                f.api_name === apiName ? { ...f, visible: !f.visible } : f
              ),
            }
          : s
      )
    );
    setDirty(true);
  }, []);

  const toggleFieldSpan = useCallback((sectionId: string, apiName: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              fields: s.fields.map((f) =>
                f.api_name === apiName
                  ? { ...f, span: f.span === 1 ? 2 : 1 }
                  : f
              ),
            }
          : s
      )
    );
    setDirty(true);
  }, []);

  const moveField = useCallback(
    (sectionId: string, apiName: string, direction: "up" | "down") => {
      setSections((prev) =>
        prev.map((s) => {
          if (s.id !== sectionId) return s;
          const idx = s.fields.findIndex((f) => f.api_name === apiName);
          if (idx < 0) return s;
          const target = direction === "up" ? idx - 1 : idx + 1;
          if (target < 0 || target >= s.fields.length) return s;
          const next = [...s.fields];
          [next[idx], next[target]] = [next[target], next[idx]];
          return { ...s, fields: next };
        })
      );
      setDirty(true);
    },
    []
  );

  const addFieldToSection = useCallback(
    (sectionId: string, field: FieldDef) => {
      setSections((prev) =>
        prev.map((s) => {
          if (s.id !== sectionId) return s;
          if (isHeaderLines && s.zone) {
            const fieldZone = field.zone_role === "list" ? "lines" : "header";
            if (fieldZone !== s.zone) return s;
          }
          return {
            ...s,
            fields: [
              ...s.fields,
              {
                api_name: field.api_name,
                label: field.label,
                visible: true,
                span: (field.data_type === "long_text" ? 2 : 1) as 1 | 2,
              },
            ],
          };
        })
      );
      setDirty(true);
    },
    [isHeaderLines]
  );

  const removeFieldFromSection = useCallback((sectionId: string, apiName: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, fields: s.fields.filter((f) => f.api_name !== apiName) }
          : s
      )
    );
    setDirty(true);
  }, []);

  /** Move an existing field into a target column (2-col sections only; span=2 fields stay full-width). */
  const moveFieldToColumn = useCallback(
    (sectionId: string, apiName: string, targetCol: 0 | 1) => {
      setSections((prev) =>
        prev.map((s) => {
          if (s.id !== sectionId || s.columns !== 2) return s;
          const from = s.fields.findIndex((f) => f.api_name === apiName);
          if (from < 0 || s.fields[from].span === 2) return s;
          const next = [...s.fields];
          const [item] = next.splice(from, 1);
          let insertAt = next.length;
          for (let i = from; i < next.length; i++) {
            if (columnIndexOf(next, i, 2) === targetCol) {
              insertAt = i;
              break;
            }
          }
          if (insertAt === next.length) {
            for (let i = 0; i < next.length; i++) {
              if (columnIndexOf(next, i, 2) === targetCol) {
                insertAt = i;
                break;
              }
            }
          }
          next.splice(insertAt, 0, item);
          return { ...s, fields: next };
        }),
      );
      setDirty(true);
    },
    [],
  );

  /** Add an unassigned field to a section, optionally before a specific field. */
  const addUnassignedField = useCallback(
    (sectionId: string, apiName: string, beforeApiName?: string) => {
      setSections((prev) =>
        prev.map((s) => {
          if (s.id !== sectionId) return s;
          const def = fields.find((f) => f.api_name === apiName);
          if (!def) return s;
          if (isHeaderLines && s.zone) {
            const fieldZone = def.zone_role === "list" ? "lines" : "header";
            if (fieldZone !== s.zone) return s;
          }
          const newField: LayoutField = {
            api_name: def.api_name,
            label: def.label,
            visible: true,
            span: (def.data_type === "long_text" ? 2 : 1) as 1 | 2,
          };
          const next = [...s.fields];
          const idx = beforeApiName ? next.findIndex((f) => f.api_name === beforeApiName) : -1;
          next.splice(idx >= 0 ? idx : next.length, 0, newField);
          return { ...s, fields: next };
        }),
      );
      setDirty(true);
    },
    [fields, isHeaderLines],
  );

  /** Grid container drag-over: highlight the column under the pointer. */
  const handleSectionGridDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>, sectionId: string) => {
      const isFieldDrag = !!dragField && dragField.sectionId === sectionId;
      if (!isFieldDrag && !dragUnassigned) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      setDropCol(e.clientX < rect.left + rect.width / 2 ? 0 : 1);
    },
    [dragField, dragUnassigned],
  );

  /** Grid container drop: move a section field or add an unassigned field into the target column. */
  const handleSectionGridDrop = useCallback(
    (e: DragEvent<HTMLDivElement>, sectionId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const col: 0 | 1 = e.clientX < rect.left + rect.width / 2 ? 0 : 1;
      if (dragField && dragField.sectionId === sectionId) {
        moveFieldToColumn(sectionId, dragField.apiName, col);
      } else if (dragUnassigned) {
        setSections((prev) =>
          prev.map((s) => {
            if (s.id !== sectionId) return s;
            const def = fields.find((f) => f.api_name === dragUnassigned);
            if (!def) return s;
            if (isHeaderLines && s.zone) {
              const fieldZone = def.zone_role === "list" ? "lines" : "header";
              if (fieldZone !== s.zone) return s;
            }
            const newField: LayoutField = {
              api_name: def.api_name,
              label: def.label,
              visible: true,
              span: (def.data_type === "long_text" ? 2 : 1) as 1 | 2,
            };
            const insertAt = insertionIndexForColumn(s.fields, s.columns, col);
            const next = [...s.fields];
            next.splice(insertAt, 0, newField);
            return { ...s, fields: next };
          }),
        );
        setDirty(true);
      }
      setDragField(null);
      setDragUnassigned(null);
      setDropCol(null);
    },
    [dragField, dragUnassigned, fields, moveFieldToColumn, isHeaderLines],
  );


  const reorderSections = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return;
    setSections((prev) => {
      const from = prev.findIndex((s) => s.id === fromId);
      const to = prev.findIndex((s) => s.id === toId);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setDirty(true);
  }, []);

  const reorderField = useCallback(
    (sectionId: string, fromApi: string, toApi: string) => {
      if (fromApi === toApi) return;
      setSections((prev) =>
        prev.map((s) => {
          if (s.id !== sectionId) return s;
          const from = s.fields.findIndex((f) => f.api_name === fromApi);
          const to = s.fields.findIndex((f) => f.api_name === toApi);
          if (from < 0 || to < 0) return s;
          const next = [...s.fields];
          const [item] = next.splice(from, 1);
          next.splice(to, 0, item);
          return { ...s, fields: next };
        }),
      );
      setDirty(true);
    },
    [],
  );

  /* ── Save / Reset ── */
  const handleSave = useCallback(async () => {
    const config: LayoutConfig = {
      object_api_name: objectApiName,
      layout_type: layoutType,
      sections,
    };
    setSaving(true);
    setStatus(null);
    try {
      if (onSave) {
        onSave(config);
      } else {
        const res = await fetch("/api/catalog/layouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ objectApiName: config.object_api_name, layoutType: config.layout_type, sections: config.sections }),
        });
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json?.error?.message || res.statusText);
        }
      }
      setDirty(false);
      setStatus("Layout saved successfully.");
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  }, [objectApiName, layoutType, sections, onSave]);

  const handleReset = useCallback(() => {
    if (initialConfig) {
      setSections(initialConfig.sections);
    } else {
      setSections(buildDefaultSections(fields, structure));
    }
    setDirty(false);
    setStatus(null);
    onReset?.();
  }, [initialConfig, fields, onReset, structure]);

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            Layout Editor: <span className="text-foreground">{objectLabel}</span>
          </span>
          {dirty && (
            <Badge className="border-0 bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px]">
              Unsaved
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div
            role="tablist"
            aria-label="Layout type"
            className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1"
          >
            {(["edit", "detail"] as const).map((lt) => {
              const on = layoutType === lt;
              return (
                <button
                  key={lt}
                  role="tab"
                  type="button"
                  aria-selected={on}
                  onClick={() => onLayoutTypeChange?.(lt)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    on
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
                  )}
                  style={on ? { boxShadow: `inset 0 -2px 0 ${theme.colors.brand}` } : undefined}
                >
                  {lt === "edit" ? "Edit" : "Detail"}
                </button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!dirty}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!dirty || saving}
            style={{ backgroundColor: theme.colors.brand }}
            className="text-white"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving…" : "Save Layout"}
          </Button>
        </div>
      </div>

      {status && (
        <div
          className={cn(
            "rounded-md px-3 py-2 text-xs",
            status.startsWith("Error")
              ? "bg-red-500/10 text-red-700 dark:text-red-400"
              : "bg-green-500/10 text-green-700 dark:text-green-400"
          )}
        >
          {status}
        </div>
      )}

      {/* Sections */}
      <div className="space-y-3">
        {sections.map((section, sIdx) => (
          <Card
            key={section.id}
            className={cn(
              "overflow-visible transition-shadow",
              dropSectionId === section.id && dragSectionId && dragSectionId !== section.id
                ? "ring-2 ring-primary shadow-md"
                : dropSectionId === section.id && dragField
                  ? "ring-2 ring-primary/70"
                  : "",
              dragSectionId === section.id ? "opacity-70" : "",
            )}
            onDragOver={(e) => {
              if (!dragSectionId && !dragField) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setDropSectionId(section.id);
            }}
            onDragLeave={() => {
              setDropSectionId((cur) => (cur === section.id ? null : cur));
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragSectionId) {
                reorderSections(dragSectionId, section.id);
              }
              setDragSectionId(null);
              setDropSectionId(null);
            }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", `section:${section.id}`);
                    setDragSectionId(section.id);
                    setDragField(null);
                  }}
                  onDragEnd={() => {
                    setDragSectionId(null);
                    setDropSectionId(null);
                  }}
                  className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
                  title="Drag to reorder section"
                  aria-label="Drag section"
                >
                  <GripVertical className="h-4 w-4" />
                </button>
                <div className="flex flex-col gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => moveSection(section.id, "up")}
                    disabled={sIdx === 0}
                    className="h-4 w-4 p-0"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => moveSection(section.id, "down")}
                    disabled={sIdx === sections.length - 1}
                    className="h-4 w-4 p-0"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
                <Input
                  value={section.label}
                  onChange={(e) => updateSectionLabel(section.id, e.target.value)}
                  className="h-7 max-w-[200px] text-sm font-semibold"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSectionColumns(section.id)}
                  className="h-7 gap-1 text-xs"
                >
                  {section.columns === 2 ? (
                    <Columns2 className="h-3.5 w-3.5" />
                  ) : (
                    <Rows3 className="h-3.5 w-3.5" />
                  )}
                  {section.columns === 2 ? "2 Col" : "1 Col"}
                </Button>
                {isHeaderLines && section.zone && (
                  <Badge
                    className="border-0 text-[10px]"
                    style={{
                      backgroundColor:
                        section.zone === "header"
                          ? "hsl(var(--primary) / 0.12)"
                          : "hsl(var(--secondary) / 0.15)",
                      color:
                        section.zone === "header"
                          ? "hsl(var(--primary))"
                          : "hsl(var(--secondary-foreground))",
                    }}
                  >
                    {section.zone === "header" ? "Header" : "Lines"}
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px]">
                  {section.fields.filter((f) => f.visible).length}/{section.fields.length} visible
                </Badge>
                <div className="ml-auto">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeSection(section.id)}
                    disabled={sections.length <= 1}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div
                className={cn(
                  "relative grid gap-2 rounded-md border border-dashed border-border/60 p-2 transition-colors",
                  section.columns === 2 ? "grid-cols-2" : "grid-cols-1",
                  (dragField?.sectionId === section.id || dragUnassigned) &&
                    "border-primary/60 bg-primary/5",
                )}
                onDragOver={(e) => handleSectionGridDragOver(e, section.id)}
                onDragLeave={() => setDropCol(null)}
                onDrop={(e) => handleSectionGridDrop(e, section.id)}
              >
                {section.columns === 2 && (dragField?.sectionId === section.id || dragUnassigned) && (
                  <>
                    <div
                      className={cn(
                        "pointer-events-none absolute inset-y-0 left-0 w-1/2 rounded-md transition-colors",
                        dropCol === 0 && "bg-primary/10 ring-1 ring-primary/50",
                      )}
                    />
                    <div
                      className={cn(
                        "pointer-events-none absolute inset-y-0 right-0 w-1/2 rounded-md transition-colors",
                        dropCol === 1 && "bg-primary/10 ring-1 ring-primary/50",
                      )}
                    />
                  </>
                )}
                {section.fields.length === 0 && (
                  <p className="col-span-full py-3 text-center text-xs text-muted-foreground">
                    No fields assigned. Add fields from the unassigned pool below.
                  </p>
                )}
                {section.fields.map((field, fIdx) => (
                  <div
                    key={field.api_name}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData(
                        "text/plain",
                        `field:${section.id}:${field.api_name}`,
                      );
                      setDragField({ sectionId: section.id, apiName: field.api_name });
                      setDragSectionId(null);
                    }}
                    onDragEnd={() => {
                      setDragField(null);
                      setDropFieldTarget(null);
                      setDropSectionId(null);
                    }}
                    onDragOver={(e) => {
                      const isFieldDrag = !!dragField && dragField.sectionId === section.id;
                      if (!isFieldDrag && !dragUnassigned) return;
                      e.preventDefault();
                      e.stopPropagation();
                      setDropFieldTarget({ sectionId: section.id, apiName: field.api_name });
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (dragField && dragField.sectionId === section.id) {
                        reorderField(section.id, dragField.apiName, field.api_name);
                      } else if (dragUnassigned) {
                        addUnassignedField(section.id, dragUnassigned, field.api_name);
                      }
                      setDragField(null);
                      setDragUnassigned(null);
                      setDropFieldTarget(null);
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs transition-colors",
                      field.visible
                        ? "border-border bg-background"
                        : "border-dashed border-border/50 bg-muted/30 opacity-60",
                      section.columns === 2 && field.span === 2 && "col-span-2",
                      dragField?.apiName === field.api_name &&
                        dragField.sectionId === section.id &&
                        "opacity-60",
                      dropFieldTarget?.apiName === field.api_name &&
                        dropFieldTarget.sectionId === section.id &&
                        (dragField || dragUnassigned) &&
                        (!dragField || dragField.apiName !== field.api_name) &&
                        "ring-2 ring-primary/60",
                    )}
                  >
                    <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" />
                    <span className={cn("flex-1 font-medium", !field.visible && "line-through")}>
                      {field.label}
                    </span>
                    <Badge variant="outline" className="text-[9px]">
                      {field.api_name}
                    </Badge>
                    {section.columns === 2 && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => toggleFieldSpan(section.id, field.api_name)}
                        className="h-5 w-5 p-0"
                        title={field.span === 2 ? "Full width" : "Half width"}
                      >
                        {field.span === 2 ? (
                          <Rows3 className="h-3 w-3" />
                        ) : (
                          <Columns2 className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => toggleFieldVisibility(section.id, field.api_name)}
                      className="h-5 w-5 p-0"
                      title={field.visible ? "Hide field" : "Show field"}
                    >
                      {field.visible ? (
                        <Eye className="h-3 w-3" />
                      ) : (
                        <EyeOff className="h-3 w-3" />
                      )}
                    </Button>
                    <div className="flex flex-col gap-px">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => moveField(section.id, field.api_name, "up")}
                        disabled={fIdx === 0}
                        className="h-4 w-4 p-0"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => moveField(section.id, field.api_name, "down")}
                        disabled={fIdx === section.fields.length - 1}
                        className="h-4 w-4 p-0"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeFieldFromSection(section.id, field.api_name)}
                      className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                      title="Remove from section"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Section button */}
      <Button variant="outline" size="sm" onClick={addSection} className="w-full gap-1">
        <Plus className="h-3.5 w-3.5" />
        Add Section
      </Button>

      {/* Unassigned fields pool */}
      {unassignedFields.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              Unassigned Fields
              <Badge variant="outline" className="text-[10px]">
                {unassignedFields.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-1.5">
              {unassignedFields.map((field) => (
                <div
                  key={field.api_name}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", `unassigned:${field.api_name}`);
                    setDragUnassigned(field.api_name);
                    setDragField(null);
                    setDragSectionId(null);
                  }}
                  onDragEnd={() => {
                    setDragUnassigned(null);
                    setDropFieldTarget(null);
                    setDropSectionId(null);
                  }}
                  className={cn(
                    "flex cursor-grab items-center gap-1 rounded-md border border-border bg-muted/30 px-2 py-1 text-xs active:cursor-grabbing",
                    dragUnassigned === field.api_name && "opacity-60",
                  )}
                >
                  <GripVertical className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <span className="font-medium">{field.label}</span>
                  {field.is_system && (
                    <Badge className="border-0 bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[9px]">
                      Std
                    </Badge>
                  )}
                  {sections.length > 0 && (
                    <select
                      className="ml-1 rounded border border-input bg-background px-1 py-0.5 text-[10px]"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          addFieldToSection(e.target.value, field);
                          e.target.value = "";
                        }
                      }}
                    >
                      <option value="">Add to…</option>
                      {sections
                        .filter((s) => {
                          if (!isHeaderLines || !s.zone) return true;
                          const fieldZone = field.zone_role === "list" ? "lines" : "header";
                          return fieldZone === s.zone;
                        })
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Layout Preview</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {sections.map((section) => (
              <div
                key={section.id}
                className="rounded-lg border border-border bg-card/40 p-3"
                style={{ boxShadow: `inset 3px 0 0 ${theme.colors.brand}` }}
              >
                <h4 className="mb-2 text-xs font-semibold tracking-tight">
                  {section.label}
                </h4>
                <div
                  className={cn(
                    "grid gap-2",
                    section.columns === 2 ? "grid-cols-2" : "grid-cols-1"
                  )}
                >
                  {section.columns === 2 && (
                    <>
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Column 1
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Column 2
                      </span>
                    </>
                  )}
                  {section.fields
                    .filter((f) => f.visible)
                    .map((field) => (
                      <div
                        key={field.api_name}
                        className={cn(
                          "rounded border border-dashed border-border/60 bg-muted/20 px-2 py-1.5 text-[11px]",
                          field.span === 2 && section.columns === 2 && "col-span-2"
                        )}
                      >
                        <span className="font-medium">{field.label}</span>
                        <span className="ml-1 text-muted-foreground">
                          ({field.api_name})
                        </span>
                      </div>
                    ))}
                  {section.fields.filter((f) => f.visible).length === 0 && (
                    <p className="col-span-full text-center text-[11px] text-muted-foreground">
                      No visible fields
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
