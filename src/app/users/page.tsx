"use client";

import { useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { SubTabBar } from "@/components/ui/sub-tab-bar";
import { UsersPanel } from "@/components/settings/users-panel";
import { theme } from "@/lib/theme";

/**
 * I5.6.43 #209 — Users as top-level page (moved out of Settings).
 * Sub-tab: Records (wrapping UsersPanel) - id stays "configuration" for deep links.
 */
export default function UsersPage() {
  const [subTab, setSubTab] = useState("configuration");

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Users"
          subtitle="Manage user accounts, roles, and access."
          badge="Users"
          accent={theme.colors.brand}
        />
        <SubTabBar
          items={[{ id: "configuration", label: "Records" }]}
          activeId={subTab}
          accent={theme.colors.brand}
          onSelect={setSubTab}
          ariaLabel="Users sub-sections"
        />
        {subTab === "configuration" && (
          <UsersPanel />
        )}
      </div>
    </AppShell>
  );
}
