/**
 * I5.6.32c — Merge Records Editor types into zone tab children.
 * Instance data comes from record-instances fixture (32c.5).
 */
import type { ZoneTab } from "@/components/zones/zone-config-view";
import { listFieldDefinitions } from "@/lib/fixtures/catalog";
import { listInstances } from "@/lib/fixtures/record-instances";

const BAKED_IN_CHILD_IDS = new Set([
  "policy",
  "projects",
  "tasks",
  "product",
  "service",
  "integrations",
]);

// #218 Zone Pages Live Dynamic Records (COA-locked slice, 2026-08-30):
// baked-in listing tabs backed by system record types. When the system type
// exists and is active, the baked child goes live through the existing dynamic
// ListingPanel/FormPanel path (records API) instead of mock sampleRows.
const BAKED_TAB_SYSTEM_TYPES: Record<string, string> = {
  policy: "executive_policy",
  projects: "executive_project",
  tasks: "executive_task",
  product: "production_product",
  service: "production_service",
  integrations: "vendor_integration",
};

export type ZoneRecordType = {
  api_name: string; label: string; description: string; parent_kind: string; parent_api_name: string;
  structure: "list" | "header" | "header_lines"; show_as_tab: boolean; active: boolean; object_api_name: string;
};

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

/**
 * #218: attach a backing system record type to a baked-in listing child.
 * Sets the dynamic-path fields (recordTypeApiName/objectApiName/parentKind/
 * parentApiName) plus structure from the type, and drops mock sampleRows so
 * ListingPanel fetches live records. Baked fields/listColumns stay as fallback
 * when the catalog has no fields for the object (ListingPanel fallback path).
 * structure is carried from the type so header_lines types (policy) render the
 * saveable header FormPanel above the lines ListingPanel (I2 semantics).
 */
function wireBakedChildToSystemType(
  child: ZoneTab,
  tabId: string,
  parentKind: "faculty" | "collaboration" | "environment",
  recordTypes: ZoneRecordType[],
): ZoneTab {
  const apiName = BAKED_TAB_SYSTEM_TYPES[child.id];
  if (!apiName) return child;
  const systemType = recordTypes.find(
    (t) =>
      t.api_name === apiName &&
      t.active &&
      t.parent_kind === parentKind &&
      t.parent_api_name === tabId,
  );
  if (!systemType) return child;
  return {
    ...child,
    structure: systemType.structure,
    recordTypeApiName: systemType.api_name,
    objectApiName: systemType.object_api_name,
    parentKind,
    parentApiName: tabId,
    sampleRows: undefined,
  };
}

/** Replace generic "Records" placeholders with named types from Records Editor. */
export function applyRecordTypesToTab(
  tab: ZoneTab,
  parentKind: "faculty" | "collaboration" | "environment",
  recordTypes: ZoneRecordType[],
): ZoneTab {
  const types = recordTypes.filter((t) => t.parent_kind === parentKind && t.parent_api_name === tab.id && t.active && t.show_as_tab);

  // #218: baked children wire to system types even when the parent has no
  // show_as_tab types (system types are show_as_tab=false by design), so the
  // wiring runs before the dynamic-tabs early return.
  const wiredChildren = (tab.children ?? []).map((c) =>
    BAKED_IN_CHILD_IDS.has(c.id)
      ? wireBakedChildToSystemType(c, tab.id, parentKind, recordTypes)
      : c,
  );

  if (!types.length) {
    if (tab.children?.length) return { ...tab, children: wiredChildren };
    return tab;
  }

  const baked = wiredChildren.filter((c) => BAKED_IN_CHILD_IDS.has(c.id));
  const dynamicChildren: ZoneTab[] = types.map((t) => {
    const fieldDefs = listFieldDefinitions(t.object_api_name);
    // O1: header_lines types show only list-zone fields explicitly flagged as
    // columns (show_in_column). Other structures keep the legacy first-four.
    const columnDefs =
      t.structure === "header_lines"
        ? fieldDefs.filter(
            (f) =>
              (f as { zone_role?: "header" | "list" | null }).zone_role === "list" &&
              (f as { show_in_column?: boolean }).show_in_column === true,
          )
        : fieldDefs.slice(0, 4);
    const listColumns = (columnDefs.length ? columnDefs : fieldDefs.slice(0, 4)).map((f) => f.label);
    const fields = fieldsFromCatalog(t.object_api_name);

    // Fetch instance data for this type + parent (32c.5)
    const instances = listInstances({
      type_api_name: t.api_name,
      parent_kind: parentKind,
      parent_api_name: tab.id,
    });

    let sampleRows: string[][];
    if (instances.length > 0) {
      sampleRows = instances.map((inst) => {
        const row: string[] = [];
        for (const col of (listColumns.length ? listColumns : ["Name", "Status"])) {
          if (col.toLowerCase() === "name") row.push(inst.name);
          else if (col.toLowerCase() === "status") row.push(inst.status);
          else row.push(inst.data[col] ?? "");
        }
        return row;
      });
    } else {
      // Fallback to field defaults if no instances
      sampleRows =
        fieldDefs.length > 0
          ? [fieldDefs.slice(0, 4).map((f) => (f.default_value ?? f.label))]
          : [["Sample", "active"]];
    }

    return {
      id: `rt-${t.api_name}`,
      label: t.label,
      summary:
        t.description ||
        `${t.label} (${t.structure}) — managed in Settings → Records Editor.`,
      presentation: t.structure === "header" ? ("form" as const) : ("listing" as const),
      structure: t.structure,
      listColumns: listColumns.length ? listColumns : ["Name", "Status"],
      sampleRows,
      fields,
      relations: tab.relations ?? [],
      recordTypeApiName: t.api_name,
      objectApiName: t.object_api_name,
      parentKind,
      parentApiName: tab.id,
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
  recordTypes: ZoneRecordType[],
): ZoneTab[] {
  return tabs.map((t) => applyRecordTypesToTab(t, parentKind, recordTypes));
}
