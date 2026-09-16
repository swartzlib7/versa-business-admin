"use client";

import { theme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { SectionTabs, type SectionTabItem } from "@/components/ui/section-tabs";

/**
 * Title + optional actions on one row; subtitle spans the full width; optional
 * first-line section tabs. No background plate. Title-repeating pills are retired
 * (`badge` is accepted but not rendered).
 */
export function PageHeader({
  title,
  subtitle,
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
    <div className={cn("flex flex-col gap-2 pb-3 pt-1", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="min-w-0 text-2xl font-bold tracking-tight">{title}</h1>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {subtitle ? (
        <p className="w-full text-muted-foreground">{subtitle}</p>
      ) : null}
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
