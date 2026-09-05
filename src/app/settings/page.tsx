"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
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
import { MenuOrderPanel } from "@/components/settings/menu-order-panel";

type SettingsTab = "branding" | "appearance" | "public" | "menu" | "information";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "branding", label: "Branding" },
  { id: "appearance", label: "Appearance" },
  { id: "public", label: "Public" },
  { id: "menu", label: "Menu" },
  { id: "information", label: "Information" },
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
  children,
}: {
  summary: string;
  badge?: string;
  children: ReactNode;
}) {
  const brand = useBrand();
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
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
      <CardContent className="p-6">{children}</CardContent>
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
      if (q === "system") {
        return "information";
      }
      if (q && ["branding", "appearance", "public", "menu", "information"].includes(q)) {
        return q as SettingsTab;
      }
    }
    return 'branding';
  });
  const [subTab, setSubTab] = useState<string>("configuration");
  const brand = useBrand();
  const [brandName, setBrandName] = useState<string>(brand.brand_name);
  const [brandColor, setBrandColor] = useState<string>(brand.brand_color);
  const [brandLogo, setBrandLogo] = useState<string>(brand.brand_logo_url ?? "");
  const [brandLogoOpacity, setBrandLogoOpacity] = useState<number>(brand.brand_logo_opacity ?? 1);
  const [brandLogoGlow, setBrandLogoGlow] = useState<number>(brand.brand_logo_glow ?? 0);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const hydrated = useRef(false);

  // Sync local editors when the server-read brand arrives/changes.
  useEffect(() => {
    if (!hydrated.current) {
      setBrandName(brand.brand_name);
      setBrandColor(brand.brand_color);
      setBrandLogo(brand.brand_logo_url ?? "");
      setBrandLogoOpacity(brand.brand_logo_opacity ?? 1);
      setBrandLogoGlow(brand.brand_logo_glow ?? 0);
      hydrated.current = true;
    }
  }, [
    brand.brand_name,
    brand.brand_color,
    brand.brand_logo_url,
    brand.brand_logo_opacity,
    brand.brand_logo_glow,
  ]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/settings/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_name: brandName.trim(),
          brand_color: brandColor,
          brand_logo_url: brandLogo || null,
          brand_logo_opacity: brandLogoOpacity,
          brand_logo_glow: brandLogoGlow,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const message =
          payload?.error?.message ?? "Save failed. Please try again.";
        setSaveError(message);
        return;
      }
      setSaved(true);
      window.location.reload();
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setBrandName(brand.brand_name);
    setBrandColor(brand.brand_color);
    setBrandLogo(brand.brand_logo_url ?? "");
    setBrandLogoOpacity(brand.brand_logo_opacity ?? 1);
    setBrandLogoGlow(brand.brand_logo_glow ?? 0);
  };

  return (
    <AppShell>
      <div className="space-y-3">
        <PageHeader
          title="Settings"
          subtitle="White-label configuration and system preferences."
          accent={brand.brand_color}
          tabs={TABS}
          tabsValue={tab}
          onTabChange={(id) => {
            const next = id as SettingsTab;
            setTab(next);
            if (next === "branding" || next === "appearance" || next === "public") {
              setSubTab("configuration");
            }
          }}
          tabsAriaLabel="Settings sections"
        />

        {tab === "branding" && (
          <div role="tabpanel" className="space-y-3">
            <SubTabBar
              items={[{ id: "configuration", label: "Configuration" }]}
              activeId={subTab}
              accent={brand.brand_color}
              onSelect={setSubTab}
              ariaLabel="Branding sub-sections"
            />
            <PanelShell
              summary="Customize how Mission Control appears. Name, color, and logo are saved permanently and survive a restart."
              badge="Brand"
            >
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Brand Name</label>
                    <input
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Your brand name"
                      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Brand Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="h-10 w-14 cursor-pointer p-1"
                      />
                      <input
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        placeholder="#6366f1"
                        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Logo</label>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="text-sm"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 500 * 1024) {
                          setSaveError("Logo must be 500 KB or smaller.");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          setBrandLogo(typeof reader.result === "string" ? reader.result : "");
                          setSaveError(null);
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    {brandLogo ? (
                      <button
                        type="button"
                        onClick={() => setBrandLogo("")}
                        className="text-sm text-muted-foreground underline-offset-2 hover:underline"
                      >
                        Remove logo
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Optional. PNG, JPG, SVG, or WebP. Initials are used when empty.
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Logo Translucency ({Math.round(brandLogoOpacity * 100)}%)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={brandLogoOpacity}
                      onChange={(e) => setBrandLogoOpacity(Number(e.target.value))}
                      className="w-full"
                      style={{ accentColor: brandColor }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Logo Glow ({Math.round(brandLogoGlow * 100)}%)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={brandLogoGlow}
                      onChange={(e) => setBrandLogoGlow(Number(e.target.value))}
                      className="w-full"
                      style={{ accentColor: brandColor }}
                    />
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
                    {brandLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element -- live preview of uploaded logo
                      <img
                        src={brandLogo}
                        alt={brandName || "Logo"}
                        className="h-10 w-10 rounded-md object-contain"
                        style={{
                          opacity: brandLogoOpacity,
                          filter:
                            brandLogoGlow > 0
                              ? `drop-shadow(0 0 ${Math.round(brandLogoGlow * 14)}px rgba(255,255,255,${(brandLogoGlow * 0.85).toFixed(2)}))`
                              : undefined,
                        }}
                      />
                    ) : (
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-md text-sm font-bold text-white"
                      style={{ backgroundColor: brandColor }}
                    >
                      {brandName.slice(0, 2).toUpperCase() || "VA"}
                    </div>
                    )}
                    <div>
                      <div className="font-semibold">{brandName}</div>
                      <div className="text-xs text-muted-foreground">
                        Mission Control
                      </div>
                    </div>
                  </div>
                </div>
                {saveError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {saveError}
                  </p>
                ) : null}
                <Separator />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    style={{ backgroundColor: brand.brand_color }}
                  >
                    {saved ? "Saved" : saving ? "Saving..." : "Save changes"}
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
              ariaLabel="Public site sub-sections"
            />
            <PanelShell
              summary="Copy and cycle strip for the visitor homepage. Contact details live on the Contact menu item."
              badge="Public"
            >
              <PublicSitePanel />
            </PanelShell>
          </div>
        )}

        {tab === "menu" && (
          <div role="tabpanel" className="space-y-3">
            <SubTabBar
              items={[{ id: "configuration", label: "Configuration" }]}
              activeId="configuration"
              accent={brand.brand_color}
              onSelect={() => undefined}
              ariaLabel="Menu sub-sections"
            />
            <PanelShell
              summary="Reorder the sidebar menu. Changes apply immediately."
              badge="Menu"
            >
              <MenuOrderPanel />
            </PanelShell>
          </div>
        )}

        {tab === "information" && (
          <div role="tabpanel" className="space-y-3">
            <SubTabBar
              items={[{ id: "configuration", label: "Configuration" }]}
              activeId="configuration"
              accent={brand.brand_color}
              onSelect={() => undefined}
              ariaLabel="Information sub-sections"
            />
            <SystemPanel />
          </div>
        )}

      </div>
    </AppShell>
  );
}
