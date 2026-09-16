// Install accounts only. Extra demo people live in the sample-data pack.

export interface UserFixture {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  type: 'human' | 'agent';
  password: string; // fixture-only; real auth will use hashed credentials
  department: string;
  department_id?: string;
  bio: string;
  status: 'active' | 'inactive';
  data?: Record<string, unknown>;
}

/** Always-on install identities. Never tagged ba_sample: and never removed by Delete Sample Data. */
export const INSTALL_USER_EMAILS = ["admin@example.com", "coa@example.com"] as const;

export function isInstallUserEmail(email: string | undefined | null): boolean {
  const normalized = (email ?? "").trim().toLowerCase();
  return (INSTALL_USER_EMAILS as readonly string[]).includes(normalized);
}

export const users: UserFixture[] = [
  {
    id: 'user-1',
    name: 'Administrator',
    email: 'admin@example.com',
    role: 'admin',
    type: 'human',
    password: 'mission2026',
    department: 'Leadership',
    department_id: 'dept-leadership',
    data: { job_title: 'Workspace administrator' },
    bio: 'Workspace administrator.',
    status: 'active',
  },
  {
    id: 'user-coa',
    name: 'COA',
    email: 'coa@example.com',
    role: 'admin',
    type: 'agent',
    password: 'mission2026',
    department: 'Leadership',
    department_id: 'dept-leadership',
    data: { job_title: 'Administrator agent (coa)' },
    bio: 'Administrator agent account (coa).',
    status: 'active',
  },
];
