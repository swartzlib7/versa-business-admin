# Versa - Business Admin — User Manual

**Product:** Versa - Business Admin (VBA)  
**Audience:** Staff who **use** VBA after it is installed — Administrators and members working in Records, Organization, Environment, Statistics, Settings, and the public site.  
**Status:** §4 Statistics, §7 Page Builder, §8 Assets, documents and mileage, and §9 Jobs, estimates, invoices and bills are written. Sections 1–3, 5 and 6 stay planned.  
**Ops (install / configure / maintain / enhance):** [`BUSINESS_ADMIN_OPS_MANUAL.md`](BUSINESS_ADMIN_OPS_MANUAL.md)  
**Implement / enhance (forms, listings, twin, deploy):** [`WORKING_WITH_VBA.md`](WORKING_WITH_VBA.md)

This file is the staff how-to. It is **not** the Versa AGi agent/operator Ops Manual.

Agents and operators who install or upgrade VBA stay in the Ops Manual and the host skill `business_admin`.

Terms in this chapter match Glossary → **Page Builder**.

## Planned sections (TBD)

1. Sign in and roles (Admin vs member) — link out to Ops §1.5 for the operator detail  
2. Operator chrome (zones, listings, Records Editor)  
3. Organization, Collaboration, Environment  
4. Statistics — written below  
5. Settings (Modes, Appearance, E-Mail Delivery, API). Appearance is your staff theme on this device  
6. Public homepage (as a visitor)

## 4. Statistics

Sidebar → **Custom Records** → **Statistics**. A statistic is one thing you count over time, such as parts produced a day or letters out a week. Each statistic has one graph.

A statistic has two parts:

- **Header**: its settings (name, scale, frequency, target).
- **Values**: one number per step, such as one per day.

The header decides which steps exist. You only ever change the values.

### Make a statistic

Click **New Record**. The form has the same four sections as Edit.

| Section | Field | What it means |
|---------|-------|---------------|
| **Statistic** | **Name** | What you count |
| | **Series mode** | **Dynamic Series** starts a new period when the current one is full. **Single Series** keeps one period only |
| **Scale** | **Scale Name** | The unit, printed up the left side of the graph (optional) |
| | **Scale Low** / **Scale High** | The lowest and highest value you expect in one step. Values outside them are refused |
| | **Scale Division** | The gap between the numbers up the left side. Typing Scale High fills in a suggestion while this field is empty. Your own value is never replaced |
| **Frequency** | **Frequency type** | How often you count: Hour, Day, Week, Month, and so on |
| | **Frequency start** | Worked out from Start datetime and Frequency type. Read-only |
| | **Frequency quantity** | Steps in one period. Day × 7 is a week of days |
| | **Start datetime** | When the first step starts. It defaults to now |
| | **Period target** | The quota for one whole period, such as 98 parts a week (optional) |
| | **Target per Day** (or Week, Month…) | Period target ÷ Frequency quantity (98 ÷ 7 = 14). Read-only |
| **Audit** | **Created By** / **Last Modified By** | Filled in for you |

The Spatial Twin draws the graph while you fill in the form. Click **Add to table** to save. The first period's steps are created empty, ready for values.

### Open, view and edit

- **Click a row** to open it. Click it again to close it.
- **Edit** on the row (or in the open header) changes the header. **Cancel** leaves the row open.
- The **Graph** radio at the start of a row shows that statistic in the Spatial Twin without opening it.

### Enter values

Open the statistic. The values card under the header has two views. Switch with **Table** | **Enhanced UI** at the top of the card. VBA remembers your choice on this browser.

| View | How it works |
|------|--------------|
| **Table** | One row per step, with the step (e.g. Mon), its Stamp, and a **Value** box. Type in the box, then press **Enter** or click away to save. **Esc** undoes your typing. Filter, Columns and the column headings sort and filter as on every listing. **Add row** adds a step: pick it from the list and enter its value. The **trash** icon at the end of a row deletes that row, after you confirm |
| **Enhanced UI** | Every period in the table, one under the other, each headed with its dates (and Met, Short and Needed when a Period target is set). One box per step, labelled like the graph, with the step's date and time under it. **Enter** saves and moves to the next step, into the next period after the last step. The box with the colored outline is the next empty step. A **dashed** box is a step with no row (for example one you deleted): typing a value adds the row |

