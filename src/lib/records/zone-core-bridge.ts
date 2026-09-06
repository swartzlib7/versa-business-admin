/**
 * Fold typed-core project/task/product APIs onto zone record types.
 * Fixture path uses in-process instances; postgres uses the same mappers
 * against the record table (see zone-core-bridge-pg.ts).
 */
import type { Product, Project, Task } from '@/lib/data/types';
import type {
  CreateProductInput,
  CreateProjectInput,
  CreateTaskInput,
  ProjectFilters,
  TaskFilters,
  UpdateProductInput,
  UpdateProjectInput,
  UpdateTaskInput,
} from '@/lib/data/adapter';
import { projects as projectFixtures } from '@/lib/fixtures/projects';
import { tasks as taskFixtures } from '@/lib/fixtures/tasks';
import { products as productFixtures } from '@/lib/fixtures/products';
import {
  createInstance,
  getInstance,
  listInstances,
  updateInstance,
  type RecordInstance,
} from '@/lib/fixtures/record-instances';

export const PROJECT_PARENT = {
  type_api_name: 'executive_project',
  parent_kind: 'faculty',
  parent_api_name: 'executive',
} as const;

export const TASK_PARENT = {
  type_api_name: 'executive_task',
  parent_kind: 'faculty',
  parent_api_name: 'executive',
} as const;

export const PRODUCT_PARENT = {
  type_api_name: 'production_product',
  parent_kind: 'faculty',
  parent_api_name: 'production',
} as const;

let seeded = false;

function projectStatus(value: string): Project['status'] {
  return ['active', 'paused', 'completed', 'archived'].includes(value)
    ? (value as Project['status'])
    : 'active';
}

function taskStatus(value: string): Task['status'] {
  return ['planned', 'in_progress', 'waiting', 'blocked', 'done'].includes(value)
    ? (value as Task['status'])
    : 'planned';
}

function projectPriority(value: string): Project['priority'] {
  return ['low', 'normal', 'high'].includes(value) ? (value as Project['priority']) : 'normal';
}

function taskPriority(value: string): Task['priority'] {
  return ['low', 'normal', 'high', 'urgent'].includes(value)
    ? (value as Task['priority'])
    : 'normal';
}

function productStatus(value: string): Product['status'] {
  return ['available', 'beta', 'coming-soon'].includes(value)
    ? (value as Product['status'])
    : 'available';
}

function featuresFromData(raw: string): string[] {
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed.map((row) => String(row));
  } catch {
    /* newline / comma list */
  }
  return raw
    .split(/\n|,/)
    .map((row) => row.trim())
    .filter(Boolean);
}

function dateField(value: string | null | undefined): string {
  if (value == null) return '';
  const text = String(value).trim();
  return text.length >= 10 ? text.slice(0, 10) : text;
}

export function projectCreatePayload(input: CreateProjectInput): {
  name: string;
  status: string;
  data: Record<string, string>;
} {
  const name = (input.name || '').trim();
  if (!name) throw new Error('VALIDATION: name is required');
  const status = input.status ?? 'active';
  const priority = input.priority ?? 'normal';
  if (!['active', 'paused', 'completed', 'archived'].includes(status)) {
    throw new Error('VALIDATION: invalid status');
  }
  if (!['low', 'normal', 'high'].includes(priority)) {
    throw new Error('VALIDATION: invalid priority');
  }
  return {
    name,
    status,
    data: {
      description: input.description ?? '',
      priority,
      owner_id: input.ownerUserId ?? '',
      owner_name: input.ownerName ?? '',
      start_date: dateField(input.startDate),
      target_date: dateField(input.targetDate),
    },
  };
}

export function projectUpdatePayload(
  inst: RecordInstance,
  input: UpdateProjectInput,
): { name?: string; status?: string; data: Record<string, string> } {
  const data = { ...inst.data };
  if (input.description !== undefined) data.description = input.description;
  if (input.priority !== undefined) {
    if (!['low', 'normal', 'high'].includes(input.priority)) {
      throw new Error('VALIDATION: invalid priority');
    }
    data.priority = input.priority;
  }
  if (input.ownerUserId !== undefined) data.owner_id = input.ownerUserId;
  if (input.ownerName !== undefined) data.owner_name = input.ownerName;
  if (input.startDate !== undefined) data.start_date = dateField(input.startDate);
  if (input.targetDate !== undefined) data.target_date = dateField(input.targetDate);
  if (input.name !== undefined && !input.name.trim()) {
    throw new Error('VALIDATION: name cannot be empty');
  }
  if (input.status !== undefined && !['active', 'paused', 'completed', 'archived'].includes(input.status)) {
    throw new Error('VALIDATION: invalid status');
  }
  return { name: input.name, status: input.status, data };
}

