import { PublicHeader } from "./public-header";
import { PublicFooter } from "./public-footer";
import { PublicSnapScroll } from "./public-snap-scroll";
import { VersaConstellation } from "./versa-constellation";
import type { BusinessProfile } from "@/lib/data";
import { SKY_DENSITY_DEFAULT, SKY_STARS_ZOOM_DEFAULT, SKY_VARIANT_DEFAULT, type SkyEffects } from "@/lib/brand-display";

export function PublicLayout({
  business,
  demo = true,
  constellationVariant = SKY_VARIANT_DEFAULT,
  constellationDensity = SKY_DENSITY_DEFAULT,
  constellationZoom = SKY_STARS_ZOOM_DEFAULT,
  constellationEffects,
  children,
}: {
  business: BusinessProfile;
  demo?: boolean;
  constellationVariant?: "classic" | "realistic";
  constellationDensity?: number;
  constellationZoom?: number;
  constellationEffects?: SkyEffects;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-transparent">
      <VersaConstellation
        variant={constellationVariant}
        density={constellationDensity}
        zoom={constellationZoom}
        effects={constellationEffects}
      />
      <div className="relative z-10 flex min-h-screen flex-col">
        <PublicHeader />
        <main className="flex-1 bg-transparent">
          {children}
          <PublicSnapScroll />
        </main>
        <PublicFooter business={business} demo={demo} />
      </div>
    </div>
  );
}
