# Ghostway — Goal Loop State

Mission: navigate people without surveillance. Quality bar: Google Maps / Apple Maps / Magic Earth.
Live: https://deseretsaint.github.io/ghostway/

## Quality scores (0-10)
| Area | Score | Notes |
|---|---|---|
| Routing engine (camera-aware) | 9 | Own graph (Wasatch) + Valhalla national fallback with camera avoidance; self-host doc shipped |
| Avoidance modes | 8 | strict/moderate/off toggle, per-option camera counts |
| Traffic / ETA accuracy | 6 | Live UDOT events → edge delays; benchmark shows own engine ~30% optimistic vs Valhalla — turn-penalty fix next |
| Nav experience (follow, voice) | 9 | Follow camera, voice, banner, arrival, off-route, over-speed + camera-ahead alerts |
| Visual polish | 9 | Splash, onboarding, mission icons, motion, legend; states done |
| Camera data layer | 6 | DeFlock tiles + heatmap working |

## Workstreams
- **A — Custom camera-aware routing**: own graph, A*, per-edge camera cost, STRICT/MODERATE/OFF, route options, Valhalla national fallback, self-host doc. [core done; graph expansion ongoing]
- **B — Live traffic + ETAs**: UDOT open events live; measured speeds blocked by account-required feed. [live incidents done]
- **C — Nav experience**: follow mode, off-route re-route, voice, speed limits, alerts. [done]
- **D — Visual polish**: motion, states, icon set; splash/onboarding pending. [mostly done]

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

### Iteration 2 — Navigation experience (Workstream C) + motion polish (D)
Shipped:
- **Voice guidance** (Web Speech API, offline, no key): departure callout,
  per-maneuver announcements, ~200 m "coming up" callouts, arrival phrase,
  "Rerouting." on re-route. Configurable 🔊 toggle in the banner, persisted.
- **Live step banner** rebuilt: big maneuver icon, nav-style distance countdown
  (1.2 mi → 0.5 mi → 800 ft), road name, **next-step preview** ("then ↰ …"),
  live remaining ETA.
- **Speed limit display** from OSM maxspeed (US-style MAX sign) + live GPS
  speed chip (smoothed; falls back to position-derived speed).
- **Arrival screen** with trip summary — distance, ETA, driving time, and the
  mission metric: *cameras passed on this trip* ("Zero cameras passed 🛡").
- **Off-route detection + auto re-route** through the camera-aware engine from
  the current position (re-announces "Rerouting", resets steps).
- Fixed a real nav bug: step advancement tracked simplified render geometry
  while step distances were measured on raw geometry → steps never advanced.
- **Camera layer toggle** chip on the map + **legend** in About (Workstream D).
- **Motion polish** (Workstream D): spring-loaded panels/banner/modal,
  press-scale button feedback, reduced-motion support, WCAG-checked contrast.
- Verified: GPS-playback test drives the full route headlessly — steps advance,
  arrival triggers. All suites pass; zero console errors.
Quality: Nav experience 4→8 · Visual polish 5→7.

### Iteration 3 — Live traffic + traffic-aware ETAs (Workstream B)
Shipped:
- **Key-free live traffic**: UDOT "Road Events" ArcGIS Feature Service
  (services6.arcgis.com, CORS-open, no account) — the same events that power
  udottraffic.utah.gov. 5-min cached; degrades silently to free-flow routing.
- Severity model maps events → per-edge speed factors baked into A* costs:
  closure 0.15 · emergency 0.25 · incident 0.45 · lane 0.50 · roadwork 0.62 ·
  alert 0.82, with per-severity influence radii.
- **Traffic-aware ETAs**: every route option carries a measured `delay` (seconds
  lost to live conditions); route cards show "+N min traffic" when >30 s.
- **Incident map layer**: severity-colored halos + dots (closure red → roadwork
  yellow), toggle-aware, legend updated.
