import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { PublicLayout } from "@/components/public/public-layout";
import { PublicSection } from "@/components/public/public-section";
import { getPublicSiteSettings } from "@/lib/fixtures/site-settings";
import { adapter } from "@/lib/data";
import { loadCycleSteps, normalizePublicContent } from "@/lib/public/site-content";
import {
  canvasForSlug,
  canvasMetricVars,
  rowWidthVars,
  ensureRowCells,
  isCellOn,
  isRowOn,
  normalizePageBuilder,
  rowFitsContent,
  rowHeightCss,
  sectionColumnsClass,
  visibleCells,
} from "@/lib/public/page-builder";
import { CanvasSlotDriver } from "@/components/public/canvas-slot-drivers";
import { CanvasHtmlPage } from "@/components/public/canvas-html-page";
import { CanvasSkyFlag } from "@/components/public/canvas-sky-flag";
import { PublicMaintenance } from "@/components/public/public-maintenance";
import { resolveCellPaints } from "@/lib/public/resolve-cell-paint";
import { signedInVisitor } from "@/lib/public/visitor-session";
import { pageBodyHtml } from "@/lib/public/page-record";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await getPublicSiteSettings();
  const canvas = canvasForSlug(normalizePageBuilder(site.page_builder), slug);
  const seo = canvas?.seo;
  let pageTitle = "";
  if (canvas?.content_mode === "html" && canvas.html_page_id && !seo?.title && adapter.listRecords) {
    const pages = await adapter.listRecords({ type_api_name: "page" }).catch(() => []);
    pageTitle = pages.find((row) => row.id === canvas.html_page_id)?.name ?? "";
  }
  const title = seo?.title || pageTitle || canvas?.label || site.brand_name;
  const description = seo?.description || "";
  return {
    title,
    description,
    robots: seo?.noindex ? { index: false, follow: false } : undefined,
    alternates: { canonical: `/p/${slug}` },
    openGraph: {
      title,
      description,
      images: seo?.og_image_url ? [seo.og_image_url] : undefined,
    },
  };
}

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
  if (site.maintenance_mode === true && !(await signedInVisitor())) {
    return <PublicMaintenance brandName={site.brand_name} />;
  }
  const frame = canvasMetricVars({
    widthPct: canvas.width_pct,
    widthUnit: canvas.width_unit,
    widthPx: canvas.width_px,
    margin: canvas.margin,
    mobileWidthPct: canvas.mobile_width_pct,
    mobileWidthUnit: canvas.mobile_width_unit,
    mobileWidthPx: canvas.mobile_width_px,
    mobileMargin: canvas.mobile_margin,
  });

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

  const fullHtml = canvas.content_mode === "html" ? await pageBodyHtml(canvas.html_page_id) : "";
  const pageStyles = await pageBodyHtml(canvas.style_page_id);

  return (
    <PublicLayout
      business={business}
      demo={site.demo_mode !== false}
      showHeader={canvas.header_enabled !== false}
      showFooter={canvas.footer_enabled !== false}
      maintenance={site.maintenance_mode === true}
    >
      <CanvasSkyFlag on={site.sky_enabled !== false && canvas.sky !== "off"} />
      <div className="pb-canvas-inner" style={frame}>
      {canvas.content_mode === "html" ? (
        <CanvasHtmlPage
          html={fullHtml}
          stylesheet={pageStyles}
          belowHeader={canvas.header_enabled !== false}
        />
      ) : canvas.sections.filter(isRowOn).map((section, index, rows) => {
        const next = rows[index + 1];
        const cells = visibleCells(ensureRowCells(section));
        const fit = rowFitsContent(section);
        return (
          <PublicSection key={section.id} id={section.id} nextId={next?.id} fillViewport={!fit}>
              <div
                className={cn(
                  "mx-auto flex h-full w-full items-center",
                  fit ? (index === 0 && canvas.header_enabled !== false ? "pt-28" : "") : "pb-section-pad",
                )}
              >
                <div className="pb-row-width min-w-0" style={rowWidthVars(section.width_pct, section.mobile_width_pct)}>
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
                      <div
                        key={cell.id}
                        className={cn(
                          "min-h-0 min-w-0 max-w-full",
                          fit ? "overflow-visible" : "h-full overflow-auto",
                        )}
                      >
                        <CanvasSlotDriver
                          driver={paint.driver}
                          cycleSteps={cycleSteps}
                          stat={paint.stat ?? null}
                          html={paint.html}
                          htmlFormat={paint.htmlFormat}
                          pageStyles={pageStyles}
                          pageCard={paint.pageCard}
                          contact={paint.contact}
                          integration={paint.integration}
                          schedule={paint.schedule}
                          inspection={paint.inspection}
                          project={paint.project}
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
