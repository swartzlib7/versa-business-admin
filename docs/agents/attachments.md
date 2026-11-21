# Attachments (documents and photos)

1. `GET /api/records/files` → allowed types (the `file_mime` value set) and `max_bytes` (20 MB unless the install changed it).
2. Upload each file: `POST /api/records/files` multipart with field `file` → `{ data: { id, name, mime, size } }`.
3. Read the record, add the returned object to the field's JSON list (max 10), and `PATCH` the record:

```bash
curl -s -b "$COOKIE" -F "file=@contract.pdf;type=application/pdf" $BASE/api/records/files
# then data.documents = JSON.stringify([...existing, uploaded])
```

Files are served at `GET /api/records/files/<id>` (`?download=1` to force a download). Removing an entry from a record does not delete the stored file; `DELETE /api/records/files/<id>` does.
