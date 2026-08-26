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
- Known remaining: real-drive ETA ground truth (blocked on Keaton's PG→Costco time).

## Improvement Queue
Research-only runs (locked or warm-deploy) append ideas here. Edit runs pull
from this queue first when it's non-empty.
- [x] Mid-zoom heatmap clustering (visual noise reduction) — landed 2026-08-26
- [ ] Route-line anti-cut: Douglas-Peucker already in; audit edge cases on highways
- [ ] Speed: chunk the graph load / show progress; measure on throttled connection
- [x] Test infra: interact-check menuHit/gpsHit return {} (elementFromPoint hits
      SVG child; SVG className is SVGAnimatedString, not string) → false FAIL
      risk; also add watchdog to every puppeteer suite (browser.close() hangs
      under swiftshader — hit twice this round) — LANDED 2026-08-26 (round 22)
- [ ] Camera-walled destinations: BYU has no ≥30 m approach road; consider
      "clear within N m of endpoint" messaging or parking-gate snapping
- [ ] Test infra: ux-shots/shot/ux-audit/pwa-check still use fixed sleeps
      (2.5-2.6s) for vite preview startup — same flaky class interact-check
      had (ERR_CONNECTION_REFUSED on npx cold-start); port the poll-until-up loop
- [ ] Test infra: engine-e2e startNavBtn hit-test returned maplibregl-canvas
      (banner still showed + click worked) — investigate whether the collapsed
      panel overlaps the button center after strict re-route

## Needs Keaton
Decisions that require Keaton (money, legal, destructive ops). Loop does not
block on these — it queues and moves on.
- [ ] Donation setup: BTC/Lightning + Monero addresses needed to fill
      src/config.js placeholders (decided: crypto-primary, Ko-fi optional).
- [ ] Real-drive ETA ground truth: Keaton's actual PG→Costco drive time.

## Latest round
| date | axis | what changed | proof | status |
|------|------|--------------|-------|--------|
| 2026-08-26 | (seed) | loop created | cron live | active |
| 2026-08-26 | visual | heatmap zoom crossfade (z10.5→z12.5 fade) + check-script fixes | heatmap-check PASS (z9.5 1.17% → z12.5 0.05%), smoke PASS, interact-check PASS, build exit 0 | shipped |
| 2026-08-26 | camera-avoidance | strict hard safety floor (no edge <30 m from ALPR) + best-effort badge + avoidance-audit suite | audit PASS: 4/5 corridors were 5-25 m → now all ≥30 m; BYU camera-walled flagged; engine-check/smoke PASS; badge verified in live UI | shipped |
| 2026-08-26 | test-infra (round 22) | fixed SVG-hit-test false FAILs (SVGAnimatedString className + descendant hits count as control hits) in interact/report/compact/engine-e2e; splash wait before hit-tests; poll-until-up preview server; watchdog (150s force-exit) + close-race in all 19 puppeteer suites | interact-check: was HANG forever + false FAIL (menuHit='splash') → PASS 31.7s; report/compact/engine-e2e/smoke/heatmap all PASS with clean exits; node --check all 35 scripts | shipped |

## Concurrency protocol
- Lock file: ~/projects/ghostway/.ghostway-loop.lock (epoch ts + file list).
  Present + fresh (<10 min) = another run is editing → research-only mode.
- Warm deploy (gh run not completed) = no pushes → research-only mode.
- Research-only runs append to "## Improvement Queue" above, never edit code.
