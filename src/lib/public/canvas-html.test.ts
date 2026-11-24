import { test } from "node:test";
import assert from "node:assert/strict";
import { canvasHtmlParts, hostCss } from "./canvas-html";
import { themeFamily } from "../ui-themes";

test("root rules with a theme become host-function rules (a host only matches :host(...))", () => {
  const css = `:root { --bg: #fff; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #000; } }
:root[data-theme="dark"] { --bg: #000; }
html, body { margin: 0; }
body { background: var(--bg); }`;
  const out = hostCss(css);
  assert.match(out, /:host \{ --bg: #fff; \}/);
  assert.match(out, /:host\(:not\(\[data-theme="light"\]\)\) \{ --bg: #000; \}/);
  assert.match(out, /:host\(\[data-theme="dark"\]\) \{ --bg: #000; \}/);
  assert.doesNotMatch(out, /:root|:host\[|:host:not/);
  assert.match(out, /:host \{ margin: 0; \}/);
  assert.match(out, /:host \{ background: var\(--bg\); \}/);
});

test("a full page keeps its stylesheet links and loses head-only parts", () => {
  const page = `<!DOCTYPE html><html><head><title>T</title><link rel="canonical" href="https://x/y">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora"><style>:root{--a:1}</style></head>
<body><a href="#founder" onclick="x()">Jump</a><section id="founder">F</section></body></html>`;
  const parts = canvasHtmlParts(page);
  assert.match(parts.sheets, /fonts\.googleapis\.com/);
  assert.match(parts.css, /:host\{--a:1\}/);
  assert.doesNotMatch(parts.body, /canonical|<title>|onclick/);
  assert.match(parts.body, /href="#founder"/);
});

test("theme families: Light and Dusk are light; Slate, Dark, Architect are dark", () => {
  assert.deepEqual(["light", "dusk", "slate", "dark", "architect", undefined].map(themeFamily), ["light", "light", "dark", "dark", "dark", "dark"]);
});
