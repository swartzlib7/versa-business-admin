import type { ZoneConfig } from "@/components/zones/zone-config-view";
import { theme } from "@/lib/theme";

const orgAccent = theme.scene.executiveColor ?? "#ef4444";
const collabAccent = theme.scene.collaborationColor ?? "#22c55e";
const envAccent = theme.scene.environmentalColor ?? "#f97316";

function soft(hex: string, alpha = "22") {
  if (hex.startsWith("#") && hex.length === 7) return hex + alpha;
  return hex;
}

/** I5.6.6 — IA restructure per Stephen:
 *  Org Executive: self + Policy, Projects, Tasks
 *  Org Production: self + Product + Service
 *  Env: no Product tab
 *  Collab Vendor: self + Integrations (parent self-tab via ZoneConfigView)
 */
export const organizationZone: ZoneConfig = {
  id: "organization",
  title: "Organization",
  subtitle:
    "Internal faculties. Executive (self + Policy/Projects/Tasks). Production (self + Product/Service).",
  accent: orgAccent,
  accentSoft: soft(orgAccent),
  tabs: [
    {
      id: "executive",
      label: "Executive",
      summary: "Business executive function — default executive data, plus policy, projects, and tasks.",
      fields: [
        { label: "Display name", placeholder: "Executive" },
        { label: "Lead", placeholder: "Name or user" },
        {
          label: "Status",
          placeholder: "Select status",
          kind: "select",
          options: ["active", "standby", "connected"],
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
          fields: [
            { label: "Policy title", placeholder: "Operating policy name" },
            {
              label: "Scope",
              placeholder: "Select scope",
              kind: "select",
              options: ["organization", "department", "product", "compliance"],
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
          fields: [
            { label: "Project name", placeholder: "Mission Control beta" },
            {
              label: "Status",
              placeholder: "Select status",
              kind: "select",
              options: ["planned", "active", "blocked", "done"],
            },
            { label: "Owner", placeholder: "Project lead" },
            { label: "Description", placeholder: "...", kind: "textarea" },
          ],
          relations: [
            { zone: "Organization", label: "Tasks", hint: "Work breakdown under this project." },
            { zone: "Collaboration", label: "External parties", hint: "Customers or partners involved." },
          ],
          links: [{ href: "/projects", label: "Projects list" }],
        },
        {
          id: "tasks",
          label: "Tasks",
          summary: "Executable work items under Executive projects.",
          fields: [
            { label: "Task title", placeholder: "Ship I5.6.6" },
            {
              label: "Status",
              placeholder: "Select status",
              kind: "select",
              options: ["todo", "in_progress", "waiting", "done"],
            },
            { label: "Assignee", placeholder: "Person or agent" },
            { label: "Notes", placeholder: "...", kind: "textarea" },
          ],
          relations: [
            { zone: "Organization", label: "Parent project", hint: "Project this task belongs to." },
            { zone: "Environment", label: "Schedule", hint: "When the task is due." },
          ],
          links: [{ href: "/tasks", label: "Tasks list" }],
        },
      ],
    },
    {
      id: "communications",
      label: "Communications",
      summary: "Internal and external messaging faculty.",
      presentation: "listing",
      listColumns: ["Display name", "Channels"],
      sampleRows: [
        ["Comms desk", "Email, voice"],
        ["Social desk", "LinkedIn, X"],
      ],
      fields: [
        { label: "Display name", placeholder: "Communications" },
        { label: "Channels", placeholder: "Email, voice, social..." },
        { label: "Notes", placeholder: "Operating notes...", kind: "textarea" },
      ],
      relations: [
        { zone: "Collaboration", label: "Audiences", hint: "Customers, partners, vendors as message targets." },
        { zone: "Environment", label: "Campaign knowledge", hint: "Templates and brand assets in Knowledge." },
      ],
    },
    {
      id: "dissemination",
      label: "Dissemination",
      summary: "Distribution of products, content, and outcomes.",
      presentation: "listing",
      listColumns: ["Display name", "Channels"],
      sampleRows: [
        ["Publishing queue", "Web, PDF"],
      ],
      fields: [
        { label: "Display name", placeholder: "Dissemination" },
        { label: "Channels", placeholder: "Web, partners, retail..." },
        { label: "Notes", placeholder: "...", kind: "textarea" },
      ],
      relations: [
        { zone: "Organization", label: "Products", hint: "What Production owns is disseminated here." },
        { zone: "Collaboration", label: "Distribution partners", hint: "Partner and vendor channels." },
      ],
    },
    {
      id: "treasury",
      label: "Treasury",
      summary: "Financial control and commercial terms.",
      presentation: "listing",
      listColumns: ["Display name", "Focus"],
      sampleRows: [
        ["Treasury", "Cash & billing"],
      ],
      fields: [
        { label: "Display name", placeholder: "Treasury" },
        { label: "Focus", placeholder: "Cash, billing, AR/AP..." },
        { label: "Currency default", placeholder: "USD" },
        { label: "Notes", placeholder: "...", kind: "textarea" },
      ],
      relations: [
        { zone: "Collaboration", label: "Billing parties", hint: "Customers and vendors for AR/AP." },
        { zone: "Organization", label: "Priced offerings", hint: "Product and service rate cards under Production." },
      ],
    },
    {
      id: "production",
      label: "Production",
      summary: "Making and delivering work product — owns Product and Service.",
      presentation: "listing",
      listColumns: ["Display name", "Capacity notes"],
      sampleRows: [
        ["Production", "Beta capacity reserved"],
      ],
      fields: [
        { label: "Display name", placeholder: "Production" },
        { label: "Capacity notes", placeholder: "...", kind: "textarea" },
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
          listColumns: ["Product name", "Kind"],
          sampleRows: [
            ["Versa AGi Mission Control", "software"],
            ["Trophy SKU-12", "manufactured"],
          ],
          fields: [
            { label: "Product name", placeholder: "Versa AGi Mission Control" },
            {
              label: "Kind",
              placeholder: "Select kind",
              kind: "select",
              options: ["device", "manufactured", "software", "file"],
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
          listColumns: ["Service name", "Status"],
          sampleRows: [
            ["Analysis & Design", "connected"],
            ["Managed ops", "active"],
          ],
          fields: [
            { label: "Service name", placeholder: "Analysis & Design" },
            {
              label: "Status",
              placeholder: "Select status",
              kind: "select",
              options: ["connected", "active", "standby"],
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
      summary: "Quality, compliance, and qualification processes.",
      presentation: "listing",
      listColumns: ["Display name", "Standards"],
      sampleRows: [
        ["Qualification", "ISO internal"],
      ],
      fields: [
        { label: "Display name", placeholder: "Qualification" },
        { label: "Standards", placeholder: "ISO, internal..." },
        { label: "Notes", placeholder: "...", kind: "textarea" },
      ],
      relations: [
        { zone: "Environment", label: "Policies & knowledge", hint: "Standards documentation." },
        { zone: "Collaboration", label: "Auditors / partners", hint: "External qualification parties." },
      ],
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
          options: ["connected", "active", "standby"],
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
          sampleRows: [
            ["Stripe billing", "api", "connected"],
            ["ShipStation", "webhook", "active"],
            ["Nightly SFTP export", "sftp", "standby"],
          ],
          fields: [
            { label: "Integration name", placeholder: "Stripe billing" },
            {
              label: "Kind",
              placeholder: "Select kind",
              kind: "select",
              options: ["api", "webhook", "sftp", "manual", "other"],
            },
            {
              label: "Status",
              placeholder: "Select status",
              kind: "select",
              options: ["connected", "active", "standby", "error"],
            },
            { label: "Notes", placeholder: "Endpoints, credentials owner...", kind: "textarea" },
          ],
          relations: [
            { zone: "Collaboration", label: "Vendor", hint: "Parent vendor this integration belongs to." },
            { zone: "Organization", label: "Owning faculty", hint: "Production / Treasury / Service." },
          ],
          links: [{ href: "/integrations", label: "Integrations list" }],
        },
      ],
    },
    {
      id: "customer",
      label: "Customer",
      summary: "Person or business that receives products or services.",
      presentation: "listing",
      listColumns: ["Display name", "Kind", "Tier"],
      sampleRows: [
        ["Acme Ltd", "business", "priority"],
        ["Jordan Lee", "person", "standard"],
      ],
      fields: [
        { label: "Display name", placeholder: "Acme Ltd" },
        {
          label: "Kind",
          placeholder: "Select kind",
          kind: "select",
          options: ["person", "business"],
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
          options: ["business", "investor", "association"],
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
          options: ["meeting", "launch", "maintenance", "other"],
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
          options: ["document", "recording", "photo", "policy", "research"],
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
