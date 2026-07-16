# Git Workflow — Mission Control (versa-admin-system)

**Project:** #26  
**Updated:** 2026-07-15  
**Owner:** COA (orchestration) + web-dev (implementation)

## Branch model

| Branch | Purpose | Who merges into it |
|--------|---------|-------------------|
| `master` | Stable production line | Stephen (or COA on his explicit promote) from `beta` only |
| `beta` | Integration / testing / demos | COA after reviewing agent work; Stephen for his own test merges |
| `agent/coa` | COA long-lived work branch | COA |
| `agent/web-dev` | web-dev long-lived work branch | web-dev (or COA when coordinating) |

Optional short-lived branches: `feature/<slice>` off the owning agent branch when a slice needs isolation. Merge feature → agent branch → `beta`.

## Flow

1. Agent does work on `agent/<name>` (or a feature branch off it).
2. Agent (or COA) merges clean work into `beta` for integration testing.
3. Stephen tests on `beta` (or a deploy from `beta`).
4. At release intervals, Stephen merges `beta` → `master`.

## Rules

- Do **not** commit half-finished work to `master`.
- Prefer `master` protected: only promote via `beta`.
- Before starting a slice: `git fetch` (when remote exists) and rebase/merge from `beta` so agent branches stay current.
- COA may pull `agent/web-dev` into `agent/coa` or `beta` after review; web-dev may pull from `agent/coa` when COA lands planning/docs.
- Commit messages: descriptive, imperative mood.

## Remote

- Remote: `git@github.com:swartzlib7/versa-agi-mission.git` (GitHub, private).
- SSH key on this host authenticates as `swartzlib7`.
- After remote exists:

```bash
git remote add origin git@github.com:swartzlib7/<repo>.git
git push -u origin master beta agent/coa agent/web-dev
```

## Local baseline (2026-07-15)

- LAN `allowedDevOrigins` fix committed on all branches (`6b1ef4e` and docs follow-up).
- Branches created locally: `master`, `beta`, `agent/coa`, `agent/web-dev`.
- Pushed 2026-07-16: master, beta, agent/coa, agent/web-dev at 0c10c19 (includes Stephen notes).
