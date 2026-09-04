import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/shell/theme-provider";
import { BrandProvider } from "@/components/shell/brand-provider";
import { SiteModeProvider } from "@/components/shell/site-mode-provider";
import { getSiteSettingsDb } from "@/lib/db/settings-store";
import { getBrandLogoOverlay, getSiteSettingsFixture } from "@/lib/fixtures/site-settings";
import { theme } from "@/lib/theme";
import "@/lib/catalog/install-durable";
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

async function loadBrand() {
  try {
    const settings =
      (process.env.DATA_SOURCE ?? "fixture") === "postgres"
        ? await getSiteSettingsDb()
        : getSiteSettingsFixture();
    const fromSettings =
      "brand_logo_url" in settings
        ? (settings as { brand_logo_url?: string | null }).brand_logo_url
        : undefined;
    const logo = fromSettings || getBrandLogoOverlay();
    const fixture = getSiteSettingsFixture();
    return {
      brand_name: settings.brand_name,
      brand_color: settings.brand_color,
      brand_logo_url: typeof logo === "string" && logo ? logo : null,
      demo_mode: fixture.demo_mode !== false,
      maintenance_mode: fixture.maintenance_mode === true,
      public_login_enabled: fixture.public_login_enabled !== false,
      glossary_in_menu: fixture.glossary_in_menu !== false,
      org_board_enabled: fixture.org_board_enabled !== false,
    };
  } catch {
    // Branding must never take the app down - fall back to static defaults.
    return {
      brand_name: theme.brand.name,
      brand_color: theme.colors.brand,
      brand_logo_url: null,
      demo_mode: true,
      maintenance_mode: false,
      public_login_enabled: true,
      glossary_in_menu: true,
      org_board_enabled: true,
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
  };
  const mode = {
    demo_mode: site.demo_mode,
    maintenance_mode: site.maintenance_mode,
    public_login_enabled: site.public_login_enabled,
    glossary_in_menu: site.glossary_in_menu,
    org_board_enabled: site.org_board_enabled,
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
