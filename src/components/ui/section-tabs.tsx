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
  /** When true, skip sticky positioning (used when embedded in a sticky parent). */
  noSticky?: boolean;
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
  noSticky = false,
}: SectionTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        noSticky
          ? "flex flex-wrap gap-1 border-b border-border pb-px"
          : "flex flex-wrap gap-1 border-b border-border bg-background pb-px",
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
              "-mb-px rounded-t-md border border-transparent px-3 py-2 text-left text-sm font-medium leading-none transition-colors",
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
            <span className="inline-flex items-center leading-none">
              {t.label}
              {typeof t.count === "number" ? (
                <span className="ml-1 text-xs font-normal leading-none text-muted-foreground">
                  ({t.count})
                </span>
              ) : null}
            </span>
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
          </button>
        );
      })}
    </div>
  );
}
