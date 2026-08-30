# State: Zone Pages Live Dynamic Records Integration (I5.6.32 Slice 1 residual)

> **Role:** Sole go-to for wiring live dynamic records into baked-in zone tabs.
> **Product:** versa-admin-system (Mission Control) - Project #26 - Game #109

| Field | Value |
|-------|-------|
| **Feature** | I5.6.32 Slice 1 residual - baked-in zone tabs live records |
| **Status** | Gate 1 discovery plan delivered 2026-08-30; awaiting COA lock of implementation slice |
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

All other zone surfaces (Public, Communications, Dissemination, Treasury, Qualification, Customer, Partner, Branch, Locations, Events, Knowledge, Schedules) have no baked listing children - they render the Configuration form plus any editor-created record-type tabs (already live).

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
| Empty DB means empty tables where mocks showed 2-3 rows | Acceptable: live-but-empty beats mock rows; fallback columns from baked definitions; COA may prefer a seed-instances option - flag for decision |
| Baked tab id to type api_name mapping drift | Single mapping table in record-type-tabs.ts; single commit; beta only |
| Records Editor field management on system types | Fields editable (zone roles/columns) - feature not bug; delete-protected only |
| ERD proposal (2f53a31) may change storage | Build on shipped schema per COA; ERD is with Stephen; slice is fixture-layer, no DB migration |

## 3. Out of scope

- Production deployment (beta only per COA discipline).
- I5.6.33 ERD proposal (with Stephen).
- Option B typed-table migration (policy/service/integration objects).

## 4. Change Log

| Date | Change |
|---|---|
| 2026-08-30 | Gate 1 discovery plan delivered: mock-vs-live map, Option A proposal (seed 6 system types + wire baked tabs), risks. Awaiting COA lock. |
