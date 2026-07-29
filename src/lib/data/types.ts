// Re-export fixture types as the canonical data types for the adapter layer.
// When real host adapters are added, these types become the contract.

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: "active" | "idle" | "error" | "offline";
  model: string;
  lastActive: string;
}

// --- I6: Business work-surface types ---

export interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "completed" | "archived";
  ownerUserId: string;
  ownerName: string;
  priority: "low" | "normal" | "high";
  startDate: string | null;
  targetDate: string | null;
  taskCount: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "planned" | "in_progress" | "waiting" | "blocked" | "done";
  priority: "low" | "normal" | "high" | "urgent";
  projectId: string;
  projectName: string;
  assigneeUserId: string;
  assigneeName: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Integration {
  id: string;
  name: string;
  type: "email" | "cms" | "database" | "api" | "iot" | "messaging";
  status: "connected" | "disconnected" | "error";
  lastSync: string;
  description: string;
}

// --- Public site types (I4) ---

export interface BusinessProfile {
  name: string;
  slogan: string;
  logoUrl: string;
  description: string;
  purpose: string;
  production: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  website: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  icon: string;
  features: string[];
}

export interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  status: "available" | "beta" | "coming-soon";
  features: string[];
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  type: "human" | "agent";
  bio: string;
  department: string;
}


// --- I5.3: Mission Control facet types ---

export interface OtherSystem {
  id: string;
  name: string;
  category: string;
  status: 'connected' | 'standalone' | 'planned';
  description: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  customer: string;
  channel: string;
  createdAt: string;
}

export interface Metric {
  id: string;
  label: string;
  value: string;
  trend: 'up' | 'down' | 'flat';
  trendValue: string;
  category: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  summary: string;
  updatedAt: string;
}

// --- Auth + RBAC types (I5) ---

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  type: "human" | "agent";
  department: string;
  department_id?: string;
  bio: string;
  status: "active" | "inactive";
  data?: Record<string, unknown>;
}

export interface Session {
  userId: string;
  name: string;
  email: string;
  role: "admin" | "member";
  type: "human" | "agent";
}
