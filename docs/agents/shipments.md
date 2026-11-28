# Shipments: invoice → shipment → delivered (1.0.26)

A shipment is a `production_shipment` record (parent `faculty` / `production`), header and lines. Read its fields with `GET /api/catalog/record-types/production_shipment`.

| Header field | What it holds |
|---|---|
| `shipment_number` | Given by VBA on create: `SH-0001`, `SH-0002` … (Number automatically), taken in the insert itself, so parallel creates never share one. Don't send it: a create that sends one, or an update that changes it, answers `400 NUMBER_IS_AUTOMATIC`. Resending the stored value, or leaving it out of an update, is fine |
| `status` | `draft` (the default) · `packed` · `shipped` · `delivered` |
| `customer_org_id` | The customer organization |
| `ship_to_location_id` | A Location whose `organization_id` is the Customer; anything else answers `400 LOOKUP_NOT_OFFERED` |
| `ship_from_location_id` | Your own Location |
| `source_invoice_id` | The invoice (`treasury_transaction` with `document_kind = invoice`) |
| `project_id`, `ship_date`, `delivered_date`, `carrier`, `tracking_number`, `box_count`, `received_by`, `packing_notes`, `notes`, `documents` | As named. `documents` is Documents & Photos ([attachments.md](attachments.md)) |
| `units_shipped` | Summary of the lines' `line_qty_shipped`. Don't send it |

| Line field | What it holds |
|---|---|
| `line_product_id`, `line_sku`, `line_description`, `line_unit`, `line_box` | The product, its SKU or variant as text, and which box it is in |
| `line_qty_ordered` | The invoice line's quantity |
| `line_qty_previous` | Shipped before: worked out on every save from this invoice's earlier shipments. Don't send it |
| `line_qty_shipped` | What this shipment sends |
| `line_qty_backordered` | Formula: Ordered − Shipped before − Shipped, never below 0. Don't send it |
| `line_source_line_id` | The invoice line this line fills (set by Create shipment) |

1. **Create from the invoice** — `POST /api/records/<invoice id>/shipment` → `201` with the new Draft shipment: one line per invoice line with a Product (or every line with a quantity, when none has one) that is still owed, Shipped = what is owed, Customer = the invoice's Counterparty, Ship to = the customer's Primary address Location, Ship from = your own. Answers `400 NOT_AN_INVOICE` for anything but an invoice and `409 NOTHING_TO_SHIP` when every line is already on a shipment. Invoices with an External ID (Wave) can be shipped.
2. **Ship part** — `PATCH /api/records/<shipment id>` with all its lines, lowering `line_qty_shipped` where the boxes hold less and setting `line_box`. Keep each line's `id` and `line_source_line_id`. Backordered follows. The next `POST …/shipment` on the invoice offers only what is left.
3. **Ship** — `PATCH` with `status: "shipped"` (beside `data`, and `data.status` the same), `ship_date`, `carrier`, `tracking_number`, `box_count`. Attach the carrier's receipt: `POST /api/records/<shipment id>/files`.
4. **Delivered** — `status: "delivered"`, `delivered_date`, `received_by`.
5. **Review** — `GET /api/records/<invoice id>/linked` lists the invoice's shipments.

Shipped before counts every earlier shipment of the invoice, whatever its status, so a Draft already holds its quantities. Delete a shipment that will not go, rather than leaving it in Draft.

**Units Shipped statistic:** create or update the statistic with `source_record_type: "production_shipment"` and leave `source_date_field` and `source_value_field` empty: the save fills the ready feed (`lines`, `ship_date`, `line_qty_shipped`, only `status` = `shipped, delivered`). See [statistics.md](statistics.md).
