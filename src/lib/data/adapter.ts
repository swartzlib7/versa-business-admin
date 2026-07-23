import type { Agent, Project, Task, Integration, BusinessProfile, Service, Product, StaffMember, User, OtherSystem, SupportTicket, Metric, KnowledgeArticle } from './types';

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
  // Users (I5)
  listUsers(type?: string): Promise<User[]>;
  getUser(id: string): Promise<User | null>;
  // Mission Control facets (I5.3)
  listOtherSystems(): Promise<OtherSystem[]>;
  listSupportTickets(): Promise<SupportTicket[]>;
  listMetrics(): Promise<Metric[]>;
  listKnowledgeArticles(): Promise<KnowledgeArticle[]>;
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
    let result = userFixtures.map(({ password, ...u }) => u);
    if (type) {
      result = result.filter((u) => u.type === type);
    }
    return result;
  },

  async getUser(id: string) {
    const found = userFixtures.find((u) => u.id === id);
    if (!found) return null;
    const { password, ...user } = found;
    return user;
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
    healthCheck: () => postgresAdapter.healthCheck(),
  };
}

export const adapter: DataAdapter = createAdapter();
