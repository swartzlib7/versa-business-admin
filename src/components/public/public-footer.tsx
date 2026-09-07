"use client";

import Link from "next/link";
import { ChevronUp } from "lucide-react";
import type { BusinessProfile } from "@/lib/data";
import { BrandMark, brandSurface, useBrand } from "@/components/shell/brand-provider";
import { useSiteMode } from "@/components/shell/site-mode-provider";
import { LOGO_BASE_PX, logoPx, logoSurfaceFilter } from "@/lib/brand-display";
import { scrollPublicToTop } from "./public-snap-scroll";
import { visiblePublicNavItems } from "@/lib/nav";

function addressLines(address: string): string[] {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2 && /^[A-Z]{2}$/i.test(parts[parts.length - 1] ?? "")) {
    const region = parts.pop() as string;
    parts[parts.length - 1] = `${parts[parts.length - 1]}, ${region}`;
  }
  return parts;
}

export function PublicFooter({
  business,
  demo = true,
}: {
  business: BusinessProfile;
  demo?: boolean;
}) {
  const year = new Date().getFullYear();
  const brand = useBrand();
  const footerLogo = brandSurface(brand, "footer");
  const { demo_mode, public_menu_enabled, public_menu_order } = useSiteMode();
  const showDemo = demo && demo_mode;
  const links = visiblePublicNavItems({
    demo: showDemo,
    enabled: public_menu_enabled,
    order: public_menu_order,
  }).filter((link) => link.href.startsWith("/#"));
  const splitAt = Math.ceil(links.length / 2);
  const linkCols = [links.slice(0, splitAt), links.slice(splitAt)];

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Back to top"
        onClick={scrollPublicToTop}
        className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-background/75 p-2 text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background hover:text-foreground"
      >
        <ChevronUp className="h-5 w-5" />
      </button>
      <footer className="border-t border-border bg-background/50 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3 md:items-start">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex flex-col items-center">
              <h4 className="w-full text-sm font-semibold">Mission Control</h4>
              <div className="mt-3 grid w-full grid-cols-2 gap-x-6">
                {linkCols.map((col, colIndex) => (
                  <ul key={colIndex} className="space-y-2 text-sm text-muted-foreground">
                    {col.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} className="hover:text-foreground">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center text-center">
            <Link href="/" className="inline-flex flex-col items-center gap-3">
              {brand.brand_logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- uploaded/data URL logos
                <img
                  src={brand.brand_logo_url}
                  alt={brand.brand_name}
                  className="h-auto object-contain"
                  style={{
                    width: logoPx(LOGO_BASE_PX.footer, footerLogo.scale),
                    opacity: footerLogo.opacity,
                    filter: logoSurfaceFilter(footerLogo),
                  }}
                />
              ) : (
                <BrandMark size="md" />
              )}
              <h3 className="text-base font-semibold">{brand.brand_name}</h3>
            </Link>
            <p className="mt-2 text-sm font-medium">{business.slogan}</p>
            {business.tagline ? (
              <p className="mt-1 text-xs text-muted-foreground">{business.tagline}</p>
            ) : null}
          </div>

          <div className="flex flex-col items-center space-y-3 text-center">
            <h4 className="text-sm font-semibold">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href={`mailto:${business.contactEmail}`}
                  className="hover:text-foreground"
                >
                  {business.contactEmail}
                </a>
              </li>
              <li>{business.contactPhone}</li>
              {addressLines(business.address).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">
            © {year} {brand.brand_name}. All rights reserved.
          </p>
        </div>
        </div>
      </footer>
    </div>
  );
}
