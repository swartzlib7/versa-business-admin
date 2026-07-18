# Versa AGi Mission — API Contract

**Product:** Versa AGi Mission (project #26)  
**Version:** 0.4.0 (I6 work surfaces)  
**ERD note (2026-07-18):** Conceptual business ERD is keystone v1.1 (`docs/specs/MISSION_CONTROL_ERD_KEYSTONE.md`). API resources will grow toward Organization / Collaboration / Environmental entities; do not add agent-fleet endpoints.  
**Base Path:** `/api`  
**Protocol:** HTTP/1.1, JSON only  
**Auth:** Session-based (httpOnly cookie). Public endpoints are open; backend endpoints require authentication. RBAC: admin can write, member can read.

## Design principles

1. **Own product resources** — entities belong to Mission's ERD, not host Versa AGi tables.
2. **Business language** — prefer `users`, `roles`, `projects`, `tasks`, `org-units`, `kb/*`.  
   Legacy seed routes under `/api/agents` are **deprecated naming**; treat as transitional aliases of **users with type=agent** until removed.
3. **Same API for UI and Versa AGi agents** — host agents integrate via this HTTP API (or Script Tasks), never shared DB.
4. **Public vs authenticated** — public content endpoints are readable without login; backend mutations require auth + RBAC.

## Conventions

### Response Envelope

List endpoints:

```json
{
  "data": [...],
  "count": 3
}
```

Singular/special endpoints return their own shape.

### Error Shape

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "The requested resource was not found."
  }
}
```

Standard HTTP status codes: 200, 201, 400, 401, 403, 404, 500, 501.

### Query Filters

| Parameter | Type | Example | Notes |
|-----------|------|---------|-------|
| status | string | ?status=active | Resource status |
| type | string | ?type=human | For users: human \| agent |
| q | string | ?q=search+term | Full-text (future) |
| orgUnitId | string | ?orgUnitId=... | Scope to org node |

Unrecognized filter keys are silently ignored.

---

## Target resource map (capability spine)

| Domain | Planned routes | Notes |
|--------|----------------|-------|
| Meta | GET /api, GET /api/health | Index + health |
| Public business | GET /api/public/business | Name, slogan, logo, description |
| Public services | GET /api/public/services | Service list |
| Public products | GET /api/public/products | Product list |
| Public staff | GET /api/public/staff | Public-safe people/roles |
| Auth | POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me | I5 |
| Users | /api/users, /api/users/{id} | type: human \| agent |
| Roles | /api/roles, /api/roles/{id} | RBAC |
| Projects | /api/projects, /api/projects/{id} | Business projects |
| Tasks | /api/tasks, /api/tasks/{id} | Work items |
| Org structure | /api/org-units, /api/org-units/{id} | division→department→section→unit |
| Knowledgebase | /api/kb/policies, /api/kb/processes, /api/kb/articles | Assignable to org units |
| Branding | /api/settings/branding | White-label |
| Integrations (later) | /api/integrations | Optional; not spine MVP |

---

## Implemented seed (I0–I2) — transitional

The following exist in the current codebase as **fixture-backed** endpoints. They remain until I4+ replaces or renames them. Do not expand host-agent semantics.

### GET /api

```json
{
  "name": "Business Workspace API",
  "version": "0.4.0",
  "endpoints": {
    "health": "/api/health",
    "login": "/api/auth/login",
    "logout": "/api/auth/logout",
    "session": "/api/auth/session",
    "publicBusiness": "/api/public/business",
    "publicServices": "/api/public/services",
    "publicProducts": "/api/public/products",
    "publicStaff": "/api/public/staff",
    "users": "/api/users",
    "userDetail": "/api/users/{id}",
    "agents": "/api/agents (deprecated — use /api/users?type=agent)",
    "agentDetail": "/api/agents/{id} (deprecated)",
    "projects": "/api/projects",
    "projectDetail": "/api/projects/{id}",
    "tasks": "/api/tasks",
    "taskDetail": "/api/tasks/{id}",
    "integrations": "/api/integrations"
  }
}
```

### GET /api/health

```json
{
  "status": "ok",
  "version": "0.4.0",
  "timestamp": "2026-07-16T18:00:00.000Z",
  "uptime": 123.456
}
```

### GET /api/agents  **(DEPRECATED name — map to users type=agent)**

Agent/fleet list from fixtures. Supports `?status=`.

**Migration:** Prefer `GET /api/users?type=agent` once users resource lands. Response fields should drop host-only concepts (model catalog keys as primary identity) over time.

```json
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
```

### GET /api/agents/{id}  **(DEPRECATED name)**

Single record; 404 standard error when missing.

### PATCH /api/agents/{id} (EXPERIMENTAL)

In-memory fixture status mutation only. Valid status: `active`, `idle`, `error`, `offline`.

### GET /api/projects  (I6)

Business project list. Requires authenticated session.

**Filters:**

| Parameter | Type | Example | Notes |
|-----------|------|---------|-------|
| status | string | ?status=active | Filter by project status |
| q | string | ?q=website | Search name/description (case-insensitive contains) |

**Response:**

```json
{
  "data": [
    {
      "id": "proj-1",
      "name": "Website refresh",
      "description": "Update public site content...",
      "status": "active",
      "ownerUserId": "user-6",
      "ownerName": "Riley Brooks",
      "priority": "high",
      "startDate": "2026-07-01",
      "targetDate": "2026-08-15",
      "taskCount": 2
    }
  ],
  "count": 1
}
```

**Status values:** `active` | `paused` | `completed` | `archived`

### GET /api/projects/{id}  (I6)

Project detail with related tasks. Requires authenticated session. Returns 404 if not found.

**Response:**

```json
{
  "data": {
    "id": "proj-1",
    "name": "Website refresh",
    "description": "...",
    "status": "active",
    "ownerUserId": "user-6",
    "ownerName": "Riley Brooks",
    "priority": "high",
    "startDate": "2026-07-01",
    "targetDate": "2026-08-15",
    "taskCount": 2,
    "tasks": [
      { "id": "task-1", "title": "Draft homepage copy", ... }
    ]
  }
}
```

### GET /api/tasks  (I6)

Task list. Requires authenticated session.

**Filters:**

| Parameter | Type | Example | Notes |
|-----------|------|---------|-------|
| status | string | ?status=in_progress | Filter by task status |
| projectId | string | ?projectId=proj-1 | Filter by project |
| priority | string | ?priority=urgent | Filter by priority |
| assignee | string | ?assignee=user-6 | Filter by assignee user ID or name |
| q | string | ?q=homepage | Search title/description |

**Response:**

```json
{
  "data": [
    {
      "id": "task-1",
      "title": "Draft homepage copy for review",
      "description": "Write the hero section...",
      "status": "in_progress",
      "priority": "high",
      "projectId": "proj-1",
      "projectName": "Website refresh",
      "assigneeUserId": "user-6",
      "assigneeName": "Riley Brooks",
      "dueDate": "2026-07-18",
      "createdAt": "2026-07-01T10:00:00Z",
      "updatedAt": "2026-07-10T14:30:00Z"
    }
  ],
  "count": 1
}
```

**Status values:** `planned` | `in_progress` | `waiting` | `blocked` | `done`
**Priority values:** `low` | `normal` | `high` | `urgent`

### GET /api/tasks/{id}  (I6)

Task detail. Requires authenticated session. Returns 404 if not found.

**Response:**

```json
{
  "data": {
    "id": "task-1",
    "title": "Draft homepage copy for review",
    "description": "...",
    "status": "in_progress",
    "priority": "high",
    "projectId": "proj-1",
    "projectName": "Website refresh",
    "assigneeUserId": "user-6",
    "assigneeName": "Riley Brooks",
    "dueDate": "2026-07-18",
    "createdAt": "2026-07-01T10:00:00Z",
    "updatedAt": "2026-07-10T14:30:00Z"
  }
}
```

### GET /api/integrations

Optional seed; not on capability spine MVP.

---

## Target shapes (I4+)

### Public business

`GET /api/public/business`

```json
{
  "data": {
    "name": "Example Co",
    "slogan": "...",
    "logoUrl": "/brand/logo.svg",
    "description": "Purpose and production narrative."
  }
}
```

### User

```json
{
  "id": "usr_...",
  "displayName": "Alex Rivera",
  "email": "alex@example.com",
  "type": "human",
  "roleIds": ["role_admin"],
  "orgUnitId": "ou_dept_ops",
  "status": "active"
}
```

`type` is **only** `human` | `agent`.

### Org unit

```json
{
  "id": "ou_...",
  "name": "Operations",
  "kind": "department",
  "parentId": "ou_div_main",
  "path": ["div_main", "dept_ops"]
}
```

`kind`: `division` | `department` | `section` | `unit`.

### KB article (policies/processes share pattern)

```json
{
  "id": "kb_...",
  "kind": "policy",
  "title": "...",
  "body": "...",
  "orgUnitIds": ["ou_..."],
  "status": "published"
}
```

---

## Versioning

- **0.2.x** — I1–I2 seed (agents/projects/tasks fixtures).
- **0.3.0** — I3 contract rewrite; I4 public site; I5 auth + RBAC skeleton.
- **0.4.0** — I6 work surfaces: Projects + Tasks business ERD, list+detail APIs with filters, auth-gated UI tables.

## Non-goals for API v1

- Host Versa AGi control-plane operations  
- Full ERP domains (inventory, manufacturing, GL)  
- Sharing database with host AGi  
