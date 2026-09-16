/**
 * DM-01: Demo mode composes visitor homepage data from live/sample records
 * first, and falls back to fixtures only where a record type does not exist.
 * Each section is flagged `record` or `fixture-gap` so the gap matrix is
 * visible in the builder and in GET /api/public/home-content.
 */
import { adapter } from "@/lib/data";
import { isSampleExternalId } from "@/lib/sample-data/pack";
import {
  listPublicIntegrations,
  listPublicKnowledge,
  listPublicStats,
  normalizePublicContent,
  type PublicStat,
} from "@/lib/public/site-content";
import { HOMEPAGE_SLOT_ORDER } from "@/lib/public/page-builder";
import { resolvePublicContacts } from "@/lib/public/resolve-contacts";
import type { FixtureSiteSettings } from "@/lib/fixtures/site-settings";

export type DemoSource = "record" | "fixture-gap";

export type HomeCard = {
  id: string;
  title: string;
  subtitle?: string;
  body?: string;
  badge?: string;
  meta?: string;
  icon?: string;
  features?: string[];
  trend?: string;
  value?: string;
};

export type HomeSectionContent = {
  id: (typeof HOMEPAGE_SLOT_ORDER)[number];
  source: DemoSource;
  title: string;
  subtitle: string;
  sample: boolean;
  cards: HomeCard[];
  stats?: PublicStat[];
  contact?: { email: string; phone: string; address: string };
  about?: { purpose: string; production: string; name: string };
  html?: string;
  htmlFormat?: "html" | "text";
  pendingTwin?: boolean;
};

export type HomeContentBundle = {
  demo: boolean;
  sampleInserted: boolean;
  sections: HomeSectionContent[];
};

async function samplePresent(): Promise<boolean> {
  try {
    const recs = adapter.listRecords ? await adapter.listRecords({}) : [];
    return recs.some((r) => isSampleExternalId(r.data?.external_id));
  } catch {
    return false;
  }
}

