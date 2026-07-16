# Alignment checklist - Stephen note (2026-07-16)

Use before accepting any new mission-control slice.

| # | Requirement | Spec / plan status | Build status |
|---|-------------|--------------------|--------------|
| 1 | Own database + ERD | Documented in PRODUCT_SPEC 1.1 | Not started (fixture/API only) |
| 2 | Secure login + RBAC | Documented in PRODUCT_SPEC 1.1 | Placeholder only |
| 3 | Public FE when signed out | Documented; website track elevated to required surface | Not started |
| 4 | Prefer pre-built secure components | Preference noted | Ongoing |
| 5 | Familiar business UI - not agent-management chrome | Boundary locked | Seed UI still uses Agents/Projects labels - reframe next |
| 6 | Users and agents differ only by type | Boundary locked | Fixture model may still imply host agents - revise |
| 7 | Product data separate from host Versa AGi | Boundary locked | Adapter design must stay portable/API-based |
| 8 | Integration to host only via product API / Script Tasks | Boundary locked | API contract exists; host scripts later |

**COA next:** finish language pass on PRODUCT_SPEC surfaces + API_CONTRACT naming; propose I3 only as every-customer capability that respects this table.
