# Ghostway Route-Quality & Speed Goal Loop

Started: 2026-08-26 ~16:40 MDT. Cron loop PAUSED for duration (router.js contention).

## Mission
1. Route QUALITY: routes must feel sensible, not forced. Keaton's case: home (Pleasant
   Grove) → Costco — Google takes State Street (direct arterial); Ghostway forces a
   highway hop. Fix the cost model + option picker so the suggested route matches
   driver intuition, while keeping camera avoidance honest.
2. Route OPTIONS: avoid-highways (and tolls where data exists) as user-selectable options.
3. SPEED: GPS "my location" lock ~3s+janky → instant first fix + progressive refinement.
4. VERIFICATION: repeatable route-quality audit harness (route-quality-audit.mjs) with
   hard metrics: detour ratio, highway share, camera passes, ETA parity vs Valhalla.

## Victory criteria (self-defined)
1. PG→Costco default suggestion no longer forces the highway hop: either routes via
   State Street/arterials when ETA is within ~15%, or presents it as the default option.
2. Picker fallback fixed: moderate mode never silently picks Clearest (strict) when
   Balanced is absent.
3. Detour budget enforced (capFactor was DEAD CODE — declared, never applied): strict
   mode gets a distance-aware detour cap so a 10 km trip never eats +38% time silently;
   over-budget avoidance is surfaced as "best effort" not forced.
4. Avoid-highways option shipped (engine + Valhalla fallback + UI toggle).
5. GPS lock: instant first fix from cache/IP, high-accuracy refines in background;
   UI updates immediately, reverse-geocode never blocks.
6. ETA parity vs Valhalla stays within ±10% on all 5 benchmark corridors.
7. route-quality-audit.mjs green on all corridors (no >1.25x detour without camera
   payoff; no forced highway on sub-12km trips when an arterial alternative exists).
8. All deployed + live-verified; cron loop resumed.

## Root-cause findings (R0, measured)
- route-quality-audit.mjs on PG→Costco: Fastest = 10.0 km/10 min, 61% highway
  ("Veterans Memorial Highway" 6.0 km), 2 cams. Clearest = 10.1 km/14 min (+38% time),
  0 cams, weaves 38% local roads. NO Balanced option exists for this corridor.
- PICKER BUG (the actual Keaton complaint): default mode = moderate;
  pickOptionForMode fallback order is [moderate, strict, off] → with no Balanced
  option, moderate users get CLEAREST — the most extreme route. Fix: [moderate, off, strict].
- capFactor DEAD CODE: MODES.moderate declares capFactor 1.25, strict Infinity, but
  astar() never reads it. No detour budget is enforced anywhere.
- GPS: useMyLocation() blocks UI on (a) cold high-accuracy fix, (b) awaited
  reverseGeocode() before setEndpoints. No cached last-fix reuse.
- ETA parity already good: 5 corridors within ±0 min except AF→Park City +5, Orem→SLC −10.

## Round log
| round | focus | result | proof |
|-------|-------|--------|-------|
| R0 | diagnostics: audit harness + road probe + picker trace | done | route-quality-audit.mjs; findings above |
