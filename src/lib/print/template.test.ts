import assert from "node:assert/strict";
import test from "node:test";
import { bandShows, checkLayout, pageSettings, parsePages, templatesFor, useWhenMatches } from "./template";

test("Shows on: every, first, after first, last, chosen pages", () => {
  assert.deepEqual([...parsePages("1, 3, 5-7, x")], [1, 3, 5, 6, 7]);
  const at = (shows_on: string, page: number, pages: number | null, spec?: string) => bandShows({ shows_on: shows_on as never, pages: spec }, page, pages);
  assert.equal(at("every", 2, 3), true);
  assert.equal(at("first", 1, 3), true);
  assert.equal(at("first", 2, 3), false);
  assert.equal(at("after_first", 1, 3), false);
  assert.equal(at("after_first", 3, 3), true);
  assert.equal(at("last", 3, 3), true);
  assert.equal(at("last", 2, 3), false);
  assert.equal(at("last", 3, null), false, "while laying out, no page is known to be the last");
  assert.equal(at("pages", 3, 4, "1, 3"), true);
  assert.equal(at("pages", 2, 4, "1, 3"), false);
});

test("page settings default to Letter, portrait, 15 mm, Helvetica", () => {
  assert.deepEqual(pageSettings({}), { size: "letter", orientation: "portrait", margin_mm: 15, font: "helvetica" });
  assert.deepEqual(pageSettings({ page_size: "A4", orientation: "landscape", margin_mm: "20", font: "hack" }), { size: "a4", orientation: "landscape", margin_mm: 20, font: "hack" });
  assert.equal(pageSettings({ margin_mm: "200" }).margin_mm, 15, "an unreasonable margin falls back");
});

test("the template whose Use when fits comes first; archived ones are not offered", () => {
  const t = (id: string, data: Record<string, string>) => ({ id, name: id, data: { target_record_type: "treasury_transaction", ...data } });
  const templates = [
    t("Quote", { use_when_field: "document_kind", use_when_value: "quote", sort_order: "30" }),
    t("Invoice", { use_when_field: "document_kind", use_when_value: "invoice", sort_order: "10" }),
    t("Any", { sort_order: "50" }),
    t("Old invoice", { use_when_field: "document_kind", use_when_value: "invoice", status: "archived" }),
    { id: "Slip", name: "Slip", data: { target_record_type: "production_shipment" } },
  ];
  const invoice = { data: { document_kind: "invoice" } };
  assert.deepEqual(templatesFor(templates, "treasury_transaction", invoice).map((x) => [x.id, x.matches]), [["Invoice", true], ["Any", true], ["Quote", false]]);
  assert.equal(useWhenMatches(t("Both", { use_when_field: "document_kind", use_when_value: "quote, estimate" }), { data: { document_kind: "estimate" } }), true);
  assert.equal(useWhenMatches(t("Status", { use_when_field: "status", use_when_value: "shipped" }), { status: "shipped", data: {} }), true);
});

test("a layout is checked: JSON, block types, bands, and field names of the type", () => {
  const header = new Set(["name", "document_number", "counterparty_organization_id", "amount"]);
  const lines = new Set(["line_description", "line_total"]);
  const good = {
    bands: [{ area: "footer", shows_on: "every", blocks: [{ type: "page_number" }] }],
    body: [
      { type: "text", text: "Invoice {document_number} of {today}" },
      { type: "columns", columns: [[{ type: "organization", source: "own" }], [{ type: "organization", source: "counterparty_organization_id", location: "primary" }]] },
      { type: "lines", columns: [{ field: "line_description" }, { field: "line_total" }], totals: [{ field: "amount" }] },
    ],
  };
  assert.equal(checkLayout(JSON.stringify(good), header, lines).ok, true);
  assert.equal(checkLayout("", header, lines).ok, true, "an empty layout prints nothing but is allowed");
  const bad = (layout: unknown) => {
    const r = checkLayout(layout, header, lines);
    return r.ok ? "" : r.message;
  };
  assert.match(bad("{nope"), /not valid JSON/);
  assert.match(bad({ body: [{ type: "chart" }] }), /unknown type "chart"/);
  assert.match(bad({ body: [{ type: "text", text: "{trackng}" }] }), /no field "trackng"/);
  assert.match(bad({ body: [{ type: "lines", columns: [{ field: "amount" }] }] }), /no lines field "amount"/);
  assert.match(bad({ bands: [{ area: "side", shows_on: "sometimes", blocks: [] }] }), /"area" is "header" or "footer".*"shows_on" is one of/);
  assert.match(bad({ bands: [{ area: "header", shows_on: "pages", pages: "", blocks: [] }] }), /lists page numbers/);
  assert.match(bad({ bands: [{ area: "header", shows_on: "every", blocks: [{ type: "lines", columns: [{ field: "line_total" }] }] }] }), /goes in the body/);
});
