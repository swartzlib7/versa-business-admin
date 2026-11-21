# Operations an agent may do

- **Health:** `curl -sS localhost:<port>/api/health` (in its own call). It reports the version.
- **Backup** before any bulk change: `npm run backup` in the VBA folder (database, settings, uploads; `--no-uploads` to skip uploads). Ops Manual §3.7.
- **Never:** `pkill -f`, editing `.data/*.json` by hand, deleting system fields, committing or pushing in the VBA checkout, writing to records with an External ID except through their integration.
- Restarts and upgrades follow the Ops Manual (§3.5, §5.2) and the host skill `business_admin_operate`.
