/**
 * Required fields on every save (1.0.28, state_records_pipeline.md step 0). The forms always
 * asked for them; saves through the API did not. Now a save that leaves a Required field empty
 * is refused (REQUIRED_FIELD), on the header and on each line.
 *
 * - A new record (or a new line) must fill every Required field. One left empty that has a
 *   default value takes it first.
 * - An existing record is refused only when the save empties a Required field it had. A record
 *   saved before the field became Required, and still missing it, saves as before.
 * - Not checked: fields VBA fills (Summary, Formula, read-only, Number automatically), Yes/No
 *   fields (empty is No), name and status (checked where they are sent), and Configuration
 *   fields the chosen Selection does not use (pairingFieldRequired).
 */
import { listFieldDefinitions, type FieldDefinition } from "@/lib/fixtures/catalog";
import { pairingFieldRequired } from "@/lib/public/driver-pairings";

type Values = Record<string, unknown>;
const text = (v: unknown) => (v === null || v === undefined ? "" : String(v)).trim();
const SKIP_TYPES = new Set(["summary", "formula", "boolean"]);

function requiredFields(object: string): FieldDefinition[] {
  return listFieldDefinitions(object).filter(
    (f) =>
      f.is_required &&
      !SKIP_TYPES.has(f.data_type) &&
      !f.read_only &&
      !f.auto_number &&
      f.api_name !== "name" &&
      f.api_name !== "status",
  );
}

const applies = (object: string, f: FieldDefinition, values: Values) =>
  object !== "driver_pairing" || pairingFieldRequired(f.api_name, values as Record<string, string>);

/** Fill a new record's (or line's) empty Required fields from their default values, in place. */
export function fillRequiredDefaults(object: string, values: Record<string, string>, placement: "header" | "list"): void {
  for (const f of requiredFields(object)) {
    if ((f.zone_role === "list") !== (placement === "list")) continue;
    if (!text(values[f.api_name]) && text(f.default_value)) values[f.api_name] = text(f.default_value);
  }
}

/** The Required fields this save leaves empty, as a message; null when all are filled. */
export function requiredProblem(args: {
  object: string;
  data: Record<string, string>;
  lines?: Array<{ id?: string; data: Record<string, string> }>;
  current?: { data?: Values | null; lines?: Array<{ id: string; data?: Values | null }> } | null;
}): string | null {
  const fields = requiredFields(args.object);
  if (!fields.length) return null;
  const missing = (f: FieldDefinition, now: Values, before: Values | null | undefined) =>
    applies(args.object, f, now) && !text(now[f.api_name]) && (!before || text(before[f.api_name]) !== "");

  const header = fields
    .filter((f) => f.zone_role !== "list")
    .filter((f) => missing(f, args.data, args.current ? args.current.data ?? {} : null))
    .map((f) => f.label);
  const lineProblems: string[] = [];
  const lineFields = fields.filter((f) => f.zone_role === "list");
  if (lineFields.length && args.lines) {
    const before = new Map((args.current?.lines ?? []).map((l) => [l.id, l.data ?? {}]));
    args.lines.forEach((line, i) => {
      const old = line.id ? before.get(line.id) : undefined;
      const empty = lineFields.filter((f) => missing(f, line.data, old)).map((f) => f.label);
      if (empty.length) lineProblems.push(`line ${i + 1}: ${empty.join(", ")}`);
    });
  }
  if (!header.length && !lineProblems.length) return null;
  const parts = [
    header.length ? header.join(", ") : "",
    lineProblems.length ? lineProblems.slice(0, 5).join("; ") + (lineProblems.length > 5 ? ` (and ${lineProblems.length - 5} more lines)` : "") : "",
  ].filter(Boolean);
  return `Required and empty: ${parts.join("; ")}. Fill ${header.length + lineProblems.length === 1 ? "it" : "them"} in. Nothing was saved.`;
}
