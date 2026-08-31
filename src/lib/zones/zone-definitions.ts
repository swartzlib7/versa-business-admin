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
 *  Collab Vendor: self + Integrations (parent self-tab via ZoneConfigView)
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
      summary: "Business executive function — default executive data, plus policy, projects, and tasks.",
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
          label: "Policy",
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
      label: "Public",
      summary: "Public-facing faculty - Configuration. Named record tabs come from Settings - Records Editor.",
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
      children: [],
    },
    {
      id: "communications",
      label: "Communications",
      summary: "Internal and external communications - Configuration. Named record tabs come from Records Editor.",
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
      children: [],
    },
    {
      id: "dissemination",
      label: "Dissemination",
      summary: "Outbound distribution and publishing - Configuration. Named record tabs come from Records Editor.",
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
      children: [],
    },
    {
      id: "treasury",
      label: "Treasury",
      summary: "Cash, billing, AR/AP - Configuration. Named record tabs come from Records Editor.",
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
      children: [],
    },
    {
      id: "production",
      label: "Production",
      summary:
        "Making and delivering work product — Configuration (like Executive), not a production records list. Owns Product and Service.",
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
          label: "Product",
          summary:
            "Device, manufactured item, or computer file — operating nucleus. Owned by Production (moved from Environment).",
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
          label: "Service",
          summary: "Faculty for results — e.g. Analysis & Design. Nested under Production (I5.6.6).",
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
        "Quality, compliance, and qualification - Configuration. Named record tabs come from Records Editor.",
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
      children: [],
    },
  ],
};

export const collaborationZone: ZoneConfig = {
  id: "collaboration",
  title: "Collaboration",
  subtitle:
    "Parties the organization works with. Listing tables + collapsible New forms. Integrations nest under Vendor.",
  accent: collabAccent,
  accentSoft: soft(collabAccent),
  tabs: [
    {
      id: "vendor",
      label: "Vendor",
      summary: "Service provider — external supplier. Integrations nest here (I5.6.6).",
      presentation: "listing",
      listColumns: ["Legal name", "Category", "Status"],
      sampleRows: [
        ["Cloudflare", "Cloud / CDN", "connected"],
        ["AWS", "Cloud / infra", "active"],
        ["Local print shop", "Materials", "standby"],
      ],
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
      ],
    },
    {
      id: "customer",
      label: "Customer",
      summary: "Person or business that receives products or services.",
      presentation: "listing",
      listColumns: ["Name", "Kind", "Tier"],
      sampleRows: [
        ["Acme Ltd", "business", "priority"],
        ["Jordan Lee", "person", "standard"],
      ],
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
      summary: "Business or investor in a collaborative relationship.",
      presentation: "listing",
      listColumns: ["Name", "Kind"],
      sampleRows: [
        ["Northwind Ventures", "investor"],
        ["Regional Chamber", "association"],
      ],
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
      summary: "Subsidiary — subordinate operating unit of the organization.",
      presentation: "listing",
      listColumns: ["Branch name", "Code"],
      sampleRows: [
        ["Southeast hub", "BR-SE"],
        ["Remote ops", "BR-RMT"],
      ],
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
      label: "Locations",
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
      label: "Events",
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
      label: "Schedules",
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
