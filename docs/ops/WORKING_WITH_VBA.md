# Working with Versa - Business Admin

**Product:** Versa - Business Admin (VBA)  
**Audience:** Agents and humans **implementing or enhancing** VBA on a local or customer install.  
**Install, host, upgrade:** [`BUSINESS_ADMIN_OPS_MANUAL.md`](BUSINESS_ADMIN_OPS_MANUAL.md)  
**Staff how-to:** [`BUSINESS_ADMIN_USER_MANUAL.md`](BUSINESS_ADMIN_USER_MANUAL.md) (planned)

Use this file when you change operator forms, listings, Spatial Twin, or a running `next start` process. Form/listing rules are standing product rules — not optional polish.

---

## 0. How to use

| You need to… | Go to |
|--------------|--------|
| Required fields, lookups, header vs lines, layouts | §1 |
| Spatial Twin / lightbox / graph pager | §2 |
| Where a capability lives in the chrome | §3 |
| Why the UI did not change after git pull | §4 |
| Checklist before claiming done | §5 |
| What not to do | §6 |

Host skills (Versa AGi, not this repo): `business_admin` (install) and `business_admin_operate` (API / operate). Both point here and at the Ops Manual.

---

## 1. Forms and listings

### 1.1 Required fields

- Catalog `is_required: true` must be visible on the control: label + `*` (asterisk).
- Required applies only to fields **on the form being submitted**.
- Header create / instances “Add to table”: validate **header-zone** required fields only. Never require `zone_role=list` fields (line value, line slot) before the header exists.
- Lines editor: validate **list-zone** required fields only. If there is no header id yet, stop with “Save the header first, then add lines.” — do not complain about a line field the operator cannot fill yet.
- Do not mark platform stamp fields required. The platform stamps them: **ID**, **Created By**, **Last Modified By**, **Created Date**, **Last Modified Date**.
- Every **new record type / table** starts with the locked defaults (labels / api names): ID (`id`), Name (`name`), External ID (`external_id`), Created By (`created_by` → user), Last Modified By (`last_modified_by` → user), Created Date (`created_at`), Last Modified Date (`updated_at`). Name is the only required field in that set. Extra lookups to existing objects need a follow-up interview.

### 1.2 Lookups

- `data_type=lookup` renders as a **lookup control**, never a free-text box.
- `lookup_object_api_name=user` → user picker (name + email), value stored as the user id.
- Created By / Last Modified By are **session-stamped audit fields**, not pickers. The logged-in user (UI or API) is the value: create stamps both; every save restamps Last Modified By. The operator cannot assign another user. Show them read-only with the person’s name.
- Created Date / Last Modified Date / ID are the same class: stamped, read-only. External ID is operator-editable.
- Do not show raw ids in the listing when a display name is available.

### 1.3 Dependent fields

When field B’s legal values or control type depend on field A:

- B is a **dependent picklist / control**, not a generic text box.
- Changing A clears B if the current B value is no longer valid.
- Statistics **Frequency start** is **derived** from **Start datetime** + **Frequency type**. It is a disabled/read-only field — not a second clock the operator types.
  - `sec` / `min` / `hour` → that unit from the datetime
  - `day` → weekday of the datetime (Sun…Sat)
  - `week` → `W/E <day> <Month>` of the datetime
  - `month` → `<Month> <year>`
  - `year` → 4-digit year
  - `decade` → decade year (…2010, 2020, 2030…)
  - `date` → `8 June 2026`
  - `datetime` → `8 June 2026 @ 13:00:00`
- Changing Start datetime or Frequency type recalculates Frequency start. The label carries an info tooltip: “From Start datetime and Frequency type.” Shared derive + parse live in `src/lib/statistics/frequency.ts`.

### 1.4 Header vs lines (structure `header_lines`)

