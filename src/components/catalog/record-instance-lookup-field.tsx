"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { TYPE_LEVEL_TARGET_ID } from "@/lib/public/driver-pairings";
import { elementTypeById } from "@/lib/public/element-types";

type RecordRow = { id: string; name?: string; status?: string };

export function RecordInstanceLookupField({
  label,
  value,
  onChange,
  required,
  readOnly,
  help,
  recordType,
  allowTypeLevel,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  required?: boolean;
  readOnly?: boolean;
  help?: string;
  recordType?: string;
  allowTypeLevel?: boolean;
}) {
  const [rows, setRows] = useState<RecordRow[]>([]);
  const spec = elementTypeById(recordType);
  const typeLevel = allowTypeLevel || spec?.allowsTypeLevel || value === TYPE_LEVEL_TARGET_ID;
  const base =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  useEffect(() => {
    if (!recordType || recordType === "*") {
      setRows([]);
      return;
    }
    const controller = new AbortController();
    const parent = spec
      ? `&parent_kind=${encodeURIComponent(spec.parentKind)}&parent=${encodeURIComponent(spec.parentApiName)}`
      : "";
    void fetch(`/api/records?type=${encodeURIComponent(recordType)}${parent}`, {
      credentials: "include",
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json: { data?: RecordRow[] }) =>
        setRows((json.data ?? []).filter((row) => row.id && row.status !== "archived")),
      )
      .catch(() => setRows([]));
    return () => controller.abort();
  }, [recordType, spec]);

  const selected = rows.find((row) => row.id === value);
  const display =
    value === TYPE_LEVEL_TARGET_ID
      ? "All records (type-level)"
      : selected?.name || value || "—";

  if (readOnly) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
          {required ? " *" : ""}
        </span>
        {help ? (
          <span className="text-[11px] leading-snug text-muted-foreground/80">{help}</span>
        ) : null}
        <p className="text-sm">{display}</p>
      </div>
    );
  }

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      {help ? (
        <span className="text-[11px] leading-snug text-muted-foreground/80">{help}</span>
      ) : null}
      <select className={cn(base)} value={value} onChange={(e) => onChange?.(e.target.value)}>
        <option value="">{recordType ? "Select record…" : "Pick a record type first"}</option>
        {typeLevel ? (
          <option value={TYPE_LEVEL_TARGET_ID}>All records (type-level)</option>
        ) : null}
        {rows.map((row) => (
          <option key={row.id} value={row.id}>
            {row.name || row.id}
          </option>
        ))}
      </select>
    </label>
  );
}
