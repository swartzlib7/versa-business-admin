import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/shell/theme-provider";
import { BrandProvider } from "@/components/shell/brand-provider";
import { SiteModeProvider } from "@/components/shell/site-mode-provider";
import { getSiteSettingsDb } from "@/lib/db/settings-store";
import { getBrandLogoOverlay, getSiteSettingsFixture } from "@/lib/fixtures/site-settings";
import { resolveLogoSurfaces, clampSkyZoom, resolveConstellationVariant, resolveSkyEffects, SKY_DENSITY_DEFAULT, SKY_STARS_ZOOM_DEFAULT, SKY_VARIANT_DEFAULT, type LogoSurfaces, type SkyEffects } from "@/lib/brand-display";
import { theme } from "@/lib/theme";
import {
  defaultPublicNavHrefs,
  publicFlagsFromEnabled,
  resolvePublicMenu,
} from "@/lib/nav";
import "@/lib/catalog/install-durable";
import { isPostgresDataSource } from "@/lib/db/data-source";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Versa AGi",
  description: "Sample maker workspace — replace with your brand and production story",
};

// #252 S4: branding must reflect PUTs on hard reload WITHOUT rebuild/restart.
// Force dynamic rendering so the root-layout server read is per-request,
// never baked into a static prerender at build time.
export const dynamic = "force-dynamic";

const themeInitScript = `(function(){try{var path=location.pathname;var isPublic=path==='/'||path===''||path==='/terms'||path==='/board';var t=localStorage.getItem(isPublic?'versa-public-ui-theme':'versa-ui-theme')||localStorage.getItem('versa-ui-theme');if(isPublic){if(t!=='slate'&&t!=='dark'&&t!=='architect')t='dark';}else if(t!=='light'&&t!=='dusk'&&t!=='dark'&&t!=='architect'&&t!=='slate')t='dark';var r=document.documentElement;r.classList.remove('dark','architect','slate','dusk');if(t==='dark')r.classList.add('dark');if(t==='architect')r.classList.add('architect');if(t==='slate')r.classList.add('slate');if(t==='dusk')r.classList.add('dusk');r.dataset.theme=t;}catch(e){}})();`;

type LoadedSite = {
  brand_name: string;
  brand_color: string;
  brand_logo_url: string | null;
  brand_logo_opacity: number;
  brand_logo_glow: number;
  brand_logo_glow_color: string;
  brand_logo_glow_spread: number;
  brand_logo_scale_menu: number;
  brand_logo_scale_home: number;
  brand_logo_scale_footer: number;
  constellation_variant: "classic" | "realistic";
  constellation_density: number;
  constellation_zoom: number;
  constellation_effects: SkyEffects;
  brand_logo_surfaces: LogoSurfaces;
  demo_mode: boolean;
  maintenance_mode: boolean;
  public_login_enabled: boolean;
  glossary_in_menu: boolean;
  org_board_enabled: boolean;
  public_menu_order: string[];
  public_menu_enabled: string[];
};

