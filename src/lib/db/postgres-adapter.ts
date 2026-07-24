// Postgres adapter — Phase 2 User pilot (list/get) + Phase 3 writes + healthCheck.
// Other methods remain NOT_IMPLEMENTED until later phases.
// Behind DATA_SOURCE=postgres. Fixture default stays safe.

import type { DataAdapter, ProjectFilters, TaskFilters, CreateUserInput, UpdateUserInput } from "../data/adapter";
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
import { users as usersTable, departments as departmentsTable } from "./schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const NOT_IMPLEMENTED =
  "NOT_IMPLEMENTED: postgresAdapter method not yet implemented (later phase)";

function notImplemented(method: string): never {
  throw new Error(NOT_IMPLEMENTED + ": " + method);
}

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

export const postgresAdapter: DataAdapter = {
  async listAgents(_status?: string): Promise<Agent[]> {
    notImplemented("listAgents");
  },
  async getAgent(_id: string): Promise<Agent | null> {
    notImplemented("getAgent");
  },
  async updateAgentStatus(
    _id: string,
    _status: Agent["status"],
  ): Promise<Agent | null> {
    notImplemented("updateAgentStatus");
  },
  async listProjects(_filters?: ProjectFilters): Promise<Project[]> {
    notImplemented("listProjects");
  },
  async getProject(_id: string): Promise<Project | null> {
    notImplemented("getProject");
  },
  async listTasks(_filters?: TaskFilters): Promise<Task[]> {
    notImplemented("listTasks");
  },
  async getTask(_id: string): Promise<Task | null> {
    notImplemented("getTask");
  },
  async listIntegrations(_status?: string): Promise<Integration[]> {
    notImplemented("listIntegrations");
  },
  async getBusinessProfile(): Promise<BusinessProfile> {
    notImplemented("getBusinessProfile");
  },
  async listServices(): Promise<Service[]> {
    notImplemented("listServices");
  },
  async listProducts(): Promise<Product[]> {
    notImplemented("listProducts");
  },
  async listStaff(): Promise<StaffMember[]> {
    notImplemented("listStaff");
  },
  async listUsers(type?: string): Promise<User[]> {
    const db = getDb();
    const rows = await db
      .select({
        user: usersTable,
        deptName: departmentsTable.name,
      })
      .from(usersTable)
      .leftJoin(
        departmentsTable,
        eq(usersTable.departmentId, departmentsTable.id),
      );
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
      .leftJoin(
        departmentsTable,
        eq(usersTable.departmentId, departmentsTable.id),
      )
      .where(eq(usersTable.id, id))
      .limit(1);
    if (!rows.length) return null;
    return mapUserRow(rows[0].user, rows[0].deptName);
  },
  async createUser(input: CreateUserInput): Promise<User> {
    const email = (input.email || "").trim().toLowerCase();
    const name = (input.name || "").trim();
    if (!email || !name) {
      throw new Error("VALIDATION: email and name are required");
    }
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
        id,
        email,
        name,
        role,
        type,
        status,
        departmentId: input.department_id ?? null,
        passwordHash,
        data,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("unique") || msg.includes("duplicate")) {
        throw new Error("CONFLICT: email already exists");
      }
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
    const patch: Partial<typeof usersTable.$inferInsert> = {
      updatedAt: new Date(),
    };
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
    if (input.department_id !== undefined) {
      patch.departmentId = input.department_id;
    }
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
      if (msg.includes("unique") || msg.includes("duplicate")) {
        throw new Error("CONFLICT: email already exists");
      }
      throw e;
    }
    return postgresAdapter.getUser(id);
  },

  async listOtherSystems(): Promise<OtherSystem[]> {
    notImplemented("listOtherSystems");
  },
  async listSupportTickets(): Promise<SupportTicket[]> {
    notImplemented("listSupportTickets");
  },
  async listMetrics(): Promise<Metric[]> {
    notImplemented("listMetrics");
  },
  async listKnowledgeArticles(): Promise<KnowledgeArticle[]> {
    notImplemented("listKnowledgeArticles");
  },
  async healthCheck(): Promise<{
    connected: boolean;
    latencyMs?: number;
    error?: string;
  }> {
    return dbHealthCheck();
  },
};

