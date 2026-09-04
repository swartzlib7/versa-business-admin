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
  // #246 Slice C (rev E section 3/7.4, 2026-08-31): baked listing children for
  // the new system-type divisions (Communications, Dissemination, Treasury,
  // Qualifications, Distribution).
  "messages",
  "reports",
  "staff",
  "sales",
  "promotion-marketing",
  "transactions",
  "records-assets-materiel",
  "examinations",
  "reviews",
  "certifications-awards",
  "contacts",
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
  // #246 Slice C (rev E section 3/7.4): new division children. All structure
  // =list. vendor_integration retired in Slice F (D1 cutover): the vendor
  // Integrations child renders org-attached record_line rows (line_group=integrations).
  messages: "communication_message",
  reports: "communication_report",
  staff: "communication_staff",
  sales: "dissemination_sales",
  "promotion-marketing": "dissemination_promotion_marketing",
  transactions: "treasury_transaction",
  "records-assets-materiel": "treasury_records_assets_materiel",
  examinations: "qualification_examination",
  reviews: "qualification_review",
  "certifications-awards": "qualification_certifications_awards",
  contacts: "contact",
};

// #246 Slice C (rev E section 7.6): environment element tabs ARE record lists
// (Locations, Events, Knowledge, Schedules stay list-structure per rev A
// section 4.4). The tab itself wires to its system type so the live listing
// renders on the element tab instead of a static Configuration form.
const BAKED_ELEMENT_TAB_SYSTEM_TYPES: Record<string, string> = {
  locations: "location",
  events: "event",
  knowledge: "knowledge",
  schedules: "schedule",
  stats: "environment_stat",
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
): ZoneTab | null {
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
  // Gate 3: Show as tab controls baked tabs too. Unchecked hides the tab.
  if (systemType.show_as_tab === false) return null;
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
  // #246 Slice C (rev E section 7.6): element-level wiring for environment
  // lists. When the element tab's system type exists and is active, the tab
  // itself carries the dynamic-path props (the live listing renders on the
  // element tab; TabPanel keeps those props on the self-panel).
  const elementApiName = BAKED_ELEMENT_TAB_SYSTEM_TYPES[tab.id];
  let wiredTab = tab;
  if (elementApiName && parentKind === "environment") {
    const elementType = recordTypes.find(
      (t) =>
        t.api_name === elementApiName &&
        t.active &&
        t.parent_kind === parentKind &&
        t.parent_api_name === tab.id,
    );
    if (elementType) {
      wiredTab = {
        ...tab,
        structure: elementType.structure,
        recordTypeApiName: elementType.api_name,
        objectApiName: elementType.object_api_name,
        parentKind,
        parentApiName: tab.id,
        sampleRows: undefined,
      };
    }
  }

  const bakedApiNames = new Set([
    ...Object.values(BAKED_TAB_SYSTEM_TYPES),
    ...Object.values(BAKED_ELEMENT_TAB_SYSTEM_TYPES),
    "organization",
    "executive",
    "public",
    "communications",
    "dissemination",
    "treasury",
    "production",
    "qualification",
    "vendor",
    "customer",
    "partner",
    "branch",
  ]);
  const types = recordTypes.filter(
    (t) =>
      t.parent_kind === parentKind &&
      t.parent_api_name === tab.id &&
      t.active &&
      t.show_as_tab &&
      !bakedApiNames.has(t.api_name),
  );

  const wiredChildren = (wiredTab.children ?? [])
    .map((c) =>
      BAKED_IN_CHILD_IDS.has(c.id)
        ? wireBakedChildToSystemType(c, tab.id, parentKind, recordTypes)
        : c,
    )
    .filter((c): c is ZoneTab => c != null);

  if (!types.length) {
    if (wiredTab.children?.length) return { ...wiredTab, children: wiredChildren };
    return wiredTab;
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
    ...wiredTab,
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
