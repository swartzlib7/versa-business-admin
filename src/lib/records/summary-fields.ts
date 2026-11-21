/**
 * Summary fields (1.0.14): a read-only header field that totals a field of
 * the record's lines. Works on any header_lines record type.
 *
 *   aggregate     sum | count | min | max | avg
 *   source_field  the lines field to total (not needed for count)
 *   filter_field  optional: only lines where this field ...
 *   filter_value  ... equals this value ("true" for a ticked checkbox)
 *   percent_of    optional: show the result as a percentage of another
 *                 summary field on the same record (business miles as a
 *                 share of total miles)
 *
 * The server works the values out on every write (records API create /
 * update / add line) and stores them in the header, so the API, listings and
 * Statistics read the same numbers. No disk or DB access here.
 */

export type SummaryAggregate = "sum" | "count" | "min" | "max" | "avg";

export type SummaryConfig = {
  aggregate: SummaryAggregate;
  source_field?: string | null;
  filter_field?: string | null;
  filter_value?: string | null;
  percent_of?: string | null;
};

export const SUMMARY_AGGREGATES: Array<{ value: SummaryAggregate; label: string }> = [
  { value: "sum", label: "Sum" },
  { value: "count", label: "Count of lines" },
  { value: "min", label: "Smallest" },
  { value: "max", label: "Largest" },
  { value: "avg", label: "Average" },
];

export function normalizeSummaryConfig(raw: unknown): SummaryConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const aggregate = String(r.aggregate ?? "");
  if (!SUMMARY_AGGREGATES.some((a) => a.value === aggregate)) return null;
  const text = (v: unknown) => {
    const s = typeof v === "string" ? v.trim() : "";
    return s ? s : null;
  };
  return {
    aggregate: aggregate as SummaryAggregate,
    source_field: text(r.source_field),
    filter_field: text(r.filter_field),
    filter_value: typeof r.filter_value === "string" ? r.filter_value : null,
    percent_of: text(r.percent_of),
  };
}

/** Problem with a config for a record type's fields, or null when it is usable. */
export function summaryConfigProblem(
  config: SummaryConfig | null,
  lineFields: Array<{ api_name: string; data_type: string }>,
  summaryFields: string[],
): string | null {
  if (!config) return "Choose how to total the lines (Sum, Count, Smallest, Largest or Average).";
  const byApi = new Map(lineFields.map((f) => [f.api_name, f]));
  if (config.aggregate !== "count") {
    const source = config.source_field ? byApi.get(config.source_field) : undefined;
    if (!source) return "Choose the lines field to total.";
    if (source.data_type !== "number" && source.data_type !== "currency") {
      return "The lines field to total must be a Number field.";
    }
  }
  if (config.filter_field && !byApi.has(config.filter_field)) return "The filter field is not a lines field of this type.";
  if (config.percent_of && !summaryFields.includes(config.percent_of)) {
    return "“As a percentage of” must be another Summary field of this type.";
  }
  return null;
}

const fmt = (n: number) => String(Math.round(n * 100) / 100);

function matches(line: Record<string, unknown>, config: SummaryConfig): boolean {
  if (!config.filter_field) return true;
  const raw = String(line[config.filter_field] ?? "").trim();
  const want = String(config.filter_value ?? "").trim();
  if (want === "true" || want === "false") {
    const on = raw === "true" || raw === "1";
    return want === "true" ? on : !on;
  }
  return raw.toLowerCase() === want.toLowerCase();
}

function aggregate(config: SummaryConfig, lines: Array<Record<string, unknown>>): number | null {
  const picked = lines.filter((line) => matches(line, config));
  if (config.aggregate === "count") return picked.length;
  const nums = picked
    .map((line) => String(line[config.source_field ?? ""] ?? "").trim())
    .filter((v) => v !== "")
    .map(Number)
    .filter((n) => Number.isFinite(n));
  if (config.aggregate === "sum") return nums.reduce((a, b) => a + b, 0);
  if (!nums.length) return null;
  if (config.aggregate === "min") return Math.min(...nums);
  if (config.aggregate === "max") return Math.max(...nums);
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * Values for every summary field, as strings for the header data. A field
 * with nothing to total (no lines for min / max / average, or a percentage
 * of zero) is "".
 */
export function computeSummaryValues(
  fields: Array<{ api_name: string; data_type: string; summary?: SummaryConfig | null; active?: boolean }>,
  lines: Array<Record<string, unknown>>,
): Record<string, string> {
  const summaries = fields.filter((f) => f.data_type === "summary" && f.active !== false && f.summary);
  const raw = new Map<string, number | null>();
  for (const f of summaries) raw.set(f.api_name, aggregate(f.summary as SummaryConfig, lines));
  const out: Record<string, string> = {};
  for (const f of summaries) {
    const value = raw.get(f.api_name) ?? null;
    const of = f.summary?.percent_of;
    if (of) {
      const base = raw.get(of) ?? null;
      out[f.api_name] = value === null || !base ? "" : fmt((value / base) * 100);
    } else {
      out[f.api_name] = value === null ? "" : fmt(value);
    }
  }
  return out;
}
