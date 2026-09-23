"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { codeKeyFromDriverRecord } from "@/lib/public/driver-pairings";
import { defaultOutputId, driverEntry, outputsForDriver, type DriverCatalogEntry } from "@/lib/public/render-drivers";
import { RECORD_OUTPUTS_BY_TYPE, elementTypeById } from "@/lib/public/element-types";

export function useDriverCatalog(driverRecordId?: string): DriverCatalogEntry | undefined {
  const [entry, setEntry] = useState<DriverCatalogEntry | undefined>();
  useEffect(() => {
    if (!driverRecordId) {
      setEntry(undefined);
      return;
    }
    const controller = new AbortController();
    void fetch(`/api/records/${encodeURIComponent(driverRecordId)}`, {
      credentials: "include",
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : {}))
      .then((json: { data?: { data?: Record<string, unknown> } }) => {
        setEntry(driverEntry(codeKeyFromDriverRecord(json.data)));
      })
      .catch(() => setEntry(undefined));
    return () => controller.abort();
  }, [driverRecordId]);
  return entry;
}

/** Copy the Driver's record type onto the Element so the Record lookup stays scoped. */
export function useStampPairingRecordType(
  driverId: string | undefined,
  currentType: string | undefined,
  onStamp: (type: string, previous: string | undefined) => void,
) {
  const entry = useDriverCatalog(driverId);
  const onStampRef = useRef(onStamp);
  onStampRef.current = onStamp;
  const recordType = entry?.recordType?.trim() ?? "";
  useEffect(() => {
    if (!driverId || !recordType || recordType === currentType) return;
    onStampRef.current(recordType, currentType);
  }, [driverId, recordType, currentType]);
}

export function PairingInputMapField({
  label,
  value,
  onChange,
  readOnly,
  help,
  driverRecordId,
  targetType,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  help?: string;
  driverRecordId?: string;
  targetType?: string;
}) {
  const entry = useDriverCatalog(driverRecordId);
  const spec = elementTypeById(targetType);
  const outputs = spec ? RECORD_OUTPUTS_BY_TYPE[spec.id] ?? [] : [];
  const parsed = parseMap(value);
  const base =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  if (!entry?.inputs.length) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {help ? (
          <span className="text-[11px] leading-snug text-muted-foreground/80">{help}</span>
        ) : null}
        <p className="text-sm text-muted-foreground">This driver has no mapped inputs.</p>
      </div>
    );
  }

  const setKey = (name: string, next: string) => {
    const map = { ...parsed, [name]: next };
    onChange?.(JSON.stringify(map));
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {help ? (
        <span className="text-[11px] leading-snug text-muted-foreground/80">{help}</span>
      ) : null}
      {entry.inputs.map((input) => (
        <label key={input.name} className="block text-sm">
          <span className="mb-1 block text-[11px] text-muted-foreground">
            {input.name} ← record output
          </span>
          {readOnly ? (
            <p className="text-sm">{parsed[input.name] || "—"}</p>
          ) : (
            <select
              className={cn(base)}
              value={parsed[input.name] ?? ""}
              onChange={(e) => setKey(input.name, e.target.value)}
            >
              <option value="">(none)</option>
              {outputs.map((out) => (
                <option key={out.id} value={out.id}>
                  {out.label}
                </option>
              ))}
            </select>
          )}
        </label>
      ))}
    </div>
  );
}

const FILTER_OPS = [
  { id: "eq", label: "equals" },
  { id: "ne", label: "does not equal" },
  { id: "contains", label: "contains" },
] as const;

type FilterRow = { field: string; op: string; value: string };

function parseFilters(raw: string): FilterRow[] {
  try {
    const parsed = JSON.parse(raw || "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((row) => {
      if (!row || typeof row !== "object") return [];
      const rec = row as Record<string, unknown>;
      const field = String(rec.field ?? "").trim();
      if (!field) return [];
      const op = FILTER_OPS.some((item) => item.id === rec.op) ? String(rec.op) : "eq";
      return [{ field, op, value: String(rec.value ?? "") }];
    });
  } catch {
    return [];
  }
}

