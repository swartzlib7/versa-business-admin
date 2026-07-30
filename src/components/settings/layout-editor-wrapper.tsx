"use client";

import { useEffect, useState } from "react";
import { LayoutEditor } from "./layout-editor";

type RecordType = {
  api_name: string;
  label: string;
  object_api_name: string;
};

type FieldDef = {
  api_name: string;
  label: string;
  data_type: string;
  is_system: boolean;
};

export function LayoutEditorWrapper() {
  const [recordTypes, setRecordTypes] = useState<RecordType[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/catalog/record-types")
      .then((res) => res.json())
      .then((data) => {
        setRecordTypes(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch record types:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedType) {
      setFields([]);
      return;
    }

    const controller = new AbortController();
    fetch("/api/catalog/fields?object=" + selectedType, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        setFields(data.data || []);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch fields:", err);
        }
      });

    return () => controller.abort();
  }, [selectedType]);

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading record types...</div>;
  }

  if (recordTypes.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">No record types available.</div>;
  }

  const selectedRecordType = recordTypes.find((rt) => rt.api_name === selectedType);

  return (
    <div className="space-y-4 p-4">
      <div>
        <label htmlFor="record-type-select" className="mb-2 block text-sm font-medium">
          Select Record Type
        </label>
        <select
          id="record-type-select"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Choose a record type...</option>
          {recordTypes.map((rt) => (
            <option key={rt.api_name} value={rt.api_name}>
              {rt.label} ({rt.api_name})
            </option>
          ))}
        </select>
      </div>

      {selectedType && (
        <LayoutEditor
          objectApiName={selectedType}
          objectLabel={selectedRecordType?.label || selectedType}
          fields={fields}
        />
      )}
    </div>
  );
}
