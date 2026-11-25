/**
 * Frequency slot labels + scale axis marks for the Statistics graph.
 * Scale runs up the LEFT side; frequency runs along the BOTTOM (left->right).
 * Part of the shared statistics model (S-4) - used by the graph component and
 * the capture validation (window labels).
 */
import type { StatHeaderConfig, FrequencyType } from './model';
import { addCalendar, wallClock, zonedInstant } from './time-zone';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function monthIndex(token: string): number {
  const t = token.toLowerCase();
  const full = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const idx = full.findIndex((m) => m.startsWith(t));
  if (idx >= 0) return idx;
  return MONTHS.findIndex((m) => m.toLowerCase() === t);
}

function dayIndex(token: string): number {
  const t = token.toLowerCase();
  const full = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const idx = full.findIndex((d) => d.startsWith(t));
  if (idx >= 0) return idx;
  return DAYS.findIndex((d) => d.toLowerCase() === t);
}

/**
 * Parse the frequency start value per type. Returns the 0-based start offset
 * within the type's natural cycle plus a canonical label, or an error.
 *   sec/min: integer 0-59; hour: integer 0-23; day: weekday name (Mon);
 *   week: 'W/E <day> <Month>'; month: '<Month> <year>'; year: 4-digit year;
 *   decade: decade year (2020); date: '<day> <Month> <year>';
 *   datetime: '<day> <Month> <year> @ <HH:mm[:ss]>'.
 */
export function parseFrequencyStart(
  type: FrequencyType,
  start: string,
): { ok: true; offset: number; label: string } | { ok: false; error: string } {
  const s = start.trim();
  if (!s) return { ok: false, error: 'Frequency start is required.' };

  switch (type) {
    case 'sec':
    case 'min': {
      const n = Number(s);
      if (!Number.isInteger(n) || n < 0 || n > 59) {
        return { ok: false, error: 'Frequency start for ' + type + ' must be an integer 0-59.' };
      }
      return { ok: true, offset: n, label: pad(n) };
    }
    case 'hour': {
      const n = Number(s);
      if (!Number.isInteger(n) || n < 0 || n > 23) {
        return { ok: false, error: 'Frequency start for hour must be an integer 0-23.' };
      }
      return { ok: true, offset: n, label: pad(n) };
    }
    case 'day': {
      const d = dayIndex(s);
      if (d < 0) return { ok: false, error: 'Frequency start for day must be a weekday name (e.g. Mon).' };
      return { ok: true, offset: d, label: DAYS[d] };
    }
    case 'week': {
      const m = /^W\/E\s+(\d{1,2})\s+([A-Za-z]+)$/i.exec(s);
      if (!m) return { ok: false, error: 'Frequency start for week must look like: W/E 8 June.' };
      const day = Number(m[1]);
      const mi = monthIndex(m[2]);
      if (!Number.isInteger(day) || day < 1 || day > 31) return { ok: false, error: 'Week start day must be 1-31.' };
      if (mi < 0) return { ok: false, error: 'Week start month must be a month name (e.g. June).' };
      return { ok: true, offset: 0, label: 'W/E ' + day + ' ' + MONTHS[mi] };
    }
    case 'month': {
      const m = /^([A-Za-z]+)\s+(\d{4})$/.exec(s);
      if (!m) return { ok: false, error: 'Frequency start for month must look like: June 2026.' };
      const mi = monthIndex(m[1]);
      if (mi < 0) return { ok: false, error: 'Month must be a month name (e.g. June).' };
      return { ok: true, offset: mi, label: MONTHS[mi] + ' ' + m[2] };
    }
    case 'year': {
      const n = Number(s);
      if (!Number.isInteger(n) || n < 1000 || n > 9999) {
        return { ok: false, error: 'Frequency start for year must be a 4-digit year.' };
      }
      return { ok: true, offset: 0, label: String(n) };
    }
    case 'decade': {
      const n = Number(s);
      if (!Number.isInteger(n) || n < 1000 || n > 9999 || n % 10 !== 0) {
        return { ok: false, error: 'Frequency start for decade must be a decade year (e.g. 2020).' };
      }
      return { ok: true, offset: 0, label: n + 's' };
    }
    case 'date': {
      const m = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/.exec(s);
      if (!m) return { ok: false, error: 'Frequency start for date must look like: 8 June 2026.' };
      const day = Number(m[1]);
      const mi = monthIndex(m[2]);
      if (day < 1 || day > 31) return { ok: false, error: 'Date day must be 1-31.' };
      if (mi < 0) return { ok: false, error: 'Date month must be a month name (e.g. June).' };
      return { ok: true, offset: 0, label: day + ' ' + MONTHS[mi] + ' ' + m[3] };
    }
    case 'datetime': {
      const m = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\s+@\s*(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s);
      if (!m) return { ok: false, error: 'Frequency start for datetime must look like: 8 June 2026 @ 13:00:00.' };
      const day = Number(m[1]);
      const mi = monthIndex(m[2]);
      const hh = Number(m[4]);
      const mm = Number(m[5]);
      const ss = m[6] ? Number(m[6]) : 0;
      if (day < 1 || day > 31) return { ok: false, error: 'Datetime day must be 1-31.' };
      if (mi < 0) return { ok: false, error: 'Datetime month must be a month name (e.g. June).' };
      if (hh > 23 || mm > 59 || ss > 59) return { ok: false, error: 'Datetime time must be a valid 24h time.' };
      return { ok: true, offset: 0, label: day + ' ' + MONTHS[mi] + ' ' + m[3] + ' @ ' + pad(hh) + ':' + pad(mm) + ':' + pad(ss) };
    }
  }
}

