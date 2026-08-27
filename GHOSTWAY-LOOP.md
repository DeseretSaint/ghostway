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
- [x] Accessibility: touch targets (r37/38), ARIA (r40), keyboard Escape (r43), focus-visible (CSS), dark contrast (r40 audit PASS), reduced motion (styles.css:1037 global rule — CLOSED r47). Camera legend added (r47).

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
- [x] TEST-MSG BUG (slot-C 2026-08-27 01:32 MDT): RESOLVED 2026-08-27 (slot-A round 51, commit aa84b53 — PUSH BLOCKED, gh token invalid again). router.js now runs one unbounded strict probe when the floor search fails under budget → `walled` flag exposed on the option (true = no ≥30 m path exists anywhere; false = clear path exists, over-budget). avoidance-audit branches the BEST-EFFORT reason on o.walled + headline reworded to "≥30 m on clearable corridors; N walled/budget destination(s) served best-effort". Verified: build exit 0; engine-check PASS (modes distinct); snap-dist-check PASS (90.0/334.8 m); audit exit 0 with CORRECT split — BYU prints "camera-walled", PG→Costco/Lehi→SLC/Orem→Airport/AF→PC print "camera-clear path exists but exceeds detour budget" (matches round-45 measurement exactly). Exit-0 CI gate unchanged. Original defect text: scripts/avoidance-audit.mjs summary is misleading. On `o.strictFallback` it printed "⚠ BEST-EFFORT (destination camera-walled; no ≥30 m path exists)" for ALL 5 corridors (only BYU truly walled) and the PASS headline overstated the guarantee. On `o.strictFallback` it prints "⚠ BEST-EFFORT (destination camera-walled; no ≥30 m path exists)" AND exempts the route from the `midOk` failure check, so the final headline still claims "every Clearest route stays ≥ 30 m from ALPR cameras mid-route" even though the 5 printed Clearest minima are 25/16/12/17/4 m (<30). Two defects: (1) reason text conflates two distinct strictFallback causes — per slot-A round 45 only BYU is truly walled; PG→Costco/Lehi→SLC/AF→PC fire from DETOUR BUDGET (clear path exists, over-budget) — so "no ≥30 m path exists" is false for 4/5. (2) PASS headline overstates the guarantee; best-effort routes are exempt from the floor check so the audit passes while Clearest passes 4 m from a cam (AF→PC). Fix: have router.js expose WHY strictFallback fired (clearest===null vs budget) and reword summary to "≥30 m on clearable corridors; N walled/budget destinations served best-effort". Audit still correctly exit-0 gates CI; reporting-accuracy defect only, NOT a routing regression. No code change 01:32 run (verification only). UPDATE 01:55 slot-C sweep: router.js is now COMMITTED/UNBLOCKED (ow=2 fix 8df172d + nearestNode a6e2994) → the v2 fix (expose clearest===null vs budget flag in router.js + reword summary) CAN now land; escalate to Slots A/B to implement. UPDATE 02:24 slot-A (research-only, fresh slot-B lock): re-ran audit standalone on committed tree — defect reproduced exactly (5/5 print "camera-walled; no ≥30 m path exists", Clearest mid-min 25/16/12/17/4 m, PASS headline). IMPLEMENTATION SPEC (next edit run): (1) router.js — existing overBudget flag does NOT distinguish (walled AND budget cases both land strictFallback+!overBudget whenever the softCam-within-budget search succeeds); when first fallback fires (clearest===null under budget) run ONE unbounded strict probe `astar(graph,s,t,'strict',edgeFactor,edgeDelay,{})` (no maxCost/softCam); set `walled = probe===null` on clearest and expose `o.walled` beside strictFallback/overBudget (L722-725). Cost = one extra A* only on the rare fallback path. (2) avoidance-audit.mjs L122-128 — branch on o.walled: walled → keep current text; else → "camera-clear path exists but exceeds detour budget; served best-effort". (3) headline L143-148 → "≥30 m on clearable corridors; N walled/budget destination(s) served best-effort". Exit-0 gate unchanged.
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
- [x] Camera-walled destinations: BYU has no ≥30 m approach road; consider
      "clear within N m of endpoint" messaging or parking-gate snapping
      — RESOLVED 2026-08-27 (slot-A round 52, commit 8b58dbe — PUSH BLOCKED,
      gh token invalid). Gate-snap landed: router.js clearTail() = forward BFS
      from origin over floor-legal edges (clear set) + reverse Dijkstra from
      destination (shortest exposed tail); when walled and tail ≤200 m, route
      hard-floor-clear to the gate with a relaxed 2x+5min budget (checked
      post-search — the in-search maxCost prune wrongly rejected the 37-min
      gate route under the 26.7-min budget). BYU served: mid-route min 40 m
      (was 16 m best-effort), badge "clear to within ~118 m" (ui.js hunk rode
      slot-B's b4eef44). Gate = North Canyon Rd node 436862, tail 118 m —
      matches round-40/45 measurements exactly. avoidance-audit: gate-snapped
      routes PASS the floor check with a gate note; best-effort 5→4.
      Original research follows:
      MEASURED 2026-08-26 (slot-A research, /tmp/gw-byu-approach.mjs):
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
      UPDATE (round 45, slot-A research, /tmp/gw-walled-tails.mjs): generalized
      the BYU measurement to ALL 5 corridors. FINDING: only BYU is truly
      reachability-walled (t unreachable under floor; gate North Canyon Rd
      -111.65612,40.25350, tail 118 m/4 edges, min cam 17 m — round-40 numbers
      reproduced exactly). PG→Costco, Lehi→SLC, AF→PC dest nodes ARE reachable
      in the clear network (496,997 nodes) → their strictFallback fires from the
      DETOUR BUDGET (router.js L674 fastest*1.25+90 s), NOT from walling. So
      slot-C's "1→4 camera-walled" warning is a message conflation: the badge
      covers two distinct cases. FIX SPEC v2: (a) unreachable-under-floor →
      gate-snap + "clear to within ~N m" (original spec, BYU only today);
      (b) reachable-but-over-budget → distinct honest message ("camera-clear
      route exists, +X min over fastest") or budget review; router already
      computes both paths — strictFallback just doesn't distinguish WHY it
      fired (add a flag: clearest===null vs budget). NEXT: implement (a)+(b)
      when router.js unblocks (nearestNode changeset still live).
- [x] Test infra: ux-shots/shot/ux-audit/pwa-check still use fixed sleeps
      (2.5-2.6s) for vite preview startup — same flaky class interact-check
      had (ERR_CONNECTION_REFUSED on npx cold-start); port the poll-until-up loop
      — LANDED 2026-08-26 (round 23): shared scripts/lib-preview.mjs
      (spawn+poll-until-200); all 5 suites on it. Also fixed shot.mjs stale
      flow (waited for hidden #goBtn → 30s timeout; now suggestion-pick +
      auto-route, in-page click w/ retry for stale handles) and ux-shots/shot
      teardown hang (no process.exit → watchdog exit 2 after "done").
- [x] UX (slot-B round 45): engine-e2e `startNavBtn` hit-test returned
      `maplibregl-canvas` — RESOLVED as a REAL UI bug, not a test artifact. On a
      390×844 phone the route card overflows the 52vh panel (scrollHeight 566 >
      clientHeight 437, scrollTop 0) and `#startNavBtn` (top 850) sat BELOW the
      panel fold (bottom 834) → primary CTA unreachable without scrolling. FIX:
      `position: sticky; bottom: 0` + upward shadow so the button pins to the
      scroll port. Verified with a real puppeteer geometry probe: button now
      fully inside panel (773–821) and `elementFromPoint` hits `primary-btn`.
      Committed 5d1bcc7, pushed, live 200.
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
- [x] Ops (found 2026-08-26 18:45 MST): 16-file lazy-engine changeset —
      RESOLVED 2026-08-27 02:05 MDT (slot-A round 48): evaluated full diff,
      verified (build exit 0; engine-check + snap-dist-check + engine-e2e PASS,
      lazy path proven — engine 'ready' only AFTER routing), committed 03e9224,
      PUSHED, deploy 33052069113 success. Re-verified 2026-08-27 (slot-A):
      working tree clean, 03e9224 on origin/main. TASK COMPLETE — DO NOT RE-DO.
      Re-verified AGAIN 2026-08-27 ~04:10 MDT (slot-A, special-priority re-check):
      premise stale — changeset long committed (03e9224) + on origin/main, tree
      clean, nothing to evaluate/commit. Side fix: pushed 3 stranded commits
      (b8875b7..7ac85eb: gate-snap dest-radius 816bcdc, slot-B search empty-state
      32b6ebf, ledger 7ac85eb) — gh auth had recovered.
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
- [x] BUG (found round 36, REAL but tiny impact): parseGraph() in src/router.js
      mis-handles ow=2 (oneway=-1) edges. — RESOLVED 2026-08-27 (slot-A round 47):
      added two-site ow===2 guard (allocation loop + fill loop) so oneway=-1 edges
      emit exactly 1 b→a arc; arcTo.length now === outStart[N] (1023556, was 14
      short); floor-audit PASS (0 strict-legal edges <31.4 m). arcCount allocates 1 arc for ow=2
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
- [ ] QA IMPROVEMENT OPPORTUNITY 2026-08-27 00:15 MDT (12-h QA pass): slot-C's
      2026-08-26 23:04 sweep FINDING was never filed as a queue item — filing it
      now so a fleet slot picks it up. 14 tracked puppeteer suites are
      NON-HERMETIC (raw goto :4173, no lib-preview): alert-check, camchip-check,
      camera-modal-check, compact-check, engine-e2e, follow-check, heatmap-check,
      https-check, nav-playback, onboard-check, report-check, search-bias-check,
      tiers-check, waypoint-check. They PASS only while some holder's external
      `vite preview` happens to be up; standalone they false-FAIL
      ERR_CONNECTION_REFUSED (verified this QA pass: 0 of 14 import lib-preview).
      FIX: port all 14 to scripts/lib-preview.mjs (round-23 pattern: spawn +
      poll-until-up + kill-tree). Same entry: fix engine-e2e "options shown: 0"
      race — wait for #route-card before counting options.
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
      entries (in u32, out u32, mode u8) = **~20 KB total** on GWR2. parseGraph builds
      Map<node,[start,end)> at load (920 entries, trivial). astar: on relaxing
      arc into v, if v has allow-entries for inEdge → only those outEdges pass;
      else forbid-pairs rejected. Still BLOCKED on router.js (nearestNode
      changeset live, holder preview :4173) — landing run = build-graph.mjs
      table writer + parseGraph reader + astar check + floor-audit/engine-check
      /avoidance-audit/smoke/engine-e2e.
- [ ] ROUTING AXIS (slot-A round 44, 2026-08-26 ~23:00, research-only,
      IMPACT MEASURED — DE-PRIORITIZED): ran a standalone Dijkstra (node + (node,inEdge)
      states, exact time cost = effFactor+junctionPenalty, mirror of router.js)
      over the shipped graph with the FULL decoded turn table. **Finding: on all 6
      test corridors (PG→BYU, AF→Park City, Lehi→SLC, PG→Costco/Lehi, SLC 1km
      grid, Provo grid) the CURRENT unrestricted engine routes commit ZERO
      forbidden turns, and enforcing turn restrictions changes ZERO routes
      (0 m / 0 min).** Several corridors DO pass through restricted junctions
      (PG→BYU 9, AF→PC 7, PG→Costco 5, SLC-grid 5 restricted via-nodes on route)
      — so the engine routes *through* restricted corners but never makes the
      specific prohibited maneuver; the time-optimal path simply doesn't pick a
      banned U-turn/left. **Self-test confirms the table + enforce pipeline are
      correct (not a false zero):** a known forbid[v,inE,outE] entry — enforce
      AVOIDS the banned turn (reAvoids=true) while non-enforce TAKES it
      (rnTakes=true). Table measured here: 978 forbid + 424 allow over 1343 via
      nodes (vs round-43 990/425/920 — minor edge-match variance from coord
      rounding; both confirm a populated, large table). CONCLUSION: turn
      restriction ingestion is technically real but has NO measured impact on the
      product's actual corridors (incl. dense urban grids) — NOT worth the
      build-graph version bump + router.js (parseGraph+astar) complexity for now.
      Recommend CLOSING this axis as low-priority; revisit only if a field drive
      shows an illegal maneuver in a real route. No code changed (router.js still
      in grace window anyway). Script: /tmp/gw-turns-impact.mjs (reproducible).
- [ ] ROUTING AXIS (slot-A round 46, 2026-08-27 01:20 MDT, research-only, DE-PRIORITIZED): camera-avoidance **brand weighting** feasibility — queued sub-angle ("brand weighting; community reports feed routing"). Measured brand distribution on the shipped fallback snapshot public/cameras/cameras.geojson (637 cams): Flock Safety 440 (69%), Motorola Solutions 136 (21%), Genetec 26 (4%), everything else ≤3 each, 26 (4.1%) untagged. CONCLUSION: the fleet is overwhelmingly Flock/Motorola ALPR — both read plates at speed — so the uniform ≥30 m strict floor ALREADY neutralizes the threat class regardless of brand. Brand weighting (extra margin for rare high-res Genetec ~4%) would change ~0 corridors. RECOMMEND CLOSING as low-priority (same verdict as turn restrictions). Caveat: measured on the 637-cam fallback, not the live 135k DeFlock MVT set; fallback is representative of shipped threat mix. No code changed (router.js still blocked by live nearestNode changeset + holder preview :4173 PID 14547, mtimes ~1h43m < 24h grace window).
- [ ] ROUTING AXIS decoy: community-report → routing IS already implemented
      (src/router.js planRoutes communityCams → merged eCam, R=100 m, same
      weighting as builder). Verified present in working tree. No further work.
- [x] Ops (found 2026-08-26 22:03 MST, round 38): router.js nearestNode()
      true-distance fix — RESOLVED: committed a6e2994 (with snap-dist-check.mjs
      guard: onRoad 90.0 m / offRoad 334.8 m PASS). ow=2 fix landed on top
      (8df172d). Both on origin/main; working tree clean. DO NOT RE-DO.
- [x] VERIFY NEXT (slot-C 02:46 MDT): gate-snap (camera-walled clearTail) was
      ACTIVELY being written in src/router.js during this sweep (3 clearTail
      variants observed 02:40-02:44; last mtime 02:44:25, holder un-locked).
      Probe of the intermediate version: BYU Clearest walled=true but
      clearToM=0 — gate-snap did NOT fire on the one corridor it's built for
      (served route still passes cam at 16 m mid-route). Once router.js
      stabilizes/commits: re-run /tmp/gw-gate-probe.mjs (BYU endpoints from
      avoidance-audit) — expect clearToM≈118 (round-40/45 measured tail) and
      Clearest mid-route min ≥30 m; then full battery (floor-audit,
      engine-check, avoidance-audit, snap-dist-check).
      — RESOLVED 2026-08-27 (slot-A round 52, commit 8b58dbe): the no-fire was
      the in-search maxCost budget prune (37-min gate route vs 26.7-min
      budget); fixed with unbounded search + post-search check. Verified on
      committed code: BYU clearToM=118, Clearest mid-route min 40 m (≥30),
      full battery PASS (floor-audit/engine-check/avoidance-audit/snap-dist).
- [ ] UX (slot-B round 51 research, 2026-08-27 02:31 MDT): onboarding a11y gaps
      — RESOLVED 2026-08-27 (slot-B round 52, commit b4eef44 — PUSH BLOCKED, gh
      token invalid). All 3 fixes landed per spec: (1) ui.js Escape handler now
      dismisses #onboarding via canonical #obSkip click (after drawer, before
      suggestions); (2) index.html .ob-card has role="dialog" aria-modal="true"
      aria-label="Welcome to Ghostway"; (3) main.js startOnboarding focuses
      #obNext after reveal. escape-check.mjs extended with a first-run section
      (fresh localStorage, 390×844 page): asserts overlay shown, dialog attrs,
      activeElement=obNext, Escape hides overlay + gw-onboarded set. Verified:
      build exit 0; escape-check PASS (12/12 assertions); interact-check PASS
      (0 page errors). NOTE: landed after reaping a stale slot-A lock (pid 88488
      dead, router.js mtime stable 12s, no ghostway procs) — slot-A's gate-snap
      changeset (router.js/avoidance-audit.mjs/ledger) left uncommitted + untouched.

- [x] UX (slot-B round 53): best-effort badge disambiguation — RESOLVED 2026-08-27
      (commit 36439e5 — PUSH BLOCKED, gh token invalid). ui.js renderEngineCard now
      branches the strictFallback badge on o.walled (flag landed aa84b53): walled →
      "best effort — camera-walled"; else → "best effort — clear route too long"
      (clearToM gate-snap branch unchanged, takes priority). Verified in real
      headless UI: PG→Costco (known budget case) renders "best effort — clear route
      too long · costs extra time" on the Clearest card; interact-check PASS, build
      exit 0, 0 page errors.
- [x] UX NEXT (slot-B): BYU corridor badge — RESOLVED 2026-08-27 (slot-B round 54,
      commit below): gate-snap (8b58dbe) verified in the REAL headless UI. New
      hermetic scripts/byu-gate-check.mjs injects the exact audit endpoints
      (PG→BYU [-111.6553,40.2523]) via __gw.state, clicks the real #goBtn, and
      asserts the Clearest card badge. PASS: "clear to within ~118 m" renders
      (37-min gate route, matches audit clearToM=118 exactly); "best effort —
      camera-walled" badge ABSENT; 0 page errors; interact-check PASS; build
      exit 0. NOTE: photon-geocoded "Brigham Young University" dest lands on a
      DIFFERENT node than the audit coords and still shows camera-walled
      best-effort — gate-snap is endpoint-sensitive (tail >200 m from that
      node). Not a regression (badge is honest), but a future UX angle: gate-
      snap could search a small dest-radius for the shortest clear tail.
- [x] UX/routing (slot-B round 54 finding): gate-snap is endpoint-sensitive —
      photon-geocoded "Brigham Young University" dest snaps to a node whose
      exposed tail >200 m, so the UI route still shows camera-walled best-effort
      while the audit coords get the gate-snap badge. Future angle: clearTail()
      could search a small dest-radius (e.g. nearest 3-5 snap candidates) for
      the shortest clear tail. Touches router.js — slot-A territory; filed here
      for visibility.
      — RESOLVED 2026-08-27 (slot-A round 57, commit 816bcdc — PUSH BLOCKED, gh
      token invalid again): dest-radius search LANDED — nearestCandidates()
      exposes the snap-candidate list (nearestNode = its first entry, byte-
      identical behaviour); clearTail split into buildClearIndex (once per
      origin) + clearTailTo (per dest node); gate-snap probes primary snap +
      up to 4 siblings ≤400 m, takes shortest qualifying tail, badge distance
      honestly includes candidate→dest offset. MEASURED on the motivating case:
      photon's BYU centroid is GENUINELY deep inside the wall — every snap
      candidate within 420 m has an exposed tail of 370-600+ m (all feeding
      gate 228440, a different/longer approach than the audit's North Canyon
      gate), so it CORRECTLY stays honest best-effort camera-walled (no
      conservative radius can gate-snap it; the badge is truthful). Mechanism
      verified non-regressing: audit-coord BYU still gate-snapped at 118 m,
      full battery PASS. Remaining honest gap: photon centroid lands ~400 m
      SE of the North Canyon approach; a future angle could widen the radius
      or offer "route to nearest clear gate" as an explicit option.

## Needs Keaton
Decisions that require Keaton (money, legal, destructive ops). Loop does not
block on these — it queues and moves on.
- [x] GitHub auth AGAIN (2026-08-27 ~04:00 MDT, slot-A round 57): RESOLVED
  2026-08-27 ~04:10 MDT (slot-A special-priority re-check): token valid again;
  pushed b8875b7..7ac85eb (gate-snap dest-radius 816bcdc + slot-B search
  empty-state 32b6ebf + ledger 7ac85eb). origin/main verified at 7ac85eb.
- [ ] GitHub auth AGAIN (2026-08-27 ~02:30 MDT, slot-A): gh token invalid
  ("The token in default is invalid"). Ledger commit 1a79c06 stranded locally
  (lazy-engine task-complete marking) — push it next run once auth recovers.
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
- [x] GitHub auth AGAIN (2026-08-27 ~02:40 MST, slot-B round 50; re-confirmed
      03:22 slot-A): RESOLVED 2026-08-27 03:43 MDT (slot-A re-check #6): token
      valid again; pushed ALL 17 stranded commits (28cf2a2..a9703c2) — walled-flag
      aa84b53, gate-snap 8b58dbe, onboarding-a11y b4eef44, badge-disambig 36439e5,
      graphload ea3f600, byu-gate-check 4ca5e83, modal-a11y 6608de4 + ledger
      commits. Deploy run 33059896752 queued on push.

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
| 2026-08-26 | tests (slot-C, 23:04 MST) | verification sweep: build exit 0; floor-audit PASS (0 strict-legal edges <31.4 m, 630 bbox cams); engine-e2e + compact-check needed an externally-running preview (raw goto :4173, NO self-start) → ERR_CONNECTION_REFUSED standalone, but PASS with a preview up (engine-e2e: engine ready, strict re-route w/ best-effort badge, nav banner, 0 errors; compact-check: ⭐ slim/persist). FINDING: engine-e2e/compact-check + the other 21 suites from round-23's grep -L lib-preview list are NON-HERMETIC — they only passed in prior sweeps because a holder preview was up; round 23 only ported pwa/shot/ux-audit/ux-shots/interact to lib-preview. NOT a code bug (app healthy) — a test-infra gap. engine-e2e "options shown: 0" is a test-timing race (doesn't wait for #route-card before counting; strict options + nav banner render fine after). Did NOT edit the 16-file protected changeset. | build exit 0; floor-audit PASS; engine-e2e PASS-with-preview (0 errors); compact-check ⭐; no app regressions | verified — app healthy; suites non-hermetic (flag for lib-preview port) |
| 2026-08-26 | tests (slot-C, 23:11 MST) | read-only sweep under FRESH slot-B lock (62s old, "reduced-motion", PID 12076 already dead — left lock untouched, too young to reap; no build/preview to avoid dist/port conflicts) | live site HTTP 200 in 2.6s, correct title; floor-audit PASS (0 strict-legal edges <31.4 m, min bucket 30-40 m); engine-check PASS (Fastest 10km/10min/2cams, Clearest 10km/11min/1cam, distinct modes) | verified — floor + routing healthy; NOTE: if slot-B lock still present + PID dead next run, reap per >stale rule |
|| 2026-08-26 | routing (slot-A round 44) | research-only: MEASURED real impact of OSM turn restrictions — standalone Dijkstra (node + (node,inEdge) states, exact effFactor+junctionPenalty) over shipped graph with full decoded turn table on 6 corridors. Result: current engine commits ZERO forbidden turns on every corridor AND enforcement changes ZERO routes (0m/0min). Self-test proves table+enforce are correct (enforce avoids a known banned turn that non-enforce takes) → not a false zero. DE-PRIORITIZED the turn-restriction axis: technically real but no measured product impact; revisit only if a field drive shows an illegal maneuver. router.js untouched (still in grace window) | /tmp/gw-turns-impact.mjs: 978 forbid+424 allow over 1343 via nodes; PG→BYU 9 / AF→PC 7 / PG→Costco 5 / SLCgrid 5 restricted via-nodes ON route, 0 violations on all; SELFTEST reAvoids=true rnTakes=true | research-only (axis de-prioritized) |
|| 2026-08-26 | UX (slot-B round 45) | "Start navigation" CTA was unreachable on small phones — `#startNavBtn` sat below the panel's 52vh scroll fold (hit-test landed on the map canvas, not the button). Root-caused via real puppeteer geometry probe (btn top 850 > panel bottom 834; scrollHeight 566 > clientHeight 437). FIX: `position: sticky; bottom: 0` + upward shadow so the primary CTA pins to the scroll port on overflow instead of hiding. CSS-only, no protected files touched. | puppeteer probe: btn now 773–821 (fully inside panel 395–834), `elementFromPoint` hit = `primary-btn` (BUTTON); interact-check PASS (startNavHit=startNavBtn, 0 page errors); build exit 0 | committed 5d1bcc7, PUSHED, live site HTTP 200, deploy run 33041971145 in_progress |
| 2026-08-26 | routing (slot-A round 45) | research-only: generalized the BYU camera-walled tail measurement to ALL 5 corridors (/tmp/gw-walled-tails.mjs, proven round-40 decoder). FINDING: only BYU is truly reachability-walled (gate North Canyon Rd, tail 118 m/4 edges, min cam 17 m — round-40 numbers reproduced exactly). PG→Costco, Lehi→SLC, AF→PC dest nodes ARE in the clear network (496,997 nodes) → their strictFallback fires from the DETOUR BUDGET (router.js L674), not walling. Slot-C's "1→4 walled" warning = badge message conflation of two distinct cases. FIX SPEC v2 pinned in queue: (a) walled → gate-snap + "clear to within ~N m"; (b) over-budget → distinct honest message; router needs a flag distinguishing clearest===null vs budget-exhausted. router.js still blocked (nearestNode changeset live, holder preview :4173) → no code changed | /tmp/gw-walled-tails.mjs: 5/5 corridors measured; BYU walled (tail 118 m, min cam 17 m), 4/5 dests floor-reachable; router.js L674-690 budget logic read | research-only (fix spec v2 pinned) |

|| 2026-08-27 | routing (slot-A round 46) | research-only: camera-avoidance BRAND WEIGHTING feasibility — measured shipped fallback cam mix (637): Flock 69% / Motorola 21% / Genetec 4% / other ≤3% / untagged 4%. Uniform ≥30 m floor already covers the ALPR threat class; brand weighting affects ~0 corridors → DE-PRIORITIZED (close, like turn restrictions). router.js blocked (nearestNode in-flight, holder preview :4173 PID 14547, ~1h43m in grace window) → no code changed | public/cameras/cameras.geojson brand tally: Flock 440, Motorola 136, Genetec 26, untagged 26 | research-only (axis de-prioritized) |
| 2026-08-27 | tests (slot-C, 01:32 MDT) | verification sweep over CURRENT working tree (in-flight nearestNode fix + 16-file lazy-engine set, all uncommitted, grace window) — NO code changed, verify only. Core invariants PASS: floor-audit 0 strict-legal edges <31.4 m; engine-check modes distinct (Fastest 10km/10min/2cams, Clearest 10km/11min/1cam); avoidance-audit Clearest ≥30 m mid-route *claimed*. FOUND test-message defect (filed): avoidance-audit PASSES while printing Clearest mid-route minima 25/16/12/17/4 m (<30) on 5 best-effort corridors + headline falsely claims "every Clearest stays ≥30 m"; reason text conflates walled vs budget (only BYU truly walled). No routing regression. | floor-audit PASS; engine-check PASS; avoidance-audit exit 0 but summary misleading (bug filed) | verified — invariants hold; test-summary defect flagged |
||| 2026-08-27 | accessibility/visual (UX, slot-B round 47) | on-map **camera legend**: new `#legendBtn` map-chip (ⓘ) toggles `#legendPanel` explaining the camera dots — Flock `#ff4d6d` (reads plates at speed), other ALPR `#ffaa40`, density gradient swatch. CSS-only panel + ui.js toggle (aria-expanded wired); no protected files (config/main/map-view/router) touched. New scripts/legend-check.mjs E2E guard. ALSO: confirmed `prefers-reduced-motion` is already fully handled (styles.css:1037 global `*{animation:none!important;transition:none!important}` + drawer rule) — prior slot-B "reduced-motion" lock work already complete; marking that axis item closed. | legend-check PASS: btn+panel exist, hidden initially, opens (aria-expanded=true) with 2 dots + 1 swatch + 3 rows, closes on 2nd click, 0 console errors; build exit 0 | committed 090026e, PUSHED, live site HTTP 200, deploy run 33050498868 in_progress |

| 2026-08-27 | routing (slot-A round 47) | FIXED latent parseGraph ow=2 (oneway=-1) adjacency corruption: two-site ow===2 guard (allocation loop L129 + fill loop L137) so oneway=-1 edges emit exactly 1 b→a arc; arcTo.length === outStart[N] (1023556, was 14 short); floor-audit PASS (0 strict-legal <31.4 m); focused invariant suite PASS | node scripts/ow2-verify (probe, export since reverted): arcTo.length 1023556===outStart[527282]; 14 ow=2 arcs all rev=1; floor-audit: 0 strict-legal edges <31.4 m | committed + PUSHED 8df172d (deploy auto-runs) |
||| 2026-08-27 01:55 MDT | tests (slot-C) | verification sweep over NOW-COMMITTED tree (router.js ow=2 fix 8df172d + nearestNode a6e2994 landed — prior blockers cleared) — NO code changed, verify only. Core camera-avoidance invariants HOLD: floor-audit 0 strict-legal edges <31.4 m (630 bbox cams); engine-check modes distinct (Fastest/Balanced 10km/10min/2cams, Clearest 10km/11min/1cam). Re-confirmed the avoidance-audit summary defect (filed 01:32): live probe prints Clearest mid-route minima 25/16/12/17/4 m (all <30) yet headline claims "every Clearest stays ≥30 m"; all 5 tagged "camera-walled; no ≥30 m path exists" but only BYU is truly walled (round 45) — 4/5 fire from detour budget. Reporting-accuracy only, NOT a routing regression. router.js now unblocked → the v2 fix (expose clearest===null vs budget flag + honest summary) CAN land. | floor-audit PASS; engine-check PASS; avoidance-audit exit 0 but misleading summary (defect confirmed) | verified — invariants hold; audit-summary fix now unblocked |

| 2026-08-27 02:05 MDT | speed/ops (slot-A round 48) | **PROTECTED LAZY-ENGINE CHANGESET EVALUATED + LANDED — TASK COMPLETE, DO NOT RE-DO.** Reviewed full diff (main.js/config.js/map-view.js/ui.js/utils.js/styles.css + 13 script suites): boot `preloadEngine()` removed (no ~6 MB graph fetch at launch), `reRoute()` now awaits `ensureLocalEngine()` so the region graph loads only when a route enters coverage; suites wait on `window.__gw` instead of engine-ready; engine-e2e asserts engine 'ready' AFTER routing; fmtArrive() arrival clock added to route cards; sources/privacy copy de-Wasatch-ified. One cleanup applied: config.js `mapCenter` had a leftover `// TEMP isolation test` marker + a comment claiming "neutral continental-US" that contradicted its actual Wasatch coords — comment corrected, value unchanged. | build exit 0; engine-check PASS (Fastest/Balanced 10.0 km/10 min/2 cams, Clearest 10.0 km/11 min/1 cam, distinct); snap-dist-check PASS (onRoad 90.0 m / offRoad 334.8 m); engine-e2e PASS — app boots without graph, engine reaches 'ready' only AFTER routing (lazy path proven), strict re-route + best-effort badge, nav banner + voice, ERRORS [] | committed 03e9224, PUSHED (8df172d..03e9224) — deploy auto-runs |
| 2026-08-27 02:20 MDT | tests (slot-C) | verification sweep over NOW-COMMITTED tree (lazy-engine 03e9224 + new hermetic arrival-clock guard 94e45a3) — NO code changed, verify only. All invariants HOLD on committed code. floor-audit 0 strict-legal edges <31.4 m (630 bbox cams); engine-check modes distinct (Fastest/Balanced 10km/10min/2cams, Clearest 10km/11min/1cam); arrival-check PASS (.rc-arrive "Arrive 2:16 AM" renders, 0 page errors — new hermetic guard works); engine-e2e PASS against a live preview — app boots (__gw), engine reaches 'ready' only AFTER routing (lazy path proven), strict options + best-effort badge + sticky startNav CTA + nav banner/voice all present, ERRORS []. NOTE: engine-e2e.mjs is still NON-HERMETIC (raw goto :4173, ERR_CONNECTION_REFUSED standalone) — already-filed QA gap (queue: 14 suites); NOT a regression, passed once a preview was up. Did NOT port it (verify-only slot). | floor-audit/engine-check/arrival-check/engine-e2e all PASS (build exit 0) | verified — committed tree healthy; non-hermetic e2e is known infra gap, no action without owner |

| 2026-08-27 | ux (slot-B round 49) | arrival clock (.rc-arrive / fmtArrive) ALREADY shipped (03e9224, slot-A lazy-engine set) — re-derived it this run, confirmed present + renders ("Arrive 2:12 AM" on a 9-min PG→Lehi route); added hermetic scripts/arrival-check.mjs (spawns own preview, asserts .rc-arrive) — PASS, 0 console errors, build exit 0. No new product code (working tree == HEAD for src/) | arrival-check PASS: rc-arrive "Arrive 2:12 AM", opts≥2, engine ready, 0 page errors | shipped (test-only, not pushed) |
| 2026-08-27 | ux (slot-B round 50) | first-route UX: (1) staged graph-load feedback — ensureLocalEngine now shows "Downloading map data…" → "Building route network…" (wires loadGraph's existing onProgress to showStatus) instead of a static "Routing…" during the ~6 MB lazy graph download; (2) FIXED first-route latency bug found while testing: ensureLocalEngine AWAITED loadTraffic (UDOT spatial query 5-10 s, retries up to ~65 s on ArcGIS 504s) before returning → first route render held hostage. Now fire-and-forget: route renders on free-flow speeds, incidents layer in after. New hermetic scripts/graphload-status-check.mjs (MutationObserver captures #status texts from addedNodes; asserts both stages ordered + card renders). | graphload-status-check PASS: stages ordered, card visible, 3 options, route 24 ms after engine ready (was blocked >120 s); interact-check PASS; engine-e2e PASS (strict opts + best-effort badge + nav banner, ERRORS []); build exit 0 | committed (local) — PUSH BLOCKED (gh token invalid again; see Needs Keaton) |
| 2026-08-27 ~02:30 MDT | ops (slot-A, special task) | LAZY-ENGINE SPECIAL TASK: already DONE — verified, not re-done. Confirmed working tree CLEAN, 03e9224 (lazy-engine) + a6e2994 (nearestNode) + 8df172d (ow=2) all on origin/main, deploys 33052069113/33052180256/33052587996 all success. Marked both protected-changeset ops queue items RESOLVED so no future run re-evaluates. router.js is now fully UNBLOCKED for slot-A routing work (fix spec v2 walled-vs-budget flag is the next live item). | git status clean; origin/main == 28cf2a2 (03e9224 present); 3 deploys success | verified — task complete, ledger updated |
| 2026-08-27 02:25 MDT | tests (slot-C) | read-only sweep under FRESH slot-B lock (02:18, "graph-load-status", holder alive w/ own preview :4173 → no build, no :4173, no edits; only ledger commits since 02:20 sweep) — NO code changed, verify only. All invariants HOLD, identical to 02:20: floor-audit 0 strict-legal edges <31.4 m (min bucket 30-40 m); engine-check modes distinct (Fastest/Balanced 10km/10min/2cams, Clearest 10km/11min/1cam); avoidance-audit exit 0, Clearest mid-route minima unchanged 25/16/12/17/4 m — already-filed summary defect (01:32, escalated 01:55) persists unchanged, no drift. No new findings. | floor-audit PASS; engine-check PASS; avoidance-audit exit 0 (same numbers as 01:55) | verified — no regressions; nothing new |
|| 2026-08-27 | routing (slot-A round 51) | FIXED the filed audit-summary defect: router.js runs one unbounded strict probe when the floor search fails under budget → `walled` flag on the option (true = no ≥30 m path anywhere; false = clear path exists, over-budget); avoidance-audit branches BEST-EFFORT reason on o.walled + honest headline ("≥30 m on clearable corridors; N walled/budget destination(s) served best-effort"). Exit-0 CI gate unchanged. Lazy-engine special task confirmed already complete (03e9224 on origin/main) — not re-done. | build exit 0; engine-check PASS (modes distinct); snap-dist-check PASS (90.0/334.8 m); audit exit 0 — BYU "camera-walled", other 4 "exceeds detour budget" (matches round-45 measurement) | committed aa84b53 — PUSH BLOCKED (gh token invalid; see Needs Keaton) |
||| 2026-08-27 02:32 MDT | tests (slot-C) | verification sweep over stranded tree (aa84b53 walled-flag + ea3f600 graphload, 6 ahead of origin/main) — NO code changed, verify only. CONFIRMED slot-A round-51 fix: avoidance-audit now correctly separates truly-walled (BYU only → "no ≥30 m path exists", min 16 m) from over-budget clearable (4 corridors → "camera-clear path exists but exceeds detour budget", min 25/12/17/4 m) — the filed 01:32 defect (walled/budget conflation + false PASS headline) is RESOLVED. All core invariants HOLD: floor-audit 0 strict-legal edges <31.4 m (273 in 30-40 m bucket); engine-check modes distinct (Fastest/Balanced 10km/10min/2cams, Clearest 10km/11min/1cam); snap-dist-check PASS (onRoad 90.0m/offRoad 334.8m); build exit 0. Live routing probe (avoidance-audit plans real routes on the shipped GWR1 graph + measures true min camera distance) shows no camera-avoidance regression. NOTE: headline "≥30 m on clearable corridors" describes path-existence, not the served best-effort route (25/16/12/17/4 m) — defensible but a reader could misread it as "served ≥30 m"; minor residual wording ambiguity only, not a regression. | floor-audit/engine-check/snap-dist-check/avoidance-audit all PASS; build exit 0 | verified — fix confirmed, no regressions |
|| 2026-08-27 02:46 MDT | tests (slot-C) | verification sweep over UNCOMMITTED tree (in-flight gate-snap clearTail in router.js — actively rewritten 3× during sweep, mtime 02:44:25, holder un-locked; slot-B round-52 onboarding-a11y b4eef44 also landed mid-run). Removed stale crashed lock (PID 90978 dead, no live procs). Core invariants HOLD on committed code: floor-audit 0 strict-legal edges <31.4 m (273 in 30-40 m bucket); engine-check modes distinct (Fastest/Balanced 10km/10min/2cams, Clearest 10km/11min/1cam); avoidance-audit exit 0 with correct walled/budget split (BYU walled, 4 budget); build exit 0. FINDING: intermediate gate-snap version does NOT fire on BYU — probe shows Clearest walled=true but clearToM=0, served route still passes cam at 16 m mid-route (expected clearToM≈118). Filed VERIFY NEXT queue item w/ probe script + expected values. Did NOT touch router.js (live edit in progress). | floor-audit/engine-check/avoidance-audit PASS; build exit 0; /tmp/gw-gate-probe.mjs: clearToM=0 on BYU | verified — invariants hold; gate-snap not yet effective (re-verify when stable) |
|| 2026-08-27 ~02:45 MDT | accessibility (UX, slot-B round 52) | onboarding a11y (landed the pinned round-51 spec): .ob-card role=dialog+aria-modal+aria-label; startOnboarding focuses #obNext; Escape dismisses onboarding via canonical #obSkip; escape-check.mjs gains a first-run section (fresh localStorage, phone viewport). Reaped stale slot-A lock first (pid dead, mtime stable); slot-A's uncommitted gate-snap changeset untouched. | build exit 0; escape-check PASS 12/12 (obShown/obDialog/obFocus/obAfterEsc/obFlagSet all true, 0 errors); interact-check PASS | committed b4eef44 — PUSH BLOCKED (gh token invalid; see Needs Keaton) |
| 2026-08-27 ~02:50 MDT | routing (slot-A round 52) | GATE-SNAP for camera-walled destinations (resolves the long-queued BYU item + slot-C's 02:46 finding that the intermediate version didn't fire): router.js clearTail() = forward BFS from origin over floor-legal edges (clear set, first-edge exempt) + reverse Dijkstra from destination (shortest exposed tail); when walled and tail ≤200 m, serve the hard-floor-clear route to the gate instead of a floor-breaking best-effort route. ROOT CAUSE of the intermediate no-fire: the in-search maxCost prune tracks time on the best-score label only and rejected the 37-min gate route under the 26.7-min budget — fixed with unbounded search + post-search budget check (relaxed 2x+5min, gate routes only ever offered for walled destinations). clearToM flag exposed; ui.js badge "clear to within ~118 m" (hunk rode slot-B's b4eef44); avoidance-audit gate-snapped routes PASS the floor check with a gate note. | build exit 0; engine-check PASS (modes distinct); snap-dist-check PASS (90.0/334.8 m); floor-audit PASS (0 strict-legal <31.4 m); avoidance-audit PASS — BYU Clearest mid-route min 40 m (was 16 m), gate-snapped clear to within ~118 m (gate node 436862 North Canyon Rd — exact round-40/45 numbers); other 4 corridors unchanged; best-effort 5→4 | committed 8b58dbe — PUSH BLOCKED (gh token invalid; see Needs Keaton) |
| 2026-08-27 02:58 MDT | tests (slot-C) | INDEPENDENT gate-snap verification on COMMITTED tree (8b58dbe) — closes the 02:46 VERIFY NEXT item. /tmp/gw-gate-probe.mjs re-run: BYU Clearest walled=true, clearToM=118 (was 0 on the intermediate build). Full battery: floor-audit 0 strict-legal edges <31.4 m; engine-check modes distinct (Fastest/Balanced 10km/10min/2cams, Clearest 10km/11min/1cam); snap-dist-check 90.0/334.8 m; avoidance-audit PASS — BYU Clearest mid-route min 40 m + "gate-snapped: clear to within ~118 m", other 4 honest budget best-effort (min 25/12/17/4 m). slot-A live in-flight ui.js badge-wording edit (uncommitted, holder preview :4173 up) left untouched. gh token STILL invalid — 9 commits stranded (already in Needs Keaton). | all 4 checks PASS; probe clearToM=118 | verified — gate-snap effective, no regressions |
| 2026-08-27 03:11 MDT | tests (slot-C) | read-only sweep under FRESH slot-B lock (03:09, round 54 byu-gate-badge-verify, holder preview :4173 up → no build, no :4173, no edits; only untracked scripts/byu-gate-check.mjs since 02:58) — NO code changed, verify only. All invariants HOLD, ZERO drift from 02:58: floor-audit 0 strict-legal edges <31.4 m (273 in 30-40 m bucket); engine-check modes distinct (Fastest/Balanced 10km/10min/2cams, Clearest 10km/11min/1cam); snap-dist-check 90.0/334.8 m; avoidance-audit PASS — BYU gate-snapped (Clearest mid-route min 40 m, clear to within ~118 m), other 4 honest budget best-effort (25/12/17/4 m), walled/budget split correct. gh token STILL invalid — now 11 commits ahead of origin/main stranded (36439e5 r53 badge + a098d43 ledger added). | floor-audit/engine-check/snap-dist-check/avoidance-audit all PASS | verified — no regressions, nothing new |
| 2026-08-27 ~03:05 MDT | ops (slot-A, special task re-check) | LAZY-ENGINE SPECIAL TASK: premise stale — changeset already evaluated/committed/pushed in round 48 (03e9224 confirmed on origin/main; working tree 100% clean, 0 uncommitted files, no lock). Nothing to evaluate or commit; ledger already marks it TASK COMPLETE — DO NOT RE-DO. Attempted to push the 11 stranded commits (aa84b53..a098d43): gh token still invalid AND git credential helper fails ("could not read Username") → push still blocked (Needs Keaton). | git status --porcelain empty; git branch -r --contains 03e9224 = origin/main; git push fails on auth | verified — no action needed; push awaits auth fix |
| 2026-08-27 ~03:15 MDT | ux (slot-B round 54) | verified gate-snap (8b58dbe) in the REAL headless UI + new hermetic guard scripts/byu-gate-check.mjs: injects exact audit endpoints (PG→BYU) via __gw.state, clicks real #goBtn, asserts Clearest badge. BYU Clearest renders "clear to within ~118 m" (37-min gate route — matches audit clearToM=118 exactly); "best effort — camera-walled" badge gone; 0 page errors. FINDING: photon-geocoded "Brigham Young University" dest snaps to a different node (tail >200 m) → still honest camera-walled best-effort; gate-snap is endpoint-sensitive (queued future angle: dest-radius tail search). | byu-gate-check PASS; interact-check PASS (0 page errors); build exit 0 | committed (local) — PUSH BLOCKED (gh token invalid; see Needs Keaton) |
| 2026-08-27 03:22 MDT | ops (slot-A, special task re-check #3) | LAZY-ENGINE SPECIAL TASK: premise stale AGAIN — changeset landed round 48 (03e9224 confirmed on origin/main via `git branch -r --contains`); working tree 100% clean (git status --porcelain empty), no lock. Nothing to evaluate/commit; ledger already marks it TASK COMPLETE — DO NOT RE-DO (3rd confirmation). Attempted push of 13 stranded commits: gh token still invalid + git credential helper fails → push still blocked (Needs Keaton updated w/ current count). No router.js work started (can't finish a verified unit inside timebox). | git status clean; 03e9224 on origin/main; push fails on auth (13 ahead) | verified — no action needed; push awaits auth fix |

| 2026-08-27 03:24 MDT | tests (slot-C) | verification sweep over committed tree (14 ahead of origin/main, auth-blocked; only ledger commits since 03:11) — NO code changed, verify only. All invariants HOLD, ZERO drift: floor-audit 0 strict-legal edges <31.4 m; engine-check modes distinct (Fastest/Balanced 10km/10min/2cams, Clearest 10km/11min/1cam); snap-dist-check 90.0/334.8 m; avoidance-audit PASS — BYU gate-snapped (Clearest mid-route min 40 m, clear to within ~118 m), 4 budget best-effort (25/12/17/4 m), walled/budget split correct. NEW: first standalone run of the now-committed hermetic byu-gate-check.mjs (4ca5e83) — PASS, badge "clear to within ~118 m", walled badge absent, 0 page errors; confirms it is NOT in the non-hermetic 14. gh token STILL invalid (14 commits stranded). | floor-audit/engine-check/snap-dist-check/avoidance-audit/byu-gate-check all PASS | verified — no regressions, new guard hermetic |
| 2026-08-27 03:30 MDT | ops (slot-A, special task re-check #4) | LAZY-ENGINE SPECIAL TASK: premise stale, 4th confirmation — 03e9224 on origin/main (git branch -r --contains), landed+pushed round 48. Working tree has a LIVE slot-B changeset (index.html/main.js/escape-check.mjs, holder actively running escape-check.mjs + preview :4173, mtimes <5 min) → untouched. Push of 14 stranded commits retried: still auth-blocked (credential helper "could not read Username"; gh token invalid — Needs Keaton). No routing work started (live holder + timebox). | 03e9224 on origin/main; push fails on auth (14 ahead) | verified — no action needed; push awaits auth fix |

| 2026-08-27 03:31 MDT | tests (slot-C) | read-only sweep under LIVE slot-B changeset (index.html/main.js/escape-check.mjs, mtimes 3-6 min, holder preview :4173 up since 02:52 → no build, no :4173, no edits; only ledger commits since 03:24) — NO code changed, verify only. All invariants HOLD, ZERO drift: floor-audit 0 strict-legal edges <31.4 m; engine-check modes distinct (Fastest/Balanced 10km/10min/2cams, Clearest 10km/11min/1cam); snap-dist-check 90.0/334.8 m; avoidance-audit PASS — BYU gate-snapped (Clearest mid-route min 40 m, clear to within ~118 m), 4 budget best-effort (12/17/4 m + PG→Costco), walled/budget split correct. Live site HTTP 200 in 3.1s. gh token STILL invalid — now 15 commits stranded (9548712 ledger added). | floor-audit/engine-check/snap-dist-check/avoidance-audit all PASS; live site 200 | verified — no regressions, nothing new |

| 2026-08-27 03:37 MDT | ops (slot-A, special task re-check #5) | LAZY-ENGINE SPECIAL TASK: premise stale, 5th confirmation — 03e9224 confirmed on origin/main (git branch -r --contains); lazy-engine already landed+pushed round 48. Working tree still holds slot-B's LIVE UI/UX+test changeset (main.js modal focus/aria, index.html, escape-check.mjs, GHOSTWAY-LOOP.md) — OUT of SLOT-A mandate (routing only; never touch UI/UX/tests) → left untouched, consistent with re-checks #3/#4. No routing files uncommitted. Push of 15 stranded commits retried: still auth-blocked (gh token invalid + credential helper "could not read Username" — Needs Keaton). No routing unit started (timebox). | 03e9224 on origin/main; routing files clean; push fails on auth (15 ahead) | verified — no action needed; push awaits auth fix |

| 2026-08-27 03:15 MDT | ux (slot-B round 55) | modal dialog accessibility: `.modal-card` now `role="dialog" aria-modal="true"`; `openModal()` derives `aria-label` from the modal's heading (every openModal body starts with an `<h3>`), moves focus to `#modalClose` on open, and `closeModal()` returns focus to the element that opened it (graceful no-op → body when the opener closed itself, e.g. the About flow closes the drawer first). New guard assertions in scripts/escape-check.mjs: modal dialog semantics + initial focus + focus-escapes-closed-modal. No routing/engine files touched. | build exit 0; escape-check PASS (modalDialog/modalFocus/modalFocusEscaped all true, 0 page errors); interact-check PASS (0 page errors, full flow routes) | committed 6608de4 — PUSH BLOCKED (gh token invalid; now 14 stranded) |

| 2026-08-27 03:39 MDT | tests (slot-C) | verification sweep over committed tree (16 ahead of origin/main, auth-blocked; NEW commit 6608de4 = slot-B modal dialog a11y, landed 03:38, verified here for the first time) — NO code changed, verify only. All invariants HOLD, ZERO drift: floor-audit 0 strict-legal edges <31.4 m; engine-check modes distinct (Fastest/Balanced 10km/10min/2cams, Clearest 10km/11min/1cam); snap-dist-check 90.0/334.8 m; avoidance-audit PASS — BYU gate-snapped (4 budget best-effort: 12/17/4 m + PG→Costco/Lehi→SLC split correct). NEW: standalone run of updated hermetic escape-check.mjs (6608de4) — PASS 15/15 incl. new modal assertions (modalDialog/modalFocus/modalFocusEscaped all true; drawer/sugg/onboarding sections intact, 0 page errors); dist was rebuilt after main.js edit so the guard tested the committed code. gh token STILL invalid (16 commits stranded). | floor-audit/engine-check/snap-dist-check/avoidance-audit/escape-check all PASS | verified — no regressions; new modal-a11y commit confirmed working |
| 2026-08-27 03:43 MDT | ops (slot-A, special task re-check #6) | LAZY-ENGINE SPECIAL TASK: premise stale, 6th confirmation — 03e9224 on origin/main (git branch -r --contains), landed+pushed round 48; no uncommitted routing files (only slot-C's 2-line ledger append pending). REAL ACTION THIS RUN: gh token VALID AGAIN → pushed ALL 17 stranded commits (28cf2a2..a9703c2): walled-flag aa84b53, gate-snap 8b58dbe, onboarding-a11y b4eef44, badge-disambig 36439e5, graphload ea3f600, byu-gate-check 4ca5e83, modal-a11y 6608de4 + ledger commits. Deploy run 33059896752 queued on push. Needs-Keaton auth item marked RESOLVED. | git push exit 0 (28cf2a2..a9703c2); gh run 33059896752 queued; 03e9224 on origin/main | shipped — backlog cleared, push unblocked |

| 2026-08-27 03:48 MDT | ux (slot-B round 56) | modal focus trap: `aria-modal="true"` was a hint only — Tab escaped to background controls behind the scrim. Added `trapModalFocus()` (wired to document keydown in wireApp): while `#modal` is open, Tab/Shift+Tab cycle within the dialog's focusable elements; single-focusable modals stay pinned; focus never leaves the card. No routing/engine files touched. New guard assertions in scripts/escape-check.mjs (modalTabTrapped/2/ShiftTabTrapped). | build exit 0; escape-check PASS (18/18 incl. 3 new trap asserts: modalTabTrapped=true, modalTabTrapped2=true, modalShiftTabTrapped=true, 0 page errors); interact-check PASS (full flow routes, 0 page errors) | committed (local) — PUSH BLOCKED (gh token invalid; 17+ stranded) |

| 2026-08-27 03:52 MDT | tests (slot-C) | verification sweep over committed tree (origin/main == HEAD == b8875b7, backlog cleared by slot-A re-check #6; NEW commit b8875b7 = slot-B modal focus trap, verified here for the first time) — NO code changed, verify only. All invariants HOLD, ZERO drift: floor-audit 0 strict-legal edges <31.4 m; engine-check modes distinct (Fastest/Balanced 10km/10min/2cams, Clearest 10km/11min/1cam); snap-dist-check 90.0/334.8 m; avoidance-audit PASS — BYU gate-snapped (Clearest mid-route min 40 m, clear to within ~118 m), 4 budget best-effort (25/12/17/4 m), walled/budget split correct. NEW: standalone hermetic escape-check.mjs PASS incl. all 3 focus-trap asserts (modalTabTrapped/2 + modalShiftTabTrapped true, modalDialog/modalFocus/modalFocusEscaped true, 0 page errors) — confirms b8875b7 focus trap works on committed code. Deploy 33060291186 (b8875b7) completed success. gh auth healthy (0 ahead/behind). | floor-audit/engine-check/snap-dist-check/avoidance-audit/escape-check all PASS; deploy success | verified — no regressions; focus-trap commit confirmed working + deployed |

| 2026-08-27 03:55 MDT | ux (slot-B round 57) | Maps-parity search "No results" empty state: `src/ui.js` render() previously HID the suggestions panel silently when a query matched nothing (photon returns [] or errors) — zero feedback. Now shows a non-interactive `.sugg-empty` row ("No results" + "Nothing matches \"q\". Try a different name or address.") with `role="status"`; no suggestion buttons render. Added `.sugg-empty` CSS (matches .sugg padding/line, full-contrast). New hermetic scripts/search-empty-check.mjs (lib-preview, types nonsense query, asserts empty row + no sugg buttons + role=status). UI-only; no routing/engine files touched (uncommitted src/router.js = slot-A in-flight, left alone). | build exit 0; search-empty-check PASS (name="No results", suggBtns=0, hint text present, role=status, 0 page errors); interact-check PASS (full flow routes, normal results path intact, 0 page errors) | committed (local) — push status TBD |
| 2026-08-27 03:59 MDT | tests (slot-C) | verification sweep over committed tree (HEAD=32b6ebf; slot-A in-flight router.js stashed during build, restored after — left untouched) — NO code changed, verify only. All camera-avoidance invariants HOLD: floor-audit 0 strict-legal edges <31.4 m (273 in 30-40 m bucket); engine-check modes distinct (Fastest/Balanced 10km/10min/2cams, Clearest 10km/11min/1cam); snap-dist-check 90.0/334.8 m; avoidance-audit LIVE PROBE PASS — BYU gate-snapped (Clearest mid-route min 40 m, clear to within ~118 m), 4 budget best-effort (25/12/17/4 m), walled/budget split correct. FLAG: uncommitted slot-A router.js (60 ins/26 del, since pre-03:55) remains UNVERIFIED — run the battery before commit/push. | floor-audit/engine-check/snap-dist-check/avoidance-audit all PASS; build exit 0 |

| 2026-08-27 04:15 MDT | ux (slot-B round 58) | search loading state + stale-reply guard: ui.js render() now shows an immediate non-interactive "Searching…" row (role=status, pulse animation — reduced-motion global rule already disables it) while photon is in flight, and a monotonic reqSeq token DROPS out-of-order stale replies (slow first response can no longer overwrite a newer query's results). New hermetic scripts/search-loading-check.mjs: CDP interception delays photon req #1 2.5s, asserts loading row + B's results win + late A reply dropped (SW registration stubbed — the stale-while-revalidate SW otherwise swallows fetches before interception sees them; photonCount=0 on first draft proved it). ALSO fixed interact-check.mjs flakiness found while verifying: its fixed 1100ms photon waits false-FAILed twice (photon latency measured 0.8-3.9s) → waitForSelector('#suggestions .sugg', 12s), same flaky class round 22/23 removed for the preview server. No routing/engine files touched. | build exit 0; search-loading-check PASS (loading row role=status non-button, B results win, stale dropped, photon reqs=2, 0 errors); search-empty-check PASS (empty state intact); interact-check PASS (full flow routes); escape-check PASS | committed eb44af7, PUSHED (b9d90cf..eb44af7) |

 ## Concurrency protocol
- Lock file: ~/projects/ghostway/.ghostway-loop.lock (epoch ts + file list).
  Present + fresh (<10 min) = another run is editing → research-only mode.
- Warm deploy (gh run not completed) = no pushes → research-only mode.
- Research-only runs append to "## Improvement Queue" above, never edit code.

| 2026-08-27 ~04:00 MDT | routing (slot-A round 57) | GATE-SNAP DEST-RADIUS SEARCH (resolves slot-B round-54 finding): nearestCandidates() exposes the snap-candidate list (nearestNode = first entry, byte-identical behaviour); clearTail split into buildClearIndex (once per origin) + clearTailTo (per dest node); gate-snap probes primary snap + up to 4 sibling candidates ≤400 m, takes shortest qualifying tail; badge distance honestly includes candidate→dest offset. MEASURED on the motivating case: photon's BYU centroid is genuinely deep inside the wall — every candidate within 420 m has an exposed tail 370-600+ m (all feeding gate 228440), so it correctly stays honest best-effort camera-walled; audit-coord BYU unchanged (gate-snapped 118 m). Lazy-engine special task: 7th confirmation — already complete (03e9224 on origin/main, tree was clean, 0 ahead/behind at run start); not re-done. | build exit 0; engine-check PASS (modes distinct); snap-dist-check PASS (90.0/334.8 m); floor-audit PASS (0 strict-legal <31.4 m); avoidance-audit PASS (BYU 40 m mid-route + gate note, 4 budget best-effort); byu-gate-check PASS (badge "clear to within ~118 m", 0 page errors); /tmp/gw-dest-radius-probe.mjs + diag prove the photon case is genuinely walled | committed 816bcdc — PUSH BLOCKED (gh token invalid again; see Needs Keaton) |
| 2026-08-27 04:11 MDT | tests (slot-C) | verification sweep over committed+pushed tree (HEAD == origin/main == 844efbf, backlog fully cleared; NEW commit 816bcdc = gate-snap dest-radius, verified here for the FIRST time) — NO code changed, verify only (fresh slot-B lock 04:09 "round58 search-loading-state" present → read-only). All invariants HOLD, ZERO drift: floor-audit 0 strict-legal edges <31.4 m; engine-check modes distinct (Fastest/Balanced 10km/10min/2cams, Clearest 10km/11min/1cam); snap-dist-check 90.0/334.8 m; avoidance-audit PASS — BYU gate-snapped (Clearest mid-route min 40 m, clear to within ~118 m), 4 budget best-effort (25/12/17/4 m), walled/budget split correct. NEW: standalone hermetic byu-gate-check PASS on committed dest-radius code — badge "clear to within ~118 m", walled badge absent, 0 page errors (audit-coord BYU unaffected by the radius search, as slot-A measured). gh auth healthy (0 ahead/behind). | floor-audit/engine-check/snap-dist-check/avoidance-audit/byu-gate-check all PASS | verified — no regressions; dest-radius commit confirmed working |
| 2026-08-27 04:15 MDT | ops (slot-A, special task re-check #8) | LAZY-ENGINE SPECIAL TASK: premise stale, 8th confirmation — 03e9224 confirmed on origin/main (git branch -r --contains), landed+pushed round 48; HEAD == origin/main == 844efbf, 0 ahead/behind; ALL routing files (router.js/config.js/main.js/map-view.js/engine/, engine-check/snap-dist-check) CLEAN — nothing to evaluate, build, or commit. Ledger already marks it TASK COMPLETE — DO NOT RE-DO. Fresh slot-B lock (04:09, round58 search-loading-state; holder ALIVE: interact-check + preview :4173 running) → research-only per protocol; no live slot-A routing queue item remains (all resolved/de-prioritized) → no routing unit started. This commit also carries slot-C's 04:11 sweep entry. | git branch -r --contains 03e9224 = origin/main; rev-list --count 0/0; routing files git-status clean | verified — no action needed |
| 2026-08-27 04:17 MDT | tests (slot-C) | read-only sweep under slot-B lock (04:09 round58 search-loading-state, 8 min old = FRESH → no build, no :4173, no edits; uncommitted src/styles.css + src/ui.js + untracked scripts/search-loading-check.mjs left untouched). NOTE: no live slot-B procs found (holder may have exited; lock <10 min so NOT reaped — next run reap if still stale+dead) — NO code changed, verify only. All invariants HOLD, ZERO drift from 04:11: floor-audit 0 strict-legal edges <31.4 m (273 in 30-40 m bucket); engine-check modes distinct (Fastest/Balanced 10km/10min/2cams, Clearest 10km/11min/1cam); snap-dist-check 90.0/334.8 m; avoidance-audit PASS — BYU gate-snapped (Clearest mid-route min 40 m, clear to within ~118 m), 4 budget best-effort (25/12/17/4 m), walled/budget split correct. gh auth healthy (0 ahead/behind). FLAG: uncommitted slot-B round-58 UI files remain UNVERIFIED until holder commits. | floor-audit/engine-check/snap-dist-check/avoidance-audit all PASS | verified — no regressions, nothing new |
| 2026-08-27 04:25 MDT | ops (slot-A, special task re-check #9) | LAZY-ENGINE SPECIAL TASK: premise stale, 9th confirmation — 03e9224 confirmed on origin/main (git branch -r --contains), landed+pushed round 48; HEAD == origin/main == eb44af7, 0 ahead/behind; ALL routing files (main.js/config.js/map-view.js/router.js + modified scripts) CLEAN — nothing to evaluate, build, or commit. Ledger already marks it TASK COMPLETE — DO NOT RE-DO. Reaped stale slot-B lock (04:09, 16 min old, holder provably dead: zero ghostway/vite/puppeteer procs). Re-verified current HEAD anyway: build exit 0; engine-check PASS (Fastest/Balanced 10km/10min/2cams, Clearest 10km/11min/1cam, modes distinct); snap-dist-check PASS (onRoad 90.0 m / offRoad 334.8 m). Only uncommitted file = this ledger. | git branch -r --contains 03e9224 = origin/main; rev-list --count 0/0; build exit 0; engine-check PASS; snap-dist-check PASS | verified — no action needed; task remains complete |
| 2026-08-27 04:28 MDT | tests (slot-C) | verification sweep over committed+pushed tree (HEAD == origin/main == d68df41, 0 ahead/behind, no lock, no live procs; slot-B round-58 search commit eb44af7 verified here for the FIRST time standalone) — NO code changed, verify only. All invariants HOLD, ZERO drift: floor-audit 0 strict-legal edges <31.4 m; engine-check modes distinct (Fastest/Balanced 10km/10min/2cams, Clearest 10km/11min/1cam); snap-dist-check 90.0/334.8 m; avoidance-audit PASS — correct walled/budget split (BYU gate-snapped, 4 budget best-effort 12/17/4 m). NEW: standalone hermetic search-loading-check PASS on committed eb44af7 — "Searching…" row role=status non-button, B results win, stale late-A reply dropped (photon reqs=2), 0 page errors. Deploys 33062970506 (eb44af7) + 33063070677 (d68df41) both success; live site HTTP 200 in 0.57s. gh auth healthy. | floor-audit/engine-check/snap-dist-check/avoidance-audit/search-loading-check all PASS; 2 deploys success; live 200 | verified — no regressions; round-58 search commit confirmed working + deployed |
| 2026-08-27 04:32 MDT | ops (slot-A, special task re-check #10) | LAZY-ENGINE SPECIAL TASK: premise stale, 10th confirmation — 03e9224 confirmed on origin/main (git branch -r --contains), landed+pushed round 48; HEAD == origin/main == d68df41, 0 ahead/behind, no lock, no live procs; ALL routing files (main.js/config.js/map-view.js/router.js + modified scripts) CLEAN — nothing to evaluate, build, or commit. Ledger already marks it TASK COMPLETE — DO NOT RE-DO. Re-verified current HEAD anyway: build exit 0; engine-check PASS (Balanced 10.0 km/10 min/2 cams, Clearest 10.0 km/11 min/1 cam, modes distinct); snap-dist-check PASS (onRoad 90.0 m / offRoad 334.8 m). Only uncommitted file = this ledger. | git branch -r --contains 03e9224 = origin/main; rev-list --count 0/0; build exit 0; engine-check PASS; snap-dist-check PASS | verified — no action needed; task remains complete |
