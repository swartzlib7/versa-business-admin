"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, Moon, Compass, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BrandMark, useBrand } from "@/components/shell/brand-provider";
import { useUiTheme, type UiTheme } from "@/components/shell/theme-provider";
import { useSiteMode } from "@/components/shell/site-mode-provider";
import { visiblePublicNavItems } from "@/lib/nav";

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

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const brand = useBrand();
  const { theme, cyclePublicTheme, ensurePublicTheme } = useUiTheme();
  const { demo_mode, public_login_enabled, public_menu_enabled, public_menu_order } = useSiteMode();
  const navLinks = visiblePublicNavItems({
    demo: demo_mode,
    enabled: public_menu_enabled,
    order: public_menu_order,
  });

  useEffect(() => {
    ensurePublicTheme();
  }, [ensurePublicTheme]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2">
          <BrandMark />
          <span className="truncate whitespace-nowrap text-lg font-semibold tracking-tight">
            {brand.brand_name}
          </span>
        </Link>

        <nav className="hidden min-w-0 items-center gap-3 xl:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shrink-0 whitespace-nowrap text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={cyclePublicTheme}
            className="shrink-0 gap-1.5"
            title={`Theme: ${themeLabel(theme)} (click to cycle)`}
          >
            <ThemeIcon theme={theme} />
            <span className="hidden 2xl:inline">{themeLabel(theme)}</span>
          </Button>
          {public_login_enabled ? (
            <Link href="/login" className={cn(buttonVariants({ size: "sm" }), "shrink-0 whitespace-nowrap")}>
              Sign In
            </Link>
          ) : null}
        </nav>

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

      {open && (
        <nav className="border-t border-border bg-background xl:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 sm:px-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
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
