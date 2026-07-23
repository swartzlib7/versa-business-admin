"use client";

import { useState } from "react";
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
import { theme } from "@/lib/theme";
import { RecordsEditor } from "@/components/settings/records-editor";
import { cn } from "@/lib/utils";
import { useUiTheme, type UiTheme } from "@/components/shell/theme-provider";
import { Moon, Sun, Compass } from "lucide-react";

type SettingsTab = "records" | "branding" | "appearance" | "system";

const TABS: { id: SettingsTab; label: string; hint: string }[] = [
  { id: "records", label: "Records Editor", hint: "Types, fields, picklists" },
  { id: "branding", label: "Branding", hint: "Name and colors" },
  { id: "appearance", label: "Appearance", hint: "Light, dark, Architect" },
  { id: "system", label: "System", hint: "Runtime and product boundary" },
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
    id: "architect",
    label: "Architect",
    blurb: "Ink, copper, and parchment — a craft identity for builders.",
    icon: Compass,
  },
];

function AppearancePanel() {
  const { theme: uiTheme, setTheme } = useUiTheme();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Choose how Mission Control looks. Your selection is remembered on this
          device and survives navigation (including Glossary on the side menu).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
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
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("records");
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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            White-label configuration, Records Editor, and system preferences.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Settings sections"
          className="flex flex-wrap gap-2 border-b pb-2"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-md px-3 py-2 text-left text-sm transition-colors",
                tab === t.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-foreground hover:bg-muted",
              )}
            >
              <div className="font-medium">{t.label}</div>
              <div
                className={cn(
                  "text-[11px]",
                  tab === t.id
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground",
                )}
              >
                {t.hint}
              </div>
            </button>
          ))}
        </div>

        {tab === "records" && (
          <div role="tabpanel" className="space-y-4">
            <RecordsEditor />
          </div>
        )}

        {tab === "branding" && (
          <div role="tabpanel">
            <Card>
              <CardHeader>
                <CardTitle>Branding</CardTitle>
                <CardDescription>
                  Customize how your mission control appears. Changes are
                  previewed live and saved for this session.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <Button onClick={handleSave}>
                    {saved ? "Saved" : "Save changes"}
                  </Button>
                  <Button variant="outline" onClick={handleReset}>
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "appearance" && (
          <div role="tabpanel">
            <AppearancePanel />
          </div>
        )}

        {tab === "system" && (
          <div role="tabpanel" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System</CardTitle>
                <CardDescription>
                  Runtime boundary for this Mission Control instance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Glossary lives on the side menu so theme and navigation stay
                  stable. Product and integration configuration remain under
                  their own zones.
                </p>
                <p>
                  Data source and database cutover are controlled by environment
                  configuration — not from this panel.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
