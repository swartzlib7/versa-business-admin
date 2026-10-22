"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Printer, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Wait for every image under `root` to finish loading (or fail). */
async function imagesSettled(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          }),
    ),
  );
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Print-ready page around one or more sheets. Opens the browser print dialog
 * once the content and its images are ready. Contract: state_hats.md § 1.8.
 */
export function PrintFrame({
  title,
  orientation,
  margin,
  ready,
  error,
  children,
}: {
  title: string;
  orientation: "portrait" | "landscape";
  margin: string;
  ready: boolean;
  error?: string;
  children: ReactNode;
}) {
  const sheetsRef = useRef<HTMLDivElement>(null);
  const printed = useRef(false);

  useEffect(() => {
    if (title) document.title = title;
  }, [title]);

  useEffect(() => {
    if (!ready || printed.current || !sheetsRef.current) return;
    let live = true;
    void (async () => {
      await imagesSettled(sheetsRef.current!);
      await nextFrame();
      await nextFrame();
      if (!live || printed.current) return;
      printed.current = true;
      window.print();
    })();
    return () => {
      live = false;
    };
  }, [ready]);

  return (
    <div className="min-h-screen bg-neutral-200 text-neutral-900 print:bg-white">
      <style>{`
        @page { size: ${orientation}; margin: ${margin}; }
        html, body { background: #fff; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      `}</style>
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-neutral-300 bg-white/95 px-4 py-2 print:hidden">
        <span className="truncate text-sm font-medium">{title}</span>
        <span className="flex shrink-0 gap-2">
          <button
            type="button"
            disabled={!ready}
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-100 disabled:opacity-50"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-100"
            onClick={() => window.close()}
          >
            <X className="h-4 w-4" />
            Close
          </button>
        </span>
      </div>
      <div ref={sheetsRef} className={cn("flex flex-col items-center gap-6 py-6 print:block print:p-0")}>
        {error ? (
          <p className="rounded-md bg-white px-4 py-3 text-sm text-red-700 shadow">{error}</p>
        ) : ready ? (
          children
        ) : (
          <p className="text-sm text-neutral-600">Preparing the page…</p>
        )}
      </div>
    </div>
  );
}

/** One sheet: paper-sized on screen; the printer's page margins apply when printing. */
export function PrintSheet({
  width,
  height,
  padding,
  breakBefore,
  children,
}: {
  width: string;
  height?: string;
  padding: string;
  breakBefore?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "box-content bg-white shadow-md print:box-border print:p-0! print:shadow-none",
        breakBefore && "break-before-page",
      )}
      style={{ width, minHeight: height, padding }}
    >
      <div className="flex flex-col" style={{ height }}>
        {children}
      </div>
    </section>
  );
}
