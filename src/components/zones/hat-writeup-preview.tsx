"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { loadRecordOptions } from "@/components/catalog/record-multi-lookup-field";
import { hatWriteupFrom, imageGridFor, type HatWriteup } from "@/lib/records/hat-writeup";
import type { RecordImageRef } from "@/lib/records/record-image-refs";

export type HatWriteupPreview = { kind: "hat-writeup" } & HatWriteup;

const STATUS_LABEL: Record<string, string> = { active: "Active", archived: "Archived", single: "Single" };

/** Resolve holder names and build the Twin preview for one Hat. */
export async function loadHatWriteup(record: {
  id?: string | null;
  name?: string;
  status?: string;
  data?: Record<string, string>;
}): Promise<HatWriteupPreview> {
  const staff = await loadRecordOptions("communication_staff");
  const names = new Map(staff.map((row) => [row.id, row.name]));
  return { kind: "hat-writeup", ...hatWriteupFrom(record, names) };
}

function Section({ title, entries }: { title: string; entries: string[] }) {
  return (
    <section className="break-inside-avoid-page space-y-2">
      <h3 className="border-b border-neutral-300 pb-1 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-600">
        {title}
      </h3>
      {entries.length ? (
        <ol className="space-y-1.5">
          {entries.map((entry, i) => (
            <li key={i} className="flex gap-2 text-[0.95em] leading-relaxed">
              <span className="w-6 shrink-0 text-right tabular-nums text-neutral-500">{i + 1}.</span>
              <span className="min-w-0 whitespace-pre-wrap">{entry}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-[0.9em] italic text-neutral-500">None yet</p>
      )}
    </section>
  );
}

function HatTitle({ hat, subtitle }: { hat: HatWriteup; subtitle?: string }) {
  return (
    <header className="space-y-1.5 border-b-2 border-neutral-800 pb-3">
      <p className="text-[0.7em] font-semibold uppercase tracking-[0.18em] text-neutral-500">Hat{subtitle ? ` · ${subtitle}` : ""}</p>
      <h2 className="text-[1.6em] font-semibold leading-tight">{hat.name || "Untitled hat"}</h2>
      {subtitle ? null : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.85em] text-neutral-600">
          {hat.status ? (
            <span className="rounded-full border border-neutral-400 px-2 py-0.5 text-[0.85em]">
              {STATUS_LABEL[hat.status] ?? hat.status}
            </span>
          ) : null}
          <span>{hat.holders.length ? `Held by ${hat.holders.join(", ")}` : "No holders yet"}</span>
        </div>
      )}
    </header>
  );
}

/** Page 1: purposes, know-how, and duties. */
export function HatWriteupSheet({ hat, className }: { hat: HatWriteup; className?: string }) {
  return (
    <div className={cn("space-y-5 bg-white text-neutral-900", className)}>
      <HatTitle hat={hat} />
      <Section title="Purposes" entries={hat.purposes} />
      <Section title="Know-How" entries={hat.knowHow} />
      <Section title="Duties" entries={hat.duties} />
    </div>
  );
}

/** Images laid out by `imageGridFor`; each photo whole, its description below. */
export function HatImageGrid({ images, className }: { images: RecordImageRef[]; className?: string }) {
  const { rows, cols } = imageGridFor(images.length);
  if (!images.length) {
    return <p className="text-sm italic text-neutral-500">No images</p>;
  }
  return (
    <div
      className={cn("grid min-h-0 gap-3", className)}
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
      }}
    >
      {images.map((image) => (
        <figure key={image.id} className="flex min-h-0 flex-col gap-1.5 break-inside-avoid">
          <div className="flex min-h-0 flex-1 items-center justify-center rounded border border-neutral-200 bg-neutral-50 p-1">
            {/* eslint-disable-next-line @next/next/no-img-element -- uploaded record image, printed as-is */}
            <img
              src={`/api/records/images/${image.id}`}
              alt={image.description || image.name}
              className="max-h-full max-w-full object-contain"
            />
          </div>
          {image.description ? (
            <figcaption className="line-clamp-3 text-[0.8em] leading-snug text-neutral-700">{image.description}</figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  );
}

/** Page 2: title plus the image grid filling the rest of the sheet. */
export function HatImagesSheet({ hat, className }: { hat: HatWriteup; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4 bg-white text-neutral-900", className)}>
      <HatTitle hat={hat} subtitle="Images" />
      <HatImageGrid images={hat.images} className="flex-1" />
    </div>
  );
}

/** The Hat as paper pages in the Spatial Twin and lightbox. */
export function HatWriteupPreviewView({ preview }: { preview: HatWriteupPreview }) {
  const [page, setPage] = useState<"writeup" | "images">("writeup");
  const tabs = [
    { id: "writeup" as const, label: "Write-up" },
    { id: "images" as const, label: `Images (${preview.images.length})` },
  ];
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-1 border-b border-border px-3 py-2" role="tablist" aria-label="Hat pages">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={page === tab.id}
            className={cn(
              "rounded px-2.5 py-1 text-xs font-medium",
              page === tab.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50",
            )}
            onClick={() => setPage(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-muted/40 p-3">
        <div className="mx-auto w-full max-w-[720px] rounded-sm shadow-md">
          {page === "writeup" ? (
            <HatWriteupSheet hat={preview} className="min-h-[18rem] rounded-sm p-6 text-[13px]" />
          ) : (
            <HatImagesSheet hat={preview} className="aspect-[17/22] rounded-sm p-6 text-[13px]" />
          )}
        </div>
      </div>
    </div>
  );
}
