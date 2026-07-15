export interface AgentFixture {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'error' | 'offline';
  model: string;
  lastActive: string;
}

export const agents: AgentFixture[] = [
  {
    id: 'agent-1',
    name: 'Versa (COA)',
    role: 'Chief Orchestrator Agent',
    status: 'active',
    model: 'x-ai/grok-4.5',
    lastActive: '2026-07-14T22:30:00Z',
  },
  {
    id: 'agent-2',
    name: 'Web-dev',
    role: 'Developer Agent',
    status: 'idle',
    model: 'deepseek/deepseek-v4-pro',
    lastActive: '2026-07-14T21:15:00Z',
  },
  {
    id: 'agent-3',
    name: 'Researcher',
    role: 'Subject Researcher',
    status: 'idle',
    model: 'deepseek/deepseek-v4-flash',
    lastActive: '2026-07-14T18:45:00Z',
  },
  {
    id: 'agent-4',
    name: 'Outreach',
    role: 'Marketing Manager',
    status: 'offline',
    model: 'deepseek/deepseek-v4-flash',
    lastActive: '2026-07-13T09:00:00Z',
  },
  {
    id: 'agent-5',
    name: 'Sylvie',
    role: 'Custom Agent',
    status: 'error',
    model: 'deepseek/deepseek-v4-flash',
    lastActive: '2026-07-14T14:20:00Z',
  },
];
