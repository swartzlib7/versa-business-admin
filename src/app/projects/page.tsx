"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { EntityListing } from "@/components/listing/entity-listing";
import { theme } from "@/lib/theme";
import { projects, type ProjectFixture } from "@/lib/fixtures/projects";
import {
  listingFieldsFromCatalog,
  resolvePicklistLabel,
} from "@/lib/catalog/layout-to-fields";
import type { ListingField } from "@/components/listing/entity-listing";

type LocalRow = ProjectFixture & { _local?: boolean } & Record<string, unknown>;

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

export default function ProjectsPage() {
  const [rows, setRows] = useState<LocalRow[]>(() =>
    projects.map((r) => ({ ...r }) as LocalRow),
  );
  const [note, setNote] = useState("");

  const catalogFields = useMemo(
    () => listingFieldsFromCatalog("project"),
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
    if (key === "name" && row.id) {
      return (
        <Link
          href={`/projects/${row.id}`}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {text || "—"}
        </Link>
      );
    }
    return text;
  };

  const onAdd = (draft: Record<string, string>) => {
    const id = `local-proj-${Date.now()}`;
    const next: LocalRow = {
      id,
      name: draft.name || "New project",
      description: draft.description || "",
      status: (draft.status as ProjectFixture["status"]) || "active",
      ownerUserId: "",
      ownerName: draft.owner_name || "",
      priority: (draft.priority as ProjectFixture["priority"]) || "normal",
      startDate: draft.start_date || null,
      targetDate: draft.target_date || null,
      taskCount: Number(draft.task_count || 0) || 0,
      _local: true,
    };
    setRows((prev) => [...prev, next]);
    setNote("Added locally (mock) — catalog layout; not persisted.");
  };

  const onUpdate = (id: string, draft: Record<string, string>) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              name: draft.name || r.name,
              description: draft.description || r.description,
              status: (draft.status as ProjectFixture["status"]) || r.status,
              ownerName: draft.owner_name || r.ownerName,
              priority: (draft.priority as ProjectFixture["priority"]) || r.priority,
              startDate: draft.start_date || r.startDate,
              targetDate: draft.target_date || r.targetDate,
              taskCount: Number(draft.task_count || r.taskCount) || 0,
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
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ERD-D layout-driven list — catalog fields + EntityListing (same pattern as Users).
            </p>
          </div>
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
          title="Projects"
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
              {rows.length} project{rows.length === 1 ? "" : "s"}
            </span>
          }
        />
      </div>
    </AppShell>
  );
}
