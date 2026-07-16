export interface TaskFixture {
  id: string;
  title: string;
  status: 'planned' | 'in_progress' | 'waiting' | 'blocked' | 'done';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  projectId: string;
  projectName: string;
  assignee: string;
  dueDate: string;
}

export const tasks: TaskFixture[] = [
  {
    id: 'task-1',
    title: 'Draft homepage copy for review',
    status: 'in_progress',
    priority: 'high',
    projectId: 'proj-1',
    projectName: 'Website refresh',
    assignee: 'Riley Brooks',
    dueDate: '2026-07-18',
  },
  {
    id: 'task-2',
    title: 'Fix analytics warehouse connection',
    status: 'blocked',
    priority: 'urgent',
    projectId: 'proj-3',
    projectName: 'Q3 ops review',
    assignee: 'Jordan Lee',
    dueDate: '2026-07-17',
  },
  {
    id: 'task-3',
    title: 'Write new-client welcome checklist',
    status: 'planned',
    priority: 'normal',
    projectId: 'proj-2',
    projectName: 'Customer onboarding',
    assignee: 'Casey Nguyen',
    dueDate: '2026-07-20',
  },
  {
    id: 'task-4',
    title: 'Publish remote-work policy update',
    status: 'in_progress',
    priority: 'normal',
    projectId: 'proj-4',
    projectName: 'Handbook v2',
    assignee: 'Taylor Quinn',
    dueDate: '2026-07-22',
  },
  {
    id: 'task-5',
    title: 'Schedule kickoff for website refresh',
    status: 'done',
    priority: 'low',
    projectId: 'proj-1',
    projectName: 'Website refresh',
    assignee: 'Sam Rivera',
    dueDate: '2026-07-15',
  },
];
