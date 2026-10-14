/**
 * Postgres path for the typed-core fold: projects / tasks / products are
 * executive_project (task lines) / production_product rows in `record`.
 * Leftover dedicated-table rows are copied once (same ids) then left unused.
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
import { getDb } from '@/lib/db/client';
import {
  createRecordDb,
  getRecordDb,
  listRecordsDb,
  updateRecordDb,
} from '@/lib/db/records-store';
import {
  products as productsTable,
  projects as projectsTable,
  users as usersTable,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  instanceToProduct,
  instanceToProject,
  PRODUCT_PARENT,
  PROJECT_PARENT,
  productCreatePayload,
  productUpdatePayload,
  projectCreatePayload,
  projectUpdatePayload,
  taskLineData,
  writeTaskLines,
} from '@/lib/records/zone-core-bridge';
import {
  assertParent,
  projectTaskLines,
  tasksFromProject,
} from '@/lib/records/project-task-lines';
import type { RecordInstance } from '@/lib/fixtures/record-instances';

let migratePromise: Promise<void> | null = null;

function asDateString(value: unknown): string {
  if (value == null) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const text = String(value).trim();
  return text.length >= 10 ? text.slice(0, 10) : text;
}

function featuresFromJson(data: unknown): string[] {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return [];
  const features = (data as Record<string, unknown>).features;
  if (Array.isArray(features)) return features.map((row) => String(row));
  return [];
}

async function copyIfMissing(
  typeApiName: string,
  rows: Array<{
    id: string;
    parent: typeof PROJECT_PARENT | typeof PRODUCT_PARENT;
    name: string;
    status: string;
    orgId?: string;
    data: Record<string, string>;
  }>,
): Promise<void> {
  if (!rows.length) return;
  const existing = await listRecordsDb({ type_api_name: typeApiName });
  const existingIds = new Set(existing.map((row) => row.id));
  for (const row of rows) {
    if (existingIds.has(row.id)) continue;
    const result = await createRecordDb({
      id: row.id,
      ...row.parent,
      org_id: row.orgId,
      name: row.name,
      status: row.status,
      data: row.data,
    });
    if (!result.ok) {
      throw new Error(`Typed-core migrate failed for ${row.id}: ${result.message}`);
    }
  }
}

async function migrateTypedTablesOnce(): Promise<void> {
  const db = getDb();
  const projectRows = await db
    .select({
      project: projectsTable,
      ownerName: usersTable.name,
    })
    .from(projectsTable)
    .leftJoin(usersTable, eq(projectsTable.ownerUserId, usersTable.id));

  await copyIfMissing(
    PROJECT_PARENT.type_api_name,
    projectRows.map((row) => ({
      id: row.project.id,
      parent: PROJECT_PARENT,
      name: row.project.name,
      status: row.project.status,
      orgId: row.project.organizationId,
      data: {
        description: row.project.description ?? '',
        priority: row.project.priority,
        owner_id: row.project.ownerUserId ?? '',
        owner_name: row.ownerName ?? '',
        start_date: asDateString(row.project.startDate),
        target_date: asDateString(row.project.targetDate),
      },
    })),
  );

  const productRows = await db.select().from(productsTable);
  await copyIfMissing(
    PRODUCT_PARENT.type_api_name,
    productRows.map((row) => ({
      id: row.id,
      parent: PRODUCT_PARENT,
      name: row.name,
      status: row.status,
      orgId: row.organizationId,
      data: {
        tagline: row.tagline ?? '',
        description: row.description ?? '',
        category: row.category ?? '',
        features: JSON.stringify(featuresFromJson(row.data)),
        status: row.status,
      },
    })),
  );
}

async function ensureMigrated(): Promise<void> {
  if (!migratePromise) {
    migratePromise = migrateTypedTablesOnce().catch((err) => {
      migratePromise = null;
      throw err;
    });
  }
  await migratePromise;
}

function applyProjectFilters(rows: Project[], filters?: ProjectFilters): Project[] {
  let next = rows;
  if (filters?.status) next = next.filter((row) => row.status === filters.status);
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    next = next.filter(
      (row) => row.name.toLowerCase().includes(q) || row.description.toLowerCase().includes(q),
    );
  }
  return next;
}

function applyTaskFilters(rows: Task[], filters?: TaskFilters): Task[] {
  let next = rows;
  if (filters?.status) next = next.filter((row) => row.status === filters.status);
  if (filters?.projectId) next = next.filter((row) => row.projectId === filters.projectId);
  if (filters?.priority) next = next.filter((row) => row.priority === filters.priority);
  if (filters?.assignee) {
    next = next.filter(
      (row) => row.assigneeUserId === filters.assignee || row.assigneeName === filters.assignee,
    );
  }
  if (filters?.overdue) {
    const today = new Date().toISOString().slice(0, 10);
    next = next.filter((row) => row.dueDate !== '' && row.dueDate < today && row.status !== 'done');
  }
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    next = next.filter(
      (row) => row.title.toLowerCase().includes(q) || row.description.toLowerCase().includes(q),
    );
  }
  return next;
}

async function projectRows(): Promise<RecordInstance[]> {
  return listRecordsDb(PROJECT_PARENT);
}

export async function listPgProjects(filters?: ProjectFilters): Promise<Project[]> {
  await ensureMigrated();
  const rows = await projectRows();
  return applyProjectFilters(
    rows.map((inst) => instanceToProject(inst, projectTaskLines(inst).length)),
    filters,
  );
}

export async function getPgProject(id: string): Promise<Project | null> {
  await ensureMigrated();
  const inst = await getRecordDb(id);
  if (!inst || inst.type_api_name !== PROJECT_PARENT.type_api_name) return null;
  return {
    ...instanceToProject(inst, projectTaskLines(inst).length),
    tasks: tasksFromProject(inst),
  };
}

export async function createPgProject(input: CreateProjectInput): Promise<Project> {
  await ensureMigrated();
  const packed = projectCreatePayload(input);
  const result = await createRecordDb({ ...PROJECT_PARENT, ...packed });
  if (!result.ok) throw new Error(`VALIDATION: ${result.message}`);
  return instanceToProject(result.instance, 0);
}

export async function updatePgProject(
  id: string,
  input: UpdateProjectInput,
): Promise<Project | null> {
  await ensureMigrated();
  const inst = await getRecordDb(id);
  if (!inst || inst.type_api_name !== PROJECT_PARENT.type_api_name) return null;
  const packed = projectUpdatePayload(inst, input);
  const result = await updateRecordDb(id, packed);
  if (!result.ok) return null;
  return instanceToProject(result.instance, projectTaskLines(result.instance).length);
}

export async function listPgTasks(filters?: TaskFilters): Promise<Task[]> {
  await ensureMigrated();
  const rows = await projectRows();
  return applyTaskFilters(rows.flatMap((project) => tasksFromProject(project)), filters);
}

async function findPgTaskProject(taskId: string): Promise<RecordInstance | null> {
  const rows = await projectRows();
  return rows.find((project) => projectTaskLines(project).some((line) => line.id === taskId)) ?? null;
}

export async function getPgTask(id: string): Promise<Task | null> {
  await ensureMigrated();
  const project = await findPgTaskProject(id);
  if (!project) return null;
  return tasksFromProject(project).find((task) => task.id === id) ?? null;
}

export async function createPgTask(input: CreateTaskInput): Promise<Task> {
  await ensureMigrated();
  if (!input.projectId) throw new Error('VALIDATION: projectId is required');
  const project = await getRecordDb(input.projectId);
  if (!project || project.type_api_name !== PROJECT_PARENT.type_api_name) {
    throw new Error('VALIDATION: projectId does not reference an existing project');
  }
  const lines = projectTaskLines(project);
  const id = `task-${Date.now().toString(36)}-${lines.length + 1}`;
  const data = taskLineData({ ...input, status: input.status ?? 'todo', parentId: input.parentId ?? '' });
  if (!data.task_title) throw new Error('VALIDATION: title is required');
  const next = [...lines, { id, data }];
  assertParent(next, id, data.task_parent_id || '');
  const result = await updateRecordDb(project.id, { lines: writeTaskLines(project, next) });
  if (!result.ok) throw new Error(`VALIDATION: ${result.message}`);
  return tasksFromProject(result.instance).find((task) => task.id === id)!;
}

export async function updatePgTask(id: string, input: UpdateTaskInput): Promise<Task | null> {
  await ensureMigrated();
  const project = await findPgTaskProject(id);
  if (!project) return null;
  const lines = projectTaskLines(project);
  const current = lines.find((line) => line.id === id);
  if (!current) return null;
  const data = taskLineData(input, current.data);
  const next = lines.map((line) => (line.id === id ? { ...line, data } : line));
  assertParent(next, id, data.task_parent_id || '');
  const result = await updateRecordDb(project.id, { lines: writeTaskLines(project, next) });
  if (!result.ok) return null;
  return tasksFromProject(result.instance).find((task) => task.id === id) ?? null;
}

export async function listPgProducts(): Promise<Product[]> {
  await ensureMigrated();
  const rows = await listRecordsDb(PRODUCT_PARENT);
  return rows.map(instanceToProduct);
}

export async function getPgProduct(id: string): Promise<Product | null> {
  await ensureMigrated();
  const inst = await getRecordDb(id);
  if (!inst || inst.type_api_name !== PRODUCT_PARENT.type_api_name) return null;
  return instanceToProduct(inst);
}

export async function createPgProduct(input: CreateProductInput): Promise<Product> {
  await ensureMigrated();
  const packed = productCreatePayload(input);
  const result = await createRecordDb({ ...PRODUCT_PARENT, ...packed });
  if (!result.ok) throw new Error(`VALIDATION: ${result.message}`);
  return instanceToProduct(result.instance);
}

export async function updatePgProduct(
  id: string,
  input: UpdateProductInput,
): Promise<Product | null> {
  await ensureMigrated();
  const inst = await getRecordDb(id);
  if (!inst || inst.type_api_name !== PRODUCT_PARENT.type_api_name) return null;
  const packed = productUpdatePayload(inst, input);
  const result = await updateRecordDb(id, packed);
  if (!result.ok) return null;
  return instanceToProduct(result.instance);
}
