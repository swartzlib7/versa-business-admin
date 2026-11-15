/**
 * Read-only display for date and datetime field values, in the same style as
 * Statistics stamps: `31 Dec 2025` and `31 Dec 2025 @ 19:00:00`.
 * Stored values stay ISO / datetime-local; this is display only.
 */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const pad = (n: number) => String(n).padStart(2, "0");

/** `yyyy-mm-dd` as a local calendar date (no UTC shift). */
function parseDateOnly(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** ISO or datetime-local (`2025-12-31T19:00`) as a local Date. */
export function parseDisplayDatetime(raw: string): Date | null {
  const s = raw.trim();
  if (!s) return null;
  const local = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(s);
  if (local) {
    const d = new Date(
      Number(local[1]),
      Number(local[2]) - 1,
      Number(local[3]),
      Number(local[4]),
      Number(local[5]),
      local[6] ? Number(local[6]) : 0,
    );
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const dateOnly = parseDateOnly(s);
  if (dateOnly) return dateOnly;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDisplayDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDisplayDatetime(d: Date): string {
  return `${formatDisplayDate(d)} @ ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Display text for a stored date / datetime value. Unparseable text is shown as stored. */
export function displayDateValue(raw: string, kind: "date" | "datetime"): string {
  if (!raw.trim()) return raw;
  const d = kind === "date" ? (parseDateOnly(raw.trim()) ?? parseDisplayDatetime(raw)) : parseDisplayDatetime(raw);
  if (!d) return raw;
  return kind === "date" ? formatDisplayDate(d) : formatDisplayDatetime(d);
}
