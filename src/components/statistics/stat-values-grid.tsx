"use client";

/**
 * Statistics values editors (1.0.12, S-18).
 *
 * The values of a statistic are its stat_line rows: one per (series, slot).
 * Series 1 is pre-seeded empty from the header; Dynamic Series opens the next
 * series when a period is full. The header drives which rows exist, so these
 * editors change VALUES only. They never add or delete steps.
 *
 * Two views of the same rows, picked with the mode switch:
 * - Table: the listing table, with the Value column editable in place
 *   (StatValueCell). No Edit form, no Update row / Cancel, no Delete.
 * - Enhanced UI: one cell per step for one period at a time (StatValuesGrid).
 *   Enter saves and moves to the next step. The Spatial Twin redraws while
 *   the operator types or drags.
 *
 * Both save through the parent's `onSave`, which calls the capture API, so
 * the UI and monitoring scripts share one validation layer.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Sparkles, Table2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ListingBadge } from "@/components/ui/kind-badge";
import { NumberScrubInput } from "@/components/ui/number-scrub-input";
import { STAT_PACE_COLOR, type StatGraphLine } from "@/components/statistics/stat-graph";
import {
  frequencyTypeLabel,
  openSeriesNumber,
  statPeriodProgress,
  statValueSteps,
  type StatHeaderConfig,
} from "@/lib/statistics/model";
import {
  configForSeries,
  formatStamp,
  frequencySlotLabels,
  frequencyWindowCaption,
  parseStartDatetime,
  stampForSlot,
} from "@/lib/statistics/frequency";
import { cn } from "@/lib/utils";

/** One stat_line row as the editors see it. `value` is "" while empty. */
export type StatValueLine = { id: string; series: number; slot: number; value: string };

/** Save one value ("" clears it). Resolves to an error message, or null when saved. */
export type StatValueSave = (
  target: { lineId?: string; series: number; slot: number },
  raw: string,
) => Promise<string | null>;

export type StatValuesMode = "table" | "enhanced";

const MODE_KEY = "vba.stat-values.mode";

/** Per-viewer choice of values view. Table until the viewer picks Enhanced UI. */
export function useStatValuesMode(): [StatValuesMode, (mode: StatValuesMode) => void] {
  const [mode, setMode] = useState<StatValuesMode>("table");
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read the stored choice after hydration
      if (window.localStorage.getItem(MODE_KEY) === "enhanced") setMode("enhanced");
    } catch {
      /* storage blocked: stay on Table */
    }
  }, []);
  const choose = useCallback((next: StatValuesMode) => {
    setMode(next);
    try {
      window.localStorage.setItem(MODE_KEY, next);
    } catch {
      /* storage blocked: the choice lasts for this page only */
    }
  }, []);
  return [mode, choose];
}

