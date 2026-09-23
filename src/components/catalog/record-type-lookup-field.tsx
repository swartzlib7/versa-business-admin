"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type RecordTypeRow = { api_name: string; label?: string; active?: boolean };

export function RecordTypeLookupField({
  label,
  value,
  onChange,
  required,
  readOnly,
  help,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  required?: boolean;
  readOnly?: boolean;
  help?: string;
}) {
  const [types, setTypes] = useState<RecordTypeRow[]>([]);
  const base =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/catalog/record-types", { credentials: "include", signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json: { data?: RecordTypeRow[] }) =>
        setTypes((json.data ?? []).filter((row) => row.active !== false && row.api_name)),
      )
      .catch(() => setTypes([]));
    return () => controller.abort();
  }, []);

  const selected = types.find((row) => row.api_name === value);
  const display = selected?.label ?? (value || "—");

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
        <option value="">Select record type…</option>
        {types.map((row) => (
          <option key={row.api_name} value={row.api_name}>
            {row.label ?? row.api_name}
          </option>
        ))}
      </select>
    </label>
  );
}
