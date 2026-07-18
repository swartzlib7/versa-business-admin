# Mission Control — 3D Hub ERD & Design Keystone

**Status:** Keystone design document — **v1.1 accepted direction** (Stephen 2026-07-18 answers locked; spheres layout interim until he fleshes further)  
**Project:** versa-admin-system (#26) · Game #109 Versa Voice AI LLC  
**Source:** Stephen Nortje — 2026-07-18 Mission Control 3D redesign + follow-up clarifications  
**Author:** Versa (COA)  
**Related:** I5.4 / I5.4.1 hub visualization (`mission-control-scene.tsx`); prior hub+3-rings layout **superseded as conceptual model** by this ERD (implementation still on I5.4 graph until a build pass)

---

## 1. Purpose

This document is the **keystone** for Mission Control’s 3D graph and the conceptual **ERD** of the Versa AGi built-in **business** Mission Control app.

It defines:

1. Three concentric **zones** (circles) and the **entities** on each  
2. A **Glossary of Terms**  
3. **3D interaction / presentation** requirements  
4. **Navigation remapping** from current UI elements  
5. The intended **UI pattern** per zone  
6. **Boundary vs agitop** (system information — do not overstep)

Use this document for design clarification, iteration briefs, and implementation handoffs. Prefer updating this file over inventing parallel models.

---

## 2. Product boundary vs agitop (system information)

| Surface | Audience | Scope |
|---------|----------|--------|
| **This product — Mission Control** | Business staff (and later customers) | **Business** operating graph: Organization, Collaboration, Environmental. Familiar business product. |
| **agitop** | Versa AGi operators / host | **Internal** Versa AGi mission control: Agents, Projects, Tasks, host Organization feature, system ops. |

**Binding rules (Stephen 2026-07-18):**

1. **AI Agents are only a Type of user** in this product (`type: agent | human`). That is all.  
2. **Do not show agent-management chrome** (Active Agents, Agent Status, fleet views, etc.). That is **strictly internal to Versa AGi / agitop**.  
3. Mission Control is for the **business**, not Versa AGi host ops.  
4. Users who do **not** need an org mission control still use Versa AGi system features (Agents, Projects, Tasks, Organization) via **agitop** — not this product’s 3D ERD.  
5. **agitop Organization** is the only conceptual overlap. It can be **turned off in agitop** when a customer uses this product’s Organization model.  
6. **Migration** of business data from agitop Organization → this product is a future path (agents can help). **Out of scope** for current Mission Control build. Document only.  
7. Include this boundary in a **system information** section of the product (help / about / admin notes).

---

## 3. Conceptual model (ERD)

### 3.1 Zones (three circles)

| Ring | Zone name | Role |
|------|-----------|------|
| **Center / inner** | **Organization** | The operating core of the enterprise — departments as spheres |
| **Second** | **Collaboration** | Parties the organization works *with* |
| **Third (outer)** | **Environmental** | Context of work — where, when, what is known, what is offered |

**Brand / hub identity**

- Product brand on the hub surface: **`Versa AGi`** (replaces **`Northstar Works`** on authenticated Mission Control viz).  
- **Organization** is the **center circle zone**. Prefer a **flat label along the edge of the Organization circle**.  
- **Hub = Executive is a department** — and so are all other Organization nodes. **Lay them out as spheres for now.** Stephen will flesh department detail further later.

### 3.2 Organization zone (inner circle) — departments as spheres

| Node | Position (Stephen) | Notes |
|------|--------------------|--------|
| **Executive** | Center (among org spheres) | Department — not agitop; business executive function |
| **Communications** | Left of center | Department |
| **Dissemination** | Right of center | Department |
| **Treasury** | Back | Department |
| **Production** | Front | Department |
| **Qualification** | Bottom | Department |

> All Organization nodes are **departments**. Geometric layout: spheres on the Organization ring/zone. Further org hierarchy (divisions → sections → units) remains a later I7-class concern and must not reintroduce agitop agent structure.

### 3.3 Collaboration zone (second circle)

| Node | Position | Definition |
|------|----------|------------|
| **Vendor** | Right | AKA **Service Provider** |
| **Customer** | Front | **Person or Business** |
| **Partner** | Left | **Business or Investor** |
| **Branch** | Back | **Subsidiary** (not a separate Org unless modeled as such; otherwise Partnerships / separate Orgs) |

**Locked (Stephen):** Branches are **Subsidiaries**. Otherwise entities are separate Orgs or Partnerships.

### 3.4 Environmental zone (third circle)

| Node | Position | Definition |
|------|----------|------------|
| **Locations** | Left | **Global Address Book** (map integration later) |
| **Events** | Right | Planned activity in the future or past |
| **Knowledge** | Back | Documents, recordings, photos, policies, research data, etc. |
| **Schedules** | Front | Agreement of when an Event, Activity or Task will occur (calendar-like) |
| **Product** | Bottom | Physical object (device, manufactured item) or computer file |
| **Service** | Top | Faculty through which results are achieved (e.g. Analysis & Design, Book Keeping) |

**Locked (Stephen):**

- **Locations** = address book; map integration can be added later.  
- **Integrations** always under **Product** as a factor of a product. An Integrations **dashboard** is desired; **data source** remains Product → Integrations.

### 3.5 Relationship intent (zone UI pattern)

> A **UI pattern for each circle** — Environment, Collaboration, and Organization.  
> Each UI has regions to **configure and connect** elements on the **same level**, and to **reach into the other two zones** depending on the feature in use.

- Each zone is a first-class navigation / configuration surface, not only 3D decoration.  
- Cross-zone links are normal.  
- The 3D graph is the **spatial ERD**; 2D screens implement the same entities and edges.

---

## 4. 3D presentation & interaction requirements

| Requirement | Detail |
|-------------|--------|
| **Expand / lightbox** | Expand toggle → **lightbox** more full-screen, **not** browser F11 fullscreen |
| **Billboard labels** | Labels always face the camera |
| **Organization label** | Flat label along the edge of the Organization circle |
| **Hub naming** | **`Versa AGi`** on product Mission Control surface |
| **Department spheres** | Organization nodes laid out as spheres (interim until further flesh-out) |
| **Prior polish still in force** | Clear orbital guides; dark + light mode; Versa brand with customer rebrand/white-label path |

---

## 5. Navigation remapping (current → new model)

| Current element | New placement / fate |
|-----------------|----------------------|
| **Integrations** | **Product / Integrations** (Environmental → Product; dashboard OK, data from Product) |
| **Projects** | **Executive / Projects** (Organization → Executive) |
| **Tasks** | **Executive / Projects / Tasks** |
| **Settings** | **As is** |
| **Users** | **As is** — agents appear only as `type: agent` users |
| **Dashboard** | **As is** |
| **Active Agents** | **Falls away** — agitop territory |
| **Agent Status** | **Falls away** — agitop territory |

---

## 6. Glossary of Terms

| Term | Definition |
|------|------------|
| **Mission Control** | Business Mission Control app (this product) — not agitop |
| **agitop** | Versa AGi internal operator console (Agents, host Projects/Tasks, optional host Organization) |
| **Versa AGi** | Product / hub identity for this graph surface |
| **Organization (zone)** | Center zone — internal **departments** as spheres |
| **Collaboration (zone)** | Second circle — parties and structural relationships |
| **Environmental (zone)** | Third circle — place, time, knowledge, offerings |
| **Executive** | Organization **department** (center among org spheres); parent path for Projects and Tasks |
| **Communications** | Organization department (left of center) |
| **Dissemination** | Organization department (right of center) |
| **Treasury** | Organization department (back) |
| **Production** | Organization department (front) |
| **Qualification** | Organization department (bottom) |
| **Vendor** | Collaboration node. **AKA Service Provider.** |
| **Customer** | Collaboration node. **Person or Business.** |
| **Partner** | Collaboration node. **Business or Investor.** |
| **Branch** | Collaboration node. **Subsidiary.** |
| **Locations** | Environmental. **Global Address Book** (+ future maps) |
| **Events** | Environmental. Planned activity future or past |
| **Knowledge** | Environmental. Documents, recordings, photos, policies, research, etc. |
| **Schedules** | Environmental. When an Event/Activity/Task occurs |
| **Product** | Environmental. Device, manufactured item, or computer file |
| **Service** | Environmental. Faculty for results (e.g. Analysis & Design) |
| **Integrations** | Always under **Product**; dashboard may exist; data sourced from Product |
| **User type** | `human` \| `agent` — **only** agent distinction in this product |
| **Lightbox (expand)** | Near-fullscreen overlay without OS/browser F11 fullscreen |
| **Billboard label** | Label always faces the camera |
| **Zone UI pattern** | Per-circle UI: same-level connect + reach into other zones |
| **ERD (this document)** | Entity–relationship design as zones + nodes + links — not necessarily SQL dump |

---

## 7. Collaboration zone — completeness (resolved for v1)

**v1 Collaboration nodes (locked):** Vendor, Customer, Partner, Branch.

| Topic | Resolution |
|-------|------------|
| **AI Agents** | **User type only** — not a Collaboration or Organization graph node; not agent chrome |
| **Employees / team** | **Users** (+ future org assignment); not a fifth Collaboration node for v1 |
| **Prospect / Lead** | Prefer Customer lifecycle unless sales process demands otherwise |
| **Community / association** | Partner subtype when needed |
| **Competitor** | Out of this ERD (game/opponent intelligence elsewhere) |

---

## 8. Decisions locked (Stephen)

| Date | Decision |
|------|----------|
| 2026-07-18 | Three zones: Organization / Collaboration / Environmental |
| 2026-07-18 | Organization departments as spheres; Executive is a department |
| 2026-07-18 | Agents = user `type` only; no agent-wise UI; agitop owns agent ops |
| 2026-07-18 | Mission Control = business; agitop = Versa AGi internal |
| 2026-07-18 | agitop Organization optional/off when using this product; migration out of scope for now |
| 2026-07-18 | Locations = address book; map later |
| 2026-07-18 | Branches = Subsidiaries |
| 2026-07-18 | Integrations always under Product; Integrations dashboard OK |
| 2026-07-18 | Nav: Projects/Tasks under Executive; Agents nav falls away |
| 2026-07-18 | Lightbox expand; billboard labels; Organization rim label; Versa AGi hub naming |
| 2026-07-18 | Stephen will flesh Organization further; spheres layout interim |

---

## 9. Open / deferred (not blocking keystone)

| Item | Notes |
|------|--------|
| Full department flesh-out | Stephen still expanding Organization detail |
| Map integration on Locations | Later |
| agitop → Mission data migration | Out of scope; document only |
| I5.5 build pass | Open only when Stephen requests implementation of this ERD in R3F/nav |
| I7 Organization hierarchy UI | Closed until explicitly opened (div→dept→section→unit may align later with departments) |
| SQL ERD / own DB | Still open product-wide |

---

## 10. Does this make sense? (COA synthesis)

**Yes.** Locked answers remove the main risks:

- **Agents** stay a user type → no overstep into agitop.  
- **Hub spheres = departments** → Executive is not “the whole product center” confusion; Versa AGi remains product brand; Organization is the zone.  
- **Branch vs Locations** and **Integrations under Product** are clear.  
- System-info note on agitop Organization overlap is the right long-term packaging story.

---

## 11. Where iteration briefs live

Handoffs are **not** at the workspace root. They live in the product repo:

| Path | Content |
|------|---------|
| `docs/handoffs/ITERATION_*_WEB_DEV.md` | Build briefs for web-dev (I0–I6, I5.3, I5.4, …) |
| `docs/specs/MISSION_CONTROL_ERD_KEYSTONE.md` | **This file** — conceptual ERD (source of truth for 3D/nav) |
| `docs/specs/PRODUCT_SPECIFICATION.md` | Product boundaries + capability spine |
| `docs/specs/PRODUCTION_PLAN.md` | Iteration plan / status |
| Workspace root | Project folders only — **no** I5.5/I7 files there unless a handoff is created |

**I5.5** and **I7** handoffs are **not created** until Stephen opens those build slices. I7 remains closed. I5.5 = optional next build to implement this keystone in UI/3D after he asks.

---

## 12. Suggested next steps

| Step | Owner | Action |
|------|-------|--------|
| 1 | COA | Keep this keystone + product docs aligned (audit 2026-07-18) |
| 2 | Stephen | Flesh Organization departments further when ready |
| 3 | Stephen / COA | When ready for build: open **I5.5** handoff (lightbox, billboards, zone nodes, nav remap, fixture graph) |
| 4 | web-dev | Implement only when tasked; **I7 closed** until explicit open |

---

## 13. Change log

| Date | Change |
|------|--------|
| 2026-07-18 | v1.0 initial keystone from Stephen redesign message |
| 2026-07-18 | **v1.1** Stephen answers: agents = user type only; hub departments as spheres; Locations address book; Branch = subsidiary; Integrations under Product; agitop boundary + system info; handoff path clarification |

---

*End of keystone document.*
