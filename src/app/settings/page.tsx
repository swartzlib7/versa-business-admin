"use client";

import { useState, useEffect, type ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useUiTheme, type UiTheme } from "@/components/shell/theme-provider";
import { useBrand } from "@/components/shell/brand-provider";
import { PageHeader } from "@/components/ui/page-header";
import { SubTabBar } from "@/components/ui/sub-tab-bar";
import { Moon, Sun, Compass, Cloud, Sunset } from "lucide-react";
import { BooleanSwitch } from "@/components/ui/boolean-switch";
import { PublicSitePanel } from "@/components/settings/public-site-panel";
import { BrandingPanel, type BrandingSubTab } from "@/components/settings/branding-panel";
import { MenuItemsPanel } from "@/components/settings/menu-items-panel";
import { SampleDataPanel } from "@/components/settings/sample-data-panel";

type SettingsTab =
  | "branding"
  | "menu"
  | "public"
  | "appearance"
  | "modes"
  | "sky";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "branding", label: "Branding" },
  { id: "menu", label: "Menu" },
  { id: "public", label: "Cycle Strip" },
  { id: "appearance", label: "Appearance" },
  { id: "modes", label: "Modes" },
  { id: "sky", label: "Sky Animation" },
];

const THEME_OPTIONS: {
  id: UiTheme;
  label: string;
  blurb: string;
  icon: typeof Sun;
}[] = [
  {
    id: "light",
    label: "Light",
    blurb: "Clean daylight surfaces for long reading sessions.",
    icon: Sun,
  },
  {
    id: "dusk",
    label: "Dusk",
    blurb: "Light, dimmed about 20% — same shades, easier on the eyes.",
    icon: Sunset,
  },
  {
    id: "slate",
    label: "Slate",
    blurb: "Elegant mid-gray — between dark and light, pure neutral tones.",
    icon: Cloud,
  },
  {
    id: "dark",
    label: "Dark",
    blurb: "Low-glare mission night mode.",
    icon: Moon,
  },
  {
    id: "architect",
    label: "Architect",
    blurb: "Navy, gold, and crimson — a Superman-type mission identity.",
    icon: Compass,
  },
];

function PanelShell({
  summary,
  badge,
  fill = false,
  children,
}: {
  summary: string;
  badge?: string;
  fill?: boolean;
  children: ReactNode;
}) {
  const brand = useBrand();
  return (
    <Card className={cn("overflow-hidden", fill && "flex flex-1 flex-col")}>
      <CardHeader className="shrink-0 border-b bg-muted/30">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
          </div>
          {badge ? (
            <Badge
              className="shrink-0 border-0 text-white"
              style={{ backgroundColor: brand.brand_color }}
            >
              {badge}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className={cn("p-6", fill && "flex flex-1 flex-col")}>{children}</CardContent>
    </Card>
  );
}

function SystemPanel() {
  const brand = useBrand();
  const [demoMode, setDemoMode] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [publicLogin, setPublicLogin] = useState(true);
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
    <PanelShell
      summary="Control what visitors see on the public site."
      badge="Site"
    >
      <div className="space-y-6">
        <SampleDataPanel />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-lg space-y-1">
            <p className="text-sm font-medium">Demo mode</p>
            <p className="text-sm text-muted-foreground">
              Shows polished sample Facets, Other Systems, Integrations,
              Operations, Support, Metrics, Knowledge, and About on the visitor
              site. Those samples are not live records. Turn off to show only
              wired live sections. This toggle does not fill empty database
              tables with sample rows.
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
          <p className="text-xs text-muted-foreground">
            {saving ? "Saving…" : "Loading…"}
          </p>
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

function AppearancePanel() {
  const { theme: uiTheme, setTheme } = useUiTheme();
  return (
    <PanelShell
      summary="Choose how Mission Control looks. Selection is remembered on this device and survives navigation (including Glossary on the side menu)."
      badge="Theme"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {THEME_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = uiTheme === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id)}
              className={cn(
                "rounded-lg border p-4 text-left transition-colors",
                active
                  ? "border-primary bg-primary/10 ring-2 ring-primary/40"
                  : "border-border bg-card hover:bg-muted/60",
              )}
            >
              <div className="mb-2 flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <span className="font-semibold">{opt.label}</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {opt.blurb}
              </p>
            </button>
          );
        })}
      </div>
    </PanelShell>
  );
}

const SETTINGS_TABS: SettingsTab[] = [
  "branding",
  "menu",
  "public",
  "appearance",
  "modes",
  "sky",
];
const BRANDING_SUBS = ["brand", "logo"] as const;

function settingsTabFromSearch(): SettingsTab {
  if (typeof window === "undefined") return "branding";
  const q = new URLSearchParams(window.location.search).get("tab");
  if (q === "records") {
    window.location.replace("/records-editor");
    return "branding";
  }
  if (q === "users") {
    window.location.replace("/users");
    return "branding";
  }
  if (q === "system" || q === "information") return "modes";
  if (q === "cycle") return "public";
  const sub = new URLSearchParams(window.location.search).get("sub");
  if (q === "sky" || (q === "branding" && sub === "sky")) return "sky";
  if (q && SETTINGS_TABS.includes(q as SettingsTab)) {
    return q as SettingsTab;
  }
  return "branding";
}

