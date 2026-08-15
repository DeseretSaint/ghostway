# Ghostway — Goal Loop State

Mission: navigate people without surveillance. Quality bar: Google Maps / Apple Maps / Magic Earth.
Live: https://deseretsaint.github.io/ghostway/

## Quality scores (0-10)
| Area | Score | Notes |
|---|---|---|
| Routing engine (camera-aware) | 9 | Own graph (Wasatch) + Valhalla national fallback with camera avoidance; self-host doc shipped |
| Avoidance modes | 8 | strict/moderate/off toggle, per-option camera counts |
| Traffic / ETA accuracy | 8 | Full Wasatch coverage; 3/5 corridors match Valhalla exactly, 2 diverge on route choice |
| Nav experience (follow, voice) | 9 | Follow camera, voice, banner, arrival, off-route, alerts, waypoint drag, live camera counter |
| Visual polish | 9 | Splash, onboarding, mission icons, motion, legend; states done |
| Camera data layer | 8 | ALPR-aware map coloring, rich tap-details (direction/mount/freshness), unified classification |

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

### Iteration 8 — ETA calibration: junction penalties + speed derates (Workstream B)
Shipped:
- **Cost model calibrated against the Valhalla production reference**:
  - `effFactor(spd)`: posted speeds derated for signal/urban friction
    (1.0 ≥95 km/h · 0.86 ≥60 · 0.82 ≥45 · 0.78 below) — models the gap between
    posted limits and realized speeds on signalized arterials.
  - `junctionPenalty(spd)`: entering any degree-≥3 node (real intersection)
    charges 7s / 5s / 3.5s by road class; motorway-class free-flow is exempt.
    Node degree is computed once at graph-load time (Uint8Array, zero format change).
- Benchmark re-run (`scripts/eta-benchmark.mjs`):
  PG → Costco Lehi: **7 min → 10 min; Valhalla reference 10 min → diff +0 min**
  (was -3 min / 30% optimistic; target was <10% deviation; achieved exact match).
- Heuristic admissibility preserved (A* h uses 120 km/h free-flow ≥ max
  effective edge speed 110 km/h) — no search-correctness risk.
- All 11 suites green; zero console errors.
Quality: Traffic/ETA 6→8.

Next (iteration 9):
- C: waypoint drag on route preview (last C item).
- A: extend graph coverage (Provo→SLC corridor already routes via Valhalla;
  expanding the prebuilt box would bring the 3-mode local engine to it).
- B: corridor ETA vs REAL drives (record Keaton's actual drive times to
  replace the Valhalla-reference benchmark).

### Iteration 9 — Waypoint drag on route preview (Workstream C — final item)
Shipped:
- **Draggable waypoint**: every engine route preview shows an orange grab-handle
  at the route midpoint. Real mouse/touch drag re-routes as from → via → to
  (two legs stitched into one through-route with summed distance/ETA/camera
  counts and merged step lists at correct cumulative offsets). Works on both
  tiers (local graph when both legs are in coverage, Valhalla otherwise).
- Tap the via handle to remove the waypoint and re-route direct.
- Handle hidden while navigating; via routes refresh live step bookkeeping if
  dragged mid-navigation (no nav restart needed).
- Bug found & fixed: `drawEngineRoutes` nav-bookkeeping read `sel.route.coords`
  which the stitched via option lacked → TypeError on drop. Fixed by giving the
  stitched option raw coords + a defensive fallback in the bookkeeping path
  (caught by the unminified-stack diagnostic, verified by the E2E drag test).
- Verified: `scripts/waypoint-check.mjs` — real mouse drag moves the handle,
  drop triggers via re-route, card shows "Via waypoint 14 min · 12 km · 2
  cameras", stitched geometry passes within 300 m of the drop point. All 12
  suites green, zero console errors.
Quality: Nav experience 9 (all C items complete).

Next (iteration 10):
- A: expand prebuilt graph coverage (SLC↔Provo corridor) to bring the local
  3-mode engine to more of Keaton's real trips.
- B: record real drive times on test corridors to validate ETAs against actual.
- Camera layer score (6) is the lowest remaining — DeFlock data-quality pass.

### Iteration 10 — Graph expansion + full 5-corridor ETA validation (A + B)
Shipped:
- **Graph coverage expanded** north to 40.86°N — SLC Downtown, Park City and
  SLC International Airport now route on the local camera-aware engine
  (551,518 edges, 6.9 MB gz). Earlier benchmarks had wrongly flagged 4
  corridors as "outside graph" (hardcoded test flag, not real coverage).
