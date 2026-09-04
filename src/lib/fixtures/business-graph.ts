// Business graph fixture for the 3D Mission Control hub visualization.
// I5.6 org-board (Stephen 2026-07-21):
//   Center = Executive (hub blue) — sphere at origin
//   Executive is a real center sphere (not a floating clickable label)
//   Zone 1 = Organization (Public +y; no Service/Product hub spheres)
//   Zone 2 = Collaboration (parties) — greens unchanged
//   Zone 3 = Environmental (context) — Events top / Locations bottom
// Placement: spheres on axis planes; distance = ZONE_RADII[ring].
// Source of truth: docs/production/state/state_i5_6_zone_erd.md
// Sphere click copy: docs/design/org_board/transcription.md via org-board.ts

import { hubDescriptionFor } from "@/lib/fixtures/org-board";

export type GraphNodeType = 'organization' | 'collaboration' | 'environmental';

/** Local pose in the Mission Control scene (Y-up, meters-ish units). */
export type GraphPosition = [number, number, number];

/** Which half-axis a node occupies for even distribution. */
export type AxisSlot = '+x' | '-x' | '+y' | '-y' | '+z' | '-z' | 'origin';

export interface BusinessGraphNode {
  id: string;
  label: string;
  type: GraphNodeType;
  ring: number; // 0 = center (Executive), 1 = organization, 2 = collaboration, 3 = environmental
  description: string;
  status: 'connected' | 'active' | 'standby';
  /** Preferred half-axis for layout. */
  axis: AxisSlot;
  /** Explicit 3D pose — computed from axis + ring. */
  position: GraphPosition;
}

export interface BusinessGraphLink {
  from: string;
  to: string;
  type: 'primary' | 'secondary';
}

/**
 * Zone step along each axis.
 * Sphere diameter targets ~20% of STEP (Stephen I5.5.3).
 */
export const AXIS_STEP = 2.8;

/** Zone circle radii (intersecting circles on XY / XZ / YZ planes). */
export const ZONE_RADII = [0, AXIS_STEP, AXIS_STEP * 2, AXIS_STEP * 3] as const;

/** @deprecated use ZONE_RADII */
export const RING_RADII = ZONE_RADII;

/** Suggested sphere radii (world units). */
export const SPHERE_RADIUS = {
  center: 0.28,  // same size as other org spheres
  organization: 0.28,
  collaboration: 0.26,
  environmental: 0.24,
} as const;

/** Hub center node id (I5.6 board — Executive sphere at origin). */
export const HUB_CENTER_ID = 'executive' as const;

function axisPosition(axis: AxisSlot, ring: number): GraphPosition {
  if (axis === 'origin' || ring === 0) return [0, 0, 0];
  const d = ZONE_RADII[ring] ?? AXIS_STEP * ring;
  switch (axis) {
    case '+x': return [d, 0, 0];
    case '-x': return [-d, 0, 0];
    case '+y': return [0, d, 0];
    case '-y': return [0, -d, 0];
    case '+z': return [0, 0, d];
    case '-z': return [0, 0, -d];
    default: return [0, 0, 0];
  }
}

function layoutByAxis(
  defs: Omit<BusinessGraphNode, 'position'>[]
): BusinessGraphNode[] {
  const byAxis = new Map<AxisSlot, Omit<BusinessGraphNode, 'position'>[]>();
  for (const d of defs) {
    const list = byAxis.get(d.axis) ?? [];
    list.push(d);
    byAxis.set(d.axis, list);
  }

  const out: BusinessGraphNode[] = [];
  for (const [axis, list] of byAxis) {
    if (axis === 'origin') {
      for (const d of list) out.push({ ...d, position: [0, 0, 0] });
      continue;
    }
    const sorted = [...list].sort((a, b) => a.ring - b.ring);
    sorted.forEach((d) => {
      const dist = ZONE_RADII[d.ring] ?? AXIS_STEP * d.ring;
      let position: GraphPosition;
      switch (axis) {
        case '+x': position = [dist, 0, 0]; break;
        case '-x': position = [-dist, 0, 0]; break;
        case '+y': position = [0, dist, 0]; break;
        case '-y': position = [0, -dist, 0]; break;
        case '+z': position = [0, 0, dist]; break;
        case '-z': position = [0, 0, -dist]; break;
        default: position = axisPosition(axis, d.ring);
      }
      out.push({ ...d, position });
    });
  }
  return out;
}