Every value box has **up and down arrows**:

- Click an arrow to go up or down one step.
- Hold an arrow to keep going.
- Press an arrow and drag up or down to change the number quickly.
- The Up and Down keys work too. Hold Shift to move ten at a time.

**0 and empty are different.** 0 is a value: it counts toward Met and is drawn at the bottom of the graph. An empty step is a gap: it is not drawn, and the catch-up pace starts after the last filled step.

To **clear** a value, click the **trash** icon at the top right of its box in Enhanced UI (only boxes with a value have one). In Table, empty the Value box and press Enter. The step stays, empty.

To **delete** a row (a step entered by mistake, or a period you do not want), use the trash icon on that row in **Table**. The step and its value are removed. Use **Add row** to put a step back.

In Enhanced UI, "Saved …" and any error (such as a value outside the scale) show in the card header, so the boxes never change size.

**Periods.** With **Dynamic Series**, filling the last step of a period opens the next period: Enhanced UI shows it as a new set of dashed boxes at the bottom. Values typed there belong to that next period, not the first one. With **Single Series**, there is one period only.

While you type in Enhanced UI, the Spatial Twin shows the period you are in and redraws as you type.

Values can also come from a script through the capture API. See the Ops Manual for the endpoint and sign-in.

### Fed from records

A statistic can fill its own values from other records, for example **monthly business miles** from the Vehicle Mileage Logs (§8). Open the statistic, click **Edit**, and fill in the **Source** section:

| Field | What it means |
|-------|---------------|
| **Source record type** | The "Header and lines" type to read, e.g. Vehicle Mileage Logs |
| **Source record** | One record of that type (one vehicle's log), or empty for all of them |
| **Date field** | The lines field with the date. Each line counts in the step its date falls in |
| **Value field** | The lines field to total per step, e.g. Miles. Empty counts the lines instead |
| **Only lines where** / **equals** | Optional. Only lines where this field matches, e.g. Business use is ticked (`true`) |

Save. The values appear straight away and update whenever those records change. A step between two steps with data shows 0. While a statistic is fed from records its values card is read-only. Clear Source record type to enter values by hand again.

### Read the graph

The Spatial Twin (right side; on a phone, the **Spatial twin** tab at the bottom) shows the statistic you picked.

| On the graph | Meaning |
|--------------|---------|
| Plain line and dots (text color) | Your values. A blank step leaves a gap |
| Blue line, **T** number | Target per step |
| Orange dashed line and circles | What each remaining step needs to reach the Period target. Shown on the period still being filled in. If it is above Scale High it stays at the top edge with its number |

Under one graph, four boxes show:

- **Quota**: the Period target.
- **Met**: the total so far. A blank step between filled steps counts as 0.
- **Short** (or **Over**): how far you are from the quota.
- **Needed**: the amount per step for the steps that are left.

**1 / 2 / 4 / 8 / 12** shows that many periods at once. **‹ ›** page through them. **Lightbox** opens the graph full screen.

The app draws the statistic; it does not judge it. Reading the trend is up to you.

Page Builder Statistics Cells draw the same graph on visitor pages (§7).

## 7. Page Builder

Sidebar → **Page Builder** (`/page-builder`). Site chrome that used to sit under Settings lives here.

### Tabs (left to right)

| Tab | What you do |
|-----|-------------|
| **Branding** | Name, color, logo, Headline (Brand / Logo / Cycle Strip). Headline is the visitor footer title. Cycle Strip is the six homepage steps (number, label, description, on/off). It is not a record |
| **Canvas** | Compose visitor pages, list pairings, and list Rendering Drivers |
| **Menu** | **Operator** sidebar items, or **Public** header/footer links. Off hides the item and turns the route off. Settings stays on |
| **Sky Animation** | Visitor sky. It stays as first rendered until a full page refresh |

### Canvas

| Sub-tab | What you do |
|---------|-------------|
| **Configuration** | Primary Canvas URL is `/` (slug locked). Its Label is editable and paints on the visitor Home link. Extra canvases are `/p/{slug}`. Plus on an empty Cell lists Element records (icon, Record type, Name) and binds one. **+ Add row** starts Off named `__blank__` — rename it before you can turn it On. Remove uses the same confirm as listings. Columns are 1 through 8. The toggle will not drop a column that already has an Element. X on an empty column removes it and lowers the count by one |
| **Elements** | Record selection for a driver. Do not delete an Element while a Cell still uses it |
| **Rendering Drivers** | Marries a record type with a display. **Record type** is a lookup (Contacts is `location`). **Code key** and Shape are locked. Recipes live in product code. **Status** Active is required for Canvas use — confirm if pairings exist before leaving Active or changing Record type. ID is auto and sits at the bottom. No Primary Org |

HTML Page cells choose a render option. **HTML block** paints the body. **Record card** paints the page title and body inside a card.

### Drivers and what they paint

| Driver | Render outputs | Shows |
|--------|----------------|-------|
| **Page header** | HTML block, Record card | One Pages record |
| **Statistics header** | Grid 1, 2, 4, 8, 12 | One statistic's graph, with its target line and catch-up pace when it has a Period target |
| **Location** | Location Card, Location with Map | One location |
| **Integration** | Table | Integrations with their vendor and logo |
| **Schedule** | Board | Schedules on a month calendar (this month, then any later months with custom or one-time dates) |
| **Inspections & Reports** | Table | Inspections and reports |
| **Project** | Table, Cards, **Gantt** | Projects. **Gantt** draws each project's tasks on a timeline, as on the staff Projects screen |
| **Transaction** | **Job and money** | One estimate or invoice: the estimate it came from (or the invoice made from it), the vendor bills its lines are matched to, the lines (unit cost, markup, price, actual cost, variance) and Subtotal, Cost, Margin, Margin % |
| **Asset** | **Asset card** | An asset's details, the names of its documents (visitors can't open them), and its latest vehicle mileage log with the latest trips |
| **Organization board** | **Divisions and records** | The seven divisions as columns, each with its hats (and who holds them), records, and, under Distribution, customers |
| **Contact** | Sign-up form | An email sign-up that saves a public Contact |

A visitor page shows whatever its Elements select, to anyone. Before binding **Transaction**, **Asset** or **Organization board** on a public canvas, check that those records may be public.

### Elements: One, Filter, All

An Element picks the records its driver paints: **One** record, **All** records of the type, or **Filter**: only records that match every condition in its Filter (JSON). Example, sample records only:

```json
[{ "field": "external_id", "op": "starts_with", "value": "ba_sample:" }]
```

`field` is a header field, or `name` / `status`. `op` is `eq` (the default), `ne`, `starts_with`, `contains`, `empty` or `not_empty`. Text matches ignore case. An empty Filter matches every record.

### Site menu

Each canvas has a **Site menu** toggle next to **Menu**. Off hides the site's top menu (the Primary canvas rows and the public links) on that canvas's page; Home, the canvas list and the canvas's own sub-menu stay. It is on by default, including on the Demo canvas.

### Row heading

Under a Row's height settings, **Row heading (visitor page)** adds text above the Row's Cells: a **Kicker** (small label), a **Headline**, a **Lead line**, and a **Note** (for example "Staff edit this in Executive → Projects"). Leave all four empty for no heading.

The component gallery is **Glossary → UI Components**, the tab after Org Board. `/ui-components` opens that tab.

Pages and Statistics records stay **Custom Records** (sidebar, above Records Editor). Inspections & Reports stay **Faculty → Communications**. Contacts stay **Distribution → Contacts**. Page Builder binds and paints those records; it is not their listing home. Cycle Strip is edited under Branding, not as a Custom record.

