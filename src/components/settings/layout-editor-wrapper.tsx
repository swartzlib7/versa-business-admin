"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { KindBadge } from "@/components/ui/kind-badge";
import { theme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import {
  ColumnHeaders,
  rowClickIsToggle,
  sortByText,
  toggleSort,
  usePersistedColumnOrder,
  type TableSort,
} from "@/components/settings/records-table";
import { LayoutEditor, type LayoutConfig } from "./layout-editor";

const LAYOUT_COL_DEFAULTS = ["system", "kind", "api_name", "label", "object", "structure", "actions"] as const;
type LayoutColKey = (typeof LAYOUT_COL_DEFAULTS)[number];
const LAYOUT_COL_META: Record<LayoutColKey, { label: string; sortKey?: string }> = {
  system: { label: "System", sortKey: "system" },
  kind: { label: "Kind", sortKey: "kind" },
  api_name: { label: "API name", sortKey: "api_name" },
  label: { label: "Label", sortKey: "label" },
  object: { label: "Object", sortKey: "object" },
  structure: { label: "Structure", sortKey: "structure" },
  actions: { label: "Actions" },
};
const LAYOUT_COLS_KEY = "mc.records-editor.layout-columns";

function structureLabel(value?: string): string {
  if (value === "header_lines") return "Header and lines";
  if (value === "header") return "Header";
  if (value === "list") return "Lines";
  return value || "—";
}

type RecordType = {
  api_name: string;
  label: string;
  object_api_name: string;
  is_system?: boolean;
  active?: boolean;
  structure?: "list" | "header" | "header_lines";
  parent_kind?: string;
  parent_api_name?: string;
};

type LayoutEditorWrapperProps = {
  parentFilter?: string;
  kindFilter?: "" | "standard" | "custom";
  structureFilter?: string;
  search?: string;
  /** Record type api_name to open (from Type editor → Layout). */
  initialTypeApiName?: string;
};
type FieldDef = {
  api_name: string;
  label: string;
  data_type: string;
  is_system: boolean;
};
type LayoutType = "detail" | "edit";

/** Storage + field catalog key: prefer object_api_name (matches layout-storage / runtime). */
function storageKey(rt: RecordType | undefined, fallbackApiName: string): string {
  if (!rt) return fallbackApiName;
  return (rt.object_api_name || rt.api_name || fallbackApiName).trim();
}

export function LayoutEditorWrapper({
  parentFilter = "",
  kindFilter = "",
  structureFilter = "",
  search = "",
  initialTypeApiName = "",
}: LayoutEditorWrapperProps = {}) {
  const [recordTypes, setRecordTypes] = useState<RecordType[]>([]);
  const [selectedType, setSelectedType] = useState(initialTypeApiName);
  const [layoutType, setLayoutType] = useState<LayoutType>("edit");
  const [layoutSort, setLayoutSort] = useState<TableSort>({ key: "api_name", dir: "asc" });
  const [layoutCols, reorderLayoutCols] = usePersistedColumnOrder(LAYOUT_COLS_KEY, LAYOUT_COL_DEFAULTS);
  const [layoutDragOver, setLayoutDragOver] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [initialConfig, setInitialConfig] = useState<LayoutConfig | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingLayout, setLoadingLayout] = useState(false);
  const latestRequest = useRef(0);
  const editorAnchorRef = useRef<HTMLDivElement | null>(null);
  const loadedObjectKey = useRef("");

  const selectType = (apiName: string) => {
    setSelectedType(apiName);
  };

  useEffect(() => {
    if (!selectedType) return;
    const id = window.requestAnimationFrame(() => {
      editorAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [selectedType]);

  useEffect(() => {
    fetch("/api/catalog/record-types")
      .then((res) => res.json())
      .then((data) => {
        setRecordTypes(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const selectedRecordType = recordTypes.find((rt) => rt.api_name === selectedType);
  const objectKey = storageKey(selectedRecordType, selectedType);

  /* eslint-disable react-hooks/set-state-in-effect -- selection changes must clear prior layout synchronously before fetch completion. */
  useEffect(() => {
    const requestId = ++latestRequest.current;
    if (!selectedType || !objectKey) {
      setFields([]);
      setInitialConfig(undefined);
      setLoadingLayout(false);
      return;
    }

    const controller = new AbortController();
    if (loadedObjectKey.current !== objectKey) {
      setFields([]);
      setInitialConfig(undefined);
      loadedObjectKey.current = objectKey;
    }
    setLoadingLayout(true);

    Promise.all([
      fetch("/api/catalog/fields?object=" + encodeURIComponent(objectKey), {
        signal: controller.signal,
        credentials: "include",
      }).then((res) => res.json()),
      fetch(
        `/api/catalog/layouts?objectApiName=${encodeURIComponent(objectKey)}&layoutType=${layoutType}`,
        { signal: controller.signal, credentials: "include" },
      ).then((res) => res.json()),
    ])
      .then(([fieldData, layoutData]) => {
        if (controller.signal.aborted || requestId !== latestRequest.current) return;
        setFields(fieldData.data || []);
        const saved = layoutData.data;
        setInitialConfig(
          saved
            ? {
                object_api_name: saved.objectApiName,
                layout_type: saved.layoutType,
                sections: saved.sections,
              }
            : undefined,
        );
        setLoadingLayout(false);
      })
      .catch((err) => {
        if (controller.signal.aborted || requestId !== latestRequest.current) return;
        console.error("Failed to load layout editor:", err);
        setFields([]);
        setInitialConfig(undefined);
        setLoadingLayout(false);
      });
    return () => controller.abort();
  }, [selectedType, objectKey, layoutType]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const activeTypes = useMemo(() => {
    let rows = recordTypes.filter((rt) => rt.active !== false);
    if (parentFilter) {
      const [pk, pa] = parentFilter.split(":");
      rows = rows.filter((rt) => rt.parent_kind === pk && rt.parent_api_name === pa);
    }
    if (kindFilter === "standard") rows = rows.filter((rt) => !!rt.is_system);
    if (kindFilter === "custom") rows = rows.filter((rt) => !rt.is_system);
    if (structureFilter) rows = rows.filter((rt) => (rt.structure || "list") === structureFilter);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (rt) =>
          rt.api_name.toLowerCase().includes(q) ||
          (rt.label || "").toLowerCase().includes(q) ||
          storageKey(rt, rt.api_name).toLowerCase().includes(q),
      );
    }
    const get = (rt: RecordType) => {
      switch (layoutSort.key) {
        case "label":
          return rt.label || "";
        case "kind":
          return rt.is_system ? "standard" : "custom";
        case "system":
          return rt.is_system ? "system" : "";
        case "object":
          return storageKey(rt, rt.api_name);
        case "structure":
          return structureLabel(rt.structure);
        default:
          return rt.api_name || "";
      }
    };
    return sortByText(rows, layoutSort.dir, get);
  }, [recordTypes, layoutSort, parentFilter, kindFilter, structureFilter, search]);

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading record types...</div>;
  }
  if (!recordTypes.length) {
    return <div className="p-4 text-sm text-muted-foreground">No record types available.</div>;
  }

  return (
    <div className="space-y-4 p-4">
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[480px] border-collapse text-left text-sm">
            <thead>
              <ColumnHeaders
                cols={layoutCols}
                meta={LAYOUT_COL_META}
                sort={layoutSort}
                onSort={(k) => setLayoutSort((s) => toggleSort(s, k))}
                onReorder={reorderLayoutCols}
                dragOver={layoutDragOver}
                onDragOverKey={setLayoutDragOver}
              />
            </thead>
            <tbody>
              {activeTypes.map((rt) => {
                const key = storageKey(rt, rt.api_name);
                const selected = selectedType === rt.api_name;
                return (
                  <Fragment key={rt.api_name}>
                  <tr
                    role="button"
                    tabIndex={0}
                    aria-selected={selected}
                    aria-label={`Edit layout for ${rt.label}`}
                    onClick={(e) => {
                      if (rowClickIsToggle(e.target)) selectType(selected ? "" : rt.api_name);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        selectType(selected ? "" : rt.api_name);
                      }
                    }}
                    className={cn(
                      "cursor-pointer border-b border-border/70 outline-none transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring",
                      selected && "bg-muted/40",
                    )}
                  >
                    {layoutCols.map((col) => {
                      if (col === "system") {
                        return (
                          <td key={col} className="px-4 py-3 align-middle">
                            {rt.is_system ? <span className="text-xs font-medium text-amber-600">System</span> : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                        );
                      }
                      if (col === "kind") {
                        return (
                          <td key={col} className="px-4 py-3 align-middle">
                            <KindBadge isSystem={!!rt.is_system} />
                          </td>
                        );
                      }
                      if (col === "api_name") {
                        return <td key={col} className="px-4 py-3 align-middle font-mono text-xs text-muted-foreground">{rt.api_name}</td>;
                      }
                      if (col === "label") {
                        return <td key={col} className="px-4 py-3 align-middle font-medium">{rt.label}</td>;
                      }
                      if (col === "object") {
                        return <td key={col} className="px-4 py-3 align-middle font-mono text-xs text-muted-foreground">{key}</td>;
                      }
                      if (col === "structure") {
                        return <td key={col} className="px-4 py-3 align-middle"><Badge variant="outline" className="text-[10px]">{structureLabel(rt.structure)}</Badge></td>;
                      }
                      return (
                        <td key={col} className="px-4 py-3 text-right align-middle" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => selectType(selected ? "" : rt.api_name)}
                            className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                            style={selected ? { borderColor: theme.colors.brand, color: theme.colors.brand } : undefined}
                          >
                            {selected ? "Close" : "Edit"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                  {selected && (
                    <tr className="border-b border-border">
                      <td colSpan={layoutCols.length} className="p-0">
                        <div ref={editorAnchorRef} className="bg-muted/10 px-3 py-4">
                          {loadingLayout && !fields.length && !initialConfig ? (
                            <div className="text-sm text-muted-foreground">Loading layout...</div>
                          ) : (
                            <LayoutEditor
                              key={objectKey}
                              objectApiName={objectKey}
                              objectLabel={selectedRecordType?.label || selectedType}
                              layoutType={layoutType}
                              onLayoutTypeChange={setLayoutType}
                              switchingLayout={loadingLayout}
                              fields={fields}
                              initialConfig={initialConfig}
                              structure={selectedRecordType?.structure}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                );
              })}
              {activeTypes.length === 0 && (
                <tr>
                  <td colSpan={layoutCols.length} className="px-4 py-8 text-center text-muted-foreground">
                    No record types match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!selectedType && (
          <p className="text-sm text-muted-foreground">
            Use Edit on a row to open that type’s layout editor in place.
          </p>
        )}
    </div>
  );
}
