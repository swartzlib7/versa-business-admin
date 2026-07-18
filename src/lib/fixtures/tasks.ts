export interface TaskFixture {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'in_progress' | 'waiting' | 'blocked' | 'done';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  projectId: string;
  projectName: string;
  assigneeUserId: string;
  assigneeName: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export const tasks: TaskFixture[] = [
  {
    id: 'task-1',
    title: 'Draft homepage copy for makers',
    description: 'Write hero, purpose, and production narrative that resonates with founders and producers.',
    status: 'in_progress',
    priority: 'high',
    projectId: 'proj-1',
    projectName: 'Public story refresh',
    assigneeUserId: 'user-6',
    assigneeName: 'Riley Brooks',
    dueDate: '2026-07-18',
    createdAt: '2026-07-01T10:00:00Z',
    updatedAt: '2026-07-10T14:30:00Z',
  },
  {
    id: 'task-2',
    title: 'Photograph finished product set',
    description: 'Capture clean product photos for the public catalog and first offer page.',
    status: 'planned',
    priority: 'normal',
    projectId: 'proj-1',
    projectName: 'Public story refresh',
    assigneeUserId: 'user-1',
    assigneeName: 'Alex Morgan',
    dueDate: '2026-07-25',
    createdAt: '2026-07-02T09:00:00Z',
    updatedAt: '2026-07-02T09:00:00Z',
  },
  {
    id: 'task-3',
    title: 'Write welcome sequence for new buyers',
    description: 'Three-message sequence: thank you, how to use, how to get help.',
    status: 'waiting',
    priority: 'normal',
    projectId: 'proj-2',
    projectName: 'First-customer onboarding',
    assigneeUserId: 'user-5',
    assigneeName: 'Casey Nguyen',
    dueDate: '2026-07-20',
    createdAt: '2026-06-20T11:00:00Z',
    updatedAt: '2026-07-08T16:00:00Z',
  },
  {
    id: 'task-4',
    title: 'Publish remote-work craft policy',
    description: 'Update the handbook section on remote production and hybrid collaboration.',
    status: 'in_progress',
    priority: 'normal',
    projectId: 'proj-4',
    projectName: 'Craft handbook v2',
    assigneeUserId: 'user-1',
    assigneeName: 'Alex Morgan',
    dueDate: '2026-07-22',
    createdAt: '2026-06-20T08:00:00Z',
    updatedAt: '2026-07-14T10:00:00Z',
  },
  {
    id: 'task-5',
    title: 'Review capacity for next release',
    description: 'Check open orders, agent load, and human hours before committing the next ship date.',
    status: 'planned',
    priority: 'high',
    projectId: 'proj-3',
    projectName: 'Q3 production review',
    assigneeUserId: 'user-3',
    assigneeName: 'Jordan Lee',
    dueDate: '2026-07-28',
    createdAt: '2026-07-05T08:00:00Z',
    updatedAt: '2026-07-05T08:00:00Z',
  },
];
