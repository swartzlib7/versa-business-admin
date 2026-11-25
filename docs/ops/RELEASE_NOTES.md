# Versa - Business Admin — Release notes

**Product:** Versa - Business Admin (VBA)  
**Current:** 1.0.20 (2026-11-24)

Health check: `GET /api/health` returns this version from `package.json`.

## 1.0.20 — integrations and access tokens

Three migrations (`0021`–`0023`): run `npm run db:migrate` as on every upgrade. Catalog seed pack `1.0.20-r3`. Back up first with `npm run backup`. Upgrade steps are in the Ops Manual, section 5.2.17. **Coming from 1.0.17 or older: set the data key before the first start (Ops Manual 5.2.15).**

- **Breaking: HTTP Basic sign-in is gone.** Scripts that post statistic values with an email and password (`curl -u …`) get `401` with a message pointing here. Give them an access token instead (below). Basic skipped the sign-in check that slows password guessing, so it had to go.
- **Access tokens.** A Credential with Auth type **Access token** has an **Issue token** button. The token is shown once, with a Copy button; VBA keeps only a fingerprint of it. Issuing again ends the old token at once; setting the Credential to Archived stops it. Each token acts as its own **System** account (Users → System), which never signs in. A token works only where its Integration allows: the record types on its lines, and only the records its filters let through. Ten bad tokens in a minute from one address wait a minute.
- **Integrations between two VBA installs.** Collaboration → Vendor → **Integrations** now runs:
  - **Direction** (send or receive) and **Mode** (push or pull), so records can go either way, started from either side. Your LAN install can **pull** from versa-agi.com without a public address.
  - **One line per record type**, each with a **Filter** built from that type's fields: equals, is not, contains, starts with, is empty, **is one of** (a comma-separated list, on any field, IDs too), **on or after** and **before** (dates, including Created and Last modified).
  - Statistics go across with their values. A value can never land on the wrong day: if the two sides' statistic settings differ, the value is refused and the reason shown.
  - **A delete at the source never deletes your copy.** The copy says "Deleted at the source on …" and stays; a deleted value stays too, marked.
  - A received copy says it is kept in step by an integration: the source wins, so edits there are replaced on the next sync.
  - **Run now**, **Resend all** (push) and **Pull everything again** (pull) on the Integration. **Every (seconds)** sets how often it runs; **Last run**, **Last result** and **Last error** show how it went. Last result says what was sent, or for a pull which window it covered (from the last successful run's edge to the partner's "now", in the partner's clock) and how many records were new: the window rolls forward even when nothing changed.
  - Changes VBA makes itself go across too: a vendor bill re-totalled because an invoice line now uses it, an estimate marked Converted. Five failed sends in a row, or a refused token, set it to **Error** and keep everything queued.
- **Credentials can be used by named people and agents.** A Credential now has a **Users** list. A person or agent on it, signed in with their own account, can fetch the secret from a script (`GET /api/credentials/<id>/secret`), so an agent's script uses the stored vendor key instead of a copy pasted into the script. Anyone not on the list, administrators included, is refused and told to ask the Primary User. Screens still show the secret to no one. Each use sets **Last used** on that person's line.
- **Exchange** (Collaboration → Vendor → Exchange) lists every record and value that went out or came in, and what happened to it: ok, skipped (filter), pending (will retry) or error (with the reason). An Integration's Exchange rows are also under "Linked from" on the Integration.
- **The old Integrations page is gone.** It showed example data, not your records. Anything found in its table, or in the old integration lines on vendors, is now an Integration record with status Standby and a note saying where it came from.
- **Public access templates.** `deploy/nginx/vba.conf` and `deploy/caddy/Caddyfile`: HTTPS, the headers VBA needs, 25 MB uploads, `www` redirect, the app on 127.0.0.1 only. Ops Manual section 2.9.
- Element filters (Page Builder) gain the same three conditions: is one of, on or after, before.

## 1.0.19

No new migration; still run `npm run db:migrate`. Catalog seed pack stays `1.0.16-r1`. Back up first with `npm run backup`. Upgrade steps are in the Ops Manual, section 5.2.16. **Coming from 1.0.17 or older: set the data key before the first start (Ops Manual 5.2.15).** Release this after the Versa AGi release that ships the Installer and Runner: the comparison pages name them as available.

- **The Versa pages are part of the default site.** Seven pages, each a canvas: **The Versa story** (`/p/story`), the three chapters **The communicator** (`/p/communicator`), **The ecosystem** (`/p/ecosystem`) and **The network** (`/p/network`), the two comparisons **Analysis** (`/p/analysis`, now OpenClaw, Hermes Agent and Versa AGi on a counted scorecard) and **Versa and the AI platforms** (`/p/platforms`), and **The founder** (`/p/vision`). They link to each other and stay inside your site; only the manuals link to versavoice.ai. The founder photo ships with VBA.
- **The menu lists the story page and the founder page.** The other five are one step from the story page. Analysis is no longer in the menu.
- **Four home slides follow the website.** Technical Overview is a short overview of the three layers with one link to the story; Capabilities has the new sandboxing text; the Founder slide links to the founder page; Landscape shows the counted chart and links to both comparisons.
- **Existing installs get all of this at start-up.** New pages and canvases are added once; a canvas you delete stays deleted. A page or a canvas setting you changed is kept, and the server log names it. Before, only pages you already had were updated.
- **Pages follow your theme button.** A full HTML page with its own light and dark design now follows the site's theme (Light and Dusk show its light design; Slate, Dark and Architect its dark one). Before, it followed the visitor's computer setting.
- **Links to a section of a page work** (for example the story page's "The founder" button).
- **Up to 12 canvases** (was 4).
- **Backups leave the data key out.** `npm run backup` copies `.env.local` without its `VBA_DATA_KEY` line, so a backup never carries the key to its own secrets. Keep the key apart.
- A canvas that is not in the menu shows "Home > its name" in the bar under the header when you are on it, instead of a lone "-".

## 1.0.18 — security fix

**Upgrade every install.** No migration; still run `npm run db:migrate`. Catalog seed pack stays `1.0.16-r1`. Upgrade steps are in the Ops Manual, section 5.2.15. **Before the first start, set the data key** (`VBA_DATA_KEY` in `.env.local`, commands in 5.2.15) and keep a copy apart from the server and its backups.

- **Fixed: any signed-in user could read stored passwords.** Up to 1.0.17 a Credential's Configuration (for example the system mailbox password) was stored as plain text and sent in full to every signed-in user, member or administrator, through the records API. Secret fields are now **encrypted in the database** and **never sent by the API**, to anyone.
- **What you see:** in a Credential's Configuration, passwords, tokens and keys show as `••••••`; the rest (host, port, user name) shows as before. To change a password, type the new one in place of `••••••`. Saving the form with `••••••` left in keeps the stored password. A clone of a Credential does not copy its secrets.
- **The first start encrypts** every Credential stored before 1.0.18. Nothing to do by hand; the server log says how many.
- **The key** lives in `.data/data-key` (created on first start, readable only by the app's user), or in the optional `VBA_DATA_KEY` setting (64 hexadecimal characters). `npm run backup` does not copy it: **keep a copy of the key apart from your backups.** Without it, stored credentials cannot be read and must be typed in again (system mail stops until then).
- Scripts and agents that read a Credential through the API now get `••••••` for its secrets. VBA's own mail sender reads the real value on the server.

## 1.0.17 — security fix

**Upgrade every install, public ones first.** No migration; still run `npm run db:migrate`. Catalog seed pack stays `1.0.16-r1`. Upgrade steps are in the Ops Manual, section 5.2.14.

- **Fixed: sign-in sessions could be forged.** Up to 1.0.16 the session cookie was plain encoded text that the server trusted as written, so anyone who wrote their own cookie with an administrator role was treated as an administrator by the API and the staff screens. Sessions are now signed with a secret only the server holds, carry an expiry, and are checked on every request; a cookie that is unsigned, altered or expired is refused.
- **Everyone signs in again once** after the upgrade: sessions made by earlier versions are no longer accepted.
- The secret lives in `.data/session-secret` (created on first start, readable only by the app's user), or in the optional `VBA_SESSION_SECRET` setting. Keep `.data` in place across upgrades; losing the secret only signs everyone out.
- The request gate moved from `src/middleware.ts` to `src/proxy.ts` (the Next.js 16 name). It now runs in the server's own runtime and checks the signature too.

## 1.0.16

No new migration; still run `npm run db:migrate` as on every upgrade. Catalog seed pack is `1.0.16-r1`. Back up first with `npm run backup`. Upgrade steps are in the Ops Manual, section 5.2.13.

- **The Demo canvas (`/p/demo`) is a guided tour** of what VBA does, one section per capability: an opening section, the **Organization board** (divisions, hats and who holds them, records), **Projects** as a Gantt chart, **Jobs and money** (estimate → invoice → vendor bill, lines, margin), **Statistics** (target and catch-up pace, and one statistic filled from the mileage log), **Assets and mileage** (a van with its documents and trips), **Schedules**, **Knowledge** and **Contact**. Each section says where staff edit it.
- New per-canvas setting **Site menu** (Page Builder → Canvas, next to Menu): Off hides the site's top menu on that canvas's page, keeping Home, the canvas list and the canvas's own sub-menu. On by default, including on the Demo canvas.
- **The demo shows sample records only.** A project or schedule you add yourself no longer appears on the Demo canvas.
- **More sample data** with Demo on: a vendor (Acme Metal Supply), a product, a promotion, a review, a converted estimate with its invoice and a vendor bill matched to the job lines, a van with three documents, a mileage log, and a "Business miles" statistic read from it. Sample records go through the same save pipeline as any other record, so their totals and margins are worked out by VBA. Dates follow the install date, so the project, trips and statistics always look current. Demo off removes all of it, including the van's files.
- **New Page Builder drivers:** **Organization board** (divisions with their hats and records), **Transaction → Job and money** (one estimate or invoice with its source, its vendor bills, lines and totals), **Asset → Asset card** (details, document names, latest mileage log), and **Project → Gantt** (the staff Gantt chart on the visitor page). They show in the Spatial Twin and the Cell previews too.
- **Vehicle Mileage Logs moved to Custom Records** (sidebar → Custom Records), next to Pages and Statistics. Custom Records now shows a tab for every type filed there, not only Statistics and Pages. A log is a pre-configured record that points at its vehicle in Treasury → Records, Assets and Materiel; it is not a Treasury tab. Existing logs move with it; nothing else changes (same fields, same API type `treasury_vehicle_mileage_log`, same statistics sources).
- **Technical Overview tells the Versa story.** It opens with the three chapters, in the order the products were built: **the communicator** (VersaVoice AI), **the ecosystem** (Versa AGi) and **the Unified Global Production Network** (both together), each linking to its page on versavoice.ai, with a link to the whole story. Chapter 3 follows up close: the network diagram of four nodes (Tokyo, New York, São Paulo, Johannesburg) meeting in VersaVoice AI and converging on shared human intent, and the three points it rests on.
- **Other Versa AGi pages follow the website.** **Capabilities** now says a VersaVoice account is required. **Deployment** shows the two-step install command and links to the Versa AGi and VersaVoice AI manuals. The styles page carries the new diagram styles.
- **Existing installs get these pages too.** At start-up, a Versa AGi page still exactly as an earlier release shipped it is replaced with this release's version. A page edited on the install is left as it is, and the server log names it.
- **Elements can filter.** An Element in **Filter** mode shows only the records that match its Filter, for example sample records only: `[{"field":"external_id","op":"starts_with","value":"ba_sample:"}]`. Ops: `eq`, `ne`, `starts_with`, `contains`, `empty`, `not_empty`. Integration, Schedule, Inspections, Project, Asset and Organization board Elements accept it, and the Element form's filter builder offers the new comparisons. Before, a saved Filter was ignored and every record showed.
- **Row headings.** A canvas Row can have a visitor heading: a kicker, a headline, a lead line and a note. Edit it under the Row's height settings (**Row heading (visitor page)**).
- **Phone fixes on visitor pages:** the canvas sub-menu is one line that scrolls sideways instead of wrapping over the page; tables scroll inside their card instead of being cut off; Cells in a fixed-height row with several columns no longer overlap when they stack; a Statistics grid of 2 or 4 stacks to one graph per line.
- Fixed: Schedule boards listed extra months out of order (this month first, then older ones). Months are now in calendar order.
- Fixed: sample statistics showed the month before their start in timezones west of UTC (the start was stored as UTC midnight).
- Fixed: `next build` with Demo on could add the sample pack to the database once per build worker (duplicate sample organizations). Start-up writes now wait for the first real start.
- Fixed: with Demo on, every restart rewrote sample records that link to other records (e.g. the Receptionist hat), undoing staff edits to them. A restart now only re-points those links.
- A Location map keeps a usable height in a row set to **Fit content**.
- Visitor header: between 1280 and 1536 pixels wide, where the full menu shows, a multi-word site name shows as its initials (e.g. **VBA**) so it no longer runs into the menu; hovering shows the full name.

## 1.0.15

No new migration; still run `npm run db:migrate` as on every upgrade. Catalog seed pack is `1.0.15-r1`. Back up first with `npm run backup`. Upgrade steps are in the Ops Manual, section 5.2.12.

- **Projects, estimates, invoices and bills are linked.** A Project has a **Customer**; a Transaction has a **Project** (one project, many transactions).
- **Bill of materials on Transactions.** Each line can carry Vendor, Unit cost and Markup %. **Unit price** follows Unit cost × (1 + Markup %) until you type a price; **Line total** follows Quantity × Unit price until you type a total; **Line cost** = Quantity × Unit cost. The header shows **Subtotal**, **Cost total**, **Margin** and **Margin %**. **Amount** follows Subtotal + Tax until you type an amount (a bill without lines).
- **Vendor bills.** New Document kind **Bill**. On an invoice line, pick the **Vendor bill** that covered it; **Actual cost** (that line's share of the bill) starts at the estimated cost, and **Variance** shows the difference. The bill shows **Allocated** and **Remaining**. A save that would take a bill past its total is refused, and a bill's Amount can't drop below what is allocated.
- **Convert to invoice** on a quote or estimate made in VBA: copies it into a draft invoice and marks the estimate Converted.
- **Clone** on any record: a "Copy of …" with its lines, ready to edit. A copy never takes another share of a bill.
- **Linked from** under every open record: the records that point to it, by type, with amounts totalled per document kind. On a project you see its estimates, invoices and bills; on a bill, the invoices that used it.
- New field type **Formula** (Records Editor): calculates from fields of the same header or line with + − × ÷, comparisons and SUM, ROUND, MIN, MAX, IF, FIRST. Number fields can have a **Calculated default** that follows a formula until someone types a value. Lookup fields can **only offer** records where a field matches (Vendor shows vendors only).
- Forms show calculated values **while you type**; the server works them out again on every save, for the screen, the API and agents alike.
- **Integrated records** (with an External ID, e.g. from Wave) keep what the integration wrote: no recalculation and no Convert. Clone is allowed and clears the External ID.
- A statistic **fed from records** can read the records' own fields (**Read from: Records**), e.g. invoiced amount per month by invoice date.
- Currency fields take numbers. Organization lookups show the organization's name in tables.
- **API:** `POST /api/records/<id>/clone`, `POST /api/records/<id>/convert`, `GET /api/records/<id>/linked`.

## 1.0.14

No new migration; still run `npm run db:migrate` as on every upgrade. Catalog seed pack is `1.0.14-r1`. Back up first with the new `npm run backup`. Upgrade steps are in the Ops Manual, section 5.2.11.

- New field type **Attachments**: any file type in the `file_mime` list (PDF, Word, Excel, CSV, text, ZIP, pictures including iPhone HEIC), up to 10 files of 20 MB each per field. Pictures show as thumbnails; other files show an icon, name and size, and open or download. Removing a file from a record keeps the stored file, so cancelling an edit never loses a document.
- New field type **Summary** for "Header and lines" records: a read-only total of a lines field (sum, count, smallest, largest, average), optionally only for lines where a field matches, or as a percentage of another summary. VBA works it out on every save.
- A **Lookup** field can point to any record type, system or custom. Forms show a record picker and tables show the record's name. Before, most targets fell back to a list of users.
- **Treasury → Records, Assets and Materiel** has Asset category, VIN / Serial number, Purchase date, Purchase price, Business use %, Current odometer, Next service due, and Documents & Photos.
- New **Treasury → Vehicle Mileage Logs**: one log per vehicle and tax year, one line per trip or day. Total miles, Business miles and Business use % are worked out from the lines.
- A statistic can be **fed from records**: in its new Source section, pick a record type, its date field and the field to total (or count lines), optionally only lines where a field matches. The values fill themselves per step and update when those records change; the values card is then read-only. Example: monthly business miles from the mileage logs.
- **API:** `POST /api/records/<id>/lines` adds lines to a record without resending the whole list (quick entry from an agent or script). `POST /api/statistics/<id>/refresh` recomputes a fed statistic. `POST /api/records/files` uploads an attachment.
- **Backups:** `npm run backup` saves the database, settings and (optionally) the uploads folder. The uploads folder can live anywhere (`VBA_UPLOADS_DIR`), for example a synced drive.
- Tables show dates as "18 Nov 2026" and checkboxes as Yes / No.
- A statistic graph with many steps (e.g. 12 months in the narrow Spatial Twin) shows every other date under it instead of overlapping them.
- Fixed: the Status help text for Rendering Drivers showed under Status on every record type.

## 1.0.13

No new migration; still run `npm run db:migrate` as on every upgrade. Catalog seed pack stays `1.0.12-r1`. Upgrade steps are in the Ops Manual, section 5.2.10.

- A statistic's **Table** view has **Add row** and a **trash** icon on every row. The trash deletes the row after you confirm, so a step entered by mistake can be removed.
- **Enhanced UI** shows every period, one under the other, with its dates and Met / Short / Needed. It has a box for every row in the table. A dashed box is a step with no row; typing a value adds it.
- The Spatial Twin shows the period you are typing in.
- Fixed: the Spatial Twin graph flickered (went blank, then redrew) each time a value was saved in Enhanced UI.
- Fixed: Enhanced UI opened on the newest period. When the first period was full, that was an empty second period, so values meant for the first period were saved as new rows in the second.
- Fixed: pressing Enter in a box with no row saved the value, then showed a false "already seeded" error.

## 1.0.12

No new migration, but still run `npm run db:migrate` before the new process serves traffic: it applies anything the install is missing, such as `0020` on an install below 1.0.9. Catalog seed pack is `1.0.12-r1`; the next start adds the Period target fields to Statistics. Upgrade steps are in the Ops Manual, section 5.2.9.

- A statistic can have a **Period target**: the quota for one period, such as 98 parts a week. It sits in the Frequency section. **Target per Day** (or Week, Month, …) is worked out from it and shown read-only.
- The graph draws the target as a blue line. On the period you are still filling in, an orange dashed line and dots show what each remaining step needs to reach the quota. A pace above Scale High stays at the top edge with its number printed, so the scale never changes.
- Under a single graph, the Spatial Twin and lightbox show **Quota**, **Met**, **Short** (or **Over**) and **Needed**. A blank step between filled steps counts as 0 toward Met.
- Page Builder Statistics Cells draw the same target line and pace.
- Typing Scale High fills in a suggested Scale Division while that field is empty. Your own value is never replaced.
- A statistic's values are edited in place. In the **Table** view, type in the Value cell and press Enter (or click away). There is no Edit form, no Update row, and no Delete on a value row, because the statistic's settings decide which rows exist. Empty a value to clear it.
- New **Enhanced UI** view for a statistic's values, next to **Table** on the values card: one cell per step for one period. Enter saves and moves to the next step, and a full period opens the next one. The Spatial Twin redraws as you type. Your choice of view is remembered.
- In Enhanced UI, each box with a value has a trash icon at the top right. It clears the value, leaving a gap on the graph. 0 is a value and is drawn as 0. "Saved" and error messages show in the card header, so the boxes keep their size.
- Value boxes have up and down arrows. Click for one step, hold to keep going, or press and drag up or down to change the number quickly. Arrow keys work too (Shift for ten at a time).
- **New Record** for a statistic (and the other header-and-lines types) shows the same sections as Edit, instead of one long list of fields.
- Fixed: on a Dynamic Series statistic, New Record put a value into a new period instead of the empty step you picked.
- Fixed: a browser warning about a repeated key when a statistic was open.
- Fixed: on the public homepage, the top of the logo was hidden under the header on shorter screens (for example a laptop or a browser that is not full height). The hero now starts below the header, the logo shrinks to fit a short screen, and on phones the headline wraps instead of running off both sides.
- Fixed: a statistic created or updated through the record API (`POST /api/records`, `PATCH /api/records/<id>`) was stored without Frequency start and Target per step. The API now fills them in the same way the screen does.
- Fixed: on a new install, `node scripts/seed.mjs` finished with an error about a missing `tasks` table. Tasks are Project task lines since 1.0.9; the summary now counts those.
- The User Manual has a Statistics chapter (§4).
- Fixed: a new statistic shows its live graph in the Spatial Twin again while you fill it in.
- Fixed: Start datetime and the date under the graph read like `31 Dec 2025 @ 19:00:00` instead of `2025-12-31T19:00`.
- Fixed: the graph fills the Spatial Twin better, and the last date label under it is no longer cut off.
- Fixed: on a phone, an open record fits the screen instead of running off the right edge.
- Fixed: the tab description shows once at the top, not again inside an open record, and an empty table no longer reads "No yet".

## 1.0.11

Bug fix. No new migration. Catalog seed pack stays `1.0.10-r1`. Upgrade steps are in the Ops Manual, section 5.2.8.

- The Spatial Twin is back on Custom Records → Statistics. Click a statistic’s row or its Graph button to see its graph. The panel had been missing there since Statistics moved to Custom Records in 1.0.7. Your statistics and their lines were not affected.

## 1.0.10

No new migration. Catalog seed pack is `1.0.10-r1`; the next start adds the Hats record type. Upgrade steps are in the Ops Manual, section 5.2.7.

- Executive has a Hats tab next to Projects. A hat holds the purposes, know-how, and duties of a post, the Staff who hold it, and up to 10 images.
- Purposes, Know-How, and Duties are numbered lists. Add, edit, remove, and drag entries into order.
- Records Editor has two new field types: Text list and Multi-lookup (link to several records).
- Every image in a gallery can carry a description.
- Pick a hat with its row button to see the write-up in the Spatial Twin. Images sit on their own page in a grid that grows with the count, up to 5 rows of 2.
- The Spatial Twin has a Print button for Hats and Project Gantts. It opens a print-ready page and the print dialog.

## 1.0.9

Run `npm run db:migrate` before the new process serves traffic. Migration `0020` moves existing Project milestones and Task records onto Project task lines. Upgrade steps are in the Ops Manual, section 5.2.6. Catalog seed pack is `1.0.9-r1`.

- A Project’s lines are its tasks. A task can sit under another task, up to five levels, from the Parent task field or by dragging the row. The old Task record type is removed after the migration copies it.
- Drag a task by its handle to reorder it, place it under the task above, or move it out. A label shows what letting go will do. Arrow keys work on a focused handle.
- Percent complete is a slider. Task notes use the rich text editor.
- Pick a Project in the Projects list with the Gantt button to see its summary and Gantt in the Spatial Twin.
- The Project Gantt shows a status header, task totals, status-colored bars with progress, overdue tasks, the target date, and today, and it fits a narrow Twin pane.
- `/api/tasks` returns task notes as `description` (rich text) and `descriptionText` (plain text).

## 1.0.8

Bug fix. No new migration. Catalog seed pack stays `1.0.6-r3`.

- The phone menu uses the current canvas rows. It no longer keeps old public-link names.

## 1.0.7

No new migration. Catalog seed pack stays `1.0.6-r3`.

- Remove logo clears the image. Menu, home, and footer show the site icon until a logo is chosen again.
- The visitor theme button cycles Light, Dusk, Slate, Dark, and Architect. Settings → Appearance sets the default site theme.
- Home page logo size is 25% to 150%. Menu and footer stay 75% to 125%.
- Statistics and Pages are Custom Records in the sidebar, above Records Editor.
- A Pages body opens as Raw HTML in CodeMirror. Rich text asks before TipTap removes tags.
- A saved layout keeps the ID field where you place it.
- Only one Location per Organization can have Primary address on. The footer Location belongs to the Primary Org.

## 1.0.6

Status fields are picklists. Catalog seed pack `1.0.6-r3`. The next start rebases system Status fields and adds Phone and Email on Location. No database migration.

- The visitor footer address, phone, and email come from the Location with Primary address on. A Primary location is created when none exists.

- Contacts and Credentials use Record status (Active, Archived).
- Products use Product status (Available, Beta, Coming soon).
- Distribution, Executive, Communications, Dissemination, Production, Qualification, and Treasury use Faculty status (Active, Standby, Connected).
- Vendor uses Vendor status (Active, Standby, Connected).
- Organization, Customer, Partner, and Branch use Record status.
- A new record type that does not declare Status receives Record status.

## 1.0.5

Account mail. Run `npm run db:migrate` before restart (`auth_token`).

- Password reset, email confirmation, and a welcome message with a temporary password send once the system mailbox is active.
- Forgot password is hidden on the sign-in page until a mailbox credential is assigned.
- An agent administrator can still set a password through the API without the mailbox.
- Catalog seed pack stays `1.0.4-r2`.

## 1.0.4

Canvas menus, SEO, full HTML pages, and visitor sign-up.

- A signed-in user can view the site while maintenance mode is on.
- A canvas can be one full HTML page.
- The Public menu follows canvas and row menu switches.
- Each canvas has SEO fields. `/sitemap.xml` and `/robots.txt` list the canvases.
- Sky Animation has a site switch and a per-canvas switch.
- Header and footer can be turned off on each canvas.
- Canvas width is percent or pixels. Margin is pixels.
- Custom canvases after the first confirm before they are deleted.
- Email sign-up: the Contact driver's Sign-up form saves each visitor email as a public Contact.
- Page styles: one Pages record can style every HTML row on a canvas.
- Rows can use a Fit content height.
- Demo mode adds its own Demo canvas. It never writes the Primary canvas or canvases staff made. Demo off removes the Demo canvas.
- The demo Showcase canvas is gone.
- A Full page HTML record can hold a sign-up form. The system wires it; page scripts stay off.
- HTML records never cover the site header.
- Section arrows and snap scrolling work on Fit content rows. Tall rows scroll normally.
- Branding → Footer has a Copyright name field.
- The mobile header shows more of the site name.
- New canvases start at 75% width and 48px margin, and 85% width and 16px margin on mobile.
- Renaming a canvas keeps the same canvas.
- `/sitemap.xml` and `/robots.txt` list full URLs.
- Page Builder tabs are Branding, Canvas, Menu, Sky Animation. Appearance moved to Settings.
- The whole public site is stored in Postgres (`site_settings.body`). One database backup carries it. Run `npm run db:migrate` when upgrading.
- A fresh install opens with the Versa AGi site: Primary slides, the Analysis canvas, styles, and menus.
- On phones and tablets, Fit content rows show all their content instead of one clipped screen. The footer link columns center on phones.
- Promotion & Marketing: the Description field is labeled Content. Posts can hold up to 10 images, with a preview.

## 1.0.3

Four more drivers paint on the visitor canvas. Record lists open inside the row.

### Drivers

| Driver | What a Cell can paint |
|--------|------------------------|
| **Integration** | A table: vendor logo, vendor, integration, kind, status. |
| **Schedule** | A calendar. Planned days are teal. Today is gold when that day is on the board. |
| **Inspections & Reports** | The canvas row is labeled **Support Requests**. The table is the inspection records: name, status, summary. |
| **Project** | A table (project fields and task count), or cards that open that project's tasks. |

Schedule records: one schedule per integration, a Location lookup, and Custom times can add another row.

### Canvas

- Canvas width, margin, and row width each have a desktop value and a mobile value (below 1024px).
- An HTML Page fills its cell.
- The Hero has no Contacts button. The Contacts row stays.
- Default row height is 650px.

### Records

- A record list expands the row and shows the form inside it.
- These detail screens are gone: `/projects/[id]`, `/tasks/[id]`, `/products/[id]`, `/users/[id]`, `/agents/[id]`. The record APIs stay. Users still edit on `/users`.

### Not in this release

DM-02, AUTH-01, the held statistics-twin item (**B**), and PB-09 / #299 are unchanged. Catalog seed stays `1.0.2-r3`.

## 1.0.2

Page Builder can ship a visitor site from three drivers, and Demo mode installs that site for you.

### Page Builder

Tabs, left to right: **Appearance**, **Branding**, **Menu**, **Canvas**, **Sky Animation**.

Under Canvas: **Configuration**, **Elements**, **Rendering Drivers**. The component gallery moved to **Glossary**, after Org Board. `/ui-components` opens that tab.

Three drivers are pairable:

| Driver | What a Cell can paint |
|--------|------------------------|
| **HTML Page** | **HTML block** (the body) or **Record card** (title plus body) |
| **Statistics** | A graph grid (1, 2, 4, 8, or 12). Grid 8 is four columns by two rows. Page and pagination sit on the Cell. The date under a graph is that period’s start. |
| **Location** | **Location Card**, or **Location with Map**. The choice is stored on the Cell, so one Element can be a card in one Cell and a map in another. |

Pages are edited with a visual editor (headings, marks, lists, quote, link) or as HTML source. The record still stores `body_html`.

A visitor row is one screen tall so the next control stays at the bottom. Staff set that height in pixels or as a viewport percent. Dragging a row in the builder only changes how tall it looks there. Element configuration under a row starts collapsed. Rows can be collapsed and reordered; that collapsed state is saved with the canvas. A new row starts collapsed. The last visible row has no bottom arrow and no line under it.

Custom canvases use the same cell controls as Primary, including the delete **X** once a row has more than one column.

### Demo with Sample data

Settings → Modes. One switch.

**On** installs the sample pack and binds it:

- Primary canvas: Facets, Integrations, Inspections & Reports, and Knowledge as HTML pages; Statistics as a four-graph cell; Contacts as a location with a map.
- Overview (`/p/overview`): About as an HTML block and a record card, then a location card beside one statistics graph.
- Both canvases are **75%** wide with a **48px** margin.
- HTML pages use a different accent on each section (teal, amber, sky, violet, emerald).
- Inspections & Reports includes the customer support ticket table (TKT-001 through TKT-004) with priority and status chips.
- The statistics record has six monthly values: 8, 12, 15, 18, 22, 27.

**Off** deletes the sample pack, including Sample Customer, and leaves one empty row on Primary and one on Overview. The Primary Org, Administrator, and COA accounts stay. Rendering Drivers stay.

### Not in this release

Integrations still have no visitor driver (DM-02). Inspection tickets are shown as HTML, not as a live ticket listing. AUTH-01 and the held statistics-twin layout item (**B**) are unchanged.

## 1.0.1

First Page Builder cut on the RenderDriver line: paint from an Element (`pairingId`), one driver per Shape and record type, and the Statistics-style Spatial Twin on Elements.
