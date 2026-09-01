/**
 * I5.6.32c — Record types for Records Editor (Stephen-approved naming).
 * Types drive named tabs under parent elements; baked-ins stay first-class.
 * Fixture-local until catalog/records tables persist (Phase 2+).
 */

import { cascadeDeleteObjectForRecordType } from '@/lib/fixtures/catalog';
import { deleteInstance, listInstances } from '@/lib/fixtures/record-instances';
import { deleteLayoutConfig } from '@/lib/catalog/layout-storage';

export type RecordStructure = 'list' | 'header' | 'header_lines';
export type ParentKind = 'faculty' | 'collaboration' | 'environment' | 'baked_in';

export interface RecordTypeDefinition {
  id: string;
  api_name: string;
  label: string;
  description: string;
  parent_kind: ParentKind;
  parent_api_name: string;
  structure: RecordStructure;
  show_as_tab: boolean;
  sort_order: number;
  active: boolean;
  is_system: boolean;
  object_api_name: string;
}

export const recordTypes: RecordTypeDefinition[] = [
  // I5.6.32 Slice 2.1 (#220): unspec faculty seed types removed.
  // Types are created via Records Editor; parents remain in listEditorParents.
  //
  // #218 Zone Pages Live Dynamic Records (COA-locked slice, 2026-08-30):
  // 6 system record types backing the baked-in zone listing tabs. is_system
  // rows are delete-protected in the Records Editor; show_as_tab=false keeps
  // them out of the dynamic tab injection (the baked tabs themselves render).
  // Fields for these objects are seeded in catalog.ts facultyRecordFieldSeed.
  //
  // #185 Slice A (rev E §7.2, 2026-08-31): executive_project, executive_task,
  // production_product, production_service move list -> header_lines (each
  // instance = header + lines; rev A §4.2 line groups). executive_policy was
  // already header_lines. vendor_integration retired in #244 Slice F (D1 cutover):
  // vendor integrations are org-attached record_line rows, not a record type.
  {
    id: 'rt-executive_policy',
    api_name: 'executive_policy',
    label: 'Policy',
    description: 'Governing policies and executive directives for the organization.',
    parent_kind: 'faculty',
    parent_api_name: 'executive',
    structure: 'header_lines',
    show_as_tab: false,
    sort_order: 10,
    active: true,
    is_system: true,
    object_api_name: 'executive_policy',
  },
  {
    id: 'rt-executive_project',
    api_name: 'executive_project',
    label: 'Projects',
    description: 'Strategic and delivery projects owned by Executive.',
    parent_kind: 'faculty',
    parent_api_name: 'executive',
    structure: 'header_lines',
    show_as_tab: false,
    sort_order: 20,
    active: true,
    is_system: true,
    object_api_name: 'executive_project',
  },
  {
    id: 'rt-executive_task',
    api_name: 'executive_task',
    label: 'Tasks',
    description: 'Executable work items under Executive projects.',
    parent_kind: 'faculty',
    parent_api_name: 'executive',
    structure: 'header_lines',
    show_as_tab: false,
    sort_order: 30,
    active: true,
    is_system: true,
    object_api_name: 'executive_task',
  },
  {
    id: 'rt-production_product',
    api_name: 'production_product',
    label: 'Product',
    description: 'Device, manufactured item, or computer file owned by Production.',
    parent_kind: 'faculty',
    parent_api_name: 'production',
    structure: 'header_lines',
    show_as_tab: false,
    sort_order: 40,
    active: true,
    is_system: true,
    object_api_name: 'production_product',
  },
  {
    id: 'rt-production_service',
    api_name: 'production_service',
    label: 'Service',
    description: 'Faculty for results - e.g. Analysis & Design. Owned by Production.',
    parent_kind: 'faculty',
    parent_api_name: 'production',
    structure: 'header_lines',
    show_as_tab: false,
    sort_order: 50,
    active: true,
    is_system: true,
    object_api_name: 'production_service',
  },
  // #246 Slice C (rev E section 3, 2026-08-31): 15 new system record types for
  // the locked element table - Communications (3), Dissemination (2), Treasury
  // (2, single RAM type per Stephen spelling), Qualifications (3),
  // Distribution/contacts (1), Environment (4). All structure=list (rev E
  // section 3). vendor_integration retired in #244 Slice F (D1 cutover): vendor
  // integrations are org-attached record_line rows (line_group=integrations).
  {
    id: 'rt-communication_message',
    api_name: 'communication_message',
    label: 'Messages',
    description: 'Messages sent and received across channels, typed by message type.',
    parent_kind: 'faculty',
    parent_api_name: 'communications',
    structure: 'list',
    show_as_tab: false,
    sort_order: 10,
    active: true,
    is_system: true,
    object_api_name: 'communication_message',
  },
  {
    id: 'rt-communication_report',
    api_name: 'communication_report',
    label: 'Reports',
    description: 'Operational and status reports produced by Communications.',
    parent_kind: 'faculty',
    parent_api_name: 'communications',
    structure: 'list',
    show_as_tab: false,
    sort_order: 20,
    active: true,
    is_system: true,
    object_api_name: 'communication_report',
  },
  {
    id: 'rt-communication_staff',
    api_name: 'communication_staff',
    label: 'Staff',
    description: 'Communications staff assignments and contacts.',
    parent_kind: 'faculty',
    parent_api_name: 'communications',
    structure: 'list',
    show_as_tab: false,
    sort_order: 30,
    active: true,
    is_system: true,
    object_api_name: 'communication_staff',
  },
  {
    id: 'rt-dissemination_sales',
    api_name: 'dissemination_sales',
    label: 'Sales',
    description: 'Sales materials and publications for dissemination channels.',
    parent_kind: 'faculty',
    parent_api_name: 'dissemination',
    structure: 'list',
    show_as_tab: false,
    sort_order: 10,
    active: true,
    is_system: true,
    object_api_name: 'dissemination_sales',
  },
  {
    id: 'rt-dissemination_promotion_marketing',
    api_name: 'dissemination_promotion_marketing',
    label: 'Promotion & Marketing',
    description: 'Promotion and marketing campaigns and assets (campaigns fold under this type per C7).',
    parent_kind: 'faculty',
    parent_api_name: 'dissemination',
    structure: 'list',
    show_as_tab: false,
    sort_order: 20,
    active: true,
    is_system: true,
    object_api_name: 'dissemination_promotion_marketing',
  },
  {
    id: 'rt-treasury_transaction',
    api_name: 'treasury_transaction',
    label: 'Transactions',
    description: 'Treasury transactions classified as income or disbursement.',
    parent_kind: 'faculty',
    parent_api_name: 'treasury',
    structure: 'list',
    show_as_tab: false,
    sort_order: 10,
    active: true,
    is_system: true,
    object_api_name: 'treasury_transaction',
  },
  {
    id: 'rt-treasury_records_assets_materiel',
    api_name: 'treasury_records_assets_materiel',
    label: 'Records, Assets and Materiel',
    description: 'Records, assets and materiel entries for Treasury (single RAM type, spelling per Stephen).',
    parent_kind: 'faculty',
    parent_api_name: 'treasury',
    structure: 'list',
    show_as_tab: false,
    sort_order: 20,
    active: true,
    is_system: true,
    object_api_name: 'treasury_records_assets_materiel',
  },
  {
    id: 'rt-qualification_examination',
    api_name: 'qualification_examination',
    label: 'Examinations',
    description: 'Examinations administered by Qualifications.',
    parent_kind: 'faculty',
    parent_api_name: 'qualification',
    structure: 'list',
    show_as_tab: false,
    sort_order: 10,
    active: true,
    is_system: true,
    object_api_name: 'qualification_examination',
  },
  {
    id: 'rt-qualification_review',
    api_name: 'qualification_review',
    label: 'Reviews',
    description: 'Reviews raised when examinations do not pass.',
    parent_kind: 'faculty',
    parent_api_name: 'qualification',
    structure: 'list',
    show_as_tab: false,
    sort_order: 20,
    active: true,
    is_system: true,
    object_api_name: 'qualification_review',
  },
  {
    id: 'rt-qualification_certifications_awards',
    api_name: 'qualification_certifications_awards',
    label: 'Certifications & Awards',
    description: 'Certifications and awards issued on examination pass.',
    parent_kind: 'faculty',
    parent_api_name: 'qualification',
    structure: 'list',
    show_as_tab: false,
    sort_order: 30,
    active: true,
    is_system: true,
    object_api_name: 'qualification_certifications_awards',
  },
  {
    id: 'rt-contact',
    api_name: 'contact',
    label: 'Contacts',
    description: 'Contact records centralized under Distribution; staff-type contacts belong to an organization, public-type do not.',
    parent_kind: 'faculty',
    parent_api_name: 'public',
    structure: 'list',
    show_as_tab: false,
    sort_order: 10,
    active: true,
    is_system: true,
    object_api_name: 'contact',
  },
  {
    id: 'rt-location',
    api_name: 'location',
    label: 'Locations',
    description: 'Business locations and places.',
    parent_kind: 'environment',
    parent_api_name: 'locations',
    structure: 'list',
    show_as_tab: false,
    sort_order: 10,
    active: true,
    is_system: true,
    object_api_name: 'location',
  },
  {
    id: 'rt-event',
    api_name: 'event',
    label: 'Events',
    description: 'Planned activity, future or past.',
    parent_kind: 'environment',
    parent_api_name: 'events',
    structure: 'list',
    show_as_tab: false,
    sort_order: 10,
    active: true,
    is_system: true,
    object_api_name: 'event',
  },
  {
    id: 'rt-knowledge',
    api_name: 'knowledge',
    label: 'Knowledge',
    description: 'Documents, recordings, photos, policies, research.',
    parent_kind: 'environment',
    parent_api_name: 'knowledge',
    structure: 'list',
    show_as_tab: false,
    sort_order: 10,
    active: true,
    is_system: true,
    object_api_name: 'knowledge',
  },
  {
    id: 'rt-schedule',
    api_name: 'schedule',
    label: 'Schedules',
    description: 'When an event, activity, or task occurs.',
    parent_kind: 'environment',
    parent_api_name: 'schedules',
    structure: 'list',
    show_as_tab: false,
    sort_order: 10,
    active: true,
    is_system: true,
    object_api_name: 'schedule',
  },
];