### Row height

Each visitor Row is one screen tall so the next control sits at the bottom, unless **Use** is **Fit content**: then the Row is as tall as what it shows.

| Control | What it changes |
|---------|-----------------|
| **Builder** drag | Height of the Cells on the Page Builder screen only |
| **px** / **viewport %** / **Use** | Height of the Cells on the visitor Page |

Pixels taller than the screen are cut down to that screen. A viewport percent is a share of the screen and is not cut again. Those two choices will not match each other. That is expected.

On a phone, a Row with several columns shows them one under the other. A pixel or viewport height then applies from desktop width up; on a phone each Cell gets a minimum height instead, so stacked Cells never overlap.

**Element configuration** under the Row starts collapsed. It opens and closes, and stays spaced below the bar either way. Statistics Cells set Grid (1, 2, 4, 8, 12), Page, and Pagination on display. Grid 8 is four columns by two rows. The date under each graph is that period’s start.

### The Demo canvas

With **Settings → Modes → Demo with Sample data** on, the visitor page `/p/demo` is a guided tour built from the sample records: Overview, Organization, Projects, Jobs and money, Statistics, Assets, Schedules, Knowledge and Contact. Every section says where staff edit those records. Its Elements use the sample-only Filter, so records you add yourself don't appear there. Open it from Page Builder → Canvas → **Demo**, or from the visitor menu.

Sample records are ordinary records: open the Bracket invoice, the van or the Board rollout project and change them, and the tour shows the change. Turning Demo off deletes every sample record, the van's files and the Demo canvas. Your own records, canvases and Primary stay.

When a Driver or Render output changes, update this chapter and Glossary → Page Builder.

## 8. Assets, documents and mileage

### Assets

Sidebar → **Organization** → **Treasury** → **Records, Assets and Materiel**. Besides Name, Status, Description and Notes, an asset has:

| Field | Use |
|-------|-----|
| **Asset category** | Vehicle, Equipment, Computer, Furniture or Other (edit the list in Records Editor → value set `asset_category`) |
| **VIN / Serial number** | The identifier to search by |
| **Purchase date**, **Purchase price**, **Business use %** | What the tax records need |
| **Current odometer**, **Next service due** | Kept up to date at each check-in |
| **Documents & Photos** | The paperwork (see below) |

### Documents & Photos (Attachments)

An Attachments field holds up to **10 files of up to 20 MB** each: PDF, Word, Excel, CSV, text, ZIP and pictures (including iPhone HEIC). Click **Add files** and pick one or more.

- Pictures show as a small thumbnail; other files show an icon with the name and size.
- Click a file to open it. PDFs and pictures open in the browser; other files download. The download arrow always downloads.
- The **×** removes the file from this record. The stored file is kept, so cancelling the edit loses nothing.

Admins can add more file types in Records Editor → value set `file_mime`, and add an Attachments field to any record type (data type **Attachments**).

### Vehicle Mileage Logs

Sidebar → **Custom Records** → **Vehicle Mileage Logs** (moved from Treasury in 1.0.16). Each log links to its vehicle in Treasury → Records, Assets and Materiel. Keep **one log per vehicle per tax year**.

1. Click **New Record**. Fill in the **Log** section: Name (e.g. Ranger 2026 log), **Vehicle** (picks from Records, Assets and Materiel), Tax year and Starting odometer.
2. Open the log and add a line for each trip or day: Date, Start / End odometer (optional), **Miles**, **Business use** (tick for business), **Business** (which organization the trip was for) and **Purpose / destination** (who, where and why, as the tax authority asks).
3. The **Totals** section works itself out on every save: **Total miles**, **Business miles** and **Business use %**.

Monthly odometer readings can go in as lines too, so the log keeps a reading even in a month with few trips.

### Summary fields

