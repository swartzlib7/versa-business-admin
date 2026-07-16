"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { theme } from "@/lib/theme";
import type { BusinessProfile } from "@/lib/data";

const navLinks = [
  { href: "/#services", label: "Services" },
  { href: "/#products", label: "Products" },
  { href: "/#staff", label: "People" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" },
];

export function PublicHeader({ business }: { business: BusinessProfile }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold"
            style={{
              backgroundColor: theme.colors.brand,
              color: theme.colors.brandForeground,
            }}
          >
            {business.name.charAt(0)}
          </div>
          <span className="text-lg font-semibold tracking-tight">
            {business.name}
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Sign In
          </Link>
        </nav>

        {/* Mobile menu button */}
        <Button
          variant="outline"
          size="icon"
          className="md:hidden"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span className="sr-only">Toggle menu</span>
        </Button>
      </div>

      {/* Mobile Nav */}
      {open && (
        <nav className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 sm:px-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className={cn(buttonVariants({ size: "sm" }), "mt-2")}
              onClick={() => setOpen(false)}
            >
              Sign In
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
