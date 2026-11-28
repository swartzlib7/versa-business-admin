/**
 * Only fields the type has are saved (1.0.24).
 *
 * Before 1.0.24 a save that sent a field the record type does not have (a typo such as
 * `trackng_number`, or a field of another type) answered 200 and stored the value where no
 * screen, listing or report shows it. Now the save is refused and the message names the
 * unknown fields, suggests the nearest real one, and lists the type's fields.
 *
 * - Known: every catalog field of the object, hidden ones included (screens write some hidden
 *   fields, such as a Driver Pairing's Record mode), plus the system keys below.
 * - A key the record already holds with the same value is left alone. Integrations write a few
 *   keys straight to storage (`status` on a received statistic, for example); a later edit sends
 *   them back unchanged and still saves.
 * - An unknown key sent empty is dropped instead of refused: it would store nothing.
 * - Lines are checked the same way, against the line's stored values by line id.
 */
import { foldRecordTypeApiName } from "@/lib/catalog/name-aliases";
import { fieldApiNamesWithHidden, listFieldDefinitions, type FieldDefinition } from "@/lib/fixtures/catalog";
import { getRecordType } from "@/lib/fixtures/record-types";

/** Keys every record may carry that are not catalog fields on every type. */
export const SYSTEM_KEYS = new Set([
  "id",
  "created_at",
  "updated_at",
  "created_by",
  "last_modified_by",
  "external_id",
  "source_deleted_at",
]);

type LineIn = { id?: string; line_group?: string; data: Record<string, string> };
type StoredLine = { id: string; data?: Record<string, unknown> | null };

export type KnownFieldsResult<L extends LineIn> =
  | { ok: true; data: Record<string, string>; lines?: L[] }
  | { ok: false; message: string; unknown: string[] };

function distance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const up = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = up;
    }
  }
  return prev[b.length];
}

/** True when every letter of `short` appears in `long`, in order (an abbreviation: line_qty). */
function abbreviates(short: string, long: string): boolean {
  if (short[0] !== long[0] || short.length < 3) return false;
  let i = 0;
  for (const ch of long) if (ch === short[i]) i++;
  return i === short.length;
}

/** The nearest field name, when it is close enough to be a typo or an abbreviation. */
function nearest(key: string, names: string[]): string | null {
  const lower = key.toLowerCase();
  let best: string | null = null;
  let bestScore = Infinity;
  for (const name of names) {
    const d = distance(lower, name.toLowerCase());
    if (d < bestScore) {
      best = name;
      bestScore = d;
    }
  }
  if (best && bestScore <= Math.max(2, Math.floor(key.length / 4))) return best;
  const shortened = names.filter((name) => abbreviates(lower, name.toLowerCase())).sort((a, b) => a.length - b.length);
  return shortened[0] ?? null;
}

function describe(keys: string[], names: string[]): string {
  return keys
    .map((key) => {
      const near = nearest(key, names);
      return near ? `"${key}" (did you mean "${near}"?)` : `"${key}"`;
    })
    .join(", ");
}

const isLineField = (f: FieldDefinition) => f.zone_role === "list";

/**
 * Check a save's header values and lines against the object's fields.
 * `baseline` / `baselineLines`: the record as stored (an update), or null (a new record).
 */
