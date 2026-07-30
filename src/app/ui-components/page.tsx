"use client";

import { AppShell } from "@/components/shell/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { ComponentGallery } from "@/components/ui/component-gallery";
import { theme } from "@/lib/theme";

/**
 * I5.6.32 Slice 3 — UI Component Gallery & Framework Reference page.
 * Displays all active shadcn/ui components, styling tokens, and tech stack.
 */
export default function UIComponentsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="UI Components"
          subtitle="Component library, design tokens, and framework reference."
          badge="Gallery"
          accent={theme.colors.brand}
        />
        <ComponentGallery />
      </div>
    </AppShell>
  );
}
