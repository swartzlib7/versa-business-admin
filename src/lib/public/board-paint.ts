import { pointsInMonth, scheduleDetail } from "@/lib/public/schedule-times";
import { TASK_LINE_GROUP, type TaskLine } from "@/lib/records/project-task-lines";
import type { ProjectGanttPreview } from "@/components/zones/project-gantt-preview";

export type IntegrationRow = {
  name: string;
  kind: string;
  status: string;
  vendorName: string;
  logoUrl: string;
};

export type IntegrationPaint = { rows: IntegrationRow[] };

export type ScheduleMark = { date: string; name: string };

export type ScheduleMonth = { label: string; year: number; month: number; days: number };

export type SchedulePaint = {
  months: ScheduleMonth[];
  marks: ScheduleMark[];
  rows: { name: string; detail: string }[];
};

export type InspectionRow = {
  name: string;
  status: string;
  summary: string;
};

export type InspectionPaint = {
  rows: InspectionRow[];
};

export type ProjectTask = { name: string; status: string };

export type ProjectRow = {
  name: string;
  status: string;
  priority: string;
  start: string;
  target: string;
  taskCount: number;
  tasks: ProjectTask[];
};

export type ProjectPaint = { rows: ProjectRow[] };

export function integrationPaint(
  records: Array<{ name?: string; data?: Record<string, string> }>,
  vendorById: Map<string, { name: string; logoUrl: string }>,
): IntegrationPaint {
  return {
    rows: records.map((rec) => {
      const vendor = vendorById.get(String(rec.data?.organization_id ?? ""));
      return {
        name: rec.data?.name || rec.name || "Integration",
        kind: rec.data?.kind || "",
        status: rec.data?.status || "",
        vendorName: vendor?.name || "",
        logoUrl: vendor?.logoUrl || "",
      };
    }),
  };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function scheduleBoard(
  records: Array<{ name?: string; data?: Record<string, string> }>,
  now = new Date(),
): SchedulePaint {
  const rows = records.map((rec) => ({
    name: rec.data?.name || rec.name || "Schedule",
    detail: scheduleDetail(rec.data ?? {}),
    data: rec.data ?? {},
  }));
  const months = new Map<string, ScheduleMonth>();
  const addMonth = (year: number, month: number) => {
    const key = `${year}-${month}`;
    if (months.has(key)) return;
    months.set(key, {
      label: `${MONTHS[month]} ${year}`,
      year,
      month,
      days: new Date(year, month + 1, 0).getDate(),
    });
  };
  addMonth(now.getFullYear(), now.getMonth());
  const marks: ScheduleMark[] = [];
  for (const row of rows) {
    const custom = String(row.data.custom_slots ?? "");
    const once = String(row.data.occurs_at ?? "");
    for (const raw of [once, ...custom.match(/\d{4}-\d{2}-\d{2}/g) ?? []]) {
      const match = /^(\d{4})-(\d{2})/.exec(raw);
      if (match) addMonth(Number(match[1]), Number(match[2]) - 1);
    }
  }
  const nowKey = `${now.getFullYear()}-${now.getMonth()}`;
  for (const month of months.values()) {
    const isCurrent = `${month.year}-${month.month}` === nowKey;
    for (const row of rows) {
      const kind = String(row.data.kind ?? "");
      if (!isCurrent && kind !== "custom" && kind !== "one-time") continue;
      for (const date of pointsInMonth(row.data, month.year, month.month)) {
        marks.push({ date, name: row.name });
      }
    }
  }
  return {
    // Calendar order (this month, then any custom or one-time months).
    months: [...months.values()].sort((a, b) => a.year - b.year || a.month - b.month),
    marks,
    rows: rows.map(({ name, detail }) => ({ name, detail })),
  };
}

export function inspectionPaint(
  records: Array<{ name?: string; status?: string; data?: Record<string, string> }>,
): InspectionPaint {
  return {
    rows: records.map((rec) => ({
      name: rec.data?.name || rec.name || "Inspection",
      status: rec.data?.status || rec.status || "",
      summary: rec.data?.summary || "",
    })),
  };
}

export function projectPaint(
  projects: Array<{ id: string; name?: string; status?: string; data?: Record<string, string> }>,
  tasks: Array<{ name?: string; status?: string; data?: Record<string, string> }>,
): ProjectPaint {
  return {
    rows: projects.map((project) => {
      const mine = tasks.filter((task) => task.data?.project_id === project.id);
      return {
        name: project.data?.name || project.name || "Project",
        status: project.data?.status || project.status || "",
        priority: project.data?.priority || "",
        start: project.data?.start_date || "",
        target: project.data?.target_date || "",
        taskCount: mine.length,
        tasks: mine.map((task) => ({
          name: task.data?.name || task.name || "Task",
          status: task.data?.status || task.status || "",
        })),
      };
    }),
  };
}

// ── 1.0.16 premium demo drivers ────────────────────────────────────────────
// Pure builders shared by the visitor resolver and the operator preview.

type PaintRecord = {
  id: string;
  name?: string;
  status?: string;
  type_api_name?: string;
  parent_kind?: string;
  parent_api_name?: string;
  data?: Record<string, unknown>;
  lines?: Array<{ id?: string; line_group?: string; sort_order?: number; data?: Record<string, unknown> }>;
};

const str = (v: unknown) => (v === undefined || v === null ? "" : String(v)).trim();
const num = (v: unknown) => {
  const t = str(v);
  const n = Number(t);
  return t !== "" && Number.isFinite(n) ? n : null;
};

/** "2026-11-03" -> "3 Nov 2026" (no locale, so server and browser agree). */
export function shortDay(raw: unknown, withYear = true): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(str(raw));
  if (!m) return str(raw);
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1] ?? ""}${withYear ? ` ${m[1]}` : ""}`;
}

export function money(value: number | null, currency = "USD"): string {
  if (value === null) return "";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(value);
  } catch {
    return value.toFixed(2);
  }
}

const plain = (value: number | null, digits = 2) => (value === null ? "" : value.toFixed(digits));

const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

// Org board ─────────────────────────────────────────────────────────────────

export type OrgBoardItem = { name: string; kind: string; detail: string; hat: boolean };
export type OrgBoardDivision = { key: string; label: string; items: OrgBoardItem[]; more: number };
export type OrgBoardPaint = { divisions: OrgBoardDivision[]; recordCount: number; hatCount: number };

const ORG_BOARD_ITEMS = 4;

/**
 * Divisions as columns, each with the records filed under it (hats first,
 * with who holds them). Customers sit under Distribution.
 */
export function orgBoardPaint(
  divisions: Array<{ key: string; label: string }>,
  records: PaintRecord[],
  customers: Array<{ name: string }>,
  typeLabel: (type: string) => string,
): OrgBoardPaint {
  const byId = new Map(records.map((r) => [r.id, r]));
  const holders = (raw: unknown): string => {
    let ids: unknown = [];
    try {
      ids = JSON.parse(str(raw) || "[]");
    } catch {
      ids = [];
    }
    return (Array.isArray(ids) ? ids : [])
      .map((id) => byId.get(String(id))?.name ?? "")
      .filter(Boolean)
      .join(", ");
  };
  let hatCount = 0;
  let recordCount = 0;
  const out = divisions.map((division) => {
    const mine = records.filter((r) => r.parent_kind === "faculty" && r.parent_api_name === division.key);
    const items: OrgBoardItem[] = mine.map((r) => {
      const hat = r.type_api_name === "executive_hat";
      const who = hat ? holders(r.data?.holder_ids) : "";
      const status = str(r.data?.status) || str(r.status);
      const kind = hat ? "Hat" : typeLabel(r.type_api_name ?? "");
      return {
        name: str(r.name) || str(r.data?.name) || kind,
        kind,
        detail: hat ? who : status && status !== "active" ? sentence(status.replaceAll("_", " ")) : "",
        hat,
      };
    });
    if (division.key === "public") {
      for (const c of customers) items.push({ name: c.name, kind: "Customer", detail: "", hat: false });
    }
    items.sort((a, b) => Number(b.hat) - Number(a.hat));
    hatCount += items.filter((i) => i.hat).length;
    recordCount += items.length;
    return { key: division.key, label: division.label, items: items.slice(0, ORG_BOARD_ITEMS), more: Math.max(0, items.length - ORG_BOARD_ITEMS) };
  });
  return { divisions: out, recordCount, hatCount };
}

// Jobs and money ────────────────────────────────────────────────────────────

export type JobMoneyDoc = {
  id: string;
  kind: string;
  name: string;
  status: string;
  amount: string;
  note: string;
  /** Bills: share of the total matched to job lines (0-100). */
  allocatedPct?: number;
  remaining?: string;
  current: boolean;
};

export type JobMoneyLine = {
  description: string;
  quantity: string;
  unitCost: string;
  markup: string;
  unitPrice: string;
  priceTyped: boolean;
  lineTotal: string;
  actualCost: string;
  variance: string;
};

export type JobMoneyPaint = {
  title: string;
  counterparty: string;
  docs: JobMoneyDoc[];
  lines: JobMoneyLine[];
  totals: { subtotal: string; cost: string; margin: string; marginPct: string; good: boolean };
  billNames: string[];
};

const KIND_LABEL: Record<string, string> = {
  estimate: "Estimate",
  quote: "Quote",
  invoice: "Invoice",
  bill: "Vendor bill",
  transaction: "Transaction",
};

/**
 * One job: the bound transaction, the estimate it came from (or the invoice
 * made from it), the vendor bills its lines are matched to, its lines and
 * totals. All numbers are the stored values the save pipeline wrote.
 */
export function jobMoneyPaint(
  bound: PaintRecord,
  transactions: PaintRecord[],
  orgName: (id: string) => string,
): JobMoneyPaint {
  const byId = new Map(transactions.map((t) => [t.id, t]));
  const d = bound.data ?? {};
  const currency = str(d.currency) || "USD";
  const kindOf = (t: PaintRecord) => str(t.data?.document_kind) || "transaction";
  const source = byId.get(str(d.converted_from_id));
  const madeFromThis = transactions.filter((t) => str(t.data?.converted_from_id) === bound.id);
  const lines = (bound.lines ?? []).filter((l) => !str(l.line_group)).slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const billIds = [...new Set(lines.map((l) => str(l.data?.line_vendor_bill_id)).filter(Boolean))];
  const bills = billIds.map((id) => byId.get(id)).filter((t): t is PaintRecord => Boolean(t));

  const doc = (t: PaintRecord, current: boolean): JobMoneyDoc => {
    const td = t.data ?? {};
    const kind = kindOf(t);
    const amount = num(td.amount);
    const counter = orgName(str(td.counterparty_organization_id));
    const base: JobMoneyDoc = {
      id: t.id,
      kind: KIND_LABEL[kind] ?? kind,
      name: str(t.name) || str(td.name),
      status: (str(td.status) || str(t.status)).replaceAll("_", " "),
      amount: money(amount, str(td.currency) || currency),
      note: [counter, `${(t.lines ?? []).filter((l) => !str(l.line_group)).length} lines`].filter(Boolean).join(" · "),
      current,
    };
    if (kind === "bill") {
      const allocated = num(td.allocated_total) ?? 0;
      const total = amount ?? 0;
      base.allocatedPct = total > 0 ? Math.min(100, Math.round((allocated / total) * 1000) / 10) : 0;
      base.remaining = money(num(td.allocated_remaining) ?? total - allocated, str(td.currency) || currency);
      base.note = `${money(allocated, currency)} matched to job lines`;
    }
    return base;
  };

  const docs: JobMoneyDoc[] = [];
  if (source) docs.push(doc(source, false));
  docs.push(doc(bound, true));
  for (const t of madeFromThis) docs.push(doc(t, false));
  for (const b of bills) docs.push(doc(b, false));

  const paintLines: JobMoneyLine[] = lines.map((l) => {
    const ld = l.data ?? {};
    const cost = num(ld.line_unit_cost);
    const markup = num(ld.line_markup_pct);
    const price = num(ld.line_unit_price);
    const expected = cost === null ? null : cost * (1 + (markup ?? 0) / 100);
    return {
      description: str(ld.line_description) || "Line",
      quantity: str(ld.line_quantity),
      unitCost: plain(cost),
      markup: markup === null ? "" : `${markup}%`,
      unitPrice: plain(price),
      priceTyped: price !== null && expected !== null && Math.abs(price - expected) > 0.005,
      lineTotal: plain(num(ld.line_total)),
      actualCost: plain(num(ld.line_actual_cost)),
      variance: plain(num(ld.line_variance)),
    };
  });

  const subtotal = num(d.subtotal);
  const cost = num(d.cost_total);
  const margin = num(d.margin);
  const pct = num(d.margin_pct);
  return {
    title: str(bound.name) || str(d.name),
    counterparty: orgName(str(d.counterparty_organization_id)),
    docs,
    lines: paintLines,
    totals: {
      subtotal: money(subtotal, currency),
      cost: money(cost, currency),
      margin: money(margin, currency),
      marginPct: pct === null ? "" : `${pct}%`,
      good: (margin ?? 0) >= 0,
    },
    billNames: bills.map((b) => str(b.name)),
  };
}

// Asset card ────────────────────────────────────────────────────────────────

export type AssetPaint = {
  name: string;
  category: string;
  fields: Array<{ label: string; value: string; tone?: "due" }>;
  documents: Array<{ name: string; ext: string; size: string }>;
  mileage: null | {
    name: string;
    total: string;
    business: string;
    personal: string;
    pct: number | null;
    trips: Array<{ date: string; purpose: string; miles: string; business: boolean }>;
  };
};

function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** An asset: its fields, its documents (names only), and its latest mileage log. */
export function assetPaint(asset: PaintRecord, logs: PaintRecord[], today = new Date()): AssetPaint {
  const d = asset.data ?? {};
  const fields: AssetPaint["fields"] = [];
  const add = (label: string, value: string, tone?: "due") => {
    if (value) fields.push(tone ? { label, value, tone } : { label, value });
  };
  add("VIN / serial", str(d.serial_number));
  const price = num(d.purchase_price);
  add("Purchased", [shortDay(d.purchase_date), price === null ? "" : money(price)].filter(Boolean).join(" · "));
  const odo = num(d.current_odometer);
  add("Odometer", odo === null ? "" : `${odo.toLocaleString("en-US")} mi`);
  const due = str(d.next_service_due);
  const dueMs = Date.parse(`${due.slice(0, 10)}T00:00:00Z`);
  const soon = Number.isFinite(dueMs) && dueMs - today.getTime() < 60 * 86_400_000;
  add("Next service", shortDay(due), soon ? "due" : undefined);
  const use = num(d.business_use_pct);
  add("Business use", use === null ? "" : `${use}%`);

  let documents: AssetPaint["documents"] = [];
  try {
    const parsed = JSON.parse(str(d.documents) || "[]");
    documents = (Array.isArray(parsed) ? parsed : []).map((f: Record<string, unknown>) => {
      const name = str(f.name) || "File";
      return { name, ext: (name.split(".").pop() ?? "").toUpperCase().slice(0, 4), size: fileSize(Number(f.size) || 0) };
    });
  } catch {
    documents = [];
  }

  const mine = logs
    .filter((log) => str(log.data?.vehicle_id) === asset.id)
    .sort((a, b) => str(b.data?.tax_year).localeCompare(str(a.data?.tax_year)));
  const log = mine[0];
  let mileage: AssetPaint["mileage"] = null;
  if (log) {
    const ld = log.data ?? {};
    const trips = (log.lines ?? [])
      .map((l) => l.data ?? {})
      .filter((t) => str(t.trip_date))
      .sort((a, b) => str(a.trip_date).localeCompare(str(b.trip_date)));
    const total = num(ld.total_miles) ?? 0;
    const business = num(ld.business_miles) ?? 0;
    mileage = {
      name: str(log.name),
      total: total.toLocaleString("en-US"),
      business: business.toLocaleString("en-US"),
      personal: Math.max(0, total - business).toLocaleString("en-US"),
      pct: num(ld.business_use_pct),
      trips: trips.slice(-4).map((t) => ({
        date: shortDay(t.trip_date, false),
        purpose: str(t.trip_purpose),
        miles: str(t.trip_miles),
        business: str(t.trip_business) === "true",
      })),
    };
  }
  return {
    name: str(asset.name) || str(d.name),
    category: str(d.asset_category).replaceAll("_", " "),
    fields,
    documents,
    mileage,
  };
}

// Gantt ─────────────────────────────────────────────────────────────────────

/** Same shape the staff Gantt (`ProjectGanttPreviewView`) draws; built here so the server can make it. */
export function projectGanttPaints(projects: PaintRecord[]): ProjectGanttPreview[] {
  return projects.map((project) => {
    const data = project.data ?? {};
    const lines: TaskLine[] = (project.lines ?? [])
      .filter((line) => (line.line_group || "") === TASK_LINE_GROUP)
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((line) => ({
        id: str(line.id),
        data: Object.fromEntries(Object.entries(line.data ?? {}).map(([k, v]) => [k, str(v)])),
      }));
    return {
      kind: "project-gantt",
      recordId: project.id,
      name: str(project.name) || str(data.name),
      status: str(project.status) || str(data.status),
      owner: str(data.owner_name) || str(data.owner),
      startDate: str(data.start_date),
      targetDate: str(data.target_date),
      lines,
    };
  });
}
