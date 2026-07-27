"use client";

import { useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { SectionTabs, type SectionTabItem } from "@/components/ui/section-tabs";
import { SubTabBar } from "@/components/ui/sub-tab-bar";
import { RecordsEditor } from "@/components/settings/records-editor";
import { theme } from "@/lib/theme";

/**
 * I5.6.43 #209 — Records Editor as top-level page (moved out of Settings).
 * Main tabs: Types | Fields | Picklists (delegated to RecordsEditor internal SectionTabs).
 * Sub-tab: Configuration (wrapping the existing RecordsEditor UI).
 */
export default function RecordsEditorPage() {
  const [subTab, setSubTab] = useState("configuration");

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Records Editor"
          subtitle="Manage record types, fields, and picklists for the catalog."
          badge="Records"
          accent={theme.colors.brand}
        />
        <SubTabBar
          items={[{ id: "configuration", label: "Configuration" }]}
          activeId={subTab}
          accent={theme.colors.brand}
          onSelect={setSubTab}
          ariaLabel="Records Editor sub-sections"
        />
        {subTab === "configuration" && (
          <RecordsEditor />
        )}
      </div>
    </AppShell>
  );
}
