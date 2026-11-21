"use client";

/**
 * Records Editor: settings of a Summary field (1.0.14). The lists are the
 * lines fields of the record type the field belongs to.
 */
import { SUMMARY_AGGREGATES, type SummaryConfig } from "@/lib/records/summary-fields";

type FieldOption = { api_name: string; label: string; data_type: string; zone_role?: "header" | "list" | null };

const selectCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export function summaryFieldOptions(typeFields: FieldOption[], selfApiName?: string) {
  const lines = typeFields.filter((f) => f.zone_role === "list");
  return {
    numbers: lines.filter((f) => f.data_type === "number" || f.data_type === "currency"),
    lines,
    summaries: typeFields.filter((f) => f.data_type === "summary" && f.api_name !== selfApiName),
  };
}

export function SummaryConfigEditor({
  value,
  onChange,
  typeFields,
  selfApiName,
}: {
  value: SummaryConfig;
  onChange: (next: SummaryConfig) => void;
  typeFields: FieldOption[];
  selfApiName?: string;
}) {
  const { numbers, lines, summaries } = summaryFieldOptions(typeFields, selfApiName);
  const filterField = lines.find((f) => f.api_name === value.filter_field);
  const set = (patch: Partial<SummaryConfig>) => onChange({ ...value, ...patch });
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Total</span>
        <select
          className={selectCls}
          value={value.aggregate}
          onChange={(e) => set({ aggregate: e.target.value as SummaryConfig["aggregate"] })}
        >
          {SUMMARY_AGGREGATES.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </label>
      {value.aggregate !== "count" ? (
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Lines field</span>
          <select
            className={selectCls}
            value={value.source_field ?? ""}
            onChange={(e) => set({ source_field: e.target.value || null })}
          >
            <option value="">{numbers.length ? "Select…" : "No Number fields on the lines yet"}</option>
            {numbers.map((f) => (
              <option key={f.api_name} value={f.api_name}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Only lines where (optional)</span>
        <select
          className={selectCls}
          value={value.filter_field ?? ""}
          onChange={(e) =>
            set({
              filter_field: e.target.value || null,
              filter_value: lines.find((f) => f.api_name === e.target.value)?.data_type === "boolean" ? "true" : "",
            })
          }
        >
          <option value="">All lines</option>
          {lines.map((f) => (
            <option key={f.api_name} value={f.api_name}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
      {filterField ? (
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">equals</span>
          {filterField.data_type === "boolean" ? (
            <select
              className={selectCls}
              value={value.filter_value === "false" ? "false" : "true"}
              onChange={(e) => set({ filter_value: e.target.value })}
            >
              <option value="true">Ticked</option>
              <option value="false">Not ticked</option>
            </select>
          ) : (
            <input
              className={selectCls}
              value={value.filter_value ?? ""}
              onChange={(e) => set({ filter_value: e.target.value })}
              placeholder="Value to match"
            />
          )}
        </label>
      ) : null}
      <label className="space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">As a percentage of (optional)</span>
        <select
          className={selectCls}
          value={value.percent_of ?? ""}
          onChange={(e) => set({ percent_of: e.target.value || null })}
        >
          <option value="">— (show the total)</option>
          {summaries.map((f) => (
            <option key={f.api_name} value={f.api_name}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
