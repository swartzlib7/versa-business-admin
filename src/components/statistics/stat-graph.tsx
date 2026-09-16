"use client";

/**
 * I5.6.35 S-4 (2026-09-12) - Statistics graph (locked contract,
 * state_statistics_environment.md): scale runs up the LEFT side, frequency
 * runs along the BOTTOM (left->right). One header = one graph. Lines are the
 * captured data points; empty slots render as gaps in the polyline.
 *
 * Hand-rolled SVG (no chart dependency) per the StatSpark precedent.
 */
import { useMemo } from "react";
import { scaleAxisMarks, frequencySlotLabels, frequencyWindowCaption } from "@/lib/statistics/frequency";
import type { StatHeaderConfig } from "@/lib/statistics/model";

export interface StatGraphLine {
  series: number;
  slot: number;
  value: number;
}

export function StatGraph({
  config,
  lines,
  className,
}: {
  config: StatHeaderConfig;
  lines: StatGraphLine[];
  className?: string;
}) {
  const W = 560;
  const H = 280;
  const PAD_L = config.scaleName ? 62 : 44;
  const PAD_B = 50;
  const PAD_T = 12;
  const PAD_R = 12;

  const marks = useMemo(() => scaleAxisMarks(config), [config]);
  const slotLabels = useMemo(
    () => frequencySlotLabels(config, config.frequencyQty),
    [config],
  );

  const yFor = (v: number) => {
    const span = config.scaleEnd - config.scaleStart || 1;
    const t = (v - config.scaleStart) / span;
    return PAD_T + (1 - t) * (H - PAD_T - PAD_B);
  };
  const xFor = (slot: number) => {
    const n = Math.max(config.frequencyQty - 1, 1);
    return PAD_L + (slot / n) * (W - PAD_L - PAD_R);
  };

  // One polyline per series, slots in order; gaps break the path.
  const seriesPaths = useMemo(() => {
    const bySeries = new Map<number, StatGraphLine[]>();
    for (const ln of lines) {
      const arr = bySeries.get(ln.series) ?? [];
      arr.push(ln);
      bySeries.set(ln.series, arr);
    }
    const paths: string[] = [];
    for (const [, arr] of [...bySeries.entries()].sort((a, b) => a[0] - b[0])) {
      const sorted = [...arr].sort((a, b) => a.slot - b.slot);
      let d = "";
      let prevSlot: number | null = null;
      for (const ln of sorted) {
        const x = xFor(ln.slot).toFixed(1);
        const y = yFor(ln.value).toFixed(1);
        if (prevSlot === null || ln.slot !== prevSlot + 1) d += ` M ${x} ${y}`;
        else d += ` L ${x} ${y}`;
        prevSlot = ln.slot;
      }
      if (d) paths.push(d.trim());
    }
    return paths;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, config]);

  const dots = useMemo(
    () => lines.map((ln) => ({ x: xFor(ln.slot), y: yFor(ln.value), series: ln.series })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lines, config],
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className ?? "w-full"}
      role="img"
      aria-label={`Statistic graph: scale ${config.scaleStart} to ${config.scaleEnd} by ${config.scaleStep}, frequency ${config.frequencyType} from ${config.frequencyStart} for ${config.frequencyQty} steps`}
    >
      {config.scaleName ? (
        <text
          transform={`rotate(-90 ${14} ${PAD_T + (H - PAD_T - PAD_B) / 2})`}
          x={14}
          y={PAD_T + (H - PAD_T - PAD_B) / 2}
          textAnchor="middle"
          fontSize={10}
          fill="currentColor"
          fillOpacity={0.7}
        >
          {config.scaleName}
        </text>
      ) : null}
      {/* scale axis (LEFT) */}
      {marks.map((m) => {
        const y = yFor(m);
        return (
          <g key={"m" + m}>
            <line x1={PAD_L - 4} x2={W - PAD_R} y1={y} y2={y} stroke="currentColor" strokeOpacity={0.08} />
            <text x={PAD_L - 8} y={y + 3} textAnchor="end" fontSize={9} fill="currentColor" fillOpacity={0.55}>
              {m}
            </text>
          </g>
        );
      })}
      {/* frequency axis (BOTTOM, left->right) */}
      {slotLabels.map((label, i) => {
        const x = xFor(i);
        return (
          <g key={"s" + i}>
            <line x1={x} x2={x} y1={PAD_T} y2={H - PAD_B} stroke="currentColor" strokeOpacity={0.05} />
            <text x={x} y={H - PAD_B + 12} textAnchor="middle" fontSize={9} fill="currentColor" fillOpacity={0.55}>
              {label}
            </text>
          </g>
        );
      })}
      <text
        x={(PAD_L + W - PAD_R) / 2}
        y={H - 8}
        textAnchor="middle"
        fontSize={9}
        fill="currentColor"
        fillOpacity={0.65}
      >
        {frequencyWindowCaption(config)}
      </text>
      {/* axes */}
      <line x1={PAD_L} x2={PAD_L} y1={PAD_T} y2={H - PAD_B} stroke="currentColor" strokeOpacity={0.3} />
      <line x1={PAD_L} x2={W - PAD_R} y1={H - PAD_B} y2={H - PAD_B} stroke="currentColor" strokeOpacity={0.3} />
      {/* series polylines + points */}
      {seriesPaths.map((d, i) => (
        <path
          key={"p" + i}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeOpacity={i === 0 ? 0.9 : 0.55}
        />
      ))}
      {dots.map((p, i) => (
        <circle key={"d" + i} cx={p.x} cy={p.y} r={2.4} fill="currentColor" fillOpacity={0.9} />
      ))}
    </svg>
  );
}
