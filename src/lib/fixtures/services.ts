// Public service catalog fixture.
// Services the business offers, displayed on the public website.

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
    name: 'AI Agent Integration',
    description:
      'Seamlessly integrate AI agents into your existing business workflows with custom role-based access control.',
    icon: 'Bot',
    features: [
      'Custom agent provisioning',
      'Role-based access control',
      'Real-time task coordination',
      'Workflow automation',
    ],
  },
  {
    id: 'svc-2',
    name: 'Mission Control Dashboard',
    description:
      'A unified dashboard for managing projects, tasks, people, and organizational structure in one place.',
    icon: 'LayoutDashboard',
    features: [
      'Project and task management',
      'Organizational hierarchy',
      'Knowledge base integration',
      'Real-time activity monitoring',
    ],
  },
  {
    id: 'svc-3',
    name: 'Voice-Enabled Systems',
    description:
      'Voice and messaging platforms that let your team and customers interact with business systems naturally.',
    icon: 'MessageSquare',
    features: [
      'Voice-to-text transcription',
      'Multi-language support',
      'Automated notifications',
      'Customer engagement tools',
    ],
  },
  {
    id: 'svc-4',
    name: 'Knowledge Management',
    description:
      'Centralized knowledge base with policies, processes, and articles organized by organizational unit.',
    icon: 'BookOpen',
    features: [
      'Policy and process documentation',
      'Org-unit scoped articles',
      'Full-text search',
      'Version-controlled content',
    ],
  },
  {
    id: 'svc-5',
    name: 'IoT Solutions',
    description:
      'Connect and manage IoT devices and sensors with real-time monitoring and automated responses.',
    icon: 'Cpu',
    features: [
      'Device management',
      'Real-time sensor data',
      'Automated alerting',
      'Custom dashboards',
    ],
  },
  {
    id: 'svc-6',
    name: 'Consulting & Architecture',
    description:
      'Strategic software architecture, systems integration, and IoT solutions tailored to your business.',
    icon: 'Lightbulb',
    features: [
      'System architecture design',
      'Technology stack selection',
      'Integration planning',
      'Technical due diligence',
    ],
  },
];
