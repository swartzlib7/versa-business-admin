// User fixture for auth + RBAC skeleton.
// Demo accounts use example.com — not production identities.

export interface UserFixture {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  type: 'human' | 'agent';
  password: string; // fixture-only; real auth will use hashed credentials
  department: string;
  bio: string;
  status: 'active' | 'inactive';
}

export const users: UserFixture[] = [
  {
    id: 'user-1',
    name: 'Alex Morgan',
    email: 'admin@example.com',
    role: 'admin',
    type: 'human',
    password: 'mission2026',
    department: 'Leadership',
    bio: 'Founder and producer for the sample maker workspace.',
    status: 'active',
  },
  {
    id: 'user-2',
    name: 'Ops Assistant',
    email: 'ops-assistant@example.com',
    role: 'admin',
    type: 'agent',
    password: 'mission2026',
    department: 'Operations',
    bio: 'Sample agent account with admin role for demos.',
    status: 'active',
  },
  {
    id: 'user-3',
    name: 'Jordan Lee',
    email: 'member@example.com',
    role: 'member',
    type: 'human',
    password: 'mission2026',
    department: 'Operations',
    bio: 'Operations lead keeping production on cadence.',
    status: 'active',
  },
  {
    id: 'user-4',
    name: 'Research Assistant',
    email: 'research@example.com',
    role: 'member',
    type: 'agent',
    password: 'mission2026',
    department: 'Research',
    bio: 'Sample agent account with member role.',
    status: 'active',
  },
  {
    id: 'user-5',
    name: 'Casey Nguyen',
    email: 'success@example.com',
    role: 'member',
    type: 'human',
    password: 'mission2026',
    department: 'Customer',
    bio: 'Customer partner helping buyers adopt what we ship.',
    status: 'active',
  },
  {
    id: 'user-6',
    name: 'Riley Brooks',
    email: 'marketing@example.com',
    role: 'member',
    type: 'human',
    password: 'mission2026',
    department: 'Outreach',
    bio: 'Story and reach lead for the public brand.',
    status: 'active',
  },
];
