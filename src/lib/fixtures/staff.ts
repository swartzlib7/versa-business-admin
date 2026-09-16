// Public staff fixture.
// Sample people + agents for a maker / production team.
// type human | agent retained for product boundary demos; names are fictional.

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
    role: 'Founder & Producer',
    type: 'human',
    bio: 'Sets the intention for what we make, protects quality, and keeps the human purpose at the center of every release.',
    department: 'Leadership',
  },
  {
    id: 'staff-2',
    name: 'Jordan Lee',
    role: 'Operations Lead',
    type: 'human',
    bio: 'Owns capacity, fulfillment cadence, and the practical systems that turn plans into shipped work.',
    department: 'Operations',
  },
  {
    id: 'staff-3',
    name: 'Sam Rivera',
    role: 'Craft Lead',
    type: 'human',
    bio: 'Guides design and build quality from prototype to finished product or service package.',
    department: 'Production',
  },
  {
    id: 'staff-4',
    name: 'Casey Nguyen',
    role: 'Customer Partner',
    type: 'human',
    bio: 'Helps buyers adopt what we ship and feeds real-world feedback back into the next production cycle.',
    department: 'Customer',
  },
  {
    id: 'staff-5',
    name: 'Riley Brooks',
    role: 'Story & Reach',
    type: 'human',
    bio: 'Tells the story of the work so the right makers and customers find us — without hype that outruns delivery.',
    department: 'Outreach',
  },
  {
    id: 'staff-6',
    name: 'Nova',
    role: 'Production Agent',
    type: 'agent',
    bio: 'A precision instrument for scheduling, research, and follow-through — works under human direction with memory and clear handoffs.',
    department: 'Agent Team',
  },
];
