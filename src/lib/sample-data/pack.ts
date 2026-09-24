/**
 * Sample Data pack — live records tagged with external_id `ba_sample:…`.
 * Distinct from Demo mode (public fixtures that never write the live store).
 *
 * Mapped from Versa AGi org foundation (cents, org-owned products/transactions,
 * structured addresses) onto VBA zones. Invoices/estimates stay
 * proposed in the field inventory until tasked as record types.
 */
import type { OrgType } from "@/lib/data/types";
import {
  DEMO_ABOUT_HTML,
  DEMO_FACETS_HTML,
  DEMO_INSPECTIONS_HTML,
  DEMO_INTEGRATIONS_HTML,
  DEMO_KNOWLEDGE_HTML,
} from "@/lib/sample-data/demo-html";
import { customSlotsJson, intervalIso } from "@/lib/public/schedule-times";

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
  email?: string;
  phone?: string;
  logo_url?: string;
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

/** Operator accounts stay the install admins. The demo pack does not add users. */
export const SAMPLE_USERS: SampleUserSeed[] = [];

export type SampleRecordSeed = {
  type_api_name: string;
  parent_kind: string;
  parent_api_name: string;
  name: string;
  status?: string;
  data: Record<string, string>;
  /** Field name → another sample external id, resolved to a record or org id at insert. */
  refs?: Record<string, string>;
  lines?: Array<{ data: Record<string, string>; refs?: Record<string, string> }>;
  relations?: Array<{ relation_kind: string; target_external_id: string }>;
  org_external_id?: string;
};

export const SAMPLE_ORGS: SampleOrgSeed[] = [
  {
    name: "Sample Customer",
    org_type: "customer",
    external_id: sampleExternalId("org", "customer"),
    notes: "Owns the demo location. Phone and email paint on the location card.",
    email: "hq@example.com",
    phone: "+1 (512) 555-0140",
  },
  { name: "Northwind Goods", org_type: "customer", external_id: sampleExternalId("org", "northwind"), email: "hello@northwind.example" },
  { name: "Harbor Clinic", org_type: "customer", external_id: sampleExternalId("org", "harbor"), email: "desk@harbor.example" },
  { name: "QuickBooks", org_type: "vendor", external_id: sampleExternalId("org", "quickbooks"), logo_url: "/seed/vendors/quickbooks.svg" },
  { name: "Amazon FBA", org_type: "vendor", external_id: sampleExternalId("org", "amazon-fba"), logo_url: "/seed/vendors/amazon-fba.svg" },
  { name: "Google Analytics", org_type: "vendor", external_id: sampleExternalId("org", "google-analytics"), logo_url: "/seed/vendors/google-analytics.svg" },
  { name: "AWS", org_type: "vendor", external_id: sampleExternalId("org", "aws"), logo_url: "/seed/vendors/aws.svg" },
  { name: "Buffer", org_type: "vendor", external_id: sampleExternalId("org", "buffer"), logo_url: "/seed/vendors/buffer.svg" },
];

const PAGE = {
  parent_kind: "environment" as const,
  parent_api_name: "custom",
  status: "active",
  type_api_name: "page",
};

export const SAMPLE_RECORDS: SampleRecordSeed[] = [
  {
    ...PAGE,
    name: "Facets",
    data: {
      slot: "facets",
      body_format: "html",
      body_html: DEMO_FACETS_HTML,
      external_id: sampleExternalId("page", "facets"),
    },
  },
  {
    ...PAGE,
    name: "Integrations",
    data: {
      slot: "integrations",
      body_format: "html",
      body_html: DEMO_INTEGRATIONS_HTML,
      external_id: sampleExternalId("page", "integrations"),
    },
  },
  {
    ...PAGE,
    name: "Inspections & Reports",
    data: {
      slot: "inspections-reports",
      body_format: "html",
      body_html: DEMO_INSPECTIONS_HTML,
      external_id: sampleExternalId("page", "inspections"),
    },
  },
  {
    ...PAGE,
    name: "Knowledge",
    data: {
      slot: "knowledge",
      body_format: "html",
      body_html: DEMO_KNOWLEDGE_HTML,
      external_id: sampleExternalId("page", "knowledge"),
    },
  },
  {
    ...PAGE,
    name: "About",
    data: {
      slot: "about",
      body_format: "html",
      body_html: DEMO_ABOUT_HTML,
      external_id: sampleExternalId("page", "about"),
    },
  },
  {
    type_api_name: "statistics",
    parent_kind: "environment",
    parent_api_name: "custom",
    name: "Sample monthly visits",
    status: "active",
    data: {
      scale_name: "Visits",
      scale_start: "0",
      scale_end: "40",
      scale_step: "5",
      frequency_type: "month",
      frequency_qty: "6",
      start_datetime: "2026-01-01T00:00:00.000Z",
      series_mode: "single",
      external_id: sampleExternalId("stat", "visits"),
    },
  },
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
    org_external_id: sampleExternalId("org", "customer"),
  },
];

const VENDORS = [
  ["quickbooks", "QuickBooks", "accounting"],
  ["amazon-fba", "Amazon FBA", "api"],
  ["google-analytics", "Google Analytics", "api"],
  ["aws", "AWS", "sftp"],
  ["buffer", "Buffer", "webhook"],
] as const;

function vendorIntegrations(): SampleRecordSeed[] {
  return VENDORS.map(([key, name, kind]) => ({
    type_api_name: "vendor_integration",
    parent_kind: "collaboration",
    parent_api_name: "vendor",
    name,
    status: "active",
    data: {
      kind,
      status: "connected",
      external_id: sampleExternalId("integration", key),
    },
    refs: { organization_id: sampleExternalId("org", key) },
  }));
}

