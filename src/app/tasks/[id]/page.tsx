"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutDrivenForm } from "@/components/catalog/layout-driven-form";
import {
  detailSectionsFromCatalog,
  editFieldsFromCatalog,
} from "@/lib/catalog/layout-to-fields";
import { theme } from "@/lib/theme";
import { tasks, type TaskFixture } from "@/lib/fixtures/tasks";

type LocalRow = TaskFixture & Record<string, unknown>;

function toCatalogValues(r: LocalRow): Record<string, string> {
  return {
    title: String(r.title ?? ""),
    status: String(r.status ?? "planned"),
    priority: String(r.priority ?? "normal"),
    project_name: String(r.projectName ?? ""),
    assignee_name: String(r.assigneeName ?? ""),
    due_date: String(r.dueDate ?? ""),
    description: String(r.description ?? ""),
  };
}


function applyDraft(row: LocalRow, draft: Record<string, string>): LocalRow {
  return {
    ...row,
    title: draft.title || row.title,
    description: draft.description || row.description,
    status: (draft.status as TaskFixture["status"]) || row.status,
    priority: (draft.priority as TaskFixture["priority"]) || row.priority,
    projectName: draft.project_name || row.projectName,
    assigneeName: draft.assignee_name || row.assigneeName,
    dueDate: draft.due_date || row.dueDate,
    updatedAt: new Date().toISOString(),
  };
}

export default function TasksDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const seed = tasks.find((r) => r.id === id);

  const [row, setRow] = useState<LocalRow | null>(
    () => (seed ? ({ ...seed } as LocalRow) : null),
  );
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");

  const detail = useMemo(() => detailSectionsFromCatalog("task"), []);
  const edit = useMemo(() => editFieldsFromCatalog("task"), []);

  if (!row) {
    return (
      <AppShell>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Task not found in fixtures.</p>
          <Link href="/tasks" className="text-sm underline">
            Back to Tasks
          </Link>
        </div>
      </AppShell>
    );
  }

  const values = toCatalogValues(row);

  const startEdit = () => {
    setDraft({ ...values });
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setDraft({});
  };

  const save = () => {
    setRow((prev) => (prev ? applyDraft(prev, draft) : prev));
    setEditing(false);
    setNote("Updated in this session (mock) — catalog layout; fixtures are not persisted.");
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link
              href="/tasks"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              ← Tasks
            </Link>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {values.name || values.title || row.id}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ERD-D layout-driven detail/edit · object "task"
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!editing ? (
              <button
                type="button"
                onClick={startEdit}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-white"
                style={{ backgroundColor: theme.colors.brand }}
              >
                Edit
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={save}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-white"
                  style={{ backgroundColor: theme.colors.brand }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={cancel}
                  className="rounded-md border border-border px-3 py-1.5 text-sm"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {note && (
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
            {note}
          </p>
        )}

        <Card>
          <CardContent className="p-4 sm:p-6">
            <LayoutDrivenForm
              sections={editing ? edit.sections : detail.sections}
              values={editing ? draft : values}
              onChange={
                editing
                  ? (key, value) => setDraft((d) => ({ ...d, [key]: value }))
                  : undefined
              }
              readOnly={!editing}
              accent={theme.colors.brand}
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

