"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { LayoutEditor, type LayoutConfig } from "./layout-editor";

type RecordType = {
  api_name: string;
  label: string;
  object_api_name: string;
  is_system?: boolean;
  active?: boolean;
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

export function LayoutEditorWrapper() {
  const [recordTypes, setRecordTypes] = useState<RecordType[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [layoutType, setLayoutType] = useState<LayoutType>("edit");
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [initialConfig, setInitialConfig] = useState<LayoutConfig | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingLayout, setLoadingLayout] = useState(false);
  const latestRequest = useRef(0);

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
    setFields([]);
    setInitialConfig(undefined);
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

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading record types...</div>;
  }
  if (!recordTypes.length) {
    return <div className="p-4 text-sm text-muted-foreground">No record types available.</div>;
  }

  const activeTypes = recordTypes.filter((rt) => rt.active !== false);

  return (
    <div className="space-y-4 p-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[480px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2 font-medium">Label</th>
                <th className="px-3 py-2 font-medium">Kind</th>
                <th className="px-3 py-2 font-medium">API name</th>
                <th className="px-3 py-2 font-medium">Object key</th>
              </tr>
            </thead>
            <tbody>
              {activeTypes.map((rt) => {
                const key = storageKey(rt, rt.api_name);
                const selected = selectedType === rt.api_name;
                return (
                  <tr
                    key={rt.api_name}
                    className={
                      selected
                        ? "border-b border-border/70 bg-primary/10"
                        : "border-b border-border/70 transition-colors hover:bg-muted/30"
                    }
                  >
                    <td className="px-3 py-2 align-middle">
                      <button
                        type="button"
                        className="text-left font-medium hover:underline"
                        onClick={() => setSelectedType(rt.api_name)}
                      >
                        {rt.label}
                      </button>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      {rt.is_system ? (
                        <Badge className="border-0 bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px]">
                          Standard / DB Core
                        </Badge>
                      ) : (
                        <Badge className="border-0 bg-blue-500/20 text-blue-700 dark:text-blue-400 text-[10px]">
                          Custom
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 align-middle font-mono text-xs text-muted-foreground">
                      {rt.api_name}
                    </td>
                    <td className="px-3 py-2 align-middle font-mono text-xs text-muted-foreground">
                      {key}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <label className="block text-sm font-medium lg:w-48">
          Runtime layout
          <select
            value={layoutType}
            onChange={(e) => setLayoutType(e.target.value as LayoutType)}
            className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="edit">Edit</option>
            <option value="detail">Detail</option>
          </select>
          <span className="mt-1 block text-[11px] font-normal text-muted-foreground">
            Edit and Detail are separate saved configs.
          </span>
        </label>
      </div>

      {!selectedType && (
        <div className="text-sm text-muted-foreground">
          Select a record type from the table to edit its layout.
        </div>
      )}
      {selectedType && loadingLayout && (
        <div className="text-sm text-muted-foreground">Loading layout...</div>
      )}
      {selectedType && !loadingLayout && (
        <LayoutEditor
          key={`${objectKey}:${layoutType}`}
          objectApiName={objectKey}
          objectLabel={selectedRecordType?.label || selectedType}
          layoutType={layoutType}
          fields={fields}
          initialConfig={initialConfig}
        />
      )}
    </div>
  );
}
