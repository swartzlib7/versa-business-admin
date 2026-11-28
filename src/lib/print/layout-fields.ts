/**
 * The field names a print template may use for a record type (1.0.27): header fields (with name
 * and status) and lines fields. Hidden (retired) fields are not offered.
 */
import { listAllFieldDefinitions } from "@/lib/fixtures/catalog";
import { getRecordType } from "@/lib/fixtures/record-types";
import { foldRecordTypeApiName } from "@/lib/catalog/name-aliases";
import { checkLayout } from "@/lib/print/template";

export function layoutFieldSets(typeApiName: string): { header: Set<string>; lines: Set<string> } {
  const type = foldRecordTypeApiName(typeApiName);
  const object = getRecordType(type)?.object_api_name || type;
  const header = new Set<string>(["name", "status"]);
  const lines = new Set<string>();
  for (const f of listAllFieldDefinitions()) {
    if (f.object_api_name !== object) continue;
    (f.zone_role === "list" ? lines : header).add(f.api_name);
  }
  return { header, lines };
}

/**
 * Save check for a print template (pipeline, 1.0.27): it prints a record type that exists, its
 * Use when names a field of that type, and its layout is readable and names real fields.
 * Returns a plain message, or null when the template is fine.
 */
export function printTemplateProblem(data: Record<string, string>): string | null {
  const target = foldRecordTypeApiName(String(data.target_record_type ?? "").trim());
  if (!target) return "Prints: choose the record type this template prints.";
  const type = getRecordType(target);
  if (!type || target === "print_template") return `Prints: "${target}" is not a record type that can be printed.`;
  const sets = layoutFieldSets(target);
  const when = String(data.use_when_field ?? "").trim();
  if (when && !sets.header.has(when)) return `Use when field: ${type.label} has no field "${when}".`;
  const checked = checkLayout(data.layout ?? "", sets.header, sets.lines);
  return checked.ok ? null : `Layout: ${checked.message}`;
}
