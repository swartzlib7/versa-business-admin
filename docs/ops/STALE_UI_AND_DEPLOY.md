# Stale UI — root causes and never-again deploy rules

**Date:** 2026-07-25  
**Context:** Stephen saw no UI change on :3100 after recovery commits; also prior blank-login after version bumps.

## Two different problems (do not mix them)

### A) Frozen production build (what hit recovery review)

- Port 3100 runs **`next start`** (production server).
- That process serves whatever is in the **`.next` folder at last `next build`**.
- Git checkout / new commits **do not** update `.next` or restart the process.
- **2026-07-25 incident:** HEAD was already `dev/ui-recovery-2026-07-24` @ b4483bc (20:15), but `.next` was built **03:26** the same day. Server looked “fine” (200) while UI was old.

**Fix when this happens:** from app root on the intended branch:

```bash
npm run build
# stop old next start, then:
npx next start -p 3100
```

**Not required:** a special “anti-stale” package. Required: **build + restart (or replace container) on every deploy**.

### B) Browser / CDN caching HTML shells (earlier 0.7.52→0.7.53)

- Chrome kept long-lived prerender HTML; Firefox looked correct.
- Mitigated in `next.config.ts`: HTML routes `no-store`; hashed `/_next/static/*` stay immutable.
- After deploys: hard-refresh once if a tab was open across the cutover.

## Is it “just Next.js”?

Partly the **mode we chose**, not a mystery bug:

| Mode | Behavior |
|------|----------|
| `next dev` | Hot reload; source changes appear; not how we run the review board on :3100 |
| `next start` | Serves last build only; correct for prod-like review **if** rebuild+restart is part of the path |

Production will use the same model as `next start` (or a container that runs build at image build time). Stale UI there means **deploy pipeline skipped rebuild/restart**, not “Next forgot.”

## Do we need a always-on service to prevent this?

**For code/UI deploys: no extra daemon.** We need a **repeatable deploy unit**:

1. Checkout/ref (tag or SHA)
2. `npm ci` (when lockfile changes)
3. `npm run build`
4. Atomic restart of the process (systemd/docker/pm2)
5. Health check (`/api/health` or `/`)
6. Optional: expose **build id / git SHA** in health or footer so humans can confirm “am I on the new build?”

**Optional later (product live data, not static UI):** background jobs or websockets if the *board data* must push without refresh. That is separate from deploy staleness.

## Never-again checklist (local review board :3100)

Before asking for visual OK on a slice:

- [ ] `git rev-parse --short HEAD` matches the slice commit
- [ ] `.next` mtime **after** that commit (or fresh `npm run build`)
- [ ] `next start` process start time **after** that build
- [ ] Health 200
- [ ] Browser hard-refresh once
- [ ] Smoke the locked acceptance points (e.g. Twin static, description-once, sub-tabs)

## Production posture (target)

- Immutable artifact per release (image or build dir named by SHA)
- New release = new artifact + process replace (zero “edit files under a long-lived next start”)
- Cache-Control as in `next.config.ts` (HTML no-store; static hashed immutable)
- Invalidate CDN only if one sits in front (paths/tags on release)
- Smoke script post-deploy comparing `/api/health` build fingerprint to expected SHA

## Incident log

| When | Symptom | Cause | Remedy |
|------|---------|-------|--------|
| 2026-07-25 ~00:30 | No visible recovery UI on :3100 | Stale `.next` + long-lived `next start` | rebuild + restart; hard-refresh |
| Earlier 0.7.52→0.7.53 | Blank login in Chrome | Cached HTML shells | Cache-Control headers in next.config |

