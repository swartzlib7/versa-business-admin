export interface ProjectFixture {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  ownerUserId: string;
  ownerName: string;
  priority: 'low' | 'normal' | 'high';
  startDate: string | null;
  targetDate: string | null;
  taskCount: number;
}

export const projects: ProjectFixture[] = [
  {
    id: 'proj-1',
    name: 'Website refresh',
    description: 'Update public site content and brand assets for the new fiscal year.',
    status: 'active',
    ownerUserId: 'user-6',
    ownerName: 'Riley Brooks',
    priority: 'high',
    startDate: '2026-07-01',
    targetDate: '2026-08-15',
    taskCount: 2,
  },
  {
    id: 'proj-2',
    name: 'Customer onboarding',
    description: 'Standardize how new clients are welcomed, trained, and handed to success.',
    status: 'active',
    ownerUserId: 'user-5',
    ownerName: 'Casey Nguyen',
    priority: 'normal',
    startDate: '2026-06-15',
    targetDate: '2026-09-01',
    taskCount: 1,
  },
  {
    id: 'proj-3',
    name: 'Q3 ops review',
    description: 'Quarterly review of capacity, delivery quality, and process improvements.',
    status: 'paused',
    ownerUserId: 'user-3',
    ownerName: 'Jordan Lee',
    priority: 'normal',
    startDate: '2026-07-01',
    targetDate: '2026-07-31',
    taskCount: 1,
  },
  {
    id: 'proj-4',
    name: 'Handbook v2',
    description: 'Rewrite company policies and how-we-work guides for clarity.',
    status: 'active',
    ownerUserId: 'user-1',
    ownerName: 'Alex Morgan',
    priority: 'low',
    startDate: '2026-06-01',
    targetDate: '2026-10-01',
    taskCount: 1,
  },
  {
    id: 'proj-5',
    name: 'Legacy data migration',
    description: 'Migrate records from the old CRM into the new system.',
    status: 'completed',
    ownerUserId: 'user-3',
    ownerName: 'Jordan Lee',
    priority: 'high',
    startDate: '2026-05-01',
    targetDate: '2026-06-30',
    taskCount: 0,
  },
];
