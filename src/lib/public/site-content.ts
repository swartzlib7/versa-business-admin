import { business } from "@/lib/fixtures/business";
import { createInstance, listInstances, listOrgLines } from "@/lib/fixtures/record-instances";
import type { FixtureSiteSettings } from "@/lib/fixtures/site-settings";
import {
  DEFAULT_CYCLE_STEPS,
  STAT_SCALES,
  type CycleStep,
  type PublicStat,
  type StatScale,
} from "@/lib/public/site-types";

export {
  DEFAULT_CYCLE_STEPS,
  STAT_SCALES,
  type CycleStep,
  type PublicStat,
  type StatScale,
};

function clampSteps(input: unknown): CycleStep[] {
  const src = Array.isArray(input) ? input : DEFAULT_CYCLE_STEPS;
  return src.slice(0, 10).map((raw, i) => {
    const row = (raw ?? {}) as Partial<CycleStep>;
    const fallback = DEFAULT_CYCLE_STEPS[i] ?? { title: "", desc: "", enabled: false };
    const title = typeof row.title === "string" ? row.title : fallback.title;
    const desc = typeof row.desc === "string" ? row.desc : fallback.desc;
    const enabled = typeof row.enabled === "boolean" ? row.enabled : Boolean(title.trim());
    return { title, desc, enabled };
  });
}

export function normalizePublicContent(settings: FixtureSiteSettings): {
  hero_headline: string;
  hero_subhead: string;
  cycle_enabled: boolean;
  cycle_steps: CycleStep[];
  contact_email: string;
  contact_phone: string;
  contact_address: string;
} {
  const steps = clampSteps(settings.cycle_steps);
  return {
    hero_headline:
      typeof settings.hero_headline === "string" && settings.hero_headline.trim()
        ? settings.hero_headline.trim()
        : business.slogan,
    hero_subhead:
      typeof settings.hero_subhead === "string" && settings.hero_subhead.trim()
        ? settings.hero_subhead.trim()
        : business.tagline,
    cycle_enabled: settings.cycle_enabled !== false,
    cycle_steps: steps.length ? steps : DEFAULT_CYCLE_STEPS,
    contact_email:
      typeof settings.contact_email === "string" && settings.contact_email.trim()
        ? settings.contact_email.trim()
        : business.contactEmail,
    contact_phone:
      typeof settings.contact_phone === "string" && settings.contact_phone.trim()
        ? settings.contact_phone.trim()
        : business.contactPhone,
    contact_address:
      typeof settings.contact_address === "string" && settings.contact_address.trim()
        ? settings.contact_address.trim()
        : business.address,
  };
}

export function enabledCycleSteps(settings: FixtureSiteSettings): CycleStep[] {
  const pub = normalizePublicContent(settings);
  if (!pub.cycle_enabled) return [];
  return pub.cycle_steps.filter((s) => s.enabled && s.title.trim());
}

export async function listPublicIntegrations() {
  const { adapter } = await import("@/lib/data");
  const orgs = adapter.listOrganizations
    ? await adapter.listOrganizations("vendor")
    : [];
  const lines = orgs.flatMap((org) =>
    listOrgLines(org.id, "integrations").map((line) => ({
      id: line.id,
      name: line.data.name || "Integration",
      kind: line.data.kind || "other",
      status: line.data.status || "connected",
      notes: line.data.notes || "",
      vendor: org.name,
    })),
  );
  return lines;
}

export function listPublicKnowledge() {
  return listInstances({
    type_api_name: "knowledge",
    parent_kind: "environment",
  }).map((row) => ({
    id: row.id,
    title: row.name,
    kind: row.data.kind || "document",
    summary: row.data.summary || "",
    updatedAt: row.created_at,
  }));
}

export function listPublicOperations() {
  const projectRows = listInstances({ type_api_name: "executive_project" }).map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status || p.data.status || "active",
  }));
  const taskRows = listInstances({ type_api_name: "executive_task" }).map((t) => ({
    id: t.id,
    name: t.name,
    status: t.status || t.data.status || "planned",
  }));
  return {
    projects: projectRows,
    tasks: taskRows,
    activeProjects: projectRows.filter((p) => p.status === "active").length,
    openTasks: taskRows.filter((t) => t.status !== "done" && t.status !== "completed").length,
  };
}

function seriesAround(value: number, points: number): number[] {
  const base = Math.max(0, value);
  return Array.from({ length: points }, (_, i) => {
    const wave = Math.sin(i / 2) * 0.12 + (i / points) * 0.18;
    return Math.max(0, Math.round(base * (0.72 + wave)));
  });
}

function parseSeries(raw: string | undefined, fallbackValue: number, scale: StatScale): number[] {
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.every((n) => typeof n === "number")) {
        return parsed.slice(0, 24);
      }
    } catch {
      /* use generated */
    }
  }
  const points = scale === "hour" ? 12 : scale === "day" ? 14 : scale === "week" ? 8 : scale === "year" ? 12 : 10;
  return seriesAround(fallbackValue, points);
}

export function ensureEnvironmentStatsSeeded(): void {
  const existing = listInstances({ type_api_name: "environment_stat" });
  if (existing.length) return;
  const ops = listPublicOperations();
  const seeds: Array<{ name: string; value: number; category: string; scale: StatScale }> = [
    { name: "Locations", value: listInstances({ type_api_name: "location" }).length, category: "Environment", scale: "month" },
    { name: "Events", value: listInstances({ type_api_name: "event" }).length, category: "Environment", scale: "week" },
    { name: "Knowledge assets", value: listInstances({ type_api_name: "knowledge" }).length, category: "Environment", scale: "month" },
    { name: "Schedules", value: listInstances({ type_api_name: "schedule" }).length, category: "Environment", scale: "week" },
    { name: "Active projects", value: ops.activeProjects, category: "Operations", scale: "month" },
    { name: "Open tasks", value: ops.openTasks, category: "Operations", scale: "week" },
  ];
  for (const seed of seeds) {
    createInstance({
      type_api_name: "environment_stat",
      parent_kind: "environment",
      parent_api_name: "stats",
      name: seed.name,
      status: "active",
      data: {
        value: String(seed.value),
        unit: "",
        category: seed.category,
        scale: seed.scale,
        series: JSON.stringify(seriesAround(seed.value, 10)),
      },
    });
  }
}

export function listPublicStats(): PublicStat[] {
  return listInstances({
    type_api_name: "environment_stat",
    parent_kind: "environment",
  }).map((row) => {
    const scale = (STAT_SCALES.includes(row.data.scale as StatScale)
      ? row.data.scale
      : "month") as StatScale;
    const numeric = Number(row.data.value);
    const valueNum = Number.isFinite(numeric) ? numeric : 0;
    return {
      id: row.id,
      label: row.name,
      value: row.data.value || String(valueNum),
      unit: row.data.unit || "",
      category: row.data.category || "Environment",
      scale,
      series: parseSeries(row.data.series, valueNum, scale),
    };
  });
}
