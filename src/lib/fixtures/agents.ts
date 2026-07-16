export interface AgentFixture {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'error' | 'offline';
  model: string;
  lastActive: string;
}

// Sample roster for backend demos — fictional names, not host fleet branding.
export const agents: AgentFixture[] = [
  {
    id: 'agent-1',
    name: 'Ops Assistant',
    role: 'Operations coordinator',
    status: 'active',
    model: 'sample-model',
    lastActive: '2026-07-14T22:30:00Z',
  },
  {
    id: 'agent-2',
    name: 'Research Assistant',
    role: 'Research support',
    status: 'idle',
    model: 'sample-model',
    lastActive: '2026-07-14T21:15:00Z',
  },
  {
    id: 'agent-3',
    name: 'Writing Assistant',
    role: 'Content support',
    status: 'idle',
    model: 'sample-model',
    lastActive: '2026-07-14T18:45:00Z',
  },
  {
    id: 'agent-4',
    name: 'Support Assistant',
    role: 'Customer support aid',
    status: 'offline',
    model: 'sample-model',
    lastActive: '2026-07-13T09:00:00Z',
  },
  {
    id: 'agent-5',
    name: 'Scheduling Assistant',
    role: 'Calendar and logistics',
    status: 'error',
    model: 'sample-model',
    lastActive: '2026-07-14T14:20:00Z',
  },
];
