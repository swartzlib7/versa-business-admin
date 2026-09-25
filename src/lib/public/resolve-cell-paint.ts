import { adapter } from "@/lib/data";
import { pairingFromRecord } from "@/lib/public/driver-pairings";
import { foldLegacyDriver, paintKind } from "@/lib/public/render-drivers";
import type { PageBuilderCell } from "@/lib/public/page-builder";
import type { CanvasSlotStat } from "@/components/public/canvas-slot-drivers";
import { listStatLinesDb } from "@/lib/db/stat-lines-store";
import { statRowsToGraphPoints } from "@/lib/statistics/model";
import { resolvePublicContactFromRecord } from "@/lib/public/resolve-contacts";
import type { PublicContactCard } from "@/lib/public/resolve-contact-card";
import { pageRecordCardFrom, type PageRecordCard } from "@/lib/public/page-record-card";
import {
  inspectionPaint,
  integrationPaint,
  projectPaint,
  scheduleBoard,
  type InspectionPaint,
  type IntegrationPaint,
  type ProjectPaint,
  type SchedulePaint,
} from "@/lib/public/board-paint";

export type ResolvedCellPaint = {
  driver?: string;
  recordId?: string;
  recordType?: string;
  renderOutput?: string;
  html?: string;
  htmlFormat?: string;
  pageCard?: PageRecordCard | null;
  stat?: CanvasSlotStat | null;
  contact?: PublicContactCard;
  integration?: IntegrationPaint;
  schedule?: SchedulePaint;
  inspection?: InspectionPaint;
  project?: ProjectPaint;
};

function codeKeyFromDriverId(driverId: string): string {
  if (driverId.startsWith("rd-")) return driverId.slice(3);
  return driverId;
}

/** PB-26: Cell paint comes from the pairing record only. No pairing → empty. */
export async function resolveCellPaint(cell: PageBuilderCell): Promise<ResolvedCellPaint> {
  const pairingId = cell.pairingId?.trim();
  if (!pairingId || !adapter.getRecord) return {};
  const pairing = await adapter.getRecord(pairingId).catch(() => null);
  if (!pairing) return {};
  const fields = pairingFromRecord(pairing);
  if (!fields) return {};

  let codeKey = "";
  const driverRec = await adapter.getRecord(fields.driver_id).catch(() => null);
  const driverStatus = String(driverRec?.status ?? driverRec?.data?.status ?? "active");
  if (driverStatus && driverStatus !== "active") return {};
  if (typeof driverRec?.data?.code_key === "string" && driverRec.data.code_key.trim()) {
    codeKey = driverRec.data.code_key.trim();
  } else {
    codeKey = codeKeyFromDriverId(fields.driver_id);
  }
  if (codeKey.startsWith("home:")) return {};

  const targetId = fields.target_record_id === "*" ? undefined : fields.target_record_id;
  const folded = foldLegacyDriver(codeKey, fields.target_record_type);
  const renderOutput = cell.renderOutput || folded.output;
  const kind = paintKind(codeKey, renderOutput);
  const out: ResolvedCellPaint = {
    driver: kind,
    recordId: targetId,
    recordType: fields.target_record_type,
    renderOutput,
  };

  if ((kind === "html-block" || kind === "record-card") && targetId) {
    const page = await adapter.getRecord(targetId).catch(() => null);
    const data = page?.data ?? {};
    const html = [data.body_html, data.body, data.html].find((v) => typeof v === "string" && v.trim());
    if (typeof html === "string") out.html = html;
    if (typeof data.body_format === "string") out.htmlFormat = data.body_format;
    if (kind === "record-card") out.pageCard = pageRecordCardFrom(page);
  }

  if (kind === "stat-graph" && targetId) {
    const rec = await adapter.getRecord(targetId).catch(() => null);
    if (rec && rec.type_api_name === "statistics") {
      const rows = await listStatLinesDb(targetId).catch(() => []);
      out.stat = { headerId: targetId, values: rec.data, lines: statRowsToGraphPoints(rows) };
    } else {
      out.stat = null;
    }
  }

  if (kind === "integration-table" && adapter.listRecords) {
    const recs = await adapter.listRecords({ type_api_name: "vendor_integration" }).catch(() => []);
    const chosen = fields.selection_mode === "one" && targetId ? recs.filter((row) => row.id === targetId) : recs;
    const vendorById = new Map<string, { name: string; logoUrl: string }>();
    if (adapter.getOrganization) {
      for (const rec of chosen) {
        const vendorId = String(rec.data?.organization_id ?? "");
        if (!vendorId || vendorById.has(vendorId)) continue;
        const org = await adapter.getOrganization(vendorId).catch(() => null);
        if (org) vendorById.set(vendorId, { name: org.name, logoUrl: String(org.data?.logo_url ?? "") });
      }
    }
    out.integration = integrationPaint(chosen, vendorById);
  }

  if (kind === "schedule-board" && adapter.listRecords) {
    const recs = await adapter.listRecords({ type_api_name: "schedule" }).catch(() => []);
    const chosen = fields.selection_mode === "one" && targetId ? recs.filter((row) => row.id === targetId) : recs;
    out.schedule = scheduleBoard(chosen);
  }

  if (kind === "inspection-tickets" && adapter.listRecords) {
    const recs = await adapter.listRecords({ type_api_name: "inspection_report" }).catch(() => []);
    const chosen = fields.selection_mode === "one" && targetId ? recs.filter((row) => row.id === targetId) : recs;
    out.inspection = inspectionPaint(chosen);
  }

  if ((kind === "project-table" || kind === "project-cards") && adapter.listRecords) {
    const projects = await adapter.listRecords({ type_api_name: "executive_project" }).catch(() => []);
    const chosen = fields.selection_mode === "one" && targetId ? projects.filter((row) => row.id === targetId) : projects;
    const tasks = await adapter.listRecords({ type_api_name: "executive_task" }).catch(() => []);
    out.project = projectPaint(chosen, tasks);
  }

  if ((kind === "location-card" || kind === "contacts-cards") && targetId) {
    const contact = await resolvePublicContactFromRecord(fields.target_record_type, targetId);
    if (contact) out.contact = contact;
  }

  return out;
}

export async function resolveCellPaints(
  cells: PageBuilderCell[],
): Promise<Map<string, ResolvedCellPaint>> {
  const map = new Map<string, ResolvedCellPaint>();
  for (const cell of cells) {
    map.set(cell.id, await resolveCellPaint(cell));
  }
  return map;
}
