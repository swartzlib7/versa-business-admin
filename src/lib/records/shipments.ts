/**
 * Shipments (1.0.26, state_shipments.md). A shipment records what left in boxes for a customer.
 * Made from an invoice, each line keeps the invoice line it fills (`line_source_line_id`), so an
 * invoice can ship in several parts:
 *
 *   Ordered         the invoice line's quantity
 *   Shipped before  what this invoice's earlier shipments shipped of that line
 *   Shipped         what this shipment sends (starts as what is still owed)
 *   Backordered     Ordered - Shipped before - Shipped (a formula, never below 0)
 *
 * "Earlier" means created before this one; every status counts, so a Draft shipment already
 * holds its quantities and a second shipment never offers them again.
 */
import { adapter } from "@/lib/data/adapter";
import { listInstances, getInstance, type RecordInstance } from "@/lib/fixtures/record-instances";
import { foldRecordTypeApiName } from "@/lib/catalog/name-aliases";
import { isPrimaryAddress } from "@/lib/records/location-primary";
import { primaryOrganization } from "@/lib/organizations/primary-org";
import type { WriteLine } from "@/lib/records/pipeline";

export const SHIPMENT_TYPE = "production_shipment";

const text = (v: unknown) => (v === null || v === undefined ? "" : String(v)).trim();
const num = (v: unknown) => {
  const n = Number(text(v));
  return text(v) !== "" && Number.isFinite(n) ? n : 0;
};
const qty = (n: number) => String(Math.round(n * 1000) / 1000);

async function listRecords(type: string): Promise<RecordInstance[]> {
  return adapter.listRecords ? adapter.listRecords({ type_api_name: type }) : listInstances({ type_api_name: type });
}

async function getRecord(id: string): Promise<RecordInstance | null> {
  return adapter.getRecord ? adapter.getRecord(id) : (getInstance(id) ?? null);
}

const createdOf = (r: RecordInstance) => text(r.data?.created_at) || text(r.created_at);

/**
 * Quantity per invoice line already on this invoice's other shipments. `before`: only shipments
 * created before that time (an existing shipment counts the ones made before it).
 */
export async function shippedBefore(
  invoiceId: string,
  opts: { exceptId?: string; before?: string } = {},
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (!invoiceId) return out;
  for (const shipment of await listRecords(SHIPMENT_TYPE)) {
    if (shipment.id === opts.exceptId) continue;
    if (text(shipment.data?.source_invoice_id) !== invoiceId) continue;
    if (opts.before && !(createdOf(shipment) < opts.before)) continue;
    for (const line of shipment.lines ?? []) {
      const source = text(line.data?.line_source_line_id);
      if (source) out.set(source, (out.get(source) ?? 0) + num(line.data?.line_qty_shipped));
    }
  }
  return out;
}

/** Save pipeline step: each line taken from an invoice gets its Shipped before again. */
export async function withShippedBefore(
  data: Record<string, string>,
  lines: WriteLine[],
  current: RecordInstance | null | undefined,
): Promise<WriteLine[]> {
  const invoiceId = text(data.source_invoice_id);
  if (!invoiceId || !lines.some((line) => text(line.data.line_source_line_id))) return lines;
  const earlier = await shippedBefore(invoiceId, {
    exceptId: current?.id,
    before: current ? createdOf(current) || undefined : undefined,
  });
  return lines.map((line) => {
    const source = text(line.data.line_source_line_id);
    if (!source) return line;
    return { ...line, data: { ...line.data, line_qty_previous: qty(earlier.get(source) ?? 0) } };
  });
}

type Built =
  | { ok: true; name: string; data: Record<string, string>; lines: WriteLine[] }
  | { ok: false; status: number; code: string; message: string };

/** The Location to ship to or from: the organization's Primary address, else its only one. */
async function locationFor(orgId: string): Promise<string> {
  if (!orgId) return "";
  const mine = (await listRecords("location")).filter((row) => text(row.data?.organization_id) === orgId);
  return (mine.find((row) => isPrimaryAddress(row.data?.is_primary)) ?? (mine.length === 1 ? mine[0] : undefined))?.id ?? "";
}

/** SKU for a line: the product's own SKU, else its only variant's. */
function skuOf(product: RecordInstance | null): string {
  if (!product) return "";
  const own = text(product.data?.sku);
  if (own) return own;
  const variants = (product.lines ?? []).filter((line) => text(line.data?.sku) || text(line.data?.variant_name));
  if (variants.length !== 1) return "";
  return [text(variants[0].data?.variant_name), text(variants[0].data?.sku)].filter(Boolean).join(" · ");
}

/**
 * A new shipment for what an invoice still owes. The invoice's lines with a Product are shipped
 * (if none has a Product, every line with a quantity); lines already fully shipped are left out.
 */
export async function buildShipmentFromInvoice(invoice: RecordInstance): Promise<Built> {
  if (foldRecordTypeApiName(invoice.type_api_name) !== "treasury_transaction" || text(invoice.data?.document_kind) !== "invoice") {
    return { ok: false, status: 400, code: "NOT_AN_INVOICE", message: "Only an invoice (a Transaction with Document kind Invoice) can be shipped." };
  }
  const invoiceLines = invoice.lines ?? [];
  const withProduct = invoiceLines.filter((line) => text(line.data?.line_product_id));
  const candidates = (withProduct.length ? withProduct : invoiceLines).filter((line) => num(line.data?.line_quantity) > 0);
  if (!candidates.length) {
    return { ok: false, status: 409, code: "NOTHING_TO_SHIP", message: "This invoice has no lines with a quantity to ship." };
  }
  const earlier = await shippedBefore(invoice.id);
  const products = new Map<string, RecordInstance | null>();
  const lines: WriteLine[] = [];
  for (const line of candidates) {
    const ordered = num(line.data?.line_quantity);
    const before = earlier.get(line.id) ?? 0;
    const owed = ordered - before;
    if (owed <= 0) continue;
    const productId = text(line.data?.line_product_id);
    if (productId && !products.has(productId)) products.set(productId, await getRecord(productId));
    const product = productId ? products.get(productId) ?? null : null;
    lines.push({
      data: {
        line_product_id: productId,
        line_sku: skuOf(product),
        line_description: text(line.data?.line_description) || text(product?.name),
        line_qty_ordered: qty(ordered),
        line_qty_previous: qty(before),
        line_qty_shipped: qty(owed),
        line_source_line_id: line.id,
      },
    });
  }
  if (!lines.length) {
    return { ok: false, status: 409, code: "NOTHING_TO_SHIP", message: "Every line of this invoice is already on a shipment. Nothing is left to ship." };
  }
  const customer = text(invoice.data?.counterparty_organization_id);
  let issuer = text(invoice.data?.issuer_organization_id);
  if (!issuer && adapter.listOrganizations) issuer = primaryOrganization(await adapter.listOrganizations())?.id ?? "";
  const number = text(invoice.data?.document_number);
  const name = `Shipment for ${number ? `invoice ${number}` : invoice.name || "invoice"}`;
  const data: Record<string, string> = {
    name,
    status: "draft",
    source_invoice_id: invoice.id,
    customer_org_id: customer,
    ship_to_location_id: await locationFor(customer),
    ship_from_location_id: await locationFor(issuer),
  };
  const project = text(invoice.data?.project_id);
  if (project) data.project_id = project;
  for (const [k, v] of Object.entries(data)) if (!v) delete data[k];
  return { ok: true, name, data, lines };
}
