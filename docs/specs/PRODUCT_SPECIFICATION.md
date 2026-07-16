# Product Specification — Versa AGi Mission

**Project:** versa-admin-system (#26)  
**Product name:** Versa AGi Mission (mission control)  
**Phase:** I3 document alignment complete; path A locked  
**Owner (distribution/architecture):** Stephen Nortje  
**Lead (planning & delivery orchestration):** Versa (COA)  
**Date:** 2026-07-16  

---

## 1. Essence

**Client mission control for a Versa AGi-powered business** — a standalone, distributable product that customers install/use with their Versa AGi system so **business staff** can run the business: public presence, people, work, organization, and knowledge.

**Not AGI Top.** AGI Top is the operator console for *running* a Versa AGi installation. This product is the **customer-facing product surface** — mission control for the *business*, not the host infrastructure console.

It must be **generic, white-labelable, and extensible**.

Hybrid interface (seed retained):
- **2D management UI** for day-to-day business surfaces.
- **3D visualization layer (R3F)** optional depth over iterations (business graph, not agent fleet chrome).

### Competitive frame (Game of Life)

Registered competitors on project #26:
- **ERPNext** (Frappe) — full ERP + website + org/projects.
- **Odoo** — all-in-one ERP/CRM/CMS + knowledge modules.

**Path A (locked 2026-07-16):** We do **not** adopt those platforms. We **build** on our Next.js shell and pull OSS *components* where they save time. Mission elevates as a product category against those systems, not as a skin of them.

---

## 1.1 Binding product boundaries (Stephen — 2026-07-16)

Source of truth: `docs/_notes/from_stephen.md`. These override conflicting earlier framing.

1. **Own data plane** — Own **database and ERD**. Not a thin skin over host Versa AGi tables.
2. **Auth** — Secure login with **RBAC** (not a forever-placeholder).
3. **Public website surface** — When users are **not** signed in, a **public-facing frontend** (website aspect). Not required to be a CMS. LAN first, later HTTPS.
4. **Components** — Prefer secure, extensible pre-built components when possible (preference). Outcomes outrank purity.
5. **Familiar business product — not an agent console**
   - Must not be confused with an agent-management system by adding Agentic structure or UI chrome.
   - **No separation of agents over users in the UI** beyond a `type` field (`agent` | `human`).
   - Business staff man the system; agents participate when granted a credential by an administrator.
   - Isolated product for business staff; customers may access later.
6. **Separation from host Versa AGi**
   - Projects, documents, and operational data created **inside this product** are **completely separate** from host Versa AGi.
   - Host agents that need data: product API or Versa AGi Script Task — not shared schemas/UI with AGI Top.
7. **Clarity** — Boundaries stay explicit in design docs and agent guidance.

---

## 1.2 Capability spine (Stephen — 2026-07-16) — product order of truth

This is the **every-customer** capability order. Specs, API, and build slices follow this spine.

### A. Public-facing website (signed out)

Header / body / footer covering:

| Area | Content |
|------|---------|
| Business information | Name, slogan, logo, description (purpose and production) |
| Service list | Services the business offers |
| Product list | Products the business offers |
| Staff structure | People and roles (public-appropriate view) |

### B. User login

Secure authentication into the backend.

### C. Backend UI (signed in)

| Surface | Notes |
|---------|-------|
| Users | People records; `type` = human \| agent only distinction |
| Roles | RBAC roles and permissions |
| Projects | Business projects (product data — not host AGi projects) |
| Tasks | Work items under projects |
| Organization structure | Hierarchical staff allocation: divisions → departments → sections → units |
| Knowledgebase | Assignable to org-structure nodes |
| — Policies | Policy documents |
| — Processes | Process documents |
| — Articles | General KB articles |

---

## 2. Goals

1. Deliver **mission control** for a client business — public presence + staff backend — not a host ops console.
2. Stay **generic/extensible** and **white-labelable** (logo, theme, colors).
3. Keep the product **self-contained** so Stephen can own packaging and distribution into Versa AGi.
4. Prefer **setup/purge cycles** that rebuild cleanly from zero (Building-phase mindset).
5. Ship along the **capability spine**; deepen 3D and integrations iteratively.
6. Compete on clarity and fit for Versa AGi-powered businesses vs heavy ERPs (ERPNext/Odoo).

## 3. Non-Goals (v1)

- **Not AGI Top / agitop replacement.**
- **Not a full ERP** (no inventory, manufacturing, full accounting suite as core).
- Stephen owns final packaging format, install path into Versa AGi, and distribution channel.
- No production multi-tenant SaaS in v1 (single-tenant product install is fine).
- No irreversible coupling to this host's private paths — config and data contracts must be portable.
- Host agent fleet management UI is out of scope (people with type only).

## 4. Technical Stack (path A — locked 2026-07-16)

| Layer | Choice | Notes |
|-------|--------|-------|
| UI library | **React** | Primary UI foundation |
| App framework | **Next.js** | Routing, layouts, API routes, production build |
| 3D | **React Three Fiber** | Optional visualization; not required for spine MVP |
| Styling / components | Tailwind CSS + shadcn/ui | White-label friendly |
| Data | **Own DB + ERD** (implementation TBD; start fixture → real store) | Portable adapters |
| Auth / RBAC | Secure libraries (OSS components) | Required for login + roles |
| API | First-class HTTP JSON API | UI and Versa AGi agents consume same API |
| Tests | Playwright (E2E) + Vitest (unit) | QA owns strategy when hired |

**Path A rule:** Build on this shell. Use OSS **components** (auth kits, rich text, tree UI, tables). Do **not** adopt ERPNext/Odoo as the product platform.

### Why Next.js (plain language)

Next.js is React plus file-based routing, optional server rendering, API routes, and a standard production build. Default remains Next.js unless packaging forces a documented tradeoff.

## 5. Product Surfaces (mapped to capability spine)

### Public (signed out)
1. **Public site shell** — header, body, footer  
2. **Business profile** — name, slogan, logo, description  
3. **Services** — public service list  
4. **Products** — public product list  
5. **Staff structure (public)** — people/roles appropriate for public view  

### Auth
6. **Login / session** — secure login; session boundary  

### Backend (signed in)
7. **App shell** — familiar business chrome (sidebar/header) — **not** agent-console chrome  
8. **Users** — people; type field only for human vs agent  
9. **Roles** — RBAC administration  
10. **Projects** — business projects  
11. **Tasks** — work items  
12. **Organization structure** — divisions → departments → sections → units  
13. **Knowledgebase** — policies, processes, articles; assignable to org nodes  
14. **White-label settings** — logo, theme, colors  
15. **Product API** — HTTP API for UI + Versa AGi agents  
16. **(Later) 3D viewport** — optional business graph over the same entities  

**Deprecated framing (do not reintroduce):** host agent fleet as primary nav, games hierarchy as core UX, AGI Top-style system health as MVP center.

## 6. Success Criteria (MVP along spine)

- [ ] App boots with documented one-command local setup  
- [ ] Public site shows business info, services, products, staff structure from product data  
- [ ] Secure login + RBAC roles enforce backend access  
- [ ] Backend CRUD (or solid fixtures→API) for users, roles, projects, tasks  
- [ ] Org hierarchy model + UI (tree)  
- [ ] KB: policies, processes, articles assignable to org nodes  
- [ ] White-label basics: logo + theme/color tokens  
- [ ] API documents and serves core resources (fixture or DB)  
- [ ] UI language is business-familiar (no agent-console confusion)  
- [ ] Users vs agents differ only by `type`  
- [ ] Modular structure — easy to extend without rewrite  
- [ ] Automated smoke tests pass in CI-ready form  
- [ ] README documents packaging hooks for Versa AGi install (Stephen owns packaging)  
- [ ] R3F optional — not MVP-blocking for spine  

## 7. Source Material

- `docs/_notes/from_stephen.md` (binding boundaries)  
- Stephen capability spine message 2026-07-16  
- Seeded research under `docs/research/`  
- I0–I2 shell (Next.js + shadcn + R3F seed + fixture API)  

## 8. Decisions locked

| Date | Decision |
|------|----------|
| 2026-07-15 | React + R3F preferred; Next.js OK; modular; API for agents |
| 2026-07-15 | QA timing flexible; fun name OK |
| 2026-07-16 | Binding boundaries note (own DB, RBAC, public FE, type field, data isolation) |
| 2026-07-16 | Capability spine order (public → login → backend org/KB) |
| 2026-07-16 | **Path A:** build on Next shell + OSS components; not full ERP |
| 2026-07-16 | ERPNext and Odoo registered as competitors (elevate Mission product frame) |
| 2026-07-16 | QA agent deferred until testable UI slices exist |

## 9. Language rules for agents and docs

| Prefer | Avoid |
|--------|--------|
| Users / people | Agent fleet, host agents as primary objects |
| type: human \| agent | Separate Agents admin chrome |
| Projects / tasks (business) | Host AGi project registry |
| Organization structure | Host team/agent topology |
| Knowledgebase (policies, processes, articles) | Host system markdown dumps |
| Mission control / business product | AGI Top, agitop, host console |