let mutableRecordTypes: RecordTypeDefinition[] = [...recordTypes];

export function resetRecordTypes(): void {
  mutableRecordTypes = [...recordTypes];
}

export function listRecordTypes(filters?: {
  parent_kind?: string;
  parent_api_name?: string;
  active_only?: boolean;
}): RecordTypeDefinition[] {
  let rows = [...mutableRecordTypes];
  if (filters?.parent_kind) rows = rows.filter((r) => r.parent_kind === filters.parent_kind);
  if (filters?.parent_api_name)
    rows = rows.filter((r) => r.parent_api_name === filters.parent_api_name);
  if (filters?.active_only !== false) rows = rows.filter((r) => r.active);
  return rows.sort((a, b) => a.sort_order - b.sort_order || a.api_name.localeCompare(b.api_name));
}

export function getRecordType(apiName: string): RecordTypeDefinition | undefined {
  return mutableRecordTypes.find((r) => r.api_name === apiName);
}

export interface CreateRecordTypeInput {
  api_name: string;
  label: string;
  description?: string;
  parent_kind: ParentKind;
  parent_api_name: string;
  structure?: RecordStructure;
  show_as_tab?: boolean;
  sort_order?: number;
}

export type CreateRecordTypeResult =
  | { ok: true; type: RecordTypeDefinition }
  | { ok: false; code: string; message: string };

