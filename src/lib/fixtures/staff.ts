// Public staff fixture.
// Generic people and roles for the sample business template.
// type human | agent is retained for product boundary demos; names are fictional.

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
    name: 'Alex Morgan',
    role: 'Managing Director',
    type: 'human',
    bio: 'Leads client relationships and sets the standard for delivery quality across engagements.',
    department: 'Executive',
  },
  {
    id: 'staff-2',
    name: 'Jordan Lee',
    role: 'Operations Lead',
    type: 'human',
    bio: 'Owns day-to-day workflows, capacity planning, and continuous improvement of internal processes.',
    department: 'Operations',
  },
  {
    id: 'staff-3',
    name: 'Sam Rivera',
    role: 'Delivery Manager',
    type: 'human',
    bio: 'Coordinates projects from kickoff to close-out and keeps stakeholders informed.',
    department: 'Delivery',
  },
  {
    id: 'staff-4',
    name: 'Casey Nguyen',
    role: 'Customer Success',
    type: 'human',
    bio: 'Helps clients adopt recommendations and measures outcomes after go-live.',
    department: 'Customer Success',
  },
  {
    id: 'staff-5',
    name: 'Riley Brooks',
    role: 'Marketing Lead',
    type: 'human',
    bio: 'Shapes brand messaging, campaigns, and content that attract the right customers.',
    department: 'Marketing',
  },
  {
    id: 'staff-6',
    name: 'Taylor Quinn',
    role: 'People Partner',
    type: 'human',
    bio: 'Supports hiring, onboarding, and a healthy culture so the team can do its best work.',
    department: 'People',
  },
];
