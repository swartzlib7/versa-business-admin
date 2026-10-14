/**
 * Project task lines. Contract: docs/production/state/state_zone_erd.md
 * "Project task lines (2026-10-14)".
 *
 * A task is a line on executive_project (line_group "tasks"). Parent task is
 * the only stored link. Depth is derived. Top level is 1. Maximum is 5.
 */

import type { Task } from "@/lib/data/types";
import { htmlToText } from "@/lib/html-text";
import type { RecordInstance } from "@/lib/fixtures/record-instances";

export const TASK_LINE_GROUP = "tasks";
export const MAX_TASK_DEPTH = 5;

export const TASK_STATUSES = ["todo", "in_progress", "waiting", "blocked", "done"] as const;
export type TaskLineStatus = (typeof TASK_STATUSES)[number];

export type TaskLine = {
  id: string;
  data: Record<string, string>;
};

export function mapLegacyTaskStatus(value: string): TaskLineStatus {
  if (value === "planned" || value === "completed") {
    return value === "completed" ? "done" : "todo";
  }
  return (TASK_STATUSES as readonly string[]).includes(value) ? (value as TaskLineStatus) : "todo";
}

export function byId(lines: TaskLine[]): Map<string, TaskLine> {
  return new Map(lines.map((line) => [line.id, line]));
}

export function parentIdOf(line: TaskLine): string {
  return (line.data.task_parent_id || "").trim();
}

/** Depth 1 is a top-level line. Cycles stop the walk. */
export function depthOf(id: string, lines: TaskLine[]): number {
  const map = byId(lines);
  let depth = 1;
  let cursor = parentIdOf(map.get(id) ?? { id, data: {} });
  const seen = new Set<string>([id]);
  while (cursor) {
    if (seen.has(cursor) || !map.has(cursor)) break;
    seen.add(cursor);
    depth += 1;
    cursor = parentIdOf(map.get(cursor)!);
  }
  return depth;
}

export function descendantsOf(id: string, lines: TaskLine[]): string[] {
  const out: string[] = [];
  const queue = lines.filter((line) => parentIdOf(line) === id).map((line) => line.id);
  const seen = new Set<string>();
  while (queue.length) {
    const next = queue.shift()!;
    if (seen.has(next)) continue;
    seen.add(next);
    out.push(next);
    for (const line of lines) {
      if (parentIdOf(line) === next) queue.push(line.id);
    }
  }
  return out;
}

/** Extra levels below this line (0 when it has no children). */
export function subtreeExtra(id: string, lines: TaskLine[]): number {
  const kids = descendantsOf(id, lines);
  if (!kids.length) return 0;
  const mine = depthOf(id, lines);
  return Math.max(...kids.map((kid) => depthOf(kid, lines) - mine));
}

export function isActionable(line: TaskLine, lines: TaskLine[]): boolean {
  const parent = parentIdOf(line);
  if (!parent) return true;
  const row = byId(lines).get(parent);
  if (!row) return true;
  return (row.data.task_status || "") === "done";
}

export function isOverdue(line: TaskLine, today: string): boolean {
  const due = (line.data.task_due_date || "").slice(0, 10);
  if (!due || (line.data.task_status || "") === "done") return false;
  return due < today;
}

/** Choices that keep this line and its children within depth 5 and out of a loop. */
export function parentChoices(lines: TaskLine[], id: string): TaskLine[] {
  const blocked = new Set([id, ...descendantsOf(id, lines)]);
  const extra = subtreeExtra(id, lines);
  return lines.filter((line) => {
    if (blocked.has(line.id)) return false;
    return depthOf(line.id, lines) + 1 + extra <= MAX_TASK_DEPTH;
  });
}

function withParent(lines: TaskLine[], id: string, parent: string): TaskLine[] {
  return lines.map((line) =>
    line.id === id ? { ...line, data: { ...line.data, task_parent_id: parent } } : line,
  );
}

/**
 * Indent under the nearest line above at this line's current depth.
 * Returns null when there is no such line or the result would pass depth 5.
 */
export function indentLine(lines: TaskLine[], id: string): TaskLine[] | null {
  const index = lines.findIndex((line) => line.id === id);
  if (index <= 0) return null;
  const mine = depthOf(id, lines);
  if (mine + 1 + subtreeExtra(id, lines) > MAX_TASK_DEPTH) return null;
  let parent: TaskLine | null = null;
  for (let i = index - 1; i >= 0; i--) {
    if (depthOf(lines[i].id, lines) === mine) {
      parent = lines[i];
      break;
    }
  }
  if (!parent) return null;
  return withParent(lines, id, parent.id);
}

/** Outdent to the current parent's parent. Returns null at the top level. */
export function outdentLine(lines: TaskLine[], id: string): TaskLine[] | null {
  const line = byId(lines).get(id);
  if (!line || !parentIdOf(line)) return null;
  const parent = byId(lines).get(parentIdOf(line));
  return withParent(lines, id, parent ? parentIdOf(parent) : "");
}