Total miles and the other totals are **Summary** fields. An admin can add one to any "Header and lines" type in Records Editor (data type **Summary**): choose the total (sum, count, smallest, largest, average), the lines field, optionally only lines where a field matches, or show it as a percentage of another Summary field.

### Quick entry by an agent or script

An agent can add a trip without opening the screen: `POST /api/records/<log id>/lines` with `{ "data": { "trip_date": "2026-11-19", "trip_miles": 42, "trip_business": true, "trip_purpose": "Client visit" } }`. The totals and any statistic fed from the log update at once. Settings → API lists every endpoint.

## 9. Jobs, estimates, invoices and bills

A job runs: **customer → project → estimate → invoice**, with the parts bought from vendors on **bills**. Each record stays in its own zone and links to the others.

| Record | Where | Links to |
|--------|-------|----------|
| Customer, Vendor | Collaboration (organizations of type Customer or Vendor) | — |
| Project | Organization → Executive → **Projects** | **Customer** |
| Estimate, Invoice, Bill | Organization → Treasury → **Transactions** (Document kind) | **Project**, Counterparty (customer or vendor) |

### Estimate with a bill of materials

1. Treasury → Transactions → **New Record**: Document kind **Estimate**, Counterparty = the customer, **Project** = the job.
2. Open it and add a line per part: Description, Quantity, **Vendor**, **Unit cost** (what the vendor charges you, their tax and shipping included) and, if you like, **Markup %**.
3. **Unit price** works itself out: Unit cost × (1 + Markup %). Type a price instead and yours stays. **Line total** is Quantity × Unit price, unless you type one. **Line cost** is Quantity × Unit cost.
4. The header shows **Subtotal** (the line totals), **Cost total** (the line costs), **Margin** and **Margin %**. **Amount** is Subtotal + Tax.

Values update while you type and again when you save.

### Convert to invoice

When the customer approves, open the estimate and click **Convert to invoice**. VBA copies it into a new draft **Invoice** ("Bracket estimate" becomes "Bracket invoice") and marks the estimate **Converted**. The customer's prices are now fixed on the invoice.

An estimate that came from Wave (it has an External ID) can't be converted in VBA; convert it in Wave.

### The vendor's bill

When you order, enter what the vendor actually charged: Treasury → Transactions → **New Record**, Document kind **Bill**, Classification Disbursement, Counterparty = the vendor, the same **Project**, and the **Amount** (their tax included). Lines are optional.

