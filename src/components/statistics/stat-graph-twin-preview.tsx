"use client";

import { useEffect, useMemo, useState } from "react";
import { parseStatHeaderConfig, statRowsToGraphPoints } from "@/lib/statistics/model";
import { configForSeries, graphSeriesFromLines } from "@/lib/statistics/frequency";
import { StatGraph, type StatGraphLine } from "@/components/statistics/stat-graph";
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
}) {
  const { linesEpoch } = useTwinSlot();
  const [fetched, setFetched] = useState<StatGraphLine[]>([]);

  useEffect(() => {
    if (!headerId || linesProp) {
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
  }, [headerId, linesProp, linesEpoch]);

  const parsed = parseStatHeaderConfig(values);
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

  const gridClass =
    layout === 1
      ? "grid-cols-1"
      : layout === 2
        ? "grid-cols-2"
        : layout === 4
          ? "grid-cols-2 grid-rows-2"
          : layout === 8
            ? "grid-cols-4 grid-rows-2"
            : "grid-cols-4 grid-rows-3";

  return (
    <div className="flex h-full min-h-0 flex-col p-3">
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
    </div>
  );
}
