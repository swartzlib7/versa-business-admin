"use client";

import { pairingFromRecord } from "@/lib/public/driver-pairings";
import { foldLegacyDriver, paintKind } from "@/lib/public/render-drivers";
import type { PageBuilderCell } from "@/lib/public/page-builder";
import type { ResolvedCellPaint } from "@/lib/public/resolve-cell-paint";
import { contactCardFromSeed } from "@/lib/public/resolve-contact-card";
import { statRowsToGraphPoints } from "@/lib/statistics/model";
import type { RecordInstance } from "@/lib/fixtures/record-instances";
import type { Organization } from "@/lib/data/types";
import { pageRecordCardFrom } from "@/lib/public/page-record-card";

async function fetchJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

function codeKeyFromDriverId(driverId: string): string {
  if (driverId.startsWith("rd-")) return driverId.slice(3);
  return driverId;
}

/** Operator preview of Cell paint. Same pairing rule as the visitor resolver. */
export async function fetchCellPaint(cell: PageBuilderCell): Promise<ResolvedCellPaint> {
  const pairingId = cell.pairingId?.trim();
  if (!pairingId) return {};
  const pairingJson = await fetchJson<{ data?: RecordInstance }>(
    `/api/records/${encodeURIComponent(pairingId)}`,
  );
  const pairing = pairingJson?.data;
  if (!pairing) return {};
  const fields = pairingFromRecord(pairing);
  if (!fields) return {};

  let codeKey = "";
  const driverJson = await fetchJson<{ data?: RecordInstance }>(
    `/api/records/${encodeURIComponent(fields.driver_id)}`,
  );
  const driverRec = driverJson?.data;
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
    const pageJson = await fetchJson<{ data?: RecordInstance }>(
      `/api/records/${encodeURIComponent(targetId)}`,
    );
    const page = pageJson?.data;
    const data = page?.data ?? {};
    const html = [data.body_html, data.body, data.html].find((v) => typeof v === "string" && v.trim());
    if (typeof html === "string") out.html = html;
    if (kind === "record-card") out.pageCard = pageRecordCardFrom(page);
  }

  if (kind === "stat-graph" && targetId) {
    const recJson = await fetchJson<{ data?: RecordInstance }>(
      `/api/records/${encodeURIComponent(targetId)}`,
    );
    const rec = recJson?.data;
    if (rec && rec.type_api_name === "statistics") {
      const linesJson = await fetchJson<{ data?: Array<{ series?: number; slot?: number; value?: number }> }>(
        `/api/statistics/${encodeURIComponent(targetId)}/lines`,
      );
      const rows = (Array.isArray(linesJson?.data) ? linesJson.data : [])
        .filter((row): row is { series?: number; slot: number; value?: number } =>
          typeof row.slot === "number",
        );
      out.stat = {
        headerId: targetId,
        values: rec.data,
        lines: statRowsToGraphPoints(rows),
      };
    } else {
      out.stat = null;
    }
  }

  if ((kind === "location-card" || kind === "contacts-cards") && targetId) {
    const recJson = await fetchJson<{ data?: RecordInstance }>(
      `/api/records/${encodeURIComponent(targetId)}`,
    );
    const seed = recJson?.data;
    let org: Organization | null = null;
    const orgId = typeof seed?.data?.organization_id === "string" ? seed.data.organization_id.trim() : "";
    if (orgId) {
      const orgJson = await fetchJson<{ data?: Organization }>(
        `/api/organizations/${encodeURIComponent(orgId)}`,
      );
      org = orgJson?.data ?? null;
    }
    const contact = contactCardFromSeed(seed, org);
    if (contact) out.contact = contact;
  }

  return out;
}