async function loadBrand(): Promise<LoadedSite> {
  try {
    const settings =
      isPostgresDataSource()
        ? await getSiteSettingsDb()
        : getSiteSettingsFixture();
    const fromSettings =
      "brand_logo_url" in settings
        ? (settings as { brand_logo_url?: string | null }).brand_logo_url
        : undefined;
    const logo = fromSettings || getBrandLogoOverlay();
    const fixture = getSiteSettingsFixture();
    const num = (v: unknown, fallback: number) =>
      typeof v === "number" && Number.isFinite(v) ? v : fallback;
    const settingsRec = settings as unknown as Record<string, unknown>;
    const surfaces = resolveLogoSurfaces(settingsRec);
    const { enabled: public_menu_enabled, order: public_menu_order } = resolvePublicMenu({
      enabled: fixture.public_menu_enabled,
      order: fixture.public_menu_order,
    });
    const flags = publicFlagsFromEnabled(public_menu_enabled);
    return {
      brand_name: settings.brand_name,
      brand_color: settings.brand_color,
      brand_logo_url: typeof logo === "string" && logo ? logo : null,
      brand_logo_opacity: surfaces.home.opacity,
      brand_logo_glow: surfaces.home.glow,
      brand_logo_glow_color: surfaces.home.glowColor,
      brand_logo_glow_spread: surfaces.home.glowSpread,
      brand_logo_scale_menu: surfaces.menu.scale,
      brand_logo_scale_home: surfaces.home.scale,
      brand_logo_scale_footer: surfaces.footer.scale,
      constellation_variant: resolveConstellationVariant(settingsRec.constellation_variant),
      constellation_density: num(settingsRec.constellation_density, SKY_DENSITY_DEFAULT),
      constellation_zoom: clampSkyZoom(settingsRec.constellation_zoom ?? SKY_STARS_ZOOM_DEFAULT),
      constellation_effects: resolveSkyEffects(settingsRec.constellation_effects),
      brand_logo_surfaces: surfaces,
      demo_mode: fixture.demo_mode !== false,
      maintenance_mode: fixture.maintenance_mode === true,
      public_login_enabled: fixture.public_login_enabled !== false,
      glossary_in_menu: flags.glossary_in_menu,
      org_board_enabled: flags.org_board_enabled,
      public_menu_order,
      public_menu_enabled,
    };
  } catch {
    // Branding must never take the app down - fall back to static defaults.
    return {
      brand_name: theme.brand.name,
      brand_color: theme.colors.brand,
      brand_logo_url: null,
      brand_logo_opacity: 1,
      brand_logo_glow: 0,
      brand_logo_glow_color: "#ffffff",
      brand_logo_glow_spread: 0.5,
      brand_logo_scale_menu: 1,
      brand_logo_scale_home: 1,
      brand_logo_scale_footer: 1,
      constellation_variant: SKY_VARIANT_DEFAULT,
      constellation_density: SKY_DENSITY_DEFAULT,
      constellation_zoom: SKY_STARS_ZOOM_DEFAULT,
      constellation_effects: resolveSkyEffects({}),
      brand_logo_surfaces: resolveLogoSurfaces({}),
      demo_mode: true,
      maintenance_mode: false,
      public_login_enabled: true,
      glossary_in_menu: true,
      org_board_enabled: true,
      public_menu_order: defaultPublicNavHrefs(),
      public_menu_enabled: defaultPublicNavHrefs(),
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const site = await loadBrand();
  const brand = {
    brand_name: site.brand_name,
    brand_color: site.brand_color,
    brand_logo_url: site.brand_logo_url,
    brand_logo_opacity: site.brand_logo_opacity,
    brand_logo_glow: site.brand_logo_glow,
    brand_logo_glow_color: site.brand_logo_glow_color,
    brand_logo_glow_spread: site.brand_logo_glow_spread,
    brand_logo_scale_menu: site.brand_logo_scale_menu,
    brand_logo_scale_home: site.brand_logo_scale_home,
    brand_logo_scale_footer: site.brand_logo_scale_footer,
    constellation_variant: site.constellation_variant,
    constellation_density: site.constellation_density,
    constellation_zoom: site.constellation_zoom,
    constellation_effects: site.constellation_effects,
    brand_logo_surfaces: site.brand_logo_surfaces,
  };
  const mode = {
    demo_mode: site.demo_mode,
    maintenance_mode: site.maintenance_mode,
    public_login_enabled: site.public_login_enabled,
    glossary_in_menu: site.glossary_in_menu,
    org_board_enabled: site.org_board_enabled,
    public_menu_order: site.public_menu_order,
    public_menu_enabled: site.public_menu_enabled,
  };
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>
          <BrandProvider brand={brand}>
            <SiteModeProvider mode={mode}>
              <TooltipProvider>{children}</TooltipProvider>
            </SiteModeProvider>
          </BrandProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
