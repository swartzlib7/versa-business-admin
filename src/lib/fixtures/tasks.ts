export interface TaskFixture {
  id: string;
  title: string;
  status: 'planned' | 'in_progress' | 'waiting' | 'blocked' | 'done';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assignee: string;
  projectId: string;
  projectName: string;
  dueDate: string;
}

export const tasks: TaskFixture[] = [
  {
    id: 'task-1',
    title: '[admin I0] Foundations scaffold — web-dev',
    status: 'in_progress',
    priority: 'high',
    assignee: 'web-dev',
    projectId: 'proj-1',
    projectName: 'versa-admin-system',
    dueDate: '2026-07-15T12:00:00-04:00',
  },
  {
    id: 'task-2',
    title: 'Fix AWS IoT Core connection timeout',
    status: 'blocked',
    priority: 'urgent',
    assignee: 'coa',
    projectId: 'proj-2',
    projectName: 'mysmartyard.com',
    dueDate: '2026-07-14T18:00:00-04:00',
  },
  {
    id: 'task-3',
    title: 'Update knowledge base with VM architecture docs',
    status: 'done',
    priority: 'normal',
    assignee: 'web-dev',
    projectId: 'proj-3',
    projectName: 'AGi-Knowledgebase',
    dueDate: '2026-07-10T12:00:00-04:00',
  },
  {
    id: 'task-4',
    title: 'Draft weekly brand hero image',
    status: 'planned',
    priority: 'normal',
    assignee: 'coa',
    projectId: 'proj-1',
    projectName: 'versa-admin-system',
    dueDate: '2026-07-16T09:00:00-04:00',
  },
  {
    id: 'task-5',
    title: 'Review email access pipeline logs',
    status: 'waiting',
    priority: 'low',
    assignee: 'researcher',
    projectId: 'proj-4',
    projectName: 'email-access',
    dueDate: '2026-07-15T17:00:00-04:00',
  },
  {
    id: 'task-6',
    title: 'Deploy dark mode toggle to production',
    status: 'done',
    priority: 'high',
    assignee: 'web-dev',
    projectId: 'proj-3',
    projectName: 'AGi-Knowledgebase',
    dueDate: '2026-07-08T12:00:00-04:00',
  },
];
