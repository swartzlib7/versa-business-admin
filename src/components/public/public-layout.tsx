import { PublicHeader } from "./public-header";
import { PublicFooter } from "./public-footer";
import type { BusinessProfile } from "@/lib/data";

export function PublicLayout({
  business,
  children,
}: {
  business: BusinessProfile;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader business={business} />
      <main className="flex-1">{children}</main>
      <PublicFooter business={business} />
    </div>
  );
}
