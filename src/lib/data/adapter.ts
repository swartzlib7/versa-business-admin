import type { Agent, Project, Task, Integration, BusinessProfile, Service, Product, StaffMember, User, OtherSystem, SupportTicket, Metric, KnowledgeArticle, Organization, CreateOrganizationInput, UpdateOrganizationInput } from './types';
import type { OrgLineRow } from '@/lib/fixtures/record-instances';
import { listOrgLines, createOrgLine, updateOrgLine, deleteOrgLine } from '@/lib/fixtures/record-instances';
import type { OrgLineRow as OrgLineRowDb } from '@/lib/db/records-store';
// #245 Slice E1 (rev E section 4.2): Horizon 1 record persistence contract.
// Type-only import - the instance shape stays the canonical API contract.
import type {
  CreateInstanceInput,
  CreateInstanceResult,
  RecordInstance,
  UpdateInstanceInput,
  UpdateInstanceResult,
} from '@/lib/fixtures/record-instances';

export interface RecordFilters {
  type_api_name?: string;
  parent_kind?: string;
  parent_api_name?: string;
}

export interface CreateRecordOptions {
  createdBy?: string | null;
}

// ---------------------------------------------------------------------------
// DataAdapter — the modular boundary between route handlers and data sources.
// All route handlers call through this interface. The fixture implementation
// below is the default; a real Versa AGi host adapter can be swapped in later
// without touching route code.
// ---------------------------------------------------------------------------

export interface ProjectFilters {
  status?: string;
  q?: string;
}

export interface TaskFilters {
  status?: string;
  projectId?: string;
  priority?: string;
  assignee?: string;
  q?: string;
}

/** Phase 3 — create user (password optional; hashed only on postgres path). */
export interface CreateUserInput {
  email: string;
  name: string;
  role?: User["role"];
  type?: User["type"];
  status?: User["status"];
  department?: string;
  department_id?: string;
  bio?: string;
  password?: string;
  // #248 Slice D (rev E section 2.5): user-level default organization setting.
  default_organization_id?: string | null;
  data?: Record<string, unknown>;
}

/** Phase 3 — partial update; data JSONB is merged, not replaced. */
export interface UpdateUserInput {
  email?: string;
  name?: string;
  role?: User["role"];
  type?: User["type"];
  status?: User["status"];
  department?: string;
  department_id?: string | null;
  bio?: string;
  password?: string;
  // #248 Slice D (rev E section 2.5): user-level default organization setting.
  default_organization_id?: string | null;
  data?: Record<string, unknown>;
}


/** Phase 3 — create project (admin only). */
export interface CreateProjectInput {
  name: string;
  description?: string;
  status?: Project['status'];
  ownerUserId?: string;
  priority?: Project['priority'];
  startDate?: string | null;
  targetDate?: string | null;
  data?: Record<string, unknown>;
}

/** Phase 3 — partial update; data JSONB is merged, not replaced. */
export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: Project['status'];
  ownerUserId?: string;
  priority?: Project['priority'];
  startDate?: string | null;
  targetDate?: string | null;
  data?: Record<string, unknown>;
}

/** Phase 3 — create task (admin only). */
export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  projectId: string;
  assigneeUserId?: string;
  dueDate?: string | null;
  data?: Record<string, unknown>;
}

/** Phase 3 — partial update; data JSONB is merged, not replaced. */
export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  projectId?: string;
  assigneeUserId?: string;
  dueDate?: string | null;
  data?: Record<string, unknown>;
}