- One header = one graph (or one parent record). Lines are children.
- The operator creates the **header first**, then captures lines (UI or API).
- List-zone required fields must not appear on the header create form.
- Leftover system fields from a prior model are **hidden** (`active: false`), never left on the form. Hide-not-delete. Do not invent a second meaning for an old `api_name`.
- Statistics **lines** table: `line_value` is labeled **Value**; `line_slot` is labeled with the header’s Frequency type (e.g. Day). **Stamp** is the header Start datetime advanced by series/slot — system-stamped, visible, not editable. Duplicate stamps are refused. After a line Update or a header Save, stamps refresh in the table without a page reload. Default order is Stamp datetime (ascending). Values display to **two decimal places** (DB may store more).
- **Seeding**: creating a statistic header pre-seeds one line per configured frequency slot (series 1). Empty values are reserved slots, not graph points. The listing and graph both read `stat_line` (not generic `record_line`).
- Frequency values that already have a **captured value** are disabled in the picklist and refused on save (`SLOT_TAKEN`). Empty seeds stay available. **New** defaults the picklist to the next open frequency value. **Single Series**: no further add once every slot has a value. **Dynamic Series**: allow a new series after the window is full of values.
- Statistics does not use a “Back to …” link. Click a header row to **expand it in place** (header **view** + lines). Click again to collapse. Do not append sibling panels below the list.
- **One editor.** Listing **Edit** expands that same row and puts the header into **edit** mode. Do not open a second inline “Edit Record” form. The Edit control inside the view is the same FormPanel, not a different editor.
- **Cancel** on the header row (or the form footer) leaves the row **expanded in view**. It does not collapse. Collapse is row-click (or explicit close of the expand).
- Lines **inline editor** is a real form. **Enter** in a single-line field submits the same as **Update row** / **Add to table**. Cancel stays a button (does not submit). Textareas still use Enter for a new line.
- **Graph:** clicking a header row or its **Graph** radio loads that header in Spatial Twin. Radio can change the graph without collapsing the open row.

### 1.5 View vs edit layouts

Every presented record has two layouts, edited in Records Editor → **Layout**:

- **Detail** — read-only view when the record is expanded or opened.
- **Edit** — fields when the operator is creating or editing.

Do not render the edit layout while the operator is only viewing. If no saved Detail layout exists, use the catalog default (same field set, view mode). Operators change arrangement in Layout (**Edit layout** vs **Detail layout**), not by inventing a third surface. The Type row (Layout) and expanded Type view (Open layout) link to that type’s Layout. Empty cells are allowed — including an empty top row. Moving or removing a field leaves a hole; neighbors do not pack into the vacated cell. The runtime Edit/Detail form uses the same column count and holes as the Layout Editor (4-col stays 4-col). The canvas has a drop row above and below the fields. Drag a field from one section onto another. Statistics scale fields: **Scale Name** (rotated on the graph), **Scale Low**, **Scale High**, **Scale Division**. Frequency start is derived and read-only. Under the frequency ticks: `quantity - Type - start` (e.g. `7 - Day - 2026-09-10T00:00`).

---

## 2. Spatial Twin

The right-hand Spatial Twin pane is a **system slot**, not only a 3D view. It is **wired to each record type the zone presents**. That wiring follows the **sub-tab strip** as well as the element tabs: the selected tab/child id is the twin’s focus.

- **Default element list** = hub spheres on the 3D graph (Location, Event, Knowledge, Schedule, and the Organization / Collaboration spheres). Those show the 3D twin, focused on that sphere.
- **Not on the default list** — including Statistics and **custom record types added during development** — still own the slot. Until a sphere exists for that id, the slot hosts a **feature preview** (Statistics = live graph as the header is filled). Do not leave the slot empty or fall back to an unrelated sphere.
- The caption (`Spatial Twin · … [Full 3D Hub]`) sits **directly under** the twin box (not inside it, not at the bottom of the page column).
- **Lightbox**: top-right inside the box, same chrome as the hub **View** control (Front / Left / Angle) — padded chip, icon + “Lightbox”, **65% transparent** so preview copy under it stays readable. Opens the **current** twin (3D or preview) at about **90% of the screen**. Escape, backdrop click, or Close dismisses it. Graph pager and **1 / 2 / 4 / 8 / 12** sit **center bottom inside the Spatial Twin box** (and again in the lightbox, with Close). The Lightbox chip stays top-right. Lightbox **1-box** graph is drawn at **90%** of the frame so the plot has margin.
- Statistics graphs: one graph per period (series) of header-configured frequency slots. Count periods from available line data. Spatial Twin and lightbox paginate; lightbox also has previous/next and a **1 / 2 / 4 / 8 / 12** multi-graph grid. **4** is 2×2, **8** is 4×2, **12** is 4×3 in the lightbox; empty periods stay as open dashed cells (do not collapse the grid).
- **Sticky chrome**: on every sub-tab with a table, the table body scrolls under sticky column headings. When a Spatial Twin is present, the twin and its collapse/expand stay on the page (`sticky`) while that content scrolls. `data-slot="card"` keeps **min-height 640px** and grows with the viewport. Nested Layout Editor cards (sections, unassigned pool, preview) use `size="hug"` so they stay one compact row when empty and grow with fields.

