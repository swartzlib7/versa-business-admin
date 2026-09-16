"use client";
import { Suspense } from "react";

import { AppShell } from "@/components/shell/app-shell";
import { RecordsEditor } from "@/components/settings/records-editor";

/**
 * Records Editor — page chrome (title + main tabs) lives inside RecordsEditor
 * so the tab strip sits directly under the subtitle with no extra gap.
 */
export default function RecordsEditorPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="py-8 text-center text-sm text-muted-foreground">Loading editor...</div>}>
        <RecordsEditor />
      </Suspense>
    </AppShell>
  );
}
