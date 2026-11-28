import assert from "node:assert/strict";
import test from "node:test";
import { renderPdf, winAnsiSafe } from "./render";
import { pageSettings, type Layout } from "./template";

test("the standard fonts print Western European letters; others become ?", () => {
  assert.equal(winAnsiSafe("Café — “Boots” €5"), "Café — “Boots” €5");
  assert.equal(winAnsiSafe("→ 東京"), "? ??");
});

const ctx = (lineCount: number) => ({
  record: { id: "r", name: "R", type_api_name: "x", parent_kind: "", parent_api_name: "", status: "", data: {}, created_at: "" },
  typeLabel: "X",
  value: (f: string) => (f === "n" ? "7" : ""),
  lineValue: (l: Record<string, string>, f: string) => l[f] ?? "",
  label: (f: string) => f,
  isNumeric: () => false,
  lines: () => Array.from({ length: lineCount }, (_, i) => ({ d: `Line ${i + 1}` })),
  organization: () => null,
  today: "Nov 27, 2026",
});

const layout = (withLastFooter: boolean): Layout => ({
  bands: [
    { area: "header", shows_on: "first", blocks: [{ type: "text", text: "Letterhead {n}", size: 30 }] },
    { area: "footer", shows_on: "every", blocks: [{ type: "page_number" }] },
    ...(withLastFooter ? [{ area: "footer" as const, shows_on: "last" as const, blocks: [{ type: "signature" as const, label: "Received by" }, { type: "spacer" as const, height: 40 }] }] : []),
  ],
  body: [{ type: "lines", columns: [{ field: "d" }] }],
});

test("lines flow onto more pages; a last-page footer gets its own room", async () => {
  const one = await renderPdf(layout(false), pageSettings({}), ctx(5) as never);
  assert.equal(one.pages, 1);
  assert.equal(one.pdf.subarray(0, 5).toString(), "%PDF-");
  const many = await renderPdf(layout(false), pageSettings({}), ctx(120) as never);
  assert.ok(many.pages >= 3, `120 lines take ${many.pages} pages`);
  // Find a line count that just fills the last page, then add the tall last-page footer.
  let n = 5;
  while ((await renderPdf(layout(false), pageSettings({}), ctx(n + 1) as never)).pages === 1) n++;
  const filled = await renderPdf(layout(true), pageSettings({}), ctx(n) as never);
  assert.equal(filled.pages, 2, "a full page leaves no room for the signature footer, so it goes on a page of its own");
});
