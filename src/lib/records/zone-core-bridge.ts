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
import { products as productFixtures } from '@/lib/fixtures/products';
import {
  TASK_LINE_GROUP,
  assertParent,
  assertTaskStatus,
  isOverdue,
  projectTaskLines,
  tasksFromProject,
  type TaskLine,
} from '@/lib/records/project-task-lines';
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

function projectPriority(value: string): Project['priority'] {
  return ['low', 'normal', 'high'].includes(value) ? (value as Project['priority']) : 'normal';
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

export function taskLineData(input: {
  title?: string;
  description?: string;
  status?: string;
  assigneeUserId?: string;
  assigneeName?: string;
  dueDate?: string | null;
  percentComplete?: number | null;
  parentId?: string;
}, current?: Record<string, string>): Record<string, string> {
  const data = { ...(current ?? {}) };
  if (input.title !== undefined) {
    const title = input.title.trim();
    if (!title) throw new Error('VALIDATION: title is required');
    data.task_title = title;
  }
  if (input.description !== undefined) data.task_notes = input.description;
  if (input.status !== undefined) data.task_status = assertTaskStatus(input.status);
  if (input.assigneeUserId !== undefined) data.task_assignee_id = input.assigneeUserId;
  if (input.assigneeName !== undefined) data.task_assignee_name = input.assigneeName;
  if (input.dueDate !== undefined) data.task_due_date = dateField(input.dueDate);
  if (input.percentComplete !== undefined) {
    if (input.percentComplete != null && (input.percentComplete < 0 || input.percentComplete > 100)) {
      throw new Error('VALIDATION: percent must be from 0 to 100');
    }
    data.task_percent = input.percentComplete == null ? '' : String(input.percentComplete);
  }
  if (input.parentId !== undefined) data.task_parent_id = input.parentId;
  return data;
}

export function writeTaskLines(inst: RecordInstance, lines: TaskLine[]) {
  const others = (inst.lines ?? []).filter((line) => (line.line_group || '') !== TASK_LINE_GROUP);
  return [
    ...others.map((line) => ({ id: line.id, line_group: line.line_group, data: line.data })),
    ...lines.map((line) => ({ id: line.id, line_group: TASK_LINE_GROUP, data: line.data })),
  ];
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

function taskCountFor(inst: RecordInstance): number {
  return projectTaskLines(inst).length;
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
  }).map((inst) => instanceToProject(inst, taskCountFor(inst)));
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
  return { ...instanceToProject(inst, taskCountFor(inst)), tasks: tasksFromProject(inst) };
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
  return instanceToProject(result.instance, taskCountFor(result.instance));
}

function projectInstances(): RecordInstance[] {
  return listInstances({
    type_api_name: PROJECT_PARENT.type_api_name,
    parent_kind: PROJECT_PARENT.parent_kind,
    parent_api_name: PROJECT_PARENT.parent_api_name,
  });
}

function findTaskProject(taskId: string): RecordInstance | undefined {
  return projectInstances().find((project) => projectTaskLines(project).some((line) => line.id === taskId));
}

export function listBridgedTasks(filters?: TaskFilters): Task[] {
  ensureTypedCoreRecords();
  const today = new Date().toISOString().slice(0, 10);
  let rows = projectInstances().flatMap((project) => tasksFromProject(project));
  if (filters?.status) rows = rows.filter((row) => row.status === filters.status);
  if (filters?.projectId) rows = rows.filter((row) => row.projectId === filters.projectId);
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
  if (filters?.overdue) {
    rows = rows.filter((row) => {
      const project = getInstance(row.projectId);
      const line = project ? projectTaskLines(project).find((item) => item.id === row.id) : undefined;
      return line ? isOverdue(line, today) : false;
    });
  }
  return rows;
}

export function getBridgedTask(id: string): Task | null {
  ensureTypedCoreRecords();
  const project = findTaskProject(id);
  if (!project) return null;
  return tasksFromProject(project).find((task) => task.id === id) ?? null;
}

export function createBridgedTask(input: CreateTaskInput): Task {
  ensureTypedCoreRecords();
  if (!input.projectId) throw new Error('VALIDATION: projectId is required');
  const project = getInstance(input.projectId);
  if (!project || project.type_api_name !== PROJECT_PARENT.type_api_name) {
    throw new Error('VALIDATION: projectId does not reference an existing project');
  }
  const lines = projectTaskLines(project);
  const id = `task-${Date.now().toString(36)}-${lines.length + 1}`;
  const data = taskLineData({ ...input, status: input.status ?? 'todo', parentId: input.parentId ?? '' });
  if (!data.task_title) throw new Error('VALIDATION: title is required');
  const next = [...lines, { id, data }];
  assertParent(next, id, data.task_parent_id || '');
  const result = updateInstance(project.id, { lines: writeTaskLines(project, next) });
  if (!result.ok) throw new Error(`VALIDATION: ${result.message}`);
  return tasksFromProject(result.instance).find((task) => task.id === id)!;
}

export function updateBridgedTask(id: string, input: UpdateTaskInput): Task | null {
  ensureTypedCoreRecords();
  const project = findTaskProject(id);
  if (!project) return null;
  const lines = projectTaskLines(project);
  const current = lines.find((line) => line.id === id);
  if (!current) return null;
  const data = taskLineData(input, current.data);
  const next = lines.map((line) => (line.id === id ? { ...line, data } : line));
  assertParent(next, id, data.task_parent_id || '');
  const result = updateInstance(project.id, { lines: writeTaskLines(project, next) });
  if (!result.ok) return null;
  return tasksFromProject(result.instance).find((task) => task.id === id) ?? null;
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