/**
 * Slot labels for a series window: the frequency axis running left->right
 * along the bottom of the graph. Slot 0 = the start value; each next slot
 * advances one step of the frequency type.
 */
export function frequencySlotLabels(config: StatHeaderConfig, count: number): string[] {
  const start = parseFrequencyStart(config.frequencyType, config.frequencyStart);
  const startLabel = start.ok ? start.label : config.frequencyStart;
  const labels: string[] = [startLabel];
  const n = Math.max(0, count - 1);

  switch (config.frequencyType) {
    case 'sec':
    case 'min': {
      const base = start.ok ? start.offset : 0;
      for (let i = 1; i <= n; i++) labels.push(pad((base + i) % 60));
      break;
    }
    case 'hour': {
      const base = start.ok ? start.offset : 0;
      for (let i = 1; i <= n; i++) labels.push(pad((base + i) % 24));
      break;
    }
    case 'day': {
      const base = start.ok ? start.offset : 1;
      for (let i = 1; i <= n; i++) labels.push(DAYS[(base + i) % 7]);
      break;
    }
    case 'week': {
      // Week windows advance by the anchor date; label slots W+1..W+n relative
      // to the anchor (calendar math on a free-text anchor is out of scope).
      for (let i = 1; i <= n; i++) labels.push('W+' + i);
      break;
    }
    case 'month': {
      const base = start.ok ? start.offset : 0;
      const yearMatch = /(\d{4})$/.exec(config.frequencyStart);
      let year = yearMatch ? Number(yearMatch[1]) : new Date().getFullYear();
      let month = base;
      for (let i = 1; i <= n; i++) {
        month += 1;
        if (month > 11) { month = 0; year += 1; }
        labels.push(MONTHS[month] + ' ' + year);
      }
      break;
    }
    case 'year': {
      const yearMatch = /(\d{4})/.exec(config.frequencyStart);
      const base = yearMatch ? Number(yearMatch[1]) : new Date().getFullYear();
      for (let i = 1; i <= n; i++) labels.push(String(base + i));
      break;
    }
    case 'decade': {
      const yearMatch = /(\d{4})/.exec(config.frequencyStart);
      const base = yearMatch ? Number(yearMatch[1]) : 2020;
      for (let i = 1; i <= n; i++) labels.push((base + i * 10) + 's');
      break;
    }
    case 'date': {
      const m = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/.exec(config.frequencyStart);
      if (m) {
        // Calendar arithmetic on UTC fields: a label is a wall clock, not an instant.
        const d = new Date(Date.UTC(Number(m[3]), monthIndex(m[2]), Number(m[1])));
        for (let i = 1; i <= n; i++) {
          d.setUTCDate(d.getUTCDate() + 1);
          labels.push(d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear());
        }
      } else {
        for (let i = 1; i <= n; i++) labels.push('D+' + i);
      }
      break;
    }
    case 'datetime': {
      const m = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\s+@\s*(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(config.frequencyStart);
      if (m) {
        const d = new Date(Date.UTC(Number(m[3]), monthIndex(m[2]), Number(m[1]), Number(m[4]), Number(m[5]), m[6] ? Number(m[6]) : 0));
        for (let i = 1; i <= n; i++) {
          d.setUTCDate(d.getUTCDate() + 1);
          labels.push(d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear() + ' @ ' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()));
        }
      } else {
        for (let i = 1; i <= n; i++) labels.push('D+' + i);
      }
      break;
    }
  }
  return labels;
}

