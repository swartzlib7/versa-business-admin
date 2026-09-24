/** Visitor copy for the demo pack. Classes live in globals.css under .page-html. */

function stage(tone: "teal" | "amber" | "slate" | "violet" | "emerald", inner: string): string {
  return `<div class="demo-stage demo-stage-${tone}">${inner}</div>`;
}

export const DEMO_FACETS_HTML = stage(
  "teal",
  [
    '<p class="demo-kicker">Primary canvas</p>',
    "<h2>One board. Three ways to paint.</h2>",
    '<p class="demo-lead">Each cell is a record the staff can open and change.</p>',
    '<div class="demo-fill demo-cols-3">',
    '<article class="demo-card"><span class="demo-index">01</span><h3>HTML Page</h3><p>The body you are reading. Headings, lists, and tables stay on the page.</p></article>',
    '<article class="demo-card"><span class="demo-index">02</span><h3>Statistics</h3><p>Captured lines become a graph. Scale, step, and period live on the header.</p></article>',
    '<article class="demo-card"><span class="demo-index">03</span><h3>Location</h3><p>An address as a card, or the same place drawn on a map.</p></article>',
    "</div>",
  ].join(""),
);

export const DEMO_INTEGRATIONS_HTML = stage(
  "amber",
  [
    '<p class="demo-kicker">Around the board</p>',
    "<h2>The systems this page stands in for.</h2>",
    '<p class="demo-lead">Mail, the ledger, and the site walk, on one page.</p>',
    '<div class="demo-fill demo-stack">',
    '<article class="demo-band"><span class="demo-index">01</span><div><h3>Mail and calendar</h3><p>The inbox stays attached to the record.</p></div><span class="demo-pill demo-pill-resolved">on the page</span></article>',
    '<article class="demo-band"><span class="demo-index">02</span><div><h3>Accounting export</h3><p>A ledger line leaves the board without a second copy.</p></div><span class="demo-pill demo-pill-in_progress">queued</span></article>',
    '<article class="demo-band"><span class="demo-index">03</span><div><h3>Site walk</h3><p>The Austin office and the loading dock, on the same board.</p></div><span class="demo-pill demo-pill-normal">linked</span></article>',
    "</div>",
  ].join(""),
);

const INSPECTIONS: Array<[string, string, string]> = [
  ["Quarterly site walk", "Walk of the Austin office and the loading dock.", "active"],
  ["Safety cabinet check", "Extinguishers, exits, and the first-aid cabinet.", "active"],
  ["Vendor floor review", "How the vendor systems show up on the floor.", "in_progress"],
];

function inspectionRows(): string {
  return INSPECTIONS.map(
    ([name, summary, status]) =>
      `<tr><td>${name}</td><td>${summary}</td><td><span class="demo-pill demo-pill-${status}">${status.replace("_", " ")}</span></td></tr>`,
  ).join("");
}

export const DEMO_INSPECTIONS_HTML = stage(
  "slate",
  [
    '<div class="demo-head">',
    "<div><p class=\"demo-kicker\">Inspections</p><h2>Three walks on the board.</h2></div>",
    '<div class="demo-meters"><span class="demo-meter"><b>2</b> active</span><span class="demo-meter"><b>1</b> in progress</span></div>',
    "</div>",
    '<div class="demo-fill">',
    '<table class="demo-tickets"><thead><tr><th>Name</th><th>Summary</th><th>Status</th></tr></thead><tbody>',
    inspectionRows(),
    "</tbody></table></div>",
  ].join(""),
);

export const DEMO_KNOWLEDGE_HTML = stage(
  "violet",
  [
    '<p class="demo-kicker">How the work runs</p>',
    "<h2>Two notes the staff keep open.</h2>",
    '<div class="demo-fill demo-cols-2">',
    '<article class="demo-card"><span class="demo-index">Onboarding</span><h3>The first week</h3><ol><li>Access and the Primary canvas</li><li>Who owns the next reply</li><li>Where the record lives</li></ol></article>',
    '<article class="demo-card"><span class="demo-index">Escalation</span><h3>When it leaves the desk</h3><ol><li>Name the owner</li><li>Write the next step</li><li>Keep the thread on the record</li></ol></article>',
    "</div>",
  ].join(""),
);

export const DEMO_ABOUT_HTML = stage(
  "emerald",
  [
    '<p class="demo-kicker">Custom canvas</p>',
    "<h2>The same page, painted twice.</h2>",
    '<p class="demo-lead">Overview places this record beside itself.</p>',
    '<div class="demo-fill demo-stack">',
    '<article class="demo-band"><span class="demo-index">Block</span><div><h3>HTML block</h3><p>The body alone, filling the cell.</p></div></article>',
    '<article class="demo-band"><span class="demo-index">Card</span><div><h3>Record card</h3><p>The page title, then this same body.</p></div></article>',
    "</div>",
  ].join(""),
);
