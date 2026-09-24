import type { TwinPreview } from "@/components/zones/twin-slot-context";
import type { Organization } from "@/lib/data/types";
import { codeKeyFromDriverRecord } from "@/lib/public/driver-pairings";
import { contactCardFromSeed } from "@/lib/public/resolve-contact-card";
import { paintKind } from "@/lib/public/render-drivers";
import type { RecordInstance } from "@/lib/fixtures/record-instances";
import { pageRecordCardFrom } from "@/lib/public/page-record-card";
import {
  inspectionPaint,
  integrationPaint,
  projectPaint,
  scheduleBoard,
} from "@/lib/public/board-paint";

function asData(raw: Record<string, unknown> | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw) return out;
  for (const [k, v] of Object.entries(raw)) {
    if (v == null) continue;
    out[k] = String(v);
  }
  return out;
}

/** Resolve the zone-rail TwinPreview for one Element (same slot Statistics uses). */
export async function loadPairingTwinPreview(args: {
  pairingId: string;
  pairingName?: string;
  pairingData?: Record<string, string>;
  signal?: AbortSignal;
}): Promise<TwinPreview> {
  let data = args.pairingData;
  let name = args.pairingName;
  if (!data) {
    const pairRes = await fetch(`/api/records/${encodeURIComponent(args.pairingId)}`, {
      credentials: "include",
      signal: args.signal,
    });
    if (!pairRes.ok) return null;
    const pairJson = (await pairRes.json()) as {
      data?: { name?: string; data?: Record<string, unknown> };
    };
    data = asData(pairJson.data?.data);
    name = name ?? pairJson.data?.name;
  }
  const driverId = String(data.driver_id ?? "").trim();
  let codeKey = String(data.code_key ?? "").trim();
  if (driverId) {
    const drvRes = await fetch(`/api/records/${encodeURIComponent(driverId)}`, {
      credentials: "include",
      signal: args.signal,
    });
    if (drvRes.ok) {
      const drvJson = (await drvRes.json()) as { data?: { data?: Record<string, unknown> } };
      codeKey = codeKeyFromDriverRecord(drvJson.data) || codeKey;
    }
  }
  const renderOption = String(data.render_option || data.render_output || "").trim();
  const kind = paintKind(codeKey, renderOption);
  const targetId = String(data.target_record_id ?? "").trim();
  if (kind === "stat-graph" && targetId && targetId !== "*") {
    const recRes = await fetch(`/api/records/${encodeURIComponent(targetId)}`, {
      credentials: "include",
      signal: args.signal,
    });
    const recJson = recRes.ok
      ? ((await recRes.json()) as { data?: { data?: Record<string, string> } })
      : {};
    return {
      kind: "stat-graph",
      values: recJson.data?.data ?? {},
      headerId: targetId,
      renderOutput: data.render_output,
    };
  }
  if ((kind === "html-block" || kind === "record-card") && targetId && targetId !== "*") {
    const recRes = await fetch(`/api/records/${encodeURIComponent(targetId)}`, {
      credentials: "include",
      signal: args.signal,
    });
    const recJson = recRes.ok
      ? ((await recRes.json()) as { data?: RecordInstance })
      : {};
    const page = recJson.data;
    const html = [page?.data?.body_html, page?.data?.body, page?.data?.html].find(
      (value) => typeof value === "string" && value.trim(),
    );
    return {
      kind: "canvas-driver",
      driver: codeKey || kind,
      label: name || page?.name,
      renderOutput: kind === "record-card" ? "record-card" : "html-block",
      html: typeof html === "string" ? html : undefined,
      pageCard: kind === "record-card" ? pageRecordCardFrom(page) : undefined,
    };
  }
  if ((kind === "location-card" || kind === "contacts-cards") && targetId && targetId !== "*") {
    const recRes = await fetch(`/api/records/${encodeURIComponent(targetId)}`, {
      credentials: "include",
      signal: args.signal,
    });
    const recJson = recRes.ok
      ? ((await recRes.json()) as { data?: RecordInstance })
      : {};
    const seed = recJson.data;
    let org: Organization | null = null;
    const orgId = typeof seed?.data?.organization_id === "string" ? seed.data.organization_id.trim() : "";
    if (orgId) {
      const orgRes = await fetch(`/api/organizations/${encodeURIComponent(orgId)}`, {
        credentials: "include",
        signal: args.signal,
      });
      const orgJson = orgRes.ok
        ? ((await orgRes.json()) as { data?: Organization })
        : {};
      org = orgJson.data ?? null;
    }
    const typed = seed
      ? { ...seed, type_api_name: data.target_record_type || seed.type_api_name || "location" }
      : undefined;
    return {
      kind: "canvas-driver",
      driver: codeKey || kind,
      label: name || typed?.name,
      renderOutput: renderOption === "location-map" ? "location-map" : "location-card",
      contact: contactCardFromSeed(typed, org),
    };
  }
  if (
    kind === "integration-table" ||
    kind === "schedule-board" ||
    kind === "inspection-tickets" ||
    kind === "project-table" ||
    kind === "project-cards"
  ) {
    const base = {
      kind: "canvas-driver" as const,
      driver: codeKey || kind,
      label: name,
      renderOutput: renderOption,
    };
    const one = targetId && targetId !== "*";
    if (kind === "schedule-board") {
      const list = await fetch("/api/records?type=schedule", { credentials: "include", signal: args.signal });
      const rows = list.ok ? ((await list.json()) as { data?: RecordInstance[] }).data ?? [] : [];
      return { ...base, schedule: scheduleBoard(one ? rows.filter((row) => row.id === targetId) : rows) };
    }
    if (kind === "integration-table") {
      const list = await fetch("/api/records?type=vendor_integration", { credentials: "include", signal: args.signal });
      const rows = list.ok ? ((await list.json()) as { data?: RecordInstance[] }).data ?? [] : [];
      const chosen = one ? rows.filter((row) => row.id === targetId) : rows;
      const orgRes = await fetch("/api/organizations", { credentials: "include", signal: args.signal });
      const orgJson = orgRes.ok ? ((await orgRes.json()) as { data?: Organization[] }) : {};
      const vendorById = new Map(
        (orgJson.data ?? []).map((org) => [org.id, { name: org.name, logoUrl: String(org.data?.logo_url ?? "") }] as const),
      );
      return { ...base, integration: integrationPaint(chosen, vendorById) };
    }
    if (kind === "inspection-tickets") {
      const list = await fetch("/api/records?type=inspection_report", { credentials: "include", signal: args.signal });
      const rows = list.ok ? ((await list.json()) as { data?: RecordInstance[] }).data ?? [] : [];
      return { ...base, inspection: inspectionPaint(one ? rows.filter((row) => row.id === targetId) : rows) };
    }
    const projectsRes = await fetch("/api/records?type=executive_project", { credentials: "include", signal: args.signal });
    const projects = projectsRes.ok ? ((await projectsRes.json()) as { data?: RecordInstance[] }).data ?? [] : [];
    const tasksRes = await fetch("/api/records?type=executive_task", { credentials: "include", signal: args.signal });
    const tasks = tasksRes.ok ? ((await tasksRes.json()) as { data?: RecordInstance[] }).data ?? [] : [];
    return { ...base, project: projectPaint(one ? projects.filter((row) => row.id === targetId) : projects, tasks) };
  }
  return {
    kind: "canvas-driver",
    driver: codeKey || kind,
    label: name,
    renderOutput: renderOption,
  };
}
