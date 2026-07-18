// Public product catalog fixture.
// Sample offerings a maker / small producer might list — white-label, not Versa-branded.

export interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  status: 'available' | 'beta' | 'coming-soon';
  features: string[];
}

export const products: Product[] = [
  {
    id: 'prod-1',
    name: 'Maker Starter Kit',
    tagline: 'Templates to go from idea to first sale.',
    description:
      'A packaged set of checklists and templates for product specs, first offers, fulfillment, and customer follow-up — ready to customize on day one.',
    category: 'Packages',
    status: 'available',
    features: [
      'Product brief template',
      'Offer and pricing sheet',
      'Fulfillment checklist',
      'First-customer follow-up',
    ],
  },
  {
    id: 'prod-2',
    name: 'Production Workspace',
    tagline: 'One place for projects, tasks, and the people who ship them.',
    description:
      'A simple workspace for projects, tasks, and team directories so makers and operators know what is in progress and who owns it — humans and agents included.',
    category: 'Platform',
    status: 'beta',
    features: [
      'Projects and tasks',
      'Role-based access',
      'Team directory (people + agents)',
      'Activity overview',
    ],
  },
  {
    id: 'prod-3',
    name: 'Customer Care Desk',
    tagline: 'Support that stays organized while you keep making.',
    description:
      'A lightweight desk for intake, prioritization, and resolution of customer requests with clear ownership and history.',
    category: 'Service',
    status: 'available',
    features: [
      'Request intake',
      'Priority queues',
      'Response templates',
      'Satisfaction check-ins',
    ],
  },
  {
    id: 'prod-4',
    name: 'Craft Handbook',
    tagline: 'How we make things — always current.',
    description:
      'A living handbook for recipes, policies, and how-we-work guides that new collaborators and veterans can trust.',
    category: 'Knowledge',
    status: 'available',
    features: [
      'Process library',
      'Quality standards',
      'Search',
      'Version history',
    ],
  },
];
