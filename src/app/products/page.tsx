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
import type { Product } from "@/lib/data";
import { apiJson } from "@/lib/client/api-json";

type LocalRow = Product & Record<string, unknown>;

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
    category: String(r.category ?? "Packages"),
    status: String(r.status ?? "available"),
    description: String(r.description ?? ""),
    features: featuresToText(r.features),
  };
}

export default function ProductsPage() {
  const [rows, setRows] = useState<LocalRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
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

  useEffect(() => {
    let cancelled = false;
    apiJson<{ data: Product[] }>("/api/public/products")
      .then((json) => {
        if (cancelled) return;
        setRows((json.data ?? []) as LocalRow[]);
        setError("");
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load products.");
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

  const onAdd = async (draft: Record<string, string>) => {
    try {
      const json = await apiJson<{ data: Product }>("/api/products", {
        method: "POST",
        body: JSON.stringify({
          name: draft.name || "New product",
          tagline: draft.tagline || "",
          description: draft.description || "",
          category: draft.category || "Packages",
          status: draft.status || "available",
          features: textToFeatures(draft.features || ""),
        }),
      });
      setRows((prev) => [...prev, json.data as LocalRow]);
      setNote("Saved.");
      return true;
    } catch (e: unknown) {
      setNote(e instanceof Error ? e.message : "Could not save product.");
      return false;
    }
  };

  const onUpdate = async (id: string, draft: Record<string, string>) => {
    try {
      const json = await apiJson<{ data: Product }>(`/api/products/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: draft.name,
          tagline: draft.tagline,
          description: draft.description,
          category: draft.category,
          status: draft.status,
          features: textToFeatures(draft.features || ""),
        }),
      });
      setRows((prev) => prev.map((r) => (r.id === id ? (json.data as LocalRow) : r)));
      setNote("Saved.");
      return true;
    } catch (e: unknown) {
      setNote(e instanceof Error ? e.message : "Could not update product.");
      return false;
    }
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
            Users
          </Link>
        </div>

        {note && (
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
            {note}
          </p>
        )}

        {!loaded ? (
          <p className="text-sm text-muted-foreground">Loading products…</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <EntityListing<LocalRow>
            title="Products"
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
                {rows.length} product{rows.length === 1 ? "" : "s"}
              </span>
            }
          />
        )}
      </div>
    </AppShell>
  );
}
