/**
 * Calculated fields on one row (1.0.15, state_records_pipeline.md): Formula
 * fields and calculated defaults. No disk or DB access, so the forms use it
 * for a live preview and the save pipeline uses it before storing.
 *
 * - Formula field: always the result of its formula; read-only.
 * - Calculated default (`default_formula` on a typed field): the field follows
 *   the calculation while it is empty or still holds the value the
 *   calculation gave last time. Once someone types a different value, that
 *   value stays. Clearing the field makes it follow again.
 *
 * Both kinds run together in dependency order, so a formula can use a
 * defaulted field and the other way round (unit price -> line total -> line
 * cost -> variance).
 */
import { compileFormula, evaluateFormula, orderFormulas, readRow } from "@/lib/records/formula";

export type CalcFieldLike = {
  api_name: string;
  data_type: string;
  zone_role?: "header" | "list" | null;
  formula?: string | null;
  default_formula?: string | null;
  active?: boolean;
};

const fmt = (n: number) => String(Math.round(n * 1_000_000) / 1_000_000);

/** Fields that belong on this row: lines fields for a line, everything else for the header. */
export function fieldsForPlacement<T extends CalcFieldLike>(fields: T[], placement: "header" | "list"): T[] {
  return fields.filter((f) => f.active !== false && (placement === "list" ? f.zone_role === "list" : f.zone_role !== "list"));
}

export function hasCalculatedFields(fields: CalcFieldLike[]): boolean {
  return fields.some((f) => f.active !== false && ((f.data_type === "formula" && f.formula) || f.default_formula));
}

/**
 * Apply Formula fields and calculated defaults to one row.
 * `previous` is the row as it was stored before this edit (null for a new
 * record or line); it decides whether a defaulted field is still following.
 */
export function applyRowCalculations(
  fields: CalcFieldLike[],
  row: Record<string, string>,
  previous?: Record<string, string> | null,
): Record<string, string> {
  type Calc = { api_name: string; formula: string; kind: "formula" | "default" };
  const calcs: Calc[] = [];
  for (const f of fields) {
    if (f.active === false) continue;
    if (f.data_type === "formula" && f.formula) calcs.push({ api_name: f.api_name, formula: f.formula, kind: "formula" });
    else if (f.default_formula) calcs.push({ api_name: f.api_name, formula: f.default_formula, kind: "default" });
  }
  if (!calcs.length) return row;
  const ordered = orderFormulas(calcs);
  if (!ordered.ok) return row;
  const byName = new Map(calcs.map((c) => [c.api_name, c]));
  const out: Record<string, string> = { ...row };
  for (const name of ordered.order) {
    const calc = byName.get(name)!;
    const compiled = compileFormula(calc.formula);
    if (!compiled.ok) continue;
    const read = readRow(out);
    const value = evaluateFormula(compiled.ast, read);
    const text = value === null || !Number.isFinite(value) ? "" : fmt(value);
    if (calc.kind === "formula") {
      out[name] = text;
      continue;
    }
    // Calculated default: nothing to calculate from yet -> leave the field alone.
    if (!compiled.refs.some((r) => read(r) !== null)) continue;
    const stored = String(row[name] ?? "").trim();
    let following = stored === "";
    if (!following && previous) {
      const before = evaluateFormula(compiled.ast, readRow(previous));
      const storedBefore = String(previous[name] ?? "").trim();
      following = before !== null && storedBefore === stored && Number(stored) === Number(fmt(before));
    }
    if (following) out[name] = text;
  }
  return out;
}

/**
 * Live preview in a form: the previous draft decides whether a calculated
 * default is still following. The server repeats this on save.
 */
export function previewCalculations(
  fields: CalcFieldLike[],
  placement: "header" | "list",
  next: Record<string, string>,
  prev: Record<string, string> | null,
): Record<string, string> {
  const own = fieldsForPlacement(fields, placement);
  return hasCalculatedFields(own) ? applyRowCalculations(own, next, prev) : next;
}
