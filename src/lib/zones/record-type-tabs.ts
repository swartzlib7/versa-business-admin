/**
 * I5.6.32c — Merge Records Editor types into zone tab children.
 */
import type { ZoneTab } from "@/components/zones/zone-config-view";
import { listRecordTypes } from "@/lib/fixtures/record-types";
import { listFieldDefinitions } from "@/lib/fixtures/catalog";

const BAKED_IN_CHILD_IDS = new Set([
  "policy",
  "projects",
  "tasks",
  "product",
  "service",
  "integrations",
]);

function fieldsFromCatalog(objectApiName: string) {
  const defs = listFieldDefinitions(objectApiName);
  if (!defs.length) {
    return [
      { label: "Name", placeholder: "Name" },
      { label: "Status", placeholder: "Status" },
    ];
  }
  return defs.map((f) => ({
    label: f.label,
    placeholder: f.label,
    kind:
      f.data_type === "long_text"
        ? ("textarea" as const)
        : f.data_type === "picklist" || f.data_type === "multipicklist"
          ? ("select" as const)
          : ("text" as const),
    options: undefined as string[] | undefined,
  }));
}

/** Replace generic "Records" placeholders with named types from Records Editor. */
export function applyRecordTypesToTab(
  tab: ZoneTab,
  parentKind: "faculty" | "collaboration" | "environment",
): ZoneTab {
  const types = listRecordTypes({
    parent_kind: parentKind,
    parent_api_name: tab.id,
    active_only: true,
  }).filter((t) => t.show_as_tab);

  if (!types.length) return tab;

  const baked = (tab.children ?? []).filter((c) => BAKED_IN_CHILD_IDS.has(c.id));
  const dynamicChildren: ZoneTab[] = types.map((t) => {
    const fieldDefs = listFieldDefinitions(t.object_api_name);
    const listColumns = fieldDefs.slice(0, 4).map((f) => f.label);
    const sample =
      fieldDefs.length > 0
        ? [fieldDefs.slice(0, 4).map((f) => (f.default_value ?? f.label))]
        : [["Sample", "active"]];
    return {
      id: `rt-${t.api_name}`,
      label: t.label,
      summary:
        t.description ||
        `${t.label} (${t.structure}) — managed in Settings → Records Editor.`,
      presentation: t.structure === "header" ? ("form" as const) : ("listing" as const),
      listColumns: listColumns.length ? listColumns : ["Name", "Status"],
      sampleRows: sample,
      fields: fieldsFromCatalog(t.object_api_name),
      relations: tab.relations ?? [],
    };
  });

  return {
    ...tab,
    children: [...baked, ...dynamicChildren],
  };
}

export function applyRecordTypesToZoneTabs(
  tabs: ZoneTab[],
  parentKind: "faculty" | "collaboration" | "environment",
): ZoneTab[] {
  return tabs.map((t) => applyRecordTypesToTab(t, parentKind));
}
