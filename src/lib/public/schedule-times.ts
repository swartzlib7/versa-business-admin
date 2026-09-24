/** Recurring schedules store a duration. Custom schedules store picked instants. */

const UNIT_LABEL: Record<string, string> = {
  minute: "minute",
  hour: "hour",
  day: "day",
  week: "week",
  month: "month",
  year: "year",
};

export function intervalIso(count: unknown, unit: unknown): string {
  const n = Math.max(1, Math.round(Number(count)) || 1);
  const u = String(unit || "day");
  if (u === "minute") return `PT${n}M`;
  if (u === "hour") return `PT${n}H`;
  if (u === "week") return `P${n}W`;
  if (u === "month") return `P${n}M`;
  if (u === "year") return `P${n}Y`;
  return `P${n}D`;
}

export function intervalPhrase(count: unknown, unit: unknown): string {
  const n = Math.max(1, Math.round(Number(count)) || 1);
  const u = UNIT_LABEL[String(unit || "day")] ?? "day";
  return `Every ${n} ${n === 1 ? u : `${u}s`}`;
}

export function parseCustomSlots(raw: unknown): string[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((row): row is string => typeof row === "string");
  } catch {
    return [];
  }
}

export function customSlotsJson(slots: string[]): string {
  return JSON.stringify(slots.map((row) => row.trim()));
}

function filledSlots(slots: string[]): string[] {
  return slots.map((row) => row.trim()).filter(Boolean);
}

/** Hide the repeating-rule box. Show count and unit, one instant, or the custom list. */
export function scheduleFieldHidden(key: string, kind: string | undefined): boolean {
  if (key === "interval_iso") return true;
  if (key === "interval_count" || key === "interval_unit") return kind === "one-time" || kind === "custom";
  if (key === "occurs_at") return kind !== "one-time";
  if (key === "custom_slots") return kind !== "custom";
  return false;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

/** Dates in one month where this schedule plans an action. `month` is 0-based. */
export function pointsInMonth(data: Record<string, unknown>, year: number, month: number): string[] {
  const kind = String(data.kind ?? "");
  const days = new Date(year, month + 1, 0).getDate();
  const keys: string[] = [];
  if (kind === "custom") {
    for (const slot of filledSlots(parseCustomSlots(data.custom_slots))) {
      const day = slot.slice(0, 10);
      if (day.startsWith(`${year}-${pad(month + 1)}`)) keys.push(day);
    }
    return keys;
  }
  if (kind === "one-time") {
    const day = String(data.occurs_at ?? "").slice(0, 10);
    if (day.startsWith(`${year}-${pad(month + 1)}`)) keys.push(day);
    return keys;
  }
  const unit = String(data.interval_unit ?? "day");
  if (unit === "month" || unit === "year") {
    keys.push(dateKey(year, month, 1));
    return keys;
  }
  const step = unit === "week" ? 7 : 1;
  for (let day = 1; day <= days; day += step) keys.push(dateKey(year, month, day));
  return keys;
}

export function scheduleDetail(data: Record<string, unknown>): string {
  const kind = String(data.kind ?? "");
  if (kind === "custom") {
    const slots = filledSlots(parseCustomSlots(data.custom_slots));
    return slots.length ? slots.join(", ") : "No times picked";
  }
  if (kind === "one-time") return String(data.occurs_at || "No time picked");
  return intervalPhrase(data.interval_count, data.interval_unit);
}
