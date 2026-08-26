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
| R1 | design tokens + contrast + SVG icon set + touch targets | done | commit bd9ef83; --line→--line-strong 3.02:1; icons.js (40+ SVG); topbar/drawer/field emoji→SVG; focus-visible global |
| R2 | typography + tabular-nums + punch-list sweep (33/38) | done | commit 313aa47; nav-dist/rc-time 32px; tabular-nums on all numeric classes; radius/shadow/color tokens; desktop left-column; ≤420px topbar collapse |
| R2.5 | remaining touch targets | done | commit 322e4b1; steps summary/rc-edit/ob-skip/MapLibre zoom → 44px + themed chrome |
| R3 | SVG icons everywhere + loading/empty states | done | commit 8d051ca; nav banner/route card/step arrows/engine pills/onboarding → SVG; goBtn loading state; clear-btn hide-until-value; .ic pointer-events:none; interact-check PASS |
| R4 | drawer exit animation + attribution polish | done | commit 04ec1b7; slide-out/fade-out 180ms + reduced-motion; ux-audit whitelists OSM attrib links |
| R5 | push + deploy + live verification + fresh shots | done | pushed 04ec1b7; deploy run 33015417356 success; live HTTP 200; deployed bundle grep confirms line-strong/slide-out/stepIconSvg/Routing… present; ux-audit 0 issues |

## R0 baseline (measured 2026-08-26)
- Contrast: only failing pair = --line border #233047 on bg (1.45:1, needs 3:1 for UI).
- Touch targets <44px (ours): #menuBtn 38x42, #gpsBtn 38x42, #camLayerBtn 40x40,
  #editRouteBtn 76x17, .route-opt 344x39, steps SUMMARY 344x18, #closeDrawer 42x42,
  .drawer-item 267x41, #obSkip 37x27. (maplibre zoom/attrib = upstream, style-override later.)
- Emoji-as-icon inventory: ☰ menu, ◎ GPS, 📷 cam layer + cam chip, ✎ edit, ▶ start,
  ✕ stop/close, 🧭 recenter, 🔊 voice, ▤/▦ density, ↰↱↑⤺⤻⮌◎⊗ step arrows, 🕶🛡🚀 mode.
- tabular-nums missing: .rc-time .rc-dist .step-dist .opt-meta (+ nav-dist/nav-eta when rendered).

## Punch list (from R0 critique — 38 items, 9×P0/21×P1/8×P2)
Worked in R1/R2 unless marked DEFER.
- [x] #1 type scale: nav-dist/rc-time → 32px/800, tabular-nums (R1+R2)
- [x] #2 sl-lbl 8px→10px (R2)
- [x] #3 field input 15→16px no iOS zoom (R1)
- [x] #4 caption tier: 12px→13px (nav-then, rc-detour) (R2)
- [x] #5 drawer-foot/addr 11→12px, break-word (R2)
- [x] #6 kill gradient brand text → solid ink (R2)
- [x] #7 emoji→SVG chrome icons (R1 topbar/drawer/fields; nav banner + route card = R3, needs main.js/ui.js)
- [x] #8 4/8 grid: steps li 8px, modal 24px, ob-dots 8px, splash 8px, nav-side 4px (R2)
- [x] #9 surface padding: modal 24px, drawer safe-area (R2); panel stays 12px (dense form, intentional)
- [x] #10 radius tokens --r-sm/md/lg/xl; killed 6/9/18/26 stragglers (R1+R2)
- [x] #11 elevation: --shadow-1/2/3 assigned (R2)
- [x] #12 hardcoded colors → tokens; +--danger-strong (R2)
- [x] #13 dead .nav-voice border:none removed; nav-banner/nav-dist dupes merged (R2)
- [x] #14 focus-visible global + field focus-within (R1)
- [x] #15 clear-btn 40px hit area (R1); hide-until-value = DEFER (JS, R3)
- [x] #16 suggestions margin-top 0 + fade-in (R2)
- [x] #17 sugg gap 4px (R2); :active covered by global scale
- [x] #18 steps nested scroll removed; panel overscroll-behavior = DEFER (add w/ R3)
- [x] #19 steps li:last-child border none (R2)
- [x] #20 rc-badge/detour margins 8/4, rc-dist 16px (R2)
- [x] #21 hover states all buttons; :disabled/.loading on primary-btn (R2); loading wiring = R3
- [x] #22 mode-btn min-height 36px, 13px (R2)
- [x] #23 dead .switch CSS deleted (R2)
- [x] #24 nav-stop 44px + danger styling (R2)
- [x] #25 modal-close 40px @12px (R2); text-link pill = DEFER (P2)
- [x] #26 modal backdrop + blur (R2)
- [x] #27 drawer safe-area padding + foot (R2)
- [ ] #28 drawer exit animation = DEFER (needs JS class choreography, R4)
- [x] #29 map-chip drops below banner during nav (R2, CSS sibling selector)
- [x] #30 recenter/panel overlap: verified non-issue (panel hidden during nav)
- [x] #31 nav-banner border → rgba accent .35 (R2)
- [x] #32 speed-limit min-width 48px, sl-num 18px (R2)
- [x] #33 splash 28px name, 8px dots, role=status (R2)
- [x] #34 ob-step fixed 170px height, ob-skip padding 10px (R2); ob-icon SVG = DEFER (content emoji acceptable in onboarding)
- [x] #35 topbar 375px overflow → collapse brand/label ≤420px (R2)
- [x] #36 desktop 1024px+ left-column panel (R2)
- [x] #37 viewport maximum-scale removed (R2)
- [x] #38 select chevron data-URI (R2)
