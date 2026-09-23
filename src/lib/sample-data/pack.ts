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
