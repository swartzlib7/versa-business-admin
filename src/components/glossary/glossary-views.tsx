"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export { OrgBoardView } from "@/components/glossary/org-board-chart";

type GlossarySection = {
  id: string;
  name: string;
  description: string;
};

type GlossaryEntry = {
  id: string;
  sectionId: string;
  name: string;
  definition: string;
};

function letterOf(name: string) {
  const ch = name.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(ch) ? ch : "#";
}

export function GlossaryBookView({
  accent,
  sections,
  entries,
  activeSectionId,
  onSectionChange,
}: {
  accent: string;
  sections: GlossarySection[];
  entries: GlossaryEntry[];
  activeSectionId: string;
  onSectionChange: (id: string) => void;
}) {
  const sectionName = (id: string) =>
    sections.find((s) => s.id === id)?.name ?? "";

  const filtered = useMemo(
    () =>
      entries
        .filter((e) => !activeSectionId || e.sectionId === activeSectionId)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
    [entries, activeSectionId],
  );

  const groups = useMemo(() => {
    const map = new Map<string, GlossaryEntry[]>();
    for (const entry of filtered) {
      const letter = letterOf(entry.name);
      const list = map.get(letter) ?? [];
      list.push(entry);
      map.set(letter, list);
    }
    return [...map.entries()].sort(([a], [b]) => {
      if (a === "#") return 1;
      if (b === "#") return -1;
      return a.localeCompare(b);
    });
  }, [filtered]);

  const letters = groups.map(([letter]) => letter);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/80">
        <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />
        <CardHeader className="space-y-3 text-center sm:px-10">
          <CardTitle className="font-sans text-4xl font-semibold uppercase tracking-[0.18em] sm:text-5xl">
            Glossary of Terms
          </CardTitle>
          <CardDescription className="mx-auto max-w-2xl text-base leading-relaxed">
            Definitions for the zones, divisions, departments, and patterns used across
            Mission Control — set in dictionary order from the glossary entries.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:px-10">
          <nav
            aria-label="Jump to letter"
            className="flex flex-wrap justify-center gap-1 border-y border-border/70 py-3"
          >
            {letters.map((letter) => (
              <a
                key={letter}
                href={`#glossary-letter-${letter === "#" ? "other" : letter}`}
                className="inline-flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {letter}
              </a>
            ))}
          </nav>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => onSectionChange("")}
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
            {sections.map((sec) => {
              const on = activeSectionId === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => onSectionChange(sec.id)}
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

      <div
        className="rounded-xl border border-border bg-card px-5 py-8 shadow-sm sm:px-10 sm:py-12"
        style={{ boxShadow: `inset 3px 0 0 ${accent}` }}
      >
        {groups.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            No terms in this section yet.
          </p>
        ) : (
          <div className="space-y-10">
            {groups.map(([letter, items]) => (
              <section
                key={letter}
                id={`glossary-letter-${letter === "#" ? "other" : letter}`}
                className="scroll-mt-24"
              >
                <div className="mb-4 flex items-baseline gap-3 border-b border-border pb-2">
                  <h2 className="font-sans text-4xl font-semibold leading-none" style={{ color: accent }}>
                    {letter}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {items.length} {items.length === 1 ? "term" : "terms"}
                  </span>
                </div>
                <div className="columns-1 gap-x-12 md:columns-2">
                  {items.map((item) => (
                    <article key={item.id} className="mb-5 break-inside-avoid">
                      <h3 className="font-sans text-lg font-semibold leading-tight">
                        {item.name}
                      </h3>
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {sectionName(item.sectionId)}
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">
                        {item.definition}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
