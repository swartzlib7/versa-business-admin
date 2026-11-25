# Integrations and access tokens (1.0.20)

**Use it to:** connect two VBA installs (push or pull), use a stored Credential from your script, give a statistics script an access token, and check what went across.
Design and rules: `docs/production/state/state_integrations.md`. Operator notes: Ops Manual §2.11–§2.12.

## The pieces

| Record (Collaboration → Vendor) | What it is |
|---|---|
| **Credential** | A secret (Configuration, encrypted; reads back as `••••••`) and a **Users** list (`line_group: "users"`, field `user_id`): the people and agents who may use it from a script. Auth type `token`: on the side that is **called**, issues the token and keeps only its fingerprint; on the side that **calls**, holds the partner's token in Configuration `{"token": "vba_…"}` |
| **Integration** | `direction` (`send`, `receive`), `mode` (`push`, `pull`), `endpoint_url` (only on the side that calls), `credential_id`, `interval_seconds`, status `active` / `standby` / `error`. One **flow line** (`line_group: "flows"`) per record type: `flow_record_type`, `flow_enabled`, `flow_filter`, `flow_include_lines` (statistics values), `flow_pull_marker` (VBA keeps it) |
| **Exchange** | One row per record or statistic value that went out or came in: `origin`, `status` (`new`, `pending`, `ok`, `skipped`, `error`), `action`, `source_table`, `source_id`, `error_message` |

| This side | Mode | Calls or is called |
|---|---|---|
| send + push | sends to the partner's `POST /api/exchange` | calls |
| receive + push | receives on its `POST /api/exchange` | is called |
| send + pull | answers `GET /api/exchange` | is called |
| receive + pull | asks the partner's `GET /api/exchange` | calls |

## Filters

`flow_filter` is a JSON list, stored as text; a record goes across only when it passes **every** condition. Empty: every record of the type. Send it as text (`"flow_filter": "[{…}]"`); a list sent as the value is stored as its text too (1.0.22).

```json
[{ "field": "id", "op": "in", "value": "6409a206-…, 8e6a7f62-…" },
 { "field": "status", "op": "eq", "value": "active" },
 { "field": "updated_at", "op": "gte", "value": "2026-11-01" }]
```

Ops: `eq`, `ne`, `contains`, `starts_with`, `empty`, `not_empty`, `in` (comma-separated, any field), `gte` (on or after), `lt` (before). Fields: any field of the type, plus `id`, `created_at`, `updated_at`. Push: the sender's filter decides what leaves. Pull: the caller's filter narrows the answer; the called side never returns more than its own filter allows. A receiving line's filter decides what is stored; the rest is `skipped`.

## Connect two installs (push, the LAN sends to a public install)

On the **receiving** install (admin session):

```bash
# 1. Credential that will hold the token's fingerprint
POST /api/records {"type_api_name":"vendor_credential","parent_kind":"collaboration","parent_api_name":"vendor",
                   "name":"LAN back office","status":"active","data":{"auth_type":"token"}}
# 2. Integration: receive + push, with a line per type it accepts
POST /api/records {"type_api_name":"vendor_integration","parent_kind":"collaboration","parent_api_name":"vendor",
                   "name":"LAN back office","status":"active",
                   "data":{"kind":"api","direction":"receive","mode":"push","credential_id":"<credential id>"},
                   "lines":[{"line_group":"flows","data":{"flow_record_type":"statistics","flow_enabled":"true","flow_include_lines":"true"}}]}
# 3. The token, once. Give it to the Primary User; do not log it.
POST /api/credentials/<credential id>/token
```

On the **sending** install: a Credential `{"auth_type":"token","configuration":"{\"token\":\"vba_…\"}"}`, and an Integration `send` + `push` with `endpoint_url` `https://<receiving domain>`, the same `credential_id` field pointing at it, and lines with the filters. Then `POST /api/exchange/actions {"integration_id":"…","action":"resend"}` once (sends what already exists) and `{"action":"run"}` (or wait for the interval).

**Pull** is the mirror image: the install that has the records makes the `send` + `pull` Integration and issues the token; the install that wants them (for example a LAN install with no public address) makes `receive` + `pull` with `endpoint_url` and the token. `{"action":"repull"}` asks for everything again.

## Use a Credential in your script

A vendor key, a mailbox password or another install's token is kept in a Credential. Do not copy it into the script or a file. Fetch it each time the script runs:

```js
// After signing in as yourself (sign-in.md: VBA_EMAIL / VBA_PASSWORD from your environment)
const res = await fetch(`${base}/api/credentials/${credentialId}/secret`, { headers: { Cookie: cookie } });
const { data } = await res.json(); // { id, name, auth_type, configuration: "<plain text>", values: { …parsed JSON… } }
```

- You must be on the Credential's **Users** list. If you are not, the answer is `403 NOT_ON_USERS_LIST`: ask the Primary User to add you (Collaboration → Vendor → Credentials → the Credential → Users). Do not look for another way in.
- You sign in with **your own** VBA account. On a Versa AGi host your VBA email and password come from your environment (your `.env`, which Lifeline exports into each cycle); never write them into a script.
- Keep the value in memory. Never print it, log it or write it to a file. Each use sets **Last used** on your line of the Users list.
- An agent sees only the Credentials that list it. Removing you from the list, or archiving the Credential, stops it at once.

## A script that posts statistic values

On the install: a Credential (Auth type token), an Integration `receive` + `push` with a `statistics` line (filter it to the statistics the script may write), then Issue token. The script:

```bash
curl -sS -X POST "https://<domain>/api/statistics/<statistic id>/lines" \
  -H "Authorization: Bearer $VBA_TOKEN" -H "Content-Type: application/json" \
  -d '{"slot": 0, "value": 42, "source": "script"}'
```

HTTP Basic (`-u email:password`) was removed in 1.0.20 and answers `401 BASIC_REMOVED`.

## Checking

- Integration `last_run_at`, `last_result` (push: what was sent; pull: each line's window `from … to …` in the partner's clock and how many were new), `last_error`, status. `error` = five failed sends in a row or a refused token; fix the cause, set it to `active`.
- Exchange rows with `status` `pending` (will retry) or `error` (read `error_message`; a person has to act).
- A received copy carries `external_id` `<receiving integration id>:<source id>`; `source_deleted_at` is set when the source deleted it (the copy is kept).

## Rules

- Never print or store a token or a fetched secret outside its Credential. A token is shown once.
- Not on a Credential's Users list: ask the Primary User. Do not ask another agent to fetch it for you.
- Do not edit received copies to fix data: the source wins on the next sync. Fix it at the source.
- Statistics: both sides must have the same Frequency, Quantity, Start and Time zone on a copy (they do: the copy takes them from the source, unless someone changed the copy). A value whose date would differ is refused with "Header settings differ", naming both zones; **Resend all** on the sender repairs the copy.
- 1.0.21: a push body and a pull answer carry `time_zone` (the sending install's zone); a statistic item carries its own `time_zone`, and a graph-line item the statistic's. A statistic from a sender before 1.0.21 takes the sender's install zone.
- One VBA process per database.
