"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STAT_SCALES, type PublicStat, type StatScale } from "@/lib/public/site-types";
import { StatSpark } from "./stat-spark";

const LABELS: Record<StatScale | "all", string> = {
  all: "All",
  hour: "Hour",
  day: "Day",
  week: "Week",
  month: "Month",
  year: "Year",
  custom: "Custom",
};

export function PublicStatsGrid({ stats }: { stats: PublicStat[] }) {
  const [scale, setScale] = useState<StatScale | "all">("all");
  const rows = useMemo(
    () => (scale === "all" ? stats : stats.filter((s) => s.scale === scale)),
    [scale, stats],
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {(["all", ...STAT_SCALES] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setScale(key)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              scale === key
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {LABELS[key]}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((stat) => (
          <Card key={stat.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </span>
                <Badge variant="outline" className="text-xs">
                  {LABELS[stat.scale]}
                </Badge>
              </div>
              <div className="mt-2 text-3xl font-bold">
                {stat.value}
                {stat.unit ? (
                  <span className="ml-1 text-base font-normal text-muted-foreground">
                    {stat.unit}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{stat.category}</p>
              <StatSpark values={stat.series} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
