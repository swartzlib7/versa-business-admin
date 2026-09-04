import { PublicLayout } from "@/components/public/public-layout";
import { PublicGlossaryBook } from "@/components/glossary/public-surfaces";
import { getSiteSettingsFixture } from "@/lib/fixtures/site-settings";
import { adapter } from "@/lib/data";
import { normalizePublicContent } from "@/lib/public/site-content";

export const dynamic = "force-dynamic";

export default async function PublicTermsPage() {
  const site = getSiteSettingsFixture();
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
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <PublicGlossaryBook />
      </div>
    </PublicLayout>
  );
}
