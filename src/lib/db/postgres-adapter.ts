// Postgres adapter — used when DATA_SOURCE is postgres (the shipped default).

import type { DataAdapter, ProjectFilters, TaskFilters, CreateUserInput, UpdateUserInput, CreateProjectInput, UpdateProjectInput, CreateTaskInput, UpdateTaskInput, CreateProductInput, UpdateProductInput } from "../data/adapter";
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
  Organization,
  OrgType,
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from "../data/types";
import { healthCheck as dbHealthCheck, getDb } from "./client";
import {
  users as usersTable,
  departments as departmentsTable,
  organizations as organizationsTable,
  integrations as integrationsTable,
} from "./schema";
import { eq } from "drizzle-orm";
import {
  createPgProduct,
  createPgProject,
  createPgTask,
  getPgProduct,
  getPgProject,
  getPgTask,
  listPgProducts,
  listPgProjects,
  listPgTasks,
  updatePgProduct,
  updatePgProject,
  updatePgTask,
} from "../records/zone-core-bridge-pg";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import {
  assertCanCreateOrg,
  assertCanDeleteOrg,
  assertCanUpdateOrg,
  isPrimaryOrganization,
} from "../organizations/primary-org";

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

// #248 Slice D (rev E section 4.3): snake_case API shape for organizations.
function mapOrganizationRow(row: typeof organizationsTable.$inferSelect): Organization {
  const data = (row.data ?? {}) as Record<string, unknown>;
  return {
    id: row.id,
    name: row.name,
    is_person: row.isPerson,
    org_type: row.orgType as OrgType,
    parent_organization_id: row.parentOrganizationId ?? null,
    is_primary: data.is_primary === true,
    data,
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

  // --- Projects (zone records: executive_project) ---
  async listProjects(filters?: ProjectFilters): Promise<Project[]> {
    return listPgProjects(filters);
  },

  async getProject(id: string): Promise<Project | null> {
    return getPgProject(id);
  },

  async createProject(input: CreateProjectInput): Promise<Project> {
    return createPgProject(input);
  },

  async updateProject(id: string, input: UpdateProjectInput): Promise<Project | null> {
    return updatePgProject(id, input);
  },

  // --- Tasks (zone records: executive_task) ---
  async listTasks(filters?: TaskFilters): Promise<Task[]> {
    return listPgTasks(filters);
  },

  async getTask(id: string): Promise<Task | null> {
    return getPgTask(id);
  },

  async createTask(input: CreateTaskInput): Promise<Task> {
    return createPgTask(input);
  },

  async updateTask(id: string, input: UpdateTaskInput): Promise<Task | null> {
    return updatePgTask(id, input);
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
        name: "", slogan: "", tagline: "", logoUrl: "", description: "",
        purpose: "", production: "", contactEmail: "", contactPhone: "",
        address: "", website: "",
      };
    }
    const org = rows[0];
    const data = (org.data ?? {}) as Record<string, unknown>;
    return {
      name: org.name,
      slogan: typeof data.slogan === "string" ? data.slogan : "",
      tagline: typeof data.tagline === "string" ? data.tagline : "",
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

  // --- Services ---
  async listServices(): Promise<Service[]> {
    // No services table yet. Empty until modeled; do not inject fixture samples.
    return [];
  },

  // --- Products (zone records: production_product) ---
  async listProducts(): Promise<Product[]> {
    return listPgProducts();
  },

  async getProduct(id: string): Promise<Product | null> {
    return getPgProduct(id);
  },

  async createProduct(input: CreateProductInput): Promise<Product> {
    return createPgProduct(input);
  },

  async updateProduct(id: string, input: UpdateProductInput): Promise<Product | null> {
    return updatePgProduct(id, input);
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
    // #248 Slice D (rev E section 2.5): user-level default organization.
    if (input.default_organization_id !== undefined) {
      if (input.default_organization_id !== null) {
        const org = await db
          .select({ id: organizationsTable.id })
          .from(organizationsTable)
          .where(eq(organizationsTable.id, input.default_organization_id))
          .limit(1);
        if (!org.length) throw new Error("VALIDATION: default_organization_id does not reference an existing organization");
      }
      const data = { ...((row.data ?? {}) as Record<string, unknown>) };
      data.default_organization_id = input.default_organization_id;
      patch.data = data;
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

  async deleteUser(id: string): Promise<boolean> {
    const db = getDb();
    const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!existing.length) return false;
    await db.delete(usersTable).where(eq(usersTable.id, id));
    return true;
  },

  // --- Organizations (#248 Slice D, rev E section 4.3) ---
  async listOrganizations(orgType?: string): Promise<Organization[]> {
    const db = getDb();
    const rows = await db.select().from(organizationsTable);
    let mapped = rows.map(mapOrganizationRow);
    if (orgType) mapped = mapped.filter((o) => o.org_type === orgType);
    return mapped;
  },
  async getOrganization(id: string): Promise<Organization | null> {
    const db = getDb();
    const rows = await db.select().from(organizationsTable).where(eq(organizationsTable.id, id)).limit(1);
    return rows.length ? mapOrganizationRow(rows[0]) : null;
  },
  async createOrganization(input: CreateOrganizationInput): Promise<Organization> {
    const db = getDb();
    const name = input.name.trim();
    if (!name) throw new Error("VALIDATION: name cannot be empty");
    const orgType = input.org_type ?? "internal";
    if (!["vendor", "customer", "partner", "branch", "internal"].includes(orgType)) {
      throw new Error("VALIDATION: invalid org_type");
    }
    const existingOrgs = (await db.select().from(organizationsTable)).map(mapOrganizationRow);
    assertCanCreateOrg(existingOrgs, orgType);
    if (input.parent_organization_id) {
      const parent = await db
        .select({ id: organizationsTable.id })
        .from(organizationsTable)
        .where(eq(organizationsTable.id, input.parent_organization_id))
        .limit(1);
      if (!parent.length) throw new Error("VALIDATION: parent_organization_id does not reference an existing organization");
    }
    const data = { ...(input.data ?? {}) };
    if (orgType === "internal" && !existingOrgs.some(isPrimaryOrganization)) {
      data.is_primary = true;
    }
    const inserted = await db
      .insert(organizationsTable)
      .values({
        name,
        isPerson: input.is_person ?? false,
        orgType,
        parentOrganizationId: input.parent_organization_id ?? null,
        data,
      })
      .returning();
    return mapOrganizationRow(inserted[0]);
  },
  async updateOrganization(id: string, input: UpdateOrganizationInput): Promise<Organization | null> {
    const db = getDb();
    const existing = await db.select().from(organizationsTable).where(eq(organizationsTable.id, id)).limit(1);
    if (!existing.length) return null;
    const row = existing[0];
    const current = mapOrganizationRow(row);
    assertCanUpdateOrg(current, input.org_type);
    const patch: Partial<typeof organizationsTable.$inferInsert> = { updatedAt: new Date() };
    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) throw new Error("VALIDATION: name cannot be empty");
      patch.name = name;
    }
    if (input.is_person !== undefined) patch.isPerson = input.is_person;
    if (input.org_type !== undefined) {
      if (!["vendor", "customer", "partner", "branch", "internal"].includes(input.org_type)) {
        throw new Error("VALIDATION: invalid org_type");
      }
      patch.orgType = input.org_type;
    }
    if (input.parent_organization_id !== undefined) {
      if (input.parent_organization_id !== null) {
        if (input.parent_organization_id === id) throw new Error("VALIDATION: organization cannot be its own parent");
        const parent = await db
          .select({ id: organizationsTable.id })
          .from(organizationsTable)
          .where(eq(organizationsTable.id, input.parent_organization_id))
          .limit(1);
        if (!parent.length) throw new Error("VALIDATION: parent_organization_id does not reference an existing organization");
      }
      patch.parentOrganizationId = input.parent_organization_id;
    }
    if (input.data) {
      const data = { ...((row.data ?? {}) as Record<string, unknown>) };
      Object.assign(data, input.data);
      if (current.is_primary) data.is_primary = true;
      patch.data = data;
    }
    await db.update(organizationsTable).set(patch).where(eq(organizationsTable.id, id));
    const updated = await db.select().from(organizationsTable).where(eq(organizationsTable.id, id)).limit(1);
    return updated.length ? mapOrganizationRow(updated[0]) : null;
  },
  async deleteOrganization(id: string): Promise<boolean> {
    const db = getDb();
    const existing = await db.select().from(organizationsTable).where(eq(organizationsTable.id, id)).limit(1);
    if (!existing.length) return false;
    assertCanDeleteOrg(mapOrganizationRow(existing[0]));
    const children = await db
      .select()
      .from(organizationsTable)
      .where(eq(organizationsTable.parentOrganizationId, id));
    for (const child of children) {
      const removed = await postgresAdapter.deleteOrganization?.(child.id);
      if (removed === false) continue;
    }
    const userRows = await db.select().from(usersTable);
    for (const row of userRows) {
      const data = { ...((row.data ?? {}) as Record<string, unknown>) };
      if (data.default_organization_id === id) {
        data.default_organization_id = null;
        await db.update(usersTable).set({ data, updatedAt: new Date() }).where(eq(usersTable.id, row.id));
      }
    }
    try {
      await db.delete(organizationsTable).where(eq(organizationsTable.id, id));
    } catch {
      throw new Error(
        "VALIDATION: This organization still has related records (departments, parties, or other linked data). Remove those first, then delete the organization.",
      );
    }
    return true;
  },

  // --- VBA facets (no DB tables yet) ---
  // Empty when Postgres is on: never inject fixture sample rows into a live tenant.
  async listOtherSystems(): Promise<OtherSystem[]> {
    return [];
  },
  async listSupportTickets(): Promise<SupportTicket[]> {
    return [];
  },
  async listMetrics(): Promise<Metric[]> {
    return [];
  },
  async listKnowledgeArticles(): Promise<KnowledgeArticle[]> {
    return [];
  },

  // --- Health ---
  async healthCheck() {
    return dbHealthCheck();
  },
};

// Map user status (active/inactive) to agent status (active/idle/error/offline).
function mapAgentStatus(userStatus: string): Agent["status"] {
  if (userStatus === "active") return "active";
  return "offline";
}

function agentStatusToUserStatus(agentStatus: Agent["status"]): string {
  if (agentStatus === "active") return "active";
  return "inactive";
}
