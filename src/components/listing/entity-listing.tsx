"use client";

import type { LookupFilter } from "@/lib/catalog/lookup-filter";
import { describeFilter } from "@/lib/public/pairing-filter";
import { IssueTokenButton } from "@/components/integrations/issue-token";
import { isRecordTypeLookup } from "@/lib/catalog/lookup-targets";
import { helpForField } from "@/lib/catalog/layout-to-fields";
import { displayDateValue } from "@/lib/datetime-display";
import { LineFieldSelect } from "@/components/statistics/line-field-select";

import { useEffect, useMemo, useRef, useState, Fragment, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListingBadge } from "@/components/ui/kind-badge";
import { theme } from "@/lib/theme";
import Link from "next/link";
import { Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BooleanSwitch } from "@/components/ui/boolean-switch";
import { NumberScrubInput } from "@/components/ui/number-scrub-input";
import { SecretValueField, maskSecretDisplay } from "@/components/ui/secret-value-field";
import { UserLookupField, UserName } from "@/components/catalog/user-lookup-field";
import { OrganizationLookupField, OrganizationName } from "@/components/catalog/organization-lookup-field";
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
import { ProfilePictureField } from "@/components/users/profile-picture-field";
import { PasswordField } from "@/components/users/password-field";
import { ImageUrlField } from "@/components/catalog/image-url-field";
import { ImageGalleryField } from "@/components/catalog/image-gallery-field";
import { AttachmentsField } from "@/components/catalog/attachments-field";
import { SummaryValueField } from "@/components/catalog/summary-value-field";
import { parseRecordFiles } from "@/lib/records/record-file-refs";
import { TextListField } from "@/components/catalog/text-list-field";
import { RecordMultiLookupField, RecordNames } from "@/components/catalog/record-multi-lookup-field";
import { parseTextList } from "@/lib/records/list-values";
import { FrequencyStartField } from "@/components/statistics/frequency-start-field";
import { HtmlEditor, normalizePageBodyFormat } from "@/components/public/html-editor";
import { htmlToText } from "@/lib/html-text";
import { CustomSlotsField } from "@/components/catalog/custom-slots-field";
import { intervalIso, scheduleFieldHidden } from "@/lib/public/schedule-times";
import { isAuditField } from "@/lib/catalog/audit-fields";
import { applyStatHeaderChange, deriveSlotTarget, frequencyTypeLabel } from "@/lib/statistics/model";
import {
  deriveFrequencyStart,
  formatStamp,
  parseStartDatetime,
  stampForSlot,
} from "@/lib/statistics/frequency";
import { isTimeZone } from "@/lib/statistics/time-zone";
import { TimeZoneSelect } from "@/components/statistics/time-zone-select";
import { useInstallTimeZone } from "@/components/shell/site-mode-provider";

/** The form's Time zone when it is a zone, else the install's. */
function statZone(values: Record<string, string> | undefined, installZone: string): string {
  const zone = String(values?.time_zone ?? "").trim();
  return isTimeZone(zone) ? zone : installZone;
}
import type { FrequencyType } from "@/lib/statistics/model";
import { useSession } from "@/lib/auth/use-session";
import {
  ColumnHeaders,
  rowClickIsToggle,
  sortByText,
  toggleSort,
  usePersistedColumnOrder,
  type TableSort,
} from "@/components/settings/records-table";

export type ListingField = {
  key: string;
  label: string;
  kind?:
    | "text"
    | "textarea"
    | "select"
    | "boolean"
    | "number"
    | "date"
    | "datetime"
    | "email"
    | "url"
    | "phone"
    | "lookup"
    | "image_gallery"
    | "attachments"
    | "summary"
    | "formula"
    | "text_list"
    | "multi_lookup"
    | "slider"
    | "html";
  /** slider: step between 0 and 100 (default 5). */
  step?: number;
  options?: string[];
  /** Display labels (api codes stay as values) */
  optionLabels?: string[];
  /** Values the operator cannot pick again (already seeded). */
  disabledOptions?: string[];
  /** Show in table columns (default true for first fields) */
  column?: boolean;
  /** Runtime saved-layout preference; defaults to one grid column. */
  span?: number;
  /** Mask on screen (Show / Hide). */
  secret?: boolean;
  /** 1.0.14: a Summary field shown as a percentage. */
  summaryPercent?: boolean;
  /** 1.0.15: lookup filter (only target records whose field equals the value). */
  lookupFilter?: LookupFilter | null;
  /** header_lines placement — listing filters by this; omitted on other tables. */
  zoneRole?: "header" | "list" | null;
  required?: boolean;
  lookupObjectApiName?: string | null;
  defaultValue?: string;
  readOnly?: boolean;
  /** Number with a scroller (arrows, hold, drag) clamped to this range. */
  numberRange?: { min?: number; max?: number; step?: number; dragStep?: number };
  /** Statistics line stamp: compute from header start + slot. */
  stampConfig?: {
    startDatetime: string;
    frequencyType: string;
    frequencyQty: number;
    series: number;
    /** 1.0.21: the statistic's zone. */
    timeZone: string;
  };
};

