import { Fragment } from "react";
import { PublicLayout } from "@/components/public/public-layout";
import { PublicMaintenance } from "@/components/public/public-maintenance";
import { PublicSection } from "@/components/public/public-section";
import { getPublicSiteSettings } from "@/lib/fixtures/site-settings";
import { cn } from "@/lib/utils";
import { adapter } from "@/lib/data";
import {
  LOGO_BASE_PX,
  logoPx,
  logoSurfaceFilter,
  resolveLogoSurfaces,
} from "@/lib/brand-display";
import { loadCycleSteps, normalizePublicContent } from "@/lib/public/site-content";
import {
  nextPublicSectionId,
  resolvePublicMenu,
  homepageVisibleSectionIds,
} from "@/lib/nav";
import {
  canvasMetricVars,
  rowWidthVars,
  canvasIsDisabled,
  ensureRowCells,
  homepageBuilderSectionOrder,
  isCellOn,
  isRowOn,
  normalizePageBuilder,
  rowHeightCss,
  sectionColumnsClass,
  visibleCells,
} from "@/lib/public/page-builder";
import { resolveCellPaints } from "@/lib/public/resolve-cell-paint";
import { CanvasSlotDriver, CycleStrip } from "@/components/public/canvas-slot-drivers";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const site = await getPublicSiteSettings();
  const pub = normalizePublicContent(site);
  const cycle = await loadCycleSteps(site);
  const demo = site.demo_mode !== false;
  const publicMenu = resolvePublicMenu({
    enabled: site.public_menu_enabled,
    order: site.public_menu_order,
  });
  const visibleIds = homepageVisibleSectionIds({
    demo,
    enabled: publicMenu.enabled,
    order: publicMenu.order,
  });
  const builder = normalizePageBuilder(site.page_builder);
  const homeById = new Map((builder.home_sections ?? []).map((s) => [s.id, s]));
  const sectionIds = homepageBuilderSectionOrder(builder.home_section_order, visibleIds).filter(
    (id) => {
      const row = homeById.get(id);
      return row ? isRowOn(row) : false;
    },
  );
  const nextOf = (id: string) => nextPublicSectionId(id, sectionIds);
  const firstSection = sectionIds[0];
  const heroOn = builder.home_hero_enabled !== false;
  const homeDisabled = canvasIsDisabled(builder.home_width_pct);
  const homeFrame = canvasMetricVars({
    widthPct: builder.home_width_pct,
    margin: builder.home_margin,
    marginUnit: builder.home_margin_unit,
    mobileWidthPct: builder.home_mobile_width_pct,
    mobileMargin: builder.home_mobile_margin,
    mobileMarginUnit: builder.home_mobile_margin_unit,
  });
  const homeCells = sectionIds.flatMap((id) => {
    const slot = homeById.get(id);
    if (!slot) return [];
    return visibleCells(ensureRowCells(slot)).filter(isCellOn);
  });
  const paints = await resolveCellPaints(homeCells);

  const emptyProfile = {
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
  let businessProfile = emptyProfile;
  try {
    businessProfile = await adapter.getBusinessProfile();
  } catch {
    businessProfile = emptyProfile;
  }
  const homeLogo = resolveLogoSurfaces(site as unknown as Record<string, unknown>).home;
  const business = {
    ...businessProfile,
    contactEmail: pub.contact_email,
    contactPhone: pub.contact_phone,
    address: pub.contact_address,
  };

  if (site.maintenance_mode === true) {
    return <PublicMaintenance brandName={site.brand_name} />;
  }

  return (
    <PublicLayout business={business} demo={demo}>
      {homeDisabled ? null : (
      <div className="pb-canvas-inner" style={homeFrame}>
      {heroOn ? (
      <PublicSection id="top" nextId={firstSection} className="bg-transparent">
        <div
          className="pb-section-pad mx-auto flex h-full w-full max-w-7xl items-center"
        >
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
            {site.brand_logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- uploaded/data URL logos
              <img
                src={site.brand_logo_url}
                alt={site.brand_name}
                className="mb-6 h-auto w-[var(--logo-m)] object-contain sm:w-[var(--logo-d)]"
                style={{
                  ["--logo-m" as string]: `${logoPx(LOGO_BASE_PX.homeMobile, homeLogo.scale)}px`,
                  ["--logo-d" as string]: `${logoPx(LOGO_BASE_PX.homeDesktop, homeLogo.scale)}px`,
                  opacity: homeLogo.opacity,
                  filter: logoSurfaceFilter(homeLogo),
                }}
              />
            ) : (
              <div
                className="mb-6 flex h-24 w-24 items-center justify-center rounded-md text-2xl font-bold text-white"
                style={{ backgroundColor: site.brand_color }}
              >
                {site.brand_name.slice(0, 2).toUpperCase() || "VA"}
              </div>
            )}
            <h1 className="whitespace-nowrap text-[clamp(1.35rem,4.2vw,3.25rem)] font-bold tracking-tight">
              {pub.hero_headline}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">{pub.hero_subhead}</p>
            {cycle.length > 0 ? (
              <div className="mt-12 w-full">
                <CycleStrip steps={cycle} />
              </div>
            ) : null}
          </div>
        </div>
      </PublicSection>
      ) : null}

      {sectionIds.map((id) => {
        const slot = homeById.get(id);
        if (!slot) return null;
        const row = ensureRowCells(slot);
        const cells = visibleCells(row);
        return (
          <Fragment key={id}>
            <PublicSection
              id={id}
              nextId={nextOf(id)}
              className="bg-transparent"
            >
              <div
                className="pb-section-pad mx-auto flex h-full w-full items-center"
              >
                <div className="pb-row-width min-w-0" style={rowWidthVars(slot.width_pct, slot.mobile_width_pct)}>
                  <div
                    className={cn("min-h-0", sectionColumnsClass(slot.columns))}
                    style={{ height: rowHeightCss(row) }}
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
                            cycleSteps={cycle}
                            stat={paint.stat ?? null}
                            html={paint.html}
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
          </Fragment>
        );
      })}
      </div>
      )}
    </PublicLayout>
  );
}