export async function composeHomeContent(
  site: FixtureSiteSettings,
): Promise<HomeContentBundle> {
  const demo = site.demo_mode !== false;
  const pub = normalizePublicContent(site);
  const inserted = await samplePresent();

  let tickets: Awaited<ReturnType<typeof adapter.listSupportTickets>> = [];
  let demoMetrics: Awaited<ReturnType<typeof adapter.listMetrics>> = [];
  let demoKnowledge: Awaited<ReturnType<typeof adapter.listKnowledgeArticles>> = [];
  let liveIntegrations: Awaited<ReturnType<typeof listPublicIntegrations>> = [];
  let liveStats: PublicStat[] = [];

  try {
    [
      tickets,
      demoMetrics,
      demoKnowledge,
      liveIntegrations,
      liveStats,
    ] = await Promise.all([
      adapter.listSupportTickets(),
      adapter.listMetrics(),
      adapter.listKnowledgeArticles(),
      listPublicIntegrations(),
      listPublicStats(),
    ]);
  } catch {
    /* fixtures / empty */
  }

  const liveKnowledge = listPublicKnowledge();
  let htmlPages: { id: string; name: string; data: Record<string, unknown> }[] = [];
  let reports: { id: string; name: string; data: Record<string, unknown> }[] = [];
  try {
    if (adapter.listRecords) {
      htmlPages = await adapter.listRecords({ type_api_name: "page" });
      reports = await adapter.listRecords({ type_api_name: "inspection_report" });
    }
  } catch {
    /* empty */
  }
  const resolvedContacts = await resolvePublicContacts();
  const htmlForSlot = (
    slot: string,
  ): { html: string; format: "html" | "text" } | undefined => {
    const row = htmlPages.find((r) => String(r.data?.slot ?? "") === slot);
    const body = row?.data?.body_html;
    if (typeof body !== "string" || !body.trim()) return undefined;
    return {
      html: body,
      format: row?.data?.body_format === "text" ? "text" : "html",
    };
  };

  const sections: HomeSectionContent[] = HOMEPAGE_SLOT_ORDER.map((id) => {
    switch (id) {
      case "facets": {
        const page = htmlForSlot("facets");
        return {
          id,
          source: page ? "record" : "fixture-gap",
          title: "Facets",
          subtitle: "Advertised features of Versa - Business Admin.",
          sample: false,
          cards: [],
          html: page?.html,
          htmlFormat: page?.format,
        };
      }
      case "integrations": {
        const fromRecords = liveIntegrations.length > 0;
        return {
          id,
          source: fromRecords ? "record" : "fixture-gap",
          title: "Integrations",
          subtitle: "System landscape — vendor integrations. A spatial twin is required before this section paints.",
          sample: false,
          cards: [],
          pendingTwin: true,
        };
      }
      case "inspections-reports": {
        const fromRecords = reports.length > 0;
        return {
          id,
          source: fromRecords ? "record" : "fixture-gap",
          title: "Inspections & Reports",
          subtitle: "Organization → Communications — each header is a support type; lines are request tickets.",
          sample: demo && !fromRecords,
          cards: fromRecords
            ? reports.map((r) => ({
                id: r.id,
                title: r.name,
                body: typeof r.data?.summary === "string" ? r.data.summary : "",
                badge: typeof r.data?.status === "string" ? r.data.status : undefined,
              }))
            : demo
              ? tickets.map((t) => ({
                  id: t.id,
                  title: t.subject,
                  subtitle: t.customer,
                  body: t.channel,
                  badge: t.status,
                  meta: t.priority,
                }))
              : [],
        };
      }
      case "statistics": {
        const fromRecords = liveStats.length > 0;
        return {
          id,
          source: fromRecords ? "record" : "fixture-gap",
          title: "Statistics",
          subtitle: fromRecords
            ? "Environment statistics — card plus graph."
            : "KPI snapshots and health indicators.",
          sample: demo && !fromRecords,
          cards: fromRecords || !demo
            ? []
            : demoMetrics.map((m) => ({
                id: m.id,
                title: m.label,
                value: m.value,
                body: m.trendValue,
                badge: m.category,
                trend: m.trend,
              })),
          stats: fromRecords ? liveStats : undefined,
        };
      }
      case "knowledge": {
        const fromRecords = liveKnowledge.length > 0;
        const cards = fromRecords
          ? liveKnowledge.map((a) => ({
              id: a.id,
              title: a.title,
              body: a.summary || "—",
              badge: a.kind,
              meta: a.updatedAt ? `Updated: ${new Date(a.updatedAt).toLocaleDateString()}` : undefined,
            }))
          : demo
            ? demoKnowledge.map((a) => ({
                id: a.id,
                title: a.title,
                body: a.summary,
                badge: a.category,
                meta: `Updated: ${new Date(a.updatedAt).toLocaleDateString()}`,
              }))
            : [];
        return {
          id,
          source: fromRecords ? "record" : "fixture-gap",
          title: "Knowledge",
          subtitle: fromRecords
            ? "Environment knowledge records."
            : "Handbook, process docs, and searchable knowledge.",
          sample: demo && !fromRecords,
          cards,
        };
      }
      case "contacts": {
        const fromRecords = Boolean(resolvedContacts);
        return {
          id,
          source: fromRecords ? "record" : "fixture-gap",
          title: "Contacts",
          subtitle: "Organization → Distribution → Contacts, or a Location, resolved through the related Organization.",
          sample: demo && !fromRecords,
          cards: [],
          contact: resolvedContacts ?? {
            email: pub.contact_email,
            phone: pub.contact_phone,
            address: pub.contact_address,
          },
        };
      }
      default:
        return {
          id,
          source: "fixture-gap",
          title: id,
          subtitle: "",
          sample: demo,
          cards: [],
        };
    }
  });

  return { demo, sampleInserted: inserted, sections };
}

export function sectionById(
  bundle: HomeContentBundle,
  id: string,
): HomeSectionContent | undefined {
  return bundle.sections.find((s) => s.id === id);
}
