/**
 * Fold typed-core project/task/product APIs onto zone record types.
 * Fixture path only: postgres still uses dedicated tables until a record cutover.
 */
import type { Product, Project, Task } from '@/lib/data/types';
import type { CreateProjectInput, CreateTaskInput, ProjectFilters, TaskFilters, UpdateProjectInput, UpdateTaskInput } from '@/lib/data/adapter';
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

const PROJECT_PARENT = {
  type_api_name: 'executive_project',
  parent_kind: 'faculty',
  parent_api_name: 'executive',
} as const;

const TASK_PARENT = {
  type_api_name: 'executive_task',
  parent_kind: 'faculty',
  parent_api_name: 'executive',
} as const;

const PRODUCT_PARENT = {
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

export function instanceToProject(inst: RecordInstance): Project {
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
    taskCount: taskCountFor(inst.id),
  };
}

export function instanceToTask(inst: RecordInstance): Task {
  const project = inst.data.project_id ? getInstance(inst.data.project_id) : undefined;
  return {
    id: inst.id,
    title: inst.name,
    description: inst.data.notes || inst.data.description || '',
    status: taskStatus(inst.status),
    priority: taskPriority(inst.data.priority || 'normal'),
    projectId: inst.data.project_id || '',
    projectName: project?.name || inst.data.project_name || '',
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
    status: (inst.data.status || inst.status || 'available') as Product['status'],
    features: featuresFromData(inst.data.features || ''),
  };
}

export function listBridgedProjects(filters?: ProjectFilters): Project[] {
  ensureTypedCoreRecords();
  let rows = listInstances({
    type_api_name: PROJECT_PARENT.type_api_name,
    parent_kind: PROJECT_PARENT.parent_kind,
    parent_api_name: PROJECT_PARENT.parent_api_name,
  }).map(instanceToProject);
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
  return instanceToProject(inst);
}

export function createBridgedProject(input: CreateProjectInput): Project {
  ensureTypedCoreRecords();
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
  const result = createInstance({
    ...PROJECT_PARENT,
    name,
    status,
    data: {
      description: input.description ?? '',
      priority,
      owner_id: input.ownerUserId ?? '',
      start_date: input.startDate ?? '',
      target_date: input.targetDate ?? '',
    },
  });
  if (!result.ok) throw new Error(`VALIDATION: ${result.message}`);
  return instanceToProject(result.instance);
}

export function updateBridgedProject(id: string, input: UpdateProjectInput): Project | null {
  ensureTypedCoreRecords();
  const inst = getInstance(id);
  if (!inst || inst.type_api_name !== PROJECT_PARENT.type_api_name) return null;
  const data = { ...inst.data };
  if (input.description !== undefined) data.description = input.description;
  if (input.priority !== undefined) {
    if (!['low', 'normal', 'high'].includes(input.priority)) {
      throw new Error('VALIDATION: invalid priority');
    }
    data.priority = input.priority;
  }
  if (input.ownerUserId !== undefined) data.owner_id = input.ownerUserId;
  if (input.startDate !== undefined) data.start_date = input.startDate ?? '';
  if (input.targetDate !== undefined) data.target_date = input.targetDate ?? '';
  if (input.name !== undefined && !input.name.trim()) {
    throw new Error('VALIDATION: name cannot be empty');
  }
  if (input.status !== undefined && !['active', 'paused', 'completed', 'archived'].includes(input.status)) {
    throw new Error('VALIDATION: invalid status');
  }
  const result = updateInstance(id, {
    name: input.name,
    status: input.status,
    data,
  });
  if (!result.ok) return null;
  return instanceToProject(result.instance);
}

export function listBridgedTasks(filters?: TaskFilters): Task[] {
  ensureTypedCoreRecords();
  let rows = listInstances({
    type_api_name: TASK_PARENT.type_api_name,
    parent_kind: TASK_PARENT.parent_kind,
    parent_api_name: TASK_PARENT.parent_api_name,
  }).map(instanceToTask);
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
  return instanceToTask(inst);
}

export function createBridgedTask(input: CreateTaskInput): Task {
  ensureTypedCoreRecords();
  const title = (input.title || '').trim();
  if (!title) throw new Error('VALIDATION: title is required');
  if (!input.projectId) throw new Error('VALIDATION: projectId is required');
  const project = getBridgedProject(input.projectId);
  if (!project) throw new Error('VALIDATION: projectId does not reference an existing project');
  const status = input.status ?? 'planned';
  const priority = input.priority ?? 'normal';
  if (!['planned', 'in_progress', 'waiting', 'blocked', 'done'].includes(status)) {
    throw new Error('VALIDATION: invalid status');
  }
  if (!['low', 'normal', 'high', 'urgent'].includes(priority)) {
    throw new Error('VALIDATION: invalid priority');
  }
  const now = new Date().toISOString();
  const result = createInstance({
    ...TASK_PARENT,
    name: title,
    status,
    data: {
      notes: input.description ?? '',
      priority,
      project_id: input.projectId,
      project_name: project.name,
      assignee_id: input.assigneeUserId ?? '',
      due_date: input.dueDate ?? '',
      updated_at: now,
    },
  });
  if (!result.ok) throw new Error(`VALIDATION: ${result.message}`);
  return instanceToTask(result.instance);
}

export function updateBridgedTask(id: string, input: UpdateTaskInput): Task | null {
  ensureTypedCoreRecords();
  const inst = getInstance(id);
  if (!inst || inst.type_api_name !== TASK_PARENT.type_api_name) return null;
  const data = { ...inst.data };
  if (input.description !== undefined) data.notes = input.description;
  if (input.priority !== undefined) {
    if (!['low', 'normal', 'high', 'urgent'].includes(input.priority)) {
      throw new Error('VALIDATION: invalid priority');
    }
    data.priority = input.priority;
  }
  if (input.projectId !== undefined) {
    const project = getBridgedProject(input.projectId);
    if (!project) throw new Error('VALIDATION: projectId does not reference an existing project');
    data.project_id = input.projectId;
    data.project_name = project.name;
  }
  if (input.assigneeUserId !== undefined) data.assignee_id = input.assigneeUserId;
  if (input.dueDate !== undefined) data.due_date = input.dueDate ?? '';
  data.updated_at = new Date().toISOString();
  if (input.title !== undefined && !input.title.trim()) {
    throw new Error('VALIDATION: title cannot be empty');
  }
  if (input.status !== undefined && !['planned', 'in_progress', 'waiting', 'blocked', 'done'].includes(input.status)) {
    throw new Error('VALIDATION: invalid status');
  }
  const result = updateInstance(id, {
    name: input.title,
    status: input.status,
    data,
  });
  if (!result.ok) return null;
  return instanceToTask(result.instance);
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
