"use client";

/**
 * I5.6.35 S-4 (2026-09-12) - Statistics graph (locked contract,
 * state_statistics_environment.md): scale runs up the LEFT side, frequency
 * runs along the BOTTOM (left->right). One header = one graph. Lines are the
 * captured data points; empty slots render as gaps in the polyline.
 *
 * 1.0.12: with a Period target set, the graph also draws the target line
 * (Period target / Frequency quantity) and, on the period still being
 * captured, the catch-up pace (orange dashed line + dots) for the steps left.
 * The scale never moves for either: a value above Scale High is pinned to the
 * top edge with its number printed.
 *
 * Hand-rolled SVG (no chart dependency) per the StatSpark precedent.
 */
import { useMemo } from "react";
import { scaleAxisMarks, frequencySlotLabels, frequencyWindowCaption } from "@/lib/statistics/frequency";
import { frequencyTypeLabel, slotTarget, statPeriodProgress, type StatHeaderConfig } from "@/lib/statistics/model";

export interface StatGraphLine {
  series: number;
  slot: number;
  value: number;
}

/** Target line and catch-up pace colors. Mid tones that read on every VBA theme. */
export const STAT_TARGET_COLOR = "#3b9be0";
export const STAT_PACE_COLOR = "#f08a24";

const TICK_FONT = 10;
/** Hack / monospace advance width per font-size unit. */
const CHAR_W = 0.6;

const fmt = (n: number) => String(Math.round(n * 100) / 100);

