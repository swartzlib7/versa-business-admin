"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { theme } from "@/lib/theme";

type Term = {
  term: string;
  definition: string;
  group: string;
};

/** Sourced from MISSION_CONTROL_ERD_KEYSTONE.md + I5.6 IA updates. */
const TERMS: Term[] = [
  {
    group: "Zones",
    term: "Organization",
    definition:
      "Center circle of internal faculties: Executive, Communications, Dissemination, Treasury, Production, Qualification.",
  },
  {
    group: "Zones",
    term: "Collaboration",
    definition:
      "Parties the organization works with: Vendor, Customer, Partner, Branch. Integrations nest under Vendor.",
  },
  {
    group: "Zones",
    term: "Environment",
    definition:
      "Context of work: Locations, Events, Knowledge, Schedules. Product and Service live under Organization / Production (I5.6).",
  },
  {
    group: "Organization",
    term: "Executive",
    definition:
      "Business executive function. Owns Policy, Projects, and Tasks as nested elements; parent self-tab keeps executive defaults.",
  },
  {
    group: "Organization",
    term: "Policy",
    definition: "Governing policies and executive directives for the organization.",
  },
  {
    group: "Organization",
    term: "Projects",
    definition: "Strategic and delivery projects owned by Executive.",
  },
  {
    group: "Organization",
    term: "Tasks",
    definition: "Executable work items under Executive projects.",
  },
  {
    group: "Organization",
    term: "Production",
    definition: "Making and delivering work product. Owns Product and Service.",
  },
  {
    group: "Organization",
    term: "Product",
    definition:
      "Device, manufactured item, or computer file — operating nucleus. Owned by Production (moved from Environment in I5.6).",
  },
  {
    group: "Organization",
    term: "Service",
    definition: "Faculty for results (e.g. Analysis & Design). Nested under Production.",
  },
  {
    group: "Organization",
    term: "Communications",
    definition: "Internal and external messaging faculty.",
  },
  {
    group: "Organization",
    term: "Dissemination",
    definition: "Distribution of products, content, and outcomes.",
  },
  {
    group: "Organization",
    term: "Treasury",
    definition: "Financial control and commercial terms.",
  },
  {
    group: "Organization",
    term: "Qualification",
    definition: "Quality, compliance, and qualification processes.",
  },
  {
    group: "Collaboration",
    term: "Vendor",
    definition: "Service provider / external supplier. Integrations nest under Vendor.",
  },
  {
    group: "Collaboration",
    term: "Integrations",
    definition: "Technical and commercial integrations with a vendor (API, webhook, SFTP, etc.).",
  },
  {
    group: "Collaboration",
    term: "Customer",
    definition: "Person or business that receives products or services.",
  },
  {
    group: "Collaboration",
    term: "Partner",
    definition: "Business or investor in a collaborative relationship.",
  },
  {
    group: "Collaboration",
    term: "Branch",
    definition: "Subsidiary — subordinate operating unit of the organization.",
  },
  {
    group: "Environment",
    term: "Locations",
    definition: "Global address book of business locations and places.",
  },
  {
    group: "Environment",
    term: "Events",
    definition: "Planned activity past or future.",
  },
  {
    group: "Environment",
    term: "Knowledge",
    definition: "Documents, recordings, photos, policies, research.",
  },
  {
    group: "Environment",
    term: "Schedules",
    definition: "When an event, activity, or task occurs.",
  },
  {
    group: "UI pattern",
    term: "Listing",
    definition:
      "Table of entities with New and Edit. Edit expands an inline collapsible form on that row; New opens under the header. Not a modal.",
  },
  {
    group: "UI pattern",
    term: "Parent self-tab",
    definition:
      "When a menu tab has children, the first sub-tab is the parent itself (same label) so the default UI is not lost under nesting.",
  },
];

const groups = Array.from(new Set(TERMS.map((t) => t.group)));

export default function GlossaryPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Badge variant="outline" className="font-normal">
            Reference
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight">Glossary of Terms</h1>
          <p className="max-w-2xl text-muted-foreground">
            Shared language for Mission Control zones, parties, and UI patterns.
            Sourced from the ERD keystone and I5.6 information architecture.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          3D hub
        </Link>
      </div>

      {groups.map((g) => (
        <Card key={g}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{g}</CardTitle>
            <CardDescription>
              {g === "Zones"
                ? "Top-level operating spheres"
                : g === "UI pattern"
                  ? "How configuration screens behave"
                  : `Terms under ${g}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {TERMS.filter((t) => t.group === g).map((t) => (
              <div key={t.term} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
                <dt
                  className="text-sm font-semibold"
                  style={{ color: theme.colors.brand }}
                >
                  {t.term}
                </dt>
                <dd className="text-sm text-muted-foreground">{t.definition}</dd>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <p className="text-xs text-muted-foreground">
        Design keystone: docs/specs/MISSION_CONTROL_ERD_KEYSTONE.md. Zone ERD:
        docs/specs/MISSION_CONTROL_ZONE_ERD_I5.6.md. UI pattern:
        docs/specs/ZONE_CONFIG_UI_PATTERN_I5.6.md.
      </p>
    </div>
  );
}
