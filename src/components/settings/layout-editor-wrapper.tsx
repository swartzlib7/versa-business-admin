"use client";

import { useEffect, useState } from "react";
import { LayoutEditor, type LayoutConfig } from "./layout-editor";

type RecordType = { api_name: string; label: string; object_api_name: string };
type FieldDef = { api_name: string; label: string; data_type: string; is_system: boolean };
type LayoutType = "detail" | "edit";

export function LayoutEditorWrapper() {
  const [recordTypes, setRecordTypes] = useState<RecordType[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [layoutType, setLayoutType] = useState<LayoutType>("edit");
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [initialConfig, setInitialConfig] = useState<LayoutConfig | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/catalog/record-types").then((res) => res.json()).then((data) => {
      setRecordTypes(data.data || []); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedType) return;
    const controller = new AbortController();
    Promise.all([
      fetch("/api/catalog/fields?object=" + selectedType, { signal: controller.signal }).then((res) => res.json()),
      fetch(`/api/catalog/layouts?objectApiName=${encodeURIComponent(selectedType)}&layoutType=${layoutType}`, { signal: controller.signal }).then((res) => res.json()),
    ]).then(([fieldData, layoutData]) => {
      setFields(fieldData.data || []);
      const saved = layoutData.data;
      setInitialConfig(saved ? { object_api_name: saved.objectApiName, layout_type: saved.layoutType, sections: saved.sections } : undefined);
    }).catch((err) => { if (err.name !== "AbortError") console.error("Failed to load layout editor:", err); });
    return () => controller.abort();
  }, [selectedType, layoutType]);

  if (loading) return <div className="p-4 text-sm text-muted-foreground">Loading record types...</div>;
  if (!recordTypes.length) return <div className="p-4 text-sm text-muted-foreground">No record types available.</div>;
  const selectedRecordType = recordTypes.find((rt) => rt.api_name === selectedType);
  return <div className="space-y-4 p-4">
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block text-sm font-medium">Select Record Type
        <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="">Choose a record type...</option>{recordTypes.map((rt) => <option key={rt.api_name} value={rt.api_name}>{rt.label} ({rt.api_name})</option>)}
        </select>
      </label>
      <label className="block text-sm font-medium">Runtime layout
        <select value={layoutType} onChange={(e) => setLayoutType(e.target.value as LayoutType)} className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="edit">Edit</option><option value="detail">Detail</option>
        </select>
      </label>
    </div>
    {selectedType && <LayoutEditor objectApiName={selectedType} objectLabel={selectedRecordType?.label || selectedType} layoutType={layoutType} fields={fields} initialConfig={initialConfig} />}
  </div>;
}
