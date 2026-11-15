"use client";

/**
 * Number input with a scroller (1.0.12, Statistics values).
 *
 * - Type a number, or use the up / down arrows on the right.
 * - Click an arrow for one step. Hold it to keep stepping.
 * - Press an arrow and drag up or down to change the number continuously.
 * - Keyboard: Arrow Up / Down step (Shift x10), Enter commits, Escape cancels.
 *
 * The parent owns the text (`value` / `onChange`). `onCommit` fires on Enter,
 * on blur, and when an arrow click, hold or drag ends.
 */
import { useEffect, useRef, type KeyboardEvent, type PointerEvent, type Ref } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const HOLD_DELAY_MS = 380;
const HOLD_EVERY_MS = 70;
const HOLD_FAST_MS = 30;
const DRAG_START_PX = 4;
const PX_PER_NOTCH = 4;

function decimalsOf(n: number): number {
  const text = String(n);
  const dot = text.indexOf(".");
  return dot < 0 ? 0 : text.length - dot - 1;
}

export function NumberScrubInput({
  value,
  onChange,
  onCommit,
  onCancel,
  onKeyDown,
  min,
  max,
  step = 1,
  dragStep,
  id,
  inputRef,
  ariaLabel,
  placeholder,
  disabled,
  invalid,
  size = "md",
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  onCommit?: (next: string, via: "enter" | "blur" | "scroller") => void;
  onCancel?: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  min?: number;
  max?: number;
  step?: number;
  /** One notch of a drag. Defaults to `step`. */
  dragStep?: number;
  id?: string;
  inputRef?: Ref<HTMLInputElement>;
  ariaLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);

  const places = Math.max(decimalsOf(step), decimalsOf(dragStep ?? step));
  const clamp = (n: number) => {
    let out = n;
    if (min !== undefined && out < min) out = min;
    if (max !== undefined && out > max) out = max;
    return out;
  };
  const toText = (n: number) => String(Number(clamp(n).toFixed(places)));
  const current = () => {
    const n = Number(latest.current.trim());
    return latest.current.trim() !== "" && Number.isFinite(n) ? n : null;
  };
  const set = (n: number) => {
    const text = toText(n);
    latest.current = text;
    onChange(text);
  };
  const bump = (dir: 1 | -1, mult = 1) => {
    const base = current();
    if (base === null) {
      // From empty, the first step lands on the bottom of the scale.
      set(min ?? 0);
      return;
    }
    set(base + dir * step * mult);
  };

  // Press / hold / drag on an arrow.
  const gesture = useRef<{
    dir: 1 | -1;
    startY: number;
    startValue: number;
    dragging: boolean;
    ticks: number;
    timer: ReturnType<typeof setTimeout> | null;
  } | null>(null);

  const stopTimer = () => {
    const g = gesture.current;
    if (g?.timer) clearTimeout(g.timer);
    if (g) g.timer = null;
  };
  useEffect(
    () => () => {
      const g = gesture.current;
      if (g?.timer) clearTimeout(g.timer);
    },
    [],
  );

  const repeat = () => {
    const g = gesture.current;
    if (!g || g.dragging) return;
    bump(g.dir);
    g.ticks += 1;
    g.timer = setTimeout(repeat, g.ticks > 12 ? HOLD_FAST_MS : HOLD_EVERY_MS);
  };

  const onArrowDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (disabled || e.button !== 0) return;
    const dir: 1 | -1 = e.currentTarget.dataset.dir === "down" ? -1 : 1;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const before = current();
    bump(dir);
    gesture.current = {
      dir,
      startY: e.clientY,
      startValue: before ?? min ?? 0,
      dragging: false,
      ticks: 0,
      timer: setTimeout(repeat, HOLD_DELAY_MS),
    };
  };
  const onArrowMove = (e: PointerEvent<HTMLButtonElement>) => {
    const g = gesture.current;
    if (!g) return;
    const dy = e.clientY - g.startY;
    if (!g.dragging && Math.abs(dy) < DRAG_START_PX) return;
    if (!g.dragging) {
      g.dragging = true;
      stopTimer();
    }
    const notches = Math.round(-dy / PX_PER_NOTCH);
    set(g.startValue + notches * (dragStep ?? step));
  };
  const onArrowUp = (e: PointerEvent<HTMLButtonElement>) => {
    if (!gesture.current) return;
    stopTimer();
    gesture.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    onCommit?.(latest.current, "scroller");
  };

  const arrowClass =
    "flex flex-1 cursor-ns-resize touch-none select-none items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-default disabled:opacity-40";

  return (
    <div
      className={cn(
        "relative flex min-w-0 items-stretch rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring",
        invalid ? "border-destructive" : "border-input",
        className,
      )}
    >
      <input
        id={id}
        ref={inputRef}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        className={cn(
          "w-full min-w-0 flex-1 rounded-l-md bg-transparent tabular-nums focus:outline-none",
          size === "sm" ? "px-2 py-1 text-sm" : "px-2.5 py-1.5 text-base font-semibold",
        )}
        onChange={(e) => {
          latest.current = e.target.value;
          onChange(e.target.value);
        }}
        onBlur={() => onCommit?.(latest.current, "blur")}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            bump(e.key === "ArrowUp" ? 1 : -1, e.shiftKey ? 10 : 1);
            return;
          }
          if (e.key === "Enter") {
            e.preventDefault();
            onCommit?.(latest.current, "enter");
          } else if (e.key === "Escape") {
            e.preventDefault();
            onCancel?.();
          }
          onKeyDown?.(e);
        }}
      />
      <div
        className="flex w-6 shrink-0 flex-col border-l border-input"
        title="Click, hold, or drag up and down"
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label={ariaLabel ? `Increase ${ariaLabel}` : "Increase"}
          disabled={disabled}
          className={cn(arrowClass, "rounded-tr-md")}
          onMouseDown={(e) => e.preventDefault()}
          data-dir="up"
          onPointerDown={onArrowDown}
          onPointerMove={onArrowMove}
          onPointerUp={onArrowUp}
          onPointerCancel={onArrowUp}
        >
          <ChevronUp className="h-3 w-3" aria-hidden />
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label={ariaLabel ? `Decrease ${ariaLabel}` : "Decrease"}
          disabled={disabled}
          className={cn(arrowClass, "rounded-br-md border-t border-input")}
          onMouseDown={(e) => e.preventDefault()}
          data-dir="down"
          onPointerDown={onArrowDown}
          onPointerMove={onArrowMove}
          onPointerUp={onArrowUp}
          onPointerCancel={onArrowUp}
        >
          <ChevronDown className="h-3 w-3" aria-hidden />
        </button>
      </div>
    </div>
  );
}
