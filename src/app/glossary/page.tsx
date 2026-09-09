"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { theme } from "@/lib/theme";
import { useBrand } from "@/components/shell/brand-provider";
import { PageHeader } from "@/components/ui/page-header";
import { SubTabBar } from "@/components/ui/sub-tab-bar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { GlossaryBookView, OrgBoardView } from "@/components/glossary/glossary-views";
import { BooleanSwitch } from "@/components/ui/boolean-switch";
import { EntityListing } from "@/components/listing/entity-listing";
import {
  INITIAL_ENTRIES,
  INITIAL_SECTIONS,
  type GlossaryEntry,
  type GlossarySection,
} from "@/lib/fixtures/glossary-terms";

/** I5.6.18 — glossary as data: sections + entries (listing + inline editor). */

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

type GlossaryTab = "view" | "org-board" | "sections" | "entries" | "configuration";

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

  const sectionFields = useMemo(
    () => [
      { key: "name", label: "Name", kind: "text" as const },
      { key: "description", label: "Description", kind: "textarea" as const },
    ],
    [],
  );
  const entryFields = useMemo(
    () => [
      { key: "name", label: "Name", kind: "text" as const },
      { key: "definition", label: "Definition", kind: "textarea" as const },
      {
        key: "sectionId",
        label: "Section",
        kind: "select" as const,
        options: sections.map((s) => s.id),
        optionLabels: sections.map((s) => s.name),
      },
    ],
    [sections],
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
        <EntityListing<GlossarySection & Record<string, unknown>>
          summary="Choose a section, then manage entries on the Entry tab. Description is the subheading under each area."
          accent={accent}
          fields={sectionFields}
          rows={sections}
          getRowId={(s) => s.id}
          getCell={(s, k) => (k === "description" ? s.description : s.name) ?? ""}
          onAdd={(draft) => {
            const name = (draft.name ?? "").trim();
            if (!name) return false;
            const id = uid("sec");
            setSections((prev) => [
              ...prev,
              { id, name, description: (draft.description ?? "").trim() },
            ]);
            setActiveSectionId(id);
            return true;
          }}
          onUpdate={(id, draft) => {
            const name = (draft.name ?? "").trim();
            if (!name) return false;
            setSections((prev) =>
              prev.map((s) =>
                s.id === id
                  ? { ...s, name, description: (draft.description ?? "").trim() }
                  : s,
              ),
            );
            return true;
          }}
          columnStorageKey="mc.listing.glossary.sections"
          onDelete={(id) => {
            setSections((prev) => prev.filter((s) => s.id !== id));
            setEntries((prev) => prev.filter((e) => e.sectionId !== id));
            setActiveSectionId((cur) => (cur === id ? "" : cur));
          }}
          emptyLabel="No sections yet — use New to add the first row."
        />
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
        <EntityListing<GlossaryEntry & Record<string, unknown>>
          summary="Glossary entries. Filter by Section or search by name. Drag headers to reorder."
          accent={accent}
          fields={entryFields}
          rows={entries}
          getRowId={(e) => e.id}
          getCell={(e, k) => {
            if (k === "definition") return e.definition;
            if (k === "sectionId") return e.sectionId;
            return e.name;
          }}
          formatCell={(e, k, raw) => {
            if (k === "sectionId") {
              return sections.find((s) => s.id === raw)?.name ?? raw;
            }
            return raw;
          }}
          onAdd={(draft) => {
            const name = (draft.name ?? "").trim();
            const sectionId = draft.sectionId || sections[0]?.id;
            if (!name || !sectionId) return false;
            setEntries((prev) => [
              ...prev,
              {
                id: uid("e"),
                name,
                definition: (draft.definition ?? "").trim(),
                sectionId,
              },
            ]);
            return true;
          }}
          onUpdate={(id, draft) => {
            const name = (draft.name ?? "").trim();
            const sectionId = draft.sectionId || sections[0]?.id;
            if (!name || !sectionId) return false;
            setEntries((prev) =>
              prev.map((e) =>
                e.id === id
                  ? {
                      ...e,
                      name,
                      definition: (draft.definition ?? "").trim(),
                      sectionId,
                    }
                  : e,
              ),
            );
            return true;
          }}
          columnStorageKey="mc.listing.glossary.entries"
          onDelete={(id) => {
            setEntries((prev) => prev.filter((e) => e.id !== id));
          }}
          emptyLabel="No entries yet — use New to add the first row."
        />
        </div>
        )}
      </div>
    </AppShell>
  );
}
