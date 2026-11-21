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
  DEMO_HERO_HTML,
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
  /** Field name → several sample external ids, written as a JSON array of ids (multi-lookup). */
  listRefs?: Record<string, string[]>;
  lines?: Array<{ id?: string; line_group?: string; data: Record<string, string>; refs?: Record<string, string> }>;
  /** Attachments field → files shipped under public/ (1.0.16), saved to the uploads folder at insert. */
  files?: Record<string, Array<{ path: string; name: string; mime: string }>>;
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
  { name: "Acme Metal Supply", org_type: "vendor", external_id: sampleExternalId("org", "acme-metal"), email: "orders@acme-metal.example" },
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
    name: "Welcome",
    data: {
      slot: "welcome",
      body_format: "html",
      body_html: DEMO_HERO_HTML,
      external_id: sampleExternalId("page", "welcome"),
    },
  },
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
      // 1.0.16: the period is open at install (three months in), so the graph shows the target and the catch-up pace.
      start_datetime: sampleMonthStart(-3),
      period_target: "150",
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
      phone: "+1 (555) 010-2000",
      email: "hq@example.com",
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
      // 1.0.16: launch windows in the coming weeks, so the board shows them next to this month.
      custom_slots: customSlotsJson([`${sampleDay(9)}T09:00`, `${sampleDay(23)}T15:30`, `${sampleDay(41)}T11:00`]),
      external_id: sampleExternalId("schedule", "buffer"),
    },
    refs: {
      integration_id: sampleExternalId("integration", "buffer"),
      location_id: sampleExternalId("location", "hq"),
    },
  });
  return rows;
}

/** ISO date a number of days from the day the sample is inserted, so the Gantt stays current. */
function sampleDay(offset: number): string {
  return new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
}

/**
 * First day of a month relative to now (0 = this month), as the statistics
 * start: local midnight ("YYYY-MM-01T00:00"), so the axis reads the same month
 * in every timezone. A UTC "Z" start shows as the previous evening west of UTC.
 */
function sampleMonthStart(offsetMonths: number): string {
  return `${sampleMonthDay(offsetMonths, 1)}T00:00`;
}