/** A line's parent when that parent is on the same Project; otherwise top level. */
function liveParent(line: TaskLine, map: Map<string, TaskLine>): string {
  const parent = parentIdOf(line);
  return parent && map.has(parent) ? parent : "";
}

/**
 * Swap a line and its children with the next sibling block above or below.
 * A line stays under its parent; use outdent to leave it.
 */
export function moveLine(lines: TaskLine[], id: string, direction: -1 | 1): TaskLine[] | null {
  const map = byId(lines);
  const line = map.get(id);
  if (!line) return null;
  const parent = liveParent(line, map);
  const siblings = lines.filter((row) => liveParent(row, map) === parent);
  const target = siblings[siblings.findIndex((row) => row.id === id) + direction];
  if (!target) return null;
  const mine = new Set([id, ...descendantsOf(id, lines)]);
  const theirs = new Set([target.id, ...descendantsOf(target.id, lines)]);
  const moving = lines.filter((row) => mine.has(row.id));
  const rest = lines.filter((row) => !mine.has(row.id));
  const anchors = rest.map((row, index) => (theirs.has(row.id) ? index : -1)).filter((n) => n >= 0);
  const at = direction < 0 ? anchors[0] : anchors[anchors.length - 1] + 1;
  return [...rest.slice(0, at), ...moving, ...rest.slice(at)];
}

export function projectTaskLines(inst: RecordInstance): TaskLine[] {
  return (inst.lines ?? [])
    .filter((line) => (line.line_group || "") === TASK_LINE_GROUP)
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((line) => ({ id: line.id, data: { ...line.data } }));
}

export function lineToTask(project: RecordInstance, line: TaskLine, lines: TaskLine[]): Task {
  const percentRaw = (line.data.task_percent || "").trim();
  const percent = percentRaw === "" ? null : Number(percentRaw);
  return {
    id: line.id,
    title: line.data.task_title || "",
    description: line.data.task_notes || "",
    descriptionText: htmlToText(line.data.task_notes || ""),
    status: mapLegacyTaskStatus(line.data.task_status || "todo"),
    priority: "normal",
    projectId: project.id,
    projectName: project.name,
    assigneeUserId: line.data.task_assignee_id || "",
    assigneeName: line.data.task_assignee_name || "",
    dueDate: (line.data.task_due_date || "").slice(0, 10),
    percentComplete: percent != null && Number.isFinite(percent) ? percent : null,
    parentId: parentIdOf(line),
    depth: depthOf(line.id, lines),
    actionable: isActionable(line, lines),
    createdAt: project.created_at,
    updatedAt: project.data.updated_at || project.created_at,
  };
}

export function tasksFromProject(inst: RecordInstance): Task[] {
  const lines = projectTaskLines(inst);
  return lines.map((line) => lineToTask(inst, line, lines));
}

export function assertTaskStatus(status: string): TaskLineStatus {
  const mapped = mapLegacyTaskStatus(status);
  if (!(TASK_STATUSES as readonly string[]).includes(status) && status !== "planned" && status !== "completed") {
    throw new Error("VALIDATION: invalid status");
  }
  return mapped;
}

export function assertParent(lines: TaskLine[], id: string, parent: string): void {
  if (!parent) return;
  if (!parentChoices(lines, id).some((line) => line.id === parent)) {
    throw new Error("VALIDATION: parent task is not allowed");
  }
}

/** Message for the first broken parent link in a saved lines array, or null. */
export function taskLinesProblem(lines: TaskLine[]): string | null {
  const map = byId(lines.filter((line) => line.id));
  for (const line of lines) {
    const parent = parentIdOf(line);
    if (!parent) continue;
    if (!map.has(parent)) return "Parent task must be another task on this Project.";
    let depth = 1;
    let cursor: string = parent;
    const seen = new Set<string>([line.id]);
    while (cursor) {
      if (seen.has(cursor)) return "A task cannot be placed under itself or one of its own subtasks.";
      seen.add(cursor);
      depth += 1;
      cursor = parentIdOf(map.get(cursor) ?? { id: cursor, data: {} });
    }
    if (depth > MAX_TASK_DEPTH) return `Tasks can be at most ${MAX_TASK_DEPTH} levels deep.`;
  }
  return null;
}

/** Children of a deleted line take its parent. */
export function deleteLine(lines: TaskLine[], id: string): TaskLine[] {
  const line = byId(lines).get(id);
  const parent = line ? parentIdOf(line) : "";
  return lines
    .filter((row) => row.id !== id)
    .map((row) =>
      parentIdOf(row) === id ? { ...row, data: { ...row.data, task_parent_id: parent } } : row,
    );
}
