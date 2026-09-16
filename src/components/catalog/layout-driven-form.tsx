"use client";

import { cn } from "@/lib/utils";
import type { UiListingField } from "@/lib/catalog/layout-to-fields";
import { resolvePicklistLabel } from "@/lib/catalog/layout-to-fields";
import { BooleanSwitch } from "@/components/ui/boolean-switch";
import { SecretValueField } from "@/components/ui/secret-value-field";
import { UserLookupField } from "@/components/catalog/user-lookup-field";
import { OrganizationLookupField } from "@/components/catalog/organization-lookup-field";
import { ImageUrlField } from "@/components/catalog/image-url-field";
import { FrequencyStartField } from "@/components/statistics/frequency-start-field";
import { deriveFrequencyStart } from "@/lib/statistics/frequency";
import { isAuditField } from "@/lib/catalog/audit-fields";
import {
  fieldSpanClass,
  normalizeLayoutColumns,
  sectionGridClass,
  type LayoutColumnCount,
} from "@/lib/catalog/layout-grid";
import { HtmlEditor, normalizePageBodyFormat } from "@/components/public/html-editor";

function FieldInput({
  field,
  value,
  onChange,
  readOnly,
  allValues,
  onFieldChange,
}: {
  field: UiListingField;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  allValues?: Record<string, string>;
  onFieldChange?: (key: string, value: string) => void;
}) {
  const base =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const kind = field.kind ?? "text";
  const isChecked = value === "true" || value === "1";

  if (field.key === "body_format") return null;
  if (field.key === "body_html") {
    return (
      <HtmlEditor
        label={field.label}
        value={value}
        format={normalizePageBodyFormat(allValues?.body_format)}
        onChange={readOnly ? undefined : onChange}
        onFormatChange={readOnly ? undefined : (fmt) => onFieldChange?.("body_format", fmt)}
        readOnly={readOnly}
      />
    );
  }

  if (field.key === "frequency_start") {
    const derived =
      deriveFrequencyStart(allValues?.frequency_type, allValues?.start_datetime) ?? value;
    return (
      <FrequencyStartField
        label={field.label}
        frequencyType={allValues?.frequency_type ?? ""}
        value={derived}
        required={false}
        readOnly
        help={field.help ?? "From Start datetime and Frequency type"}
      />
    );
  }

  if (field.key === "logo_url" || field.key.endsWith("_logo_url")) {
    return (
      <ImageUrlField
        label={field.label}
        value={value}
        onChange={readOnly ? undefined : onChange}
        required={field.required}
        readOnly={readOnly}
      />
    );
  }
  if (
    field.lookupObjectApiName === "organization" ||
    field.key === "organization_id" ||
    field.key.endsWith("_organization_id")
  ) {
    return (
      <OrganizationLookupField
        label={field.label}
        value={value}
        onChange={readOnly ? undefined : onChange}
        required={field.required}
        readOnly={readOnly}
      />
    );
  }

  if (kind === "lookup" || field.lookupObjectApiName === "user") {
    return (
      <UserLookupField
        label={field.label}
        value={value}
        onChange={readOnly ? undefined : onChange}
        required={field.required}
        readOnly={readOnly}
      />
    );
  }

  if (field.secret) {
    return (
      <SecretValueField
        label={field.label}
        value={value}
        onChange={readOnly ? undefined : onChange}
        readOnly={readOnly}
        required={field.required}
      />
    );
  }

  if (readOnly) {
    const display =
      kind === "select" ? resolvePicklistLabel(field, value) : value || "—";
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          {field.label}
          {field.required ? " *" : ""}
        </span>
        {field.help ? (
          <span className="text-[11px] leading-snug text-muted-foreground/80">{field.help}</span>
        ) : null}
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
      {field.help ? (
        <span className="text-[11px] leading-snug text-muted-foreground/80">{field.help}</span>
      ) : null}
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
        <BooleanSwitch
          checked={isChecked}
          onChange={(next) => onChange?.(next ? "true" : "false")}
        />
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
          inputMode={kind === "phone" ? "tel" : kind === "email" ? "email" : undefined}
          autoComplete={kind === "phone" ? "tel" : kind === "email" ? "email" : undefined}
          placeholder={
            kind === "email" ? "name@example.com" : kind === "phone" ? "+1 555 000 0000" : undefined
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
  columns: LayoutColumnCount;
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
          <div className={sectionGridClass(normalizeLayoutColumns(sec.columns))}>
            {sec.fields.map((f) => {
              if (f.key === "body_format") return null;
              const columns = normalizeLayoutColumns(sec.columns);
              const span =
                f.span && f.span > 1
                  ? f.span
                  : f.kind === "textarea" || f.secret || f.key === "body_html"
                    ? columns
                    : 1;
              if (f.blank) {
                return (
                  <div
                    key={f.key}
                    className={cn("min-h-8 min-w-0", fieldSpanClass(span, columns))}
                    aria-hidden
                  />
                );
              }
              return (
                <div
                  key={f.key}
                  className={fieldSpanClass(span, columns)}
                >
                  <FieldInput
                    field={f}
                    value={values[f.key] ?? ""}
                    onChange={
                      readOnly || isAuditField(f.key)
                        ? undefined
                        : (v) => onChange?.(f.key, v)
                    }
                    readOnly={readOnly || isAuditField(f.key)}
                    allValues={values}
                    onFieldChange={readOnly ? undefined : onChange}
                  />
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
