# ERD Review — Alignment Confirmation (2026-08-31)

Stephen — all six messages processed. Restating to confirm we are aligned before I redraft the review document.

## 1. The senior pattern (your design correction)

Every element like Policy is a **record TYPE holding many record instances** — each instance carries its own header fields (title, scope, owner, summary, dates) plus its own lines. Not one header config with lines hanging off it.

- Record definitions can **look up to other record definitions**:
  - **Master-detail** — deleting the parent takes its children with it.
  - **Plain lookup** — children are orphaned and remain.
- System record types come **preconfigured and locked** (cannot be removed).
- Users create **custom record types and lookups through the same mechanism** and land them anywhere in the three-zone structure (three-zone only, for now).

This also resolves the vendor problem: Vendor becomes a **list of vendor records**, each with its own contacts / contracts / integrations — same for customer, partner, branch. Label rule: unique within an element, reusable across elements.

## 2. Locked from your review

| Item | Decision |
|---|---|
| Branch line groups | Contacts only (staff = a type of contact; sub-branches out) |
| Policy fields | Created / last-modified / review / effective datetimes + optional new-version checkbox |
| Treasury lines | Accounts, transactions, budgets (purchase orders deferred — your call later) |
| Public | Contacts list |
| Communications | Messages list (typed) |
| Dissemination | Campaigns — relatable to parties + environment nodes |
| Production | Product & service — referenced by quotes, invoices, campaigns |
| Qualification | Quality-control records relating to all organization-zone children |
| Executive Policy/Projects/Tasks | One-to-many to all four parties AND all four environment nodes |
| Environment nodes | Stay lists (Locations, Events, Knowledge, Schedules) |
| Record relations | **Horizon 1 — locked** (foundation) |
| Cross-element relatability section | Held — you will revisit after these changes settle |

## 3. What realigns in the current implementation

- Policy tab currently renders as a single header form with lines → becomes **list → detail** (many policy records, each with its own header + lines).
- Same correction applies to Projects, Tasks, Product, Service, Integrations, and the four parties.
- Lookup / master-detail becomes a first-class capability of record definitions (Horizon 1).

## 4. Next

Redrafting the ERD review document around the multi-record + lookup pattern and sending it for your review. No blocking questions — I will flag anything ambiguous the moment I hit it.
