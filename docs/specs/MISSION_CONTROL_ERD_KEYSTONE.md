# Mission Control — 3D Hub ERD & Design Keystone

**Status:** Keystone design document (iterate; do not treat as frozen code contract until Stephen accepts)  
**Project:** versa-admin-system (#26) · Game #109 Versa Voice AI LLC  
**Source:** Stephen Nortje — 2026-07-18 (Mission Control 3D element redesign)  
**Author:** Versa (COA) — documented exactly from Primary User direction  
**Related:** I5.4 / I5.4.1 hub visualization (`mission-control-scene.tsx`), prior hub+3-rings layout  

---

## 1. Purpose

This document is the **keystone** for Mission Control’s 3D graph and the conceptual **ERD** of the Versa AGi built-in Mission Control app.

It defines:

1. Three concentric **zones** (circles) and the **entities** on each  
2. A **Glossary of Terms** (definitions in brackets from Stephen, expanded for design use)  
3. **3D interaction / presentation** requirements  
4. **Navigation remapping** from current UI elements  
5. The intended **UI pattern** per zone  

Use this document for design clarification, iteration briefs, and implementation handoffs. Prefer updating this file over inventing parallel models.

---

## 2. Conceptual model (ERD)

### 2.1 Zones (three circles)

| Ring | Zone name | Role |
|------|-----------|------|
| **Center / inner** | **Organization** | The operating core of the enterprise — how the organization is structured and runs |
| **Second** | **Collaboration** | Parties the organization works *with* (external and structural relationships) |
| **Third (outer)** | **Environmental** | Context of work — where, when, what is known, what is offered |

**Brand / hub identity**

- Product brand on the hub: **`Versa AGi`** (replaces **`Northstar Works`** in this surface).  
- **Organization** is the **center circle zone**. Prefer a **flat label along the edge of the Organization circle** (not only a floating billboard at the hub).

> **Open design note (COA):** Hub brand node (`Versa AGi`) vs **Executive** as “center” of the Organization ring — see §7 Questions. Documented as stated: Organization = center zone; Executive listed as center of the inner-circle spheres.

### 2.2 Organization zone (inner circle)

Spheres / nodes on the **Organization** ring:

| Node | Position (Stephen) | Notes |
|------|--------------------|--------|
| **Executive** | Center | Core command / leadership function of the org graph |
| **Communications** | Left of center | Internal/external messaging posture of the org |
| **Dissemination** | Right of center | Outbound distribution of information / offers |
| **Treasury** | Back | Money, capital, financial control |
| **Production** | Front | Making / delivering work product |
| **Qualification** | Bottom | Standards, fitness-to-operate, eligibility, quality gates |

### 2.3 Collaboration zone (second circle)

| Node | Position | Definition (Stephen) |
|------|----------|----------------------|
| **Vendor** | Right | AKA **Service Provider** |
| **Customer** | Front | **Person or Business** |
| **Partner** | Left | **Business or Investor** |
| **Branch** | Back | **Subsidiary** |

> **Completeness check:** See §6 (COA thoughts on missing Collaboration concepts).

### 2.4 Environmental zone (third circle)

| Node | Position | Definition (Stephen) |
|------|----------|----------------------|
| **Locations** | Left | **Global Address Book** |
| **Events** | Right | Planned activity that is in the future or already in the past |
| **Knowledge** | Back | Documents, recordings, photos, policies, research data, etc. |
| **Schedules** | Front | An agreement of when an Event, Activity or Task will occur — time and date (like a calendar) |
| **Product** | Bottom | Physical object such as a device, manufactured item, or computer file |
| **Service** | Top | Faculty through which results are achieved (e.g. Analysis & Design, Book Keeping) |

### 2.5 Relationship intent (how the ERD is used)

Stephen’s operating vision:

> A **UI pattern for each circle** — Environment, Collaboration, and Organization.  
> Each UI has a set of **regions** to **configure and connect** elements on the **same level**, and to **reach into the other two zones** depending on the feature in use.

Implication for product design:

- Each zone is not only a 3D decoration — it is a **first-class navigation / configuration surface**.  
- Cross-zone links are normal (e.g. a **Customer** linked to **Locations**, **Events**, **Products**; **Production** linked to **Schedules** and **Vendors**).  
- The 3D graph is the **spatial ERD**; 2D screens implement the same entities and edges.

---

## 3. 3D presentation & interaction requirements

| Requirement | Detail |
|-------------|--------|
| **Expand / lightbox** | Add an **expand toggle** so the 3D element expands into a **lightbox** that is **more full-screen**, but **not** browser F11 fullscreen. |
| **Billboard labels** | Ensure **labels always point to the camera** (billboard / face-camera behavior). |
| **Organization label** | Flat label **along the edge** of the Organization circle (try this treatment). |
| **Hub naming** | **`Versa AGi`** replaces **`Northstar Works`** on this surface. |
| **Prior polish (still in force unless superseded)** | Clear orbital circle guides; triangular / system links where relevant; dark + light mode; Versa brand with customer rebrand/white-label path (I5.4 / I5.4.1). |

---

## 4. Navigation remapping (current → new model)

| Current element | New placement / fate |
|-----------------|----------------------|
| **Integrations** | **Product / Integrations** (Environmental → Product, with integrations as a facet or child concept) |
| **Projects** | **Executive / Projects** (Organization → Executive) |
| **Tasks** | **Executive / Projects / Tasks** (nested under Projects under Executive) |
| **Settings** | **As is** |
| **Users** | **As is** |
| **Dashboard** | **As is** |
| **Active Agents** | **Falls away** (remove from primary nav / model) |
| **Agent Status** | **Falls away** (remove from primary nav / model) |

---

## 5. Glossary of Terms

Terms below are **canonical for Mission Control design**. Bracketed text is Stephen’s definition where given; plain text is COA clarification for implementers (non-normative until accepted).

| Term | Definition |
|------|------------|
| **Mission Control** | The Versa AGi built-in app surface for operating the business graph (3D hub + zone UIs). |
| **Versa AGi** | Product / hub identity for this graph (replaces Northstar Works on this surface). |
| **Organization (zone)** | Center circle zone — internal operating structure of the enterprise. |
| **Collaboration (zone)** | Second circle — parties and structural relationships the organization works with. |
| **Environmental (zone)** | Third circle — context objects: place, time, knowledge, and offerings. |
| **Executive** | Organization node (center of inner spheres) — leadership / command function; parent path for Projects and Tasks in nav remapping. |
| **Communications** | Organization node (left of center) — org communication function. |
| **Dissemination** | Organization node (right of center) — outbound distribution function. |
| **Treasury** | Organization node (back) — financial / capital function. |
| **Production** | Organization node (front) — production / delivery function. |
| **Qualification** | Organization node (bottom) — standards, eligibility, quality / fitness gates. |
| **Vendor** | Collaboration node (right). **AKA Service Provider.** |
| **Service Provider** | Alias of **Vendor**. |
| **Customer** | Collaboration node (front). **Person or Business** that receives value. |
| **Partner** | Collaboration node (left). **Business or Investor** in a collaborative / equity / alliance sense. |
| **Branch** | Collaboration node (back). **Subsidiary** (structural extension of the org). |
| **Subsidiary** | Alias sense of **Branch**. |
| **Locations** | Environmental node (left). **Global Address Book** — places / addresses. |
| **Global Address Book** | Conceptual system behind **Locations**. |
| **Events** | Environmental node (right). **Planned activity that is in the future or already in the past.** |
| **Knowledge** | Environmental node (back). **Documents, recordings, photos, policies, research data, etc.** |
| **Schedules** | Environmental node (front). **An agreement of when an Event, Activity or Task will occur — Time and Date (like a calendar).** |
| **Product** | Environmental node (bottom). **Physical object such as a device, manufactured item or computer file.** |
| **Service** | Environmental node (top). **Faculty through which results are achieved** (e.g. Analysis & Design, Book Keeping). |
| **Integrations** | Remapped under **Product / Integrations** (how products/systems connect). |
| **Projects** | Remapped under **Executive / Projects**. |
| **Tasks** | Remapped under **Executive / Projects / Tasks**. |
| **Lightbox (expand)** | Expanded, near-fullscreen overlay for the 3D element **without** OS/browser F11 fullscreen. |
| **Billboard label** | Label orientation that **always faces the camera**. |
| **Zone UI pattern** | Per-circle UI with regions to configure/connect same-level elements and reach into the other two zones. |
| **ERD (this document)** | Entity–relationship design of Mission Control expressed as zones + nodes + cross-zone links — not necessarily a SQL schema dump. |

---

## 6. Collaboration zone — completeness thoughts (COA)

Stephen asked whether anything conceptual is missing on the Collaboration ring (Vendor, Customer, Partner, Branch).

**What is already strong**

- **Vendor / Service Provider** — inbound supply of capability.  
- **Customer** — demand side (person or business).  
- **Partner / Investor** — alliance and capital collaboration.  
- **Branch / Subsidiary** — legal/structural extension of the org.

**Candidates worth considering (not added unless Stephen accepts)**

| Candidate | Why it might belong | Why it might *not* |
|-----------|---------------------|---------------------|
| **Agent** (AI agent / agentic teammate) | First-class in Versa AGi; “Active Agents” is being removed from nav — agents still need a home | May live under **Users**, **Executive**, or a future Organization node rather than Collaboration |
| **Employee / Team / Staff** | People who *are* the org, not only external collab | Often modeled as **Users** + org chart under Organization; Branch may cover multi-site people structure |
| **Prospect / Lead** | Pre-customer pipeline is real for BD | Can be a **state/lifecycle of Customer** rather than a separate node |
| **Community / Association / Network** | Chambers, professional bodies, referral networks (e.g. Mold Solutions BD) | May be a subtype of **Partner** or **Customer** |
| **Regulator / Authority** | Compliance-heavy industries | Often Environmental (Knowledge/Locations) + process, not a collab peer |
| **Competitor** | Strategic awareness | Usually **not** a collaboration entity; better as game/opponent intelligence outside this ERD |

**COA recommendation**

1. Keep the **four Collaboration nodes** as the v1 keystone.  
2. Explicitly decide where **AI Agents** and **human Users/Employees** live (Organization vs Users vs a fifth Collaboration node).  
3. Model **Prospect** as Customer lifecycle unless sales process demands a separate node.  
4. Revisit **Community/Association** when BD games (e.g. Mold Solutions) need referral networks as first-class.

---

## 7. Questions for Stephen (clarifications)

1. **Hub vs Executive:** Is the glowing center **Versa AGi** (product hub), with **Executive** as a distinct Organization node near center — or is **Executive** the geometric center of the whole graph?  
2. **Organization edge label:** Confirm flat rim label text is exactly **`Organization`** (zone name), while hub reads **`Versa AGi`**.  
3. **Agents:** With **Active Agents** / **Agent Status** removed, where should agents appear in this ERD (Users only, Organization node, Collaboration node, or Environmental/Service)?  
4. **Branch vs Locations:** Is **Branch** always a legal subsidiary entity, while **Locations** are address-book places (a Branch may *have* Locations)?  
5. **Product vs Integrations:** Confirm Integrations are always nested under Product (not a separate Environmental node).  
6. **Position vocabulary:** “Front / back / left / right / top / bottom” — lock to camera-relative layout at default orbit, or world axes with fixed auto-rotate?  
7. **Implementation timing:** Document-only for now, or open a build iteration (e.g. I5.5) for web-dev after you accept this keystone?

---

## 8. Does this make sense? (COA synthesis)

**Yes.** The model is coherent:

- **Organization** = *how we run*  
- **Collaboration** = *who we run with*  
- **Environmental** = *the world and assets we run in / on / through*  

The zone UI pattern (configure same-level links + reach across zones) is the right bridge from 3D ERD to real screens. Remapping Projects/Tasks under Executive and Integrations under Product simplifies nav and matches an executive operating system rather than an “agent status dashboard.”

Main risks to resolve before build: **hub vs Executive**, **home for Agents**, and **whether Collaboration needs a fifth node**.

---

## 9. Suggested next steps

| Step | Owner | Action |
|------|-------|--------|
| 1 | Stephen | Accept or amend this keystone; answer §7 |
| 2 | COA | Revise this file to v1.1 after answers |
| 3 | COA | When accepted, write web-dev handoff (e.g. I5.5) from this doc only |
| 4 | web-dev | Implement 3D + nav remapping per accepted keystone; I7 remains closed until explicitly opened |

---

## 10. Change log

| Date | Change |
|------|--------|
| 2026-07-18 | Initial keystone documented from Stephen’s Mission Control 3D / ERD direction (COA). |

---

*End of keystone document.*
