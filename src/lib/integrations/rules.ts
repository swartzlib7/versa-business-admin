/**
 * Integration rules shared by sending and receiving (1.0.20, state_integrations.md).
 */

/** A statistic fed from records recomputes (and empties) its own lines: never send these (S4). */
export const STAT_SOURCE_FIELDS = [
  "source_record_type",
  "source_read_from",
  "source_record_id",
  "source_date_field",
  "source_value_field",
  "source_filter_field",
  "source_filter_value",
] as const;

/** At most this many items per push request or pull page (§3.9). */
export const MAX_ITEMS = 100;

/** A pull asks for changes since the last marker minus this overlap (§3.8). */
export const PULL_OVERLAP_MS = 5 * 60_000;

/** Retry delay after `attempts` failed sends: 1, 2, 4 … up to 60 minutes. */
export function retryDelayMs(attempts: number): number {
  return Math.min(60, 2 ** Math.max(0, attempts - 1)) * 60_000;
}

/** Partner addresses: https only; http only for localhost and 127.0.0.1 (tests). */
export function endpointProblem(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "The partner address is not a valid URL.";
  }
  if (parsed.protocol === "https:") return null;
  if (parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname)) return null;
  return "The partner address must start with https:// (http:// only for localhost).";
}

/** `integration id : source id`, the External ID a received copy carries. */
export function copyExternalId(integrationId: string, sourceId: string): string {
  return `${integrationId}:${sourceId}`;
}
