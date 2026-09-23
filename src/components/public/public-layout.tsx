import { PublicHeader } from "./public-header";
import { PublicFooter } from "./public-footer";
import { PublicSnapScroll } from "./public-snap-scroll";
import type { BusinessProfile } from "@/lib/data";

export function PublicLayout({
  business,
  demo = true,
  children,
}: {
  business: BusinessProfile;
  demo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-transparent">
      <div className="relative z-10 flex min-h-screen flex-col">
        <PublicHeader />
        <main className="flex-1 bg-transparent">
          {children}
          <PublicSnapScroll />
        </main>
        <PublicFooter business={business} demo={demo} />
      </div>
    </div>
  );
}
