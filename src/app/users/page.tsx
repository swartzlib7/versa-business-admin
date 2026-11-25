"use client";

import { useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { SubTabBar } from "@/components/ui/sub-tab-bar";
import { UsersPanel } from "@/components/settings/users-panel";
import { theme } from "@/lib/theme";

/**
 * Users — Human, Agent and System (1.0.20: integration token accounts) directories as main tabs.
 */
export default function UsersPage() {
  const [tab, setTab] = useState<"human" | "agent" | "system">("human");

  return (
    <AppShell>
      <div className="space-y-3">
        <PageHeader
          title="Users"
          subtitle="Manage user accounts, roles, and access."
          accent={theme.colors.brand}
          tabs={[
            { id: "human", label: "Human" },
            { id: "agent", label: "Agent" },
            { id: "system", label: "System" },
          ]}
          tabsValue={tab}
          onTabChange={(id) => setTab(id === "agent" || id === "system" ? id : "human")}
          tabsAriaLabel="Users sections"
        />
        <div role="tabpanel" className="space-y-3">
        <SubTabBar
          items={[{ id: "records", label: "Records" }]}
          activeId="records"
          accent={theme.colors.brand}
          onSelect={() => undefined}
          ariaLabel={`${tab === "agent" ? "Agent" : tab === "system" ? "System" : "Human"} sub-sections`}
        />
        <UsersPanel typeFilter={tab} />
        </div>
      </div>
    </AppShell>
  );
}
