"use client";

import { useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { SubTabBar } from "@/components/ui/sub-tab-bar";
import { UsersPanel } from "@/components/settings/users-panel";
import { theme } from "@/lib/theme";

/**
 * Users — Human and Agent directories as main tabs (Records sub-tab on each).
 */
export default function UsersPage() {
  const [tab, setTab] = useState<"human" | "agent">("human");

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
          ]}
          tabsValue={tab}
          onTabChange={(id) => setTab(id === "agent" ? "agent" : "human")}
          tabsAriaLabel="Users sections"
        />
        <div role="tabpanel" className="min-h-[640px] space-y-3">
        <SubTabBar
          items={[{ id: "records", label: "Records" }]}
          activeId="records"
          accent={theme.colors.brand}
          onSelect={() => undefined}
          ariaLabel={`${tab === "agent" ? "Agent" : "Human"} sub-sections`}
        />
        <UsersPanel typeFilter={tab} />
        </div>
      </div>
    </AppShell>
  );
}
