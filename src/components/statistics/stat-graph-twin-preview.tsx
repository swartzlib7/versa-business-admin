"use client";
import { useInstallTimeZone } from "@/components/shell/site-mode-provider";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  frequencyTypeLabel,
  parseStatHeaderConfig,
  statPeriodProgress,
  statRowsToGraphPoints,
} from "@/lib/statistics/model";
import { configForSeries, graphSeriesFromLines } from "@/lib/statistics/frequency";
import { STAT_PACE_COLOR, StatGraph, type StatGraphLine } from "@/components/statistics/stat-graph";
import { useTwinSlot } from "@/components/zones/twin-slot-context";
import { cn } from "@/lib/utils";
import { GRAPH_LAYOUTS, type GraphLayout } from "@/lib/public/render-drivers";

export { GRAPH_LAYOUTS };
export type { GraphLayout };

export function StatGraphTwinPreview({
  values,
  headerId,
  lines: linesProp,
  layout = 1,
  page = 0,
  onPageChange,
  compact = false,
  lightbox = false,
  pager = false,
  twin = false,
  focusSeries,
}: {
  values: Record<string, string>;
  headerId?: string | null;
  lines?: StatGraphLine[];
  layout?: GraphLayout;
  page?: number;
  onPageChange?: (page: number) => void;
  compact?: boolean;
  lightbox?: boolean;
  /** When on, the Element shows the same previous / next page controls as the Spatial Twin. */
  pager?: boolean;
  /** Drawn in the Spatial Twin rail: one graph uses the taller shape that fills the box. */
  twin?: boolean;
  /** Page to the graph of this period when it changes (the period being edited). */
  focusSeries?: number;
}) {
  const installZone = useInstallTimeZone();
  const { linesEpoch } = useTwinSlot();
  const [fetched, setFetched] = useState<StatGraphLine[]>([]);

  // Keep the saved lines current even while `lines` overrides them (the values
  // editor's live typing). When the override ends, the graph shows these at
  // once instead of blanking out until a fresh read lands (1.0.13).
  useEffect(() => {
    if (!headerId) {
      setFetched([]);
      return;
    }
    const controller = new AbortController();
    void fetch("/api/statistics/" + headerId + "/lines", {
      credentials: "include",
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json) => {
        const rows = (json.data ?? json.lines ?? []) as Array<{
          series?: number;
          slot: number;
          value: string | number | null;
        }>;
        setFetched(statRowsToGraphPoints(rows));
      })
      .catch(() => setFetched([]));
    return () => controller.abort();
  }, [headerId, linesEpoch]);

  const parsed = parseStatHeaderConfig(values, installZone);
  const lines = linesProp ?? fetched;
  const seriesIds = useMemo(() => {
    const fromData = graphSeriesFromLines(lines);
    return fromData.length ? fromData : [1];
  }, [lines]);
  const pageCount = Math.max(1, Math.ceil(seriesIds.length / layout));
  const safePage = Math.min(page, pageCount - 1);
  const visible = seriesIds.slice(safePage * layout, safePage * layout + layout);
  const slots: Array<number | null> = Array.from(
    { length: layout },
    (_, i) => visible[i] ?? null,
  );

  useEffect(() => {
    if (page !== safePage) onPageChange?.(safePage);
  }, [page, safePage, onPageChange]);

  // Follow the period being edited, once per change of period.
  const followed = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (focusSeries === undefined || followed.current === focusSeries) return;
    const idx = seriesIds.indexOf(focusSeries);
    if (idx < 0) return;
    followed.current = focusSeries;
    const want = Math.floor(idx / layout);
    if (want !== page) onPageChange?.(want);
  }, [focusSeries, seriesIds, layout, page, onPageChange]);

  const latestSeries = seriesIds[seriesIds.length - 1];
  const single = layout === 1 && !compact && parsed.ok;
  const progress =
    single && visible[0] != null
      ? statPeriodProgress(
          parsed.config,
          lines.filter((ln) => ln.series === visible[0]),
          visible[0] === latestSeries,
        )
      : null;

  const gridClass =
    layout === 1
      ? "grid-cols-1"
      : layout === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : layout === 4
          ? "grid-cols-1 sm:grid-cols-2 sm:grid-rows-2"
          : layout === 8
            ? "grid-cols-4 grid-rows-2"
            : "grid-cols-4 grid-rows-3";

  return (
    // In the Spatial Twin the pager and 1 / 2 / 4 / 8 / 12 chrome float at the
    // bottom of the box; keep that strip clear so it never covers the graph or readout.
    <div className={cn("flex h-full min-h-0 flex-col p-3", twin && "pb-14")}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight">
          {values.name || values.Name || "Graph preview"}
          {seriesIds.length > 1 ? (
            <span className="ml-2 font-normal text-muted-foreground">
              {seriesIds.length} period{seriesIds.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </h3>
        {pager && pageCount > 1 ? (
          <span className="inline-flex items-center gap-1">
            <button
              type="button"
              className="rounded border border-border px-1.5 py-0.5 text-[11px]"
              onClick={() => onPageChange?.(Math.max(0, safePage - 1))}
            >
              Prev
            </button>
            <span className="text-[11px] text-muted-foreground">
              Page {safePage + 1} / {pageCount}
            </span>
            <button
              type="button"
              className="rounded border border-border px-1.5 py-0.5 text-[11px]"
              onClick={() => onPageChange?.(Math.min(pageCount - 1, safePage + 1))}
            >
              Next
            </button>
          </span>
        ) : null}
      </div>
      {parsed.ok ? (
        <div className={cn("grid min-h-0 flex-1 gap-2 overflow-hidden", gridClass)}>
          {slots.map((series, i) => (
            <div
              key={series ?? "empty-" + i}
              className={cn(
                "min-h-0 min-w-0 overflow-hidden",
                lightbox && layout === 1 && "flex h-full w-full items-center justify-center",
              )}
            >
              {series == null ? (
                <div className="h-full min-h-[4rem] rounded-md border border-dashed border-border/60 bg-muted/10" />
              ) : (
                <div className="flex h-full min-h-[4rem] min-w-0 flex-col overflow-hidden rounded-md border border-dashed border-border/60 bg-muted/10">
                  {!compact && seriesIds.length > 1 ? (
                    <p className="mb-1 px-1 pt-1 text-[11px] font-medium text-muted-foreground">
                      Period {series}
                    </p>
                  ) : null}
                  <div className={cn("min-h-0 flex-1", lightbox && layout === 1 && "flex h-full w-full items-center justify-center")}>
                    <StatGraph
                      config={configForSeries(parsed.config, series)}
                      lines={lines.filter((ln) => ln.series === series)}
                      className="h-full w-full"
                      shape={twin && !lightbox && layout === 1 ? "tall" : "wide"}
                      openPeriod={series === latestSeries}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Fill scale, frequency, and start datetime on the header to preview the graph.
        </p>
      )}
      {progress && parsed.ok ? (
        <TargetReadout
          progress={progress}
          stepLabel={frequencyTypeLabel(parsed.config.frequencyType).toLowerCase()}
        />
      ) : null}
    </div>
  );
}

const fmtNum = (n: number) => String(Math.round(n * 100) / 100);

/** Quota / Met / Short (or Over) / Needed for the period on screen. */
function TargetReadout({
  progress,
  stepLabel,
}: {
  progress: NonNullable<ReturnType<typeof statPeriodProgress>>;
  stepLabel: string;
}) {
  const tiles: Array<{ k: string; v: string; s: string; color?: string }> = [
    { k: "Quota", v: fmtNum(progress.quota), s: "period target" },
    { k: "Met", v: fmtNum(progress.met), s: "so far" },
    progress.over > 0
      ? { k: "Over", v: "+" + fmtNum(progress.over), s: "past the quota" }
      : {
          k: "Short",
          v: fmtNum(progress.short),
          s: progress.stepsLeft > 0 || progress.lastSlot < 0 ? "to the quota" : "at period close",
          color: progress.short > 0 ? "#e5484d" : undefined,
        },
    progress.short === 0
      ? { k: "Needed", v: "0", s: "quota met", color: STAT_PACE_COLOR }
      : progress.needed !== null
        ? {
            k: "Needed",
            v: fmtNum(progress.needed),
            s: `per ${stepLabel} · ${progress.stepsLeft} left`,
            color: STAT_PACE_COLOR,
          }
        : { k: "Needed", v: "–", s: progress.lastSlot < 0 ? "no values yet" : "period closed" },
  ];
  return (
    <div className="mt-2 grid shrink-0 grid-cols-4 gap-1.5" aria-label="Period target progress">
      {tiles.map((t) => (
        <div key={t.k} className="min-w-0 rounded-md border border-border px-2 py-1">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t.k}</p>
          <p className="text-sm font-semibold tabular-nums" style={t.color ? { color: t.color } : undefined}>
            {t.v}
          </p>
          <p className="truncate text-[10px] text-muted-foreground">{t.s}</p>
        </div>
      ))}
    </div>
  );
}