/**
 * Scale axis marks: start, start+step, ... up to end (scale value = step).
 * Example: scale 10, start 0, end 100 -> 0, 10, 20 ... 100.
 */
/**
 * Frequency start is derived from Start datetime + Frequency type.
 * Returns the stored string parseFrequencyStart accepts, or null if it cannot.
 */
export function deriveFrequencyStart(
  type: string | undefined,
  startDatetime: unknown,
  timeZone: string,
): string | null {
  if (!type) return null;
  const at = parseStartDatetime(startDatetime, timeZone);
  if (!at) return null;
  const d = wallClock(at, timeZone);
  switch (type) {
    case "sec":
      return String(d.second);
    case "min":
      return String(d.minute);
    case "hour":
      return String(d.hour);
    case "day":
      return DAYS[d.weekday];
    case "week":
      return "W/E " + d.day + " " + MONTHS[d.month];
    case "month":
      return MONTHS[d.month] + " " + d.year;
    case "year":
      return String(d.year);
    case "decade":
      return String(Math.floor(d.year / 10) * 10);
    case "date":
      return d.day + " " + MONTHS[d.month] + " " + d.year;
    case "datetime":
      return formatStamp(at, timeZone);
    default:
      return null;
  }
}

/**
 * Fills frequency_start from the form's values. A Start datetime typed on the form is a
 * wall clock, so its zone only matters for an ISO time with an offset; the form's
 * time_zone is used, else UTC (`fallbackZone` on the server: the install zone).
 */
export function applyDerivedFrequencyStart<T extends Record<string, string>>(values: T, fallbackZone = "UTC"): T {
  if (!("frequency_type" in values) && !("start_datetime" in values)) return values;
  const zone = String(values.time_zone ?? "").trim() || fallbackZone;
  let derived: string | null = null;
  try {
    derived = deriveFrequencyStart(values.frequency_type, values.start_datetime, zone);
  } catch {
    derived = deriveFrequencyStart(values.frequency_type, values.start_datetime, fallbackZone);
  }
  return { ...values, frequency_start: derived ?? "" };
}

/**
 * Parse header Start Datetime. A wall clock ("2026-11-12T00:00", "2026-11-12") is read in
 * `timeZone`, the statistic's zone (1.0.21); an ISO time with Z or an offset is that instant.
 */
