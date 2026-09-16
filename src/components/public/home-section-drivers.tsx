"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { theme } from "@/lib/theme";
import { PublicStatsGrid } from "@/components/public/public-stats-grid";
import type { HomeSectionContent } from "@/lib/public/demo-content";
import { sectionColumnsClass } from "@/lib/public/page-builder";
import { HtmlBlock } from "@/components/public/html-editor";
import {
  Server,
  Plug,
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Server,
  Plug,
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  BookOpen,
  CheckCircle2,
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  connected: "default",
  standalone: "secondary",
  planned: "outline",
  error: "destructive",
  open: "default",
  in_progress: "secondary",
  resolved: "outline",
  urgent: "destructive",
  high: "default",
  normal: "secondary",
  low: "outline",
};

function SampleMark() {
  return (
    <Badge variant="outline" className="ml-2 align-middle text-[10px] uppercase tracking-wide">
      Sample
    </Badge>
  );
}

function TrendIcon({ trend }: { trend?: string }) {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-orange-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function EmptyLive({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border/70 bg-background/40 px-6 py-10 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function HomeSectionItem({
  content,
  itemIndex,
  compact,
}: {
  content: HomeSectionContent;
  itemIndex: number;
  compact: boolean;
}) {
  if (content.html || content.pendingTwin || content.contact || content.about) {
    if (itemIndex !== 0) return null;
    return <HomeSectionBody content={content} compact={compact} />;
  }
  if (content.id === "statistics" && content.stats?.length) {
    const stat = content.stats[itemIndex];
    if (!stat) return null;
    return <PublicStatsGrid stats={[stat]} />;
  }
  if (content.id === "inspections-reports") {
    if (itemIndex !== 0) return null;
    return <HomeSectionBody content={content} compact={compact} />;
  }
  const card = content.cards[itemIndex];
  if (!card) return null;
  const Icon = ICON_MAP[card.icon ?? ""] ?? LayoutDashboard;
  return (
    <Card size="hug" className="flex h-full min-h-0 flex-col overflow-hidden">
      {content.id === "statistics" ? (
        <CardContent className={compact ? "pt-3" : "pt-6"}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
            <TrendIcon trend={card.trend} />
          </div>
          <div className={compact ? "mt-1 text-xl font-bold" : "mt-2 text-3xl font-bold"}>{card.value}</div>
          {card.body ? <p className="mt-1 text-xs text-muted-foreground">{card.body}</p> : null}
        </CardContent>
      ) : (
        <>
          <CardHeader className={compact ? "p-3 pb-1" : undefined}>
            {card.icon && content.id === "facets" ? (
              <div
                className={cn(
                  "mb-2 flex items-center justify-center rounded-lg",
                  compact ? "h-8 w-8" : "h-12 w-12",
                )}
                style={{ backgroundColor: theme.colors.brand + "20", color: theme.colors.brand }}
              >
                <Icon className={compact ? "h-4 w-4" : "h-6 w-6"} />
              </div>
            ) : null}
            <CardTitle className={compact ? "text-sm" : content.id === "facets" ? "text-lg" : "text-base"}>
              {card.title}
            </CardTitle>
            {card.subtitle ? (
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{card.subtitle}</p>
            ) : null}
          </CardHeader>
          <CardContent className={cn("min-h-0 flex-1 overflow-hidden", compact ? "p-3 pt-0" : undefined)}>
            {card.body ? (
              <p className={cn("text-muted-foreground", compact ? "line-clamp-3 text-xs" : "text-sm")}>
                {card.body}
              </p>
            ) : null}
            {card.features?.length ? (
              <ul className={compact ? "mt-2 space-y-1" : "mt-4 space-y-2"}>
                {card.features.slice(0, compact ? 3 : card.features.length).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                    <span className="line-clamp-2 text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </>
      )}
    </Card>
  );
}

export function HomeSectionBody({
  content,
  columns,
  compact = false,
  itemIndex,
}: {
  content: HomeSectionContent;
  columns?: number;
  showLogin?: boolean;
  compact?: boolean;
  /** Paint one collection tile (one Facet card, one stat) — used inside a Cell. */
  itemIndex?: number;
}) {
  const grid = sectionColumnsClass(columns);
  if (itemIndex !== undefined) {
    return <HomeSectionItem content={content} itemIndex={itemIndex} compact={compact} />;
  }
  if (content.html) {
    return (
      <div>
        <div className={cn("text-center", compact ? "mb-3" : "mb-8")}>
          <h2 className={cn("font-bold tracking-tight", compact ? "text-base" : "text-3xl")}>
            {content.title}
            {content.sample ? <SampleMark /> : null}
          </h2>
        </div>
        <HtmlBlock html={content.html} format={content.htmlFormat} />
      </div>
    );
  }
  if (content.pendingTwin) {
    return (
      <div>
        <div className={cn("text-center", compact ? "mb-3" : "mb-8")}>
          <h2 className={cn("font-bold tracking-tight", compact ? "text-base" : "text-3xl")}>
            {content.title}
          </h2>
          {content.subtitle ? (
            <p className={cn("text-muted-foreground", compact ? "mt-1 text-xs" : "mt-3")}>
              {content.subtitle}
            </p>
          ) : null}
        </div>
        <EmptyLive message="Spatial twin for Integrations is not built yet — this section stays unpublished until that twin exists." />
      </div>
    );
  }
  const heading = (
    <div className={cn("text-center", compact ? "mb-3" : "mb-8")}>
      <h2 className={cn("font-bold tracking-tight", compact ? "text-base" : "text-3xl")}>
        {content.title}
        {content.sample ? <SampleMark /> : null}
      </h2>
      {content.subtitle ? (
        <p className={cn("text-muted-foreground", compact ? "mt-1 text-xs" : "mt-3")}>
          {content.subtitle}
        </p>
      ) : null}
    </div>
  );

  if (content.id === "contacts" && content.contact) {
    return (
      <div>
        {heading}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a href={`mailto:${content.contact.email}`} className={cn(buttonVariants({ size: compact ? "sm" : "lg" }))}>
            {content.contact.email}
          </a>
          <span className="text-sm text-muted-foreground">{content.contact.phone}</span>
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">{content.contact.address}</p>
      </div>
    );
  }

  if (content.id === "statistics" && content.stats?.length) {
    return (
      <div>
        {heading}
        <PublicStatsGrid stats={content.stats} />
      </div>
    );
  }

  if (content.id === "inspections-reports") {
    if (!content.cards.length) return <div>{heading}<EmptyLive message="No inspection types published yet." /></div>;
    return (
      <div>
        {heading}
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Ticket</th>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {content.cards.map((t) => (
                <tr key={t.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{t.id}</td>
                  <td className="px-4 py-3">{t.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.subtitle}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.body}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[t.meta ?? ""] ?? "outline"}>{t.meta}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[t.badge ?? ""] ?? "outline"}>
                      {(t.badge ?? "").replace("_", " ")}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!content.cards.length) {
    return (
      <div>
        {heading}
        <EmptyLive message={`No ${content.title.toLowerCase()} published yet.`} />
      </div>
    );
  }

  return (
    <div>
      {heading}
      <div className={grid}>
        {content.cards.map((card) => {
          const Icon = ICON_MAP[card.icon ?? ""] ?? LayoutDashboard;
          return (
            <Card key={card.id} size="hug" className="flex flex-col">
              {content.id === "statistics" ? (
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
                    <TrendIcon trend={card.trend} />
                  </div>
                  <div className="mt-2 text-3xl font-bold">{card.value}</div>
                  {card.body ? <p className="mt-1 text-xs text-muted-foreground">{card.body}</p> : null}
                  {card.badge ? (
                    <Badge variant="outline" className="mt-3 text-xs">{card.badge}</Badge>
                  ) : null}
                </CardContent>
              ) : (
                <>
                  <CardHeader>
                    {card.icon && content.id === "facets" ? (
                      <div
                        className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg"
                        style={{ backgroundColor: theme.colors.brand + "20", color: theme.colors.brand }}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className={content.id === "facets" ? "text-lg" : "text-base"}>
                        {card.title}
                      </CardTitle>
                      {card.badge ? (
                        <Badge variant={STATUS_VARIANT[card.badge] ?? "secondary"} className="text-xs">
                          {card.badge}
                        </Badge>
                      ) : null}
                    </div>
                    {card.subtitle ? (
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{card.subtitle}</p>
                    ) : null}
                  </CardHeader>
                  <CardContent className="flex-1">
                    {card.body ? <p className="text-sm text-muted-foreground">{card.body}</p> : null}
                    {card.features?.length ? (
                      <ul className="mt-4 space-y-2">
                        {card.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                            <span className="text-muted-foreground">{f}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {card.meta ? (
                      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {card.meta}
                      </p>
                    ) : null}
                  </CardContent>
                </>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
