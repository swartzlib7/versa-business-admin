"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { cn } from "@/lib/utils";
import {
  depthOf,
  isActionable,
  isOverdue,
  mapLegacyTaskStatus,
  type TaskLine,
  type TaskLineStatus,
} from "@/lib/records/project-task-lines";

export type ProjectGanttPreview = {
  kind: "project-gantt";
  name: string;
  status: string;
  owner: string;
  startDate: string;
  targetDate: string;
  lines: TaskLine[];
};

/** One builder for the open-Project view and the Projects list radio. */
export function projectGanttPreview(
  inst: { name?: string; status?: string; data?: Record<string, string> },
  lines: TaskLine[],
): ProjectGanttPreview {
  const data = inst.data ?? {};
  return {
    kind: "project-gantt",
    name: inst.name || data.name || "",
    status: inst.status || data.status || "",
    owner: data.owner_name || "",
    startDate: data.start_date || "",
    targetDate: data.target_date || "",
    lines,
  };
}

const STATUS_STYLE: Record<TaskLineStatus, { label: string; dot: string; track: string; fill: string }> = {
  todo: { label: "To do", dot: "bg-slate-400", track: "bg-slate-400/20 border-slate-400/60", fill: "bg-slate-400" },
  in_progress: { label: "In progress", dot: "bg-sky-500", track: "bg-sky-500/15 border-sky-500/60", fill: "bg-sky-500" },
  waiting: { label: "Waiting", dot: "bg-amber-500", track: "bg-amber-500/15 border-amber-500/60", fill: "bg-amber-500" },
  blocked: { label: "Blocked", dot: "bg-rose-500", track: "bg-rose-500/15 border-rose-500/60", fill: "bg-rose-500" },
  done: { label: "Done", dot: "bg-emerald-500", track: "bg-emerald-500/15 border-emerald-500/60", fill: "bg-emerald-500" },
};

const DAY_MS = 86_400_000;
const HEADER_H = 32;
const ROW_H = 36;
/** Pixels between axis labels, the gap kept clear around Today, and the pane width below which the percent column hides. */
const LABEL_GAP_PX = 52;
const TODAY_CLEAR_PX = 28;
const COMPACT_PX = 520;

/** Width of an element; `mounted` re-attaches when a conditionally rendered element appears. */
function useWidth(ref: RefObject<HTMLElement | null>, mounted = true): number {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || !mounted) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, mounted]);
  return width;
}

function dayOf(date: string): number | null {
  if (!date) return null;
  const ms = Date.parse(`${date.slice(0, 10)}T00:00:00Z`);
  return Number.isFinite(ms) ? Math.round(ms / DAY_MS) : null;
}

function isoOf(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

function shortDate(day: number): string {
  return new Date(day * DAY_MS).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

type Row = {
  line: TaskLine;
  depth: number;
  status: TaskLineStatus;
  percent: number;
  overdue: boolean;
  /** Start and end day; start is the parent's due date or the Project start. */
  begin: number | null;
  end: number | null;
  /** Due date falls before the date the bar starts from. */
  inverted: boolean;
};

type Tick = { day: number; label: string };

/** Axis ticks sized to the span: days, weeks, months, quarters, or years. */
function ticksFor(min: number, max: number): Tick[] {
  const span = max - min;
  const out: Tick[] = [];
  const at = (d: Date) => Math.round(d.getTime() / DAY_MS);
  if (span <= 14) {
    for (let d = min; d <= max; d++) out.push({ day: d, label: shortDate(d) });
    return out;
  }
  if (span <= 100) {
    const first = new Date(min * DAY_MS);
    first.setUTCDate(first.getUTCDate() + ((8 - first.getUTCDay()) % 7));
    for (let d = at(first); d <= max; d += 7) out.push({ day: d, label: shortDate(d) });
    return out;
  }
  const start = new Date(min * DAY_MS);
  const monthStep = span <= 550 ? 1 : span <= 1600 ? 3 : 12;
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - (start.getUTCMonth() % monthStep) + monthStep, 1));
  while (at(cursor) <= max) {
    const month = cursor.getUTCMonth();
    const year = cursor.getUTCFullYear();
    const label =
      monthStep === 12
        ? String(year)
        : monthStep === 3
          ? `Q${Math.floor(month / 3) + 1} ${year}`
          : cursor.toLocaleDateString(undefined, { month: "short", timeZone: "UTC" }) + (month === 0 ? ` ${year}` : "");
    out.push({ day: at(cursor), label });
    cursor.setUTCMonth(month + monthStep);
  }
  return out;
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "alert" }) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-background/60 px-2.5 py-1.5">
      <div className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("text-base font-semibold tabular-nums", tone === "alert" && "text-rose-600 dark:text-rose-400")}>
        {value}
      </div>
    </div>
  );
}

