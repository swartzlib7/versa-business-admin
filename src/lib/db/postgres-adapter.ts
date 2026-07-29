// Postgres adapter — Phase 2 User pilot + Phase 3 writes + Phase 4 reads.
// All methods implemented. Behind DATA_SOURCE=postgres. Fixture default stays safe.

import type { DataAdapter, ProjectFilters, TaskFilters, CreateUserInput, UpdateUserInput, CreateProjectInput, UpdateProjectInput, CreateTaskInput, UpdateTaskInput } from "../data/adapter";
import type {
  Agent,
  Project,
  Task,
  Integration,
  BusinessProfile,
  Service,
  Product,
  StaffMember,
  User,
  OtherSystem,
  SupportTicket,
  Metric,
  KnowledgeArticle,
} from "../data/types";
import { healthCheck as dbHealthCheck, getDb } from "./client";
import {
  users as usersTable,
  departments as departmentsTable,
  organizations as organizationsTable,
  projects as projectsTable,
  tasks as tasksTable,
  products as productsTable,
  integrations as integrationsTable,
} from "./schema";
import { eq, and, ilike, or, count } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

function mapUserRow(
  row: typeof usersTable.$inferSelect,
  deptName?: string | null,
): User {
  const data = (row.data ?? {}) as Record<string, unknown>;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as User["role"],
    type: row.type as User["type"],
    department:
      deptName ||
      (typeof data.department === "string" ? data.department : ""),
    department_id: row.departmentId ?? undefined,
    bio: typeof data.bio === "string" ? data.bio : "",
    status: row.status as User["status"],
    data,
  };
}

function mapProjectRow(
  row: typeof projectsTable.$inferSelect,
  ownerName?: string | null,
  taskCount?: number,
): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status as Project["status"],
    ownerUserId: row.ownerUserId ?? "",
    ownerName: ownerName ?? "",
    priority: row.priority as Project["priority"],
    startDate: row.startDate ?? null,
    targetDate: row.targetDate ?? null,
    taskCount: taskCount ?? 0,
  };
}

function mapTaskRow(
  row: typeof tasksTable.$inferSelect,
  projectName?: string | null,
  assigneeName?: string | null,
): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status as Task["status"],
    priority: row.priority as Task["priority"],
    projectId: row.projectId,
    projectName: projectName ?? "",
    assigneeUserId: row.assigneeUserId ?? "",
    assigneeName: assigneeName ?? "",
    dueDate: row.dueDate ?? "",
    createdAt: row.createdAt?.toISOString() ?? "",
    updatedAt: row.updatedAt?.toISOString() ?? "",
  };
}

function mapProductRow(row: typeof productsTable.$inferSelect): Product {
  const data = (row.data ?? {}) as Record<string, unknown>;
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    kind: row.kind ?? "",
    status: row.status as Product["status"],
    features: Array.isArray(data.features) ? (data.features as string[]) : [],
  };
}

function mapIntegrationRow(row: typeof integrationsTable.$inferSelect): Integration {
  return {
    id: row.id,
    name: row.name,
    type: row.type as Integration["type"],
    status: row.status as Integration["status"],
    lastSync: row.lastSync?.toISOString() ?? "",
    description: row.description,
  };
}