export function taskCreatePayload(
  input: CreateTaskInput,
  projectName: string,
): { name: string; status: string; data: Record<string, string> } {
  const title = (input.title || '').trim();
  if (!title) throw new Error('VALIDATION: title is required');
  if (!input.projectId) throw new Error('VALIDATION: projectId is required');
  const status = input.status ?? 'planned';
  const priority = input.priority ?? 'normal';
  if (!['planned', 'in_progress', 'waiting', 'blocked', 'done'].includes(status)) {
    throw new Error('VALIDATION: invalid status');
  }
  if (!['low', 'normal', 'high', 'urgent'].includes(priority)) {
    throw new Error('VALIDATION: invalid priority');
  }
  return {
    name: title,
    status,
    data: {
      notes: input.description ?? '',
      priority,
      project_id: input.projectId,
      project_name: projectName,
      assignee_id: input.assigneeUserId ?? '',
      assignee_name: input.assigneeName ?? '',
      due_date: dateField(input.dueDate),
      updated_at: new Date().toISOString(),
    },
  };
}

export function taskUpdatePayload(
  inst: RecordInstance,
  input: UpdateTaskInput,
  projectName?: string,
): { name?: string; status?: string; data: Record<string, string> } {
  const data = { ...inst.data };
  if (input.description !== undefined) data.notes = input.description;
  if (input.priority !== undefined) {
    if (!['low', 'normal', 'high', 'urgent'].includes(input.priority)) {
      throw new Error('VALIDATION: invalid priority');
    }
    data.priority = input.priority;
  }
  if (input.projectId !== undefined) {
    data.project_id = input.projectId;
    if (projectName !== undefined) data.project_name = projectName;
  }
  if (input.assigneeUserId !== undefined) data.assignee_id = input.assigneeUserId;
  if (input.assigneeName !== undefined) data.assignee_name = input.assigneeName;
  if (input.dueDate !== undefined) data.due_date = dateField(input.dueDate);
  data.updated_at = new Date().toISOString();
  if (input.title !== undefined && !input.title.trim()) {
    throw new Error('VALIDATION: title cannot be empty');
  }
  if (
    input.status !== undefined &&
    !['planned', 'in_progress', 'waiting', 'blocked', 'done'].includes(input.status)
  ) {
    throw new Error('VALIDATION: invalid status');
  }
  return { name: input.title, status: input.status, data };
}

export function productCreatePayload(input: CreateProductInput): {
  name: string;
  status: string;
  data: Record<string, string>;
} {
  const name = (input.name || '').trim();
  if (!name) throw new Error('VALIDATION: name is required');
  const status = input.status ?? 'available';
  if (!['available', 'beta', 'coming-soon'].includes(status)) {
    throw new Error('VALIDATION: invalid status');
  }
  return {
    name,
    status,
    data: {
      tagline: input.tagline ?? '',
      description: input.description ?? '',
      category: input.category ?? '',
      features: JSON.stringify(input.features ?? []),
      status,
    },
  };
}

export function productUpdatePayload(
  inst: RecordInstance,
  input: UpdateProductInput,
): { name?: string; status?: string; data: Record<string, string> } {
  const data = { ...inst.data };
  if (input.tagline !== undefined) data.tagline = input.tagline;
  if (input.description !== undefined) data.description = input.description;
  if (input.category !== undefined) data.category = input.category;
  if (input.features !== undefined) data.features = JSON.stringify(input.features);
  if (input.status !== undefined) {
    if (!['available', 'beta', 'coming-soon'].includes(input.status)) {
      throw new Error('VALIDATION: invalid status');
    }
    data.status = input.status;
  }
  if (input.name !== undefined && !input.name.trim()) {
    throw new Error('VALIDATION: name cannot be empty');
  }
  return { name: input.name, status: input.status, data };
}