---

## 3. Placement

- A capability lives in **one** operator place. If it is a zone sub-tab, it is not also a sidebar Menu item.
- Hidden menu item ⇒ route disabled (redirect or 404). Do not leave a second entry that shows the old mock fields.

---

## 4. Show the change (stale UI / deploy)

Two different problems. Do not mix them.

### 4.1 Frozen production build

`next start` serves whatever is in the **`.next` folder at last `npm run build`**. Git checkout / new commits **do not** update `.next` or restart the process. Health can be 200 while the UI is old.

**Fix:** from the app root, on the intended ref:

```bash
npm run build
# stop the exact PID from: ss -tlnp | grep <port>
# never pkill -f
npx next start -p 3200
```

The default listen port is often **3200**. Use the port the Primary User named.

Required on every deploy: **build + restart** (or replace the container). No extra daemon.

### 4.2 Browser / CDN caching HTML shells

Chrome can keep long-lived prerender HTML. Mitigated in `next.config.ts`: HTML routes `no-store`; hashed `/_next/static/*` stay immutable. After deploys: hard-refresh once if a tab was open across the cutover.

### 4.3 Why this is the mode, not a Next.js mystery

| Mode | Behavior |
|------|----------|
| `next dev` | Hot reload; source changes appear |
| `next start` | Serves last build only — correct for prod-like review **if** rebuild + restart is part of the path |

Production uses the same model as `next start` (or a container that builds at image build time). Stale UI there means **the deploy skipped rebuild/restart**.

### 4.4 Repeatable deploy unit

1. Checkout/ref (tag or SHA)
2. `npm ci` (when the lockfile changes)
3. `npm run build`
4. Atomic restart of the process
5. Health check (`GET /api/health` in its own call — root `/` may stall)
6. Browser hard-refresh once

Optional later: expose a build id / git SHA in health or a footer so humans can confirm the new build. Background jobs or websockets for *board data* are separate from deploy staleness.

### 4.5 Production posture

- Immutable artifact per release (image or build dir named by SHA)
- New release = new artifact + process replace (do not edit files under a long-lived `next start`)
- Cache-Control as in `next.config.ts` (HTML no-store; static hashed immutable)
- Invalidate a CDN only if one sits in front
- Smoke after deploy: `/api/health` version matches `package.json`

---

## 5. Before claiming done

**Forms / listings / twin**

- Required asterisks visible on every required control on that form.
- Header Add-to-table succeeds without line fields filled.
- Lookups are pickers. Platform stamp fields are read-only; user lookups follow the logged-in user.
- Dependent controls match the parent field.
- `npx tsc --noEmit` + scoped eslint + `npm run build` (Ops Manual §4).

**Running process**

- [ ] Intended HEAD (`git rev-parse --short HEAD`)
- [ ] `.next` newer than that commit (or a fresh `npm run build`)
- [ ] `next start` started **after** that build
- [ ] `GET /api/health` is 200 in its own call
- [ ] Browser hard-refresh once
- [ ] Smoke the changed surface (listing, form, Spatial Twin)

---

## 6. Anti-patterns

- Requiring line fields to create a header
- Text input for a user lookup
- Text input for Frequency start when Frequency type is known
- Leaving Unit / Category / Scale / Series (legacy flat stats) visible after the header+lines model shipped
- A Statistics sidebar page plus a zone tab showing different fields
- Letting the operator pick Created By / Last Modified By instead of stamping the session user
- Inventing extra lookups on a new record type without the follow-up interview
- Listing Statistics lines from generic `record_line` while capture writes `stat_line`
- A listing Edit form plus a different Edit inside the expanded view
- Showing the Edit layout while the operator is only viewing the record
- Expecting `git pull` alone to change a `next start` UI

---

## 7. Incident log (historical)

| When | Symptom | Cause | Remedy |
|------|---------|-------|--------|
| 2026-07-25 | No visible UI change on a `next start` board | Stale `.next` + long-lived process | rebuild + restart; hard-refresh |
| Earlier 0.7.52→0.7.53 | Blank login in Chrome | Cached HTML shells | Cache-Control headers in `next.config.ts` |
