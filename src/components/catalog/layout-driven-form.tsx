"use client";

import { cn } from "@/lib/utils";
import type { UiListingField } from "@/lib/catalog/layout-to-fields";
import { resolvePicklistLabel } from "@/lib/catalog/layout-to-fields";

function FieldInput({
  field,
  value,
  onChange,
  readOnly,
}: {
  field: UiListingField;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
}) {
  const base =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const kind = field.kind ?? "text";
  const isChecked = value === "true" || value === "1";

  if (readOnly) {
    const display =
      kind === "select" ? resolvePicklistLabel(field, value) : value || "—";
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          {field.label}
          {field.required ? " *" : ""}
        </span>
        <p className="text-sm">{display}</p>
      </div>
    );
  }

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">
        {field.label}
        {field.required ? " *" : ""}
      </span>
      {kind === "textarea" ? (
        <textarea
          className={cn(base, "min-h-[72px] resize-y")}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      ) : kind === "select" ? (
        <select
          className={base}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        >
          <option value="">Select…</option>
          {(field.options ?? []).map((o, i) => (
            <option key={o} value={o}>
              {field.optionLabels?.[i] ?? o}
            </option>
          ))}
        </select>
      ) : kind === "boolean" ? (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input accent-[var(--primary)]"
            checked={isChecked}
            onChange={(e) => onChange?.(e.target.checked ? "true" : "false")}
          />
          <span className="text-sm text-muted-foreground">
            {isChecked ? "Yes" : "No"}
          </span>
        </div>
      ) : (
        <input
          className={base}
          type={
            kind === "number"
              ? "number"
              : kind === "date"
                ? "date"
                : kind === "datetime"
                  ? "datetime-local"
                  : kind === "email"
                    ? "email"
                    : kind === "url"
                      ? "url"
                      : kind === "phone"
                        ? "tel"
                        : "text"
          }
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      )}
    </label>
  );
}

export type LayoutSection = {
  id: string;
  label: string;
  columns: 1 | 2;
  fields: UiListingField[];
};

export function LayoutDrivenForm({
  sections,
  values,
  onChange,
  readOnly,
  accent,
}: {
  sections: LayoutSection[];
  values: Record<string, string>;
  onChange?: (key: string, value: string) => void;
  readOnly?: boolean;
  accent?: string;
}) {
  return (
    <div className="space-y-6">
      {sections.map((sec) => (
        <section
          key={sec.id}
          className="rounded-lg border border-border bg-card/40 p-4"
          style={
            accent
              ? { boxShadow: `inset 3px 0 0 ${accent}` }
              : undefined
          }
        >
          <h3 className="mb-3 text-sm font-semibold tracking-tight">
            {sec.label}
          </h3>
          <div
            className={cn(
              "grid gap-3",
              sec.columns === 2 ? "sm:grid-cols-2" : "grid-cols-1",
            )}
          >
            {sec.fields.map((f) => (
              <div
                key={f.key}
                className={
                  (f.span === 2 || f.kind === "textarea") && sec.columns === 2
                    ? "sm:col-span-2"
                    : undefined
                }
              >
                <FieldInput
                  field={f}
                  value={values[f.key] ?? ""}
                  onChange={
                    readOnly ? undefined : (v) => onChange?.(f.key, v)
                  }
                  readOnly={readOnly}
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
