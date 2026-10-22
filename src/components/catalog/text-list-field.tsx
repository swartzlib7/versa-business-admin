"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { GripVertical, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TEXT_LIST_MAX,
  moveItem,
  parseTextList,
  serializeTextList,
} from "@/lib/records/list-values";

type Entry = { key: number; text: string };

let entryKey = 0;
const toEntries = (texts: string[]): Entry[] => texts.map((text) => ({ key: entryKey++, text }));

/** "Purposes" → "purpose", "Duties" → "duty", "Know-How" → "know-how entry". */
function entryNoun(label: string): string {
  const lower = label.trim().toLowerCase();
  if (lower.endsWith("ies")) return lower.slice(0, -3) + "y";
  if (lower.endsWith("s") && !lower.endsWith("ss")) return lower.slice(0, -1);
  return lower ? `${lower} entry` : "entry";
}

function grow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

/**
 * Numbered text entries for a `text_list` field. Drag by the handle (or focus
 * it and use arrow up / down) to reorder. Contract: state_hats.md § 1.4.
 */
export function TextListField({
  label,
  value,
  onChange,
  readOnly,
  required,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  required?: boolean;
}) {
  const [entries, setEntries] = useState<Entry[]>(() => toEntries(parseTextList(value)));
  const [bound, setBound] = useState(value);
  const [focusKey, setFocusKey] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ index: number; y: number; dy: number; mids: number[] } | null>(null);
  const rowRefs = useRef<Map<number, HTMLLIElement>>(new Map());

  if (bound !== value) {
    setBound(value);
    if (serializeTextList(entries.map((e) => e.text)) !== value) {
      setEntries(toEntries(parseTextList(value)));
    }
  }

  const write = (next: Entry[]) => {
    setEntries(next);
    const serialized = serializeTextList(next.map((e) => e.text));
    setBound(serialized);
    onChange?.(serialized);
  };

  if (readOnly || !onChange) {
    const texts = parseTextList(value);
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {texts.length ? (
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            {texts.map((text, i) => (
              <li key={i} className="whitespace-pre-wrap">
                {text}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">None yet</p>
        )}
      </div>
    );
  }

  const target = (() => {
    if (!drag) return null;
    const y = drag.mids[drag.index] + drag.dy;
    let index = 0;
    drag.mids.forEach((mid, i) => {
      if (i !== drag.index && mid < y) index += 1;
    });
    return index;
  })();

  function onHandleDown(event: PointerEvent<HTMLButtonElement>, index: number) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const mids = entries.map((entry) => {
      const rect = rowRefs.current.get(entry.key)?.getBoundingClientRect();
      return rect ? rect.top + rect.height / 2 : 0;
    });
    setDrag({ index, y: event.clientY, dy: 0, mids });
  }

  function onHandleUp() {
    if (!drag) return;
    const to = target ?? drag.index;
    const from = drag.index;
    setDrag(null);
    if (to !== from) write(moveItem(entries, from, to));
  }

  function onHandleKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = moveItem(entries, index, index + step);
    if (next !== entries) write(next);
  }

  const noun = entryNoun(label);
  const full = entries.length >= TEXT_LIST_MAX;

  return (
    <div className={cn("flex flex-col gap-1.5", drag && "select-none")}>
      <span className="text-xs font-medium text-muted-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      {entries.length ? (
        <ol className="space-y-1.5">
          {entries.map((entry, index) => {
            const dragging = drag?.index === index;
            return (
              <li
                key={entry.key}
                ref={(el) => {
                  if (el) rowRefs.current.set(entry.key, el);
                  else rowRefs.current.delete(entry.key);
                }}
                className={cn(
                  "relative flex items-start gap-1.5 rounded-md bg-background",
                  dragging && "z-10 shadow-lg ring-1 ring-border",
                )}
                style={{ transform: dragging ? `translateY(${drag.dy}px)` : undefined }}
              >
                <button
                  type="button"
                  aria-label={`Move ${noun} ${index + 1}`}
                  className={cn(
                    "mt-1.5 flex h-7 w-6 shrink-0 touch-none items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                    dragging ? "cursor-grabbing" : "cursor-grab",
                  )}
                  onPointerDown={(event) => onHandleDown(event, index)}
                  onPointerMove={(event) => drag && setDrag({ ...drag, dy: event.clientY - drag.y })}
                  onPointerUp={onHandleUp}
                  onPointerCancel={() => setDrag(null)}
                  onKeyDown={(event) => onHandleKey(event, index)}
                >
                  <GripVertical className="h-4 w-4" />
                </button>
                <span className="mt-2.5 w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {index + 1}.
                </span>
                <textarea
                  ref={(el) => {
                    grow(el);
                    if (el && focusKey === entry.key) {
                      el.focus();
                      setFocusKey(null);
                    }
                  }}
                  rows={1}
                  aria-label={`${label} ${index + 1}`}
                  className="min-h-9 w-full resize-none overflow-hidden rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={entry.text}
                  onChange={(event) => {
                    grow(event.currentTarget);
                    write(entries.map((e) => (e.key === entry.key ? { ...e, text: event.target.value } : e)));
                  }}
                />
                {dragging && target != null && target !== index ? (
                  <span className="absolute -top-2 right-10 rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    Move to {target + 1}
                  </span>
                ) : null}
                <button
                  type="button"
                  aria-label={`Remove ${noun} ${index + 1}`}
                  className="mt-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => write(entries.filter((e) => e.key !== entry.key))}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">None yet</p>
      )}
      <div>
        <button
          type="button"
          disabled={full}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted/50 disabled:opacity-50"
          onClick={() => {
            const entry = { key: entryKey++, text: "" };
            setFocusKey(entry.key);
            setEntries([...entries, entry]);
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          {full ? `${TEXT_LIST_MAX} at most` : `Add ${noun}`}
        </button>
      </div>
    </div>
  );
}