export interface DataAdapter {
  listAgents(status?: string): Promise<Agent[]>;
  getAgent(id: string): Promise<Agent | null>;
  updateAgentStatus?(id: string, status: Agent['status']): Promise<Agent | null>;
  listProjects(filters?: ProjectFilters): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  listTasks(filters?: TaskFilters): Promise<Task[]>;
  getTask(id: string): Promise<Task | null>;
  listIntegrations(status?: string): Promise<Integration[]>;
  // Public site content (I4)
  getBusinessProfile(): Promise<BusinessProfile>;
  listServices(): Promise<Service[]>;
  listProducts(): Promise<Product[]>;
  listStaff(): Promise<StaffMember[]>;
  // Users (I5 + Phase 3 writes)
  listUsers(type?: string): Promise<User[]>;
  getUser(id: string): Promise<User | null>;
  createUser?(input: CreateUserInput): Promise<User>;
  updateUser?(id: string, input: UpdateUserInput): Promise<User | null>;
  // #248 Slice D (rev E section 4.3): organizations CRUD for the Executive
  // organizations list + Collaboration zone rendering (C6).
  listOrganizations?(orgType?: string): Promise<Organization[]>;
  getOrganization?(id: string): Promise<Organization | null>;
  createOrganization?(input: CreateOrganizationInput): Promise<Organization>;
  updateOrganization?(id: string, input: UpdateOrganizationInput): Promise<Organization | null>;
  // #244 Slice F (D1 cutover): org-attached lines (vendor integrations).
  listOrgLines?(organizationId: string, lineGroup: string): Promise<OrgLineRow[]>;
  createOrgLine?(organizationId: string, lineGroup: string, data: Record<string, string>): Promise<OrgLineRow>;
  updateOrgLine?(organizationId: string, lineId: string, lineGroup: string, data: Record<string, string>): Promise<OrgLineRow | null>;
  deleteOrgLine?(organizationId: string, lineId: string, lineGroup: string): Promise<boolean>;
  // Phase 3 — project + task writes
  createProject?(input: CreateProjectInput): Promise<Project>;
  updateProject?(id: string, input: UpdateProjectInput): Promise<Project | null>;
  createTask?(input: CreateTaskInput): Promise<Task>;
  updateTask?(id: string, input: UpdateTaskInput): Promise<Task | null>;
  // Mission Control facets (I5.3)
  listOtherSystems(): Promise<OtherSystem[]>;
  listSupportTickets(): Promise<SupportTicket[]>;
  listMetrics(): Promise<Metric[]>;
  listKnowledgeArticles(): Promise<KnowledgeArticle[]>;
  // #245 Slice E1 (rev E section 4.2): Horizon 1 record persistence. Optional
  // until the postgres path implements it; fixture routes fall back to the
  // in-process record-instances fixture when absent.
  listRecords?(filters?: RecordFilters): Promise<RecordInstance[]>;
  getRecord?(id: string): Promise<RecordInstance | null>;
  createRecord?(
    input: CreateInstanceInput,
    opts?: CreateRecordOptions,
  ): Promise<CreateInstanceResult>;
  updateRecord?(id: string, input: UpdateInstanceInput): Promise<UpdateInstanceResult>;
  deleteRecord?(id: string): Promise<boolean>;
  // Phase 1: DB health check
  healthCheck(): Promise<{ connected: boolean; latencyMs?: number; error?: string }>;
}

// ---------------------------------------------------------------------------
// Fixture-backed implementation
// ---------------------------------------------------------------------------

import { agents as agentFixtures } from '@/lib/fixtures/agents';
import { projects as projectFixtures } from '@/lib/fixtures/projects';
import { tasks as taskFixtures } from '@/lib/fixtures/tasks';
import { integrations as integrationFixtures } from '@/lib/fixtures/integrations';
import { business as businessFixture } from '@/lib/fixtures/business';
import { services as serviceFixtures } from '@/lib/fixtures/services';
import { products as productFixtures } from '@/lib/fixtures/products';
import { staff as staffFixtures } from '@/lib/fixtures/staff';
import { users as userFixtures } from '@/lib/fixtures/users';
import { otherSystems as otherSystemFixtures } from '@/lib/fixtures/other-systems';
import { supportTickets as supportTicketFixtures } from '@/lib/fixtures/support-tickets';
import { metrics as metricFixtures } from '@/lib/fixtures/metrics';
import { knowledgeArticles as knowledgeArticleFixtures } from '@/lib/fixtures/knowledge-articles';

// Mutable copies so the optional PATCH can mutate in-process state.
let mutableAgents: Agent[] = [...agentFixtures];
let mutableProjects: Project[] = [...projectFixtures];
let mutableTasks: Task[] = [...taskFixtures];
const mutableUsers = userFixtures.map((u) => ({ ...u, data: u.data ? { ...u.data } : {} }));

