"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { theme } from "@/lib/theme";
import { useBrand } from "@/components/shell/brand-provider";
import { PageHeader } from "@/components/ui/page-header";
import { SubTabBar } from "@/components/ui/sub-tab-bar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GlossaryBookView, OrgBoardView } from "@/components/glossary/glossary-views";
import { BooleanSwitch } from "@/components/ui/boolean-switch";
import {
  INITIAL_ENTRIES,
  INITIAL_SECTIONS,
  type GlossaryEntry,
  type GlossarySection,
} from "@/lib/fixtures/glossary-terms";
import {
  ColumnHeaders,
  rowClickIsToggle,
  sortByText,
  toggleSort,
  type TableSort,
} from "@/components/settings/records-table";

/** I5.6.18 — glossary as data: sections + entries (listing + inline editor). */

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

type Editor =
  | null
  | { kind: "section-new" }
  | { kind: "section-edit"; id: string }
  | { kind: "entry-new" }
  | { kind: "entry-edit"; id: string };

type GlossaryTab = "view" | "org-board" | "sections" | "entries" | "configuration";

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
const actionBtn =
  "rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted";
const primaryBtn =
  "rounded-md px-3 py-1.5 text-sm font-medium text-white";

export default function GlossaryPage() {
  const brand = useBrand();
  const accent = brand.brand_color || theme.colors.brand;
  const [sections, setSections] = useState(INITIAL_SECTIONS);
  const [entries, setEntries] = useState(INITIAL_ENTRIES);
  const [activeTab, setActiveTab] = useState<GlossaryTab>("sections");
  const [glossaryInMenu, setGlossaryInMenu] = useState(true);
  const [orgBoardEnabled, setOrgBoardEnabled] = useState(true);
  const [subTab, setSubTab] = useState<string>("configuration");
  const [activeSectionId, setActiveSectionId] = useState("");
  const [editor, setEditor] = useState<Editor>(null);
  const [sectionSort, setSectionSort] = useState<TableSort>({ key: "name", dir: "asc" });
  const [entrySort, setEntrySort] = useState<TableSort>({ key: "name", dir: "asc" });

  const [secDraft, setSecDraft] = useState({ name: "", description: "" });
  const [entryDraft, setEntryDraft] = useState({
    name: "",
    definition: "",
    sectionId: INITIAL_SECTIONS[0]?.id ?? "",
  });

  useEffect(() => {
    void fetch("/api/settings/system", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("settings unavailable"))))
      .then((json: { data?: { glossary_in_menu?: boolean; org_board_enabled?: boolean } }) => {
        if (!json.data) return;
        setGlossaryInMenu(json.data.glossary_in_menu !== false);
        setOrgBoardEnabled(json.data.org_board_enabled !== false);
      })
      .catch(() => undefined);
  }, []);

  const persistGlossarySettings = async (next: {
    glossary_in_menu?: boolean;
    org_board_enabled?: boolean;
  }) => {
    try {
      const res = await fetch("/api/settings/system", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(next),
      });
      if (!res.ok) return;
      const json = await res.json();
      setGlossaryInMenu(json.data.glossary_in_menu !== false);
      setOrgBoardEnabled(json.data.org_board_enabled !== false);
    } catch {
      /* ignore */
    }
  };

  const activeSection =
    sections.find((s) => s.id === activeSectionId) ?? sections[0];

  const sectionEntries = useMemo(
    () =>
      activeSectionId
        ? entries.filter((e) => e.sectionId === activeSectionId)
        : entries,
    [entries, activeSectionId]
  );

  const sortedSections = useMemo(
    () =>
      sortByText(sections, sectionSort.dir, (s) =>
        sectionSort.key === "description" ? s.description : s.name,
      ),
    [sections, sectionSort],
  );

  const sortedEntries = useMemo(
    () =>
      sortByText(sectionEntries, entrySort.dir, (e) =>
        entrySort.key === "definition" ? e.definition : e.name,
      ),
    [sectionEntries, entrySort],
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
      style={{ boxShadow: `inset 3px 0 0 ${accent}` }}
    >
      <p className="mb-3 text-sm font-medium">{heading}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Name</span>
          <input
            className={fieldClass}
            value={secDraft.name}
            onChange={(e) =>
              setSecDraft((d) => ({ ...d, name: e.target.value }))
            }
            placeholder="e.g. Zones"
          />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-xs font-medium text-muted-foreground">Description</span>
          <textarea
            className={cn(fieldClass, "min-h-[72px] resize-y")}
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
          className={primaryBtn}
          style={{ backgroundColor: accent }}
        >
          {editor?.kind === "section-edit" ? "Update row" : "Add to table"}
        </button>
        <button
          type="button"
          onClick={cancel}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const EntryForm = ({ heading }: { heading: string }) => (
    <div
      className="border-t border-border bg-muted/20 px-4 py-4 sm:px-6"
      style={{ boxShadow: `inset 3px 0 0 ${accent}` }}
    >
      <p className="mb-3 text-sm font-medium">{heading}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Section</span>
          <select
            className={fieldClass}
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
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Name</span>
          <input
            className={fieldClass}
            value={entryDraft.name}
            onChange={(e) =>
              setEntryDraft((d) => ({ ...d, name: e.target.value }))
            }
            placeholder="Term"
          />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-xs font-medium text-muted-foreground">Definition</span>
          <textarea
            className={cn(fieldClass, "min-h-[88px] resize-y")}
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
          className={primaryBtn}
          style={{ backgroundColor: accent }}
        >
          {editor?.kind === "entry-edit" ? "Update row" : "Add to table"}
        </button>
        <button
          type="button"
          onClick={cancel}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <AppShell>
      <div className="space-y-3">
        <PageHeader
          title="Glossary"
          subtitle="Shared language, organizing board, and glossary of terms."
          accent={accent}
          tabs={[
            { id: "sections", label: "Section" },
            { id: "entries", label: "Entry" },
            { id: "view", label: "View" },
            { id: "org-board", label: "Org Board" },
            { id: "configuration", label: "Configuration" },
          ]}
          tabsValue={activeTab}
          onTabChange={(id) => {
            setActiveTab(id as GlossaryTab);
            setSubTab("configuration");
            setEditor(null);
          }}
          tabsAriaLabel="Glossary sections"
        />

        {activeTab === "configuration" && (
          <div role="tabpanel" className="space-y-3">
            <SubTabBar
              items={[{ id: "configuration", label: "Configuration" }]}
              activeId="configuration"
              accent={accent}
              onSelect={() => undefined}
              ariaLabel="Glossary configuration sub-sections"
            />
            <Card className="min-h-[640px] overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  Control whether Glossary and the Org Board appear on the public site menu.
                </p>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-lg space-y-1">
                    <p className="text-sm font-medium">Show Glossary on the public menu</p>
                    <p className="text-sm text-muted-foreground">
                      Include Glossary on the visitor-site header. Turn off to hide it from the public menu. The operator Glossary page is unchanged.
                    </p>
                  </div>
                  <BooleanSwitch
                    checked={glossaryInMenu}
                    onChange={(next) => {
                      setGlossaryInMenu(next);
                      void persistGlossarySettings({ glossary_in_menu: next });
                    }}
                    label={glossaryInMenu ? "On" : "Off"}
                  />
                </div>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-lg space-y-1">
                    <p className="text-sm font-medium">Show Org Board on the public menu</p>
                    <p className="text-sm text-muted-foreground">
                      Include Org Board on the visitor-site header. Turn off to hide that public link.
                    </p>
                  </div>
                  <BooleanSwitch
                    checked={orgBoardEnabled}
                    onChange={(next) => {
                      setOrgBoardEnabled(next);
                      void persistGlossarySettings({ org_board_enabled: next });
                    }}
                    label={orgBoardEnabled ? "On" : "Off"}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "org-board" && (
          <div role="tabpanel" className="space-y-3">
            <SubTabBar
              items={[{ id: "org-board", label: "Org Board" }]}
              activeId="org-board"
              accent={accent}
              onSelect={() => undefined}
              ariaLabel="Org Board sub-sections"
            />
            <OrgBoardView accent={accent} />
          </div>
        )}

        {activeTab === "view" && (
          <div role="tabpanel" className="space-y-3">
            <SubTabBar
              items={[{ id: "view", label: "View" }]}
              activeId="view"
              accent={accent}
              onSelect={() => undefined}
              ariaLabel="View sub-sections"
            />
          <GlossaryBookView
            accent={accent}
            sections={sections}
            entries={entries}
            activeSectionId={activeSectionId}
            onSectionChange={setActiveSectionId}
          />
          </div>
        )}

        {activeTab === "sections" && (
        <div role="tabpanel" className="space-y-3">
        <SubTabBar
          items={[{ id: "configuration", label: "Sections" }]}
          activeId={subTab}
          accent={accent}
          onSelect={setSubTab}
          ariaLabel="Sections sub-sections"
        />
        <Card className="min-h-[640px] overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose a section, then manage entries on the Entries tab. Description is
                  the subheading under each area.
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 whitespace-nowrap">
                <button
                  type="button"
                  onClick={startSectionNew}
                  className={primaryBtn}
                  style={{ backgroundColor: accent }}
                >
                  {editor?.kind === "section-new" ? "Close" : "New Record"}
                </button>
                <Badge
                  className="shrink-0 border-0 text-white"
                  style={{ backgroundColor: accent }}
                >
                  Listing
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {editor?.kind === "section-new" && (
              <SectionForm heading="New Record" />
            )}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-left text-sm">
                <thead>
                  <ColumnHeaders
                    cols={["name", "description", "actions"]}
                    meta={{
                      name: { label: "Name", sortKey: "name" },
                      description: { label: "Description", sortKey: "description" },
                      actions: { label: "Actions" },
                    }}
                    sort={sectionSort}
                    onSort={(k) => setSectionSort((s) => toggleSort(s, k))}
                    onReorder={() => undefined}
                    dragOver={null}
                    onDragOverKey={() => undefined}
                    reorderable={false}
                  />
                </thead>
                <tbody>
                  {sortedSections.map((sec) => {
                    const on = sec.id === activeSection?.id;
                    const editing =
                      editor?.kind === "section-edit" && editor.id === sec.id;
                    return (
                      <Fragment key={sec.id}>
                        <tr
                          className={cn(
                            "cursor-pointer border-b border-border/70 transition-colors hover:bg-muted/30",
                            (on || editing) && "bg-muted/40"
                          )}
                          onClick={(e) => {
                            if (rowClickIsToggle(e.target)) startSectionEdit(sec.id);
                          }}
                        >
                          <td className="px-4 py-3 align-top font-medium">
                            {sec.name}
                          </td>
                          <td className="px-4 py-3 align-top text-muted-foreground">
                            <span className="line-clamp-3">
                              {sec.description || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right align-top" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => startSectionEdit(sec.id)}
                              className={actionBtn}
                              style={
                                editing
                                  ? { borderColor: accent, color: accent }
                                  : undefined
                              }
                            >
                              {editing ? "Close" : "Edit"}
                            </button>
                          </td>
                        </tr>
                        {editing && (
                          <tr>
                            <td colSpan={3} className="p-0">
                              <SectionForm heading="Edit Record" />
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
        <div role="tabpanel" className="space-y-3">
        <SubTabBar
          items={[{ id: "configuration", label: "Entries" }]}
          activeId={subTab}
          accent={accent}
          onSelect={setSubTab}
          ariaLabel="Entries sub-sections"
        />
        <Card className="min-h-[640px] overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="mt-1 text-sm text-muted-foreground">
                  {activeSection?.description ||
                    "Select a section to filter entries."}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <div className="flex flex-nowrap items-center justify-end gap-2">
                  <select
                    className="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                    className={primaryBtn}
                    style={{ backgroundColor: accent }}
                  >
                    {editor?.kind === "entry-new" ? "Close" : "New Record"}
                  </button>
                </div>
                <Badge
                  className="shrink-0 border-0 text-white"
                  style={{ backgroundColor: accent }}
                >
                  Listing
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {editor?.kind === "entry-new" && (
              <EntryForm heading="New Record" />
            )}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                <thead>
                  <ColumnHeaders
                    cols={["name", "definition", "actions"]}
                    meta={{
                      name: { label: "Name", sortKey: "name" },
                      definition: { label: "Definition", sortKey: "definition" },
                      actions: { label: "Actions" },
                    }}
                    sort={entrySort}
                    onSort={(k) => setEntrySort((s) => toggleSort(s, k))}
                    onReorder={() => undefined}
                    dragOver={null}
                    onDragOverKey={() => undefined}
                    reorderable={false}
                  />
                </thead>
                <tbody>
                  {sortedEntries.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-8 text-center text-sm text-muted-foreground"
                      >
                        No entries in this section yet. Use New Record.
                      </td>
                    </tr>
                  )}
                  {sortedEntries.map((row) => {
                    const editing =
                      editor?.kind === "entry-edit" && editor.id === row.id;
                    return (
                      <Fragment key={row.id}>
                        <tr
                          className={cn(
                            "cursor-pointer border-b border-border/70 transition-colors hover:bg-muted/30",
                            editing && "bg-muted/40",
                          )}
                          onClick={(e) => {
                            if (rowClickIsToggle(e.target)) startEntryEdit(row.id);
                          }}
                        >
                          <td className="px-4 py-3 align-top font-medium">
                            {row.name}
                          </td>
                          <td className="px-4 py-3 align-top text-muted-foreground">
                            <span className="line-clamp-4 whitespace-pre-wrap">
                              {row.definition}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right align-top" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => startEntryEdit(row.id)}
                              className={actionBtn}
                              style={
                                editing
                                  ? { borderColor: accent, color: accent }
                                  : undefined
                              }
                            >
                              {editing ? "Close" : "Edit"}
                            </button>
                          </td>
                        </tr>
                        {editing && (
                          <tr>
                            <td colSpan={3} className="p-0">
                              <EntryForm heading="Edit Record" />
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
      </div>
    </AppShell>
  );
}
