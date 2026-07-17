// Public service catalog fixture.
// Oriented to makers, founders, and producers — not consulting-firm packaging.

export interface Service {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
  features: string[];
}

export const services: Service[] = [
  {
    id: 'svc-1',
    name: 'Intention to Plan',
    description:
      'Turn a clear ambition into a workable plan — what you will make, for whom, and what “done” looks like.',
    icon: 'Lightbulb',
    features: [
      'Postulate and goal framing',
      'Offer and audience clarity',
      'Milestone roadmap',
      'Risk and capacity check',
    ],
  },
  {
    id: 'svc-2',
    name: 'Make & Ship',
    description:
      'Run the day-to-day production loop: design, build, package, and deliver products or services on a reliable cadence.',
    icon: 'LayoutDashboard',
    features: [
      'Production workflows',
      'Quality checkpoints',
      'Release and fulfillment',
      'Iteration after feedback',
    ],
  },
  {
    id: 'svc-3',
    name: 'Sell & Serve',
    description:
      'Connect what you make to people who need it — discovery, offers, orders, and ongoing care without losing the craft.',
    icon: 'MessageSquare',
    features: [
      'Offer and pricing pages',
      'Customer conversations',
      'Order and delivery tracking',
      'Retention and referrals',
    ],
  },
  {
    id: 'svc-4',
    name: 'Knowledge & Craft',
    description:
      'Capture how the work is done so quality does not live in one person’s head — and so new makers can join faster.',
    icon: 'BookOpen',
    features: [
      'Process and recipe docs',
      'Training paths',
      'Searchable knowledge base',
      'Onboarding kits',
    ],
  },
  {
    id: 'svc-5',
    name: 'Projects & Tasks',
    description:
      'Keep production visible: owners, priorities, due dates, and status so ambition becomes finished work.',
    icon: 'FolderKanban',
    features: [
      'Project charters',
      'Task ownership',
      'Priority and filters',
      'Progress reviews',
    ],
  },
  {
    id: 'svc-6',
    name: 'Human + Agent Team',
    description:
      'Pair people with precision AI agents as extensions of the work — memory, scheduling, and collaboration under human direction.',
    icon: 'Bot',
    features: [
      'Role clarity (human vs agent)',
      'Approvals and handoffs',
      'Cross-language collaboration',
      'Audit-friendly communication',
    ],
  },
];