Then open the **invoice** and, on each line the bill covered, pick it in **Vendor bill**. **Actual cost** (this line's share of the bill) starts at the line cost; change it when the bill differs. **Variance** shows Actual cost − Line cost.

The bill shows **Allocated** (the shares taken so far) and **Remaining**. VBA refuses a save that would take a bill past its total ("PrintParts bill 4471 has 1.50 left to allocate…"), and you can't lower a bill's Amount below what is allocated. One bill can cover lines on several invoices.

### Clone

**Clone** (next to Edit, on any record) makes a "Copy of …" with all its lines, ready to edit: a project for a repeat job, last month's bill, an invoice for a similar order. A copied transaction starts as a draft, and its lines are not linked to any bill.

### Linked from

Under an open record, **Linked from** lists the records that point to it. On a project: its estimates, invoices and bills, with totals per kind (estimate, invoice, bill), so quoted and actual cost sit side by side. On a bill: the invoices whose lines it covers.

### Formulas and calculated defaults

The calculations above are ordinary fields an admin can add to any record type in **Records Editor**:

- **Formula** field: always calculated, read-only. Uses fields of the same header (or the same line), numbers, `+ - * /`, brackets, comparisons (`= <> < > <= >=`) and `SUM`, `ROUND`, `MIN`, `MAX`, `IF`, `FIRST`. Example: `IF(subtotal > 0, ROUND(margin / subtotal * 100, 1), 0)`.
- **Calculated default** on a Number or Currency field: the field follows a formula until someone types a different value; clear it to follow again.
- **Summary** field: totals a lines field on the header (§8).
- **Only offer records where…** on a Lookup field: e.g. Vendor offers only organizations of type Vendor.

A statistic can graph money too: in its Source section choose **Read from: Records**, Source record type Transactions, Date field Date, Value field Amount, Only lines where Document kind equals `invoice` - invoiced per month (§4).


## 10. Integrations between installs (1.0.20)

An **Integration** links this install with another system. Today the other system is another VBA install, for example your office install and your public site. Everything lives under **Collaboration → Vendor**: **Credentials**, **Integrations** and **Exchange**.

### Push or pull

| Direction | Mode | What happens |
|---|---|---|
| Send | Push | This install sends changes to the other one, as they happen |
| Receive | Push | The other install sends changes here |
| Send | Pull | The other install asks this one for what changed |
| Receive | Pull | This install asks the other one, every so often (**Every (seconds)**) |

Use **pull** when the install that wants the records has no public address (an office install can pull from a public site; the public site cannot reach the office).

### Set one up

1. On the install that will be **called** (it receives pushes, or answers pulls): make a **Credential** with Auth type **Access token**, then press **Issue token**. Copy the token: it is shown once. Make an **Integration** with the right Direction and Mode, pick that Credential, and add a line per record type.
2. On the install that **calls**: make a Credential with Auth type **Access token** and Configuration `{"token": "<the token>"}` (it is stored encrypted and shows as `••••••`). Make the matching Integration: the other Direction, the same Mode, the other install's address in **Partner address**, that Credential, the same record types.
3. Push: press **Resend all** once on the sender, so what already exists goes across. Pull: the first pull fetches everything that matches.

### Which records go across: filters

Each line of an Integration names one record type and has a **Filter**: conditions that must all be true. No conditions means every record of that type.

- **equals**, **is not**, **contains**, **starts with**, **is empty**, **is not empty**
- **is one of**: a list separated by commas, on any field, IDs included, for example to send four named statistics
- **on or after**, **before**: dates, including **Created** and **Last modified**

On a receiving Integration the filter decides what is kept; anything else is listed in Exchange as *Skipped (filter)*.

### What you see

- **Exchange**: every record and statistic value that went out or came in, and what happened: OK, Skipped, Pending (will try again) or Error (with the reason).
- On the Integration: **Last run**, **Last result** (what was sent; for a pull, the window it asked about and how many records were new, so you can see it move forward even when nothing changed), **Last error**, **Run now**, **Resend all** (push) or **Pull everything again** (pull). After five failed sends in a row, or if the other install refuses the token, the Integration switches itself to **Error** and keeps everything waiting. Fix the cause and set it back to **Active**.
- A record that came from an integration says **Kept in step by an integration**: the other install wins, so changes you make here are replaced on the next sync.
- **A delete on the other install never deletes your copy.** The copy says **Deleted at the source on …** and stays. A deleted statistic value stays too.
- Statistic values never land on the wrong day: if someone changed the copy's Frequency or Start, values are refused (Error, "Header settings differ"); **Resend all** on the sender puts the copy right.

### Tokens

- A token is shown once. To replace it, press **Issue token** again: the old one stops at once, so paste the new one on the other side straight away.
- To stop a token, set its Credential's Status to **Archived**.
- Each token acts as a **System** account (Users → System). It never signs in; what it writes is recorded under its name.
- A script that posts statistic values uses a token too (`Authorization: Bearer …`). Email and password sign-in for scripts was removed in 1.0.20.

### Who may use a Credential

A Credential keeps a secret (an API key, a mailbox password) encrypted. Nobody sees it on screen, administrators included. A Credential has a **Users** list below its details: the people and agents whose scripts may use it.

- **Add someone:** open the Credential, **New Record** in the Users list, pick the person or agent, **Update row**. Remove the line to take it away; it takes effect at once.
- **Last used** on each line shows when that person or agent last used it.
- An agent that is not on the list is refused and told to ask you. Add it only if that agent's work needs the secret.
- An agent's script signs in with the agent's own account, so there is nothing else to set up for it.