function settingsSubFromSearch(tab: SettingsTab): string {
  if (typeof window === "undefined") return tab === "branding" ? "brand" : "configuration";
  const sub = new URLSearchParams(window.location.search).get("sub");
  if (tab === "branding" && sub && (BRANDING_SUBS as readonly string[]).includes(sub)) {
    return sub;
  }
  if (tab === "menu" && sub && (sub === "operator" || sub === "public")) return sub;
  if (tab === "appearance" || tab === "public") return "configuration";
  return tab === "branding" ? "brand" : tab === "menu" ? "operator" : "configuration";
}

function writeSettingsSearch(tab: SettingsTab, sub: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("tab", tab);
  if (tab === "branding" && sub !== "brand") url.searchParams.set("sub", sub);
  else if (tab === "menu" && sub !== "operator") url.searchParams.set("sub", sub);
  else url.searchParams.delete("sub");
  const next = `${url.pathname}${url.search}`;
  if (next !== `${window.location.pathname}${window.location.search}`) {
    window.history.replaceState(null, "", next);
  }
}

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>(() => settingsTabFromSearch());
  const [subTab, setSubTab] = useState<string>(() =>
    settingsSubFromSearch(settingsTabFromSearch()),
  );
  const brand = useBrand();
  const skyFill = tab === "sky";

  useEffect(() => {
    writeSettingsSearch(tab, subTab);
  }, [tab, subTab]);

  return (
    <AppShell fillViewport={skyFill}>
      <div className={cn(skyFill ? "flex h-full flex-1 flex-col gap-3" : "space-y-3")}>
        <PageHeader
          title="Settings"
          subtitle="White-label configuration and system preferences."
          accent={brand.brand_color}
          tabs={TABS}
          tabsValue={tab}
          onTabChange={(id) => {
            const next = id as SettingsTab;
            setTab(next);
            if (next === "branding") setSubTab("brand");
            else if (next === "menu") setSubTab("operator");
            else setSubTab("configuration");
          }}
          tabsAriaLabel="Settings sections"
        />

        {tab === "branding" && (
          <div role="tabpanel" className="space-y-3">
            <SubTabBar
              items={[
                { id: "brand", label: "Brand" },
                { id: "logo", label: "Logo" },
              ]}
              activeId={subTab}
              accent={brand.brand_color}
              onSelect={setSubTab}
              ariaLabel="Branding sub-sections"
            />
            <PanelShell
              summary="Customize how Mission Control appears. Name, color, and logo are saved permanently and survive a restart."
              badge="Brand"
            >
              <BrandingPanel
                subTab={(["brand", "logo"].includes(subTab) ? subTab : "brand") as BrandingSubTab}
              />
            </PanelShell>
          </div>
        )}

        {tab === "sky" && (
          <div role="tabpanel" className="flex h-full min-h-0 flex-1 flex-col gap-3">
            <PanelShell
              summary="Visitor homepage sky. Variant, zoom, density, and effects are saved permanently and survive a restart."
              badge="Sky"
              fill
            >
              <BrandingPanel fill subTab="sky" />
            </PanelShell>
          </div>
        )}

        {tab === "appearance" && (
          <div role="tabpanel" className="space-y-3">
            <SubTabBar
              items={[{ id: "configuration", label: "Configuration" }]}
              activeId={subTab}
              accent={brand.brand_color}
              onSelect={setSubTab}
              ariaLabel="Appearance sub-sections"
            />
            <AppearancePanel />
          </div>
        )}

        {tab === "public" && (
          <div role="tabpanel" className="space-y-3">
            <SubTabBar
              items={[{ id: "configuration", label: "Configuration" }]}
              activeId={subTab}
              accent={brand.brand_color}
              onSelect={setSubTab}
              ariaLabel="Cycle strip sub-sections"
            />
            <PanelShell
              summary="Numbered cycle strip on the visitor homepage. Hero copy lives under Branding → Brand. Contact details live on the Contact menu item."
              badge="Cycle"
            >
              <PublicSitePanel />
            </PanelShell>
          </div>
        )}

        {tab === "menu" && (
          <div role="tabpanel" className="space-y-3">
            <SubTabBar
              items={[
                { id: "operator", label: "Operator" },
                { id: "public", label: "Public" },
              ]}
              activeId={subTab === "public" ? "public" : "operator"}
              accent={brand.brand_color}
              onSelect={setSubTab}
              ariaLabel="Menu sub-sections"
            />
            <PanelShell
              summary={
                subTab === "public"
                  ? "Visitor header and footer. Off hides the link and disables the page."
                  : "Operator sidebar. Off hides the item and disables its routes. Settings stays on."
              }
              badge={subTab === "public" ? "Public" : "Operator"}
            >
              <MenuItemsPanel kind={subTab === "public" ? "public" : "operator"} />
            </PanelShell>
          </div>
        )}

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

      </div>
    </AppShell>
  );
}
