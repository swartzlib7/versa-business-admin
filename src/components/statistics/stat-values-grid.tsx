"use client";

/**
 * Statistics values editors (1.0.12, S-18).
 *
 * The values of a statistic are its stat_line rows: one per (series, slot).
 * Series 1 is pre-seeded empty from the header; Dynamic Series opens the next
 * series when a period is full.
 *
 * Two views of the same rows, picked with the mode switch:
 * - Table: the listing table, with the Value column editable in place
 *   (StatValueCell). No Edit form or Update row / Cancel. Rows are added with
 *   Add row and removed with the row's trash icon (1.0.13).
 * - Enhanced UI (StatValuesGrid): every period the table holds, stacked and
 *   labelled, one box per step. A step with no row is a dashed box; typing a
 *   value adds the row. Enter saves and moves to the next step. The Spatial
 *   Twin redraws from these values while the operator types or drags.
 *
 * Both save through the parent's `onSave`, which calls the capture API, so
 * the UI and monitoring scripts share one validation layer.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Sparkles, Table2, Trash2 } from "lucide-react";
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
  readOnly = false,
}: {
  line: StatValueLine;
  config: StatHeaderConfig;
  onSave: StatValueSave;
  label: string;
  /** Values fed from records (1.0.14) are shown, not edited. */
  readOnly?: boolean;
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

  if (readOnly) return <span className="tabular-nums">{saved || "—"}</span>;

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