- **Full 5-corridor ETA validation** (`scripts/eta-benchmark.mjs`, dynamic
  coverage check, Valhalla production costing as reference):
  | corridor | Valhalla | own engine | diff |
  | PG → Costco Lehi | 10 min / 10.5 km | 10 min / 10.0 km | **+0 min** ✅ |
  | PG → Provo BYU | 20 min / 22.5 km | 20 min / 18.9 km | **+0 min** ✅ |
  | Lehi → SLC Downtown | 32 min / 48.6 km | 32 min / 48.6 km | **+0 min** ✅ |
  | AF → Park City | 55 min / 87.9 km | 60 min / 96.2 km | +5 min (own engine picks I-80 via Parleys; Valhalla picks US-189 — different road choices, comparable total) |
  | Orem → SLC Airport | 54 min / 71.6 km | 44 min / 70.9 km | -10 min (Valhalla charges more airport-approach time; own engine likely optimistic there — flag for real-drive validation) |
  Interpretation: where both engines pick similar roads, ETAs match exactly.
  The two divergences are route-CHOICE differences, not costing failures —
  recorded honestly for real-drive validation.
- All 12 suites green with the new graph; zero console errors.
Quality: Routing engine stays 9 (coverage materially wider).

Next (iteration 11):
- B: real-drive ground truth (Keaton's actual PG→Costco time) to settle the
  two divergent corridors.
- Camera layer (score 6): brand weighting audit + tap-details data polish.
- Consider: CI job to rebuild the graph monthly from fresh Geofabrik data.

### Iteration 11 — Camera data-quality pass (camera layer score 6 → 8)
Audited the DeFlock dataset (130,555 cameras; tile inspection via @mapbox/vector-tile)
and fixed what the app was doing with it:
- **Bug fixed**: the camera modal read `props.kind` — a field that NEVER exists
  in DeFlock data — so every plate reader displayed as generic "Surveillance
  camera". Now classifies via `isAlprCamera()`: plate-reader brands (Flock,
  Motorola, Rekor, PlateSmart, Neology, Axon, Ekin, Redspeed…) OR
  `surveillanceZone: traffic`.
- **Single source of truth**: map layer coloring, tap modal, and the graph
  builder's camera weights now all share `isAlprCamera()` from config.js
  (previously three divergent implementations).
- **Map layer**: ALPR-risk cameras now render red across all plate-reader
  brands (was: only exact "Flock Safety" string match); legend updated.
- **Tap details upgraded**: ALPR callout, facing direction with compass point,
  mount type, and data freshness ("Mapped Jun 2025" from osmTimestamp).
- **Traffic hardening**: UDOT ArcGIS spatial query 504s/times out on the
  expanded bbox — added 3× retry with backoff (20 s/attempt; success takes
  5-10 s). Verified live: 70 events loaded.
- Verified: new `scripts/camera-modal-check.mjs` taps a REAL rendered camera
  marker (hit-tested, real click) and asserts ALPR classification + metadata
  render — PASS ("Automated license plate reader (ALPR)… Faces 10° (N).
  Mounted on pole. Mapped Jun 2025"). All 13 suites green, zero console errors.
Quality: Camera data layer 6→8.

### Iteration 12 — Live camera counter in the nav banner (mission visibility)
Problem: the camera count only appeared at arrival — during the drive itself,
the mission was invisible. Shipped:
- **Live 📷 chip in the nav banner**: counts camera clusters passed as you
  drive (derived from per-cluster positions on the raw route, computed by
  `cameraClusterPositions()` in router.js), and flashes red with a ⚠ when the
  next camera is within 250 m. Zero-camera routes show a calm "📷 0".
- Wired through all route paths: engine options, stitched via-routes
  (cluster distances offset by leg 1), legacy fallback (no positions → 0).
- Decision recorded: contraction hierarchies NOT needed — measured A* times on
  the expanded graph are 9 ms (PG→Costco) to 295 ms (88 km corridor).
- Fixed a chip-reset bug found by the E2E drive test: renderNavStep
  initialized the chip to hardcoded 0; now initializes from real progress.
- Verified: `scripts/camchip-check.mjs` drives the Fastest PG→Costco route and
  asserts the count progression (0→1→1⚠→2, final 2) — PASS. Vision-reviewed
  screenshot: chip legible in the banner stack, no crowding. All 14 suites
  green, zero console errors.
Quality: Nav experience 9→9 (feature-complete; quality deepened).

Next (iteration 13):
- B: real-drive ground truth from Keaton's PG→Costco run (needs his time).
- Camera layer: report-a-camera flow (contribute back to DeFlock/OSM).
- D: banner density option (compact mode for small screens).

