// Postgres adapter skeleton — Phase 1.
// All methods throw NOT_IMPLEMENTED except healthCheck.
// Behind DATA_SOURCE=postgres flag. When DB is down, app should not crash
// (routes catch errors and return empty lists or error responses).

import type { DataAdapter, ProjectFilters, TaskFilters } from '../data/adapter';
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
} from '../data/types';
import { healthCheck as dbHealthCheck } from './client';

const NOT_IMPLEMENTED = 'NOT_IMPLEMENTED: postgresAdapter method not yet implemented (Phase 1 skeleton)';

function notImplemented(method: string): never {
  throw new Error(NOT_IMPLEMENTED + ': ' + method);
}

export const postgresAdapter: DataAdapter = {
  async listAgents(_status?: string): Promise<Agent[]> {
    notImplemented('listAgents');
  },
  async getAgent(_id: string): Promise<Agent | null> {
    notImplemented('getAgent');
  },
  async updateAgentStatus(_id: string, _status: Agent['status']): Promise<Agent | null> {
    notImplemented('updateAgentStatus');
  },
  async listProjects(_filters?: ProjectFilters): Promise<Project[]> {
    notImplemented('listProjects');
  },
  async getProject(_id: string): Promise<Project | null> {
    notImplemented('getProject');
  },
  async listTasks(_filters?: TaskFilters): Promise<Task[]> {
    notImplemented('listTasks');
  },
  async getTask(_id: string): Promise<Task | null> {
    notImplemented('getTask');
  },
  async listIntegrations(_status?: string): Promise<Integration[]> {
    notImplemented('listIntegrations');
  },
  async getBusinessProfile(): Promise<BusinessProfile> {
    notImplemented('getBusinessProfile');
  },
  async listServices(): Promise<Service[]> {
    notImplemented('listServices');
  },
  async listProducts(): Promise<Product[]> {
    notImplemented('listProducts');
  },
  async listStaff(): Promise<StaffMember[]> {
    notImplemented('listStaff');
  },
  async listUsers(_type?: string): Promise<User[]> {
    // Phase 1: return empty list — no seed data yet.
    return [];
  },
  async getUser(_id: string): Promise<User | null> {
    // Phase 1: return null — no seed data yet.
    return null;
  },
  async listOtherSystems(): Promise<OtherSystem[]> {
    notImplemented('listOtherSystems');
  },
  async listSupportTickets(): Promise<SupportTicket[]> {
    notImplemented('listSupportTickets');
  },
  async listMetrics(): Promise<Metric[]> {
    notImplemented('listMetrics');
  },
  async listKnowledgeArticles(): Promise<KnowledgeArticle[]> {
    notImplemented('listKnowledgeArticles');
  },
  async healthCheck(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
    return dbHealthCheck();
  },
};