export type EntityListingProps<T extends Record<string, unknown>> = {
  title?: string;
  summary: string;
  accent?: string;
  fields: ListingField[];
  rows: T[];
  getRowId: (row: T) => string;
  /** Map row -> raw field values (used for edit draft) */
  getCell: (row: T, key: string) => string;
  /** Optional display formatter (defaults to getCell) */
  formatCell?: (row: T, key: string, raw: string) => string;
  /** Optional rich cell renderer (wins over formatCell when provided) */
  renderCell?: (row: T, key: string, raw: string) => ReactNode;
  /** Called when user adds a mock/local row (optional persistence later) */
  onAdd?: (draft: Record<string, string>) => Promise<boolean | void> | boolean | void;
  onUpdate?: (id: string, draft: Record<string, string>) => Promise<boolean | void> | boolean | void;
  /** Optional delete handler (dynamic records). Shows a Delete control per row. */
  onDelete?: (id: string) => void;
  emptyLabel?: string;
  headerExtra?: ReactNode;
  /** Filters / extra controls in the New Record row (Records Editor Field pattern). */
  headerFilters?: ReactNode;
  /** Optional href for a "View" button on each row */
  viewHref?: (row: T) => string;
  /** #185 Slice A (rev E section 7.3): row-click detail navigation. When set,
   *  clicking a row (outside its action controls) opens the record detail. */
  onRowOpen?: (row: T) => void;
  /** In-place expand (Statistics headers). Takes precedence over onRowOpen. */
  expandedRowId?: string | null;
  onExpandedRowChange?: (id: string | null) => void;
  renderExpandedRow?: (row: T) => ReactNode;
  /** When set with renderExpandedRow, listing Edit expands that row into edit mode (one editor). */
  expandedEditing?: boolean;
  onRowEdit?: (row: T) => void;
  /** Leave the row expanded; only leave edit mode (do not collapse). */
  onRowCancelEdit?: () => void;
  /** Radio to choose which row drives Spatial Twin (e.g. Statistics graph). */
  showRowSelect?: boolean;
  selectedRowId?: string | null;
  onRowSelect?: (id: string) => void;
  rowSelectLabel?: string;
  /** Live draft for Spatial Twin previews (New / inline edit). */
  onDraftChange?: (draft: Record<string, string> | null) => void;
  /** 1.0.15: adjust a draft after each change (live preview of formulas). */
  deriveDraft?: (next: Record<string, string>, changedKey: string, prev: Record<string, string>) => Record<string, string>;
  /** Optional badge text (default Listing) */
  badgeLabel?: string;
  /** Rows are edited in place (renderInlineCell): no Edit button, no row editor. */
  inlineEdit?: boolean;
  /** Label for the New Record button and form (e.g. "Add row"). */
  addLabel?: string;
  /** Show Delete as a trash icon instead of the word. The confirm dialog is the same. */
  deleteIcon?: boolean;
  /** An editable control for this cell, or null to show the value as text. */
  renderInlineCell?: (row: T, key: string) => ReactNode | null;
  /** Body for the New Record form (e.g. the Edit layout sections) instead of the flat field list. */
  renderNewFormBody?: (
    draft: Record<string, string>,
    setDraft: Dispatch<SetStateAction<Record<string, string>>>,
  ) => ReactNode;
  deleteTitle?: string;
  deleteDescription?: string;
  /** Persist column order under this key. Defaults to title + field keys. */
  columnStorageKey?: string;
  /** Preferred visible column order (unknown keys ignored; remaining fields append). */
  columnOrder?: string[];
  /** Drag headers to reorder. Default true. */
  reorderable?: boolean;
  /** When false, hide New Record (e.g. Single Series is full). */
  canAdd?: boolean;
  addBlockedHint?: string;
  /** First-load sort. Defaults to the first visible column, ascending. */
  defaultSort?: TableSort;
  /** Sort key (defaults to formatCell / raw). Use ISO for datetimes. */
  sortCell?: (row: T, key: string, raw: string) => string;
  /** When the primary sort ties, order by this field ascending. */
  tieBreakKey?: string;
};

type ListingCriterion = { key: string; value: string };

/**
 * Shared listing toolbar (state_listing_toolbar.md): criteria chips for
 * currently rendered non-secret columns; Columns picker lists every
 * non-secret ERD field that can be a table column.
 */
