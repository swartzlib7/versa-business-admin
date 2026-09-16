"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { theme } from "@/lib/theme";
import { useBrand } from "@/components/shell/brand-provider";
import { PageHeader } from "@/components/ui/page-header";
import { SubTabBar } from "@/components/ui/sub-tab-bar";
import { GlossaryBookView, OrgBoardView } from "@/components/glossary/glossary-views";
import { EntityListing } from "@/components/listing/entity-listing";
import {
  INITIAL_ENTRIES,
  INITIAL_SECTIONS,
  type GlossaryEntry,
  type GlossarySection,
} from "@/lib/fixtures/glossary-terms";
import {
  formatGlossaryDate,
  formatGlossaryUser,
} from "@/lib/public/page-builder-glossary";
import { useSession } from "@/lib/auth/use-session";

/** I5.6.18 — glossary as data: sections + entries (listing + inline editor). */

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

type GlossaryTab = "view" | "org-board" | "sections" | "entries";

function stampAudit(
  draft: Record<string, string>,
  existing: Partial<{ created_at: string; created_by: string }>,
  userId: string,
) {
  const now = new Date().toISOString();
  return {
    created_at: existing.created_at || now,
    updated_at: now,
    created_by: existing.created_by || userId,
    last_modified_by: userId,
  };
}

export default function GlossaryPage() {
  const brand = useBrand();
  const accent = brand.brand_color || theme.colors.brand;
  const session = useSession();
  const [sections, setSections] = useState(INITIAL_SECTIONS);
  const [entries, setEntries] = useState(INITIAL_ENTRIES);
  const [activeTab, setActiveTab] = useState<GlossaryTab>("sections");
  const [subTab, setSubTab] = useState<string>("configuration");
  const [activeSectionId, setActiveSectionId] = useState("");

  const auditFields = useMemo(
    () => [
      { key: "created_at", label: "Created Date", kind: "datetime" as const, readOnly: true },
      { key: "updated_at", label: "Last Modified Date", kind: "datetime" as const, readOnly: true },
      {
        key: "created_by",
        label: "Created By",
        kind: "lookup" as const,
        lookupObjectApiName: "user",
        readOnly: true,
      },
      {
        key: "last_modified_by",
        label: "Last Modified By",
        kind: "lookup" as const,
        lookupObjectApiName: "user",
        readOnly: true,
      },
    ],
    [],
  );
  const sectionFields = useMemo(
    () => [
      { key: "name", label: "Name", kind: "text" as const },
      { key: "description", label: "Description", kind: "textarea" as const },
      { key: "enabled", label: "Enabled", kind: "boolean" as const },
      ...auditFields,
    ],
    [auditFields],
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
      { key: "enabled", label: "Enabled", kind: "boolean" as const },
      ...auditFields,
    ],
    [sections, auditFields],
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
            { id: "view", label: "Glossary of terms" },
            { id: "org-board", label: "Org Board" },
          ]}
          tabsValue={activeTab}
          onTabChange={(id) => {
            setActiveTab(id as GlossaryTab);
            setSubTab("configuration");
          }}
          tabsAriaLabel="Glossary sections"
        />

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
              items={[{ id: "view", label: "Glossary of terms" }]}
              activeId="view"
              accent={accent}
              onSelect={() => undefined}
              ariaLabel="Glossary of terms sub-sections"
            />
          <GlossaryBookView
            accent={accent}
            sections={sections.filter((s) => s.enabled !== false)}
            entries={entries.filter((e) => e.enabled !== false)}
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
          getCell={(s, k) => {
            if (k === "description") return s.description;
            if (k === "enabled") return s.enabled === false ? "false" : "true";
            if (k === "created_at") return s.created_at ?? "";
            if (k === "updated_at") return s.updated_at ?? "";
            if (k === "created_by") return s.created_by ?? "";
            if (k === "last_modified_by") return s.last_modified_by ?? "";
            return s.name;
          }}
          formatCell={(s, k, raw) => {
            if (k === "created_at" || k === "updated_at") return formatGlossaryDate(raw);
            if (k === "created_by" || k === "last_modified_by") return formatGlossaryUser(raw);
            return raw;
          }}
          onAdd={(draft) => {
            const name = (draft.name ?? "").trim();
            if (!name) return false;
            const id = uid("sec");
            const audit = stampAudit(draft, {}, session?.userId || "user-coa");
            setSections((prev) => [
              ...prev,
              {
                id,
                name,
                description: (draft.description ?? "").trim(),
                enabled: draft.enabled !== "false",
                ...audit,
              },
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
                  ? {
                      ...s,
                      name,
                      description: (draft.description ?? "").trim(),
                      enabled: draft.enabled !== "false",
                      ...stampAudit(draft, s, session?.userId || "user-coa"),
                    }
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
            if (k === "enabled") return e.enabled === false ? "false" : "true";
            if (k === "created_at") return e.created_at ?? "";
            if (k === "updated_at") return e.updated_at ?? "";
            if (k === "created_by") return e.created_by ?? "";
            if (k === "last_modified_by") return e.last_modified_by ?? "";
            return e.name;
          }}
          formatCell={(e, k, raw) => {
            if (k === "sectionId") {
              return sections.find((s) => s.id === raw)?.name ?? raw;
            }
            if (k === "created_at" || k === "updated_at") return formatGlossaryDate(raw);
            if (k === "created_by" || k === "last_modified_by") return formatGlossaryUser(raw);
            return raw;
          }}
          onAdd={(draft) => {
            const name = (draft.name ?? "").trim();
            const sectionId = draft.sectionId || sections[0]?.id;
            if (!name || !sectionId) return false;
            const audit = stampAudit(draft, {}, session?.userId || "user-coa");
            setEntries((prev) => [
              ...prev,
              {
                id: uid("e"),
                name,
                definition: (draft.definition ?? "").trim(),
                sectionId,
                enabled: draft.enabled !== "false",
                ...audit,
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
                      enabled: draft.enabled !== "false",
                      ...stampAudit(draft, e, session?.userId || "user-coa"),
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
