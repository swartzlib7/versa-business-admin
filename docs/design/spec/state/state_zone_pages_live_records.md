# State: Zone Pages Live Dynamic Records Integration (I5.6.32 Slice 1 residual)

> **Role:** Sole go-to for wiring live dynamic records into baked-in zone tabs.
> **Product:** versa-admin-system (Mission Control) - Project #26 - Game #109

| Field | Value |
|-------|-------|
| **Feature** | I5.6.32 Slice 1 residual - baked-in zone tabs live records |
| **Status** | Implementation-locked slice delivered 2026-08-30 (Gate 1 implementation); awaiting COA Gate 2 |
| **Task** | #218 |

---

## 1. Why

Task #218 (created 2026-07-28) predates the J1-J4 to O1-O2 Records Editor arc (Task #235, closed 2026-08-29). The brief premise - zone pages render mock/static table records - is now only partially true: editor-created record-type tabs have been live since 28d04d3 (2026-07-28). The residual gap is the six baked-in listing tabs.

## 2. Discovery findings (2026-08-30, branch agent/web-dev @ 2f53a31)

### 2.1 What is already live

| Surface | Mechanism | Since |
|---|---|---|
| Editor-created record-type tabs (all 15 parents, 3 zones) | recordTypeApiName set in applyRecordTypesToTab; ListingPanel/FormPanel fetch /api/records?type+parent_kind+parent | 28d04d3 (2026-07-28) |
| Parent Configuration sub-tab (all parents) | FormPanel with links to Records Editor | I5.6.9 |
| Records API | GET/POST/PATCH/DELETE with type/parent_kind/parent filters | shipped |
| Records Editor | Create/edit/retire types + fields with zone roles, columns, layouts | #235 closed 2026-08-29 |

### 2.2 What still renders mocks

All six baked-in listing tabs (no recordTypeApiName, isDynamic=false, seedRows mock + session-local add/edit):

| Zone | Parent | Baked tab | Mock columns | Mock rows |
|---|---|---|---|---|
| Organization | Executive | Policy | Policy title, Scope, Owner | 2 |
| Organization | Executive | Projects | Project name, Status, Owner | 2 |
| Organization | Executive | Tasks (baked) | Task title, Status, Assignee | 2 |
| Organization | Production | Product | Name, Kind | 2 |
| Organization | Production | Service | Name, Status | 2 |
| Collaboration | Vendor | Integrations | Integration name, Kind, Status | 3 |

All other zone surfaces (Public, Communications, Dissemination, Treasury, Qualification) have no baked listing children - they render the Configuration form plus any editor-created record-type tabs (already live).

**Amendment 1 (COA review, 2026-08-30):** 8 PARENT tabs are themselves presentation:listing with sampleRows mocks and remain mock under this slice: vendor, customer, partner, branch, locations, events, knowledge, schedules (zone-definitions.ts ~lines 323-557). They are a named out-of-scope residual - see section 3.

### 2.3 Why they were left mock

