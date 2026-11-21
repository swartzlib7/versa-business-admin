# Job costing: estimate → invoice → vendor bill

Customer and vendor are **organizations** (`GET /api/organizations?org_type=customer|vendor`). The project is an `executive_project` record with `customer_org_id`. Estimates, invoices and bills are `treasury_transaction` records (parent `faculty` / `treasury`).

1. **Estimate** — `POST /api/records`: `data.document_kind = "estimate"`, `counterparty_organization_id` = customer, `project_id` = project; lines with `line_description`, `line_quantity`, `line_vendor_org_id`, `line_unit_cost` (vendor price incl. their tax and shipping) and optional `line_markup_pct`. VBA fills `line_unit_price`, `line_total`, `line_cost`, `subtotal`, `cost_total`, `margin`, `margin_pct`, `amount`. Send `line_unit_price` only to override the markup price.
2. **Convert** — `POST /api/records/<estimate id>/convert` → the new draft invoice (`converted_from_id` = estimate). The estimate becomes `converted`. Refused for integrated (External ID) records.
3. **Bill** — when the vendor charges: `POST /api/records` with `document_kind = "bill"`, `classification = "disbursement"`, `counterparty_organization_id` = vendor, `project_id`, `amount` = what they charged (tax included).
4. **Match** — `PATCH` the **invoice** with all its lines, setting `line_vendor_bill_id` = bill id on each line the bill covered. Send `line_actual_cost` only when the bill differs from the estimate for that line. VBA refuses an over-allocation (`OVER_ALLOCATED`) and keeps the bill's `allocated_total` / `allocated_remaining`.
5. **Review** — `GET /api/records/<project id>/linked` shows the project's estimates, invoices and bills with totals per kind.
