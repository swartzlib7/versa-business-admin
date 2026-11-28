/**
 * Number automatically (1.0.26). A header Text field with `auto_number: { prefix, digits }`
 * is the record's identity: VBA gives the next number when the record is first saved (the
 * highest number already used with that prefix, plus one, padded to `digits`: SH-0001,
 * SH-0002 …). It is read-only on screen, and the save pipeline refuses a typed or changed value
 * (NUMBER_IS_AUTOMATIC); an update that leaves it out keeps it. Clone empties it, so the copy
 * gets a new number. With Postgres the number is taken inside the record's insert transaction
 * from a locked counter (src/lib/db/record-numbers.ts), so two saves at once never share one;
 * `nextAutoNumber` serves fixture mode.
 */
export type AutoNumber = { prefix: string; digits: number };

const text = (v: unknown) => (v === null || v === undefined ? "" : String(v)).trim();

/** The setting as stored: prefix trimmed (at most 20 characters), digits 1-12 (default 4). null = off. */
export function cleanAutoNumber(raw: unknown): AutoNumber | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const prefix = text(r.prefix).slice(0, 20);
  const n = Math.round(Number(r.digits));
  const digits = Number.isFinite(n) && n >= 1 ? Math.min(n, 12) : 4;
  return { prefix, digits };
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The next value after the ones already used: prefix + (highest number + 1), padded. */
export function nextAutoNumber(rule: AutoNumber, used: Iterable<unknown>): string {
  const match = new RegExp(`^${escape(rule.prefix)}(\\d+)$`, "i");
  let max = 0;
  for (const value of used) {
    const m = match.exec(text(value));
    if (m) max = Math.max(max, Number(m[1]));
  }
  return rule.prefix + String(max + 1).padStart(rule.digits, "0");
}
