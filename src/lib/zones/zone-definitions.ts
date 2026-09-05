import type { ZoneConfig } from "@/components/zones/zone-config-view";
import { getValueSetByApiName, listValueSetItems } from "@/lib/fixtures/catalog";
import { theme } from "@/lib/theme";

const orgAccent = theme.scene.executiveColor ?? "#ef4444";
const collabAccent = theme.scene.collaborationColor ?? "#22c55e";
const envAccent = theme.scene.environmentalColor ?? "#f97316";


function getVsOptions(apiName: string): string[] {
  const vs = getValueSetByApiName(apiName);
  if (!vs) return [];
  return listValueSetItems(vs.id).map(i => i.api_value);
}

function soft(hex: string, alpha = "22") {
  if (hex.startsWith("#") && hex.length === 7) return hex + alpha;
  return hex;
}

/** I5.6.6 + I5.6 board (2026-07-21/22) + I5.6.32 IA per Stephen:
 *  Org spheres: Executive (center), Public (+y), Communications, Dissemination,
 *    Treasury, Production, Qualification. Service+Product are NOT hub spheres.
 *  Org Executive: Configuration (form) + Policy, Projects, Tasks lists (first-class objects)
 *  Org Production: Configuration (form, NOT production listing) + Product + Service lists
 *  Org Public / Communications / Dissemination / Treasury / Qualification: Configuration (named record tabs via Records Editor only)
 *  Main nav: no duplicate Projects/Tasks/Products (zone-owned). Dynamic record_types: see I5_6_32 plan.
 *  Org Public: top-of-sphere faculty (distinct from Collaboration Customer)
 *  Env: no Product tab
 *  Collab Vendor: self + Credentials, Integrations, Exchange (record types)
 *  Object Labels: every faculty/object exposes Name (proper name = Name).
 */
