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
import { products, type Product } from "@/lib/fixtures/products";

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

function applyDraft(row: LocalRow, draft: Record<string, string>): LocalRow {
  return {
    ...row,
    name: draft.name || row.name,
    tagline: draft.tagline || row.tagline,
    description: draft.description || row.description,
    category: draft.category || row.category,
    status: (draft.status as Product["status"]) || row.status,
    features: textToFeatures(draft.features || ""),
  };
}

export default function ProductsDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const seed = products.find((r) => r.id === id);

  const [row, setRow] = useState<LocalRow | null>(
    () => (seed ? ({ ...seed } as LocalRow) : null),
  );
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");

  const detail = useMemo(() => detailSectionsFromCatalog("product"), []);
  const edit = useMemo(() => editFieldsFromCatalog("product"), []);

  if (!row) {
    return (
      <AppShell>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Product not found in fixtures.</p>
          <Link href="/products" className="text-sm underline">
            Back to Products
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
              href="/products"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              ← Products
            </Link>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {values.name || row.id}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ERD-D layout-driven detail/edit · object "product"
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
