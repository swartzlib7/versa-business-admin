"use client";

import { useEffect, useMemo, useState } from "react";
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

/**
 * Glossary book (Stephen, 2026-09-14 02:48):
 * - The navigator block is compact — roughly half its old height.
 * - Clicking a letter FILTERS the book to that letter only (no scroll-to-anchor),
   and composes with the section filter: section first, then letter narrows further.
 * - Everything stays inside the same glossary box.
 */
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
  const [activeLetter, setActiveLetter] = useState("");

  // A letter chosen under one section may not exist under another — reset on section change.
  useEffect(() => {
    setActiveLetter("");
  }, [activeSectionId]);

  const sectionName = (id: string) =>
    sections.find((s) => s.id === id)?.name ?? "";

  const bySection = useMemo(
    () =>
      entries
        .filter((e) => !activeSectionId || e.sectionId === activeSectionId)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
    [entries, activeSectionId],
  );

  const letters = useMemo(() => {
    const set = new Set<string>();
    for (const entry of bySection) set.add(letterOf(entry.name));
    return [...set].sort((a, b) => {
      if (a === "#") return 1;
      if (b === "#") return -1;
      return a.localeCompare(b);
    });
  }, [bySection]);

  const filtered = useMemo(
    () => (activeLetter ? bySection.filter((e) => letterOf(e.name) === activeLetter) : bySection),
    [bySection, activeLetter],
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

  const letterChip = (label: string, on: boolean, onClick: () => void) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "inline-flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-sm font-medium transition-colors",
        on
          ? "border-transparent text-white"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
      style={on ? { backgroundColor: accent } : undefined}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <Card size="hug" className="overflow-hidden border-border/80">
        <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />
        <CardHeader className="space-y-1.5 px-5 py-4 text-center sm:px-8">
          <CardTitle className="font-sans text-2xl font-semibold uppercase tracking-[0.18em] sm:text-3xl">
            Glossary of Terms
          </CardTitle>
          <CardDescription className="mx-auto max-w-2xl text-sm leading-snug">
            Definitions for the zones, divisions, departments, and patterns used across
            Versa - Business Admin — set in dictionary order from the glossary entries.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2.5 px-5 pb-4 sm:px-8">
          <nav
            aria-label="Filter by letter"
            className="flex flex-wrap items-center justify-center gap-1 border-y border-border/70 py-2"
          >
            {letterChip("All", !activeLetter, () => setActiveLetter(""))}
            {letters.map((letter) =>
              letterChip(letter, activeLetter === letter, () =>
                setActiveLetter((cur) => (cur === letter ? "" : letter)),
              ),
            )}
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
        className="rounded-xl border border-border bg-card px-5 py-6 shadow-sm sm:px-10 sm:py-8"
        style={{ boxShadow: `inset 3px 0 0 ${accent}` }}
      >
        {groups.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            {activeLetter
              ? `No terms under “${activeLetter === "#" ? "other" : activeLetter}” in this view yet.`
              : "No terms in this section yet."}
          </p>
        ) : (
          <div className="space-y-10">
            {groups.map(([letter, items]) => (
              <section key={letter} className="">
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
