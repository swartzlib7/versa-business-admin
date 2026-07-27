"use client";

import { AppShell } from "@/components/shell/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { RecordsEditor } from "@/components/settings/records-editor";
import { theme } from "@/lib/theme";

/**
 * I5.6.43 #209 — Records Editor as top-level page (moved out of Settings).
 * Main tabs: Types | Fields | Picklists are handled by RecordsEditor's internal SectionTabs.
 * Sub-tab: Configuration under each main tab (also inside RecordsEditor).
 * No page-level SubTabBar — avoids double Configuration chrome.
 */
export default function RecordsEditorPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Records Editor"
          subtitle="Manage record types, fields, and picklists for the catalog."
          badge="Records"
          accent={theme.colors.brand}
        />
        <RecordsEditor />
      </div>
    </AppShell>
  );
}
