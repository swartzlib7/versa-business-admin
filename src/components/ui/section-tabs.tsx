"use client";

import { cn } from "@/lib/utils";

export type SectionTabItem = {
  id: string;
  label: string;
  /** Optional secondary line under label (Settings-style). */
  hint?: string;
  /** Optional count badge like zone parent tabs. */
  count?: number;
};

type SectionTabsProps = {
  items: SectionTabItem[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  /** Accent for active top inset (defaults to brand indigo). */
  accent?: string;
  className?: string;
};

/**
 * I5.6.33 — shared top-level section tabs matching ZoneConfigView chrome:
 * underline strip, rounded-t active tab, accent inset bar.
 */
export function SectionTabs({
  items,
  value,
  onChange,
  ariaLabel,
  accent = "#6366f1",
  className,
}: SectionTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "sticky top-[5.5rem] z-20 flex flex-wrap gap-1 border-b border-border bg-background/95 pb-px backdrop-blur supports-[backdrop-filter]:bg-background/80",
        className,
      )}
    >
      {items.map((t) => {
        const on = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={cn(
              "-mb-px rounded-t-md border border-transparent px-3 py-2 text-left text-sm font-medium transition-colors",
              on
                ? "border-border border-b-background bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            style={
              on
                ? {
                    borderBottomColor: "var(--background)",
                    boxShadow: `inset 0 2px 0 ${accent}`,
                  }
                : undefined
            }
          >
            <div className="font-medium leading-none">{t.label}</div>
            {t.hint ? (
              <div
                className={cn(
                  "mt-1 text-[11px] font-normal leading-tight",
                  on ? "text-muted-foreground" : "text-muted-foreground/80",
                )}
              >
                {t.hint}
              </div>
            ) : null}
            {typeof t.count === "number" ? (
              <span className="ml-1 text-xs text-muted-foreground">
                ({t.count})
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
