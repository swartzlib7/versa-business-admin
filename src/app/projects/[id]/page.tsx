"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutDrivenForm } from "@/components/catalog/layout-driven-form";
import { useSavedRuntimeLayouts } from "@/lib/catalog/use-saved-runtime-layouts";
import { theme } from "@/lib/theme";
import { projects, type ProjectFixture } from "@/lib/fixtures/projects";

type LocalRow = ProjectFixture & Record<string, unknown>;

function toCatalogValues(r: LocalRow): Record<string, string> {
  return {
    name: String(r.name ?? ""),
    status: String(r.status ?? "active"),
    priority: String(r.priority ?? "normal"),
    owner_name: String(r.ownerName ?? ""),
    start_date: String(r.startDate ?? ""),
    target_date: String(r.targetDate ?? ""),
    task_count: String(r.taskCount ?? "0"),
    description: String(r.description ?? ""),
  };
}


function applyDraft(row: LocalRow, draft: Record<string, string>): LocalRow {
  return {
    ...row,
    name: draft.name || row.name,
    description: draft.description || row.description,
    status: (draft.status as ProjectFixture["status"]) || row.status,
    ownerName: draft.owner_name || row.ownerName,
    priority: (draft.priority as ProjectFixture["priority"]) || row.priority,
    startDate: draft.start_date || row.startDate,
    targetDate: draft.target_date || row.targetDate,
    taskCount: Number(draft.task_count || row.taskCount) || 0,
  };
}

export default function ProjectsDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const seed = projects.find((r) => r.id === id);

  const [row, setRow] = useState<LocalRow | null>(
    () => (seed ? ({ ...seed } as LocalRow) : null),
  );
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");

  const runtimeSections = useSavedRuntimeLayouts("project");

  if (!row) {
    return (
      <AppShell>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Project not found in fixtures.</p>
          <Link href="/projects" className="text-sm underline">
            Back to Projects
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
    setNote("Updated in this session (mock). The active saved or catalog fallback layout was applied; fixtures are not persisted.");
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link
              href="/projects"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              ← Projects
            </Link>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {values.name || values.title || row.id}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Runtime saved-layout pilot — {editing ? "edit" : "detail"} uses a saved layout when available, otherwise the catalog default.
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
              sections={editing ? runtimeSections.edit : runtimeSections.detail}
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

