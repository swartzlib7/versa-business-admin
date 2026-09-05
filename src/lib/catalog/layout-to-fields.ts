/**
 * ERD-C helpers: turn catalog field_definition + layout_definition into UI field lists.
 */
import {
  getDefaultLayout,
  getValueSetByApiName,
  listFieldDefinitions,
  listValueSetItems,
  type CatalogDataType,
  type FieldDefinition,
  type LayoutDefinition,
} from "@/lib/fixtures/catalog";

export type UiFieldKind =
  | "text"
  | "textarea"
  | "select"
  | "boolean"
  | "number"
  | "date"
  | "datetime"
  | "email"
  | "url"
  | "phone";

export type UiListingField = {
  key: string;
  label: string;
  kind?: UiFieldKind;
  options?: string[];
  optionLabels?: string[];
  column?: boolean;
  required?: boolean;
  dataType?: CatalogDataType;
  isSystem?: boolean;
  /** Runtime saved-layout preference; defaults to one grid column. */
  span?: 1 | 2;
  /** J4: header_lines placement — "header" | "list" (undefined = default). */
  zoneRole?: "header" | "list" | null;
};

export function dataTypeToUiKind(dt: CatalogDataType): UiFieldKind {
  switch (dt) {
    case "long_text":
      return "textarea";
    case "picklist":
    case "multipicklist":
      return "select";
    case "boolean":
      return "boolean";
    case "number":
      return "number";
    case "date":
      return "date";
    case "datetime":
      return "datetime";
    case "email":
      return "email";
    case "url":
      return "url";
    case "phone":
      return "phone";
    case "file":
      return "url";
    default:
      return "text";
  }
}

export type OptionsFieldSource = {
  data_type: string;
  api_name?: string;
  object_api_name?: string;
  value_set_api_name?: string | null;
};

export function optionsForField(fd: OptionsFieldSource): {
  options?: string[];
  optionLabels?: string[];
} {
  if (fd.data_type === "boolean") {
    return { options: ["true", "false"], optionLabels: ["Yes", "No"] };
  }
  if (fd.api_name === "type" && fd.object_api_name === "user") {
    return { options: ["human", "agent"], optionLabels: ["Human", "Agent"] };
  }
  if (fd.value_set_api_name) {
    const vs = getValueSetByApiName(fd.value_set_api_name);
    if (!vs) return {};
    const items = listValueSetItems(vs.id);
    return {
      options: items.map((i) => i.api_value),
      optionLabels: items.map((i) => i.label),
    };
  }
  return {};
}

export function fieldDefinitionToUi(fd: FieldDefinition): UiListingField {
  const { options, optionLabels } = optionsForField(fd);
  return {
    key: fd.api_name,
    label: fd.label,
    kind: dataTypeToUiKind(fd.data_type),
    options,
    optionLabels,
    required: fd.is_required,
    dataType: fd.data_type,
    isSystem: fd.is_system,
    zoneRole: fd.zone_role ?? null,
  };
}

export function listingFieldsFromCatalog(objectApiName: string): UiListingField[] {
  const layout = getDefaultLayout(objectApiName, "list");
  const all = listFieldDefinitions(objectApiName);
  const byApi = new Map(all.map((f) => [f.api_name, f]));

  if (!layout) {
    return all.map((fd) => ({
      ...fieldDefinitionToUi(fd),
      column: fd.data_type !== "long_text",
    }));
  }

  const orderedKeys = layout.body.sections.flatMap((s) => s.fields);
  const listKeys = new Set(orderedKeys);
  const result: UiListingField[] = [];

  for (const key of orderedKeys) {
    const fd = byApi.get(key);
    if (!fd) continue;
    result.push({ ...fieldDefinitionToUi(fd), column: true });
  }

  for (const fd of all) {
    if (listKeys.has(fd.api_name)) continue;
    result.push({
      ...fieldDefinitionToUi(fd),
      column: false,
    });
  }

  return result;
}

export function editFieldsFromCatalog(objectApiName: string): {
  layout: LayoutDefinition | undefined;
  fields: UiListingField[];
  sections: Array<{
    id: string;
    label: string;
    columns: 1 | 2;
    fields: UiListingField[];
  }>;
} {
  const layout = getDefaultLayout(objectApiName, "edit");
  const all = listFieldDefinitions(objectApiName);
  const byApi = new Map(all.map((f) => [f.api_name, f]));

  if (!layout) {
    const fields = all.map(fieldDefinitionToUi);
    return {
      layout: undefined,
      fields,
      sections: [{ id: "all", label: "Fields", columns: 2, fields }],
    };
  }

  const sections = layout.body.sections.map((sec) => ({
    id: sec.id,
    label: sec.label,
    columns: sec.columns,
    fields: sec.fields
      .map((k) => byApi.get(k))
      .filter((fd): fd is FieldDefinition => Boolean(fd))
      .map(fieldDefinitionToUi),
  }));

  const fields = sections.flatMap((s) => s.fields);
  return { layout, fields, sections };
}

export function detailSectionsFromCatalog(objectApiName: string) {
  const layout = getDefaultLayout(objectApiName, "detail");
  const all = listFieldDefinitions(objectApiName);
  const byApi = new Map(all.map((f) => [f.api_name, f]));
  if (!layout) {
    return {
      layout: undefined,
      sections: [
        {
          id: "all",
          label: "Details",
          columns: 2 as const,
          fields: all.map(fieldDefinitionToUi),
        },
      ],
    };
  }
  return {
    layout,
    sections: layout.body.sections.map((sec) => ({
      id: sec.id,
      label: sec.label,
      columns: sec.columns,
      fields: sec.fields
        .map((k) => byApi.get(k))
        .filter((fd): fd is FieldDefinition => Boolean(fd))
        .map(fieldDefinitionToUi),
    })),
  };
}

export function resolvePicklistLabel(
  field: UiListingField,
  apiValue: string,
): string {
  if (!field.options?.length) return apiValue;
  const idx = field.options.indexOf(apiValue);
  if (idx >= 0 && field.optionLabels?.[idx]) return field.optionLabels[idx];
  return apiValue;
}
