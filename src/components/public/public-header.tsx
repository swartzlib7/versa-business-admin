"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Moon, Compass, Cloud, ChevronDown, ChevronRight } from "lucide-react";
import { PublicBrandMusic } from "@/components/public/public-brand-music";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BrandMark, useBrand } from "@/components/shell/brand-provider";
import { useUiTheme, type UiTheme } from "@/components/shell/theme-provider";
import { useSiteMode } from "@/components/shell/site-mode-provider";
import { visiblePublicNavItems } from "@/lib/nav";
import {
  customCanvasHref,
  defaultPageBuilder,
  enabledCanvases,
  homeRowLabelMap,
  isRowOn,
  isCustomCanvasPath,
  primaryCanvasLabel,
  type CustomCanvas,
} from "@/lib/public/page-builder";

function ThemeIcon({ theme }: { theme: UiTheme }) {
  if (theme === "architect") return <Compass className="h-4 w-4" />;
  if (theme === "slate") return <Cloud className="h-4 w-4" />;
  return <Moon className="h-4 w-4" />;
}

function themeLabel(theme: UiTheme): string {
  if (theme === "architect") return "Architect";
  if (theme === "slate") return "Slate";
  return "Dark";
}

const SEEN_KEY = "vba-custom-canvas-seen";
const LAST_KEY = "vba-custom-canvas-last";

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [homeOpen, setHomeOpen] = useState(false);
  const [sawCustom, setSawCustom] = useState(false);
  const pathname = usePathname();
  const brand = useBrand();
  const { theme, cyclePublicTheme, ensurePublicTheme } = useUiTheme();
  const {
    demo_mode,
    public_login_enabled,
    public_menu_enabled,
    public_menu_order,
    page_builder,
  } = useSiteMode();
  // PB-06: every enabled custom canvas joins the sub-menu; canvases[0] keeps the v1 role.
  const homeLabel = primaryCanvasLabel(page_builder);
  const canvases: CustomCanvas[] = enabledCanvases(page_builder ?? defaultPageBuilder()).filter(
    (canvas) => canvas.menu_enabled !== false,
  );
  const homeMenu = (page_builder?.home_sections ?? []).filter(
    (section) => isRowOn(section) && section.in_menu !== false,
  );
  const customOn = canvases.length > 0;
  const currentCanvas = canvases.find((c) => isCustomCanvasPath(pathname, c)) ?? null;
  const onCustom = currentCanvas !== null;
  const [lastSlug, setLastSlug] = useState<string | null>(null);
  const subCanvas =
    currentCanvas ?? canvases.find((c) => c.slug === lastSlug) ?? null;
  const showSubMenu = customOn && subCanvas !== null && (onCustom || sawCustom);
  const navLinks = visiblePublicNavItems({
    demo: demo_mode,
    enabled: public_menu_enabled,
    order: public_menu_order,
    sectionLabels: homeRowLabelMap(page_builder?.home_sections),
  });

  useEffect(() => {
    ensurePublicTheme();
  }, [ensurePublicTheme]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SEEN_KEY) === "1") setSawCustom(true);
      setLastSlug(sessionStorage.getItem(LAST_KEY));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!currentCanvas) return;
    setSawCustom(true);
    setLastSlug(currentCanvas.slug);
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
      sessionStorage.setItem(LAST_KEY, currentCanvas.slug);
    } catch {
      /* ignore */
    }
  }, [currentCanvas]);

  const selectCustom = () => {
    setHomeOpen(false);
    setOpen(false);
    setSawCustom(true);
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const renderHomePrefix = () => (
    <span className="inline-flex items-center gap-0.5">
      <span className="font-bold" style={{ color: brand.brand_color }}>
        {homeLabel}
      </span>
      <ChevronRight
        className="h-3.5 w-3.5 shrink-0"
        strokeWidth={2.5}
        style={{ color: brand.brand_color }}
        aria-hidden
      />
    </span>
  );

  const renderCanvasLinks = () => {
    const canvas = subCanvas;
    if (!canvas) return null;
    return (
      <>
        <Link
          href={customCanvasHref(canvas)}
          className={cn(
            "font-semibold",
            isCustomCanvasPath(pathname, canvas)
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={selectCustom}
        >
          {canvas.label}
        </Link>
        {canvas.content_mode === "html"
          ? null
          : canvas.sections
              .filter((section) => isRowOn(section) && section.in_menu !== false)
              .map((section) => (
                <span key={`${canvas.slug}-${section.id}`} className="inline-flex items-center gap-x-2">
                  <span className="text-muted-foreground" aria-hidden>
                    |
                  </span>
                  <Link
                    href={`${customCanvasHref(canvas)}#${section.id}`}
                    className="text-muted-foreground hover:text-foreground"
                    onClick={selectCustom}
                  >
                    {section.label}
                  </Link>
                </span>
              ))}
      </>
    );
  };

  const renderSubMenuIdle = () => (
    <span
      className="select-none text-xs font-semibold"
      style={{ color: brand.brand_color }}
      aria-hidden
    >
      -
    </span>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="grid w-full grid-cols-[minmax(0,1fr)_0_auto] gap-x-2 px-3 sm:px-4 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] xl:gap-x-4">
        <Link
          href="/"
          className="relative z-10 col-start-1 row-start-1 flex h-16 min-w-0 max-w-full items-center gap-2 justify-self-start bg-transparent pr-2 xl:max-w-[min(22rem,28vw)]"
        >
          <BrandMark />
          {brand.brand_name_in_menu !== false ? (
            <span className="truncate whitespace-nowrap text-base font-semibold tracking-tight sm:text-lg">
              {brand.brand_name}
            </span>
          ) : (
            <span className="sr-only">{brand.brand_name}</span>
          )}
        </Link>

        <nav className="relative z-20 col-start-2 row-start-1 hidden h-16 items-center justify-center overflow-visible xl:flex">
          <div
            className="relative shrink-0"
            onMouseEnter={() => customOn && setHomeOpen(true)}
            onMouseLeave={() => setHomeOpen(false)}
          >
            <div className="inline-flex shrink-0 items-center gap-0.5">
              <Link
                href="/"
                className={cn(
                  "whitespace-nowrap text-sm font-medium transition-colors",
                  onCustom ? "text-muted-foreground hover:text-foreground" : "text-foreground",
                )}
              >
                {homeLabel}
              </Link>
              {customOn ? (
                <button
                  type="button"
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                  aria-expanded={homeOpen}
                  aria-haspopup="menu"
                  aria-label="Custom canvases"
                  onClick={() => setHomeOpen((v) => !v)}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
            {customOn && homeOpen ? (
              <div
                role="menu"
                className="absolute left-0 top-full z-[80] min-w-44 rounded-md border border-border bg-background py-1 shadow-md"
              >
                {canvases.map((canvas) => (
                  <Link
                    key={canvas.slug}
                    href={customCanvasHref(canvas)}
                    role="menuitem"
                    className="block px-3 py-2 text-sm hover:bg-muted"
                    onClick={selectCustom}
                  >
                    {canvas.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          <div className="ml-3 flex min-w-0 items-center gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {homeMenu.map((section) => (
              <Link
                key={section.id}
                href={`/#${section.id}`}
                className="inline-flex shrink-0 items-center whitespace-nowrap text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {section.label}
              </Link>
            ))}
            {navLinks.filter((link) => !link.href.startsWith("/#")).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex shrink-0 items-center whitespace-nowrap text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="relative z-10 col-start-3 row-start-1 flex h-16 items-center justify-end gap-2 justify-self-end bg-background/95 pl-2">
          <PublicBrandMusic />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={cyclePublicTheme}
            className="hidden shrink-0 gap-1.5 xl:inline-flex"
            title={`Theme: ${themeLabel(theme)} (click to cycle)`}
          >
            <ThemeIcon theme={theme} />
            <span className="hidden 2xl:inline">{themeLabel(theme)}</span>
          </Button>
          {public_login_enabled ? (
            <Link
              href="/login"
              className={cn(buttonVariants({ size: "sm" }), "hidden shrink-0 whitespace-nowrap xl:inline-flex")}
            >
              Sign In
            </Link>
          ) : null}
          <Button
            variant="outline"
            size="icon"
            className="xl:hidden"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>

        <div
          className={cn(
            "col-span-3 row-start-2 grid grid-cols-subgrid border-t border-border",
            onCustom ? "bg-background" : "bg-background/50",
          )}
        >
          <div className="hidden items-center justify-end py-2 xl:flex">
            {showSubMenu ? renderHomePrefix() : null}
          </div>
          <div
            className={cn(
              "hidden flex-wrap items-center gap-x-2 gap-y-1 py-2 text-sm xl:flex",
              showSubMenu && !onCustom && "opacity-50",
            )}
          >
            {showSubMenu ? renderCanvasLinks() : renderSubMenuIdle()}
          </div>
          <div className="hidden xl:block" />
          <div
            className={cn(
              "col-span-3 flex flex-wrap items-center gap-x-2 gap-y-1 py-2 text-sm xl:hidden",
              showSubMenu && !onCustom && "opacity-50",
            )}
          >
            {showSubMenu ? (
              <>
                {renderHomePrefix()}
                {renderCanvasLinks()}
              </>
            ) : (
              renderSubMenuIdle()
            )}
          </div>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-background xl:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 sm:px-6">
            <Link
              href="/"
              className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              {homeLabel}
            </Link>
            {canvases.map((canvas) => (
              <Link
                key={canvas.slug}
                href={customCanvasHref(canvas)}
                className="whitespace-nowrap rounded-md px-3 py-2 pl-6 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={selectCustom}
              >
                {canvas.label}
              </Link>
            ))}
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  onClick={() => setOpen(false)}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {link.label}
                </Link>
              );
            })}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={cyclePublicTheme}
              className="mt-2 justify-start gap-1.5"
            >
              <ThemeIcon theme={theme} />
              {themeLabel(theme)}
            </Button>
            {public_login_enabled ? (
              <Link
                href="/login"
                className={cn(buttonVariants({ size: "sm" }), "mt-1")}
                onClick={() => setOpen(false)}
              >
                Sign In
              </Link>
            ) : null}
          </div>
        </nav>
      )}
    </header>
  );
}