function vendorSchedules(): SampleRecordSeed[] {
  const recurring: Array<[string, string, string, string]> = [
    ["quickbooks", "Nightly books", "1", "day"],
    ["amazon-fba", "Weekly fulfillment", "1", "week"],
    ["google-analytics", "Morning traffic", "1", "day"],
    ["aws", "Monthly usage", "1", "month"],
  ];
  const rows: SampleRecordSeed[] = recurring.map(([key, name, count, unit]) => ({
    type_api_name: "schedule",
    parent_kind: "environment",
    parent_api_name: "schedules",
    name,
    status: "active",
    data: {
      kind: "recurring",
      interval_count: count,
      interval_unit: unit,
      interval_iso: intervalIso(count, unit),
      external_id: sampleExternalId("schedule", key),
    },
    refs: {
      integration_id: sampleExternalId("integration", key),
      location_id: sampleExternalId("location", "hq"),
    },
  }));
  rows.push({
    type_api_name: "schedule",
    parent_kind: "environment",
    parent_api_name: "schedules",
    name: "Buffer launch windows",
    status: "active",
    data: {
      kind: "custom",
      custom_slots: customSlotsJson(["2026-04-02T09:00", "2026-05-14T15:30", "2026-06-01T11:00"]),
      external_id: sampleExternalId("schedule", "buffer"),
    },
    refs: {
      integration_id: sampleExternalId("integration", "buffer"),
      location_id: sampleExternalId("location", "hq"),
    },
  });
  return rows;
}

function projectSeeds(): SampleRecordSeed[] {
  return [
    {
      type_api_name: "executive_project",
      parent_kind: "faculty",
      parent_api_name: "executive",
      name: "Board rollout",
      status: "active",
      data: {
        priority: "high",
        external_id: sampleExternalId("project", "rollout"),
      },
    },
    {
      type_api_name: "executive_task",
      parent_kind: "faculty",
      parent_api_name: "executive",
      name: "Bind the integrations",
      status: "in_progress",
      data: { priority: "high", external_id: sampleExternalId("task", "bind") },
      refs: { project_id: sampleExternalId("project", "rollout") },
    },
    {
      type_api_name: "executive_task",
      parent_kind: "faculty",
      parent_api_name: "executive",
      name: "Confirm the inspection list",
      status: "todo",
      data: { priority: "normal", external_id: sampleExternalId("task", "tickets") },
      refs: { project_id: sampleExternalId("project", "rollout") },
    },
  ];
}

function inspectionSeeds(): SampleRecordSeed[] {
  const row = (key: string, name: string, status: string, summary: string): SampleRecordSeed => ({
    type_api_name: "inspection_report",
    parent_kind: "faculty",
    parent_api_name: "communications",
    name,
    status,
    data: { summary, external_id: sampleExternalId("inspection", key) },
  });
  return [
    row("support", "Quarterly site walk", "active", "Walk of the Austin office and the loading dock."),
    row("safety", "Safety cabinet check", "active", "Extinguishers, exits, and the first-aid cabinet."),
    row("vendor", "Vendor floor review", "in_progress", "How the vendor systems show up on the floor."),
  ];
}

function knowledgeSeed(): SampleRecordSeed {
  return {
    type_api_name: "knowledge",
    parent_kind: "environment",
    parent_api_name: "knowledge",
    name: "Onboarding note",
    status: "active",
    data: {
      kind: "document",
      summary: "Where the Primary canvas and the vendor integrations live.",
      external_id: sampleExternalId("knowledge", "onboarding"),
    },
    relations: [
      { relation_kind: "knowledge_location", target_external_id: sampleExternalId("location", "hq") },
    ],
  };
}

function eventSeeds(): SampleRecordSeed[] {
  return [
    {
      type_api_name: "event",
      parent_kind: "environment",
      parent_api_name: "events",
      name: "Books close",
      status: "active",
      data: {
        kind: "meeting",
        occurs_at: "2026-04-02T09:00",
        external_id: sampleExternalId("event", "books-close"),
      },
      relations: [
        { relation_kind: "event_schedule", target_external_id: sampleExternalId("schedule", "quickbooks") },
        { relation_kind: "knowledge_event", target_external_id: sampleExternalId("knowledge", "onboarding") },
      ],
    },
  ];
}

function mailCredential(): SampleRecordSeed {
  return {
    type_api_name: "vendor_credential",
    parent_kind: "collaboration",
    parent_api_name: "vendor",
    name: "Demo mailbox",
    status: "active",
    data: {
      auth_type: "imap",
      notes: "This is the system email delivery credential.",
      configuration: JSON.stringify({
        email_address: "demo-mail@example.com",
        display_name: "Demo mailbox",
        provider: "none",
        auth: { type: "basic", username: "demo-mail@example.com", password: "not-a-real-password" },
        imap: { enabled: false, host: "mail.example.invalid", port: 993, encryption: "ssl" },
        smtp: { enabled: false, host: "mail.example.invalid", port: 587, encryption: "starttls" },
      }),
      external_id: sampleExternalId("credential", "mail"),
    },
  };
}

SAMPLE_RECORDS.push(
  ...vendorIntegrations(),
  ...vendorSchedules(),
  ...projectSeeds(),
  ...inspectionSeeds(),
  mailCredential(),
  knowledgeSeed(),
  ...eventSeeds(),
);
