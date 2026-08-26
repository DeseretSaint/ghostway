# Ghostway UX/UI Polish — Goal Loop (Keaton-directed, Hermes-run)

Standing goal: take Ghostway's interface from functional to **polished and professional** —
Google/Apple-Maps-grade UX — while the parallel self-improvement cron keeps advancing features.
This loop owns ONLY the UX/UI surface. Created 2026-08-26 by Keaton's direct request.

## Mission
Every screen must feel intentional: consistent tokens, WCAG AA contrast, ≥44px touch targets,
real SVG icons (no emoji as icons), visible focus/keyboard states, calm motion, tabular numerals
for all measurements, and honest states (loading/empty/error) everywhere.

## Hard constraints (inherited from GHOSTWAY-LOOP.md)
- No API keys / no third-party calls at runtime → NO Google Fonts CDN, no icon CDNs.
  System font stack + self-contained inline SVG only.
- No telemetry. Privacy-first is the brand; the UI must not leak a single request.
- Coordinate with the cron loop via `.ghostway-loop.lock` (list files on line 2). Never edit a
  file the cron lock claims; never push while a deploy is in flight.
- Verify EVERY change: `npm run build` + headless screenshots (scripts/ux-shots.mjs) +
  contrast script (scripts/ux-contrast-check.mjs) + vision review. Never ship "should work".

## Design intelligence (sources pulled 2026-08-26)
- ui-ux-pro-max (vault-filed, MIT): VPN/Privacy palette verdict — bg #0F172A-ish, card #192134,
  muted-fg #94A3B8, border rgba(255,255,255,.08); Ghostway's existing teal-on-navy is on-brand,
  keep teal #3ad6c5 as primary. Pre-delivery checklist adopted: no-emoji-icons, cursor-pointer,
  hover 150–300ms, contrast 4.5:1, visible focus, reduced-motion, responsive 375/768/1024/1440.
- UX guidelines adopted: inputmode on inputs, overscroll-behavior:contain, dvh not 100vh,
  tabular-nums for ETA/distance/speed, touch targets ≥44px, progressive disclosure.
- Vault UX-UI-Audit-OpenFinance-2026-08-07.md patterns adopted: progressive disclosure,
  "done" states after actions, don't mix configure-vs-review modes, one clear primary path.
- Skills applied: design-standards (6 standards), web-page-production-polish (QA recipes),
  frontend-component-build (states: default/hover/focus/active/disabled/loading/error/empty).

## Victory definition (ALL must hold)
1. Contrast: every text/UI pair ≥ 4.5:1 (3:1 large text + UI components), verified by
   scripts/ux-contrast-check.mjs exit 0.
2. Touch: every interactive element ≥44×44px hit area (mobile viewport), verified in shots script.
3. Icons: zero emoji used as functional icons in chrome (topbar, buttons, nav banner,
   step list, drawer). Inline SVG set committed in src/icons.js.
4. Numerals: ETA, distance, speed render with font-variant-numeric: tabular-nums (no jitter).
5. States: search (loading/empty), route card (loading), nav banner, drawer, modal all have
   designed loading/empty/error states; focus-visible rings on all interactive elements.
6. Screenshots (375×812, 390×844, 1440×900) vision-reviewed with no clipping, no dead space,
   consistent spacing rhythm (4/8px grid).
7. Build green, all existing check scripts still pass, live site deployed + spot-checked.
8. Critique punch list (R0) fully worked or explicitly deferred-with-reason in the round log.

## Round log
| round | focus | result | proof |
|-------|-------|--------|-------|
| R0 | baseline: shots + contrast audit + critique punch list | done | 15 shots in ux-shots/; contrast 14/15 pass (--line 1.45:1 FAIL); ux-audit.mjs: 20 touch targets <44px, emoji icons in 12+ places, 4 numeric classes lack tabular-nums; critique punch list below |

## R0 baseline (measured 2026-08-26)
- Contrast: only failing pair = --line border #233047 on bg (1.45:1, needs 3:1 for UI).
- Touch targets <44px (ours): #menuBtn 38x42, #gpsBtn 38x42, #camLayerBtn 40x40,
  #editRouteBtn 76x17, .route-opt 344x39, steps SUMMARY 344x18, #closeDrawer 42x42,
  .drawer-item 267x41, #obSkip 37x27. (maplibre zoom/attrib = upstream, style-override later.)
- Emoji-as-icon inventory: ☰ menu, ◎ GPS, 📷 cam layer + cam chip, ✎ edit, ▶ start,
  ✕ stop/close, 🧭 recenter, 🔊 voice, ▤/▦ density, ↰↱↑⤺⤻⮌◎⊗ step arrows, 🕶🛡🚀 mode.
- tabular-nums missing: .rc-time .rc-dist .step-dist .opt-meta (+ nav-dist/nav-eta when rendered).

## Punch list (from R0 critique)
(populated after R0)
