// Business graph fixture for the 3D Mission Control hub visualization.
// Keystone ERD v1.1 — three concentric zones on a true XYZ axial system (I5.5.3).
//   Center = Executive (organization) — product name Versa AGi is chrome only
//   Zone 1 = Organization (departments)
//   Zone 2 = Collaboration (parties)
//   Zone 3 = Environmental (context)
// Placement: spheres sit ON the axis planes, evenly spaced along each half-axis.
// Sphere diameter ≈ 20% of the zone step (proportional to axis lines).
// Source of truth: docs/specs/MISSION_CONTROL_ERD_KEYSTONE.md (v1.1)

export type GraphNodeType = 'organization' | 'collaboration' | 'environmental';

/** Local pose in the Mission Control scene (Y-up, meters-ish units). */
export type GraphPosition = [number, number, number];

/** Which half-axis a node occupies for even distribution. */
export type AxisSlot = '+x' | '-x' | '+y' | '-y' | '+z' | '-z' | 'origin';

export interface BusinessGraphNode {
  id: string;
  label: string;
  type: GraphNodeType;
  ring: number; // 0 = center, 1 = organization, 2 = collaboration, 3 = environmental
  description: string;
  status: 'connected' | 'active' | 'standby';
  /** Preferred half-axis for layout (I5.5.3). */
  axis: AxisSlot;
  /** Explicit 3D pose — computed from axis + ring for proportional layout. */
  position: GraphPosition;
}

export interface BusinessGraphLink {
  from: string;
  to: string;
  type: 'primary' | 'secondary';
}

/**
 * Zone step along each axis (center-to-zone-1, zone-1-to-zone-2, …).
 * Sphere diameter targets ~20% of STEP (Stephen I5.5.3).
 * STEP=2.8 → diameter≈0.56 → radius≈0.28 for zone nodes; center slightly larger.
 */
export const AXIS_STEP = 2.8;

/** Zone circle radii (intersecting circles on XY / XZ / YZ planes). */
export const ZONE_RADII = [0, AXIS_STEP, AXIS_STEP * 2, AXIS_STEP * 3] as const;

/** @deprecated use ZONE_RADII — kept for any residual imports */
export const RING_RADII = ZONE_RADII;

/** Suggested sphere radii (world units) — diameter ≈ 0.2 * AXIS_STEP for zone nodes. */
export const SPHERE_RADIUS = {
  center: 0.55, // ~20% of AXIS_STEP as diameter-ish visual weight
  organization: 0.28,
  collaboration: 0.26,
  environmental: 0.24,
} as const;

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

/**
 * Evenly distribute multiple nodes that share the same half-axis.
 * ring values become ordered slots 1..N along that ray at STEP, 2*STEP, …
 */
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
    // Sort by intended ring so org stays inward of collab/env on same ray
    const sorted = [...list].sort((a, b) => a.ring - b.ring);
    sorted.forEach((d) => {
      // Distance from center = zone radius for this node's ring (not slot index)
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
  {
    id: 'executive',
    label: 'Executive',
    type: 'organization',
    ring: 0,
    description:
      'Business executive function. Center of the operating graph. Parent path for Projects and Tasks.',
    status: 'active',
    axis: 'origin',
  },
  // Organization — zone 1 (inner)
  {
    id: 'communications',
    label: 'Communications',
    type: 'organization',
    ring: 1,
    description: 'Internal and external communications department.',
    status: 'connected',
    axis: '-x',
  },
  {
    id: 'dissemination',
    label: 'Dissemination',
    type: 'organization',
    ring: 1,
    description: 'Distribution and publishing of information and materials.',
    status: 'connected',
    axis: '+x',
  },
  {
    id: 'treasury',
    label: 'Treasury',
    type: 'organization',
    ring: 1,
    description: 'Financial management, treasury, and fiscal oversight.',
    status: 'connected',
    axis: '-z',
  },
  {
    id: 'production',
    label: 'Production',
    type: 'organization',
    ring: 1,
    description: 'Production scheduling, delivery tracking, and operations.',
    status: 'connected',
    axis: '+z',
  },
  {
    id: 'qualification',
    label: 'Qualification',
    type: 'organization',
    ring: 1,
    description: 'Quality assurance, compliance, and qualification processes.',
    status: 'standby',
    axis: '-y',
  },
  // Collaboration — zone 2
  {
    id: 'vendor',
    label: 'Vendor',
    type: 'collaboration',
    ring: 2,
    description: 'Service provider — external supplier of goods or services.',
    status: 'connected',
    axis: '+x',
  },
  {
    id: 'customer',
    label: 'Customer',
    type: 'collaboration',
    ring: 2,
    description: 'Person or business that receives products or services.',
    status: 'active',
    axis: '+z',
  },
  {
    id: 'partner',
    label: 'Partner',
    type: 'collaboration',
    ring: 2,
    description: 'Business or investor in a collaborative relationship.',
    status: 'connected',
    axis: '-x',
  },
  {
    id: 'branch',
    label: 'Branch',
    type: 'collaboration',
    ring: 2,
    description: 'Subsidiary — a subordinate operating unit of the organization.',
    status: 'connected',
    axis: '-z',
  },
  // Environmental — zone 3
  {
    id: 'locations',
    label: 'Locations',
    type: 'environmental',
    ring: 3,
    description: 'Global address book of business locations and places.',
    status: 'connected',
    axis: '-y',
  },
  {
    id: 'events',
    label: 'Events',
    type: 'environmental',
    ring: 3,
    description: 'Past or future planned activities and milestones.',
    status: 'active',
    axis: '+y',
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
  {
    id: 'product',
    label: 'Product',
    type: 'environmental',
    ring: 3,
    description: 'Device, manufactured item, or computer file. Integrations live under Product.',
    status: 'active',
    axis: '+x',
  },
  {
    id: 'service',
    label: 'Service',
    type: 'environmental',
    ring: 3,
    description: 'Faculty for results — e.g. Analysis & Design services.',
    status: 'standby',
    axis: '-x',
  },
];

export const businessGraphNodes: BusinessGraphNode[] = layoutByAxis(nodeDefs);

export const businessGraphLinks: BusinessGraphLink[] = [
  // Primary: Executive center → all other nodes
  ...businessGraphNodes
    .filter((n) => n.id !== 'executive')
    .map((n) => ({ from: 'executive', to: n.id, type: 'primary' as const })),

  // Secondary: sparse cross-zone (I5.5.4 — dropped partner-knowledge, vendor-product, customer-product)
  { from: 'executive', to: 'customer', type: 'secondary' },
  { from: 'production', to: 'schedules', type: 'secondary' },
];
