import { PublicLayout } from "@/components/public/public-layout";
import { PublicOrgBoard } from "@/components/glossary/public-surfaces";
import { getPublicSiteSettings } from "@/lib/fixtures/site-settings";
import { adapter } from "@/lib/data";
import { normalizePublicContent } from "@/lib/public/site-content";
import { gatePublicHref } from "@/lib/nav-server";

export const dynamic = "force-dynamic";

export default async function PublicBoardPage() {
  gatePublicHref("/board");
  const site = await getPublicSiteSettings();
  const pub = normalizePublicContent(site);
  const businessProfile = await adapter.getBusinessProfile();
  const business = {
    ...businessProfile,
    contactEmail: pub.contact_email,
    contactPhone: pub.contact_phone,
    address: pub.contact_address,
  };
  return (
    <PublicLayout business={business} demo={site.demo_mode !== false}>
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-24 sm:px-6 lg:px-8">
        <PublicOrgBoard />
      </div>
    </PublicLayout>
  );
}
