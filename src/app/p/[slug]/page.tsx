import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { PublicLayout } from "@/components/public/public-layout";
import { PublicSection } from "@/components/public/public-section";
import { getPublicSiteSettings } from "@/lib/fixtures/site-settings";
import { adapter } from "@/lib/data";
import { loadCycleSteps, normalizePublicContent } from "@/lib/public/site-content";
import {
  canvasForSlug,
  canvasFrameStyle,
  customCanvasHref,
  ensureRowCells,
  isBlankSlotLabel,
  isCellOn,
  isRowOn,
  normalizePageBuilder,
  sectionColumnsClass,
  sectionWidthClass,
  visibleCells,
} from "@/lib/public/page-builder";
import { CanvasSlotDriver, type CanvasSlotStat } from "@/components/public/canvas-slot-drivers";
import { listStatLinesDb } from "@/lib/db/stat-lines-store";
import { statRowsToGraphPoints } from "@/lib/statistics/model";
import {
  resolveConstellationVariant,
  resolveSkyEffects,
  SKY_DENSITY_DEFAULT,
  SKY_STARS_ZOOM_DEFAULT,
} from "@/lib/brand-display";

export const dynamic = "force-dynamic";

export default async function CustomCanvasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await getPublicSiteSettings();
  const builder = normalizePageBuilder(site.page_builder);
  // PB-06: resolve ANY enabled custom canvas by slug (not just the first).
  const canvas = canvasForSlug(builder, slug);
  if (!canvas) notFound();
  const frame = canvasFrameStyle(canvas.width_pct, canvas.margin, canvas.margin_unit);

  const pub = normalizePublicContent(site);
  const cycleSteps = await loadCycleSteps(site);
  const statByHeader = new Map<string, CanvasSlotStat | null>();
  const loadStat = async (headerId: string) => {
    if (statByHeader.has(headerId)) return;
    const rec = adapter.getRecord
      ? await adapter.getRecord(headerId).catch(() => null)
      : null;
    if (!rec || rec.type_api_name !== "statistics") {
      statByHeader.set(headerId, null);
      return;
    }
    const rows = await listStatLinesDb(headerId).catch(() => []);
    statByHeader.set(headerId, {
      headerId,
      values: rec.data,
      lines: statRowsToGraphPoints(rows),
    });
  };
  // PB-13: collect every bound record id across single / multi / all modes.
  const boundIds = new Set<string>();
  let allStatIds: string[] = [];
  for (const section of canvas.sections) {
    if (!isRowOn(section) || isBlankSlotLabel(section.label)) continue;
    for (const cell of visibleCells(ensureRowCells(section))) {
      if (!isCellOn(cell) || cell.kind !== "record" || cell.driver !== "stat-graph") continue;
      if (cell.recordMode === "multi") {
        for (const id of cell.recordIds ?? []) boundIds.add(id);
      } else if (cell.recordMode === "all") {
        if (!allStatIds.length) {
          const all = adapter.listRecords
            ? await adapter
                .listRecords({ type_api_name: "statistics" })
                .catch(() => [])
            : [];
          allStatIds = all.map((rec) => rec.id);
        }
        for (const id of allStatIds) boundIds.add(id);
      } else if (cell.recordId) {
        boundIds.add(cell.recordId);
      }
    }
  }
  for (const headerId of boundIds) await loadStat(headerId);
  let businessProfile: Awaited<ReturnType<typeof adapter.getBusinessProfile>>;
  try {
    businessProfile = await adapter.getBusinessProfile();
  } catch {
    businessProfile = {
      name: site.brand_name,
      slogan: "",
      tagline: "",
      logoUrl: "",
      description: "",
      purpose: "",
      production: "",
      contactEmail: pub.contact_email ?? "",
      contactPhone: pub.contact_phone ?? "",
      address: pub.contact_address ?? "",
      website: "",
    };
  }
  const business = {
    ...businessProfile,
    contactEmail: pub.contact_email,
    contactPhone: pub.contact_phone,
    address: pub.contact_address,
  };

  return (
    <PublicLayout
      business={business}
      demo={site.demo_mode !== false}
      constellationVariant={resolveConstellationVariant(site.constellation_variant)}
      constellationDensity={site.constellation_density ?? SKY_DENSITY_DEFAULT}
      constellationZoom={site.constellation_zoom ?? SKY_STARS_ZOOM_DEFAULT}
      constellationEffects={resolveSkyEffects(site.constellation_effects)}
    >
      <div style={frame.pad}>
      <div style={frame.inner}>
      {canvas.sections.filter(isRowOn).map((section, index, rows) => {
        const next = rows[index + 1];
        const cells = visibleCells(ensureRowCells(section));
        return (
          <PublicSection key={section.id} id={section.id} nextId={next?.id}>
            {isBlankSlotLabel(section.label) ? (
              <div className="mx-auto h-10" aria-hidden="true" />
            ) : (
              <div className="mx-auto">
                <div className={sectionWidthClass(section.width_pct)}>
                <p className="text-sm uppercase tracking-wide text-muted-foreground">{canvas.label}</p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight">{section.label}</h1>
                <div className={cn("mt-6", sectionColumnsClass(section.columns ?? canvas.columns))}>
                  {cells.map((cell) => {
                    if (!isCellOn(cell)) {
                      return <div key={cell.id} aria-hidden="true" />;
                    }
                    if (cell.kind === "empty") {
                      return (
                        <p key={cell.id} className="text-sm text-muted-foreground">
                          Empty cell · {customCanvasHref(canvas)}#{section.id}
                        </p>
                      );
                    }
                    const cellStats: CanvasSlotStat[] = [];
                    if (cell.kind === "record" && cell.driver === "stat-graph") {
                      const ids =
                        cell.recordMode === "multi"
                          ? cell.recordIds ?? []
                          : cell.recordMode === "all"
                            ? allStatIds
                            : cell.recordId
                              ? [cell.recordId]
                              : [];
                      for (const id of ids) {
                        const stat = statByHeader.get(id);
                        if (stat) cellStats.push(stat);
                      }
                    }
                    if (cellStats.length > 1) {
                      return (
                        <div key={cell.id} className="space-y-4">
                          {cellStats.map((stat) => (
                            <CanvasSlotDriver
                              key={stat.headerId}
                              driver={cell.driver}
                              cycleSteps={cycleSteps}
                              stat={stat}
                              renderOutput={cell.renderOutput}
                            />
                          ))}
                        </div>
                      );
                    }
                    return (
                      <CanvasSlotDriver
                        key={cell.id}
                        driver={cell.driver}
                        cycleSteps={cycleSteps}
                        stat={cellStats[0] ?? null}
                        renderOutput={cell.renderOutput}
                      />
                    );
                  })}
                </div>
                </div>
              </div>
            )}
          </PublicSection>
        );
      })}
      </div>
      </div>
    </PublicLayout>
  );
}