// Slice F latent-bug repair: fixtureAdapter had NO organizations methods, so
// /api/organizations returned 501 in fixture mode (what beta :3200 runs) and
// the collab org-type tabs + Executive organizations list were dead. In-memory
// store mirrors the postgres-adapter shape (Slice D rev E section 4.3).
let orgSeq = 0;
const mutableOrganizations: Organization[] = [
  { id: "org-fixture-1", name: "Sample Maker Workspace", is_person: false, org_type: "internal", parent_organization_id: null, data: {} },
  { id: "org-fixture-v1", name: "Acme Cloud Services", is_person: false, org_type: "vendor", parent_organization_id: null, data: {} },
  { id: "org-fixture-c1", name: "Northwind Retail", is_person: false, org_type: "customer", parent_organization_id: null, data: {} },
  { id: "org-fixture-p1", name: "Bright Channel Partners", is_person: false, org_type: "partner", parent_organization_id: null, data: {} },
  { id: "org-fixture-b1", name: "Riverside Branch", is_person: false, org_type: "branch", parent_organization_id: null, data: {} },
];
const ORG_TYPES = ["vendor", "customer", "partner", "branch", "internal"];


export function resetAgents(): void {
  mutableAgents = [...agentFixtures];
}

export function resetProjects(): void {
  mutableProjects = [...projectFixtures];
}

export function resetTasks(): void {
  mutableTasks = [...taskFixtures];
}

