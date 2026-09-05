import { BOARD_DIVISIONS, glossaryProseFor } from "@/lib/fixtures/org-board";

export type GlossarySection = {
  id: string;
  name: string;
  description: string;
};

export type GlossaryEntry = {
  id: string;
  sectionId: string;
  name: string;
  definition: string;
};

export const INITIAL_SECTIONS: GlossarySection[] = [
  {
    id: "zones",
    name: "Zones",
    description: "Top-level operating spheres of the business graph.",
  },
  {
    id: "organization",
    name: "Organization",
    description:
      "The seven divisions of the organizing board — Executive through Distribution — and the departments under each.",
  },
  {
    id: "collaboration",
    name: "Collaboration",
    description: "Parties the organization works with.",
  },
  {
    id: "environment",
    name: "Environment",
    description: "Context of work — places, time, and knowledge.",
  },
  {
    id: "ui-pattern",
    name: "UI pattern",
    description: "Shared Mission Control configuration patterns.",
  },
];

export const INITIAL_ENTRIES: GlossaryEntry[] = [
  {
    id: "e-org-zone",
    sectionId: "zones",
    name: "Organization",
    definition:
      "Center circle of internal faculties: Executive (center sphere), Distribution (top), Communications, Dissemination, Treasury, Production, Qualification. Service and Product nest under Production — not hub spheres.",
  },
  {
    id: "e-faculty",
    sectionId: "organization",
    name: "Faculty",
    definition:
      "An internal function of the Organization (a capacity it uses to operate) — not a university. Faculties are Executive, Communications, Dissemination, Treasury, Production, Qualification, and Distribution. Distinct from collaboration parties and from environment. In the Records Editor, parent_kind faculty means the record type hangs under one of those Organization tabs.",
  },
  {
    id: "e-collab-zone",
    sectionId: "zones",
    name: "Collaboration",
    definition:
      "Parties the organization works with: Vendor, Customer, Partner, Branch. Credentials, Integrations, and Exchange nest under Vendor.",
  },
  {
    id: "e-env-zone",
    sectionId: "zones",
    name: "Environment",
    definition:
      "Context of work: Locations, Events, Knowledge, Schedules. Product and Service live under Organization / Production (not Environment; not hub spheres).",
  },
  {
    id: "e-executive",
    sectionId: "organization",
    name: "Executive",
    definition: glossaryProseFor(
      "executive",
      "Center Organization sphere. Owns Policy, Projects, and Tasks. The first self-tab is Orgs.",
    ),
  },
  {
    id: "e-distribution",
    sectionId: "organization",
    name: "Distribution",
    definition: glossaryProseFor(
      "public",
      "Top of the Organization sphere. Owns Contacts. Distinct from Collaboration Customer.",
    ),
  },
  {
    id: "e-policy",
    sectionId: "organization",
    name: "Policy",
    definition: "Governing policies and executive directives for the organization.",
  },
  {
    id: "e-projects",
    sectionId: "organization",
    name: "Projects",
    definition: "Strategic and delivery projects owned by Executive.",
  },
  {
    id: "e-tasks",
    sectionId: "organization",
    name: "Tasks",
    definition: "Executable work items under Executive projects.",
  },
  {
    id: "e-production",
    sectionId: "organization",
    name: "Production",
    definition: glossaryProseFor(
      "production",
      "Owns Product and Service as nested objects — not hub spheres.",
    ),
  },
  {
    id: "e-product",
    sectionId: "organization",
    name: "Product",
    definition:
      "Device, manufactured item, or computer file. Owned by Production as a nested object — not a hub sphere.",
  },
  {
    id: "e-service",
    sectionId: "organization",
    name: "Service",
    definition: "Faculty for results (e.g. Analysis & Design). Nested under Production — not a hub sphere.",
  },
  {
    id: "e-comms",
    sectionId: "organization",
    name: "Communications",
    definition: glossaryProseFor("communications"),
  },
  {
    id: "e-dissem",
    sectionId: "organization",
    name: "Dissemination",
    definition: glossaryProseFor("dissemination"),
  },
  {
    id: "e-treasury",
    sectionId: "organization",
    name: "Treasury",
    definition: glossaryProseFor("treasury"),
  },
  {
    id: "e-qual",
    sectionId: "organization",
    name: "Qualification",
    definition: glossaryProseFor("qualification"),
  },
  {
    id: "e-vendor",
    sectionId: "collaboration",
    name: "Vendor",
    definition: "Service provider / external supplier. Integrations nest under Vendor.",
  },
  {
    id: "e-integrations",
    sectionId: "collaboration",
    name: "Integrations",
    definition:
      "Technical and commercial integrations with a vendor (API, webhook, SFTP, etc.).",
  },
  {
    id: "e-customer",
    sectionId: "collaboration",
    name: "Customer",
    definition: "Person or business that receives products or services.",
  },
  {
    id: "e-partner",
    sectionId: "collaboration",
    name: "Partner",
    definition: "Business or investor in a collaborative relationship.",
  },
  {
    id: "e-branch",
    sectionId: "collaboration",
    name: "Branch",
    definition: "Subsidiary — subordinate operating unit of the organization.",
  },
  {
    id: "e-locations",
    sectionId: "environment",
    name: "Locations",
    definition: "Global address book of business locations and places.",
  },
  {
    id: "e-events",
    sectionId: "environment",
    name: "Events",
    definition: "Planned activity past or future.",
  },
  {
    id: "e-knowledge",
    sectionId: "environment",
    name: "Knowledge",
    definition: "Documents, recordings, photos, policies, research.",
  },
  {
    id: "e-schedules",
    sectionId: "environment",
    name: "Schedules",
    definition: "When an event, activity, or task occurs.",
  },
  {
    id: "e-listing",
    sectionId: "ui-pattern",
    name: "Listing",
    definition:
      "Table of entities with New and Edit. Edit expands an inline collapsible form on that row; New opens under the header. Not a modal.",
  },
  {
    id: "e-self-tab",
    sectionId: "ui-pattern",
    name: "Parent self-tab",
    definition:
      "When a menu tab has children, the first sub-tab is the parent itself so the default UI is not lost under nesting. On Executive that tab is Orgs; on other divisions it is Records.",
  },
  ...BOARD_DIVISIONS.flatMap((d) =>
    d.departments.map((dept) => ({
      id: `e-dept-${dept.number}`,
      sectionId: "organization",
      name: dept.name,
      definition: `Department ${dept.number} of the ${d.division.replace(/^Division \d+:\s*/, "")}.`,
    })),
  ),
];