const nodeDefs: Omit<BusinessGraphNode, 'position'>[] = [
  // Center — Executive sphere (I5.6 board). Hub blue in scene.
  {
    id: 'executive',
    label: 'Executive',
    type: 'organization',
    ring: 0,
    description: hubDescriptionFor(
      'executive',
      'Business executive function — center sphere of the Organization zone.',
    ),
    status: 'active',
    axis: 'origin',
  },

  // Organization — zone 1 (inner). Public at top (+Y). Service/Product nest under Production.
  {
    id: 'communications',
    label: 'Communications',
    type: 'organization',
    ring: 1,
    description: hubDescriptionFor(
      'communications',
      'Internal and external communications department.',
    ),
    status: 'connected',
    axis: '-x',
  },
  {
    id: 'dissemination',
    label: 'Dissemination',
    type: 'organization',
    ring: 1,
    description: hubDescriptionFor(
      'dissemination',
      'Distribution and publishing of information and materials.',
    ),
    status: 'connected',
    axis: '+x',
  },
  {
    id: 'treasury',
    label: 'Treasury',
    type: 'organization',
    ring: 1,
    description: hubDescriptionFor(
      'treasury',
      'Financial management, treasury, and fiscal oversight.',
    ),
    status: 'connected',
    axis: '-z',
  },
  {
    id: 'production',
    label: 'Production',
    type: 'organization',
    ring: 1,
    description: hubDescriptionFor(
      'production',
      'Making and delivering work product. Owns Product and Service as nested objects.',
    ),
    status: 'connected',
    axis: '+z',
  },
  {
    id: 'qualification',
    label: 'Qualification',
    type: 'organization',
    ring: 1,
    description: hubDescriptionFor(
      'qualification',
      'Quality assurance, compliance, and qualification processes.',
    ),
    status: 'standby',
    axis: '-y',
  },
  {
    id: 'public',
    label: 'Distribution',
    type: 'organization',
    ring: 1,
    description: hubDescriptionFor(
      'public',
      'Distribution faculty — brings knowledge of and distributes services and products to the public.',
    ),
    status: 'connected',
    axis: '+y',
  },

  // Collaboration — zone 2. I5.6.2: CB ±x Y-orbit; VP fixture ±y but +π/2 X-phase => effective ±z rest so greens never coincide
  {
    id: 'vendor',
    label: 'Vendor',
    type: 'collaboration',
    ring: 2,
    description: 'Service provider — external supplier of goods or services.',
    status: 'connected',
    axis: '-y',
  },
  {
    id: 'customer',
    label: 'Customer',
    type: 'collaboration',
    ring: 2,
    description: 'Person or business that receives products or services.',
    status: 'active',
    axis: '+x',
  },
  {
    id: 'partner',
    label: 'Partner',
    type: 'collaboration',
    ring: 2,
    description: 'Business or investor in a collaborative relationship.',
    status: 'connected',
    axis: '+y',
  },
  {
    id: 'branch',
    label: 'Branch',
    type: 'collaboration',
    ring: 2,
    description: 'Subsidiary — a subordinate operating unit of the organization.',
    status: 'connected',
    axis: '-x',
  },

  // Environmental — zone 3. I5.6.25: Events right of Customer (+x); Locations left of Branch (−x)
  // (I5.6.5 had the opposite pairing; phase offsets later parked them on ±y when anim stopped.)
  {
    id: 'locations',
    label: 'Locations',
    type: 'environmental',
    ring: 3,
    description: 'Global address book of business locations and places.',
    status: 'connected',
    axis: '-x',
  },
  {
    id: 'events',
    label: 'Events',
    type: 'environmental',
    ring: 3,
    description: 'Past or future planned activities and milestones.',
    status: 'active',
    axis: '+x',
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    type: 'environmental',
    ring: 3,
    description: 'Documents, recordings, photos, policies, and research.',
    status: 'connected',
    axis: '-z',
  },
  {
    id: 'schedules',
    label: 'Schedules',
    type: 'environmental',
    ring: 3,
    description: 'Calendar-like agreements — when events, activities, or tasks occur.',
    status: 'connected',
    axis: '+z',
  },
];

export const businessGraphNodes: BusinessGraphNode[] = layoutByAxis(nodeDefs);

export const businessGraphLinks: BusinessGraphLink[] = [
  // I5.5.9: no center spokes, no product->customer, no production->env dotted.
];
