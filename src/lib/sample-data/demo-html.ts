/** Visitor copy for the demo pack. Classes live in globals.css under .page-html. */

function panel(tone: "teal" | "amber" | "violet" | "emerald", inner: string): string {
  return `<div class="demo-panel demo-panel-${tone}">${inner}</div>`;
}

export const DEMO_FACETS_HTML = panel(
  "teal",
  [
    "<h2>What Versa Business Admin paints</h2>",
    "<p>Each block on this page is a record the staff can edit.</p>",
    "<h3>Three drivers</h3>",
    "<ul><li><strong>HTML Page</strong> writes the body you are reading.</li><li><strong>Statistics</strong> draws a graph from captured lines.</li><li><strong>Location</strong> shows an address, with or without a map.</li></ul>",
  ].join(""),
);

export const DEMO_INTEGRATIONS_HTML = panel(
  "amber",
  [
    "<h2>Integrations</h2>",
    "<p>Vendor connections do not have their own visitor driver yet, so this story is an HTML Page.</p>",
    "<ol><li>Mail and calendar</li><li>Accounting export</li><li>The support inbox</li></ol>",
  ].join(""),
);

const TICKETS: Array<[string, string, string, string, string, string]> = [
  ["TKT-001", "Cannot access account after password reset", "Jamie Ellis", "Email", "high", "open"],
  ["TKT-002", "Feature request: export to CSV", "Dana Park", "Chat", "normal", "in_progress"],
  ["TKT-003", "Billing question about invoice #1042", "Morgan Tate", "Phone", "low", "resolved"],
  ["TKT-004", "Accounting platform is not syncing", "Riley Chen", "Email", "urgent", "open"],
];

function ticketRows(): string {
  return TICKETS.map(
    ([id, subject, customer, channel, priority, status]) =>
      `<tr><td>${id}</td><td>${subject}</td><td>${customer}</td><td>${channel}</td><td><span class="demo-pill demo-pill-${priority}">${priority.replace("_", " ")}</span></td><td><span class="demo-pill demo-pill-${status}">${status.replace("_", " ")}</span></td></tr>`,
  ).join("");
}

export const DEMO_INSPECTIONS_HTML = [
  '<div class="demo-panel demo-panel-slate">',
  "<h2>Customer support tickets</h2>",
  "<p>The same four sample tickets, painted as HTML. Status and priority keep their colors.</p>",
  '<table class="demo-tickets"><thead><tr><th>Ticket</th><th>Subject</th><th>Customer</th><th>Channel</th><th>Priority</th><th>Status</th></tr></thead><tbody>',
  ticketRows(),
  "</tbody></table></div>",
].join("");

export const DEMO_KNOWLEDGE_HTML = panel(
  "violet",
  [
    "<h2>Knowledge</h2>",
    "<h3>Onboarding</h3>",
    "<p>First week: access, the Primary canvas, and who to ask.</p>",
    "<h3>Escalation</h3>",
    "<p>Name the owner, write the next step, and keep the thread on the record.</p>",
  ].join(""),
);

export const DEMO_ABOUT_HTML = panel(
  "emerald",
  [
    "<h2>About this board</h2>",
    "<p>Overview is the shipped custom canvas. The same HTML Page can paint as a block or as a record card.</p>",
    "<ul><li>The block is the body alone.</li><li>The card adds the page title.</li></ul>",
  ].join(""),
);
