"use client";

import { useCallback, useEffect, useState } from "react";
import { theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export type SortDir = "asc" | "desc";
export type TableSort = { key: string; dir: SortDir };

export function toggleSort(prev: TableSort, key: string): TableSort {
  if (prev.key === key) return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
  return { key, dir: "asc" };
}

export function sortByText<T>(rows: T[], dir: SortDir, get: (row: T) => string): T[] {
  const sign = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => sign * get(a).localeCompare(get(b), undefined, { sensitivity: "base" }));
}

export function mergeColumnOrder<K extends string>(saved: string[] | null, defaults: readonly K[]): K[] {
  const known = new Set(defaults);
  const next = (saved ?? []).filter((k): k is K => known.has(k as K));
  for (const k of defaults) if (!next.includes(k)) next.push(k);
  if (next.includes("actions" as K)) {
    return [...next.filter((k) => k !== "actions"), "actions" as K];
  }
  return next;
}

export function reorderKeys<K extends string>(cols: K[], from: string, to: string): K[] {
  const next = [...cols];
  const fromIdx = next.indexOf(from as K);
  const toIdx = next.indexOf(to as K);
  if (fromIdx < 0 || toIdx < 0) return cols;
  const [item] = next.splice(fromIdx, 1);
  next.splice(toIdx, 0, item);
  return next;
}

export function usePersistedColumnOrder<K extends string>(storageKey: string, defaults: readonly K[]) {
  const [cols, setCols] = useState<K[]>(() => [...defaults]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) setCols(mergeColumnOrder(parsed, defaults));
    } catch {
      /* keep defaults */
    }
  }, [storageKey, defaults]);

  const reorder = useCallback((from: string, to: string) => {
    if (from === to || from === "actions") return;
    setCols((prev) => {
      const next = mergeColumnOrder(reorderKeys(prev, from, to), defaults);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* ignore quota / private mode */
      }
      return next;
    });
  }, [storageKey, defaults]);

  return [cols, reorder] as const;
}

export function SortTh({
  label,
  sortKey,
  sort,
  onSort,
  colKey,
  onReorder,
  dragOver,
  onDragOverKey,
  align = "left",
  reorderable = true,
}: {
  label: string;
  sortKey: string;
  sort: TableSort;
  onSort: (key: string) => void;
  colKey: string;
  onReorder: (from: string, to: string) => void;
  dragOver: boolean;
  onDragOverKey: (key: string | null) => void;
  align?: "left" | "right";
  reorderable?: boolean;
}) {
  const active = sort.key === sortKey;
  return (
    <th
      draggable={reorderable}
      title={reorderable ? "Drag to reorder. Click to sort." : "Click to sort."}
      onDragStart={
        reorderable
          ? (e) => {
              e.dataTransfer.setData("text/plain", colKey);
              e.dataTransfer.effectAllowed = "move";
            }
          : undefined
      }
      onDragOver={
        reorderable
          ? (e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              onDragOverKey(colKey);
            }
          : undefined
      }
      onDragLeave={reorderable ? () => onDragOverKey(null) : undefined}
      onDrop={
        reorderable
          ? (e) => {
              e.preventDefault();
              onReorder(e.dataTransfer.getData("text/plain"), colKey);
              onDragOverKey(null);
            }
          : undefined
      }
      onDragEnd={reorderable ? () => onDragOverKey(null) : undefined}
      className={cn(
        "px-4 py-2.5 font-medium",
        align === "right" && "text-right",
        dragOver && "bg-muted",
      )}
      style={dragOver ? { boxShadow: `inset 3px 0 0 ${theme.colors.brand}` } : undefined}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 uppercase tracking-wide hover:text-foreground",
          reorderable && "cursor-grab active:cursor-grabbing",
          align === "right" && "justify-end",
        )}
      >
        {reorderable ? <span className="text-muted-foreground/40" aria-hidden>⋮⋮</span> : null}
        {label}
        <span className={active ? "text-foreground" : "text-muted-foreground/50"} aria-hidden>
          {active ? (sort.dir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </button>
    </th>
  );
}

function ActionsTh({
  colKey,
  dragOver,
  onDragOverKey,
  onReorder,
}: {
  colKey: string;
  dragOver: boolean;
  onDragOverKey: (key: string | null) => void;
  onReorder: (from: string, to: string) => void;
}) {
  return (
    <th
      className={cn("px-4 py-2.5 text-right font-medium", dragOver && "bg-muted")}
      style={dragOver ? { boxShadow: `inset 3px 0 0 ${theme.colors.brand}` } : undefined}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOverKey(colKey);
      }}
      onDragLeave={() => onDragOverKey(null)}
      onDrop={(e) => {
        e.preventDefault();
        onReorder(e.dataTransfer.getData("text/plain"), colKey);
        onDragOverKey(null);
      }}
    >
      Actions
    </th>
  );
}

export function ColumnHeaders<K extends string>({
  cols,
  meta,
  sort,
  onSort,
  onReorder,
  dragOver,
  onDragOverKey,
  reorderable = true,
}: {
  cols: K[];
  meta: Record<K, { label: string; sortKey?: string }>;
  sort: TableSort;
  onSort: (key: string) => void;
  onReorder: (from: string, to: string) => void;
  dragOver: string | null;
  onDragOverKey: (key: string | null) => void;
  reorderable?: boolean;
}) {
  return (
    <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
      {cols.map((key) => {
        const def = meta[key];
        if (key === "actions" || !def?.sortKey) {
          return (
            <ActionsTh
              key={String(key)}
              colKey={String(key)}
              dragOver={reorderable && dragOver === key}
              onDragOverKey={onDragOverKey}
              onReorder={onReorder}
            />
          );
        }
        return (
          <SortTh
            key={String(key)}
            colKey={String(key)}
            label={def.label}
            sortKey={def.sortKey}
            sort={sort}
            onSort={onSort}
            onReorder={onReorder}
            dragOver={reorderable && dragOver === key}
            onDragOverKey={onDragOverKey}
            reorderable={reorderable}
          />
        );
      })}
    </tr>
  );
}

export function rowClickIsToggle(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return true;
  return !target.closest("button, a, input, select, textarea, label");
}
