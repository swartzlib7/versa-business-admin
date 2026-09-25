import { PublicLayout } from "@/components/public/public-layout";
import { PublicOrgBoard } from "@/components/glossary/public-surfaces";
import { getPublicSiteSettings } from "@/lib/fixtures/site-settings";
import { adapter } from "@/lib/data";
import { normalizePublicContent } from "@/lib/public/site-content";
import { gatePublicHref } from "@/lib/nav-server";
import { PublicMaintenance } from "@/components/public/public-maintenance";
import { signedInVisitor } from "@/lib/public/visitor-session";
import { CanvasSkyFlag } from "@/components/public/canvas-sky-flag";

export const dynamic = "force-dynamic";

export default async function PublicBoardPage() {
  gatePublicHref("/board");
  const site = await getPublicSiteSettings();
  if (site.maintenance_mode === true && !(await signedInVisitor())) {
    return <PublicMaintenance brandName={site.brand_name} />;
  }
  const pub = normalizePublicContent(site);
  const businessProfile = await adapter.getBusinessProfile();
  const business = {
    ...businessProfile,
    contactEmail: pub.contact_email,
    contactPhone: pub.contact_phone,
    address: pub.contact_address,
  };
  return (
    <PublicLayout business={business} demo={site.demo_mode !== false} maintenance={site.maintenance_mode === true}>
      <CanvasSkyFlag on={site.sky_enabled !== false} />
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-24 sm:px-6 lg:px-8">
        <PublicOrgBoard />
      </div>
    </PublicLayout>
  );
}
