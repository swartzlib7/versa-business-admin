# R3F layout proposal — **SUPERSEDED**

**Status:** Historical seed research only. **Do not implement from this file.**

**Superseded by:** `docs/specs/MISSION_CONTROL_ERD_KEYSTONE.md` (v1.1, 2026-07-18)

---

## Why superseded

This early proposal assumed:

- Agent fleet status in the sidebar  
- Games of Life as the default 3D graph  
- Agent activity nodes as primary visualization  

Those conflict with binding product boundaries:

- Business Mission Control, **not** agitop  
- Agents are only a **user type**  
- 3D graph = Organization / Collaboration / Environmental zones  

## Current layout direction (summary)

| Layer | Direction |
|-------|-----------|
| Sidebar (2D) | Business nav: Dashboard, Users, Roles, zone surfaces, Settings — **no** Active Agents / Agent Status |
| Header (2D) | Search, profile, familiar business chrome |
| 3D viewport | Keystone ERD: Organization departments (spheres), Collaboration parties, Environmental context; Versa AGi brand; lightbox expand; billboard labels |
| Detail (2D) | Zone UI pattern — configure same-level links and reach into other zones |

## Original seed text (archived below for history)

### Overview
The admin system will feature a hybrid layout: a standard 2D management interface (shadcn/ui) with an integrated 3D viewport (R3F) for immersive data visualization.

### 1. Sidebar (2D) — obsolete ideas
- Navigation to project views, **agent logs**, system settings — **agent logs / fleet status removed from product direction**
- **Agent Fleet Status** — **removed** (agitop territory)

### 2. Header (2D)
- Global search, user profile — still reasonable

### 3. Main content (hybrid)
- 3D viewport + 2D data grid — still reasonable **if** 3D follows keystone ERD, not Games/agents

### Obsolete 3D ideas
- Agent activity nodes, token usage spheres — **do not build**
- Games of Life constellations as core UX — **do not build**

---

*For implementation, read the keystone + PRODUCT_SPEC only.*
