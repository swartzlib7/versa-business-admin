/**
 * Element types the canvas can bind. Palette chips are pairable drivers, not these rows.
 */
import { foldRecordTypeApiName } from "@/lib/catalog/name-aliases";
import { driverEntry } from "@/lib/public/render-drivers";

export type ElementTypeId =
  | "page"
  | "statistics"
  | "cycle_strip"
  | "inspection_report"
  | "contact"
  | "location"
  | "glossary"
  | "org_board";

export type ElementTypeDef = {
  id: ElementTypeId;
  label: string;
  recordType: ElementTypeId;
  parentKind: "environment" | "faculty";
  parentApiName: string;
  structure: "list" | "header_lines";
  hasLines: boolean;
  allowsTypeLevel: boolean;
  description: string;
};

export const ELEMENT_TYPE_PALETTE: ElementTypeDef[] = [
  {
    id: "page",
    label: "Page",
    recordType: "page",
    parentKind: "environment",
    parentApiName: "custom",
    structure: "list",
    hasLines: false,
    allowsTypeLevel: false,
    description: "Visitor pages. Body can render as Text or HTML.",
  },
  {
    id: "statistics",
    label: "Statistics",
    recordType: "statistics",
    parentKind: "environment",
    parentApiName: "custom",
    structure: "header_lines",
    hasLines: true,
    allowsTypeLevel: false,
    description: "One Statistics header, then a compatible driver.",
  },
  {
    id: "cycle_strip",
    label: "Cycle Strip",
    recordType: "cycle_strip",
    parentKind: "environment",
    parentApiName: "custom",
    structure: "list",
    hasLines: false,
    allowsTypeLevel: true,
    description: "All steps as a strip, or one step as a card.",
  },
  {
    id: "inspection_report",
    label: "Inspections & Reports",
    recordType: "inspection_report",
    parentKind: "faculty",
    parentApiName: "communications",
    structure: "header_lines",
    hasLines: true,
    allowsTypeLevel: false,
    description: "Inspection / report header and ticket lines.",
  },
  {
    id: "contact",
    label: "Contacts",
    recordType: "contact",
    parentKind: "faculty",
    parentApiName: "public",
    structure: "list",
    hasLines: false,
    allowsTypeLevel: false,
    description: "Distribution Contacts. Phone and email, then the related Organization.",
  },
  {
    id: "location",
    label: "Location",
    recordType: "location",
    parentKind: "environment",
    parentApiName: "locations",
    structure: "list",
    hasLines: false,
    allowsTypeLevel: false,
    description: "Environment Locations. Address, then Organization phone and email.",
  },
  {
    id: "glossary",
    label: "Glossary of Terms",
    recordType: "glossary",
    parentKind: "environment",
    parentApiName: "custom",
    structure: "list",
    hasLines: false,
    allowsTypeLevel: true,
    description: "Embed the live Glossary of Terms. No record pick.",
  },
  {
    id: "org_board",
    label: "Org Board",
    recordType: "org_board",
    parentKind: "environment",
    parentApiName: "custom",
    structure: "list",
    hasLines: false,
    allowsTypeLevel: true,
    description: "Embed the Organization board. No record pick.",
  },
];

export function recordTypeLabel(id: string | undefined): string {
  if (!id || id === "*") return "Embed";
  return elementTypeById(id)?.label ?? id;
}

export function elementTypeById(id: string | undefined): ElementTypeDef | undefined {
  if (!id) return undefined;
  const folded = foldRecordTypeApiName(id);
  return ELEMENT_TYPE_PALETTE.find((row) => row.id === id || row.recordType === id || row.id === folded);
}

export function defaultTypeForDriver(driverId: string): ElementTypeId {
  if (driverId === "glossary-book" || driverId === "embed-header") return "glossary";
  if (driverId === "org-board") return "org_board";
  const entry = driverEntry(driverId);
  if (entry?.recordType === "*") return "glossary";
  const first = entry?.compatibleTypes.find((type) => type !== "*" && elementTypeById(type));
  return (first as ElementTypeId | undefined) ?? ((entry?.recordType as ElementTypeId | undefined) || "page");
}

/** Fields staff can map onto driver inputs (plus derived outputs when the type has lines). */
export const RECORD_OUTPUTS_BY_TYPE: Record<ElementTypeId, { id: string; label: string }[]> = {
  page: [
    { id: "name", label: "Title" },
    { id: "body_html", label: "HTML body" },
  ],
  statistics: [
    { id: "name", label: "Name" },
    { id: "value", label: "Value" },
    { id: "unit", label: "Unit" },
    { id: "category", label: "Category" },
    { id: "line_count", label: "Line count" },
    { id: "count_by:status", label: "Count by status" },
  ],
  cycle_strip: [
    { id: "name", label: "Name" },
    { id: "number", label: "Number" },
    { id: "description", label: "Description" },
  ],
  inspection_report: [
    { id: "name", label: "Support type" },
    { id: "summary", label: "Summary" },
    { id: "line_count", label: "Line count" },
    { id: "count_by:status", label: "Count by status" },
  ],
  contact: [
    { id: "name", label: "Name" },
    { id: "email", label: "Email" },
    { id: "phone", label: "Phone" },
  ],
  location: [
    { id: "name", label: "Label" },
    { id: "address", label: "Address" },
  ],
  glossary: [{ id: "name", label: "Name" }],
  org_board: [{ id: "name", label: "Name" }],
};
