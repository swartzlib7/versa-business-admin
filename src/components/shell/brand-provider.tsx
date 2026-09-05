"use client";

/**
 * #252 Settings functionality slice (Stephen round-2 item 10).
 * Brand context - server-read in the root layout (S4: PUT a new brand,
 * hard-reload login + sidebar, new brand appears WITHOUT rebuild/restart;
 * layout is force-dynamic so the read is per-request, never baked at
 * build time). Identity surfaces only (S2): sidebar, login, settings.
 */

import { createContext, useContext, type ReactNode } from "react";
import { theme } from "@/lib/theme";

export interface BrandConfig {
  brand_name: string;
  brand_color: string;
  brand_logo_url?: string | null;
  brand_logo_opacity?: number;
  brand_logo_glow?: number;
}

const DEFAULT_BRAND: BrandConfig = {
  brand_name: theme.brand.name,
  brand_color: theme.colors.brand,
  brand_logo_url: null,
  brand_logo_opacity: 1,
  brand_logo_glow: 0,
};

const BrandContext = createContext<BrandConfig>(DEFAULT_BRAND);

export function BrandProvider({
  brand,
  children,
}: {
  brand: BrandConfig;
  children: ReactNode;
}) {
  return (
    <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>
  );
}

export function useBrand(): BrandConfig {
  return useContext(BrandContext);
}

/** Logo-box initials: keep the static shortName for the default brand,
 * derive 2-letter initials for custom names (matches settings preview). */
export function brandInitials(brandName: string): string {
  if (brandName === theme.brand.name) return theme.brand.shortName;
  return brandName.slice(0, 2).toUpperCase() || theme.brand.shortName;
}

export function BrandMark({
  size = "sm",
  className,
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  const brand = useBrand();
  const dim = size === "md" ? "h-12 w-12" : "h-8 w-8";
  const opacity = brand.brand_logo_opacity ?? 1;
  const glow = brand.brand_logo_glow ?? 0;
  const glowFilter =
    glow > 0
      ? `drop-shadow(0 0 ${Math.round(glow * 14)}px rgba(255,255,255,${(glow * 0.85).toFixed(2)}))`
      : undefined;
  if (brand.brand_logo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- uploaded/data URL logos
      <img
        src={brand.brand_logo_url}
        alt={brand.brand_name}
        className={`${dim} shrink-0 rounded-md object-contain ${className ?? ""}`}
        style={{ opacity, filter: glowFilter }}
      />
    );
  }
  return (
    <div
      className={`${dim} flex shrink-0 items-center justify-center rounded-md text-sm font-bold ${className ?? ""}`}
      style={{
        backgroundColor: brand.brand_color,
        color: theme.colors.brandForeground,
        opacity,
        filter: glowFilter,
      }}
    >
      {brandInitials(brand.brand_name)}
    </div>
  );
}
