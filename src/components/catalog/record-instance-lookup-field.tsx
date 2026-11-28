"use client";

import { useEffect, useRef, useState } from "react";
import { dependsOnLabel, lookupFilterWant, lookupRowMatches, type LookupFilter } from "@/lib/catalog/lookup-filter";
import { cn } from "@/lib/utils";
import { TYPE_LEVEL_TARGET_ID } from "@/lib/public/driver-pairings";
import { elementTypeById } from "@/lib/public/element-types";

type RecordRow = { id: string; name?: string; status?: string; data?: Record<string, unknown> };

export function RecordInstanceLookupField({
  label,
  value,
  onChange,
  required,
  readOnly,
  help,
  recordType,
  allowTypeLevel,
  filter,
  values,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  required?: boolean;
  readOnly?: boolean;
  help?: string;
  recordType?: string;
  allowTypeLevel?: boolean;
  /** 1.0.15 lookup filter: only records whose field equals the value (e.g. document_kind = bill); 1.0.25: or this record's own field. */
  filter?: LookupFilter | null;
  /** 1.0.25: this record's values, for a filter that compares with one of its fields. */
  values?: Record<string, unknown> | null;
}) {
  const [rows, setRows] = useState<RecordRow[]>([]);
  // 1.0.25: a filter on this record's own field (Ship to → the Customer's Locations).
  const { want, waiting } = filter ? lookupFilterWant(filter, values) : { want: "", waiting: false };
  const lastWant = useRef<string | null>(null);
  useEffect(() => {
    // The field it depends on changed: the old pick belongs to the old value, so clear it.
    if (filter?.from_field && lastWant.current !== null && lastWant.current !== want && value) onChange?.("");
    lastWant.current = want;
  }, [want]); // eslint-disable-line react-hooks/exhaustive-deps
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
        <option value="">{!recordType ? "Pick a record type first" : waiting && filter ? `Pick ${dependsOnLabel(filter)} first` : "Select record…"}</option>
        {typeLevel ? (
          <option value={TYPE_LEVEL_TARGET_ID}>All records (type-level)</option>
        ) : null}
        {rows
          .filter(
            (row) =>
              !filter ||
              row.id === value ||
              (!waiting && lookupRowMatches(filter, row as Record<string, unknown>, want)),
          )
          .map((row) => (
          <option key={row.id} value={row.id}>
            {row.name || row.id}
          </option>
        ))}
      </select>
    </label>
  );
}
