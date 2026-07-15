# Versa Admin System — API Contract

**Version:** 0.2.0  
**Base Path:** `/api`  
**Protocol:** HTTP/1.1, JSON only  
**Auth:** None (fixture-backed; auth TBD in later iteration)

## Conventions

### Response Envelope

All list endpoints return:

\`\`\`json
{
  "data": [...],
  "count": 3
}
\`\`\`

Singular/special endpoints (health, index) return their own shape.

### Error Shape

\`\`\`json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "The requested resource was not found."
  }
}
\`\`\`

Standard HTTP status codes: 200, 400, 404, 500.

### Query Filters

List endpoints support query-string filters. Filters are additive (AND logic).

| Parameter | Type | Example | Notes |
|-----------|------|---------|-------|
| status | string | ?status=active | Filter by resource status |
| q | string | ?q=search+term | Full-text search (future) |

Unrecognized filter keys are silently ignored.

---

## Resources

### GET /api

Returns an index of available endpoints.

**Response:**
\`\`\`json
{
  "name": "Versa Admin System API",
  "version": "0.2.0",
  "endpoints": {
    "health": "/api/health",
    "agents": "/api/agents",
    "projects": "/api/projects",
    "integrations": "/api/integrations",
    "tasks": "/api/tasks"
  }
}
\`\`\`

### GET /api/health

System health check.

**Response:**
\`\`\`json
{
  "status": "ok",
  "version": "0.2.0",
  "timestamp": "2026-07-15T04:00:00.000Z",
  "uptime": 123.456
}
\`\`\`

### GET /api/agents

Agent fleet list. Supports ?status= filter.

**Query Parameters:**
- status — filter by agent status (active, idle, error, offline)

**Response:**
\`\`\`json
{
  "data": [
    {
      "id": "agent-1",
      "name": "Versa (COA)",
      "role": "Chief Orchestrator Agent",
      "status": "active",
      "model": "x-ai/grok-4.5",
      "lastActive": "2026-07-14T22:30:00Z"
    }
  ],
  "count": 1
}
\`\`\`

**Example:**
\`\`\`bash
curl http://localhost:3000/api/agents?status=active
\`\`\`

### GET /api/projects

Project list.

**Response:**
\`\`\`json
{
  "data": [
    {
      "id": "proj-1",
      "name": "versa-admin-system",
      "description": "Client mission control for Versa AGi businesses",
      "status": "active",
      "gameId": "game-109",
      "gameName": "Versa Voice AI LLC",
      "agentCount": 3,
      "taskCount": 12
    }
  ],
  "count": 5
}
\`\`\`

### GET /api/integrations

Connected systems list.

**Response:**
\`\`\`json
{
  "data": [
    {
      "id": "int-1",
      "name": "Gmail IMAP",
      "type": "email",
      "status": "connected",
      "lastSync": "2026-07-14T23:00:00Z",
      "description": "Primary email monitoring via IMAP"
    }
  ],
  "count": 5
}
\`\`\`

### GET /api/tasks

Task queue. Supports ?status= filter.

**Query Parameters:**
- status — filter by task status (planned, in_progress, waiting, blocked, done)

**Response:**
\`\`\`json
{
  "data": [
    {
      "id": "task-1",
      "title": "[admin I0] Foundations scaffold",
      "status": "in_progress",
      "priority": "high",
      "assignee": "web-dev",
      "projectId": "proj-1",
      "projectName": "versa-admin-system",
      "dueDate": "2026-07-15T12:00:00-04:00"
    }
  ],
  "count": 1
}
\`\`\`

**Example:**
\`\`\`bash
curl http://localhost:3000/api/tasks?status=in_progress
\`\`\`

---

## Versioning

This contract describes the **current live** API surface. Breaking changes will increment the minor version. The API is fixture-backed — no real host integration yet. Endpoints return static sample data suitable for UI development and integration testing.
