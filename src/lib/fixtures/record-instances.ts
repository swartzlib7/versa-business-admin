/**
 * I5.6.32c — Record instance fixture CRUD (in-process memory).
 * Storage is fixture-local until Phase 2+ persists records tables.
 * Instances are keyed by type_api_name + parent_kind + parent_api_name.
 */

export interface RecordInstance {
  id: string;
  type_api_name: string;
  parent_kind: string;
  parent_api_name: string;
  name: string;
  status: string;
  data: Record<string, string>;
  lines?: RecordInstanceLine[];
  created_at: string;
}

export interface RecordInstanceLine {
  id: string;
  record_id: string;
  /** #185 Slice A (rev E section 4.2): lines-group key (e.g. 'milestones').
   *  Optional for backward compatibility - undefined reads as the default group. */
  line_group?: string;
  data: Record<string, string>;
  sort_order: number;
}

let mutableInstances: RecordInstance[] = [];
let nextId = 1;

export function resetRecordInstances(): void {
  mutableInstances = [];
  nextId = 1;
}

export function listInstances(filters: {
  type_api_name?: string;
  parent_kind?: string;
  parent_api_name?: string;
}): RecordInstance[] {
  let rows = [...mutableInstances];
  if (filters.type_api_name) rows = rows.filter((r) => r.type_api_name === filters.type_api_name);
  if (filters.parent_kind) rows = rows.filter((r) => r.parent_kind === filters.parent_kind);
  if (filters.parent_api_name)
    rows = rows.filter((r) => r.parent_api_name === filters.parent_api_name);
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

export function getInstance(id: string): RecordInstance | undefined {
  return mutableInstances.find((r) => r.id === id);
}

export interface CreateInstanceInput {
  type_api_name: string;
  parent_kind: string;
  parent_api_name: string;
  name: string;
  status?: string;
  data?: Record<string, string>;
  /** #185 Slice A: structured line entries carrying an optional lines-group key. */
  lines?: Array<{ line_group?: string; data: Record<string, string> }>;
}

export type CreateInstanceResult =
  | { ok: true; instance: RecordInstance }
  | { ok: false; code: string; message: string };

export function createInstance(input: CreateInstanceInput): CreateInstanceResult {
  if (!input.type_api_name?.trim())
    return { ok: false, code: 'TYPE_REQUIRED', message: 'type_api_name is required.' };
  if (!input.parent_kind?.trim())
    return { ok: false, code: 'PARENT_KIND_REQUIRED', message: 'parent_kind is required.' };
  if (!input.parent_api_name?.trim())
    return { ok: false, code: 'PARENT_REQUIRED', message: 'parent_api_name is required.' };
  if (!input.name?.trim())
    return { ok: false, code: 'NAME_REQUIRED', message: 'name is required.' };

  const id = `rec-${nextId++}`;
  const now = new Date().toISOString();
  const lines: RecordInstanceLine[] = (input.lines || []).map((lineData, idx) => ({
    id: `rec-line-${nextId++}`,
    record_id: id,
    line_group: lineData.line_group,
    data: lineData.data,
    sort_order: (idx + 1) * 10,
  }));

  const instance: RecordInstance = {
    id,
    type_api_name: input.type_api_name.trim(),
    parent_kind: input.parent_kind.trim(),
    parent_api_name: input.parent_api_name.trim(),
    name: input.name.trim(),
    status: input.status || 'active',
    data: input.data || {},
    lines: lines.length ? lines : undefined,
    created_at: now,
  };
  mutableInstances.push(instance);
  return { ok: true, instance };
}

export interface UpdateInstanceInput {
  name?: string;
  status?: string;
  data?: Record<string, string>;
  /** #185 Slice A: structured line entries carrying an optional lines-group key. */
  lines?: Array<{ line_group?: string; data: Record<string, string> }>;
}

export type UpdateInstanceResult =
  | { ok: true; instance: RecordInstance }
  | { ok: false; code: string; message: string };

export function updateInstance(id: string, input: UpdateInstanceInput): UpdateInstanceResult {
  const idx = mutableInstances.findIndex((r) => r.id === id);
  if (idx < 0)
    return { ok: false, code: 'NOT_FOUND', message: `Instance '${id}' not found.` };

  const cur = mutableInstances[idx];
  let lines = cur.lines;
  if (input.lines !== undefined) {
    lines = input.lines.map((lineData, idx2) => ({
      id: `rec-line-${nextId++}`,
      record_id: id,
      line_group: lineData.line_group,
      data: lineData.data,
      sort_order: (idx2 + 1) * 10,
    }));
    if (lines.length === 0) lines = undefined;
  }

  const next: RecordInstance = {
    ...cur,
    name: input.name !== undefined ? input.name.trim() : cur.name,
    status: input.status !== undefined ? input.status : cur.status,
    data: input.data !== undefined ? input.data : cur.data,
    lines,
  };
  mutableInstances[idx] = next;
  return { ok: true, instance: next };
}

export function deleteInstance(id: string): boolean {
  const idx = mutableInstances.findIndex((r) => r.id === id);
  if (idx < 0) return false;
  mutableInstances.splice(idx, 1);
  return true;
}
