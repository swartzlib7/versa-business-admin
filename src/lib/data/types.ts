// Re-export fixture types as the canonical data types for the adapter layer.
// When real host adapters are added, these types become the contract.

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'error' | 'offline';
  model: string;
  lastActive: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'archived';
  gameId: string;
  gameName: string;
  agentCount: number;
  taskCount: number;
}

export interface Task {
  id: string;
  title: string;
  status: 'planned' | 'in_progress' | 'waiting' | 'blocked' | 'done';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assignee: string;
  projectId: string;
  projectName: string;
  dueDate: string;
}

export interface Integration {
  id: string;
  name: string;
  type: 'email' | 'cms' | 'database' | 'api' | 'iot' | 'messaging';
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  description: string;
}
