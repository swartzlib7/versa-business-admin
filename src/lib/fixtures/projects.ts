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
    name: 'versa-admin-system',
    description: 'Client mission control for Versa AGi businesses',
    status: 'active',
    gameId: 'game-109',
    gameName: 'Versa Voice AI LLC',
    agentCount: 3,
    taskCount: 12,
  },
  {
    id: 'proj-2',
    name: 'mysmartyard.com',
    description: 'Smart Yard Web Application (Laravel)',
    status: 'active',
    gameId: 'game-110',
    gameName: 'Software Engineering and Consulting',
    agentCount: 2,
    taskCount: 5,
  },
  {
    id: 'proj-3',
    name: 'AGi-Knowledgebase',
    description: 'Shared collaborative documentation for Grav CMS',
    status: 'active',
    gameId: 'game-109',
    gameName: 'Versa Voice AI LLC',
    agentCount: 4,
    taskCount: 8,
  },
  {
    id: 'proj-4',
    name: 'email-access',
    description: 'Email monitoring and management system',
    status: 'paused',
    gameId: 'game-109',
    gameName: 'Versa Voice AI LLC',
    agentCount: 1,
    taskCount: 3,
  },
  {
    id: 'proj-5',
    name: 'c3d-studio',
    description: 'Customer projects, quotes, work orders, billing',
    status: 'archived',
    gameId: 'game-111',
    gameName: 'C3D Studio',
    agentCount: 0,
    taskCount: 0,
  },
];
