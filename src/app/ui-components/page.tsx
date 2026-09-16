"use client";

import { useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { SubTabBar } from "@/components/ui/sub-tab-bar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ComponentGallery, GALLERY_SECTIONS } from "@/components/ui/component-gallery";
import { theme } from "@/lib/theme";

/**
 * UI Component gallery — each component family is a main tab with a Configuration-style strip.
 */
export default function UIComponentsPage() {
  const [tab, setTab] = useState(GALLERY_SECTIONS[0]?.id ?? "buttons");
  const current = GALLERY_SECTIONS.find((s) => s.id === tab) ?? GALLERY_SECTIONS[0];

  return (
    <AppShell>
      <div className="space-y-3">
        <PageHeader
          title="UI Components"
          subtitle="Component library, design tokens, and framework reference."
          accent={theme.colors.brand}
          tabs={GALLERY_SECTIONS}
          tabsValue={tab}
          onTabChange={setTab}
          tabsAriaLabel="UI Components sections"
        />
        <div role="tabpanel" className="space-y-3">
          <SubTabBar
            items={[{ id: tab, label: current?.label ?? "Components" }]}
            activeId={tab}
            accent={theme.colors.brand}
            onSelect={() => undefined}
            ariaLabel="UI Components sub-sections"
          />
          <Card className="min-h-[640px] overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {current?.description ?? "Components from the shared library."}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <ComponentGallery sectionId={tab} hideSectionHeading />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