export function checkKnownFields<L extends LineIn>(args: {
  object: string;
  label: string;
  data: Record<string, string>;
  lines?: L[];
  baseline?: Record<string, unknown> | null;
  baselineLines?: StoredLine[] | null;
}): KnownFieldsResult<L> {
  const known = fieldApiNamesWithHidden(args.object);
  if (!known.size) return { ok: true, data: args.data, lines: args.lines };

  const stray = (key: string, value: string, base?: Record<string, unknown> | null) =>
    !known.has(key) &&
    !SYSTEM_KEYS.has(key) &&
    !(base && Object.prototype.hasOwnProperty.call(base, key) && String(base[key] ?? "") === value);

  const data: Record<string, string> = {};
  const headerUnknown: string[] = [];
  for (const [key, value] of Object.entries(args.data)) {
    if (!stray(key, value, args.baseline)) data[key] = value;
    else if (value.trim() !== "") headerUnknown.push(key);
  }

  const before = new Map((args.baselineLines ?? []).map((line) => [line.id, line.data ?? {}]));
  const lineUnknown = new Set<string>();
  const lines = args.lines?.map((line) => {
    const base = line.id ? before.get(line.id) : undefined;
    const kept: Record<string, string> = {};
    for (const [key, value] of Object.entries(line.data ?? {})) {
      if (!stray(key, value, base)) kept[key] = value;
      else if (value.trim() !== "") lineUnknown.add(key);
    }
    return { ...line, data: kept };
  });

  if (!headerUnknown.length && !lineUnknown.size) return { ok: true, data, lines };

  const visible = listFieldDefinitions(args.object);
  const headerNames = visible.filter((f) => !isLineField(f)).map((f) => f.api_name);
  const lineNames = visible.filter(isLineField).map((f) => f.api_name);
  const parts: string[] = [];
  if (headerUnknown.length) {
    const plural = headerUnknown.length > 1 ? "fields" : "field";
    parts.push(`${args.label} has no ${plural} ${describe(headerUnknown, headerNames.length ? headerNames : [...known])}. Its fields: ${headerNames.join(", ")}.`);
  }
  if (lineUnknown.size) {
    const keys = [...lineUnknown];
    const plural = keys.length > 1 ? "fields" : "field";
    parts.push(
      `${args.label} lines have no ${plural} ${describe(keys, lineNames.length ? lineNames : [...known])}.` +
        (lineNames.length ? ` Line fields: ${lineNames.join(", ")}.` : ""),
    );
  }
  parts.push("Nothing was saved. An admin can add a field in Records Editor.");
  return { ok: false, message: parts.join(" "), unknown: [...headerUnknown, ...lineUnknown] };
}

/**
 * A field sent at the top level of the request body instead of inside `data` is ignored by the
 * route, so it is refused with where to put it. Only names that are fields of the type count;
 * `allowed` are the body keys the route reads.
 */
export function topLevelFieldProblem(
  object: string,
  label: string,
  body: Record<string, unknown>,
  allowed: readonly string[],
): string | null {
  const known = fieldApiNamesWithHidden(object);
  const misplaced = Object.keys(body).filter((key) => !allowed.includes(key) && known.has(key));
  if (!misplaced.length) return null;
  const list = misplaced.map((key) => `"${key}"`).join(", ");
  return `${list} ${misplaced.length > 1 ? "are fields" : "is a field"} of ${label}: send ${misplaced.length > 1 ? "them" : "it"} inside "data", for example {"data": {"${misplaced[0]}": "…"}}. Nothing was saved.`;
}

/** Body keys each records route reads; any other key that is a field of the type is refused. */
export const RECORD_BODY_KEYS = {
  create: ["type_api_name", "parent_kind", "parent_api_name", "name", "status", "data", "lines", "org_id", "relations"],
  update: ["name", "status", "data", "lines", "org_id", "relations", "confirm_driver_break"],
  addLines: ["data", "line_group", "lines"],
} as const;

/** `topLevelFieldProblem` for a record type, by its API name. */
export function recordTopLevelProblem(
  typeApiName: string,
  body: Record<string, unknown>,
  allowed: readonly string[],
): string | null {
  const type = foldRecordTypeApiName(typeApiName);
  const recordType = getRecordType(type);
  return topLevelFieldProblem(recordType?.object_api_name || type, recordType?.label ?? type, body, allowed);
}

const ORGANIZATION_BODY_KEYS = ["name", "is_person", "org_type", "parent_organization_id", "data"];

/**
 * Organization create (`current` null) and update: a field beside "data", or a field
 * organizations do not have, is refused. On success `data` is the body's data to save.
 */
export function checkOrganizationBody(
  body: Record<string, unknown>,
  current: Record<string, unknown> | null | undefined,
): { ok: true; data?: Record<string, unknown> } | { ok: false; code: string; message: string } {
  const misplaced = topLevelFieldProblem("organization", "Organizations", body, ORGANIZATION_BODY_KEYS);
  if (misplaced) return { ok: false, code: "FIELD_OUTSIDE_DATA", message: misplaced };
  const raw = body.data;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: true, data: undefined };
  const text: Record<string, string> = {};
  const others: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value === null || value === undefined) others[key] = value;
    else text[key] = typeof value === "string" ? value : JSON.stringify(value);
  }
  const checked = checkKnownFields({ object: "organization", label: "Organizations", data: text, baseline: current ?? null });
  if (!checked.ok) return { ok: false, code: "UNKNOWN_FIELD", message: checked.message };
  // Keep the caller's own values (an organization's data is not all text) for the keys that pass.
  const data: Record<string, unknown> = { ...others };
  for (const key of Object.keys(checked.data)) data[key] = (raw as Record<string, unknown>)[key];
  return { ok: true, data };
}