export const organizationZone: ZoneConfig = {
  id: "organization",
  title: "Organization",
  subtitle:
    "Internal faculties. Executive center sphere. Public top. Production owns Product/Service (not hub spheres).",
  accent: orgAccent,
  accentSoft: soft(orgAccent),
  tabs: [
    {
      id: "executive",
      label: "Executive",
      summary: "Coordinates and supervises the organization's activities so it runs smoothly, produces its products viably and delivers its products and services in high quality.",
      fields: [
        { label: "Name", placeholder: "Executive" },
        { label: "Lead", placeholder: "Name or user" },
        {
          label: "Status",
          placeholder: "Select status",
          kind: "select",
          options: getVsOptions("faculty_status"),
        },
        { label: "Mandate", placeholder: "Short charter...", kind: "textarea" },
      ],
      relations: [
        { zone: "Collaboration", label: "Key accounts", hint: "Priority customers and partners." },
        { zone: "Environment", label: "Strategy knowledge", hint: "Board packs and research." },
      ],
      children: [
        {
          id: "policy",
          label: "Policies",
          summary: "Governing policies and executive directives for the organization.",
          presentation: "listing",
          listColumns: ["Policy title", "Scope", "Owner"],
          fields: [
            { label: "Policy title", placeholder: "Operating policy name" },
            {
              label: "Scope",
              placeholder: "Select scope",
              kind: "select",
              options: getVsOptions("policy_scope"),
            },
            { label: "Owner", placeholder: "Executive lead" },
            { label: "Summary", placeholder: "Intent and rules...", kind: "textarea" },
          ],
          relations: [
            { zone: "Environment", label: "Knowledge assets", hint: "Published policy documents." },
            { zone: "Organization", label: "Owning faculty", hint: "Usually Executive." },
          ],
        },
        {
          id: "projects",
          label: "Projects",
          summary: "Strategic and delivery projects owned by Executive.",
          presentation: "listing",
          listColumns: ["Project name", "Status", "Owner"],
          fields: [
            { label: "Project name", placeholder: "Mission Control beta" },
            {
              label: "Status",
              placeholder: "Select status",
              kind: "select",
              options: getVsOptions("zone_project_status"),
            },
            { label: "Owner", placeholder: "Project lead" },
            { label: "Description", placeholder: "...", kind: "textarea" },
          ],
          relations: [
            { zone: "Organization", label: "Tasks", hint: "Work breakdown under this project." },
            { zone: "Collaboration", label: "External parties", hint: "Customers or partners involved." },
          ],
        },
        {
          id: "tasks",
          label: "Tasks",
          summary: "Executable work items under Executive projects.",
          presentation: "listing",
          listColumns: ["Task title", "Status", "Assignee"],
          fields: [
            { label: "Task title", placeholder: "Ship I5.6.6" },
            {
              label: "Status",
              placeholder: "Select status",
              kind: "select",
              options: getVsOptions("zone_task_status"),
            },
            { label: "Assignee", placeholder: "Person or agent" },
            { label: "Notes", placeholder: "...", kind: "textarea" },
          ],
          relations: [
            { zone: "Organization", label: "Parent project", hint: "Project this task belongs to." },
            { zone: "Environment", label: "Schedule", hint: "When the task is due." },
          ],
        },
      ],
    },
    {
      id: "public",
      // Rev D (2026-08-31): Public renamed to Distribution - centralized
      // contacts; staff-type contacts belong to an organization, public-type
      // do not. Tab id stays "public" (api_name namespace stability, C8).
      label: "Distribution",
      summary: "Through all of its activities, brings knowledge of and distributes the organization's services and products to the broad public.",
      // I5.6 board 2026-07-22: Configuration form + list (list contents may still be TBD).
      fields: [
        { label: "Name", placeholder: "Public" },
        {
          label: "Status",
          placeholder: "Select status",
          kind: "select",
          options: getVsOptions("faculty_status"),
        },
        { label: "Mandate", placeholder: "Outward voice and brand presence...", kind: "textarea" },
      ],
      relations: [
        { zone: "Collaboration", label: "Audience parties", hint: "Customers and partners who see the public face." },
        { zone: "Environment", label: "Public knowledge", hint: "Published materials and brand assets." },
      ],

      children: [
        {
          id: "contacts",
          label: "Contacts",
          summary: "Contact records centralized under Distribution; staff-type contacts belong to an organization, public-type do not.",
          presentation: "listing",
          listColumns: ["Contact name", "Contact kind", "Email"],
          fields: [
            { label: "Contact name", placeholder: "Full name" },
            { label: "Contact kind", placeholder: "Staff or public", kind: "select", options: getVsOptions("contact_kind") },
            { label: "Email", placeholder: "name@example.com" },
            { label: "Phone", placeholder: "+1 555 000 0000" },
            { label: "Organization", placeholder: "Organization for staff-type contacts" },
            { label: "Notes", placeholder: "...", kind: "textarea" },
          ],
          relations: [
            { zone: "Organization", label: "Divisions", hint: "Staff-type contacts belong to an organization." },
            { zone: "Collaboration", label: "Parties", hint: "Public-type contacts stand alone." },
          ],
        },
      ],
    },
    {
      id: "communications",
      label: "Communications",
      summary: "Is fully responsible for the establishment of the organization.",
      // I5.6 board 2026-07-22: Configuration form + list (list contents may still be TBD).
      fields: [
        { label: "Name", placeholder: "Communications" },
        { label: "Channels", placeholder: "Email, voice, social..." },
        { label: "Notes", placeholder: "Operating notes...", kind: "textarea" },
      ],
      relations: [
        { zone: "Collaboration", label: "Audiences", hint: "Customers, partners, vendors as message targets." },
        { zone: "Environment", label: "Campaign knowledge", hint: "Templates and brand assets in Knowledge." },
      ],

      children: [
        {
          id: "messages",
          label: "Messages",
          summary: "Messages sent and received across channels, typed by message type.",
          presentation: "listing",
          listColumns: ["Message subject", "Message type", "Status"],
          fields: [
            { label: "Message subject", placeholder: "Subject" },
            { label: "Message type", placeholder: "Select type", kind: "select", options: getVsOptions("message_type") },
            { label: "Status", placeholder: "Select status", kind: "select", options: getVsOptions("record_status") },
            { label: "Notes", placeholder: "...", kind: "textarea" },
          ],
          relations: [
            { zone: "Collaboration", label: "Audiences", hint: "Customers, partners, vendors as message targets." },
            { zone: "Environment", label: "Campaign knowledge", hint: "Templates and brand assets in Knowledge." },
          ],
        },
        {
          id: "reports",
          label: "Reports",
          summary: "Operational and status reports produced by Communications.",
          presentation: "listing",
          listColumns: ["Report title", "Status"],
          fields: [
            { label: "Report title", placeholder: "Report name" },
            { label: "Status", placeholder: "Select status", kind: "select", options: getVsOptions("record_status") },
            { label: "Summary", placeholder: "Intent and findings...", kind: "textarea" },
            { label: "Notes", placeholder: "...", kind: "textarea" },
          ],
          relations: [
            { zone: "Organization", label: "Executive", hint: "Reporting line to the executive function." },
            { zone: "Collaboration", label: "Audiences", hint: "Report recipients among parties." },
          ],
        },
        {
          id: "staff",
          label: "Staff",
          summary: "Communications staff assignments and contacts.",
          presentation: "listing",
          listColumns: ["Staff member", "Role", "Status"],
          fields: [
            { label: "Staff member", placeholder: "Name" },
            { label: "Role", placeholder: "Role or title" },
            { label: "Status", placeholder: "Select status", kind: "select", options: getVsOptions("record_status") },
            { label: "Notes", placeholder: "...", kind: "textarea" },
          ],
          relations: [
            { zone: "Organization", label: "Distribution", hint: "Staff-type contacts centralize under Distribution." },
            { zone: "Collaboration", label: "Parties", hint: "Staff liaisons to parties." },
          ],
        },
      ],
    },
    {
      id: "dissemination",
      label: "Dissemination",
      summary: "Makes the organization's products and services widely known and demanded, creating a high volume of public obtaining them.",
      // I5.6 board 2026-07-22: Configuration form + list (list contents may still be TBD).
      fields: [
        { label: "Name", placeholder: "Dissemination" },
        { label: "Channels", placeholder: "Web, partners, retail..." },
        { label: "Notes", placeholder: "...", kind: "textarea" },
      ],
      relations: [
        { zone: "Organization", label: "Products", hint: "What Production owns is disseminated here." },
        { zone: "Collaboration", label: "Distribution partners", hint: "Partner and vendor channels." },
      ],

      children: [
        {
          id: "sales",
          label: "Sales",
          summary: "Sales materials and publications for dissemination channels.",
          presentation: "listing",
          listColumns: ["Sales item", "Status"],
          fields: [
            { label: "Sales item", placeholder: "Item name" },
            { label: "Status", placeholder: "Select status", kind: "select", options: getVsOptions("record_status") },
            { label: "Description", placeholder: "...", kind: "textarea" },
            { label: "Notes", placeholder: "...", kind: "textarea" },
          ],
          relations: [
            { zone: "Organization", label: "Products", hint: "What Production owns is disseminated here." },
            { zone: "Collaboration", label: "Distribution partners", hint: "Partner and vendor channels." },
          ],
        },
        {
          id: "promotion-marketing",
          label: "Promotion & Marketing",
          summary: "Promotion and marketing campaigns and assets (campaigns fold under this type per C7).",
          presentation: "listing",
          listColumns: ["Campaign name", "Status"],
          fields: [
            { label: "Campaign name", placeholder: "Campaign or asset name" },
            { label: "Status", placeholder: "Select status", kind: "select", options: getVsOptions("record_status") },
            { label: "Description", placeholder: "...", kind: "textarea" },
            { label: "Notes", placeholder: "...", kind: "textarea" },
          ],
          relations: [
            { zone: "Organization", label: "Products", hint: "Promoted products and services." },
            { zone: "Environment", label: "Knowledge", hint: "Brand assets and templates." },
          ],
        },
      ],
    },
    {
      id: "treasury",
      label: "Treasury",
      summary: "Handles the financial matters, assets and materiel of the organization, seeing its physical body is fully cared for and the organization remains solvent.",
      // I5.6 board 2026-07-22: Configuration form + list (list contents may still be TBD).
      fields: [
        { label: "Name", placeholder: "Treasury" },
        { label: "Focus", placeholder: "Cash, billing, AR/AP..." },
        { label: "Currency default", placeholder: "USD" },
        { label: "Notes", placeholder: "...", kind: "textarea" },
      ],
      relations: [
        { zone: "Collaboration", label: "Billing parties", hint: "Customers and vendors for AR/AP." },
        { zone: "Organization", label: "Priced offerings", hint: "Product and service rate cards under Production." },
      ],

      children: [
        {
          id: "transactions",
          label: "Transactions",
          summary: "Treasury transactions classified as income or disbursement.",
          presentation: "listing",
          listColumns: ["Transaction", "Classification", "Amount", "Status"],
          fields: [
            { label: "Transaction", placeholder: "Transaction name" },
            { label: "Classification", placeholder: "Income or disbursement", kind: "select", options: getVsOptions("treasury_transaction_classification") },
            { label: "Amount", placeholder: "0.00" },
            { label: "Status", placeholder: "Select status", kind: "select", options: getVsOptions("record_status") },
            { label: "Notes", placeholder: "...", kind: "textarea" },
          ],
          relations: [
            { zone: "Collaboration", label: "Billing parties", hint: "Customers and vendors for AR/AP." },
            { zone: "Organization", label: "Priced offerings", hint: "Product and service rate cards under Production." },
          ],
        },
        {
          id: "records-assets-materiel",
          label: "Records, Assets and Materiel",
          summary: "Records, assets and materiel entries for Treasury (single RAM type, spelling per Stephen).",
          presentation: "listing",
          listColumns: ["Item", "Status"],
          fields: [
            { label: "Item", placeholder: "Item name" },
            { label: "Status", placeholder: "Select status", kind: "select", options: getVsOptions("record_status") },
            { label: "Description", placeholder: "...", kind: "textarea" },
            { label: "Notes", placeholder: "...", kind: "textarea" },
          ],
          relations: [
            { zone: "Organization", label: "Treasury", hint: "Records, assets and materiel owned by Treasury." },
            { zone: "Environment", label: "Locations", hint: "Where assets and materiel are held." },
          ],
        },
      ],
    },
    {
      id: "production",
      label: "Production",
      summary:
        "Builds and delivers the organization's products and services.",
      // I5.6 board 2026-07-22: parent = Configuration form (not listing). Product/Service remain nested lists.
      fields: [
        { label: "Name", placeholder: "Production" },
        { label: "Lead", placeholder: "Name or user" },
        {
          label: "Status",
          placeholder: "Select status",
          kind: "select",
          options: getVsOptions("faculty_status"),
        },
        { label: "Capacity notes", placeholder: "...", kind: "textarea" },
        { label: "Mandate", placeholder: "How production is run...", kind: "textarea" },
      ],
      relations: [
        { zone: "Environment", label: "Schedules & locations", hint: "When and where production runs." },
        { zone: "Collaboration", label: "Vendors", hint: "Supply inputs from vendors." },
      ],
      children: [
        {
          id: "product",
          label: "Products",
          summary:
            "Goods the organization makes or sells — devices, manufactured items, and software.",
          presentation: "listing",
          listColumns: ["Name", "Kind"],
          fields: [
            { label: "Name", placeholder: "Versa AGi Mission Control" },
            {
              label: "Category",
              placeholder: "Select category",
              kind: "select",
              options: getVsOptions("product_category"),
            },
            { label: "Description", placeholder: "...", kind: "textarea" },
          ],
          relations: [
            { zone: "Organization", label: "Service offerings", hint: "Services that wrap or deliver this product." },
            { zone: "Collaboration", label: "Buyers & suppliers", hint: "Via org ownership — customers and vendors." },
            { zone: "Environment", label: "Knowledge", hint: "Specs and docs describing the product." },
          ],
        },
        {
          id: "service",
          label: "Services",
          summary: "Work the organization performs for others — analysis, delivery, and support offerings.",
          presentation: "listing",
          listColumns: ["Name", "Status"],
          fields: [
            { label: "Name", placeholder: "Analysis & Design" },
            {
              label: "Status",
              placeholder: "Select status",
              kind: "select",
              options: getVsOptions("service_status"),
            },
            { label: "Description", placeholder: "...", kind: "textarea" },
          ],
          relations: [
            { zone: "Organization", label: "Related products", hint: "Products this service delivers or supports." },
            { zone: "Collaboration", label: "Service customers", hint: "Who receives this service." },
            { zone: "Environment", label: "Delivery events", hint: "Engagements scheduled as Events." },
          ],
        },
      ],
    },
    {
      id: "qualification",
      label: "Qualification",
      summary:
        "Sees that every product leaving the organization has the expected level of quality.",
      // I5.6.32: Records section added; exact record-type columns still baseline placeholders.
      fields: [
        { label: "Name", placeholder: "Qualification" },
        { label: "Standards", placeholder: "ISO, internal..." },
        { label: "Notes", placeholder: "...", kind: "textarea" },
      ],
      relations: [
        { zone: "Environment", label: "Policies & knowledge", hint: "Standards documentation." },
        { zone: "Collaboration", label: "Auditors / partners", hint: "External qualification parties." },
      ],

      children: [
        {
          id: "examinations",
          label: "Examinations",
          summary: "Examinations administered by Qualifications.",
          presentation: "listing",
          listColumns: ["Examination", "Status"],
          fields: [
            { label: "Examination", placeholder: "Examination name" },
            { label: "Status", placeholder: "Select status", kind: "select", options: getVsOptions("record_status") },
            { label: "Notes", placeholder: "...", kind: "textarea" },
          ],
          relations: [
            { zone: "Organization", label: "Certifications & Awards", hint: "Pass routes to certifications and awards." },
            { zone: "Organization", label: "Reviews", hint: "Issues route to review." },
          ],
        },
        {
          id: "reviews",
          label: "Reviews",
          summary: "Reviews raised when examinations do not pass.",
          presentation: "listing",
          listColumns: ["Review", "Status"],
          fields: [
            { label: "Review", placeholder: "Review name" },
            { label: "Status", placeholder: "Select status", kind: "select", options: getVsOptions("record_status") },
            { label: "Notes", placeholder: "...", kind: "textarea" },
          ],
          relations: [
            { zone: "Organization", label: "Examinations", hint: "Review of a failed examination." },
            { zone: "Organization", label: "Certifications & Awards", hint: "Outcome after remediation." },
          ],
        },
        {
          id: "certifications-awards",
          label: "Certifications & Awards",
          summary: "Certifications and awards issued on examination pass.",
          presentation: "listing",
          listColumns: ["Certification or award", "Status"],
          fields: [
            { label: "Certification or award", placeholder: "Name" },
            { label: "Status", placeholder: "Select status", kind: "select", options: getVsOptions("record_status") },
            { label: "Notes", placeholder: "...", kind: "textarea" },
          ],
          relations: [
            { zone: "Organization", label: "Examinations", hint: "Granted on examination pass." },
            { zone: "Collaboration", label: "Parties", hint: "Awards involving external parties." },
          ],
        },
      ],
    },
  ],
};

