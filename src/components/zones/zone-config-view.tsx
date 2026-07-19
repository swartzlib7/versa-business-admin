"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { theme } from "@/lib/theme";

export type ZoneTab = {
  id: string;
  label: string;
  summary: string;
  fields: {
    label: string;
    placeholder: string;
    kind?: "text" | "textarea" | "select";
    options?: string[];
  }[];
  relations: { zone: string; label: string; hint: string }[];
};

export type ZoneConfig = {
  id: "organization" | "collaboration" | "environment";
  title: string;
  subtitle: string;
  accent: string;
  accentSoft: string;
  tabs: ZoneTab[];
};

function FieldMock({
  label,
  placeholder,
  kind = "text",
  options,
}: {
  label: string;
  placeholder: string;
  kind?: "text" | "textarea" | "select";
  options?: string[];
}) {
  const base =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {kind === "textarea" ? (
        <textarea
          className={cn(base, "min-h-[88px] resize-y")}
          placeholder={placeholder}
          defaultValue=""
        />
      ) : kind === "select" ? (
        <select className={base} defaultValue="">
          <option value="" disabled>
            {placeholder}
          </option>
          {(options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input className={base} placeholder={placeholder} defaultValue="" />
      )}
    </label>
  );
}

export function ZoneConfigView({ config }: { config: ZoneConfig }) {
  const [active, setActive] = useState(config.tabs[0]?.id ?? "");
  const tab = useMemo(
    () => config.tabs.find((t) => t.id === active) ?? config.tabs[0],
    [active, config.tabs]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: config.accent }}
              aria-hidden
            />
            <Badge variant="outline" className="font-normal">
              Zone config · mock
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{config.title}</h1>
          <p className="max-w-2xl text-muted-foreground">{config.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/dashboard"
            className="rounded-md border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            3D hub
          </Link>
          <span
            className="rounded-md px-3 py-1.5 font-medium text-white"
            style={{ backgroundColor: config.accent }}
          >
            {config.tabs.length} elements
          </span>
        </div>
      </div>

      <div
        className="rounded-xl border border-border p-1 shadow-sm"
        style={{
          background: `linear-gradient(135deg, ${config.accentSoft}, transparent)`,
        }}
      >
        <div
          role="tablist"
          aria-label={`${config.title} elements`}
          className="flex flex-wrap gap-1"
        >
          {config.tabs.map((t) => {
            const on = t.id === tab?.id;
            return (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={on}
                onClick={() => setActive(t.id)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  on
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                )}
                style={
                  on ? { boxShadow: `inset 0 -2px 0 ${config.accent}` } : undefined
                }
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab && (
        <div className="grid gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-3 overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">{tab.label}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{tab.summary}</p>
                </div>
                <Badge
                  className="shrink-0 border-0 text-white"
                  style={{ backgroundColor: config.accent }}
                >
                  Configure
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
              {tab.fields.map((f) => (
                <div
                  key={f.label}
                  className={f.kind === "textarea" ? "sm:col-span-2" : undefined}
                >
                  <FieldMock {...f} />
                </div>
              ))}
              <div className="sm:col-span-2 flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-md px-4 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: config.accent }}
                >
                  Save draft
                </button>
                <button
                  type="button"
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  Reset
                </button>
                <span className="self-center text-xs text-muted-foreground">
                  Mock only — no persistence yet
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Relationships</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Connect this element across zones (keystone ERD pattern).
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {tab.relations.map((r) => (
                  <div
                    key={r.label + r.zone}
                    className="rounded-lg border border-border bg-muted/20 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{r.label}</span>
                      <Badge variant="secondary" className="font-normal">
                        {r.zone}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{r.hint}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Zone map</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Spatial twin: Mission Control 3D hub on the dashboard. Operational
                  twin: this tabbed surface.
                </p>
                <p className="text-xs">
                  Brand: {theme.brand.name}. Spec: docs/specs/MISSION_CONTROL_ZONE_ERD_I5.6.md
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
