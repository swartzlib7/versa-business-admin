"use client";

import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useBrand } from "@/components/shell/brand-provider";

export function PanelShell({
  summary,
  badge,
  fill = false,
  children,
}: {
  summary: string;
  badge?: string;
  fill?: boolean;
  children: ReactNode;
}) {
  const brand = useBrand();
  return (
    <Card className={cn("min-h-[640px] overflow-hidden", fill && "flex flex-1 flex-col")}>
      <CardHeader className="shrink-0 border-b bg-muted/30">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
          </div>
          {badge ? (
            <Badge
              className="shrink-0 border-0 text-white"
              style={{ backgroundColor: brand.brand_color }}
            >
              {badge}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className={cn("p-6", fill && "flex flex-1 flex-col")}>{children}</CardContent>
    </Card>
  );
}