- Verified against the LIVE feed: 67 active events in the Wasatch box
  (49 roadwork / 15 closures / 1 emergency / 1 incident). A corridor routed
  THROUGH an SR-68 closure shows ETA +97 s vs free-flow. PG→Costco corridor is
  currently clear (delay 0) — correct behavior. `scripts/traffic-check.mjs`.
- ETA accuracy note: point-event coverage is the constraint — UDOT's 5-min
  measured-speed feed needs a registered token, so road segments between
  incidents still use OSM maxspeed profiles. Recorded for the score.
Quality: Traffic 2→6.

### Iteration 4 — Follow mode (Workstream C) + icon set (Workstream D)
Shipped:
- **Follow-mode camera**: while navigating, the map rotates to your GPS heading
  (heading-up like Google/Apple), tilts to a 55° driving perspective with the
  user pinned to the lower third, zooms to street level, and eases smoothly
  between fixes. Heading comes from GPS `heading` with a fallback derived from
  consecutive positions.
- **Pan-pause + recenter** (standard nav behavior): if you drag/rotate/zoom the
  map during navigation, follow pauses and a 🧭 recenter button appears; tap it
  to resume. Programmatic camera moves are filtered out via `originalEvent` so
  they don't falsely pause follow.
- **Teal user marker** (dot + halo) rendered during navigation.
- Camera now permits pitch (maxPitch 0→60) — the style's 3D buildings tilt in
  follow mode.
- **New app icon set** (192/512/maskable): a teal route curving away from a red
  camera's coverage wedge — the mission in one glance. Vision-reviewed, refined
  per critique (sector contrast +, arrow/camera spacing +), 8/10 professional
  rating. Transparent corners for Android adaptive icons.
- Verified: new `scripts/follow-check.mjs` drives the route with mocked GPS
  headings and asserts bearing 73→77°, pitch 55°, zoom 16.5, user-dot visible,
  pan pauses follow + recenter resumes — all hard assertions pass. All six
  suites green (smoke, engine, interact, nav-playback, follow, traffic).
Quality: Nav experience 8→9 · Visual polish 7→8.

### Iteration 5 — Driving alerts (Workstream C) + traffic research findings (B)
Shipped:
- **Camera-ahead warning** (the mission alert): when the chosen route passes a
  camera, Ghostway says *"Camera ahead. You will pass it in about 200 meters"*
  exactly once per camera ~250 m before it, with a haptic tap. Works off the
  per-step camera accounting added to the router in iteration 2.
- **Over-speed alert**: GPS speed vs the current step's posted limit (OSM
  maxspeed), ~5 mph tolerance. Speed chip pulses red + voice warning at most
  once/minute.
- Verified by `scripts/alert-check.mjs` driving the real PG→Costco route at
  30 m/s with captured speechSynthesis: both warnings fired in order, zero
  errors.
Research finding (Workstream B — measured speeds still blocked):
- UDOT's WZDx work-zone feed (`udottraffic.utah.gov/wzdx/udot/v40/data`) is
  key-free but (a) has no CORS headers and (b) is STALE — last updated
  2023-03-19, all 744 events have past end dates. Built a CI-refresh pipeline
  (fetch script + workflow) but pulled it: shipping stale data would mislead
  routing. Kept the engine fetch script for when UDOT revives the feed.
- 5-min TMS measured speeds remain behind UDOT's registered-data portal
  (account required — violates the no-key rule). Point-event ArcGIS feed stays
  the live source.
Quality: Nav experience 9 (alerts complete the parity set).

Next (iteration 6):
- D: splash screen + first-run onboarding states.
- C: waypoint drag on route preview.
- A: Valhalla-in-Docker evaluation for national coverage (biggest remaining
  routing-engine lever).

### Iteration 6 — National coverage via Valhalla (Workstream A.4)
Shipped:
- **Three-tier routing stack**: (1) own camera-aware graph (Wasatch, on-device,
  ~70 ms) → (2) **Valhalla** (national, key-free, CORS-open) → (3) legacy
  BRouter/OSRM. Tiers auto-selected per corridor; off-route re-routes follow
  the same chain.