export const collaborationZone: ZoneConfig = {
  id: "collaboration",
  title: "Collaboration",
  subtitle:
    "Parties the organization works with. Listing tables + collapsible New forms. Credentials, Integrations, and Exchange nest under Vendor.",
  accent: collabAccent,
  accentSoft: soft(collabAccent),
  tabs: [
    {
      id: "vendor",
      label: "Vendor",
      summary: "Organizations of type Vendor — external suppliers. Credentials, Integrations, and Exchange nest here.",
      presentation: "listing",
      listColumns: ["Name", "Person organization"],
      // #248 Slice D (C6): renders organizations WHERE org_type=vendor via OrgTypeListingPanel (TabPanel special-case below). sampleRows removed - the live organizations list replaces the mock.
      orgTypePanel: "vendor",
      fields: [
        { label: "Legal name", placeholder: "Vendor Co." },
        { label: "Category", placeholder: "Cloud, materials, freelancers..." },
        {
          label: "Status",
          placeholder: "Select status",
          kind: "select",
          options: getVsOptions("service_status"),
        },
        { label: "Notes", placeholder: "...", kind: "textarea" },
      ],
      relations: [
        {
          zone: "Organization",
          label: "Owning department",
          hint: "Usually Production or Treasury. Org→Vendor only — not Vendor→Customer.",
        },
      ],
      children: [
        {
          id: "credentials",
          label: "Credentials",
          summary: "Authentication material for integrations with this vendor.",
          presentation: "listing",
          listColumns: ["Name", "Auth type"],
          fields: [
            { label: "Name", placeholder: "Stripe live key" },
            {
              label: "Auth type",
              placeholder: "Select type",
              kind: "select",
              options: getVsOptions("credential_auth_type"),
            },
            { label: "Notes", placeholder: "...", kind: "textarea" },
          ],
          relations: [
            { zone: "Collaboration", label: "Vendor", hint: "Parent vendor this credential belongs to." },
          ],
        },
        {
          id: "integrations",
          label: "Integrations",
          summary:
            "Technical and commercial integrations with this vendor (moved from Product menu).",
          presentation: "listing",
          listColumns: ["Integration name", "Kind", "Status"],
          fields: [
            { label: "Integration name", placeholder: "Stripe billing" },
            {
              label: "Kind",
              placeholder: "Select kind",
              kind: "select",
              options: getVsOptions("integration_kind"),
            },
            {
              label: "Status",
              placeholder: "Select status",
              kind: "select",
              options: getVsOptions("integration_status"),
            },
            { label: "Notes", placeholder: "Endpoints, credentials owner...", kind: "textarea" },
          ],
          relations: [
            { zone: "Collaboration", label: "Vendor", hint: "Parent vendor this integration belongs to." },
            { zone: "Organization", label: "Owning faculty", hint: "Production / Treasury / Service." },
          ],
        },
        {
          id: "exchange",
          label: "Exchange",
          summary: "Inbound and outbound I/O for a vendor integration.",
          presentation: "listing",
          listColumns: ["Name", "Origin", "Status"],
          fields: [
            { label: "Name", placeholder: "Invoice sync" },
            {
              label: "Origin",
              placeholder: "Select origin",
              kind: "select",
              options: getVsOptions("exchange_origin"),
            },
            {
              label: "Status",
              placeholder: "Select status",
              kind: "select",
              options: getVsOptions("exchange_status"),
            },
            { label: "Notes", placeholder: "...", kind: "textarea" },
          ],
          relations: [
            { zone: "Collaboration", label: "Integration", hint: "Parent integration this exchange belongs to." },
          ],
        },
      ],
    },
    {
      id: "customer",
      label: "Customer",
      summary: "Organizations of type Customer — they receive products or services.",
      presentation: "listing",
      listColumns: ["Name", "Person organization"],
      // #248 Slice D (C6): renders organizations WHERE org_type=customer.
      orgTypePanel: "customer",
      fields: [
        { label: "Name", placeholder: "Acme Ltd" },
        {
          label: "Kind",
          placeholder: "Select kind",
          kind: "select",
          options: getVsOptions("customer_kind"),
        },
        { label: "Tier", placeholder: "Standard, priority..." },
        { label: "Notes", placeholder: "...", kind: "textarea" },
      ],
      relations: [
        {
          zone: "Organization",
          label: "Account owner",
          hint: "Executive or Communications ownership. No Customer↔Vendor capture.",
        },
      ],
    },
    {
      id: "partner",
      label: "Partner",
      summary: "Organizations of type Partner — collaborative relationships and investors.",
      presentation: "listing",
      listColumns: ["Name", "Person organization"],
      // #248 Slice D (C6): renders organizations WHERE org_type=partner.
      orgTypePanel: "partner",
      fields: [
        { label: "Name", placeholder: "Partner name" },
        {
          label: "Kind",
          placeholder: "Select kind",
          kind: "select",
          options: getVsOptions("partner_kind"),
        },
        { label: "Notes", placeholder: "...", kind: "textarea" },
      ],
      relations: [
        {
          zone: "Organization",
          label: "Partnership owner",
          hint: "Executive sponsorship. No Partner↔other collab edges.",
        },
      ],
    },
    {
      id: "branch",
      label: "Branch",
      summary: "Organizations of type Branch — children of the default organization.",
      presentation: "listing",
      listColumns: ["Name", "Person organization"],
      // #248 Slice D (C6): renders organizations WHERE org_type=branch, filtered to parent_organization_id = user default organization.
      orgTypePanel: "branch",
      fields: [
        { label: "Branch name", placeholder: "Region / unit" },
        { label: "Code", placeholder: "BR-01" },
        { label: "Notes", placeholder: "...", kind: "textarea" },
      ],
      relations: [
        {
          zone: "Organization",
          label: "Parent organization",
          hint: "Subsidiary_of — org has branch; no Branch↔Customer/Vendor/Partner.",
        },
      ],
    },
  ],
};