1. **No backing record types.** Seed types array is empty (Slice 2.1 #220 removed unspec faculty seed types); types exist only when created via Records Editor.
2. **No backing objects.** Catalog has 4 core typed objects (user, project, task, product); policy/service/integration have no object definitions.
3. **No backing tables.** Baseline ERD (locked 2026-07-20) covers User, Organization, Department, Project, Task, Party, Location, Event, KnowledgeAsset, Schedule, Product, Service, Integration, Policy - but Phase 2 DB cutover is held; runtime is fixture-layer.

### 2.4 Options considered

| Option | Approach | Pros | Cons | Verdict |
|---|---|---|---|---|
| A | Seed 6 system record types (is_system=true) + wire baked tabs to them | Minimal UI change; reuses proven dynamic path | Types appear in Records Editor (is_system rows are delete-protected, records-editor.tsx line 449); needs seed + wiring + sampleRows cleanup | **RECOMMENDED** |
| B | Wire baked tabs directly to core objects (project/task/product) | True typed tables for 3 of 6 | Policy/Service/Integrations have no objects; two data models in one UI; larger blast radius | Not now |
| C | Leave baked tabs mock; document as illustrative | Zero risk | Leaves the #218 gap open | Not now |

### 2.5 Proposed bounded slice (Option A)

1. **Seed 6 system record types** (is_system=true, active, show_as_tab=false) in record-types.ts seed array:
   - executive_policy (header_lines, faculty:executive) - fields: Policy title (header), Scope (header, picklist policy_scope), Owner (header), Summary (header, long_text)
   - executive_project (list, faculty:executive) - fields: Project name, Status (picklist zone_project_status), Owner, Description
   - executive_task (list, faculty:executive) - fields: Task title, Status (picklist zone_task_status), Assignee, Notes
   - production_product (list, faculty:production) - fields: Name, Category (picklist product_category), Description
   - production_service (list, faculty:production) - fields: Name, Status (picklist service_status), Description
   - vendor_integration (list, collaboration:vendor) - fields: Integration name, Kind (picklist integration_kind), Status (picklist integration_status), Notes
2. **Wire baked tabs** in record-type-tabs.ts: map baked tab id to system type api_name; when the system type exists, set recordTypeApiName/objectApiName/parentKind/parentApiName on the baked tab and drop sampleRows so ListingPanel goes live.
3. **Cleanup:** remove sampleRows from the 6 baked tabs in zone-definitions.ts (mock data out of definitions); keep fields/listColumns as fallback when catalog fields are empty.
4. **Validation:** tsc --noEmit, npm run build, no new eslint; manual smoke on :3200 (beta only).

### 2.6 Risks

| Risk | Mitigation |
|---|---|
| System types appear in Records Editor and confuse Stephen | is_system rows are delete-protected (records-editor.tsx line 449); clear labeling; show_as_tab=false keeps them out of zone tab injection (baked tabs already render) |
| Empty DB means empty tables where mocks showed 2-3 rows | Acceptable: live-but-empty beats mock rows; fallback columns from baked definitions. COA decision (Amendment 2, 2026-08-30): NO seed instances - tables start empty by design |
| Baked tab id to type api_name mapping drift | Single mapping table in record-type-tabs.ts; single commit; beta only |
| Records Editor field management on system types | Fields editable (zone roles/columns) - feature not bug; delete-protected only |
| ERD proposal (2f53a31) may change storage | Build on shipped schema per COA; ERD is with Stephen; slice is fixture-layer, no DB migration |

## 3. Out of scope

- Production deployment (beta only per COA discipline).
- I5.6.33 ERD proposal (with Stephen).
- Option B typed-table migration (policy/service/integration objects).
- **8-parent listing-tab residual (Amendment 1):** vendor, customer, partner, branch, locations, events, knowledge, schedules stay mock in this slice. Follow-up slice proposal: seed 8 more system record types (vendor_integration is taken; e.g. vendor, customer, partner, branch, location, event, knowledge_asset, schedule) OR wire to core objects where they exist in the baseline ERD (Party covers customer/partner/vendor, Location, Event, KnowledgeAsset, Schedule). Do NOT expand the locked slice to cover them.

## 4. Change Log

| Date | Change |
|---|---|
| 2026-08-30 | Gate 1 discovery plan delivered: mock-vs-live map, Option A proposal (seed 6 system types + wire baked tabs), risks. Awaiting COA lock. |
| 2026-08-30 | COA review PASS with 2 amendments; implementation slice LOCKED and delivered: 6 system types seeded (record-types.ts), 24 fields seeded (catalog.ts facultyRecordFieldSeed, 7 value sets), baked tabs wired via BAKED_TAB_SYSTEM_TYPES in record-type-tabs.ts (structure carried; wiring runs before show_as_tab early return), sampleRows removed from the 6 baked children. Amendment 1 doc fix + 8-parent residual added to Out of scope; Amendment 2 no-seed-instances recorded. |
| 2026-08-31 | I5.6.33 Slice A (rev E §7.2/§7.3/§4.2) delivered on top of #218 — see §5. |

## 5. I5.6.33 Slice A — rev E structure corrections + list→detail (2026-08-31)

Scope per COA scope lock (rev E d4659b7 §7.2/§7.3/§4.2; rulings D1/D2/D3 approved).

### 5.1 Delivered

1. **Structure corrections (§7.2):** executive_project, executive_task, production_product,
   production_service move `list` → `header_lines` in record-types.ts (policy already
   header_lines; vendor_integration stays `list` per D1 until the C3 vendor-lines slice).
2. **Catalog re-roling:** existing fields on the 4 objects re-roled `zone_role: 'header'`
   (deterministic, #218 pattern); line fields seeded per rev A §4.2 first group per type —
   Projects = milestones (milestone_title, milestone_date), Tasks = subtasks (subtask_title,
   subtask_done), Product = variants (variant_name, variant_price), Service = rate lines
   (rate_item, rate_amount) — all `zone_role: 'list'` + `show_in_column: true`, policy
   line-field pattern.
3. **Fixture lines model (§4.2):** `RecordInstanceLine.line_group?: string` (optional,
   backward-compatible); create/update inputs take wrapped lines
   `{ line_group?, data }`; API routes re-typed to match. Group api_name derived from the
   first list-zone field prefix (milestones / subtasks / variants; rate_ → default group
   since 'rates' is not a spec group name); policy keeps its legacy default group. Per D2
   the group key is populated from the start so multi-group later is a pure addition.
4. **List→detail views (§7.3):** TabPanel renders list→detail for the 4 corrected types
   (policy keeps direct header+lines rendering per D3; vendor_integration stays a plain
   list per D1). List view = instance list (header fields as columns, record-level
   Add/Edit/Delete); row click opens detail view = header FormPanel editing that record
   (GET/PATCH by id) + lines ListingPanel bound to it, with a Back control. TabPanel is
   keyed per tab+child so detail state resets on navigation. ListingPanel gained
   `viewMode` ('instances' | 'lines') + `onRowOpen`; EntityListing gained `onRowOpen`
   (row click ignores clicks on action controls). Detail-view lines fetch targets the
   bound record by id (not first-instance assumption).

### 5.2 Validation

tsc --noEmit clean; npm run build clean; eslint: no new errors (1 pre-existing
set-state-in-effect error + pre-existing warnings unchanged); 42-assertion tsx fixture
sanity pass (structures, re-roling, line groups, wrapped-lines create/update, baked-tab
wiring). Single Gate 1 commit on agent/web-dev re-based on d4659b7.

### 5.3 Out of scope (unchanged)

vendor_integration → vendor lines migration (C3 slice); multi-group lines UI (Horizon 1
record_line persistence); policy rendering unification (Stephen's Gate 3 call); 8 parent
tabs wiring (next zone-pages slice).