export const postgresAdapter: DataAdapter = {
  // --- Agents (views over users WHERE type=agent) ---
  async listAgents(status?: string): Promise<Agent[]> {
    const db = getDb();
    const rows = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.type, "agent"));
    let mapped: Agent[] = rows.map((r) => {
      const data = (r.data ?? {}) as Record<string, unknown>;
      return {
        id: r.id,
        name: r.name,
        role: typeof data.role === "string" ? data.role : "",
        status: mapAgentStatus(r.status),
        model: typeof data.model === "string" ? data.model : "",
        lastActive: typeof data.lastActive === "string" ? data.lastActive : "",
      };
    });
    if (status) mapped = mapped.filter((a) => a.status === status);
    return mapped;
  },

  async getAgent(id: string): Promise<Agent | null> {
    const db = getDb();
    const rows = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!rows.length || rows[0].type !== "agent") return null;
    const r = rows[0];
    const data = (r.data ?? {}) as Record<string, unknown>;
    return {
      id: r.id,
      name: r.name,
      role: typeof data.role === "string" ? data.role : "",
      status: mapAgentStatus(r.status),
      model: typeof data.model === "string" ? data.model : "",
      lastActive: typeof data.lastActive === "string" ? data.lastActive : "",
    };
  },

  async updateAgentStatus(id: string, status: Agent["status"]): Promise<Agent | null> {
    const db = getDb();
    const dbStatus = agentStatusToUserStatus(status);
    await db.update(usersTable).set({ status: dbStatus, updatedAt: new Date() }).where(eq(usersTable.id, id));
    return postgresAdapter.getAgent(id);
  },

  // --- Projects ---
  async listProjects(filters?: ProjectFilters): Promise<Project[]> {
    const db = getDb();
    const conditions = [];
    if (filters?.status) conditions.push(eq(projectsTable.status, filters.status));
    if (filters?.q) {
      const q = `%${filters.q}%`;
      conditions.push(or(ilike(projectsTable.name, q), ilike(projectsTable.description, q))!);
    }
    const rows = await db
      .select({
        project: projectsTable,
        ownerName: usersTable.name,
      })
      .from(projectsTable)
      .leftJoin(usersTable, eq(projectsTable.ownerUserId, usersTable.id))
      .where(conditions.length ? and(...conditions) : undefined);

    // Compute task counts per project
    const taskCounts = await db
      .select({ projectId: tasksTable.projectId, cnt: count() })
      .from(tasksTable)
      .groupBy(tasksTable.projectId);
    const countMap = new Map(taskCounts.map((r) => [r.projectId, r.cnt]));

    return rows.map((r) => mapProjectRow(r.project, r.ownerName, countMap.get(r.project.id) ?? 0));
  },

  async getProject(id: string): Promise<Project | null> {
    const db = getDb();
    const rows = await db
      .select({
        project: projectsTable,
        ownerName: usersTable.name,
      })
      .from(projectsTable)
      .leftJoin(usersTable, eq(projectsTable.ownerUserId, usersTable.id))
      .where(eq(projectsTable.id, id))
      .limit(1);
    if (!rows.length) return null;
    const taskCount = await db
      .select({ cnt: count() })
      .from(tasksTable)
      .where(eq(tasksTable.projectId, id));
    return mapProjectRow(rows[0].project, rows[0].ownerName, taskCount[0]?.cnt ?? 0);
  },

  async createProject(input: CreateProjectInput): Promise<Project> {
    const name = (input.name || "").trim();
    if (!name) throw new Error("VALIDATION: name is required");
    const status = input.status ?? "active";
    const priority = input.priority ?? "normal";
    if (!["active", "paused", "completed", "archived"].includes(status)) throw new Error("VALIDATION: invalid status");
    if (!["low", "normal", "high"].includes(priority)) throw new Error("VALIDATION: invalid priority");
    const db = getDb();
    const id = randomUUID();
    const orgRows = await db.select().from(organizationsTable).limit(1);
    if (!orgRows.length) throw new Error("VALIDATION: no organization found — seed first");
    const orgId = orgRows[0].id;
    await db.insert(projectsTable).values({
      id,
      organizationId: orgId,
      name,
      description: input.description ?? "",
      status,
      ownerUserId: input.ownerUserId ?? null,
      priority,
      startDate: input.startDate ?? null,
      targetDate: input.targetDate ?? null,
      data: input.data ?? {},
    });
    const created = await postgresAdapter.getProject(id);
    if (!created) throw new Error("Failed to load created project");
    return created;
  },

  async updateProject(id: string, input: UpdateProjectInput): Promise<Project | null> {
    const db = getDb();
    const existing = await db.select().from(projectsTable).where(eq(projectsTable.id, id)).limit(1);
    if (!existing.length) return null;
    const patch: Partial<typeof projectsTable.$inferInsert> = { updatedAt: new Date() };
    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) throw new Error("VALIDATION: name cannot be empty");
      patch.name = name;
    }
    if (input.description !== undefined) patch.description = input.description;
    if (input.status !== undefined) {
      if (!["active", "paused", "completed", "archived"].includes(input.status)) throw new Error("VALIDATION: invalid status");
      patch.status = input.status;
    }
    if (input.priority !== undefined) {
      if (!["low", "normal", "high"].includes(input.priority)) throw new Error("VALIDATION: invalid priority");
      patch.priority = input.priority;
    }
    if (input.ownerUserId !== undefined) patch.ownerUserId = input.ownerUserId || null;
    if (input.startDate !== undefined) patch.startDate = input.startDate;
    if (input.targetDate !== undefined) patch.targetDate = input.targetDate;
    if (input.data) {
      const curData = (existing[0].data ?? {}) as Record<string, unknown>;
      patch.data = { ...curData, ...input.data };
    }
    await db.update(projectsTable).set(patch).where(eq(projectsTable.id, id));
    return postgresAdapter.getProject(id);
  },

  // --- Tasks ---
  async listTasks(filters?: TaskFilters): Promise<Task[]> {
    const db = getDb();
    const conditions = [];
    if (filters?.status) conditions.push(eq(tasksTable.status, filters.status));
    if (filters?.projectId) conditions.push(eq(tasksTable.projectId, filters.projectId));
    if (filters?.priority) conditions.push(eq(tasksTable.priority, filters.priority));
    if (filters?.q) {
      const q = `%${filters.q}%`;
      conditions.push(or(ilike(tasksTable.title, q), ilike(tasksTable.description, q))!);
    }
    const rows = await db
      .select({
        task: tasksTable,
        projectName: projectsTable.name,
        assigneeName: usersTable.name,
      })
      .from(tasksTable)
      .leftJoin(projectsTable, eq(tasksTable.projectId, projectsTable.id))
      .leftJoin(usersTable, eq(tasksTable.assigneeUserId, usersTable.id))
      .where(conditions.length ? and(...conditions) : undefined);

    let mapped = rows.map((r) => mapTaskRow(r.task, r.projectName, r.assigneeName));
    // assignee filter (by userId or name — match fixture behavior)
    if (filters?.assignee) {
      mapped = mapped.filter(
        (t) => t.assigneeUserId === filters.assignee || t.assigneeName === filters.assignee,
      );
    }
    return mapped;
  },

  async getTask(id: string): Promise<Task | null> {
    const db = getDb();
    const rows = await db
      .select({
        task: tasksTable,
        projectName: projectsTable.name,
        assigneeName: usersTable.name,
      })
      .from(tasksTable)
      .leftJoin(projectsTable, eq(tasksTable.projectId, projectsTable.id))
      .leftJoin(usersTable, eq(tasksTable.assigneeUserId, usersTable.id))
      .where(eq(tasksTable.id, id))
      .limit(1);
    if (!rows.length) return null;
    return mapTaskRow(rows[0].task, rows[0].projectName, rows[0].assigneeName);
  },

  async createTask(input: CreateTaskInput): Promise<Task> {
    const title = (input.title || "").trim();
    if (!title) throw new Error("VALIDATION: title is required");
    if (!input.projectId) throw new Error("VALIDATION: projectId is required");
    const status = input.status ?? "planned";
    const priority = input.priority ?? "normal";
    if (!["planned", "in_progress", "waiting", "blocked", "done"].includes(status)) throw new Error("VALIDATION: invalid status");
    if (!["low", "normal", "high", "urgent"].includes(priority)) throw new Error("VALIDATION: invalid priority");
    const db = getDb();
    // Validate project exists
    const projRows = await db.select().from(projectsTable).where(eq(projectsTable.id, input.projectId)).limit(1);
    if (!projRows.length) throw new Error("VALIDATION: projectId does not reference an existing project");
    const id = randomUUID();
    await db.insert(tasksTable).values({
      id,
      projectId: input.projectId,
      title,
      description: input.description ?? "",
      status,
      priority,
      assigneeUserId: input.assigneeUserId ?? null,
      dueDate: input.dueDate ?? null,
      data: input.data ?? {},
    });
    const created = await postgresAdapter.getTask(id);
    if (!created) throw new Error("Failed to load created task");
    return created;
  },

  async updateTask(id: string, input: UpdateTaskInput): Promise<Task | null> {
    const db = getDb();
    const existing = await db.select().from(tasksTable).where(eq(tasksTable.id, id)).limit(1);
    if (!existing.length) return null;
    const patch: Partial<typeof tasksTable.$inferInsert> = { updatedAt: new Date() };
    if (input.title !== undefined) {
      const title = input.title.trim();
      if (!title) throw new Error("VALIDATION: title cannot be empty");
      patch.title = title;
    }
    if (input.description !== undefined) patch.description = input.description;
    if (input.status !== undefined) {
      if (!["planned", "in_progress", "waiting", "blocked", "done"].includes(input.status)) throw new Error("VALIDATION: invalid status");
      patch.status = input.status;
    }
    if (input.priority !== undefined) {
      if (!["low", "normal", "high", "urgent"].includes(input.priority)) throw new Error("VALIDATION: invalid priority");
      patch.priority = input.priority;
    }
    if (input.projectId !== undefined) {
      const projRows = await db.select().from(projectsTable).where(eq(projectsTable.id, input.projectId)).limit(1);
      if (!projRows.length) throw new Error("VALIDATION: projectId does not reference an existing project");
      patch.projectId = input.projectId;
    }
    if (input.assigneeUserId !== undefined) patch.assigneeUserId = input.assigneeUserId || null;
    if (input.dueDate !== undefined) patch.dueDate = input.dueDate;
    if (input.data) {
      const curData = (existing[0].data ?? {}) as Record<string, unknown>;
      patch.data = { ...curData, ...input.data };
    }
    await db.update(tasksTable).set(patch).where(eq(tasksTable.id, id));
    return postgresAdapter.getTask(id);
  },

  // --- Integrations ---
  async listIntegrations(status?: string): Promise<Integration[]> {
    const db = getDb();
    const rows = await db.select().from(integrationsTable);
    let mapped = rows.map(mapIntegrationRow);
    if (status) mapped = mapped.filter((i) => i.status === status);
    return mapped;
  },

  // --- Business profile (organizations singleton) ---
  async getBusinessProfile(): Promise<BusinessProfile> {
    const db = getDb();
    const rows = await db.select().from(organizationsTable).limit(1);
    if (!rows.length) {
      // Return empty profile if no org seeded
      return {
        name: "", slogan: "", logoUrl: "", description: "",
        purpose: "", production: "", contactEmail: "", contactPhone: "",
        address: "", website: "",
      };
    }
    const org = rows[0];
    const data = (org.data ?? {}) as Record<string, unknown>;
    return {
      name: org.name,
      slogan: typeof data.slogan === "string" ? data.slogan : "",
      logoUrl: typeof data.logoUrl === "string" ? data.logoUrl : "",
      description: typeof data.description === "string" ? data.description : "",
      purpose: typeof data.purpose === "string" ? data.purpose : "",
      production: typeof data.production === "string" ? data.production : "",
      contactEmail: typeof data.contactEmail === "string" ? data.contactEmail : "",
      contactPhone: typeof data.contactPhone === "string" ? data.contactPhone : "",
      address: typeof data.address === "string" ? data.address : "",
      website: typeof data.website === "string" ? data.website : "",
    };
  },

  // --- Services (fixture-only, no DB table) ---
  async listServices(): Promise<Service[]> {
    // Services remain fixture-backed — no services table in schema
    const { services } = await import("../fixtures/services");
    return services;
  },

  // --- Products ---
  async listProducts(): Promise<Product[]> {
    const db = getDb();
    const rows = await db.select().from(productsTable);
    return rows.map(mapProductRow);
  },

  // --- Staff (public projection from users) ---
  async listStaff(): Promise<StaffMember[]> {
    const db = getDb();
    const rows = await db
      .select({
        user: usersTable,
        deptName: departmentsTable.name,
      })
      .from(usersTable)
      .leftJoin(departmentsTable, eq(usersTable.departmentId, departmentsTable.id));
    return rows.map((r) => {
      const data = (r.user.data ?? {}) as Record<string, unknown>;
      return {
        id: r.user.id,
        name: r.user.name,
        role: typeof data.job_title === "string" ? data.job_title : r.user.role,
        type: r.user.type as StaffMember["type"],
        bio: typeof data.bio === "string" ? data.bio : "",
        department: r.deptName ?? (typeof data.department === "string" ? data.department : ""),
      };
    });
  },

  // --- Users (Phase 2 pilot + Phase 3 writes) ---
  async listUsers(type?: string): Promise<User[]> {
    const db = getDb();
    const rows = await db
      .select({
        user: usersTable,
        deptName: departmentsTable.name,
      })
      .from(usersTable)
      .leftJoin(departmentsTable, eq(usersTable.departmentId, departmentsTable.id));
    let mapped = rows.map((r) => mapUserRow(r.user, r.deptName));
    if (type) mapped = mapped.filter((u) => u.type === type);
    return mapped;
  },

  async getUser(id: string): Promise<User | null> {
    const db = getDb();
    const rows = await db
      .select({
        user: usersTable,
        deptName: departmentsTable.name,
      })
      .from(usersTable)
      .leftJoin(departmentsTable, eq(usersTable.departmentId, departmentsTable.id))
      .where(eq(usersTable.id, id))
      .limit(1);
    if (!rows.length) return null;
    return mapUserRow(rows[0].user, rows[0].deptName);
  },

  async createUser(input: CreateUserInput): Promise<User> {
    const email = (input.email || "").trim().toLowerCase();
    const name = (input.name || "").trim();
    if (!email || !name) throw new Error("VALIDATION: email and name are required");
    const role = input.role ?? "member";
    const type = input.type ?? "human";
    const status = input.status ?? "active";
    if (!["admin", "member"].includes(role)) throw new Error("VALIDATION: invalid role");
    if (!["human", "agent"].includes(type)) throw new Error("VALIDATION: invalid type");
    if (!["active", "inactive"].includes(status)) throw new Error("VALIDATION: invalid status");
    const data: Record<string, unknown> = { ...(input.data ?? {}) };
    if (input.bio !== undefined) data.bio = input.bio;
    if (input.department) data.department = input.department;
    const id = randomUUID();
    const passwordHash = input.password ? bcrypt.hashSync(input.password, 10) : null;
    const db = getDb();
    try {
      await db.insert(usersTable).values({
        id, email, name, role, type, status,
        departmentId: input.department_id ?? null,
        passwordHash, data,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("unique") || msg.includes("duplicate")) throw new Error("CONFLICT: email already exists");
      throw e;
    }
    const created = await postgresAdapter.getUser(id);
    if (!created) throw new Error("Failed to load created user");
    return created;
  },

  async updateUser(id: string, input: UpdateUserInput): Promise<User | null> {
    const db = getDb();
    const existing = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!existing.length) return null;
    const row = existing[0];
    const patch: Partial<typeof usersTable.$inferInsert> = { updatedAt: new Date() };
    if (input.email !== undefined) {
      const email = input.email.trim().toLowerCase();
      if (!email) throw new Error("VALIDATION: email cannot be empty");
      patch.email = email;
    }
    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) throw new Error("VALIDATION: name cannot be empty");
      patch.name = name;
    }
    if (input.role !== undefined) {
      if (!["admin", "member"].includes(input.role)) throw new Error("VALIDATION: invalid role");
      patch.role = input.role;
    }
    if (input.type !== undefined) {
      if (!["human", "agent"].includes(input.type)) throw new Error("VALIDATION: invalid type");
      patch.type = input.type;
    }
    if (input.status !== undefined) {
      if (!["active", "inactive"].includes(input.status)) throw new Error("VALIDATION: invalid status");
      patch.status = input.status;
    }
    if (input.department_id !== undefined) patch.departmentId = input.department_id;
    if (input.password !== undefined && input.password.length > 0) {
      patch.passwordHash = bcrypt.hashSync(input.password, 10);
    }
    const data = { ...((row.data ?? {}) as Record<string, unknown>) };
    if (input.data) Object.assign(data, input.data);
    if (input.bio !== undefined) data.bio = input.bio;
    if (input.department !== undefined) data.department = input.department;
    patch.data = data;
    try {
      await db.update(usersTable).set(patch).where(eq(usersTable.id, id));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("unique") || msg.includes("duplicate")) throw new Error("CONFLICT: email already exists");
      throw e;
    }
    return postgresAdapter.getUser(id);
  },

  // --- Mission Control facets (fixture-only, no DB tables) ---
  async listOtherSystems(): Promise<OtherSystem[]> {
    const { otherSystems } = await import("../fixtures/other-systems");
    return otherSystems;
  },
  async listSupportTickets(): Promise<SupportTicket[]> {
    const { supportTickets } = await import("../fixtures/support-tickets");
    return supportTickets;
  },
  async listMetrics(): Promise<Metric[]> {
    const { metrics } = await import("../fixtures/metrics");
    return metrics;
  },
  async listKnowledgeArticles(): Promise<KnowledgeArticle[]> {
    const { knowledgeArticles } = await import("../fixtures/knowledge-articles");
    return knowledgeArticles;
  },

  // --- Health ---
  async healthCheck() {
    return dbHealthCheck();
  },
};

// Map user status (active/inactive) to agent status (active/idle/error/offline).
// This is a pragmatic mapping for the deprecated /api/agents view.
function mapAgentStatus(userStatus: string): Agent["status"] {
  if (userStatus === "active") return "active";
  return "offline";
}

function agentStatusToUserStatus(agentStatus: Agent["status"]): string {
  if (agentStatus === "active") return "active";
  return "inactive";
}
