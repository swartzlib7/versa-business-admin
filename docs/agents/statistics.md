# Statistics

A statistic is a `statistics` record (parent `environment` / `custom`). Its values are separate rows.

**Time zone (1.0.21).** `start_datetime` is a wall clock (`2026-11-12T00:00`) read in the statistic's `time_zone` (IANA, e.g. `America/New_York`). Leave `time_zone` out and the statistic takes the install's (`GET /api/health` → `time_zone`); a name that is not a zone is refused. Day, week and month steps follow the calendar in that zone. Each value's `stamp` is that instant in UTC.

| Do | Call |
|----|------|
| Values + config | `GET /api/statistics/<id>/lines` |
| Capture a value | `POST /api/statistics/<id>/lines` `{ slot, value, series?, source: "script" }` (slot = step in the period, from 0) |
| Change / clear | `PATCH /api/statistics/<id>/lines` `{ lineId, value }` (`null` clears and keeps the step) |
| Recompute a fed statistic | `POST /api/statistics/<id>/refresh` |

**Fed from records** (no capture needed): set the header's Source fields — `source_record_type`, `source_read_from` (`lines` or `records`), `source_date_field`, `source_value_field` (empty = count), `source_filter_field` / `source_filter_value`. With `lines`, the date and filter fields may be the record's own (header) fields, which each line shares (1.0.25): shipment lines dated by `ship_date`, filtered on `status`. Examples:

- Monthly business miles: type `treasury_vehicle_mileage_log`, read `lines`, date `trip_date`, value `trip_miles`, filter `trip_business` = `true`.
- Invoiced per month: type `treasury_transaction`, read `records`, date `transaction_date`, value `amount`, filter `document_kind` = `invoice`.
- Units shipped per month (1.0.26): type `production_shipment` and leave `source_date_field` and `source_value_field` empty; the save fills the type's ready feed: read `lines`, date `ship_date`, value `line_qty_shipped`, filter `status` = `shipped, delivered`.

`source_filter_value` with commas matches any of the values (1.0.26).

A fed statistic updates itself whenever those records change through the API; don't capture values into it by hand.
