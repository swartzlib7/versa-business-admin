"use client";

/**
 * Records Editor (1.0.15): Formula, Calculated default and Lookup filter
 * settings of one field; Number automatically for header Text fields (1.0.26). The server checks formulas when the field is saved
 * (unknown fields, loops) and returns a plain message.
 */
import type { LookupFilter } from "@/lib/catalog/lookup-filter";
import type { AutoNumber } from "@/lib/records/auto-number";
import { FORMULA_FUNCTIONS } from "@/lib/records/formula";

type Draft = {
  formula?: string | null;
  default_formula?: string | null;
  lookup_filter?: LookupFilter | null;
  auto_number?: AutoNumber | null;
};

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export const FORMULA_HELP = `Use field API names, numbers, + - * / ( ), comparisons = <> < > <= >=, and ${FORMULA_FUNCTIONS.join(", ")}. Example: line_quantity * line_unit_cost`;

export function FieldCalcEditor({
  dataType,
  value,
  onChange,
  placement,
}: {
  dataType: string;
  value: Draft;
  onChange: (patch: Draft) => void;
  /** Lines fields are not numbered automatically. */
  placement?: "header" | "list" | null;
}) {
  const isFormula = dataType === "formula";
  const isNumber = dataType === "number" || dataType === "currency";
  const isLookup = dataType === "lookup";
  const isNumbered = dataType === "text" && placement !== "list";
  if (!isFormula && !isNumber && !isLookup && !isNumbered) return null;
  const rule = value.auto_number ?? null;
  return (
    <div className="grid gap-3 sm:col-span-2 lg:col-span-3">
      {isNumbered ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-2 pt-6 text-sm">
            <input
              type="checkbox"
              checked={!!rule}
              onChange={(e) => onChange({ auto_number: e.target.checked ? { prefix: "", digits: 4 } : null })}
            />
            <span>Number automatically</span>
          </label>
          {rule ? (
            <>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Prefix</span>
                <input
                  className={inputCls}
                  value={rule.prefix}
                  placeholder="e.g. SH-"
                  onChange={(e) => onChange({ auto_number: { ...rule, prefix: e.target.value } })}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Digits</span>
                <input
                  className={inputCls}
                  type="number"
                  min={1}
                  max={12}
                  value={rule.digits}
                  onChange={(e) => onChange({ auto_number: { ...rule, digits: Number(e.target.value) || 4 } })}
                />
              </label>
              <span className="block text-[11px] text-muted-foreground sm:col-span-3">
                A new record left empty here gets the next number: {rule.prefix}
                {"1".padStart(Math.min(Math.max(rule.digits || 4, 1), 12), "0")}, then the highest used plus one. VBA gives it when the record is first saved; nobody can type or change it.
              </span>
            </>
          ) : null}
        </div>
      ) : null}
      {isFormula ? (
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Formula</span>
          <input className={inputCls} value={value.formula ?? ""} onChange={(e) => onChange({ formula: e.target.value })} />
          <span className="block text-[11px] text-muted-foreground">{FORMULA_HELP}</span>
        </label>
      ) : null}
      {isNumber ? (
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Calculated default (optional)</span>
          <input
            className={inputCls}
            value={value.default_formula ?? ""}
            placeholder="e.g. line_quantity * line_unit_price"
            onChange={(e) => onChange({ default_formula: e.target.value })}
          />
          <span className="block text-[11px] text-muted-foreground">
            The field follows this calculation until someone types a different value. Clearing it follows again.
          </span>
        </label>
      ) : null}
      {isLookup ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Only offer records where (optional)</span>
            <input
              className={inputCls}
              value={value.lookup_filter?.field ?? ""}
              placeholder="field API name, e.g. org_type"
              onChange={(e) =>
                onChange({ lookup_filter: { ...(value.lookup_filter ?? { value: "" }), field: e.target.value } })
              }
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">equals</span>
            <input
              className={inputCls}
              value={value.lookup_filter?.value ?? ""}
              placeholder="e.g. vendor"
              disabled={!!value.lookup_filter?.from_field}
              onChange={(e) =>
                onChange({ lookup_filter: { field: value.lookup_filter?.field ?? "", value: e.target.value } })
              }
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">or equals this record&apos;s field</span>
            <input
              className={inputCls}
              value={value.lookup_filter?.from_field ?? ""}
              placeholder="e.g. customer_org_id"
              onChange={(e) =>
                onChange({
                  lookup_filter: e.target.value
                    ? { field: value.lookup_filter?.field ?? "", value: "", from_field: e.target.value }
                    : { field: value.lookup_filter?.field ?? "", value: "" },
                })
              }
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
