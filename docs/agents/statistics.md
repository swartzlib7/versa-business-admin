# Statistics

A statistic is a `statistics` record (parent `environment` / `custom`). Its values are separate rows.

| Do | Call |
|----|------|
| Values + config | `GET /api/statistics/<id>/lines` |
| Capture a value | `POST /api/statistics/<id>/lines` `{ slot, value, series?, source: "script" }` (slot = step in the period, from 0) |
| Change / clear | `PATCH /api/statistics/<id>/lines` `{ lineId, value }` (`null` clears and keeps the step) |
| Recompute a fed statistic | `POST /api/statistics/<id>/refresh` |

**Fed from records** (no capture needed): set the header's Source fields — `source_record_type`, `source_read_from` (`lines` or `records`), `source_date_field`, `source_value_field` (empty = count), `source_filter_field` / `source_filter_value`. Examples:

- Monthly business miles: type `treasury_vehicle_mileage_log`, read `lines`, date `trip_date`, value `trip_miles`, filter `trip_business` = `true`.
- Invoiced per month: type `treasury_transaction`, read `records`, date `transaction_date`, value `amount`, filter `document_kind` = `invoice`.

A fed statistic updates itself whenever those records change through the API; don't capture values into it by hand.
