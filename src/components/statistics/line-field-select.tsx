"use client";

/**
 * Pick a lines field of another record type (1.0.14, statistics fed from
 * records): the Date field, the Value field, or the filter field.
 * 1.0.25: "both" also offers the record's own fields (grouped), because each line
 * carries its record's fields: a shipment's lines dated by its Ship date.
 */
import { useEffect, useState } from "react";

type FieldRow = { api_name: string; label: string; data_type: string; zone_role?: string | null; active?: boolean };

const ACCEPT: Record<"date" | "number" | "any", (f: FieldRow) => boolean> = {
  date: (f) => f.data_type === "date" || f.data_type === "datetime",
  number: (f) => f.data_type === "number" || f.data_type === "currency",
  any: () => true,
};

export function LineFieldSelect({
  label,
  value,
  onChange,
  readOnly,
  recordType,
  accept,
  emptyLabel,
  help,
  placement = "list",
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  recordType?: string;
  accept: "date" | "number" | "any";
  emptyLabel: string;
  help?: string;
  /** 1.0.15: "list" = lines fields; "header" = the records' own fields; 1.0.25: "both". */
  placement?: "list" | "header" | "both";
}) {
  // Fields of the current Source record type (kept with the type they belong to).
  const [loaded, setLoaded] = useState<{ type: string; fields: FieldRow[] }>({ type: "", fields: [] });
  const loadKey = recordType ? `${recordType}:${placement}` : "";
  const fields = recordType && loaded.type === loadKey ? loaded.fields : [];
  useEffect(() => {
    if (!recordType) return;
    const controller = new AbortController();
    void fetch("/api/catalog/record-types/" + encodeURIComponent(recordType), {
      credentials: "include",
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { data?: { fields?: FieldRow[] } } | null) =>
        setLoaded({
          type: `${recordType}:${placement}`,
          fields: (json?.data?.fields ?? []).filter(
            (f) =>
              f.active !== false &&
              (placement === "both" || (placement === "list" ? f.zone_role === "list" : f.zone_role !== "list")) &&
              ACCEPT[accept](f),
          ),
        }),
      )
      .catch(() => setLoaded({ type: `${recordType}:${placement}`, fields: [] }));
    return () => controller.abort();
  }, [recordType, accept, placement]);

  const selected = fields.find((f) => f.api_name === value);
  const head = (
    <>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {help ? <span className="text-[11px] leading-snug text-muted-foreground/80">{help}</span> : null}
    </>
  );
  if (readOnly || !onChange) {
    return (
      <div className="flex flex-col gap-1.5">
        {head}
        <p className="text-sm">{selected?.label ?? (value || "—")}</p>
      </div>
    );
  }
  return (
    <label className="flex flex-col gap-1.5">
      {head}
      <select
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={!recordType}
      >
        <option value="">{recordType ? emptyLabel : "Pick a Source record type first"}</option>
        {value && !selected ? <option value={value}>{value} (not a field of this type)</option> : null}
        {placement === "both" ? (
          <>
            <optgroup label="Line fields">
              {fields.filter((f) => f.zone_role === "list").map((f) => (
                <option key={f.api_name} value={f.api_name}>
                  {f.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Record fields (same for every line)">
              {fields.filter((f) => f.zone_role !== "list").map((f) => (
                <option key={f.api_name} value={f.api_name}>
                  {f.label}
                </option>
              ))}
            </optgroup>
          </>
        ) : (
          fields.map((f) => (
            <option key={f.api_name} value={f.api_name}>
              {f.label}
            </option>
          ))
        )}
      </select>
    </label>
  );
}