function ListingToolbar({
  fields,
  criteria,
  onAdd,
  onRemove,
  onClear,
  visibleKeys,
  onToggleColumn,
  search,
  onSearch,
}: {
  fields: ListingField[];
  criteria: ListingCriterion[];
  onAdd: (criterion: ListingCriterion) => void;
  onRemove: (key: string, value: string) => void;
  onClear: () => void;
  visibleKeys: string[];
  onToggleColumn: (key: string) => void;
  search: string;
  onSearch: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [columnKey, setColumnKey] = useState("");
  const [value, setValue] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  /** Columns picker: every non-secret field that can be a table column (ERD). */
  const columnable = useMemo(
    () => fields.filter((f) => !f.secret),
    [fields],
  );
  /** Filter: columns currently rendered (contract §1.1). */
  const filterable = useMemo(
    () => columnable.filter((f) => visibleKeys.includes(f.key)),
    [columnable, visibleKeys],
  );
  const activeField = filterable.find((f) => f.key === columnKey);
  const valueOptions = useMemo(() => {
    if (!activeField) return [];
    if (activeField.kind === "boolean") return ["true", "false"];
    return activeField.options ?? [];
  }, [activeField]);
  const usePicklist = useMemo(() => {
    if (!activeField) return false;
    return (
      activeField.kind === "boolean" ||
      (activeField.kind === "select" && (activeField.options?.length ?? 0) > 0)
    );
  }, [activeField]);
  const commit = () => {
    if (!activeField || !value.trim()) return;
    onAdd({ key: activeField.key, value: value.trim() });
    setValue("");
    setOpen(false);
  };
  const chipLabel = (c: ListingCriterion) => {
    const field = fields.find((f) => f.key === c.key);
    const idx = field?.options?.indexOf(c.value) ?? -1;
    const shown =
      field?.optionLabels && idx >= 0
        ? field.optionLabels[idx]
        : field?.kind === "boolean"
          ? c.value === "true"
            ? "Yes"
            : "No"
          : c.value;
    return (field?.label ?? c.key) + ": " + shown;
  };
  if (columnable.length === 0 && criteria.length === 0) return null;
  return (
    <div className="border-b border-border bg-muted/20 px-4 py-2.5 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen((o) => !o);
            setColumnKey("");
            setValue("");
          }}
          className="rounded-md px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90"
          style={{ backgroundColor: theme.colors.brand }}
        >
          Filter
        </button>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search name…"
          aria-label="Search records by name"
          className="w-44 rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {columnable.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setPickerOpen((o) => !o)}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              Columns
            </button>
            {pickerOpen && (
              <div className="absolute left-0 z-30 mt-1 max-h-80 w-64 overflow-y-auto rounded-md border border-border bg-background p-2 shadow-lg">
                {columnable.map((f) => (
                  <label
                    key={f.key}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={visibleKeys.includes(f.key)}
                      onChange={() => onToggleColumn(f.key)}
                    />
                    <span>{f.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
        {criteria.map((c) => (
          <span
            key={c.key + ":" + c.value}
            className="flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs"
          >
            {chipLabel(c)}
            <button
              type="button"
              aria-label={"Remove filter " + chipLabel(c)}
              onClick={() => onRemove(c.key, c.value)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {criteria.length > 1 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>
      {open && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter column"
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={columnKey}
            onChange={(e) => {
              setColumnKey(e.target.value);
              setValue("");
            }}
          >
            <option value="">Column…</option>
            {filterable.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
          {activeField &&
            (usePicklist ? (
              <select
                aria-label="Filter value"
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                onChange={(e) => setValue(e.target.value)}
              >
                <option value="">Value…</option>
                {valueOptions.map((v) => {
                  const idx = activeField.options?.indexOf(v) ?? -1;
                  const shown =
                    activeField.optionLabels && idx >= 0
                      ? activeField.optionLabels[idx]
                      : activeField.kind === "boolean"
                        ? v === "true"
                          ? "Yes"
                          : "No"
                        : v;
                  return (
                    <option key={v} value={v}>
                      {shown}
                    </option>
                  );
                })}
              </select>
            ) : (
              <input
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                type="text"
                placeholder="Value…"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit();
                }}
              />
            ))}
          <button
            type="button"
            onClick={commit}
            disabled={!activeField || !value.trim()}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
            style={
              activeField && value
                ? { borderColor: theme.colors.brand, color: theme.colors.brand }
                : undefined
            }
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  allValues,
  onFieldChange,
}: {
  field: ListingField;
  value: string;
  onChange: (v: string) => void;
  allValues?: Record<string, string>;
  onFieldChange?: (key: string, value: string) => void;
}) {
  const base =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const kind = field.kind ?? "text";
  const isChecked = value === "true" || value === "1";
  const locked = field.readOnly === true || isAuditField(field.key);
  const pairingEntry = useDriverCatalog(allValues?.driver_id);
  const installZone = useInstallTimeZone();
  if (field.key === "target_kind" || field.key === "record_mode") return null;
  if (!pairingFieldVisible(field.key, pairingEntry, allValues)) return null;
  if (field.key === "line_stamp") {
    const slot = Number(allValues?.line_slot ?? "");
    const cfg = field.stampConfig;
    let shown = value;
    // Stamps show in the statistic's zone, not the browser's (1.0.21).
    const zone = cfg?.timeZone || installZone;
    if (cfg) {
      const start = parseStartDatetime(cfg.startDatetime, zone);
      if (start && Number.isInteger(slot)) {
        shown = formatStamp(
          stampForSlot(
            start,
            cfg.frequencyType as FrequencyType,
            cfg.series,
            slot,
            cfg.frequencyQty,
            zone,
          ),
          zone,
        );
      } else if (value) {
        const parsed = parseStartDatetime(value, zone);
        shown = parsed ? formatStamp(parsed, zone) : value;
      }
    } else if (value) {
      const parsed = parseStartDatetime(value, zone);
      shown = parsed ? formatStamp(parsed, zone) : value;
    }
    return (
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          {field.label}
        </span>
        <p className="text-sm">{shown || "Select a frequency value to stamp this line."}</p>
      </label>
    );
  }
  if (scheduleFieldHidden(field.key, allValues?.kind)) return null;
  if (field.key === "custom_slots") {
    return (
      <CustomSlotsField
        label={field.label}
        value={value}
        onChange={locked ? undefined : onChange}
        readOnly={locked}
      />
    );
  }
  if (field.key === "notes" && field.label === "Data") {
    return (
      <HtmlEditor
        label={field.label}
        value={value}
        format="html"
        onChange={locked ? undefined : onChange}
        readOnly={locked}
      />
    );
  }
  if (kind === "html") {
    return (
      <HtmlEditor
        label={field.label}
        value={value}
        format="html"
        onChange={locked ? undefined : onChange}
        readOnly={locked}
      />
    );
  }
  if (field.key === "body_html") {
    return (
      <HtmlEditor
        label={field.label}
        value={value}
        format={allValues?.body_format === "page" ? "page" : normalizePageBodyFormat(allValues?.body_format)}
        onChange={onChange}
        onFormatChange={(fmt) => onFieldChange?.("body_format", fmt)}
      />
    );
  }
  if (field.key === "frequency_start") {
    const derived =
      deriveFrequencyStart(allValues?.frequency_type, allValues?.start_datetime, statZone(allValues, installZone)) ?? value;
    return (
      <FrequencyStartField
        label={field.label}
        frequencyType={allValues?.frequency_type ?? ""}
        value={derived}
        required={false}
        readOnly
        help="From Start datetime and Frequency type"
      />
    );
  }
  // 1.0.14: statistics fed from records - pickers that follow the Source record type.
  if (field.key === "source_record_id") {
    return (
      <RecordInstanceLookupField
        label={field.label}
        value={value}
        onChange={locked ? undefined : onChange}
        readOnly={locked}
        recordType={allValues?.source_record_type}
        help="Leave empty to use every record of the type"
      />
    );
  }
  if (
    field.key === "source_date_field" ||
    field.key === "source_value_field" ||
    field.key === "source_filter_field"
  ) {
    return (
      <LineFieldSelect
        label={field.label}
        value={value}
        onChange={locked ? undefined : onChange}
        readOnly={locked}
        recordType={allValues?.source_record_type}
        accept={field.key === "source_date_field" ? "date" : field.key === "source_value_field" ? "number" : "any"}
        placement={allValues?.source_read_from === "records" ? "header" : field.key === "source_value_field" ? "list" : "both"}
        emptyLabel={
          field.key === "source_date_field"
            ? "Select the date field…"
            : field.key === "source_value_field"
              ? "— (count the lines)"
              : "— (all lines)"
        }
        help={helpForField(field.key)}
      />
    );
  }
  if (field.key === "slot_target") {
    return (
      <FrequencyStartField
        label={"Target per " + frequencyTypeLabel(allValues?.frequency_type)}
        frequencyType=""
        value={deriveSlotTarget(allValues ?? {})}
        required={false}
        readOnly
        help="Period target divided by Frequency quantity"
      />
    );
  }
  if (kind === "image_gallery") {
    return (
      <ImageGalleryField
        label={field.label}
        value={value}
        onChange={locked ? undefined : onChange}
        readOnly={locked}
      />
    );
  }
  if (kind === "attachments") {
    return (
      <AttachmentsField
        label={field.label}
        value={value}
        onChange={locked ? undefined : onChange}
        readOnly={locked}
      />
    );
  }
  if (kind === "summary") {
    return <SummaryValueField label={field.label} value={value} percent={field.summaryPercent} />;
  }
  if (kind === "formula") {
    return <SummaryValueField label={field.label} value={value} help="Worked out by a formula" />;
  }
  if (kind === "text_list") {
    return (
      <TextListField
        label={field.label}
        value={value}
        onChange={locked ? undefined : onChange}
        readOnly={locked}
        required={field.required}
      />
    );
  }
  if (kind === "multi_lookup") {
    return (
      <RecordMultiLookupField
        label={field.label}
        value={value}
        onChange={locked ? undefined : onChange}
        readOnly={locked}
        required={field.required}
        recordType={field.lookupObjectApiName}
      />
    );
  }
  if (field.key === "logo_url" || field.key.endsWith("_logo_url")) {
    return (
      <ImageUrlField
        label={field.label}
        value={value}
        onChange={locked ? undefined : onChange}
        required={field.required}
        readOnly={locked}
      />
    );
  }
  if (field.lookupObjectApiName === "render_driver" || field.key === "driver_id") {
    return (
      <RenderDriverLookupField
        label={field.label}
        value={value}
        onChange={locked ? undefined : onChange}
        required={field.required}
        readOnly={locked}
      />
    );
  }
  if (field.key === "render_option") {
    return (
      <RenderOptionField
        label={field.label}
        value={value}
        onChange={locked ? undefined : onChange}
        readOnly={locked}
        driverRecordId={allValues?.driver_id}
      />
    );
  }
  // 1.0.20: an Integration line's Filter, built from that line's record type (state_integrations.md I18).
  if (field.key === "flow_filter") {
    return (
      <PairingFilterField
        label={field.label}
        value={value}
        onChange={locked ? undefined : onChange}
        readOnly={locked}
        help="All conditions must match. No conditions: every record of the type."
        recordType={allValues?.flow_record_type}
      />
    );
  }
  if (field.key === "filter_json") {
    return (
      <PairingFilterField
        label={field.label}
        value={value}
        onChange={locked ? undefined : onChange}
        readOnly={locked}
        targetType={allValues?.target_record_type}
      />
    );
  }
  if (field.key === "input_map_json") {
    return (
      <PairingInputMapField
        label={field.label}
        value={value}
        onChange={locked ? undefined : onChange}
        readOnly={locked}
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
        onChange={locked ? undefined : onChange}
        required={field.required}
        readOnly={locked}
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
        onChange={locked ? undefined : onChange}
        required={field.required}
        readOnly={locked}
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
        filter={field.lookupFilter}
        values={allValues}
        value={value}
        onChange={locked ? undefined : onChange}
        required={field.required}
        readOnly={locked}
      />
    );
  }
  if (
    // Any record type (system or custom) gets the record picker (1.0.14).
    (kind === "lookup" || field.lookupObjectApiName === "location" || field.lookupObjectApiName === "event") &&
    isRecordTypeLookup(field.lookupObjectApiName)
  ) {
    return (
      <RecordInstanceLookupField
        label={field.label}
        value={value}
        onChange={locked ? undefined : onChange}
        required={field.required}
        readOnly={locked}
        recordType={field.lookupObjectApiName}
        filter={field.lookupFilter}
        values={allValues}
      />
    );
  }
  if (kind === "lookup" || field.lookupObjectApiName === "user") {
    return (
      <UserLookupField
        label={field.label}
        value={value}
        onChange={locked ? undefined : onChange}
        required={field.required}
        readOnly={locked}
      />
    );
  }
  if (field.key === "password") {
    return (
      <PasswordField
        label={field.label}
        value={value}
        onChange={locked ? undefined : onChange}
        readOnly={locked}
      />
    );
  }
  if (field.key === "avatar") {
    return (
      <ProfilePictureField
        label={field.label}
        value={value}
        onChange={locked ? undefined : onChange}
        readOnly={locked}
      />
    );
  }
  if (field.secret) {
    return (
      <SecretValueField
        label={field.label}
        value={value}
        onChange={onChange}
      />
    );
  }
  if (locked) {
    return (
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">{field.label}</span>
        <p className="text-sm">{value || "—"}</p>
      </label>
    );
  }
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">
        {field.label}
        {field.required ? " *" : ""}
      </span>
      {field.key === "time_zone" ? (
        <TimeZoneSelect className={base} value={value} allowEmpty={!value} onChange={(zone) => onChange(zone)} />
      ) : kind === "textarea" ? (
        <textarea
          className={cn(base, "min-h-[72px] resize-y")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : kind === "select" ? (
        <select
          className={base}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (field.key === "interval_unit") {
              onFieldChange?.("interval_iso", intervalIso(allValues?.interval_count, e.target.value));
            }
          }}
        >
          <option value="">Select…</option>
          {(field.options ?? []).map((o, i) => (
            <option key={o} value={o} disabled={field.disabledOptions?.includes(o)}>
              {field.optionLabels?.[i] ?? o}
            </option>
          ))}
        </select>
      ) : kind === "slider" ? (
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            step={field.step ?? 5}
            className="flex-1"
            value={value === "" ? 0 : Number(value) || 0}
            onChange={(e) => onChange(e.target.value)}
          />
          <span className="w-12 text-right text-sm tabular-nums">{value === "" ? "—" : `${value}%`}</span>
        </div>
      ) : field.numberRange ? (
        <NumberScrubInput
          value={value}
          onChange={onChange}
          min={field.numberRange.min}
          max={field.numberRange.max}
          step={field.numberRange.step}
          dragStep={field.numberRange.dragStep}
          ariaLabel={field.label}
          placeholder="–"
        />
      ) : kind === "boolean" ? (
        <BooleanSwitch
          checked={isChecked}
          onChange={(next) => onChange(next ? "true" : "false")}
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
            kind === "email"
              ? "name@example.com"
              : kind === "phone"
                ? "+1 555 000 0000"
                : undefined
          }
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (field.key === "interval_count") {
              onFieldChange?.("interval_iso", intervalIso(e.target.value, allValues?.interval_unit));
            }
          }}
        />
      )}
    </label>
  );
}

function InlineForm({
  heading,
  fields,
  draft,
  setDraft,
  accent,
  onCommit,
  onCancel,
  commitLabel,
  body,
  deriveDraft,
}: {
  heading: string;
  fields: ListingField[];
  draft: Record<string, string>;
  setDraft: Dispatch<SetStateAction<Record<string, string>>>;
  accent: string;
  onCommit: () => void;
  onCancel: () => void;
  commitLabel: string;
  /** Replaces the flat field grid (layout sections). */
  body?: ReactNode;
  deriveDraft?: (next: Record<string, string>, changedKey: string, prev: Record<string, string>) => Record<string, string>;
}) {
  const stampsPairingType = fields.some(
    (f) => f.key === "driver_id" || f.key === "target_record_type",
  );
  useStampPairingRecordType(
    stampsPairingType ? draft.driver_id : undefined,
    draft.target_record_type,
    (type, previous) =>
      setDraft((d) => ({
        ...d,
        target_record_type: type,
        ...(previous && previous !== type ? { target_record_id: "" } : {}),
      })),
  );
  return (
    <form
      className="border-t border-border bg-muted/20 px-4 py-4 sm:px-6"
      style={{ boxShadow: `inset 3px 0 0 ${accent}` }}
      onSubmit={(e) => {
        e.preventDefault();
        onCommit();
      }}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{heading}</p>
        <span className="text-xs text-muted-foreground">Inline row editor</span>
      </div>
      {body ?? (
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.filter((f) => f.key !== "body_format" && !isSelectionFollowup(f.key)).map((f) => (
          <div key={f.key} className={(f.span === 2 || f.kind === "textarea" || f.kind === "html" || f.kind === "image_gallery" || f.kind === "attachments" || f.kind === "text_list" || f.key === "body_html" || f.key === "selection_mode") ? "sm:col-span-2" : undefined}>
            {f.key === "selection_mode" ? (
              <div className="space-y-3">
                <FieldInput
                  field={f}
                  value={draft[f.key] ?? ""}
                  onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))}
                  allValues={draft}
                  onFieldChange={(key, v) => setDraft((d) => ({ ...d, [key]: v }))}
                />
                {fields.filter((row) => isSelectionFollowup(row.key)).map((extra) => (
                  <FieldInput
                    key={extra.key}
                    field={extra}
                    value={draft[extra.key] ?? ""}
                    onChange={(v) => setDraft((d) => ({ ...d, [extra.key]: v }))}
                    allValues={draft}
                    onFieldChange={(key, v) => setDraft((d) => ({ ...d, [key]: v }))}
                  />
                ))}
              </div>
            ) : (
            <FieldInput
              field={f}
              value={draft[f.key] ?? ""}
              onChange={(v) =>
                setDraft((d) => {
                  const next = applyStatHeaderChange({ ...d, [f.key]: v }, f.key, d);
                  return deriveDraft ? deriveDraft(next, f.key, d) : next;
                })
              }
              allValues={draft}
              onFieldChange={(key, v) => setDraft((d) => ({ ...d, [key]: v }))}
            />
            )}
          </div>
        ))}
      </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="submit"
          className="rounded-md px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: accent }}
        >
          {commitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          Cancel
        </button>
        {/* 1.0.20: an Access-token Credential issues its token from here (list records open inline). */}
        {draft.id && draft.auth_type === "token" && fields.some((f) => f.key === "configuration") ? (
          <IssueTokenButton
            credentialId={draft.id}
            hasToken={(draft.configuration ?? "").includes("token_hash")}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          />
        ) : null}
      </div>
    </form>
  );
}

/**
 * I5.6.10/11 listing pattern: table + New under header + Edit expands INLINE on row.
 * Shared by Users pilot and zone config entity tabs.
 */
export function EntityListing<T extends Record<string, unknown>>({
  title = "",
  summary,
  accent = theme.colors.brand,
  fields,
  rows,
  getRowId,
  getCell,
  formatCell,
  renderCell,
  onAdd,
  onUpdate,
  onDelete,
  emptyLabel,
  headerExtra,
  headerFilters,
  viewHref,
  onRowOpen,
  expandedRowId,
  onExpandedRowChange,
  renderExpandedRow,
  expandedEditing = false,
  onRowEdit,
  onRowCancelEdit,
  showRowSelect = false,
  selectedRowId = null,
  onRowSelect,
  rowSelectLabel = "Graph",
  badgeLabel = "Listing",
  inlineEdit = false,
  addLabel = "New Record",
  deleteIcon = false,
  renderInlineCell,
  renderNewFormBody,
  deriveDraft,
  deleteTitle = "Delete this record?",
  deleteDescription = "This permanently removes the record. This cannot be undone.",
  columnStorageKey,
  columnOrder,
  reorderable = true,
  onDraftChange,
  canAdd = true,
  addBlockedHint,
  defaultSort,
  sortCell,
  tieBreakKey,
}: EntityListingProps<T>) {
  const session = useSession();
  const displayCell = (row: T, key: string): ReactNode => {
    const raw = getCell(row, key);
    if (renderCell) return renderCell(row, key, raw);
    const field = fields.find((f) => f.key === key);
    if (field?.secret) return maskSecretDisplay(raw);
    // 1.0.20: filters read as text ("ID is one of …"), not JSON.
    if (key === "flow_filter" || key === "filter_json") return describeFilter(raw);
    if (formatCell) return formatCell(row, key, raw);
    if (field?.kind === "select" && field.optionLabels) {
      const i = field.options?.indexOf(raw) ?? -1;
      if (i >= 0) return field.optionLabels[i] ?? raw;
    }
    if (field?.kind === "slider") return raw === "" ? "" : `${raw}%`;
    // 1.0.14: checkboxes and dates read like the forms do.
    if (field?.kind === "boolean") {
      return raw === "true" || raw === "1" ? "Yes" : raw === "false" || raw === "0" ? "No" : raw;
    }
    if ((field?.kind === "date" || field?.kind === "datetime") && raw.trim()) {
      return displayDateValue(raw, field.kind);
    }
    if (field?.kind === "html") return htmlToText(raw);
    if (field?.kind === "text_list") {
      const count = parseTextList(raw).length;
      return count ? `${count} ${count === 1 ? "item" : "items"}` : "";
    }
    if (field?.kind === "attachments") {
      const count = parseRecordFiles(raw).length;
      return count ? `${count} ${count === 1 ? "file" : "files"}` : "";
    }
    if (field?.kind === "summary" && field.summaryPercent && raw.trim()) return `${raw}%`;
    if (field?.kind === "multi_lookup") {
      return raw.trim() ? <RecordNames value={raw} recordType={field.lookupObjectApiName} /> : "";
    }
    if (field?.kind === "lookup" && field.lookupObjectApiName === "organization") {
      return raw.trim() ? <OrganizationName id={raw.trim()} /> : "";
    }
    if (field?.lookupObjectApiName === "user") {
      return raw.trim() ? <UserName id={raw.trim()} /> : "";
    }
    if (field?.kind === "lookup" && isRecordTypeLookup(field.lookupObjectApiName)) {
      return raw.trim() ? <RecordNames value={raw} recordType={field.lookupObjectApiName} /> : "";
    }
    return raw;
  };
  const allColumnFields = useMemo(
    () => fields.filter((f) => !f.secret),
    [fields],
  );
  const defaultColKeys = useMemo(() => {
    const keys = fields.filter((f) => f.column !== false && !f.secret).map((c) => c.key);
    if (!columnOrder?.length) return keys;
    const known = new Set(allColumnFields.map((c) => c.key));
    const next = columnOrder.filter((k) => known.has(k));
    for (const k of keys) if (!next.includes(k)) next.push(k);
    return next;
  }, [fields, allColumnFields, columnOrder]);
  const persistKey = columnStorageKey ?? `mc.listing.${title || "table"}.${defaultColKeys.join(".")}`;
  const persistCatalog = useMemo(
    () => allColumnFields.map((c) => c.key),
    [allColumnFields],
  );
  const persistOpts = useMemo(
    () => ({ catalog: persistCatalog, visibility: true as const }),
    [persistCatalog],
  );
  const [colKeys, reorderCols, setColumnOrder] = usePersistedColumnOrder(
    persistKey,
    defaultColKeys,
    persistOpts,
  );
  const [sort, setSort] = useState<TableSort>(
    () => defaultSort ?? { key: defaultColKeys[0] ?? "", dir: "asc" },
  );
  const [dragOver, setDragOver] = useState<string | null>(null);
  // Edit opens the row editor; in-place tables (inlineEdit) have no Edit button.
  const hasActions = !!(viewHref || onDelete || (!inlineEdit && (onAdd || onUpdate)));
  const rowEditable = !inlineEdit && !!(onAdd || onUpdate);
  const extraColCount = (hasActions ? 1 : 0) + (showRowSelect ? 1 : 0);
  const orderedColumns = useMemo(
    () =>
      colKeys
        .map((k) => allColumnFields.find((c) => c.key === k))
        .filter((c): c is ListingField => Boolean(c)),
    [colKeys, allColumnFields],
  );
  const headerCols = useMemo(
    () => (hasActions ? [...colKeys, "actions"] : colKeys),
    [colKeys, hasActions],
  );
  const toggleColumnVisibility = (key: string) => {
    if (!colKeys.includes(key)) {
      setColumnOrder([...colKeys, key]);
      return;
    }
    if (colKeys.length <= 1) return; // keep at least one column rendered
    setColumnOrder(colKeys.filter((k) => k !== key));
    setCriteria((cs) => cs.filter((c) => c.key !== key));
  };
  const headerMeta = useMemo(() => {
    const meta: Record<string, { label: string; sortKey?: string }> = {
      actions: { label: "Actions" },
    };
    for (const c of allColumnFields) meta[c.key] = { label: c.label, sortKey: c.key };
    return meta;
  }, [allColumnFields]);
  const activeSort = useMemo<TableSort>(
    () =>
      colKeys.includes(sort.key)
        ? sort
        : { key: colKeys[0] ?? "", dir: "asc" },
    [colKeys, sort],
  );
  const [criteria, setCriteria] = useState<ListingCriterion[]>([]);
  const [search, setSearch] = useState("");
  const addCriterion = (criterion: ListingCriterion) =>
    setCriteria((cs) =>
      cs.some((c) => c.key === criterion.key && c.value === criterion.value) ? cs : [...cs, criterion],
    );
  const removeCriterion = (key: string, value: string) =>
    setCriteria((cs) => cs.filter((c) => !(c.key === key && c.value === value)));
  const clearCriteria = () => setCriteria([]);
  // Name column for record search: explicit name key/label, else first visible column.
  const nameKey = useMemo(() => {
    const byKey = fields.find((f) => f.key === "name");
    if (byKey) return byKey.key;
    const byLabel = fields.find((f) => (f.label ?? "").toLowerCase() === "name");
    if (byLabel) return byLabel.key;
    const firstVisible = fields.find((f) => f.column !== false && !f.secret);
    return firstVisible?.key ?? "";
  }, [fields]);
  const filteredRows = useMemo(() => {
    let out = rows;
    // Stephen QA (0.7.154): criteria OR-combine by default and match by
    // case-insensitive "contains" on raw value or displayed text.
    if (criteria.length > 0) {
      out = out.filter((row) =>
        criteria.some((c) => {
          const raw = getCell(row, c.key);
          const shown = formatCell ? formatCell(row, c.key, raw) : raw;
          const needle = c.value.trim().toLowerCase();
          return (
            raw.toLowerCase().includes(needle) ||
            shown.toLowerCase().includes(needle)
          );
        }),
      );
    }
    const needle = search.trim().toLowerCase();
    if (needle && nameKey) {
      out = out.filter((row) => {
        const raw = getCell(row, nameKey);
        const shown = formatCell ? formatCell(row, nameKey, raw) : raw;
        return (
          raw.toLowerCase().includes(needle) ||
          shown.toLowerCase().includes(needle)
        );
      });
    }
    return out;
  }, [rows, criteria, getCell, formatCell, search, nameKey]);
  const sortedRows = useMemo(() => {
    if (!activeSort.key) return filteredRows;
    const sign = activeSort.dir === "asc" ? 1 : -1;
    const text = (row: T, key: string) => {
      const raw = getCell(row, key);
      if (sortCell) return sortCell(row, key, raw);
      return formatCell ? formatCell(row, key, raw) : raw;
    };
    return [...filteredRows].sort((a, b) => {
      const primary = text(a, activeSort.key).localeCompare(text(b, activeSort.key), undefined, {
        sensitivity: "base",
      });
      if (primary !== 0) return sign * primary;
      if (!tieBreakKey || tieBreakKey === activeSort.key) return 0;
      return text(a, tieBreakKey).localeCompare(text(b, tieBreakKey), undefined, { sensitivity: "base" });
    });
  }, [filteredRows, activeSort, getCell, formatCell, sortCell, tieBreakKey]);

  const [editor, setEditor] = useState<null | "new" | string>(null);
  // Expanded rows and the row editor match the visible width of the table
  // viewport, so they never run off the side when the table scrolls (phones).
  const tableViewportRef = useRef<HTMLDivElement>(null);
  const [tableViewportWidth, setTableViewportWidth] = useState<number | null>(null);
  useEffect(() => {
    const el = tableViewportRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setTableViewportWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const rowPanelStyle = tableViewportWidth ? { width: tableViewportWidth } : undefined;
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setEditor(null);
    setDraft({});
  }, [title]);

  const blank = () => {
    const d: Record<string, string> = {};
    for (const f of fields) d[f.key] = f.defaultValue ?? "";
    if (session?.userId) {
      if ("created_by" in d) d.created_by = session.userId;
      if ("last_modified_by" in d) d.last_modified_by = session.userId;
    }
    return d;
  };

  const startNew = () => {
    if (editor === "new") {
      setEditor(null);
      return;
    }
    setDraft(blank());
    setEditor("new");
  };

  const startEdit = (row: T) => {
    const id = getRowId(row);
    if (editor === id) {
      setEditor(null);
      return;
    }
    const d = blank();
    for (const f of fields) d[f.key] = getCell(row, f.key);
    if (session?.userId && "last_modified_by" in d) {
      d.last_modified_by = session.userId;
    }
    setDraft(d);
    setEditor(id);
  };

  useEffect(() => {
    if (!onDraftChange) return;
    onDraftChange(editor ? draft : null);
  }, [draft, editor, onDraftChange]);

  useEffect(() => {
    return () => onDraftChange?.(null);
  }, [onDraftChange]);

  const cancel = () => {
    setEditor(null);
    setDraft(blank());
  };

  const commit = async () => {
    let ok = true;
    if (editor === "new") {
      ok = (await onAdd?.(draft)) !== false;
    } else if (typeof editor === "string") {
      ok = (await onUpdate?.(editor, draft)) !== false;
    }
    // L3: keep the draft + editor open when validation failed (handler returned false).
    if (ok) {
      setEditor(null);
      setDraft(blank());
    }
  };

  return (
    <>
    <Card className="h-full min-h-[640px] overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title ? <CardTitle className="text-lg">{title}</CardTitle> : null}
            {summary ? <p className="mt-1 text-sm text-muted-foreground">{summary}</p> : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 whitespace-nowrap">
            <div className="flex flex-nowrap items-center justify-end gap-2">
              {headerFilters}
              {canAdd && (onAdd || onUpdate || viewHref) && (
                <button
                  type="button"
                  onClick={startNew}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-white"
                  style={{ backgroundColor: accent }}
                >
                  {editor === "new" ? "Close" : addLabel}
                </button>
              )}
              {!canAdd && addBlockedHint ? (
                <p className="max-w-[220px] whitespace-normal text-right text-xs text-muted-foreground">
                  {addBlockedHint}
                </p>
              ) : null}
            </div>
            <ListingBadge label={badgeLabel} accent={accent} />
            {headerExtra}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col space-y-0 p-0">
        <ListingToolbar
          fields={fields}
          criteria={criteria}
          onAdd={addCriterion}
          onRemove={removeCriterion}
          onClear={clearCriteria}
          visibleKeys={colKeys}
          onToggleColumn={toggleColumnVisibility}
          search={search}
          onSearch={setSearch}
        />
        {editor === "new" && (
          <InlineForm
            heading={addLabel}
            fields={fields}
            draft={draft}
            setDraft={setDraft}
            accent={accent}
            onCommit={commit}
            onCancel={cancel}
            commitLabel="Add to table"
            deriveDraft={deriveDraft}
            body={renderNewFormBody?.(draft, setDraft)}
          />
        )}

        <div ref={tableViewportRef} className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-card shadow-[0_1px_0_0_hsl(var(--border))]">
              <ColumnHeaders
                cols={headerCols}
                meta={headerMeta}
                sort={activeSort}
                onSort={(k) => setSort((s) => toggleSort(s, k))}
                onReorder={reorderCols}
                dragOver={dragOver}
                onDragOverKey={setDragOver}
                reorderable={reorderable}
                leading={
                  showRowSelect ? (
                    <th className="w-12 px-3 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {rowSelectLabel}
                    </th>
                  ) : null
                }
              />
            </thead>
            <tbody>
              {sortedRows.map((row) => {
                const id = getRowId(row);
                return (
                  <Fragment key={id}>
                    <tr
                      className={cn(
                        "border-b border-border/70 transition-colors hover:bg-muted/30",
                        (renderExpandedRow || onRowOpen || rowEditable) && "cursor-pointer",
                        (editor === id || expandedRowId === id) && "bg-muted/40",
                      )}
                      onClick={(e) => {
                        if (!rowClickIsToggle(e.target)) return;
                        if (renderExpandedRow && onExpandedRowChange) {
                          onRowSelect?.(id);
                          onExpandedRowChange(expandedRowId === id ? null : id);
                          return;
                        }
                        if (onRowOpen) onRowOpen(row);
                        else if (rowEditable) startEdit(row);
                      }}
                    >
                      {showRowSelect ? (
                        <td
                          className="w-12 px-3 py-3 text-center align-top"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="radio"
                            name={`listing-select-${persistKey}`}
                            aria-label={`Show ${rowSelectLabel.toLowerCase()} for this row`}
                            checked={selectedRowId === id}
                            onChange={() => onRowSelect?.(id)}
                            onClick={() => onRowSelect?.(id)}
                            className="h-3.5 w-3.5 accent-current"
                            style={{ accentColor: accent }}
                          />
                        </td>
                      ) : null}
                      {orderedColumns.map((c) => {
                        const inline = renderInlineCell?.(row, c.key) ?? null;
                        return (
                          <td key={c.key} className="px-4 py-3 align-top text-foreground">
                            {inline ?? (
                              <span className="line-clamp-3 whitespace-pre-wrap">
                                {displayCell(row, c.key) || "—"}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      {hasActions && (
                        <td className="px-4 py-3 text-right align-top" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {viewHref && (
                              <Link
                                href={viewHref(row)}
                                className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                              >
                                View
                              </Link>
                            )}
                            {!inlineEdit && (onAdd || onUpdate || onRowEdit) && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (renderExpandedRow && onRowEdit && onExpandedRowChange) {
                                    if (expandedRowId === id && expandedEditing) {
                                      onRowCancelEdit?.();
                                      return;
                                    }
                                    onRowSelect?.(id);
                                    onRowEdit(row);
                                    return;
                                  }
                                  startEdit(row);
                                }}
                                className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                                style={
                                  editor === id || (expandedRowId === id && expandedEditing)
                                    ? { borderColor: accent, color: accent }
                                    : undefined
                                }
                              >
                                {editor === id || (expandedRowId === id && expandedEditing)
                                  ? "Cancel"
                                  : "Edit"}
                              </button>
                            )}
                            {onDelete && (
                              deleteIcon ? (
                                <button
                                  type="button"
                                  aria-label="Delete row"
                                  title="Delete row"
                                  onClick={() => setPendingDeleteId(id)}
                                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden />
                                </button>
                              ) : (
                              <button
                                type="button"
                                onClick={() => setPendingDeleteId(id)}
                                className="rounded-md border border-destructive/40 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                              >
                                Delete
                              </button>
                              )
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                    {expandedRowId === id && renderExpandedRow && (
                      <tr className="border-b border-border">
                        <td
                          colSpan={orderedColumns.length + extraColCount}
                          className="p-0"
                        >
                          <div className="sticky left-0" style={rowPanelStyle}>
                            {renderExpandedRow(row)}
                          </div>
                        </td>
                      </tr>
                    )}
                    {editor === id && !onRowEdit && (
                      <tr className="border-b border-border">
                        <td
                          colSpan={orderedColumns.length + extraColCount}
                          className="p-0"
                        >
                          <div className="sticky left-0" style={rowPanelStyle}>
                          <InlineForm
                            heading="Edit Record"
                            fields={fields}
                            draft={draft}
                            setDraft={setDraft}
                            accent={accent}
                            onCommit={commit}
                            onCancel={cancel}
                            commitLabel="Update row"
                            deriveDraft={deriveDraft}
                          />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {sortedRows.length === 0 && (
                <tr>
                  <td
                    colSpan={orderedColumns.length + extraColCount}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {emptyLabel ??
                      `No ${title ? title.toLowerCase() : "records"} yet.${
                        canAdd && (onAdd || onUpdate || viewHref) ? " Use New Record to add the first one." : ""
                      }`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
    <ConfirmDialog
      open={pendingDeleteId !== null}
      title={deleteTitle}
      description={deleteDescription}
      confirmLabel="Delete"
      tone="danger"
      onCancel={() => setPendingDeleteId(null)}
      onConfirm={() => {
        if (pendingDeleteId && onDelete) onDelete(pendingDeleteId);
        setPendingDeleteId(null);
      }}
    />
    </>
  );
}
