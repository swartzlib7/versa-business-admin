/** Runtime adapter for the saved Layout Editor pilot. */
import { listFieldDefinitions, type FieldDefinition } from "@/lib/fixtures/catalog";
import { fieldDefinitionToUi, type UiListingField } from "@/lib/catalog/layout-to-fields";
import type { LayoutSection } from "@/components/catalog/layout-driven-form";

export type SavedLayoutField = { api_name?: unknown; label?: unknown; visible?: unknown; span?: unknown };
export type SavedLayoutSection = { id?: unknown; label?: unknown; columns?: unknown; fields?: unknown };
export type SavedLayoutConfig = { objectApiName?: unknown; layoutType?: unknown; sections?: unknown };

/** Returns undefined when the saved layout is absent or unusable, preserving catalog fallback. */
export function savedLayoutToRuntimeSections(
  config: SavedLayoutConfig | null | undefined,
  objectApiName: string,
  layoutType: "detail" | "edit",
): LayoutSection[] | undefined {
  if (!config || config.objectApiName !== objectApiName || config.layoutType !== layoutType || !Array.isArray(config.sections)) return undefined;
  const fieldsByApi = new Map<string, FieldDefinition>(listFieldDefinitions(objectApiName).map((field) => [field.api_name, field]));
  const sections: LayoutSection[] = [];
  for (const [sectionIndex, rawSection] of config.sections.entries()) {
    if (!rawSection || typeof rawSection !== "object") continue;
    const section = rawSection as SavedLayoutSection;
    if (!Array.isArray(section.fields)) continue;
    const fields: UiListingField[] = [];
    for (const rawField of section.fields) {
      if (!rawField || typeof rawField !== "object") continue;
      const field = rawField as SavedLayoutField;
      if (field.visible !== true || typeof field.api_name !== "string") continue;
      const definition = fieldsByApi.get(field.api_name);
      if (!definition) continue;
      fields.push({ ...fieldDefinitionToUi(definition), span: field.span === 2 ? 2 : 1 });
    }
    if (!fields.length) continue;
    sections.push({
      id: typeof section.id === "string" && section.id ? section.id : `saved-${sectionIndex}`,
      label: typeof section.label === "string" && section.label ? section.label : "Details",
      columns: section.columns === 1 ? 1 : 2,
      fields,
    });
  }
  return sections.length ? sections : undefined;
}
