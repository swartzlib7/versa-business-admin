"use client";

import { StatGraphTwinPreview } from "@/components/statistics/stat-graph-twin-preview";
import { PublicGlossaryBook, PublicOrgBoard } from "@/components/glossary/public-surfaces";
import { HomeSectionBody } from "@/components/public/home-section-drivers";
import { HtmlBlock } from "@/components/public/html-editor";
import type { CycleStep } from "@/lib/public/site-types";
import type { HomeSectionContent } from "@/lib/public/demo-content";
import { tilesFromOutputId } from "@/lib/public/render-drivers";

export type CanvasSlotStat = {
  headerId: string;
  values: Record<string, string>;
  lines: Array<{ series: number; slot: number; value: number }>;
};

/** PB-03: the Home hero strip, shared so the canvas driver paints it identically. */
export function CycleStrip({ steps }: { steps: CycleStep[] }) {
  if (steps.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Cycle Strip has no enabled steps. Enable steps in Public Content settings.
      </p>
    );
  }
  return (
    <div className="flex flex-nowrap gap-2 sm:gap-4">
      {steps.map((item, index) => (
        <div key={`${item.title}-${item.number}-${index}`} className="min-w-0 flex-1 text-center">
          {item.numberEnabled ? (
            <div className="text-lg font-bold text-muted-foreground/40 sm:text-2xl">
              {item.number || String(index + 1).padStart(2, "0")}
            </div>
          ) : null}
          {item.titleEnabled ? (
            <h3 className="mt-1 truncate text-xs font-semibold sm:text-sm">{item.title}</h3>
          ) : null}
          {item.descEnabled ? (
            <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground sm:text-xs">{item.desc}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/**
 * PB-03 (2026-09-13) - visitor-side paint for a bound canvas slot.
 * Same drivers the operator surfaces use: Cycle Strip reuses the hero strip
 * (CycleStrip); Glossary/Org Board reuse the public surfaces; Statistics
 * reuses StatGraphTwinPreview with server-provided values + lines so the
 * public page never calls the session-authed lines API.
 */
export function CanvasSlotDriver({
  driver,
  cycleSteps,
  stat,
  homeContent,
  html,
  renderOutput,
  compact = false,
  itemIndex,
}: {
  driver?: string;
  cycleSteps?: CycleStep[];
  stat?: CanvasSlotStat | null;
  homeContent?: HomeSectionContent | null;
  html?: string;
  renderOutput?: string;
  compact?: boolean;
  itemIndex?: number;
}) {
  if (driver === "cycle-strip") return <CycleStrip steps={cycleSteps ?? []} />;
  if (driver === "glossary-book") return <PublicGlossaryBook />;
  if (driver === "org-board") return <PublicOrgBoard />;
  if (driver === "stat-graph") {
    if (!stat) {
      return (
        <p className="text-sm text-muted-foreground">
          Statistic unavailable. Check the binding record id in the Inspector.
        </p>
      );
    }
    return (
      <StatGraphTwinPreview
        key={stat.headerId}
        values={stat.values}
        headerId={stat.headerId}
        lines={stat.lines}
        layout={tilesFromOutputId(renderOutput)}
        compact={compact}
      />
    );
  }
  if (driver === "html-block") {
    if (html) return <HtmlBlock html={html} />;
    return (
      <p className="text-xs text-muted-foreground">Page — bind a Pages record.</p>
    );
  }
  if (driver?.startsWith("home:") && homeContent) {
    return <HomeSectionBody content={homeContent} compact={compact} itemIndex={itemIndex} />;
  }
  if (driver?.startsWith("home:")) {
    return <p className="text-xs text-muted-foreground">Loading composed content…</p>;
  }
  return null;
}
