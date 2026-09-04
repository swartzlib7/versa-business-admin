"use client";

import { useMemo, useState } from "react";
import { OrgBoardView } from "@/components/glossary/glossary-views";
import { GlossaryDrum } from "@/components/glossary/glossary-drum";
import { INITIAL_ENTRIES, INITIAL_SECTIONS } from "@/lib/fixtures/glossary-terms";
import { useBrand } from "@/components/shell/brand-provider";
import { theme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PublicGlossaryBook() {
  const brand = useBrand();
  const accent = brand.brand_color || theme.colors.brand;
  const [activeSectionId, setActiveSectionId] = useState("");

  const filtered = useMemo(
    () =>
      INITIAL_ENTRIES.filter((e) => !activeSectionId || e.sectionId === activeSectionId)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
    [activeSectionId],
  );

  const sectionName = (id: string) => INITIAL_SECTIONS.find((s) => s.id === id)?.name ?? "";

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/80">
        <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />
        <CardHeader className="space-y-3 text-center sm:px-10">
          <CardTitle className="font-sans text-4xl font-semibold uppercase tracking-[0.18em] sm:text-5xl">
            Glossary of Terms
          </CardTitle>
          <CardDescription className="mx-auto max-w-2xl text-base leading-relaxed">
            Turn the drum — a scroll of Mission Control terms. Wheel or drag to rotate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:px-10">
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSectionId("")}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                !activeSectionId
                  ? "border-transparent text-white"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
              style={!activeSectionId ? { backgroundColor: accent } : undefined}
            >
              All sections
            </button>
            {INITIAL_SECTIONS.map((sec) => {
              const on = activeSectionId === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSectionId(sec.id)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    on
                      ? "border-transparent text-white"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                  style={on ? { backgroundColor: accent } : undefined}
                >
                  {sec.name}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <GlossaryDrum accent={accent} entries={filtered} sectionName={sectionName} />
    </div>
  );
}

export function PublicOrgBoard() {
  const brand = useBrand();
  const accent = brand.brand_color || theme.colors.brand;
  return <OrgBoardView accent={accent} />;
}
