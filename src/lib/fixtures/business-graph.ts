// Business graph fixture for the 3D Mission Control hub visualization.
// Hub + 3 orbital rings: systems, teams, operating surfaces.
// Fixture-driven so the graph is stable and demoable.

export type GraphNodeType = 'hub' | 'system' | 'team' | 'surface';

export interface BusinessGraphNode {
  id: string;
  label: string;
  type: GraphNodeType;
  ring: number; // 0 = hub, 1 = systems, 2 = teams, 3 = surfaces
  description: string;
  status: 'connected' | 'active' | 'standby';
}

export interface BusinessGraphLink {
  from: string;
  to: string;
  type: 'primary' | 'secondary';
}

export const businessGraphNodes: BusinessGraphNode[] = [
  // Hub
  {
    id: 'hub',
    label: 'Versa AGi',
    type: 'hub',
    ring: 0,
    description: 'Mission Control — central integration middleware connecting all business systems, teams, and operating surfaces.',
    status: 'active',
  },
  // Ring 1 — Business systems (inner)
  {
    id: 'sales',
    label: 'Sales',
    type: 'system',
    ring: 1,
    description: 'CRM, sales pipeline, and customer relationships.',
    status: 'connected',
  },
  {
    id: 'production',
    label: 'Production',
    type: 'system',
    ring: 1,
    description: 'Production scheduling, delivery tracking, and operations.',
    status: 'connected',
  },
  {
    id: 'accounting',
    label: 'Accounting',
    type: 'system',
    ring: 1,
    description: 'Financial management, invoicing, and bookkeeping.',
    status: 'connected',
  },
  // Ring 2 — People / teams (mid)
  {
    id: 'local-team',
    label: 'Local Team',
    type: 'team',
    ring: 2,
    description: 'On-site / HQ personnel managing day-to-day operations.',
    status: 'active',
  },
  {
    id: 'intl-team',
    label: 'International',
    type: 'team',
    ring: 2,
    description: 'Remote / multi-region team supporting global activities.',
    status: 'active',
  },
  // Ring 3 — Operating surfaces (outer)
  {
    id: 'dashboards',
    label: 'Dashboards',
    type: 'surface',
    ring: 3,
    description: 'Visibility and analytics across all business areas.',
    status: 'connected',
  },
  {
    id: 'automations',
    label: 'Automations',
    type: 'surface',
    ring: 3,
    description: 'Workflows, agent automations, and process orchestration.',
    status: 'connected',
  },
  {
    id: 'reporting',
    label: 'Reporting',
    type: 'surface',
    ring: 3,
    description: 'Exports, periodic reviews, and compliance reporting.',
    status: 'standby',
  },
];

export const businessGraphLinks: BusinessGraphLink[] = [
  // Primary: hub → every node (middleware spokes)
  ...businessGraphNodes
    .filter((n) => n.type !== 'hub')
    .map((n) => ({ from: 'hub', to: n.id, type: 'primary' as const })),
  // Secondary: inter-system links (integration feel)
  { from: 'sales', to: 'accounting', type: 'secondary' },
  { from: 'sales', to: 'production', type: 'secondary' },
  { from: 'production', to: 'accounting', type: 'secondary' },
];
