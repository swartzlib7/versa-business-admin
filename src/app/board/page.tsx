import { PublicLayout } from "@/components/public/public-layout";
import { PublicOrgBoard } from "@/components/glossary/public-surfaces";
import { getSiteSettingsFixture } from "@/lib/fixtures/site-settings";
import { adapter } from "@/lib/data";
import { normalizePublicContent } from "@/lib/public/site-content";
import { gatePublicHref } from "@/lib/nav-server";
import { resolveSkyEffects, SKY_DENSITY_DEFAULT } from "@/lib/brand-display";

export const dynamic = "force-dynamic";

export default async function PublicBoardPage() {
  gatePublicHref("/board");
  const site = getSiteSettingsFixture();
  const pub = normalizePublicContent(site);
  const businessProfile = await adapter.getBusinessProfile();
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
      constellationVariant={site.constellation_variant === "realistic" ? "realistic" : "classic"}
      constellationDensity={site.constellation_density ?? SKY_DENSITY_DEFAULT}
      constellationZoom={site.constellation_zoom ?? 1}
      constellationEffects={resolveSkyEffects(site.constellation_effects)}
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <PublicOrgBoard />
      </div>
    </PublicLayout>
  );
}
