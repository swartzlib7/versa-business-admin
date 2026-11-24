import { test } from "node:test";
import assert from "node:assert/strict";
import { planCanvasChanges } from "./index";

const oldAnalysis = { id: "cv-overview", slug: "analysis", label: "Analysis", menu_enabled: true, seo: { title: "Old", description: "Old d" }, sky: "off" };
const newAnalysis = { ...oldAnalysis, menu_enabled: false, seo: { title: "New", description: "New d" } };
const story = { id: "cv-story", slug: "story", label: "The Versa story", menu_enabled: true };

const plan = (installCanvases: Record<string, unknown>[], known: string[] = [], max = 12) =>
  planCanvasChanges({
    packCanvases: [newAnalysis, story],
    installCanvases,
    shipped: { "cv-overview": [oldAnalysis] },
    known: (item) => known.includes(item),
    maxCanvases: max,
  });

test("an untouched canvas takes the new settings; a new canvas is added", () => {
  const out = plan([{ ...oldAnalysis }, { id: "cv-demo", slug: "demo" }]);
  assert.deepEqual(out.canvases.find((c) => c.id === "cv-overview"), newAnalysis);
  assert.deepEqual(out.added, ["canvas:cv-story"]);
  assert.equal(out.canvases.length, 3);
});

test("settings changed on the install are kept, others still update", () => {
  const out = plan([{ ...oldAnalysis, seo: { title: "Ours", description: "Ours" } }]);
  const analysis = out.canvases.find((c) => c.id === "cv-overview")!;
  assert.deepEqual(analysis.seo, { title: "Ours", description: "Ours" });
  assert.equal(analysis.menu_enabled, false);
});

test("a canvas deleted on the install is not brought back", () => {
  const out = plan([{ ...oldAnalysis }], ["canvas:cv-story"]);
  assert.deepEqual(out.added, []);
});

test("a taken address or a full install skips the canvas and says so", () => {
  assert.match(plan([{ id: "cv-x", slug: "story" }]).skipped[0], /story is taken/);
  assert.match(plan([{ id: "a", slug: "a" }], [], 1).skipped[0], /1 canvases already/);
});
