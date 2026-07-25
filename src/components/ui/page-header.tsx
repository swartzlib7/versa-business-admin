"use client";

import { theme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { SectionTabs, type SectionTabItem } from "@/components/ui/section-tabs";

/**
 * I5.6.33 — zone-aligned page title row (title + muted subtitle + accent chip).
 * I5.6.34 — single sticky container for header + optional tabs (no dual-sticky collision).
 */
export function PageHeader({
  title,
  subtitle,
  badge,
  accent = theme.colors.brand,
  actions,
  tabs,
  tabsValue,
  onTabChange,
  tabsAriaLabel,
  className,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  accent?: string;
  actions?: import("react").ReactNode;
  /** Optional section tabs rendered inside the same sticky container. */
  tabs?: SectionTabItem[];
  tabsValue?: string;
  onTabChange?: (id: string) => void;
  tabsAriaLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 bg-background pb-3 pt-1",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {badge ? (
            <span
              className="rounded-md px-3 py-1.5 text-sm font-medium text-white"
              style={{ backgroundColor: accent }}
            >
              {badge}
            </span>
          ) : null}
        </div>
      </div>
      {tabs && tabs.length > 0 && tabsValue !== undefined && onTabChange ? (
        <SectionTabs
          items={tabs}
          value={tabsValue}
          onChange={onTabChange}
          ariaLabel={tabsAriaLabel ?? "Sections"}
          accent={accent}
          noSticky
        />
      ) : null}
    </div>
  );
}
