"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  deleteLine,
  depthOf,
  indentLine,
  MAX_TASK_DEPTH,
  moveLine,
  outdentLine,
  parentChoices,
  type TaskLine,
} from "@/lib/records/project-task-lines";

type Row = { id: string; cells: Record<string, string> };

/** Horizontal pull that indents or outdents; vertical pull per one-row move. */
const INDENT_PX = 28;
const ROW_PX = 40;

function toLines(rows: Row[]): TaskLine[] {
  return rows.map((row) => ({ id: row.id, data: row.cells }));
}

function toRows(lines: TaskLine[]): Row[] {
  return lines.map((line) => ({ id: line.id, cells: line.data }));
}

type DragResult = { label: string; next: TaskLine[] | null };

/** What releasing the handle here would do. */
function dragResult(lines: TaskLine[], id: string, dx: number, dy: number): DragResult | null {
  if (Math.abs(dx) >= INDENT_PX && Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) {
      const next = indentLine(lines, id);
      return { label: next ? "Place under the task above" : "Cannot go deeper here", next };
    }
    const next = outdentLine(lines, id);
    return { label: next ? "Move out one level" : "Already at the top level", next };
  }
  const steps = Math.trunc(dy / ROW_PX + (dy > 0 ? 0.5 : -0.5));
  if (!steps) return null;
  let next: TaskLine[] | null = lines;
  let moved = 0;
  for (let i = 0; i < Math.abs(steps); i++) {
    const step: TaskLine[] | null = moveLine(next!, id, steps > 0 ? 1 : -1);
    if (!step) break;
    next = step;
    moved += 1;
  }
  if (!moved) return { label: steps > 0 ? "Already last under its parent" : "Already first under its parent", next: null };
  return { label: `Move ${steps > 0 ? "down" : "up"} ${moved}`, next };
}

/**
 * Task lines of one Project. Drag by the handle, or focus it and use the arrow
 * keys. Contract: state_zone_erd.md "Project task lines".
 */
export function ProjectTaskLines({
  rows,
  onCommit,
}: {
  rows: Row[];
  onCommit: (rows: Row[]) => Promise<boolean>;
}) {
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; dx: number; dy: number } | null>(null);
  const lines = toLines(rows);
  const result = drag ? dragResult(lines, drag.id, drag.dx, drag.dy) : null;

  async function commit(next: TaskLine[] | null) {
    if (!next) return;
    await onCommit(toRows(next));
  }

  function onHandleDown(event: PointerEvent<HTMLButtonElement>, id: string) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ id, x: event.clientX, y: event.clientY, dx: 0, dy: 0 });
  }

  function onHandleMove(event: PointerEvent<HTMLButtonElement>) {
    if (!drag) return;
    setDrag({ ...drag, dx: event.clientX - drag.x, dy: event.clientY - drag.y });
  }

  function onHandleUp() {
    if (!drag) return;
    const next = result?.next ?? null;
    setDrag(null);
    void commit(next);
  }

  function onHandleKey(event: KeyboardEvent<HTMLButtonElement>, id: string) {
    const next =
      event.key === "ArrowRight"
        ? indentLine(lines, id)
        : event.key === "ArrowLeft"
          ? outdentLine(lines, id)
          : event.key === "ArrowUp"
            ? moveLine(lines, id, -1)
            : event.key === "ArrowDown"
              ? moveLine(lines, id, 1)
              : undefined;
    if (next === undefined) return;
    event.preventDefault();
    void commit(next);
  }

  return (
    <div className={cn("space-y-2 pt-2", drag && "select-none")}>
      <h4 className="text-sm font-medium">Arrange tasks</h4>
      <p className="text-sm text-muted-foreground">
        Drag a task by its handle. Up or down reorders it. Right places it under the task above, left moves it out. Five levels at most. The arrow keys do the same when the handle is focused.
      </p>
      <ul className="divide-y rounded-md border">
        {lines.map((line) => {
          const depth = depthOf(line.id, lines);
          const choices = parentChoices(lines, line.id);
          const dragging = drag?.id === line.id;
          return (
            <li
              key={line.id}
              className={cn(
                "relative flex items-center gap-2 bg-background px-2 py-2",
                dragging && "z-10 rounded-md shadow-lg ring-1 ring-border",
              )}
              style={{
                paddingLeft: 4 + (depth - 1) * 20,
                transform: dragging ? `translate(${drag.dx}px, ${drag.dy}px)` : undefined,
              }}
            >
              <button
                type="button"
                aria-label={`Move ${line.data.task_title || "task"}`}
                className={cn(
                  "flex h-7 w-6 shrink-0 touch-none items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                  dragging ? "cursor-grabbing" : "cursor-grab",
                )}
                onPointerDown={(event) => onHandleDown(event, line.id)}
                onPointerMove={onHandleMove}
                onPointerUp={onHandleUp}
                onPointerCancel={() => setDrag(null)}
                onKeyDown={(event) => onHandleKey(event, line.id)}
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <span className="w-4 shrink-0 text-xs text-muted-foreground">{depth}</span>
              <span className="min-w-0 flex-1 truncate text-sm">
                {line.data.task_title || "Task"}
              </span>
              {dragging && result ? (
                <span
                  className={cn(
                    "shrink-0 rounded px-2 py-0.5 text-xs",
                    result.next ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  {result.label}
                </span>
              ) : null}
              <select
                className="max-w-[14rem] rounded border bg-background px-2 py-1 text-xs"
                value={line.data.task_parent_id || ""}
                aria-label="Parent task"
                onChange={(event) => {
                  const parent = event.target.value;
                  const next = lines.map((row) =>
                    row.id === line.id
                      ? { ...row, data: { ...row.data, task_parent_id: parent } }
                      : row,
                  );
                  void commit(next);
                }}
              >
                <option value="">No parent</option>
                {choices.map((choice) => (
                  <option key={choice.id} value={choice.id}>
                    {choice.data.task_title || "Task"}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => void commit(deleteLine(lines, line.id))}
              >
                Remove
              </button>
            </li>
          );
        })}
      </ul>
      {lines.some((line) => depthOf(line.id, lines) >= MAX_TASK_DEPTH) && (
        <p className="text-xs text-muted-foreground">A task at level {MAX_TASK_DEPTH} cannot take a child.</p>
      )}
    </div>
  );
}
