"use client";

import { useState, type ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { theme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useUiTheme, type UiTheme } from "@/components/shell/theme-provider";
import { PageHeader } from "@/components/ui/page-header";
import { SubTabBar } from "@/components/ui/sub-tab-bar";
import { Moon, Sun, Compass, Cloud } from "lucide-react";

type SettingsTab = "branding" | "appearance" | "system";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "branding", label: "Branding" },
  { id: "appearance", label: "Appearance" },
  { id: "system", label: "System" },
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
    id: "dark",
    label: "Dark",
    blurb: "Low-glare mission night mode.",
    icon: Moon,
  },
  {
    id: "slate",
    label: "Slate",
    blurb: "Elegant mid-gray — between dark and light, pure neutral tones.",
    icon: Cloud,
  },
  {
    id: "architect",
    label: "Architect",
    blurb: "Ink, copper, and parchment — a craft identity for builders.",
    icon: Compass,
  },
];

function PanelShell({
  title,
  summary,
  badge,
  children,
}: {
  title: string;
  summary: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
          </div>
          {badge ? (
            <Badge
              className="shrink-0 border-0 text-white"
              style={{ backgroundColor: theme.colors.brand }}
            >
              {badge}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );
}

function AppearancePanel() {
  const { theme: uiTheme, setTheme } = useUiTheme();
  return (
    <PanelShell
      title="Configuration"
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

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('tab');
      // I5.6.43 #209 — redirect old tab params to new top-level pages
      if (q === 'records') {
        window.location.replace('/records-editor');
        return 'branding'; // fallback during redirect
      }
      if (q === 'users') {
        window.location.replace('/users');
        return 'branding'; // fallback during redirect
      }
      if (q && ['branding', 'appearance', 'system'].includes(q)) {
        return q as SettingsTab;
      }
    }
    return 'branding';
  });
  const [subTab, setSubTab] = useState<string>("configuration");
  const [brandName, setBrandName] = useState<string>(theme.brand.name);
  const [brandColor, setBrandColor] = useState<string>(theme.colors.brand);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setBrandName(theme.brand.name);
    setBrandColor(theme.colors.brand);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Settings"
          subtitle="White-label configuration and system preferences."
          badge="Settings"
          accent={theme.colors.brand}
          tabs={TABS}
          tabsValue={tab}
          onTabChange={(id) => setTab(id as SettingsTab)}
          tabsAriaLabel="Settings sections"
        />

        {tab === "branding" && (
          <div role="tabpanel" className="space-y-4">
            <SubTabBar
              items={[{ id: "configuration", label: "Configuration" }]}
              activeId={subTab}
              accent={theme.colors.brand}
              onSelect={setSubTab}
              ariaLabel="Branding sub-sections"
            />
            <PanelShell
              title="Configuration"
              summary="Customize how Mission Control appears. Changes are previewed live and saved for this session."
              badge="Brand"
            >
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Brand Name</label>
                    <Input
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Your brand name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Brand Color</label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="h-10 w-14 cursor-pointer p-1"
                      />
                      <Input
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        placeholder="#6366f1"
                      />
                    </div>
                  </div>
                </div>
                <div
                  className="rounded-lg border p-4"
                  style={{ borderColor: brandColor }}
                >
                  <div className="mb-1 text-xs text-muted-foreground">
                    Preview
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-md text-sm font-bold text-white"
                      style={{ backgroundColor: brandColor }}
                    >
                      {brandName.slice(0, 2).toUpperCase() || "VA"}
                    </div>
                    <div>
                      <div className="font-semibold">{brandName}</div>
                      <div className="text-xs text-muted-foreground">
                        Mission Control
                      </div>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="rounded-md px-4 py-2 text-sm font-medium text-white"
                    style={{ backgroundColor: theme.colors.brand }}
                  >
                    {saved ? "Saved" : "Save changes"}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </PanelShell>
          </div>
        )}

        {tab === "appearance" && (
          <div role="tabpanel" className="space-y-4">
            <SubTabBar
              items={[{ id: "configuration", label: "Configuration" }]}
              activeId={subTab}
              accent={theme.colors.brand}
              onSelect={setSubTab}
              ariaLabel="Appearance sub-sections"
            />
            <AppearancePanel />
          </div>
        )}

        {tab === "system" && (
          <div role="tabpanel" className="space-y-4">
            <SubTabBar
              items={[{ id: "information", label: "Information" }]}
              activeId={subTab === "information" ? "information" : "information"}
              accent={theme.colors.brand}
              onSelect={setSubTab}
              ariaLabel="System sub-sections"
            />
            <PanelShell
              title="Information"
              summary="Runtime boundary for this Mission Control instance."
              badge="Runtime"
            >
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Glossary lives on the side menu so theme and navigation stay
                  stable. Product and integration configuration remain under
                  their own zones.
                </p>
                <p>
                  Data source and database cutover are controlled by environment
                  configuration — not from this panel.
                </p>
              </div>
            </PanelShell>
          </div>
        )}

      </div>
    </AppShell>
  );
}
