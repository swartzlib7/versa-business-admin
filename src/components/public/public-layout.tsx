import { PublicHeader } from "./public-header";
import { PublicFooter } from "./public-footer";
import { PublicSnapScroll } from "./public-snap-scroll";
import { VersaConstellation } from "./versa-constellation";
import type { BusinessProfile } from "@/lib/data";

export function PublicLayout({
  business,
  demo = true,
  constellationVariant = "classic",
  constellationDensity = 0,
  children,
}: {
  business: BusinessProfile;
  demo?: boolean;
  constellationVariant?: "classic" | "realistic";
  constellationDensity?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-transparent">
      <VersaConstellation variant={constellationVariant} density={constellationDensity} />
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