export const fixtureAdapter: DataAdapter = {
  // --- Organizations (Slice F latent-bug repair, rev E section 4.3) ---
  async listOrganizations(orgType?: string): Promise<Organization[]> {
    let result = mutableOrganizations;
    if (orgType) result = result.filter((o) => o.org_type === orgType);
    return result;
  },

  async getOrganization(id: string): Promise<Organization | null> {
    return mutableOrganizations.find((o) => o.id === id) ?? null;
  },

  async createOrganization(input: CreateOrganizationInput): Promise<Organization> {
    const name = (input.name ?? "").trim();
    if (!name) throw new Error("VALIDATION: name cannot be empty");
    const orgType = input.org_type ?? "internal";
    if (!ORG_TYPES.includes(orgType)) throw new Error("VALIDATION: invalid org_type");
    if (input.parent_organization_id) {
      const parent = mutableOrganizations.find((o) => o.id === input.parent_organization_id);
      if (!parent) throw new Error("VALIDATION: parent_organization_id does not reference an existing organization");
    }
    orgSeq += 1;
    const org: Organization = {
      id: "org-fixture-" + String(orgSeq),
      name,
      is_person: input.is_person ?? false,
      org_type: orgType,
      parent_organization_id: input.parent_organization_id ?? null,
      data: input.data ?? {},
    };
    mutableOrganizations.push(org);
    return { ...org };
  },

  async updateOrganization(id: string, input: UpdateOrganizationInput): Promise<Organization | null> {
    const org = mutableOrganizations.find((o) => o.id === id);
    if (!org) return null;
    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) throw new Error("VALIDATION: name cannot be empty");
      org.name = name;
    }
    if (input.is_person !== undefined) org.is_person = input.is_person;
    if (input.org_type !== undefined) {
      if (!ORG_TYPES.includes(input.org_type)) throw new Error("VALIDATION: invalid org_type");
      org.org_type = input.org_type;
    }
    if (input.parent_organization_id !== undefined) {
      if (input.parent_organization_id !== null) {
        if (input.parent_organization_id === id) throw new Error("VALIDATION: organization cannot be its own parent");
        const parent = mutableOrganizations.find((o) => o.id === input.parent_organization_id);
        if (!parent) throw new Error("VALIDATION: parent_organization_id does not reference an existing organization");
      }
      org.parent_organization_id = input.parent_organization_id;
    }
    if (input.data) {
      const data = { ...(org.data ?? {}) };
      Object.assign(data, input.data);
      org.data = data;
    }
    return { ...org };
  },

  // --- Org-attached lines (Slice F D1 cutover, fixture path) ---
  async listOrgLines(organizationId: string, lineGroup: string): Promise<OrgLineRow[]> {
    return listOrgLines(organizationId, lineGroup);
  },

  async createOrgLine(organizationId: string, lineGroup: string, data: Record<string, string>): Promise<OrgLineRow> {
    const org = mutableOrganizations.find((o) => o.id === organizationId);
    if (!org) throw new Error('VALIDATION: organization not found');
    return createOrgLine(organizationId, lineGroup, data);
  },

  async updateOrgLine(organizationId: string, lineId: string, lineGroup: string, data: Record<string, string>): Promise<OrgLineRow | null> {
    return updateOrgLine(organizationId, lineId, lineGroup, data);
  },

  async deleteOrgLine(organizationId: string, lineId: string, lineGroup: string): Promise<boolean> {
    return deleteOrgLine(organizationId, lineId, lineGroup);
  },
  async listAgents(status?: string) {
    let result = mutableAgents;
    if (status) {
      result = result.filter((a) => a.status === status);
    }
    return result;
  },

  async getAgent(id: string) {
    return mutableAgents.find((a) => a.id === id) ?? null;
  },

  async updateAgentStatus(id: string, status: Agent['status']) {
    const agent = mutableAgents.find((a) => a.id === id);
    if (!agent) return null;
    agent.status = status;
    return { ...agent };
  },

  async listProjects(filters?: ProjectFilters) {
    let result = mutableProjects;
    if (filters?.status) {
      result = result.filter((p) => p.status === filters.status);
    }
    if (filters?.q) {
      const q = filters.q.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
      );
    }
    return result;
  },

  async getProject(id: string) {
    return mutableProjects.find((p) => p.id === id) ?? null;
  },

  async listTasks(filters?: TaskFilters) {
    let result = mutableTasks;
    if (filters?.status) {
      result = result.filter((t) => t.status === filters.status);
    }
    if (filters?.projectId) {
      result = result.filter((t) => t.projectId === filters.projectId);
    }
    if (filters?.priority) {
      result = result.filter((t) => t.priority === filters.priority);
    }
    if (filters?.assignee) {
      result = result.filter(
        (t) => t.assigneeUserId === filters.assignee || t.assigneeName === filters.assignee,
      );
    }
    if (filters?.q) {
      const q = filters.q.toLowerCase();
      result = result.filter(
        (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
      );
    }
    return result;
  },

  async getTask(id: string) {
    return mutableTasks.find((t) => t.id === id) ?? null;
  },

  async listIntegrations(status?: string) {
    let result = integrationFixtures;
    if (status) {
      result = result.filter((i) => i.status === status);
    }
    return result;
  },

  async getBusinessProfile() {
    return businessFixture;
  },

  async listServices() {
    return serviceFixtures;
  },

  async listProducts() {
    return productFixtures;
  },

  async listStaff() {
    return staffFixtures;
  },

  async listUsers(type?: string) {
    let result = mutableUsers.map(({ password, ...u }) => u);
    if (type) {
      result = result.filter((u) => u.type === type);
    }
    return result;
  },

  async getUser(id: string) {
    const found = mutableUsers.find((u) => u.id === id);
    if (!found) return null;
    const { password, ...user } = found;
    return user;
  },

  async createUser(input: CreateUserInput) {
    const email = (input.email || "").trim().toLowerCase();
    const name = (input.name || "").trim();
    if (!email || !name) {
      throw new Error("VALIDATION: email and name are required");
    }
    if (mutableUsers.some((u) => u.email.toLowerCase() === email)) {
      throw new Error("CONFLICT: email already exists");
    }
    const role = input.role ?? "member";
    const type = input.type ?? "human";
    const status = input.status ?? "active";
    if (!["admin", "member"].includes(role)) throw new Error("VALIDATION: invalid role");
    if (!["human", "agent"].includes(type)) throw new Error("VALIDATION: invalid type");
    if (!["active", "inactive"].includes(status)) throw new Error("VALIDATION: invalid status");
    const id = `user-${Date.now().toString(36)}`;
    const data = { ...(input.data ?? {}) };
    if (input.bio !== undefined) data.bio = input.bio;
    if (input.department) data.department = input.department;
    const row = {
      id,
      email,
      name,
      role,
      type,
      status,
      department: input.department ?? (typeof data.department === "string" ? data.department : ""),
      department_id: input.department_id,
      bio: input.bio ?? (typeof data.bio === "string" ? String(data.bio) : ""),
      password: input.password ?? "changeme",
      data,
    };
    mutableUsers.push(row);
    const { password: _p, ...user } = row;
    return user;
  },

  async updateUser(id: string, input: UpdateUserInput) {
    const idx = mutableUsers.findIndex((u) => u.id === id);
    if (idx < 0) return null;
    const cur = mutableUsers[idx];
    if (input.email !== undefined) {
      const email = input.email.trim().toLowerCase();
      if (!email) throw new Error("VALIDATION: email cannot be empty");
      if (mutableUsers.some((u) => u.id !== id && u.email.toLowerCase() === email)) {
        throw new Error("CONFLICT: email already exists");
      }
      cur.email = email;
    }
    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) throw new Error("VALIDATION: name cannot be empty");
      cur.name = name;
    }
    if (input.role !== undefined) {
      if (!["admin", "member"].includes(input.role)) throw new Error("VALIDATION: invalid role");
      cur.role = input.role;
    }
    if (input.type !== undefined) {
      if (!["human", "agent"].includes(input.type)) throw new Error("VALIDATION: invalid type");
      cur.type = input.type;
    }
    if (input.status !== undefined) {
      if (!["active", "inactive"].includes(input.status)) throw new Error("VALIDATION: invalid status");
      cur.status = input.status;
    }
    if (input.department !== undefined) cur.department = input.department;
    if (input.department_id !== undefined) cur.department_id = input.department_id ?? undefined;
    if (input.password !== undefined) cur.password = input.password;
    const data = { ...(cur.data ?? {}) };
    if (input.data) Object.assign(data, input.data);
    if (input.bio !== undefined) {
      cur.bio = input.bio;
      data.bio = input.bio;
    }
    if (input.department !== undefined) data.department = input.department;
    cur.data = data;
    mutableUsers[idx] = cur;
    const { password: _p, ...user } = cur;
    return user;
  },


  async createProject(input: CreateProjectInput) {
    const name = (input.name || '').trim();
    if (!name) throw new Error('VALIDATION: name is required');
    const status = input.status ?? 'active';
    const priority = input.priority ?? 'normal';
    if (!['active', 'paused', 'completed', 'archived'].includes(status)) throw new Error('VALIDATION: invalid status');
    if (!['low', 'normal', 'high'].includes(priority)) throw new Error('VALIDATION: invalid priority');
    const id = 'proj-' + Date.now().toString(36);
    const project: Project = {
      id,
      name,
      description: input.description ?? '',
      status,
      ownerUserId: input.ownerUserId ?? '',
      ownerName: mutableUsers.find((u) => u.id === input.ownerUserId)?.name ?? '',
      priority,
      startDate: input.startDate ?? null,
      targetDate: input.targetDate ?? null,
      taskCount: 0,
    };
    mutableProjects.push(project);
    return { ...project };
  },

  async updateProject(id: string, input: UpdateProjectInput) {
    const idx = mutableProjects.findIndex((p) => p.id === id);
    if (idx < 0) return null;
    const cur = mutableProjects[idx];
    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) throw new Error('VALIDATION: name cannot be empty');
      cur.name = name;
    }
    if (input.description !== undefined) cur.description = input.description;
    if (input.status !== undefined) {
      if (!['active', 'paused', 'completed', 'archived'].includes(input.status)) throw new Error('VALIDATION: invalid status');
      cur.status = input.status;
    }
    if (input.priority !== undefined) {
      if (!['low', 'normal', 'high'].includes(input.priority)) throw new Error('VALIDATION: invalid priority');
      cur.priority = input.priority;
    }
    if (input.ownerUserId !== undefined) {
      cur.ownerUserId = input.ownerUserId;
      cur.ownerName = mutableUsers.find((u) => u.id === input.ownerUserId)?.name ?? '';
    }
    if (input.startDate !== undefined) cur.startDate = input.startDate;
    if (input.targetDate !== undefined) cur.targetDate = input.targetDate;
    mutableProjects[idx] = cur;
    return { ...cur };
  },

  async createTask(input: CreateTaskInput) {
    const title = (input.title || '').trim();
    if (!title) throw new Error('VALIDATION: title is required');
    if (!input.projectId) throw new Error('VALIDATION: projectId is required');
    const status = input.status ?? 'planned';
    const priority = input.priority ?? 'normal';
    if (!['planned', 'in_progress', 'waiting', 'blocked', 'done'].includes(status)) throw new Error('VALIDATION: invalid status');
    if (!['low', 'normal', 'high', 'urgent'].includes(priority)) throw new Error('VALIDATION: invalid priority');
    const project = mutableProjects.find((p) => p.id === input.projectId);
    if (!project) throw new Error('VALIDATION: projectId does not reference an existing project');
    const id = 'task-' + Date.now().toString(36);
    const now = new Date().toISOString();
    const assignee = mutableUsers.find((u) => u.id === input.assigneeUserId);
    const task: Task = {
      id,
      title,
      description: input.description ?? '',
      status,
      priority,
      projectId: input.projectId,
      projectName: project.name,
      assigneeUserId: input.assigneeUserId ?? '',
      assigneeName: assignee?.name ?? '',
      dueDate: input.dueDate ?? '',
      createdAt: now,
      updatedAt: now,
    };
    mutableTasks.push(task);
    project.taskCount = mutableTasks.filter((t) => t.projectId === project.id).length;
    return { ...task };
  },

  async updateTask(id: string, input: UpdateTaskInput) {
    const idx = mutableTasks.findIndex((t) => t.id === id);
    if (idx < 0) return null;
    const cur = mutableTasks[idx];
    if (input.title !== undefined) {
      const title = input.title.trim();
      if (!title) throw new Error('VALIDATION: title cannot be empty');
      cur.title = title;
    }
    if (input.description !== undefined) cur.description = input.description;
    if (input.status !== undefined) {
      if (!['planned', 'in_progress', 'waiting', 'blocked', 'done'].includes(input.status)) throw new Error('VALIDATION: invalid status');
      cur.status = input.status;
    }
    if (input.priority !== undefined) {
      if (!['low', 'normal', 'high', 'urgent'].includes(input.priority)) throw new Error('VALIDATION: invalid priority');
      cur.priority = input.priority;
    }
    if (input.projectId !== undefined) {
      const project = mutableProjects.find((p) => p.id === input.projectId);
      if (!project) throw new Error('VALIDATION: projectId does not reference an existing project');
      cur.projectId = input.projectId;
      cur.projectName = project.name;
    }
    if (input.assigneeUserId !== undefined) {
      cur.assigneeUserId = input.assigneeUserId;
      cur.assigneeName = mutableUsers.find((u) => u.id === input.assigneeUserId)?.name ?? '';
    }
    if (input.dueDate !== undefined) cur.dueDate = input.dueDate ?? '';
    cur.updatedAt = new Date().toISOString();
    mutableTasks[idx] = cur;
    return { ...cur };
  },

  // --- Mission Control facets (I5.3) ---

  async listOtherSystems() {
    return otherSystemFixtures;
  },

  async listSupportTickets() {
    return supportTicketFixtures;
  },

  async listMetrics() {
    return metricFixtures;
  },

  async listKnowledgeArticles() {
    return knowledgeArticleFixtures;
  },

  async healthCheck() {
    // Fixtures are always "connected" — no DB dependency.
    return { connected: true, latencyMs: 0 };
  },
};

