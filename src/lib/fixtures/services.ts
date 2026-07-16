// Public service catalog fixture.
// Generic services any professional services / SMB business might list.

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
    name: 'Strategy & Planning',
    description:
      'Work with leadership to clarify goals, priorities, and a practical roadmap for the next quarter and year.',
    icon: 'Lightbulb',
    features: [
      'Goal and KPI workshops',
      'Roadmap facilitation',
      'Risk and opportunity review',
      'Executive briefings',
    ],
  },
  {
    id: 'svc-2',
    name: 'Operations Support',
    description:
      'Improve day-to-day workflows so teams deliver consistently without unnecessary friction.',
    icon: 'LayoutDashboard',
    features: [
      'Process mapping',
      'Standard operating procedures',
      'Handoff and SLA design',
      'Continuous improvement loops',
    ],
  },
  {
    id: 'svc-3',
    name: 'Customer Experience',
    description:
      'Design how customers discover, buy, and get support — with clear channels and measurable quality.',
    icon: 'MessageSquare',
    features: [
      'Journey mapping',
      'Support playbooks',
      'Feedback collection',
      'Retention programs',
    ],
  },
  {
    id: 'svc-4',
    name: 'Knowledge & Training',
    description:
      'Capture how work is done and train people so quality does not depend on a single expert.',
    icon: 'BookOpen',
    features: [
      'Policy and process docs',
      'Role-based training paths',
      'Searchable knowledge base',
      'Onboarding kits',
    ],
  },
  {
    id: 'svc-5',
    name: 'Project Delivery',
    description:
      'Plan, track, and close projects with transparent status, owners, and outcomes.',
    icon: 'FolderKanban',
    features: [
      'Project charters',
      'Milestone tracking',
      'Resource planning',
      'Post-project reviews',
    ],
  },
  {
    id: 'svc-6',
    name: 'Technology Advisory',
    description:
      'Choose and integrate tools that fit your size and budget — without locking you into unnecessary complexity.',
    icon: 'Cpu',
    features: [
      'Stack selection',
      'Integration planning',
      'Vendor evaluation',
      'Security basics review',
    ],
  },
];
