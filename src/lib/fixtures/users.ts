// User fixture for I5 auth + RBAC skeleton.
// Per product boundary #5-6: users and agents differ only by type field.
// Roles: admin (full access) | member (read-only backend access).

export interface UserFixture {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  type: "human" | "agent";
  password: string; // fixture-only; real auth will use hashed credentials
  department: string;
  bio: string;
  status: "active" | "inactive";
}

export const users: UserFixture[] = [
  {
    id: "user-1",
    name: "Stephen Nortje",
    email: "stephen@versa.ai",
    role: "admin",
    type: "human",
    password: "mission2026",
    department: "Executive",
    bio: "Executive Director. Software architect and systems integrator.",
    status: "active",
  },
  {
    id: "user-2",
    name: "Versa (COA)",
    email: "versa@versa.ai",
    role: "admin",
    type: "agent",
    password: "mission2026",
    department: "Operations",
    bio: "Chief Orchestrator Agent coordinating work across projects.",
    status: "active",
  },
  {
    id: "user-3",
    name: "Web Dev",
    email: "webdev@versa.ai",
    role: "member",
    type: "agent",
    password: "mission2026",
    department: "Engineering",
    bio: "Developer Agent specializing in full-stack web development.",
    status: "active",
  },
  {
    id: "user-4",
    name: "Researcher",
    email: "researcher@versa.ai",
    role: "member",
    type: "agent",
    password: "mission2026",
    department: "Research",
    bio: "Research agent focused on technical and business analysis.",
    status: "active",
  },
  {
    id: "user-5",
    name: "Outreach",
    email: "outreach@versa.ai",
    role: "member",
    type: "agent",
    password: "mission2026",
    department: "Marketing",
    bio: "Marketing agent handling outreach and brand strategy.",
    status: "active",
  },
  {
    id: "user-6",
    name: "Sylvie",
    email: "sylvie@versa.ai",
    role: "member",
    type: "agent",
    password: "mission2026",
    department: "Creative",
    bio: "Creative agent supporting content creation and design.",
    status: "active",
  },
];
