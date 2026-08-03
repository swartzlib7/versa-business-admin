"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  Columns3,
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
};

type LayoutEditorProps = {
  objectApiName: string;
  objectLabel: string;
  layoutType: "detail" | "edit";
  fields: FieldDef[];
  initialConfig?: LayoutConfig;
  onSave?: (config: LayoutConfig) => void;
  onReset?: () => void;
};

/* ── Helpers ── */
let sectionCounter = 0;
function newSectionId(): string {
  sectionCounter += 1;
  return `sec-${Date.now()}-${sectionCounter}`;
}

function buildDefaultSections(fields: FieldDef[]): LayoutSection[] {
  const visible = fields.map((f) => ({
    api_name: f.api_name,
    label: f.label,
    visible: true,
    span: (f.data_type === "long_text" ? 2 : 1) as 1 | 2,
  }));
  return [
    {
      id: newSectionId(),
      label: "Details",
      columns: 2,
      fields: visible,
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
}: LayoutEditorProps) {
  const [sections, setSections] = useState<LayoutSection[]>(() =>
    initialConfig?.sections ?? buildDefaultSections(fields)
  );
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

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
    setSections((prev) => [
      ...prev,
      { id: newSectionId(), label: "New Section", columns: 2, fields: [] },
    ]);
    setDirty(true);
  }, []);

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
        prev.map((s) =>
          s.id === sectionId
            ? {
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
              }
            : s
        )
      );
      setDirty(true);
    },
    []
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
      setSections(buildDefaultSections(fields));
    }
    setDirty(false);
    setStatus(null);
    onReset?.();
  }, [initialConfig, fields, onReset]);

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
          <Card key={section.id} className="overflow-visible">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
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
                    <Columns3 className="h-3.5 w-3.5" />
                  ) : (
                    <Columns2 className="h-3.5 w-3.5" />
                  )}
                  {section.columns === 2 ? "2 Col" : "1 Col"}
                </Button>
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
              {section.fields.length === 0 ? (
                <p className="py-3 text-center text-xs text-muted-foreground">
                  No fields assigned. Add fields from the unassigned pool below.
                </p>
              ) : (
                <div className="space-y-1">
                  {section.fields.map((field, fIdx) => (
                    <div
                      key={field.api_name}
                      className={cn(
                        "flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs transition-colors",
                        field.visible
                          ? "border-border bg-background"
                          : "border-dashed border-border/50 bg-muted/30 opacity-60"
                      )}
                    >
                      <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
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
                            <Columns2 className="h-3 w-3" />
                          ) : (
                            <Columns3 className="h-3 w-3" />
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
              )}
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
                  className="flex items-center gap-1 rounded-md border border-border bg-muted/30 px-2 py-1 text-xs"
                >
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
                      {sections.map((s) => (
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
