#!/usr/bin/env bash
# Start a local Postgres 16 container for Mission Control development.
# Phase 1: plain Postgres only (no Supabase stack).
# Usage: ./scripts/docker-postgres.sh start|stop|status

set -euo pipefail

CONTAINER_NAME="mission-control-pg"
POSTGRES_USER="mission"
POSTGRES_PASSWORD="mission"
POSTGRES_DB="mission_control"
POSTGRES_PORT="5432"

case "${1:-start}" in
  start)
    if docker ps --filter "name=${CONTAINER_NAME}" --filter "status=running" --format "{{.Names}}" | grep -q "${CONTAINER_NAME}"; then
      echo "Postgres container already running on port ${POSTGRES_PORT}."
      exit 0
    fi
    docker rm -f "${CONTAINER_NAME}" 2>/dev/null || true
    docker run -d \
      --name "${CONTAINER_NAME}" \
      -e POSTGRES_USER="${POSTGRES_USER}" \
      -e POSTGRES_PASSWORD="${POSTGRES_PASSWORD}" \
      -e POSTGRES_DB="${POSTGRES_DB}" \
      -p "${POSTGRES_PORT}:5432" \
      postgres:16-alpine
    echo "Postgres started: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}"
    ;;
  stop)
    docker stop "${CONTAINER_NAME}" 2>/dev/null || true
    docker rm "${CONTAINER_NAME}" 2>/dev/null || true
    echo "Postgres container stopped and removed."
    ;;
  status)
    if docker ps --filter "name=${CONTAINER_NAME}" --filter "status=running" --format "{{.Names}}" | grep -q "${CONTAINER_NAME}"; then
      echo "RUNNING - port ${POSTGRES_PORT}"
    else
      echo "STOPPED"
    fi
    ;;
  *)
    echo "Usage: $0 {start|stop|status}"
    exit 1
    ;;
esac