/** A day in a month relative to now, as YYYY-MM-DD. */
function sampleMonthDay(offsetMonths: number, day: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offsetMonths, day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function projectSeeds(): SampleRecordSeed[] {
  const plan = "ba-sample-task-plan";
  const build = "ba-sample-task-build";
  const review = "ba-sample-task-review";
  const train = "ba-sample-task-train";
  return [
    {
      type_api_name: "executive_project",
      parent_kind: "faculty",
      parent_api_name: "executive",
      name: "Board rollout",
      status: "active",
      data: {
        priority: "high",
        start_date: sampleDay(-30),
        target_date: sampleDay(45),
        external_id: sampleExternalId("project", "rollout"),
      },
      lines: [
        {
          id: plan,
          data: {
            task_title: "Milestone: plan the rollout",
            task_status: "done",
            task_percent: "100",
            task_due_date: sampleDay(-20),
            task_parent_id: "",
          },
        },
        {
          id: build,
          data: {
            task_title: "Bind the integrations",
            task_status: "in_progress",
            task_percent: "40",
            task_due_date: sampleDay(-3),
            task_parent_id: plan,
            task_notes:
              "<p>Pair each integration with its <strong>schedule</strong> before go-live.</p><ul><li>Weather feed</li><li>Inspection export</li></ul>",
          },
        },
        {
          id: review,
          data: {
            task_title: "Confirm the inspection list",
            task_status: "todo",
            task_percent: "0",
            task_due_date: sampleDay(12),
            task_parent_id: build,
          },
        },
        {
          id: train,
          data: {
            task_title: "Train the staff",
            task_status: "waiting",
            task_percent: "15",
            task_due_date: sampleDay(25),
            task_parent_id: "",
            task_notes: "<p>Two short sessions. <em>Record both</em> for new hires.</p>",
          },
        },
      ],
    },
  ];
}

function staffSeeds(): SampleRecordSeed[] {
  const row = (key: string, name: string, role: string): SampleRecordSeed => ({
    type_api_name: "communication_staff",
    parent_kind: "faculty",
    parent_api_name: "communications",
    name,
    status: "active",
    data: { role, external_id: sampleExternalId("staff", key) },
  });
  return [row("avery", "Avery Clark", "support"), row("jordan", "Jordan Lee", "operations")];
}

/** A Hat held by both sample Staff (state_hats.md). */
function hatSeed(): SampleRecordSeed {
  return {
    type_api_name: "executive_hat",
    parent_kind: "faculty",
    parent_api_name: "executive",
    name: "Receptionist",
    status: "active",
    data: {
      purposes: JSON.stringify([
        "Make every visitor and caller feel welcome and expected.",
        "Route each visitor, call, and delivery to the right person the first time.",
        "Keep the front of the office calm, tidy, and safe.",
      ]),
      know_how: JSON.stringify([
        "Where the visitor log, badges, and the staff directory live.",
        "How to transfer, park, and pick up calls on the desk phone.",
        "Who signs for deliveries, and where parcels wait when they are away.",
        "The fire exits, the first-aid cabinet, and who to call in an emergency.",
      ]),
      duties: JSON.stringify([
        "Open the front desk at 8:30 and check the day's visitor list.",
        "Greet and sign in every visitor; issue and collect badges.",
        "Answer the main line within three rings.",
        "Log deliveries and tell the recipient the same hour.",
        "Close the desk at 17:00: badges counted, log filed, lights off.",
      ]),
      external_id: sampleExternalId("hat", "receptionist"),
    },
    listRefs: { holder_ids: [sampleExternalId("staff", "avery"), sampleExternalId("staff", "jordan")] },
  };
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


// ── 1.0.16 premium demo: a job with money, a van with paperwork, more divisions ──

/** One record per division that had none, so the org board is full. */
function divisionSeeds(): SampleRecordSeed[] {
  return [
    {
      type_api_name: "production_product",
      parent_kind: "faculty",
      parent_api_name: "production",
      name: "Display bracket",
      status: "active",
      data: {
        tagline: "Steel shelf bracket for retail displays.",
        sku: "BRK-200",
        variant_price: "25",
        currency: "USD",
        product_kind: "product",
        is_active: "true",
        external_id: sampleExternalId("product", "bracket"),
      },
    },
    {
      type_api_name: "dissemination_promotion_marketing",
      parent_kind: "faculty",
      parent_api_name: "dissemination",
      name: "Winter display offer",
      status: "active",
      data: {
        description: "Mail and social posts offering the display bracket to retail customers.",
        external_id: sampleExternalId("promotion", "winter"),
      },
    },
    {
      type_api_name: "qualification_review",
      parent_kind: "faculty",
      parent_api_name: "qualification",
      name: "Bracket fit check",
      status: "active",
      data: {
        notes: "Check each bracket against the shelf spec before it ships.",
        external_id: sampleExternalId("review", "bracket-fit"),
      },
    },
  ];
}

const ACME = sampleExternalId("org", "acme-metal");
const NORTHWIND = sampleExternalId("org", "northwind");
const HARBOR = sampleExternalId("org", "harbor");

/** Estimate (converted) -> invoice, with the vendor bill matched to the job lines. */
function jobSeeds(): SampleRecordSeed[] {
  const project = sampleExternalId("project", "rollout");
  const product = sampleExternalId("product", "bracket");
  const bill = sampleExternalId("transaction", "acme-bill");
  const estimate = sampleExternalId("transaction", "bracket-estimate");
  const jobLines = (withBill: boolean) => [
    {
      data: {
        line_description: "Display bracket, steel",
        line_quantity: "3",
        line_unit_cost: "20",
        line_markup_pct: "25",
        ...(withBill ? { line_actual_cost: "58.5" } : {}),
      },
      refs: { line_vendor_org_id: ACME, line_product_id: product, ...(withBill ? { line_vendor_bill_id: bill } : {}) },
    },
    {
      data: {
        line_description: "Fastener kit",
        line_quantity: "1",
        line_unit_cost: "10",
        // Typed over the worked-out price (10 at no markup).
        line_unit_price: "15",
        ...(withBill ? { line_actual_cost: "10" } : {}),
      },
      refs: { line_vendor_org_id: ACME, ...(withBill ? { line_vendor_bill_id: bill } : {}) },
    },
  ];
  const doc = { type_api_name: "treasury_transaction", parent_kind: "faculty", parent_api_name: "treasury" } as const;
  return [
    {
      ...doc,
      name: "Acme Metal Supply #4471",
      status: "sent",
      data: {
        document_kind: "bill",
        document_number: "4471",
        status: "sent",
        transaction_date: sampleDay(-14),
        due_date: sampleDay(16),
        amount: "70",
        tax_total: "0",
        currency: "USD",
        external_id: bill,
      },
      org_external_id: ACME,
    },
    {
      ...doc,
      name: "Bracket estimate",
      status: "converted",
      data: {
        document_kind: "estimate",
        status: "converted",
        transaction_date: sampleDay(-21),
        expiry_date: sampleDay(9),
        tax_total: "0",
        currency: "USD",
        external_id: estimate,
      },
      refs: { project_id: project },
      lines: jobLines(false),
      org_external_id: NORTHWIND,
    },
    {
      ...doc,
      name: "Bracket invoice",
      status: "sent",
      data: {
        document_kind: "invoice",
        status: "sent",
        transaction_date: sampleDay(-7),
        due_date: sampleDay(23),
        tax_total: "0",
        currency: "USD",
        external_id: sampleExternalId("transaction", "bracket-invoice"),
      },
      refs: { project_id: project, converted_from_id: estimate },
      lines: jobLines(true),
      org_external_id: NORTHWIND,
    },
  ];
}

/** [months back, day, purpose, miles, business, customer] - the current month only up to today. */
const TRIPS: Array<[number, number, string, number, boolean, string?]> = [
  [-5, 4, "Northwind delivery", 96, true, NORTHWIND],
  [-5, 12, "Acme Metal pickup", 64, true],
  [-5, 19, "Harbor Clinic visit", 50, true, HARBOR],
  [-5, 23, "Weekend", 58, false],
  [-4, 5, "Northwind delivery", 110, true, NORTHWIND],
  [-4, 14, "Trade show", 150, true],
  [-4, 26, "Family trip", 120, false],
  [-3, 6, "Acme Metal pickup", 88, true],
  [-3, 15, "Harbor Clinic install", 152, true, HARBOR],
  [-3, 22, "Weekend", 44, false],
  [-2, 3, "Northwind delivery", 126, true, NORTHWIND],
  [-2, 11, "Supplier visit", 95, true],
  [-2, 20, "Harbor Clinic service", 84, true, HARBOR],
  [-2, 27, "Weekend", 70, false],
  [-1, 7, "Acme Metal pickup", 88, true],
  [-1, 16, "Northwind delivery", 120, true, NORTHWIND],
  [-1, 24, "Harbor Clinic install", 82, true, HARBOR],
  [-1, 28, "Weekend", 52, false],
  [0, 3, "Northwind delivery", 126, true, NORTHWIND],
  [0, 7, "Acme Metal pickup", 88, true],
  [0, 12, "Weekend", 74, false],
  [0, 17, "Harbor Clinic install", 124, true, HARBOR],
];

const START_ODOMETER = 46_000;

/** The van, its paperwork, its mileage log, and a statistic read from the log. */
function vehicleSeeds(): SampleRecordSeed[] {
  const van = sampleExternalId("asset", "van");
  const today = new Date().getDate();
  const trips = TRIPS.filter(([month, day]) => month < 0 || day <= today);
  let odometer = START_ODOMETER;
  const lines = trips.map(([month, day, purpose, miles, business, customer]) => {
    const start = odometer;
    odometer += miles;
    return {
      line_group: "trips",
      data: {
        trip_date: sampleMonthDay(month, day),
        trip_start_odometer: String(start),
        trip_end_odometer: String(odometer),
        trip_miles: String(miles),
        trip_business: business ? "true" : "false",
        trip_purpose: purpose,
      },
      ...(customer ? { refs: { trip_business_org_id: customer } } : {}),
    };
  });
  const doc = (file: string, mime: string) => ({ path: `public/seed/demo/${file}`, name: file, mime });
  return [
    {
      type_api_name: "statistics",
      parent_kind: "environment",
      parent_api_name: "custom",
      name: "Business miles",
      status: "active",
      data: {
        scale_name: "Miles",
        scale_start: "0",
        scale_end: "400",
        scale_step: "100",
        frequency_type: "month",
        frequency_qty: "6",
        start_datetime: sampleMonthStart(-5),
        series_mode: "single",
        source_record_type: "treasury_vehicle_mileage_log",
        source_read_from: "lines",
        source_date_field: "trip_date",
        source_value_field: "trip_miles",
        source_filter_field: "trip_business",
        source_filter_value: "true",
        external_id: sampleExternalId("stat", "business-miles"),
      },
    },
    {
      type_api_name: "treasury_records_assets_materiel",
      parent_kind: "faculty",
      parent_api_name: "treasury",
      name: "2021 Ford Transit Connect",
      status: "active",
      data: {
        asset_category: "vehicle",
        serial_number: "NM0LS7E2XM1234567",
        purchase_date: "2024-03-14",
        purchase_price: "28400",
        business_use_pct: "80",
        current_odometer: String(odometer),
        next_service_due: sampleDay(26),
        description: "Delivery van for bracket orders and installs.",
        external_id: van,
      },
      files: {
        documents: [
          doc("registration-2026.pdf", "application/pdf"),
          doc("insurance-card.pdf", "application/pdf"),
          doc("service-receipt.jpg", "image/jpeg"),
        ],
      },
    },
    {
      type_api_name: "treasury_vehicle_mileage_log",
      parent_kind: "environment",
      parent_api_name: "custom",
      name: "Van mileage log",
      status: "active",
      data: {
        tax_year: String(new Date().getFullYear()),
        starting_odometer: String(START_ODOMETER),
        external_id: sampleExternalId("mileage", "van"),
      },
      refs: { vehicle_id: van },
      lines,
    },
  ];
}

SAMPLE_RECORDS.push(
  ...vendorIntegrations(),
  ...vendorSchedules(),
  ...projectSeeds(),
  ...staffSeeds(),
  hatSeed(),
  ...inspectionSeeds(),
  mailCredential(),
  knowledgeSeed(),
  ...eventSeeds(),
  ...divisionSeeds(),
  ...jobSeeds(),
  ...vehicleSeeds(),
);