const PARENT_KINDS: ParentKind[] = ['faculty', 'collaboration', 'environment', 'baked_in'];
const STRUCTURES: RecordStructure[] = ['list', 'header', 'header_lines'];

export function createRecordType(input: CreateRecordTypeInput): CreateRecordTypeResult {
  const apiName = (input.api_name || '').trim();
  if (!/^[a-z][a-z0-9_]*$/.test(apiName)) {
    return {
      ok: false,
      code: 'INVALID_API_NAME',
      message: 'api_name must be snake_case starting with a letter.',
    };
  }
  if (mutableRecordTypes.some((r) => r.api_name === apiName)) {
    return { ok: false, code: 'TYPE_EXISTS', message: `Record type '${apiName}' already exists.` };
  }
  if (!PARENT_KINDS.includes(input.parent_kind)) {
    return {
      ok: false,
      code: 'INVALID_PARENT_KIND',
      message: `parent_kind must be one of: ${PARENT_KINDS.join(', ')}`,
    };
  }
  const structure = input.structure ?? 'list';
  if (!STRUCTURES.includes(structure)) {
    return {
      ok: false,
      code: 'INVALID_STRUCTURE',
      message: `structure must be one of: ${STRUCTURES.join(', ')}`,
    };
  }
  const parent = (input.parent_api_name || '').trim();
  if (!parent) {
    return { ok: false, code: 'PARENT_REQUIRED', message: 'parent_api_name is required.' };
  }
  const label = (input.label || apiName).trim();
  const siblings = mutableRecordTypes.filter(
    (r) => r.parent_kind === input.parent_kind && r.parent_api_name === parent,
  );
  // Slice F (rev E section 2.4): labels must be unique within the parent -
  // tab strips key on label display, so duplicate sibling labels are ambiguous.
  if (siblings.some((r) => r.label.toLowerCase() === label.toLowerCase())) {
    return {
      ok: false,
      code: 'LABEL_EXISTS',
      message: `A record type labeled '${label}' already exists under this parent.`,
    };
  }
  const nextOrder =
    input.sort_order ?? siblings.reduce((m, r) => Math.max(m, r.sort_order), 0) + 10;
  const type: RecordTypeDefinition = {
    id: `rt-${apiName}`,
    api_name: apiName,
    label,
    description: (input.description || '').trim(),
    parent_kind: input.parent_kind,
    parent_api_name: parent,
    structure,
    show_as_tab: input.show_as_tab !== false,
    sort_order: nextOrder,
    active: true,
    is_system: false,
    object_api_name: apiName,
  };
  mutableRecordTypes.push(type);
  return { ok: true, type };
}

