import type { Agent, Project, Task, Integration } from './types';

// ---------------------------------------------------------------------------
// DataAdapter — the modular boundary between route handlers and data sources.
// All route handlers call through this interface. The fixture implementation
// below is the default; a real Versa AGi host adapter can be swapped in later
// without touching route code.
// ---------------------------------------------------------------------------

export interface DataAdapter {
  listAgents(status?: string): Promise<Agent[]>;
  getAgent(id: string): Promise<Agent | null>;
  updateAgentStatus?(id: string, status: Agent['status']): Promise<Agent | null>;
  listProjects(status?: string): Promise<Project[]>;
  listTasks(status?: string): Promise<Task[]>;
  listIntegrations(status?: string): Promise<Integration[]>;
}

// ---------------------------------------------------------------------------
// Fixture-backed implementation
// ---------------------------------------------------------------------------

import { agents as agentFixtures } from '@/lib/fixtures/agents';
import { projects as projectFixtures } from '@/lib/fixtures/projects';
import { tasks as taskFixtures } from '@/lib/fixtures/tasks';
import { integrations as integrationFixtures } from '@/lib/fixtures/integrations';

// Mutable copies so the optional PATCH can mutate in-process state.
let mutableAgents: Agent[] = [...agentFixtures];

export function resetAgents(): void {
  mutableAgents = [...agentFixtures];
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

  async listProjects(status?: string) {
    let result = projectFixtures;
    if (status) {
      result = result.filter((p) => p.status === status);
    }
    return result;
  },

  async listTasks(status?: string) {
    let result = taskFixtures;
    if (status) {
      result = result.filter((t) => t.status === status);
    }
    return result;
  },

  async listIntegrations(status?: string) {
    let result = integrationFixtures;
    if (status) {
      result = result.filter((i) => i.status === status);
    }
    return result;
  },
};

// Default adapter used by all routes. Swap for a real host adapter later.
export const adapter: DataAdapter = fixtureAdapter;
