/**
 * I5.6.32c — Record types for Records Editor (Stephen-approved naming).
 * Types drive named tabs under parent elements; baked-ins stay first-class.
 * Fixture-local until catalog/records tables persist (Phase 2+).
 */

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

export function listEditorParents(): Array<{
  parent_kind: ParentKind;
  parent_api_name: string;
  label: string;
  baked_in_tabs: string[];
}> {
  return [
    { parent_kind: 'faculty', parent_api_name: 'executive', label: 'Executive', baked_in_tabs: ['Policy', 'Projects', 'Tasks'] },
    { parent_kind: 'faculty', parent_api_name: 'public', label: 'Public', baked_in_tabs: [] },
    { parent_kind: 'faculty', parent_api_name: 'communications', label: 'Communications', baked_in_tabs: [] },
    { parent_kind: 'faculty', parent_api_name: 'dissemination', label: 'Dissemination', baked_in_tabs: [] },
    { parent_kind: 'faculty', parent_api_name: 'treasury', label: 'Treasury', baked_in_tabs: [] },
    { parent_kind: 'faculty', parent_api_name: 'production', label: 'Production', baked_in_tabs: ['Product', 'Service'] },
    { parent_kind: 'faculty', parent_api_name: 'qualification', label: 'Qualification', baked_in_tabs: [] },
    { parent_kind: 'baked_in', parent_api_name: 'policy', label: 'Policy (baked-in)', baked_in_tabs: [] },
    { parent_kind: 'baked_in', parent_api_name: 'project', label: 'Project (baked-in)', baked_in_tabs: [] },
    { parent_kind: 'baked_in', parent_api_name: 'task', label: 'Task (baked-in)', baked_in_tabs: [] },
    { parent_kind: 'baked_in', parent_api_name: 'product', label: 'Product (baked-in)', baked_in_tabs: [] },
    { parent_kind: 'baked_in', parent_api_name: 'service', label: 'Service (baked-in)', baked_in_tabs: [] },
    { parent_kind: 'collaboration', parent_api_name: 'vendor', label: 'Vendor', baked_in_tabs: [] },
    { parent_kind: 'collaboration', parent_api_name: 'customer', label: 'Customer', baked_in_tabs: [] },
    { parent_kind: 'collaboration', parent_api_name: 'partner', label: 'Partner', baked_in_tabs: [] },
    { parent_kind: 'collaboration', parent_api_name: 'branch', label: 'Branch', baked_in_tabs: [] },
    { parent_kind: 'environment', parent_api_name: 'environment', label: 'Environment (root)', baked_in_tabs: [] },
  ];
}
