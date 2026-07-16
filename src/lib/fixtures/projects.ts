export interface ProjectFixture {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'archived';
  gameId: string;
  gameName: string;
  agentCount: number;
  taskCount: number;
}

export const projects: ProjectFixture[] = [
  {
    id: 'proj-1',
    name: 'Website refresh',
    description: 'Update public site content and brand assets for the new fiscal year.',
    status: 'active',
    gameId: 'game-1',
    gameName: 'Growth',
    agentCount: 2,
    taskCount: 8,
  },
  {
    id: 'proj-2',
    name: 'Customer onboarding',
    description: 'Standardize how new clients are welcomed, trained, and handed to success.',
    status: 'active',
    gameId: 'game-1',
    gameName: 'Growth',
    agentCount: 1,
    taskCount: 5,
  },
  {
    id: 'proj-3',
    name: 'Q3 ops review',
    description: 'Quarterly review of capacity, delivery quality, and process improvements.',
    status: 'paused',
    gameId: 'game-2',
    gameName: 'Operations',
    agentCount: 1,
    taskCount: 3,
  },
  {
    id: 'proj-4',
    name: 'Handbook v2',
    description: 'Rewrite company policies and how-we-work guides for clarity.',
    status: 'active',
    gameId: 'game-2',
    gameName: 'Operations',
    agentCount: 1,
    taskCount: 6,
  },
];
