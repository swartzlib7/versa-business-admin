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
    title: 'Draft homepage copy for review',
    description: 'Write the hero section, services summary, and CTA copy for the new homepage.',
    status: 'in_progress',
    priority: 'high',
    projectId: 'proj-1',
    projectName: 'Website refresh',
    assigneeUserId: 'user-6',
    assigneeName: 'Riley Brooks',
    dueDate: '2026-07-18',
    createdAt: '2026-07-01T10:00:00Z',
    updatedAt: '2026-07-10T14:30:00Z',
  },
  {
    id: 'task-2',
    title: 'Fix analytics warehouse connection',
    description: 'The reporting dashboard cannot pull data from the warehouse after the last migration.',
    status: 'blocked',
    priority: 'urgent',
    projectId: 'proj-3',
    projectName: 'Q3 ops review',
    assigneeUserId: 'user-3',
    assigneeName: 'Jordan Lee',
    dueDate: '2026-07-17',
    createdAt: '2026-07-05T09:00:00Z',
    updatedAt: '2026-07-12T16:00:00Z',
  },
  {
    id: 'task-3',
    title: 'Write new-client welcome checklist',
    description: 'Create a standardized onboarding checklist for new customers.',
    status: 'planned',
    priority: 'normal',
    projectId: 'proj-2',
    projectName: 'Customer onboarding',
    assigneeUserId: 'user-5',
    assigneeName: 'Casey Nguyen',
    dueDate: '2026-07-20',
    createdAt: '2026-07-08T11:00:00Z',
    updatedAt: '2026-07-08T11:00:00Z',
  },
  {
    id: 'task-4',
    title: 'Publish remote-work policy update',
    description: 'Update the handbook section on remote work with the new hybrid guidelines.',
    status: 'in_progress',
    priority: 'normal',
    projectId: 'proj-4',
    projectName: 'Handbook v2',
    assigneeUserId: 'user-1',
    assigneeName: 'Alex Morgan',
    dueDate: '2026-07-22',
    createdAt: '2026-06-20T08:00:00Z',
    updatedAt: '2026-07-14T10:00:00Z',
  },
  {
    id: 'task-5',
    title: 'Schedule kickoff for website refresh',
    description: 'Coordinate the project kickoff meeting with all stakeholders.',
    status: 'done',
    priority: 'low',
    projectId: 'proj-1',
    projectName: 'Website refresh',
    assigneeUserId: 'user-6',
    assigneeName: 'Riley Brooks',
    dueDate: '2026-07-15',
    createdAt: '2026-06-28T09:00:00Z',
    updatedAt: '2026-07-02T15:00:00Z',
  },
  {
    id: 'task-6',
    title: 'Archive legacy CRM records',
    description: 'Export and archive all records from the old CRM system.',
    status: 'done',
    priority: 'normal',
    projectId: 'proj-5',
    projectName: 'Legacy data migration',
    assigneeUserId: 'user-3',
    assigneeName: 'Jordan Lee',
    dueDate: '2026-06-28',
    createdAt: '2026-05-05T08:00:00Z',
    updatedAt: '2026-06-25T14:00:00Z',
  },
  {
    id: 'task-7',
    title: 'Design onboarding email sequence',
    description: 'Create a three-email welcome sequence for new customers.',
    status: 'waiting',
    priority: 'high',
    projectId: 'proj-2',
    projectName: 'Customer onboarding',
    assigneeUserId: 'user-5',
    assigneeName: 'Casey Nguyen',
    dueDate: '2026-07-25',
    createdAt: '2026-07-10T10:00:00Z',
    updatedAt: '2026-07-14T09:00:00Z',
  },
];
