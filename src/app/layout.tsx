import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/shell/theme-provider";
import { BrandProvider } from "@/components/shell/brand-provider";
import { getSiteSettingsDb } from "@/lib/db/settings-store";
import { getSiteSettingsFixture } from "@/lib/fixtures/site-settings";
import { theme } from "@/lib/theme";
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

const themeInitScript = `(function(){try{var t=localStorage.getItem('versa-ui-theme');if(t!=='light'&&t!=='dark'&&t!=='architect'&&t!=='slate')t='dark';var r=document.documentElement;r.classList.remove('dark','architect','slate');if(t==='dark')r.classList.add('dark');if(t==='architect')r.classList.add('architect');if(t==='slate')r.classList.add('slate');r.dataset.theme=t;}catch(e){}})();`;

async function loadBrand() {
  try {
    return (process.env.DATA_SOURCE ?? "fixture") === "postgres"
      ? await getSiteSettingsDb()
      : getSiteSettingsFixture();
  } catch {
    // Branding must never take the app down - fall back to static defaults.
    return {
      brand_name: theme.brand.name,
      brand_color: theme.colors.brand,
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const brand = await loadBrand();
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
            <TooltipProvider>{children}</TooltipProvider>
          </BrandProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
