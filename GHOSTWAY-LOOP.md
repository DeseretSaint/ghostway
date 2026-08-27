# Ghostway Autonomous Refinement Loop

Shared ledger for the self-improvement cron. Each run reads this, picks a NEW
angle not yet marked done, implements + verifies, then logs here. Continuity is
OFF — this file is the only memory between runs. Keep it tight.

## Mission
Take Ghostway (camera-avoiding navigation, ~/projects/ghostway) to Google/Apple
Maps parity in appearance + navigation, while keeping its mission: route people
without passing Flock/ALPR cameras. 100% open source, no API keys at runtime,
free, privacy-first.

## Hard constraints (never violate)
- No API keys at runtime. No telemetry. No tracking.
- Push to main auto-deploys via .github/workflows/deploy.yml.
- Verify EVERY change: npm run build → scripts/*.mjs (real hit-testing, real
  GPS playback, headless screenshots + vision_analyze). Never ship "should work".
- Keaton tests on iPhone, Pleasant Grove UT, corridor PG→Lehi/Costco.

## Improvement axes to rotate through (mark done when landed + verified)
- [ ] Visual quality: splash/onboarding polish, icons, motion, contrast, legend
- [ ] Route geometry: line follows roads (no building cuts), corner preservation
- [ ] Camera avoidance: distance margin so plates can't be read at speed; brand
      weighting; community reports feed routing
- [ ] ETA accuracy: junction penalties, live traffic, measured-speed gaps
- [ ] Navigation UX: follow mode, voice, waypoint drag, compact banner, alerts
- [ ] Search: location bias, POI entrance resolution (airport/campus), ranking
- [ ] Speed: graph load time, route compute, bundle size, lazy loading
- [ ] Privacy/security: no leaks, no third-party calls w/o consent, data handling
- [ ] Data freshness: camera snapshot, traffic, WZDx — CI refresh robustness
- [ ] Coverage: graph region expansion, national fallback (Valhalla) resilience
- [ ] Accessibility: touch targets, font sizes, dark contrast, reduced motion

## Angles already landed (do NOT re-do; pivot to a new sub-angle)
- iterations 1-19: graph engine, 3 modes, Valhalla fallback, traffic, follow
  mode, alerts, waypoint drag, splash, onboarding, ETA calibration, camera data
  quality, report-a-camera, compact banner, README, nationwide WZDx, field fixes
  (search bias, airport entrance, camera-ahead). See docs/GOALS.md for scores.
- 2026-08-26 (round 20): mid-zoom heatmap clustering — heatmap-opacity now a
  zoom interpolation (0.75 through z10.5 → 0 by z12.5), so density blobs fade
  exactly as camera dots take over (circle minzoom 11). Measured: z9.5 1.17%
  coverage → z12.5 residue 0.05% (was 1.06%, 90% of low-zoom). Also fixed
  heatmap-check.mjs: isolate circle layer before measuring (dots matched the
  heat ramp colors → false residue) + race b.close() (hung forever under
  swiftshader). Suite now exits PASS in ~40s.
- 2026-08-26 (round 21): camera-avoidance safety floor — strict mode now HARD-
  forbids edges with exposure >160 (≈ any road passing <30 m from an ALPR
  camera; builder scores (1-d/100)·255 sampled ≤40 m apart, worst-case ≥163),
  with endpoint exemption (first/last road may sit beside a camera) and a
  soft-weighting fallback when the floor makes the pair unreachable. New
  scripts/avoidance-audit.mjs measures true min camera distance (10 m steps,
  raw graph geometry, 127k ALPR cams indexed) on 5 corridors. Before: 4/5
  Clearest routes passed 5-25 m from cameras (within read range). After: all
  ≥30 m (165/100/96/40 m); BYU is provably camera-walled (no ≥32 m path
  exists at any floor) → served best-effort + honest "⚠ best effort" badge in
  the route card (verified in real headless UI).
- 2026-08-26 (round 22): test-infra hardening — hit-tests no longer false-FAIL
  on SVG icons (SVGAnimatedString className coerced via getAttribute; hits on
  descendants count as control hits); interact-check waits for splash dismiss
  + polls preview server until up (was fixed 2.5s sleep → flaky refused);
  every puppeteer suite now has a 150s watchdog + browser.close() race so no
  suite can hang CI/cron forever. interact-check went from hang+false-FAIL to
  PASS in 31.7s; report/compact/engine-e2e/smoke/heatmap all PASS, clean exits.
- 2026-08-26 (round 24): security — XSS hardening. Externally-editable strings
  (OSM street names in nav banner + route steps, DeFlock camera brand/operator/
  mount in the camera modal, community-report brand/note/noteId in the report
  modal) were interpolated raw into innerHTML → real stored/reflected XSS
  surface (anyone can edit OSM; DeFlock ingests those tags). Added escHtml()
  in utils.js and escaped all 10 injection points in main.js + ui.js. New
  scripts/xss-check.mjs E2E injects `<img src=x onerror=...>` via localStorage
  reports + hostile step names, clicks the REAL rendered report dot, asserts
  zero injected elements + no onerror fire + payload visible as literal text.
  Red-green verified: reverting one escape → payload EXECUTES (fired:true);
  with fix → inert. smoke/interact/report/camchip/compact/engine-check/
  engine-e2e all PASS, zero console errors.
- Known remaining: real-drive ETA ground truth (blocked on Keaton's PG→Costco time).

## Improvement Queue
Research-only runs (locked or warm-deploy) append ideas here. Edit runs pull
from this queue first when it's non-empty.
- [x] Mid-zoom heatmap clustering (visual noise reduction) — landed 2026-08-26
- [x] Route-line anti-cut: Douglas-Peucker already in; audit edge cases on highways
      — RESOLVED 2026-08-26 (round 31): new scripts/geometry-audit.mjs proves the
      DP invariant on 9 real routes (5 corridors × modes): every raw point ≤3 m
      from the drawn line (worst 2.99 m), endpoints kept, 18-43% of points kept.
      Red test: tol=100 m drops a 90° corner → metric flags 67.5 m deviation.
- [ ] Speed: chunk the graph load / show progress; measure on throttled connection
- [x] Test infra: interact-check menuHit/gpsHit return {} (elementFromPoint hits
      SVG child; SVG className is SVGAnimatedString, not string) → false FAIL
      risk; also add watchdog to every puppeteer suite (browser.close() hangs
      under swiftshader — hit twice this round) — LANDED 2026-08-26 (round 22)
- [ ] Camera-walled destinations: BYU has no ≥30 m approach road; consider
      "clear within N m of endpoint" messaging or parking-gate snapping
      — MEASURED 2026-08-26 (slot-A research, /tmp/gw-byu-approach.mjs):
      exposed tail is only **118 m of driving** (4 edges, North Canyon Rd,
      ALL floor-violating; min camera distance 17 m = inside ALPR read range).
      Clear network from PG = 496,997/527,282 nodes (94.3%); it ends at a gate
      node on North Canyon Rd (-111.65612,40.25350) just **117 m straight-line
      from the BYU dest**, itself 51 m from nearest cam (clear). Dest itself
      sits 70 m from a Genetec ALPR. FIX SPEC (router.js blocked until the
      live nearestNode changeset lands): when strictFallback fires, compute
      tail = forward legal-only BFS from s (clear set) + reverse min-distance
      Dijkstra from t to first clear node; if tail ≤ ~200 m, snap the strict
      route to the gate node and message "clear to within ~120 m of
      destination — final approach passes a camera" instead of generic
      "best effort". Technique is generic for any camera-walled destination.
- [x] Test infra: ux-shots/shot/ux-audit/pwa-check still use fixed sleeps
      (2.5-2.6s) for vite preview startup — same flaky class interact-check
      had (ERR_CONNECTION_REFUSED on npx cold-start); port the poll-until-up loop
      — LANDED 2026-08-26 (round 23): shared scripts/lib-preview.mjs
      (spawn+poll-until-200); all 5 suites on it. Also fixed shot.mjs stale
      flow (waited for hidden #goBtn → 30s timeout; now suggestion-pick +
      auto-route, in-page click w/ retry for stale handles) and ux-shots/shot
      teardown hang (no process.exit → watchdog exit 2 after "done").
- [ ] Test infra: engine-e2e startNavBtn hit-test returned maplibregl-canvas
      (banner still showed + click worked) — investigate whether the collapsed
      panel overlaps the button center after strict re-route
- [x] PRIORITY camera-avoidance: RESOLVED 2026-08-26 (round 25) — FALSE ALARM.
      The "10 strict-legal edges at 4.3-25.1 m" came from a stride bug in the
      /tmp audit script (read edge endpoints at offA+e instead of offA+e*4 →
      garbage geometry; 411k/551k edges decoded out-of-range). Corrected audit
      (now scripts/floor-audit.mjs): shipped graph has 0 violations, min true
      distance 30-40 m bucket. Rebuild `node engine/build-graph.mjs` produced a
      BYTE-IDENTICAL graph (cmp clean) — the Aug 15 .gz already honored the
      floor. No graph change shipped; the permanent guard is the deliverable.
- [x] Data freshness: camera-refresh.yml (monthly) only refreshed the shipped
      public/cameras/cameras.geojson fallback — RESOLVED 2026-08-26 (round 29):
      new .github/workflows/graph-refresh.yml (2nd of month, day after camera
      refresh): fetch cameras → Geofabrik utah pbf → osmium filter/extract/
      export → build-graph → GATES (floor-audit 0 violations + engine-check
      PASS) → commit graph .gz + cameras.geojson. Pipeline proven locally:
      fresh Aug 25 pbf + fresh DeFlock (135,696 cams) → rebuild 1.8s →
      floor-audit PASS (0 <31.4 m), engine-check PASS, avoidance-audit PASS,
      smoke + engine-e2e PASS. camera-refresh.yml kept as-is (lightweight
      fallback refresh on the 1st).
- [x] Ops: stale-lock handling verified 2026-08-26 (round 25): found 49-min-old
      lock from a crashed research run; confirmed holder dead (no live procs,
      its queue findings uncommitted in working tree), deleted it, proceeded.
      Rule stands: lock >60 min stale (or holder provably dead) → delete + go.
- [x] NEXT RUN (crashed-run cleanup, found 2026-08-26 ~17:40 MST) — RESOLVED
      2026-08-26 (round 26): finished the multi-region/lazy-load refactor the
      crashed run left uncommitted. Fixed a real regression it introduced:
      stray `return;` in routeWithFallbacks killed the Valhalla fallback when
      the local engine failed (HEAD fell through correctly). Restored boot
      preloadEngine() (13 suites wait for __ghostwayEngine==='ready' at load;
      lazy-only would break them + first-route latency) while keeping the
      region-aware loadGraph/regionCovers/ensureLocalEngine architecture for
      future regions. Dropped dead mapCenter/mapZoom config (nothing read it;
      boot view = last-known pos else Wasatch default). Fixed prepare-roads.mjs
      header (output is a gitignored regenerable artifact, not committed).
      Committed the .ghostway-ux.lock deletion (git hygiene). Verified: build
      exit 0; engine-check/smoke/engine-e2e/interact-check/report-check/
      xss-check all PASS, zero console errors.
- [ ] ETA accuracy (found round 33): AF→Park City own-engine +8 min vs Valhalla is a ROUTE-CHOICE gap, not speed model — engine picks a 96.3 km path (42.8+44.6 km @113 unnamed freeway legs) vs Valhalla's 87.9 km. Investigate which corridor (I-80 via Parley's vs US-189/US-40) each takes and why A* prefers the longer one (likely junction-penalty/edgeFactor asymmetry or a missing shortcut edge).
- [ ] ETA (round 35 NEXT RUN — MEASURED 2026-08-26, RESEARCH-ONLY): standalone Dijkstra over shipped GWR1 graph (replicating router.js cost exactly: effFactor+junctionPenalty) disproves the "belt longer in graph" theory. DISTANCE: belt corridor AF→I15×I215→I215×I80→PC = 87.70 km vs straight AF→I15×I80→PC = 88.48 km (belt 0.78 km SHORTER). TIME: belt 74.7 min vs straight 69.5 min → engine correctly prefers straight on time. BUT engine's REAL chosen path = 96.3 km, ~8 km longer than graph's time-optimal straight corridor (86.5 km). CONCLUSION: true bug = engine adds ~8 km detour at the I-15/I-80 downtown interchange (over-aggressive junctionPenalty / edgeFactor asymmetry on the merge), NOT belt-vs-straight. FIX NEXT: instrument planRoutes AF→PC to dump chosen node seq + per-leg cost; compare engine 96.3 km path to graph 86.5 km corridor to localize the penalty. Requires importing src/router.js → BLOCKED until the 16-file lazy-engine changeset (config.js/main.js/map-view.js) is committed/abandoned (don't touch in grace window).
- [x] ETA route-choice "ROOT CAUSE FOUND" (2026-08-26 research) — DISPROVEN 2026-08-26 (round 35): the "I-215 south leg missing from OSM" theory is FALSE. Verified via Overpass + shipped-graph decode (scripts reuse): the I-15/I-215 junction is at **40.6355°N** (not ~40.618), all 3 connecting ramps ARE in OSM (ways 31534919/31534974/1042842430), the belt is fully in the graph (969 edges, 2 components = both carriageways, normal) and DIRECTED-reachable from I-15@40.63 = 912/971 nodes (the 59 unreachable are a minor NW-corner stub near 40.835). I-80 reachable 1051/1054. A forced hop (I-15@40.62 → I-80@-111.80) PROVES the engine DOES route onto the belt (11.5 km "(unnamed)" = belt carriageway + 8.6 km I-80, 20.3 km). So the belt is present, connected, and usable. CORRECTED root cause: AF→Park City gap is a genuine **A* route-choice/cost** issue — engine takes 43.1 km unnamed (I-15 straight through the I-15/I-80 downtown interchange) + 44.6 km I-80 = 96.3 km, while Valhalla uses I-15→Belt→I-80 = 87.9 km (belt saves ~8 km). A* is NOT selecting the belt even though it's reachable and shorter in Valhalla. Likely a junction-penalty / edgeFactor asymmetry (belt has spd 113 like I-15, so the cost difference is purely path-length — belt may be longer in *graph* geometry than I-15-through-downtown, OR a turn penalty at the I-15→belt hop discourages it). NEXT RUN: instrument planRoutes AF→PC to dump chosen node sequence + belt-node hits; compare graph-distance of I-15-straight vs I-15→belt→I-80 paths to see whether A* is correctly minimizing a longer-than-real belt path (graph fidelity) or wrongly preferring I-15 (cost bug). Do NOT queue an OSM edit — no OSM fix needed.
- [ ] Privacy audit 2026-08-26 (CLEAN, no action): enumerated every runtime
      third-party call — openfreemap tiles, DeFlock MVT camera tiles, photon
      geocoding, brouter/osrm/valhalla routing, UDOT arcgis traffic, OSM notes
      + overpass (camera reports). All documented open-data sources; zero
      telemetry; geolocation used locally only. Live site 200 in 0.66s.
- [ ] Data freshness 2026-08-26: camera snapshot asOf 2026-08-15 (11 days old,
      fine); camera-refresh.yml next fires Sep 1 13:40 UTC. Still only
      refreshes public/cameras/cameras.geojson, not graph cam bytes (see
      existing queue item re: monthly rebuild CI hook).
- [ ] Ops (found 2026-08-26 18:45 MST): working tree holds an UNCOMMITTED
      coherent changeset not authored by this loop: boot preloadEngine()
      removed → fully lazy ensureLocalEngine() on all 3 route paths; neutral
      CONFIG.mapCenter (CONUS z4) default view in map-view.js; 13 suites
      ported from waiting __ghostwayEngine==='ready' to __gw boot wait
      (engine-e2e now asserts engine-ready AFTER routing); drawer credits
      WZDx. File mtimes 18:38-18:42, stable on re-check = another session's
      in-flight refactor. DO NOT commit/revert/edit these 16 files until the
      owner commits or abandons. If still uncommitted + stale (>24 h, mtimes
      unchanged), a future run may verify (build + suites) and land it as its
      own round, crediting it as the lazy-engine/neutral-view round.
- [x] ETA AF→Park City route-choice "8 km detour" theory — DISPROVEN 2026-08-26
      (round 36, instrumented). Directed exact-cost Dijkstra over the shipped
      graph (same effFactor+junctionPenalty+nodeDeg as router.js, directed arcs)
      returns 96.27 km / 62.7 min = BYTE-IDENTICAL to the engine's A* path
      (1051 arcs). A* is PROVABLY OPTIMAL — no search bug, no over-aggressive
      junction penalty, no interchange detour. Engine path = I-15 (Veterans Mem
      40.9 km) straight through downtown → I-80 (Eisenhower 37.9 km). The gap vs
      Valhalla (87.9 km) is a COST-MODEL/GRAPH-FIDELITY gap: under the engine's
      costing the straight corridor (68.1 min) beats the belt (77.9 min), so the
      engine correctly minimizes its own time model; Valhalla's model finds the
      belt faster. NOT a router defect — it's ETA calibration on this corridor.
      Belt facts measured: "Belt Route" freeway IS in the graph (969 edges,
      89.7 km @ spd 113, south segment 40.62-40.65 bidirectional 14.4+14.3 km),
      connected, T reachable from mid-belt in 37.4 min. Prior "belt corridor"
      numbers were polluted by nearestNode snapping J1/J2 to surface streets
      (Lombardy Dr / Wasatch Blvd), not the freeway. NEXT (if pursued): nudge
      freeway effFactor or belt-class speed so the belt wins where Valhalla says
      it should — but PG→Costco/BYU/Orem are exact, so low priority.
- [x] ETA AF→Park City route-choice — FINAL/CLOSED (slot-A round 41): with
      PROPER FREEWAY-node snapping of the belt interchanges (fixing the round-35
      surface-street pollution), the belt freeway-corridor = **99.52 km / 68.5
      min** vs straight **96.27 km / 62.7 min** = belt is 3.25 km LONGER under
      the engine's own cost model. So A* correctly prefers straight; the 89.7 km
      "belt" figure was belt-freeway length ALONE minus the AF→belt-entry +
      belt-exit→PC connecting legs (~9.8 km). Gap vs Valhalla is PURE GRAPH
      FIDELITY (Valhalla's OSM extract has more direct belt ramps), NOT a
      router/cost-model defect. No code change warranted. Item closed.
- [ ] BUG (found round 36, REAL but tiny impact): parseGraph() in src/router.js
      mis-handles ow=2 (oneway=-1) edges. arcCount allocates 1 arc for ow=2
      (`eOw===0?2:1`), but the fill loop ALWAYS writes a→b then also writes b→a
      when ow!==1 → ow=2 edges write 2 arcs into 1 slot, corrupting adjacency.
      Proof: arcTo.length=1023556 < outStart[N]=1023570 (14 slots short) = the
      14 ow=2 edges. All 14 are tiny residential stubs (3-48 m: 1500 East SLC,
      Fort Herriman Pkwy, Shadow Run Ln) — none on any freeway/arterial corridor,
      so routing impact is negligible today, but it's latent adjacency corruption
      that grows with every new oneway=-1 way. FIX: in the fill loop, if ow===2
      write ONLY the b→a arc (skip a→b). Then re-run floor-audit + engine-check
      + smoke + engine-e2e (graph parse changed) before shipping.
      UPDATE (round 38, slot-A research-only): FIX SPEC PINNED + CORRECTED — the
      fill loop alone is NOT enough; TWO sites need the ow===2 guard:
      (1) outStart count loop L129 `outStart[ea[i]+1]++` must become
          `if (eOw[i] !== 2) outStart[ea[i]+1]++;` (ow=2 must not allocate an
          a→b slot), and (2) fill loop L139-140: write the a→b arc only when
          `eOw[i] !== 2` (keep the existing `eOw[i] !== 1` b→a write). The
          arcCount formula L126 (`eOw===0?2:1`) is already correct for ow=2.
          Fill-loop-only fix leaves offset holes (outStart sums arcCount+14,
          cursor leaves gaps + tail writes still overflow). Sanity after fix:
          arcTo.length === outStart[nodeCount] (was 14 short). BLOCKED this
          run: router.js has another session's live uncommitted nearestNode fix
          (see ops note below) — land ow=2 AFTER that changeset settles.
- [ ] Graph integrity (2026-08-26 slot-A research-only, CLEAN): full read-only
      audit of shipped wasatch-graph.bin (527,282 nodes / 552,448 edges) —
      0 self-loops, 0 zero-len, 0 zero-spd, 0 bad node refs, 0 nodes outside
      bbox, names dict decodes exactly (0 bytes left). The 40,812 eName≥nameCount
      are ALL the 65535 unnamed-sentinel (realBad=0, not corruption). 1 dup
      node-pair (edges 503739/503751, 3 m stub, parallel OSM ways — harmless).
      5 isolated nodes (bbox corners/stubs: 40.85356/-111.90607, 39.95597/
      -112.11967, 40.27556/-111.69042, 40.39894/-111.90620, 40.74374/-111.84227)
      — snap-to-isolated would dead-end a route, but 5/527k = negligible.
      ow=2 delta re-confirmed: arcCount=1,023,556 vs outStart[N]=1,023,570
      (exactly the 14 ow=2 edges). ONLY known defect remains the queued ow=2
      fix (spec re-verified against CURRENT working-tree router.js: L126 count
      loop, L128-131 outStart, L137-145 fill — line numbers unchanged by the
      in-flight nearestNode edit; fix spec still valid as pinned).
- [ ] ROUTING AXIS (slot-A, research 2026-08-26 ~22:36): **OSM turn-restriction
      ingestion** — the engine currently honors NO turn restrictions (A* only
      applies a degree-based junctionPenalty, never checks turn legality), so it
      can plan illegal U-turns / lefts against OSM `type=restriction` relations.
      Measured from /tmp/utah-fresh.osm.pbf (bbox): **2179 restriction relations
      in-region; 2167 actionable turn-types** (exclude 10 untyped + 2
      `no_right_turn_on_red` = signal timing, not routing). Of these, **1937
      (89%) have their `via` node present in the shipped graph**, and **1222
      (56% of all / 63% of matched) sit at a real graph junction (deg≥3)** where
      a turn restriction actually changes routing — degree histogram
      {3:404, 4:638, 5:89, 6:85, 7:6} plus 712 at deg-2 connectors and 3 deg-1.
      Dominant types: no_u_turn 707, no_left_turn 660, only_straight_on 418,
      no_right_turn 199, only_right_turn 118, only_left_turn 45, no_straight_on
      18, only_u_turn 2. PLAN (lands only after router.js unblocks): (1) build
      time adds a turn-table to GWR1 — per `via` node, list of forbidden
      (fromEdge→toEdge) pairs from the restriction relations (and `only_*` ⇒
      allow-list); bump magic/graph version; (2) astar enforces it using the
      existing prevFrom[]/arcEdge[] (when relaxing arc p→v, reject if the turn
      from prevEdge[u]→e is forbidden at v); (3) floor-audit + engine-check +
      avoidance-audit + smoke + engine-e2e before ship. Reuse /tmp/gw-turns3.mjs
      (proven decoder) as the regression counter. Community-report baking is
      ALREADY shipped (planRoutes bakes communityCams into eCam) — not a new axis.
      UPDATE (slot-A round 43, /tmp/gw-turntable.mjs — working prototype of the
      build-time table): 2179 rels → 12 non-actionable, 14 `except` (skip v1),
      196 way-via (skip v1), 45 via-not-in-graph, 36 from/to-way miss →
      **1889 matched (87%)** = 990 forbid + 425 allow entries over **920
      distinct via nodes**. no_u_turn encodes as (v,fe,fe). FORMAT DECISION:
      per-node CSR wastes 2 MB (527k-node start array); use via-keyed compact:
      turnViaCount u32 + turnViaNodes[920] u32 + turnStart[921] u32 + entries
      (in u32, out u32, mode u8) = **~20 KB total** on GWR2. parseGraph builds
      Map<node,[start,end)> at load (920 entries, trivial). astar: on relaxing
      arc into v, if v has allow-entries for inEdge → only those outEdges pass;
      else forbid-pairs rejected. Still BLOCKED on router.js (nearestNode
      changeset live, holder preview :4173 up) — landing run = build-graph.mjs
      table writer + parseGraph reader + astar check + floor-audit/engine-check
      /avoidance-audit/smoke/engine-e2e.
- [x] ROUTING AXIS decoy: community-report → routing IS already implemented
      (src/router.js planRoutes communityCams → merged eCam, R=100 m, same
      weighting as builder). Verified present in working tree. No further work.
- [ ] Ops (found 2026-08-26 22:03 MST, round 38): src/router.js holds a SECOND
      uncommitted changeset (distinct from the 16-file lazy-engine set): a
      nearestNode() fix — returned `dist` was sqrt(score) with the low-degree
      penalty folded in (corrupts planRoutes' >1200 m snap guard); now returns
      true metric distance via bestDist. mtime 21:53, paired with NEW
      scripts/snap-dist-check.mjs (21:53) and a live `vite preview :4173`
      started 21:58 (holder presumably mid-verify). DO NOT edit/commit/revert
      router.js until the owner lands it; same grace rule as the 16-file set
      (>24 h stale + mtime unchanged → future slot-A run may verify+land it,
      then apply the ow=2 fix on top).

## Needs Keaton
Decisions that require Keaton (money, legal, destructive ops). Loop does not
block on these — it queues and moves on.
- [ ] Donation setup: BTC/Lightning + Monero addresses needed to fill
      src/config.js placeholders (decided: crypto-primary, Ko-fi optional).
- [ ] Real-drive ETA ground truth: Keaton's actual PG→Costco drive time.
- [x] GitHub auth — RESOLVED 2026-08-26 (round 30): token valid again; pushed
      stranded round-29 commit (3fbfdc1..63d78bf), deploy run 33030124464
      success, live site HTTP 200.
- [x] GitHub auth AGAIN (2026-08-26 ~19:40 MST): RESOLVED 2026-08-27 (round 32):
      token valid again (keyring); pushed d8f4173..f078910, deploy run
      33031062944 success, live site HTTP 200 in 0.58s, correct title.
- [x] GitHub auth AGAIN (2026-08-27 ~02:00 MST): RESOLVED 2026-08-27 (round 34):
      token valid again (keyring); pushed 198c1ad..eaf28f1 (round-33 ETA derate
      + ledger), deploy run 33032280575 success, live site HTTP 200 in 0.78s.
- [x] GitHub auth AGAIN (2026-08-26 ~21:45 MST, round 36): RESOLVED 2026-08-27
      (slot-B, 22:40 MST): token valid again (keyring); pushed stranded commits
      00e1864+658bcb0+3bd579e (d6d3d56..3bd579e), deploy run 33040106165,
      live site HTTP 200.

## Latest round
| date | axis | what changed | proof | status |
|------|------|--------------|-------|--------|
| 2026-08-26 | (seed) | loop created | cron live | active |
| 2026-08-26 | visual | heatmap zoom crossfade (z10.5→z12.5 fade) + check-script fixes | heatmap-check PASS (z9.5 1.17% → z12.5 0.05%), smoke PASS, interact-check PASS, build exit 0 | shipped |
| 2026-08-26 | camera-avoidance | strict hard safety floor (no edge <30 m from ALPR) + best-effort badge + avoidance-audit suite | audit PASS: 4/5 corridors were 5-25 m → now all ≥30 m; BYU camera-walled flagged; engine-check/smoke PASS; badge verified in live UI | shipped |
| 2026-08-26 | test-infra (round 22) | fixed SVG-hit-test false FAILs (SVGAnimatedString className + descendant hits count as control hits) in interact/report/compact/engine-e2e; splash wait before hit-tests; poll-until-up preview server; watchdog (150s force-exit) + close-race in all 19 puppeteer suites | interact-check: was HANG forever + false FAIL (menuHit='splash') → PASS 31.7s; report/compact/engine-e2e/smoke/heatmap all PASS with clean exits; node --check all 35 scripts | shipped |
| 2026-08-26 | test-infra (round 23) | shared scripts/lib-preview.mjs (spawn+poll-until-up + process-group kill-tree); pwa/shot/ux-audit/ux-shots/interact all ported off fixed 2.5s sleeps; fixed shot.mjs dead flow (waited for hidden #goBtn → 30s timeout) + ux-shots/shot teardown hang (no process.exit → watchdog exit 2 after "done") | all 5 suites PASS exit 0 (pwa/interact/ux-audit/shot/ux-shots); smoke + engine-e2e PASS; ports clear after — zero orphan vite servers (was leaking 2/run) | shipped |
| 2026-08-26 | security (round 24) | XSS hardening: escHtml() + escaped 10 innerHTML injection points (street names, camera brand/operator/mount, report brand/note/noteId); new scripts/xss-check.mjs E2E with real dot-click | xss-check red-green: payload executes w/o escape (fired:true) → inert with fix; smoke/interact/report/camchip/compact/engine-check/engine-e2e PASS, 0 console errors | shipped |
| 2026-08-26 | camera-avoidance (round 25) | resolved queued "PRIORITY floor violation" as FALSE ALARM (audit stride bug: offA+e vs offA+e*4); promoted corrected audit to scripts/floor-audit.mjs as permanent floor-regression guard; rebuilt graph to confirm determinism | floor-audit PASS on shipped .gz AND fresh rebuild (0 violations, min bucket 30-40 m); rebuild byte-identical (cmp); red test: mutated graph → FAIL exit 1; engine-check/avoidance-audit/smoke PASS; build exit 0 | shipped |
| 2026-08-26 | coverage/speed (round 26) | finished crashed run's multi-region refactor: region-aware loadGraph/regionCovers/ensureLocalEngine (lazy per-region graph load), fixed stray-return that killed Valhalla fallback, restored boot preload (13 suites depend on it), dropped dead mapCenter config, fixed prepare-roads header, committed ux-lock deletion | build exit 0; engine-check/smoke/engine-e2e/interact-check/report-check/xss-check all PASS, 0 console errors | shipped |
| 2026-08-26 | ops (round 28) | unblocked shipping: gh auth valid again → pushed stranded round-26 commit (4a40564..a949827); watched deploy to success; verified live site. Did NOT touch the 16-file uncommitted lazy-engine changeset (another session's in-flight work, mtimes 18:38-18:42) | push exit 0; deploy run 33028465289 success; curl https://deseretsaint.github.io/ghostway/ → HTTP 200 in 1.78s, correct title | shipped |
| 2026-08-26 | data-freshness (round 29) | monthly graph-rebuild CI (graph-refresh.yml, 2nd of month, gated on floor-audit + engine-check) + shipped graph rebuilt from fresh Aug 25 OSM + Aug 26 DeFlock (was Aug 15) | pipeline proven locally: rebuild 1.8s/552,448 edges; floor-audit PASS (0 <31.4 m); engine-check/avoidance-audit/smoke/engine-e2e PASS, 0 console errors | shipped (round 30) |
| 2026-08-26 | ops (round 30) | unblocked round-29: gh auth valid → pushed stranded commit (3fbfdc1..63d78bf); watched deploy to success; verified live site. Did NOT touch the 16-file uncommitted lazy-engine changeset (mtimes 18:38-18:42, <24 h — still in grace window) | push exit 0; deploy run 33030124464 success; curl live site → HTTP 200 in 2.37s, correct title | shipped |
| 2026-08-26 | route-geometry (round 31) | closed queued "route-line anti-cut" item: new scripts/geometry-audit.mjs — permanent guard proving the drawn line never leaves road geometry (DP invariant: every raw route point ≤3 m from simplified polyline, endpoints kept) across 5 corridors × modes incl. I-15 + canyon curves | audit PASS: 9/9 routes, worst deviation 2.99 m ≤ 3 m tol, 18-43% points kept; red test PASS (tol=100 m cut → 67.5 m flagged); build exit 0; engine-check PASS | committed c94bf49 — PUSH BLOCKED (gh token invalid again; see Needs Keaton) |
| 2026-08-27 | ops (round 32) | unblocked round-31: gh auth valid again (keyring) → pushed stranded commits c94bf49+f078910 (d8f4173..f078910); watched deploy to success; verified live site. Did NOT touch the 16-file uncommitted lazy-engine changeset (mtimes now ~1 h old — still in <24 h grace window) | push exit 0; deploy run 33031062944 success; curl live site → HTTP 200 in 0.58s, correct title | shipped |
| 2026-08-27 | ETA accuracy (round 33) | freeway effFactor 1.00→0.95: root-caused Orem→Airport −10 min gap (67.8 km I-15 at full posted 113 km/h vs Valhalla ~103 avg). Now −8 min there, Lehi→SLC +1 (33 vs 32), PG→Costco/BYU unchanged (10/20 exact). Queued AF→Park City +8 = route-choice (engine 96.3 km vs Valhalla 87.9 km path) | eta-benchmark measured before/after; engine-check/smoke/engine-e2e PASS, 0 console errors; build exit 0 | committed 034caa4 — PUSH BLOCKED (gh token invalid again; see Needs Keaton) |
| 2026-08-27 | ops (round 34) | unblocked round-33: gh auth valid again (keyring) → pushed stranded commits 034caa4+eaf28f1 (198c1ad..eaf28f1); watched deploy to success; verified live site. Did NOT touch the 16-file uncommitted lazy-engine changeset (mtimes ~86 min — still in <24 h grace window) | push exit 0; deploy run 33032280575 success; curl live site → HTTP 200 in 0.78s, correct title | shipped |
| 2026-08-26 | ETA research (round 36) | instrumented AF→Park City: directed exact-cost Dijkstra == engine A* path byte-for-byte (96.27 km/62.7 min, 1051 arcs) → A* provably optimal, "8 km detour" theory disproven; gap = cost-model vs Valhalla. Found REAL latent bug: parseGraph ow=2 adjacency corruption (14 slots short, all tiny stubs). Both written to ledger; no code changed this run | route-instrument/probe2/3/5 outputs; arcTo.length 1023556 < outStart[N] 1023570 = 14 ow=2 edges located | research-only (queued fix) |
| 2026-08-26 | accessibility (UX, slot-B round 37) | touch targets below Apple HIG/WCAG 2.5.5 min: .clear-btn and .modal-close were 40×40 → bumped to 44×44 (nudged modal-close inset 12→10px to keep 44 in frame). Added scripts/touch-target-check.mjs E2E guard. Did NOT touch the 16-file lazy-engine changeset (still uncommitted, mtimes unchanged ~3h) | build exit 0; interact-check INTERACTION PASS; touch-target-check PASS — clear 44×44, modal-close 44×44, 0 page errors | committed 658bcb0, PUSHED 2026-08-27 (d6d3d56..3bd579e) |
| 2026-08-26 | accessibility (UX, slot-B round 38) | touch-target continuation: .chip-toggle (Avoid highways) 32→44h, .mode-btn (Strict/Moderate/Off) 36→44h, .nav-voice (voice + density) 36×32→44×44. Extended scripts/touch-target-check.mjs to also assert .chip-toggle + .mode-btn ≥44 (reveal #avoid-toggle). No overlap with slot-A read-only router.js audit or the 16-file changeset (CSS-only). | build exit 0; touch-target-check PASS — clear 44×44, modal-close 44×44, chip-toggle 123.7×44, mode-btn 59×44, 0 page errors | committed 3bd579e, PUSHED 2026-08-27 (d6d3d56..3bd579e) |
| 2026-08-26 | tests (slot-C, 22:13 MST) | full regression sweep over CURRENT working tree (incl. uncommitted nearestNode fix + slot-B touch targets): no code changed, verification only | build exit 0; engine-check PASS; floor-audit PASS (0 strict-legal edges <31.4 m, min bucket 30-40 m); engine-e2e PASS (strict options + best-effort badge + nav banner, 0 console errors); smoke PASS (avoidance detour factor 2.0); interact-check PASS | verified — no regressions, no new bugs |
| 2026-08-26 | routing (slot-A round 39) | research-only: full shipped-graph integrity audit (read-only, /tmp scripts — router.js BLOCKED by live nearestNode changeset, mtime 21:53 + holder preview running). Graph CLEAN: 0 self-loops/zero-len/zero-spd/bad refs/out-of-bbox; 40,812 "bad" name idx = all 65535 unnamed-sentinel; 1 harmless dup pair; 5 isolated nodes (negligible). ow=2 fix spec re-verified valid against current working-tree line numbers | /tmp/gw-graph-audit{,2}.mjs outputs; arcCount delta = exactly 14 ow=2 edges | research-only (queued findings) |
| 2026-08-26 | accessibility (UX, slot-B round 40) | ARIA fixes only (index.html + ui.js, not in the 16-file lazy-engine set): added aria-label to icon-only #swapBtn ("Swap start and destination") + #clearRouteBtn ("Clear route"); role="status" live-region on #status + #engineStatus; aria-label="Menu" on #drawer; showStatus() now sets text AFTER unhide so SRs announce. Ran a contrast audit across the palette: ALL text/UI-pair contrast ratios PASS 4.5:1 (or 3:1 for non-text UI lines) — no change needed there. Did NOT touch router.js/main.js/map-view.js/config.js (protected). | build exit 0; interact-check INTERACTION PASS (full flow clickable + routes); all 5 attrs confirmed in dist/index.html (3×role=status, 2×aria-label) | committed 3bd579e, PUSHED 2026-08-27 (d6d3d56..3bd579e) |
| 2026-08-27 | ops+ux (slot-B, 22:40 MST) | unblocked shipping: gh auth valid again → committed slot-B rounds 38+40 (3bd579e) + pushed ALL stranded commits 00e1864+658bcb0+3bd579e (d6d3d56..3bd579e). Did NOT touch the 16-file lazy-engine changeset or router.js nearestNode fix (both still uncommitted, mtimes unchanged, holders' preview servers still up) | push exit 0; deploy run 33040106165 queued; curl live site → HTTP 200 in 0.19s | shipped |
| 2026-08-26 | camera-avoidance (slot-A round 40) | research-only: BYU camera-walled tail measured — exposed stretch is only 118 m / 4 edges (min cam dist 17 m), clear network covers 94.3% of nodes and ends 117 m from dest; parking-gate snap + honest "clear to within ~120 m" messaging spec pinned in queue. router.js still blocked (nearestNode changeset live, holder preview up) | /tmp/gw-byu-approach.mjs: gate node, tail length, 8 gate candidates, dest cam distance all measured | research-only (queued fix spec) |
|| 2026-08-26 | tests (slot-C, 22:31 MST) | targeted sweep over changes since 22:13 sweep (src/ui.js + index.html = slot-B round-40 ARIA edits): no code changed, verification only | build exit 0; avoidance-audit PASS (all Clearest ≥30 m mid-route, 4 camera-walled dests best-effort); floor-audit PASS (0 strict-legal edges <31.4 m); xss-check PASS (ui.js escaping intact post-edit); interact-check PASS (0 page errors) | verified — no regressions |
|| 2026-08-26 | routing (slot-A round 41) | research-only: closed the AF→Park City ETA item. Prior round-35 "belt 89.7 km < straight 96.3" contradiction traced to nearestNode snapping belt interchanges to SURFACE streets (spd<95). Re-measured with freeway-node (spd≥95) snapping: belt corridor = 99.52 km / 68.5 min vs straight 96.27 km / 62.7 min → belt is 3.25 km LONGER under the engine's own cost model, so A* correctly prefers straight. The 89.7 km was belt-freeway length alone minus ~9.8 km of AF→belt-entry + belt-exit→PC connecting legs. Gap vs Valhalla = pure graph fidelity (Valhalla OSM extract has more direct belt ramps), NOT a router/cost-model defect. router.js still blocked (live nearestNode changeset, holder preview up) → no code changed | /tmp/gw-belt-cost.mjs: belt entry fw-node 452651 / exit 221683; belt 99.52 km 68.5 min, straight 96.27 km 62.7 min; conclusion = A* optimal, item CLOSED | research-only (item closed, no code) |
|| 2026-08-26 | tests (slot-C, 22:42 MST) | verification sweep over CURRENT working tree (live nearestNode fix in router.js + 16-file lazy-engine set + slot-B ARIA/touch edits, all uncommitted) — NO code changed, verify only | build exit 0; floor-audit PASS (0 strict-legal edges <31.4 m, 630 bbox cams); engine-check PASS (Fastest 10min/2cams, Clearest 11min/1cam); avoidance-audit PASS (live routing probe: Orem→Airport ≥30 m mid-route; PG→Costco/BYU/Lehi→SLC/AF→PC honestly best-effort camera-walled); xss-check PASS (hostile report + street names inert, 0 errors) | verified — no regressions from uncommitted changesets |
|| 2026-08-26 | camera-avoidance (slot-C FINDING) | WARNING for Keaton: camera-walled destinations grew 1→4 of 5 tested corridors (added PG→Costco, Lehi→SLC, AF→PC beyond BYU). Likely DeFlock growth (127k→132k ALPR) + nearestNode fix snapping dests to true-metric nodes. NOT a code bug: floor-audit still 0 geometric violations + badge honest best-effort. But the ≥30 m mid-route GUARANTEE now only fully holds on Orem→Airport among tested corridors. Recommend generalizing the queued BYU gate-snap/best-effort-tail spec to all camera-walled dests | noted for Keaton (no code change in verify slot) |
|| 2026-08-26 | tests (slot-C, 22:51 MST) | verification sweep over CURRENT working tree (live nearestNode fix + snap-dist-check.mjs in router.js + 16-file lazy-engine set + slot-B ARIA/touch edits, all uncommitted) — NO code changed, verify only. Confirmed the nearestNode true-distance fix is correct & active. | build exit 0; snap-dist-check PASS (onRoad=90.0m offRoad=334.8m — fix live, off-road no longer false-near); engine-check PASS (Fastest 10km/11min/1cam, Clearest 10km/11min/1cam); floor-audit PASS (0 strict-legal edges <31.4 m); avoidance-audit PASS (Clearest ≥30 m mid-route; 4 camera-walled dests honest best-effort); xss-check PASS (hostile report + street names inert, 0 errors) | verified — no regressions from uncommitted changesets |
| 2026-08-26 | routing (slot-A round 42) | research-only: scouted a NEW routing axis — OSM turn-restriction ingestion. Engine honors ZERO turn restrictions today (A* only does degree-based junctionPenalty), so it can plan illegal U-turns/lefts. Decoded /tmp/utah-fresh.osm.pbf + shipped graph (audit's proven decoder). router.js BLOCKED by live nearestNode changeset + holder preview :4173 → no code changed | 2179 restriction relations in-region (2167 actionable); 1937 (89%) have `via` node in graph; 1222 (56%) at real junction (deg≥3) — types: no_u_turn 707, no_left_turn 660, only_straight_on 418, no_right_turn 199, only_right_turn 118…; plan pinned in queue | research-only (queued axis + landing plan) |
| 2026-08-26 | accessibility (UX, slot-B round 43) | keyboard accessibility: Escape now dismisses overlays — priority modal > drawer > suggestions. Handler in ui.js (main.js is in the protected 16-file lazy-engine set) clicks the CANONICAL close buttons (#modalClose/#closeDrawer) so main.js scrim/animation logic stays single-sourced. New scripts/escape-check.mjs E2E guard: opens real drawer + "why?" modal + suggestions, presses Escape, asserts hidden + scrim hidden, 0 page errors, close-race watchdog (first draft hung on browser.close() under swiftshader — same known class, fixed with the race pattern). Did NOT touch router.js/main.js/map-view.js/config.js or the 14 uncommitted script changesets. | build exit 0; escape-check PASS exit 0 (drawer/modal/sugg all close, scrim hidden); interact-check PASS exit 0 (no regression from ui.js edit); pushed dabf6e1..789566b, deploy run 33041083840, live site HTTP 200 | shipped |
|| 2026-08-26 | routing (slot-A round 43) | research-only: prototyped the build-time turn TABLE (/tmp/gw-turntable.mjs) — full relation→graph-edge resolution incl. only_* allow-lists + no_u_turn=(v,fe,fe). 1889/2179 rels matched (87%) → 990 forbid + 425 allow entries, 920 via nodes. Format decision: via-keyed compact table ~20 KB (per-node CSR = 2 MB waste). Landing spec pinned in queue. router.js still BLOCKED (nearestNode changeset live, holder preview :4173) → no code changed | /tmp/gw-turntable.mjs run: matched 1889, forbid 990, allow 425, via nodes 920, table 20 KB | research-only (landing spec pinned) |

## Concurrency protocol
- Lock file: ~/projects/ghostway/.ghostway-loop.lock (epoch ts + file list).
  Present + fresh (<10 min) = another run is editing → research-only mode.
- Warm deploy (gh run not completed) = no pushes → research-only mode.
- Research-only runs append to "## Improvement Queue" above, never edit code.
