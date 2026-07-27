"use client";

import { cn } from "@/lib/utils";

/**
 * I5.6.43 #209 — shared sub-tab bar matching ZoneConfigView inner strip.
 * Used under main SectionTabs to provide Configuration / Information sub-tabs.
 */
export type SubTabItem = {
  id: string;
  label: string;
};

export function SubTabBar({
  items,
  activeId,
  accent = "#6366f1",
  onSelect,
  ariaLabel,
}: {
  items: SubTabItem[];
  activeId: string;
  accent?: string;
  onSelect: (id: string) => void;
  ariaLabel: string;
}) {
  return (
    <div className="space-y-2">
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex flex-wrap gap-1 rounded-lg border p-1"
        style={{ borderColor: accent + "33", backgroundColor: accent + "0d" }}
      >
        {items.map((c) => {
          const on = c.id === activeId;
          return (
            <button
              key={c.id}
              role="tab"
              type="button"
              aria-selected={on}
              onClick={() => onSelect(c.id)}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                on
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
              )}
              style={on ? { boxShadow: `inset 0 -2px 0 ${accent}` } : undefined}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
