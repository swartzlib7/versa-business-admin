# Web-dev brief — I5.6 wrap handoff (2026-07-20)

## Status of the product

Stephen called **I5.6 UI wrap complete**. COA finished fixture-backed catalog + layout-driven UI through **ERD-D**.

| Item | State |
|------|--------|
| Hub visuals | Closed (no polish unless reopened) |
| Baseline ERD | LOCKED — Organization + Party (`party_kind`); not host AGi org tables |
| ERD-B catalog | value_set / field_definition / layout_definition |
| ERD-C User pilot | `/users` list + detail/edit via LayoutDrivenForm |
| UI-Z | Zone tabs share EntityListing |
| ERD-D | Project / Task / Product same pattern — beta `7fc2cb1` |
| Physical DB | **Not started** — fixtures only |
| Storage lean | JSON-in-DB for flexible attrs; fixtures first; Postgres+JSONB when leaving fixtures |

## Your job next (when tasked)

1. Orient in **your** clone on `agent/web-dev` at tip of wrap (`7fc2cb1` or newer from `coa-workspace`/`origin`).
2. Read living state: `docs/design/spec/state/state_i5_6_zone_erd.md`, `state_api_contract.md`, `state_layout_mission_ui.md`.
3. Await COA task for first implementation slice (likely polish, API wiring, or DB cutover checklist — **not** unsolicited hub work).
4. `npm install` in your clone before build/dev (node_modules may be absent after fresh clone).

## Formality

You are the dedicated implementer. COA remains orchestrator and owner of Mission strategy with Stephen.
