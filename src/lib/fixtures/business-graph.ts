// Business graph fixture for the 3D Mission Control hub visualization.
// Keystone ERD v1.1 — three concentric zones:
//   Center = Executive (organization) — product name Versa AGi is chrome only
//   Ring 1 = Organization (departments as spheres)
//   Ring 2 = Collaboration (parties the org works with)
//   Ring 3 = Environmental (context of work)
// Explicit [x,y,z] positions (Y-up) + I5.5.2: center=Executive, visible XYZ axes.
// Source of truth: docs/specs/MISSION_CONTROL_ERD_KEYSTONE.md (v1.1)

export type GraphNodeType = 'organization' | 'collaboration' | 'environmental';

/** Local pose in the Mission Control scene (Y-up, meters-ish units). */
export type GraphPosition = [number, number, number];

export interface BusinessGraphNode {
  id: string;
  label: string;
  type: GraphNodeType;
  ring: number; // 0 = brand, 1 = organization, 2 = collaboration, 3 = environmental
  description: string;
  status: 'connected' | 'active' | 'standby';
  /** Explicit 3D pose. Required for semantic layout (not equal-angle disc). */
  position: GraphPosition;
}

export interface BusinessGraphLink {
  from: string;
  to: string;
  type: 'primary' | 'secondary';
}

// Ring guide radii (scene may still draw rings; nodes may leave the disc).
export const RING_RADII = [0, 2.8, 4.2, 6.2] as const;
const R2 = RING_RADII[2];
const R3 = RING_RADII[3];

export const businessGraphNodes: BusinessGraphNode[] = [
  // Ring 1 — Organization (departments as spheres)
  // Center — Executive (I5.5.2). Compass + Qualification bottom (negative Y).
  {
    id: 'executive',
    label: 'Executive',
    type: 'organization',
    ring: 0,
    description: 'Business executive function. Center of the operating graph. Parent path for Projects and Tasks.',
    status: 'active',
    position: [0, 0, 0],
  },
  {
    id: 'communications',
    label: 'Communications',
    type: 'organization',
    ring: 1,
    description: 'Internal and external communications department.',
    status: 'connected',
    position: [-1.2, 0.1, 0],
  },
  {
    id: 'dissemination',
    label: 'Dissemination',
    type: 'organization',
    ring: 1,
    description: 'Distribution and publishing of information and materials.',
    status: 'connected',
    position: [1.2, 0.1, 0],
  },
  {
    id: 'treasury',
    label: 'Treasury',
    type: 'organization',
    ring: 1,
    description: 'Financial management, treasury, and fiscal oversight.',
    status: 'connected',
    position: [0, 0.1, -2.2],
  },
  {
    id: 'production',
    label: 'Production',
    type: 'organization',
    ring: 1,
    description: 'Production scheduling, delivery tracking, and operations.',
    status: 'connected',
    position: [0, 0.1, 2.2],
  },
  {
    id: 'qualification',
    label: 'Qualification',
    type: 'organization',
    ring: 1,
    description: 'Quality assurance, compliance, and qualification processes.',
    status: 'standby',
    position: [0, -1.3, 0.4],
  },

  // Ring 2 — Collaboration (compass on mid ring)
  {
    id: 'vendor',
    label: 'Vendor',
    type: 'collaboration',
    ring: 2,
    description: 'Service provider — external supplier of goods or services.',
    status: 'connected',
    position: [R2, 0.2, 0],
  },
  {
    id: 'customer',
    label: 'Customer',
    type: 'collaboration',
    ring: 2,
    description: 'Person or business that receives products or services.',
    status: 'active',
    position: [0, 0.2, R2],
  },
  {
    id: 'partner',
    label: 'Partner',
    type: 'collaboration',
    ring: 2,
    description: 'Business or investor in a collaborative relationship.',
    status: 'connected',
    position: [-R2, 0.2, 0],
  },
  {
    id: 'branch',
    label: 'Branch',
    type: 'collaboration',
    ring: 2,
    description: 'Subsidiary — a subordinate operating unit of the organization.',
    status: 'connected',
    position: [0, 0.2, -R2],
  },

  // Ring 3 — Environmental (outer compass + Service top / Product bottom)
  {
    id: 'locations',
    label: 'Locations',
    type: 'environmental',
    ring: 3,
    description: 'Global address book of business locations and places.',
    status: 'connected',
    position: [-R3, 0.35, 0],
  },
  {
    id: 'events',
    label: 'Events',
    type: 'environmental',
    ring: 3,
    description: 'Past or future planned activities and milestones.',
    status: 'active',
    position: [R3, 0.35, 0],
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    type: 'environmental',
    ring: 3,
    description: 'Documents, recordings, photos, policies, and research.',
    status: 'connected',
    position: [0, 0.35, -R3],
  },
  {
    id: 'schedules',
    label: 'Schedules',
    type: 'environmental',
    ring: 3,
    description: 'Calendar-like agreements — when events, activities, or tasks occur.',
    status: 'connected',
    position: [0, 0.35, R3],
  },
  {
    id: 'product',
    label: 'Product',
    type: 'environmental',
    ring: 3,
    description: 'Device, manufactured item, or computer file. Integrations live under Product.',
    status: 'active',
    position: [0.8, -1.6, 0.6],
  },
  {
    id: 'service',
    label: 'Service',
    type: 'environmental',
    ring: 3,
    description: 'Faculty for results — e.g. Analysis & Design services.',
    status: 'standby',
    position: [-0.8, 1.8, 0.6],
  },
];

export const businessGraphLinks: BusinessGraphLink[] = [
  // Primary: Executive center → all other nodes
  ...businessGraphNodes
    .filter((n) => n.id !== 'executive')
    .map((n) => ({ from: 'executive', to: n.id, type: 'primary' as const })),

  // Secondary: cross-zone links (sparse, readable)
  { from: 'executive', to: 'customer', type: 'secondary' },
  { from: 'production', to: 'schedules', type: 'secondary' },
  { from: 'customer', to: 'product', type: 'secondary' },
  { from: 'vendor', to: 'product', type: 'secondary' },
  { from: 'partner', to: 'knowledge', type: 'secondary' },
];
