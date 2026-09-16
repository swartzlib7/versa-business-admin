"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { EntityListing } from "@/components/listing/entity-listing";
import { theme } from "@/lib/theme";
import { PageHeader } from "@/components/ui/page-header";
import {
  listingFieldsFromCatalog,
  resolvePicklistLabel,
} from "@/lib/catalog/layout-to-fields";
import type { ListingField } from "@/components/listing/entity-listing";
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

export default function TasksPage() {
  const [rows, setRows] = useState<LocalRow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const catalogFields = useMemo(
    () => listingFieldsFromCatalog("task"),
    [],
  );

  const fields: ListingField[] = useMemo(
    () =>
      catalogFields.map((f) => ({
        key: f.key,
        label: f.label,
        kind: f.kind,
        options: f.options,
        optionLabels: f.optionLabels,
        column: f.column,
      })),
    [catalogFields],
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiJson<{ data: Task[] }>("/api/tasks"),
      apiJson<{ data: Project[] }>("/api/projects"),
    ])
      .then(([taskJson, projectJson]) => {
        if (cancelled) return;
        setRows((taskJson.data ?? []) as LocalRow[]);
        setProjects(projectJson.data ?? []);
        setError("");
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load tasks.");
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const getCell = (row: LocalRow, key: string) => {
    const vals = toCatalogValues(row);
    return vals[key] ?? "";
  };

  const renderCell = (row: LocalRow, key: string, raw: string) => {
    const meta = catalogFields.find((f) => f.key === key);
    const text =
      meta?.kind === "select" && raw
        ? resolvePicklistLabel(meta, raw)
        : raw;
    if (key === "title" && row.id) {
      return (
        <Link
          href={`/tasks/${row.id}`}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {text || "—"}
        </Link>
      );
    }
    return text;
  };

  const onAdd = async (draft: Record<string, string>) => {
    const projectId = resolveProjectId(projects, draft.project_name || "");
    if (!projectId) {
      setNote("Set Project to an existing project name (or id) before saving.");
      return false;
    }
    try {
      const json = await apiJson<{ data: Task }>("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: draft.title || "New task",
          description: draft.description || "",
          status: draft.status || "planned",
          priority: draft.priority || "normal",
          projectId,
          assigneeName: draft.assignee_name || "",
          dueDate: draft.due_date || null,
        }),
      });
      setRows((prev) => [...prev, json.data as LocalRow]);
      setNote("Saved.");
      return true;
    } catch (e: unknown) {
      setNote(e instanceof Error ? e.message : "Could not save task.");
      return false;
    }
  };

  const onUpdate = async (id: string, draft: Record<string, string>) => {
    const current = rows.find((r) => r.id === id);
    const projectId =
      resolveProjectId(projects, draft.project_name || "") || current?.projectId;
    if (!projectId) {
      setNote("Set Project to an existing project name (or id) before saving.");
      return false;
    }
    try {
      const json = await apiJson<{ data: Task }>(`/api/tasks/${encodeURIComponent(id)}`, {
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
      setRows((prev) => prev.map((r) => (r.id === id ? (json.data as LocalRow) : r)));
      setNote("Saved.");
      return true;
    } catch (e: unknown) {
      setNote(e instanceof Error ? e.message : "Could not update task.");
      return false;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <PageHeader
          title="Tasks"
          subtitle="Work items across projects and agents — catalog fields + EntityListing."
          badge="Tasks"
          accent={theme.colors.brand}
        />
          <Link
            href="/users"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Users
          </Link>
        </div>

        {note && (
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
            {note}
          </p>
        )}

        {!loaded ? (
          <p className="text-sm text-muted-foreground">Loading tasks…</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <EntityListing<LocalRow>
            title="Tasks"
            summary="Live records · catalog list layout · inline New/Edit"
            accent={theme.colors.brand}
            fields={fields}
            rows={rows}
            getRowId={(r) => r.id}
            getCell={getCell}
            renderCell={renderCell}
            onAdd={onAdd}
            onUpdate={onUpdate}
            headerExtra={
              <span className="text-xs text-muted-foreground">
                {rows.length} task{rows.length === 1 ? "" : "s"}
              </span>
            }
          />
        )}
      </div>
    </AppShell>
  );
}
