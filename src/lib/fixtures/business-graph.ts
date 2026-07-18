// Business graph fixture for the 3D Mission Control hub visualization.
// Keystone ERD v1.1 — three concentric zones:
//   Ring 0 = brand hub (Versa AGi)
//   Ring 1 = Organization (departments as spheres)
//   Ring 2 = Collaboration (parties the org works with)
//   Ring 3 = Environmental (context of work)
// Fixture-driven so the graph is stable and demoable.
// Source of truth: docs/specs/MISSION_CONTROL_ERD_KEYSTONE.md (v1.1)

export type GraphNodeType = 'brand' | 'organization' | 'collaboration' | 'environmental';

export interface BusinessGraphNode {
  id: string;
  label: string;
  type: GraphNodeType;
  ring: number; // 0 = brand, 1 = organization, 2 = collaboration, 3 = environmental
  description: string;
  status: 'connected' | 'active' | 'standby';
}

export interface BusinessGraphLink {
  from: string;
  to: string;
  type: 'primary' | 'secondary';
}

export const businessGraphNodes: BusinessGraphNode[] = [
  // Brand hub (center)
  {
    id: 'hub',
    label: 'Versa AGi',
    type: 'brand',
    ring: 0,
    description: 'Mission Control — the business operating hub connecting Organization, Collaboration, and Environmental zones.',
    status: 'active',
  },

  // Ring 1 — Organization (departments as spheres)
  {
    id: 'executive',
    label: 'Executive',
    type: 'organization',
    ring: 1,
    description: 'Business executive function. Parent path for Projects and Tasks.',
    status: 'active',
  },
  {
    id: 'communications',
    label: 'Communications',
    type: 'organization',
    ring: 1,
    description: 'Internal and external communications department.',
    status: 'connected',
  },
  {
    id: 'dissemination',
    label: 'Dissemination',
    type: 'organization',
    ring: 1,
    description: 'Distribution and publishing of information and materials.',
    status: 'connected',
  },
  {
    id: 'treasury',
    label: 'Treasury',
    type: 'organization',
    ring: 1,
    description: 'Financial management, treasury, and fiscal oversight.',
    status: 'connected',
  },
  {
    id: 'production',
    label: 'Production',
    type: 'organization',
    ring: 1,
    description: 'Production scheduling, delivery tracking, and operations.',
    status: 'connected',
  },
  {
    id: 'qualification',
    label: 'Qualification',
    type: 'organization',
    ring: 1,
    description: 'Quality assurance, compliance, and qualification processes.',
    status: 'standby',
  },

  // Ring 2 — Collaboration (parties the org works with)
  {
    id: 'vendor',
    label: 'Vendor',
    type: 'collaboration',
    ring: 2,
    description: 'Service provider — external supplier of goods or services.',
    status: 'connected',
  },
  {
    id: 'customer',
    label: 'Customer',
    type: 'collaboration',
    ring: 2,
    description: 'Person or business that receives products or services.',
    status: 'active',
  },
  {
    id: 'partner',
    label: 'Partner',
    type: 'collaboration',
    ring: 2,
    description: 'Business or investor in a collaborative relationship.',
    status: 'connected',
  },
  {
    id: 'branch',
    label: 'Branch',
    type: 'collaboration',
    ring: 2,
    description: 'Subsidiary — a subordinate operating unit of the organization.',
    status: 'connected',
  },

  // Ring 3 — Environmental (context of work)
  {
    id: 'locations',
    label: 'Locations',
    type: 'environmental',
    ring: 3,
    description: 'Global address book of business locations and places.',
    status: 'connected',
  },
  {
    id: 'events',
    label: 'Events',
    type: 'environmental',
    ring: 3,
    description: 'Past or future planned activities and milestones.',
    status: 'active',
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    type: 'environmental',
    ring: 3,
    description: 'Documents, recordings, photos, policies, and research.',
    status: 'connected',
  },
  {
    id: 'schedules',
    label: 'Schedules',
    type: 'environmental',
    ring: 3,
    description: 'Calendar-like agreements — when events, activities, or tasks occur.',
    status: 'connected',
  },
  {
    id: 'product',
    label: 'Product',
    type: 'environmental',
    ring: 3,
    description: 'Device, manufactured item, or computer file. Integrations live under Product.',
    status: 'active',
  },
  {
    id: 'service',
    label: 'Service',
    type: 'environmental',
    ring: 3,
    description: 'Faculty for results — e.g. Analysis & Design services.',
    status: 'standby',
  },
];

export const businessGraphLinks: BusinessGraphLink[] = [
  // Primary: brand hub → all nodes (middleware spokes)
  ...businessGraphNodes
    .filter((n) => n.type !== 'brand')
    .map((n) => ({ from: 'hub', to: n.id, type: 'primary' as const })),

  // Secondary: cross-zone links (sparse, readable)
  { from: 'executive', to: 'customer', type: 'secondary' },
  { from: 'production', to: 'schedules', type: 'secondary' },
  { from: 'customer', to: 'product', type: 'secondary' },
  { from: 'vendor', to: 'product', type: 'secondary' },
  { from: 'partner', to: 'knowledge', type: 'secondary' },
];
