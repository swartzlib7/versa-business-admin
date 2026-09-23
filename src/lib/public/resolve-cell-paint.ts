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

export type ResolvedCellPaint = {
  driver?: string;
  recordId?: string;
  recordType?: string;
  renderOutput?: string;
  html?: string;
  pageCard?: PageRecordCard | null;
  stat?: CanvasSlotStat | null;
  contact?: PublicContactCard;
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
