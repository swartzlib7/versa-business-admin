"use client";

import { Moon, Sun, Compass, Cloud, Sunset } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiTheme, type UiTheme } from "@/components/shell/theme-provider";
import { PanelShell } from "@/components/settings/settings-chrome";

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
  return (
    <PanelShell
      summary="Choose how Versa - Business Admin looks. Selection is remembered on this device and survives navigation (including Glossary on the side menu)."
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
              <p className="text-xs leading-relaxed text-muted-foreground">{opt.blurb}</p>
            </button>
          );
        })}
      </div>
    </PanelShell>
  );
}