export function ensureTypedCoreRecords(): void {
  if (seeded) return;
  seeded = true;
  if (listInstances({ type_api_name: PROJECT_PARENT.type_api_name }).length > 0) return;

  for (const project of projectFixtures) {
    createInstance({
      id: project.id,
      ...PROJECT_PARENT,
      name: project.name,
      status: project.status,
      data: {
        description: project.description,
        priority: project.priority,
        owner_id: project.ownerUserId,
        owner_name: project.ownerName,
        start_date: project.startDate ?? '',
        target_date: project.targetDate ?? '',
      },
    });
  }
  for (const task of taskFixtures) {
    createInstance({
      id: task.id,
      ...TASK_PARENT,
      name: task.title,
      status: task.status,
      data: {
        notes: task.description,
        priority: task.priority,
        project_id: task.projectId,
        project_name: task.projectName,
        assignee_id: task.assigneeUserId,
        assignee_name: task.assigneeName,
        due_date: task.dueDate,
      },
    });
  }
  for (const product of productFixtures) {
    createInstance({
      id: product.id,
      ...PRODUCT_PARENT,
      name: product.name,
      status: product.status,
      data: {
        tagline: product.tagline,
        description: product.description,
        category: product.category,
        features: JSON.stringify(product.features),
        status: product.status,
      },
    });
  }
}

function taskCountFor(projectId: string): number {
  return listInstances({ type_api_name: TASK_PARENT.type_api_name }).filter(
    (row) => row.data.project_id === projectId,
  ).length;
}

export function instanceToProject(inst: RecordInstance, taskCount = 0): Project {
  return {
    id: inst.id,
    name: inst.name,
    description: inst.data.description ?? '',
    status: projectStatus(inst.status),
    ownerUserId: inst.data.owner_id || inst.data.owner_user_id || '',
    ownerName: inst.data.owner_name || '',
    priority: projectPriority(inst.data.priority || 'normal'),
    startDate: inst.data.start_date || null,
    targetDate: inst.data.target_date || null,
    taskCount,
  };
}

export function instanceToTask(inst: RecordInstance, projectName = ''): Task {
  return {
    id: inst.id,
    title: inst.name,
    description: inst.data.notes || inst.data.description || '',
    status: taskStatus(inst.status),
    priority: taskPriority(inst.data.priority || 'normal'),
    projectId: inst.data.project_id || '',
    projectName: projectName || inst.data.project_name || '',
    assigneeUserId: inst.data.assignee_id || inst.data.assignee_user_id || '',
    assigneeName: inst.data.assignee_name || '',
    dueDate: inst.data.due_date || '',
    createdAt: inst.created_at,
    updatedAt: inst.data.updated_at || inst.created_at,
  };
}

export function instanceToProduct(inst: RecordInstance): Product {
  return {
    id: inst.id,
    name: inst.name,
    tagline: inst.data.tagline || '',
    description: inst.data.description || '',
    category: inst.data.category || '',
    status: productStatus(inst.data.status || inst.status || 'available'),
    features: featuresFromData(inst.data.features || ''),
  };
}

export function listBridgedProjects(filters?: ProjectFilters): Project[] {
  ensureTypedCoreRecords();
  let rows = listInstances({
    type_api_name: PROJECT_PARENT.type_api_name,
    parent_kind: PROJECT_PARENT.parent_kind,
    parent_api_name: PROJECT_PARENT.parent_api_name,
  }).map((inst) => instanceToProject(inst, taskCountFor(inst.id)));
  if (filters?.status) rows = rows.filter((row) => row.status === filters.status);
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    rows = rows.filter(
      (row) => row.name.toLowerCase().includes(q) || row.description.toLowerCase().includes(q),
    );
  }
  return rows;
}

export function getBridgedProject(id: string): Project | null {
  ensureTypedCoreRecords();
  const inst = getInstance(id);
  if (!inst || inst.type_api_name !== PROJECT_PARENT.type_api_name) return null;
  return instanceToProject(inst, taskCountFor(inst.id));
}

export function createBridgedProject(input: CreateProjectInput): Project {
  ensureTypedCoreRecords();
  const packed = projectCreatePayload(input);
  const result = createInstance({ ...PROJECT_PARENT, ...packed });
  if (!result.ok) throw new Error(`VALIDATION: ${result.message}`);
  return instanceToProject(result.instance, 0);
}

