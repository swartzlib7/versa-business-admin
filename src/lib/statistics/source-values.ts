/**
 * Statistics fed from records (1.0.14). A statistic header can name a source:
 * a header_lines record type (optionally one record of it), the lines field
 * that holds the date, and the lines field to total (empty = count lines),
 * with an optional filter (only lines where a field equals a value).
 * Each line lands in the statistic step its date falls in, and the step's
 * value is the total. Steps between the first and last step with data that
 * have no lines get 0; steps outside stay empty. No disk or DB access here.
 */
import { parseStartDatetime, stepIndexForDate } from "@/lib/statistics/frequency";
import type { StatHeaderConfig } from "@/lib/statistics/model";

export type StatSource = {
  recordType: string;
  /** 1.0.15: total the lines of the records, or read the records' own (header) fields. */
  readFrom: "lines" | "records";
  recordId: string | null;
  dateField: string;
  valueField: string | null;
  filterField: string | null;
  filterValue: string | null;
};

export const STAT_SOURCE_FIELD_APIS = [
  "source_record_type",
  "source_read_from",
  "source_record_id",
  "source_date_field",
  "source_value_field",
  "source_filter_field",
  "source_filter_value",
] as const;

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** The header's source, or null when it is not fed from records. */
export function statSourceFromData(data: Record<string, unknown>): StatSource | null {
  const recordType = text(data.source_record_type);
  const dateField = text(data.source_date_field);
  if (!recordType || !dateField) return null;
  return {
    recordType,
    readFrom: text(data.source_read_from) === "records" ? "records" : "lines",
    recordId: text(data.source_record_id) || null,
    dateField,
    valueField: text(data.source_value_field) || null,
    filterField: text(data.source_filter_field) || null,
    filterValue: typeof data.source_filter_value === "string" ? data.source_filter_value : null,
  };
}

/** "2026-11-19" is that day at midnight in the statistic's zone; a wall clock is read there too. */
export function parseLineDate(raw: unknown, timeZone: string): Date | null {
  return parseStartDatetime(text(raw), timeZone);
}

function lineMatches(line: Record<string, unknown>, source: StatSource): boolean {
  if (!source.filterField) return true;
  const raw = text(line[source.filterField]);
  const want = (source.filterValue ?? "").trim();
  if (want === "true" || want === "false") {
    const on = raw === "true" || raw === "1";
    return want === "true" ? on : !on;
  }
  return raw.toLowerCase() === want.toLowerCase();
}

/** Total per step index k (k = (series - 1) * qty + slot). */
export function computeSourceSteps(
  config: Pick<StatHeaderConfig, "startDatetime" | "frequencyType" | "frequencyQty" | "seriesMode" | "timeZone">,
  source: StatSource,
  lines: Array<Record<string, unknown>>,
): Map<number, number> {
  const out = new Map<number, number>();
  const start = parseStartDatetime(config.startDatetime, config.timeZone);
  if (!start) return out;
  for (const line of lines) {
    if (!lineMatches(line, source)) continue;
    const date = parseLineDate(line[source.dateField], config.timeZone);
    if (!date) continue;
    const k = stepIndexForDate(start, config.frequencyType, date, config.timeZone);
    if (k < 0) continue;
    if (config.seriesMode === "single" && k >= config.frequencyQty) continue;
    let value = 1;
    if (source.valueField) {
      const raw = text(line[source.valueField]);
      if (raw === "") continue;
      value = Number(raw);
      if (!Number.isFinite(value)) continue;
    }
    out.set(k, (out.get(k) ?? 0) + value);
  }
  if (out.size) {
    const keys = [...out.keys()];
    const first = Math.min(...keys);
    const last = Math.max(...keys);
    for (let k = first; k <= last; k++) if (!out.has(k)) out.set(k, 0);
  }
  for (const [k, v] of out) out.set(k, Math.round(v * 1_000_000) / 1_000_000);
  return out;
}

export function stepToSeriesSlot(k: number, qty: number): { series: number; slot: number } {
  const q = qty > 0 ? qty : 1;
  return { series: Math.floor(k / q) + 1, slot: k % q };
}

/**
 * 1.0.25: each line carries its record's own fields under their names, so the Date field or the
 * filter can be a record field (a shipment's Ship date, its Status). Field names are unique within
 * a type, so a line field never meets a record field of the same name; the line's value wins for
 * the shared system keys (id, created_at, ...).
 */
export function withRecordFields(records: Array<{ name?: string; status?: string; data?: Record<string, unknown> | null; lines?: Array<{ data?: Record<string, unknown> | null }> }>): Array<Record<string, unknown>> {
  return records.flatMap((record) => {
    const header = { ...(record.data ?? {}), name: record.data?.name ?? record.name, status: record.data?.status ?? record.status };
    return (record.lines ?? []).map((line) => ({ ...header, ...(line.data ?? {}) }));
  });
}
