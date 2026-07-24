"use client";

import { theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** I5.6.33 — zone-aligned page title row (title + muted subtitle + accent chip). */
export function PageHeader({
  title,
  subtitle,
  badge,
  accent = theme.colors.brand,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  accent?: string;
  actions?: import("react").ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky top-14 z-20 flex flex-wrap items-start justify-between gap-3 bg-background/95 pb-3 pt-1 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        className,
      )}
    >
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
  );
}
