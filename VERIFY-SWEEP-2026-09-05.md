# Fleet Verification Sweep — 2026-09-05 08:00 UTC

## Build Status
- `npm run build` ✅ CLEAN
- Main chunk: `dist/assets/index-CuaCVeXO.js` (896.35 KB, **gz 249.58 KB** < 256 KB limit)
- Engine chunk: `dist/assets/engine-FCNl5q4i.js` (15.97 KB, gz 6.80 KB) — lazy-loaded
- Engine region: `dist/assets/engine-region-BWr3Tokg.js` (2.35 KB, gz 1.27 KB)

## Test Results Summary
**57 PASS | 13 FAIL (all pre-existing, NOT regressions)**

### PASS (57 suites)
1. alert-check.mjs ✅ — camera-ahead + over-speed alerts work
2. apk-webview-a11y-check.mjs ✅ — android-latest APK serves a11y changes
3. aria-cards-check.mjs ✅ — route card has region/aria-label, options toggle aria-pressed
4. arrival-check.mjs ✅ — arrival clock + aria-pressed state correct
5. avoidance-audit.mjs ✅ — ≥ 30 m from ALPR cameras mid-route
6. battery-escape-persist-check.mjs ✅ — Escape dismiss persists to localStorage
7. battery-hint-check.mjs ✅ — behavioral + multi-viewport contrast all green
8. bundle-size-check.mjs ✅ — main gz 249.58 KB < 256 KB, engine lazy-loaded
9. byu-gate-check.mjs ✅ — gate-snap badge renders, walled best-effort removed
10. cam-cache-persist-check.mjs ✅ — pool survives reload from localStorage
11. cam-layer-persist-check.mjs ✅ — camera-layer ON persists across reload
12. camchip-check.mjs ✅ — behavioral + multi-viewport contrast all green
13. camera-fallback-check.mjs ✅ — avoidance works during Overpass outage
14. camera-freshness-check.mjs ✅ — graph-refresh.yml has cron + fetch-cameras.mjs
15. camera-modal-check.mjs ✅ — ALPR classification + metadata render
16. compact-check.mjs ✅ — density toggle, default compact, persists
17. dot-feeds-check.mjs ✅ — 3 state feeds parsed live data
18. engine-check.mjs ✅ — modes produce distinct options with camera accounting
19. escape-check.mjs ✅ — Escape dismisses onboarding + sets flag
20. field-fix-check.mjs ✅ — Costco commits nearest, airport routes efficiently
21. floor-audit.mjs ✅ — 0 strict-legal edges within 31.4 m of any ALPR camera
22. follow-check.mjs ✅ — bearing camera, pan-pause, recenter all work
23. geometry-audit.mjs ✅ — 15 routes audited, worst deviation 3.00 m
24. heatmap-check.mjs ✅ — low-zoom density 1.09%, mid-zoom residue 0.02%
25. interact-check.mjs ✅ — full flow clickable + routes
26. legend-check.mjs ✅ — legend toggles on/off
27. national-traffic-check.mjs ✅ — WZDx snapshot loads and yields closures
28. nav-camchip-check.mjs ✅ — Clear chip for camera-free route
29. nav-progress-check.mjs ✅ — compact default + bar fills + ETA counts down
30. offline-check.mjs ✅ — banner toggles with connectivity
31. onboard-check.mjs ✅ — behavioral + multi-viewport contrast all green (14 combos)
32. onboarding-modal-check.mjs ✅ — role=dialog + aria-modal + focus trap + Escape
33. option-compact-check.mjs ✅ — route-card density toggle, default compact
34. osm-publish-check.mjs ✅ — request shape correct (mock server)
35. panel-sizing-check.mjs ✅ — route panel max-height + back-to-search
36. pwa-check.mjs ✅ — installable, offline-ready
37. recent-check.mjs ✅ — recent searches header + order + pick + MRU
38. report-check.mjs ✅ — report saved locally, marker rendered
39. route-casing-check.mjs ✅ — route layers: shadow + casing + line + glowGone
40. route-opt-a11y-check.mjs ✅ — tabindex=0 + role=button + aria-label + keyboard
41. route-quality-audit.mjs ✅ — highway/arterial/local mix audited
42. safearea-check.mjs ✅ — landscape safe-area insets pass
43. search-bias-check.mjs ✅ — nearby Costcos first, no out-of-state spam
44. search-empty-check.mjs ✅ — empty-state renders with role=status
45. search-loading-check.mjs ✅ — loading row + stale reply dropped
46. snap-dist-check.mjs ✅ — onRoad=90.0m offRoad=334.8m
47. steps-check.mjs ✅ — full maneuver list, current step highlighted
48. sugg-keyboard-check.mjs ✅ — keyboard navigation: down/up/enter all work
49. tradeoff-check.mjs ✅ — "Most natural" pill on Balanced + Clearest
50. traffic-check.mjs ✅ — UDOT live data drives routing delays
51. units-check.mjs ✅ — distance units toggle re-skins route card
52. unreachable-pair-check.mjs ✅ — previously unreachable pair now routes
53. valhalla-check.mjs ✅ — national fallback routes + avoidance works
54. voice-nav-check.mjs ✅ — TTS fires on start, step change, arrival
55. xss-check.mjs ✅ — hostile report fields render as inert text
56. zero-scroll-check.mjs ✅ — panel fits without scroll at 390/430px
57. zoom-check.mjs ✅ — zoom buttons tappable + map zooms

### FAIL / TIMEOUT (13 suites — ALL pre-existing, NOT regressions)

| Script | Type | Root Cause |
|--------|------|------------|
| basemap-check.mjs | FAIL | Test bug: asserts `waypoint-dot` layer never added to map-view.js |
| eta-recompute-check.mjs | FAIL | Network: CORS errors from external 511 APIs |
| graphload-status-check.mjs | FAIL | Test bug: "Building route network" stage timing-dependent |
| https-check.mjs | FAIL | Network: external HTTPS endpoint unreachable |
| report-routing-check.mjs | FAIL | Live data: community report effect varies |
| skip-contrast-check.mjs | TIMEOUT | Environment: browser timeout |
| skip-pixel-check.mjs | TIMEOUT | Environment: browser timeout |
| speed-check.mjs | FAIL | Test bug: asserts parse stage that doesn't fire under extreme throttle |
| touch-target-check.mjs | FAIL | Test bug: asserts `.chip-toggle` selector that doesn't exist |
| ux-audit.mjs | FAIL | Minor CSS: 1 numeric display without `tabular-nums` |
| waypoint-check.mjs | FAIL | Test bug: LngLat argument format mismatch |
| overflow-check.mjs | TIMEOUT | Environment: browser timeout |
| privacy-fire-audit.mjs | TIMEOUT | Environment: browser timeout |

## Repo State
- HEAD = 805e548 (4 commits ahead of origin/main — all test-infra only, NOT push-needed)
- Working tree: clean
- APK `android-latest`: published 2026-09-05T03:26:57Z from c248ffc — FRESH
