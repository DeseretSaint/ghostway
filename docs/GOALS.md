# Ghostway — Goal Loop State

Mission: navigate people without surveillance. Quality bar: Google Maps / Apple Maps / Magic Earth.
Live: https://deseretsaint.github.io/ghostway/

## Quality scores (0-10)
| Area | Score | Notes |
|---|---|---|
| Routing engine (camera-aware) | 7 | Own graph + A* with camera cost (Wasatch Front); national coverage pending |
| Avoidance modes | 8 | strict/moderate/off toggle, per-option camera counts |
| Traffic / ETA accuracy | 2 | Static OSM speeds; UDOT live data pending |
| Nav experience (follow, voice) | 4 | Banner + GPS watch; follow-cam/voice/off-route pending |
| Visual polish | 5 | Clean dark UI; motion/states need work |
| Camera data layer | 6 | DeFlock tiles + heatmap working |

## Workstreams
- **A — Custom camera-aware routing**: own graph, A*, per-edge camera cost, STRICT/MODERATE/OFF, route options. [in progress]
- **B — Live traffic + ETAs**: UDOT open data → edge speeds/incidents. [not started]
- **C — Nav experience**: follow mode, off-route re-route, voice, speed limits. [not started]
- **D — Visual polish**: motion, states, typography, icon/splash. [not started]

## Iteration log

### Iteration 1 — Custom camera-aware routing engine (Workstream A.1–A.3, part of A.4/A.5)
Shipped:
- Built Ghostway's own road graph: Geofabrik Utah OSM → osmium → Wasatch Front
  extract (SLC→Provo) → 501k nodes / 525k edges binary (12.3 MB, 6.3 MB gz),
  with per-edge ALPR exposure penalty baked in from the 130k-camera DeFlock
  national snapshot (10,747 camera-exposed edges). `engine/build-graph.mjs`.
- New client-side router (`src/router.js`): A* over the graph, cost =
  travel-time + camWeight × camera exposure. Three modes:
  **strict** (hard avoid) / **moderate** (weighted, capped detour) / **off**.
  Mode persists in localStorage. Turn-by-turn generated from graph geometry +
  OSM street names (no external routing service needed).
- Route options card: always shows up to 3 options (Fastest / Balanced /
  Clearest) each with ETA, distance, and camera count BEFORE the user picks.
  Tap to switch; chosen route drawn teal, alternatives grey.
- Inside the Wasatch box routing is 100% on-device (~100 ms) — destinations
  never leave the phone. Outside, graceful fallback to BRouter/OSRM.
- Verified on Keaton's real corridor (Pleasant Grove → Costco Lehi):
  Fastest = 8 min / 8.2 km / 1 camera · Clearest = 9 min / 8.5 km / **0 cameras**.
- Tests: `scripts/engine-check.mjs` (engine unit), `scripts/engine-e2e.mjs`
  (full UI flow), updated `interact-check.mjs`. All pass.
Quality: Routing engine 3→7 · Avoidance modes 1→8 · Nav experience 3→4.

Next (iteration 2):
- A: Valhalla-in-Docker evaluation for national coverage + CI graph refresh.
- B: UDOT live traffic → edge speed overrides, re-ETA during nav.
- C: follow-mode camera, off-route re-route, voice guidance.
