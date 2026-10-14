import assert from "node:assert/strict";
import test from "node:test";
import {
  deleteLine,
  depthOf,
  indentLine,
  isActionable,
  isOverdue,
  mapLegacyTaskStatus,
  moveLine,
  outdentLine,
  parentChoices,
  taskLinesProblem,
  type TaskLine,
} from "./project-task-lines";
import { htmlToText } from "../html-text";

function line(id: string, parent = "", status = "todo", due = ""): TaskLine {
  return { id, data: { task_parent_id: parent, task_status: status, task_due_date: due, task_title: id } };
}

test("depth stops at 5 and a child is not actionable until the parent is done", () => {
  const lines = [line("a"), line("b", "a"), line("c", "b"), line("d", "c"), line("e", "d")];
  assert.equal(depthOf("e", lines), 5);
  assert.equal(isActionable(lines[1], lines), false);
  lines[0].data.task_status = "done";
  assert.equal(isActionable(lines[1], lines), true);
});

test("indent sets the parent to the nearest line above at the same depth", () => {
  const lines = [line("a"), line("b"), line("c")];
  const indented = indentLine(lines, "b");
  assert.equal(indented?.[1].data.task_parent_id, "a");
  assert.equal(indentLine(indented!, "a"), null);
  const tooDeep = [
    line("a"),
    line("b", "a"),
    line("c", "b"),
    line("d", "c"),
    line("e", "d"),
    line("f"),
  ];
  const underE = indentLine(
    tooDeep.map((row) => (row.id === "f" ? line("f", "d") : row)),
    "f",
  );
  assert.equal(underE, null);
});

test("outdent, reorder, and delete keep the hierarchy", () => {
  const lines = [line("a"), line("b", "a"), line("c")];
  const out = outdentLine(lines, "b");
  assert.equal(out?.[1].data.task_parent_id, "");
  const moved = moveLine(lines, "a", 1);
  assert.equal(moved?.map((row) => row.id).join(","), "c,a,b");
  const removed = deleteLine(lines, "a");
  assert.equal(removed.find((row) => row.id === "b")?.data.task_parent_id, "");
  assert.equal(parentChoices(lines, "a").some((row) => row.id === "b"), false);
  assert.equal(parentChoices(lines, "b").some((row) => row.id === "a"), true);
});

test("reorder swaps whole sibling blocks and keeps a child under its parent", () => {
  const lines = [line("a"), line("a1", "a"), line("b"), line("b1", "b"), line("b2", "b")];
  assert.equal(moveLine(lines, "a", 1)?.map((row) => row.id).join(","), "b,b1,b2,a,a1");
  assert.equal(moveLine(lines, "b", -1)?.map((row) => row.id).join(","), "b,b1,b2,a,a1");
  assert.equal(moveLine(lines, "b2", -1)?.map((row) => row.id).join(","), "a,a1,b,b2,b1");
  assert.equal(moveLine(lines, "b1", -1), null);
  assert.equal(moveLine(lines, "a1", 1), null);
});

test("saved lines reject loops, missing parents, and a sixth level", () => {
  assert.equal(taskLinesProblem([line("a"), line("b", "a")]), null);
  assert.match(taskLinesProblem([line("a", "b"), line("b", "a")]) ?? "", /under itself/);
  assert.match(taskLinesProblem([line("a", "gone")]) ?? "", /another task/);
  const six = [line("a"), line("b", "a"), line("c", "b"), line("d", "c"), line("e", "d"), line("f", "e")];
  assert.match(taskLinesProblem(six) ?? "", /5 levels/);
});

test("rich text notes reduce to plain text for descriptionText", () => {
  assert.equal(
    htmlToText("<p>Pair with its <strong>schedule</strong> &amp; go.</p><ul><li>Weather</li><li>Export</li></ul>"),
    "Pair with its schedule & go.\nWeather\nExport",
  );
  assert.equal(htmlToText("plain note"), "plain note");
});

test("overdue ignores done lines and maps planned to todo", () => {
  assert.equal(isOverdue(line("a", "", "todo", "2020-01-01"), "2026-01-01"), true);
  assert.equal(isOverdue(line("a", "", "done", "2020-01-01"), "2026-01-01"), false);
  assert.equal(mapLegacyTaskStatus("planned"), "todo");
  assert.equal(mapLegacyTaskStatus("blocked"), "blocked");
});
