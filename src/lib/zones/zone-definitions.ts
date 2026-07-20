import type { ZoneConfig } from "@/components/zones/zone-config-view";
import { theme } from "@/lib/theme";

const orgAccent = theme.scene.executiveColor ?? "#ef4444";
const collabAccent = theme.scene.collaborationColor ?? "#22c55e";
const envAccent = theme.scene.environmentalColor ?? "#f97316";

function soft(hex: string, alpha = "22") {
  if (hex.startsWith("#") && hex.length === 7) return hex + alpha;
  return hex;
}

export const organizationZone: ZoneConfig = {
  id: "organization",
  title: "Organization",
  subtitle:
    "Configure internal departments and service faculty. Projects and tasks hang under Executive.",
  accent: orgAccent,
  accentSoft: soft(orgAccent),
  tabs: [
    {
      id: "executive",
      label: "Executive",
      summary: "Business executive function — owns projects and strategic direction.",
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
        { zone: "Organization", label: "Projects & tasks", hint: "Existing /projects and /tasks routes map here." },
        { zone: "Collaboration", label: "Key accounts", hint: "Link priority customers and partners." },
        { zone: "Environment", label: "Strategy knowledge", hint: "Attach policies and board packs from Knowledge." },
      ],
    },
    {
      id: "communications",
      label: "Communications",
      summary: "Internal and external messaging faculty.",
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
      fields: [
        { label: "Display name", placeholder: "Dissemination" },
        { label: "Primary channels", placeholder: "Web, partners, retail..." },
        { label: "Notes", placeholder: "...", kind: "textarea" },
      ],
      relations: [
        { zone: "Environment", label: "Products", hint: "What is being disseminated." },
        { zone: "Collaboration", label: "Distribution partners", hint: "Partner and vendor channels." },
      ],
    },
    {
      id: "treasury",
      label: "Treasury",
      summary: "Financial control and commercial terms.",
      fields: [
        { label: "Display name", placeholder: "Treasury" },
        { label: "Currency default", placeholder: "USD" },
        { label: "Notes", placeholder: "...", kind: "textarea" },
      ],
      relations: [
        { zone: "Collaboration", label: "Billing parties", hint: "Customers and vendors for AR/AP." },
        { zone: "Environment", label: "Priced offerings", hint: "Products and services rate cards." },
      ],
    },
    {
      id: "production",
      label: "Production",
      summary: "Making and delivering work product.",
      fields: [
        { label: "Display name", placeholder: "Production" },
        { label: "Capacity notes", placeholder: "...", kind: "textarea" },
      ],
      relations: [
        { zone: "Environment", label: "Schedules & locations", hint: "When and where production runs." },
        { zone: "Collaboration", label: "Vendors", hint: "Supply inputs from vendors." },
      ],
    },
    {
      id: "qualification",
      label: "Qualification",
      summary: "Quality, compliance, and qualification processes.",
      fields: [
        { label: "Display name", placeholder: "Qualification" },
        { label: "Standards", placeholder: "ISO, internal..." },
        { label: "Notes", placeholder: "...", kind: "textarea" },
      ],
      relations: [
        { zone: "Environment", label: "Policies", hint: "Knowledge assets for standards." },
        { zone: "Collaboration", label: "Auditors / partners", hint: "External qualification parties." },
      ],
    },
    {
      id: "service",
      label: "Service",
      summary: "Faculty for results — e.g. Analysis & Design services.",
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
        { zone: "Collaboration", label: "Service customers", hint: "Who receives this service." },
        { zone: "Environment", label: "Delivery events", hint: "Engagements scheduled as Events." },
      ],
    },
  ],
};

export const collaborationZone: ZoneConfig = {
  id: "collaboration",
  title: "Collaboration",
  subtitle: "Parties the organization works with — vendors, customers, partners, and branches.",
  accent: collabAccent,
  accentSoft: soft(collabAccent),
  tabs: [
    {
      id: "vendor",
      label: "Vendor",
      summary: "Service provider — external supplier of goods or services.",
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
        // I5.6.4: no collab↔collab edges; org owns the party link (env product optional later via org)
        { zone: "Organization", label: "Owning department", hint: "Usually Production or Treasury. Org→Vendor only — not Vendor→Customer." },
      ],
    },
    {
      id: "customer",
      label: "Customer",
      summary: "Person or business that receives products or services.",
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
        { zone: "Organization", label: "Account owner", hint: "Executive or Communications ownership. No Customer↔Vendor capture." },
      ],
    },
    {
      id: "partner",
      label: "Partner",
      summary: "Business or investor in a collaborative relationship.",
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
        { zone: "Organization", label: "Partnership owner", hint: "Executive sponsorship. No Partner↔other collab edges." },
      ],
    },
    {
      id: "branch",
      label: "Branch",
      summary: "Subsidiary — subordinate operating unit of the organization.",
      fields: [
        { label: "Branch name", placeholder: "Region / unit" },
        { label: "Code", placeholder: "BR-01" },
        { label: "Notes", placeholder: "...", kind: "textarea" },
      ],
      relations: [
        { zone: "Organization", label: "Parent organization", hint: "Subsidiary_of — org has branch; no Branch↔Customer/Vendor/Partner." },
      ],
    },
  ],
};

export const environmentZone: ZoneConfig = {
  id: "environment",
  title: "Environment",
  subtitle: "Context of work — places, time, knowledge, and offerings (product nucleus).",
  accent: envAccent,
  accentSoft: soft(envAccent),
  tabs: [
    {
      id: "locations",
      label: "Locations",
      summary: "Global address book of business locations and places.",
      fields: [
        { label: "Label", placeholder: "HQ, Warehouse..." },
        { label: "Address", placeholder: "Street, city, region" },
        { label: "Country", placeholder: "US" },
        { label: "Notes", placeholder: "...", kind: "textarea" },
      ],
      relations: [
        // I5.6.4 env full mesh: Location ↔ Event, Knowledge, Schedule
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
    {
      id: "product",
      label: "Product",
      summary: "Device, manufactured item, or computer file — operating nucleus. Integrations nest here.",
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
        { zone: "Environment", label: "Integrations", hint: "Use Product to Integrations nav; data sourced from Product." },
        { zone: "Collaboration", label: "Buyers & suppliers", hint: "Customers and vendors on this product." },
        { zone: "Organization", label: "Owning faculty", hint: "Production / Dissemination / Service." },
      ],
    },
  ],
};
