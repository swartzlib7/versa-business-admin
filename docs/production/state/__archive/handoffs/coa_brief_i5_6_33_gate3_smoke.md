# I5.6.33 — Consolidated Smoke Brief (Gate 3)

**For:** Stephen | **Via:** COA | **Date:** 2026-09-01
**Where:** Beta site (port 3200) — version 0.7.71 (see sidebar footer)
**Covers:** The complete I5.6.33 train. Every slice is delivered, independently reviewed (Gate 2), and merged to beta: structure corrections + list-to-detail views (A), policy list-to-detail (B), 15 new record types + value sets (C), organizations extension + collaboration rendering (D), core persistence (E1), org auto-preset + executive relations (E2), custom types + integrations cutover (F), branding persistence + renames (Settings), final integration pass (G).

## How to review
Log in and walk the checklist. Everything runs on beta with sample-friendly data — create, edit, and delete freely; nothing touches production. One item needs your eyes specifically (marked with a star).

## 1. Mission Control hub — THE INTERACTIVE CHECK
- The 3D scene now fills to the bottom of the window (your round-2 item 1); it previously stopped at a fixed height.
- This is the one item automated checks cannot confirm — the scene renders live in your browser. Please confirm the fill on your laptop.
- On a very short window the scene keeps a minimum height and the page scrolls — intended graceful behavior.

## 2. Universal list shape (no more header/config forms)
- Every tab across all zones is now a list of records; click a row to open its detail view with optional line items.
- Check: Policy, Projects, Tasks (Executive), Products and Services (Production).

## 3. New record types across divisions
- Communications: Messages, Reports, Staff
- Distribution (renamed from Public): Contacts
- Dissemination: Sales, Promotion and Marketing
- Treasury: Transactions (income or disbursement), Records, Assets, Materiel
- Qualifications: Examinations, Reviews, Certifications and Awards
- Environment elements: Locations, Events, Knowledge, Schedules
- Check: each tab lists records; create one or two; sub-tab labels now match their own division (the earlier off-by-one mislabeling is fixed).

## 4. Collaboration zone — real organizations
- Vendor, Customer, Partner, and Branch tabs render live organization records (mock data removed).
- Branch shows only branches belonging to your default organization.
- Check: create an organization under Executive, set its type, and see it appear under the matching collaboration tab.

## 5. Organizations and your default org
- New fields: person flag, organization type (vendor, customer, partner, branch, internal), parent organization (setting it makes the org a branch).
- The Executive tab hosts the full organizations list with create/edit/delete, plus your personal default-organization setting.
- Check: set your default org — new records elsewhere auto-fill their organization from it (still editable per record).

## 6. Executive relations
- Policy, Projects, and Tasks records can link to organizations and to other records.
- Links show in both directions on detail pages, with clickable deep-links into the Records Editor.
- Check: open a policy, add a relation to an organization, then view it from the organization side too.

## 7. Vendor integrations (structure change)
- The standalone vendor-integration type is retired. Integrations are now line items attached to vendor organizations.
- Check: Executive, Vendors, Integrations child tab — pick a vendor and add integration lines.

## 8. Custom record types
- Create your own record types in the Records Editor; labels must be unique within their division.
- Check: create a custom type, add fields, then create a record of it.

## 9. Records Editor field form
- Data types are labeled and grouped (Text, Numeric, Date and time, Choice, Relation).
- Value set appears only for picklist types; Lookup object only for lookup.
- Lookups carry a delete-rule choice: cascade or orphan (orphan is the default).

## 10. Settings — Branding now actually works
- Change the brand name and color, press Save, then hard-refresh: the new brand appears on the login page and sidebar without a server restart.
- Known: on beta the branding store is in-memory, so it resets if the server restarts; the database path is durable.

## 11. The rename
- Configuration is now Records everywhere: zone sub-tabs, Glossary, Users, Records Editor, Settings. Tab addresses (deep links) are unchanged.

## Accepted limitations (not bugs)
- Boolean fields group under Numeric in the editor's type list (cosmetic).
- Branding applies to identity surfaces (sidebar, login, settings); deeper theme colors remain static for now.
- Beta branding resets on server restart (in-memory mode).

## What I need from you
- The hub-height confirmation (item 1) — the only check needing your eyes.
- Overall acceptance of the train, or a list of anything that looks wrong.
