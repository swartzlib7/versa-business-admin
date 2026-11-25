/**
 * Record values are text (1.0.22). A caller may send a number, a true/false or a JSON
 * list/object (a Filter sent as `[{...}]` rather than as the text `"[{...}]"`); each is kept
 * as its JSON text, so `[{"field":"name"}]` stays readable instead of becoming
 * "[object Object]". Empty (null) values are left out. Used when a record or line is saved
 * and when it is read, header and lines alike.
 */
export function textValues(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value === null || value === undefined) continue;
    out[key] = typeof value === "string" ? value : JSON.stringify(value);
  }
  return out;
}
