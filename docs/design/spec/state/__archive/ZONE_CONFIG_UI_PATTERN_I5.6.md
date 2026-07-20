# Zone Config UI Pattern (I5.6.10)

**Status:** Active design pattern for Mission Control zone config mocks  
**Source:** Stephen Nortje direction 2026-07-19  
**Implements:** `src/components/zones/zone-config-view.tsx` + `src/lib/zones/zone-definitions.ts`

## Purpose

One reusable operational UI pattern across Collaboration, Environment, and most Organization faculties so the app feels consistent before real persistence lands.

## Nested parent self-tab (I5.6.9)

When a top-level tab has `children`, `ZoneConfigView` synthesizes a **parent self/default** sub-tab first:

- Same `id` and **same label** as the parent (not "Self")
- Shows the parent fields / listing
- Children follow (e.g. Executive · Policy · Projects · Tasks; Vendor · Integrations; Production · Product · Service)

Default selection is always the parent self-tab.

## Presentation modes

| Mode | When | UI |
|------|------|----|
| `listing` | Multi-entity catalogs (vendors, locations, events, …) | Polished data table + **New** + row **Edit** |
| `form` | Single-record / special design (Executive tree for now) | Field grid + Save draft mock |

Set via `presentation?: "form" | "listing"` on each `ZoneTab`.

## Listing pattern (default for entity sub-tabs)

1. **Table** — columns from `listColumns` (or first fields), multi-line cell text, hover row, empty state.
2. **New button** — opens a **collapsible inline form under the table header** (not a modal, not a separate page).
3. **Add to table** — appends a mock row client-side (no persistence).
4. **Edit** — expands a collapsible form **inline on that table row** (same row / next row span), prefilled; **Update row** writes back. Does **not** jump the form to the top of the page.
5. **Cancel / Close** — collapses the form without a route change.

Optional: `sampleRows` seeds demo data. Prefer **no** "Open … list" deep links on zone panels when the listing already lives on the zone page.

## Where it applies (I5.6.10)

- **Collaboration:** Vendor (self listing) + Integrations (listing); Customer, Partner, Branch listings.
- **Environment:** Locations, Events, Knowledge, Schedules listings.
- **Organization:** Communications, Dissemination, Treasury, Production (self + Product + Service), Qualification listings.
- **Organization Executive:** parent **self** may stay **form**; **Policy / Projects / Tasks** use **listing** with row-inline edit (I5.6.11).

## Explicit non-goals (this mock)

- No API persistence, auth-scoped CRUD, or validation beyond UI affordances.
- No modal dialogs for create/edit (collapsible form is the standard).
- Executive feature chrome is deferred.

## Related

- ERD / zone membership: `MISSION_CONTROL_ZONE_ERD_I5.6.md`
- 3D hub twin: dashboard Mission Control scene
