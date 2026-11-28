# Printing records to PDF (1.0.27)

Any record prints to a PDF made on the server. Which record type prints how is set by **print templates**: records of type `print_template` (Custom Records → Print Templates). Invoice, Estimate, Quote and Packing Slip ship ready. Design: [state_printing.md](../production/state/state_printing.md).

## Print a record

| Step | Call |
|---|---|
| See the choices | `GET /api/records/<id>/print-templates` → `[{ id, name, matches, default }]`. `default` is the first template whose Use when fits the record |
| Get the PDF | `GET /api/records/<id>/print` (the default) or `?template=<template id>`; add `&download=1` to save instead of show. Answers `application/pdf`; headers `X-Print-Template` and `X-Print-Pages` |
| Keep it on the record | `POST /api/records/<id>/print` with `{ "template": "<id>" }` or `{}` → `201 { file, field, template, pages }`. The PDF is added to the record's Documents & Photos |

Errors (`error.code`): `NO_PRINT_TEMPLATE` (the type has none), `NO_MATCHING_TEMPLATE` (none's Use when fits; the message lists the choices: send `?template=`), `WRONG_TEMPLATE` (a template of another type), `TEMPLATE_NOT_FOUND`, `PRINT_TEMPLATE_INVALID` (the template's layout no longer fits its type, e.g. a field was retired). Printing needs a session; saving needs an admin session.

To email or send a document, print with `POST` and attach the stored file (`GET /api/records/files/<file id>`), or use the `GET` bytes directly. Don't render your own PDF for a type that has a template.

## Make or change a template

A template is a record: `POST /api/records` with `type_api_name: "print_template"`, `parent_kind: "environment"`, `parent_api_name: "custom"`, and in `data`:

| Field | Meaning |
|---|---|
| `target_record_type` | The record type it prints (api_name), e.g. `treasury_transaction` |
| `sort_order` | Order among the type's templates (lower first) |
| `use_when_field`, `use_when_value` | When it is the one to use: the record's field equals the value (commas: any of them; `status` reads the record's status). Empty = every record |
| `page_size` | `letter` (default), `a4`, `legal` |
| `orientation` | `portrait` (default), `landscape` |
| `margin_mm` | 5–50, default 15 |
| `font` | `helvetica` (default), `times`, `hack`. Helvetica and Times print Western European letters (others print as `?`); Hack prints most scripts |
| `layout` | The layout, as JSON text or a JSON object (below) |
| `status` | `active`; `archived` stops offering it |

The save is checked: a type that doesn't exist, a Use when field the type lacks, or a layout that names a field the type lacks answers `400 PRINT_TEMPLATE_INVALID` with each problem. Shipped templates carry `shipped_key` and `shipped_hash` (read-only): a release updates them only while they are unedited. To change a shipped one for good, edit it (it is then kept as yours); to stop using it, archive it (deleting it brings it back on the next start).

## The layout

```json
{
  "bands": [
    { "area": "header", "shows_on": "first", "blocks": [ … ] },
    { "area": "header", "shows_on": "after_first", "blocks": [ { "type": "text", "text": "Invoice {document_number} (continued)", "muted": true } ] },
    { "area": "footer", "shows_on": "last", "blocks": [ { "type": "signature", "label": "Received by" } ] },
    { "area": "footer", "shows_on": "every", "blocks": [ { "type": "page_number" } ] }
  ],
  "body": [ … ]
}
```

**Bands** sit at the top (`header`) or bottom (`footer`) of each page they show on. `shows_on`: `every`, `first`, `after_first`, `last`, or `pages` with `"pages": "1, 3"` (ranges `5-7` work). Several bands can share an area; they stack in the order listed. The lines table may not go in a band.

**Blocks** (body and bands):

| `type` | Properties | Prints |
|---|---|---|
| `text` | `text`, `size` (9.5), `bold`, `align` (`left`/`center`/`right`), `muted` | The text; `{field}` is the record's value as shown (lookups as names, picklists as labels, dates, money), `{page}` `{pages}` `{today}` |
| `fields` | `fields` (api names), `columns` (1–4, default 2), `labels` (true) | Label and value per field; empty fields are left out |
| `organization` | `source` (`"own"` or a lookup field holding an organization), `location` (a lookup field holding a Location, or `"primary"`), `title`, `show` (`logo`, `name`, `address`, `phone`, `email`), `align` | Name, address lines from the Location, phone, email, logo (PNG or JPEG stored on this install) |
| `lines` | `columns: [{ field, label?, width?, align? }]`, `totals: [{ field, label?, bold? }]`, `group`, `only_with` | The lines table; numbers right-aligned; flows onto more pages and repeats its headings; totals (header fields) right-aligned under it |
| `signature` | `label`, `lines` (captions, default Signature / Printed name / Date) | Lines to sign on |
| `page_number` | `format` ("Page {page} of {pages}"), `align` | The page number |
| `spacer` | `height` (mm, default 4) | Space |
| `divider` | — | A thin rule |
| `columns` | `columns` (a list of block lists), `widths` (relative, e.g. `[3, 2]`) | Blocks side by side |

Read a shipped template (`GET /api/records?type=print_template`, then its `layout`) for complete examples.
