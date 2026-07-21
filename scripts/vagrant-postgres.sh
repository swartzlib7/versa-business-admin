#!/usr/bin/env bash
# Start/stop/status for Postgres on the Graph Knowledge Base Vagrant box.
# Phase 1: plain Postgres on Vagrant (NOT Docker, NOT a new box).
# Reuses the existing knowledgebase Vagrant VM at workspace/knowledgebase.
#
# Usage:
#   ./scripts/vagrant-postgres.sh start   # boot VM + provision Postgres if needed
#   ./scripts/vagrant-postgres.sh stop    # halt VM
#   ./scripts/vagrant-postgres.sh status  # show VM + Postgres status
#   ./scripts/vagrant-postgres.sh migrate # run drizzle-kit migrate against VM Postgres
#   ./scripts/vagrant-postgres.sh health  # ping DB from host
#
# Environment:
#   DATABASE_URL=postgresql://mission:mission@localhost:5432/mission_control
#
# The Vagrant VM forwards host port 5432 to guest port 5432.

set -euo pipefail

KNOWLEDGEBASE_DIR="/home/agi-web-dev/workspace/knowledgebase"
POSTGRES_USER="mission"
POSTGRES_PASSWORD="mission"
POSTGRES_DB="mission_control"
POSTGRES_PORT="5432"
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}"

# --- Helpers ---

vm_running() {
  cd "$KNOWLEDGEBASE_DIR"
  vagrant status --machine-readable 2>/dev/null | grep -q 'state,running'
}

vm_provision_postgres() {
  echo "Provisioning Postgres on knowledgebase VM (idempotent)..."
  cd "$KNOWLEDGEBASE_DIR"
  vagrant ssh -c '
    set -eux
    export DEBIAN_FRONTEND=noninteractive

    if ! command -v psql >/dev/null 2>&1; then
      apt-get update -qq
      apt-get install -y -qq postgresql postgresql-contrib
    fi

    systemctl start postgresql 2>/dev/null || true
    systemctl enable postgresql 2>/dev/null || true

    PGPASSWORD=postgres psql -U postgres -tc "SELECT 1 FROM pg_roles WHERE rolname=\x27mission\x27" | grep -q 1 || \
      psql -U postgres -c "CREATE ROLE mission WITH LOGIN PASSWORD \x27mission\x27 CREATEDB;"
    psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname=\x27mission_control\x27" | grep -q 1 || \
      createdb -U postgres -O mission mission_control

    psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE mission_control TO mission;"

    PG_HBA=$(ls /etc/postgresql/*/main/pg_hba.conf 2>/dev/null | head -1)
    if [ -n "$PG_HBA" ] && [ -f "$PG_HBA" ]; then
      grep -q "host all all 0.0.0.0/0 md5" "$PG_HBA" || echo "host all all 0.0.0.0/0 md5" >> "$PG_HBA"
    fi

    PG_CONF=$(ls /etc/postgresql/*/main/postgresql.conf 2>/dev/null | head -1)
    if [ -n "$PG_CONF" ] && [ -f "$PG_CONF" ]; then
      sed -i "s/#listen_addresses = .localhost./listen_addresses = \x27*\x27/" "$PG_CONF"
      sed -i "s/listen_addresses = .localhost./listen_addresses = \x27*\x27/" "$PG_CONF"
    fi

    systemctl restart postgresql
    echo "Postgres provisioned and running on VM."
  '
}

# --- Commands ---

case "${1:-status}" in
  start)
    echo "Starting knowledgebase Vagrant VM..."
    cd "$KNOWLEDGEBASE_DIR"
    vagrant up
    vm_provision_postgres
    echo ""
    echo "Postgres is ready at: $DATABASE_URL"
    echo "From the app host, set:"
    echo "  DATABASE_URL=$DATABASE_URL"
    echo "  DATA_SOURCE=postgres"
    ;;

  stop)
    echo "Stopping knowledgebase Vagrant VM..."
    cd "$KNOWLEDGEBASE_DIR"
    vagrant halt
    echo "VM stopped."
    ;;

  status)
    cd "$KNOWLEDGEBASE_DIR"
    if vm_running; then
      echo "VM: RUNNING"
      if vagrant ssh -c "systemctl is-active postgresql" 2>/dev/null | grep -q active; then
        echo "Postgres: ACTIVE (port ${POSTGRES_PORT} forwarded to host)"
      else
        echo "Postgres: NOT RUNNING (run start to provision)"
      fi
    else
      echo "VM: STOPPED (run start to boot + provision)"
    fi
    ;;

  migrate)
    echo "Running drizzle-kit migrate against $DATABASE_URL ..."
    cd /home/agi-web-dev/workspace/versa-admin-system
    DATABASE_URL="$DATABASE_URL" npx drizzle-kit migrate
    ;;

  health)
    echo "Pinging Postgres at $DATABASE_URL ..."
    cd /home/agi-web-dev/workspace/versa-admin-system
    DATABASE_URL="$DATABASE_URL" DATA_SOURCE=postgres node -e "
      const postgres = require('postgres');
      const sql = postgres(process.env.DATABASE_URL);
      sql\`SELECT 1\`.then(() => {
        console.log('DB HEALTHY: connected OK');
        return sql.end();
      }).catch((e) => {
        console.error('DB UNHEALTHY:', e.message);
        process.exit(1);
      });
    "
    ;;

  *)
    echo "Usage: $0 {start|stop|status|migrate|health}"
    exit 1
    ;;
esac