export function updateBridgedProject(id: string, input: UpdateProjectInput): Project | null {
  ensureTypedCoreRecords();
  const inst = getInstance(id);
  if (!inst || inst.type_api_name !== PROJECT_PARENT.type_api_name) return null;
  const packed = projectUpdatePayload(inst, input);
  const result = updateInstance(id, packed);
  if (!result.ok) return null;
  return instanceToProject(result.instance, taskCountFor(id));
}

export function listBridgedTasks(filters?: TaskFilters): Task[] {
  ensureTypedCoreRecords();
  const names = new Map(
    listInstances({ type_api_name: PROJECT_PARENT.type_api_name }).map((row) => [row.id, row.name]),
  );
  let rows = listInstances({
    type_api_name: TASK_PARENT.type_api_name,
    parent_kind: TASK_PARENT.parent_kind,
    parent_api_name: TASK_PARENT.parent_api_name,
  }).map((inst) => instanceToTask(inst, names.get(inst.data.project_id) ?? ''));
  if (filters?.status) rows = rows.filter((row) => row.status === filters.status);
  if (filters?.projectId) rows = rows.filter((row) => row.projectId === filters.projectId);
  if (filters?.priority) rows = rows.filter((row) => row.priority === filters.priority);
  if (filters?.assignee) {
    rows = rows.filter(
      (row) => row.assigneeUserId === filters.assignee || row.assigneeName === filters.assignee,
    );
  }
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    rows = rows.filter(
      (row) => row.title.toLowerCase().includes(q) || row.description.toLowerCase().includes(q),
    );
  }
  return rows;
}

export function getBridgedTask(id: string): Task | null {
  ensureTypedCoreRecords();
  const inst = getInstance(id);
  if (!inst || inst.type_api_name !== TASK_PARENT.type_api_name) return null;
  const project = inst.data.project_id ? getInstance(inst.data.project_id) : undefined;
  return instanceToTask(inst, project?.name ?? '');
}

export function createBridgedTask(input: CreateTaskInput): Task {
  ensureTypedCoreRecords();
  const project = getBridgedProject(input.projectId);
  if (!project) throw new Error('VALIDATION: projectId does not reference an existing project');
  const packed = taskCreatePayload(input, project.name);
  const result = createInstance({ ...TASK_PARENT, ...packed });
  if (!result.ok) throw new Error(`VALIDATION: ${result.message}`);
  return instanceToTask(result.instance, project.name);
}

export function updateBridgedTask(id: string, input: UpdateTaskInput): Task | null {
  ensureTypedCoreRecords();
  const inst = getInstance(id);
  if (!inst || inst.type_api_name !== TASK_PARENT.type_api_name) return null;
  let projectName: string | undefined;
  if (input.projectId !== undefined) {
    const project = getBridgedProject(input.projectId);
    if (!project) throw new Error('VALIDATION: projectId does not reference an existing project');
    projectName = project.name;
  }
  const packed = taskUpdatePayload(inst, input, projectName);
  const result = updateInstance(id, packed);
  if (!result.ok) return null;
  const project = packed.data.project_id ? getInstance(packed.data.project_id) : undefined;
  return instanceToTask(result.instance, project?.name ?? packed.data.project_name ?? '');
}

export function listBridgedProducts(): Product[] {
  ensureTypedCoreRecords();
  return listInstances({
    type_api_name: PRODUCT_PARENT.type_api_name,
    parent_kind: PRODUCT_PARENT.parent_kind,
    parent_api_name: PRODUCT_PARENT.parent_api_name,
  }).map(instanceToProduct);
}

export function getBridgedProduct(id: string): Product | null {
  ensureTypedCoreRecords();
  const inst = getInstance(id);
  if (!inst || inst.type_api_name !== PRODUCT_PARENT.type_api_name) return null;
  return instanceToProduct(inst);
}

export function createBridgedProduct(input: CreateProductInput): Product {
  ensureTypedCoreRecords();
  const packed = productCreatePayload(input);
  const result = createInstance({ ...PRODUCT_PARENT, ...packed });
  if (!result.ok) throw new Error(`VALIDATION: ${result.message}`);
  return instanceToProduct(result.instance);
}

export function updateBridgedProduct(id: string, input: UpdateProductInput): Product | null {
  ensureTypedCoreRecords();
  const inst = getInstance(id);
  if (!inst || inst.type_api_name !== PRODUCT_PARENT.type_api_name) return null;
  const packed = productUpdatePayload(inst, input);
  const result = updateInstance(id, packed);
  if (!result.ok) return null;
  return instanceToProduct(result.instance);
}
