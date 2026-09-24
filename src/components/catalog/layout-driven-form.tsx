"use client";

import { cn } from "@/lib/utils";
import type { UiListingField } from "@/lib/catalog/layout-to-fields";
import { resolvePicklistLabel } from "@/lib/catalog/layout-to-fields";
import { BooleanSwitch } from "@/components/ui/boolean-switch";
import { SecretValueField } from "@/components/ui/secret-value-field";
import { UserLookupField } from "@/components/catalog/user-lookup-field";
import { OrganizationLookupField } from "@/components/catalog/organization-lookup-field";
import { RecordTypeLookupField } from "@/components/catalog/record-type-lookup-field";
import { RenderDriverLookupField } from "@/components/catalog/render-driver-lookup-field";
import { RecordInstanceLookupField } from "@/components/catalog/record-instance-lookup-field";
import {
  PairingFilterField,
  PairingInputMapField,
  RenderOptionField,
  isSelectionFollowup,
  pairingFieldVisible,
  useDriverCatalog,
  useStampPairingRecordType,
} from "@/components/catalog/pairing-fields";
import { pairingAllowsTypeLevel } from "@/lib/public/driver-pairings";
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
import { CustomSlotsField } from "@/components/catalog/custom-slots-field";
import { intervalIso, scheduleFieldHidden } from "@/lib/public/schedule-times";

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
  const pairingEntry = useDriverCatalog(allValues?.driver_id);
  if (field.key === "target_kind" || field.key === "record_mode") return null;
  if (!pairingFieldVisible(field.key, pairingEntry, allValues)) return null;

  if (scheduleFieldHidden(field.key, allValues?.kind)) return null;
  if (field.key === "custom_slots") {
    return (
      <CustomSlotsField
        label={field.label}
        value={value}
        onChange={readOnly ? undefined : onChange}
        readOnly={readOnly}
      />
    );
  }
  if (field.key === "notes" && field.label === "Data") {
    return (
      <HtmlEditor
        label={field.label}
        value={value}
        format="html"
        onChange={readOnly ? undefined : onChange}
        readOnly={readOnly}
      />
    );
  }
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
  if (field.lookupObjectApiName === "render_driver" || field.key === "driver_id") {
    return (
      <RenderDriverLookupField
        label={field.label}
        value={value}
        onChange={readOnly ? undefined : onChange}
        required={field.required}
        readOnly={readOnly}
        help={field.help}
      />
    );
  }
  if (field.key === "render_option") {
    return (
      <RenderOptionField
        label={field.label}
        value={value}
        onChange={readOnly ? undefined : onChange}
        readOnly={readOnly}
        help={field.help}
        driverRecordId={allValues?.driver_id}
      />
    );
  }
  if (field.key === "filter_json") {
    return (
      <PairingFilterField
        label={field.label}
        value={value}
        onChange={readOnly ? undefined : onChange}
        readOnly={readOnly}
        help={field.help}
        targetType={allValues?.target_record_type}
      />
    );
  }
  if (field.key === "input_map_json") {
    return (
      <PairingInputMapField
        label={field.label}
        value={value}
        onChange={readOnly ? undefined : onChange}
        readOnly={readOnly}
        help={field.help}
        driverRecordId={allValues?.driver_id}
        targetType={allValues?.target_record_type}
      />
    );
  }
  if (field.key === "target_record_id" || field.lookupObjectApiName === "record") {
    return (
      <RecordInstanceLookupField
        label={field.label}
        value={value}
        onChange={readOnly ? undefined : onChange}
        required={field.required}
        readOnly={readOnly}
        help={field.help}
        recordType={allValues?.target_record_type}
        allowTypeLevel={pairingEntry ? pairingAllowsTypeLevel(pairingEntry.id) : false}
      />
    );
  }
  if (field.lookupObjectApiName === "record_type" || field.key === "compatible_record_type" || field.key === "target_record_type") {
    return (
      <RecordTypeLookupField
        label={field.label}
        value={value}
        onChange={readOnly ? undefined : onChange}
        required={field.required}
        readOnly={readOnly}
        help={field.help}
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

  if (
    field.lookupObjectApiName === "vendor_integration" ||
    field.lookupObjectApiName === "executive_project" ||
    field.lookupObjectApiName === "location" ||
    field.lookupObjectApiName === "event"
  ) {
    return (
      <RecordInstanceLookupField
        label={field.label}
        value={value}
        onChange={readOnly ? undefined : onChange}
        required={field.required}
        readOnly={readOnly}
        recordType={field.lookupObjectApiName}
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
          onChange={(e) => {
            onChange?.(e.target.value);
            if (field.key === "interval_unit") {
              onFieldChange?.("interval_iso", intervalIso(allValues?.interval_count, e.target.value));
            }
          }}
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
          onChange={(e) => {
            onChange?.(e.target.value);
            if (field.key === "interval_count") {
              onFieldChange?.("interval_iso", intervalIso(e.target.value, allValues?.interval_unit));
            }
          }}
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
  const stampsPairingType = sections.some((sec) =>
    sec.fields.some((f) => f.key === "driver_id" || f.key === "target_record_type"),
  );
  useStampPairingRecordType(
    stampsPairingType ? values.driver_id : undefined,
    values.target_record_type,
    (type, previous) => {
      onChange?.("target_record_type", type);
      if (previous && previous !== type) onChange?.("target_record_id", "");
    },
  );
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
              if (f.key === "body_format" || isSelectionFollowup(f.key)) return null;
              const columns = normalizeLayoutColumns(sec.columns);
              if (f.key === "selection_mode") {
                const extras = sec.fields.filter((row) => isSelectionFollowup(row.key));
                return (
                  <div key={f.key} className={fieldSpanClass(columns, columns)}>
                    <div className="space-y-3">
                      <FieldInput
                        field={f}
                        value={values[f.key] ?? ""}
                        onChange={
                          readOnly || isAuditField(f.key) || f.readOnly
                            ? undefined
                            : (v) => onChange?.(f.key, v)
                        }
                        readOnly={readOnly || isAuditField(f.key) || Boolean(f.readOnly)}
                        allValues={values}
                        onFieldChange={readOnly ? undefined : onChange}
                      />
                      {extras.map((extra) => (
                        <FieldInput
                          key={extra.key}
                          field={extra}
                          value={values[extra.key] ?? ""}
                          onChange={
                            readOnly || isAuditField(extra.key) || extra.readOnly
                              ? undefined
                              : (v) => onChange?.(extra.key, v)
                          }
                          readOnly={readOnly || isAuditField(extra.key) || Boolean(extra.readOnly)}
                          allValues={values}
                          onFieldChange={readOnly ? undefined : onChange}
                        />
                      ))}
                    </div>
                  </div>
                );
              }
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
                      readOnly || isAuditField(f.key) || f.readOnly
                        ? undefined
                        : (v) => onChange?.(f.key, v)
                    }
                    readOnly={readOnly || isAuditField(f.key) || Boolean(f.readOnly)}
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
