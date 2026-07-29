"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { EntityListing } from "@/components/listing/entity-listing";
import { theme } from "@/lib/theme";
import { PageHeader } from "@/components/ui/page-header";
import { products, type Product } from "@/lib/fixtures/products";
import {
  listingFieldsFromCatalog,
  resolvePicklistLabel,
} from "@/lib/catalog/layout-to-fields";
import type { ListingField } from "@/components/listing/entity-listing";

type LocalRow = Product & { _local?: boolean } & Record<string, unknown>;

function featuresToText(features: unknown): string {
  if (Array.isArray(features)) return (features as string[]).join("\n");
  return String(features ?? "");
}

function textToFeatures(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function toCatalogValues(r: LocalRow): Record<string, string> {
  return {
    name: String(r.name ?? ""),
    tagline: String(r.tagline ?? ""),
    kind: String(r.kind ?? "software"),
    status: String(r.status ?? "available"),
    description: String(r.description ?? ""),
    features: featuresToText(r.features),
  };
}

export default function ProductsPage() {
  const [rows, setRows] = useState<LocalRow[]>(() =>
    products.map((r) => ({ ...r }) as LocalRow),
  );
  const [note, setNote] = useState("");

  const catalogFields = useMemo(() => listingFieldsFromCatalog("product"), []);

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
      meta?.kind === "select" && raw ? resolvePicklistLabel(meta, raw) : raw;
    if (key === "name" && row.id) {
      return (
        <Link
          href={`/products/${row.id}`}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {text || "—"}
        </Link>
      );
    }
    return text;
  };

  const onAdd = (draft: Record<string, string>) => {
    const id = `local-prod-${Date.now()}`;
    const next: LocalRow = {
      id,
      name: draft.name || "New product",
      tagline: draft.tagline || "",
      description: draft.description || "",
      kind: draft.kind || "software",
      status: (draft.status as Product["status"]) || "available",
      features: textToFeatures(draft.features || ""),
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
              tagline: draft.tagline || r.tagline,
              description: draft.description || r.description,
              kind: draft.kind || r.kind,
              status: (draft.status as Product["status"]) || r.status,
              features: textToFeatures(draft.features || ""),
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
          title="Products"
          subtitle="Catalog offerings and service lines — catalog fields + EntityListing."
          badge="Products"
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
          title="Products"
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
              {rows.length} product{rows.length === 1 ? "" : "s"}
            </span>
          }
        />
      </div>
    </AppShell>
  );
}