/** Summary and Gantt for one Project. Uses the Spatial Twin slot. */
export function ProjectGanttPreviewView({ preview }: { preview: ProjectGanttPreview }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const rootWidth = useWidth(rootRef);
  const timelineWidth = useWidth(timelineRef, preview.lines.length > 0);
  const compact = rootWidth > 0 && rootWidth < COMPACT_PX;
  const todayIso = new Date().toISOString().slice(0, 10);
  const today = dayOf(todayIso)!;
  const lines = preview.lines;
  const projectStart = dayOf(preview.startDate);
  const projectTarget = dayOf(preview.targetDate);

  const rows: Row[] = lines.map((line) => {
    const parent = lines.find((row) => row.id === (line.data.task_parent_id || "").trim());
    const due = dayOf(line.data.task_due_date || "");
    const from = dayOf(parent?.data.task_due_date || "") ?? projectStart ?? due;
    const inverted = due != null && from != null && due < from;
    return {
      line,
      depth: depthOf(line.id, lines),
      status: mapLegacyTaskStatus(line.data.task_status || "todo"),
      percent: Math.max(0, Math.min(100, Number(line.data.task_percent || "0") || 0)),
      overdue: isOverdue(line, todayIso),
      begin: due == null ? null : Math.min(from ?? due, due),
      end: due == null ? null : Math.max(from ?? due, due),
      inverted,
    };
  });

  const days = [
    ...rows.flatMap((row) => (row.begin == null ? [] : [row.begin, row.end!])),
    ...(projectStart != null ? [projectStart] : []),
    ...(projectTarget != null ? [projectTarget] : []),
    today,
  ];
  const rawMin = Math.min(...days);
  const rawMax = Math.max(...days);
  const pad = Math.max(1, Math.round((rawMax - rawMin) * 0.04));
  const min = rawMin - pad;
  const max = rawMax + pad;
  const span = Math.max(max - min, 1);
  const x = (day: number) => ((day - min) / span) * 100;
  const ticks = ticksFor(min, max);
  const showToday = today >= min && today <= max;
  const todayPx = showToday ? (x(today) / 100) * timelineWidth : null;
  const labeled = new Set<number>();
  for (let i = 0, lastPx = -Infinity; i < ticks.length; i++) {
    const px = (x(ticks[i].day) / 100) * timelineWidth;
    if (px < 0 || px > timelineWidth - LABEL_GAP_PX * 0.6) continue;
    if (todayPx != null && Math.abs(px - todayPx) < TODAY_CLEAR_PX) continue;
    if (px - lastPx < LABEL_GAP_PX) continue;
    lastPx = px;
    labeled.add(ticks[i].day);
  }

  const overdue = rows.filter((row) => row.overdue).length;
  const waiting = lines.filter((line) => !isActionable(line, lines)).length;
  const complete = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.percent, 0) / rows.length) : 0;
  const bodyH = rows.length * ROW_H;

  return (
    <div ref={rootRef} className="flex h-full flex-col gap-3 overflow-auto p-3 text-sm">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold">{preview.name || "Project"}</h3>
          {preview.status ? (
            <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] capitalize text-muted-foreground">
              {preview.status.replace(/_/g, " ")}
            </span>
          ) : null}
        </div>
        <div className="text-xs text-muted-foreground">
          {[
            preview.owner,
            projectStart != null || projectTarget != null
              ? `${projectStart != null ? shortDate(projectStart) : "—"} → ${projectTarget != null ? shortDate(projectTarget) : "—"}`
              : "",
          ]
            .filter(Boolean)
            .join(" · ")}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Kpi label="Tasks" value={String(rows.length)} />
        <Kpi label="Complete" value={`${complete}%`} />
        <Kpi label="Overdue" value={String(overdue)} tone={overdue ? "alert" : undefined} />
        <Kpi label="Waiting" value={String(waiting)} />
      </div>

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
          No tasks on this Project yet.
        </p>
      ) : (
        <div className="flex overflow-hidden rounded-md border border-border bg-background/60 text-xs">
          <div className={cn("min-w-[120px] shrink-0 border-r border-border", compact ? "w-[46%]" : "w-[38%]")}>
            <div
              className="flex items-center border-b border-border px-2 font-medium text-muted-foreground"
              style={{ height: HEADER_H }}
            >
              Task
            </div>
            {rows.map((row, index) => (
              <div
                key={row.line.id}
                className={cn("flex items-center gap-1.5 pr-2", index % 2 === 1 && "bg-muted/30")}
                style={{ height: ROW_H, paddingLeft: 8 + (row.depth - 1) * 12 }}
                title={row.line.data.task_title || "Task"}
              >
                <span className={cn("h-2 w-2 shrink-0 rounded-full", STATUS_STYLE[row.status].dot)} />
                <span className={cn("min-w-0 flex-1 truncate", row.depth === 1 && "font-medium")}>
                  {row.line.data.task_title || "Task"}
                </span>
                {compact ? null : (
                  <span className="shrink-0 tabular-nums text-muted-foreground">{row.percent}%</span>
                )}
              </div>
            ))}
          </div>

          <div ref={timelineRef} className="relative min-w-0 flex-1">
            <div className="relative border-b border-border" style={{ height: HEADER_H }}>
              {ticks.filter((tick) => labeled.has(tick.day)).map((tick) => (
                <span
                  key={tick.day}
                  className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap pl-1 text-[10px] text-muted-foreground"
                  style={{ left: `${x(tick.day)}%` }}
                >
                  {tick.label}
                </span>
              ))}
            </div>

            <div className="relative" style={{ height: bodyH }}>
              {rows.map((row, index) =>
                index % 2 === 1 ? (
                  <div
                    key={`band-${row.line.id}`}
                    className="absolute inset-x-0 bg-muted/30"
                    style={{ top: index * ROW_H, height: ROW_H }}
                  />
                ) : null,
              )}
              {ticks.map((tick) => (
                <div
                  key={`grid-${tick.day}`}
                  className="absolute inset-y-0 w-px bg-border/70"
                  style={{ left: `${x(tick.day)}%` }}
                />
              ))}
              {projectTarget != null ? (
                <div
                  className="absolute inset-y-0 border-l border-dashed border-foreground/40"
                  style={{ left: `${x(projectTarget)}%` }}
                  title={`Target ${isoOf(projectTarget)}`}
                />
              ) : null}

              {rows.map((row, index) => {
                const style = STATUS_STYLE[row.status];
                const top = index * ROW_H;
                if (row.begin == null || row.end == null) {
                  return (
                    <div
                      key={row.line.id}
                      className="absolute left-2 flex items-center italic text-muted-foreground"
                      style={{ top, height: ROW_H }}
                    >
                      No due date
                    </div>
                  );
                }
                const left = x(row.begin);
                const width = Math.max(x(row.end) - left, 0.8);
                return (
                  <div
                    key={row.line.id}
                    className={cn(
                      "absolute overflow-hidden rounded-sm border",
                      style.track,
                      row.overdue && "ring-2 ring-rose-500/70",
                      row.inverted && "border-dashed",
                    )}
                    style={{ top: top + 9, height: ROW_H - 18, left: `${left}%`, width: `${width}%`, minWidth: 6 }}
                    title={[
                      row.line.data.task_title || "Task",
                      `${isoOf(row.begin)} → ${isoOf(row.end)}`,
                      `${row.percent}%`,
                      style.label,
                      row.overdue ? "Overdue" : "",
                      row.inverted ? "Due before the task it follows" : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  >
                    <div className={cn("h-full", style.fill)} style={{ width: `${row.percent}%` }} />
                  </div>
                );
              })}

              {showToday ? (
                <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-rose-500" style={{ left: `${x(today)}%` }} />
              ) : null}
            </div>
            {showToday ? (
              <span
                className="pointer-events-none absolute -translate-x-1/2 rounded bg-rose-500 px-1 text-[9px] font-medium leading-4 text-white"
                style={{ left: `${x(today)}%`, top: HEADER_H - 8 }}
              >
                Today
              </span>
            ) : null}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
        {(Object.keys(STATUS_STYLE) as TaskLineStatus[]).map((key) => (
          <span key={key} className="inline-flex items-center gap-1">
            <span className={cn("h-2 w-2 rounded-full", STATUS_STYLE[key].dot)} />
            {STATUS_STYLE[key].label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-0.5 bg-rose-500" />
          Today
        </span>
        {projectTarget != null ? (
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 border-l border-dashed border-foreground/40" />
            Target
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-3 rounded-sm ring-2 ring-rose-500/70" />
          Overdue
        </span>
      </div>
    </div>
  );
}