export interface UpdateRecordTypeInput {
  label?: string;
  description?: string;
  structure?: RecordStructure;
  show_as_tab?: boolean;
  sort_order?: number;
  active?: boolean;
}

export function updateRecordType(
  apiName: string,
  input: UpdateRecordTypeInput,
): CreateRecordTypeResult {
  const idx = mutableRecordTypes.findIndex((r) => r.api_name === apiName);
  if (idx < 0) {
    return { ok: false, code: 'NOT_FOUND', message: `Unknown record type '${apiName}'.` };
  }
  const cur = mutableRecordTypes[idx];
  if (input.structure && !STRUCTURES.includes(input.structure)) {
    return {
      ok: false,
      code: 'INVALID_STRUCTURE',
      message: `structure must be one of: ${STRUCTURES.join(', ')}`,
    };
  }
  const next: RecordTypeDefinition = {
    ...cur,
    label: input.label !== undefined ? input.label.trim() : cur.label,
    description: input.description !== undefined ? input.description.trim() : cur.description,
    structure: input.structure ?? cur.structure,
    show_as_tab: input.show_as_tab !== undefined ? input.show_as_tab : cur.show_as_tab,
    sort_order: input.sort_order !== undefined ? input.sort_order : cur.sort_order,
    active: input.active !== undefined ? input.active : cur.active,
  };
  mutableRecordTypes[idx] = next;
  return { ok: true, type: next };
}


export type DeleteRecordTypeResult =
  | {
      ok: true;
      type: RecordTypeDefinition;
      cascade: {
        fields_removed: number;
        layouts_removed: number;
        instances_removed: number;
        object_removed: boolean;
      };
    }
  | { ok: false; code: string; message: string };

/**
 * Hard-delete a non-system record type and cascade related fixture data.
 * System types are refused. Soft-retire remains via updateRecordType({ active: false }).
 */
