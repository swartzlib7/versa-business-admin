// Public product catalog fixture.
// Generic offerings suitable as sample data for any business template.

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
    name: 'Starter Operations Kit',
    tagline: 'The essentials to run a small team well.',
    description:
      'A packaged set of templates and checklists for projects, meetings, hiring, and customer follow-up — ready to customize on day one.',
    category: 'Packages',
    status: 'available',
    features: [
      'Project and meeting templates',
      'Hiring scorecards',
      'Customer follow-up scripts',
      'Monthly ops review agenda',
    ],
  },
  {
    id: 'prod-2',
    name: 'Team Workspace',
    tagline: 'One place for work, people, and status.',
    description:
      'A simple workspace for projects, tasks, and team directories so everyone knows what is in progress and who owns it.',
    category: 'Platform',
    status: 'beta',
    features: [
      'Projects and tasks',
      'Role-based access',
      'Team directory',
      'Activity overview',
    ],
  },
  {
    id: 'prod-3',
    name: 'Customer Care Desk',
    tagline: 'Support that stays organized.',
    description:
      'A lightweight desk for intake, prioritization, and resolution of customer requests with clear ownership and history.',
    category: 'Service',
    status: 'available',
    features: [
      'Request intake forms',
      'Priority queues',
      'Response templates',
      'Satisfaction surveys',
    ],
  },
  {
    id: 'prod-4',
    name: 'Company Handbook',
    tagline: 'Policies and how-we-work, always current.',
    description:
      'A living handbook for policies, processes, and FAQs that new hires and veterans can trust.',
    category: 'Knowledge',
    status: 'available',
    features: [
      'Policy library',
      'Process guides',
      'Search',
      'Version history',
    ],
  },
];