// ---------------------------------------------------------------------------
// DATA_SOURCE switch — fixture (default) or postgres (Phase 1 skeleton).
// When DATA_SOURCE=postgres, the postgresAdapter skeleton is used.
// All postgresAdapter methods throw NOT_IMPLEMENTED except healthCheck.
// The app must not crash when DB is down — fixture remains the fallback.
// ---------------------------------------------------------------------------

// When DATA_SOURCE=postgres, the postgresAdapter skeleton is used.
// All postgresAdapter methods throw NOT_IMPLEMENTED except healthCheck.
// The app must not crash when DB is down — fixture remains the fallback.
// ---------------------------------------------------------------------------

// Use a getter so the postgres adapter is only imported when needed.
// Next.js bundling: dynamic import would be ideal but adapter is used
// synchronously in route handlers. We use a conditional re-export pattern.
import { postgresAdapter } from '../db/postgres-adapter';
import {
  createOrgLineDb,
  createRecordDb,
  deleteRecordDb,
  getRecordDb,
  deleteOrgLineDb,
  listOrgLinesDb,
  listRecordsDb,
  updateOrgLineDb,
  updateRecordDb,
} from '../db/records-store';

function createAdapter(): DataAdapter {
  const dataSource = process.env.DATA_SOURCE ?? "fixture";

  if (dataSource !== "postgres") {
    return fixtureAdapter;
  }

  // Phase 2 pilot: User read + health from Postgres; everything else stays fixture
  // so public pages and hub keep working. Flip remaining resources in later phases.
  return {
    ...fixtureAdapter,
    listUsers: (type?: string) => postgresAdapter.listUsers(type),
    getUser: (id: string) => postgresAdapter.getUser(id),
    createUser: (input) => {
      if (!postgresAdapter.createUser) throw new Error("createUser not available");
      return postgresAdapter.createUser(input);
    },
    updateUser: (id, input) => {
      if (!postgresAdapter.updateUser) throw new Error("updateUser not available");
      return postgresAdapter.updateUser(id, input);
    },
    listProjects: (filters?: ProjectFilters) => postgresAdapter.listProjects(filters),
    getProject: (id: string) => postgresAdapter.getProject(id),
    listTasks: (filters?: TaskFilters) => postgresAdapter.listTasks(filters),
    getTask: (id: string) => postgresAdapter.getTask(id),
    listProducts: () => postgresAdapter.listProducts(),
    listIntegrations: (status?: string) => postgresAdapter.listIntegrations(status),
    listStaff: () => postgresAdapter.listStaff(),
    getBusinessProfile: () => postgresAdapter.getBusinessProfile(),
    listAgents: (status?: string) => postgresAdapter.listAgents(status),
    getAgent: (id: string) => postgresAdapter.getAgent(id),
    createProject: (input) => {
      if (!postgresAdapter.createProject) throw new Error('createProject not available');
      return postgresAdapter.createProject(input);
    },
    updateProject: (id, input) => {
      if (!postgresAdapter.updateProject) throw new Error('updateProject not available');
      return postgresAdapter.updateProject(id, input);
    },
    createTask: (input) => {
      if (!postgresAdapter.createTask) throw new Error('createTask not available');
      return postgresAdapter.createTask(input);
    },
    updateTask: (id, input) => {
      if (!postgresAdapter.updateTask) throw new Error('updateTask not available');
      return postgresAdapter.updateTask(id, input);
    },
    healthCheck: () => postgresAdapter.healthCheck(),
    // #245 Slice E1: Horizon 1 record persistence (record_type/record/record_line).
    listOrgLines: (organizationId: string, lineGroup: string) => listOrgLinesDb(organizationId, lineGroup),
    createOrgLine: async (organizationId: string, lineGroup: string, data: Record<string, string>) => {
      const res = await createOrgLineDb(organizationId, lineGroup, data);
      if (!res.ok) throw new Error(res.message);
      return res.line;
    },
    updateOrgLine: async (organizationId: string, lineId: string, lineGroup: string, data: Record<string, string>) => {
      const res = await updateOrgLineDb(organizationId, lineId, lineGroup, data);
      return res.ok ? res.line : null;
    },
    deleteOrgLine: (organizationId: string, lineId: string, lineGroup: string) => deleteOrgLineDb(organizationId, lineId, lineGroup),
    listRecords: (filters?: RecordFilters) => listRecordsDb(filters ?? {}),
    getRecord: (id: string) => getRecordDb(id),
    createRecord: (input, opts) => createRecordDb(input, opts),
    updateRecord: (id, input) => updateRecordDb(id, input),
    deleteRecord: (id: string) => deleteRecordDb(id),
  };
}

export const adapter: DataAdapter = createAdapter();