/** Enhanced UI: every period, stacked, one box per step. */
export function StatValuesGrid({
  config,
  lines,
  accent,
  onSave,
  onLiveLines,
  onFocusPeriod,
  headerControls,
  fedFrom,
}: {
  config: StatHeaderConfig;
  lines: StatValueLine[];
  accent: string;
  onSave: StatValueSave;
  /** The operator moved into a box of this period (the twin pages to it). */
  onFocusPeriod?: (series: number) => void;
  /** Graph points for the twin: saved values with the typing on top. null when the grid closes. */
  onLiveLines?: (lines: StatGraphLine[] | null) => void;
  /** Mode switch and anything else for the header's right side. */
  headerControls?: ReactNode;
  /** 1.0.14: label of the record type the values come from; the boxes are read-only. */
  fedFrom?: string | null;
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
  // Every period that has rows, plus the one still being filled in.
  const periods = useMemo(() => {
    const set = new Set<number>(lines.map((ln) => ln.series));
    if (config.seriesMode === "dynamic" || !set.size) set.add(open);
    return [...set].filter((n) => Number.isInteger(n) && n > 0).sort((a, b) => a - b);
  }, [lines, open, config.seriesMode]);

  const labelsBySeries = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const series of periods) map.set(series, frequencySlotLabels(configForSeries(config, series), qty));
    return map;
  }, [periods, config, qty]);
  const labelFor = (series: number, slot: number) => labelsBySeries.get(series)?.[slot] ?? `Step ${slot + 1}`;

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Saved / error messages sit in the card header, so the boxes never change size.
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const inflight = useRef(new Set<string>());
  // Text saved per box until the new rows arrive. Enter saves, then moving to
  // the next box blurs this one before the screen has the new row; without
  // this the blur would send the same value again (a second POST is refused).
  const justSaved = useRef(new Map<string, string>());
  useEffect(() => {
    justSaved.current.clear();
  }, [lines]);
  const inputs = useRef(new Map<string, HTMLInputElement>());
  const focusAfter = useRef<string | null>(null);

  const focusKey = (key: string) => {
    const el = inputs.current.get(key);
    if (!el) return false;
    el.focus();
    el.select();
    return true;
  };
  useEffect(() => {
    if (focusAfter.current && focusKey(focusAfter.current)) focusAfter.current = null;
  });

  useEffect(() => {
    if (status?.tone !== "ok") return;
    const t = setTimeout(() => setStatus(null), 2000);
    return () => clearTimeout(t);
  }, [status]);

  const savedText = (series: number, slot: number) => shownValue(byKey.get(keyOf(series, slot))?.value ?? "");

  // Saved values with the typing on top, for the twin and the period lines.
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

  // The twin draws from these values the whole time the grid is open, so a
  // save never makes it blank out while it re-reads the lines.
  useEffect(() => {
    onLiveLines?.(liveLines);
  }, [liveLines, onLiveLines]);
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

  const moveOn = (series: number, slot: number, filledNow: boolean) => {
    if (slot + 1 < qty) {
      focusKey(keyOf(series, slot + 1));
      return;
    }
    if (periods.includes(series + 1)) {
      focusKey(keyOf(series + 1, 0));
      return;
    }
    // Last step of the last period: a full period opens the next one (Dynamic Series).
    if (config.seriesMode !== "dynamic") return;
    for (let s = 0; s < qty; s++) {
      const has = s === slot ? filledNow : savedText(series, s) !== "";
      if (!has) return;
    }
    focusAfter.current = keyOf(series + 1, 0);
  };

  const commit = async (series: number, slot: number, raw: string, via: "enter" | "blur" | "scroller") => {
    const key = keyOf(series, slot);
    const line = byKey.get(key);
    const text = raw.trim();
    const saved = savedText(series, slot);
    const label = labelFor(series, slot);
    if (text === saved || justSaved.current.get(key) === text || (text === "" && !line)) {
      dropDraft(key);
      if (via === "enter") moveOn(series, slot, text !== "");
      return;
    }
    const problem = valueError(text, config);
    if (problem) {
      setErrors((e) => ({ ...e, [key]: problem }));
      setStatus({ tone: "error", text: `Period ${series}, ${label}: ${problem}` });
      return;
    }
    if (inflight.current.has(key)) return;
    inflight.current.add(key);
    const failed = await onSave({ lineId: line?.id, series, slot }, text);
    inflight.current.delete(key);
    if (failed) {
      setErrors((e) => ({ ...e, [key]: failed }));
      setStatus({ tone: "error", text: `Period ${series}, ${label}: ${failed}` });
      return;
    }
    justSaved.current.set(key, text);
    dropDraft(key);
    setStatus({
      tone: "ok",
      text: text === "" ? `Cleared period ${series}, ${label}` : `Saved period ${series}, ${label} = ${text}`,
    });
    if (via === "enter") moveOn(series, slot, text !== "");
  };

  /** Trash: the step goes back to empty (a gap), which is not the same as 0. */
  const clear = (series: number, slot: number) => void commit(series, slot, "", "scroller");

  const start = parseStartDatetime(config.startDatetime);
  const stepWord = frequencyTypeLabel(config.frequencyType).toLowerCase();
  let nextKey = "";
  for (let s = 0; s < qty && !nextKey; s++) {
    if (savedText(open, s) === "") nextKey = keyOf(open, s);
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold">
              Values · {frequencyTypeLabel(config.frequencyType)}
              <span className="ml-2 font-normal text-muted-foreground">
                {periods.length} period{periods.length === 1 ? "" : "s"}
              </span>
            </p>
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
            {fedFrom ? (
              <p className="text-xs text-muted-foreground">
                Values come from the lines of {fedFrom} and update when those records change.
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {headerControls}
            <ListingBadge label="Dynamic Record" accent={accent} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-4">
        {periods.map((series) => {
          const seriesConfig = configForSeries(config, series);
          const progress = statPeriodProgress(
            config,
            liveLines.filter((ln) => ln.series === series),
            series === open,
          );
          return (
            <section key={series} aria-label={`Period ${series}`} className="space-y-2">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs">
                <span className="text-sm font-semibold">Period {series}</span>
                <span className="text-muted-foreground">{frequencyWindowCaption(seriesConfig)}</span>
                {progress ? (
                  <span className="tabular-nums text-muted-foreground">
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
                  </span>
                ) : null}
              </div>
              <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(7.5rem,1fr))]">
                {Array.from({ length: qty }, (_, slot) => {
                  const key = keyOf(series, slot);
                  const label = labelFor(series, slot);
                  const line = byKey.get(key);
                  const saved = savedText(series, slot);
                  const error = errors[key];
                  const isNext = key === nextKey;
                  const stamp = start
                    ? formatStamp(stampForSlot(start, config.frequencyType, series, slot, qty))
                    : "";
                  const id = `stat-value-${series}-${slot}`;
                  return (
                    <div
                      key={key}
                      title={line ? undefined : "No row for this step yet. Type a value to add it."}
                      className={cn(
                        "grid min-w-0 gap-1 rounded-lg border p-2",
                        line ? "border-border" : "border-dashed border-border/80",
                        saved !== "" && "bg-muted/40",
                        error && "border-destructive",
                      )}
                      style={isNext && !error ? { borderColor: accent, boxShadow: `inset 0 0 0 1px ${accent}` } : undefined}
                    >
                      <div className="flex min-w-0 items-start justify-between gap-1">
                        <label htmlFor={id} className="truncate text-xs font-semibold" title={label}>
                          {label}
                        </label>
                        {saved !== "" && !fedFrom ? (
                          <button
                            type="button"
                            aria-label={`Clear period ${series}, ${label}`}
                            title="Clear this value (leaves a gap; 0 is a value)"
                            onClick={() => clear(series, slot)}
                            className="-mr-1 -mt-0.5 shrink-0 rounded p-0.5 text-muted-foreground opacity-60 hover:bg-destructive/10 hover:text-destructive hover:opacity-100 focus-visible:opacity-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        ) : (
                          <span className="h-[1.125rem] w-[1.125rem] shrink-0" aria-hidden />
                        )}
                      </div>
                      <span className="text-[10px] leading-tight text-muted-foreground">{stamp}</span>
                      <NumberScrubInput
                        id={id}
                        disabled={!!fedFrom}
                        inputRef={(el) => {
                          if (el) inputs.current.set(key, el);
                          else inputs.current.delete(key);
                        }}
                        value={drafts[key] ?? saved}
                        placeholder="–"
                        ariaLabel={`Period ${series}, ${label} value`}
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
                        onCommit={(next, via) => void commit(series, slot, next, via)}
                        onCancel={() => dropDraft(key)}
                        onFocus={() => onFocusPeriod?.(series)}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
        <p className="text-[11px] text-muted-foreground">
          Enter saves and moves to the next {stepWord} · Esc undoes typing · Arrows: click, hold, or drag up and
          down · Trash clears a value (0 is a value; a cleared step is a gap) · A dashed box has no row yet: type a
          value to add it · Delete rows in Table · Scale {config.scaleStart} to {config.scaleEnd}
        </p>
      </CardContent>
    </Card>
  );
}