export function parseStartDatetime(raw: unknown, timeZone: string): Date | null {
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw;
  if (typeof raw !== "string" || !raw.trim()) return null;
  const s = raw.trim();
  const local = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?$/.exec(s);
  if (local) {
    const d = zonedInstant(
      timeZone,
      Number(local[1]),
      Number(local[2]) - 1,
      Number(local[3]),
      local[4] ? Number(local[4]) : 0,
      local[5] ? Number(local[5]) : 0,
      local[6] ? Number(local[6]) : 0,
    );
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** The form value (datetime-local) of an instant, in the statistic's zone. */
export function toDatetimeLocalValue(d: Date, timeZone: string): string {
  const w = wallClock(d, timeZone);
  return w.year + "-" + pad(w.month + 1) + "-" + pad(w.day) + "T" + pad(w.hour) + ":" + pad(w.minute);
}

/** "12 Nov 2026 @ 00:00:00" in the statistic's zone. */
export function formatStamp(d: Date, timeZone: string): string {
  const w = wallClock(d, timeZone);
  return w.day + " " + MONTHS[w.month] + " " + w.year + " @ " + pad(w.hour) + ":" + pad(w.minute) + ":" + pad(w.second);
}

/**
 * Advance frequency steps. Seconds, minutes and hours are fixed lengths of time; days,
 * weeks, months, years and decades are calendar steps in the statistic's zone, so a
 * daily statistic keeps one slot per calendar day across a DST change.
 */
export function advanceFrequency(d: Date, type: FrequencyType, steps: number, timeZone: string): Date {
  if (steps === 0) return new Date(d.getTime());
  switch (type) {
    case "sec":
      return new Date(d.getTime() + steps * 1000);
    case "min":
      return new Date(d.getTime() + steps * 60_000);
    case "hour":
      return new Date(d.getTime() + steps * 3_600_000);
    case "day":
    case "date":
    case "datetime":
      return addCalendar(d, timeZone, 0, steps);
    case "week":
      return addCalendar(d, timeZone, 0, steps * 7);
    case "month":
      return addCalendar(d, timeZone, steps, 0);
    case "year":
      return addCalendar(d, timeZone, steps * 12, 0);
    case "decade":
      return addCalendar(d, timeZone, steps * 120, 0);
  }
  return new Date(d.getTime());
}

/**
 * Which step (counted from the header start, across periods) a date falls in:
 * the largest k with start + k steps <= date. -1 when the date is before the
 * start. 1.0.14, for statistics fed from records.
 */
export function stepIndexForDate(start: Date, type: FrequencyType, date: Date, timeZone: string): number {
  if (date.getTime() < start.getTime()) return -1;
  let hi = 1;
  while (advanceFrequency(start, type, hi, timeZone).getTime() <= date.getTime() && hi < 1_000_000) hi *= 2;
  let lo = 0;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (advanceFrequency(start, type, mid, timeZone).getTime() <= date.getTime()) lo = mid;
    else hi = mid;
  }
  return lo;
}

/** Header window shifted so this period graph starts on its own first slot. */
export function configForSeries(config: StatHeaderConfig, series: number): StatHeaderConfig {
  const s = Number.isInteger(series) && series > 0 ? series : 1;
  if (s <= 1) return config;
  const start = parseStartDatetime(config.startDatetime, config.timeZone);
  if (!start) return config;
  const shifted = stampForSlot(start, config.frequencyType, s, 0, config.frequencyQty, config.timeZone);
  const frequencyStart = deriveFrequencyStart(config.frequencyType, shifted, config.timeZone) ?? config.frequencyStart;
  return { ...config, startDatetime: toDatetimeLocalValue(shifted, config.timeZone), frequencyStart };
}

/** Absolute stamp for series/slot: start + ((series-1)*qty + slot) steps. */
export function stampForSlot(
  start: Date,
  type: FrequencyType,
  series: number,
  slot: number,
  qty: number,
  timeZone: string,
): Date {
  const s = Number.isInteger(series) && series > 0 ? series : 1;
  const i = Number.isInteger(slot) && slot >= 0 ? slot : 0;
  const q = qty > 0 ? qty : 1;
  return advanceFrequency(start, type, (s - 1) * q + i, timeZone);
}

/** Series numbers that have at least one plotted point — one graph per period. */
export function graphSeriesFromLines(
  lines: Array<{ series?: number; value?: string | number | null }>,
): number[] {
  const set = new Set<number>();
  for (const ln of lines) {
    if (ln.value == null || ln.value === "") continue;
    if (!Number.isFinite(Number(ln.value))) continue;
    const series = Number(ln.series ?? 1) || 1;
    set.add(series);
  }
  return [...set].sort((a, b) => a - b);
}

/** e.g. `7 - Day - 2026-09-10T00:00` under the frequency tick labels. */
export function frequencyWindowCaption(config: StatHeaderConfig): string {
  const start = parseStartDatetime(config.startDatetime, config.timeZone);
  const stamp = start ? formatStamp(start, config.timeZone) : config.startDatetime.trim();
  const typeLabels: Record<string, string> = {
    sec: "Second",
    min: "Minute",
    hour: "Hour",
    day: "Day",
    week: "Week",
    month: "Month",
    year: "Year",
    decade: "Decade",
    date: "Date",
    datetime: "Datetime",
  };
  const type = typeLabels[config.frequencyType] ?? config.frequencyType;
  return `${config.frequencyQty} - ${type} - ${stamp}`;
}

export function scaleAxisMarks(config: StatHeaderConfig): number[] {
  const marks: number[] = [];
  const step = config.scaleStep > 0 ? config.scaleStep : 1;
  for (let v = config.scaleStart; v <= config.scaleEnd + 1e-9; v += step) {
    marks.push(Math.round(v * 1e6) / 1e6);
    if (marks.length > 200) break; // guard against absurd ranges
  }
  return marks;
}
