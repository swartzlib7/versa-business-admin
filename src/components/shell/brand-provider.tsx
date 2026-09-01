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
}

const DEFAULT_BRAND: BrandConfig = {
  brand_name: theme.brand.name,
  brand_color: theme.colors.brand,
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
