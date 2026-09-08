/** Runtime adapter for the saved Layout Editor pilot. */
import { listFieldDefinitions, type CatalogDataType, type FieldDefinition } from "@/lib/fixtures/catalog";
import { dataTypeToUiKind, fieldDefinitionToUi, type UiListingField } from "@/lib/catalog/layout-to-fields";
import type { LayoutSection } from "@/components/catalog/layout-driven-form";

export type SavedLayoutField = { api_name?: unknown; label?: unknown; visible?: unknown; span?: unknown };
export type SavedLayoutSection = { id?: unknown; label?: unknown; columns?: unknown; fields?: unknown };
export type SavedLayoutConfig = { objectApiName?: unknown; layoutType?: unknown; sections?: unknown };

/**
 * Minimal field shape the runtime adapter can resolve against. Dynamic record
 * objects keep their fields server-side (GET /api/catalog/record-types/:apiName),
 * so callers may supply those fields instead of the client fixture list.
 */
export type RuntimeFieldSource = {
  api_name: string;
  label: string;
  data_type: string;
  is_system?: boolean;
  is_required?: boolean;
  value_set_api_name?: string | null;
  /** J4: header_lines placement — "header" | "list" (undefined = default). */
  zone_role?: "header" | "list" | null;
  is_secret?: boolean;
};

/** Converts a server-supplied dynamic field into a UI field (no picklist options). */
function runtimeFieldToUi(field: RuntimeFieldSource): UiListingField {
  return {
    key: field.api_name,
    label: field.label,
    kind: dataTypeToUiKind(field.data_type as CatalogDataType),
    required: field.is_required,
    isSystem: field.is_system,
    zoneRole: field.zone_role ?? null,
    secret: field.is_secret === true || field.api_name === "configuration",
  };
}

/**
 * Returns undefined when the saved layout is absent or unusable, preserving
 * catalog fallback. When fieldSource is supplied (dynamic record objects),
 * saved visible fields are resolved against it; otherwise the client fixture
 * list is used so non-dynamic (User/Project) pilots keep existing behavior.
 */
export function savedLayoutToRuntimeSections(
  config: SavedLayoutConfig | null | undefined,
  objectApiName: string,
  layoutType: "detail" | "edit",
  fieldSource?: RuntimeFieldSource[],
): LayoutSection[] | undefined {
  if (!config || config.objectApiName !== objectApiName || config.layoutType !== layoutType || !Array.isArray(config.sections)) return undefined;
  const useFullDefinitions = !(fieldSource && fieldSource.length);
  const source: RuntimeFieldSource[] =
    fieldSource && fieldSource.length ? fieldSource : listFieldDefinitions(objectApiName);
  const fieldsByApi = new Map<string, RuntimeFieldSource>(source.map((field) => [field.api_name, field]));
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
      const ui = useFullDefinitions
        ? fieldDefinitionToUi(definition as FieldDefinition)
        : runtimeFieldToUi(definition);
      fields.push({ ...ui, span: field.span === 2 ? 2 : 1 });
    }
    if (!fields.length) continue;
    sections.push({
      id: typeof section.id === "string" && section.id ? section.id : `saved-${sectionIndex}`,
      label: typeof section.label === "string" && section.label ? section.label : "General",
      columns: section.columns === 1 ? 1 : 2,
      fields,
    });
  }
  return sections.length ? sections : undefined;
}
