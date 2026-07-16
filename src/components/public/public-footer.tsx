import Link from "next/link";
import type { BusinessProfile } from "@/lib/data";

export function PublicFooter({ business }: { business: BusinessProfile }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold">{business.name}</h3>
            <p className="text-sm text-muted-foreground">{business.slogan}</p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Explore</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/#services" className="hover:text-foreground">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/#products" className="hover:text-foreground">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/#staff" className="hover:text-foreground">
                  People
                </Link>
              </li>
              <li>
                <Link href="/#about" className="hover:text-foreground">
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
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
              <li>{business.address}</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">
            © {year} {business.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
