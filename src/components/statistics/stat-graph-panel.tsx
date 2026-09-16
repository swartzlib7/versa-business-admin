"use client";

import { useEffect, useState } from "react";
import { parseStatHeaderConfig, statRowsToGraphPoints } from "@/lib/statistics/model";
import { StatGraph, type StatGraphLine } from "@/components/statistics/stat-graph";
import { useTwinSlot } from "@/components/zones/twin-slot-context";

export function StatGraphPanel({ headerId }: { headerId: string | null }) {
  const { linesEpoch } = useTwinSlot();
  const [configRaw, setConfigRaw] = useState<Record<string, unknown> | null>(null);
  const [lines, setLines] = useState<StatGraphLine[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!headerId) {
      setConfigRaw(null);
      setLines([]);
      return;
    }
    const controller = new AbortController();
    void Promise.all([
      fetch("/api/records/" + headerId, { credentials: "include", signal: controller.signal }).then((r) =>
        r.ok ? r.json() : { data: null },
      ),
      fetch("/api/statistics/" + headerId + "/lines", {
        credentials: "include",
        signal: controller.signal,
      }).then((r) => (r.ok ? r.json() : { data: [] })),
    ])
      .then(([rec, ln]) => {
        const inst = rec.data as { data?: Record<string, unknown> } | null;
        setConfigRaw(inst?.data ?? null);
        const rows = (ln.data ?? ln.lines ?? []) as Array<{
          series?: number;
          slot: number;
          value: string | number | null;
        }>;
        setLines(statRowsToGraphPoints(rows));
        setError("");
      })
      .catch((e: unknown) => {
        if ((e as { name?: string }).name !== "AbortError") {
          setError(e instanceof Error ? e.message : String(e));
        }
      });
    return () => controller.abort();
  }, [headerId, linesEpoch]);

  if (!headerId) {
    return (
      <p className="text-sm text-muted-foreground">
        Save the statistic header to see the graph.
      </p>
    );
  }

  const parsed = configRaw ? parseStatHeaderConfig(configRaw) : null;
  if (parsed && !parsed.ok) {
    return (
      <p className="text-sm text-muted-foreground">
        Graph waits on a complete header (scale + frequency).
      </p>
    );
  }
  if (!parsed?.ok) {
    return error ? <p className="text-sm text-destructive">{error}</p> : null;
  }

  return (
    <div className="rounded-lg border border-border bg-card/40 p-4">
      <h3 className="mb-3 text-sm font-semibold tracking-tight">Graph</h3>
      <StatGraph config={parsed.config} lines={lines} />
    </div>
  );
}
