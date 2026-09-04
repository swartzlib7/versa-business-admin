# Iteration 5.3 — Public Mission Control template (generic facets)

**Project:** versa-admin-system (#26)  
**Assignee:** web-dev  
**Depends on:** I5.2 accepted on beta (`148fb11`)  
**Date:** 2026-07-17  
**Branch:** `agent/web-dev` (shared checkout via symlink is fine)

## Goal

Stephen reviewed the public site on :3100 — **looks good**. Next cut: make the public sample feel like a **generic Mission Control for running a business**, not a brochure / marketing website.

Tone: **Lorem Ipsum–style template** — placeholder content any business can map onto itself. Still white-label Northstar (not Versa rebrand, not consulting firm packaging). Keep the maker/UGPN spine under the hood (intention → production, human + agent) but **lead with operating facets**, not service-catalog marketing.

## Facets Stephen named (first-class on the public sample)

Surface these as clear sections / cards / nav anchors on the public homepage (and light fixture support if needed):

1. **Other systems** — connected or adjacent systems the business runs alongside Mission Control  
2. **Integrations** — email, chat, CMS, source control, APIs, etc. (fixtures already exist under `src/lib/fixtures/integrations.ts` — reuse/extend)  
3. **Operations** — day-to-day run of the business (projects, tasks, workflows — link into product language already shipped)  
4. **Customer support** — inbox, tickets, care loops (placeholder sample content)  
5. **Metrics** — simple KPI / health snapshot placeholders (no real analytics backend)  
6. **Knowledge articles** — handbook / process docs / searchable knowledge (placeholder; full KB is later I8)

You may group Metrics + Knowledge if layout is cleaner, but both ideas should appear.

## Deliverables

### 1. Public homepage reframe (`src/app/page.tsx` + public components)

- Hero: Mission Control framing — e.g. “Run your business from one place” / generic template language (not “Explore Services” as the primary story).
- Replace or demote the consulting-style **service catalog** as the main body. Prefer a **facet grid** for the six areas above.
- Keep About / Contact light and generic (example.com, sample phone).
- Optional: short “How it works” strip (intention → plan → produce → serve) if it still reads as product, not brochure.
- Public header/footer labels should match Mission Control language where they currently say marketing-site things.

### 2. Fixtures / sample content

- `business.ts`: slogan/description may lean Mission Control + template (still Northstar Works, still white-label).
- `services.ts`: either retire from homepage primary path or rewrite entries to map 1:1 to the facets (Other systems, Integrations, Operations, Support, Metrics, Knowledge) — **do not** invent new consulting packages.
- Reuse `integrations.ts` for the Integrations facet; add thin placeholder fixtures for support tickets / metrics / knowledge articles **only if** the UI needs list data (keep minimal).
- No Versa, IoT, My Smart Yard, or real client branding.

### 3. Quality bar

- `npm run build` clean  
- Smoke on :3100 (or document port): public home shows facet grid; login still works; authenticated shell unchanged  
- README: one short “I5.3 public Mission Control template” note  
- Commit on `agent/web-dev` with clear message; handoff to COA with SHA + smoke steps  

## Out of scope

- I7 org structure  
- Real DB / persistence  
- Full knowledge base product (I8)  
- Real support ticketing or metrics pipelines  
- Authenticated shell redesign  
- Reopening ERP path  

## Acceptance criteria

- [ ] Public home reads as **Mission Control template**, not service brochure  
- [ ] Facets present: other systems, integrations, operations, customer support, metrics, knowledge  
- [ ] Content remains generic / Lorem-style white-label  
- [ ] Build clean; COA can smoke on preferred demo port (:3100)  
- [ ] Handoff SHA on `agent/web-dev`

## Stephen quote (intent)

> Make this a little more generic, like a Lorem Ipsum kind of style template — not website, but **MISSION CONTROL running your business**. Looking at: other systems, integrations, operations, customer support, maybe metrics or knowledge articles.
