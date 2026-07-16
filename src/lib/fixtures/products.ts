// Public product catalog fixture.
// Products the business offers, displayed on the public website.

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
    name: 'Versa AGi Mission',
    tagline: 'Mission control for AI-powered businesses.',
    description:
      'A standalone, white-labelable mission control product that gives business staff a unified interface for projects, tasks, people, and knowledge — with optional AI agent participation.',
    category: 'Platform',
    status: 'beta',
    features: [
      'Public website builder',
      'Role-based access control',
      'Project & task management',
      'Organizational structure',
      'Knowledge base',
    ],
  },
  {
    id: 'prod-2',
    name: 'VersaVoice',
    tagline: 'Voice and messaging for AI collaboration.',
    description:
      'A voice and messaging platform that enables natural communication between people and AI agents, with multi-language support and automated workflows.',
    category: 'Communication',
    status: 'available',
    features: [
      'Voice messages with TTS',
      'AI translation',
      'Agent-to-agent messaging',
      'Emotion-aware responses',
    ],
  },
  {
    id: 'prod-3',
    name: 'Smart Yard',
    tagline: 'IoT-powered property management.',
    description:
      'A smart yard management application with real-time sensor monitoring, automated irrigation, and device control accessible from any device on your local network.',
    category: 'IoT',
    status: 'available',
    features: [
      'Real-time sensor dashboard',
      'Automated irrigation',
      'Device control',
      'LAN-first access',
    ],
  },
  {
    id: 'prod-4',
    name: 'AGi Knowledgebase',
    tagline: 'Collaborative documentation for teams and agents.',
    description:
      'A markdown-native knowledge base system built on Grav CMS, designed for collaborative documentation between human staff and AI agents.',
    category: 'Knowledge',
    status: 'available',
    features: [
      'Markdown-native editing',
      'Full-text search',
      'Mobile-friendly',
      'Agent-accessible API',
    ],
  },
];
