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
import { isPairingStampField } from "@/lib/public/driver-pairings";
import { isDriverCodeOwnedField } from "@/lib/public/render-driver-locks";

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
  | "phone"
  | "lookup";

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
  span?: number;
  /** J4: header_lines placement — "header" | "list" (undefined = default). */
  zoneRole?: "header" | "list" | null;
  /** Mask on screen; Show / Hide in the form. */
  secret?: boolean;
  lookupObjectApiName?: string | null;
  /** Empty grid cell from the Layout Editor (`__blank__*`). */
  blank?: boolean;
  help?: string;
  /** Staff cannot change this value (code-owned or stamp). */
  readOnly?: boolean;
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
    case "lookup":
      return "lookup";
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

const FIELD_HELP: Record<string, string> = {
  scale_name: "Shown rotated on the graph next to the scale numbers",
  scale_start: "Lowest expected for period",
  scale_end: "Highest expected for period",
  frequency_start: "From Start datetime and Frequency type",
  code_key:
    "Identity of the code renderer (html-block, stat-graph, contacts-cards). Owned by product code — not editable. Staff rename the driver; they do not invent a new key.",
  bind_shape:
    "Paint binding from the code catalog (header, header + lines, or lines). Not the record type Structure. One record type can have more than one driver shape.",
  compatible_record_type:
    "Records Editor type this driver paints. Editable. Existing Elements keep the type they were saved with.",
  status:
    "Active is required for the Canvas type picker and visitor paint. Leaving Active while pairings exist needs confirm.",
  driver_id:
    "The Rendering Driver this Element configures. Display style and record type live on the driver.",
  render_option:
    "How this Element paints. The choices come from that driver’s render outputs.",
  target_record_type:
    "Which Records Editor type to select from. Must stay compatible with the driver.",
  target_record_id:
    "Which record (or all records) this Element paints. This is record selection, not a driver attribute.",
  filter_json:
    "Which records to include when Selection Type is Filter. Conditions are combined with AND.",
};

export function helpForField(apiName: string): string | undefined {
  return FIELD_HELP[apiName];
}

export function placeIdLast<T extends { key?: string; api_name?: string }>(fields: T[]): T[] {
  const id = fields.filter((f) => (f.key ?? f.api_name) === "id");
  if (!id.length) return fields;
  return [...fields.filter((f) => (f.key ?? f.api_name) !== "id"), ...id];
}

export function fieldDefinitionToUi(fd: FieldDefinition): UiListingField {
  const { options, optionLabels } = optionsForField(fd);
  return {
    key: fd.api_name,
    label: fd.label,
    help: FIELD_HELP[fd.api_name],
    kind: dataTypeToUiKind(fd.data_type),
    options,
    optionLabels,
    required: fd.is_required,
    dataType: fd.data_type,
    isSystem: fd.is_system,
    zoneRole: fd.zone_role ?? null,
    lookupObjectApiName: fd.lookup_object_api_name ?? null,
    readOnly:
      isDriverCodeOwnedField(fd.object_api_name, fd.api_name) ||
      isPairingStampField(fd.object_api_name, fd.api_name),
    secret:
      fd.is_secret === true ||
      (fd.object_api_name === "vendor_credential" && fd.api_name === "configuration"),
  };
}

export function listingFieldsFromCatalog(objectApiName: string): UiListingField[] {
  const layout = getDefaultLayout(objectApiName, "list");
  const all = listFieldDefinitions(objectApiName);
  const byApi = new Map(all.map((f) => [f.api_name, f]));

  if (!layout) {
    return all.map((fd) => {
      const ui = fieldDefinitionToUi(fd);
      return {
        ...ui,
        column: fd.data_type !== "long_text" && !ui.secret,
      };
    });
  }

  const orderedKeys = layout.body.sections.flatMap((s) => s.fields);
  const listKeys = new Set(orderedKeys);
  const result: UiListingField[] = [];

  for (const key of orderedKeys) {
    const fd = byApi.get(key);
    if (!fd) continue;
    const ui = fieldDefinitionToUi(fd);
    result.push({ ...ui, column: !ui.secret });
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
    columns: 1 | 2 | 4 | 6 | 8;
    fields: UiListingField[];
  }>;
} {
  const layout = getDefaultLayout(objectApiName, "edit");
  const all = listFieldDefinitions(objectApiName);
  const byApi = new Map(all.map((f) => [f.api_name, f]));

  if (!layout) {
    const fields = placeIdLast(all.map(fieldDefinitionToUi));
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
    fields: placeIdLast(
      sec.fields
        .map((k) => byApi.get(k))
        .filter((fd): fd is FieldDefinition => Boolean(fd))
        .map(fieldDefinitionToUi),
    ),
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
          fields: placeIdLast(all.map(fieldDefinitionToUi)),
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
      fields: placeIdLast(
        sec.fields
          .map((k) => byApi.get(k))
          .filter((fd): fd is FieldDefinition => Boolean(fd))
          .map(fieldDefinitionToUi),
      ),
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
