# Attachments (documents and photos)

Records and organizations keep files in an **Attachments** field, normally `documents` ("Documents & Photos"). Since 1.0.23 it is on every business record type (Transactions, Contacts, Projects, Policies, Hats, Products, Services, Sales, Promotion & Marketing, Inspections & Reports, Staff, Messages, Reviews, Examinations, Certifications & Awards, Knowledge, Events, Locations, Schedules and Vehicle Mileage Logs), on Assets, and on organizations (vendors, customers, partners and branches are organizations, not records). Up to 10 files of 20 MB each per field; the types allowed are the `file_mime` value set (`GET /api/records/files` lists them with `max_bytes`).

## Attach in one call (1.0.23)

```bash
curl -s -b "$COOKIE" -F "file=@bill.pdf;type=application/pdf" -F "file=@receipt.jpg" \
  $BASE/api/records/<record id>/files
curl -s -b "$COOKIE" -F "file=@w9.pdf;type=application/pdf" \
  $BASE/api/organizations/<organization id>/files
```

- Adds to what the record already has. Answers `201` with the record (`data`), the field used (`field`) and the new entries (`files`: `{ id, name, mime, size }`).
- `field` (a form part) names the Attachments field when the type has more than one.
- Refused with a plain reason, and nothing stored: a type with no Attachments field (`NO_ATTACHMENTS_FIELD`, says how to add one), an unknown `field`, more than 10 in total (`TOO_MANY_FILES`), a file type not allowed or too big (`INVALID_FILE`).
- Admin session needed, as for every write.

Take one off: `DELETE /api/records/<record id>/files/<file id>` (or `/api/organizations/…`). The stored file stays, because a cloned record may share it; add `?delete_file=1` to delete it too.

## Saving the field yourself

`PATCH` with the field's JSON list still works: upload with `POST /api/records/files` (returns `{ id, name, mime, size }`), then send the **whole** list, existing entries included (a list with only the new file replaces the others). Each entry needs only its `id`; name, type and size are taken from the stored file. A file not stored on this install, text that is not a list, or more than 10 entries is refused (`400`).

## Reading

Files are served at `GET /api/records/files/<file id>` (`?download=1` forces a download). `DELETE /api/records/files/<file id>` deletes a stored file without touching records that list it.

Files do not travel through Integrations (state_integrations.md, "Not carried").
