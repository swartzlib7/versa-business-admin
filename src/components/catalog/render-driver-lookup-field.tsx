"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type DriverRow = {
  id: string;
  name?: string;
  status?: string;
  data?: { code_key?: string; name?: string };
};

export function RenderDriverLookupField({
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
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const base =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/records?type=render_driver", {
      credentials: "include",
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json: { data?: DriverRow[] }) =>
        setDrivers(
          (json.data ?? []).filter((row) => {
            if (!row.id || row.status === "archived") return false;
            return (row.status ?? "active") === "active";
          }),
        ),
      )
      .catch(() => setDrivers([]));
    return () => controller.abort();
  }, []);

  const selected = drivers.find((row) => row.id === value);
  const labelFor = (row: DriverRow) =>
    row.name || row.data?.name || row.data?.code_key || row.id;
  const display = selected ? labelFor(selected) : value || "—";

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
        <option value="">Select rendering driver…</option>
        {drivers.map((row) => (
          <option key={row.id} value={row.id}>
            {labelFor(row)}
          </option>
        ))}
      </select>
    </label>
  );
}
