"use client";

import { usePathname } from "next/navigation";
import { useBrand } from "@/components/shell/brand-provider";
import { VersaConstellation } from "@/components/public/versa-constellation";
import {
  resolveConstellationVariant,
  resolveSkyEffects,
  SKY_DENSITY_DEFAULT,
  SKY_STARS_ZOOM_DEFAULT,
} from "@/lib/brand-display";
import { cn } from "@/lib/utils";

function isPublicSkyPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/terms" ||
    pathname === "/board" ||
    pathname === "/p" ||
    pathname.startsWith("/p/")
  );
}

/** One sky for the tab. Client navigations hide/show it; they do not remount it. */
export function PublicSky() {
  const pathname = usePathname();
  const brand = useBrand();
  const visible = isPublicSkyPath(pathname);
  return (
    <div className={cn("public-sky", !visible && "invisible")} aria-hidden>
      <VersaConstellation
        variant={resolveConstellationVariant(brand.constellation_variant)}
        density={brand.constellation_density ?? SKY_DENSITY_DEFAULT}
        zoom={brand.constellation_zoom ?? SKY_STARS_ZOOM_DEFAULT}
        effects={resolveSkyEffects(brand.constellation_effects)}
      />
    </div>
  );
}