export const environmentZone: ZoneConfig = {
  id: "environment",
  title: "Environment",
  subtitle:
    "Context of work - places, time, and knowledge. Listing pattern throughout. Product lives under Organization / Production.",
  accent: envAccent,
  accentSoft: soft(envAccent),
  tabs: [
    {
      id: "locations",
      label: "Location",
      summary: "Global address book of business locations and places.",
      presentation: "listing",
      listColumns: ["Label", "Address", "Country"],
      sampleRows: [
        ["HQ Tampa", "100 Main St, Tampa", "US"],
        ["Warehouse A", "40 Industrial Blvd", "US"],
        ["Client site - Miami", "On-site", "US"],
      ],
      fields: [
        { label: "Label", placeholder: "HQ, Warehouse..." },
        { label: "Address", placeholder: "Street, city, region" },
        { label: "Country", placeholder: "US" },
        { label: "Notes", placeholder: "...", kind: "textarea" },
      ],
      relations: [
        { zone: "Environment", label: "Events", hint: "Events that occur at this location." },
        { zone: "Environment", label: "Knowledge", hint: "Knowledge gained or held at this location." },
        { zone: "Environment", label: "Schedules", hint: "Schedules tied to this location." },
        { zone: "Organization", label: "Responsible dept", hint: "Production or Executive ownership." },
      ],
    },
    {
      id: "events",
      label: "Event",
      summary: "Planned activity — future or past.",
      presentation: "listing",
      listColumns: ["Title", "Kind"],
      sampleRows: [
        ["Beta launch review", "meeting"],
        ["Customer onboarding", "launch"],
      ],
      fields: [
        { label: "Title", placeholder: "Launch workshop" },
        {
          label: "Kind",
          placeholder: "Select kind",
          kind: "select",
          options: getVsOptions("event_kind"),
        },
        { label: "Description", placeholder: "...", kind: "textarea" },
      ],
      relations: [
        { zone: "Environment", label: "Schedule", hint: "When this event runs." },
        { zone: "Environment", label: "Knowledge", hint: "Knowledge attached to this event." },
        { zone: "Environment", label: "Location", hint: "Where the event occurs." },
        { zone: "Organization", label: "Owning dept", hint: "Who runs the event." },
      ],
    },
    {
      id: "knowledge",
      label: "Knowledge",
      summary: "Documents, recordings, photos, policies, research.",
      presentation: "listing",
      listColumns: ["Title", "Asset type"],
      sampleRows: [
        ["Zone ERD I5.6", "document"],
        ["Onboarding handbook", "policy"],
      ],
      fields: [
        { label: "Title", placeholder: "Policy name" },
        {
          label: "Asset type",
          placeholder: "Select type",
          kind: "select",
          options: getVsOptions("knowledge_kind"),
        },
        { label: "Summary", placeholder: "...", kind: "textarea" },
      ],
      relations: [
        { zone: "Environment", label: "Event", hint: "Events this knowledge relates to." },
        { zone: "Environment", label: "Location", hint: "Where knowledge is gained or stored." },
        { zone: "Environment", label: "Schedule", hint: "When knowledge is acquired." },
        { zone: "Organization", label: "Owning department", hint: "Who maintains this asset." },
      ],
    },
    {
      id: "schedules",
      label: "Schedule",
      summary: "When an event, activity, or task occurs.",
      presentation: "listing",
      listColumns: ["Label", "Timezone"],
      sampleRows: [
        ["Weekly ops sync", "America/New_York"],
        ["Nightly backup window", "America/New_York"],
      ],
      fields: [
        { label: "Label", placeholder: "Q3 sprint cadence" },
        { label: "Timezone", placeholder: "America/New_York" },
        { label: "Notes", placeholder: "...", kind: "textarea" },
      ],
      relations: [
        { zone: "Environment", label: "Events", hint: "Events on this schedule." },
        { zone: "Environment", label: "Locations", hint: "Places this schedule applies to." },
        { zone: "Environment", label: "Knowledge", hint: "Knowledge acquired on this schedule." },
        { zone: "Organization", label: "Linked tasks", hint: "Executive project tasks." },
      ],
    },
  ],
};

