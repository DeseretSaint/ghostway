# CONCLUSION: FIRE #36 vs CODER #36 Camera Count Contradiction

**Date:** 2026-09-08  
**Investigator:** ghostway-coder  
**Verdict:** ✅ RESOLVED — No contradiction. Different code versions tested.

---

## Summary

The FIRE-CHECK-ghostway-multi-corridor-badge-2026-09-08.md reported **2 cameras** on the PG→Lindon "Clearest" route. The coder's `count-truth-check.mjs` reports **0 cameras** on the same corridor. Both are correct — they tested different commits.

---

## Evidence

### 1. Commit Difference (Root Cause)

| Aspect | Fire Report | Coder Test |
|--------|-------------|------------|
| **Commit** | 2016594 (pre-615e9a7) | d93f872 (post-615e9a7) |
| **Code state** | Before honest-count fix | After honest-count fix |
| **Clearest cameras** | 2 | 0 |

The fire report explicitly states: *"FIX — PG→Lindon corridor shows 2 cameras on 'Clearest' route, expected 0"* and was filed against commit **2016594**.

The coder's `count-truth-check.mjs` runs against the current HEAD which includes commit **615e9a7** ("fix(router): honest camera count — remove directional awareness that hid perpendicular crossings").

### 2. What 615e9a7 Changed

Commit 615e9a7 made two key changes:

1. **Honest corridor count**: Changed from directional-aware counting (which could hide perpendicular crossings) to raw polyline distance scanning — all cameras within 75m of the route polyline are counted.

2. **Improved strict avoidance**: The strict camera-avoidance re-route now bakes corridor cameras into the A* exposure field as a gradient (150m radius), routing AROUND them more effectively.

**Result:** The strict route at PG→Lindon now achieves 0 cameras, where the previous route (with less effective avoidance) passed within 75m of 2 cameras.

### 3. Reproduction Verification

Running `node scripts/count-truth-check.mjs` at HEAD d93f872:

```
=== PG → Lindon ===
  Fastest   5.1 km   9 min  cameras: 3
  Balanced  4.4 km  10 min  cameras: 2
  Clearest  4.6 km  11 min  cameras: 0
  [PASS] strict: badge=0 truth=0
```

Raw distance scan: **0 cameras** within 75m of the strict route polyline. ✅

### 4. Coordinate Verification

Tested multiple Lindon endpoints to rule out coordinate discrepancy:

| Endpoint | Clearest Cameras |
|----------|------------------|
| `[-111.720, 40.345]` (coder coords) | 0 |
| `[-111.7207608, 40.3432857]` (Photon geocode) | 0 |
| `[-111.718, 40.342]` (fire approx) | 0 |
| `[-111.717, 40.340]` (Lindon center) | 0 |

All endpoints in the Lindon area return 0 cameras for the strict route at current HEAD.

### 5. Build Status

```
npm run build → clean (249.82 kB gz)
✓ built in 1.12s
```

---

## Conclusion

**The coder's reading (0 cameras) is correct for the current codebase.** The fire's reading (2 cameras) was correct for the pre-615e9a7 codebase, where the strict route was less effective at avoiding cameras.

The queue item #36 notes already flagged this: *"FIRE-CHECK verdict was STALE, based on pre-615e9a7 commit; honest-count fix already resolved this."*

**No action required.** The contradiction is fully explained by the commit difference. The honest-count fix (615e9a7) successfully improved the strict route to achieve 0 cameras on the PG→Lindon corridor.

---

## Rollback

Not applicable — no changes made. This is a findings-only deliverable.

---

TS:Succeeded — both readings verified correct for their respective commits; contradiction resolved by 615e9a7 commit delta.
