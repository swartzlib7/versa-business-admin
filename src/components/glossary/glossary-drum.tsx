"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type GlossaryEntry = {
  id: string;
  sectionId: string;
  name: string;
  definition: string;
};

const VISIBLE = 9;
const FACE_H = 118;
const ANGLE = 360 / VISIBLE;
const RADIUS = FACE_H / (2 * Math.tan(Math.PI / VISIBLE));
const MID = Math.floor(VISIBLE / 2);

function wrap(n: number, len: number) {
  if (len <= 0) return 0;
  return ((n % len) + len) % len;
}

/**
 * Public glossary as a turning scroll/drum. Wheel or drag over the cylinder
 * rotates terms toward the reading line.
 */
export function GlossaryDrum({
  accent,
  entries,
  sectionName,
}: {
  accent: string;
  entries: GlossaryEntry[];
  sectionName: (id: string) => string;
}) {
  const [offset, setOffset] = useState(0);
  const [reduce, setReduce] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const lastY = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const n = entries.length;
  const bump = useCallback((delta: number) => {
    if (n < 2) return;
    setOffset((o) => o + delta);
  }, [n]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || reduce) return;
    const onWheelNative = (e: WheelEvent) => {
      if (n < 2) return;
      e.preventDefault();
      bump(e.deltaY / 240);
    };
    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", onWheelNative);
  }, [bump, n, reduce]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (reduce || n < 2) return;
    dragging.current = true;
    lastY.current = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dy = e.clientY - lastY.current;
    lastY.current = e.clientY;
    bump(dy / FACE_H);
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  const faces = useMemo(() => {
    if (n === 0) return [];
    const origin = offset;
    const front = Math.round(origin);
    const frac = origin - front;
    return Array.from({ length: VISIBLE }, (_, i) => {
      const rel = i - MID;
      const item = entries[wrap(front + rel, n)];
      const angle = (rel - frac) * ANGLE;
      const dist = Math.abs(rel - frac);
      return { key: `${item.id}-${rel}`, item, angle, dist };
    });
  }, [entries, n, offset]);

  if (n === 0) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        No terms in this section yet.
      </p>
    );
  }

  if (reduce) {
    return (
      <ol className="space-y-6 px-2 py-6">
        {entries.map((item) => (
          <li key={item.id}>
            <h3 className="text-lg font-semibold leading-tight">{item.name}</h3>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {sectionName(item.sectionId)}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{item.definition}</p>
          </li>
        ))}
      </ol>
    );
  }

  const stageH = Math.round(RADIUS * 2 + FACE_H);

  return (
    <div className="relative">
      <p className="mb-3 text-center text-xs text-muted-foreground">
        Scroll or drag over the drum to turn the scroll
      </p>
      <div
        ref={stageRef}
        className="relative mx-auto max-w-3xl cursor-grab select-none active:cursor-grabbing"
        style={{ height: stageH }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="pointer-events-none absolute inset-y-6 left-0 z-20 w-7 rounded-full border border-border shadow-inner"
          style={{
            background: `linear-gradient(90deg, color-mix(in oklab, ${accent} 55%, #1a1a1a), color-mix(in oklab, ${accent} 20%, #3a3a3a) 45%, #111)`,
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-6 right-0 z-20 w-7 rounded-full border border-border shadow-inner"
          style={{
            background: `linear-gradient(270deg, color-mix(in oklab, ${accent} 55%, #1a1a1a), color-mix(in oklab, ${accent} 20%, #3a3a3a) 45%, #111)`,
          }}
          aria-hidden
        />
        <div
          className="absolute inset-x-8 overflow-hidden rounded-[2.5rem] border border-border/60"
          style={{
            top: 8,
            bottom: 8,
            perspective: "920px",
            background:
              "linear-gradient(180deg, color-mix(in oklab, var(--background) 40%, black) 0%, color-mix(in oklab, var(--card) 70%, black) 42%, color-mix(in oklab, var(--background) 35%, black) 100%)",
          }}
        >
          <div
            className="relative h-full w-full"
            style={{ transformStyle: "preserve-3d" }}
          >
            {faces.map((face) => {
              const front = face.dist < 0.55;
              const opacity = Math.max(0.12, 1 - face.dist * 0.28);
              return (
                <article
                  key={face.key}
                  className={cn(
                    "absolute left-[8%] right-[8%] overflow-hidden rounded-md border px-5 py-3",
                    front ? "border-border bg-card text-card-foreground shadow-md" : "border-border/40 bg-card/70",
                  )}
                  style={{
                    height: FACE_H,
                    top: "50%",
                    marginTop: -FACE_H / 2,
                    opacity,
                    transform: `rotateX(${face.angle}deg) translateZ(${RADIUS}px)`,
                    backfaceVisibility: "hidden",
                    boxShadow: front ? `inset 3px 0 0 ${accent}` : undefined,
                  }}
                >
                  <h3 className="truncate text-lg font-semibold leading-tight">{face.item.name}</h3>
                  <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {sectionName(face.item.sectionId)}
                  </p>
                  <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-foreground/90">
                    {face.item.definition}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
