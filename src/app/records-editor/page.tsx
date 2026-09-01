"use client";
import { Suspense } from "react";

import { AppShell } from "@/components/shell/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { RecordsEditor } from "@/components/settings/records-editor";
import { theme } from "@/lib/theme";

/**
 * I5.6.43 #209 — Records Editor as top-level page (moved out of Settings).
 * Main tabs: Types | Fields | Picklists are handled by RecordsEditor's internal SectionTabs.
 * Sub-tab: Records under each main tab (also inside RecordsEditor) - id stays "configuration".
 * No page-level SubTabBar — avoids double Records chrome.
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
        <Suspense fallback={<div className="py-8 text-center text-sm text-muted-foreground">Loading editor...</div>}><RecordsEditor /></Suspense>
      </div>
    </AppShell>
  );
}
