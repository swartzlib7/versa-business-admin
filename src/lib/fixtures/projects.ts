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
    name: 'Public story refresh',
    description: 'Update the public site so it speaks to makers and producers, not a consulting brochure.',
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
    name: 'First-customer onboarding',
    description: 'Standardize how new buyers are welcomed, trained, and handed to ongoing care.',
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
    name: 'Q3 production review',
    description: 'Quarterly review of capacity, quality, and what to make next.',
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
    name: 'Craft handbook v2',
    description: 'Rewrite how-we-make guides so quality is teachable and repeatable.',
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
    name: 'Legacy catalog migration',
    description: 'Move product and customer records from the old shop tools into the new workspace.',
    status: 'completed',
    ownerUserId: 'user-3',
    ownerName: 'Jordan Lee',
    priority: 'high',
    startDate: '2026-05-01',
    targetDate: '2026-06-30',
    taskCount: 0,
  },
];
