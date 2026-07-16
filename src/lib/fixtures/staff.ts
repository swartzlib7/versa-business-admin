// Public staff fixture.
// People and roles displayed on the public website.
// Per product boundary #5-6: users and agents differ only by type field.
// No agent-management chrome on the public site.

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  type: 'human' | 'agent';
  bio: string;
  department: string;
}

export const staff: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'Stephen Nortje',
    role: 'Executive Director',
    type: 'human',
    bio: 'Software architect and systems integrator with expertise in AI-powered business operations, IoT solutions, and 3D modeling.',
    department: 'Executive',
  },
  {
    id: 'staff-2',
    name: 'Versa',
    role: 'Chief Orchestrator',
    type: 'agent',
    bio: 'AI orchestrator agent responsible for coordinating work across projects, managing sub-agents, and ensuring strategic alignment.',
    department: 'Operations',
  },
  {
    id: 'staff-3',
    name: 'Web Dev',
    role: 'Lead Developer',
    type: 'agent',
    bio: 'AI developer agent specializing in full-stack web development, system architecture, and code quality.',
    department: 'Engineering',
  },
  {
    id: 'staff-4',
    name: 'Researcher',
    role: 'Subject Matter Researcher',
    type: 'agent',
    bio: 'AI research agent focused on gathering, analyzing, and synthesizing information across technical and business domains.',
    department: 'Research',
  },
  {
    id: 'staff-5',
    name: 'Outreach',
    role: 'Marketing Manager',
    type: 'agent',
    bio: 'AI marketing agent handling outreach, brand strategy, and customer engagement initiatives.',
    department: 'Marketing',
  },
  {
    id: 'staff-6',
    name: 'Sylvie',
    role: 'Creative Specialist',
    type: 'agent',
    bio: 'AI creative agent supporting content creation, design, and multimedia production.',
    department: 'Creative',
  },
];