/** Visual AND filter. Stored as `{ field, op, value }[]`. */
export function PairingFilterField({
  label,
  value,
  onChange,
  readOnly,
  help,
  targetType,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  help?: string;
  targetType?: string;
}) {
  const spec = elementTypeById(targetType);
  const outputs = spec ? RECORD_OUTPUTS_BY_TYPE[spec.id] ?? [] : [];
  const rows = parseFilters(value);
  const base =
    "w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const write = (next: FilterRow[]) => onChange?.(JSON.stringify(next));

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {help ? <span className="text-[11px] leading-snug text-muted-foreground/80">{help}</span> : null}
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No conditions. Every record of this type is included.</p>
      ) : (
        rows.map((row, index) => (
          <div key={`${row.field}-${index}`} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
            <select
              className={base}
              value={row.field}
              disabled={readOnly}
              aria-label="Filter field"
              onChange={(e) => {
                const next = rows.slice();
                next[index] = { ...row, field: e.target.value };
                write(next);
              }}
            >
              {outputs.map((out) => (
                <option key={out.id} value={out.id}>
                  {out.label}
                </option>
              ))}
              {!outputs.some((out) => out.id === row.field) ? (
                <option value={row.field}>{row.field}</option>
              ) : null}
            </select>
            <select
              className={base}
              value={row.op}
              disabled={readOnly}
              aria-label="Filter comparison"
              onChange={(e) => {
                const next = rows.slice();
                next[index] = { ...row, op: e.target.value };
                write(next);
              }}
            >
              {FILTER_OPS.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.label}
                </option>
              ))}
            </select>
            <input
              className={base}
              value={row.value}
              readOnly={readOnly}
              aria-label="Filter value"
              onChange={(e) => {
                const next = rows.slice();
                next[index] = { ...row, value: e.target.value };
                write(next);
              }}
            />
            {readOnly ? null : (
              <button
                type="button"
                className="rounded-md border border-border px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => write(rows.filter((_, i) => i !== index))}
              >
                Remove
              </button>
            )}
          </div>
        ))
      )}
      {readOnly ? null : (
        <button
          type="button"
          className="self-start rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={() =>
            write([...rows, { field: outputs[0]?.id ?? "name", op: "eq", value: "" }])
          }
        >
          Add condition
        </button>
      )}
    </div>
  );
}

/** Radio whose choices are the driver’s render outputs. Statistics grids stay on the Cell. */
export function RenderOptionField({
  label,
  value,
  onChange,
  readOnly,
  help,
  driverRecordId,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  help?: string;
  driverRecordId?: string;
}) {
  const entry = useDriverCatalog(driverRecordId);
  const outputs = outputsForDriver(entry?.id).filter((row) => !row.id.startsWith("grid-"));
  const selected = outputs.some((row) => row.id === value) ? value : defaultOutputId(entry?.id);
  if (outputs.length < 2) return null;
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-xs font-medium text-muted-foreground">{label}</legend>
      {help ? <span className="text-[11px] leading-snug text-muted-foreground/80">{help}</span> : null}
      {outputs.map((out) => (
        <label key={out.id} className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name={`render-option-${driverRecordId ?? "driver"}`}
            value={out.id}
            checked={selected === out.id}
            disabled={readOnly}
            onChange={() => onChange?.(out.id)}
          />
          {out.label}
        </label>
      ))}
    </fieldset>
  );
}

export const SELECTION_FOLLOWUPS = ["target_record_id", "filter_json"] as const;

export function isSelectionFollowup(key: string): boolean {
  return (SELECTION_FOLLOWUPS as readonly string[]).includes(key);
}

export function pairingFieldVisible(
  key: string,
  entry: DriverCatalogEntry | undefined,
  values?: Record<string, string>,
): boolean {
  const mode = values?.selection_mode || "one";
  // Record type is owned by the Driver. The Element stamps it; staff do not pick it again.
  if (key === "target_record_type") return false;
  if (key === "input_map_json" || key === "page" || key === "page_size") return false;
  if (key === "render_option") return false;
  if (key === "selection_mode") return Boolean(entry?.elementModes?.length);
  if (key === "target_record_id") return mode === "one";
  if (key === "filter_json") return mode === "filter" && Boolean(entry?.elementModes?.includes("filter") || entry?.supportsFilter);
  if (key === "page_size" || key === "page") return Boolean(entry?.supportsPagination);
  return true;
}

/** Required-field check for the Element form. Hidden fields are stamped, not typed. */
export function pairingFieldRequired(
  key: string,
  values?: Record<string, string>,
): boolean {
  if (key === "target_record_type" || key === "target_kind" || key === "record_mode") return false;
  const mode = values?.selection_mode || "one";
  if (key === "target_record_id") return mode === "one";
  if (key === "filter_json") return mode === "filter";
  if (key === "page_size" || key === "page") return false;
  return true;
}

function parseMap(raw: string): Record<string, string> {
  try {
    const parsed = JSON.parse(raw || "{}") as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [key, String(value ?? "")]),
    );
  } catch {
    return {};
  }
}
