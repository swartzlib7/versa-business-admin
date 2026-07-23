"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { EntityListing } from "@/components/listing/entity-listing";
import { theme } from "@/lib/theme";
import { PageHeader } from "@/components/ui/page-header";
import { tasks, type TaskFixture } from "@/lib/fixtures/tasks";
import {
  listingFieldsFromCatalog,
  resolvePicklistLabel,
} from "@/lib/catalog/layout-to-fields";
import type { ListingField } from "@/components/listing/entity-listing";

type LocalRow = TaskFixture & { _local?: boolean } & Record<string, unknown>;

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

export default function TasksPage() {
  const [rows, setRows] = useState<LocalRow[]>(() =>
    tasks.map((r) => ({ ...r }) as LocalRow),
  );
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

  const onAdd = (draft: Record<string, string>) => {
    const id = `local-task-${Date.now()}`;
    const now = new Date().toISOString();
    const next: LocalRow = {
      id,
      title: draft.title || "New task",
      description: draft.description || "",
      status: (draft.status as TaskFixture["status"]) || "planned",
      priority: (draft.priority as TaskFixture["priority"]) || "normal",
      projectId: "",
      projectName: draft.project_name || "",
      assigneeUserId: "",
      assigneeName: draft.assignee_name || "",
      dueDate: draft.due_date || "",
      createdAt: now,
      updatedAt: now,
      _local: true,
    };
    setRows((prev) => [...prev, next]);
    setNote("Added locally (mock) — catalog layout; not persisted.");
  };

  const onUpdate = (id: string, draft: Record<string, string>) => {
    const now = new Date().toISOString();
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              title: draft.title || r.title,
              description: draft.description || r.description,
              status: (draft.status as TaskFixture["status"]) || r.status,
              priority: (draft.priority as TaskFixture["priority"]) || r.priority,
              projectName: draft.project_name || r.projectName,
              assigneeName: draft.assignee_name || r.assigneeName,
              dueDate: draft.due_date || r.dueDate,
              updatedAt: now,
            }
          : r,
      ),
    );
    setNote("Updated in this session (mock) — catalog layout.");
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
            Users pilot
          </Link>
        </div>

        {note && (
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
            {note}
          </p>
        )}

        <EntityListing<LocalRow>
          title="Tasks"
          summary="Fixture data · catalog list layout · inline New/Edit"
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
      </div>
    </AppShell>
  );
}
