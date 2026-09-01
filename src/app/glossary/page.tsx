"use client";

import { Fragment, useMemo, useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { theme } from "@/lib/theme";
import { PageHeader } from "@/components/ui/page-header";
import { SubTabBar } from "@/components/ui/sub-tab-bar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** I5.6.18 — glossary as data: sections + entries (listing + inline editor). */

type GlossarySection = {
  id: string;
  name: string;
  description: string;
};

type GlossaryEntry = {
  id: string;
  sectionId: string;
  name: string;
  definition: string;
};

const INITIAL_SECTIONS: GlossarySection[] = [
  {
    id: "zones",
    name: "Zones",
    description: "Top-level operating spheres of the business graph.",
  },
  {
    id: "organization",
    name: "Organization",
    description: "Internal faculties and executive nesting.",
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

const INITIAL_ENTRIES: GlossaryEntry[] = [
  {
    id: "e-org-zone",
    sectionId: "zones",
    name: "Organization",
    definition:
      "Center circle of internal faculties: Executive (center sphere), Public (top), Communications, Dissemination, Treasury, Production, Qualification. Service and Product nest under Production — not hub spheres.",
  },
  {
    id: "e-collab-zone",
    sectionId: "zones",
    name: "Collaboration",
    definition:
      "Parties the organization works with: Vendor, Customer, Partner, Branch. Integrations nest under Vendor.",
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
    definition:
      "Center Organization sphere (hub). Owns Policy, Projects, and Tasks as nested elements; parent self-tab keeps executive defaults. Not a floating clickable label.",
  },
  {
    id: "e-public",
    sectionId: "organization",
    name: "Public",
    definition:
      "Organization faculty at the top of the sphere — brand, presence, and outward voice. Distinct from Collaboration Customer.",
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
    definition: "Making and delivering work product. Owns Product and Service.",
  },
  {
    id: "e-product",
    sectionId: "organization",
    name: "Product",
    definition:
      "Device, manufactured item, or computer file. Owned by Production as a nested object — not a hub sphere (I5.6 board).",
  },
  {
    id: "e-service",
    sectionId: "organization",
    name: "Service",
    definition: "Faculty for results (e.g. Analysis & Design). Nested under Production — not a hub sphere (I5.6 board).",
  },
  {
    id: "e-comms",
    sectionId: "organization",
    name: "Communications",
    definition: "Internal and external messaging faculty.",
  },
  {
    id: "e-dissem",
    sectionId: "organization",
    name: "Dissemination",
    definition: "Distribution of products, content, and outcomes.",
  },
  {
    id: "e-treasury",
    sectionId: "organization",
    name: "Treasury",
    definition: "Financial control and commercial terms.",
  },
  {
    id: "e-qual",
    sectionId: "organization",
    name: "Qualification",
    definition: "Quality, compliance, and qualification processes.",
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
      "When a menu tab has children, the first sub-tab is the parent itself (same label) so the default UI is not lost under nesting.",
  },
];

const ACCENT = "#2563eb";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

type Editor =
  | null
  | { kind: "section-new" }
  | { kind: "section-edit"; id: string }
  | { kind: "entry-new" }
  | { kind: "entry-edit"; id: string };

type GlossaryTab = "sections" | "entries";

export default function GlossaryPage() {
  const [sections, setSections] = useState(INITIAL_SECTIONS);
  const [entries, setEntries] = useState(INITIAL_ENTRIES);
  const [activeTab, setActiveTab] = useState<GlossaryTab>("sections");
  const [subTab, setSubTab] = useState<string>("configuration");
  const [activeSectionId, setActiveSectionId] = useState(
    INITIAL_SECTIONS[0]?.id ?? ""
  );
  const [editor, setEditor] = useState<Editor>(null);

  const [secDraft, setSecDraft] = useState({ name: "", description: "" });
  const [entryDraft, setEntryDraft] = useState({
    name: "",
    definition: "",
    sectionId: INITIAL_SECTIONS[0]?.id ?? "",
  });

  const activeSection =
    sections.find((s) => s.id === activeSectionId) ?? sections[0];

  const sectionEntries = useMemo(
    () =>
      activeSectionId
        ? entries.filter((e) => e.sectionId === activeSectionId)
        : entries,
    [entries, activeSectionId]
  );

  const cancel = () => setEditor(null);

  const startSectionNew = () => {
    if (editor?.kind === "section-new") {
      setEditor(null);
      return;
    }
    setSecDraft({ name: "", description: "" });
    setEditor({ kind: "section-new" });
  };

  const startSectionEdit = (id: string) => {
    if (editor?.kind === "section-edit" && editor.id === id) {
      setEditor(null);
      return;
    }
    const sec = sections.find((s) => s.id === id);
    if (!sec) return;
    setSecDraft({ name: sec.name, description: sec.description });
    setEditor({ kind: "section-edit", id });
  };

  const commitSection = () => {
    const name = secDraft.name.trim();
    if (!name) return;
    if (editor?.kind === "section-edit") {
      setSections((prev) =>
        prev.map((s) =>
          s.id === editor.id
            ? {
                ...s,
                name,
                description: secDraft.description.trim(),
              }
            : s
        )
      );
    } else {
      const id = uid("sec");
      setSections((prev) => [
        ...prev,
        {
          id,
          name,
          description: secDraft.description.trim(),
        },
      ]);
      setActiveSectionId(id);
    }
    setEditor(null);
  };

  const startEntryNew = () => {
    if (editor?.kind === "entry-new") {
      setEditor(null);
      return;
    }
    setEntryDraft({
      name: "",
      definition: "",
      sectionId: activeSection?.id ?? sections[0]?.id ?? "",
    });
    setEditor({ kind: "entry-new" });
  };

  const startEntryEdit = (id: string) => {
    if (editor?.kind === "entry-edit" && editor.id === id) {
      setEditor(null);
      return;
    }
    const e = entries.find((x) => x.id === id);
    if (!e) return;
    setEntryDraft({
      name: e.name,
      definition: e.definition,
      sectionId: e.sectionId,
    });
    setEditor({ kind: "entry-edit", id });
  };

  const commitEntry = () => {
    const name = entryDraft.name.trim();
    if (!name || !entryDraft.sectionId) return;
    if (editor?.kind === "entry-edit") {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === editor.id
            ? {
                ...e,
                name,
                definition: entryDraft.definition.trim(),
                sectionId: entryDraft.sectionId,
              }
            : e
        )
      );
    } else {
      setEntries((prev) => [
        ...prev,
        {
          id: uid("e"),
          name,
          definition: entryDraft.definition.trim(),
          sectionId: entryDraft.sectionId,
        },
      ]);
      setActiveSectionId(entryDraft.sectionId);
    }
    setEditor(null);
  };

  const SectionForm = ({ heading }: { heading: string }) => (
    <div
      className="border-t border-border bg-muted/20 px-4 py-4 sm:px-6"
      style={{ boxShadow: `inset 3px 0 0 ${ACCENT}` }}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{heading}</p>
        <span className="text-xs text-muted-foreground">
          Section editor · mock only
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-foreground">Name</span>
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={secDraft.name}
            onChange={(e) =>
              setSecDraft((d) => ({ ...d, name: e.target.value }))
            }
            placeholder="e.g. Zones"
          />
        </label>
        <label className="block space-y-1.5 text-sm sm:col-span-2">
          <span className="font-medium text-foreground">Description</span>
          <textarea
            className="min-h-[72px] w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={secDraft.description}
            onChange={(e) =>
              setSecDraft((d) => ({ ...d, description: e.target.value }))
            }
            placeholder="Subheading shown under the section name"
          />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={commitSection}
          className="rounded-md px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: ACCENT }}
        >
          {editor?.kind === "section-edit" ? "Update section" : "Add section"}
        </button>
        <button
          type="button"
          onClick={cancel}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const EntryForm = ({ heading }: { heading: string }) => (
    <div
      className="border-t border-border bg-muted/20 px-4 py-4 sm:px-6"
      style={{ boxShadow: `inset 3px 0 0 ${ACCENT}` }}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{heading}</p>
        <span className="text-xs text-muted-foreground">
          Inline row editor · mock only
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-foreground">Section</span>
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={entryDraft.sectionId}
            onChange={(e) =>
              setEntryDraft((d) => ({ ...d, sectionId: e.target.value }))
            }
          >
            {sections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-foreground">Name</span>
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={entryDraft.name}
            onChange={(e) =>
              setEntryDraft((d) => ({ ...d, name: e.target.value }))
            }
            placeholder="Blue label term"
          />
        </label>
        <label className="block space-y-1.5 text-sm sm:col-span-2">
          <span className="font-medium text-foreground">Definition</span>
          <textarea
            className="min-h-[88px] w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={entryDraft.definition}
            onChange={(e) =>
              setEntryDraft((d) => ({ ...d, definition: e.target.value }))
            }
            placeholder="Full definition"
          />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={commitEntry}
          className="rounded-md px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: ACCENT }}
        >
          {editor?.kind === "entry-edit" ? "Update entry" : "Add to table"}
        </button>
        <button
          type="button"
          onClick={cancel}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Glossary"
          subtitle="Sections group terms; each entry has a name and definition — same listing pattern as zone config."
          badge="Glossary"
          accent={ACCENT}
          tabs={[
            { id: "sections", label: "Sections" },
            { id: "entries", label: "Entries" },
          ]}
          tabsValue={activeTab}
          onTabChange={(id) => { setActiveTab(id as GlossaryTab); setSubTab("configuration"); }}
          tabsAriaLabel="Glossary sections"
        />

        {activeTab === "sections" && (
        <div className="space-y-3">
        <SubTabBar
          items={[{ id: "configuration", label: "Records" }]}
          activeId={subTab}
          accent={ACCENT}
          onSelect={setSubTab}
          ariaLabel="Sections sub-sections"
        />
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose a section, then manage entries below. Description is
                  the subheading under each area.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className="shrink-0 border-0 text-white"
                  style={{ backgroundColor: ACCENT }}
                >
                  Listing
                </Badge>
                <button
                  type="button"
                  onClick={startSectionNew}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-white"
                  style={{ backgroundColor: ACCENT }}
                >
                  {editor?.kind === "section-new" ? "Close" : "New section"}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {editor?.kind === "section-new" && (
              <SectionForm heading="New section" />
            )}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">Name</th>
                    <th className="px-4 py-2.5 font-medium">Description</th>
                    <th className="px-4 py-2.5 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sections.map((sec) => {
                    const on = sec.id === activeSection?.id;
                    const editing =
                      editor?.kind === "section-edit" && editor.id === sec.id;
                    return (
                      <Fragment key={sec.id}>
                        <tr
                          className={cn(
                            "border-b border-border/70 transition-colors hover:bg-muted/30",
                            on && "bg-muted/40"
                          )}
                        >
                          <td className="px-4 py-3 align-top">
                            <button
                              type="button"
                              onClick={() => setActiveSectionId(sec.id)}
                              className="text-left font-medium hover:underline"
                              style={{ color: ACCENT }}
                            >
                              {sec.name}
                            </button>
                          </td>
                          <td className="px-4 py-3 align-top text-muted-foreground">
                            <span className="line-clamp-3">
                              {sec.description || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right align-top">
                            <button
                              type="button"
                              onClick={() => startSectionEdit(sec.id)}
                              className="text-sm font-medium text-muted-foreground hover:text-foreground"
                            >
                              {editing ? "Close" : "Edit"}
                            </button>
                          </td>
                        </tr>
                        {editing && (
                          <tr>
                            <td colSpan={3} className="p-0">
                              <SectionForm heading={`Edit · ${sec.name}`} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        </div>
        )}

        {activeTab === "entries" && (
        <div className="space-y-3">
        <SubTabBar
          items={[{ id: "configuration", label: "Records" }]}
          activeId={subTab}
          accent={ACCENT}
          onSelect={setSubTab}
          ariaLabel="Entries sub-sections"
        />
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {activeSection?.description ||
                    "Select a section above to filter entries."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className="shrink-0 border-0 text-white"
                  style={{ backgroundColor: ACCENT }}
                >
                  Listing
                </Badge>
                <select
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                  value={activeSectionId}
                  onChange={(e) => setActiveSectionId(e.target.value)}
                >
                  <option value="">All sections</option>
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>{sec.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={startEntryNew}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-white"
                  style={{ backgroundColor: ACCENT }}
                >
                  {editor?.kind === "entry-new" ? "Close" : "New entry"}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {editor?.kind === "entry-new" && (
              <EntryForm heading="New entry" />
            )}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">Name</th>
                    <th className="px-4 py-2.5 font-medium">Definition</th>
                    <th className="px-4 py-2.5 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sectionEntries.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-8 text-center text-sm text-muted-foreground"
                      >
                        No entries in this section yet. Use New entry.
                      </td>
                    </tr>
                  )}
                  {sectionEntries.map((row) => {
                    const editing =
                      editor?.kind === "entry-edit" && editor.id === row.id;
                    return (
                      <Fragment key={row.id}>
                        <tr className="border-b border-border/70 transition-colors hover:bg-muted/30">
                          <td className="px-4 py-3 align-top">
                            <span
                              className="font-medium"
                              style={{ color: ACCENT }}
                            >
                              {row.name}
                            </span>
                          </td>
                          <td className="px-4 py-3 align-top text-foreground">
                            <span className="line-clamp-4 whitespace-pre-wrap">
                              {row.definition}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right align-top">
                            <button
                              type="button"
                              onClick={() => startEntryEdit(row.id)}
                              className="text-sm font-medium text-muted-foreground hover:text-foreground"
                            >
                              {editing ? "Close" : "Edit"}
                            </button>
                          </td>
                        </tr>
                        {editing && (
                          <tr>
                            <td colSpan={3} className="p-0">
                              <EntryForm heading={`Edit · ${row.name}`} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        </div>
        )}

        <p className="text-xs text-muted-foreground">
          Mock only — changes stay in this browser session. Pattern matches zone
          config listing (I5.6.10+).
        </p>
      </div>
    </AppShell>
  );
}
