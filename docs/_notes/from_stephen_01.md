# Notes from Stephen

General design guidance for `Versa AGi - Mission`.

* The system must have it's own database and ERD.
* The system must have a secure login facility with RBAC.
* The system must have a public facing frontend when users are not signed in.
  * This is the website aspect of the system.
  * It does not have to be a CMS.
  * It will be navigated over LAN and later via HTTPS.
* The system must use secure and extensible pre-built components when possible.
  * This is a preference, not a rule.
  * Outcomes are senior to this princple.
* The system must be familliar to the end users.
  * The system is therefore not to be confused with an Agent management system by adding Agentic structure or UI elements to it.
  * There must not be any separation of agents over users in the UI besides for a `type` field ("agent", "human").
  * Business users will access the system and agents can be asked to participate thus being granted a credential by the system administrator when needed.
  * We are building an isolated system, that the business staff will man and customers may access later.
* Any projects, or documents are completely seperate to Versa AGi. If created data inside this sytem need to be used in Versa AGi then an agent can obtain it and use it or we can build an integration for it using the API and a Versa AGi Script Task to automate the retrieval.

These system boundaries must be made abundantly clear in the design and to any agents working in the system.

A document review is now required to align to this document.

P.S. I love the 3D animation you guys made!


Thank you,

Stephen Nortje
Founder:
+ VersaVoice AI
+ Versa AGi


---

## 2026-07-18 addendum (COA — from Stephen follow-up)

Captured fully in `docs/specs/MISSION_CONTROL_ERD_KEYSTONE.md` v1.1:

- AI Agents are **only a Type of user** in this product; no agent-wise UI (agitop territory).
- Mission Control = **business**; agitop = Versa AGi internal mission control.
- agitop Organization may be turned off when using this product; migration out of scope for now — document in system information.
- Organization departments laid out as **spheres** (Executive and others are departments).
- Locations = address book; Branches = subsidiaries; Integrations always under Product.
