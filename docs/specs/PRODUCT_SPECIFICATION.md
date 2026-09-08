# Product Specification — Versa - Business Admin

**Project:** Versa-BusinessAdmin (#26)  
**Product name:** Versa - Business Admin (VBA)  
**Phase:** Building — public + auth + users/roles + projects/tasks + I5.4 3D hub on beta; ERD keystone v1.1 locked 2026-07-18  
**Owner (distribution/architecture):** Stephen Nortje  
**Lead (planning & delivery orchestration):** Versa (COA)  
**Updated:** 2026-09-07  

**Canonical 3D / zone ERD:** `docs/production/state/state_i5_6_zone_erd.md`  
**Feature map:** `docs/production/state/shape_business_admin.md`

---

## 1. Essence

**Client admin system for a Versa AGi-powered business** — a standalone, distributable product that customers install/use with their Versa AGi system so **business staff** can run the business: public presence, people, work, organization, collaboration parties, and environmental context (locations, knowledge, products/services, schedules).

**Not agitop (AGI Top).** agitop is the operator console for *running* a Versa AGi installation (Agents, host Projects/Tasks, host Organization, system ops). This product is the **customer-facing Versa - Business Admin** — not the host infrastructure console.

It must be **generic, white-labelable, and extensible**.

Hybrid interface:
- **2D management UI** for day-to-day business surfaces.
- **3D visualization layer (R3F)** — spatial ERD of Organization / Collaboration / Environmental zones (see keystone). Not agent-fleet chrome.

### Competitive frame (Game of Life)

Registered competitors on project #26:
- **ERPNext** (Frappe) — full ERP + website + org/projects.
- **Odoo** — all-in-one ERP/CRM/CMS + knowledge modules.

**Path A (locked 2026-07-16):** We do **not** adopt those platforms. We **build** on our Next.js shell and pull OSS *components* where they save time.

---

## 1.1 Binding product boundaries

Sources: `docs/_notes/from_stephen.md` (2026-07-16) + Stephen clarifications 2026-07-18.

1. **Own data plane** — Own **database and ERD**. Not a thin skin over host Versa AGi tables.
2. **Auth** — Secure login with **RBAC**.
3. **Public website surface** — Signed-out public frontend (website aspect). Not required to be a CMS. LAN first, later HTTPS.
4. **Components** — Prefer secure, extensible pre-built components when possible. Outcomes outrank purity.
5. **Familiar business product — not an agent console**
   - Must not be confused with an agent-management system.
   - **AI Agents are only a Type of user** (`type`: `agent` | `human`). That is all.
   - **No agent-wise UI** (no Active Agents, Agent Status, fleet views). That is **strictly agitop / Versa AGi internal**.
   - Business staff man the system; agents participate when granted a credential by an administrator.
6. **Separation from host Versa AGi**
   - Projects, documents, and operational data created **inside this product** are **completely separate** from host Versa AGi.
   - Host agents that need data: product API or Versa AGi Script Task — not shared schemas/UI with agitop.
7. **agitop Organization overlap** — The only soft overlap. agitop Organization can be **turned off** when a customer uses this product’s Organization model. Migration of business data from agitop → this product is a future path (agents can help) and is **out of scope** for current build. Document in product **system information**.
8. **Clarity** — Boundaries stay explicit in design docs, system information UI copy, and agent guidance.

---

## 1.2 Capability spine — product order of truth

### A. Public-facing website (signed out)

| Area | Content |
|------|---------|
| Business information | Name, slogan, logo, description |
| Service list | Services the business offers |
| Product list | Products the business offers |
| Staff structure | People and roles (public-appropriate view) |

### B. User login

Secure authentication into the backend.

### C. Backend UI (signed in)

| Surface | Notes |
|---------|-------|
| Users | People records; `type` = human \| agent **only** agent distinction |
| Roles | RBAC roles and permissions |
| Dashboard | Business dashboard (as-is) |
| Settings | Product settings (as-is) |
| **Organization zone** | Departments as spheres (keystone): Executive, Communications, Dissemination, Treasury, Production, Qualification — further flesh-out by Stephen |
| **Projects / Tasks** | Nested under **Executive** (nav remap) — business projects/tasks, not host AGi |
| **Collaboration zone** | Vendor (Service Provider), Customer, Partner, Branch (Subsidiary) |
| **Environmental zone** | Locations (address book), Events, Knowledge, Schedules, Product, Service |
| **Integrations** | Always under **Product** (factor of a product); Integrations dashboard OK; data sourced from Product |
| Knowledgebase | Policies, processes, articles (aligns with Environmental → Knowledge; assignable as design matures) |
| System information | Product vs agitop boundary; optional note on host Organization toggle / future migration |
| 3D VBA hub | R3F spatial ERD of the three zones (keystone); lightbox expand; billboard labels |

**Legacy spine wording** “divisions → departments → sections → units” remains a possible **I7** hierarchy under Organization departments — **I7 is closed** until explicitly opened. Do not implement agitop-style agent structure under Organization.

---

## 2. Goals

1. Deliver **business mission control** — public presence + staff backend — not a host ops console.
2. Stay **generic/extensible** and **white-labelable**.
3. Keep the product **self-contained** for packaging into Versa AGi (Stephen owns distribution).
4. Prefer clean setup/purge rebuild cycles.
5. Ship along the capability spine; deepen 3D graph and zone UIs per keystone.
6. Compete on clarity vs heavy ERPs (ERPNext/Odoo).

## 3. Non-Goals (v1)

- **Not agitop replacement** — no Agents, host Projects/Tasks, or host ops as product chrome.
- **Not a full ERP** (no inventory, manufacturing, full accounting suite as core).
- Stephen owns packaging format, install path, distribution.
- No production multi-tenant SaaS in v1 (single-tenant install is fine).
- No irreversible coupling to this host’s private paths.
- **No agent-management UI** beyond user `type`.
- **No agitop → Mission Organization migration** in current scope (document only).

## 4. Technical Stack (path A — locked)

| Layer | Choice | Notes |
|-------|--------|-------|
| UI library | **React** | Primary UI foundation |
| App framework | **Next.js** | Routing, layouts, API routes |
| 3D | **React Three Fiber** | VBA spatial ERD |
| Styling / components | Tailwind CSS + shadcn/ui | White-label friendly |
| Data | **Own DB + ERD** (TBD; fixtures → real store) | Portable adapters |
| Auth / RBAC | Secure libraries (OSS) | Login + roles |
| API | First-class HTTP JSON API | UI and Versa AGi agents consume same API |
| Tests | Playwright + Vitest | QA when hired |

## 5. Product surfaces (summary)

### Public (signed out)
1. Public site shell — header, body, footer  
2. Business profile, services, products, staff  

### Auth
3. Login / session  

### Backend (signed in)
4. App shell — familiar business chrome  
5. Users / Roles  
6. Dashboard / Settings  
7. Zone-driven surfaces per keystone (Organization departments, Collaboration parties, Environmental context)  
8. Projects & Tasks under Executive  
9. Product → Integrations  
10. Knowledgebase  
11. System information (boundaries)  
12. 3D VBA viewport  

**Deprecated framing (do not reintroduce):** host agent fleet as primary nav; Games of Life as core UX; AGI Top-style system health as MVP center; Sales/Accounting/Teams rings as the conceptual ERD (I5.4 fixture is transitional until keystone build pass).

## 6. Success criteria (MVP along spine)

- [x] App boots with documented local setup  
- [x] Public site from product data  
- [x] Secure login + RBAC skeleton  
- [x] Users with `type` human \| agent  
- [x] Projects + Tasks API/UI (I6)  
- [x] I5.4 3D hub visualization on beta (transitional business-graph fixture)  
- [ ] Nav + 3D aligned to keystone v1.1 (I5.5 when opened)  
- [ ] Collaboration + Environmental entity surfaces beyond 3D labels  
- [ ] Org department flesh-out (Stephen) + optional I7 hierarchy  
- [ ] KB assignable depth  
- [ ] Own DB persistence  
- [ ] White-label depth  
- [ ] System information section documenting agitop boundary  
- [ ] Automated smoke tests CI-ready  
- [ ] README packaging hooks (Stephen owns packaging)  

## 7. Source material

- `docs/_notes/from_stephen_01.md` / `from_stephen_02.md`  
- `docs/production/state/state_i5_6_zone_erd.md` (**3D/zone ERD source of truth**)  
- `docs/production/state/shape_business_admin.md` (feature map)  
- Capability spine 2026-07-16  
- Historical briefs: `docs/production/state/__archive/handoffs/`  

## 8. Decisions locked

| Date | Decision |
|------|----------|
| 2026-07-15 | React + R3F; Next.js; modular; API for agents |
| 2026-07-16 | Binding boundaries (own DB, RBAC, public FE, type field, data isolation) |
| 2026-07-16 | Capability spine; Path A; ERPNext/Odoo competitors |
| 2026-07-17 | I5.4 hub viz Versa brand + dark/light; I5.4.1 ring clarity |
| 2026-07-18 | **ERD keystone v1.1:** three zones; departments as spheres; agents = user type only; Branch = subsidiary; Locations = address book; Integrations under Product; agitop boundary; Agents nav falls away |

## 9. Language rules for agents and docs

| Prefer | Avoid |
|--------|--------|
| Users / people; type human \| agent | Agent fleet, Active Agents, Agent Status |
| Versa - Business Admin | agitop / host ops console |
| Organization / Collaboration / Environmental | Host Games hierarchy as product UX |
| Executive / Projects / Tasks | Top-level Tasks with no Executive home |
| Product / Integrations | Integrations as peer of Product |
| Branch = Subsidiary; Locations = address book | Branch as free-form site without subsidiary meaning |
| agitop for Versa AGi internal | Showing agent-wise management in this product |

## 10. System information (product copy — required section)

Ship a short **System information** (help/about/admin) that states:

1. This app is **Versa - Business Admin**, not Versa AGi agitop.  
2. **Agents** appear only as users with `type = agent`. Agent operations live in agitop.  
3. **agitop Organization** may be disabled when using this product’s Organization model.  
4. Migrating data from agitop Organization into this product is a **future** assisted path — not current scope.

---

*End of product specification.*