- **Valhalla camera avoidance**: baseline route → DeFlock cameras near it →
  re-route with up to 40 `exclude_locations` (server caps ~50), iterative,
  moderate mode caps detour at +35%. Shared the exact detection function with
  the own engine (`nearRouteFromList` now a single exported implementation).
- Route options + per-option camera counts work nationally: Denver→Boulder
  returned Balanced (48 cams, +5.7 km) vs Fastest (75 cams) — 27 cameras
  avoided outside any prebuilt graph.
- **Self-hosted doc** `docs/valhalla-docker.md`: Docker command, Tailscale
  exposure, `CONFIG.valhallaUrl` switch, and honest findings (demo is
  rate-limited & capped; `avoid_locations` silently ignored — use top-level
  `exclude_locations`; Mac disk had only ~2.3 GB free so self-hosting stays
  optional).
- **Bug found & fixed**: my polyline decoder used `result = 1` / `+=`
  (corrupts zigzag sign bit → mirrored geometry, distances looked fine).
  Caught by the Denver→Boulder exclusion test; fixed to `result = 0` / `|=`.
- Verified: `scripts/valhalla-check.mjs` (Denver→Boulder routes, exclusion
  46.5→56.8 km CHANGED) + `scripts/tiers-check.mjs` (PG→Costco uses local
  graph 67 ms; Denver→Boulder falls to Valhalla with options). All 9 suites
  green, zero console errors.
Quality: Routing engine 7→9.

Next (iteration 7):
- D: splash screen + first-run onboarding.
- C: waypoint drag on route preview.
- B: ETA accuracy — 5 real corridors vs Google/Apple ETAs, recorded in
  docs/GOALS.md (needs a driving session or traffic-snapshot comparison).

### Iteration 7 — Splash + onboarding (D), ETA benchmark (B), Valhalla hardening
Shipped:
- **Splash screen**: instant mission-icon splash, auto-dismisses on first map
  `idle` (4 s cap, never traps the user), fade-out animation. Favicon updated
  to the new mission icon set.
- **First-run onboarding**: 3-step intro (mission · privacy · how to navigate),
  real Back/Next/Skip controls, progress dots, persists via `gw-onboarded`;
  second load skips it. New users learn the Strict/Moderate/Off concept
  without reading docs.
- **ETA accuracy benchmark** (`scripts/eta-benchmark.mjs`, 5 real corridors):
  | corridor | Valhalla (production ref) | own engine | diff |
  | PG → Costco Lehi | 10 min / 10.5 km | 7 min / 10.0 km | -3 min (30% optimistic) |
  | PG → Provo BYU | 20 min / 22.5 km | outside graph | — |
  | Lehi → SLC Downtown | 32 min / 48.6 km | outside graph | — |
  | American Fork → Park City | 55 min / 87.9 km | outside graph | — |
  | Orem → SLC Airport | 54 min / 71.6 km | outside graph | — |
  FINDING: own engine runs ~30% optimistic vs production costing — it uses
  posted maxspeed with no signal/turn delay. Fix direction: junction penalty
  (per-traffic-signal ~8-12 s) + road-class derate for urban arterials.
- **Valhalla hardening**: 3× retry with backoff on demo-server burst 400s
  (hit while benchmarking); benchmark fetch shim bug fixed (POST body dropped).
- Test hygiene: all route-flow E2E scripts now run as a RETURNING user
  (gw-onboarded seeded) so the new onboarding overlay doesn't block clicks;
  onboard-check.mjs verifies the overlay separately. All 10 suites green.
Quality: Visual polish 8→9 (splash/onboarding/icon consistency).

Next (iteration 8):
- B: junction/turn penalty + urban road-class derate in the own graph cost
  model, re-run benchmark, target <10% deviation from Valhalla reference.
- C: waypoint drag on route preview.