export function StatValuesModeSwitch({
  mode,
  onChange,
  accent,
}: {
  mode: StatValuesMode;
  onChange: (mode: StatValuesMode) => void;
  accent: string;
}) {
  const item = (value: StatValuesMode, label: string, Icon: typeof Table2) => {
    const on = mode === value;
    return (
      <button
        type="button"
        aria-pressed={on}
        onClick={() => onChange(value)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
          on ? "text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
        style={on ? { backgroundColor: accent } : undefined}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </button>
    );
  };
  return (
    <div
      role="group"
      aria-label="Values view"
      className="inline-flex items-center gap-0.5 rounded-md border border-border bg-background p-0.5"
    >
      {item("table", "Table", Table2)}
      {item("enhanced", "Enhanced UI", Sparkles)}
    </div>
  );
}

/** Text shown in an input for a stored value ("14.00" -> "14"). */
function shownValue(raw: string): string {
  const text = raw.trim();
  if (!text) return "";
  const n = Number(text);
  return Number.isFinite(n) ? String(n) : text;
}

/** Same scale rule as the capture API. "" (clear) is always allowed. */
function valueError(text: string, config: StatHeaderConfig): string | null {
  if (text === "") return null;
  const n = Number(text);
  if (!Number.isFinite(n)) return "Enter a number.";
  if (n < config.scaleStart || n > config.scaleEnd) {
    return `Scale is ${config.scaleStart} to ${config.scaleEnd}.`;
  }
  return null;
}

/** Table view: the Value cell, editable in place. */
export function StatValueCell({
  line,
  config,
  onSave,
  label,
}: {
  line: StatValueLine;
  config: StatHeaderConfig;
  onSave: StatValueSave;
  label: string;
}) {
  const saved = shownValue(line.value);
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState("");
  const pending = useRef<string | null>(null);
  const { step, dragStep } = statValueSteps(config);

  const commit = async (raw: string) => {
    const text = raw.trim();
    if (text === saved) {
      setDraft(null);
      setError("");
      return;
    }
    const problem = valueError(text, config);
    if (problem) {
      setError(problem);
      return;
    }
    if (pending.current === text) return;
    pending.current = text;
    const failed = await onSave({ lineId: line.id, series: line.series, slot: line.slot }, text);
    pending.current = null;
    if (failed) {
      setError(failed);
      return;
    }
    setDraft(null);
    setError("");
  };

  return (
    <div className="w-36 space-y-1">
      <NumberScrubInput
        size="sm"
        value={draft ?? saved}
        placeholder="–"
        ariaLabel={`${label} value`}
        min={config.scaleStart}
        max={config.scaleEnd}
        step={step}
        dragStep={dragStep}
        invalid={!!error}
        onChange={(next) => {
          setDraft(next);
          setError("");
        }}
        onCommit={(next) => void commit(next)}
        onCancel={() => {
          setDraft(null);
          setError("");
        }}
      />
      {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
    </div>
  );
}

const fmtNum = (n: number) => String(Math.round(n * 100) / 100);

/** Enhanced UI: one cell per step for one period. */
export function StatValuesGrid({
  config,
  lines,
  accent,
  onSave,
  onLiveLines,
  headerControls,
}: {
  config: StatHeaderConfig;
  lines: StatValueLine[];
  accent: string;
  onSave: StatValueSave;
  /** Live graph points (saved values with the typing on top), or null when nothing is typed. */
  onLiveLines?: (lines: StatGraphLine[] | null) => void;
  /** Mode switch and anything else for the header's right side. */
  headerControls?: ReactNode;
}) {
  const qty = config.frequencyQty;
  const { step, dragStep } = statValueSteps(config);
  const keyOf = (series: number, slot: number) => series + ":" + slot;

  const byKey = useMemo(() => {
    const map = new Map<string, StatValueLine>();
    for (const ln of lines) map.set(keyOf(ln.series, ln.slot), ln);
    return map;
  }, [lines]);

  const open = useMemo(
    () =>
      openSeriesNumber(
        lines.filter((ln) => ln.value.trim() !== "").map((ln) => ({ series: ln.series, slot: ln.slot })),
        qty,
        config.seriesMode,
      ),
    [lines, qty, config.seriesMode],
  );
  const periods = useMemo(() => {
    if (config.seriesMode === "single") return [1];
    const set = new Set<number>(lines.map((ln) => ln.series));
    set.add(open);
    return [...set].filter((n) => Number.isInteger(n) && n > 0).sort((a, b) => a - b);
  }, [lines, open, config.seriesMode]);

  const [picked, setPicked] = useState<number | null>(null);
  const viewed = picked !== null && periods.includes(picked) ? picked : open;
  const index = periods.indexOf(viewed);

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Saved / error messages sit in the card header, so the boxes never change size.
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const inflight = useRef(new Set<string>());
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const focusAfter = useRef<{ series: number; slot: number } | null>(null);

  useEffect(() => {
    const want = focusAfter.current;
    if (!want || want.series !== viewed) return;
    focusAfter.current = null;
    const el = inputs.current[want.slot];
    el?.focus();
    el?.select();
  });

  useEffect(() => {
    if (status?.tone !== "ok") return;
    const t = setTimeout(() => setStatus(null), 2000);
    return () => clearTimeout(t);
  }, [status]);

  const savedText = (series: number, slot: number) => shownValue(byKey.get(keyOf(series, slot))?.value ?? "");

  // Saved values with the typing on top, for the twin and the summary.
  const liveLines = useMemo(() => {
    const map = new Map<string, StatGraphLine>();
    for (const ln of lines) {
      const n = Number(ln.value);
      if (ln.value.trim() !== "" && Number.isFinite(n)) {
        map.set(keyOf(ln.series, ln.slot), { series: ln.series, slot: ln.slot, value: n });
      }
    }
    for (const [key, raw] of Object.entries(drafts)) {
      const [series, slot] = key.split(":").map(Number);
      const text = raw.trim();
      if (text === "") {
        map.delete(key);
        continue;
      }
      if (valueError(text, config)) continue;
      map.set(key, { series, slot, value: Number(text) });
    }
    return [...map.values()];
  }, [lines, drafts, config]);

  const hasDrafts = Object.keys(drafts).length > 0;
  useEffect(() => {
    onLiveLines?.(hasDrafts ? liveLines : null);
  }, [hasDrafts, liveLines, onLiveLines]);
  useEffect(() => () => onLiveLines?.(null), [onLiveLines]);

  const dropDraft = (key: string) => {
    setDrafts((d) => {
      if (!(key in d)) return d;
      const next = { ...d };
      delete next[key];
      return next;
    });
    setErrors((e) => {
      if (!(key in e)) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  const moveOn = (slot: number, filledNow: boolean) => {
    if (slot + 1 < qty) {
      inputs.current[slot + 1]?.focus();
      inputs.current[slot + 1]?.select();
      return;
    }
    // Last step: a full period opens the next one (Dynamic Series).
    if (config.seriesMode !== "dynamic") return;
    let full = true;
    for (let s = 0; s < qty; s++) {
      const has = s === slot ? filledNow : savedText(viewed, s) !== "";
      if (!has) full = false;
    }
    if (!full) return;
    focusAfter.current = { series: viewed + 1, slot: 0 };
    setPicked(viewed + 1);
  };

  const commit = async (slot: number, raw: string, via: "enter" | "blur" | "scroller") => {
    const series = viewed;
    const key = keyOf(series, slot);
    const line = byKey.get(key);
    const text = raw.trim();
    const saved = savedText(series, slot);
    if (text === saved || (text === "" && !line)) {
      dropDraft(key);
      if (via === "enter") moveOn(slot, text !== "");
      return;
    }
    const problem = valueError(text, config);
    if (problem) {
      setErrors((e) => ({ ...e, [key]: problem }));
      setStatus({ tone: "error", text: `${labels[slot] ?? "Step"}: ${problem}` });
      return;
    }
    if (inflight.current.has(key)) return;
    inflight.current.add(key);
    const failed = await onSave({ lineId: line?.id, series, slot }, text);
    inflight.current.delete(key);
    if (failed) {
      setErrors((e) => ({ ...e, [key]: failed }));
      setStatus({ tone: "error", text: `${labels[slot] ?? "Step"}: ${failed}` });
      return;
    }
    dropDraft(key);
    setStatus({
      tone: "ok",
      text: text === "" ? `Cleared ${labels[slot] ?? ""}` : `Saved ${labels[slot] ?? ""} = ${text}`,
    });
    if (via === "enter") moveOn(slot, text !== "");
  };

  /** Trash: the step goes back to empty (a gap), which is not the same as 0. */
  const clear = (slot: number) => void commit(slot, "", "scroller");

  const seriesConfig = configForSeries(config, viewed);
  const labels = frequencySlotLabels(seriesConfig, qty);
  const start = parseStartDatetime(config.startDatetime);
  let nextEmpty = -1;
  for (let s = 0; s < qty; s++) {
    if (savedText(viewed, s) === "") {
      nextEmpty = s;
      break;
    }
  }

  const progress = statPeriodProgress(
    config,
    liveLines.filter((ln) => ln.series === viewed),
    viewed === open,
  );
  const stepWord = frequencyTypeLabel(config.frequencyType).toLowerCase();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold">Values · {frequencyTypeLabel(config.frequencyType)}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {periods.length > 1 ? (
                <span className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Previous period"
                    disabled={index <= 0}
                    onClick={() => setPicked(periods[index - 1] ?? viewed)}
                    className="rounded border border-border p-0.5 hover:bg-muted disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <span className="tabular-nums">
                    Period {index + 1} of {periods.length}
                  </span>
                  <button
                    type="button"
                    aria-label="Next period"
                    disabled={index >= periods.length - 1}
                    onClick={() => setPicked(periods[index + 1] ?? viewed)}
                    className="rounded border border-border p-0.5 hover:bg-muted disabled:opacity-40"
                  >
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </span>
              ) : null}
              <span>{frequencyWindowCaption(seriesConfig)}</span>
            </div>
            {progress ? (
              <p className="text-xs tabular-nums text-muted-foreground">
                Met <b className="text-foreground">{fmtNum(progress.met)}</b> of {fmtNum(progress.quota)}
                {progress.over > 0 ? (
                  <> · Over <b className="text-foreground">+{fmtNum(progress.over)}</b></>
                ) : (
                  <> · Short <b className="text-destructive">{fmtNum(progress.short)}</b></>
                )}
                {progress.needed !== null ? (
                  <>
                    {" "}· Needed{" "}
                    <b style={{ color: STAT_PACE_COLOR }}>
                      {fmtNum(progress.needed)} / {stepWord}
                    </b>
                  </>
                ) : null}
              </p>
            ) : null}
            <p
              role="status"
              aria-live="polite"
              className={cn(
                "min-h-4 text-xs",
                status?.tone === "error" ? "text-destructive" : "text-emerald-600 dark:text-emerald-400",
              )}
            >
              {status?.text ?? ""}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {headerControls}
            <ListingBadge label="Dynamic Record" accent={accent} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(7.5rem,1fr))]">
          {labels.map((label, slot) => {
            const key = keyOf(viewed, slot);
            const saved = savedText(viewed, slot);
            const error = errors[key];
            const isNext = slot === nextEmpty;
            const stamp = start
              ? formatStamp(stampForSlot(start, config.frequencyType, viewed, slot, qty))
              : "";
            const id = `stat-value-${viewed}-${slot}`;
            return (
              <div
                key={key}
                className={cn(
                  "grid min-w-0 gap-1 rounded-lg border border-border p-2",
                  saved !== "" && "bg-muted/40",
                  error && "border-destructive",
                )}
                style={isNext && !error ? { borderColor: accent, boxShadow: `inset 0 0 0 1px ${accent}` } : undefined}
              >
                <div className="flex min-w-0 items-start justify-between gap-1">
                  <label htmlFor={id} className="truncate text-xs font-semibold" title={label}>
                    {label}
                  </label>
                  {saved !== "" ? (
                    <button
                      type="button"
                      aria-label={`Clear ${label}`}
                      title="Clear this value (leaves a gap; 0 is a value)"
                      onClick={() => clear(slot)}
                      className="-mr-1 -mt-0.5 shrink-0 rounded p-0.5 text-muted-foreground opacity-60 hover:bg-destructive/10 hover:text-destructive hover:opacity-100 focus-visible:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  ) : (
                    <span className="h-[1.125rem] w-[1.125rem] shrink-0" aria-hidden />
                  )}
                </div>
                <span className="text-[10px] leading-tight text-muted-foreground">
                  {stamp}
                </span>
                <NumberScrubInput
                  id={id}
                  inputRef={(el) => {
                    inputs.current[slot] = el;
                  }}
                  value={drafts[key] ?? saved}
                  placeholder="–"
                  ariaLabel={`${label} value`}
                  min={config.scaleStart}
                  max={config.scaleEnd}
                  step={step}
                  dragStep={dragStep}
                  invalid={!!error}
                  onChange={(next) => {
                    setDrafts((d) => ({ ...d, [key]: next }));
                    setErrors((e) => {
                      if (!(key in e)) return e;
                      const rest = { ...e };
                      delete rest[key];
                      return rest;
                    });
                  }}
                  onCommit={(next, via) => void commit(slot, next, via)}
                  onCancel={() => dropDraft(key)}
                />
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Enter saves and moves to the next {stepWord} · Esc undoes typing · Arrows: click, hold, or drag up and
          down · Trash clears a value (0 is a value; a cleared step is a gap) · Scale {config.scaleStart} to{" "}
          {config.scaleEnd}
        </p>
      </CardContent>
    </Card>
  );
}
