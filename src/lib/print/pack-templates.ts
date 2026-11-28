/**
 * The print templates a release ships (1.0.27, state_printing.md §4): Invoice, Estimate, Quote
 * and Packing Slip, with the content hash used to tell a shipped template from an edited one.
 * Pure (no I/O); pack.ts installs and updates them.
 */
import { createHash } from "node:crypto";
import type { Block, Layout } from "@/lib/print/template";

export type PackTemplate = {
  key: string;
  name: string;
  target_record_type: string;
  sort_order: string;
  use_when_field: string;
  use_when_value: string;
  page_size: string;
  orientation: string;
  margin_mm: string;
  font: string;
  layout: Layout;
};

/** The fields a template's content is made of (Status, notes and the shipped stamps are not). */
export const CONTENT_FIELDS = [
  "name",
  "target_record_type",
  "sort_order",
  "use_when_field",
  "use_when_value",
  "page_size",
  "orientation",
  "margin_mm",
  "font",
  "layout",
] as const;

const text = (v: unknown) => (v === null || v === undefined ? "" : String(v)).trim();

/** Layout text in one canonical form, so spacing differences don't count as edits. */
export function canonicalLayout(raw: unknown): string {
  try {
    return JSON.stringify(typeof raw === "string" ? JSON.parse(raw || "{}") : raw ?? {});
  } catch {
    return text(raw);
  }
}

export function contentHash(data: Record<string, unknown>): string {
  const parts = CONTENT_FIELDS.map((k) => `${k}=${k === "layout" ? canonicalLayout(data[k]) : text(data[k])}`);
  return createHash("sha256").update(parts.join("\n"), "utf8").digest("hex");
}

export type Origin = "shipped" | "edited" | "own";

/** Where a template came from (1.0.28 maker): own = made here; shipped = as a release shipped it; edited = a shipped one changed here. */
export function originOf(data: Record<string, unknown>): Origin {
  if (!text(data.shipped_key)) return "own";
  return contentHash(data) === text(data.shipped_hash) ? "shipped" : "edited";
}

export function packData(t: PackTemplate): Record<string, string> {
  return {
    name: t.name,
    target_record_type: t.target_record_type,
    sort_order: t.sort_order,
    use_when_field: t.use_when_field,
    use_when_value: t.use_when_value,
    page_size: t.page_size,
    orientation: t.orientation,
    margin_mm: t.margin_mm,
    font: t.font,
    layout: JSON.stringify(t.layout, null, 2),
  };
}

// ── The templates ──────────────────────────────────────────────────────────

const pageNumber: Block = { type: "page_number", format: "Page {page} of {pages}", align: "right" };

function transactionTemplate(key: string, title: string, kind: string, order: number, dateFields: string[]): PackTemplate {
  return {
    key,
    name: title,
    target_record_type: "treasury_transaction",
    sort_order: String(order),
    use_when_field: "document_kind",
    use_when_value: kind,
    page_size: "letter",
    orientation: "portrait",
    margin_mm: "15",
    font: "helvetica",
    layout: {
      bands: [
        {
          id: "letterhead",
          area: "header",
          shows_on: "first",
          blocks: [
            {
              type: "columns",
              widths: [3, 2],
              columns: [
                [{ type: "organization", source: "own" }],
                [
                  { type: "text", text: title.toUpperCase(), size: 20, bold: true, align: "right" },
                  { type: "fields", fields: ["document_number", ...dateFields], columns: 1 },
                ],
              ],
            },
            { type: "divider" },
          ],
        },
        {
          id: "continued",
          area: "header",
          shows_on: "after_first",
          blocks: [{ type: "text", text: `${title} {document_number} (continued)`, muted: true }, { type: "divider" }],
        },
        { id: "page-number", area: "footer", shows_on: "every", blocks: [pageNumber] },
      ],
      body: [
        {
          type: "columns",
          columns: [
            [{ type: "organization", source: "counterparty_organization_id", location: "primary", title: "Bill to", show: ["name", "address", "phone", "email"] }],
            [{ type: "fields", fields: ["project_id"], columns: 1 }],
          ],
        },
        {
          type: "lines",
          columns: [
            { field: "line_description", label: "Description", width: 4 },
            { field: "line_quantity", label: "Qty", width: 1 },
            { field: "line_unit_price", label: "Unit price", width: 1.4 },
            { field: "line_total", label: "Amount", width: 1.4 },
          ],
          totals: [
            { field: "subtotal", label: "Subtotal" },
            { field: "tax_total", label: "Tax" },
            { field: "amount", label: "Total", bold: true },
          ],
        },
        { type: "fields", fields: ["notes"], columns: 1 },
      ],
    },
  };
}

export const PRINT_PACK: PackTemplate[] = [
  transactionTemplate("invoice", "Invoice", "invoice", 10, ["transaction_date", "due_date"]),
  transactionTemplate("estimate", "Estimate", "estimate", 20, ["transaction_date", "expiry_date"]),
  transactionTemplate("quote", "Quote", "quote", 30, ["transaction_date", "expiry_date"]),
  {
    key: "packing-slip",
    name: "Packing Slip",
    target_record_type: "production_shipment",
    sort_order: "10",
    use_when_field: "",
    use_when_value: "",
    page_size: "letter",
    orientation: "portrait",
    margin_mm: "15",
    font: "helvetica",
    layout: {
      bands: [
        {
          id: "letterhead",
          area: "header",
          shows_on: "first",
          blocks: [
            {
              type: "columns",
              widths: [3, 2],
              columns: [
                [{ type: "organization", source: "own" }],
                [
                  { type: "text", text: "PACKING SLIP", size: 18, bold: true, align: "right" },
                  { type: "fields", fields: ["shipment_number", "ship_date", "source_invoice_id"], columns: 1 },
                ],
              ],
            },
            { type: "divider" },
          ],
        },
        {
          id: "continued",
          area: "header",
          shows_on: "after_first",
          blocks: [{ type: "text", text: "Packing slip {shipment_number} (continued)", muted: true }, { type: "divider" }],
        },
        {
          id: "received-by",
          area: "footer",
          shows_on: "last",
          blocks: [{ type: "signature", label: "Received by", lines: ["Signature", "Printed name", "Date"] }, { type: "spacer", height: 3 }],
        },
        { id: "page-number", area: "footer", shows_on: "every", blocks: [pageNumber] },
      ],
      body: [
        {
          type: "columns",
          widths: [1, 1, 1],
          columns: [
            [{ type: "organization", source: "customer_org_id", location: "ship_to_location_id", title: "Ship to", show: ["name", "address", "phone"] }],
            [{ type: "organization", source: "own", location: "ship_from_location_id", title: "Ship from", show: ["name", "address"] }],
            [{ type: "fields", fields: ["carrier", "tracking_number", "box_count"], columns: 1 }],
          ],
        },
        {
          type: "lines",
          columns: [
            { field: "line_product_id", label: "Product", width: 2.6 },
            { field: "line_sku", label: "SKU / variant", width: 1.6 },
            { field: "line_description", label: "Description", width: 2.6 },
            { field: "line_qty_ordered", label: "Ordered", width: 1 },
            { field: "line_qty_shipped", label: "Shipped", width: 1 },
            { field: "line_qty_backordered", label: "Backordered", width: 1.2 },
            { field: "line_box", label: "Box", width: 0.8 },
          ],
          totals: [{ field: "units_shipped", label: "Units shipped", bold: true }],
        },
        { type: "fields", fields: ["packing_notes"], columns: 1 },
      ],
    },
  },
];
