// Public facet catalog fixture.
// Maps 1:1 to the six Mission Control facets on the public homepage.
// Generic placeholder content — any business can map onto these.

export interface Service {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
  features: string[];
}

export const services: Service[] = [
  {
    id: 'facet-systems',
    name: 'Other Systems',
    description:
      'See every system the business runs — accounting, CRM, inventory, HR — and how they connect to Mission Control.',
    icon: 'Server',
    features: [
      'Connected system inventory',
      'Health and sync status',
      'Category grouping',
      'Planned vs active tracking',
    ],
  },
  {
    id: 'facet-integrations',
    name: 'Integrations',
    description:
      'Email, chat, CMS, source control, APIs, and more — all your tools wired into one dashboard.',
    icon: 'Plug',
    features: [
      'Email and messaging',
      'CMS and knowledge sync',
      'Source control and APIs',
      'Connection health monitoring',
    ],
  },
  {
    id: 'facet-operations',
    name: 'Operations',
    description:
      'Day-to-day run of the business — projects, tasks, workflows, and who owns what.',
    icon: 'LayoutDashboard',
    features: [
      'Project tracking',
      'Task assignment and status',
      'Priority and deadline management',
      'Activity overview',
    ],
  },
  {
    id: 'facet-support',
    name: 'Customer Support',
    description:
      'Inbox, tickets, and care loops — keep customers happy with clear ownership and response times.',
    icon: 'MessageSquare',
    features: [
      'Ticket intake and queues',
      'Priority and SLA tracking',
      'Multi-channel support',
      'Resolution history',
    ],
  },
  {
    id: 'facet-metrics',
    name: 'Metrics',
    description:
      'Simple KPI snapshots and health indicators — know where the business stands at a glance.',
    icon: 'BarChart3',
    features: [
      'Operational KPIs',
      'Support performance',
      'System health',
      'Trend indicators',
    ],
  },
  {
    id: 'facet-knowledge',
    name: 'Knowledge Articles',
    description:
      'Handbook, process docs, and searchable knowledge — so quality does not depend on a single person.',
    icon: 'BookOpen',
    features: [
      'Policy and process library',
      'Searchable articles',
      'Category organization',
      'Always-current docs',
    ],
  },
];