export function deleteRecordType(apiName: string): DeleteRecordTypeResult {
  const idx = mutableRecordTypes.findIndex((r) => r.api_name === apiName);
  if (idx < 0) {
    return { ok: false, code: 'NOT_FOUND', message: `Unknown record type '${apiName}'.` };
  }
  const cur = mutableRecordTypes[idx];
  if (cur.is_system) {
    return {
      ok: false,
      code: 'SYSTEM_TYPE',
      message: 'System record types cannot be hard-deleted.',
    };
  }

  const objectApi = cur.object_api_name || cur.api_name;
  const cascade = cascadeDeleteObjectForRecordType(objectApi);
  const instanceRows = listInstances({ type_api_name: apiName });
  let instances_removed = 0;
  for (const row of instanceRows) {
    if (deleteInstance(row.id)) instances_removed += 1;
  }
  // Also drop instances keyed by object api name if different
  if (objectApi !== apiName) {
    for (const row of listInstances({ type_api_name: objectApi })) {
      if (deleteInstance(row.id)) instances_removed += 1;
    }
  }
  let layouts_removed = 0;
  for (const lt of ['detail', 'edit', 'list'] as const) {
    if (deleteLayoutConfig(objectApi, lt)) layouts_removed += 1;
  }
  layouts_removed += cascade.layouts_removed;

  mutableRecordTypes.splice(idx, 1);
  return {
    ok: true,
    type: cur,
    cascade: {
      fields_removed: cascade.fields_removed,
      layouts_removed,
      instances_removed,
      object_removed: cascade.object_removed,
    },
  };
}

export type EditorParent = {
  parent_kind: ParentKind;
  parent_api_name: string;
  label: string;
  group: "Organization" | "Collaboration" | "Environment";
  baked_in_tabs: string[];
};

/** Canonical Records Editor taxonomy. Labels are presentation-ready; API values remain stable. */
export function listEditorParents(): EditorParent[] {
  return [
    { parent_kind: "faculty", parent_api_name: "executive", label: "Executive", group: "Organization", baked_in_tabs: ["Policy", "Projects", "Tasks"] },
    { parent_kind: "faculty", parent_api_name: "public", label: "Public", group: "Organization", baked_in_tabs: [] },
    { parent_kind: "faculty", parent_api_name: "communications", label: "Communications", group: "Organization", baked_in_tabs: [] },
    { parent_kind: "faculty", parent_api_name: "dissemination", label: "Dissemination", group: "Organization", baked_in_tabs: [] },
    { parent_kind: "faculty", parent_api_name: "treasury", label: "Treasury", group: "Organization", baked_in_tabs: [] },
    { parent_kind: "faculty", parent_api_name: "production", label: "Production", group: "Organization", baked_in_tabs: ["Product", "Service"] },
    { parent_kind: "faculty", parent_api_name: "qualification", label: "Qualification", group: "Organization", baked_in_tabs: [] },
    { parent_kind: "collaboration", parent_api_name: "vendor", label: "Vendor", group: "Collaboration", baked_in_tabs: [] },
    { parent_kind: "collaboration", parent_api_name: "customer", label: "Customer", group: "Collaboration", baked_in_tabs: [] },
    { parent_kind: "collaboration", parent_api_name: "partner", label: "Partner", group: "Collaboration", baked_in_tabs: [] },
    { parent_kind: "collaboration", parent_api_name: "branch", label: "Branch", group: "Collaboration", baked_in_tabs: [] },
    { parent_kind: "environment", parent_api_name: "locations", label: "Locations", group: "Environment", baked_in_tabs: [] },
    { parent_kind: "environment", parent_api_name: "events", label: "Events", group: "Environment", baked_in_tabs: [] },
    { parent_kind: "environment", parent_api_name: "knowledge", label: "Knowledge", group: "Environment", baked_in_tabs: [] },
    { parent_kind: "environment", parent_api_name: "schedules", label: "Schedules", group: "Environment", baked_in_tabs: [] },
  ];
}
