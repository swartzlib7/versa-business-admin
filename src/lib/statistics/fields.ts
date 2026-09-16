/**
 * Exact Statistics field contract (state_statistics_environment.md +
 * Stephen 2026-09-12 evening). Anything else on environment_stat is leftover
 * from the old flat /stats record and must stay hidden.
 */
export const STAT_HEADER_FIELD_APIS = [
  "name",
  "scale_name",
  "scale_start",
  "scale_end",
  "scale_step",
  "frequency_type",
  "frequency_start",
  "frequency_qty",
  "start_datetime",
  "series_mode",
  "created_by",
  "last_modified_by",
] as const;

export const STAT_LINE_FIELD_APIS = ["line_value", "line_slot", "line_stamp"] as const;

/** Listing / editor display. DB keeps numeric(18,6); operators see two decimals. */
export function formatStatLineValue(raw: string | number | null | undefined): string {
  if (raw == null) return "";
  const text = String(raw).trim();
  if (!text) return "";
  const n = Number(text);
  if (!Number.isFinite(n)) return text;
  return n.toFixed(2);
}

export const STAT_REMOVED_FIELD_APIS = [
  "value",
  "unit",
  "category",
  "scale",
  "series",
  "status",
] as const;

const LIVE = new Set<string>([...STAT_HEADER_FIELD_APIS, ...STAT_LINE_FIELD_APIS]);

export function isLiveStatField(apiName: string): boolean {
  return LIVE.has(apiName);
}

export const STAT_HEADER_FALLBACK_FIELDS = [
  { label: "Name", placeholder: "Locations counted" },
  { label: "Scale Name", placeholder: "Count" },
  { label: "Scale Low", placeholder: "0" },
  { label: "Scale High", placeholder: "100" },
  { label: "Scale Division", placeholder: "10" },
  { label: "Frequency type", placeholder: "day", kind: "select" as const },
  { label: "Frequency start", placeholder: "Mon" },
  { label: "Frequency quantity", placeholder: "7" },
  { label: "Start datetime", placeholder: "", kind: "datetime" as const },
  { label: "Series mode", placeholder: "Dynamic Series", kind: "select" as const },
];
