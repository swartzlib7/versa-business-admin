# Product Specification — Versa Admin System

**Project:** versa-admin-system (#26)  
**Phase:** Building (pre-release product development)  
**Owner (distribution/architecture):** Stephen Nortje  
**Lead (planning & delivery orchestration):** Versa (COA)  
**Date:** 2026-07-14  

---

## 1. Essence

**Client mission control for a Versa AGi-powered business** — a standalone, distributable product that customers install/use with their Versa AGi system to see and manage everything their business runs through AGi: integrations, connected systems, operational work, and agent collaboration.

**Not AGI Top.** AGI Top is the operator console for *running* a Versa AGi installation. This product is the **customer-facing product surface** of that system — mission control for the *business*, not the host infrastructure console.

It must be **generic and extensible** so customers can brand and extend it.

Hybrid interface (seed):
- **2D management UI** for day-to-day business/ops surfaces (integrations, systems, agents, projects/work, health).
- **3D visualization layer (R3F)** for spatial understanding of the business graph (optional depth over iterations).

### Branding / white-label (required direction)
Customers must be able to represent *their* business with:
- Own logo
- Own theme
- Own color scheme

### Public front-end idea (exploratory — refine later)
Stephen is considering a deployable website front-end that:
1. Presents business information publicly (or semi-publicly) as the client site
2. Lets end customers log into a front-end user account
3. Opens a **chat-style agent interface** wired to the customer’s Versa AGi context (agents can help using that customer’s business data)

Treat public site + authenticated agent chat as a **later product track** after core mission-control shell is real; capture requirements as we refine.

## 2. Goals

1. Deliver **mission control** for a client business running on Versa AGi — not a host-only ops console.
2. Stay **generic/extensible** and **white-labelable** (logo, theme, colors).
3. Keep the product **self-contained** so Stephen can own packaging and distribution into Versa AGi.
4. Prefer **setup/purge cycles** that rebuild cleanly from zero (Building-phase mindset).
5. Ship core operational surfaces first; deepen 3D, public website, and agent-chat access iteratively.

## 3. Non-Goals (v1)

- **Not AGI Top / agitop replacement** — different audience (client business mission control vs system-running console).
- Stephen owns final packaging format, install path into Versa AGi, and distribution channel.
- No production multi-tenant SaaS in v1 (single-tenant product install is fine).
- Full public marketing website + end-customer agent chat is **directional**, not MVP-blocking until we lock scope.
- No irreversible coupling to this host’s private paths — config and data contracts must be portable.

## 4. Technical Stack (confirmed direction 2026-07-15)

| Layer | Choice | Notes |
|-------|--------|-------|
| UI library | **React** | Stephen is keen on React; primary UI foundation |
| 3D | **React Three Fiber + @react-three/drei** | Explicit preference — keep in the product |
| App framework | **Next.js** (App Router) | Stable React full-stack shell; covers routing, API routes, SSR/SSG as needed. Explained simply: Next.js is the production framework *around* React (pages, APIs, build). |
| Styling / components | Tailwind CSS + shadcn/ui | Accessible, customizable, white-label friendly |
| Data / host contract | Portable adapters + **first-class HTTP API** | UI and Versa AGi agents both consume the same API |
| Tests | Playwright (E2E) + Vitest (unit) | QA owns strategy when hired |

**Reliability bias:** prefer well-supported, boring-stable packages over exotic ones. web-dev may swap a library if something is more stable — keep React + R3F as non-negotiable preferences.

### Why Next.js (plain language)
Next.js is not a different UI language — it is React plus:
- file-based routing and layouts
- optional server rendering
- **API routes** (handy for the agent-facing API)
- a standard production build pipeline

If web-dev finds a simpler React-only shell better for packaging, document the tradeoff; default remains Next.js.

## 5. Product Surfaces (high-level components)

1. **Shell / Layout** — sidebar, header, main hybrid content area (mission-control chrome)  
2. **Auth / Session boundary** — placeholder until distribution design lands  
3. **Business / integrations overview** — connected systems and integrations the client manages via AGi  
4. **Agent collaboration view** — agents available to the business, status, activity  
5. **Projects / work / games view** — hierarchy and linkage of strategic work  
6. **Tasks / work queue view** — operational list + filters  
7. **System health / ops widgets** — lightweight dashboard cards  
8. **3D Viewport** — business/work graph; click-to-filter 2D panels  
9. **White-label settings** — logo, theme, color scheme (customer brand)  
10. **Install/config contract** — documented inputs the product expects from a Versa AGi host  
11. **Product API (agent + UI)** — HTTP API so Versa AGi agents (and the UI) can read/write mission-control data programmatically  
12. **(Later) Public website front-end** — deployable site + login + agent chat wired to customer data  

## 6. Success Criteria (MVP)

- [ ] App boots with documented one-command local setup  
- [ ] Mission-control framing clear in shell (not host AGI Top clone)  
- [ ] Core 2D navigation works for Integrations/Systems, Agents, Projects/Work, Tasks  
- [ ] White-label basics: logo + theme/color tokens configurable  
- [ ] R3F viewport renders a meaningful default graph from sample/fixture data  
- [ ] Selecting a 3D node filters or focuses related 2D data  
- [ ] **API surface exists** (even if fixture-backed): agents can call documented endpoints for core resources  
- [ ] Modular structure — easy to extend without rewrite  
- [ ] Automated smoke tests pass in CI-ready form  
- [ ] README documents packaging hooks for Versa AGi install (Stephen owns packaging)  
- [ ] Public website + end-user agent chat: **later track**, not MVP-blocking  

## 7. Source Material

Seeded from `versa-agi/admin-system/`:
- `docs/research/RESEARCH.md`
- `docs/research/LAYOUT_PROPOSAL.md`
- `docs/research/admin_full_config.yaml.example`

## 8. Vision notes (Stephen, 2026-07-14)

- Purpose: **mission control for the client business** using Versa AGi — integrations, other systems, operational picture.
- Explicitly **not** AGI Top (system-running console).
- Must be **generic** so customers can extend it.
- Must support **customer branding** (logo, theme, colors).
- Exploring a **deployable front-end website** that also offers login + chat access to agents with customer context — refine before deep build.
- Models for build team: **DeepSeek V4 Flash** and **DeepSeek V4 Pro** only ("Flash" alone was a speech stutter).

## 9. Decisions locked (Stephen, 2026-07-15)

1. **QA timing:** flexible — hire when needed (not blocking start). Fun name OK if it communicates quality.
2. **Git remote:** later; do **not** hold build for remote.
3. **Stack:** React + R3F preferred; Next.js seed OK if it makes sense; favor reliable/stable components; modular and easy to extend.
4. **MVP gap / design requirement:** **agents must be able to use the system** → design an **API** so Versa AGi agents can interact with mission control (not UI-only).
5. Interview later when there is something to point at — proceed now.
