# Agent recipes — using Versa - Business Admin over HTTP

**Audience:** AI agents (and scripts) that work in a running VBA install on behalf of the Primary User.
**Not this page:** installing or upgrading VBA (Ops Manual), or changing VBA's code (development skill). Designing a change: [extending.md](extending.md).

Versa AGi's host skill **`business_admin_operate`** covers orientation, health and restarts. These recipes cover *doing the work*. They ship with each VBA version, so they always match the API of the install in front of you. The live list of endpoints is `GET /api` (and Settings → API).

| Recipe | Use it to |
|--------|-----------|
| [sign-in.md](sign-in.md) | Get a session cookie from a script (proof-of-work login) |
| [records-and-lines.md](records-and-lines.md) | Read a record type's fields; create, update, clone records; add lines one at a time; see what links to a record |
| [job-costing.md](job-costing.md) | Estimate with a bill of materials → invoice → vendor bill → matching |
| [attachments.md](attachments.md) | Upload files and attach them to a record |
| [statistics.md](statistics.md) | Capture statistic values; feed a statistic from records |
| [operations.md](operations.md) | Health, backup, what never to do |
| [extending.md](extending.md) | Design a new capability or a change: what is already decided, what exists, where it plugs in |

**Rules for every recipe**

- Writes need an **admin** session. Read the type's fields first (`GET /api/catalog/record-types/<type>`) and send field **API names**, values as strings.
- Never write calculated fields yourself: Summary, Formula, Allocated / Remaining are worked out by VBA on save. Calculated defaults (Unit price, Line total, Amount, Actual cost) follow their formula unless you send a different value on purpose.
- Records with an **External ID** belong to an integration (e.g. Wave): don't change their amounts and don't convert them.
- A `400` answer carries a plain sentence in `error.message`. Show it to the Primary User rather than retrying blindly.
