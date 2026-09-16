import { Fragment } from "react";
import { PublicLayout } from "@/components/public/public-layout";
import { PublicMaintenance } from "@/components/public/public-maintenance";
import { PublicSection } from "@/components/public/public-section";
import { getPublicSiteSettings } from "@/lib/fixtures/site-settings";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { adapter } from "@/lib/data";
import {
  LOGO_BASE_PX,
  logoPx,
  logoSurfaceFilter,
  resolveLogoSurfaces,
  resolveConstellationVariant,
  resolveSkyEffects,
  SKY_DENSITY_DEFAULT,
  SKY_STARS_ZOOM_DEFAULT,
} from "@/lib/brand-display";
import { loadCycleSteps, normalizePublicContent } from "@/lib/public/site-content";
import { composeHomeContent, sectionById } from "@/lib/public/demo-content";
import {
  nextPublicSectionId,
  resolvePublicMenu,
  homepageVisibleSectionIds,
} from "@/lib/nav";
import {
  canvasFrameStyle,
  canvasIsDisabled,
  homepageBuilderSectionOrder,
  normalizePageBuilder,
  sectionWidthClass,
} from "@/lib/public/page-builder";
import { CycleStrip } from "@/components/public/canvas-slot-drivers";
import { HomeSectionBody } from "@/components/public/home-section-drivers";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const site = await getPublicSiteSettings();
  const pub = normalizePublicContent(site);
  const cycle = await loadCycleSteps(site);
  const demo = site.demo_mode !== false;
  const showLogin = site.public_login_enabled !== false;
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
    (id) => homeById.get(id)?.enabled !== false,
  );
  const nextOf = (id: string) => nextPublicSectionId(id, sectionIds);
  const firstSection = sectionIds[0];
  const heroOn = builder.home_hero_enabled !== false;
  const homeDisabled = canvasIsDisabled(builder.home_width_pct);
  const homeFrame = canvasFrameStyle(
    builder.home_width_pct,
    builder.home_margin,
    builder.home_margin_unit,
  );
  const bundle = await composeHomeContent(site);

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
    <PublicLayout
      business={business}
      demo={demo}
      constellationVariant={resolveConstellationVariant(site.constellation_variant)}
      constellationDensity={site.constellation_density ?? SKY_DENSITY_DEFAULT}
      constellationZoom={site.constellation_zoom ?? SKY_STARS_ZOOM_DEFAULT}
      constellationEffects={resolveSkyEffects(site.constellation_effects)}
    >
      {homeDisabled ? null : (
      <div style={homeFrame.pad}>
      <div style={homeFrame.inner}>
      {heroOn ? (
      <PublicSection id="top" nextId={firstSection} className="bg-transparent">
        <div className="mx-auto flex w-full max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
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
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {firstSection ? (
                <a href={`#${firstSection}`} className={cn(buttonVariants({ size: "lg" }))}>
                  {demo ? "Explore Versa - Business Admin" : "See operations"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              ) : null}
              {sectionIds.includes("contacts") ? (
                <a href="#contacts" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                  Contacts
                </a>
              ) : null}
            </div>
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
        const content = sectionById(bundle, id);
        if (!content) return null;
        const slot = homeById.get(id);
        return (
          <Fragment key={id}>
            <PublicSection
              id={id}
              nextId={nextOf(id)}
              className={id === "contact" ? "border-b-0 bg-transparent" : "bg-transparent"}
            >
              <div className="mx-auto px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
                <div className={sectionWidthClass(slot?.width_pct)}>
                  <HomeSectionBody
                    content={content}
                    columns={slot?.columns}
                    showLogin={showLogin}
                  />
                </div>
              </div>
            </PublicSection>
          </Fragment>
        );
      })}
      </div>
      </div>
      )}
    </PublicLayout>
  );
}
