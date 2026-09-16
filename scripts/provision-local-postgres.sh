#!/usr/bin/env bash
# Create the local VBA database on PostgreSQL 16 (same box).
# Requires sudo once (postgres superuser). Does not start a VM.
#
#   sudo bash scripts/provision-local-postgres.sh
#
# Then as the app user:
#   npm run db:migrate && npm run db:seed
set -euo pipefail

DB_NAME="${VBA_DB_NAME:-business_admin}"
DB_USER="${VBA_DB_USER:-versa_ba}"
ENV_FILE="${ENV_FILE:-.env.local}"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run with sudo: sudo bash scripts/provision-local-postgres.sh" >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql not found. Install postgresql-16 first." >&2
  exit 1
fi

APP_OWNER="${SUDO_USER:-coa}"
PASS="$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)"

sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${PASS}';
  ELSE
    ALTER ROLE ${DB_USER} WITH LOGIN PASSWORD '${PASS}';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec
ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
SQL

sudo -u postgres psql -d "$DB_NAME" -v ON_ERROR_STOP=1 -c "GRANT ALL ON SCHEMA public TO ${DB_USER};"
sudo -u postgres psql -d "$DB_NAME" -v ON_ERROR_STOP=1 -c "ALTER SCHEMA public OWNER TO ${DB_USER};"

URL="postgresql://${DB_USER}:${PASS}@127.0.0.1:5432/${DB_NAME}"
TARGET="${APP_DIR}/${ENV_FILE}"
umask 077
if [ ! -f "$TARGET" ]; then
  touch "$TARGET"
fi
if [ -f "$TARGET" ]; then
  grep -vE '^(DATA_SOURCE|DATABASE_URL)=' "$TARGET" > "${TARGET}.tmp" || true
  mv "${TARGET}.tmp" "$TARGET"
fi
{
  echo "DATA_SOURCE=postgres"
  echo "DATABASE_URL=${URL}"
} >> "$TARGET"
if ! grep -q '^AUTH_COOKIE_NAME=' "$TARGET"; then
  echo "AUTH_COOKIE_NAME=__session" >> "$TARGET"
fi
if ! grep -q '^AUTH_SESSION_MAX_AGE=' "$TARGET"; then
  echo "AUTH_SESSION_MAX_AGE=604800" >> "$TARGET"
fi
# App runs as coa; sudo may be the PU. Group `coa` must be able to read.
if getent group coa >/dev/null 2>&1; then
  chown "${APP_OWNER}:coa" "$TARGET"
  chmod 640 "$TARGET"
else
  chown "${APP_OWNER}:${APP_OWNER}" "$TARGET"
  chmod 600 "$TARGET"
fi

echo "Wrote DATA_SOURCE and DATABASE_URL to ${TARGET} (not committed)."
echo "Next: npm run db:migrate && npm run db:seed"
