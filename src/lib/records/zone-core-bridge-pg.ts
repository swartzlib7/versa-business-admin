/**
 * Postgres path for the typed-core fold: projects / tasks / products are
 * executive_project / executive_task / production_product rows in `record`.
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
  tasks as tasksTable,
  users as usersTable,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  instanceToProduct,
  instanceToProject,
  instanceToTask,
  PRODUCT_PARENT,
  PROJECT_PARENT,
  productCreatePayload,
  productUpdatePayload,
  projectCreatePayload,
  projectUpdatePayload,
  TASK_PARENT,
  taskCreatePayload,
  taskUpdatePayload,
} from '@/lib/records/zone-core-bridge';
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
    parent: typeof PROJECT_PARENT | typeof TASK_PARENT | typeof PRODUCT_PARENT;
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

  const taskRows = await db
    .select({
      task: tasksTable,
      projectName: projectsTable.name,
      assigneeName: usersTable.name,
    })
    .from(tasksTable)
    .leftJoin(projectsTable, eq(tasksTable.projectId, projectsTable.id))
    .leftJoin(usersTable, eq(tasksTable.assigneeUserId, usersTable.id));

  await copyIfMissing(
    TASK_PARENT.type_api_name,
    taskRows.map((row) => ({
      id: row.task.id,
      parent: TASK_PARENT,
      name: row.task.title,
      status: row.task.status,
      orgId: undefined,
      data: {
        notes: row.task.description ?? '',
        priority: row.task.priority,
        project_id: row.task.projectId,
        project_name: row.projectName ?? '',
        assignee_id: row.task.assigneeUserId ?? '',
        assignee_name: row.assigneeName ?? '',
        due_date: asDateString(row.task.dueDate),
        updated_at: row.task.updatedAt?.toISOString?.() ?? '',
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

function taskCounts(taskRows: RecordInstance[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of taskRows) {
    const pid = row.data.project_id;
    if (!pid) continue;
    counts.set(pid, (counts.get(pid) ?? 0) + 1);
  }
  return counts;
}

function projectNames(projectRows: RecordInstance[]): Map<string, string> {
  return new Map(projectRows.map((row) => [row.id, row.name]));
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
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    next = next.filter(
      (row) => row.title.toLowerCase().includes(q) || row.description.toLowerCase().includes(q),
    );
  }
  return next;
}

export async function listPgProjects(filters?: ProjectFilters): Promise<Project[]> {
  await ensureMigrated();
  const [projectRows, taskRows] = await Promise.all([
    listRecordsDb(PROJECT_PARENT),
    listRecordsDb({ type_api_name: TASK_PARENT.type_api_name }),
  ]);
  const counts = taskCounts(taskRows);
  return applyProjectFilters(
    projectRows.map((inst) => instanceToProject(inst, counts.get(inst.id) ?? 0)),
    filters,
  );
}

export async function getPgProject(id: string): Promise<Project | null> {
  await ensureMigrated();
  const inst = await getRecordDb(id);
  if (!inst || inst.type_api_name !== PROJECT_PARENT.type_api_name) return null;
  const taskRows = await listRecordsDb({ type_api_name: TASK_PARENT.type_api_name });
  return instanceToProject(inst, taskCounts(taskRows).get(id) ?? 0);
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
  const taskRows = await listRecordsDb({ type_api_name: TASK_PARENT.type_api_name });
  return instanceToProject(result.instance, taskCounts(taskRows).get(id) ?? 0);
}

export async function listPgTasks(filters?: TaskFilters): Promise<Task[]> {
  await ensureMigrated();
  const [taskRows, projectRows] = await Promise.all([
    listRecordsDb(TASK_PARENT),
    listRecordsDb({ type_api_name: PROJECT_PARENT.type_api_name }),
  ]);
  const names = projectNames(projectRows);
  return applyTaskFilters(
    taskRows.map((inst) => instanceToTask(inst, names.get(inst.data.project_id) ?? '')),
    filters,
  );
}

export async function getPgTask(id: string): Promise<Task | null> {
  await ensureMigrated();
  const inst = await getRecordDb(id);
  if (!inst || inst.type_api_name !== TASK_PARENT.type_api_name) return null;
  const project = inst.data.project_id ? await getRecordDb(inst.data.project_id) : null;
  return instanceToTask(inst, project?.name ?? '');
}

export async function createPgTask(input: CreateTaskInput): Promise<Task> {
  await ensureMigrated();
  const project = await getPgProject(input.projectId);
  if (!project) throw new Error('VALIDATION: projectId does not reference an existing project');
  const packed = taskCreatePayload(input, project.name);
  const result = await createRecordDb({ ...TASK_PARENT, ...packed });
  if (!result.ok) throw new Error(`VALIDATION: ${result.message}`);
  return instanceToTask(result.instance, project.name);
}

export async function updatePgTask(id: string, input: UpdateTaskInput): Promise<Task | null> {
  await ensureMigrated();
  const inst = await getRecordDb(id);
  if (!inst || inst.type_api_name !== TASK_PARENT.type_api_name) return null;
  let projectName: string | undefined;
  if (input.projectId !== undefined) {
    const project = await getPgProject(input.projectId);
    if (!project) throw new Error('VALIDATION: projectId does not reference an existing project');
    projectName = project.name;
  }
  const packed = taskUpdatePayload(inst, input, projectName);
  const result = await updateRecordDb(id, packed);
  if (!result.ok) return null;
  const project = packed.data.project_id ? await getRecordDb(packed.data.project_id) : null;
  return instanceToTask(result.instance, project?.name ?? packed.data.project_name ?? '');
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
