"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { Separator } from "@/components/ui/separator";
import { useBrand } from "@/components/shell/brand-provider";
import { PageHeader } from "@/components/ui/page-header";
import { SubTabBar } from "@/components/ui/sub-tab-bar";
import { BooleanSwitch } from "@/components/ui/boolean-switch";
import { SampleDataPanel } from "@/components/settings/sample-data-panel";
import { ApiDocsPanel } from "@/components/settings/api-docs-panel";
import { PanelShell } from "@/components/settings/settings-chrome";

type SettingsTab = "modes" | "api";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "modes", label: "Modes" },
  { id: "api", label: "API" },
];

const MOVED_TO_PAGE_BUILDER: Record<string, string> = {
  branding: "/page-builder?tab=branding",
  menu: "/page-builder?tab=menu",
  "page-builder": "/page-builder?tab=canvas",
  public: "/page-builder?tab=elements&sub=cycle-strip",
  cycle: "/page-builder?tab=elements&sub=cycle-strip",
  appearance: "/page-builder?tab=appearance",
  sky: "/page-builder?tab=sky",
};

function SystemPanel() {
  const brand = useBrand();
  const [demoMode, setDemoMode] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [publicLogin, setPublicLogin] = useState(true);
  const [sampleInserted, setSampleInserted] = useState<boolean | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/system")
      .then((r) => r.json())
      .then((json) => {
        if (json?.data) {
          setDemoMode(json.data.demo_mode !== false);
          setMaintenanceMode(json.data.maintenance_mode === true);
          setPublicLogin(json.data.public_login_enabled !== false);
        }
      })
      .catch(() => setError("Could not load system modes."))
      .finally(() => setLoaded(true));
    fetch("/api/settings/sample-data")
      .then((r) => r.json())
      .then((json) => setSampleInserted(json?.data?.inserted === true))
      .catch(() => undefined);
  }, []);

  const persist = async (next: {
    demo_mode?: boolean;
    maintenance_mode?: boolean;
    public_login_enabled?: boolean;
  }) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/system", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setError(payload?.error?.message ?? "Save failed.");
        return;
      }
      const json = await res.json();
      setDemoMode(json.data.demo_mode !== false);
      setMaintenanceMode(json.data.maintenance_mode === true);
      setPublicLogin(json.data.public_login_enabled !== false);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PanelShell summary="Control what visitors see on the public site." badge="Site">
      <div className="space-y-6">
        <SampleDataPanel />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-lg space-y-1">
            <p className="text-sm font-medium">Demo mode</p>
            <p className="text-sm text-muted-foreground">
              Composes the visitor homepage from live records first — including
              sample-data rows tagged <code className="text-xs">ba_sample:</code> —
              and falls back to fixtures only where a record type does not exist
              yet (Facets HTML, Inspections & Reports). Turn off to hide fixture
              gaps and show only wired live sections. While Demo mode is on, the
              login page shows install-account hints.
            </p>
          </div>
          <BooleanSwitch
            checked={demoMode}
            onChange={(next) => {
              setDemoMode(next);
              void persist({ demo_mode: next });
            }}
            label={demoMode ? "On" : "Off"}
            labelSide="start"
          />
        </div>
        {demoMode && sampleInserted === false ? (
          <p className="text-sm text-muted-foreground">
            Demo is on but no sample rows are in the store. Insert sample data
            above so Integrations, Operations, Metrics, Knowledge, and About
            compose from live records instead of leftover fixtures.
          </p>
        ) : null}
        <Separator />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-lg space-y-1">
            <p className="text-sm font-medium">Maintenance mode</p>
            <p className="text-sm text-muted-foreground">
              Replaces the public homepage with a paused notice. Operators can
              still sign in and turn this off.
            </p>
          </div>
          <BooleanSwitch
            checked={maintenanceMode}
            onChange={(next) => {
              setMaintenanceMode(next);
              void persist({ maintenance_mode: next });
            }}
            label={maintenanceMode ? "On" : "Off"}
            labelSide="start"
          />
        </div>
        <Separator />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-lg space-y-1">
            <p className="text-sm font-medium">Public sign-in</p>
            <p className="text-sm text-muted-foreground">
              Show Sign In on the visitor homepage. Turn off to hide it from
              the public site. Operators can still open the login page directly
              if they know the address.
            </p>
          </div>
          <BooleanSwitch
            checked={publicLogin}
            onChange={(next) => {
              setPublicLogin(next);
              void persist({ public_login_enabled: next });
            }}
            label={publicLogin ? "Visible" : "Hidden"}
            labelSide="start"
          />
        </div>
        {!loaded || saving ? (
          <p className="text-xs text-muted-foreground">{saving ? "Saving…" : "Loading…"}</p>
        ) : null}
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Hard-refresh the public homepage after a change. Brand color for this
          instance is {brand.brand_color}.
        </p>
      </div>
    </PanelShell>
  );
}

function settingsTabFromSearch(): SettingsTab {
  if (typeof window === "undefined") return "modes";
  const q = new URLSearchParams(window.location.search).get("tab");
  if (q === "records") {
    window.location.replace("/records-editor");
    return "modes";
  }
  if (q === "users") {
    window.location.replace("/users");
    return "modes";
  }
  if (q && MOVED_TO_PAGE_BUILDER[q]) {
    const sub = new URLSearchParams(window.location.search).get("sub");
    const dest = MOVED_TO_PAGE_BUILDER[q];
    window.location.replace(sub ? `${dest}${dest.includes("?") ? "&" : "?"}sub=${sub}` : dest);
    return "modes";
  }
  if (q === "system" || q === "information") return "modes";
  if (q && TABS.some((t) => t.id === q)) return q as SettingsTab;
  return "modes";
}

function writeSettingsSearch(tab: SettingsTab) {
  const url = new URL(window.location.href);
  url.searchParams.set("tab", tab);
  url.searchParams.delete("sub");
  const next = `${url.pathname}${url.search}`;
  if (next !== `${window.location.pathname}${window.location.search}`) {
    window.history.replaceState(null, "", next);
  }
}

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>(() => settingsTabFromSearch());
  const brand = useBrand();

  useEffect(() => {
    writeSettingsSearch(tab);
  }, [tab]);

  return (
    <AppShell>
      <div className="space-y-3">
        <PageHeader
          title="Settings"
          subtitle="System modes and API. Site chrome lives under Page Builder."
          accent={brand.brand_color}
          tabs={TABS}
          tabsValue={tab}
          onTabChange={(id) => setTab(id as SettingsTab)}
          tabsAriaLabel="Settings sections"
        />

        {tab === "modes" && (
          <div role="tabpanel" className="space-y-3">
            <SubTabBar
              items={[{ id: "configuration", label: "Configuration" }]}
              activeId="configuration"
              accent={brand.brand_color}
              onSelect={() => undefined}
              ariaLabel="Modes sub-sections"
            />
            <SystemPanel />
          </div>
        )}

        {tab === "api" && (
          <div role="tabpanel" className="space-y-3">
            <SubTabBar
              items={[{ id: "configuration", label: "Configuration" }]}
              activeId="configuration"
              accent={brand.brand_color}
              onSelect={() => undefined}
              ariaLabel="API sub-sections"
            />
            <PanelShell
              summary="HTTP API for this version. Agents and operators use the same catalog. Open JSON index for the machine-readable map."
              badge="API"
            >
              <ApiDocsPanel />
            </PanelShell>
          </div>
        )}
      </div>
    </AppShell>
  );
}