export function StatGraph({
  config,
  lines,
  className,
  shape = "wide",
  openPeriod = true,
}: {
  config: StatHeaderConfig;
  lines: StatGraphLine[];
  className?: string;
  /** wide = 2:1 (cells, lightbox, panels). tall = fills the Spatial Twin box. */
  shape?: "wide" | "tall";
  /** The latest period in `lines` is still being captured, so catch-up applies. */
  openPeriod?: boolean;
}) {
  const W = shape === "tall" ? 460 : 560;
  const H = shape === "tall" ? 330 : 280;
  const PAD_L = config.scaleName ? 62 : 44;
  const PAD_B = 50;
  const PAD_T = 14;

  const marks = useMemo(() => scaleAxisMarks(config), [config]);
  const slotLabels = useMemo(
    () => frequencySlotLabels(config, config.frequencyQty),
    [config],
  );

  const perStep = slotTarget(config.periodTarget, config.frequencyQty);
  const targetLabel = perStep !== null ? "T " + fmt(perStep) : "";

  // Room on the right for half the last tick label (it is centered on the
  // last slot) and for the target label, so neither is clipped.
  const lastLabel = slotLabels[slotLabels.length - 1] ?? "";
  const PAD_R = Math.max(
    12,
    Math.ceil((lastLabel.length * TICK_FONT * CHAR_W) / 2) + 4,
    targetLabel ? Math.ceil(targetLabel.length * TICK_FONT * CHAR_W) + 8 : 0,
  );

  const span = config.scaleEnd - config.scaleStart || 1;
  const yFor = (v: number) => {
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
  }, [lines, config, PAD_R, W, H]);

  const dots = useMemo(
    () => lines.map((ln) => ({ x: xFor(ln.slot), y: yFor(ln.value), series: ln.series })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lines, config, PAD_R, W, H],
  );

  // Catch-up pace on the latest period in this graph.
  const pace = useMemo(() => {
    if (perStep === null || !lines.length) return null;
    const latest = Math.max(...lines.map((ln) => ln.series));
    const periodLines = lines.filter((ln) => ln.series === latest);
    const progress = statPeriodProgress(config, periodLines, openPeriod);
    if (!progress || progress.needed === null) return null;
    const last = periodLines.reduce((a, b) => (b.slot > a.slot ? b : a));
    const pinned = progress.needed > config.scaleEnd;
    const y = yFor(Math.min(progress.needed, config.scaleEnd));
    const first = progress.lastSlot + 1;
    const slots = Array.from({ length: config.frequencyQty - first }, (_, i) => first + i);
    return {
      d: `M ${xFor(last.slot).toFixed(1)} ${yFor(last.value).toFixed(1)} L ${xFor(first).toFixed(1)} ${y.toFixed(1)} L ${xFor(config.frequencyQty - 1).toFixed(1)} ${y.toFixed(1)}`,
      y,
      slots,
      label: pinned
        ? fmt(progress.needed) + " · off scale"
        : fmt(progress.needed) + " / " + frequencyTypeLabel(config.frequencyType).toLowerCase(),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, config, openPeriod, perStep, PAD_R, W, H]);

  const targetY =
    perStep !== null ? yFor(Math.min(Math.max(perStep, config.scaleStart), config.scaleEnd)) : null;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className ?? "w-full"}
      role="img"
      aria-label={
        `Statistic graph: scale ${config.scaleStart} to ${config.scaleEnd} by ${config.scaleStep}, frequency ${config.frequencyType} from ${config.frequencyStart} for ${config.frequencyQty} steps` +
        (perStep !== null ? `, target ${fmt(perStep)} per step` : "") +
        (pace ? `, ${pace.label} needed per step to reach the period target` : "")
      }
    >
      {config.scaleName ? (
        <text
          transform={`rotate(-90 ${14} ${PAD_T + (H - PAD_T - PAD_B) / 2})`}
          x={14}
          y={PAD_T + (H - PAD_T - PAD_B) / 2}
          textAnchor="middle"
          fontSize={11}
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
            <text x={PAD_L - 8} y={y + 3} textAnchor="end" fontSize={TICK_FONT} fill="currentColor" fillOpacity={0.55}>
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
            <text x={x} y={H - PAD_B + 13} textAnchor="middle" fontSize={TICK_FONT} fill="currentColor" fillOpacity={0.55}>
              {label}
            </text>
          </g>
        );
      })}
      <text
        x={(PAD_L + W - PAD_R) / 2}
        y={H - 8}
        textAnchor="middle"
        fontSize={TICK_FONT}
        fill="currentColor"
        fillOpacity={0.65}
      >
        {frequencyWindowCaption(config)}
      </text>
      {/* axes */}
      <line x1={PAD_L} x2={PAD_L} y1={PAD_T} y2={H - PAD_B} stroke="currentColor" strokeOpacity={0.3} />
      <line x1={PAD_L} x2={W - PAD_R} y1={H - PAD_B} y2={H - PAD_B} stroke="currentColor" strokeOpacity={0.3} />
      {/* target line (Period target / Frequency quantity) */}
      {targetY !== null ? (
        <g>
          <line x1={PAD_L} x2={W - PAD_R} y1={targetY} y2={targetY} stroke={STAT_TARGET_COLOR} strokeWidth={1.6} />
          <text x={W - PAD_R + 4} y={targetY + 3} fontSize={TICK_FONT} fontWeight={700} fill={STAT_TARGET_COLOR}>
            {targetLabel}
          </text>
        </g>
      ) : null}
      {/* catch-up pace for the steps left in the open period */}
      {pace ? (
        <g>
          <path d={pace.d} fill="none" stroke={STAT_PACE_COLOR} strokeWidth={1.6} strokeDasharray="5 4" />
          {pace.slots.map((slot) => (
            <circle
              key={"pace" + slot}
              cx={xFor(slot)}
              cy={pace.y}
              r={4}
              fill="var(--card, #fff)"
              stroke={STAT_PACE_COLOR}
              strokeWidth={2}
            />
          ))}
          <text
            x={xFor(config.frequencyQty - 1) - 6}
            y={pace.y - 9 >= PAD_T + 8 ? pace.y - 9 : pace.y + 17}
            textAnchor="end"
            fontSize={TICK_FONT}
            fontWeight={700}
            fill={STAT_PACE_COLOR}
          >
            {pace.label}
          </text>
        </g>
      ) : null}
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
