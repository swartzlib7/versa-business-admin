import { test } from "node:test";
import assert from "node:assert/strict";
import { assetPaint, jobMoneyPaint, orgBoardPaint, scheduleBoard, shortDay } from "./board-paint";
import { isCurrentDemoCanvas, DEMO_TOUR_ROW_IDS } from "../sample-data/demo-canvas";

const line = (data: Record<string, string>) => ({ data });

test("job money: source estimate, bound invoice, bill share, typed price", () => {
  const estimate = { id: "e", name: "Bracket estimate", data: { document_kind: "estimate", status: "converted", amount: "90" }, lines: [] };
  const bill = { id: "b", name: "Acme #4471", data: { document_kind: "bill", amount: "70", allocated_total: "68.5", allocated_remaining: "1.5" }, lines: [] };
  const invoice = {
    id: "i",
    name: "Bracket invoice",
    data: { document_kind: "invoice", converted_from_id: "e", counterparty_organization_id: "o1", subtotal: "90", cost_total: "70", margin: "20", margin_pct: "22.2" },
    lines: [
      line({ line_description: "Bracket", line_quantity: "3", line_unit_cost: "20", line_markup_pct: "25", line_unit_price: "25", line_total: "75", line_vendor_bill_id: "b", line_actual_cost: "58.5", line_variance: "-1.5" }),
      line({ line_description: "Kit", line_quantity: "1", line_unit_cost: "10", line_unit_price: "15", line_total: "15", line_vendor_bill_id: "b" }),
    ],
  };
  const paint = jobMoneyPaint(invoice, [estimate, bill, invoice], (id) => (id === "o1" ? "Northwind" : ""));
  assert.deepEqual(paint.docs.map((d) => d.kind), ["Estimate", "Invoice", "Vendor bill"]);
  assert.equal(paint.docs[1].current, true);
  assert.equal(paint.docs[2].remaining, "$1.50");
  assert.equal(paint.docs[2].allocatedPct, 97.9);
  assert.equal(paint.lines[0].priceTyped, false);
  assert.equal(paint.lines[1].priceTyped, true);
  assert.equal(paint.totals.marginPct, "22.2%");
  assert.equal(paint.counterparty, "Northwind");
});

test("asset: fields, documents and the latest mileage log", () => {
  const asset = { id: "a", name: "Van", data: { serial_number: "VIN1", current_odometer: "48061", next_service_due: "2026-12-01", documents: JSON.stringify([{ id: "x", name: "reg.pdf", size: 2048 }]) } };
  const log = {
    id: "l",
    name: "Van mileage log",
    data: { vehicle_id: "a", tax_year: "2026", total_miles: "100", business_miles: "80", business_use_pct: "80" },
    lines: [line({ trip_date: "2026-11-03", trip_miles: "60", trip_business: "true", trip_purpose: "Delivery" }), line({ trip_date: "2026-11-01", trip_miles: "40", trip_business: "false" })],
  };
  const paint = assetPaint(asset, [log], new Date("2026-11-20T00:00:00Z"));
  assert.equal(paint.fields.find((f) => f.label === "Next service")?.tone, "due");
  assert.equal(paint.fields.find((f) => f.label === "Odometer")?.value, "48,061 mi");
  assert.deepEqual(paint.documents, [{ name: "reg.pdf", ext: "PDF", size: "2 KB" }]);
  assert.equal(paint.mileage?.personal, "20");
  assert.deepEqual(paint.mileage?.trips.map((t) => t.date), ["1 Nov", "3 Nov"]);
});

test("org board: hats first with holders, customers under Distribution", () => {
  const records = [
    { id: "s1", name: "Avery", type_api_name: "communication_staff", parent_kind: "faculty", parent_api_name: "communications" },
    { id: "p", name: "Rollout", type_api_name: "executive_project", parent_kind: "faculty", parent_api_name: "executive", data: { status: "active" } },
    { id: "h", name: "Receptionist", type_api_name: "executive_hat", parent_kind: "faculty", parent_api_name: "executive", data: { holder_ids: '["s1"]' } },
    { id: "t", name: "Invoice", type_api_name: "treasury_transaction", parent_kind: "faculty", parent_api_name: "treasury", data: { status: "sent" } },
  ];
  const paint = orgBoardPaint(
    [{ key: "executive", label: "Executive" }, { key: "public", label: "Distribution" }, { key: "treasury", label: "Treasury" }],
    records,
    [{ name: "Northwind" }],
    (type) => ({ executive_project: "Projects", treasury_transaction: "Transactions" })[type] ?? type,
  );
  assert.deepEqual(paint.divisions[0].items[0], { name: "Receptionist", kind: "Hat", detail: "Avery", hat: true });
  assert.equal(paint.divisions[1].items[0].name, "Northwind");
  assert.equal(paint.divisions[2].items[0].detail, "Sent");
  assert.equal(paint.hatCount, 1);
});

test("schedule months in calendar order; dates without locale", () => {
  const board = scheduleBoard([{ name: "Launch", data: { kind: "custom", custom_slots: '["2027-01-05T09:00","2026-12-13T15:30"]' } }], new Date(2026, 10, 20));
  assert.deepEqual(board.months.map((m) => m.label), ["Nov 2026", "Dec 2026", "Jan 2027"]);
  assert.equal(shortDay("2026-11-03"), "3 Nov 2026");
});

test("demo canvas check uses the saved (folded) row ids", () => {
  assert.equal(isCurrentDemoCanvas({ sections: DEMO_TOUR_ROW_IDS.map((id) => ({ id })) }), true);
  assert.equal(isCurrentDemoCanvas({ sections: [{ id: "facets" }, { id: "contacts" }] }), false);
});
