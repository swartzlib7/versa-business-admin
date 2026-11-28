# Agent recipes — using Versa - Business Admin over HTTP

**Audience:** AI agents (and scripts) that work in a running VBA install on behalf of the Primary User.
**Not this page:** installing or upgrading VBA (Ops Manual), or changing VBA's code (development skill). Designing a change: [extending.md](extending.md).

Versa AGi's host skill **`business_admin_operate`** covers orientation, health and restarts. These recipes cover *doing the work*. They ship with each VBA version, so they always match the API of the install in front of you. The live list of endpoints is `GET /api` (and Settings → API).

**Start here:** [capabilities.md](capabilities.md) lists everything VBA can already do, with the route or screen and a link for each. Read it before building, proposing or scripting anything new.

| Recipe | Use it to |
|--------|-----------|
| [capabilities.md](capabilities.md) | See everything VBA already does: record types, field behaviours, the save pipeline, record actions, printing, and what is not built yet |
| [sign-in.md](sign-in.md) | Get a session cookie from a script (proof-of-work login) |
| [records-and-lines.md](records-and-lines.md) | Read a record type's fields; create, update, clone records; add lines one at a time; see what links to a record |
| [job-costing.md](job-costing.md) | Estimate with a bill of materials → invoice → vendor bill → matching |
| [printing.md](printing.md) | Print a record to PDF, keep it on the record, make or change a print template (1.0.27) |
| [shipments.md](shipments.md) | Create a shipment from an invoice, ship in parts, mark it shipped and delivered (1.0.26) |
| [attachments.md](attachments.md) | Attach files to a record or an organization in one call (1.0.23), or save the field yourself |
| [statistics.md](statistics.md) | Capture statistic values; feed a statistic from records |
| [operations.md](operations.md) | Health, backup, what never to do |
| [integrations.md](integrations.md) | Connect two installs (push or pull), give a script an access token, check what went across |
| [extending.md](extending.md) | Design a new capability or a change: what is already decided, what exists, where it plugs in |

**Rules for every recipe**

- Writes need an **admin** session. Read the type's fields first (`GET /api/catalog/record-types/<type>`) and send field **API names**, values as strings. A list or object sent as a value (a Filter) is stored as its JSON text (1.0.22). A field the type does not have is refused with `400 UNKNOWN_FIELD`, which names it, suggests the nearest real one and lists the type's fields; a field sent beside `data` instead of inside it is refused with `400 FIELD_OUTSIDE_DATA` (1.0.24). Before 1.0.24 both answered `200` and the value was lost. A lookup with a filter (`lookup_filter` in the type's fields: a fixed `value`, or `from_field`, another field of the same record) only takes a record the filter offers; anything else answers `400 LOOKUP_NOT_OFFERED` (1.0.25). A new record sent without a status takes its Status field's default (Shipments and Policies: `draft`), else `active`; a field with `auto_number` (Shipment number) is given by VBA on create; sending or changing it answers `400 NUMBER_IS_AUTOMATIC`, and an update that leaves it out keeps it (1.0.26). A Required field left empty answers `400 REQUIRED_FIELD` naming it: a new record must fill it, an update may not empty it (1.0.28).
- Never write calculated fields yourself: Summary, Formula, Allocated / Remaining are worked out by VBA on save. Calculated defaults (Unit price, Line total, Amount, Actual cost) follow their formula unless you send a different value on purpose.
- Records with an **External ID** belong to an integration (e.g. Wave): don't change their amounts and don't convert them.
- A `400` answer carries a plain sentence in `error.message`. Show it to the Primary User rather than retrying blindly.
- **Secrets come back as `••••••`** (1.0.18): passwords, tokens and keys in a Credential's Configuration are never sent by the API. To keep one, send `••••••` back unchanged; to change it, send the new value. To use one in a script, be on the Credential's **Users** list and fetch it with `GET /api/credentials/<id>/secret` (1.0.20, [integrations.md](integrations.md)); not on the list → ask the Primary User to add you.
