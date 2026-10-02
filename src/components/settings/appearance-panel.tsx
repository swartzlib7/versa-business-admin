"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Compass, Cloud, Sunset } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiTheme, type UiTheme } from "@/components/shell/theme-provider";
import { PanelShell } from "@/components/settings/settings-chrome";
import { isUiTheme } from "@/lib/ui-themes";

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

export function AppearancePanel() {
  const { theme: uiTheme, setTheme } = useUiTheme();
  const [siteDefault, setSiteDefault] = useState<UiTheme>("dark");
  const [savingDefault, setSavingDefault] = useState(false);

  useEffect(() => {
    fetch("/api/settings/system", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const value = json?.data?.public_default_theme;
        if (typeof value === "string" && isUiTheme(value)) setSiteDefault(value);
      })
      .catch(() => undefined);
  }, []);

  const saveDefault = (next: UiTheme) => {
    setSiteDefault(next);
    setSavingDefault(true);
    fetch("/api/settings/system", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_default_theme: next }),
    })
      .catch(() => undefined)
      .finally(() => setSavingDefault(false));
  };

  return (
    <PanelShell
      summary="The five tiles set this browser. Default site theme is what visitors see until they pick their own."
      badge="Theme"
    >
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
              <p className="text-xs leading-relaxed text-muted-foreground">{opt.blurb}</p>
            </button>
          );
        })}
        <label className="flex flex-col justify-center gap-2 rounded-lg border border-border bg-card p-4">
          <span className="text-sm font-semibold">Default site theme</span>
          <select
            value={siteDefault}
            disabled={savingDefault}
            onChange={(e) => {
              if (isUiTheme(e.target.value)) saveDefault(e.target.value);
            }}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            {THEME_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </PanelShell>
  );
}
