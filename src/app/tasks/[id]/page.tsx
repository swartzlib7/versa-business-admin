"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutDrivenForm } from "@/components/catalog/layout-driven-form";
import { useSavedRuntimeLayouts } from "@/lib/catalog/use-saved-runtime-layouts";
import { theme } from "@/lib/theme";
import type { Project, Task } from "@/lib/data";
import { apiJson } from "@/lib/client/api-json";

type LocalRow = Task & Record<string, unknown>;

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

function resolveProjectId(projects: Project[], raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  const byId = projects.find((p) => p.id === value);
  if (byId) return byId.id;
  const lower = value.toLowerCase();
  const matches = projects.filter((p) => p.name.toLowerCase() === lower);
  return matches.length === 1 ? matches[0].id : null;
}

export default function TasksDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const [row, setRow] = useState<LocalRow | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [fetchedId, setFetchedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const runtimeSections = useSavedRuntimeLayouts("task");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    Promise.all([
      apiJson<{ data: Task }>(`/api/tasks/${encodeURIComponent(id)}`),
      apiJson<{ data: Project[] }>("/api/projects"),
    ])
      .then(([taskJson, projectJson]) => {
        if (cancelled) return;
        setRow(taskJson.data as LocalRow);
        setProjects(projectJson.data ?? []);
        setNote("");
        setFetchedId(id);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setRow(null);
        setNote(e instanceof Error ? e.message : "Task not found.");
        setFetchedId(id);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const values = row ? toCatalogValues(row) : {};

  const startEdit = () => {
    setDraft({ ...values });
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setDraft({});
  };

  const save = async () => {
    if (!row) return;
    const projectId =
      resolveProjectId(projects, draft.project_name || "") || row.projectId;
    if (!projectId) {
      setNote("Set Project to an existing project name (or id) before saving.");
      return;
    }
    setSaving(true);
    try {
      const json = await apiJson<{ data: Task }>(`/api/tasks/${encodeURIComponent(row.id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: draft.title,
          description: draft.description,
          status: draft.status,
          priority: draft.priority,
          projectId,
          assigneeName: draft.assignee_name,
          dueDate: draft.due_date || null,
        }),
      });
      setRow(json.data as LocalRow);
      setEditing(false);
      setNote("Saved.");
    } catch (e: unknown) {
      setNote(e instanceof Error ? e.message : "Could not save task.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {fetchedId !== id ? (
          <p className="text-sm text-muted-foreground">Loading task…</p>
        ) : !row ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{note || "Task not found."}</p>
            <Link href="/tasks" className="text-sm underline">
              Back to Tasks
            </Link>
          </div>
        ) : (
          <>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link
              href="/tasks"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              ← Tasks
            </Link>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {values.title || row.id}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Runtime saved-layout — {editing ? "edit" : "detail"} uses a saved layout when available, otherwise the catalog default.
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
                  onClick={() => void save()}
                  disabled={saving}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
                  style={{ backgroundColor: theme.colors.brand }}
                >
                  {saving ? "Saving…" : "Save"}
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
          </>
        )}
      </div>
    </AppShell>
  );
}
