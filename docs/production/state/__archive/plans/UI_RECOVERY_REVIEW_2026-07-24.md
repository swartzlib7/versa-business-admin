# UI recovery review — 2026-07-24

**Trigger:** Stephen — unhappy with UI after web-dev handoff; Twin inconsistent/animated without request; zone layouts worse than earlier.
**Branch:** `dev/ui-recovery-2026-07-24` @ `204b762` (union of all known tips)
**Reviewer:** COA · Task #198
**Policy:** No new web-dev slices until Stephen agrees recovery path.

---

## 1. Branch consolidation (nothing missed)

| Ref | Tip | Relation to beta `204b762` |
|-----|-----|----------------------------|
| `origin/beta` | 204b762 | **same** |
| local `beta` | 204b762 | **same** |
| `origin/agent/web-dev` | 204b762 | **same** |
| `webdev-agent/agent/web-dev` | 204b762 | **same** |
| web-dev workspace `agent/web-dev` | 204b762 | **same** (ahead of its stale remote-tracking `coa-workspace/beta` label only) |
| `agent/coa` / `origin/agent/coa` | 0bf3c58 | **ancestor** of beta (fully merged long ago) |
| `webdev-agent/beta` | df97fcf | **ancestor** of beta (older local beta in web-dev box) |
| local stale `agent/web-dev` name @ 2dc9b41 | 2dc9b41 | **ancestor** (name not updated; tip content is in beta) |

**Conclusion:** Every cycle code that exists on COA, web-dev, or origin is already in `beta` at `204b762` (0.7.54).
Created branch **`dev/ui-recovery-2026-07-24`** from that tip as the single recovery base. No orphan commits found outside this line.

---

## 2. Twin 3D — what changed and what was unrequested

### 2.1 Current behavior (HEAD)

| Surface | Animation | Code |
|---------|-----------|------|
| Dashboard full hub | **Static by default** (`useState(0)`); user can raise Speed | `dashboard/page.tsx` — I5.6.31 matches Stephen 2026-07-22 |
| Organization zone twin | **`animSpeed = 1` (always live)** | `zone-config-view.tsx` |
| Collaboration zone twin | **`animSpeed = 0` (static)** | same |
| Environment zone twin | **`animSpeed = 0` (static)** | same |

```ts
const twinAnimSpeed = config.id === "organization" ? 1 : 0;
```

### 2.2 Provenance (not introduced by latest web-dev alone)

| Commit | Author | Effect on Twin |
|--------|--------|----------------|
| **363a79b** I5.6.19 (2026-07-20) | COA | **Introduced** org=1 / collab·env=0 with comment "static twins on collab/env; org keeps gentle motion" |
| **30f9d2d** I5.6.31 (2026-07-22) | COA | Stephen asked: hub spheres **not animated by default** + hideable twin drawer. Dashboard default → 0. **Zone org twin left at 1** (comment retained). Drawer + localStorage shipped. |
| **b55fa05** 0.7.53 Slate | web-dev | Did **not** change `twinAnimSpeed` |
| **204b762** 0.7.54 zone nav | web-dev | Only **reformatted** the same ternary (dropped comment). Behavior unchanged. |
| **8455b05** Architect theme | line | Scene palette follows light/dark/architect — Twin *look* can differ by theme without motion change |

### 2.3 Stephen complaint — assessment

Cross-page motion inconsistency is real (Org live vs Collab/Env static).
I5.6.31 request was static-by-default for hub spheres; leaving Org twin at 1× was a **COA carry-forward from I5.6.19**, not a Stephen ask in the drawer slice.
Latest web-dev slices did **not** invent the asymmetry, but handoff volume made the product feel like Twin was touched while chrome was rewritten around it.
Theme/sticky chrome changes also make Twin *feel* different (framing, colors) even when orbit math is unchanged.

### 2.4 Recommended Twin recovery (propose; do not ship until Stephen OK)

| Option | Change | Risk |
|--------|--------|------|
| **A (recommended)** | All three zone twins `animSpeed={0}`; keep dashboard Speed control | Aligns with I5.6.31 intent; one-line fix |
| B | All zone twins follow shared default 0 + optional small control in drawer | Slightly more UI |
| C | Restore pre-drawer always-visible twin layout | Undoes Stephen-requested drawer — **not recommended** |

---

## 3. Three zone pages — layout trajectory

All three routes are thin wrappers → shared `ZoneConfigView`:
`/organization` · `/collaboration` · `/environment`

### 3.1 Reference points that felt stronger

| Era | Commit | Why |
|-----|--------|-----|
| I5.6.19–.31 | 363a79b → 30f9d2d | Clear content/twin split; drawer matches Stephen; less chrome churn |
| Pre dual-sticky | before b55fa05 | No competing sticky rows |

### 3.2 What drifted

| Commit | Slice | Layout effect |
|--------|-------|----------------|
| aaf5894 / 8455b05 | Settings chrome + Architect theme | Global look shifted |
| **b55fa05** 0.7.53 | Slate + sticky layout | **Dual sticky** → blank band ~150px, Show/Hide Twin overlap (Stephen morning report) |
| **204b762** 0.7.54 | Zone nav UX | **Single sticky** header+tabs; sub-tab description outside card; large rewrite. Fixes morning defects; still different rhythm than mid-I5.6.31 |

### 3.3 Structural layout now (0.7.54)

1. App header sticky top-0 h-14
2. Zone: one sticky block top-14 — identity row + primary tabs
3. Body: lg:grid-cols-5 when twin open (3+2) else full width
4. Sub-tabs + description above card body (stable; no jump Executive→Policy)
5. Twin drawer: framed zone hub, no canvas chrome, click spheres → tabs

### 3.4 Assessment

Functional fixes in 0.7.54 are real (jump, blank band, twin button coverage, Records description, Settings/Glossary parity).
Aesthetic/IA feel may still lose to earlier zone pages: cumulative themes, denser sticky chrome, simplified FormPanel, Twin motion asymmetry.
Process failure: sequential web-dev slices without freeze-and-compare against golden zone+Twin state.

---

## 4. Process failure (own this)

1. Successive web-dev slices without visual regression gate against golden screenshots.
2. Twin policy (org animated) left inconsistent with Stephen static-default intent from I5.6.31.
3. COA PASS on 0.7.54 verified listed acceptance items, not "does this still feel like the Twin/zones Stephen liked."

---

## 5. Proposed recovery path (await Stephen)

1. **Freeze** web-dev — no new UI assign (already standby).
2. Keep working on **`dev/ui-recovery-2026-07-24`** (not beta) for recovery commits.
3. **Twin:** Option A — all zone twins static (`twinAnimSpeed = 0`).
4. **Zones:** Stephen marks preference:
   - (i) 0.7.54 chrome + static twins only, or
   - (ii) restore zone shell closer to **30f9d2d** (post-drawer, pre-Slate dual-sticky) while keeping any 0.7.54 fixes he still wants.
5. Optional: pin golden screenshots under `docs/coa/golden/` before next handoff.
6. Only after Stephen sign-off: merge recovery → beta, then carefully scoped work if needed.

---

## 6. Out of scope this review

- DB wrap 0.7.52 / API correctness
- Buffer, interview, Wave
- Reverting beta until Stephen chooses path (ii)
