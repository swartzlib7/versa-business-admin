/**
 * Sample Data pack — live records tagged with external_id `ba_sample:…`.
 * Distinct from Demo mode (public fixtures that never write the live store).
 *
 * Mapped from Versa AGi org foundation (cents, org-owned products/transactions,
 * structured addresses) onto VBA zones. Invoices/estimates stay
 * proposed in the field inventory until tasked as record types.
 */
import type { OrgType } from "@/lib/data/types";

export const SAMPLE_EXTERNAL_PREFIX = "ba_sample:";

export function sampleExternalId(kind: string, key: string): string {
  return `${SAMPLE_EXTERNAL_PREFIX}${kind}:${key}`;
}

export function isSampleExternalId(value: unknown): boolean {
  return typeof value === "string" && value.startsWith(SAMPLE_EXTERNAL_PREFIX);
}

export type SampleOrgSeed = {
  name: string;
  org_type: OrgType;
  external_id: string;
  notes?: string;
};

export type SampleUserSeed = {
  name: string;
  email: string;
  role: "member";
  type: "human" | "agent";
  password: string;
  department: string;
  bio: string;
  job_title?: string;
  key: string;
};

export const SAMPLE_USERS: SampleUserSeed[] = [
  {
    key: "ops-assistant",
    name: "Ops Assistant",
    email: "ops-assistant@example.com",
    role: "member",
    type: "agent",
    password: "mission2026",
    department: "Operations",
    job_title: "Sample agent account with member role for demos",
    bio: "Sample agent account with member role for demos.",
  },
  {
    key: "jordan",
    name: "Jordan Lee",
    email: "member@example.com",
    role: "member",
    type: "human",
    password: "mission2026",
    department: "Operations",
    job_title: "Operations lead keeping production on cadence",
    bio: "Operations lead keeping production on cadence.",
  },
  {
    key: "research",
    name: "Research Assistant",
    email: "research@example.com",
    role: "member",
    type: "agent",
    password: "mission2026",
    department: "Research",
    job_title: "Sample agent account with member role",
    bio: "Sample agent account with member role.",
  },
  {
    key: "casey",
    name: "Casey Nguyen",
    email: "success@example.com",
    role: "member",
    type: "human",
    password: "mission2026",
    department: "Customer",
    job_title: "Customer partner helping buyers adopt what we ship",
    bio: "Customer partner helping buyers adopt what we ship.",
  },
  {
    key: "riley",
    name: "Riley Brooks",
    email: "marketing@example.com",
    role: "member",
    type: "human",
    password: "mission2026",
    department: "Outreach",
    job_title: "Story and reach lead for the public brand",
    bio: "Story and reach lead for the public brand.",
  },
];

export type SampleRecordSeed = {
  type_api_name: string;
  parent_kind: string;
  parent_api_name: string;
  name: string;
  status?: string;
  data: Record<string, string>;
  org_external_id?: string;
};

export const SAMPLE_ORGS: SampleOrgSeed[] = [
  {
    name: "Wave Sample Vendor",
    org_type: "vendor",
    external_id: sampleExternalId("org", "vendor"),
    notes: "Migrated-shape vendor (AGi organizations.type → MC org_type=vendor).",
  },
  {
    name: "Wave Sample Customer",
    org_type: "customer",
    external_id: sampleExternalId("org", "customer"),
    notes: "Migrated-shape customer. Wave Customer maps here via external_id.",
  },
  {
    name: "Sample Channel Partner",
    org_type: "partner",
    external_id: sampleExternalId("org", "partner"),
    notes: "Partner org demo — Collaboration tab org_type rendering.",
  },
  {
    name: "Sample Branch",
    org_type: "branch",
    external_id: sampleExternalId("org", "branch"),
    notes: "Branch org demo — org_type=branch renders as a child section (ERD section 2.7).",
  },
];

export const SAMPLE_RECORDS: SampleRecordSeed[] = [
  {
    type_api_name: "location",
    parent_kind: "environment",
    parent_api_name: "locations",
    name: "Sample HQ",
    data: {
      line_1: "100 Mission Way",
      city: "Austin",
      state: "TX",
      postal_code: "78701",
      country: "US",
      is_primary: "true",
      address: "100 Mission Way, Austin, TX 78701",
      external_id: sampleExternalId("location", "hq"),
    },
  },
  {
    type_api_name: "production_product",
    parent_kind: "faculty",
    parent_api_name: "production",
    name: "Sample Widget",
    data: {
      category: "manufactured",
      description: "Sample product with SKU (AGi products.sku).",
      sku: "MC-WGT-001",
      status: "available",
      external_id: sampleExternalId("product", "widget"),
    },
  },
  {
    type_api_name: "treasury_transaction",
    parent_kind: "faculty",
    parent_api_name: "treasury",
    name: "Sample inbound payment",
    data: {
      classification: "income",
      amount: "150.00",
      currency: "USD",
      category: "sales",
      transaction_date: "2026-09-01",
      external_id: sampleExternalId("txn", "inbound-1"),
    },
    org_external_id: sampleExternalId("org", "customer"),
  },
  {
    type_api_name: "communication_staff",
    parent_kind: "faculty",
    parent_api_name: "communications",
    name: "Sample Staffer",
    data: {
      role: "Operations",
      notes: "AGi org_staff → MC communication_staff (no VV connection_uid).",
      external_id: sampleExternalId("staff", "ops"),
    },
  },
  {
    type_api_name: "contact",
    parent_kind: "faculty",
    parent_api_name: "public",
    name: "Sample Public Contact",
    data: {
      contact_kind: "public",
      email: "sample.contact@example.com",
      phone: "+1-512-555-0100",
      organization: "Wave Sample Customer",
      external_id: sampleExternalId("contact", "public-1"),
    },
    org_external_id: sampleExternalId("org", "customer"),
  },
  {
    type_api_name: "executive_project",
    parent_kind: "faculty",
    parent_api_name: "executive",
    name: "Sample delivery project",
    status: "planned",
    data: {
      owner: "Sample Staffer",
      description: "Sample project hanging from the Primary Org.",
      external_id: sampleExternalId("project", "delivery"),
    },
  },
  {
    type_api_name: "executive_task",
    parent_kind: "faculty",
    parent_api_name: "executive",
    name: "Sample onboarding task",
    status: "in_progress",
    data: {
      description: "Three-message buyer welcome sequence: thank you, how to use, how to get help.",
      external_id: sampleExternalId("task", "onboarding"),
    },
  },
  {
    type_api_name: "treasury_transaction",
    parent_kind: "faculty",
    parent_api_name: "treasury",
    name: "Sample vendor expense",
    data: {
      classification: "expense",
      amount: "85.00",
      currency: "USD",
      category: "services",
      transaction_date: "2026-09-02",
      external_id: sampleExternalId("txn", "expense-1"),
    },
    org_external_id: sampleExternalId("org", "vendor"),
  },
  {
    type_api_name: "vendor_integration",
    parent_kind: "collaboration",
    parent_api_name: "vendor",
    name: "Sample vendor integration",
    data: {
      integration_type: "email",
      status: "connected",
      description: "Shared inbox for client and support mail (demo row).",
      last_sync: "2026-09-01T23:00:00Z",
      external_id: sampleExternalId("integration", "email"),
    },
    org_external_id: sampleExternalId("org", "vendor"),
  },
];
