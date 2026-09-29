import { PublicLayout } from "@/components/public/public-layout";
import { PublicGlossaryBook } from "@/components/glossary/public-surfaces";
import { getPublicSiteSettings } from "@/lib/fixtures/site-settings";
import { adapter } from "@/lib/data";
import { footerContact } from "@/lib/public/footer-location";
import { gatePublicHref } from "@/lib/nav-server";
import { PublicMaintenance } from "@/components/public/public-maintenance";
import { signedInVisitor } from "@/lib/public/visitor-session";
import { CanvasSkyFlag } from "@/components/public/canvas-sky-flag";

export const dynamic = "force-dynamic";

export default async function PublicTermsPage() {
  gatePublicHref("/terms");
  const site = await getPublicSiteSettings();
  if (site.maintenance_mode === true && !(await signedInVisitor())) {
    return <PublicMaintenance brandName={site.brand_name} />;
  }
  const foot = await footerContact();
  const businessProfile = await adapter.getBusinessProfile();
  const business = {
    ...businessProfile,
    contactEmail: foot.email,
    contactPhone: foot.phone,
    address: foot.address,
  };
  return (
    <PublicLayout business={business} demo={site.demo_mode !== false} maintenance={site.maintenance_mode === true}>
      <CanvasSkyFlag on={site.sky_enabled !== false} />
      <div className="mx-auto max-w-5xl px-4 pb-12 pt-24 sm:px-6 lg:px-8">
        <PublicGlossaryBook />
      </div>
    </PublicLayout>
  );
}
