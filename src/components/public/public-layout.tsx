import { PublicHeader } from "./public-header";
import { PublicFooter } from "./public-footer";
import { PublicSnapScroll } from "./public-snap-scroll";
import type { BusinessProfile } from "@/lib/data";

export function PublicLayout({
  business,
  demo = true,
  showHeader = true,
  showFooter = true,
  maintenance = false,
  children,
}: {
  business: BusinessProfile;
  demo?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  maintenance?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-transparent">
      <div className="relative z-10 flex min-h-screen flex-col">
        {maintenance ? (
          <p className="bg-amber-500/15 px-4 py-2 text-center text-sm">
            Maintenance mode is on. Visitors see the paused page.
          </p>
        ) : null}
        {showHeader ? <PublicHeader /> : null}
        <main className="flex-1 bg-transparent">
          {children}
          <PublicSnapScroll />
        </main>
        {showFooter ? <PublicFooter business={business} demo={demo} /> : null}
      </div>
    </div>
  );
}
