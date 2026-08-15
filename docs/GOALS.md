# Ghostway — Goal Loop State

Mission: navigate people without surveillance. Quality bar: Google Maps / Apple Maps / Magic Earth.
Live: https://deseretsaint.github.io/ghostway/

## Quality scores (0-10)
| Area | Score | Notes |
|---|---|---|
| Routing engine (camera-aware) | 7 | Own graph + A* with camera cost (Wasatch Front); national coverage pending |
| Avoidance modes | 8 | strict/moderate/off toggle, per-option camera counts |
| Traffic / ETA accuracy | 6 | Live UDOT events → edge speed factors + delay on cards; measured-speed data pending |
| Nav experience (follow, voice) | 9 | Follow-mode bearing camera, pitch, pan-pause + recenter; voice + banner + arrival |
| Visual polish | 8 | Mission icon set (route avoiding camera's gaze), motion, legend, layer toggle; splash next |
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

Next (iteration 5):
- D: splash screen polish + first-run onboarding state design.
- C: waypoint drag on route preview; speed-limit over-speed alert.
- B stretch: probe UDOT TMS 5-min speed feeds for a no-token endpoint.
- A: Valhalla-in-Docker evaluation for national coverage.

