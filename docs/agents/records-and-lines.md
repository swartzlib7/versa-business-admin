# Records and lines

Every business record (projects, transactions, assets, mileage logs, statistics, custom `c_` types) is a **record** of a **record type**. "Header and lines" types also hold **lines** (tasks, BOM lines, trips).

## Know the type first

`GET /api/catalog/record-types/<type>` → `data.type` (label, structure) and `data.fields` (api_name, data_type, `zone_role` header/list, lookups, formulas). Lines fields have `zone_role: "list"`. Skip fields of type `summary` and `formula`, and `read_only` fields: VBA fills them.

## Create, update, clone

| Do | Call |
|----|------|
| List | `GET /api/records?type=<type>` |
| Read one (with lines) | `GET /api/records/<id>` |
| Create | `POST /api/records` `{ type_api_name, parent_kind, parent_api_name, name, status, data: {...}, lines?: [{ data }] }` (parent comes from the type: e.g. Transactions `faculty` / `treasury`, Projects `faculty` / `executive`, Statistics `environment` / `custom`) |
| Update | `PATCH /api/records/<id>` `{ name, status, data }` (data replaces the header; send the whole header). Send `lines` only to replace **all** lines |
| Add lines | `POST /api/records/<id>/lines` `{ data: {...} }` or `{ lines: [{ data }, …] }` — appends without resending the others |
| Clone | `POST /api/records/<id>/clone` → "Copy of …" with its lines (new ids, External ID cleared) |
| What points here | `GET /api/records/<id>/linked` → groups by type and field, amounts totalled per document kind |

Example — log a trip on a mileage log:

```bash
curl -s -b "$COOKIE" -X POST $BASE/api/records/$LOG_ID/lines \
  -H 'Content-Type: application/json' \
  -d '{"data":{"trip_date":"2026-11-19","trip_miles":42,"trip_business":true,"trip_purpose":"Client visit"}}'
```

The answer holds the whole record with its recalculated totals (`data.total_miles`, `data.business_use_pct`) and `lines` = the line(s) just added.
