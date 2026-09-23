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
  ensureRowCells,
  isCellOn,
  isRowOn,
  normalizePageBuilder,
  rowHeightCss,
  sectionColumnsClass,
  sectionWidthClass,
  visibleCells,
} from "@/lib/public/page-builder";
import { CanvasSlotDriver } from "@/components/public/canvas-slot-drivers";
import { resolveCellPaints } from "@/lib/public/resolve-cell-paint";

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
  const paintCells = canvas.sections
    .filter(isRowOn)
    .flatMap((section) => visibleCells(ensureRowCells(section)).filter(isCellOn));
  const paints = await resolveCellPaints(paintCells);
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
    <PublicLayout business={business} demo={site.demo_mode !== false}>
      <div style={frame.inner}>
      {canvas.sections.filter(isRowOn).map((section, index, rows) => {
        const next = rows[index + 1];
        const cells = visibleCells(ensureRowCells(section));
        return (
          <PublicSection key={section.id} id={section.id} nextId={next?.id}>
              <div
                className="mx-auto flex h-full w-full items-center px-4 sm:px-6 lg:px-8"
                style={{ padding: frame.pad.padding, paddingTop: `max(${frame.pad.padding}, 4rem)` }}
              >
                <div className={cn(sectionWidthClass(section.width_pct), "min-w-0")}>
                <div
                  className={cn("min-h-0", sectionColumnsClass(section.columns))}
                  style={{ height: rowHeightCss(section) }}
                >
                  {cells.map((cell) => {
                    if (!isCellOn(cell)) {
                      return <div key={cell.id} className="h-full min-h-0" aria-hidden="true" />;
                    }
                    const paint = paints.get(cell.id);
                    if (!paint?.driver) {
                      return <div key={cell.id} className="h-full min-h-0" aria-hidden="true" />;
                    }
                    return (
                      <div key={cell.id} className="h-full min-h-0 min-w-0 max-w-full overflow-auto">
                        <CanvasSlotDriver
                          driver={paint.driver}
                          cycleSteps={cycleSteps}
                          stat={paint.stat ?? null}
                          html={paint.html}
                          pageCard={paint.pageCard}
                          contact={paint.contact}
                          renderOutput={paint.renderOutput}
                          pager={cell.showPager !== false}
                          pageNumber={cell.pageNumber ?? 1}
                        />
                      </div>
                    );
                  })}
                </div>
                </div>
              </div>
          </PublicSection>
        );
      })}
      </div>
    </PublicLayout>
  );
}
