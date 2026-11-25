/**
 * Lines group of a header_lines record type, the same rule the listing uses:
 * the prefix of the first lines field names the group (trip_date -> "trips";
 * line_* -> the default group). 1.0.14, for the add-one-line API.
 */
import { listFieldDefinitions } from "@/lib/fixtures/catalog";
import { getRecordType } from "@/lib/fixtures/record-types";
import { foldRecordTypeApiName } from "@/lib/catalog/name-aliases";
import { textValues } from "@/lib/records/text-values";

export function defaultLineGroup(typeApiName: string): string | undefined {
  const folded = foldRecordTypeApiName(typeApiName);
  const object = getRecordType(folded)?.object_api_name || folded;
  const first = listFieldDefinitions(object).find((f) => f.zone_role === "list");
  if (!first) return undefined;
  const prefix = first.api_name.split("_")[0];
  return prefix === "line" ? undefined : prefix + "s";
}

/** API callers may send numbers, booleans and JSON lists; records store text (text-values.ts). */
export function lineDataStrings(raw: unknown): Record<string, string> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return textValues(raw);
}
