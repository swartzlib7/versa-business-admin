/**
 * Wall clock in a named time zone (1.0.21, state_statistics_environment.md "Time zones").
 *
 * A statistic's Start datetime is a wall clock ("2026-11-12T00:00") read in the
 * statistic's own zone, never in the zone of the process or the browser that happens to
 * run the code. Shared by the server and the screens; uses only the built-in Intl data.
 */

export type WallClock = {
  year: number;
  /** 0-11 */
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** 0 = Sunday */
  weekday: number;
};

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      weekday: "short",
    });
    formatters.set(timeZone, f);
  }
  return f;
}

/** True for a zone name this runtime knows (IANA, e.g. America/New_York, or UTC). */
export function isTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    formatter(value.trim());
    return true;
  } catch {
    return false;
  }
}

/** The zone of this process or browser. Only for the install's first start and its default. */
export function hostTimeZone(): string {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return isTimeZone(zone) ? zone : "UTC";
  } catch {
    return "UTC";
  }
}

/** Every zone name this runtime knows, for pickers. */
export function timeZoneNames(): string[] {
  const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
  try {
    const names = intl.supportedValuesOf?.("timeZone") ?? [];
    return names.includes("UTC") ? names : ["UTC", ...names];
  } catch {
    return ["UTC"];
  }
}

/** The wall clock an instant shows in a zone. */
export function wallClock(instant: Date, timeZone: string): WallClock {
  const parts: Record<string, string> = {};
  for (const part of formatter(timeZone).formatToParts(instant)) parts[part.type] = part.value;
  return {
    year: Number(parts.year),
    month: Number(parts.month) - 1,
    day: Number(parts.day),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: WEEKDAYS[parts.weekday] ?? 0,
  };
}

/** Zone offset (ms east of UTC) at an instant. */
function offsetAt(t: number, timeZone: string): number {
  const w = wallClock(new Date(t), timeZone);
  const whole = t - (((t % 1000) + 1000) % 1000);
  return Date.UTC(w.year, w.month, w.day, w.hour, w.minute, w.second) - whole;
}

/**
 * The instant a wall clock names in a zone. Fields may overflow (day 32, month 12):
 * they are normalised first, as with Date.UTC. A time that falls in a spring-forward gap
 * moves forward by the gap; one that occurs twice (fall back) is the first of the two.
 */
export function zonedInstant(
  timeZone: string,
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): Date {
  const asUtc = Date.UTC(year, month, day, hour, minute, second);
  const first = offsetAt(asUtc, timeZone);
  const t1 = asUtc - first;
  const second1 = offsetAt(t1, timeZone);
  if (second1 === first) return new Date(t1);
  const t2 = asUtc - second1;
  if (offsetAt(t2, timeZone) === second1) return new Date(t2);
  return new Date(t1);
}

/** Add calendar days and months in a zone, keeping the wall clock time (DST does not move it). */
export function addCalendar(instant: Date, timeZone: string, months: number, days: number): Date {
  const w = wallClock(instant, timeZone);
  const n = new Date(Date.UTC(w.year, w.month + months, w.day + days, w.hour, w.minute, w.second));
  return zonedInstant(
    timeZone,
    n.getUTCFullYear(),
    n.getUTCMonth(),
    n.getUTCDate(),
    n.getUTCHours(),
    n.getUTCMinutes(),
    n.getUTCSeconds(),
  );
}
