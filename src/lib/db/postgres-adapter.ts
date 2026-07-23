// Postgres adapter — Phase 2 User pilot (list/get) + healthCheck.
// Other methods remain NOT_IMPLEMENTED until later phases.
// Behind DATA_SOURCE=postgres. Fixture default stays safe.

import type { DataAdapter, ProjectFilters, TaskFilters } from "../data/adapter";
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

