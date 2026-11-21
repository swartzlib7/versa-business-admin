/**
 * Paint for the 1.0.16 drivers (Gantt, Job and money, Asset card, Organization
 * board). The visitor resolver (server) and the operator preview (browser)
 * pass their own fetchers; the record choice and the paint are the same.
 */
import type { DriverPairingFields } from "@/lib/public/driver-pairings";
import { parsePairingFilter, recordMatchesFilter, selectPairedRecords } from "@/lib/public/pairing-filter";
import {
  assetPaint,
  jobMoneyPaint,
  orgBoardPaint,
  projectGanttPaints,
  type AssetPaint,
  type JobMoneyPaint,
  type OrgBoardPaint,
} from "@/lib/public/board-paint";
import type { ProjectGanttPreview } from "@/components/zones/project-gantt-preview";

export type BoardPaints = {
  gantt?: ProjectGanttPreview[];
  jobMoney?: JobMoneyPaint | null;
  assets?: AssetPaint[];
  orgBoard?: OrgBoardPaint;
};

type Rec = {
  id: string;
  name?: string;
  status?: string;
  type_api_name?: string;
  parent_kind?: string;
  parent_api_name?: string;
  data?: Record<string, unknown>;
  lines?: Array<{ id?: string; line_group?: string; sort_order?: number; data?: Record<string, unknown> }>;
};

type Org = { id: string; name: string; org_type?: string; data?: Record<string, unknown> };

export type BoardFetchers = {
  /** Records of one type, or every record when `type` is omitted. */
  listRecords: (type?: string) => Promise<Rec[]>;
  listOrganizations: () => Promise<Org[]>;
  typeLabel: (type: string) => string;
};

/** The divisions in org-board order (Records Editor taxonomy). */
export const ORG_DIVISIONS = [
  { key: "executive", label: "Executive" },
  { key: "public", label: "Distribution" },
  { key: "communications", label: "Communications" },
  { key: "dissemination", label: "Dissemination" },
  { key: "treasury", label: "Treasury" },
  { key: "production", label: "Production" },
  { key: "qualification", label: "Qualification" },
];

export const BOARD_PAINT_KINDS = new Set(["project-gantt", "job-money", "asset-card", "org-records"]);

export async function resolveBoardPaint(
  kind: string,
  fields: DriverPairingFields,
  f: BoardFetchers,
): Promise<BoardPaints | undefined> {
  if (!BOARD_PAINT_KINDS.has(kind)) return undefined;
  const targetId = fields.target_record_id === "*" ? "" : fields.target_record_id;

  if (kind === "project-gantt") {
    const projects = selectPairedRecords(await f.listRecords("executive_project"), fields);
    return { gantt: projectGanttPaints(projects) };
  }

  if (kind === "job-money") {
    const all = await f.listRecords("treasury_transaction");
    const bound = all.find((t) => t.id === targetId);
    if (!bound) return { jobMoney: null };
    const orgs = new Map((await f.listOrganizations()).map((o) => [o.id, o.name]));
    return { jobMoney: jobMoneyPaint(bound, all, (id) => orgs.get(id) ?? "") };
  }

  if (kind === "asset-card") {
    const assets = selectPairedRecords(await f.listRecords("treasury_records_assets_materiel"), fields);
    const logs = await f.listRecords("treasury_vehicle_mileage_log");
    return { assets: assets.map((asset) => assetPaint(asset, logs)) };
  }

  // org-records: every faculty record (and customer) that passes the Element filter
  const conditions = fields.selection_mode === "filter" ? parsePairingFilter(fields.filter_json) : [];
  const records = (await f.listRecords()).filter((r) => recordMatchesFilter(r, conditions));
  const customers = (await f.listOrganizations()).filter(
    (o) => o.org_type === "customer" && recordMatchesFilter({ name: o.name, data: o.data }, conditions),
  );
  return { orgBoard: orgBoardPaint(ORG_DIVISIONS, records, customers, f.typeLabel) };
}

/** Fetchers for the operator preview (signed-in browser). */
export async function browserBoardFetchers(kind: string, signal?: AbortSignal): Promise<BoardFetchers> {
  const get = async <T,>(url: string): Promise<T | null> => {
    const res = await fetch(url, { credentials: "include", signal });
    return res.ok ? ((await res.json()) as T) : null;
  };
  const labels = new Map<string, string>();
  if (kind === "org-records") {
    const types = await get<{ data?: Array<{ api_name: string; label: string }> }>("/api/catalog/record-types");
    for (const row of types?.data ?? []) labels.set(row.api_name, row.label);
  }
  return {
    listRecords: async (type) =>
      (await get<{ data?: Rec[] }>(type ? `/api/records?type=${encodeURIComponent(type)}` : "/api/records"))?.data ?? [],
    listOrganizations: async () => (await get<{ data?: Org[] }>("/api/organizations"))?.data ?? [],
    typeLabel: (type) => labels.get(type) ?? type,
  };
}