/** Sidebar menu page — not an Environment zone tab. Record type stays parented on `stats`. */
export const statsZone: ZoneConfig = {
  id: "stats",
  title: "Statistics",
  subtitle:
    "Public metrics shown on the visitor site. Each record can carry a card value and a series for the graph.",
  accent: envAccent,
  accentSoft: soft(envAccent),
  tabs: [
    {
      id: "stats",
      label: "Stats",
      summary: "Public metrics shown on the visitor site. Each record can carry a card value and a series for the graph.",
      presentation: "listing",
      listColumns: ["Name", "Value", "Scale"],
      sampleRows: [
        ["Locations", "0", "month"],
        ["Open tasks", "0", "week"],
      ],
      fields: [
        { label: "Name", placeholder: "Locations" },
        { label: "Value", placeholder: "12" },
        { label: "Unit", placeholder: "optional" },
        { label: "Category", placeholder: "Environment" },
        {
          label: "Scale",
          placeholder: "Select scale",
          kind: "select",
          options: getVsOptions("stat_scale"),
        },
        { label: "Series", placeholder: "[1,2,3]", kind: "textarea" },
      ],
      relations: [
        { zone: "Environment", label: "Locations", hint: "Counts that land in this stat." },
        { zone: "Environment", label: "Knowledge", hint: "Knowledge assets counted here." },
      ],
    },
  ],
};
