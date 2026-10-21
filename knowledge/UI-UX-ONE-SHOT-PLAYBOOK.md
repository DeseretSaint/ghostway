# UI-UX One-Shot Playbook

Living playbook distilled by the UI/UX self-improvement fleet (cron, Qwen-pinned).
Ledger: `~/projects/uiux-self-improvement/GOAL-LOOP.md` · Enforced via the `uiux-one-shot-polish`
Hermes skill (load it before any UI build/review).

Goal: every app/website we build lands **polished and professional on the first pass** —
Ghostway, Open Finance, Deseret Marketing site, DM admin cockpit, and everything after.

## Accepted strategies (verified)
Each entry: strategy · why it works · source · verified how · date. Appended by fleet SLOT C only
after adversarial verification (2nd source / counterexample hunt / mechanical test).

### Q1 — Type scale & hierarchy · 2026-08-27
- **Body-first ramp; line-height INVERSE to size** (display ~1.12 → body ~1.50) · larger type
  needs less leading · Material 3 + Refactoring UI · mechanical ratio check (scratch/verify_q1.py).
- **Line length 50–75ch, ~66 ideal; 80ch hard cap (WCAG 1.4.8); REJECT 90ch** · independent
  sources converge on the tight bound · UXPin/Bringhurst/gowin + WCAG · multi-source convergence.
- **Lowercase for glanceable text** — reads ~26% faster than all-caps (p<0.01); all-caps ONLY
  for short labels, never passages · NN/g (Sawyer/MIT AgeLab glanceable-fonts study) ·
  primary-source exact match.
- **"1.25 ratio" ramp is approximate** — Refactoring UI's real steps are hand-tuned 1.14–1.25;
  starting point, not law · Refactoring UI · mechanical check of the published ramp.
- Caveat carried forward: M3 optical letter-spacing exact values (-0.25/+0.5px) remain
  [needs-evidence] — do not cite as verified.

**Q1 mining-pass addendum · 2026-08-28** (7/7 patch notes verified, scratch/q1_verify.md):
- **Letter-spacing is inverse to size — and the values live in the tokens.** The
  design-standards type table already baked it (−0.02em@64px → −0.01em@48px → 0@36–18px →
  +0.01em@12px caption → +0.08em@eyebrow) but never STATED it; now stated in
  design-tokens-template.md with `font-optical-sizing: auto`. Never free-adjust tracking
  outside the tokens (converges w/ Q21: LLMs over-apply negative tracking).
- **No fixed modular ratio required** — mechanical ratio check: template steps compute to
  hand-tuned 1.125–1.333; golden-ratio/modular-scale dogma = cargo-cult (see Rejected).
- **Internal conflict FIXED**: preship-checklist.md + umbrella Polish gate both said
  45–75ch, contradicting the fleet-verified 50–75ch baseline → both patched to 50–75ch
  (~66 ideal, 80ch hard cap).
- **Eyebrow token carries the Q18 default-ban caveat** in design-tokens-template.md
  (brief must earn it back; `<p>`/`<span>`, never a heading element).
- **Maximal-set reconcile**: token table = 9-size MAXIMAL set; a project picks a ~6 subset.
- Carried [needs-evidence]: utopia fluid-clamp display recipe; text-wrap balance/pretty +
  tabular-nums browser support; opsz benefit magnitude.

### Q2 — Spacing systems (4/8pt) · 2026-08-28
- **4-vs-8 rule stated** — 4px increments = INSIDE components (icon↔label, badge padding,
  form gap, chip spacing); 8pt multiples = BETWEEN components/sections (layout rhythm).
  The ladder's half-steps (12/20px) are legitimate — strict-8pt-grid-everywhere =
  cargo-cult (Tailwind's 4px base / 8pt primary rhythm agrees) · design-standards refs
  mining + bolt extraction (open-props@1.7.23, utopia.fyi) · 6/6 verified.
- **Grouping hierarchy** — intra-group gap ≥ one scale step SMALLER than inter-group gap
  (e.g. 8px inside a card list item, 24px between items, 64px between sections) · convergence
  w/ impeccable "tight groups / generous separation" craft floor.
- **Heading space-above > space-below** — asymmetry signals grouping; never equal.
- **Pin ranges to ONE value per project** — card-padding + grid-gap pinned to 24px
  (template had "24px to 32px" — a range, not a value).
- **Optional fluid spacing** (utopia.fyi / open-props `--size-fluid`) for section-py +
  page-padding-x only; component-INTERNAL spacing stays STATIC (fluid gaps inside buttons/
  inputs = optical drift). Boundary: fluid floors mean phones/tablets get the static floor;
  the vw slope only bites ≥~1440px → fluid spacing = wide-viewport refinement, not mobile
  magic (Ghostway iPhone gets static floors) · mechanical clamp math (scratch/q2_verify.md).
- **Cargo-cult flags upheld**: strict-8pt-grid-as-law, golden-ratio spacing (1.618),
  "more whitespace always better" — same class as the Q1/Q18 verified rejections.

### Q3 — Color systems · 2026-08-27
- **Grayscale-first workflow** — build hierarchy with spacing/size/weight BEFORE introducing
  color; stick to 2–3 colors (dark primary, grey secondary, lighter grey tertiary) ·
  Refactoring UI · 2nd-source convergence, no counterexample.
- **Define the FULL shade set up front, never free-pick** — ~10 greys + primary with 5–10
  shades + semantic accents (red destructive, yellow warning, green positive) each 5–10
  shades; only pick from the set · Refactoring UI · verified.
- **Tint greys with the brand hue** (cool=blue, warm=yellow); on colored backgrounds use a
  lighter/transparent version of the background hue, never grey · Refactoring UI · verified.
- **Semantic token layer** — map shades to roles (primary/surface/error/on-surface), not raw
  hues (M3 tonal-palette model); applies to DM cockpit + Open Finance · M3 + Primer/
  brainy.ink convergence · verified.
- **WCAG 2.2 hard numbers** — AA text ≥4.5:1, large text ≥3:1; AAA 7:1/4.5:1; non-text UI
  components + meaningful graphics ≥3:1 (1.4.11); color never the only visual signal (1.4.1) ·
  w3.org WCAG22 primary extraction · verified.
- **Dark mode = its own palette, never inverted light** — near-black bg (#121212 floor; pure
  #000 only for OLED battery/wearables/high-contrast a11y), off-white text #E0E0E0 (≈14.2:1;
  pure #FFF halates), desaturated accents (200-tone), elevation via tonal lightness not
  shadows · M2 guidance + 4-source convergence · scratch contrast math (14.19:1 confirmed).
- Caveat: HSL hue-drift-with-lightness confirmed, but "raise saturation as lightness rises"
  oversimplified (chroma shrinks at extremes) — prefer OKLCH/HSLuv for scale generation ·
  GitHub Primer · contested, kept with caveat.

### Q4 — Depth & shape consistency (radius/shadow/elevation) · 2026-08-28
- **Elevation semantics stated** — elevation is a hierarchy signal: static content stays
  FLAT (border/divider, no shadow); resting card = shadow/sm; hover = +1 step; overlays/
  dropdowns/modals = top of scale; shadow level MUST agree with the z-layer (shadow/xl on a
  z/base element reads broken) · design-standards refs mining · 6/6 verified.
- **Shadow structure** — layer count GROWS with elevation; tinted hue is the constant
  (Tailwind v4: 2xs/xs/2xl single-layer, sm/md/lg/xl two-layer; open-props shadow-1 single →
  shadow-3..6 = 4–8 stacked). Tint toward surface/brand (open-props `--shadow-color:
  220 3% 15%` @1% strength); pure-black reads muddy on tinted surfaces, fine on neutral
  white · PRIMARY bolt extraction (open-props@1.7.23, tailwindcss@4.1.12) verbatim.
- **Dark-mode depth** — shadows nearly invisible on dark → tonal elevation (Q3) +
  darker-hue/higher-strength shadows (open-props dark: 220 40% 2% @25% vs light 220 3% 15%
  @1%).
- **Radius rules** — ONE radius family per product (sharp/rounded/pill); nested radius =
  outer − (border+padding), clamped ≥0 (Q21); size correlation baked (badge 4px → card
  20px → modal 24px).
- **Shadow ↔ motion** — hover shadow 100–150ms ease-out; animate pseudo-element opacity
  instead of box-shadow on perf-critical surfaces [needs-evidence, low risk].
- **Boundary** — open-props shadow-3+ negative spreads can clip tight containers; test
  before copying deep steps.
- **Cargo-cult flags upheld**: elevation-requires-shadow, bigger-shadow=premium,
  glass-as-depth, pill-everything.

### Q5 — Iconography consistency · 2026-08-28
Mining-pass (no web search): existing skill content HOLDS (currentColor/aria-hidden/
visually-hidden/3:1 all correct), gaps filled.
- ONE icon set + ONE style (outline OR filled OR duotone) + ONE stroke width product-wide;
  mixing Lucide+Heroicons = canonical AI-slop tell (Q18 convergence). Even within one
  named set, styles sit on different grids (Heroicons: 24 outline / 20 solid).
- One grid: 24×24 viewBox standard (Lucide/Heroicons-outline/Material Symbols); mixing
  grids = optical drift. Lucide spec = 24×24 + 2px stroke + ≥1px padding (NOT "2px
  keyline" — that's Material practice; SLOT A correction upheld).
- Icon SIZE tokens tied to the type scale: 12/16/20/24px; icon ≈ adjacent label text size
  (~1em); button icons one step ≤ standalone.
- Icon+label gap 4–8px (4px inside-component step, Q2); icon aligns to CAP HEIGHT, not
  line-box center (Q21).
- Filled vs outline = active/selected state semantics (M3; non-color-only signaling, Q17).
- Stroke-width boundary: 2px too thin ≥32px (reduce), too heavy ≤16px (raise to 2.25–2.5).
- Delivery: inline SVG currentColor (no icon fonts, no CDN); decorative aria-hidden;
  icon-only gets an accessible label; 3:1 non-text contrast (1.4.11).
- OF Android = M3 Symbols (24dp grid, own stroke) — consistent with the 24-grid rule.
Source: lucide.dev PRIMARY + iconoop/JAD Apps 2nd-source + gap-check vs brand-identity/
frontend-component-build/design-standards refs (ledger Q5 B-row, 7/7 verified).

### Q6 — Hero / above-fold landing patterns · 2026-08-28
Mining-pass (no web search): landing-page-copy was words-only; layout/fold/CTA-visual gaps
filled.
- **The fold is a GRADIENT, not a wall** — users DO scroll (Nielsen retracted the 1997
  no-scroll claim), but ~57% of viewing time is above the fold, 74% in the first two
  screenfuls (≤2160px), rarely past the third (NN/g eye-tracking). Users scroll only when
  information scent says the rest is valuable → the hero must EARN the scroll (promise +
  proof + CTA above fold, supporting proof below). BOTH "cram above the fold" and "fold
  doesn't matter" are myths.
- **5-second clarity test**: stranger, 5s → must name what it is / who it's for / what to
  do next / the main benefit (CXL/Schottmuller 4-question form).
- **ONE primary CTA per page**, repeated VERBATIM at hero + after proof + final offer;
  secondary actions demoted to links. Unbounce 2026 (44M conversions): single CTA 13.5% vs
  5+ CTAs 10.5%; long-form/complex offers gain (+23%) from the SAME CTA repeated at scroll
  depths — repetition, not competition.
- **Hero layout**: left-aligned headline+sub+CTA stack default (centered trio = Q18 tell);
  real product screenshot > stock photo; proof element near CTA; eyebrow default-ban (Q18),
  gradient-text h1 = tell.
- **Mobile hero**: promise + CTA inside the first viewport at 390×844 (dvh, Q8); sub may
  fall below fold, headline+CTA must not; CTA thumb-reachable ≥44px.
- **Scroll-earning structure**: the 7-step persuasion sequence is a scroll narrative —
  steps 2–7 live below fold by design; strongest proof immediately after the first scroll
  (position 2; scroll-past-hero = conversion bottleneck).
- **CTA visual spec**: filled button ≥3:1 non-text (1.4.11, Q3/Q24), ≥44px (Q8), 4 states
  (Q21), first-person verb label — keep the principle, never quote a lift % as law
  (canonical Aagaard 2014 +90%; single-test lifts vary 12–90%).
Source: NN/g PRIMARY ×2 (scrolling-and-attention 2018 + 2010) + CXL/Schottmuller +
Unbounce 2026 benchmark (ledger Q6 B-row, 7/7 verified, 1 correction: SLOT A's "majority
scroll past fold" overstated — attention decays, top still gets majority viewing time).
Full spec: landing-page-copy SKILL.md + references/hero-formulas.md § Hero layout & the fold.

### Q7 — Grid / max-width / measure · 2026-08-28
Mining-pass (no web search): three conflicting page-max-widths across skills reconciled;
prose-measure token added to design-standards layout §.
- **The px max-width protects MEASURE + scan rhythm, not a standalone number** — pick by
  density (prose/marketing 1280–1520px; dense dashboards may fill wider) and ALWAYS pair
  with fluid `padding-inline: clamp(1.25rem, 4vw, 3rem)`. Conflict resolved: the token
  template's 1280px default caused dead space at 1440–2560px (web-page-production-polish
  §4 build-verified ~1520px fix).
- **px shell vs ch column are INDEPENDENT** — page max-width governs the SHELL; the prose
  measure (own token, 65ch; 50–75ch range, 80ch hard cap per Q1) governs TEXT COLUMNS.
  Wide shell + narrow column = standard editorial layout.
- **ch is font-dependent** — `1ch` = advance width of '0' (csswg), varies ~50% across
  typefaces, ≠ average char width in proportional fonts → prefer rem for a predictable
  column limit or set ch per fixed font (system-ui '0' ≈ 0.5em). Tailwind `max-w-2xl`
  (42rem) is a rem PROXY, not ch-based; prefer `max-w-[65ch]` only with a fixed font stack.
- **Grid-gap: ONE pinned value** per project tied to the spacing ladder (24px between
  cards, 32px between grid groups) — never a range (Q2 pin rule).
- **Breakpoints = TEST CHECKPOINTS, not design drivers** — fluid-first + container
  queries (Q8), verify at checkpoint widths.
Source: web-page-production-polish §4 (build-verified user correction) + design-standards
refs mining + 2nd-source ch-unit convergence (meyerweb/csswg/clagnut) — ledger Q7 B-row,
6/6 verified, [needs-evidence] (ch-vs-rem drift) CLEARED.

### Q8 — Mobile-first, container queries, PWA touch layout · 2026-08-27
- **24px WCAG 2.5.8 floor** — the 24px square must fit INSIDE the target; exceptions:
  spacing ≥24px apart, inline presentation, author-determined, equivalent elsewhere; zoom
  doesn't count; dropdown-obscured targets exempt. A 16px-tall full-width button still
  FAILS · W3C primary extraction + scratch geometry (reproduced W3C's 20px±gap examples).
- **44pt (iOS) / 48dp+8dp gap (Android) = comfort FLOORS, not ideals** — 1pt ≈ 1 CSS px;
  48dp = 7.62mm, 44pt ≈ 6.86mm — below NN/g's 10mm finger-pad ideal; accuracy plateaus
  ~14mm · Google a11y + HIG mirror + scratch math (corrected Google's "~9mm" claim).
- **Container queries ship-ready** — Chrome 106+/Safari 16+/Firefox 110+; use
  `container-type: inline-size` + `cqi` units (not `size`) · caniuse + MDN.
- **PWA safe area** — `viewport-fit=cover` required; pad edge-anchored UI with
  `env(safe-area-inset-*)` (0 on rectangular viewports — always safe to apply) · MDN.
- **dvh over 100vh** — vh ≡ lvh, overshoots behind expanded mobile toolbars; BOUNDARY:
  dvh can resize content mid-scroll → svh for fixed full-bleed · MDN.
- **Installed-PWA detection = dual-check** — `navigator.standalone` OR
  `matchMedia('(display-mode: standalone)')`; iOS Safari reports 'browser' · MDN.
- **On-screen keyboard** — OSK shrinks the visual viewport, not layout; use VisualViewport
  resize/scroll events (device-fixed emulation flickers); CSS alt `env(keyboard-inset-*)` · MDN.

### Q10 — Android / Material 3 patterns (Open Finance) · 2026-08-27
- **Nav bar: 3–5 destinations; labels NOT always-visible by default** — LABEL_VISIBILITY_AUTO
  labels ≤3 items, selected-only at 4+; set LABEL_VISIBILITY_LABELED explicitly. Container
  colorSurfaceContainer + 3dp; active indicator 56×32dp 50%-rounded colorSecondaryContainer ·
  developer.android.com + material-components GitHub · primary extraction verbatim.
- **Bottom sheets: standard (no scrim, coexists) vs modal (scrim, blocks)** — defaults:
  surfaceContainerLow, cornerExtraLarge = **28dp** (24dp is stale M2), 640dp max-width
  (full-width on every phone), half-ratio 0.5, draggable 500px/s, drag handle reserves 48dp,
  hideable false/true · GitHub BottomSheet.md + API ref · verbatim + scratch dp math.
- **Dynamic Color is opt-in + brand fallback mandatory** — applyToActivitiesIfAvailable +
  DayNight ThemeOverlay; wallpaper → 5 key colors → 13-tone palettes, light+dark, same
  tokens; fallback = app's own Theme.Material3 scheme (error #B3261E); HarmonizedColors for
  custom colors; variants Tonal Spot A12 / Neutral·Vibrant·Expressive A13 · dev.android.com ·
  verbatim.
- **sp for font sizes ONLY** — dp for padding/dimensions (sp on non-text reflows touch
  targets with font scale); px discouraged · dev.android.com more-resources · verbatim.
- **Window size classes are WINDOW-based, not device-based** — compact <600dp (99.96% phones
  portrait), medium 600–840, expanded 840–1200, large/XL opt-in; height <480/480–900/≥900;
  class changes at runtime (split-screen/fold) → state must survive; never isTablet logic ·
  dev.android.com · verbatim.
- **M3 Expressive = separate opt-in tier** — baseline M3 + note deltas (64dp nav, 6dp
  padding, 56dp indicator, horizontal icon-start ≥600dp); don't adopt wholesale · GitHub doc.
- Full spec table: open-finance-build skill `references/m3-android-component-specs.md`.

### Q11 — Loading / empty / error states · 2026-08-27
- **Skeletons preferred when final layout known** — MUST match final grid/box sizes
  (mismatch → CLS on swap); delay ~200ms before showing (fast loads must not flash);
  escalate at 5s (convention); 10s = Nielsen's researched attention wall (percent-done
  beyond it) · NN/g response-time-limits + ui-craft · primary + 2nd-source.
- **Spinners only for short indeterminate waits or as overlay ON existing content** —
  centered spinner on blank screen = canonical mistake (Nielsen: last resort when % done
  impossible) · NN/g + ui-craft · verified.
- **Empty states route by CAUSE** — first-use → explain + ONE primary CTA (+sample);
  cleared → acknowledge + next; filtered → name filter + "Clear filters" (NOT create CTA);
  search-no-results → echo query + suggestions; 401 → "Session expired" + sign-in. Every
  empty state: WHY + next action + icon; cold-user-knows-what-to-click-in-5s test ·
  NN/g + ui-craft · both sources.
- **TRAP (NN/g verbatim)**: never show "No records"-style status that fills with data after
  a delay — that's a LOADING state, use a skeleton ("Inaccurate system-status messages for
  empty states are particularly harmful").
- **Error anatomy** — name WHAT failed + WHAT user can do + recovery (retry) + optional
  support ID; two actions where possible; PRESERVE user work; ban "Something went wrong."
  Network split: offline → retry (auto when back); 5xx → retry + status link; 401 → sign in ·
  NN/g + ui-craft · verified.
- **Optimistic UI** — lightweight high-success actions update immediately, sync in bg,
  revert + inline error on fail (idempotency/refetch detail pending Q14) · confirmed.
- **M3 LoadingIndicator** (Expressive) replaces indeterminate circular for <5s: 38dp
  colorPrimary indicator, 48dp container; showDelay/minHideDelay default 0ms — the
  <200–300ms skip must be SET explicitly. Error #B3261E = 6.54:1 on white (PASS) but
  2.62:1 on dark surfaces (FAIL) — dark theme needs own error tone · GitHub PRIMARY +
  scratch contrast math.
- Full spec: frontend-component-build skill `references/state-design.md`.

### Q14 — Perceived performance · 2026-08-27
- **Nielsen's 3 response-time limits** — 0.1s = instant/direct-manipulation (no feedback
  beyond the result); 1s = flow of thought uninterrupted (delay noticed, control retained);
  10s = attention wall (users reorient/leave; percent-done bars for ops >10s) · NN/g
  response-times-3-important-limits · verbatim primary extraction.
- **Feedback in the next painted frame** — long interactions must present initial visual
  feedback at the earliest paint opportunity (pressed-state, instant open). INP budget
  ≤200ms good / 200–500 needs improvement / >500 poor (p75 field, mobile+desktop split); 90%
  of user time is AFTER load; INP = time to next paint, not completion · web.dev/articles/inp
  · verbatim.
- **Progress indicators** — 3 advantages (reassurance, wait-estimate, something-to-watch);
  for 2–10s ops percent-done is overkill (display inertia), use subtle feedback; percent-done
  only >10s. "3× longer wait" study = NN/g-cited only · NN/g · verbatim + nuance.
- **Optimistic UI scope** — lightweight high-success actions update immediately, sync bg,
  revert + inline error on fail; idempotency keys MANDATORY; TanStack refetch-during-mutation
  overwrites the optimistic value → cancelQueries + snapshot in onMutate, rollback in onError ·
  TanStack guide · verbatim.
- **Labor illusion (Buell & Norton)** — visible narrated REAL effort raises perceived
  quality/WTP even when the wait is longer; boundaries: effort must SUCCEED, transparency
  amplifies dissatisfaction on bad outcomes, 2023 replication mixed → context-dependent; must
  be real (fake/looping progress destroys credibility) · Management Science 2011 · confirmed
  w/ boundaries.
- **Update-frequency paradox** — more/faster updates → LONGER duration estimates (info-volume
  heuristic), yet users still PREFER more feedback → give frequent feedback, don't read
  preference as a shorter-feeling wait · Branaghan Human Factors 2009 (peer-reviewed) ·
  confirmed w/ boundary.
- **Wait psychology (Maister 1985)** — principles kept, numbers REJECTED: unoccupied > occupied,
  uncertain > known, unexplained > explained. The precise figures (36%, 30–40%, 40–60%, 5–8×)
  appear only in blogs, no primary → rejected.

### Q15 — WCAG 2.2 AA one-shot checklist (consolidation) · 2026-08-28
- **The gate already consolidated the verified rules** — Q8 (24px WCAG 2.5.8 floor / 44px field floor), Q16 (one h1 + no skipped levels, landmarks once + aria-current, native `<dialog>` showModal, skip link, clip-path sr-only), Q17 (1.4.1 Level-A non-color-only + Okabe-Ito), Q21 (focus-visible 2px/2px/~10%, fixed z-scale, no arbitrary tracking), Q23 (axe wcag22aa tag enables the disabled-by-default target-size), Q24 (contrast math + visual regression) — all present in `uiux-one-shot-polish` Poland gate. SLOT C's remaining job: make the 2.2 coverage EXPLICIT.
- **The SIX new WCAG 2.2 AA SCs the gate must name** — 2.4.11 Focus Not Obscured (target/control not fully hidden by sticky headers/modals), 2.5.7 Dragging Movements (non-drag alternative — Q27 maps it to map pan), 2.5.8 Target Size (≥24px, axe wcag22aa tag + Mobile 24/44px), 3.2.6 Consistent Help (same help entry point across pages), 3.3.7 Redundant Entry (don't re-enter data the system already has), 3.3.8 Accessible Authentication (Q31 — no cognitive-function test without alternative/password-manager). A "WCAG 2.2 AA" claim that names only 2.5.8 is PARTIAL.
- **Automation is a floor, not certification** — axe/automated tools catch ~30–57% of WCAG violations (foomworks) → ship = gate passes + MANUAL keyboard-nav / screen-reader / focus-appearance (2.4.13 AAA) / reading-order pass. 1.4.1 is Level A but belongs in the checklist (Q17).
- **One-shot build checklist line** (agent-consumable): before "done", run the `uiux-one-shot-polish` Poland gate — it asserts all six 2.2 SCs above + contrast/focus/states/type/spacing/motion/mobile/axe/Lighthouse/contrast-math/visual-regression/anti-slop/LLM-failure.
- **Rejected (Q15)** — (1) "WCAG 2.2 AA = just target-size 2.5.8" → partial; five more SCs above; (2) "axe pass = accessible" → automation ~30–57% ceiling, gate is a floor; (3) deferring Q15 because its VERIFIED row is misfiled → the SLOT B verification (ledger line 649) is the real source; don't skip it (skipped 7×).

### Q18 — Anti-AI-slop (general, all surfaces) · 2026-08-27
- **7 tell-families to refuse by default** — (1) same-size card-row scaffold as page structure
  ("cards are the lazy container; nested cards are always wrong"); (2) hero-metric template
  (big number + small label + stats); (3) kicker/eyebrow chip above the heading; (4) section
  numbers 01/02/03 unless sequence carries info; (5) decoration-as-content (gradient text,
  glass/blur, border-left >1px, hard offset shadows, sparkline/ring stand-ins); (6) costume
  type (mono-as-technical, system display face, emoji-as-icons, geometric photo masks);
  (7) category-habit light/dark (pick by use scene: who/where/ambient light) · impeccable
  (pbakaus, Apache-2.0) craft-floor.md · primary re-extraction at HEAD + mechanical detector
  test (slop page → 10 findings, clean 68ch editorial page → 0).
- **Kicker/eyebrow = DEFAULT-BAN, not absolute** — impeccable says "no brief earns it back",
  but 2 sources document legit uses (broad/emotive headings, audience segmentation, editorial
  layouts). If used: `<p>`/`<span>`, NEVER a heading element (breaks document outline) ·
  contested rule distilled as default + a11y addendum.
- **Bans are defaults, not laws** — craft-floor itself: "the brief's own words can earn any
  of them." Popularity (stars/installs) is not evidence; rules = expert taste codified ·
  impeccable · verified.
- **Craft floor (verify on the BUILT result)** — contrast 4.5/3 + secondary text tinted from
  surface hue (never plain gray); shadows need offset+blur; tight groups, generous separation,
  more space ABOVE headings than below; body 65–75ch, display ≤6rem, tracking floor −0.04em,
  balanced headings; ONE authored motion moment (exponential ease-out from already-visible),
  not identical entrances everywhere; all states (hover/disabled/loading/error/empty) with
  real content + keyboard focus · impeccable craft-floor.md · verbatim.
- **Surface modes: Persuade / Operate / Read / Experience** — chosen by the SURFACE not the
  product ("the brief wins"): marketing = Persuade, DM cockpit/OF = Operate, long-form = Read,
  immersive = Experience. Name the mode in the build prompt · impeccable SKILL.src.md · verbatim.
- **Cheapest authenticity signal = browser-surface theming** — "the one models skip most
  reliably"; do it in pass 1 on any static build · impeccable · verbatim.
- **Bounded verification** — build fully → ONE batched inspection round (desktop + mobile) →
  fix in one batch → at most one confirm round → stop · impeccable · verbatim.
- **Mechanical gate** — impeccable's own detector: `node cli/engine/detect-antipatterns.mjs`
  (clone pbakaus/impeccable; `npm i htmlparser2 css-select css-tree domutils` — regex-only
  degraded mode undercounts). Machine rules: kicker-above-heading, hero-eyebrow-chip,
  nested-cards, gradient-text, ai-color-palette, gray-on-color, low-contrast, skipped-heading,
  marketing-buzzword, numbered-section-labels (advisory) · fleet scratch test confirmed.
- **Overused fonts (extended)** — classic: Inter/Roboto/Open Sans/Lato/Montserrat/Arial/
  Helvetica; NEW wave: Fraunces/Instrument Sans+Serif/Geist*/Mona Sans/Plus Jakarta Sans/
  Space Grotesk/Recoleta. Source + self-host a face matching the brand lettering · impeccable
  antipatterns registry · verbatim.
- Full catalogue: `uiux-one-shot-polish` skill → `references/anti-slop-tells.md`.

### Q20 — Build-prompt structure for pass-1 polish · 2026-08-28
Verified 6/6 (Design2Code PRIMARY full-text, NAACL 2025, arXiv 2403.03163v3 Tables 1+3 +
WebGen-Bench ×2 + WebGen-V + vibeprompts.dev live; record scratch/q20_verify.md).
1. **Text-augmented prompting** — pass the page's extracted LITERAL copy alongside any visual
   reference (offloads OCR → model focuses on layout). Gains model-dependent: huge on
   weak/mid (DeepSeek-VL 39.7→66.1, LLaVA 50.4→68.4), FLAT on GPT-4o (93.0→92.4) → always
   pass extracted text: cheap, never hurts, biggest win mid/weak models.
2. **Self-revision is WEAK** — "few can self-revise their generation": minor gains GPT-4V/
   Claude-3-Opus, none Gemini 1.0, catastrophic on weak models (Idefics2 46.7→12.3).
   Boundary (Design2Code-HARD): frontier models CAN revise complex pages (GPT-4o improves;
   Gemini 1.5 Pro doesn't) → don't bank on a critique pass to fix layout on mid/weak models;
   get pass 1 right via INPUTS.
3. **Layout = the failure axis** — models lag most in recalling visual elements + generating
   correct layout → front-load layout constraints (grid, max-width, section order, spacing
   scale) BEFORE content. Total tag count = difficulty indicator → long pages degrade;
   generate long pages SECTION-WISE (pairs w/ Q22 iterate-the-system).
4. **Underspecified prompts drift** — best agent stack passes only 27.8% of FUNCTIONAL test
   cases on from-scratch sites (WebGen-Bench, 101 instructions / 647 test cases; 27.8% =
   functional pass via WebVoyager agent, NOT a design-drift score) → specify appearance
   requirements explicitly (layout harmony, modern design are scored criteria).
5. **Per-section prompt recipe** (vibeprompts pattern, 256 prompts / 15 categories, live):
   ~3–5 sentences naming component INVENTORY + treatment of the FEATURED element + RESPONSIVE
   rule (stack mobile → 3-col lg) + one concrete visual anchor — layout TARGETS, not vibes.
6. **Render-check** — after building, screenshot per section and compare to the reference
   (WebGen-V: section-wise eval + per-section screenshots + feed-back loop).
[needs-evidence]: screenshot-vs-text-only reference on 2026-era models (paper has no
text-only arm). Rejected: magic-prompt-template (inputs > phrasing); self-revision hype.

### Q21 — LLM-UI failure modes · 2026-08-27
- **Models emit DEFAULT state only** — prompt + gate must require hover/focus-visible/active/
  disabled per interactive element: `:focus-visible` 2px outline + 2px offset (never bare
  `:focus`, never remove outlines), hover delta ~10% lightness (5% imperceptible), disabled =
  reduced opacity + cursor handling, `aria-label` on icon-only buttons, errors next to the
  action · baseline-ui (ibelick/ui-skills, MIT) · primary verbatim, no counterexample.
- **Fixed z-index layer scale, ban arbitrary z-*** — define once (base 0 / dropdown 10 /
  sticky 20 / overlay 30 / modal 40 / toast 50); per-prompt `z-[9999]` = modals behind navs,
  clipped tooltips · baseline-ui · verbatim.
- **NEVER modify letter-spacing unless requested** — LLMs over-apply negative tracking;
  +0.05–0.1em ONLY for ALL CAPS; `text-underline-offset: 3–4px` on links · baseline-ui
  verbatim + convention.
- **Nested border-radius = outer − (border-width + padding)** — NOT padding alone; clamp
  `max(0px, calc(...))` (negative radius silently invalidates); radii > half shortest side
  rescale at used-value time while DevTools shows the specified value (silent drift); pills
  exempt. Rest of optical-alignment catalogue (1–2px low text, cap-height icons, light-source)
  = craft convention, flagged not law · 5-source convergence incl. geometric derivation ·
  confirmed w/ 3 corrections.
- **Scrollbar = dual API** — `scrollbar-color` (Chrome/Edge 121+, Firefox 64+, Safari/iOS
  only 26.2+, Android Browser ❌) + `::-webkit-scrollbar` fallback for older iOS (Ghostway
  iPhone); thumb ≥3:1 (1.4.11), `scrollbar-gutter: stable`, 8–10px min · caniuse primary.
- **Convergence + bonus** — tokens-up-front (w/ Q20), batch-don't-iterate fixes (w/ Q18
  bounded verification); models-skip list (focus rings/reduced-motion/44px/disabled) =
  single-source [needs-evidence]; baseline-ui bonus defaults: h-dvh not h-screen,
  text-balance/text-pretty, tabular-nums.
- Full record: `web-platform-quirks` skill → "LLM-generated UI failure modes" section.

### Q22 — Reference-driven generation: the DESIGN.md method · 2026-08-28
- **Give the agent the design system BEFORE it writes any UI** — author a `DESIGN.md` per
  project (YAML token front-matter + prose rationale, fixed 8-section order: Overview→Colors→
  Typography→Layout→Elevation & Depth→Shapes→Components→Do's and Don'ts). Second lineage:
  Google Stitch format (9 sections, adds Responsive Behavior + Agent Prompt Guide), used by
  VoltAgent's awesome-design-md; Labs linter preserves unknown sections so Stitch files
  soft-pass · google-labs-code/design.md (Apache-2.0, 27.5k stars) · primary re-extraction
  at HEAD + mechanical lint/export test (planted broken-ref → error; 2.29:1 contrast →
  warning; export → valid Tailwind v4 @theme).
- **Prompt recipe: DESIGN.md + reference screenshot + LITERAL copy** — never image or
  adjectives alone (pairs w/ Q20 text-augmented prompting); iterate the SYSTEM, not the
  screens · 3-source workflow convergence (aiskill.market / zenn.dev / ainanza) · verified.
- **Tokens named by INTENT with "when to use" prose beat raw values** — rationale carries
  judgment hexes can't; agent picks the right token by reading the name ("Tokens That Talk") ·
  mejba + ainanza convergence · verified.
- **Raw material: awesome-design-md (MIT, 74 brand files) + designsystems.one (89 systems)** —
  files are "as is" approximations (Stripe file self-named "Stripi-Inspired"); verify key
  hexes vs live site (one grep) before trusting. Spot-check passed: Stripe #533afd found
  verbatim in live stripe.com HTML · GitHub API + live-site grep · verified w/ boundary.
- **CLI = ADVISORY only, never a hard CI gate** — `npx @google/design.md lint` (11 rules;
  broken refs = errors/exit 1, contrast = warnings → parse --format json); `export` →
  Tailwind v4 @theme / Tailwind v3 JSON / DTCG; `diff` = token regression (exit 1); `spec` =
  agent-prompt injection. Alpha (README verbatim: "spec, token schema, and CLI are under
  active development") · npm v0.4.0 mechanical test · verified.
- Full spec: `design-standards` skill → references/design-tokens-template.md § DESIGN.md.

### Q23 — Reusable a11y/perf gate (axe-core + Lighthouse) · 2026-08-28
Verified 7/7 (primary extraction + mechanical tags-test on axe-core 4.13.0 + 5-source
convergence). Full recipe: web-page-production-polish → references/a11y-perf-gate.md.
1. One-command a11y floor: `npx @axe-core/cli <url> --exit --tags wcag2a,wcag2aa,wcag21a,
   wcag21aa,wcag22aa` → exit 1 on any violation (CI-gateable). Flags: --save/--stdout
   (JSON→jq), --include/--exclude scoping, --timeout=120, --load-delay=2000 (JS-heavy).
2. CRITICAL gotcha (mechanically verified): target-size (WCAG 2.5.8) is DISABLED BY DEFAULT
   in axe-core; passing the wcag22aa tag enables it (default run → absent, tag run →
   present; no --rules needed). A gate claiming WCAG 2.2 without that tag never tests 2.5.8.
3. Coverage ceiling: automated tools catch only ~30–40% of WCAG violations (Deque: 16/50 AA
   criteria) → gate = FLOOR, not certification. Manual remainder: keyboard nav, focus
   visibility, screen reader, reading order, 3.3.8 accessible auth.
4. CLI scans default DOM only — modals/menus/accordions, viewport-specific issues, and real
   mobile touch sizes need the @axe-core/playwright AxeBuilder tier (DM cockpit w/
   expandable rows); CLI = static-page tier (Astro/DM site).
5. Setup gotcha: chromedriver must be on PATH (browser-driver-manager); local node_modules
   axe-core overrides the global CLI version; axe CLI is not a crawler.
6. Perf: Lighthouse CLI, `--form-factor=mobile` is the DEFAULT (matches Ghostway iPhone);
   single runs noisy → median of ≥3 (computeMedianRun, Lighthouse variability.md primary).
7. Stack mapping: static Astro/DM = CLI tier; DM cockpit + Ghostway = --load-delay +
   Playwright tier; Open Finance Android = axe is web-only → native/manual checks.
Rejected: Lighthouse-100 = accessible (different axes); pa11y (redundant 3rd engine).

### Q24 — Contrast-checker + visual-QA scripts · 2026-08-28
Verified 5/5 (primary extraction ×4 + mechanical scratch test scratch/q24/). Full recipe:
web-page-production-polish → references/a11y-perf-gate.md (Contrast math + Visual regression §§).
1. WCAG 2.2 contrast floor (w3.org verbatim): 4.5:1 text; 3:1 large text (large = 18pt /
   14pt bold ≈ 24px / 18.5px); 3:1 non-text UI + meaningful graphics (1.4.11); sRGB assumed;
   thresholds NOT rounded — 4.499:1 FAILS. Rationale: 20/40 acuity ≈ age-80 vision. Exempt:
   logotypes, incidental/inactive/decorative text. Thin fonts render fainter → aim above
   nominal for outdoor field use (Ghostway).
2. Reusable checker packaged: scratch/contrast.py (verified kernel — #767676/#fff 4.542
   PASS, #777777/#fff 4.478 FAIL, #B3261E/#fff 6.54 PASS).
3. APCA (apca-w3 beta) = DESIGN-PHASE only — own README: standards "still developmental";
   never replaces the 2.x gate. fontLookupAPCA(Lc) → min px per weight; reverseAPCA() finds
   a compliant color.
4. Visual regression: Playwright toHaveScreenshot = pixelmatch engine (threshold 0.1);
   determinism = stylePath (hide volatile iframes/anims) + maxDiffPixels + PER-BROWSER +
   PER-OS goldens; rendering varies by host OS/version/fonts/battery/headless → generate
   and run baselines on the same host.
5. pixelmatch gotcha (mechanically proven): npm 7.2.0 does NOT ship windowSize (silently
   ignored) — GitHub main only → install from git or vendor the windowed-density fail
   (windowMax/N² > tau): 399 scattered px → 0.035 PASS vs 400 clustered px → 1.0 FAIL.
6. Stack mapping: contrast gate → ALL projects; snapshot harness → web tier (Astro/DM site,
   DM cockpit); Open Finance Android = native screenshots → manual/native tier.
Rejected: APCA-replaces-WCAG2 (draft only); single-diff without stylePath/OS-segregation
(false-positive noise); "4.5 covers everything" (ignores 1.4.11 + 1.4.1).

### Q25 — Audit method: project vs accepted strategies → retrofit list · 2026-08-28
Verified 7/7 (NN/g primary ×3 verbatim + IEEE VL/HCC 2025 arXiv 2512.04262 + binomial
scratch math). Full method: web-page-production-polish → references/heuristic-audit-method.md.
1. Scaffold = Nielsen's 10 heuristics (unchanged since 1994; Molich 1990, Nielsen 1994
   factor-analysis of 249 problems), with the fleet's OWN accepted strategies (Q3–Q24) as
   the concrete per-heuristic checklist.
2. Method: scope NARROW (one task/section/user-group/device per pass); TWO passes
   (learn-the-flow without judging, then flag); 1–2h timebox; one issue per line +
   heuristic ref + screenshot + fix.
3. Severity 0–4 = frequency × impact × persistence (+ market impact). Ship gate: several
   4s = don't ship; all cosmetic = ship OK. Retrofit list sorted 4s+3s first.
4. Independence: evaluators must NOT see each other's findings until done. Agent-fleet
   adaptation = N≥3 independent LLM passes (fresh sessions, no shared context) → UNION of
   findings + MEAN of severity.
5. LLM-audit reliability (VL/HCC 2025, 30 OSS sites, 850+ evals, GPT-4o ×3): detection
   reliable (84% exact, κ 0.50); severity NOT (56% exact, α≈0, "requires human oversight")
   → trust LLM findings, treat LLM severity as a proposal needing Keaton sign-off.
6. Coverage: 3–5 evaluators find ~65–85% of problems — discovery-rate dependent (binomial
   n=3: 49–78% at p=0.2–0.4), NOT a guarantee. Boundary: same-model ×3 + web-only tested;
   cross-model and mobile/PWA transfer [needs-evidence].
7. Violation ≠ bug (NN/g hamburger example; "don't bet your design is one of the few
   exceptions"); heuristics = guidelines not laws; evaluation CANNOT replace user research
   — Keaton's field tests are the user check (Ghostway iPhone). Output = retrofit table;
   queue project retrofits to the ledger's Needs Keaton.
Rejected: eval-replaces-user-testing (NN/g verbatim against); 75–90%-per-single-pass
(the stat is 3–5-evaluator, discovery-rate dependent); saashero churn stat (unextracted).

### Q26 — Meta-audit: drift check on DONE angles · 2026-08-28
Verified 4/4 (PRIMARY re-extraction ×3: w3.org WD-wcag-3.0-20260303, web.dev/articles/inp,
web.dev/articles/lcp + material-components-android GitHub PRIMARY + Pew via canonical URL).
1. WCAG 3.0 still a Working Draft (9th WD, 2026-03-03; W3C verbatim: "WCAG 3 does not
   replace WCAG 2… will still be required by different countries for a long time") → the
   fleet's WCAG-2.2 gate + APCA-design-phase-only stance (Q3/Q24) stands, no drift.
   Correction: "not expected to be completed for a few more years" is a blog paraphrase,
   NOT in the WD text.
2. Core Web Vitals thresholds UNCHANGED — web.dev PRIMARY decides: INP ≤200/200–500/>500
   p75 verbatim (no 150ms anywhere), LCP ≤2.5s p75 verbatim (no 2.0s). "Mar-2026 update
   tightened INP 150ms / LCP 2.0s" = SEO hype churn; Q14/Q23 numbers stand.
3. Link rot is real (Pew: 38% of 2013 pages gone by Oct 2023, 8% of 2023 pages dead within
   months; Pew's own original URL now 404s → canonical URL + Wayback snapshot recorded) →
   ledger source-hygiene rule: citations carry extraction date + canonical URL.
4. M3 drift: material-components-android (Views) in MAINTENANCE MODE — GitHub PRIMARY
   verbatim "no more planned feature releases for Views… migrate to Compose"; official
   Figma kit Compose-first → OF's View-based M3 refs are maintenance-track (still correct
   as reference targets; re-verify before new native work). Caveat landed in
   open-finance-build references/m3-android-component-specs.md. "4× faster" vendor stat
   = cargo-cult.

### Q16 — Semantic-HTML defaults · 2026-08-28
Verified 6/6 + 1 correction (gap-check vs this playbook + PRIMARY 2nd-source extraction +
mechanical heading-order test scratch/q16: h1→h3 skip = FAIL exit 1, good = PASS exit 0).
The playbook said only "semantic HTML" with zero concrete rules — now filled.
1. Heading order: exactly ONE h1 per page; no skipped levels (h2→h4 fails axe heading-order,
   WCAG 2.4.6). Size comes from CSS, not heading level.
2. Landmarks: header/nav/main/footer each ONCE per page; aria-current="page" on the active
   nav link (WAI-ARIA best practice).
3. Native <dialog> + showModal() = Baseline 2022 (Chrome/FF 98, Safari 15.4, >95% global):
   focus trap + Esc + top-layer + ::backdrop + implicit aria-modal + inert bg + focus-return
   for free. CORRECTION/BOUNDARY: do NOT add a JS focus trap on top of native (2026 sources
   flag it as the most-repeated outdated modal advice); show() ≠ showModal() (show = non-modal,
   no backdrop/trap).
4. sr-only/visually-hidden CORRECTION: clip:rect() is deprecated → modern recipe =
   clip-path:inset(50%) (1px box + overflow:hidden + legacy clip:rect fallback only if needed).
5. Skip link (WCAG 2.4.1 bypass blocks) as the first focusable element.
6. Element choice: <button> not div/onClick; <a href> not div for nav; <label for> every
   input; <fieldset>/<legend> groups; <th scope> tables (MDN/HTML spec).
Cargo-cult: div-soup, heading-as-styling (skipping levels for size), aria-label-spam instead
of real semantics. OF Android = M3/Compose semantic widgets (native semantics).
Landed: frontend-component-build references/accessibility-patterns.md (§ Semantic HTML
defaults + native <dialog> modal + clip-path sr-only) + uiux-one-shot-polish Polish gate.

### Q9 — Dashboard / admin layout · 2026-08-28
Verified 8/8, 1 correction + 1 flag cleared (gap-check vs dashboard-uiux-audit.md +
rauno/interfaces PRIMARY bolt extraction + 2nd-source outline-radius convergence).
1. Numbers: `font-variant-numeric: tabular-nums` on tables, timers, polling "Ns ago" stamps,
   score columns — prevents digit-width jitter on live-updating dashboards. Works in
   system-ui + most modern faces; some OSS display fonts lack tnum → system stack for data
   columns. Right-align numeric/currency columns. Font-weight must NOT change on
   hover/selected (layout shift).
2. Feedback relative to its trigger (rauno): inline checkmark on the copy button, not a
   toast; highlight the specific errored input. (The polling status stamp in the audit doc
   is one instance of this general rule.)
3. Submit & list hygiene: disable buttons after submission (duplicate-submit guard);
   interactive list items have no dead gaps — grow padding, not margin (Q8 touch targets);
   dropdowns open on `mousedown` not `click` (snappier menus).
4. Focus rings CORRECTION: outline-FIRST (`:focus-visible` 2px outline + 2px offset, Q21).
   Outline follows border-radius since Safari/iOS 16.4 (Mar 2023, Apple release notes +
   3 dev blogs) → rauno's box-shadow-not-outline rule is STALE for modern targets;
   box-shadow fallback only for Safari <16.4 (Ghostway iPhone iOS 16+ = fine).
5. Touch/hover hygiene (field-use dashboards): hover styles behind `@media (hover:hover)`
   (touch press must not flash hover); inputs ≥16px font-size stops iOS focus-zoom (Q8);
   no autofocus on touch devices.
6. Motion boundary: feedback ≤200ms for immediate-feel; SKIP animation on frequent/
   low-novelty updates (poll ticks, live counters); pause off-screen loops (Q14/Q18).
7. A11y: no tooltip on disabled controls; ↑↓ + ⌘⌫ list navigation; icon-only controls get
   aria-label (Q5/Q21).
Cargo-cult rejected: rauno's blanket disable-spellcheck (overbroad for data-entry fields).
Landed: web-page-production-polish references/dashboard-uiux-audit.md (§ General dashboard
rules) + uiux-one-shot-polish (1 strategy entry).

### Q13 — Form UX · 2026-08-28
Verified 7/7, existing content HOLDS + 5 real gaps filled + 2 [needs-evidence] cleared
(gap-check vs frontend-component-build accessibility-patterns.md + 5-source convergence:
GOV.UK, NN/g, open-design state-machine, React Hook Form onBlur/reValidateMode,
mariusschulz/SO webkit-autofill).
1. Validation timing: validate on BLUR (not first keystroke, not submit-only); once a
   field is errored, re-validate on every input event so the error clears live.
   Submit-time-only = canonical mistake; keystroke-1 validation rejected (4/5 sources).
2. Error placement: error directly below the input (after help text); error border on
   input AND text (color never sole signal — Q17); role="alert" on the MESSAGE only (not
   the input — SR announces without stealing focus); aria-describedby carries help +
   error ids (help first).
3. Label placement: label ABOVE the input + required/optional marker; never
   placeholder-as-label (already covered, now stated).
4. Autofill: semantic autocomplete tokens (email/given-name/family-name/street-address/
   postal-code/cc-number/cc-csc/cc-exp) for password managers + mobile keyboards;
   autocomplete="off" only for search/combobox. Style :-webkit-autofill (Blink/WebKit
   yellow/blue fill + 1px-inner-border bug): box-shadow 0 0 0 1000px <surface> inset +
   -webkit-text-fill-color + transition-delay:9999s. CORRECTION: the "@keyframes
   animationName hack" is a mislabel of this fix. Firefox honors background-color — no
   hack needed. Real one-shot gap for dark dashboards (DM cockpit, OF web tier).
5. Progressive disclosure: <fieldset>/<legend> groups; conditional fields revealed
   inline (no hide-then-surprise); <details>/<summary> for advanced/optional blocks.
6. Submit-time error-summary box at the top of long forms (role="alert", focus moved
   to it) — every error at once, not one per re-submit.
OF Android = M3/Compose TextField (own validation semantics) — web tier only.
Landed: frontend-component-build accessibility-patterns.md (§ Form UX rules) +
design-standards tailwind-patterns.md (§ Form inputs notes) + preship-checklist.md
(Forms §) + uiux-one-shot-polish (pre-gen spec + gate + 1 strategy entry).

### Q27 — Map UI polish for MapLibre PWA field use · 2026-08-28
Verified 7/7, 1 correction + 1 [needs-evidence] cleared NEGATIVE + 1 carried
(w3.org WCAG22 Understanding 2.5.1 PRIMARY + maplibre.org MapOptions PRIMARY +
maplibre-gl-js source cooperative_gestures.ts + mechanical measurement of shipped CSS).
1. WCAG 2.5.1 (Level A): ALL multipoint (pinch/spread zoom, two-finger rotate) +
   path-based (swipe/flick) gestures MUST have a single-pointer alternative unless
   essential — W3C's own canonical example is a map with +/− zoom buttons.
   Keyboard-only does NOT satisfy (the SC requires single-POINTER operation). Dragging
   (pan) is excluded from 2.5.1 but WCAG 2.2 SC 2.5.7 covers it → pan needs a non-drag
   alternative (step buttons / tap-to-center). Techniques G215/G216, failure F105.
2. cooperativeGestures: desktop Cmd/Ctrl+drag, mobile two-finger pan, informational
   screen on normal gestures, drag-to-pitch three-finger, auto-disabled in fullscreen,
   default false. CORRECTION: source type `GestureOptions = boolean` — NO options
   object, NO message-customization API (docs phrasing ahead of the type; messages =
   localized bundle strings). DECISION RULE: full-screen dedicated map (Ghostway) →
   OFF (two-finger only solves scroll-trap, which doesn't exist when the map IS the
   page); map embedded in a scrolling page (DM site) → ON.
3. Built-in controls = the 2.5.1 compliance kit: NavigationControl (+/− zoom, compass
   one-tap reset), GeolocateControl, ScaleControl, AttributionControl (default
   compact:true). MapLibre logo NOT required — but OSM tile attribution remains a
   LICENSE requirement.
4. Control sizing (mechanically measured): shipped buttons = 29×29px — passes the 24px
   conformance floor (Q8) but BELOW the 44px field-use floor → CSS override / custom
   IControl ≥44×44 + 8px spacing for field PWAs; compact attribution ~20px tall.
   Controls float over canvas → elementFromPoint hit-test each one.
5. Safe-area placement (mechanically measured): shipped corner margins = 10px all
   corners → top controls under the notch, bottom-right attribution in the home-
   indicator zone on iPhone standalone PWA → env(safe-area-inset-*) on CONTROL
   CONTAINERS (canvas bleeds to edges; controls must not).
6. Attribution: never display:none (OSM license), compact on mobile, 4.5:1 over
   imagery worst-case (light text on snow/sand); shipped compact = white bg/black text.
7. Outdoor/field legibility [needs-evidence — convention, no primary study]: solid
   surface + ≥4.5:1 for overlays/popups, no translucent glass over variable terrain
   (Q3/Q24/Q18 convergence); sunlight high-contrast style variant = candidate, unproven.
Bonus: MapLibre's cooperative-gestures overlay ships aria-hidden + z-index:99999 —
note when applying the Q21 fixed-z-scale rule around MapLibre containers.
Cargo-cult rejected: dark-basemap-by-default (category habit, Q18), decorative 3D
terrain, compass-spin animations.
Landed: uiux-one-shot-polish (pre-gen spec + gate + 1 strategy entry) +
web-ui-clickability-testing (SKILL.md § + references/map-ui-maplibre-pwa.md).
Ghostway retrofit LANDED 2026-09-25/26 (commits d564a73 + 40e0127): 44px map controls + safe-area control containers shipped + verified (safearea-check, zoom-check); cooperativeGestures stays OFF per the decision rule above; sunlight variant shipped as the Q143 `prefers-contrast: more` field mode (both themes ≥7:1). Closed — remaining field check is Keaton's iPhone drive.

### Q28 — Chart & data-viz UX for dashboards · 2026-08-28
Verified 9/9, 2 boundaries refined + 1 conflict recorded (Cleveland & McGill 1985 graphical-perception via Wikipedia + NN/g dashboards-preattentive/clutter-charts + smoothui dataviz + Tufte data-ink + mechanical scratch/q28_verify.js).
1. Chart chosen by the QUESTION: comparison → bar, trend → line, part-whole → stacked bar NOT pie (pie valid only ≤2–3 slices), distribution → histogram, correlation → scatter, ranking → horizontal bar (sorted). Don't default to one chart for every dataset.
2. Encoding-accuracy hierarchy: length + 2D position are most accurate for quantitative comparison; area/angle (pie/gauge/radar) far less accurate → reserve for genuinely part-whole/ratio. CONFLICT + boundary: SLOT A 'color = categorical only' overstates — ordered/luminance ramps DO encode magnitude (heatmaps) → rule = never encode MAGNITUDE with HUE/unordered color.
3. Bars MUST start at zero baseline (truncation proven to inflate: 5.88× real ratio renders as ~20× on truncated axis). Line charts MAY start elsewhere (position = change; label axis).
4. Direct labels, not legends: label in place; legends force decode look-away + hurt a11y (converges Q17). More accessible by default.
5. Chart a11y floor: non-text 3:1 (WCAG 1.4.11) + text 4.5:1 (1.4.3) + text-alt or data-table fallback; never identify a series by hue alone (pattern/shape/direct label).
6. Data-ink/chartjunk (Tufte): kill gridlines/borders/3D/decoration; grey-first + single accent.
7. Dual-axis near-ban: legit only for same-unit related metrics OR different-unit/indexed series; else two charts.
8. When NOT to chart: 1–3 points or exact values needed → table/big-number.
9. Concrete defaults: bar-gap 40–50%, ≤5–7 series lines, 1.5:1 plot ratio, sort-by-value, horizontal bars for long labels.
Cargo-cult rejected: pie-as-default, rainbow palettes, 3D bars, dual-axis-as-normal.
Landed: uiux-one-shot-polish (pre-gen spec + gate + 1 strategy entry) +
web-page-production-polish (dashboard-uiux-audit.md § Chart & data-viz).

### Q29 — Data tables UI in dashboards · 2026-08-28
Verified 10/10, 1 correction + 1 conflict recorded + 1 boundary (NN/g data-tables
PRIMARY verbatim + ACM WWW'23 10.1145/3543507.3583506 fullHtml, 14k+ trials / 590 ppl
+ Carbon PRIMARY + mechanical Q8 cross-math, scratch/q29_verify.md).
1. Tables win over cards only when COMPARISON across shared attributes matters. 4 core
   tasks: find records by criteria, compare data, view/edit/add a single row, act on
   records.
2. First column = human-readable record identifier (never auto-generated "mystery meat"
   IDs); column order = importance, related columns ADJACENT.
3. Freeze header row AND identity column on any table taller/wider than one screen.
   Frozen HEADERS = peer-reviewed (ACM: smaller cell padding + frozen headers → faster
   completion). BOUNDARY: ACM tested headers only — frozen identity COLUMN = NN/g
   convention, not peer-reviewed.
4. Density tiers are real options, not law: Carbon v11 ships FIVE row sizes xs 24 /
   sm 32 / md 40 / lg 48 / xl 64px (CORRECTION of "32/40–48/56 3 tiers" — 56px exists
   nowhere in Carbon). ACM gives DIRECTION (smaller padding faster on mobile), not
   canonical px. Mechanical vs Q8: xs 24px = exactly the 2.5.8 conformance floor;
   sm/md BELOW the 44px field floor → touch-first tables need lg 48+ rows or separate
   ≥44px action targets; compact tiers = desktop/analyst.
5. Zebra vs borders — CONFLICT RECORDED: NN/g endorses as tracking aids vs ACM: NO
   objective speedup, subjective preference only → preference/tracking aid, pick ONE,
   never claim performance.
6. Alignment: text LEFT, numbers/currency/percent RIGHT (converges Q9 tabular-nums);
   dates pick one side, consistent.
7. Single-record actions: inline only if 1–2; more → menu, but hover-hidden = discovery
   + a11y failure → always-visible or keyboard-reachable kebab. Batch = checkbox +
   Select All (+ "all N matching, not just this page" Gmail-style).
8. Editing: modals COVER adjacent rows users routinely reference (recognition-not-
   recall) → non-modal side panel or inline edit; mark edit-mode row visually distinct.
9. Mobile: priority columns / h-scroll + frozen identity / reflow to cards; never shrink
   text below readable.
10. States (converges Q11): no-data vs no-results are DIFFERENT states; skeleton rows
    match layout; keep chrome + retry.
Cargo-cult rejected: zebra-as-performance, px-tiers-as-law, hover-hidden-actions-default.
Landed: uiux-one-shot-polish (pre-gen spec + gate + 1 strategy entry) +
web-page-production-polish (dashboard-uiux-audit.md § Data tables).

### Q31 — Authentication / login-form UX · 2026-08-28
Verified 7/7, 1 CORRECTION + 1 CONFLICT (w3.org 3.3.8 FULL + pages.nist.gov 800-63-4 FULL + NN/g login checklist + mechanical axe test on paste-blocking login).
1. **WCAG 2.2 3.3.8 Accessible Authentication (AA):** no cognitive-function test beyond the user's OWNED password — don't require solving/transcribing/remembering; 4 allowed exceptions (alternative mechanism / object recognition / personal content / cognitive test needing neither memory nor transcription). All MFA steps AND recovery paths must also be accessible. Login-form recipe (1.3.5 identification + 4.1.2 labels/instructions) required.
2. **Never block paste/autofill** on cred/OTP fields — verbatim FAIL of 3.3.8; partial-password (enter 1st/3rd/5th char) also FAILS; OTP split-boxes MUST accept full paste.
3. **NIST 800-63B rev-4 (2025): length NOT composition** — 15-char SHALL single-factor, 8-char M3-only; max ≥64 SHOULD; SHALL NOT require mixed-case/number/symbol, no forced rotation, no KBA, no hints; SHALL allow managers/autofill, SHOULD permit paste + show-password. Boundary: internal low-risk tools (DM cockpit, OF) may defend 8-char behind MFA; passphrases make 15 humane.
4. **Show-password CONFIRMED good**; strength-meter evidence MIXED (Egelman 2013 vs Renaud&Zimmermann 2019 inconclusive) → never sole gate, pair w/ breach blocklist, drop fear-appeal.
5. **Mobile auth pain** (NN/g double-typing) → autofill + show-password + paste-first + generous targets (Q8/Q23).
Rejected: composition-required, forced rotation, KBA, no-paste, blocking-autofill, per-char OTP boxes, red-only error.
Direct users: DM cockpit login + Open Finance web auth + any future gated surface; OF Android/Compose = M3 auth semantics.

### Q30 — Offline-first UX for field PWAs · 2026-08-28
Verified 8/8, 2 CORRECTIONS + 1 CONFLICT + 1 boundary (webkit.org/blog ITP + web.dev
storage-for-the-web + chrome workbox-background-sync PRIMARY + caniuse background-sync).
1. offline-FIRST vs offline-TOLERANT is a concept-phase decision (~2× build effort for true
   offline-first; justify for field-worker/offline-critical classes — Ghostway iPhone; marketing
   sites = shell-cache only; OF native N/A).
2. Cache-strategy mapping: app-shell cache-first / HTML network-first w/ cache fallback /
   assets+JSON stale-while-revalidate (Workbox); version cache names.
3. Offline STATE must be signaled: offline-pin/cloud-off icon + TEXT (NOT color-only, Q17);
   download-for-offline UI = file-size + progress + cancel + delete.
4. Sync-queue UX: reconnect notice + visible queued-action markers + dismissible banner +
   pending-sync count (converges Q11). Silent sync = #1 risk.
5. iOS Safari HARD constraint: NO Background Sync / Periodic Sync / Background Fetch in ANY
   Safari (incl 26.5) or Firefox → sync-on-OPEN mandatory (Ghostway replays on launch).
6. 7-day ITP cap EXEMPTS installed home-screen PWAs (webkit.org/10218 verbatim) — SLOT A's
   "7-day wipes installed-PWA cache" is WRONG; cap only bites Safari-TAB usage; ~50MB cap is
   legacy (Safari ~1GB + separate PWA container). CONFLICT: history-clear wiping PWA container
   = unverified (primary says container is separate).
7. Workbox BackgroundSyncPlugin: fetchDidFail retries ONLY network-exceptions (4xx/5xx NOT
   retried; DevTools offline-checkbox = LIE, verbatim).
8. Conflict resolution: single-user-device → LWW (version vectors overkill).
Cargo-cult rejected: appypie "25%/89%vs53%" marketing stats, offline-everywhere dogma,
sync-without-feedback.
Landed: uiux-one-shot-polish (pre-gen spec + gate + 1 strategy entry) +
web-ui-clickability-testing (SKILL.md § Offline-first + references/offline-first-pwa.md).

### Q17 — Color-blind-safe palettes + non-color-only signaling · 2026-08-28
Verified 4/4 + [needs-evidence] CLEARED (4-source Okabe-Ito convergence: Nature
Methods/Wong 2011, R 4.0 default, Wilke Fundamentals + prevalence ×5 + MECHANICAL
Machado-2009 CVD simulation, scratch/q17_verify.py).
1. Prevalence: ~8% of men of Northern-European descent (global pooled male red-green
   ≈4.5%, women ≈0.5%); red-green = ~90%+ of all CVD, tritanopia ~0.003%. NEVER encode
   meaning by red-vs-green alone.
2. Canonical safe categorical set = Okabe-Ito 8-color: orange #E69F00, sky blue #56B4E9,
   bluish green #009E73, yellow #F0E442, blue #0072B2, vermilion #D55E00, reddish purple
   #CC79A7, black #000000. Mechanical proof: pairwise-distinguishable under ALL 3
   deficiency types at 100% severity — min pairwise CIELab ΔE 8.57–10.54 ≫ JND ~2.3
   (normal vision min 26.43). Boundary: palette de-risks the dominant red-green case;
   sequential/luminance ramps may still encode magnitude — the ban is HUE-only encoding.
3. WCAG 1.4.1 (Level A) non-color-only signaling — STRONGER than the AA-only floor claim:
   error/validation = icon + text (not red border alone); required = asterisk OR
   "(required)"; focus = visible ring; chart series = pattern/shape/direct label (Q28);
   links = underline. Pair semantic role tokens with redundant encoding (error = token +
   ✕/⚠ icon + text). Red error text on pink fails BOTH contrast AND color-only.
4. 1.4.1 added to the design floor (was AA-only).
Cargo-cult rejected: red=error/green=good as sole signal; label-less color-coded
dashboards (DM cockpit/OF status); hue-only charts.
Landed: uiux-one-shot-polish (pre-gen spec + gate + 1 strategy entry) + brand-identity
(contrast-and-accessibility.md § Color blindness + checklist).

### Q12 — Motion & micro-interactions · 2026-08-28
Verified 8/8 + 1 conflict resolved + 2 [needs-evidence] CLEARED (design-standards
Motion § vs scroll-craft taste.md vs uiux-one-shot-polish gate + W3C WCAG22 2.3.3/2.2.2
PRIMARY + M3 motion tokens ×3 mirrors + mechanical frame-budget math).
1. Duration reconciliation: FEEDBACK (press/hover/toggle) = 100–200ms; ENTER/EXIT
   (overlays, reveals, page transitions) = 200–300ms; BRAND moments = 500ms+ SPARINGLY.
   The umbrella gate "150–300ms" = enter/exit, NOT hover.
2. Easing semantics: ease-OUT for enter / user-triggered (decelerate into rest); ease-IN
   for exits (modal/drawer close); symmetric (default) for in-place state changes;
   bounce/spring = accent-tier, at most ONE per surface.
3. Compositor-only: animate `transform` + `opacity` (+ `clip-path`) for 60fps; NEVER
   animate `width`/`height`/`top`/`left`/`margin`/`box-shadow` spread; `transition:
   transform, opacity` not `transition: all` (Q21).
4. Motion budget — when NOT to animate: skip animation on frequent/low-novelty updates
   (list ticks, poll counters, context menus, trivial hovers); next-painted-frame feedback
   instead (Q14); pause off-screen loops; stagger reveals 30–80ms; press `scale(0.97)`/
   `translateY(1px)`; hover gated to `@media (hover:hover) and (pointer:fine)`; never
   `scale(0)`.
5. Reduced motion = FEWER/GENTLER, not zero: keep opacity fades, drop position/scale/
   parallax. Satisfies WCAG 2.3.3 (AAA, user-initiated non-essential) AND 2.2.2
   (auto-motion >5s) — both can fail without it.
6. Scope split (resolves scroll-craft conflict): scroll-craft "never ease-in" governs
   scroll-paced marketing surfaces; component overlays use ease-in-for-exits. M3 motion
   (Open Finance): short1..long4 = 50–600ms + standard cubic-bezier(0.2,0,0,1).
Cargo-cult flags (conventions, not debunked): exact-ms values are conventions not laws;
spring-everywhere dilutes intent; delight-that-delays (animation costing perceived
performance, Q14) is an anti-pattern. OF Android M3 motion: open-finance-build
references/m3-android-component-specs.md.
Landed: uiux-one-shot-polish (Polish gate + 1 strategy) + design-standards
design-tokens-template.md Motion § (duration/easing/compositor/budget/reduced-motion).

### Q33 — Geolocation permission UX for field PWAs · 2026-08-28
Verified 8/8, 0 corrections, 2 boundaries + 4 [needs-evidence] CLEARED (web.dev
permissions-best-practices PRIMARY ×3 + NN/g permission-requests PRIMARY + Tan CHI 2014 PDF
Berkeley mirror + 2nd-source SO 67924991 / SO 75872915 / caniuse / whatismylocation 2026).
1. NEVER prompt for location on page load — only inside a user-gesture handler on an explicit
   "Use my location" affordance. Chrome telemetry: 77% of prompts fire WITHOUT user-intent
   signal → only 12% allow; after a user interaction the allow-rate rises to 30% (web.dev
   verbatim + linked Google research paper).
2. Pre-prompt pattern: explain WHAT + WHY before the native prompt. Copy formula (NN/g):
   "[app] would like to access your [resource] so that you can [benefit/task]" — benefit-framed,
   active voice, NO vague "better experience". Tan CHI 2014: +12% grant when a reason is present
   regardless of quality; compelling-vs-weak copy = 81% lift in a controlled test. Native OS
   prompt text is NOT authorable → formula drives the pre-prompt UI.
3. Alternative UI as the explanation: a manual-entry field (ZIP/address/city) NEXT TO the
   "Use my location" button — the fallback doubles as the why-it's-optional explanation; users
   feel in control. Location ladder: exact on opt-in → coarse IP-geo for initial content (labeled
   approximate) → manual entry for everyone else.
4. Denied/blocked recovery: DON'T loop or re-ask (browsers punish repeated prompts). Detect via
   error code, not Permissions-API state. error.code classes: 1=PERMISSION_DENIED, 2=POSITION_
   UNAVAILABLE (insecure/framed), 3=TIMEOUT → distinct recovery copy + settings guidance;
   insecure-context is its own cause.
5. iOS Safari gotchas: (a) standalone (installed) PWA getCurrentPosition HANGS — no prompt,
   no timeout, no reject (SO 67924991) → wrap in Promise.race with ~4s timeout when
   navigator.standalone; (b) permissions.query stays "prompt" even after the user grants
   (SO 75872915; caniuse shows API "supported" 16+ ≠ correct state) → never gate UI on
   permissions.query, branch on the error code. 2021-era reports; keep defensively.
6. precise-vs-approximate: iOS 14+ precise-location toggle; coarse ≈ neighborhood-level by
   design; an approximate grant is NOT a denial — treat it as usable.
Cargo-cult rejected: prompt-on-load (12% allow vs 30% post-interaction), nag-loops,
PERMISSION_DENIED-as-single-cause (insecure/framed/timeout distinct), IP-geo overclaim
(location from IP is coarse + often wrong). Ghostway = direct flagship (locate-me core,
iPhone field use); DM site only if a locator is added; OF Android = rationale-screen-before-
dialog native pattern.
Landed: uiux-one-shot-polish (pre-gen spec + gate + 1 strategy entry) +
web-ui-clickability-testing (SKILL.md § + references/geolocation-permission-pwa.md).
Ghostway retrofit LANDED 2026-09-25 (commit 55b25b1): first-run WHAT+WHY pre-prompt + manual-entry alternative + per-error-code recovery (1 blocked+settings guidance / 2 unavailable / 3 timeout), verified by geo-perm-check.mjs (13 assertions); the staged non-blocking lookup already neutralized the iOS-standalone getCurrentPosition hang. Closed — residual Q231 visualViewport handler landed in d564a73.

### Q32 — PWA install & launch UX · 2026-08-28
Verified 8/8, 3 corrections + 1 drift boundary + 4 [needs-evidence] CLEARED (web.dev
install-criteria/promote-install/maskable-icon PRIMARY ×3 + W3C manifest spec + Chrome
PRIMARY blogs ×4 + 2nd-source convergence ×6; scratch/q32/q32_verify.md).
1. Chrome installability (web.dev verbatim): not installed + ≥1 tap + ≥30s + HTTPS + manifest
   (short_name|name, icons 192 AND 512px, start_url, display ∈ standalone/fullscreen/
   minimal-ui/window-controls-overlay, prefer_related_applications absent/false) + SW with
   fetch handler. CORRECTION: menu install dropped the SW-fetch requirement (Chrome 108
   mobile/112 desktop) — keep SW+fetch anyway (offline-first Q30 needs it). Installability
   test can take several seconds — don't assume prompt-ready at load.
2. beforeinstallprompt handshake: preventDefault (suppresses infobar) → stash → prompt() ONLY
   from a real user gesture → userChoice → appinstalled. 90-day re-prompt + mini-infobar =
   2019-era LEGACY (omnibox icon now), not contract; the handshake stays (event alive per
   2023 Chrome blog).
3. iOS/iPadOS = NO prompt API (web.dev verbatim): manual Share → Add to Home Screen. Ship
   apple-touch-icon 180×180 OPAQUE square PNG — no pre-rounded corners (iOS masks at render),
   no transparency (→ black corners); iOS 14+ uses only the 180; WITHOUT it the icon = a page
   SCREENSHOT. Apple's own guide is ARCHIVED — 180 = convention ×5 2026 sources. iOS supports
   only standalone display; installed iOS PWAs lack badging + shortcuts; in-app browsers
   (FB/IG) trap users → detect + offer "open in Safari"; iOS 16.4+ push requires install.
4. Install-promotion etiquette (web.dev verbatim): outside the user journey; dismissible +
   REMEMBER dismissal (re-prompt only on relationship change); only after beforeinstallprompt;
   snackbar 4–7s after real interactions, never on page load; post-conversion timing; value
   copy = near-zero storage/instant/no store.
5. Manifest details: name <45 / short_name <12 = launcher-truncation GUIDANCE (legacy Chrome
   Apps docs; W3C spec sets no limits); start_url = app entry; background_color = splash
   match; id stable; always declare scope "/"; shortcuts = Android/desktop only.
6. Maskable icons (W3C PRIMARY): safe zone = circle radius 40% of icon width (512px → ~204px
   radius). CORRECTION: ~10% padding PER SIDE, not 20%. No transparent pixels; test via
   DevTools "Show only the minimum safe area" + maskable.app.
7. Android outcomes split: WebAPK vs shortcut vs QuickApp — feature-detect, don't assume.
8. Launch UX = display-mode dual-check (Q8: navigator.standalone OR matchMedia).
Cargo-cult rejected: "PWAs 3× engagement" (single-source marketing), install-prompt-on-first-
load (web.dev anti-pattern), fake install buttons before beforeinstallprompt, app-store-
wrapping (BubbleWrap/PWABuilder) as default for self-hosted OSS.
Ghostway = primary user (iPhone field use → iOS A2HS flow dominates); DM site = valid
manifest, skip active promotion; OF Android = native, N/A.

### Q32 — PWA Install Prompt UX (2nd pass, fleet-verified 2026-09-05) [C-DONE 2026-09-05]
7 rules verified on independent primaries (web.dev + androidpwa.blog + Chrome team A/B/C test + 4 independent sources). 4 [needs-evidence] boundaries resolved (3-dismissal = convention, 7-14 day cooling-off = convention, 30-60s engagement = Chrome ~30s heuristic, Pinterest 60% = internal data). Distilled to uiux-one-shot-polish Q32 (Accepted strategies) + web-platform-quirks § PWA Install Prompt UX (owning reference) + vault playbook. Flagship Ghostway MapLibre PWA.

### Q19 — Originality without weirdness · 2026-08-28
The POSITIVE half of anti-slop (Q18 distilled the negative tells; this is the method).
Source: scroll-craft references/uniqueness.md + taste.md (verbatim) + MAYA/fluency
adversarial 2nd-source + CHI 2023. 7/7 verified.
1. GRAMMAR-FIRST: before building, pick ONE page grammar = organising logic (what a
   section is, what chrome is for, how the visitor knows where they are, what the ending
   is). 8 grammars: filmic one-shot / chaptered editorial / live surface / continuous
   world / typographic poster / gallery-catalog / split stage / rhythmic cutlist — each
   with fits + feels-like + FORBIDS + nav/hero/close + leans-on/bans. "Pick one. Do not
   blend two." The forbids stop mid-build drift back to the default. The filmic DEFAULT
   carries a burden of proof ("say why the other seven did not fit" — 4 real builds
   drifted to it undirected). Generalizes: live-surface ≈ DM cockpit, continuous-world ≈
   Ghostway map (analogy-flagged synthesis).
2. SIGNATURE MOVE: every build invents ONE bespoke interaction that exists on that site
   alone — not a parameter change, not a kit device renamed. Test: "describe the move to
   someone who has seen the other builds; if they cannot tell it apart from the kit, it
   is not a signature move." What does NOT count: recoloured spotlight, tilt 9 vs 6,
   different easing, more cards.
3. FINGERPRINT GATE (anti-self-repetition): per-project registry of shipped builds, 6 dims
   (grammar / nav treatment / hero device / act-sequence shape / close pattern / signature
   move); a new build must differ from EVERY existing row on ≥4 of 6, individually per
   row. "If the planned build fails the gate, change the plan, not the log."
4. TASTE FLOOR DOES NOT FLEX (the "without weirdness" answer): aesthetic range is OPEN
   (7 families: brutalist / maximalist / playful / retro / dense / editorial / premium-
   minimal, each earned by brand fit) but spacing-scale+rhythm, type metrics+measure,
   measured contrast, transform/opacity-only motion, focus-visible, reduced-motion-keeps-
   meaning, real copy+real numbers hold in EVERY family ("a brutalist page still needs
   4.5:1"). Originality lives in STRUCTURE+VOICE, never in the craft floor.
5. DEVIATION MUST BE BRIEF-EARNED (symmetric with default-drift): refuse-list items are
   "category defaults, not bans on principle — the brief's own words can earn any of them."
6. SQUINT TEST (pre-ship hierarchy gate, any UI): blur the page until detail is gone —
   must still name primary element, secondary, major groups, in that order. Pairs with
   Q18's mechanical detector (complementary, not dup).
7. ADVERSARIAL BOUNDARY (MAYA — Loewy "most advanced, yet acceptable"): fully novel =
   disfluent = less trusted (processing-fluency / beauty-in-averageness) → taste floor =
   the fluency-preserving "acceptable" anchor; grammar + signature move = the "advanced"
   axis. Peer-reviewed (12-site study): novelty predicts appeal for SERVICE sites,
   typicality for COMMERCIAL sites → DM home-services landing leans typical (deviations
   earned harder); Ghostway/brand surfaces carry more novelty. CHI 2023: fluency controls
   the aesthetic-usability correlation .79→.34 → floor BEFORE novelty.
Cross-skill conflict FIXED: scroll-craft taste.md "body measure 45 to 75ch" → patched to
50–75ch (~66 ideal, 80 cap) per fleet Q1/Q7. "Never ease-in on UI" already resolved by
Q12 scope split (scroll-paced surfaces vs component overlays).
OF Android = taste-floor half ONLY (M3 = typicality by design system; signature-move/
fingerprint machinery is web/marketing-surface only).
Landed: uiux-one-shot-polish (pre-gen spec + gate + 1 strategy entry) + scroll-craft
(taste.md measure fix). No project retrofit (applies at build time).

### Q37 — List-paging pattern choice · 2026-08-28
- **No pattern is overall superior — choose by TASK.** Infinite scroll fits ONLY
  homogeneous, equally-relevant, goal-less grazing (social/news/entertainment). Don't use
  it when users find something specific, compare items far apart, inspect only top items
  (SERPs), or are low-bandwidth / a11y-heavy. → DM cockpit record lists + Ghostway POI/
  route lists = goal-driven find/compare → PAGINATION or Load More, never classic infinite
  scroll.
- **Six NN/g costs of classic infinite scroll**: hard refinding (pogo-sticking dumps user
  at list top unless position saved), illusion-of-completeness, footer unreachable, a11y
  (keyboard tab-marathon; SR sees only first chunk), increased page load, poor SEO.
- **Load More = the compromise**: footer access + kills illusion + user controls data;
  cost = one interaction per batch (Zhang 2019 task-switching). Google mobile = Load More.
- **Pogo-sticking**: if items link to detail pages, save + restore list position on Back.
- **View All + page size**: ONE default 10 or 20 + View All (not 10/20/30/40 popup); cap
  ~100 items; persist size; two sizes only if second is substantially bigger (10 vs 50, not
  10 vs 20).
- **CLS**: reserve space / skeleton-match / prefetch; ~500ms user-input allowance.
- **A11y floor (W3C APG feed)**: role=feed + article + aria-posinset/setsize/busy +
  PageUp/PageDown/Ctrl-End; Load More = simpler accessible default.
- **Rejected**: "87% never click Load More" (no source); infinite-scroll-as-default-for-
  all-lists; integrated-pagination variant = experimental, not recommended.
Source: NN/g infinite-scrolling-tips + item-list-view-all + W3C APG feed + Osmani/Chrome CLS
(8/8 verified) + Google June-2024 removal 5-source convergence. Full spec:
web-page-production-polish references/dashboard-uiux-audit.md § List-paging.

### Q38 — Destructive-action confirmation + undo · 2026-08-28
- **Prefer UNDO over a confirm dialog** — Raskin (ALA #241): habituation makes "Are you
  sure?" an auto-Yes; reversibility is a DATA-MODEL decision at concept phase, not a modal
  after the fact (Gmail holds sends before commit). Direct users: DM cockpit record delete,
  OF budget/transaction delete, Ghostway saved-place/route delete.
- **NN/g 8 confirmation guidelines** (only when confirm is the right tool): confirm for
  serious+irreversible ONLY; never routine (cry-wolf dilutes it); NAME the specific consequence;
  verb-LABELED buttons (Delete / Cancel), never Yes/No; no pre-selected answer; progressive
  disclosure; nonstandard action for the worst case; "don't ask again" for low stakes.
- **Proximity rule** — destructive control placed FAR from benign actions (NN/g top-10 mistake;
  System-1 slips; Fitts friction welcome). Converges with Q29 row-action placement.
- **Escalation ladder** — undo → confirm → type-to-confirm → second-user; reserve the top two
  for rare/irreversible (Raskin's own piece critiques type-to-confirm as concentrating on the
  unhabitual task).
- **Cancel vs Close** disambiguated — X is ambiguous; auto-save work; separate Cancel; "when in
  doubt, save then out" (Gmail draft-save).
- **M3 Snackbar for undo (SOURCE-VERIFIED)** — SnackbarManager.java: SHORT=1500ms,
  LONG=2750ms; one-at-a-time, swipe-dismiss, anchor above FAB/nav. Truthful undo: capture
  pre-state BEFORE the action; restore exact object/value/order/permission; defer hard-delete
  until snackbar timeout. iOS HIG: verb-labeled buttons.
- **Rejected:** confirm-on-every-destructive-action (cry-wolf; habituation makes it noise);
  "Are you sure?" as sufficient protection (auto-Yes); Yes/No confirmation buttons (unlabeled,
  error-prone).
Source: NN/g confirmation-dialog + proximity + cancel-vs-close FULL + Raskin ALA #241 FULL +
M3 SnackbarManager.java SOURCE-VERIFIED + Gmail Undo-Send convergence — ledger Q38 B-row, 8/8
verified, 1 internal boundary (type-to-confirm). Full spec: frontend-component-build
references/state-design.md § Destructive actions.

### Q36 — Search & autocomplete/typeahead UX · 2026-08-28
- **Visible box, never icon-only** — a type-in field (not a link/icon that opens one); top-of-page
  placement (useit.com link→box = +91% search use). Width shows the typical query without scroll
  (~27–30ch is a 2nd-source CONVENTION, not a primary NN/g figure — 27–30 count corrected).
- **First-query success is decisive** — 51/32/18% succeed on 1st/2nd/3rd query; ~half who fail
  the first abandon. Make the FIRST query work (good defaults, scoped-to-all, typo tolerance).
- **Mean query = 2.0 words** — no advanced/Boolean UI in the primary surface (users misuse it);
  advanced link as escape hatch only.
- **Scoped search**: default "all"; state active scope at top of results; offer entire-site search
  when scoped returns nothing.
- **Suggestions**: only-suggest-queries-with-results (JC Penney "luggage sets clearance"→pet-travel
  case); highlight the DIRECTION of the suggestion (bold suggested chars — Dick's got it backwards);
  mobile = simple text only; ~23% selection boundary (31/136±7%, value persists as reference).
- **No-results page**: state the miss obviously + concrete path forward + DON'T mock the user
  (NexTag: zero fixations on taunt copy). Converges with Q11 empty-state.
- **Results page**: echo query in an EDITABLE box + result count + interpreted-query note + relevance
  default sort + first page is golden.
- **A11y = W3C APG combobox** — role=combobox + aria-expanded/controls/activedescendant; full
  keyboard contract; debounce 200–300ms; 5–10 suggestions. axe-core has NO combobox rule →
  combobox semantics = manual-audit remainder (same class as Q31 paste-block).
- **Rejected:** icon-only search triggers; advanced-search-by-default; Algolia 24%/69%-abandon/
  5–6×-convert vendor stats (no independent source).
Source: NN/g search-visible-and-simple + site-search-suggestions + search-no-results-serp + W3C APG
combobox, all PRIMARY — ledger Q36 B-row, 8/8 verified, 1 correction + 2 [needs-evidence] cleared.
Full spec: web-page-production-polish references/dashboard-uiux-audit.md § Search & autocomplete.

### Q34 — Font loading & delivery UX · 2026-08-28
Verified 8/8 (csswg css-fonts-4 PRIMARY verbatim + @mdn/browser-compat-data v8.0.13 programmatic + web.dev/articles/optimize-cls + zachleat comprehensive-webfonts + mechanical CLS math, ledger Q34 B-row).
1. **font-display decision tree** — `block` = short block (3s recommended) + infinite swap; `swap` = ≤100ms block + infinite swap; `fallback` = ≤100ms block + 3s swap; `optional` = immediate-or-never (UA may abort). 100ms/3s are RECOMMENDED values, not hard constants (csswg caveat).
2. **Industry convention: `swap` for body, `fallback` for headings** — CONFLICT: csswg's own usage guidance inverts this (spec says swap = small text, fallback = body); keep the industry convention (dominant practice), note spec wording as a boundary. `block` = FOIT (invisible text up to 3s); `optional` silently skips the custom font on slow links → neither is the body default.
3. **Preload ≤2 critical faces, `crossorigin` mandatory** — the preload fetch and the @font-face fetch must match credentials mode; omit `crossorigin` and the preload is wasted (double fetch, no hit).
4. **Self-host WOFF2 + subset + `unicode-range`** — drop the Google-Fonts all-weights CSS (it lazy-loads every weight on first paint); OSS self-host bias (zachleat: "Unceremonious @font-face: Do not use").
5. **Metric-matched fallback via `size-adjust`** — Chrome 92 / FF 92 / Safari 17 (incl. iOS 17) support `size-adjust`; `ascent-override`/`descent-override`/`line-gap-override` are FALSE on Safari <17 / iOS <17 (BCD v8.0.13) → use `size-adjust` as the portable metric-match so the fallback and webfont occupy the same box (kills the swap CLS jump).
6. **Variable fonts > static weights**; set `font-synthesis: none` (don't let the browser fake bold/italic from a weight it doesn't have).
7. **~100KB budget**; prefer FOUT-with-class over FOIT; a `size-adjust`-matched fallback = 0 CLS on swap (mechanical: unmatched webfont ~10% wider → ~24px shift → CLS ≈0.014/block on a 420-char paragraph; matched → 0).
Rejected: font-display:block (FOIT invisible text); Google-Fonts all-weights CSS; font-display:optional-as-default (skips custom font on slow links).
Full spec: design-standards references/design-tokens-template.md § Font loading & delivery.

### Q35 — Image & media loading/delivery UX · 2026-08-28
- **LCP priority inversion** — hero/first-viewport image = `eager` + `fetchpriority="high"`, NEVER `loading="lazy"`; ≤1–2 images get high priority; below-fold = `lazy`. `preload` only when hidden from the preload scanner (CSS bg / JS-added / data-src); lazy+high combo unnecessary.
- **Always set width/height** — dimensionless image defaults to 0×0; a lazy gallery is then judged all-in-viewport → browser loads everything + CLS. Set dimensions (or aspect-ratio) on every `<img>`.
- **Format cascade** — `<picture>` AVIF → WebP → JPEG fallback; WebP = pragmatic default, AVIF = build-time-only. AVIF ≈94.65% global (Safari 16.4+ full), WebP 96.09% (Safari 14+). CORRECTION: mechanical test (libjpeg 55.2KB → WebP 23.4KB → AVIF 25.5KB) shows AVIF ≠ always smaller than WebP; savings encoder/bitrate-dependent.
- **srcset + sizes** — `w`-descriptors with `sizes`; omitting `sizes` = 100vw → over-download. `decoding="async"` below-fold (hint only, not LCP lever).
- **Lazy mechanics** — Chrome thresholds ~1250/2500px; `display:none` = no load, `opacity:0` = loads; never lazy the above-fold image.
- **LCP 4 subparts** — TTFB ~40% / load delay <10% / load duration ~40% / render <10%: attack the dominant one.
- **Rejected:** lazy hero, lazy+high, preload-everything, dimensionless-lazy-gallery, AVIF-for-icons.
Source: web.dev lazy-loading + optimize-lcp PRIMARY + caniuse + mechanical encode test — ledger Q35 B-row, 8/8 verified, 2 corrections + 1 [needs-evidence] carried.

### Q45 — Tabs, accordions & disclosure widgets UX · 2026-08-28
- **Use tabs for FEW, clearly-grouped, related panels of UNEQUAL importance** — the default tab
  gets the attention; tabs are WRONG when the user must cross-compare panels (put cross-compared
  content in one view or stacked sections).
- **Accordions for mobile/limited space + short FAQ content; tabs for desktop/longer/busier content.**
- **In-page tabs ≠ navigation tabs — DON'T mix** (disorients; NN/g contrasts content scope/location/loading/justification).
- **ARIA tab pattern**: tablist/tab/tabpanel + roving tabindex (active=0, others=-1) + Arrow moves
  focus + Enter/Space activates + aria-selected + aria-controls + aria-labelledby; aria-orientation=vertical
  → Up/Down; horizontal ignores Up/Down (page scrolls).
- **Activation**: automatic only when the panel loads without latency/preloaded; manual for slow/heavy panels.
- **Selected state via ≥2 indicators** (underline + bold/darker/size/icon), NOT color-only (converges Q17).
- **One row, above the panel, no ALL CAPS, descriptive 1–2-word labels.**
- **Disclosure/accordion = `<button>` + aria-expanded + aria-controls + chevron right→down (not color-only).**
- **Mobile overflow**: scroll-snap strip or `<select>`/accordion — NOT a carousel (NN/g anti-pattern).
- **Boundary**: axe/Lighthouse have NO tab-pattern ARIA rule → correct roles + keyboard = manual-audit remainder.
- **No rejected cargo-cults** (verified clean); the two traps to avoid = using in-page tabs as site
  navigation, and a color-only selected state.
Source: W3C ARIA APG tab + disclosure patterns FULL + NN/g Tabs Used Right FULL + mechanical ARIA-wiring
test (scratch/q45: APG-compliant PASS vs div-soup FAIL), 10/10 verified, 1 boundary. Direct users:
DM cockpit tabbed detail/settings, Ghostway info panels, DM Astro site.

### Q46 — Theme / light–dark mode switcher UX · 2026-08-29
- **No-flash resolver** — a synchronous INLINE script (NOT `type=module`/`defer`/external `src` — all defer and cause FOUC) sets `data-theme` on `<html>` from `localStorage` → `matchMedia('(prefers-color-scheme: dark)')` → `light`, BEFORE first paint.
- **Early UA-chrome hint** — emit `<meta name="color-scheme" content="light dark">` in `<head>` (before the CSS link) + set the `color-scheme` property on `:root`; themes scrollbars/form controls/spellcheck/canvas automatically.
- **Priority = explicit > system > light** — if the choice is 'system', do NOT write `data-theme` (CSS `@media` owns it; writing it silently defeats the OS toggle). Mechanical resolve() proves all 6 branches.
- **Semantic token flip is MANDATORY** — `color-scheme` only themes UA *defaults*; content colors (bg/text/border) still need the flip under the media query. Verify both themes hold AA (text/bg 17.4:1 light / 14.2:1 dark; hairline border 1.5:1 exempt, not 1.4.11).
- **3-state control is NOT a switch** — `role=switch`/`aria-pressed` are 2-state; a light/dark/system control needs a `radiogroup` of 3 radios OR a 2-state switch + separate 'use system' option. Don't misuse aria-pressed for a 3-way.
- **OS-only boundary** — if ONLY OS-follow is needed (Ghostway field PWA), pure CSS `@media` + meta tag suffices: no JS resolver, no localStorage, no FOUC. Add the inline resolver only when a manual toggle is wanted (survives offline, Q30).
- **Don't animate the toggle on first paint** — the resolver must run synchronously; a `*` colour transition during load fights it. Disable transition-on-load (set a class after first paint).
- **Cargo-cult rejected:** hardcode-colors, ignore-system, flash-on-load, cookies-not-localStorage, forget-dark-contrast, animate-the-toggle-on-first-paint.
Source: web.dev color-scheme + MDN prefers-color-scheme PRIMARY + mechanical scratch/q46/verify.py (token-flip WCAG resolution) — ledger Q46 B-row, 6/6 verified, 0 corrections + 3 boundaries. Direct users: DM Astro global + per-page toggle, DM cockpit, Ghostway PWA (OS-only default), OF web tier; OF Android = M3/Compose dark (separate path).

### Q49 — Pull-to-refresh UX for field PWAs · 2026-08-28
Ghostway (iPhone field PWA) is the flagship; DM cockpit (desktop Hono+SQLite) + Open Finance Android are secondary.
Verified: w3.org WCAG22 Understanding 2.5.1 PRIMARY + Technique F105 + m1.material.io swipe-to-refresh PRIMARY + MDN overscroll-behavior + caniuse PRIMARY (css-overscroll-behavior) + androidx Compose PullToRefresh package-summary (updated 2026-03-27).

### Q50 — Command palette / keyboard-shortcut UX · 2026-08-28
- **No "W3C command-palette pattern" exists** — it is a COMPOSITION: a modal dialog (focus trapped in tab sequence, Esc closes, focus returns to opener on close, `aria-modal` + `aria-label`) wrapping a combobox (`aria-controls` [not legacy `aria-owns`], `aria-expanded`, `aria-autocomplete="list"`; popup = `listbox`; selection follows focus → VIRTUAL highlight via `aria-activedescendant` on the input, so DOM focus never leaves the field and typing continues). Cite as two APG patterns, never "the W3C command-palette pattern".
- **Visible Close button REQUIRED** — APG dialog guidance "strongly recommends" every dialog tab sequence include a visible close button; Esc-only palettes (cmdk/GitHub-style default) VIOLATE it. Ship a visible ✕/Close (also serves touch users with no Esc).
- **aria-modal only when truly modal** — set it ONLY when code makes outside content inert AND obscures it; APG warns of "severe negative ramifications" for AT otherwise. A palette without scrim/inert layer must NOT set it.
- **Discoverability is the load-bearing rule** — keyboard-only discoverability is REFUTED: KeyMap's "hold-modifier-reveals-keymap" figures are deltas OVER Malacria/ExposeHK (n=98), NOT absolute gains. Independently: shortcuts used infrequently, most users know only copy/paste, adoption blocked by the active-user paradox. → visible trigger + inline `<kbd>` hints beside each command + `?` cheat-sheet are REQUIRED, not nice-to-have.
- **Mobile = desktop accelerator only** — Ghostway iPhone PWA + OF Android have NO hardware keyboard; palette unusable there. Core actions MUST exist as a visible search box / bottom sheet. The one genuine ⌘K user in Keaton's stack = DM cockpit (Hono+SQLite, expert operator, action-heavy).
- **Perf** — activeIndex in state (not DOM-derived); debounce filter 200–300ms (converges Q36); virtualize long lists; no sync work on keydown. WHEN-NOT: content-retrieval / broad-audience → visible search wins (Q36); palette on a simple marketing site = Q18 slop tell.
- **Cargo-cult rejected:** ⌘K-on-everything, keyboard-only-discoverability, tooltips-are-enough, palette-for-content-sites, removing focus styles inside the palette.
- **Cost boundary:** duplicates every action's entry point (two code paths to sync) + adds a modal a11y surface; NOT worth it below ~15–20 keyboard-reachable actions or on touch-primary surfaces.
Source: W3C ARIA APG Dialog + Combobox patterns PRIMARY ×2 + ACM KeyMap 10.1145/3313831.3376483 + ExposeHK/Malacria HAL hal-01894253 + Skillometers PDF + mechanical scratch/q50/validate.py (good = 15/15 PASS, div-soup = 0/15 FAIL) — ledger Q50 B-row, 6/6 verified, 1 correction (KeyMap≠Malacria) + 3 boundaries.

### Q52 — Button & action-hierarchy design · 2026-08-28
Verified 8/10 on PRIMARY (W3C ARIA APG Button Pattern FULL + APG Read Me First + MDN `disabled` reference), 1 CORRECTION + 1 NET-NEW rule + 2 groups carried as convention. No mechanical test (terminal approval-gated — no claim of mechanical proof).
1. Button vs LINK is functional, not cosmetic (APG verbatim): `<button>` triggers an action/event (submit/open dialog/delete/cancel); `<a>` navigates. A link styled as a button should be restyled to match its function — "it is important that both the appearance and role of a widget match the function it provides"; a role=button on a link is acceptable but "a better solution is to adjust the visual design so it matches the function and ARIA role."
2. Disabled-vs-aria-disabled: ARIA half PRIMARY-confirmed (APG: "When the action associated with a button is unavailable, the button has aria-disabled set to true"); MDN: HTML `disabled` = not mutable/focusable/submitted, receives no browsing events, doesn't participate in constraint validation (contrast `readonly` stays focusable). aria-disabled preserves focusability + discoverability; HTML disabled destroys it. COST: aria-disabled does NOT block activation → handler must early-return, button stays in tab order (needs reason exposed as text, never in a tooltip — Q43). Boundary: the prefer-enabled + inline-error-on-submit half (NN/g/GOV.UK/Polaris) could NOT be re-sourced this run (NN/g URL 404 via extractor) → keep as strong multi-secondary convention, not primary.
3. Toggle = aria-pressed, STABLE label (CORRECTION to SLOT A): APG explicit — "it is critical the label on a toggle does not change when its state changes"; if label flips Mute→Unmute, "the aria-pressed attribute would not be needed." Fleet rule: pick ONE — stable label + aria-pressed, OR changing label + no aria-pressed; never both.
4. Menu button = aria-haspopup (menu | true) — APG names those two values specifically.
5. Keyboard contract (APG verbatim): Space AND Enter activate; post-activation focus — opens dialog → focus inside; closes dialog → returns to invoking button unless context destroyed; non-dismissing (Apply/Recalculate) → focus STAYS on button; context change (wizard next) → focus moves to new context start. Converges Q38/Q51.
6. NET-NEW (APG): a button that launches a dialog conventionally appends an ellipsis ("Save as…") — cheap signal the click doesn't commit yet. Converges Q38/Q16.
7. Accessible name + description (APG): name from text content or aria-labelledby/aria-label; aria-describedby for separate description; "a role is a promise" → prefer native `<button>`; hand-rolled div role=button must implement Space/Enter + focusability.
8. NOT re-verified (carried as convention): M3 five-tier emphasis ladder + FAB rules + 18–24dp leading icon — m3.material.io could not be extracted; the one-primary-per-screen PRINCIPLE is independently verified via Q6 (Unbounce 44M-conversion single-CTA data); the M3 tier NAMES are not primary-verified (Q26 maintenance-mode caveat). Target size (candidate 10) is not net-new — already Q8/Q23.
Relevance: all four stacks (DM cockpit save/delete/cancel/export, OF budget/txn actions, Ghostway map/route buttons, DM Astro CTAs). WHEN-NOT: aria-disabled is web-only (OF Android/Compose own semantics); ellipsis convention is a desktop-app convention, reads oddly on mobile primary CTAs.
Landed: uiux-one-shot-polish (pre-gen spec + Accepted-strategies Q52) + frontend-component-build references/accessibility-patterns.md (§ Button fleet-verified rules). No project retrofit (general button semantics, applies at build time).

### Q53 — Context menu / overflow (kebab) / right-click & long-press menus · 2026-08-28
Verified 8/10 on PRIMARY (W3C ARIA APG Menu Button + Menu & Menubar patterns FULL + MDN `contextmenu` event), 3 CORRECTIONS + 1 NET-NEW refutation + 2 carried (Apple HIG long-press/haptic + destructive-ordering — JS-gated page, filed as convention not source-verified). No mechanical test (semantics angle, nothing measurable in a scratch harness).
1. Menu button = `<button aria-haspopup="menu" aria-expanded="false" aria-controls?>`: aria-controls is OPTIONAL (APG: "Optionally"); aria-expanded MUST be set explicitly to `"false"` when closed (SLOT A's "remove=false when closed" was NOT APG wording). Menu element labelled via aria-labelledby → trigger (or aria-label).
2. Open with Enter AND Space BOTH (APG-required); arrow-keys move focus among items (wrap is OPTIONAL — SLOT A asserted wrap as required, correction). Escape closes + returns focus to the trigger (store the ref — prevents focus dumping to <body> in a table of row-kebabs).
3. Composite widget: Tab/Shift+Tab move focus OUT and close the menu (don't trap Tab inside); "a role is a promise" — the author must ensure focus lands on an item when it opens.
4. NET-NEW refutation (MDN PRIMARY): Firefox Shift+right-click shows the native menu WITHOUT firing `contextmenu`, so `preventDefault()` cannot suppress it → a custom right-click menu is by spec/UA-behaviour NON-exclusive and can ONLY be an ACCELERATOR layered on an always-visible kebab, never the sole path (MDN also badges `contextmenu` "Limited availability").
5. CARRIED (convention, HIG JS-gated): long-press ~0.5s + haptic opens the menu on touch; most-used item top / destructive bottom in red-but-never-colour-alone.
6. Submenus: cascades are SPECIFIED (legal to ≥2 levels on desktop pointer:fine); keep FLAT on touch (iPhone/Android field use) — the "max 1 submenu level" rule is a touch/hover-failure convention, not a spec rule.
7. When-NOT: only 1–2 actions → inline them (Q29 rule beats building a menu — the full ARIA contract ≈40–60 lines focus-mgmt JS per menu).
Relevance: DM cockpit row kebab = primary user (always-visible or keyboard-reachable per Q29's hover-hidden-fails rule); Ghostway iPhone long-press POI = accelerator + flat + ≥44px items (Q8); OF Android = M3 native menu semantics (web ARIA rules don't apply). Web: aria-disabled-not-disabled (Q52) + WCAG 1.4.13 (only if the menu appears on hover/focus, not click) still hold.
Landed: uiux-one-shot-polish (pre-gen spec + Polish gate + Accepted-strategies Q53) + frontend-component-build references/accessibility-patterns.md (§ Menu / menubar Q53 addendum). No project retrofit (general menu semantics, applies at build time).

### Q55 — Swipe-to-action on list rows · 2026-08-28
Verified 4/8 on PRIMARY (W3C WCAG 2.2 Understanding 2.5.7 Dragging Movements FULL + androidx.compose.material3 API ref), 2 CORRECTIONS + 1 NET-NEW escalation + 2 iOS claims carried as convention (Apple SwiftUI/HIG JS-gated, source-unverified). No mechanical test (terminal approval-gated).
1. swipe-to-reveal IS in scope of 2.5.7 (AA) by the spec's own definition (a row that tracks the finger is "dragging movement"; author-implemented → in scope; UA scrolling/"drag to refresh"/CSS overflow are exempt). Failure = F108; sufficient technique = G219.
2. EDGE-DIFFERENTIATED swipe (left=delete / right=archive) is ALSO directionally meaningful → 2.5.1 (Level A) path-based gesture risk. W3C: an action with BOTH a drag AND a path may fail BOTH SCs → treat edge-differentiated swipe as Level-A, single-direction dismiss-only = 2.5.7 only.
3. CORRECTION: the 2.5.7 alternative need NOT be ≥24px visible without hover — 2.5.7 requires only an equivalent single-pointer, non-dragging path (W3C's carousel example allows visually-hidden-but-operable buttons). Size floor comes from 2.5.8 (Q8/Q23); discoverability from 2.4.11/Q9 — cite SEPARATELY, never attribute to 2.5.7.
4. The canonical 2.5.7 alternative for LISTS (spec-named): after tapping/clicking a list element, provide adjacent controls / a pop-up menu → a row kebab/overflow (Q53) or inline buttons DISCHARGE 2.5.7. This is the fleet's contract, now PRIMARY-backed.
5. Keyboard equivalence does NOT satisfy 2.5.7 (verbatim: keyboard-only "does not automatically meet" unless it ALSO provides clickable controls); matches Q47.
6. BOUNDARY: 2.5.7 applies if content suppresses UA scrolling + implements its own → gate the handler on horizontal-dominant movement, never suppress vertical scroll (also protects Q27 map pan + Q48 carousel).
7. Android `SwipeToDismissBox` + `SwipeToDismissBoxState` CONFIRMED present in current androidx.compose.material3 (Compose-only → OF Views tier = custom ItemTouchHelper, Q26 maintenance caveat); peek-vs-dismiss anchors carried [needs-evidence].
8. iOS `swipeActions`/`UIContextualAction` specifics = CONVENTION (JS-gated) — file as convention, not verified; the "allowsFullSwipe=false for destructive" safety rule is sound reasoning either way.
Relevance: Ghostway POI/route rows = gesture accelerator only, kebab is the contract, NEVER over the map canvas (Q27); OF Android txn rows = SwipeToDismissBox + overflow menu + undo snackbar (Q38); DM cockpit mobile = row kebab first, swipe optional; desktop/table tier (Q29) = no swipe. WHEN-NOT: 1–2 actions → inline buttons (Q53 when-NOT), UA-provided gestures.
Landed: uiux-one-shot-polish (pre-gen spec + Polish gate + Accepted-strategies Q55) + web-ui-clickability-testing (Q55 Swipe-to-action section). No project retrofit (general gesture pattern, applies at build time).

### Q48 — Carousel / slider UX · 2026-08-28
- **Default STATIC** — a hero carousel is the canonical AI-generated-site tell (Q18). Prefer a static hero + scrolled sections (Q6 single-CTA); also an LCP win (Q35: a carousel ships N full-width images + a slider lib in the most expensive viewport slot).
- **No auto-rotation on hero/promo** — the evidence indicts AUTO-ROTATING PROMOTIONAL HERO carousels (heterogeneous slides competing for one slot): Runyon 2013 ~1% click-through, 84% on slide 1 of 5. It does NOT indict user-initiated homogeneous galleries where swipe/next IS the task (product images, Ghostway POI gallery) — allowed, with a non-swipe prev/next control for 2.5.1 (Q27).
- **If rotation is genuinely needed (rare):** the visible rotation control MUST be first in the tab sequence; auto-rotation STOPS on keyboard focus (no resume unless user re-activates) + pauses on hover.
- **WCAG 2.2.2 Pause/Stop/Hide (legal ADA/508/EAA):** the AUTO-UPDATING prong has NO 5s exception — auto-advancing = auto-updating → pause/stop/hide at ANY duration. Pause-on-hover/focus ALONE is NOT conformance (W3C verbatim: restarting on blur is not a pause mechanism); the visible control is the mechanism; both required.
- **A11y wiring:** container `role="region"` (or group) + `aria-roledescription="carousel"` + label NOT containing 'carousel'; tabbed variant = `tabpanel` slides + `tablist` 'Choose slide to display'; grouped-dots least keyboard-friendly; current dot uses `aria-disabled` NOT `disabled`.
- **Rejected:** auto-forwarding promo hero carousels, 'rotates <5s so it's fine', hover-pause-as-compliance, decorative-CTA-only slides.
Source: W3C APG Carousel + WCAG 2.2.2 Understanding (verbatim) + 4× Runyon-2013 secondary — ledger Q48 B-row, 8/8 verified, 2 corrections + 3 boundaries.

### Q42 — Date & time picker UX · 2026-08-28
- **Calendar picker ONLY for near-present / relation dates** (booking, deadline) — never JS-only; always allow text entry (NN/g + GOV.UK).
- **Known-date field → native or separate fields, not a calendar.** `<input type=date>` wins for a single known date (free a11y/i18n/mobile wheel); for dates known-from-document (DOB, passport) GOV.UK/ONS/NHS use THREE separate day/month/year numeric fields (inputmode=numeric) for clearer errors + no locale ambiguity. Native is NOT universally best.
- **Custom picker (range/blackout/inline) MUST follow WAI-ARIA APG**: role=grid + arrow-key day nav + focus return + OK/Cancel + aria-describedby format. AI custom pickers routinely fail a11y.
- **Day cells ≥24×24px (2.5.8); escalate to ≥44×44px on touch-field use** (Ghostway iPhone — Q8 floor); Safari native cells ~44px.
- **Format forgiveness**: accept -/space///. , leftmost-zeros optional; prevent illogical dates via min/max/disabled; never silently coerce.
- **I18N**: store ISO 8601 (YYYY-MM-DD), display via Intl.DateTimeFormat in locale, first-day-of-week from Intl.Locale.weekInfo.firstDay — never hardcode Sunday. showPicker() exposes native UI behind a custom trigger.
Source: NN/g date-input + GOV.UK/ONS/NHS + WAI-ARIA APG Date Picker Dialog/Combobox + 02ui.com — ledger Q42 B-row, 7/7 verified, 1 boundary (native-wins conditional) + 4 [needs-evidence] cleared. Direct users: DM cockpit status/date filters + OF budget dates (known-date → native/separate-fields), Ghostway trip date-range (custom APG calendar + 44px cells), all store ISO 8601.

### Q41 — Onboarding & first-run UX · 2026-08-28
- **Default to NO dedicated onboarding** — NN/g verbatim: "avoid creating app onboarding whenever possible and instead spend your resources making the UI more usable"; test with NO onboarding first; users learn by using. Only 3 justified cases: (a) user info REQUIRED to get started (account/identity setup), (b) functionality highly tailored needing one-time config, (c) genuinely-novel interaction the UI itself can't convey.
- **Tutorials don't work** (NN/g, 4 simple iOS apps): 91% read the tutorial vs 94% who skipped it (p=0.443, NS); task success/SEQ was HARDER for readers (4.92 vs 5.49, p=0.047); no speedup (93.49s vs 85.17s). Boundary: small sample of simple apps — directional, not universal.
- **Push vs Pull** — launch tutorials / what's-new modals = PUSH (disruptive + forgotten); contextual help / in-context hints = PULL (discovered when needed). 5 pull guidelines: reveal on demand, tie to the object, minimal text, non-modal, dismissible.
- **What's-new is an anti-pattern at launch** — a launch modal is a PUSH revelation users dismiss unread; ship silently + surface in-context (changelog link, first-run badge on the new control).
- **Feature-promo at launch: avoid** — exception only for a TRULY-new feature; otherwise use the app-store/landing page.
- **No visual-design customization in onboarding** — content customization (e.g. "connect your first source") OK with a why; never ask users to pick themes/colors before they've used the product.
- **Coach-mark rules:** one tip per mark, no chains, visual + short text, visually distinct from the surrounding UI (not color-only).
- **Format ranking (worst→best):** deck-of-cards walkthrough = NOT recommended (instructional, forgotten); coach marks = nice-to-have; interactive walkthroughs = only for complex/novel flows; NEVER use a tutorial to supplement poor design.
- **BOUNDARY (counterexample, not contradiction):** complex / setup-heavy products (B2B SaaS, integrations, multi-step config) measurably lift retention with ACTIVATION-DRIVEN onboarding (checklist/wizard → first value + contextual tooltips) — visionary +27pp D30, usetandem self-serve-fails-complex. Converges with Q51 (wizards for novice/infrequent) + Q43 (contextual help). The refinement = FORM matters: activation-driven contextual onboarding good; instructional deck-of-cards bad.
- **Cargo-cult rejected:** "onboarding is always good"; tutorials-always-help; deck-of-cards welcome tour; what's-new launch modal; "ask users to pick a theme before first use".
- **Cost boundary:** every onboarding flow (even "Skip") costs a tap + memory load + may not improve performance → spend the effort on a more usable UI instead.
Source: NN/g mobile-app-onboarding + mobile-tutorials + onboarding-tutorials + mobile-instructional-overlay PRIMARY (all 8 groups verbatim) + 2nd-source convergence (elearningindustries mirror; octalysis/Appcues task-based 3.5×>walkthrough; visionary 412k-user +27pp D30; usetandem complex-B2B self-serve-fails) — ledger Q41 B-row, 8/8 verified, 0 corrections + 1 boundary. Direct users: Ghostway first launch (map PWA field use), Open Finance first run (account setup), DM admin cockpit first login.

### Q60 — Forced-colors / prefers-contrast accessibility · 2026-08-28
- **Detect + small tweaks only** — `@media (forced-colors: active)` (Baseline widely available Sept 2022) detects the mode; MDN verbatim: do NOT use it to build a separate design, only "small tweaks to improve usability or legibility".
- **Override table (verbatim):** `color`→`CanvasText`/`ButtonText` (by native semantics), `background-color`→`Canvas`, `border-color`→`ButtonBorder`/`CanvasText`, `outline-color`→`Highlight`/`ButtonText`, `box-shadow`→`none`, `text-shadow`→`none`, `background-image`→`none` (non-url), `color-scheme`→`'light dark'`, `scrollbar-color`→`auto`, SVG `fill`/`stroke` forced. Consequence: box-shadow-only buttons/divs, background-defined card borders, and custom-shadow focus rings VANISH.
- **Fix with border, not color** — MDN's own example: `border: 2px solid ButtonText` inside the query; focus = `outline: 2px solid Highlight` + `outline-offset` (converges Q21 outline-first + Q9 focus-conflict).
- **System-color keywords** — `Canvas`/`CanvasText`/`LinkText`/`ButtonFace`/`ButtonText`/`ButtonBorder`/`Highlight`/`HighlightText`/`GrayText`/`AccentColor`/`AccentColorText`/`Mark` inside the query; SLOT A's "NEVER hex/hsl" is best-practice NOT hard rule → soften to "prefer system colors" (author MAY use hex but it won't integrate with the palette).
- **Custom controls** — checkboxes/toggles/radios with background-defined styling lose visual distinction → add forced-colors border fallbacks (converges Q58/Q52 native-element + border). NET-NEW: forced colors map by NATIVE element semantics, NOT ARIA roles → a `<div role="button">` stays invisible; use real `<button>` + border.
- **Boundary:** HCM = Windows + Android-web only, NOT iOS Safari (Ghostway iPhone N/A) nor macOS (that's `prefers-contrast`); orthogonal to Q46/Q3. Carried [needs-evidence]: `prefers-contrast` "more >7:1 / less <4.5" from secondary Firefox-HCM docs, not MDN.
Source: MDN `@media/forced-colors` + `@media/prefers-contrast` + `<system-color>` PRIMARY (extracted 2026-08-28) + 2nd-source convergence ×3 (Sarah Higley forced-color-adjust footgun; benmyers.dev encyclopedia; codeslog) — ledger Q60 B-row, 9/9 verified, 0 corrections + 2 net-new + 1 boundary + 1 [needs-evidence] carried. Direct users: all web surfaces (DM Astro, DM cockpit, Ghostway PWA, OF web) — AI-generated UIs routinely break in HCM; iOS Safari / OF Android Compose unaffected.

### Q90 — CAPTCHA / bot-protection + form-spam UX · 2026-08-29
- **Default = NO visible CAPTCHA + invisible 4-layer stack** — W3C captcha-accessibility Note lists honeypots as the first resort; raise attacker cost without taxing disabled users. Stack: honeypot → rate-limit → timing/PoW → (only if needed) a visible challenge.
- **WCAG 1.1.1 CAPTCHA exemption is NARROW + a TWO-modality floor** — text alternative AND a different-sensory-output alternative; surrounding SCs (label/name/focus-order/error/2.2.1 timing) must fully conform. W3C confirms NEITHER modality serves deafblind users → the exemption is a legal floor, not accessibility.
- **Audio CAPTCHA is NOT the fix** — W3C: some disabled users still can't access; modern bots do speech recognition.
- **Prefer OSS self-hosted proof-of-work** — ALTCHA (MIT, GDPR/WCAG 2.2 AA/EAA, self-hostable, no cookies/fingerprinting, free core) or Cap (Apache-2.0). Turnstile/reCAPTCHA = closed-source + false-positive-on-VPN → rejected as a default (violates OSS-bias).
- **Honeypot a11y** — decoy field MUST be `aria-hidden=true` + `tabindex=-1` + `autocomplete=off` + NO own label (excluded from a11y tree + tab order + pw-manager fill). A LABELED decoy = silent-reject trap (confirmed mechanical in scratch/q90_honeypot). On suspected-bot, return a human-readable error (converges Q11/Q81), never a silent dead-end.
- **Never gate error recovery on a re-challenge** (converges Q11 preserve-work + 2.2.1).
- **BOUNDARY:** a visible CAPTCHA is still warranted for high-value public signup where a honeypot is insufficient → use OSS ALTCHA as the fallback; 'no visible CAPTCHA' = human forms only.
**One-shot build checklist line:** if the build has public forms (DM Astro contact/lead, DM cockpit public endpoints, OF web auth, Ghostway feedback), ship invisible honeypot bot-protection (aria-hidden + tabindex=-1 + autocomplete=off decoy, no label) + rate-limit + OSS ALTCHA/Cap fallback for high-value signup — NOT a visible CAPTCHA by default, NOT Turnstile/reCAPTCHA.
Source: WCAG 2.2 Understanding 1.1.1 + W3C captcha-accessibility WG Note PRIMARY + ALTCHA source (MIT) + Cap (Apache-2.0) + mechanical scratch/q90_honeypot — ledger Q90 B-row, 6/6 verified. Direct users: DM Astro contact/lead form (flagship), DM cockpit public endpoints, OF web auth, Ghostway feedback.

### Q227 — Voice / TTS output UX for navigation + language learning + audio management · 2026-09-03
- **Voice prompts = COGNITIVE OFFLOAD not burden** — Scientific Reports 2025 (40 adults 50-69, voice-only nav ↑relaxation vs paper map, SUS 60.5) + blog.coreforgeaudio 2026 (50-driver sim, auditory nav ↓breaches) → voice is a SAFETY FEATURE for active-guidance flows, not accessibility-only.
- **PROMPT TIMING = MOBILITY-SCALED** — IEEE AR-HUD 1500m = automotive 12.5 m/s. OsmAnd walking profile (1.11 m/s): "Go Ahead" = 333m max, "Turn now" = ~12m. Pedestrian optimal lead = 10-30m (10-30s). NEVER transplant automotive figures onto phone nav.
- **AUDIO DUCKING = pre-roll 100-200ms silence BEFORE first syllable** (myrouteapp forum + EP4694200A3 patent) to absorb Bluetooth/duck latency. Never start TTS at content onset — pad with leading silence.
- **PEDESTRIAN ≠ DRIVER mode** — OsmAnd profiles: driving 12.5 / cycling 2.78 / walking 1.11 m/s. HERE SDK warns against driver-maneuver notifications for pedestrian contexts.
- **TTS = target-language NATIVE PROSODY** (inworld.ai + spokio.pro) — 3-tier speed 0.85x/1.0x/1.15x (time-stretch flattens prosody). SSML <break> 150-250ms before key terms = convention-tier.
- **CONVERSATIONAL budget <1s** — VAD 150 + STT 150 + LLM TTFT 300 + TTS 150 + network 100 = ~850ms. Stream at sentence boundaries.
- **AUDIO SESSION = `audioSession.type='playback'`** bypasses iOS silent 16.4+ (caniuse Safari 16.4-26.3 ✅) but INCOMPATIBLE with getUserMedia (mic fails InvalidStateError). TTS-only nav = fine; voice-input apps need 'play-and-record'.
- **HYPE REJECTED:** voice-is-optional, faster-TTS-better, any-TTS-works-for-any-language, stream-full-response-then-speak, ducking-is-automatic, voice-is-accessibility-only.
**One-shot build checklist line:** if the build has voice prompts (Ghostway nav, JP-Lingo TTS), use mobility-scaled timing + pre-roll padding + audioSession.type='playback' (TTS-only) or 'play-and-record' (voice-input) + native-prosody TTS + 3-tier speed + stream at sentence boundaries.
Source: blog.coreforgeaudio.com (PRIMARY) + Scientific Reports 2025 + IEEE Access 2025 AR-HUD + myrouteapp + EP4694200A3 + HERE SDK + OsmAnd + inworld.ai + spokio.pro + youngju.dev + lovevoiceai + caniuse/MDN audioSession + RMIT CLEF 2019 + IMETI 2017 — ledger Q227 B-row, 7/10 verified on independent primaries. Direct users: Ghostway MapLibre PWA (flagship), JP-Lingo Android.

### Q229 — Map Interaction UX for Mobile PWA · 2026-09-05
- **MAP = CANVAS, details in bottom sheet** — keep map as focal point, overlay draggable bottom sheet snapping between collapsed/half/full detents. Detents map to content stages (peek ~15-20% / mid ~50% / full ~90%), NOT arbitrary 25/50/90 stops. Sync: tapping marker updates sheet; dragging sheet dims map interactivity. · SOURCE: Material Design 3 maps pattern + Apple HIG card-style + prisma-ui + shipnative + vp0.com. · VERIFIED.
- **Zoom = plus/minus buttons, position by hierarchy** — even with pinch-zoom, button zoom is universal convention. Corner placement driven by control hierarchy — avoid search/locate. · SOURCE: MapLibre NavigationControl + mapuipatterns.com. · VERIFIED.
- **Touch targets ≥44x44px + 8px spacing** — WCAG 2.2 2.5.8 = 24x24px AA floor, 44x44px AAA; Apple HIG = 44x44pt; Material Design = 48x48dp (5 independent sources). Map overlay controls need ≥44x44px hit area + 8px spacing; icon buttons need padding not visual scaling. · SOURCE: siteimprove.com + WCAG 2.2 + lighthouse-md.com + webability.io + humanstandards.org. · VERIFIED.
- **Offline map download = MUST-have for nav apps** — workflow: search/navigate → Save Map Area → confirm → name → appears in downloaded list. Show package size before download. · SOURCE: mapuipatterns.com + cached.space. · VERIFIED.
- **Offline cache = stale-while-revalidate tiles + network-first routes** — Service Worker with two caches: Cache Storage for tiles & assets, IndexedDB for routes/search. iOS Safari SW gotchas: cache.put() with redirected responses FAILS (wrap in new Response()); network-first is SLOW (trust navigator.onLine=false); iOS may evict SW cache after 7 days. · SOURCE: cached.space + caches.link + w3tweaks.com + dcdhameliya.com. · VERIFIED.
- **Standard map gestures** — two-finger rotate, long-press to drop pin, double-tap to zoom. Show one-time gesture hints for new users. · SOURCE: MapLibre docs + MapLibre Compose docs. · VERIFIED.
- **Marker interaction = tap to select, popup/callout for details** — markers must be ≥44x44px tap targets. Popups for brief info, bottom sheets for rich detail. · SOURCE: mapuipatterns.com. · VERIFIED.
- **Clustering for >100 points, animate split on zoom** — bridge spatial distribution (zoomed out) and point-level detail (zoomed in). Alternative: point rendering with opacity for <10k points on MapLibre. · SOURCE: mapuipatterns.com + hndebrief.com. · VERIFIED.
- **iOS offline bottleneck** — Safari tab ~50MB evictable cap, "several hundred MB" installed PWA; Apple does NOT guarantee persistence (navigator.storage.persist() not fully supported); 7-day cache expiry if unused; clearing Safari history purges PWA caches.
- One-shot build checklist line: if the build is a map-driven PWA (Ghostway flagship), map = canvas + bottom sheet progressive disclosure + zoom buttons positioned by hierarchy + ≥44x44px touch targets + offline tile caching (stale-while-revalidate) + network-first routes + marker popups + clustering for >100 points.
Source: mapuipatterns.com (PRIMARY) + webdevs.cloud + siteimprove.com + cached.space + caches.link + MapLibre Compose docs + hndebrief.com + Material Design 3 + Apple HIG — ledger Q229 B-row, 8/8 verified on independent primaries. Direct user: Ghostway MapLibre PWA iPhone (flagship).

### Q230 — PWA Update Notification UX · 2026-09-05
- **Detect via updatefound + statechange** — register SW → listen for `updatefound` → track `reg.installing` → when `newWorker.state === 'installed'` AND `navigator.serviceWorker.controller` exists, trigger notification. BOUNDARY: `controllerchange` fires on FIRST SW too → naive pattern = infinite reload loop. FIX: only reload if old controller existed (verified in scratch/q230-update-flow-test.html). · SOURCE: web.dev Learn PWA Update + progressier.com + dev.to/thepassle + hashhackers.com + blog.pixelfreestudio.com. · VERIFIED.
- **Dismissible non-intrusive notification** — toast/snackbar/banner at bottom with "Refresh" button. Never a blocking modal. · SOURCE: deanhume.com + toplyne-engineering + pixelfreestudio. · VERIFIED.
- **skipWaiting + controllerchange reload flow** — post `{type: 'SKIP_WAITING'}` to `registration.waiting` → wait for `controllerchange` → reload. CRITICAL: `registration.waiting` can be NULL — guard before postMessage. Store `refreshing` flag to prevent double-reload. · SOURCE: progressier.com + deanhume.com + toplyne-engineering. · VERIFIED.
- **SW cache headers = no-cache MANDATORY** — `service-worker.js` MUST be served with `Cache-Control: max-age=0,no-cache,no-store,must-revalidate`. `no-cache` not `no-store`; max-age capped at 24h; `updateViaCache: 'none'` recommended. · SOURCE: toplyne-engineering + StackOverflow 38843970 + hasura.io + pub.dev/sw. · VERIFIED.
- **Periodic update checks for long-lived sessions** — `registration.update()` every 30-60 min via setInterval. No optimal value, varies by app criticality. · SOURCE: hashhackers.com + toplyne-engineering + stevekinney.com. · VERIFIED.
- **Auto-update on navigation (opinionated)** — auto-refresh on next navigation if user ignores notification. Works for SPA, never mid-form. · SOURCE: toplyne-engineering. · VERIFIED.
- **SW debugging escape hatch** — `getRegistrations()` → `unregister()` to kill buggy SW. Broken SW = bricked client until unregistered or 24h passes. · SOURCE: toplyne-engineering. · VERIFIED.
- One-shot build checklist line: if PWA with SW updates (Ghostway flagship), detect via updatefound + statechange, show dismissible bottom-anchored toast, skipWaiting + controllerchange before reload, serve SW with no-cache headers, poll for updates every 30-60 min, and have an unregister() escape hatch for buggy SW.
Source: web.dev + progressier.com + deanhume.com + toplyne-engineering + reintech.io + toolforte.com — ledger Q230 B-row, 7 rules verified on independent primaries. Direct user: Ghostway MapLibre PWA (frequent updates pushed to field users).

### Q231 — iOS PWA viewport/keyboard/safe-area trap cluster · 2026-09-05
- **Viewport permanently shrinks ~59px after keyboard close** on iOS 17/18 standalone PWA (not mobile Safari) — 5 independent sources (dev.to/cederhook + Reddit r/Frontend + Apple Developer Forums + paragraph.com/@ano + gunbark.dev). healViewport hack = only recovery. ~59px = Pro Max scale, varies by device. iOS 26.1 introduced additional permanent-shrink variant. Reddit 26.2 beta fixes some canvas issues but NOT the standalone-PWA shrink. BOUNDARY: standalone-PWA-only; innerHeight drops, NOT just visualViewport.height.
- **getCurrentPosition HANGS indefinitely** in standalone PWA under "Ask Next Time" — StackOverflow 67924991 55+ upvotes + Apple Developer Forums + Ionic/Capacitor #91. Native timeout does NOT fire. Promise.race ~4s = canonical workaround. BOUNDARY: requires "Ask Next Time" + standalone; regular Safari works.
- **env(safe-area-inset-*) = 0 until viewport-fit=cover** — 5 sources (CSS-Tricks "The Notch" + botensten + 1440px + Tauri 2 guide + MDN). Opt-in gate unchanged since iOS 11.1.
- **iOS 26 separate bug = visualViewport.height ~24px undershoot** after keyboard (botensten + Apple Developer Forums + code-examples.net). Combine with the 59px permanent shrink for full Ghostway iPhone coverage.
- **Cargo-cult debunked:** "dvh fixes the keyboard" (Q115 — dvh fixes URL bar, NOT keyboard); "safe-area-inset is automatic" (opt-in via viewport-fit=cover); "getCurrentPosition works the same in standalone" (it hangs).
- One-shot build checklist line: if the build is an iPhone PWA (Ghostway flagship), wrap getCurrentPosition in Promise.race ~4s timeout, set viewport-fit=cover + env(safe-area-inset-*) on all edge-anchored UI, and test viewport restore after keyboard on real iOS hardware.
Source: dev.to/cederhook + Reddit r/Frontend + Apple Developer Forums + paragraph.com/@ano + gunbark.dev + StackOverflow 67924991 + CSS-Tricks + botensten + 1440px + Tauri 2 + MDN — ledger Q231 B-row, 3 rules verified on 5+ independent sources each. Direct user: Ghostway MapLibre PWA iPhone (flagship).

### Q232 — Form Design & Input Validation UX · 2026-09-06
- **Single-column = DEFAULT for mobile-first** — reduces decisions (0 vs 5+) and scan-path zigzag. CORRECTION: the \"15.4% conversion lift\" is MISATTRIBUTED — CXL origin = 15.4 SECONDS faster, not %; Baymard's 35% = broad checkout improvement, not single-column specifically; HubSpot A/B found 2-column beat 1-column by 22% (counterexample exists). Speed ≠ conversion. RULE: single-column = default for mobile-first; reduces decisions and scan-path zigzag.
- **Top-aligned labels = FASTEST** — 50ms single fixation vs 500ms zigzag saccade (uxmatters.com + Wroblewski eye-tracking). RTL: \"top-aligned\" = label above input (block-axis), independent of inline direction; formsite.com recommends top-right for RTL. No RTL eye-tracking study — LTR transfer assumed.
- **Validate on blur = 22% fewer errors** vs submit-time; real-time BEFORE user finishes = hostile (\"grading test before student finishes\"). Once errored, re-validate on every input (live-clear).
- **Error messages = explicit + constructive + below field** — plain language + specific fix + below field + preserve erroneous input. Error border AND text (color never sole signal — Q17); `role=\"alert\"` on MESSAGE only.
- **GOV.UK three-step error pattern = a11y gold standard** — (a) \"Error:\" prepended to title, (b) error summary at top with `role=\"alert\"` + focus moved to it, (c) per-field message with same wording as summary + `aria-describedby` association.
- **Field count = aggressive reduction** — each additional field drops conversion ~4.1% (directionally; specific 3-field=23.1% vs 10-field=6.9% CVR = VENDOR-TIER/methodologically opaque). Audit every field.
- **Placeholder ≠ label** — disappears on typing = working-memory load; light gray fails WCAG contrast. Never placeholder-as-sole-label.
- **Match field width to expected input** — city ~19 chars, zip ~5-10 chars, phone ~15 chars, email ~30-40 chars. Visual length hint reduces errors.
- **Multi-step only for 7+ fields** — 3-5 steps optimal; spike at 6+; 41% abandon past 3 steps (Baymard) = upper bound. Specific completion % (55-65%, 65-78%) = VENDOR-TIER. Multi-step only when >6 fields AND step 1 genuinely lower-friction.
- **Sticky CTA on mobile = SCOPE-LIFTED** — all documented lifts are e-commerce PDP/checkout (Shopify 8-12%, 3-7%); ZERO data for lead capture/login/settings. Only works when CTA scrolls off-screen. Not universal.
- **Mobile input types = correct keyboard** — `type=email/tel/number` triggers appropriate mobile keyboard; +3-6% mobile completion.
- **Avoid Reset/Clear buttons** — accidental deletion risk outweighs need. Cancel OK for sensitive forms, less prominent than Submit.
- **Field grouping = Gestalt proximity** — related fields grouped reduces perceived length; proximity signals relationship.
- **Error color contrast ≥4.5:1** — light/pastel reds (#FF8C8C = 2.89:1) FAIL AA; use #CF222E (5.92:1 AA) or #A40E26 (8.23:1 AAA).
Source: nngroup.com + Baymard + CXL + uxmatters.com + design-system.service.gov.uk + fomr.io + formsite.com + wemasy + voiceforms + woobox + powr.io + logoswebdesigns.com (vendor-tier) + mechanical scratch test — ledger Q232 B-row, 14 rules verified on independent primaries (4 [needs-evidence] flags resolved: 15.4% misattributed, sticky CTA scope-lifted, multi-step step count directional, RTL label placement). Direct users: DM admin cockpit + Open Finance Android + Deseret Marketing.

### Q233 — First-Run Onboarding & Progressive Disclosure UX · 2026-09-07
- **DEFAULT NO ONBOARDING** — test with none first; deck-of-cards = anti-pattern; 3 justified cases only (complex setup, novel gestures, legal consent). Feature promotion = avoid at launch, highlight in-context. Customization = content OK, visual NOT. · SOURCE: NN/g mobile-app-onboarding + NN/g onboarding-tutorials. · VERIFIED.
- **PUSH vs PULL revelations** — push = disruptive/forgotten/skipped; pull = effective/timely/memorable. Ship guidance contextually (5 pull rules). · SOURCE: NN/g. · VERIFIED.
- **Permission timing = in-context, benefit-framed** — +30-40% opt-in. Never ask at launch for permissions not immediately needed. · SOURCE: NN/g + Apple HIG + Material Design. · VERIFIED.
- **Benefit-oriented onboarding = 3-4 screens max** — exponential drop-off: 38% at screen 1, 3-step=72%, 7-step=16%. 15%/screen = simplification, not exact. · SOURCE: mobileapp.wiki + UserGuiding/Amra&Elma + Pendo + Userpilot + Chameleon. · VERIFIED.
- **Progressive disclosure = 20-40% faster** — Chameleon 15M dataset: linear=53% completion → behavior-triggered=75%. Hotjar 35% fewer tickets = convention-tier. · SOURCE: digia.tech + chameleon.io. · VERIFIED.
- **Value-first onboarding = B2B+B2C differ** — B2C assumes motivation exists; B2B must CREATE motivation + remove friction. B2B needs aha moment for multiple personas (exec/admin/end-user) simultaneously. · SOURCE: gummble.com + adoptkit.com + productgrowth.in. · VERIFIED.
- **Apple HIG onboarding rules** — no splash, dive in, skip + never show to returning users, learn by doing, anticipate help. · SOURCE: Apple HIG. · VERIFIED.
- One-shot build checklist line: if the build has first-run onboarding (Ghostway, JP-Lingo, DM cockpit, Deseret Marketing), default to NO onboarding; if justified, 3-4 screens max + pull revelations + in-context permissions + value-first (portfolio before sign-up).
Source: NN/g mobile-app-onboarding + NN/g onboarding-tutorials + Apple HIG + Material Design + digia.tech + mobileapp.wiki + gummble.com + chameleon.io + usertourkit.com + adoptkit.com — ledger Q233 B-row, 9 rules verified on independent primaries. Direct users: Ghostway MapLibre PWA + JP-Lingo Android + DM admin cockpit + Deseret Marketing.

### Q234 — Search UX & Filtering Patterns · 2026-09-08
- **Search box = VISIBLE expanded input, NOT icon-only** — hiding search behind magnifying glass icon = #1 search UX mistake. Replacing icon with visible expanded search box ↑91% usage (NN/g PRIMARY: Jakob Nielsen useit.com experiment). 97.8% of Shopify stores fail visible search bar check (EcomHint). · SOURCE: NN/g search-visible-and-simple PRIMARY + EcomHint. · VERIFIED.
- **Search field width = 27-30 chars min, 350px+ desktop** — NN/g recommends ≥30 chars without scroll. Algolia: 27-30 chars optimal. 350px ≈ 37-40 chars at 16px font. · SOURCE: NN/g + Algolia + Baymard. · VERIFIED.
- **Autocomplete = 80% of sites have it, only 19% get it right** — Baymard: 69% fail misspelled queries. Algolia: well-configured autocomplete boosts conversion ~24% (vendor, convention-tier). · SOURCE: Baymard autocomplete-design PRIMARY + Algolia. · VERIFIED.
- **8 query types, 56% of sites fail** — Baymard 2026: Exact Product Name, Product Type, Symptom, Feature, Use Case, Compatibility, Abbreviation/Symbol, Non-product. 69% fail misspelling, 54% fail abbreviations, 66% fail non-product. · SOURCE: Baymard 2026 PRIMARY (170 sites). · VERIFIED.
- **Filter logic = AND across categories, OR within category** — users expect AND between filter types (Color=Red AND Size=M) but OR within a type (Color=Red OR Color=Blue). This is the #1 filter logic mistake. · SOURCE: Baymard + edana.ch + hybrismart. · VERIFIED.
- **Filter chips vs faceted panel = choose by complexity** — chips = few high-frequency toggles directly above content (≤5-7 options). faceted panel = many options, ranges, dates, grouped fields. Applied filters = removable chips near results. Always provide "Clear All". · SOURCE: Material Design 3 + uxpatternsguide.com + saasui.design. · VERIFIED.
- **Inline filtering vs Apply button = match complexity** — inline (instant refresh) = good for 1-2 filters with fast results. Apply button = required for complex multi-filter composition. · SOURCE: edana.ch + Baymard + saasui.design. · VERIFIED.
- **No-results state = acknowledge query + suggest alternatives + offer fallback** — generic "No results" = conversion killer. Must: (a) echo the search term, (b) suggest alternatives, (c) offer fallback action, (d) check for typos. · SOURCE: LogRocket + eleken.co + gummble.com + setproduct.com. · VERIFIED.
- **Combobox ARIA pattern = role="combobox" + aria-expanded + aria-activedescendant** — autocomplete MUST use combobox pattern: input has role="combobox", aria-expanded, aria-autocomplete="list", aria-owns="listbox-id"; listbox has role="listbox" + aria-live="polite"; active option via aria-activedescendant (focus stays on input, DO NOT move focus into list). Escape closes + clears. Enter commits active. mousedown (not click) commits row. · SOURCE: WAI-ARIA 1.2 + dev.to + voorhoede.nl. · VERIFIED.
- One-shot build checklist line: if the build has search (Ghostway location search, DM cockpit data filtering, OF transaction search, Deseret Marketing portfolio filtering), search = visible expanded input (NOT icon-only) + field width ≥350px desktop + autocomplete with misspelling tolerance + filter logic AND-across/OR-within + filter chips for simple toggles + faceted panel for complex filters + Apply button for complex filtering + no-results = echo query + suggest alternatives + combobox ARIA pattern.
Source: NN/g search-visible-and-simple + Baymard autocomplete-design + Baymard 2026 query types + Algolia + Material Design 3 + dev.to + voorhoede.nl + LogRocket + eleken.co + gummble.com + setproduct.com + edana.ch + saasui.design + hybrismart — ledger Q234 B-row, 10 rules verified on independent primaries (5 [needs-evidence] flags resolved: 91% lift primary source, 24% Algolia lift directional, 19% benchmark confirmed, 8 query types 56% fail confirmed, 350px min-width confirmed). Direct users: DM admin cockpit (faceted data filtering, autocomplete, filter chips) + Ghostway (location search, POI filtering) + Open Finance (transaction search, category chips, amount filters) + Deseret Marketing (portfolio filtering, service search).

### Q235 — Animation & Motion UX for Web + Mobile · 2026-09-08
- **Duration = 100-500ms working window** — 100ms simple feedback (toggle/press), 200-300ms substantial changes (modal/drawer), 300-500ms full-page transitions. Mobile = 20-30% SHORTER. Too-long animations are the more common failure. · SOURCE: NN/g animation-duration PRIMARY. · VERIFIED.
- **Easing = purpose-tied** — ease-out (cubic-bezier(0.2,0,0,1)) for ENTRANCES; ease-in for EXITS; ease-in-out for STATE TOGGLES; LINEAR ONLY for spinners/indeterminate progress. M3 standard = cubic-bezier(0.2,0,0,1). · SOURCE: Material Design 3 + NN/g. · VERIFIED.
- **Performance = transform + opacity ONLY** — GPU-composited, skip layout+paint. Frame budget 16.67ms @60fps. NEVER animate width/height/top/left/margin. Use transform:scale() not width; translateY() not top. · SOURCE: NN/g + 4 independent sources. · VERIFIED.
- **Spring physics = gesture + spatial motion** — springs for position/scale/rotation/gesture-driven motion (feels physical). Curves for opacity/color/value-between-two-points. React Spring default = ζ=0.997 (critically damped, NOT bouncy despite name); motion.dev default = ζ≈0.5 (bouncy) — same word, opposite feel. · SOURCE: Josh Comeau PRIMARY + open-design/nexu-io. · VERIFIED.
- **Staggered lists = 30-60ms offsets** — cascading entries ↑ comprehension ~30%. "40ms feels alive, 200ms feels slow." · SOURCE: Airbnb RN observation via moldstud.com + Shipnative.dev + Keyframer. · VERIFIED.
- **Two-animations-per-screen LIMIT** — >2 distinct animation effects per screen = cognitive overload. One primary transition + one secondary feedback max. · SOURCE: NN/g via moldstud.com + Hashbyt 2024 NN/g study. · VERIFIED.
- **Motion tokens = design-system peers to color/spacing** — duration tokens (--ds-motion-duration-fast:100ms, base:200ms, slow:300ms) + easing tokens (--ds-motion-ease-out, ease-in, ease-standard). M3 exact: short1=50…extraLong4=1000ms (monotonic, 3 mirrors: @tinybigui/tokens, Flutter codebrowser.dart, pub.dev M3Motion). · SOURCE: adamarant.com 2026 + IBM Carbon + Atlassian + M3. · VERIFIED.
- **Accessibility = strip translate/scale/rotate, keep opacity crossfades** — every animation respects @media (prefers-reduced-motion: reduce). STRIP motion-on-axis; KEEP opacity/color crossfades. View Transitions API does NOT auto-apply — author must override. WCAG 2.2.2 = Level A. · SOURCE: WCAG 2.2.2 + nexu-io/open-design + W3C View Transitions. · VERIFIED.
- **will-change = sparingly** — too many GPU-promoted layers = VRAM bloat on mobile. Scope to actively-animating elements only; remove when done. · SOURCE: agiletechguru.com 2026 + browser compositing docs. · VERIFIED.
- **Functional ≠ Decorative** — motion must do a job (confirm action, show state change, guide attention). Animation that delays content access the user already decided to open = anti-pattern. RULE: if removed, does the user lose information? · SOURCE: adamarant.com 2026 + summetworks.com + art-ofstyleframe.com. · VERIFIED.
- **Where NOT to animate:** never above the fold (hero must read instantly, Q6), never on dashboards/tools/Operate surfaces (DM cockpit, Ghostway map+list — instant content beats delight).
- **M3 motion tokens (Open Finance Android):** short1=50 / short2=100 / short3=150 / short4=200 / medium1=250 / medium2=300 / medium3=350 / medium4=400 / long1=450 / long2=500 / long3=550 / long4=600 / extraLong1-4=700-1000ms = monotonic, 3 independent sources.
- **4 [needs-evidence] flags resolved:** (a) Airbnb RN stagger = CONFIRMED secondary-source; (b) M3 tokens = CONFIRMED monotonic; (c) Two-animations-per-screen = CONFIRMED; (d) React Spring zeta = CONFIRMED via scratch calc (ζ=0.997 = critically damped).
- **Cross-refs:** Q11 (Q235 = COMPONENT MOTION, Q11 = COMPONENT STATES), Q229 (Q235 = MAP TRANSITIONS, Q229 = MAP INTERACTION), Q232 (Q235 = FORM FIELD FEEDBACK, Q232 = FORM UX), Q233 (Q235 = ONBOARDING ANIMATION, Q233 = ONBOARDING PATTERNS), Q188 (Q235 = SCROLL-TRIGGERED REVEAL, Q188 = SCROLL ANCHORING).
- **One-shot build checklist line:** if the build has animation (Ghostway map transitions/bottom sheet/page transitions, JP-Lingo card flips/screen transitions/progress rings, DM Astro scroll-reveals/hero entrance/card hover, OF chart transitions/list stagger/pull-to-refresh), duration 100-500ms (mobile shorter) + easing purpose-tied + transform+opacity only + springs for gesture + stagger 30-60ms + two-per-screen limit + motion tokens + reduced-motion strip + will-change scoped + functional-only.
Source: nngroup.com/articles/animation-duration (PRIMARY) + material.io/design/motion (PRIMARY) + joshwcomeau.com/animation/a-friendly-introduction-to-spring-physics (PRIMARY) + joshwcomeau.com/animation/linear-timing-function (PRIMARY) + github.com/nexu-io/open-design craft/animation-discipline.md (PRIMARY) + adamarant.com/en/blog/functional-ui-animation-in-2026-the-checklist-before-it-ships (2026) + art-ofstyleframe.com/blog/micro-interactions-ui-when-to-animate + summetworks.com/blog/motion-design-principles + csstools.io blog/css-animation-performance + spell.sh/blog/web-animation-performance + agiletechguru.com framer-motion-gpu + sabaoon.dev/material-expressive — ledger Q235 B-row, 10 rules verified on independent primaries (4 [needs-evidence] flags resolved). Direct users: Ghostway MapLibre PWA + JP-Lingo Android + Deseret Marketing Astro + Open Finance Android.

### Q236 — Mobile Navigation & Wayfinding UX · 2026-09-09
- **3-LEVEL HIERARCHY LIMIT** — NN/g ≤2-3 levels consumer; calmops.com 3-level max. Baymard 2023: 32% mobile nav errors; 4+ levels nearly DOUBLE error rate vs ≤2 levels. EXCEPTION: data-drilldown dashboards may need 4. · SOURCE: NN/g + Baymard 2023 + calmops.com. · VERIFIED.
- **MOBILE SESSION = 72 SECONDS AVG** — NN/g: average mobile session is 72s vs 150s desktop. Navigation must be instantly comprehensible. · SOURCE: NN/g mobile-ux. · VERIFIED.
- **iOS 26 Liquid Glass TAB BAR = tabBarMinimizeBehavior** — WWDC 2025 video 284; createwithswift.com confirms; medium.com/design-bootcamp confirms 3-layer stack (Tab Bar/Accessory/Toolbar). Collapses on scroll but must remain reachable — don't hand-roll hiding nav. · SOURCE: Apple WWDC 2025 + createwithswift.com + medium.com/design-bootcamp. · VERIFIED.
- **TAB BAR = persistent, bottom-anchored, ≤5 items** — Apple HIG: 5 items max (more = "More" tab), icon + text label. Hamburger = lowest usability (NN/g). · SOURCE: Apple HIG + NN/g. · VERIFIED.
- **Navigation labels = short + scannable + icon + text** — icon + text labels outperform icon-only. Labels must be ≤2 words. · SOURCE: Apple HIG + NN/g. · VERIFIED.
- **Back button = top-left, standard chevron** — iOS: top-left with chevron + previous page title. Android: top-left arrow or bottom nav. Never hide the back affordance. · SOURCE: Apple HIG + Material Design. · VERIFIED.
- **Active state = clearly distinguished** — current screen/tab must be visually distinct (filled icon + bold label, or color accent). Users must always know where they are. · SOURCE: Apple HIG + Material Design 3. · VERIFIED.
- **Avoid nested navigation patterns** — don't put a tab bar inside a hamburger menu or vice versa. Pick ONE primary nav pattern per app level. · SOURCE: NN/g + Apple HIG. · VERIFIED.
- **Gesture navigation = supplementary only** — swipe gestures (edge swipe back, swipe between tabs) are accelerators, not the primary path. Always provide visible button/tab alternatives. · SOURCE: Apple HIG + NN/g. · VERIFIED.
- **One-shot build checklist line:** if mobile nav (Ghostway + JP-Lingo + OF + DM cockpit), hierarchy ≤3 levels + 72s session + tab bar ≤5 items + icon + text labels + iOS 26 tabBarMinimizeBehavior + hamburger = avoid.
Source: Apple HIG + PLOS ONE 2026 Savino et al. n=195 + NN/g + Baymard 2023 + calmops.com + WWDC 2025 + MD3 — ledger Q236 B-row, 9 rules verified on independent primaries. Direct users: Ghostway MapLibre PWA + JP-Lingo Android + Open Finance Android + DM admin cockpit.

### Q237 — Micro-interactions & Feedback UX · 2026-09-09
- **MICRO-INTERACTION = TRIGGER-FEEDBACK PAIR** — every interactive element needs a distinct trigger-feedback pair; 4-part anatomy (Trigger→Rules→Feedback→Loops/Modes). No feedback = dead button. · SOURCE: NN/g microinteractions. · VERIFIED.
- **RESPONSE TIME THRESHOLDS = 3 BUCKETS** — Nielsen 1993 (confirmed verbatim): <100ms = instantaneous (no indicator); 100ms-1s = noticeable delay (spinner/skeleton); 1s-10s = losing attention (progress bar). Delay loading indicator by 100-200ms — if action completes before delay, skip indicator (avoids flash of spinner). · SOURCE: Nielsen 1993 + nngroup.com/response-times-3-important-limits. · VERIFIED.
- **BUTTON PRESS FEEDBACK = SCALE 0.95 + 100-150ms** — active state = transform: scale(0.95) OR translateY(2px), duration 100-150ms, ease-out. 3% scale reduction = sweet spot (1-2% invisible, 5%+ cartoonish). Every button needs distinct hover/active/pressed states. · SOURCE: theuxshop.com + rune.codes + art-ofstyleframe.com. · VERIFIED.
- **TOAST/SNACKBAR TIMING = CONTENT-TIERED** — Short (3-4s): brief acknowledgments ("Saved", "Copied"); Medium (5-7s): meaningful events ("Invited 3 team members"); Long (10-15s) or persistent: requires action ("Deleted post — Undo?"). Success = auto-dismiss 3-5s; warning = 5-7s; actionable error = NO auto-dismiss. · SOURCE: vibeweek.ai + thehangline.com + humanstandards.org + linkedin.com/pulse. · VERIFIED.
- **UNDO PATTERN = SOFT-DELETE + TOAST WITH ACTION** — prefer undo over confirmation dialogs for reversible actions. Pattern: item disappears immediately (optimistic update) → toast appears with "Undo" action → actual deletion fires on toast expiry or navigation. Undo window = 6-10s. · SOURCE: uxpatternsguide.com + saasui.design + themotiondesign.com. · VERIFIED.
- **TOGGLE VS CHECKBOX VS RADIO = SEMANTIC DISTINCTION** — toggle = immediate action (on/off, no submit); checkbox = selection to confirm later (Save button needed); radio = mutually exclusive single choice from visible set. · SOURCE: setproduct.com + Apple HIG + MD3. · VERIFIED.
- **HAPTICS = PAIR WITH VISUAL, NEVER REPLACE** — haptics confirm through the skin what the screen shows (action confirmed, boundary hit, detent crossed, error). iOS vocabulary: UINotificationFeedbackGenerator (success/warning/error), UIImpactFeedbackGenerator (light/medium/heavy), UISelectionFeedbackGenerator (ticks). Haptics always paired with visible state; never sole channel for information (WCAG 1.3.3). · SOURCE: ux.detroit3d.com + Apple HIG. · VERIFIED.
- **OPTIMISTIC UI = UPDATE IMMEDIATE, ROLLBACK ON ERROR** — for high success-rate actions, update UI immediately before server confirmation. If server fails, show error toast + revert UI. · SOURCE: humanstandards.org + vibeweek.ai. · VERIFIED.
- **FOCUS INDICATORS = NEVER ANIMATED AWAY** — focus ring must be visible at all times for keyboard users. Never animate focus indicator away or use motion to hide it. · SOURCE: theuxshop.com + WCAG 2.2. · VERIFIED.
- **BOUNDARIES** — Nielsen thresholds = bedrock (1993 primary confirmed verbatim); 22% task-completion lift = UNVERIFIED (traces to 2023 ACM TMIS easter-egg study, not microinteractions); 100-200ms delay-before-indicator = CONVENTION-TIER (practitioner convention, NOT NN/g-endorsed); hover-to-pause on toasts = CONVENTION-TIER (no Apple HIG/Material Design/NN/g primary documents it). · SOURCE: SLOT B 2026-09-09. · VERIFIED.
- **One-shot build checklist line:** if the build has interactive elements (buttons, toggles, forms, toasts, loading states), every element = trigger-feedback pair + response-time-thresholds + button press scale 0.95 @ 100-150ms + toast timing content-tiered + undo = soft-delete + toggle/checkbox/radio semantic distinction + haptics paired + optimistic UI for high-confidence + focus indicators never animated away.
Source: nngroup.com/articles/microinteractions + nngroup.com/articles/response-times-3-important-limits + theuxshop.com + rune.codes + art-ofstyleframe.com + socialanimal.dev + vibeweek.ai + thehangline.com + humanstandards.org + linkedin.com/pulse + uxpatternsguide.com + saasui.design + themotiondesign.com + setproduct.com + ux.detroit3d.com + Apple HIG — ledger Q237 B-row, 10/10 verified, 4 [needs-evidence] flags resolved. Direct users: DM admin cockpit + Open Finance Android + Ghostway MapLibre PWA + JP-Lingo Android + Deseret Marketing.

### Q238 — Data Visualization & Chart Design UX · 2026-09-09
- **CHART TYPE = MATCH THE QUESTION** — bar = comparison, line = trend, scatter = relationship; pie/stacked/bubble = avoid when simpler works. Every chart must answer "compared to what?" · SOURCE: NN/g choosing-chart-types PRIMARY. · VERIFIED.
- **Preattentive encoding = POSITION > LENGTH > ANGLE > AREA > VOLUME** — Cleveland & McGill 1985 Science (229:828-833, confirmed verbatim); Heer/Bostock 2010 crowdsourced replication. CORRECTION: original Q238 rule stated "LENGTH > POSITION" — actual hierarchy is POSITION > LENGTH. Encode the most important quantitative variable using 2D position (scatter/line) or length (bar). · SOURCE: Cleveland & McGill 1985 Science PRIMARY. · VERIFIED.
- **Direct labels > legends** — NN/g clutter-charts verbatim: "Legends require people to quickly look back and forth... It's easier for people to process these series if we place the meaningful labels directly on each line." Also more accessible for CVD. · SOURCE: NN/g clutter-charts PRIMARY. · VERIFIED.
- **Color = categorical NOT quantitative** — use color to distinguish categories, not to encode quantitative value. 8% men CVD → CVD-safe palette mandatory; never color-only encoding (WCAG 1.4.1). · SOURCE: 5of10.com + Carbon Design System. · VERIFIED.
- **Stacked bars = avoid** — 2× error rate of aligned position judgements (Cleveland & McGill 1984/1985; Talbot et al. 2014 PubMed 26356929 replicates). Worst for mid-chart segments; OK for bottom-aligned totals. · SOURCE: Talbot et al. 2014 + NN/g choosing-chart-types. · VERIFIED.
- **Data-ink ratio = maximize** (Tufte 1983) — erase non-data-ink, remove chartjunk. "Chartjunk" threshold depends on audience; a little decoration can aid engagement for exec audiences. · SOURCE: Tufte 1983 PRIMARY. · VERIFIED.
- **Mobile charts = tap + reduce density + skeleton loading** — no hover on mobile; reduce visible series; skeleton loading for chart containers. · SOURCE: plotset.com + Carbon Design System. · VERIFIED.
- **Chart touch targets = 48x48 dp minimum** — Apple HIG 44pt + Material Design 48dp converge; interactive chart points NOT exempt from WCAG 2.2 2.5.8 24x24 AA floor. · SOURCE: Apple HIG + Material Design + WCAG 2.2. · VERIFIED.
- **5-7 bar mobile limit = CONVENTION-TIER** — plotset.com + querio.ai cite it; NO primary source found — likely extrapolated from Miller's 7±2 cognitive limit. Use directionally, not as hard rule. · SOURCE: practitioner convention. · VERIFIED DIRECTIONALLY.
- **Every chart needs context** — comparison baseline, target reference, min/max. A chart without "compared to what?" is decoration. · SOURCE: NN/g dashboards-preattentive. · VERIFIED.
- **CVD-safe palette mandatory** — 8% men affected. Use patterns + labels + color, never color alone. Test with grayscale filter — if information disappears = color-only encoding = a11y failure. · SOURCE: 5of10.com + WCAG 1.4.1. · VERIFIED.
- **Bar charts MUST have zero baselines** — truncating the baseline exaggerates differences. · SOURCE: sharedcontext.ai + Perceptual Edge. · VERIFIED.
- **Sparklines need context** (min/max/target) — a sparkline without reference is decoration. · SOURCE: sharedcontext.ai. · VERIFIED.
- **One-shot build checklist line:** if the build has charts/data viz (DM admin cockpit flagship, Open Finance Android transaction charts, Deseret Marketing analytics), chart type = match the question (bar/line/scatter, avoid pie/stacked) + encoding = position > length > angle > area > volume + direct labels > legends + color categorical not quantitative + stacked bars avoid + maximize data-ink + mobile = tap + reduce density + skeleton loading + touch targets ≥48x48 dp + CVD-safe palette + bar charts zero baselines + sparklines need context + every chart answers "compared to what?".
Source: nngroup.com/articles/choosing-chart-types (PRIMARY) + nngroup.com/articles/dashboards-preattentive-attributes (PRIMARY) + nngroup.com/articles/clutter-charts (PRIMARY) + Cleveland & McGill 1985 Science (229:828-833, PRIMARY) + Tufte 1983 (PRIMARY) + Talbot et al. 2014 (PubMed 26356929, PRIMARY) + 5of10.com + plotset.com + Carbon Design System — ledger Q238 B-row, 10 rules verified on independent primaries. 4 [needs-evidence] flags resolved (stacked bar error rate, 5-7 mobile limit convention, chart touch targets, direct labels > legends). Cleveland hierarchy correction captured (POSITION > LENGTH, not LENGTH > POSITION). Direct users: DM admin cockpit (flagship) + Open Finance Android + Deseret Marketing.

### Q239 — Data Table UX, Inline Editing & Responsive Tables · 2026-09-09
- **TABLE = 5 PARTS** — toolbar, header, body, footer, sticky. Every table surface needs all five; omit only with justification. · SOURCE: setproduct.com + saasui.design + uxpatternsguide.com. · VERIFIED.
- **Alignment = text-left/numbers-right** — numbers right-aligned so digits line up by place value for magnitude comparison; dates pick one side, consistent. · SOURCE: NN/g Data Tables Four Major User Tasks + setproduct.com + eleken.co. · VERIFIED.
- **~1,000 row client-side threshold** — <1,000 rows = client-side fine; 1k-10k = virtualize; 10k+ = server-side. Lighthouse "excessive DOM" at ~1,400 body nodes. Mechanical: q239-row-threshold.js — 1k rows = 0.20ms, 5k = 1.36ms, 10k = 2.26ms. · SOURCE: allahabadi.dev + react-data-table-component + sujeet.pro + dominatetools.com. · VERIFIED.
- **3 density modes = CONVENTION-TIER** — compact 28-36px / comfortable 44-56px / spacious 60-72px. User-persisted. Touch-first tables need ≥44px rows or separate ≥44px action targets; compact tiers = desktop/analyst. · SOURCE: setproduct.com + saasui.design. · VERIFIED DIRECTIONALLY.
- **Inline edit = discoverable affordance + 7 states** — persistent (not hover-hidden) edit affordance; Enter/F2 to edit, Escape cancels without saving, Enter commits + advances; blur-save only with explicit feedback; keep pre-edit value for cancel (truthful-undo). Scope: ONE low-impact property per row; multi-field → side panel/row-expansion/dedicated page. · SOURCE: uxpatternsguide.com + vibeweek.ai + eleken.co. · VERIFIED.
- **Responsive = choose by data type** — horizontal scroll preserves grid for comparison; card reflow readable for one-record-at-a-time but loses cross-row comparison. Never shrink text below readable size. · SOURCE: calmops.com + sizzy.co + toolforte.com. · VERIFIED.
- **WCAG 2.2 target size for row controls = 24x24 AA floor** — interactive sort/action icons need ≥44x44 for touch; WCAG 2.5.8 exception: spacing alone satisfies if 24px circle doesn't overlap neighbor (useful for dense tables). · SOURCE: WCAG 2.2 + calmops.com. · VERIFIED.
- **Skeleton rows match real height** — content-shaped placeholders with shimmer; match the real row height to prevent layout shift on load. · SOURCE: NN/g Skeleton Screens 101 + setproduct.com. · VERIFIED.
- **Batch-edit variant** — multi-row inline edit (select rows → editable mode → Save/Cancel bar) MUST confirm before overwriting original values across rows (converges Q83 bulk actions). · SOURCE: uxpatternsguide.com + setproduct.com. · VERIFIED.
- **Dirty-grid conflict guard** — sorting/filtering/paging while a cell is dirty risks data loss → disable grid-level actions during edit or buffer pending edits + confirm (converges Q56 dirty-state). · SOURCE: uxpatternsguide.com + calmops.com. · VERIFIED.
- **Grid a11y contract (WCAG 2.1.1/2.4.3/4.1.2)** — `role="grid"` + roving tabindex (one cell `tabindex=0`, rest `-1`) + arrow-key nav + `aria-readonly` on non-editable cells + `aria-busy="true"` during async save + `aria-live` announce. · SOURCE: W3C APG Grid pattern PRIMARY. · VERIFIED.
- **Cargo-cult rejected:** every-cell-a-permanent-input (can't tell read vs draft), hover-only-edit-affordance (unreachable by keyboard AND touch), silent-blur-discard (loses edit with no feedback), sort/filter/paging-while-dirty (data-loss race).
- **One-shot build checklist line:** if the build has data tables (DM admin cockpit flagship, Open Finance transaction tables, Deseret Marketing portfolio tables), table = 5 parts + text-left/numbers-right alignment + ~1k row threshold (virtualize beyond) + density modes user-persisted + inline edit discoverable without hover + responsive = scroll for comparison/card for read-one + row controls ≥44x44 touch + skeleton rows match real height + dirty-grid guard.
Source: NN/g Data Tables Four Major User Tasks (PRIMARY) + saasui.design (PRIMARY) + setproduct.com (PRIMARY) + uxpatternsguide.com (PRIMARY) + calmops.com (PRIMARY) + eleken.co (PRIMARY) + sizzy.co (PRIMARY) + vibeweek.ai (PRIMARY) + allahabadi.dev — ledger Q239 B-row, 12 rules verified on independent primaries. 4 [needs-evidence] flags resolved (~1k row threshold, 3 density modes convention, WCAG target size, card-vs-scroll preference). Direct users: DM admin cockpit (flagship) + Open Finance Android + Deseret Marketing.

### Q240 — Gamification & Motivational Design UX · 2026-09-09
- **SDT = BEDROCK** — Ryan & Deci 2000 (selfdeterminationtheory.org verbatim): three innate psychological needs — competence, autonomy, relatedness — when satisfied yield enhanced self-motivation and mental health. Universal, cross-cultural validated. JP-Lingo: competence=skill trees, autonomy=pace choice, relatedness=social leagues (NOT controlling competition). · SOURCE: Ryan & Deci 2000 + TheoryHub Newcastle + Dahalan 2023 + Sailer&Homner 2020. · VERIFIED.

### Q241 — Settings & Preferences Screen UX · 2026-09-10
- **Grouped sections + clear headers = UNIVERSAL** — Apple HIG Form + Android HIG both mandate grouped lists; users scan headers to find the right category. Common groupings: Account, Notifications, Appearance, Privacy & Security, Billing, Help. · SOURCE: gummble.com + toptal.com + Android HIG. · VERIFIED.
- **Toggles = instant apply, no Save** — Android HIG: toggles apply immediately; Apple HIG: avoid Save for individual settings. Destructive toggles (disable 2FA) = confirmation dialog. · SOURCE: gummble.com + toptal.com + Android HIG. · VERIFIED.
- **Search within settings = 10-15 item threshold** — Android HIG: "showing more than 10-15 items can be overwhelming" = official; search essential above this. · SOURCE: Android HIG. · VERIFIED.
- **Danger zone = bottom + red + confirmation** — Apple HIG: destructive = red + action sheet/alert confirmation + bottom placement. Cooling-off period (30-day) = platform convention NOT law. · SOURCE: Apple HIG + Meta/Google/TikTok deletion flows. · VERIFIED.
- **Polite defaults** — Android HIG: "default most users would choose + neutral + low-risk + battery-friendly". · SOURCE: Android HIG. · VERIFIED.
- **Labels = plain language, impersonal, no jargon** — Android HIG: "Notifications" not "Notify me"; no generic verbs like Set/Change/Edit. · SOURCE: toptal.com + Android HIG. · VERIFIED.
- **IA = 4-5 top categories max** — toptal.com + Android HIG: 7±2 short-term memory limit; card sorting recommended. · SOURCE: toptal.com + Android HIG. · VERIFIED.
- **Show current state inline** — "Language: English" better than "Language: [tap to view]". · SOURCE: gummble.com + toptal.com. · VERIFIED.
- **Profile card at top = identity confirmation** — convention-tier; answers "Am I logged into the right account?" immediately. · SOURCE: gummble.com. · CONVENTION-TIER.
- **Inline previews for visual settings** — convention-tier; Twitter font size slider shows sample tweet updating in real-time. · SOURCE: gummble.com. · CONVENTION-TIER.
- **BOUNDARY: cooling-off periods = platform convention NOT statutory requirement** — GDPR = 30-day deletion window, CCPA = 45-day response window; 30-day cooling-off = Meta/Google/TikTok all use it, not law. · SOURCE: GDPR/CCPA legal sources. · VERIFIED.
- **5-10x access frequency = UNVERIFIED** — no primary source found for cross-app stat.
- **15-20 item search threshold = PARTIALLY CONFIRMED** — Android HIG 10-15 official; 15-20 reasonable ceiling.
- **One-shot build checklist line:** if the build has a settings/preferences surface (DM admin cockpit, Open Finance Android, JP-Lingo Android), grouped sections + clear headers + toggles = instant apply + search above 10-15 items + danger zone bottom + red + confirmation + polite defaults + show current state inline + 4-5 top categories max + labels = plain language no jargon.
- Source: gummble.com PRIMARY 2026 + toptal.com PRIMARY 2025 + Android HIG PRIMARY 2025 + Apple HIG PRIMARY + dnsk.work real-product data + GDPR/CCPA legal sources — ledger Q241 B-row, 12 rules verified on independent primaries. 4 [needs-evidence] flags resolved. Direct users: DM admin cockpit + Open Finance Android + JP-Lingo Android.
- **PBL Fallacy = DIRECTIONAL** — "90% fail" = VENDOR-TIER (medium.com 500+ implementations, no public methodology). "Never bolt generic PBL" = CONFIRMED: LinkedIn retired Top Voice badges (volume>quality), Disneyland hotel leaderboard="electronic whip", Habitica 100% cognitive overload. Cite "PBL backfires" not "90%". · SOURCE: medium.com + independent cases. · VERIFIED.
- **Van Roy & Zaman 9 SDT Heuristics = CONFIRMED + independently validated** — Springer 2017 primary; FineTune 2022 applies; MDPI Sustainability 2022 extends; BJET 2023 cites. Heuristics guide design, not predictive model. · SOURCE: Springer 2017 + 3 independent replications. · VERIFIED.
- **Streak Psychology = LOSS AVERSION BEDROCK** (Kahneman&Tversky) but specific %s MISATTRIBUTED: Duolingo "9% 30-day retention lift" = WRONG (econsultancy Zilani: 9% = fewer weekend users; D14 lift = 3.3%). Snapchat "23% daily open" = UNVERIFIED (U Michigan 2017 n=74 qual confirms obligation language "I have to/I can't let it die" dominates, but no 23% stat). "Streaks shift motivational→obligational" = CONFIRMED by qual. Offer streak freezes + total practice days. · SOURCE: Kahneman&Tversky + U Michigan 2017 + econsultancy. · VERIFIED.
- **Progression System Patterns = CONVENTION-TIER** — themasterly.com 2026 practitioner taxonomy. Match pattern to product type: Multi-layered (XP/levels/streaks/quests) = measurable skill-building (Duolingo/JP-Lingo); Minimal time tracking = calm/focus; Calendar+stats = pattern recognition; Character-driven = emotional support; Visual consequence = productivity. Never copy Duolingo into wellness. · SOURCE: themasterly.com. · VERIFIED.
- **Age-Aware Gamification = CONFIRMED PRIMARY** — arxiv 2512.15630 2025: children→storytelling+multisensory; adolescents→competition+peer recognition; adults→structure+application; older adults→simplicity+accessibility. For JP-Lingo family: multi-layered with autonomy support, not competitive pressure. · SOURCE: arxiv 2512.15630. · VERIFIED.
- **Ethical Boundaries** — PMC1268426 2024 (n=740): nudge frequency must be well-tuned to avoid fatigue/backfiring. Default nudges = autonomy threats when salient. Dark patterns (opaque leaderboards, delayed feedback loops, compulsive engagement) = unacceptable. Personalization + nudging have direct AND indirect positive influences. · SOURCE: PMC1268426. · VERIFIED.
- **Implementation Rules** — (a) 1-2 primary metrics max (XP+streaks, not XP+levels+streaks+badges+quests). (b) Celebrate milestones at Day 7/30/100 with animation/message/unlock. (c) Concrete metrics > abstract points (minutes/lessons > "wellness points"). (d) Match emotional tone to product purpose. (e) Opt-out for competitive mechanics = fairness + inclusivity. · SOURCE: PMC1268426 + arxiv 2512.15630. · VERIFIED.
- **One-shot build checklist line:** if the build has gamification (JP-Lingo flagship, Open Finance savings goals, Deseret Marketing onboarding), SDT = bedrock (competence/autonomy/relatedness) + avoid generic PBL + streak freezes + total practice days + match progression system to product type + 1-2 primary metrics + milestone celebrations + concrete metrics + opt-out for competition.
Source: Ryan & Deci 2000 + van Roy & Zaman 2017 Springer + arxiv 2512.15630 2025 + medium.com "Beyond Points and Badges" + themasterly.com 2026 + PMC1268426 2024 + U Michigan 2017 — ledger Q240 B-row, 8/8 verified on independent primaries. Direct users: JP-Lingo Android (flagship) + Open Finance Android + Deseret Marketing.

### Q242 — Error State, Offline & Recovery UX · 2026-09-10
- **4-STATE TAXONOMY = diagnose before designing** — dead-end (actionless blank, anti-pattern) vs empty (legitimate absence) vs no-results (user's own search/filters excluded all) vs error (expected content failed). Never show the same generic message for all four. · SOURCE: uxpatternsguide.com + saasui.design. · VERIFIED.
- **EMPTY STATE = FIRST-ACTION PITCH** — must answer "what do I click in 5 seconds?" Anatomy: specific heading + cause text + ONE primary CTA + optional secondary path. Three types: first-use, filtered-empty (name filter + "Clear filters"), cleared-empty (celebratory). · SOURCE: saasui.design + otf-kit.dev. · VERIFIED.
- **INLINE ERROR + NEVER-LOSE-WORK** — error position = directly beneath/beside the input that caused it. Form that clears itself on failed submit = among most infuriating UX experiences. Preserve every entered value. · SOURCE: saasui.design + nngroup.com. · VERIFIED.
- **VALIDATE-ON-BLUR + REVALIDATE-ON-FIX = NN/g-ENDORSED** — validate when user leaves field, then revalidate as they type so error clears the moment input becomes valid. Real-time validation BEFORE user finishes = hostile pattern. · SOURCE: nngroup.com/articles/errors-forms-design-guidelines verbatim + Smashing Magazine. · VERIFIED.
- **ERROR MESSAGE = NAME THE PROBLEM + POINT AT FIX** — "That email is already registered — sign in instead?" beats "Invalid email." Ban: system jargon, vague non-messages, blame. · SOURCE: saasui.design + nngroup.com 10 guidelines. · VERIFIED.
- **OFFLINE BANNER = PERSISTENT + VISIBLE + CONSEQUENCE-COPY** — render persistent banner at root navigator top. Must say both state AND consequence: "You are offline — changes will sync when reconnected." Use isConnected === false as trigger. · SOURCE: reactnative.codeguides.io + auditbuffet.com. · VERIFIED.
- **OPTIMISTIC UI + ROLLBACK ON FAILURE** — update UI immediately for high-confidence actions; revert + error toast on hard failure; queue for retry on soft failure. Never duplicate side effects (client-generated IDs). · SOURCE: blog.michaelsam94.com + otf-kit.dev + saasui.design. · VERIFIED.
- **RETRY = EXPONENTIAL BACKOFF + JITTER + CIRCUIT BREAKER** — retryable = 502/503/timeout/network drop; terminal = 400/401/404. Backoff: 1s→2s→4s + jitter. Cap at 5 max. Circuit breaker: 5-10 consecutive failures = convention. Always provide manual Retry button. · SOURCE: frontendpatterns.dev + blog.michaelsam94.com + dcdhameliya.com. · VERIFIED.
- **FULL-PAGE 404/500 = OFF-RAMP NOT DEAD-END** — 404 = acknowledge missing page + offer routes back. 500 = honest that problem is product's side, not user's; reassure data is safe; offer retry + way to reach support. Never show raw framework error page. · SOURCE: saasui.design. · VERIFIED.
- **ACCESSIBILITY: role="alert" + FOCUS MANAGEMENT + NO COLOR-ONLY** — critical errors MUST use role="alert" (or aria-live="assertive"). On form submit with errors: move focus to first error field. Error state = icon + text + color (redundant encoding). · SOURCE: saasui.design + aiguild.blue + MDN. · VERIFIED.
- **BOUNDARIES:** validate-on-blur = NN/g-endorsed (verbatim: "as soon as the user has finished filling in a field, an indicator should appear nearby if the field contains an error"). Circuit breaker threshold = 5-10 failures = convention. role="alert" = aria-live="assertive" + aria-atomic="true" (behaviorally equivalent per MDN). Optimistic UI "up to 40% trust/speed lift" = convention-tier.
- **One-shot build checklist line:** if the build has error/empty/offline states (DM admin cockpit tables/forms, Open Finance transactions, Ghostway map offline, JP-Lingo card save), 4-state taxonomy + empty = first-action pitch + inline error + never-lose-work + validate-on-blur + error = name problem + point at fix + offline banner persistent + optimistic UI + retry backoff/jitter/circuit breaker + full-page errors = off-ramp + role="alert" + focus management + no color-only.
Source: uxpatternsguide.com + saasui.design + otf-kit.dev + reactnative.codeguides.io + auditbuffet.com + frontendpatterns.dev + blog.michaelsam94.com + aiguild.blue + skills.smoothui.dev + nngroup.com + Smashing Magazine + MDN + rorklab.net + dcdhameliya.com — ledger Q242 B-row, 10/10 verified on independent primaries. 4 [needs-evidence] flags resolved. Direct users: DM admin cockpit + Open Finance Android + Ghostway MapLibre PWA + JP-Lingo Android.

### Q243 — Typography System & Font Loading Strategy · 2026-09-10
- **Butterick's 5 rules = BEDROCK** — body text first, derive everything from point size + line-height + line length + typeface. Point size 15-25px web (10-12pt print = 15-25px web, practicaltypography.com verbatim). Line-height inversely proportional to size (headlines 1.0-1.2×, body 1.5-1.6×). Letter-spacing inversely proportional to size (tighten large, loosen small). Line length 50-75 chars, 65ch for prose. · SOURCE: practicaltypography.com PRIMARY + smashingmagazine.com 2014. · VERIFIED.
- **65ch = LATIN-SCRIPT ONLY** — CJK boundary: WCAG 1.4.8 AAA = ≤40 chars for Japanese; Hayataki = 15-40 cpl display / 15-21 smartphone. RULE: 65ch for Latin prose; 35-40ch max for Japanese body text in JP-Lingo. · SOURCE: WCAG 1.4.8 + Hayataki + Oregon State + cozycornerdesign. · VERIFIED.
- **Font-related CLS = 15-20% of total layout shift** — HTTP Archive verbatim via blog.lueurexterne.com. font-display: swap = body default; optional = non-critical. Preload ≤2 critical faces with crossorigin. Metric-matched fallback via size-adjust (Chrome 92+/FF 92+/Safari 17+). Variable fonts > static weights (one file, all weights). Budget ~100KB. · SOURCE: blog.lueurexterne.com + web.dev/articles/optimize-cls + csswg css-fonts-4 + zachleat. · VERIFIED.
- **clamp() must include rem anchor or FAILS WCAG 1.4.4** — scratch test q243-typography-test.html proves vw-only preferred value (4vw = 32px at 800px viewport) is FIXED regardless of user font-size preference; rem+vw preferred value (1rem + 2vw) scales WITH user preference. vw-only violates WCAG 1.4.4. · SOURCE: utopia.fyi + thecrit.co + WCAG 1.4.4. · VERIFIED.
- **tabular-nums = MANDATORY for data columns** — right-align numbers for magnitude comparison; tabular-nums makes digits monospaced so columns line up. · SOURCE: setproduct.com + eleken.co. · VERIFIED.
- **Type scale 1.20-1.25 = dense product UI** — modular scale ~1.25 for product/dense UI. System fonts (SF Pro/Roboto) = zero load time. Font pairing = contrast not similarity, max 2-3 families. · SOURCE: identityforge.io + kitlab.app + promptolis.com. · VERIFIED.
- **BOUNDARIES:** 65ch = Latin only (CJK = 35-40ch); font-display: swap = body default; clamp() must include rem anchor or fails WCAG 1.4.4; tabular-nums = mandatory for data columns; type scale 1.20-1.25 = dense product UI. 12 rules verified on independent primaries. 4 [needs-evidence] flags resolved (Butterick 15-25px, 65ch CJK boundary, font CLS 15-20%, clamp rem-anchor).
- One-shot build checklist line: if the build has any text surface (ALL fleet apps — Ghostway, JP-Lingo, Open Finance, DM cockpit, Deseret Marketing), Butterick's 5 rules = bedrock + 65ch Latin / 35-40ch CJK + font-display: swap + clamp() with rem anchor + tabular-nums on data + type scale 1.20-1.25 + system font fallback + variable fonts + font pairing = contrast.
Source: practicaltypography.com PRIMARY + smashingmagazine.com 2014 + blog.lueurexterne.com PRIMARY + peal.dev + fontfinder.app + utopia.fyi PRIMARY + thecrit.co + kitlab.app + promptolis.com + identityforge.io + build-os.com + appypie.com + web.dev/articles/optimize-cls + csswg css-fonts-4 + zachleat + WCAG 1.4.8 + Hayataki + Oregon State + cozycornerdesign — ledger Q243 B-row, 12 rules verified on independent primaries. 4 [needs-evidence] flags resolved. Direct users: ALL fleet apps.

### Q244 — Overlay, Modal & Bottom Sheet Design Patterns · 2026-09-11
- **MODAL = INTERRUPTION, JUSTIFY THE COST** — NN/g modal-nonmodal-dialog verbatim. Use modal ONLY for: (a) important warnings / irreversible-destructive confirmations, (b) critical info required to continue current process, (c) wizard-style fragmentation of overwhelming workflows, (d) progressive profiling relevant to current task. NEVER for: nonessential info (newsletter signup, promos), checkout interruptions, complex decisions requiring info outside the modal. · SOURCE: NN/g PRIMARY. · VERIFIED.
- **MODAL vs NONMODAL vs BOTTOM SHEET TAXONOMY** — three distinct overlay types with distinct use cases. Modal = blocks interaction, requires dismissal. Nonmodal = coexists with page, user can interact with both. Bottom sheet = mobile-first overlay, partially reveals background. · SOURCE: NN/g + Apple HIG + M3. · VERIFIED.
- **FOCUS TRAP + RESTORATION = WCAG 2.2 MANDATORY** — modal dialogs must trap focus (role=dialog + aria-modal + Escape + focus restoration to trigger). auditbuffet ab-000054 + WCAG SC 2.1.2/2.4.3/4.1.2. · SOURCE: auditbuffet + WCAG 2.2. · VERIFIED.
- **BOTTOM SHEET = DEFAULT MOBILE OVERLAY** — NN/g bottom-sheet verbatim: Back support, close button, scroll/swipe ambiguity, content-driven detents. Detents map to content stages (peek ~15-20% / mid ~50% / full ~90%), NOT arbitrary 25/50/90 stops. · SOURCE: NN/g PRIMARY. · VERIFIED.
- **OVERLAY STACKING MINIMIZATION** — Apple HIG popovers verbatim: "Don't show another view over a popover." alfiesimmons.com corroborates. Only one overlay at a time. · SOURCE: Apple HIG + alfiesimmons.com. · VERIFIED.
- **BOTTOM SHEET ERGONOMICS** — mobileapp.wiki + asoasis.tech: drag handle reserves 48dp touch zone, hideable false-standard/true-modal, 640dp max-width. · SOURCE: mobileapp.wiki + asoasis.tech. · VERIFIED.
- **SCRIM/BACKGROUND DISMISSAL = CONTEXT-DEPENDENT** — NN/g: modal scrim blocks; tap-outside OK for sheets; destructive = no tap-outside. · SOURCE: NN/g. · VERIFIED.
- **BOUNDARIES:** modal = interrupt cost (sparingly); bottom sheet = default mobile overlay; focus trap = WCAG mandatory; overlay stacking = Apple HIG hard rule; detents = content-driven; swipe-to-dismiss = must have visible close + Escape.
- **FLAGSHIP:** Ghostway MapLibre PWA (bottom sheets for route/POI/waypoint, modal confirmations) + OF Android (bottom sheet filters, modal payment) + JP-Lingo Android (bottom sheet card detail, modal delete-deck) + DM cockpit (side sheet desktop, modal confirm-delete).
- One-shot build checklist line: if the build has overlays/modals/bottom sheets, modal = justify cost + focus trap WCAG mandatory + bottom sheet = default mobile overlay + detents = content-driven + overlay stacking = Apple HIG hard rule + scrim = context-dependent.
Source: NN/g modal-nonmodal-dialog PRIMARY + NN/g bottom-sheet PRIMARY + Apple HIG popovers PRIMARY + auditbuffet ab-000054 + mobileapp.wiki + alfiesimmons.com + a11yman.com — ledger Q244 B-row, 7 rules verified on independent primaries. Direct users: Ghostway MapLibre PWA + OF Android + JP-Lingo Android + DM cockpit.

### Q245 — Dark Mode Design System · 2026-09-05
- **DARK MODE = FULL SECOND THEME, NOT COLOR INVERSION** — NN/g dark-mode verbatim: light mode wins visual acuity + proofreading. brainy.ink + superdesign.dev corroborate. Design dark mode in parallel with light mode from the same component set, reconciled through shared semantic tokens. Components consume ONLY semantic tokens — never raw hex. · SOURCE: NN/g dark-mode PRIMARY + brainy.ink + huppen.com.np + superdesign.dev. · VERIFIED.
- **BASE SURFACE = DARK GRAY, NOT PURE BLACK** — huppen.com.np + brainy.ink + Material Design 3 dark theme docs. Pure black kills depth perception and causes halation. Use #121212 as base surface. Reserve true black ONLY for OLED-specific backgrounds. Drop body text to #E0E0E0 — pure #FFFFFF on #000000 (21:1) halates. · SOURCE: huppen.com.np + brainy.ink + M3 dark theme. · VERIFIED.
- **ELEVATION = LIGHTNESS, NOT SHADOWS** — brainy.ink 5-step scale + superdesign.dev computed contrast. Shadows are swallowed on dark surfaces. Working 5-step scale: base #0E0E12 → card #17171C → raised card/menu #1F1F25 → modal/dialog #28282F → popover/tooltip #31313A. Shadows can reinforce but the primary cue is surface color. · SOURCE: brainy.ink + superdesign.dev. · VERIFIED.
- **CONTRAST MATH IS TIGHTER IN DARK MODE** — brainy.ink + superdesign.dev. Body text #E0E0E0 on #0E0E12 = ~13:1. Common failure: muted text token at #999 on #0E0E12 = ~4.2:1 (FAILS WCAG AA 4.5:1). Run EVERY token pairing through a contrast checker. Test secondary text against --surface-3 (lightest tier), not page background. · SOURCE: brainy.ink + superdesign.dev. · VERIFIED.
- **DESATURATE ACCENT COLORS 10-20% + LIGHTEN** — huppen.com.np #0066CC → #4DA3FF verified. Saturated brand colors "visually vibrate" against dark surfaces. Take light-mode 500-weight brand color → ship its 300-400 weight on dark. Dark mode does NOT invent new colors — it ships a parallel set of the SAME brand colors tuned for the new surface context. · SOURCE: huppen.com.np. · VERIFIED.
- **RESPECT prefers-color-scheme + ALWAYS PROVIDE MANUAL TOGGLE** — mgifford ACCESSIBILITY.md + metahub.ai. 64% of users want manual override. Default to system preference. Detect inline in <head> BEFORE any CSS renders (prevent flash). Persist user override in localStorage. CSS `light-dark()` (Baseline 2024) = progressive enhancement. · SOURCE: mgifford ACCESSIBILITY.md + metahub.ai. · VERIFIED.
- **CONTEXT DECISION: WHEN TO DEFAULT DARK vs LIGHT** — NN/g: 70% prefer dark low-light, 30% daylight. Light mode wins proofreading tasks. Reading-first products default light. Dark mode advantages: reduced eye fatigue in dim environments, OLED battery savings, user expectation. Field tools/POS should default light. RULE: dark = default for dashboards, dev tools, media/entertainment, operational/night-use apps; light = default for content-heavy reading, e-commerce checkout, field tools, POS. · SOURCE: NN/g dark-mode PRIMARY. · VERIFIED.
- **COMPONENT TRAPS THAT BREAK IN DARK MODE** — brainy.ink + adaguard.io: (a) Borders become primary separators — raise from #EEE (light) to ~#2A2A30 (dark). (b) Disabled states disappear — increase opacity to ~40% on raised surface. (c) Focus rings lose impact — brighten 10-20% or thicken. (d) Images shot on white backgrounds break continuity — add soft light container. (e) `filter: invert(1)` is NOT dark mode — it inverts images too. · SOURCE: brainy.ink + adaguard.io. · VERIFIED.
- **OLED BATTERY SAVINGS = brightness-dependent BOUNDARY** — Purdue 67% = DISPLAY POWER only; total phone = 39-47% @ 100% brightness, 3-9% @ 30-50% (Dash & Hu 2021 DOI 10.1145/3458864.3467682). Don't overclaim. · SOURCE: Purdue/Dash & Hu 2021. · VERIFIED.
- **HALATION HITS ASTIGMATISM USERS HARDEST** — pooled prevalence ~40% (Hashemi 2018), up to 62% elderly. Light text on very dark backgrounds produces blurry glow (halation) around letterforms. Reading-first products default to dark-as-option, never dark-as-default. · SOURCE: Hashemi 2018 meta-analysis. · VERIFIED.
- **BOUNDARIES:** 82.7% dark-mode preference = VENDOR-TIER (no methodology); OLED savings brightness-dependent; astigmatism prevalence UNDERESTIMATED at 33% in some sources (meta-analysis ~40%); CSS `light-dark()` does NOT auto-adapt to forced-colors (needs @media override).
- **FLAGSHIP:** DM admin cockpit (Hono+SQLite+vanilla JS — dark = operational mode per Q228, data tables/skeletons in dark) + Open Finance Android (M3 dark theme + dynamic color) + Ghostway MapLibre PWA (night field use, bottom sheets/modals dark-mode aware, focus states) + JP-Lingo Android (dark theme for extended learning) + Deseret Marketing Astro (light default, dark toggle).
- One-shot build checklist line: if the build has dark mode (DM admin cockpit flagship, OF Android, Ghostway MapLibre PWA, JP-Lingo Android, Deseret Marketing Astro), dark mode = full second theme (not inversion) + base surface #121212 (not pure black) + elevation = lightness not shadows + tighter contrast math (check every token pairing) + desaturate accents 10-20% + prefers-color-scheme + manual toggle + no-flash + context-driven default (data/ops → dark, reading/checkout → light) + component trap audit (borders/disabled/focus/images) + OLED savings brightness-dependent boundary.
Source: NN/g dark-mode PRIMARY + brainy.ink + huppen.com.np + superdesign.dev + Material Design 3 dark theme + mgifford ACCESSIBILITY.md + adaguard.io + metahub.ai + Purdue/Dash & Hu 2021 OLED study — ledger Q245 B-row, 10 rule groups verified on independent primaries, 2 boundaries. Direct users: DM admin cockpit + OF Android + Ghostway MapLibre PWA + JP-Lingo Android + Deseret Marketing Astro.

### Q246 — Internationalization & Localization UX · 2026-09-12
- **TEXT EXPANSION = 2× ENGLISH for short strings, +30-50% for long** — simplelocalize.io + thisisglance.com + intlpull.com: German +30-40%, Finnish +30-50%, Japanese -10-25%. CRITICAL: 30-40% is length-DEPENDENT (W3C/IBM: ≤10-char strings 200-300%, only >70-char text settles ≈30%) → build UI labels for ~2× English length, NOT a flat 30-40%. · SOURCE: simplelocalize.io + thisisglance.com + intlpull.com + W3C/IBM. · VERIFIED.
- **CJK LINE-HEIGHT = 1.7-2.0** — JIS X 4051 (W3C Japanese Layout Task Force cites JIS X 4051:2004; jlreq LaTeX class uses 1.7× pitch; blog.greeden.me corroborates). CJK needs more vertical breathing room than Latin. · SOURCE: JIS X 4051 + W3C JLReq + jlreq LaTeX + blog.greeden.me. · VERIFIED.
- **line-break: strict = SUPPORTED everywhere** — caniuse: Chrome 25+, Safari 8+, Firefox 69+, Edge 79+ — all target platforms covered. Use for kinsuku shori line-breaking rules. · SOURCE: caniuse. · VERIFIED.
- **CJK FONT STACK = platform-native** — Android = "Noto Sans CJK JP" via system-ui (NOT "Source Han Sans" = Adobe name for same font); iOS = "Hiragino Kaku Gothic ProN"; Windows = "Yu Gothic"/"Meiryo". Ship per-script @font-face + unicode-range for web fonts. · SOURCE: symbolfyi.com + zenn.dev. · VERIFIED.
- **PSEUDO-LOCALIZATION = catches ~80% of layout bugs** — en_XA + ar_XB on Android, Double-Length Pseudolanguage on iOS. Catches layout bugs NOT linguistic/cultural issues. Run before every locale ship. · SOURCE: drizz.dev + gettranslated.ai. · VERIFIED.
- **PLURAL FORMS = locale-dependent complexity** — Japanese = 1 form, Russian = 3, Arabic = 6. Use Intl.PluralRules/ICU MessageFormat — never hardcode plural logic. · SOURCE: locize.com + dev-toolbox.tech. · VERIFIED.
- **JAPANESE INFO DENSITY = marketing screenshot heuristic, not in-app rule** — appscreenshotstudio.com + adapty.io: "2-3 callouts/frame" = MARKETING SCREENSHOT convention only. rorklab.net confirms in-app Japanese UI tolerates higher density, but the specific figure = screenshot heuristic. Don't use as in-app design rule. · SOURCE: appscreenshotstudio.com + adapty.io + rorklab.net. · VERIFIED BOUNDARY.
- **BOUNDARIES:** Japanese info-density = marketing heuristic first, in-app convention second; line-break: strict = universally supported; CJK font stack = "Noto Sans CJK JP" (Source Han Sans = Adobe's name); pseudo-localization = catches layout bugs NOT linguistic/cultural issues.
- **FLAGSHIP:** JP-Lingo Android (flagship — Japanese body text = primary i18n consumer) + Ghostway MapLibre PWA (multilingual POI names, RTL locale support) + Open Finance Android (currency formatting per locale) + DM admin cockpit (admin-facing i18n) + Deseret Marketing Astro (romaji-on-JP rule for all UI text).
- One-shot build checklist line: if the build has any non-English surface (JP-Lingo flagship, Ghostway, OF, DM cockpit, DM Astro), build UI labels for ~2× English length + CJK line-height 1.7-2.0 + line-break: strict + platform-native CJK font stack + pseudo-localization testing + Intl.PluralRules for plurals + Japanese info-density = marketing heuristic not in-app rule.
Source: simplelocalize.io + thisisglance.com + intlpull.com + JIS X 4051 + W3C JLReq + jlreq LaTeX + blog.greeden.me + symbolfyi.com + zenn.dev + caniuse + drizz.dev + gettranslated.ai + locize.com + dev-toolbox.tech + appscreenshotstudio.com + adapty.io + rorklab.net — ledger Q246 B-row, 10 rule groups verified on independent primaries, 2 boundaries. Direct users: JP-Lingo Android + Ghostway MapLibre PWA + OF Android + DM cockpit + Deseret Marketing Astro.

### Q247 — Authentication, Login & Signup UX · 2026-09-12
- **AUTH METHODS = OFFER MULTIPLE IN PARALLEL** — SSO + passkeys + magic link + SMS OTP on one screen; don't nest behind tabs. · NN/g PRIMARY. · VERIFIED.
- **SSO FIRST = CONVERSION BOOST** — EULE Institute 2026 + Baymard: SSO buttons at top of login form, password field below. · VERIFIED.
- **PASSWORD POLICY = NIST SP 800-63B** — length > complexity, no rotation, breached-list check mandatory. · NIST PRIMARY. · VERIFIED.
- **PASSWORD FIELD = MASKED DEFAULT + TOGGLE** — BOUNDARY: NN/g = unmask-default stance; masked-default + toggle = industry convention, NOT NN/g-endorsed. Never double-entry. · VERIFIED BOUNDARY.
- **PASSKEYS = OFFER ALONGSIDE, NOT FORCED** — prompt enrollment after password login; ~30% of orgs made passkeys primary (FIDO Alliance 2026). · ACM CHI 2026 + FIDO Alliance. · VERIFIED.
- **MFA = COMPARE-AND-CONFIRM OVER SIMPLE PUSH** — ~9pp better attack detection on mobile (medium-skill only; segment-specific). · conf-icnc.org/2026. · VERIFIED BOUNDARY.
- **MOBILE AUTH = BIOMETRIC PREFERRED** — NN/g + IJAAS 2025: biometric = best usability/security balance. · VERIFIED.
- **SIGNUP = BARE MINIMUM + PROGRESSIVE ONBOARDING** — each additional field drops conversion ~4-10pp. · Baymard + EULE Institute 2026. · VERIFIED.
- **FORCED ACCOUNT CREATION = ~19% ABANDONMENT** — Baymard survey 1,026 US adults (e-commerce checkout). · VERIFIED.
- **MOBILE PASSWORD RESET = SMS > EMAIL** — SMS OTP easier without context-switching. · NN/g PRIMARY. · VERIFIED.
- **WCAG 2.2 3.3.8 = ACCESSIBLE AUTHENTICATION** — no memory-only tests; passkeys = friendly path. · WCAG PRIMARY. · VERIFIED.
- **PASSWORD MANAGERS = ENABLE FULLY** — paste enabled + autocomplete attrs. · WCAG 1.3.5 + NN/g. · VERIFIED.
- **BOUNDARIES:** NN/g = unmask-default stance VERBATIM ("It's time to show most passwords in clear text as users type them" — nngroup.com/articles/stop-password-masking); masking-default + toggle = industry convention, NOT NN/g-endorsed. 9pp MFA = medium-skill ONLY (segment-specific; high-skill shows no device difference). 19% abandonment = e-commerce checkout (Baymard survey of 1,026 US adults, CONFIRMED primary). 30% passkey = orgs with passkeys as PRIMARY (FIDO Alliance State of Passkeys 2026: 30% primary, 68% deployed/piloting). Per-field conversion drop ≈8-10pp per extra field beyond 2 (Baymard aggregated benchmark, CONFIRMED directionally).
- **2ND PASS [needs-evidence] GAP-FILL (2026-12-29):** all 5 flags resolved on independent primaries — boundaries above strengthened with verbatim NN/g quote + exact Baymard n + FIDO 68% deployment figure.
- **FLAGSHIP:** DM admin cockpit (internal SSO/passkey + MFA) + Open Finance Android (consumer SSO + biometric/passkey + MFA) + Ghostway MapLibre PWA (deferred auth) + JP-Lingo Android (biometric quick-return).
- One-shot build checklist line: if the build has auth/login/signup, auth = parallel methods + SSO-first + NIST password policy + masked-default + toggle + passkeys as progressive enhancement + compare-and-confirm MFA + biometric preferred on mobile + bare-minimum signup + WCAG 3.3.8 + password manager friendly.
- Full spec: uiux-one-shot-polish references/q247-auth-login-signup.md + frontend-component-build references/accessibility-patterns.md § Authentication & login forms (Q247).
Source: nngroup.com + NIST SP 800-63B + Baymard + FIDO Alliance + ACM CHI 2026 + conf-icnc.org/2026 + ux.detroit3d.com + WCAG 2.2 — ledger Q247 B-row, 13 rules verified on independent primaries, 4 boundaries. Direct users: DM admin cockpit + Open Finance Android + Ghostway MapLibre PWA + JP-Lingo Android.

### Q249 — Push Notification UX · 2026-09-05 [C-DONE 2026-09-05]
- **iOS PERMISSION = ONE-SHOT PERMANENT** — once denied, <5% recover via Settings. Never ask on first launch. · SOURCE: NN/g PRIMARY + Braze docs. · VERIFIED.
- **PRE-PERMISSION PRIMING SCREEN = CONVENTION-TIER** — custom explainer before system dialog (double opt-in pattern). No controlled study isolates "double" vs "single" effect. · SOURCE: designkey.studio + Braze + Pushwoosh. · VERIFIED.
- **TIMING = AFTER FIRST POSITIVE ENGAGEMENT** — 46% of opted-in users have 11+ sessions vs 25% non-opted (Localytics 2018). Apple HIG warns against first-run ask. · SOURCE: Localytics 2018 + Apple HIG. · VERIFIED.
- **CONTENT = 40 CHARS GUARANTEED VISIBLE** — CleverTap 301B analysis: 40-char floor. PushPilot 2026: 70 chars = +38% CTR, 90+ chars truncated. · SOURCE: CleverTap 301B + PushPilot 2026. · VERIFIED.
- **ACTION BUTTONS = MAX 2, ACTIVE VERBS** — iOS supports 4, Android 3. Use max 2 with verb-led labels ("View", "Reply"). · SOURCE: Pushwoosh + onething.design. · VERIFIED.
- **DEEP LINK = SPECIFIC SCREEN ALWAYS** — never land on home. Universal Links/App Links mandatory. · SOURCE: Pushwoosh + vibeweek.ai. · VERIFIED.
- **FREQUENCY CAP = PER USER NOT PER CAMPAIGN** — JITAI framework. 63.5 notifications/day = Sahami Shirazi et al. 2014 large-scale assessment (NOT Pielot 2014). · SOURCE: JITAI framework + Sahami 2014. · VERIFIED.
- **NOTIFICATION CENTER = GROUPED + COLOR-CODED + BULK-ACTIONABLE** — severity = red/amber/blue. · SOURCE: inspoai.io + idstartapp.com. · VERIFIED.
- **ACCESSIBILITY = REDUNDANT ENCODING** — icon + text + color; never color-only. aria-live for screen readers. · SOURCE: Apple HIG + WCAG 1.4.1. · VERIFIED.
- **PLATFORM DIFFERENCES = iOS ONE-TIME + ANDROID CHANNELS + WEB QUIETER UI** — Airship 2024: 61.4% Android / 49.8% iOS median opt-in. · SOURCE: designkey.studio + Airship 2024. · VERIFIED.
- **BOUNDARIES:** "double opt-in" = convention (no controlled study); 40 chars = conservative floor (70 chars optimal for CTR); 63.5/day = Sahami 2014 (not Pielot); Airship 2024 = vendor benchmark (not independent study).
- **FLAGSHIP:** Open Finance Android + JP-Lingo Android + Ghostway MapLibre PWA + DM admin cockpit.
- One-shot build checklist line: if the build has push notifications, iOS permission = one-shot permanent + pre-permission priming screen + timing = after first positive engagement + content = 40-char floor + action buttons = max 2 active verbs + deep link = specific screen + frequency cap = per user + notification center = grouped + color-coded + accessibility = redundant encoding + platform differences.
- Full spec: uiux-one-shot-polish references/q249-push-notification-ux.md.
Source: NN/g + Braze + Pushwoosh + Localytics 2018 + Apple HIG + CleverTap 301B + PushPilot 2026 + onething.design + vibeweek.ai + JITAI framework + Sahami 2014 + inspoai.io + idstartapp.com + Airship 2024 — ledger Q249 B-row, 10 rules verified on independent primaries, 4 boundaries. Direct users: Open Finance Android + JP-Lingo Android + Ghostway MapLibre PWA + DM admin cockpit.

### Q248 — Card Design Patterns · 2026-09-12 [C-DONE 2026-09-12]
- **ONE CARD = ONE CONCEPT + ONE PRIMARY ACTION** — Material Design PRIMARY + StanVision PRIMARY + uiuxnews.in: a card is a single, contained unit. Anti-pattern: a stat card showing revenue AND user count AND conversion rate = compressed spreadsheet. · VERIFIED.
- **CARD ANATOMY = 5 SLOTS IN FIXED ORDER** — media (16:9 or 4:3) > title (1-2 lines, ellipsis) > supporting text (2-4 lines, line-clamp) > metadata (MAX 3 items, subordinate) > actions (primary CTA + max 2 secondary). Follow Gutenberg Diagram hierarchy. · SOURCE: framerwebsites.com + StanVision. · VERIFIED.
- **CONSISTENT ASPECT RATIOS + PADDING = NON-NEGOTIABLE** — all cards in a grid MUST share the same image aspect ratio. Internal padding 16-24px; gap 16-32px; distance to CTA 16px min. · SOURCE: framerwebsites.com + thehangline.com + StanVision. · VERIFIED.
- **ENTIRE CARD = PRIMARY TAP TARGET (Fitts's Law)** — whole card surface clickable, not just a tiny link. CRITICAL BOUNDARY: wrapping card in `<a>` = anti-pattern (screen reader reads all content as one giant link name). CORRECT = single semantic link in heading + `::after` pseudo-element positioned over card (`inset:0`) + `event.stopPropagation()` on secondary actions. · SOURCE: uiuxnews.in + a11y-examples.com + gehirngerecht.digital. · VERIFIED.
- **HOVER/FOCUS = LIFT + SHADOW, SUBTLE** — translateY(2-4px) + box-shadow blur 12-24px + scale max 1.03x. Active/pressed = scale(0.97) + translateY(2px). Focus ring around ENTIRE card (not just inner link), 2-3px, high contrast (WCAG 2.4.7). Animate ONLY transform + opacity. · SOURCE: thehangline.com + framerwebsites.com + rune.codes. · VERIFIED.
- **RESPONSIVE GRID = 3-4 → 2 → 1** — desktop 3-4 cards/row, tablet 2, mobile 1 stacked. CSS Grid `minmax(280px, 1fr)` auto-fit — no media query gymnastics. Test at 360px width with real content. · SOURCE: framerwebsites.com + StanVision + CSS Grid docs. · VERIFIED.
- **TYPOGRAPHY INSIDE CARD = 3 SIZES MAX** — title 16-20px semibold, body 14px regular, metadata 12px muted. Beyond 3 sizes = visual chaos. · SOURCE: thehangline.com. · VERIFIED.
- **CARD VS LIST VS TABLE = DECISION MATRIX** — cards for browsing mixed visual content; lists for scanning/sorting homogeneous items; tables for row-by-row comparison. RULE: ask "would a list work better?" — if yes, prototype both. · SOURCE: StanVision + uiuxnews.in. · VERIFIED.
- **ACTIONS = 1 PRIMARY + MAX 2 SECONDARY** — more than 3 clickable elements inside a card = toolbar, not a card. Group secondary actions in kebab/overflow menu. · SOURCE: thehangline.com + StanVision. · VERIFIED.
- **LOADING/EMPTY/ERROR STATES = MATCH CARD DIMENSIONS** — skeleton loaders must mirror final card structure (same height, same slots). Skeleton height MUST equal real card height to prevent CLS. · SOURCE: thehangline.com + prototypr.io. · VERIFIED.
- **NEVER NEST CARDS** — nesting cards inside cards (Inception pattern) creates confusing hierarchy. Use dividers, background fills, or typography to group content inside a card. · SOURCE: uiuxnews.in + impeccable layout skill. · VERIFIED.
- **ACCESSIBILITY: `<article>` + HEADING + FOCUS RING AROUND CARD** — wrap each card in `<article>`, title in `<h2>/<h3>`, icon-only action buttons get `aria-label`, focus ring visible around entire card on keyboard focus. Color contrast 4.5:1 text on card background (WCAG AA). · SOURCE: framerwebsites.com + thehangline.com. · VERIFIED.
- **WHEN NOT TO USE CARDS** — (a) users need row-by-row comparison → table, (b) huge homogeneous text lists → simple list, (c) screen real estate at a premium → table, (d) content sortable/filterable with many columns → table. · SOURCE: StanVision + uiuxnews.in. · VERIFIED.
- **TRUNCATION = line-clamp + min-height, NOT ragged bottoms** — enforce min-height for title (2 lines) and body (4 lines) areas. Use CSS `line-clamp` + `overflow: hidden`. · SOURCE: uiuxnews.in + prototypr.io. · VERIFIED.
- **BOUNDARIES:** FoxEcom 60% purchase lift = VENDOR-TIER (opaque methodology); 47% interaction rate jump = SINGLE CASE STUDY no control; 34% cards-vs-lists tap-through = SINGLE A/B TEST no replication; 280-360px desktop card width = PRACTITIONER CONVENTION no eye-tracking study validates.
- **FLAGSHIP:** DM admin cockpit (KPI/data cards + portfolio cards) + OF Android (transaction summary cards + budget cards) + JP-Lingo Android (flashcards + stat cards + streak cards) + Ghostway MapLibre PWA (POI cards + route preview cards + waypoint cards) + Deseret Marketing Astro (portfolio cards + testimonial cards + pricing cards).
- One-shot build checklist line: if the build has card grids (all fleet apps), one card = one concept + one primary action; 5-slot anatomy fixed order; consistent aspect ratios + padding 16-24px; entire card = primary tap target (redundant link pattern for a11y); hover lift + shadow subtle; responsive grid 3-4/2/1 via minmax(280px,1fr); max 3 font sizes inside card; card vs list vs table decision matrix; 1 primary + max 2 secondary actions; skeleton = match card dimensions; never nest cards; when NOT to use cards (comparison/dense → table); truncation = line-clamp + min-height.
- Full spec: frontend-component-build references/card-tile-component.md (extended with Q248 rules).
Source: Material Design + StanVision + framerwebsites.com + thehangline.com + uiuxnews.in + rune.codes + prototypr.io + a11y-examples.com + gehirngerecht.digital + impeccable layout skill — ledger Q248 B-row, 14 rules verified on independent primaries, 4 boundaries. Direct users: DM admin cockpit + OF Android + JP-Lingo Android + Ghostway MapLibre PWA + Deseret Marketing Astro.

### Q250 — Mobile Gesture UX & Touch Interaction Patterns · 2026-09-05
- **GESTURE VOCABULARY = REUSE 8 CANONICAL** — tap, swipe, pinch, drag, rotate, long-press, double-tap, pan. Wobbrock et al. 2009 CHI n=20: high agreement for swipe/pinch/drag, low 30-50% for compound ops. Novel/compound gestures = undiscoverable, low retention. · SOURCE: Apple HIG + Material Design + Wobbrock et al. 2009 CHI + Vatavu&Wobbrock 2015. · VERIFIED.
- **CONTEXTUAL SWIPE = FAN EFFECT + DISCOVERABILITY TRAP** — NN/g: single gesture revealing multiple actions = harder retrieval; no visual signifiers = undiscoverable; swipe historically = delete. · SOURCE: NN/g contextual-swipe. · VERIFIED.
- **PULL-TO-REFRESH = FEED-SPECIFIC** — reverse-chronological feeds ONLY; indicator stays until data loads. Non-feed surfaces (settings, forms) = false affordance. · SOURCE: uxplanet.org + uxpatternsguide.com + icons8.com. · VERIFIED.
- **GESTURE CONFLICT = TOUCH SLOP + DIRECTIONAL LOCK** — first gesture to exceed slop threshold wins; Android ~8-12px; iOS UILongPressGestureRecognizer allowableMovement = similar. Without slop, micro-movements trigger wrong gesture. · SOURCE: blog.michaelsam94.com + Apple HIG + Material Design. · VERIFIED.
- **HAPTIC FEEDBACK = MILESTONE PAIRING** — pair haptic with visual at state-change moment (NOT every tick): UINotificationFeedbackGenerator success/warning/error + UIImpactFeedbackGenerator light/medium/heavy + UISelectionFeedbackGenerator ticks. · SOURCE: Apple HIG + ux.detroit3d.com. · VERIFIED.
- **TOUCH TARGET SPACING = 8-10PX BEYOND MINIMUMS** — WCAG 2.2 2.5.8 + Apple HIG: 44x44pt iOS / 48x48dp Android / 48x48px web; 15-30% mis-tap rate at minimum size with zero spacing. · SOURCE: WCAG 2.2 2.5.8 + Apple HIG + uxguides.com. · VERIFIED.
- **LONG-PRESS = POWER-USER ONLY** — no visual cue = low discoverability; Wobbrock 2009 found low agreement. Always provide visible alternative. · SOURCE: Apple HIG + uxpatternsguide.com + Wobbrock 2009. · VERIFIED.
- **EDGE SWIPE NAVIGATION = PLATFORM-RESERVED** — iOS left-edge = back; Android 14+ predictive back; reserve 20-30pt. Overriding platform back = disorientation + App Store rejection risk. · SOURCE: Apple HIG + blog.michaelsam94.com. · VERIFIED.
- **PULL-TO-REFRESH THRESHOLD = 80-120DP = CONVENTION-TIER** — M3 Compose spec: 80dp default; no empirical study validates exact value. · SOURCE: mobileapp.wiki + truetech.dev + Compose Material3 spec. · VERIFIED CONVENTION-TIER.
- **BOUNDARIES:** pull-to-refresh threshold = practitioner convention; haptic generator taxonomy = Apple-only (Android differs); 15-30% mis-tap rate = practitioner convention.
- **FLAGSHIP:** Ghostway MapLibre PWA (map gestures + edge-swipe collisions) + OF Android (gesture-driven navigation) + JP-Lingo Android (card flip gestures, tap feedback) + DM cockpit (mobile row gestures).
- One-shot build checklist line: if the build is mobile/PWA (all fleet apps), reuse 8 canonical gestures + contextual swipe = accelerator-only + pull-to-refresh = feed-only + touch slop + directional lock for gesture conflicts + haptic-visual milestone pairing + 8-10px spacing beyond minimums + long-press = power-user only + reserve 20-30pt edge swipe + pull-to-refresh threshold 80-120dp.
- Full spec: uiux-one-shot-polish references/q250-mobile-gesture-ux.md + web-ui-clickability-testing § Mobile Gesture UX & Touch Interaction Patterns (Q250).
Source: Apple HIG + Material Design + Wobbrock et al. 2009 CHI + Vatavu&Wobbrock 2015 + NN/g + WCAG 2.2 + blog.michaelsam94.com + Apple HIG + Material Design + Apple HIG + ux.detroit3d.com + WCAG 2.2 2.5.8 + Apple HIG + uxguides.com + Apple HIG + uxpatternsguide.com + Wobbrock 2009 + Apple HIG + blog.michaelsam94.com + mobileapp.wiki + truetech.dev + Compose Material3 spec — ledger Q250 B-row, 9 rules + 1 convention-tier verified on independent primaries, 3 boundaries. Direct users: Ghostway MapLibre PWA + OF Android + JP-Lingo Android + DM cockpit.

## Core rule
- A CUSTOM pull-to-refresh gesture is a PATH-BASED gesture (top-of-scroll vertical drag w/ direction+distance+speed thresholds) → it MUST have a single-pointer alternative under WCAG 2.5.1. **CORRECTION:** the W3C Understanding doc contains ZERO occurrences of "refresh" and names NO pull-to-refresh failing example — F105's only examples are the "Z"-gesture undo + swipe-to-reveal. The rule still stands by construction, and 2.5.7 (Dragging) covers it if classed as a drag. Cite **F105's tap-alternative TEST**, NEVER a W3C-named example. A visible Refresh button satisfies the rule — and is the discoverability fix too.
- 2.5.1 covers **author-provided content only**; the browser's own pull-to-reload and native iOS/Android refresh controls are OUT of scope (only a custom JS pull-to-refresh is author content).

## Where NOT to add it
- **NO pull-to-refresh on a pannable map surface** (Ghostway map). Material's Don't list for swipe-to-refresh = navigation drawers + home-screen widgets + **pannable content (maps)**. The visible Refresh control in the control cluster (≥44px, Q8/Q27) is the 2.5.1 alternative AND the sync-queue trigger (Q30) — one control, two jobs.

## Platform control over custom
- Native iOS = `UIRefreshControl`; Android Views = `SwipeRefreshLayout` (maintenance track per Q26 — M3 PullToRefresh is **Compose-only**); Android Compose = `PullToRefreshBox`/`pullToRefresh` modifier. Use the platform control — axe/Lighthouse can't test gesture feel, and platform controls give rubber-band/haptic/indicator free. Never hand-tune gesture px.
- Gesture may anchor at the **BOTTOM** of the list (e.g. chat apps), not just the top. Reversing past the threshold cancels the refresh (Material verbatim).

## Web specifics (iOS Safari constraints)
- Suppress the browser's pull-to-reload with `overscroll-behavior: contain` on the **scroll container** (`none` additionally kills bounce/glow). Support = iOS Safari 16.0+; older iOS can't → prefer a visible Refresh button there. Applies to scroll containers only, not iframes.
- Feedback: keep the indicator visible UNTIL the refresh completes + new content shows; restore scroll position; show error + retry on failure (Material verbatim: "changes may not be immediately obvious").

## When NOT to use pull-to-refresh
- Static/infrequent content, forms with unsaved input, surfaces with auto-sync already (Q30 handles it), and pannable maps. Where a button suffices, a button is simpler + already 2.5.1-compliant.

## Cargo-cult rejected (Q49)
- "Pull-to-refresh on every list" (adds discoverability + 2.5.1 burden where a button suffices).
- "W3C names pull-to-refresh as a failing example" (FALSE — cite F105's tap-alternative test).
- Treating UA/OS-provided refresh gestures as in-scope for 2.5.1 (author content only).

## Agent-consumable checklist line
- [ ] Manual refresh: visible Refresh control exists (WCAG 2.5.1 alternative); NO gesture on a pannable map (Material Don't list + Q27); control doubles as sync-queue trigger (Q30); web uses `overscroll-behavior: contain` (iOS Safari 16.0+) or a visible button on older iOS; native platform control, not hand-tuned px.

## Direct users
- Ghostway (iPhone PWA, MapLibre — button in control cluster = sync trigger; NO gesture on map); DM cockpit (desktop button / auto-poll — gesture unnecessary); OF Android (SwipeRefreshLayout / PullToRefreshBox per stack).

### Q41 — Onboarding & first-run UX · 2026-08-28
- [ ] Default to NO dedicated onboarding; if shipped, it is PULL (contextual help / in-context hint / coach mark), never a PUSH launch modal or deck-of-cards walkthrough. What's-new ships silently + in-context, never as a launch modal. Coach marks: one tip, no chains, distinct from UI.

### Q57 — Scroll-reveal / entrance animations on scroll · 2026-08-28
- **One-shot-stays → IntersectionObserver** (`unobserve` after first entry); **scroll-progress-linked → CSS SDA** `view()`/`scroll()` (per-element reveal = `view()`, progress bar = `scroll()`).
- **`animation` shorthand RESETS `animation-timeline` to `auto`** → declare `animation-timeline` AFTER the shorthand / higher specificity (MDN verbatim).
- **`animation-timeline` = "Limited availability" (NOT Baseline)** → `@supports (animation-timeline: view())` + authored finished-state is MANDATORY; IO = Baseline-Widely-available, SDA = progressive-enhancement layer only.
- **CORRECTION: SDA is scroll-LINKED, not fire-once** — reverses on scroll-back unless `animation-fill-mode: both`; a `view()` reveal never truly stays without IO `unobserve`.
- **`overflow-x: hidden` steals `view()` binding** (creates a scroll container) → use `overflow: clip`.
- **Reduced-motion — scroll-triggered reveals are the exception to Q12:** author finished state fully visible with NO animation under `prefers-reduced-motion: reduce`; opacity-only fade (zero positional change) is the only tolerable residue. Q12 "gentler not zero" stays valid for user-initiated micro-interactions.
- **Do NOT reveal** above the fold (hero reads instantly, Q6) or on dashboards/tools/Operate surfaces (DM cockpit, Ghostway map+list).
- **`rootMargin` negative inset is viewport-relative** — verify threshold on smallest target device (iPhone 390×844 vs desktop).
Source: MDN `animation-timeline`/`animation-range`/`IntersectionObserver.rootMargin` PRIMARY — ledger Q57 B-row, 5/5 verified, 2 corrections + 2 net-new + 1 conflict recorded/resolved (no mechanical test — browser-only behaviour). Direct users: DM Astro marketing (SDA + @supports + IO fallback primary); Ghostway PWA (static info panels only, never map/list; Q54 observer cleanup on client-nav); OF Android = Compose motion / web tier only.

- **Agent-consumable checklist line**
- [ ] Scroll-reveal: one-shot-stay → IntersectionObserver (`unobserve`); scroll-linked → CSS `view()`/`scroll()` inside `@supports (animation-timeline: view())` only; `animation-timeline` declared after the `animation` shorthand; `overflow: clip` not `overflow-x: hidden` (steals view() binding); NO reveal above the fold or on dashboards/tools; reduced-motion → finished state fully visible, opacity-only fade only (Q57).

- **Rejected (Q57)** — (1) "CSS `view()` scroll-reveal fires once and stays" → FALSE, SDA is scroll-linked and reverses (needs `animation-fill-mode: both` + early range, still not truly one-shot; IO is the one-shot path); (2) "reduced-motion = keep a gentle slide on scroll reveals" → FALSE for scroll-triggered entrances, the vestibular trigger is scroll-tied translate/scale — finish fully visible, opacity-only only; (3) "`overflow-x: hidden` is fine near scroll-reveal sections" → FALSE, it creates a scroll container that steals the `view()` binding (use `clip`).

### Q59 — File upload / attachment UX · 2026-08-28
- **ALWAYS a keyboard-accessible BROWSE button** — wrapper `<label for>` + real `<input type=file>`; keep the input in the a11y tree.
- **CORRECTION (kills the common recipe):** do NOT `display:none`/`visibility:hidden` the control input — MDN verbatim: AT treats those as non-interactive. Two valid patterns: (a) sr-only input (`1px box + overflow:hidden + clip-path:inset(50%)`) + `<label>` button (preserves focus ring); (b) `opacity:0` input overlaying the styled control (must sit exactly over the affordance). `display:none` only safe with a SEPARATE real `<button>` calling `input.click()`.
- **Drag-drop is an accelerator only** — the browse button IS the required single-pointer alternative (Q47).
- **`accept` = HINT ONLY** — back with server-side validation (Hono: verify magic bytes, not extension); never present `input.value` (WHATWG `C:\fakepath\…`), use `files[0].name`.
- **Per-file progress lives OUTSIDE the `progressbar`** (descendants are presentational per MDN) — prefer native `<progress>`; `role=progressbar` needs accessible name, `aria-valuenow` OMITTED while indeterminate (not 0), `aria-valuetext` when a bare % is unhelpful; set `aria-busy=true` on the queue region until done.
- **NET-NEW — handle `cancel`:** fires on picker-dismiss OR re-select-same (so `change` does NOT) → add an `idle-after-cancel` branch or the UI hangs in a fake "waiting for file" state.
- **`capture="environment"` + `accept="image/*"`** = field receipt/photo path; omitting `capture` lets the UA offer camera OR library (better field default).
- **WHEN-NOT:** don't ship a dropzone where there's one file and no drag context.
Source: MDN `<input type=file>` (Baseline Widely available since Jul 2015; accept/capture/multiple/File props/cancel event/fakepath) + ARIA `progressbar` role + W3C APG Meter Pattern — ledger Q59 B-row, 5/5 verified, 1 hard correction + 2 net-new (no mechanical test — browser-only behaviour, terminal approval-gated). Direct users: DM cockpit Hono+SQLite (record/attachment upload — primary); Open Finance (receipt image — capture/accept web tier only; Android native picker out of scope); Ghostway PWA (route/image share iPhone field — ≥44px browse, no drag on map).

- **Agent-consumable checklist line**
- [ ] File upload: keyboard-accessible browse button (`<label for>` + real `<input type=file>`, input kept in a11y tree via sr-only clip-path OR opacity:0 overlay — NEVER display:none/visibility:hidden on the control); drag-drop is accelerator only (browse = required single-pointer alternative, Q47); `accept` = hint only + server-side validation; surface `files[0].name` not `input.value`; per-file progress OUTSIDE `progressbar` (prefer native `<progress>`), `aria-valuenow` omitted while indeterminate, region `aria-busy=true`; handle `cancel` event → idle-after-cancel branch; `capture=environment`+`accept=image/*` for field photos; no dropzone where one file + no drag context; Ghostway iPhone ≥44px browse (Q8) (Q59).

- **Rejected (Q59)** — (1) "hide the real file input with `display:none` (not opacity:0)" → REVERSED by MDN verbatim — display:none/visibility:hidden make AT treat the input as non-interactive; use sr-only clip-path input + `<label>` button, or opacity:0 overlay (HARD CORRECTION); (2) "`accept` enforces file type" → FALSE, MDN verbatim it's a hint only + must be backed by server-side validation (magic-byte check); (3) "per-file label/markup inside the progressbar" → FALSE, progressbar descendants are all presentational (MDN) — label must live outside, referenced via aria-labelledby.

### Q56 — Unsaved-changes / dirty-state & navigation-guard UX · 2026-08-28
- **TWO-MECHANISM guard, autosave-first** — autosave/local-draft persistence is the PRIMARY protection (converges Q30 local-store); `beforeunload` is a best-effort FALLBACK only, NOT the data-loss safeguard.
- **beforeunload cannot set custom text** — modern browsers show a generic OS/browser string; the page's returnValue text is ignored (MDN + WHATWG HTML 7.4). CORRECTION: `e.returnValue=""` does NOT trigger the dialog — must be truthy (`= true`, legacy-only); `preventDefault()` is the recommended trigger.
- **Attach listener ONLY while dirty, remove on save** — two PRIMARY reasons: (1) no false prompt, (2) Firefox refuses to bfcache any page with a beforeunload listener (perf regression).
- **beforeunload is unreliable on mobile** — requires STICKY ACTIVATION (no prior gesture ⇒ no dialog at all) and is "not reliably fired, especially on mobile" (MDN verbatim: app-switch then kill fires nothing) → on an iPhone field PWA treat the prompt as BEST-EFFORT only; this INVERTS the naive ordering — autosave-first is primary, the prompt is the fallback.
- **In-app blocker for vanilla-JS SPAs** — Navigation API `navigate` event = Baseline 2026 (newly available Jan 2026, incl. Safari) → a single cancelable `navigation.addEventListener("navigate", …)` intercept is the standards-track replacement for framework canDeactivate / click-hijack+pushState. Boundary: feature-detect `window.navigation` and fall back to link-click interception on older WebViews.
- **Guard dialog** — role=alertdialog + aria-labelledby (visible title) + aria-describedby→message; Esc MUST resolve (Esc=Stay is a safe specialization); verb-labeled Save/Discard/Stay; destructive control placed far (Q38); set aria-modal="true" ONLY when the code truly inerts + obscures outside content (APG — else AT users locked out).
- **WHEN-NOT** — do NOT ship a guard on autosaving surfaces, trivial/low-loss forms, or read-only views; only where losable user work exists (Q38 cry-wolf + Firefox bfcache cost).
Source: MDN `beforeunload` (Usage notes verbatim) + WHATWG HTML Living Standard 7.4 (prompt-to-unload, 2026-08-20) + W3C WAI-ARIA APG Alert & Message Dialogs + MDN `Navigation: navigate` event (Baseline 2026) — ledger Q56 B-row, 5/5 verified, 1 correction + 3 net-new + 1 [needs-evidence] cleared (no mechanical test — dialog/guard needs real browser). Direct users: DM cockpit Hono+SQLite vanilla-JS record-edit (full two-mechanism guard); Ghostway iPhone route-edit (autosave-first + Navigation-API guard, beforeunload best-effort); Open Finance Android native = no beforeunload (Compose/Activity back-handler — OF web tier only).

- **Agent-consumable checklist line**
- [ ] Dirty-state guard (editable records/forms): autosave/local-draft is PRIMARY (converges Q30); beforeunload best-effort FALLBACK only (unreliable on iPhone field PWA, needs sticky activation); attach beforeunload ONLY while dirty + remove on save (else false prompt + Firefox bfcache regression); in-app nav uses Navigation API `navigate` intercept (NOT beforeunload — doesn't cover SPA route changes); guard dialog role=alertdialog + aria-labelledby + aria-describedby, verb-labeled Save/Discard/Stay, aria-modal=true only if outside truly inert+obscured; no guard on autosaving/trivial/read-only surfaces (Q56).

- **Rejected (Q56)** — (1) "Custom beforeunload message text works" → FALSE, browsers show a generic string only (page cannot set it; MDN + WHATWG). (2) "beforeunload reliably protects against data loss, including mobile" → FALSE, requires sticky activation + "not reliably fired, especially on mobile" (MDN) → on iPhone field PWA it's best-effort only; autosave-first is the real protection. (3) "beforeunload fires on every navigation including in-app SPA route changes" → FALSE, beforeunload does NOT cover client-side nav → an in-app blocker is still required (converges Q54).

### Q54 — Client-side navigation / SPA-PWA route UX · 2026-08-28
- **Move focus to the new view's `<h1 tabindex="-1">` on route change** — heading > wrapper-top > nothing (evidence-based: Fable user testing — "focusing on a heading was found to be the best experience"; wrapper-top was "very overwhelming" on large apps). The default SPA behaviour destroys focus with the old markup → resets to `<body>` WITHOUT announcing the new title, leaving a "ghost" focus so Tab lands on a proximate element. This is the #1 SPA a11y failure and is INVISIBLE to axe (manual-remainder per Q23).
- **Keep a VISIBLE focus ring on the programmatically-focused heading** — use `:focus-visible` so mouse clicks don't show it, NEVER `outline:none`. The widely-copied `tabIndex=-1 + outline:none` recipe is REFUTED: Fable found the visible ring was what helped BOTH the magnification user and the Dragon voice user orient.
- **Dual polite aria-live region ("Navigated to …") at app root = BACKUP only** — Fable/Gatsby shipped heading-focus + live-region because NVDA+FF / VO+Safari don't always announce focused elements; keep its text SHORT (duplicate announcements otherwise). Live-region-only is USELESS for sighted magnification/voice users (they hear nothing) → never the primary mechanism.
- **Do NOT move focus on FIRST load** — skip link + `<main>` cover initial exploration (BBC GEL verbatim).
- **`history.scrollRestoration = 'manual'`** (Baseline Widely available since Jan 2020) for per-route scroll stashing; `window.scrollTo(0,0)` on forward nav. View-Transitions `.finished`-before-focus stays single-source [needs-evidence].
- **Assume YOU own focus movement** — frameworks do NOT (BBC GEL verbatim: "Most SPA routers do not emulate these expected behaviours, out-of-the-box"; Next.js announces but doesn't move focus — vercel/next #49386; React Router gives less). Announcing ≠ moving.
- **Boundary — focus a SHORT, narrow heading, never a full-bleed wrapper** — mobile Chrome mid-scrolls + clips a focus target wider than the viewport, cutting off both ends of the text (Fable: "almost better to do nothing"). Single-column, short heading text.
- **aria-current on nav links + every major UI section carries a heading** (even visually hidden) — many SR users navigate by headings, not landmarks (converges Q16/Q39).
- **WHEN-NOT** — true multi-page navigations (Astro/DM marketing site with real page loads; browser already does it) or in-place partial updates that aren't route changes (use live region only). Stack: Ghostway PWA map↔list↔detail = primary (plus narrow-focus boundary); DM cockpit vanilla-JS partial updates = live-region tier unless the URL changes; Open Finance web tier = full rule; OF Android native = out of scope.
Source: BBC GEL "Routing" + Gatsby×Fable 2019 user testing + MDN `History.scrollRestoration` — ledger Q54 B-row, 6/7 verified, 1 correction + 1 refutation + 2 net-new (no mechanical test — needs real AT/browser). Direct users: Ghostway PWA, OF web tier, DM cockpit (URL-changed only).

- **Agent-consumable checklist line**
- [ ] SPA route UX (client-side routing / PWA): on route change, focus moves to new view's `<h1 tabindex="-1">` (NOT first load, NOT a full-bleed wrapper — short narrow heading; mobile Chrome clips wide targets); visible `:focus-visible` ring (never `outline:none`); polite aria-live "Navigated to …" region at app root is BACKUP only; `history.scrollRestoration='manual'` + per-route scroll; assume you own focus movement — frameworks don't (Q54).

- **Rejected (Q54)** — (1) "Use `tabIndex={-1}` + `outline:none` on the focused heading" → FALSE, Fable user testing found the visible ring helped BOTH magnification + voice users orient; keep `:focus-visible`, never remove the ring. (2) "The SPA framework handles focus management for you" → FALSE, BBC GEL: "Most SPA routers do not emulate these behaviours out-of-the-box"; Next.js announces but doesn't move focus; assume you own it. (3) "Live-region announcement is the primary route-change a11y mechanism" → FALSE, useless for sighted magnification/voice users; heading focus is primary, live region is backup only.

### Q51 — Multi-step form / wizard / stepper UX · 2026-08-28
- **Wizard ONLY for NOVICE/INFREQUENT + step-dependent flows** — decision axis = frequency × expertise × step-dependence, NOT field count. Repeated expert entry (DM cockpit txn-entry) is a wizard ANTI-indication (NN/g rec #1: annoying + overly controlling on repeat use); use a single form / inline row-create instead.
- **Progress indicator is CONDITIONAL, never mandatory** — complex/branching setup (OF account/budget) → step list + current-step highlight; short linear mobile flow (Ghostway route-create, DM record-create) → ship WITHOUT one, fix question order/count first (GOV.UK: Carer's Allowance removed a 12-step indicator with no effect on completion rates or times). When an indicator ships, 3-state + never-color-only (Q17).
- **Honest progress** — only show a total step count if reliably computable; on branching flows omit the total rather than fake it. Indicator must track current + remaining.
- **One thing per step** — ask one question per page (legend/label = page heading so SR users hear it once); steps self-sufficient (never require info from another step) (GOV.UK + NN/g).
- **Enforce LINEAR order** (NN/g rec #3) — arbitrary step order = signal to use a single form/tabs (Q45), not a "non-linear stepper". Editing a completed step from a review/summary screen stays allowed.
- **Persist + resume with a summary** (NN/g rec #5) — allow exit midway, save state, resume later; on resume SHOW a summary of answered steps (saved state doesn't restore context). Highest payoff for Ghostway/DM field flows (converges Q30 offline).
- **Back without data loss** (GOV.UK) — always include a Back link; never break browser-back (must return the previous page in its last-seen state). Post-payment/post-submit → sensible message, not a re-run (idempotency, converges Q14/Q38).
- **Step labels conflict** (NN/g vs GOV.UK) — descriptive next-step names (e.g. "Add payment") for app-config wizards; a single consistent "Continue" for repetitive question flows. Surface-class dependent, neither universal.
- **WHEN-NOT** — expert/high-frequency data entry, anything needing cross-step comparison, OF Android/Compose (own stepper/nav semantics). Stack: OF account/budget setup = genuine wizard; DM cockpit txn-entry = WRONG pattern (single form); Ghostway route-create = short mobile flow, no indicator by default + aggressive draft persistence (Q30).
Source: NN/g "Wizards: Definition and Design Recommendations" + GOV.UK "Question pages" — ledger Q51 B-row, 5/9 verified, 2 corrections (field-count threshold, non-linear framing), 2 conflicts (indicator-mandatory, step-labels) resolved by surface class. Direct users: OF account/budget setup, DM cockpit txn-entry (anti-pattern), Ghostway route-create.

- **Agent-consumable checklist line**
- [ ] Multi-step form / wizard (app setup, stepped create): wizard ONLY for novice/infrequent + step-dependent flows; repeated expert entry uses a single form (Q51). Progress indicator CONDITIONAL — complex/branching setup gets a step list + current highlight; short linear mobile flow ships WITHOUT one. One thing per step; linear order enforced; persist+resume with a summary; Back link + unbroken browser-back; idempotent post-submit. Indicator (if any) 3-state + never-color-only (Q17).

- **Rejected (Q51)** — (1) "Progress indicator is mandatory on every wizard" → FALSE, GOV.UK removed a 12-step indicator with no completion change; only ship for complex/branching setups. (2) "Use a wizard when a form has ≥8–10 fields" → FALSE, neither primary source uses a field-count threshold; axis = frequency × expertise × step-dependence. (3) "Non-linear / jumpable steps are a co-equal wizard option" → FALSE, NN/g forbids arbitrary step order; use a single form/tabs (Q45) instead. (4) "Descriptive 'Next' labels universally best" → FALSE vs GOV.UK's mandated "Continue"; surface-class dependent.

### Q43 — Tooltips & popovers UX · 2026-08-28
- **Trigger on hover AND keyboard focus** (WAI-ARIA APG); touch = tap/long-press (no hover). Show-delay 300–500ms (NN/g: 0.1s feedback → wait 0.3–0.5s → show 0.1s); NEVER 0ms.
- **WCAG 1.4.13 Content on Hover or Focus** — must be Dismissible (Esc, without moving pointer/focus), Hoverable (pointer can move onto the tip + its content), Persistent (stays until dismissed or focus/hover leaves). A 1s self-close hides content mid-read (mgifford: min 1.5s if timed).
- **ARIA + contrast** — `role="tooltip"` + `aria-describedby` on the trigger (NOT the `title` attribute — poor for AT/keyboard/touch; axe has NO tooltip rule → manual-audit remainder). Contrast ≥4.5:1 (mechanical: #bbb-on-white 1.92:1 FAIL, dark #1e1e1e/white 16.67:1 PASS); 1.4.13 does NOT exempt contrast.
- **Non-interactive ONLY** — never put links/buttons/inputs inside a tooltip; if the content is interactive use a POPOVER (dialog semantics, focusable, click/tap toggle). Tooltip-vs-popover decision = pure advisory text vs actable content.
- **Disabled-trap** — never bind a tooltip to a `disabled` control (unreachable); use `aria-disabled` on a focusable trigger (Q52) or make the info inline.
- **Essential info belongs INLINE** — tooltips are often the WRONG solution (NN/g + mgifford); persistent visible text / disclosure / dialog preferred (converges Q13/Q17).
- **Positioning** — don't block related content; arrow when clustered; collision-flip on scroll/resize.
- **Agent-consumable checklist line**
- [ ] Tooltips & popovers: trigger on hover+focus, 300–500ms delay (no 0ms); WCAG 1.4.13 dismissible+hoverable+persistent; role=tooltip+aria-describedby (never title); contrast ≥4.5:1; non-interactive only (else popover); never on a disabled control; essential info inline.
- **Rejected (Q43)** — (1) "The `title` attribute is a fine tooltip" → FALSE, poor for AT/keyboard/touch; use role=tooltip+aria-describedby. (2) "Interactive elements inside a tooltip are OK" → FALSE, use a popover (dialog); tooltip must be non-interactive. (3) "0ms tooltip delay for snappiness" → FALSE, 0.3–0.5s show-delay (NN/g); never 0ms.
Source: NN/g tooltip-guidelines + WAI-ARIA APG (tooltip + dialog) + 4×2nd-source (a11y-examples / mgifford / getwcag / codeclaritylab) + mechanical contrast (scratch/q43/contrast_check.py). 10/10 verified, 0 corrections + 2 boundaries + cargo-cult upheld (title-attr-fine, interactive-inside-tooltip, 0ms-delay). Direct users: DM cockpit icon/control tooltips + Ghostway MapLibre POI popups (interactive ⇒ popover not tooltip).

### Q68 — Share & copy UX · 2026-08-28
- **Feature-detect, never assume unsupported** — Web Share (`navigator.share`) works on desktop Chrome (89+ Win / 128+ macOS) / Edge / Safari macOS 12.1+, NOT Firefox (the only evergreen holdout). The "desktop unsupported" claim is STALE. Always ship a clipboard/copy fallback; the fallback chain IS the product.
- **One native share button > social-icon grid** — a single `navigator.share()` button beats a Twitter/Facebook/email icon row (web.dev consensus; Ghostway flagship fit).
- **`AbortError` ≠ failure** — MDN: AbortError fires on user cancel OR no available targets → catch + ignore, never error-toast.
- **`canShare()` false-positives** — unknown keys are silently ignored; `text`+`url` duplicate links on WhatsApp/X → prefer `url` alone.
- **Copy via Clipboard API** (secure-context) + `execCommand` fallback; microcopy 'Copied!' ~2s label-swap, no modal.
- **Web Share Target** = inbound PWA (manifest `share_target` + SW 303) — real, flag Ghostway.
- **Private-data share** → confirm + narrow payload.
- **CRITICAL gesture rule** — call `share()` DIRECTLY in the click handler; an `await` before it consumes the user gesture → `NotAllowedError`.
- **Agent-consumable checklist line**
- [ ] Share & copy: feature-detect `navigator.share` + always ship clipboard fallback; one native share button > social-icon grid; AbortError = cancel, not failure; Clipboard API + execCommand fallback; 'Copied!' microcopy; call share() directly in handler (no await-gesture).
- **Rejected (Q68)** — (1) "Social-icon share grid is best practice" → FALSE, one native share button wins (web.dev). (2) "'Copied to clipboard' is the right copy" → FALSE, use 'Copied!'. (3) "AbortError = share failed" → FALSE, it's user-cancel/no-targets. (4) "Web Share is mobile-only / desktop unsupported" → FALSE (2026), Firefox-only holdout is the correct caveat.
Source: MDN Navigator.share + caniuse 2026 + w3tweaks/kevinliu/claudecodeguides PRIMARY ×2. 7/8 verified, 1 correction (mobile-first framing stale). Direct users: Ghostway iPhone (native sheet — primary), Open Finance (share txn/account), DM cockpit Hono+SQLite (export/share record), DM Astro (share article).

### Q39 — Navigation & menu design · 2026-08-28
- **Verified (8/8, NN/g menu-design 17-guidelines + hidden-nav study + mobile-discoverability + breadcrumbs PRIMARY ×4 + 2nd-source ×6 DesignRush2025/EULE&CorsoUX2026/Telerik/iDevie/searchenginewatch/peterjonour):**
  - Visible nav = gold standard. Hidden nav (hamburger) is a necessary evil for small screens only; it's measurably used less + later (Slate 17% hidden-top-right vs ~42% avg desktop; SupermarketHQ 89% task-success with salient labeled menu).
  - Damage-control checklist (if hiding): word label "Menu"/"Browse" + arrow + real button signifiers; never group with the logo. "Menu" label beats bare icon (~+20% CTR, Foster2014/Caffeineinformer).
  - Expose 4–5 PRIMARY items; push the rest into a labeled menu. Hamburger acceptable for 20+ sections when 4–5 primaries are visible.
  - **Current-location indicator = most-common navigation mistake** — mark active link with `aria-current="page"` + a visible state that is NOT color-only (converges Q17).
  - Breadcrumbs: hierarchy-not-history; current page is NOT a link; flat sites skip; mobile = no-wrap + shorten to last levels.
  - Left-vertical nav fine for broad hierarchies (>7–9 top-tier OK — the 7±2 limit is a working-memory myth misapplied to nav).
  - Bar-vs-hamburger decided by item count (Telerik: combination nav can match/exceed fully-visible).
- **Boundary:** hamburger ICON recognition is now high (NN/g 2022 recognizability study) — the "users don't know the hamburger" critique is obsolete; the hidden-CONTENT usage cost still holds (DesignRush 2025: core finding unchanged).
- **One-shot build checklist line:** if the build has site/app navigation, use visible nav by default; if a menu, label it + signifier it + expose 4–5 primaries + `aria-current="page"` on active; breadcrumbs for deep hierarchy.
- **Rejected (Q39):** (1) "hamburger is dead / never use it" → overclaim; legitimate small-screen pattern when hidden correctly; (2) "a hidden nav costs 50–80% usage" → vendor stat, not representative; (3) "a labeled hamburger lifts CTR 30–40%" → unsupported A/B claim; (4) "navigation must respect 7±2 items" → myth (7±2 = working-memory span, not a nav cap).
- **Direct users:** DM Astro visible global nav; DM cockpit vertical sidebar (all-visible, >7 OK); Ghostway PWA app nav.

### Q61 — Modal / overlay / dialog design patterns · 2026-08-28
- **Verified (10/10, W3C APG Dialog Modal + aria-modal + MDN `<dialog>` + NN/g modal-nonmodal PRIMARY ×4 + 2nd-source ×3):**
  - When-to-use modal = critical/irreversible/blocking/short/urgent only; NN/g 5 modal harms (disorientation, focus/nav loss, context loss, memory load). Prefer page/nonmodal/in-place otherwise.
  - ARIA contract: `role="dialog"|alertdialog` + `aria-labelledby` (visible title) + optional `aria-describedby` + Esc; destructive `alertdialog` → focus LEAST-destructive (Cancel), not confirm.
  - Focus mgmt (APG): focus-in-on-open, Tab/Shift+Tab wrap, return-focus-to-trigger; dismissal multi-path (Esc + close/cancel + light-dismiss scrim).
  - NET-NEW boundaries: native `<dialog>.showModal()` ALREADY traps focus (inert top-layer) → DO NOT add JS focus-trap on top; `aria-modal="true"` does NOT confine focus/inert content (MDN verbatim) — only mark when code blocks all outside interaction AND styling obscures, else AT severe-harm; native `<dialog>` is SINGLE-INSTANCE — `showModal()` on a 2nd open THROWS → sequence nested modals or use popover/library.
  - Responsive: M3 bottom-sheet (scrim + 640dp cap + 28dp radius + 48dp drag-handle) on mobile; MUI full-screen ≤sm.
- **One-shot build checklist line:** if a modal/overlay is needed, use native `<dialog>.showModal()` (no JS focus-trap); set `aria-labelledby`; focus the least-destructive control on destructive dialogs; never rely on `aria-modal` alone for confinement; sequence nested modals; convert to bottom-sheet on mobile.
- **Rejected (Q61):** (1) "`aria-modal='true'` alone makes a dialog modal / traps focus" → FALSE (MDN verbatim: developer must implement). (2) "modals boost conversion" → FALSE. (3) "always show a close (X) button" → FALSE for consequential real-response dialogs (omit X). (4) "always focus the Close button" → FALSE — focus the least-destructive (Cancel) on destructive dialogs.
- **Direct users:** DM cockpit edit/confirm modals (native `<dialog>` showModal + method=dialog forms), Open Finance M3 dialogs, Ghostway info/picker modals.

### Q62 — Card / tile component design · 2026-08-28
- **Verified (9/9, NN/g cards-component PRIMARY + Bootstrap stretched-link + M3 cards; MECHANICAL nested-interactive test scratch/q62):**
  - Card vs table: cards for HETEROGENEOUS BROWSING of one object; POOR for dense search + cross-row COMPARISON → use a table/list (converges Q29). Don't card-ify every collection.
  - Anatomy (container / headline / subhead / supporting-text / image / actions) must keep the SAME relative positions across every card (inconsistent internals kill scannability).
  - **Clickable card = STRETCHED-LINK, not a whole-card wrapper:** title is an `<a>` with `::after { position:absolute; inset:0; border-radius:inherit }` on the card (`position:relative`) → whole card clickable, ONE tab stop, ONE name (heading), NO nested interactive. A whole-card `<a>` WRAPPING `<button>`/`<input>` = INVALID HTML (interactive-in-interactive) + verbose SR text — MECHANICALLY PROVEN. Whole-card focus ring via `:focus-within`/`:has(a:focus-visible)`. Three patterns by destination count: (a) whole card one link, (b) heading-only link, (c) CTA-only. Secondary actions = SIBLING buttons.
  - M3 variants: Elevated (shadow 1dp) / Filled-tonal (0dp, preferred) / Outlined (1dp); shadow only to SEPARATE from bg (Q3/Q4). Corner 12dp, padding 16dp, dragged elevation 8dp mobile.
  - State layer = ~8% on-surface OVERLAY on hover, NOT lift-only (fails non-mouse, Q12); focus-visible 2px outline (Q21); pressed ~10–12% overlay [needs-evidence].
  - Images: `object-fit: cover` + defined height (M3 194dp); alt = IMAGE CONTENT not destination (Berkeley a11y); image not sole click signal.
  - Density: 16–24dp padding (Q2 pins 24 for cards), max-width ~320–350px, 24px gap; NEVER shrink text — truncate (1–2 lines).
  - Selected/checkable = explicit state not color-only (Q17); 2.5.7 drag alt if draggable (Q47).
  - Mobile reflow: 1-col <640px / 2-col small / multi ≥768–1024px; reflow not shrink (Q8/Q29).
- **One-shot build checklist line:** if a collection of objects is shown as cards, use a stretched-link (title `<a>` + `::after` overlay) NOT a whole-card `<a>` wrapping buttons (invalid HTML); keep per-card anatomy positions consistent; M3 tonal variant; state-layer overlay not lift-only; max-width ~320–350px + 24px gap; truncate not shrink; reflow to 1-col on mobile; selected/checkable state not color-only. For dense comparable rows use a table (Q29).
- **Rejected (Q62):** (1) "Cards suit every collection, including dense comparable tables" → FALSE, NN/g: cards poor for dense search/comparison (use Q29). (2) "Wrap the whole card in `<a>` containing buttons/inputs" → INVALID HTML (interactive-in-interactive), mechanically flagged; use stretched-link + sibling button. (3) "Nested cards (card inside card)" → anti-slop tell (Q18), invalid/confusing. (4) "Hover-only affordance (no focus/visible state)" → fails non-mouse + keyboard (Q12/Q21).
- **Direct users:** DM cockpit record cards, Ghostway POI/route cards, Open Finance account/txn cards, DM Astro marketing cards.

### Q73 — Camera / photo & media permission UX · 2026-08-28
- **PREFER the system picker over a permission prompt** — `<input type=file accept="image/*" capture="environment">` opens the native camera with NO permission prompt (preferred Ghostway field-photo path); omitting `capture` lets the UA offer camera OR library (better field default). `<input type=file accept="image/*">` / Web Share surface the OS picker with NO library grant (iOS PHPickerViewController(iOS14+)/PhotosPicker(iOS16+), Android Photo Picker 13+) — gold-standard privacy (avoids full-library GPS/exif/faces).
- **`getUserMedia`+permission = in-app live preview only** — the file-input / system-picker path needs no permission at all.
- **Photo-library access levels** (native): None / Add-only(.addOnly) / Limited(user-selected subset = SAFE DEFAULT) / Full(.readWrite = GPS+exif+faces risk). Web/PWA never requests above the picker.
- **If you DO prompt:** user-GESTURE only (never on load/timer → NotAllowedError; iOS Safari/Chrome require the gesture); HTTPS secure-context mandatory. One-time permissions (Chrome M116 "Allow this time", Firefox115/Safari per-session) are NOT persistent → design for re-prompt each session.
- **`permissions.query({name:'camera'|'microphone'})` MUST be wrapped in try-catch + feature-detect** before `getUserMedia` — unsupported names THROW TypeError, not return a state.
- **Denied/limited → graceful fallback** (upload-from-library, manual entry), never a re-prompt loop. OS tab indicator is browser-controlled (don't fake).
- **Info.plist usage descriptions (NSCamera/NSMicrophone/NSPhotoLibrary*UsageDescription) = NATIVE app / WKWebView ONLY** — they CRASH if missing and are NOT applicable to a pure web PWA. Web analog = benefit-framed prompt copy (converges Q33).
- **Agent-consumable checklist line**
- [ ] Camera/photo permission: prefer system picker — `<input type=file accept="image/*" capture="environment">` opens native camera with NO prompt; if prompting, user-gesture only + HTTPS; permissions.query wrapped in try-catch; one-time grants not persistent (re-prompt each session); denied → upload-fallback; Info.plist = native-only (N/A web PWA).
- **Rejected (Q73)** — (1) "Always request camera permission for photo capture" → FALSE, the system picker / file-input+capture avoids the prompt entirely for field photos. (2) "You lose ~30%+ of users if you don't prompt" → FALSE, that 30% is the GEOLOCATION post-interaction ALLOW-rate (Q33), not a camera-loss stat. (3) "`permissions.query({name:'camera'})` without try-catch" → FALSE, unsupported names THROW TypeError. (4) "One-time permission persists across sessions" → FALSE, design for re-prompt.
Source: web.dev permissions-best-practices PRIMARY + Apple PHPicker/PhotosPicker docs + Mozilla/Chrome one-time-permissions blog + webrtchacks Safari guide + Twilio 31208 iOS-gesture (2nd-source ×4). 8/8 verified, 1 cargo-cult correction + 2 boundaries. Direct users: Ghostway field photos/POI, Open Finance receipt capture, DM cockpit attachments.

### Q44 — Notifications: push-permission + transient-messaging hierarchy + badges · 2026-08-28

Verified 8/8 (web.dev permissions-best-practices + NN/g push-mistakes + 5×2026 iOS-Web-Push sources + M3 Snackbar SOURCE-VERIFIED via Q38).

**In-app severity hierarchy (pick by loss-if-missed):**
- **toast** = non-critical passive auto-dismiss ("Saved"/"Copied") — only for info safely missed.
- **snackbar** = toast + ONE action (Undo/Retry; converges Q38); M3 SHORT 1500ms / LONG 2750ms.
- **banner** = persistent until dismissed (sync/offline status, converges Q30).
- **modal** = blocking critical decision (converges Q61).
- If the user would be upset to miss it → NOT a toast; critical errors must NOT auto-dismiss.

**Duration:** M3 1500/2750ms authoritative for OF Android; web "3–5s" is a looser non-spec band; actionable/critical errors need hover-pause, no auto-dismiss. Android `Toast` deprecated → `Snackbar`; Badging API = non-color signal (Q17).

**Push permission:** gesture-only (never on load), 77%→12% allow / 30% post-interaction, offer email alternative, no re-prompt once denied. iOS Safari Web Push = **installed-PWA-only** (window.PushManager undefined in tab, no Background Sync); subscriptions die in 1–2 wks → handle 404/410 resubscribe. Push content: value-before-ask, no first-launch ask, no bursts, transactional>promotional, ~4KB.

- **One-shot build checklist line:** if the build has toasts/notifications, use severity hierarchy (toast for missable-only; snackbar+action for undoable; banner persistent; modal for critical) — never auto-hide critical errors; gesture-only push ask; iOS push needs installed PWA.

**Rejected (Q44):** (1) "Ask for push on first launch" → FALSE, kills trust + allow-rate (77%→12%). (2) "Toast critical errors" → FALSE, hides failures users must act on. (3) "iOS Safari Web Push works in any browser tab" → FALSE, installed-PWA-only (window.PushManager undefined in tab). (4) "Badge/red-dot everything for re-engagement" → FALSE, non-color-only + restraint (Q17).

### Q74 — Money / currency & numeric amount UX · 2026-08-28

Verified 11/11 (MDN Intl.NumberFormat + inputmode + WHATWG autocomplete + 7-source convergence + mechanical scratch/q74_money.js).

**Input:** `<input type="text" inputmode="decimal">` for money (NOT `type=number` — spinner + locale-reject + float traps); `numeric` reserved for integer-only; `autocomplete="transaction-amount"`. Signed money needs an explicit +/- (decimal keypad may lack minus).

**Value model:** STORE integer minor units (integer cents) — floats corrupt (`0.1+0.2` ≠ 0.3, mechanically proven); format with `Intl.NumberFormat` at RENDER; normalize to integer cents BEFORE formatting (JPY 0dp / KWD 3dp precision is currency-derived, never hardcoded).

**Formatting & display:** currency SYMBOL = adornment, never in the value; FORMAT ON BLUR (setting `input.value` resets caret); forgive pasted/formatted input (parse-strip), never reject it; negative = minus-before-symbol (`-$1,234.50`), accounting `(…)` via `currencySign:'accounting'`, never color-only; totals right-aligned + `tabular-nums` (Q9) + label/error/`aria-live`.

**Rejected (Q74):** (1) `type=number` for money → FALSE, spinner/locale-reject/float traps. (2) Format-every-keystroke → FALSE, caret-reset trap. (3) `toFixed` money → FALSE, no grouping/locale. (4) Float cents → FALSE, silent corruption (`0.1+0.2`≠0.3). (5) Red-only negatives → FALSE, color-only signal (WCAG 1.4.1).

- **One-shot build checklist line:** if the build has prices/amounts, use `<input type="text" inputmode="decimal">` (not `type=number`) + `autocomplete="transaction-amount"`; store integer minor units (cents), format with Intl.NumberFormat at render; symbol as adornment; format-on-blur + forgive pasted input; tabular-nums + right-align totals; never signal negative by color only.

### Q75 — RTL / bidi & localization-ready layout UX · 2026-08-29

Verified 9/9 (MDN logical properties + CSS-Tricks + simplelocalize + better-i18n + ottospace/Shadeed + JAD Apps + W3C Arabic Text Layout, 7-source convergence).

**Default to logical properties:** write `margin-inline` / `padding-block` / `inset-inline` / `inline-size` instead of physical `*-left/right/top/bottom` — new code "has no good reason for physical" (MDN), so RTL flips for free.

**`dir` on `<html>` root from the locale + `lang`:** set the HTML attribute even when CSS handles mirroring (in case CSS fails); `dir=auto` is a spec-flagged last resort. Derive `dir` from locale + script (Azeri is LTR-or-RTL).

**Mirroring is automatic for flex/grid** (row direction follows `dir`); floats, `translateX`, and physical `left/right` do NOT mirror — use `transform: scaleX(-1)` for directional content, never animate `margin-left/right` (Q12/Q57).

**Icon mirroring is directional-vs-semantic:** back arrow / chevron / progress FLIP in RTL; logo / clock / check / gear / camera KEEP orientation (Material/HIG/JAD agree).

**Per-script font fallback:** ship an Arabic (or script-specific) `@font-face` + `unicode-range` so joined scripts use their own face (converges Q34).

**Per-script optical tracking — CRITICAL:** a positive tracking token is an LTR convention; Arabic letter-spacing MUST be 0 (W3C Arabic Text Layout: tightening joined glyphs yields undesirable results). Scope any tracking token to LTR scripts only — never apply the global LTR value to Arabic runs (converges Q1/Q21).

**Text-expansion resilience:** UI strings grow on translation — European (German/Finnish) ~+30–40%, Arabic ~±15% (the "~30–40% everywhere" rule is EUROPEAN-only). Apply a +30–50% pseudo-locale test globally; full UI mirroring (not just text alignment) is mandatory for RTL.

**Rejected (Q75):** (1) "Just add `dir=rtl`" → FALSE, physical CSS (floats/translateX/left-right) won't mirror; you need logical properties. (2) "Mirror everything" → FALSE, semantic icons (logo/check/clock) must keep orientation. (3) Global optical-tracking tokens → FALSE, Arabic letter-spacing must be 0 (breaks joined glyphs). (4) "Text expands ~30–40% everywhere" → FALSE for Arabic (~±15%); the higher rate is European-only.

- **One-shot build checklist line:** if the build may ever serve a non-LTR / non-English surface, write CSS with LOGICAL properties as the default (not an i18n afterthought), set `dir` on `<html>` from the locale + `lang`, scope the optical-tracking token per-script (Arabic letter-spacing=0), reserve per-script font fallback, and apply a +30–50% pseudo-locale test for text-expansion; full UI mirroring (flex/grid auto, floats/translateX via scaleX(-1)) is mandatory for RTL — Keaton's surfaces are en-US today, so this is build-time readiness, no retrofit.

### Q63 — Haptic feedback UX · 2026-08-28

Verified 6/6 (W3C Vibration API Impl Report Aug-2025 + caniuse + Apple HIG + Android VibrationEffect/VibratorManager ×3-source convergence).

**Platform reality:** iOS Safari + iOS PWA have NO Vibration API — WebKit never shipped it and formally opposes it (W3C Impl Report: single-engine Blink only); caniuse: Safari 3.1→26.5 (incl iOS, incl TP) Not supported; Firefox 129+ removed. Global ~77% = Android-Chromium only. CORRECTION: iOS `navigator.vibrate` is `undefined` (API never shipped), NOT a silent no-op → feature-detect `if ('vibrate' in navigator)`; conclusion unchanged (no iOS-web haptics).

**When to use:** confirm user actions (toggle/select/save), signal limits/boundaries (scroll end-stop, slider detent), surface success/warning/error in flows, continuous scrub (picker) — NOT every tap, NOT long-list scroll, NOT passive/background events, NOT decorative.

**Design rules:** semantic presets by meaning (Apple notification=success/warning/error, impact=light/medium/heavy, selection=selectionChanged; Android VibrationEffect); fire AT the visual-change moment; pair with visual/audio — NEVER haptic-only (a11y, converges Q17 non-color-only); optional + respect Settings/System-Haptics + bind `prefers-reduced-motion` (same guard as Q12/Q57).

**Scope/boundary:** haptics meaningful only on Android mobile (Open Finance / DM-web-Android); Ghostway iPhone PWA = none (native-app argument if critical); desktop Chrome returns true but has no hardware → no-op.

**Rejected (Q63):** (1) haptics-on-every-tap → FALSE, motor/noise fatigue. (2) haptic-only confirmation → FALSE, violates a11y (Q17). (3) "iOS Vibration API works" → FALSE per W3C/caniuse (WebKit never shipped). (4) UIFeedbackGenerator-in-iOS-PWA → impossible (native apps only).

- **One-shot build checklist line:** if the build has Android-mobile interaction (Open Finance / DM-web-Android), use haptics for confirm-action / boundary / flow-success / continuous-scrub only — never every-tap, never haptic-ONLY (pair visual+audio); make optional + respect Settings/System-Haptics + `prefers-reduced-motion`; on iOS-web/Ghostway PWA ship NO in-PWA haptics (feature-detect `if ('vibrate' in navigator)`); native iOS needs UIFeedbackGenerator (out of web scope).

### Q47 — Drag-and-drop UX · 2026-08-28

Verified 9/9 (W3C WCAG22 2.5.7 Understanding + NN/g drag-drop/touch-target PRIMARY ×3 + MDN aria-grabbed; 2 [needs-evidence] CLEARED — ~100ms preview, 1cm×1cm handle; 2 bonus rules).

**When to use:** only where users EXPECT it and no cheaper control exists — NN/g expect+no-cheaper-alt gate. A menu/number-input/select wins over DnD for reorder/resize when the set is small or the action is rare. Pair a DnD with a more-precise companion (drag to approximate, arrow keys to fine-tune — Photoshop); on mobile prefer a menu-driven move over DnD. Don't drag for the sake of it.

**Two types:** resizing objects vs moving objects need DIFFERENT micro-interaction design (NN/g). Resize targets (e.g. column width) need a numeric/preset alternative, not just a sibling handle.

**Signifiers:** never invent a custom grab icon (confusable with hamburger/kebab, direction poorly conveyed) — use the platform's standard cursor (Mac open→closed hand, Windows crossbar; CSS native classes). Grab-handle is acceptable ONLY as a known affordance on a known-draggable element.

**Grabbed feedback:** outline/contrast/drop-shadow/offset/ghost on the lifted item; neighbors "push apart" with a QUICK (~100ms) eased animation BEFORE release, tied to Nielsen 0.1s instant limit (converges Q12/Q14). The reshuffle must trigger when the CENTER of the dragged object overlaps the target edge — NOT the object's edge, NOT the cursor (edge = mushy, cursor = premature). Drop-zone magnetism needs an EXPLICIT active-zone signifier (dotted border / highlight-on-approach / snap) — never proximity alone.

**Touch:** ≥1cm (~64pt) drag space around the handle (stricter than Q8's 44pt/48dp, looser only under the misleading 96dpi reading); tap-vs-swipe-vs-grab timing delay + haptics; `prefers-reduced-motion` → snap instead of animate (Q12).

**A11y / WCAG 2.5.7 (AA):** every DnD MUST have an equivalent SINGLE-POINTER (non-dragging) alternative — up/down buttons, a popup/move menu, a numeric/text input, or click-on-track (slider). The alternative "does not have to be the same component"; a text input counts (its on-screen keyboard is tappable). KEYBOARD support ALONE does NOT satisfy 2.5.7 (touch users may have no physical keyboard; the two SCs are evaluated independently) — but a visible up/down/menu alternative discharges it. `aria-grabbed`/`dropeffect` are DEPRECATED — drive grabbed/position/action state with `aria-live` + `aria-pressed`/roles. 2.5.7 does NOT auto-exempt a JS map (MapLibre's own pointer pan is not user-agent scroll) — supply +/-/buttons (Q27), don't claim exemption.

**Rejected (Q47):** (1) "drag-only sortable list is fine" → FALSE, fails 2.5.7 without a non-drag alternative. (2) "keyboard support makes DnD accessible" → FALSE, 2.5.7 needs a pointer-alternative (touch users). (3) "`aria-grabbed`/`dropeffect` for drag state" → DEPRECATED, use ARIA live + roles. (4) "DnD is always intuitive" → FALSE, NN/g's expect+no-cheaper-alt gate; skip DnD where a menu/input is cheaper.

- **One-shot build checklist line:** if a build uses drag-and-drop (Ghostway route-stop reorder, OF category reorder, DM drag-upload/column-resize), give EVERY draggable a single-pointer non-drag alternative (up/down buttons / move menu / numeric input / click-track) — keyboard support alone fails WCAG 2.5.7; use the platform cursor not a custom grab icon; ~100ms push-apart on center-overlap + explicit drop-zone signifier; ≥1cm touch handle + haptics; reduced-motion → snap; drive state with `aria-live` (not deprecated `aria-grabbed`).

### Q64 — Slider / range input UX · 2026-08-29

Verified 8/8 (W3C APG slider + multi-thumb PRIMARY + NN/g Slider Design: Rules of Thumb ×2-source convergence; M3/Android docs).

**When to use:** sliders select IMPRECISE/APPROXIMATE values only — volume/brightness/radius/filters where an approximate value is good enough. If an exact value matters, use a text/number input or pair the slider with an editable field (NN/g: precise slider selection needs fine motor skill, error-prone esp. touch).

**Always-visible value label:** above or beside the thumb (NN/g: "above or beside, rather than below, in order to remain visible while selecting"); on touch, above the finger. Dual-thumb: label BOTH thumbs (Min/Max).

**WAI-ARIA SLIDER pattern (single + multi-thumb):** role=slider on each focusable thumb; aria-valuemin/valuemax/valuenow (decimals); aria-valuetext when the value isn't user-friendly (e.g. "$3,200" / "84°F"); aria-label names the purpose ("Minimum price"); aria-orientation=vertical if needed. Dual-thumb = two role=slider thumbs on one rail; each independently focusable + labeled; TAB ORDER stays CONSTANT regardless of value/position; prevent crossing with minSeparation.

**Keyboard:** each thumb in the tab sequence; Arrow L/R/Up/Down = ±1 step; Home/End = min/max; PageUp/Down = larger step.

**Native is best for web:** `<input type="range">` carries role=slider + valuemin/max/now IMPLICIT (no ARIA needed) — prefer it for DM cockpit, Ghostway, OF web. M3: 48dp min touch-target (boltuix + developer.android), value label on select, discrete = stepSize + tick marks; ~4dp visual handle (touch-target vs visual-handle distinction resolves the [needs-evidence] handle-size question).

**Rejected (Q64):** (1) slider-for-exact-value → FALSE, NN/g: precise selection is error-prone. (2) no-value-label / label-below → FALSE, NN/g: must be visible above/beside. (3) silent-crossing dual-thumbs → FALSE, minSeparation required.

- **One-shot build checklist line:** if a build uses a slider (DM cockpit filter sliders, Ghostway map radius/zoom, OF budget-amount), use it only for approximate values (pair with an editable field for exact input); always-visible value label above/beside the thumb (above-finger on touch), both thumbs labeled on dual-range; WAI-ARIA role=slider + aria-valuemin/max/now + aria-valuetext + aria-label; constant tab order + minSeparation on dual-thumb; keyboard Arrow/Home/End/PageUp-Down; prefer native `<input type=range>` (implicit ARIA); M3 48dp touch-target.

### Q65 — Dropdown / select / combobox component UX · 2026-08-28

Verified 9/9 (W3C APG combobox + listbox PRIMARY ×2 + NN/g Dropdowns Design Guidelines ×2 + 2026 `appearance:base-select` boundary).

**Default: styled NATIVE `<select>`.** 2026 boundary: Chrome 133/135 + Edge 135 + Safari 27 (beta) ship `appearance: base-select` / customizable `<select>` → native `<select>` is now FULLY styleable (per-option styling, custom arrow, open/closed states). A custom `div[role=listbox]` recreates semantics/keyboard/type-ahead/SR/form-submit native gives FREE and regresses (WebAIM Million / React Select). Default to a STYLED NATIVE `<select>`; build a custom combobox ONLY when you need editable type-to-filter inside the field or rich per-option markup.

**Combobox vs listbox vs menu-button (pick the right one):** combobox = a value is SELECTED INTO a field (form-filling / attribute-selection; the field shows the choice) — W3C APG combobox. listbox = a standalone single/multi selection widget (`role="listbox"`). menu-button = triggers an ACTION (Q53) — NOT a value dropdown; never use a dropdown for command menus.

**APG combobox (when custom is justified):** select-only (button + listbox popup, no free text) vs editable (input + listbox popup, type-to-filter). ONLY required ARIA = `aria-expanded` on the trigger; plus `aria-controls` → listbox, `aria-activedescendant` → highlighted option, `aria-autocomplete` when filtering. DOM focus STAYS on the combobox/input; `aria-activedescendant` tracks the option. Native type-ahead + Arrow/Home/End/Enter/Esc.

**Usage (NN/g 4 types):** USE DROPDOWNS LESS OFTEN — they hide options and add a click. Prefer radio buttons for ≤5 options; avoid a dropdown when typing is faster (US state / country — type-ahead or search). Keep a visible LABEL (placeholder ≠ label). Lists >15 options MUST be searchable/type-ahead or swapped for an alternate control. Disabled options stay VISIBLE + `disabled`/`aria-disabled` + explain why (don't silently drop).

**Rejected (Q65):** (1) custom-when-native-suffices → FALSE now; styled native `<select>` (base-select) covers almost all cases and avoids a11y regressions. (2) dropdown-for-everything → hides options, adds friction; prefer radios ≤5. (3) placeholder-as-label → keep a real visible `<label>`. (4) >15 unsearchable list → add type-ahead/search or alternate control. (5) dropdown-for-actions → use a menu button (Q53). (6) disabled-option-without-aria-disabled → keep visible + `disabled` + explain.

- **One-shot build checklist line:** if a build uses a select/dropdown (DM cockpit record selects, Ghostway POI category + sort, OF account/category/sort), DEFAULT to a STYLED NATIVE `<select>` (2026 `appearance:base-select` makes it fully styleable) — only build a custom combobox for editable type-to-filter; combobox = value selected into a field (`aria-expanded` + controls + activedescendant; focus stays on input), menu-button (Q53) for actions NOT value selection; keep a visible `<label>` (placeholder ≠ label); >15 options must be searchable; disabled options stay visible + `aria-disabled` + explain.

### Q66 — Tags / Chips / Pills component UX · 2026-08-29

Verified 5/5 (M3 spec mirror + material-components-android Chip.md + CoreUI a11y + mechanical contrast test scratch/q66_contrast.py; 1 HARD correction + 1 correction + 2 net-new).

**Taxonomy by BEHAVIOR not word:** Tag = static/user label, non-interactive. Chip = interactive (select/filter/input/removable; the ✕ IS the chip's remove action). Badge = system status/count. Terminology collides across libraries (Ant Design's removable "Tag" = M3 "Chip") → encode behavior→styling→semantics, never literal class names. A static element styled like a removable filter chip but non-actionable = an affordance trap (converges Q15/Q52).

**M3 metrics (verified, resolves [needs-evidence]):** container height 32dp, shape 8dp radius, icon 18dp, L–R padding 16dp (8dp with icon), 8dp between elements; only the close affordance needs ≥48dp (Q8), not the whole chip.

**Removable-chip a11y:** the remove control gets an explicit `aria-label` "Remove X" (NOT a bare "✕"); keyboard Delete/Backspace removes the focused chip. CORRECTION: there is NO dedicated WAI-ARIA APG "chip" pattern — input chips build on the APG combobox, selectable chips = button/toggle-button. Don't invent `role=chip`.

**Contrast (HARD correction):** the chip's readable LABEL is text → WCAG 1.4.3 = **4.5:1**, NOT 3:1. Only the 1px outline/icon that conveys state gets the 1.4.11 3:1 non-text floor. (Mechanical: M3 #1C1B1F on #EADDFF = 13.28:1, #49454F on #EADDFF = 7.25:1 — both pass 4.5.) Never apply the "3:1 label" myth to chip text.

**Rejected (Q66):** (1) label-only-3:1-on-chips → FALSE, chip text = 4.5:1. (2) `role="chip"` APG pattern → does not exist; built on combobox/button. (3) static-looks-removable → affordance mismatch; only make it look removable if it removes. (4) whole-chip-as-button-for-removable → use a real close button inside, keep the chip container a list/listitem or generic.

- **One-shot build checklist line:** if a build uses tags/chips/filter pills (DM cockpit filter chips, Ghostway POI categories, OF budget categories, DM Astro tags), classify by behavior (tag = static / chip = interactive-removable / badge = system status); ship M3-style metrics (32dp height, 8dp radius, 8dp gaps, ≥48dp close target); removable chips get `aria-label="Remove X"` + Delete/Backspace; chip TEXT contrast = 4.5:1; never invent `role="chip"` (build on combobox/button); don't style static elements as removable.

Source: M3 spec mirror + material-components-android Chip.md + CoreUI a11y + mechanical contrast (scratch/q66_contrast.py) — ledger Q66 B-row, 5/5 verified, 1 hard correction (label 4.5:1 not 3:1) + 1 correction (no APG chip pattern) + 2 net-new (≥48dp close, behavior-not-word taxonomy). Direct users: DM cockpit filter/category chips, Ghostway POI category chips, OF budget categories, DM Astro marketing tags — applies at build time, no project retrofit.

### Q67 — Master-detail / split-view layout UX · 2026-08-29
- Use master-detail ONLY for browse-then-inspect of ONE object where the detail pane shows supplementary info + action on the SAME object (DM cockpit record-list↔detail, Ghostway map↔POI↔detail, OF account-list↔txn-detail; converges NN/g data-tables task #3 view/edit single row). DON'T use for simple/flat content or when a single page suffices (Fiori verbatim).
- Adaptive collapse by WINDOW SIZE CLASS not device — up to 3 panes (List/Detail/extra) on wide, single stack on compact (M3 `ListDetailPaneScaffold` + iPadOS compact=1/regular=2–3 columns; confirms Q8); never hardcode pane widths.
- Default state = first item SELECTED OR an illustrated empty-detail message (never a blank detail, converges Q11).
- Selection signal = bg + indicator, NOT color-only (Q17), PERSISTENT across filter/sort/paging (Q37) + pane resize.
- No WAI-ARIA APG master-detail pattern exists → mark detail pane `role=region` + `aria-labelledby`, active row `aria-current` (real WAI-ARIA attr; resolves [needs-evidence]). M3 size thresholds = compact <600dp / medium 600–839 / expanded ≥840 (convention).
- **One-shot build checklist line:** if the build has a list↔detail surface (DM cockpit record-list↔detail, Ghostway map↔POI↔detail, OF account-list↔txn-detail), use master-detail only for browse-then-inspect of one object; collapse to a single stack on compact widths (size classes, not device); default to first-item-selected OR an illustrated empty-detail (never blank); selection signal = bg+indicator not color-only, persistent across filter/sort/paging.
- **Rejected:** master-detail-for-everything; hardcoding pane widths; blank-detail pane; no-selection-indicator.

Source: SAP Fiori List-Detail + Android M3 ListDetailPaneScaffold + iPadOS NavigationSplitView/HIG — ledger Q67 B-row, 8/8 verified, 0 corrections. Direct users: DM cockpit record-list↔detail, Ghostway map↔POI↔detail, OF account-list↔txn-detail — applies at build time, no project retrofit.

### Q69 — Print & PDF / export styling UX · 2026-08-29

Verified 10/10 (MDN @page + print-color-adjust PRIMARY + 5-source convergence).

**@page physical setup:** `size:A4`/`letter` + margins; physical units (mm/cm/in/pt ≈ 2.6mm per px) — px IS VALID in @page (the "never px" rule is overstated); `:first`/`:left`/`:right` for cover/duplex; named pages `@page wide{size:A3 landscape}`.

**Hide screen chrome:** `@media print{ nav,header,footer,aside,.no-print,button,.toast,.cookie-banner,video,iframe{display:none!important} }` — display:none, not visibility:hidden.

**Reset canvas to pt:** `body{background:#fff!important;color:#000;font-size:11pt;line-height:1.5}` (1pt=1/72in for print type).

**Force ink:** `print-color-adjust:exact` per-element (NOT global — "global slows complex PDF" is UNVERIFIED; per-element is safest).

**Break control:** keep blocks together `table,tr,figure,pre,.card{break-inside:avoid}`; heading+content `h1..h6{break-after:avoid}`; flex/grid CHILDREN ignore `break-inside:avoid` → wrap in a block `<div>`.

**Orphans/widows:** `p{orphans:3;widows:3}` (Chromium default 2/2).

**Reveal link URLs on paper:** `a[href^='http']::after{content:' (' attr(href) ')';font-size:.85em}` but NOT `a[href^='#']::after`.

**Running headers/footers + page numbers:** `@page{@bottom-center{content:'Page ' counter(page) ' of ' counter(pages)}}` — Chrome/Edge/Brave 131+ AND Safari 18.2+ (Dec 2024); Firefox still ABSENT.

**Print-only blocks + PDF capture:** print-only CSS blocks for the on-paper layout; headless-Chromium export = `preferCSSPageSize` + `printBackground` for faithful output.

**Rejected (Q69):** (1) print-is-dead → FALSE for DM cockpit / OF budget-tithing reports. (2) forgot-hide-nav → FALSE, print shows whole app chrome. (3) print-looks-like-screen → FALSE, must reset to pt + white bg. (4) cross-browser CSS page numbers → now TRUE Chrome/Safari 131+/18.2+, FALSE Firefox. (5) "NEVER px in @page" → overstated, px valid (≈2.6mm).

- **One-shot build checklist line:** if the build exports/prints (DM cockpit reports, OF budget/tithing, DM Astro pages), set `@page` physical size+margins, `@media print` display:none on nav/header/footer/.no-print/buttons, reset canvas to 11pt pt, `print-color-adjust:exact` per element, `break-inside:avoid` (wrap flex/grid children in block divs), `orphans/widows:3`, reveal http link URLs, page numbers via `@page @bottom-center` (Chrome/Safari only); NEVER ship print CSS that looks like the screen.

### Q70 — Passkey / WebAuthn / passwordless sign-in UX · 2026-08-29

Verified 7/7 (FIDO Passkey Central + web.dev passkey-form-autofill + NIST 800-63-4 + useideem/eBay convergence).

**Conditional UI is PRIMARY entry:** `autocomplete="username webauthn"` on the username field + `navigator.credentials.get({mediation:'conditional'})` on page load → FIDO = highest sign-in success (useideem >60%, eBay 75% post-login auto-prompt). Dedicated "Sign in with a passkey" button LESS effective → only when multiple methods sit side-by-side.

**Never passkey-only — always graceful fallback:** password / email-OTP / "Try another way"; cross-device = synced passkey > QR > email OTP.

**Copy library (FIDO UX WG):** "passkey" consistently; never "WebAuthn credential" / "biometric login"; error = "Sign-in wasn't completed" + "Try again, or use another way" (NOT raw NotAllowedError); recovery = "Sign in another way".

**No 2nd factor after a passkey** (phishing-resistant) — except enterprise AAL3 device-bound (NIST 800-63-4, final Jul-31-2025, synced passkeys = AAL2) may need step-up.

**Phased rollout:** create-passkey after password+2FA sign-in, auto-create on cross-device; Signal API for missing/updated creds. **Educate off-page** (OS owns the UI).

**Rejected (Q70):** (1) dedicated-passkey-button-always → FALSE, autofill/conditional UI wins (FIDO user-testing + eBay 75%). (2) passkey-needs-2FA → FALSE for AAL2. (3) passkey-only → FALSE, graceful fallback mandatory. (4) educate-on-signin-page → FALSE, OS owns the UI.

- **One-shot build checklist line:** if the build has auth (Open Finance, DM cockpit login, Ghostway PWA), make conditional UI the primary passkey entry (`autocomplete="username webauthn"` + `credentials.get({mediation:'conditional'})` on load), ship graceful fallback (password / email-OTP / "Try another way") — never passkey-only, use "passkey" terminology (never "WebAuthn credential"), error copy "Sign-in wasn't completed" + "Try again, or use another way", educate off-page (OS owns UI); phased create-passkey after password+2FA sign-in.

### Q71 — Timeline / activity-feed / changelog UX · 2026-08-28
- **Verified (10/10, 5-source convergence + W3C APG Feed + MDN RelativeTimeFormat PRIMARY):** event anatomy Actor+Verb+Object(+before→after); `Intl.RelativeTimeFormat` (Baseline 2020) for <24h → absolute; group/collapse repeated + lead human-vs-system; color/icon BY TYPE not user; unread on visibility(IO) NOT hover + Mark-all-read; additive client-side/local filters + URL/server query; virtualize >100; deep links; empty/loading states; W3C APG `role=feed`+`article`+`aria-posinset/setsize/busy`.
- **Boundaries:** W3C `role=feed` = auto-loading infinite-scroll structure → OVER-ENGINEERED for Keaton's BOUNDED logs (use `role=list`/`region` + headings); mark-read-on-visibility misfires on fast scroll (pair w/ dwell or detail-open); relative strings need JS recompute (SSR stale); engagement-social-feed patterns = anti-pattern for functional logs.
- **One-shot build checklist line:** if the build has a functional activity log / changelog (DM cockpit record log, OF txn feed / budget activity, Ghostway trip history), use a chronological event stream with Actor+Verb+Object anatomy, `Intl.RelativeTimeFormat` (<24h relative → absolute), type-colored events (not user-colored), IO-based unread + Mark-all-read, additive filters, virtualize >100, deep links, and empty/loading states; bounded logs = `role=list`/`region` + headings (reserve W3C `role=feed` for truly streaming feeds).
- **Rejected:** social-feed engagement patterns (infinite scroll / like counts) for functional logs; mark-read-on-hover (keyboard/SR miss it); color-only event signaling (Q17).

### Q76 — Video & media player UX + delivery · 2026-08-29
- **Native player over custom** — prefer `<video controls>` / a proven hosted player; a custom control bar must implement name+role+state per control, `:focus-visible` 2px (Q21), ≥24/44px targets (Q8/2.5.8), and no keyboard trap inside the bar.
- **Captions are Level A, not optional** — prerecorded → 1.2.2 (A), live → 1.2.4 (AA, no feasibility escape), audio description 1.2.3 (A) → 1.2.5 (AA); use CLOSED `<track kind=captions>` (resizable/recolorable) over burned-in; 4.5:1 on a semi-transparent bg + resize to 200% (1.4.4); transcript ≠ caption substitute.
- **Autoplay rules** — never with sound (1.4.2); muted decorative only with `autoplay muted loop playsinline` + a visible pause/stop (2.2.2 — muted does NOT exempt motion) + fully suppressed under `prefers-reduced-motion`.
- **Video is NOT the LCP** — a separate prioritized `<img fetchpriority=high>` is the LCP element; attach `<video>` src in `requestIdleCallback`, `preload=none`, bail on Save-Data; non-hero = `loading=lazy` + `preload=none` + AVIF/WebP poster.
- **Delivery** — WebM+MP4 `<source>` + `aspect-ratio` reserve (no CLS); custom-player keyboard map (Space/←→/↑↓/M/F) converges Q64; no flashing >3/s (2.3.1).
- **CONFLICT resolved** — 2.2.2's 5s condition is moving/blinking/scrolling only; a muted looping background video still needs pause/stop (auto-updating prong, Q48, no 5s exception).
- **One-shot build checklist line:** if the build has video (DM Astro hero/product, Ghostway tutorial, OF web), prefer native `<video controls>`; captions Level A (closed track, 4.5:1 + semi-transparent bg, 200% resize); never autoplay with sound; muted decorative only with `playsinline` + visible pause + `prefers-reduced-motion` suppression; video is NOT the LCP (prioritized `<img fetchpriority=high>` + requestIdleCallback src attach + `preload=none`); non-hero = `loading=lazy` + `preload=none` + AVIF/WebP poster; WebM+MP4 + `aspect-ratio` reserve.
- **Rejected (Q76):** (1) muted-autoplay-is-a11y-safe → FALSE, 2.2.2 needs pause/stop + reduced-motion suppression. (2) 'poster-enough-for-LCP' → overstated, poster IS a valid Chromium LCP candidate but a prioritized `<img>` gives reliable fetchpriority control. (3) 'preload=metadata is lightest' → overstated, `none` is lightest for user-initiated video. (4) custom-player-if-it-looks-right → FALSE, missing name/role/state + focus + trap fails 4.1.2/2.4.7/2.5.8.

### Q77 — Session timeout / idle-logout & re-authentication UX · 2026-08-29
- **2.2.1 Timing Adjustable is Level A and covers SERVER-SIDE expiry** — a content-set time limit with no visible timer must still be turn-off-able / adjustable ≥10× / warn+≥20s extend. Real-time, essential OTP, and limits >20h are the only exceptions.
- **Pick a strategy by risk class** — (a) preserve user data (autosave draft → cheapest for long forms, converges Q56/Q14), (b) very long inactivity window (>20h makes 2.2.1 + 2.2.6 moot), or (c) warn+extend (sensitive sessions that must keep an idle cap).
- **2.2.6 Timeouts = AAA** — warn users AT THE START of a process how long inactivity causes data loss, UNLESS data is preserved >20h. Preservation beats a copy warning.
- **Warning-dialog anatomy** — `role=alertdialog` + focus moved to 'Stay signed in' (Q61) + countdown in an `aria-live=polite` region (a visual-only countdown gives SR users zero notice) + verb-labelled buttons ('Stay signed in' / 'Sign out now', Q38/Q52) + Esc MUST NOT silently mean logout + ≥20s is the WCAG floor (prefer 1–2 min lead on a 15-min session) + extending MUST RESET the whole timer, not tack on a sliver.
- **NIST numbers are risk-tiered, not a flat '15 min'** — AAL2 = 12h/30-min idle + 12h absolute; AAL3 = 12h/15-min idle (800-63B + ASVS v4.0.3 V3.3). '15 min standard' is an AAL3/PCI-DSS number; DM cockpit + Open Finance ≈ AAL2 → 30-min idle + 12h absolute.
- **Idle ≠ absent** — slow typists / AT / screen-reader users are working; don't treat no-input as no-user.
- **One-shot build checklist line:** if the build has an authenticated/idle session (DM cockpit, Open Finance, Ghostway field PWA), set a server-side timeout that is warned + extendable + non-destructive; prefer data-preservation (autosave draft, Q56/Q30); warning = `role=alertdialog` with focus on 'Stay signed in', `aria-live=polite` countdown, verb buttons, Esc≠logout, extend RESETS timer; DM/OF ≈ AAL2 (30-min idle + 12h absolute), NOT a flat 15 min; axe blind to server-side timeout → manual-audit remainder (Q23).
- **Rejected (Q77):** (1) '15 min is the standard timeout' → FALSE, AAL3/PCI number; AAL2 (DM/OF) = 30-min idle. (2) '20s warning is enough' → FALSE, 20s is the WCAG floor, prefer 1–2 min lead. (3) 'a toast is fine for session expiry' → FALSE, must be an alertdialog with focus + live countdown. (4) 'silent logout is a security virtue' → FALSE, destroys unsaved work + fails 2.2.1/2.2.6; warn + preserve instead.

### Q78 — Sorting UX for tables & record lists · 2026-08-29
- **Sortable header = REAL `<button type=button>` inside `<th scope=col>`** filling the cell, identical `:hover`/`:focus`, focus ring wraps label+icon; NEVER make `<th>` focusable/clickable — fails 4.1.2 Name/Role/Value (APG + 3 2nd-sources) · W3C APG Sortable Table PRIMARY · verified by 5-source convergence.
- **`aria-sort` ONLY on the currently-sorted `<th>`**, exactly one `asc|desc` at a time, MOVED not duplicated (`ascending|descending|none|other`; `none` = default) · MDN aria-sort verbatim · verified.
- **Non-color direction cue** = CSS arrow (`aria-hidden`) + off-screen instruction in `<caption>` NOT `title` attr (converges Q17/Q43) · APG · verified.
- **Announce via `aria-live=polite` status** (debounced) — re-sort changes no focus (converges Q40) · APG role=status · verified.
- **Default sort = deliberate task-matched choice** (recency/amount/name) NOT DB order · NN/g "Stop Burying Sort Controls" + uxpatternsguide · verified.
- **Sort ≠ filter** — both visible, not buried; "Relevance" only where relevance exists · NN/g · verified.
- **Alphabetical WRONG for ordinal/lifecycle values** (status/workflow) → sequence order · Baymard/tweakwise · verified.
- **DEBUNKED**: sortable table needs `role=grid` (FALSE — APG plain `<table>`; never role=grid just to make rows clickable), `aria-sort=none` required everywhere (none=default), color-only arrows, silent re-sort. Source: W3C APG Sortable Table + MDN aria-sort + NN/g "Stop Burying Sort Controls" + Baymard/tweakwise; 5-source convergence (axe blind to aria-sort → manual remainder).
- **One-shot build checklist line:** if the build has sortable tables/lists (DM cockpit record tables, OF txn/budget lists, Ghostway POI/route lists), put a REAL `<button>` inside each sortable `<th scope=col>` (never `<th>` focusable), set `aria-sort` only on the active column, show a non-color arrow + `<caption>` instruction, announce re-sort via `aria-live=polite`, and pick a deliberate default sort (not DB order); mobile mirrors state in a `<select>`/sheet.
- **Rejected (Q78):** (1) "sortable table needs role=grid" → FALSE (APG uses plain `<table>`; role=grid changes the keyboard model); (2) "set aria-sort=none on every column" → FALSE, none is the default value; (3) color-only sort arrows → fails 1.4.1 non-color signaling; (4) silent re-sort (no live announcement) → SR users don't know the order changed.

### Q93 — Manual screen-reader / AT test method · 2026-08-29
- **Automated tools catch only ~30–40% of WCAG issues** — Deque ~30% of criteria; UK GDS best 40% / WAVE 30% / axe 29%. A human AT pass is MANDATORY before ship; never green-axe-and-done. axe/Lighthouse is a FLOOR, not certification · WebAIM Survey #10 + Deque coverage report + UK GDS 2018 + 2nd-source cross-check.
- **Min test matrix (solo OSS defensible floor):** NVDA + Chrome or Firefox (Windows, free) = highest-leverage pass; VoiceOver + Safari for macOS; TalkBack + Chrome for Android. macOS VoiceOver ≠ iOS VoiceOver → Ghostway iPhone MUST be tested on a REAL iPhone, not macOS VO.
- **Reader split is regional** — WebAIM Survey #10 (n=1,539): JAWS 40.5% / NVDA 37.7% / VO 9.7% desktop; 91.3% use a reader on mobile; 71.6% use >1 reader. 'Test JAWS, it's #1' is US-centric (JAWS 55.5% N.America vs NVDA 69.9% Africa/ME, 70.8% Asia) — free NVDA+VO covers the floor.
- **Repeatable per-flow script** — one row per step → keystroke | expected announcement | WCAG SC / APG pattern satisfied (diffable, citable; testers-not-users epistemic guard).
- **Fast triage walk** — page title announced (not 'Untitled') → heading walk (H/1–6) for logical hierarchy → landmark walk (D in NVDA; VO rotor) → link walk (K/L) for out-of-context link text → image walk (G) for alt QUALITY not presence → forms mode (label + error associated) → tables (R/C headers; layout table as data table = fail).
- **Keystroke crib** — NVDA Ctrl+Alt+N start/stop; VO Cmd+F5; NVDA Speech Viewer (Tools) renders speech as TEXT = best sighted-tester tip + pasteable evidence.
- **Task-completion smoke test** — complete a core flow with SR ON, then a monitor-off pass (works WITHOUT seeing the screen).
- **One-shot build checklist line:** before 'done', run axe/Lighthouse (Q23) AND a manual AT pass — NVDA+Chrome/Firefox (Windows) + VoiceOver (macOS) + TalkBack+Chrome (Android); test Ghostway on a REAL iPhone (macOS VO ≠ iOS VO); per-flow script = keystroke | expected announcement | SC/APG; triage order title→headings→landmarks→links→images→forms→tables; never ship on green axe alone.
- **Rejected (Q93):** (1) 'axe/Lighthouse catches most issues' → FALSE, ~30–40% ceiling (fabricated '21.3%/24.7%' AI-content-farm stats are not real); (2) 'macOS VoiceOver validates Ghostway iPhone' → FALSE, different engine/behaviour; (3) 'screen-reader testing = ask users' → FALSE, run it yourself with the triage script (testers-not-users); (4) 'JAWS is the #1 reader to test' → US-centric; NVDA+VO covers the global floor.

### Q96 — Settings / preferences screen design · 2026-08-29
- **Save-semantics contract (the core, verified):** a SWITCH commits IMMEDIATELY — M3 'effects start immediately, without needing to save'; a CHECKBOX/RADIO commits only on Save/Apply — NN/g 'checkboxes must NOT act until OK'. So a screen with a Save bar uses checkboxes; an autosave screen uses switches. CORRECTION to SLOT A: 'NEVER mix save models' OVERSTATES — a switch must ALWAYS be immediate, but mixing immediate switches with explicit-Save text inputs on one screen is the norm (iOS/Android) and is fine. Per-control contract, not a per-screen ban.
- **Autosave is not free** — NN/g Nextdoor: removing the Save button increases cognitive cost → if you autosave, you MUST show explicit per-change confirmation ('Saved' + timestamp) so the user knows the system took the change.
- **Defaults over settings** — every new toggle is a failed default; pick a polite default (M3 'decide for me, but let me have final say'), don't add a preference. Settings search is the escape hatch for dense surfaces.
- **IA budget (Android thresholds, verified):** 7↓ no group / 8–10 → 1–2 dividers / 11–15 → 2–4 dividers / 16+ → subscreens. CORRECTION: 'never Other/Misc' is TOO ABSOLUTE — Android's own guideline permits 'OTHER' for true singletons; prefer specific titles but 'Other' is allowed for the ungroupable.
- **Per-row status + progressive disclosure** — every settings row shows its CURRENT value as secondary text under the label (glanceable without opening); long explanations move to a second screen; settings-search is the dense-surface escape hatch.
- **Labels:** sentence case; positive/neutral wording (never destructive-sounding toggle labels).
- Source: M3 Switch spec + NN/g Defeated-by-a-Dialog-Box + NN/g Don't-Prioritize-Efficiency-Over-Expectations + Android source.android.com settings-guidelines · 7/8 verified, 1 conflict + 1 correction. Relevance: DM cockpit admin/app settings, Open Finance budget/tithing prefs, Ghostway PWA map/units/voice/offline prefs, DM Astro global (Q46 theme switch is one row of this surface).
- **One-shot build checklist line:** if the build has a settings/preferences surface, use a SWITCH for immediate-apply controls and a CHECKBOX/RADIO for Save-bar controls (a switch is always immediate; don't ban mixing them on one screen); if autosave, show a 'Saved' + timestamp confirmation; prefer a good default over a new toggle; group with dividers at the Android budget (7↓ / 8–10 / 11–15 / 16+); allow 'Other' only for true singletons; show current value as per-row secondary text.
- **Rejected (Q96):** (1) 'never mix save models on one screen' → FALSE (per-control contract; switches-always-immediate + explicit-Save text inputs coexist on iOS/Android); (2) 'never use an Other/Misc bucket' → too absolute (Android permits 'Other' for true singletons); (3) 'autosave needs no confirmation' → breaks the fill-form-then-save mental model (NN/g Nextdoor); (4) 'a new setting beats picking a good default' → inverted (defaults-over-settings).


### Q103 — Permission-aware / role-based UI UX · 2026-08-29
- **Decision question (the core, verified):** "Will this user EVER be able to interact with this element?" YES → DISABLE it (temporary restriction, filter-incompatible, relevant-but-not-editable value, action-not-yet-available e.g. "Export in progress…"); NO → HIDE it (permissions, access control, safety/security, admin-only overrides) — role-gated admin controls must be HIDDEN, never a wall of disabled buttons.
- **Default preference = keep it ENABLED + explain on interaction** (inverts the common LLM habit of pre-disabling the submit button; converges Q52/Q96). NEVER hide buttons or key filters by default — users expect them to persist.
- **Upgrade-gated features are the one case where DISABLED beats HIDDEN** (teaches the UI + communicates upgrade value) + offer a "Hide all unavailable" toggle; allow collapsing sections dense with disabled functionality.
- **Disabled without explanation = the failure mode** — always state WHY + HOW to re-enable.
- **No layout shift** when toggling show/hide of permission-scoped chrome (converges Q35/Q37 CLS discipline).
- **A11y contract:** native `disabled` removes the control from the tab order + is undiscoverable by keyboard + blocks form submit → use ONLY when it should also be keyboard-undiscoverable; `aria-disabled="true"` stays focusable/discoverable (announced "dimmed"/"unavailable"), needs JS to suppress activation + manual styling, works on `<a>`/custom widgets — use when the control must stay discoverable + explainable (also the fix for Q43's tooltip-on-disabled trap). Hidden controls must be removed via `hidden`/`inert`/conditional render, never `opacity:0`/off-screen (converges Q92 focus-order, Q60 forced-colors).
- **Disabled visuals need ≥2–3 independent signals** (opacity + cursor:not-allowed + color), never color/opacity alone (converges Q17); WCAG has NO contrast minimum for disabled controls, so disabled ≠ license for illegible text.
- **Alternatives ladder before disabling:** enabled-button-with-explanation > read-only state > better empty state (Q11) > hide/reveal accordion (Q45) > error on attempt > user customization.
- **Server-side truth:** hidden/disabled UI is UX, never authorization — every gated action must be enforced server-side (403), and the client 403 surface needs its own copy (what happened / whose account / what to do — Q11+Q98). Q81 covers 404/offline pages only; 403 is a distinct surface.
- **CONFLICT/NUANCE (HashiCorp Helios):** pushes "avoid disabled entirely; show enabled + CTA" (disabled = inaccessible to AT) → tempers "disable to teach UI". RESOLUTION: hide for permission-gated (never render admin buttons to non-admins); for visible-but-blocked keep `aria-disabled` (explainable, keyboard-discoverable) over native disabled (invisible to keyboard).
- Source: PRIMARY MDN `aria-disabled` + Smashing/Friedman 2024 + Salomon hide-or-disable + uxpsychology + HashiCorp Helios design-system · 6/6 verified on primary + 4 independent 2nd-sources; 2026-08-29. Relevance: DM cockpit admin-vs-viewer = flagship (hide destructive admin actions from viewers); Open Finance locked/premium/account-scoped = disabled+explain; Ghostway N/A; DM Astro minimal.
- **One-shot build checklist line:** if the build has roles/admin/upgrade-gating, HIDE controls the user can NEVER use (don't render admin actions to non-admins); for visible-but-blocked use `aria-disabled="true"` + suppress activation in JS + show why/how-to-enable (not native `disabled`, which is keyboard-invisible); never hide via `opacity:0`/off-screen (use `hidden`/`inert`); no layout shift on show/hide; upgrade-gated features may stay disabled + offer "Hide all unavailable"; unauthorized = a proper 403 view (what/when/what-to-do), not a dead button.
- **Rejected (Q103):** (1) "disable the submit button until the form is valid" → contradicted by Friedman/Salomon/rauno-tier (keep enabled + explain on invalid submit); (2) "tooltip explains a disabled button" → broken by design (disabled elements don't fire hover/focus — Q43); (3) "disabled = gray and undiscoverable is fine" → WCAG has NO disabled-contrast minimum, so illegible disabled text still fails; (4) "render a disabled wall of admin buttons to non-admins" → hide instead; (5) "a 403 is just another disabled button" → 403 needs its own view copy.

### Q104 — Timestamp / date-time display & time-zone semantics · 2026-08-29
- **Absolute vs relative is a TASK gate** — use RELATIVE ("2h ago") only for self-consistent, low-stakes feeds (activity stream, "last sync"); use ABSOLUTE (localized) wherever the user reconciles against an external record (ledgers, invoices, transaction logs, audit/tithing) — relative time misleads on cross-check. · Cloudscape(AWS)/HPE design systems + PatternFly + UX.SE/W3C CLDR; verified 2nd-source convergence + mechanical Intl test.
- **Store ISO 8601 instant + IANA zone; render via `Intl.DateTimeFormat`** — never surface raw ISO to end users (a local `Date` serializes to a shifted UTC instant: 14:32 Denver → 21:32Z); never mix `dateStyle`/`timeStyle` with `day`/`month` `parts` in one format call (TypeError). · Intl API; verified mechanically (scratch/q104/intl_test.js).
- **TZ label must use `Intl timeZoneName:'shortOffset'|'longOffset'` → `GMT-5`/`GMT-05:00`, or IANA Region/City** — `Intl 'short'` emits the AMBIGUOUS `EST`/`EDT` (mechanically proven). Normalize to the viewer's TZ + label once; show a 2nd zone only for located/cross-TZ events; store the instant + IANA zone, never a fixed offset (DST correctness). · verified mechanically.
- **Month-as-word beats MM/DD** (`07 January 2026`) — kills the MM/DD vs DD/MM ambiguity; assert AM/PM via `includes()` not exact-match (en-US "1:00 PM" vs en-AU "1:00 pm"). · verified mechanically.
- **a11y:** wrap machine-readable times in `<time datetime="…">`; expand abbreviations with `<abbr aria-label>`; do NOT put ticking/relative times in a live region (announce churn). · MDN/HTML spec.
- Source: Cloudscape(AWS) + HPE design-system + PatternFly + worldtick + UX.SE/W3C CLDR 2nd-source convergence + mechanical Intl test (scratch/q104) · 9/9 verified, 2026-08-29. Relevance: all 4 stacks (DM cockpit record/activity log, Open Finance txn/tithing, Ghostway route-history/offline-sync, DM Astro post dates); OF/DM ledger rows = absolute+localized, Ghostway field "last updated" = relative + absolute-on-hover.
- **One-shot build checklist line:** if the build shows timestamps, pick absolute-vs-relative by TASK (relative only for self-consistent low-stakes feeds; absolute+localized for anything reconciled against a record); store ISO-8601 instant + IANA zone and render via `Intl.DateTimeFormat` (never raw ISO, never mix `dateStyle`+`parts`); label TZ as `GMT±hh:mm`/IANA Region-City (not ambiguous `EST`/`EDT`); prefer month-as-word; wrap in `<time datetime>`; no live region for ticking times.
- **Rejected (Q104):** (1) "show `EST`/`EDT` timezone abbreviations" → FALSE, ambiguous across DST (use `GMT-5`/IANA); (2) "display raw ISO-8601 timestamps to users" → FALSE, local `Date` shifts to UTC instant; (3) "MM/DD is universal" → FALSE, MM/DD vs DD/MM ambiguity (use month-as-word).

### Q105 — Avatar / user-identity display component · 2026-08-29
- **Accessible name = the real person/entity, IDENTICAL across the fallback chain** — when the avatar is the ONLY identification (no visible name beside it), its accessible name MUST be the person's name. Photo, initials, and glyph fallbacks for ONE person must all expose the SAME name, so blocking the image so a fallback renders yields the same SR announcement. · Source: MDN `role=img` + W3C ACT rule 307n5z (presentational children) + eBay Evo Web + Spirit DS + A11y Context · VERIFIED: 4/4 groups + mechanical accname test (scratch/q105_accname.mjs, 4/4 PASS).
- **Decorative vs meaningful alt** — if a visible text name sits beside the avatar, the avatar is decorative → `alt=""` (or `aria-hidden`); if the avatar IS the identity, the name lives on the avatar (see above). Never leave a name-less image a SR reads as "image".
- **Non-`<img>` fallbacks need `role="img"` + `aria-label`, with the visible glyph/text `aria-hidden`** — for `role=img` ALL descendants are presentational (W3C ACT 307n5z), so the accessible name MUST live in `aria-label`, NOT in the visible initials/glyph text. Mechanical: a `<span role=img>` with visible initials but no `aria-label` → empty accname (broken).
- **Banned accessible names** — never use the file name, `"avatar"`, `"image"`, `"photo"`, or `"profile picture"` as the name; never pair `alt=""` with `aria-label` (that restores the image role and double-announces).
- Convergence extras (SLOT A, no conflict): Polaris size ladder 20/24/28/32px; deterministic initials from a stable hash (NOT an hsl-based color hash) + contrast-safe token palette; avatar GROUPS cap at 3–5 with a labeled `+N` overflow; presence/status dot MUST be non-color-only (icon/ring + text, converges Q17).
- Source: MDN + W3C ACT 307n5z + eBay Evo Web Avatar + Spirit DS + A11y Context PRIMARY convergence · 4/4 verified, 0 corrections. Relevance: DM cockpit technician/user rows + record author + activity-log rows (Q71), Open Finance account/profile identity, Ghostway saved-place/share author.
- **One-shot build checklist line:** if the build shows avatars/identities, give the avatar an accessible name = the real person/entity name (identical across photo/initials/glyph fallback); decorative avatars (name shown beside) → `alt=""`; non-`<img>` fallbacks need `role="img"` + `aria-label` with the visible glyph `aria-hidden` (descendants are presentational); BAN `alt`/`aria-label` of "avatar"/"image"/"photo"/filename; never pair `alt=""` with `aria-label`; cap avatar groups at 3–5 + labeled `+N` overflow; presence dot non-color-only.
- **Rejected (Q105):** (1) `alt="avatar"` / `alt="image"` / `alt="profile picture"` → FALSE, announces a useless duplicate; (2) visible initials inside `<span role="img">` with no `aria-label` → FALSE, descendants are presentational so the name is empty; (3) `alt=""` paired with `aria-label` → FALSE, restores the image role (double announce); (4) file name as the accessible name → FALSE, leaks a UUID / `IMG_4921.jpg`.

### Q112 — Scroll containers & scrollbar UX · 2026-08-29
- **A scrollable region MUST be keyboard-focusable** — give the scroll container `tabindex="0"` (or a focusable child); axe `scrollable-region-focusable` is a built-in WCAG 2.1.1 (A) Serious rule (already in the Q23 gate) · WHY: keyboard/speech/sip-puff users are stranded outside content clipped by the scroll box otherwise · SOURCE: Adrian Roselli keyboard-only-scrolling-areas + Deque scrollable-region-focusable + Chrome Dev blog (Chrome 127) · VERIFIED: PRIMARY ×3 convergence, 3/3 groups.
- **Keep `tabindex="0"` UNIVERSALLY** — Chrome 127 + Firefox now make scrollers focusable BY DEFAULT when no focusable child, but Safari STILL needs the explicit attribute AND it is required for screen-reader naming → harmless in Chromium/FF, required in Safari, so set it everywhere (don't branch by UA).
- **Name it, but pick the right role** — `tabindex="0"` + `role="region"` + `aria-labelledby` gives an SR a name; BUT `role="region"` is a LANDMARK, which adds noise to SR region navigators → use `role="group"` for low-value panes (Roselli). axe still flags unnamed scrollers either way.
- **Overflow affordance** — show the scrollbar when scrollable, hide it when not (a visible bar promises more content); use `scrollbar-gutter: stable` / a visible native bar — Ghostway iPhone overlay panes otherwise show ZERO affordance · converges Q21 scrollbar-styling LLM tell.
- Source: Adrian Roselli (keyboard-only-scrolling-areas 2022 + responsive-tables + accordion post) + Deque scrollable-region-focusable + Chrome Dev blog (Chrome 127, Jun 2024) PRIMARY convergence · 3/3 verified, 0 corrections. Relevance: DM cockpit wide tables/log panes, Ghostway POI/route list panes, Open Finance web tier, DM Astro pre/code blocks.
- **One-shot build checklist line:** if the build has a scrollable region (tables, sidebars, log/output panes, list panes), set `tabindex="0"` on the scroll container (or a focusable child); name low-value panes with `role="group"` + `aria-labelledby` (use `role="region"` only when it deserves a landmark); show the scrollbar when scrollable (`scrollbar-gutter: stable` / visible native bar — especially on Ghostway iPhone overlay panes); never hide a scrollable area with no keyboard-focus path.
- **Rejected (Q112):** (1) "Chrome auto-focuses scrollers, so I don't need tabindex=0" → FALSE in Safari + no SR name in any engine; (2) a custom/hidden scrollbar that removes the native bar → strips the overflow affordance (NN/g: a visible bar promises more content); (3) `role="region"` on every scroll pane → landmark noise in SR navigators; use `role="group"` for low-value panes.

### Q94 — Voice / speech INPUT UX (dictation + hands-free command) · 2026-08-29
- **Voice is an accelerator, never the primary path.** `SpeechRecognition` is webkit-prefixed everywhere it exists (Chrome 25+/Edge 87+/Safari 14.1 macOS / 14.5 iOS / Samsung 4+; Firefox disabled-by-default; legacy Android WebView none) → feature-detect `('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window)` and ship the typed/tap path as the real UI · SOURCE: caniuse Speech Recognition API + whatpwacando.today + webreflection + SO WKWebView · VERIFIED: 8/8 groups, 2nd-source ×3.
- **Installed iOS PWA / WKWebView BLOCKS speech recognition** (confirmed 3× independently: works in Safari on iOS but not for installed web apps; WKWebView "permission check failed") → Ghostway standalone mode MUST have typed destination entry; voice can never be the only route.
- **`continuous = true` is broken on iOS** (event-log quirk) → push-to-talk one-shot recognition with a manual end threshold, not always-listening.
- **State machine:** idle → listening (visible + audible cue) → transcript SHOWN for confirm/edit → act. Destructive/navigational commands go through the Q38 confirm branch; states map to the Q11 loading/empty/error taxonomy.
- **WCAG 2.5.3 Label in Name is the voice-control floor** — the spoken command must be the VISIBLE label ("speak what you see"). Mic permission flow = Q73 (gesture-only pre-prompt, denied recovery, no re-prompt).
- Mechanical: `scratch/q94_voice_featuredetect.html` proves feature-detect + typed fallback + one-shot + transcript-shown (real recognition is not headless-testable). Relevance: Ghostway iPhone standalone = voice UNAVAILABLE (typed primary); OF Android + DM cockpit desktop = feasible accelerator; DM Astro = accelerator.
- **One-shot build checklist line:** if a build offers voice input, feature-detect `webkitSpeechRecognition||SpeechRecognition` and keep the typed/tap path primary; use push-to-talk one-shot (never `continuous`); show the transcript for confirm/edit before acting; make spoken commands match the visible labels (2.5.3); assume voice is UNAVAILABLE inside an installed iOS PWA.
- **Rejected (Q94):** (1) continuous/always-listening as the default → broken on iOS; (2) voice-only entry in an installed iOS PWA → the API is blocked there; (3) acting on a transcript without showing it; (4) the "~25–40% of users unsupported" figure → vendor-blog tier, caution only, not citable.

### Q108 — Numeric input & quantity-stepper (spinbutton) UX · 2026-08-29
- Use `<input type="text" inputmode="numeric" pattern="[0-9]*">` for integer/quantity fields (qty, count, page-size, ZIP, OTP, IDs) — NOT `type=number`. GOV.UK Design System team blog (2020-02-24) moved AWAY from `<input type=number>` after live testing: the spinner + scroll-wheel/arrow mutation, leading-zero strip (007→7 breaks ZIP/OTP/IDs), no `pattern` support, and `badInput` swallowing partial input are real failures.
- `type=number` REMAINS correct ONLY for true incrementable quantities (quantity/age/price with min/max/step); its scroll-wheel bug is now browser-mitigated (Safari 18.4 removed it, Chrome only on explicit `onwheel`) → legacy, not universal.
- `inputmode` split: `numeric` = digits only (ZIP/OTP/card); `decimal` = keeps period/minus (prices/signed/coords). Pair `enterkeyhint` (converges Q74/Q89).
- Stepper (+/-) = ARIA `spinbutton` RELATIVE control: `role="spinbutton"` + `aria-valuemin/max/now` + Arrow Up/Down. It is a RELATIVE adjustment, NEVER a substitute for typed entry — always pair with a typed field if an exact value matters.
- SR announces 'Stepper / Incrementable edit text' (atomica11y); older NVDA lacks `type=number` support → do NOT rely on the input type for semantics.
- Keep ≥44px touch target on the stepper buttons (Q8) for Ghostway iPhone field use.
- **One-shot build checklist line:** if the build has integer/quantity fields or +/- steppers (DM cockpit qty/count/page-size, Ghostway map radius/POI count, Open Finance category/txn counts), use `<input type="text" inputmode="numeric" pattern="[0-9]*">` (not `type=number`); reserve `type=number` only for true incrementable quantities; split `inputmode` numeric/decimal; build steppers as ARIA `spinbutton` relative controls (role/aria-valuenow + Arrow keys) ≥44px, never the sole input path.
- **Rejected (Q108):** (1) "`type=number` is the default for any numeric field" → FALSE, GOV.UK reversed it (spinner/scroll/leading-zero/`badInput` failures); (2) "rely on `type=number` for screen-reader naming" → older NVDA lacks support, announced 'Stepper' not value; (3) "a stepper is the only input" → FALSE, it is a relative control, exact values need a typed field (converges Q64).

### Q99 — Text truncation & overflow handling · 2026-08-29
- **Truncation is a LAST RESORT.** Primer's pre-flight questions: can the text WRAP? can the element get more real estate? can the source string be shortened? Truncating one or two characters is worse than any of those · SOURCE: GitHub Primer Accessibility Truncation + PatternFly UX-writing Truncation + Thumbprint · VERIFIED: 6/6 groups, primary convergence + 5× 2nd source.
- **Never truncate** nav items, table column headings, or any string that contains a focusable element.
- **Always ≥1 recovery path** to the full string: a hover/focus reveal must satisfy WCAG 1.4.13 (dismissible / hoverable / persistent — Q43), or use a disclosure widget (Q45).
- **CSS truncation is purely visual** — `text-overflow: ellipsis` and `-webkit-line-clamp` leave the full text in the DOM and the a11y tree; JAWS, NVDA and macOS VoiceOver all read the FULL string (tested, jamesjacobs.me) → do NOT add `title`/`aria-label` to "expose" it; an `aria-label` overrides the accessible name and can make it worse.
- **Boundary (conflict resolved):** the popular StackOverflow answer recommending `aria-label` contradicts Primer. Resolution: CSS-only truncation needs NO `aria-label`; `aria-label` is correct ONLY when JS actually replaces `textContent` with a shortened string.
- **`min-width: 0` is the canonical ellipsis fix** — inside a flex item, `ellipsis` does nothing until you override the default `min-width: auto`; `overflow: hidden` on the flex item also works.
- **Truncation that eats content at narrow width = WCAG 1.4.10 Reflow instant-fail** — verify at 320px (converges Q79).
- **One-shot build checklist line:** before truncating anything, try wrap → more space → shorter source string; never truncate nav labels, table column headings, or focusable strings; give every truncated string a path to the full text (1.4.13-compliant hover/focus reveal or a disclosure); do NOT add `title`/`aria-label` to CSS-truncated text (only when JS shortens `textContent`); set `min-width: 0` on flex items that must ellipsize; check 320px for content lost to truncation.
- **Rejected (Q99):** (1) `title`/`aria-label` on CSS-truncated text → duplicates/overrides an already-exposed accessible name; (2) truncating table column headings or nav labels → destroys scannability and orientation; (3) truncation with no path to the full string; (4) "ellipsis just works" in flex layouts → FALSE without `min-width: 0`.
- Relevance: DM cockpit record tables + card titles, Ghostway POI/route names (iPhone narrow), Open Finance txn/category descriptions, DM Astro marketing cards. Mechanical browser test blocked (playwright stub + scratch size guard) → verified by source convergence.

### Q114 — Wide-gamut color & modern color-space delivery (Display P3 / oklch / gradient interpolation) · 2026-08-29
- **Deliver color as progressive enhancement** — sRGB base token + `@media (color-gamut: p3)` override of the SAME token (oklch 90%+; display-p3 Chrome111/Safari15/FF113+) · WHY: P3/Gamut-P3 screens (iPhone OLED, Mac) show richer accents; sRGB users get an identical fallback; pure CSS, no runtime deps · SOURCE: CSS Color L4 color()/oklch()/gamut-mapping + L5 color-mix + Media Queries L5 color-gamut + WebKit Wide Gamut + Ottosson Oklab · VERIFIED: PRIMARY ×primaries convergence + mechanical oklch→sRGB+WCAG (scratch/q114_gamut_contrast.py), 8/8 groups.
- **Boost CHROMA, not L, for P3 accents — but RE-VERIFY CONTRAST in the P3 branch** — an L-constant boost keeps perceived lightness yet shifts WCAG sRGB contrast 0.17–0.45 ratio pts (RGB-luminance ≠ OKLab L) → re-run the contrast check inside `@media (color-gamut: p3)` (real gate item, converges Q3/Q17).
- **Per-HUE chroma ceiling** — the exit-sRGB threshold C≳0.18 is hue-dependent (measured hue250 fits C=0.28, hue30 saturates early) → use a per-hue max, not one number.
- **P3 boost for ACCENT/BRAND color ONLY** — never body/UI text (converges Q3).
- **Gradient interpolation defaults to OKLab, not sRGB** since CSS Color 4 Baseline 2023 — write `in oklch` to keep longer-hue-arc control + legacy sRGB-default browsers (the 'sRGB gradients are fine' advice is stale blog behavior). Dense hex stops are a legitimate escape hatch (Q110 email + Q60 forced-colors).
- **Headless CAN emulate `color-gamut: p3` via CDP `Emulation.setEmulatedMedia`** → the Q23 a11y/perf gate should check P3; a P3 boost is invisible on sRGB + never trust a Mac screenshot for P3 verification ('never trust Mac screenshot' holds).
- **One-shot build checklist line:** if the build uses brand accents / hero gradients / OLED-targeted color (DM Astro hero, Ghostway iPhone map accents, OF web, DM cockpit), deliver color as progressive enhancement — sRGB base + `@media (color-gamut: p3)` override of the same token in oklch; boost CHROMA not L and RE-RUN the contrast check inside the P3 branch; use a per-hue chroma max; restrict P3 boost to accents/brand (not body text); interpolate gradients `in oklch` (oklab default since 2023); verify P3 via CDP `Emulation.setEmulatedMedia`, never a Mac screenshot.
- **Rejected (Q114):** (1) "boost L (lightness) for P3" → keeps perceptual lightness but shifts WCAG contrast 0.17–0.45 pts, can silently fail AA; (2) "one chroma threshold fits all hues" → FALSE, exit-sRGB chroma is hue-dependent; (3) "trust a Mac screenshot for P3" → Mac screens are P3, so a screenshot proves nothing about the sRGB fallback; (4) "sRGB gradients are fine" → FALSE, OKLab is the CSS Color 4 default since 2023.

### Q113 — Rich-text / contenteditable input UX · 2026-08-29
- **Default to `<textarea>` (+ Markdown if structure is wanted), not a WYSIWYG** — for notes, memos, descriptions, rename fields · WHY: no XSS sink, native undo/redo, native a11y + mobile behavior, plain-text storage · escalate to rich text ONLY when persisted STRUCTURE is a product requirement · SOURCE: MDN contenteditable + MDN execCommand + W3C APG Toolbar + sitelint role=textbox + DOMPurify + caniuse plaintext-only · VERIFIED: 12/12 groups, primary + 2nd-source convergence (design-time, no mechanical test).
- **`contentEditable="plaintext-only"` is the paste-formatting killer, but feature-detect it** — Chrome 51+ / Safari 5.2+ / Edge 12+, FIREFOX only 136+ (Mar 2025); set the property then read it back (old Firefox silently reports `true`). [boundary correction to the research candidate]
- **A bare `contenteditable` div has NO accessible role** — add `role="textbox"` + `aria-multiline="true"` + accessible name; axe-core does NOT flag this → manual/PR check.
- **No `change` event** — listen to `input` and feed the dirty-state model (Q56); on mobile, autosave beats a nav guard.
- **Toolbar only at ≥3 controls** — then `role="toolbar"` + `aria-label` + roving tabindex (one tab stop, arrows within) per W3C APG.
- **Save/restore a `Range`** around DIY DOM edits or re-renders, or the caret/selection is dropped.
- **Paste is an XSS sink** — sanitize on paste AND on render (DOMPurify/allowlist); persist a structured doc, never raw `innerHTML`.
- **`document.execCommand` is deprecated + non-standard** — use `beforeinput`/Selection/Range or a maintained library; its only real advantage is the native undo buffer, so do NOT hand-roll a replacement engine.
- **Pass IME composition events through untouched** (CJK + mobile predictive input).
- **iOS is the high-risk surface** — autocorrect mangles inline formatting, poor rotor support → Ghostway field notes stay PLAINTEXT.
- **Visual floor** — 4.5:1 body / 3:1 UI, visible focus ring, no fixed-height editor (clips at 200% zoom, Q79).
- **One-shot build checklist line:** if the build has a notes / memo / description / comment field, ship a `<textarea>` (+Markdown) by default; only build a rich-text surface when stored structure is required, and then: feature-detect `plaintext-only`, add `role="textbox"`+`aria-multiline`+name, wire `input`→dirty state, sanitize paste and render, persist structured doc not innerHTML, `role="toolbar"`+roving tabindex only at ≥3 controls, no fixed-height box, plaintext on iOS/field surfaces.
- **Rejected (Q113):** (1) "rich text by default for notes" → adds an XSS sink, kills native undo/a11y, complicates storage for no product requirement; (2) "`plaintext-only` is cross-browser safe" → FALSE for Firefox <136, which silently falls back to full rich editing; (3) "hand-roll a modern replacement for `execCommand`" → deprecated API's only edge is the native undo buffer; a DIY engine loses it and breaks IME/selection.

### Q102 — In-app feedback request / rating widget / microsurvey UX · 2026-08-29
- **Ask for feedback ONLY after the task is done** — never on page load, never mid-task, never on an error screen (NN/g Shark robot-vacuum on-load failure: the prompt fired before the user could use the product) · WHY: an interrupt during a task is a context-switch the user didn't ask for · SOURCE: NN/g User-Feedback Requests: 5 Guidelines + First-Rule-of-Usability · VERIFIED: 5/5 on NN/g PRIMARY + 2nd-source convergence.
- **Never force or block on a rating** — no modal gate; always include a neutral / 'prefer not to say' option.
- **Persistent low-profile feedback affordance** — a right-edge tab or footer link, ALONGSIDE at most ONE triggered prompt (don't ship a tab AND a popup that compete for attention).
- **Same-channel collect + EMAIL deliver follow-up** — collect where the user is (in-product); deliver replies/updates by email (NN/g make-or-break). Open follow-up ('we changed X because of your feedback') carries the value; self-reported satisfaction ≠ measured performance (NN/g First-Rule r=0.44 measured-vs-stated — don't ship a metric and call it validated).
- **Rating STAR widget a11y (W3C APG Rating Radio Group)** — roving tabindex: tabindex=0 on ONLY the checked/selected star + Arrow keys move/check; the cargo-cult of tabindex=0 on EVERY star = 5 Tab stops = breaks the APG contract (exact Q21 LLM-output failure; axe-core does NOT catch it → manual-AT pass, Q93).
- **One-shot build checklist line:** if the build collects user feedback (DM Astro post-contact, DM cockpit Quality-Director internal, OF post-setup, Ghostway field-bug tab), ask only after the task is done, never force/block a rating (neutral option); keep a persistent low-profile feedback affordance + at most one triggered prompt; same-channel collect + EMAIL follow-up; rating stars = W3C APG roving tabindex (tabindex=0 on the checked star only), never on every star.
- **Rejected (Q102):** (1) "ask for feedback on page load / mid-task" → NN/g Shark on-load failure; the prompt before the user can use the product kills trust; (2) "force a rating modal" → blocks the task, no neutral option violates the guideline; (3) "tabindex=0 on every star" → 5 Tab stops, breaks W3C APG Rating Radio Group contract (exact Q21 failure, axe-blind); (4) "self-reported satisfaction = validated performance" → NN/g First-Rule r=0.44 measured-vs-stated, don't conflate.

### Q88 — Inline editing / edit-in-place UX · 2026-08-29
- **Scope escalation** — inline edit fits ONE low-impact property / single row; multi-field or complex records → side panel, row expansion, or dedicated page · WHY: Table→Grid is an escalation to a steeper keyboard model; use interactive grid/inline-edit only when cells justify it · SOURCE: W3C APG Grid pattern PRIMARY + uianatomy/halfaccessible/coreui/svgrid 2nd-sources + NN/g data-tables · VERIFIED: 8/8 on primary convergence.
- **Discoverability before interaction** — a hover-only edit affordance is unreachable by keyboard AND touch; ship a persistent low-contrast affordance (pencil / underline / cell border) + a visible-on-focus cue.
- **Trigger** — keyboard Enter OR F2 enters edit; Escape reverts WITHOUT saving (verbatim APG + 4 2nd-sources). In dense tables single-click collides with row-select/drag → use double-click or an explicit edit affordance.
- **Commit / cancel unambiguous** — Enter commits + moves to the next logical cell; blur-save allowed ONLY with explicit success/failure feedback; silent discard on a stray outside-click = failure. Disable Save until draft ≠ original.
- **Validate beside the input**; keep the pre-edit value for cancel (truthful-undo, Q38); on save failure set `aria-invalid="true"` on the cell and keep the draft — never silently revert (converges Q11/Q14 optimistic-rollback).
- **Grid a11y contract (WCAG 2.1.1/2.4.3/4.1.2)** — `role="grid"` + roving tabindex (one cell `tabindex=0`, rest `-1`) + arrow-key nav + `aria-readonly` on non-editable cells + `aria-busy="true"` on the container during async save + `aria-live` announce of state; arrows edit the caret inside an input, navigate the grid otherwise; icon-only edit/save/cancel controls need accessible names.
- **Dirty-grid conflict guard** — sorting/filtering/paging while a cell is dirty risks data loss → disable grid-level actions during edit or buffer pending edits + confirm (converges Q56 dirty-state, Q78 sorting, Q37 paging, Q40 filters); after a saved edit that changes sort position, don't silently re-sort out from under the user.
- **Batch-edit variant** — multi-row inline edit (select rows → editable mode → Save/Cancel bar) MUST confirm before overwriting original values across rows (converges Q83 bulk actions).
- **One-shot build checklist line:** if a build has inline-editable table cells / record fields (DM cockpit record quick-edit, Open Finance budget-amount/txn-category, Ghostway saved-place rename), use inline edit only for ONE low-impact property per row (escalate multi-field to a side panel); make editability discoverable without hover (persistent affordance + focus cue); Enter/F2 to edit, Escape cancels without saving, Enter commits + advances; blur-save only with explicit feedback; keep pre-edit value for cancel (truthful-undo); role=grid + roving tabindex + aria-busy during async + aria-live announce; guard sort/filter/paging while a cell is dirty.
- **Rejected (Q88):** (1) "every cell a permanent `<input>`" → user can't tell read vs draft state; (2) "hover-only edit affordance" → unreachable by keyboard AND touch (named failure mode); (3) "silent blur-discard on outside click" → loses the user's edit with no feedback; (4) "sort/filter/paging while a cell is mid-edit" → data-loss race, no guard.

### Q88b — Sensitive-data display & masking UX · 2026-08-30
- **Mask secrets by default, opt-in hide for own data** — secrets (PAN/API key/full account #/payment token) are masked-by-default; the user's OWN balance is an OPT-IN hide-balance toggle, not forced masking · WHY: PCI DSS 4.0.1 Req 3.4.1 caps PAN display at BIN (first 6–8) + last 4; full PAN only for roles with documented need · SOURCE: PCI SSC 4.0.1 framework + StackOverflow/Deque SR-chunking + Apple Wallet DESIGN.md + FinWise · VERIFIED: 8/8 on primary + 2nd-source convergence.
- **Reveal control = verb label, not a bare eye** — 'Show card number' with an accessible name (Q52), keyboard-reachable toggle; mask glyphs wrapped in `aria-hidden` with container accessible name 'ending in 1234' (mechanical: BAD exposes 4 bullets to AT, GOOD exposes 0 + correct name).
- **Never leak to AT / copy** — don't add `title`/`aria-label` with the full value; copy is a separate exposure surface (warn before copy, never auto-copy masked; converges Q68); never store/emit raw secrets in DOM `textContent`/localStorage/URL/query.
- **Don't mask input while typing** — converges Q31 show-password; masking-while-typing hurts accuracy.
- **State + layout** — announce via `aria-pressed` + name-flip ('Show'/'Hide'); WCAG 1.3.1 + 4.1.2, not 3.3.x; reserve field width so reveal/hide causes NO reflow; escalation ladder mirrors Q38.
- **One-shot build checklist line:** if the build shows account/card numbers, balances, API keys, or PII (Open Finance acct/balance/txn detail, DM cockpit customer PII + payment refs + admin secrets, Ghostway saved home/work places = location PII), mask SECRETS by default (PAN = BIN 6–8 + last 4 per PCI 4.0.1) + reveal behind a verb-labeled keyboard-reachable toggle (not a bare eye); wrap mask glyphs in aria-hidden + accessible name 'ending in 1234'; keep visible+SR text aligned (Label-in-Name); never store/emit raw secrets in DOM/localStorage/URL; warn before copy; own balance = opt-in hide toggle (preserve layout width); never mask input while typing; announce state via aria-pressed.
- **Rejected (Q88b):** (1) 'mask every number including the user's own balance by default' → FALSE, own balance is opt-in, only secrets masked-by-default; (2) 'a bare eye/visibility icon is a sufficient reveal control' → FALSE, needs verb label + accessible name; (3) 'mask user input as they type' → FALSE, hurts entry (Q31); (4) 'put the full value in title/aria-label' → FALSE, leaks to AT + tooltips.

### Q107 — Multi-tab / cross-tab state coordination UX · 2026-08-29
- **Tabs desync by default** — each tab holds its own JS state while cookies/localStorage are shared origin-wide → logged-out-in-A / stale-in-B / duplicate-notifications / autosave-overwrite / missing-filters are real failures, not edge cases · WHY: scope the coordination problem before reaching for a shared store · SOURCE: MDN BroadcastChannel + storage event + Web Locks PRIMARY · VERIFIED: 5/5 on MDN primary convergence.
- **BroadcastChannel = default mechanism** — named channel, any same-origin browsing context; message fires at all listeners EXCEPT the sender → no echo/loop guard needed (sender-excluded is spec behaviour).
- **Broadcast intent, not payload** — broadcast the event/intent, not the data; late-opened tabs hydrate state from storage (pair the channel with a storage source); the channel is a pipe, not a bucket.
- **storage-event fallback** — storage event fires in all OTHER same-origin contexts, never the originating window; HTML spec fires no event on identical-value rewrites → use timestamp sentinels; older Safari (<15.4/16.4) → storage-event fallback for BroadcastChannel/Web Locks.
- **Concurrency needs a real mutex** — Web Locks API guarantees a single holder → leader-election for single-tab token-refresh / sync-drain / polling; N-tab token expiry reads as token theft without it.
- **Never silent cross-tab redirect** — a cross-tab SESSION_ENDED / logout is an external context change → show an in-tab notice + warn-before-logout (WCAG 2.2.1 Timing Adjustable), not an automatic redirect that loses the user's place.
- **One-shot build checklist line:** if the build is a multi-tab / multi-window web app (DM cockpit admin in 2+ tabs, Open Finance web auth, Ghostway PWA multi-window), assume tabs desync by default (own JS state, shared cookies/localStorage); coordinate shared state via BroadcastChannel (broadcast intent not payload, sender-excluded) + storage-event/Web-Locks fallback for late tabs; use Web Locks for single-tab leader election (token-refresh/poll); same-origin only (cross-origin iframe → postMessage); never silent cross-tab redirect — in-tab notice + warn-before-logout (WCAG 2.2.1).
- **Rejected (Q107):** (1) "tabs share one JS state automatically" → each tab is its own realm; shared cookies/localStorage make stale-state the default, not the exception; (2) "a single shared store stays in sync across tabs" → without a broadcast/sync mechanism the store diverges per tab; (3) "silent cross-tab forced logout/redirect is fine" → WCAG 2.2.1 Timing Adjustable violation + loses user work (converges Q56).

### Q115 — On-screen (virtual) keyboard & viewport-resize UX · 2026-08-29
- **dvh/svh/lvh do NOT track the virtual keyboard** — CSS spec overlays the VK on the Visual Viewport only; `100dvh` fixes URL-bar chrome, NOT the keyboard (5× independent sources). The 'dvh fixes the mobile keyboard' claim is a MYTH. · WHY: keyboard avoidance needs `interactive-widget` OR a `visualViewport` handler, never dvh alone · SOURCE: CSS spec + loke.dev/dev.to/paragraph.com/openreplay/frenchintelligence · VERIFIED: 5× primary convergence, 9/9 groups.
- **Bottom-docked input behind the keyboard is now UNIVERSAL** — Chrome 108 (Nov 2022) + Firefox 132 matched Safari's visual-viewport-only resize (versions corroborated ×3).
- **Tiered fix:** baseline `interactive-widget: resizes-content` (Chrome 108+/FF 132+; shrinks the Layout Viewport to sit above the VK); enhance with the VirtualKeyboard API (`navigator.virtualKeyboard.overlaysContent` + `env(keyboard-inset-*)`); **iOS Safari supports NEITHER** → a `visualViewport` resize JS listener setting `--keyboard-height` is the ONLY iOS path (boundary).
- **iOS auto-zooms inputs <16px** — keep form fonts ≥16px (inherit a 17px base). Do NOT suppress with `maximum-scale=1` / `user-scalable=no` (fails WCAG 1.4.4 + 1.4.10). · VERIFIED: iOS threshold + persistence.
- **Also real:** scroll-to-end `padding-bottom` trap (last row unreachable while focused), sticky/FAB focus-loss under the VK, Safari layout-settle-before-resize race (~250ms debounce before measuring), `inputmode`/`enterkeyhint`/`virtualkeyboardpolicy` per field. · VERIFIED: 2nd-source convergence.
- **Boundary:** `resizes-content` reflows the page (cost) — prefer `overlays-content` when you WANT the VK to overlay (e.g. a feed comment box that shouldn't shrink).
- **One-shot build checklist line:** if the build has a docked input on mobile/PWA (Ghostway iPhone field search/notes, DM cockpit mobile record edit, OF amount entry, DM Astro contact form), `dvh` does NOT avoid the keyboard — use `interactive-widget: resizes-content` baseline + VirtualKeyboard API `overlaysContent`/`env(keyboard-inset-*)` enhancement + `visualViewport` JS `--keyboard-height` fallback for iOS Safari (it supports neither of the first two); keep inputs ≥16px (never `maximum-scale=1`, fails WCAG 1.4.4); set `inputmode`+`enterkeyhint` per field; ~250ms debounce after VK show/hide.
- **Rejected (Q115):** (1) 'dvh fixes the mobile keyboard' → MYTH, dvh only handles URL-bar chrome; keyboard needs `interactive-widget` or `visualViewport`; (2) 'add `maximum-scale=1` to stop iOS input zoom' → fails WCAG 1.4.4 + 1.4.10, never do it; (3) '`resizes-content` is always right' → it reflows the page; use `overlays-content` when overlay is desired.

### Q120 — Input-capability adaptation: hover/pointer media queries + sticky-:hover · 2026-08-29
- **Gate every hover style: any `:hover` rule that changes layout or visibility goes inside `@media (any-hover: hover)`.** `hover` reflects the PRIMARY input only (iPad + Bluetooth mouse reports `hover: none`); `any-hover: hover` is the correct progressive-enhancement gate. `pointer: coarse` / `any-pointer: coarse` gates TARGET SIZE only (Q8/Q15) — capability queries are hints, never device detection (Chrome <41 false `hover:none`; some Samsung Android falsely `hover:hover`). · SOURCE: W3C Media Queries L4 §Interaction Media Features + MDN @media/hover + @media/pointer. · VERIFIED: 6/6 on primary convergence, 2026-08-29.
- **Sticky-`:hover` on iOS WebKit is still live in 2026:** a tap applies `:hover` and it persists until another element is tapped — a bare `:hover` consumes the first tap, producing a 2–3-tap trap (reproduced in a 2026 bug report). Gating (above) fixes it structurally; JS `.no-touch` classes and device-width sniffing are BANNED (they break hybrid devices). · SOURCE: Bootstrap twbs#25195 + 2026 iOS-Safari reproduction.
- **No hover-only affordance, ever.** Gmail-style hover-reveal row actions, hover-only card CTAs, and hover-open submenus need a persistent overflow (⋯) control on coarse pointers — keep it on fine pointers too for keyboard and missed-hover (Q29/Q39/Q53).
- **State layering contract:** `:hover` = fine-pointer enhancement · `:active` = universal press feedback, left UNGATED (opacity/scale ≤0.98, ≤150ms, Q12) · `:focus-visible` = keyboard-only ring (avoids the tap-outline flash that makes teams delete focus styles, Q15/Q60). Never rely on `:focus` as the cross-device state (soft keyboards + Android Chrome skip it). On iOS a bare `<div>` won't match `:active` without `cursor: pointer`/touchstart → use real `<button>`/`<a>` (Q52/Q16).
- Stack: Ghostway iPhone field taps on map controls/POI rows (flagship), DM cockpit hover-only row actions, DM Astro hover-reveal nav/cards, Open Finance web tier.

**One-shot build checklist add:** every `:hover` rule wrapped in `@media (any-hover: hover)`; no action reachable by hover alone; `:active` present and ungated; `:focus-visible` (not `:focus`) for rings; no `.no-touch`/width-sniffing hacks.

**Rejected / counterexamples (Q120):**
- "Most mobile browsers emulate sticky hover" — FALSE/cargo-cult: it is WebKit-specific (Bootstrap's own issue contradicts its docs).
- JS `.no-touch` body classes / device-width sniffing as the sticky-hover fix — banned, breaks hybrid touch+mouse devices.
- Using `hover: hover` (instead of `any-hover`) as the gate — misses iPad-with-mouse and other secondary-input setups.
- Treating hover/pointer queries as device detection or gating keyboard support on them — engine bugs make them unreliable hints.

### Q116 — Non-speech UI sound / audio-feedback + mute & silent-mode · 2026-08-29
- **WCAG 1.4.2 is a Level-A floor: any autoplaying/looping non-speech audio >3s needs pause/stop OR independent volume; the OS/system mute is NOT sufficient; G171 (audio on user request) is the preferred path. UI cue blips <3s are EXEMPT.** · WHY: sound as the sole channel excludes deaf/low-hearing users + anyone who can't hear the cue; converges Q17 (non-color signaling) + Q11 (state feedback). · SOURCE: W3C Understanding SC 1.4.2 + G60/G170/G171 + F23/F93 + Apple HIG "Playing audio". · VERIFIED: 8/8 on W3C primary + Apple HIG, 2026-08-29.
- **Sound is never the only channel** — every audio cue (arrival/off-route/sync/save/error) MUST have a visible counterpart (badge, toast, color, state change); ship a mechanical mute + replay gate (converges Q17/Q11).
- **iOS PWA cannot honor the ring/silent switch** — WebKit exposes NO AVAudioSession API, so an installed Ghostway PWA can't detect/obey silent mode at the web layer; mitigate by defaulting UI sound OFF + mandating visual pairing. Apple HIG: Ambient category honors silent switch, Playback ignores it for user-initiated media.
- **Mute is a first-class setting, default-OFF on web** — converges Q96 (defaults-over-settings); users opt INTO UI sound, never get it forced.
- **Gesture-gated AudioContext (Chrome/Safari autoplay policy)** — a background-sync/arrival cue fired without a user gesture can silently fail to play; always pair with a visual channel so the message lands regardless.
- **One-shot build checklist line:** if the build emits non-speech UI sound (Ghostway arrival/off-route/sync chimes, Open Finance Android M3 sound-on-success, DM cockpit save/error cues, DM Astro autoplay hero video), honor WCAG 1.4.2 — no autoplaying audio >3s without pause/stop + independent volume (prefer user-request G171); keep UI sound OFF by default + always pair a visual channel (badge/toast/state, converges Q17); never rely on iOS ring/silent in a PWA (WebKit has no AVAudioSession → default-OFF + visual pairing); gesture-gate AudioContext so cues don't fail silently; autoplay hero video = muted + visible pause + reduced-motion suppressed (converges Q76).
- **Rejected (Q116):** (1) 'system mute satisfies 1.4.2' → FALSE, hardware mute is not an in-page control; (2) 'F93 (no pause/stop) covers Web-Audio UI blips' → FALSE, F93 is HTML5-media-element-specific; procedural Web-Audio cues fall under F23 and are exempt when <3s; (3) 'iOS PWA can read the silent switch' → FALSE, no AVAudioSession at web layer; (4) frequency×uncertainty cue tables / specific dB budgets = blog-tier convention, not primary law.

### Q117 — One-time-code / OTP / 2FA entry UX · 2026-08-29
- **Use ONE real input with `autocomplete="one-time-code"` — NOT six per-digit boxes.** · WHY: six-box splits the code so autofill/paste break (forces manual transcription → fails WCAG 2.2 3.3.8 Accessible Authentication), and on iOS26 all 6 digits cram into box 1 (inputtype.dev device-verified) — worse for screen readers. · SOURCE: MDN WebOTP API + W3C Understanding SC 3.3.8 + TPGi/a11ypath 3.3.8 test guides + inputtype.dev 2026 (iOS26/Android16). · VERIFIED: 9/9 on W3C/MDN primary + device-verified 2nd-source, 2026-08-29.
- **`inputmode="numeric"`, never `type=number`** — keeps leading zeros (`042519` intact) + no spinner arrows; converges Q108. Wrap the input in a `<form action=…>` so iOS QuickType autofills (WebOTP JS path also uses `form.closest`).
- **Paste MUST work + sanitize `/\D/g`** — blocking paste fails 3.3.8 (TPGi/W3C); paste is the accessible path.
- **3.3.8 contract:** OTP is a permitted alternative to a memorized secret ONLY if transcription is not forced (autofill/paste path present) + each digit has a positional aria-name ("Digit 3 of 6") + a group name + helper text.
- **Mobile floor ≥48px cells + monospace digits + 3+3 grouping;** alphanumeric / >8-char codes → single monospace field. Auto-submit on completion + a visible Submit retained + `aria-live` result are APG convention, not contradicted.
- **Resend after 30–60s (disabled-with-countdown) + WCAG 2.2.1 on expiry;** error recovery keeps the digits + "didn't match" + resend, never silent-clear. Favor passkeys where possible (converges Q70).
- **One-shot build checklist line:** if the build has an OTP/2FA code entry (Open Finance financial login 2FA, DM cockpit 2nd factor, Ghostway email code), use ONE real input + `autocomplete="one-time-code"` in a `<form>` (never six per-digit boxes → fails WCAG 3.3.8 + crams on iOS26); `inputmode="numeric"` not `type=number`; paste works + sanitize `/\D/g`; per-digit positional aria-names; ≥48px cells + monospace; keep digits + resend on error; resend after 30–60s; prefer passkeys (Q70).
- **Rejected (Q117):** (1) 'six-box OTP is fine / looks secure' → FALSE, breaks autofill/paste (3.3.8) + crams into box 1 on iOS26; (2) `type=number` for OTP → FALSE, strips leading zeros + adds spinner (Q108); (3) block paste on OTP → FALSE, WCAG 3.3.8 failure; (4) silent-clear on wrong code → FALSE, loses user input with no recovery.

### Q118 — Multi-step undo/redo history & edit-reversibility · 2026-08-29
- **Decision rule (converges Q38):** common + reversible edits get a PERSISTENT multi-step undo/redo history, NOT a one-shot snackbar; rare + irreversible stay on the confirm/escalation ladder (Q38). Users expect to undo AND redo (Apple HIG) — single-undo-no-redo = incomplete. · WHY: edit-reversibility is a data-model decision at concept phase, not a modal bolted on. · SOURCE: Apple HIG Undo & Redo + NN/g Heuristic #3 (User Control & Freedom) PRIMARY; mechanical scratch/q118_undo_redo.js. · VERIFIED: 7/7 on Apple HIG + NN/g, 2026-08-29.
- **Depth:** avoid hard caps on undo count (Apple HIG "avoid placing unnecessary limits"); a finite cap is OK ONLY if STATED in-product. SLOT A's ≥20 = conservative convention, no research number.
- **Specific labels:** "Undo Typing" / "Redo Bold" — briefly + precisely name the operation (Apple HIG); never generic "Undo".
- **Scope contract:** undo scope = the focused EDITING context; sort/filter/paging/scroll = VIEW state, NOT undoable (that's nav history, Q54/Q37). COUNTEREXAMPLE: browser Back = view-state undo, not edit-undo — never merge the two stacks.
- **Restore order (mechanical):** undo restores EXACT original position/order/contents; new edit CLEARS the redo future; Redo enabled only when non-empty (scratch/q118 rule5/rule6=true); highlight the result after undo/redo (Apple HIG "show the results of an undo or redo").
- **a11y + discoverability:** visible Undo/Redo controls + `aria-live` announce + keyboard bindings (Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z) + named touch/AT control; `beforeinput` + inputType `historyUndo`/`historyRedo` (MDN InputEvent.inputType, Baseline Jan 2020, W3C UI Events) = hook to sync a custom stack with native text editing (DM cockpit vanilla-JS). COUNTEREXAMPLE: iOS shake-to-undo is undiscoverable (Daring Fireball 2018) + dead in an installed PWA → undo MUST be visible + keyboard-reachable, never gesture-only.
- **One-shot build checklist line:** if the build has multi-step editable content (DM cockpit record/inline/bulk edit, OF budget/txn edit, Ghostway route-stop/saved-place edit), ship persistent multi-step Undo/Redo for common+reversible edits (not a one-shot snackbar; redo always available), specific labels ("Undo Typing"), undo scope = editing context only (never sort/filter/scroll/view-state — Q54), restore exact order, visible control + Cmd/Ctrl+Z reachable (never shake-only), `beforeinput` inputType historyUndo/Redo to sync native text editing.
- **Rejected (Q118):** (1) one-shot undo-snackbar = full history for common edits (Apple expects redo); (2) merge edit-undo + browser-Back stacks (Back = view-state, not edit-undo); (3) shake-to-undo as primary mechanism (undiscoverable + dead in installed PWA); (4) hard undo cap without stating it in-product.

### Q119 — URL-as-state & deep-link design · 2026-08-29
- **Belongs-in-URL taxonomy:** shareable/bookmarkable VIEW state (filter/sort/page/detail/record ID) goes in the URL; transient-only UI state (open menu, focus, in-progress draft) does NOT. A deep link must cold-start-restore the full view (converges Q81). · WHY: the URL is the only durable, shareable, back-buttonable handle to a view across reload/tab/share. · SOURCE: MDN History API (pushState=add / replaceState=modify) + sematic.dev URL-state guidance. · VERIFIED: 8/8 on MDN History API + Chrome 50-entry session-history cap + sematic.dev ≤2048-byte limit + WCAG 2.2 3.2.5/3.2.3, 2026-08-29.
- **pushState vs replaceState:** `pushState` adds a NEW history entry (distinct navigable state → Back works + deep-linkable); `replaceState` modifies the CURRENT entry (transient within-session param changes, same logical view). Never call `pushState` per keystroke/filter change.
- **Query (?key=value), NOT hash (#):** app state lives in the query string; the hash is a fragment/anchor the server never receives → breaks SSR + deep-link + share semantics (sematic.dev).
- **Omit defaults, keep URLs short:** omit default-valued params for clean URLs (`/records?page=3`); only when the consumer has sensible defaults. Cap URL ≤2048 bytes (sematic.dev practical hard limit; long URLs break on some proxies/IE11).
- **Don't push per keystroke (MECHANICAL):** Chrome's 50-entry session-history cap evicts the ORIGIN page after ~60 `pushState` calls → push-per-keystroke DESTROYS the Back button (scratch/q119_url_state.js: defaults-omitted round-trips to `/records?page=3`; 2048-byte URL parses; 60 pushState calls evict origin). Debounce ~300ms and prefer `replaceState` for transient filter/sort. CORRECTION: the `pushState` rate-limit is impl-specific (Safari 100/10s, Firefox 100/30s), NOT a 30s constant — debounce is the mitigation, not a magic number.
- **WCAG 2.2 context-change anchors:** URL-driven context changes are user-initiated → they satisfy 3.2.5 Change on Request (AAA) + 3.2.3 Consistent Navigation; a deep link landing on a restored view is the expected, non-surprising result.
- **Security boundaries:** NEVER put auth tokens / PII in the URL (leaks via history/Referer/server logs); reflecting URL params into the DOM UNSANITIZED = param-injection (XSS) for vanilla-JS apps (DM cockpit) → encode/sanitize on read.
- **One-shot build checklist line:** if the build has shareable/filterable/list/detail state (DM cockpit record-list filter/sort/page/detail, Ghostway share-a-route restore, OF web tier), put shareable view-state in the URL via `?key=value` NOT the hash; `pushState` for distinct navigable states + `replaceState` for transient; omit defaults for clean URLs (only when consumers have defaults); debounce ~300ms (never pushState per keystroke — Chrome 50-entry history cap breaks Back, converges Q37); cap ≤2048 bytes; restore full view from a deep link on cold start (Q81); never put auth tokens/PII in the URL; sanitize URL params before DOM insertion.
- **Rejected (Q119):** (1) hash (#) for app state → FALSE, hash is a fragment servers don't receive, breaks deep-link/SSR; use query; (2) pushState on every keystroke/filter change → FALSE, breaks Back button (Chrome 50-entry cap evicts origin); debounce + prefer replaceState; (3) auth tokens/PII in the URL → FALSE, leaks via history/Referer/logs; (4) reflect URL params into DOM unsanitized → FALSE, param-injection/XSS; sanitize/encode on read.

### Q120 — Character/word count & length-limit input UX · 2026-08-29
- **Default = NO counter** — omit unless a legal/backend limit exists or users overrun in testing; raise the backend limit rather than add a counter; skip when length is implied by data type (phone/zip) or >99% won't exceed. · WHY: counters add noise + an unneeded failure surface most fields don't need (GOV.UK/USWDS). · SOURCE: GOV.UK + NHS + USWDS + MOD.UK design systems (4 independent primaries) + 6 2nd-sources. · VERIFIED: 10/10 on gov-DS primaries, 2026-08-29.
- **Soft limit > hard `maxlength`** — let users exceed + show "X characters too many" + server-side validation; hard `maxlength` only for true technical caps.
- **Threshold 75%** — hide the count until ~75% of the limit is used.
- **Wording = REMAINING not used** ("You have 23 characters remaining"); over-limit → "X characters too many" + `aria-invalid="true"` (non-color signal, converges Q17).
- **3-element a11y split (non-negotiable):** (a) static `aria-describedby` hint read on focus; (b) VISIBLE counter that is NOT a live region; (c) separate visually-hidden `aria-live="polite"` + `aria-atomic` region announcing only after a ~500ms–1s typing pause. Never make the visible counter itself live (per-keystroke speech flood); defer binding ~100ms so iOS VO doesn't announce on load.
- **No-JS fallback:** static "You can enter up to N characters"; error copy empty → "Enter [thing]", too long → "[Thing] must be N characters or less".
- **One-shot build checklist line:** if the build has a length-limited text field (DM cockpit record notes, OF txn memo, Ghostway saved-place notes, DM Astro message), default = NO counter (add only on real limit/overrun); soft limit + server validation (not hard maxlength); show count at ~75%; wording = remaining + `aria-invalid` on over-limit; 3-element a11y split (describedby hint + visible counter not-live + sr-only polite debounced announcer); no-JS static fallback.
- **Rejected (Q120):** (1) counter on every field by default → FALSE, noise + unneeded failure surface; (2) hard `maxlength` truncation as default → FALSE, blocks paste-then-trim + server validation; (3) in-field over-limit HIGHLIGHT → GDS-least-certain (read as spelling error); (4) `aria-live="assertive"` for the error/counter → FALSE, conflicts with polite-only design-system guidance.

### Q122 — OS-level user text-scaling respect · 2026-08-29
- **rem/em + ban `-webkit-text-size-adjust:none`** — installed iPhone PWAs inherit OS Dynamic Type via rem/em; `-webkit-text-size-adjust:none` (and `text-size-adjust:none`) suppresses that inheritance, freezing text at the author size. · WHY: a PWA that ignores the user's OS text-size is an a11y + abandonment failure for large-text audiences. · SOURCE: Apple "Larger Text evaluation criteria" (AX5 = "over 300%") + Android 14 nonlinear sp-scaling + WebKit `-apple-system-body` (ind.ie/useyourloaf) + MDN text-size-adjust. · VERIFIED: 8/8 on primary convergence, 2026-08-29.
- **Test reflow at iOS AX5 ≈ 312% / Android 200% sp** — Apple AX5 computes 87.2px vs 27.97px default (~312%, clears SLOT A's 310% flag); Android 14 sp scaling is NONLINEAR (2× ≠ 2× visual) → don't assume linear.
- **Home-screen PWA inherits OS scaling; WebView-embedded (in-app browser) does NOT** — the in-app-browser case is the one that breaks text scaling, not the home-screen PWA.
- **One-shot build checklist line:** if the build may serve an audience that enlarges text (Ghostway iPhone flagship, OF Android, DM web), set typography in rem/em; NEVER `-webkit-text-size-adjust:none`; test layout at iOS AX5 ≈ 312% / Android 200% sp (reflow, don't clip; converges Q79).
- **Rejected (Q122):** (1) `text-size-adjust:none` is safe → FALSE, suppresses OS dynamic-type inheritance; (2) px sizing scales with OS font setting → FALSE, px is fixed; (3) "1-in-3 iOS users" → cargo-cult, unverified; (4) OS text-scaling = browser zoom (Q79) → FALSE, distinct mechanisms; test BOTH.

### Q123 — View Transitions / route-change animation UX · 2026-08-29
- **`document.startViewTransition(cb)` mutates the DOM INSIDE the callback** and returns a ViewTransition (ready/finished/updateCallbackDone + skipTransition()); cross-document crossfade needs `@view-transition{navigation:auto}` (or `<meta name=view-transition content=same-origin>`) on BOTH pages or the transition is skipped (webperfclinic: must be present on both). · WHY: route/state morph is a cheap polish win for Ghostway map↔detail, OF web, DM cockpit SPA, DM Astro MPA — but it's pure enhancement. · SOURCE: MDN View Transition API + Chrome DevRel + W3C CSS View Transitions spec PRIMARY + TestMu/LambdaTest 2026 browser matrix. · VERIFIED: 8/8 on primary convergence + mechanical scratch/q123_vt_guard_test.mjs 4/4. 2026-08-29.
- **MANDATORY progressive enhancement:** `if(!document.startViewTransition){ updateDOM(); return; }` — DOM must update without the API (mechanical: updateDOM runs once in every branch; transition fires only when API present + motion allowed).
- **View Transitions sit ON TOP of Q54 route-a11y, never replace it** — MDN: old+new DOM co-present → reading-position/focus/live-region issues; keep the Q54 focus-move + live region. Gate the API call in `@media (prefers-reduced-motion: no-preference)` (converges Q12 <300ms); shared-element morph via unique per-page `view-transition-name`; keep ~200–500ms.
- **One-shot build checklist line:** if the build animates route/state changes (Ghostway PWA client-nav, OF web route changes, DM cockpit SPA partial updates, DM Astro MPA crossfade), use `document.startViewTransition(cb)` only as progressive enhancement (DOM updates without it) + gate on `@media (prefers-reduced-motion: no-preference)`; never let it replace Q54 route-a11y focus management; cross-doc needs `@view-transition` on both pages (Firefox cross-doc unsupported → no-transition fallback).
- **Rejected (Q123):** (1) \"View Transitions work everywhere\" → FALSE, Firefox cross-doc = unsupported (SPA=144); (2) \"they replace route-change a11y\" → FALSE, they're a visual layer on top of Q54; (3) \"cross-doc Safari 18\" → CORRECTION, 18.2+; (4) ship transitions without the no-API DOM-update fallback → breaks the page when unsupported.

### Q144 — Focus survival across dynamic DOM mutation + live-region hygiene · 2026-08-29
- **Removing the FOCUSED element sends focus to `<body>` in all modern engines** (MDN blur docs verbatim + ally.js cross-browser matrix: Safari10/FF49/Chrome53 → body) → keyboard/SR users lose their place and restart from page top. Author MUST pre-compute the next target BEFORE removal, then move focus AFTER render. HTML sequential-focus-navigation-start-point is OPTIONAL + undefined for removed nodes (Higley) → never rely on it. · WHY: focus loss = forced restart from top; invisible to axe (manual/Playwright `document.activeElement !== body` only). · SOURCE: MDN blur docs + MDN ARIA Live Regions PRIMARY + ally.js cross-browser matrix + Higley SFNSP + Primer focus-management + johnkavanagh/danielhowells/mgifford live-region 2nd-source. · VERIFIED: 9/9 on primary convergence + mechanical ladder-logic scratch. 2026-08-29.
- **Deterministic fallback ladder:** equivalent control of NEXT sibling → PREVIOUS sibling → list container/heading (`tabindex="-1"`) → NEVER `<body>`. Domain-aware target beats blind sibling (deleting last item → empty-state region, not container edge).
- **No focus move on APPLY/toggle** of a filter/selection — focus stays on the control just operated (converges Q40 scroll-yank ban); focus management applies only when the focused control itself is removed.
- **Target needs `tabindex="-1"` + `.focus()` after render** (rAF, not same tick).
- **Live-region rules:** region must pre-exist in the DOM (keep status/aria-live regions in the app shell, never conditionally-rendered/swapped); clear-then-write on next frame (~50ms) so identical consecutive messages aren't suppressed; `aria-atomic="true"` for short strings; default `polite`; `assertive`/`role=alert` only when delay causes a wrong action.
- **Live region ≠ focus-management substitute:** node removal = focus move + optional polite "Item deleted"; background/async change = live region only.
- **One-shot build checklist line:** if the build mutates the DOM (delete row / remove chip / dismiss toast / collapse region) and the FOCUSED element is removed, compute the next focus target BEFORE removal and move focus AFTER render (never let it fall to `<body>`); keep status/aria-live regions in the app shell (pre-existing), clear-then-write after ~50ms; never move focus on filter/selection APPLY; assert `document.activeElement !== body` in the Playwright gate (axe can't catch it) — applies to DM cockpit lists, Open Finance txn deletes, Ghostway saved-place/route-stop removal.
- **Rejected (Q144):** (1) "the browser restores focus to a sensible element after DOM removal" → FALSE, it goes to `<body>`; (2) "screen readers follow DOM changes automatically" → FALSE without a focus move or a pre-existing live region; (3) "axe/Lighthouse catches focus loss" → FALSE, manual/Playwright-only remainder; (4) "rely on HTML sequential-focus-navigation-start-point for removed nodes" → FALSE, optional + undefined for removal; (5) `autofocus` on page load / focus-on-scroll / `aria-hidden` a focused element → anti-patterns.

### Q143 — Outdoor/sunlight legibility + gloved & wet-hand touch (field PWA) · 2026-08-30
- **Contrast headroom for sunlight** — design near-black (#0D0D0D-class) on off-white (≈#F5F6F7) surfaces with ≥7:1; mechanical scratch/q143_contrast.py: #F5F6F7 on #0D0D0D = 6.75:1, on #111314 = 5.93:1. Direct sun adds ~2:1 luminance loss via ~5% glass reflection (ACR/reflectance lit: Kelley JSID, sdtp.12189, jackchou00) → brightness alone insufficient; headroom is the lever. · WHY: Ghostway iPhone in direct sun washes out status. · SOURCE: WCAG 1.4.6 AAA 7:1 + ACR/reflectance literature. · VERIFIED: SLOT B 2026-08-30 primary ×3 + mechanical contrast. (5:1/7:1 "sunlight" ratios = unverified heuristics, convention only.)
- **No theme wins in sun (both reflect)** — light AND dark wash out under reflection; real levers = reduce reflectance (AR coating) + max brightness + shape/weight/halo, not theme. Keep 3-state auto/light/dark as user prefs (Q46); don't promise "dark = readable in sun."
- **Gloved/wet targets = ISO ladder, ABOVE WCAG** — ISO/TS 9241-411 HMI targets bare 12mm / light-glove 15mm / heavy-glove 19mm → on iPhone 390×71.6mm = 65 / 82 / 103 px. WCAG 2.5.8 24px + 2.5.5 44px are BELOW the ISO ergonomic floor for phone field use → bump field-PWA targets to ≥82px (gloved) / ≥65px (bare), above the 44px comfort floor (Q8). · VERIFIED: ISO/TS 9241-411 + caniuse px math.
- **Field mode via prefers-contrast:more** — widely supported (Chrome96/Edge96/FF101/Safari14.1+, widely-available 2024-11) → ship a max-contrast "field mode" surface gated on it (don't hand-roll a manual toggle). · VERIFIED: caniuse + MDN.
- **Wet/gloved input floor** — no biometric-only auth (converges Q31/Q47), optional vibration feedback (Q63), enlarge hit areas; never rely on hover or precision gestures (Q47/Q87).
- **One-shot build checklist line:** if the build is a field PWA used outdoors/gloved (Ghostway iPhone in-vehicle/sun, DM cockpit tablet-outdoor), design near-black-on-off-white surfaces with ≥7:1 headroom (sun adds ~2:1 ACR loss); don't promise dark=readable-in-sun; bump touch targets to ≥82px gloved / ≥65px bare (ISO/TS 9241-411, above WCAG 44px); gate a max-contrast "field mode" on `prefers-contrast: more`; no biometric-only auth; enlarge hit areas.
- **Rejected (Q143):** (1) 'dark theme is readable in direct sunlight' → FALSE, both themes reflect; only AR-coating + brightness + shape/weight help; (2) '44px/24px WCAG target is enough for field use' → FALSE, ISO floor is larger (65–103px gloved); (3) 'sunlight 5:1/7:1 ratios are spec' → FALSE, unverified heuristics (convention only); (4) 'manual contrast toggle for field mode' → unnecessary, `prefers-contrast: more` is widely supported (2024-11).

### Q145 — Battery/thermal-aware & screen-wake UX (continuous-use PWAs) · 2026-08-29
- **Task-scope the Wake Lock, never hold it globally** — acquire `navigator.wakeLock.request('screen')` when a continuous task starts (in-vehicle nav), release on task end OR when the doc is hidden; rely on the auto-release on `visibilitychange` + re-acquire on return (MDN verbatim: the lock releases when the tab is backgrounded). · WHY: a global lock is battery-hostile + user-hostile (can't dim/sleep). · SOURCE: MDN Screen Wake Lock API PRIMARY. · VERIFIED: 8/8 on MDN primary + 2nd-source ×2 + Compute Pressure BCD. 2026-08-29.
- **Wake Lock IS viable on Ghostway iPhone** — Baseline 2025 / Safari 16.4+ (iOS 16.4+) supports `screen` wake lock; only Battery Status telemetry is unavailable. Feature-detect `if ('wakeLock' in navigator)`; listen for the `release` event; expose a visible on/off toggle (don't trap the screen on).
- **NEVER read battery level to drive PWA behavior on iOS** — `navigator.getBattery` was NEVER shipped in Safari/iOS (removed from Firefox v52/2017 for fingerprinting); only Chrome/Edge/Opera/Samsung ship it (~76% global, Chromium-only). Ghostway iPhone is in the no-battery branch → rely on the UA's automatic low-battery wake-lock release instead of gating on a reading you can't get.
- **NO thermal API on iPhone web/PWA** — Compute Pressure API is Chromium-only (Chrome/Edge 125+); Safari ❌ + Firefox ❌ don't implement it → do not design thermal-throttle UI for the iPhone web layer.
- **Power-aware mode is a user toggle, not auto-behavior** — continuous nav (GPS watchPosition + map repaint, Ghostway) is the heaviest drain; offer an optional low-power/reduced-repaint mode (lower tile detail, fewer live updates, pause non-essential animation — converges Q12/Q109) behind a visible setting; don't silently change on a battery reading you can't read.
- **DOWNGRADE the mW / %-per-day figures to illustrative only** — blog-tier, UNVERIFIED; keep the rule (scope the lock), drop the numbers.
- **One-shot build checklist line:** if the build is a continuous-use / in-vehicle PWA (Ghostway iPhone nav flagship, long DM cockpit dashboards), task-scope a Screen Wake Lock (acquire on the continuous task, release on hidden/end, re-acquire on `visibilitychange`) + feature-detect + visible user toggle; do NOT read the Battery Status API on iOS (never shipped) — rely on UA auto low-battery release; do NOT use Compute Pressure (Chromium-only, no iPhone Safari); offer an optional low-power/reduced-repaint mode (converges Q12/Q109); treat mW/% drain figures as illustrative only.
- **Rejected (Q145):** (1) 'keep the screen awake for the whole app session' → FALSE, task-scope only; global lock is battery + user hostile; (2) 'read battery % to decide PWA behavior on iOS' → FALSE, Battery Status API never shipped in Safari/iOS; (3) 'use Compute Pressure API for iPhone thermal throttling' → FALSE, Chromium-only (Safari/Firefox don't implement); (4) 'screen-wake-lock won't work in an iOS PWA' → FALSE (overclaim), Baseline 2025 / Safari 16.4+ supports it; only battery telemetry is missing.

### Q146 — Text selection & copy-friendliness of UI data · 2026-08-30
- **`user-select:none` = controls-chrome ONLY.** Blanketing article/body/IDs/amounts/addresses/log panes with it is canonical harm, not protection: it breaks copying to Clipboard/FieldRoutes/QB/coords, TTS/translate/extension selection workflows. · WHY: Keaton copies record IDs/phones/amounts/addresses DAILY into FieldRoutes/QuickBooks — `none` silently erases his own data. · SOURCE: MDN `user-select` + W3C CSS-UI-4 PRIMARY. · VERIFIED: 7/8 on MDN primary + 1 inheritance CORRECTION + mechanical `::selection` contrast scratch. 2026-08-30.
- **Re-enable descendants with `user-select:text` — MANDATORY.** Spec says `user-select` is NOT inherited, but WebKit/Chromium implement it AS inherited (spec-violating) → a `none` on a container silently kills child selection unless you re-enable. Applies to Keaton's Chromium-Android + Safari-iPhone targets.
- **`::selection` must meet ≥4.5:1 in BOTH themes** (mechanical scratch/q146_selection_contrast.py: 1.00:1 invisible vs 6.27/16.75 OK; `forced-colors` overrides it).
- **`user-select:all` traps atomic copy** → wrap in a copy button (Q68) instead.
- **Generated content (`::before/::after`) is auto `none`** → excluded from clipboard; put real text in the DOM, not pseudo-elements (defense-in-depth, not guaranteed — verify on-device).
- **Screen readers are NOT affected** by `user-select:none` (they parse the DOM) — only selection-dependent tools (Translate/highlight-read/dictionaries) break; `none` is never content protection.
- **Legitimate `none` scope:** buttons/tabs/drag-handles/decorative glyphs only — never article/body/IDs/amounts/addresses/log panes.
- **One-shot build checklist line:** if the build shows copyable data (DM cockpit record IDs/phones/addresses/amounts copied to FieldRoutes/QB daily; Ghostway coords/address; OF amounts; DM Astro code blocks), NEVER blanket `user-select:none` — controls-chrome only; re-enable copyable text with `user-select:text`; keep native selection on; style `::selection` ≥4.5:1 both themes; `user-select:all` values get a copy button; put real text in the DOM not `::before/::after`.
- **Rejected (Q146):** (1) '`user-select:none` protects content from copying' → FALSE, SRs parse DOM + MDN `Selection` contains `none` elements; it only hurts human copy + TTS/translate; (2) '`user-select` inherits per spec' → FALSE, spec says NOT inherited — WebKit/Chromium DO inherit (spec-violating) so re-enable is mandatory; (3) '`::selection` color is cosmetic' → FALSE, must be ≥4.5:1 in both themes; (4) 'disable selection site-wide to stop scraping' → FALSE, canonical harm to Keaton's own workflow, not protection.

### Q121 — QR-code & barcode scan/generate UX · 2026-08-30
- **Quiet zone 4 modules + ≥2cm print / 10:1 size** — ISO/IEC 18004 mandates a 4-module quiet zone; the #1 real-world failure is the printer cropping it at the bleed. Size = 1cm wide per 10cm viewing distance, 2×2cm absolute print floor (digital 150px floor / 400px rec = convention, not a rule). · WHY: a scannable code is the whole point; cropped/small codes silently fail in the field. · SOURCE: ISO/IEC 18004 + qrcodekit/qrcodenova/minily. · VERIFIED 10/10 on primary convergence, 2026-08-30.
- **Dark-on-light ONLY, contrast ≈4:1 (ISO PCS 0.60), never invert for print** — ISO print-contrast spec (PCS) 0.60 ≈ 4:1, NOT a WCAG 4.5:1 ratio (SLOT A's '40% luminance delta' was wrong; PCS is reflectance, not a WCAG number). Inverted (light-on-dark) scans on modern phones but FAILS older/industrial scanners → keep dark-on-light for print. 3:1 min / 4:1+ rec.
- **Logo ≤20–30% area at ECC-H; ECC ladder screen=M / print-outdoor-curved=Q-or-H** — NOTE width≠area (20% width ≈ 4–6% area); keep ≤25% @H for real-world damage headroom.
- **Format: SVG/EPS print + PNG≥300DPI digital, NEVER JPG** — JPG compression artifacts = unscannable.
- **CTA mandatory (destination + benefit)** — converges Q82/Q6; a bare code with no label is a tell.
- **Web scanner: feature-detect + WASM + file-input fallback** — BarcodeDetector on Safari iOS is BEHIND A FLAG (Safari 17+ 'Shape Detection API' pref, per caniuse/MDN BCD) → effectively UNAVAILABLE in an installed PWA; ship BarcodeDetector-detect → ZXing/ZBar WASM → `<input type=file capture=environment>` fallback chain; getUserMedia in a standalone PWA needs iOS 13.4+.
- **One-shot build checklist line:** if the build generates or scans QR/barcodes (DM Astro retainer flyers/yard signs, Ghostway share-route print/scan, OF receipt barcode), keep a 4-module quiet zone + ≥2cm print / 10:1 size; dark-on-light only (≈4:1, never invert for print); logo ≤25% area @ECC-H; SVG/EPS print / PNG≥300DPI / never JPG; mandatory CTA label; web scanner = feature-detect + WASM + file-input fallback (BarcodeDetector is flag-gated on iOS Safari).
- **Rejected (Q121):** (1) 'QR needs 4.5:1 contrast' → FALSE, ISO PCS 0.60 ≈ 4:1, not a WCAG ratio; (2) 'inverted (light-on-dark) QR is fine for print' → FALSE, fails older/industrial scanners; (3) 'BarcodeDetector works on iOS Safari' → FALSE, behind a flag (Safari 17+ pref), unavailable in installed PWA; (4) 'JPG is fine for QR' → FALSE, compression breaks scanning; (5) '10:1 rule applies to billboards' → FALSE, breaks at large distances (convention only for hand-held).

### Q188 — Scroll anchoring / async-load scroll-jump prevention · 2026-09-03
- **Anchoring is ON by default — leave it ON** (Chrome 56+/FF66+/Edge79+). `overflow-anchor` only OPTS OUT (`auto|none`); never `*{overflow-anchor:none}` globally — that re-introduces the exact jump it prevents. · WHY: browser auto-compensates when content loads ABOVE the current scroll position, keeping the visible reading point stable. · SOURCE: MDN Scroll Anchoring Overview PRIMARY + caniuse + WebKit blog + WICG explainer + CSS-Tricks + w3docs. · VERIFIED 6/7 on MDN + caniuse + WebKit blog + WICG explainer + CSS-Tricks + w3docs.
- **Suppression triggers = anchoring silently fails** when the anchor node or an ancestor changes computed margin/padding, ANY width/height, transform (translate/scale/rotate), or `position` inside the scroll container. ROBUST FIX: reserve space for async content (fixed-height skeletons per Q164, width/height on imgs per Q35, reserve list-row heights) — anchoring is a safety net, not a substitute for reserved dimensions.
- **Prepend-feed manual preserve** (when anchoring is disabled/unreliable): `const h=el.scrollHeight; el.prepend(node); el.scrollTop += el.scrollHeight - h;` (CSS-Tricks chat-pin technique). Deterministic cross-browser fallback.
- **CRITICAL BOUNDARY — Safari 27+ ONLY.** Original claim "Safari 15.4+ supports scroll anchoring" = FALSE — OFF BY ~11 MAJOR VERSIONS. caniuse: Safari ❌ all versions through 26.5 (only Tech Preview = supported). WebKit blog June 2026 (Safari 27 beta) = FIRST version. Bug 171099 open 6+ years, only landed in Safari 27 beta. Ghostway iPhone on stable Safari gets ZERO native scroll anchoring — manual preserve is ESSENTIAL.
- **Distinct from siblings**: `scroll-padding`/`scroll-margin` (Q80) only offset anchor jumps for `scrollIntoView`/fragment nav — they do NOT prevent async-load shifts; CSS Anchor Positioning (Q178) is an unrelated floating-UI coordinate system; `scroll-behavior:smooth` can double-animate with anchoring → prefer `auto` where you manage scroll in JS.
- **Root cause = layout instability**: scroll anchoring handles above-viewport ONLY; EVERY in-viewport shift needs reserved dimensions. Converges Q37/Q35/Q164. WCAG: cite 1.4.10 + 3.2.3 not 1.4.13.
- **One-shot build checklist line:** any surface with async-loaded content above the current scroll (Ghostway map tiles + POI/route lists, DM cockpit fetch-then-render rows, OF transaction lists, DM Astro deferred embeds) → leave scroll anchoring ON (never disable site-wide); scope `overflow-anchor:none` only to prepend/append feeds or JS-managed scroll that stutters; reserve space for async content; use `scrollTop += scrollHeight - oldH` manual preserve for prepend feeds; assume NO native scroll anchoring on stable Safari ≤26.x (Ghostway iPhone) — manual preserve is the cross-browser guarantee.
- **Rejected (Q188):** (1) "disable scroll anchoring site-wide because it's janky" → FALSE (on by default for good reason; only opt out scoped where it fights manual scroll); (2) "scroll anchoring fixes all CLS" → FALSE (above-viewport only); (3) "Safari 15.4+ supports it" → FALSE (Safari 27 beta is FIRST version; all stable Safari ≤26.x lack it).

### Q121b — Scheduling / appointment-booking & recurrence UX · 2026-08-29
- **Booking ≠ scheduling ≠ date-picker** — a customer reserving a provider slot = a FILTERED LIST of valid slots (disable/omit unavailable), not a free time-entry field; a bare time picker (Q42) is only for a single arbitrary clock time. · WHY: free "930"-style strings without period/TZ are the canonical booking failure. · SOURCE: uxpatternsguide + NN/g. · VERIFIED 9/9 on RFC 5545 + sujeet.pro/Nylas + uxpatternsguide + W3C APG grid.
- **Live slot-list over free entry** — expose valid increments (15/30 min), preselect NEXT AVAILABLE as default; request form only when availability is unknown.
- **Canonical-time contract: wall-clock + TZID, never naked UTC** — store `09:30 America/Denver`, not a UTC instant (RFC 5545 `DTSTART;TZID`). MECHANICAL (scratch/q121_time_contract.js): naked-UTC drifts +1h across the Mar 8 Denver DST boundary; wall-clock+TZID is stable. Display in viewer's local zone with zone LABELED (converges Q104). · WHY: UTC-only storage silently breaks recurring wall-clock times on DST.
- **Recurrence = RRULE, not rows** — store RRULE + EXDATE/RDATE; expand only the visible window. Exploding "every Monday" into rows is the canonical failure (Rule 0).
- **Edit-scope prompt (THIS/ALL/FOLLOWING)** — editing one instance must ask; never silently rewrite the whole series (RFC 5545 RECURRENCE-ID/EXDATE).
- **Live plain-English summary** — echo "Every Monday at 9:30 AM" as the user edits (Google Calendar/Nylas).
- **DST test gate** — expand through a DST boundary and assert wall-clock stays fixed.
- **A11y floor (role=grid)** — availability grid uses `role=grid`+`gridcell`+arrow-nav; availability not color-only (Q17); unavailable slots programmatically `disabled`.
- **Simpler-is-right** — only build weekly / monthly-by-weekday for Keaton stack; skip full RFC 5545 EXRULE/VTIMEZONE authoring.
- **One-shot build checklist line:** if the build has booking/scheduling/recurrence (DM cockpit technician/job + recurring retainer visits, OF recurring budget/tithing, Ghostway trip scheduling), render a filtered slot LIST not a free picker; store wall-clock+TZID (never naked UTC) per RFC 5545; model recurrence as RRULE+EXDATE (not rows); prompt THIS/ALL/FOLLOWING on instance edit; show a live plain-English summary; test DST-boundary stability; a11y grid with non-color availability.
- **Rejected (Q121-scheduling):** (1) free-text time field for booking → FALSE, unparseable "930" without period/TZ; (2) store recurring times as naked UTC → FALSE, drifts across DST (mechanical); (3) explode recurrence into rows → FALSE, can't represent exceptions; (4) edit one instance = edit whole series → FALSE, destroys intent; (5) color-only availability → FALSE (Q17).

### Q170 — On-page table-of-contents / scrollspy in-page navigation UX · 2026-08-30
- **Landmark + semantics**: wrap the rail in `<nav aria-label="Table of contents">` (or "On this page") — a labeled navigation landmark, NOT `role="tab"` (NameThatUI: role=tab/aria-selected wrongly announces a tab widget that does not exist; this is non-modal, all sections stay in the DOM). Plain `<a href="#section-id">` links to real heading ids; works with zero JS (progressive enhancement) and keeps copyable destinations + no-script nav. · WHY: a sticky in-page TOC is the single most common way long-form marketing/docs pages fail a11y (either missing or mis-using tab semantics). · SOURCE: NameThatUI scrollspy PRIMARY + jargon-buster/observerviewport + appica/xtyle/collectivekit. · VERIFIED: 11/11 on 2nd-source ×4 convergence + mechanical band/tie-break/final-section sim (scratch/q170_scrollspy_band_test.mjs PASS).
- **Active state = exactly ONE link carries `aria-current="location"`** (NameThatUI + MDN-style TOC + CollectiveKit). Do NOT use aria-selected. The active indicator must not be color-only — pair a high-contrast vertical accent bar + stronger label weight/color (converges Q17).
- **Activation band (core math)**: IntersectionObserver with `rootMargin` to define a reading band, NOT "any part visible." Top offset = sticky-header height (e.g. `rootMargin: '-96px 0px -70% 0px'` → active = heading nearest the top reading line). Deterministic tie-break: when several short sections are visible, prefer the LAST heading that crossed the reading line. Handle the FINAL section explicitly (it can't scroll to the top → select it when within ~viewport-bottom threshold).
- **Focus discipline**: scroll observation MUST NOT steal keyboard focus (NameThatUI behavior contract). Clicking a link = ordinary same-page hash nav. Do NOT replaceState/pushState on the scroll observer (don't flood browser history or move focus merely because the highlight changed). If you sync the URL, use `history.replaceState()` only, no focus move.
- **Sticky header offset**: set `scroll-margin-top: 96px` (≥ sticky-header height) on each target section/heading so jumps aren't hidden under the sticky chrome (directly satisfies WCAG 2.4.11/2.4.12 Focus Not Obscured — converges Q80).
- **Smooth scroll + reduced motion**: `scroll-behavior: smooth` on the container, but gate with `@media (prefers-reduced-motion: reduce) { scroll-behavior: auto }` — instant jump for vestibular users (converges Q12).
- **Sticky rail + overflow**: `position: sticky; top: <header+gap>` keeps the TOC in view; if the outline is long, make the rail itself `overflow:auto` (converges Q112 scroll-container focusable) so it doesn't trap page scroll.
- **Nested depth**: indent nested entries by heading level (h2/h3), depth 2–6. Keep item order = document order. Labels short ("Overview", "Settings").
- **Mobile fold**: below the breakpoint, collapse to a wrapped row of chips, a `<details>` disclosure ("On this page"), or a top sticky bar — keep it a real `<nav>` with aria-label + working anchors; never drop it to display:none without an alternative.
- **Auto-generate**: build the outline by extracting h2/h3 with existing ids (slugify if missing) — don't hand-maintain; ensures ids always exist for the anchors.
- **One-shot build checklist line**: any long-form page with ≥3 sections (DM Astro marketing/docs/legal/pricing flagship, Ghostway/OF web doc pages) → wrap in `<nav aria-label="Table of contents">`; exactly-one `aria-current="location"`; IntersectionObserver rootMargin band offset by sticky-header height; never steal focus / replaceState only; scroll-margin-top for 2.4.11; reduced-motion smooth-scroll gate; mobile fold to details/chips; auto-generate from h2/h3.
- **Rejected (Q170)**: (1) `role="tab"`/`aria-selected"` on TOC links → announces a fake tab widget (NameThatUI); (2) observer root = viewport while sections scroll inside an `overflow` container → nothing highlights; (3) highlight snapping back after click because the scroll-triggered observer overrides the clicked section — debounce/lock the observer on click; (4) multiple sections visible with no deterministic rule → flicker (fix with the band + tie-break).
- **Boundaries**: rootMargin exact px = convention not spec (track actual sticky-header height per surface); final-section needs explicit near-bottom rule; role=tab/aria-selected = confirmed anti-pattern.

## Q97 — Pricing / plan-comparison table & tier-selection UX (2026-08-29)

### Q171 — Segmented control / toggle-button group UX · 2026-08-30
Verified 9/9 on Apple HIG Segmented controls + WAI-ARIA APG Radio Group + Material 3 toggle buttons + dev.to/Watson/WireKit/rogo/Flutter + mechanical scratch/q171_segmented.html. Flagship: Ghostway iPhone map/list/satellite toggles; DM cockpit view/period/filter; OF M3 period toggles; DM Astro.

- **Radiogroup semantics, NOT tablist** — `role="radiogroup"` + `aria-label` (REQUIRED) + `role="radio"` + `aria-checked` per segment. Use `tablist`/`tab` ONLY if segments genuinely swap a content panel (Q45); a control that just stores a value is a radiogroup even if it looks like a tab strip — using tablist announces a fake tab widget (converges Q170 scrollspy anti-pattern).
- **Roving tabindex + Arrows MOVE AND COMMIT** — only the checked segment `tabindex=0`; Arrow Right/Down (and Left/Up) both WRAP; arrow keys "uncheck the previously focused button, and check the newly focused button" (APG verbatim) — counter-intuitive, confirmed. Single tab stop on the group.
- **2–5 iPhone / 5–7 wide ceiling** (Apple HIG verbatim); equal-width segments + all-text-or-all-icon (Apple bans mixing icon+text in one control). Labels = nouns/noun phrases, title-style capitalization.
- **Selected NEVER color-only** — fill bg + weight 600 (converges Q17); contrast of fill vs text ≥4.5:1, fill vs component bg ≥3:1 (1.4.11).
- **BOUNDARY: toolbar-nested radio group is the ONE exception** — APG "For Radio Group Contained in a Toolbar": arrows navigate WITHOUT committing, Space/Enter commit (standalone segmented commits on arrow, but a toolbar-embedded one follows toolbar contract).
- **Multi-select variant = `role="button"` + `aria-pressed`** (NOT radio) — arrows move focus WITHOUT commit, Space/Enter toggles.
- **Immediate apply** — segmented = direct manipulation, not a confirm dialog; if a segment performs an ACTION rather than selecting state, don't show selection state for it.
- **One-shot build checklist line:** any segmented/toggle-button group (Ghostway iPhone map/list/satellite, DM cockpit view/period/filter, OF M3 period toggles, DM Astro) → `role="radiogroup"` + `aria-label` + `role="radio"` + `aria-checked` per segment (NOT tablist); roving tabindex (checked=0, rest=-1); arrows move+commit; 2–5 iPhone ceiling; equal-width + all-text-or-all-icon; selected = fill+weight not color-only; toolbar-nested exception (arrows navigate, Space/Enter commit); multi-select = aria-pressed button.
- **Rejected (Q171):** (1) "segmented looks like tabs → use tablist" → FALSE unless panels swap (announces fake tab widget); (2) "color highlight is enough for selected" → FALSE (Q17); (3) "unlimited segments, it scrolls" → FALSE — overflow clips, cap ~5; (4) "icon+text per segment is richer" → FALSE per Apple (one or the other); (5) "arrow keys only move focus, Enter commits" → FALSE for single-select radio-group (arrows commit immediately).
Verified 7/7 on NN/g PRIMARY (Comparison Tables for Products/Services/Features + Mobile Tables +
Explicit Differences) with uxpatternsguide/Baymard as 2nd source. Flagship user: Deseret Marketing
Astro retainer tiers (direct-revenue surface); Open Finance only if monetized.

- **Decision-type gate.** Comparison tables serve COMPENSATORY decisions (a few offerings weighed
  across several attributes). If one factor is nonnegotiable, that's NONCOMPENSATORY → filters/facets
  (Q40), not a table. Pick one mechanism per job.
- **Don't-use list (NN/g).** Aesthetic/unique/one-of-a-kind/cheap-replaceable items (art, clothing):
  a comparison table adds nothing.
- **Column budget.** ≤5 tiers static, 3–4 if user-selectable, 2 on mobile when cells are wordy — and
  STATE the limit in the UI ("compare up to 3").
- **Standard orientation.** Options = columns, attributes = rows. Short cells.
- **Content consistency (top-tier failure).** Every attribute row has a value in every column — no
  blank cells; use "Not included" / "—" with a legend. Same units, same wording across tiers.
- **Meaningful attributes + explicit differences.** Cut spec-dump rows nobody decides on; merge cells
  that are identical across tiers and visually highlight the rows that actually differ.
- **Sticky column headers** once the table exceeds one screenful (wire with Q80 focus-not-obscured +
  Q29 frozen-header). Money cells right-aligned + `tabular-nums` (Q29/Q74). Recommended-tier
  highlighting must not be color-only (Q17).
- Boundary: decision/content rules are not headless-testable; column count, sticky header, alignment
  and tabular-nums are build-time inspection.

Checklist line: Pricing/compare table (Q97) — ≤5 tiers (2 mobile) + limit stated + options-as-columns
+ zero blank cells + differing rows highlighted + sticky header past one screenful + tabular-nums +
recommended tier not color-only.

### Q153 — Thumb-zone / one-handed reach + bottom action bar + safe-area chrome · 2026-08-29
- **Primary-at-bottom, destructive-at-top** — Apple HIG Rule 1.3 ('Primary Actions in the Thumb Zone') + converges Q38 proximity; on large phones the top edge is a grip-shift penalty (empire-ui: 'destructive in stretch territory by design'). · WHY: Ghostway iPhone field use is one-handed; DM cockpit/OF Android bottom-bars. · SOURCE: Apple HIG Rule 1.3 + Hoober A List Apart. · VERIFIED: SLOT B 2026-08-29 primary convergence + mechanical proof.py. (49% one-handed grip is a 2013 plurality, not a majority — keep directional; flag data currency.)
- **Bottom nav = 3–5; action-bar ≠ nav-bar** — M3 navigation-bar (3–5 destinations) + converges Q39/Q10; distinguish the ACTION-BAR (single/dual primary CTA pinned to bottom of long content) from the NAV-BAR; stacking = action bar → nav bar → home indicator.
- **Safe-area collision is real (mechanical)** — a fixed 56px bottom bar WITHOUT `padding-bottom: env(safe-area-inset-bottom)` collides with the 34px home-indicator band (tap_bottom=844 > band_top=810 on an 844px-tall iPhone); WITH the env() pad it lifts to 810 = clears. ALWAYS pad bottom-fixed bars/controls. Cross-refs: Q8 dvh/VisualViewport, Q44/Q38 FAB-snackbar.
- **Target floor = reuse Q8** — 44pt iOS / 48dp Android / 24px WCAG 2.5.8; empire-ui reaffirms 48px, no net-new number.
- **One-shot build checklist line:** if the build is a mobile/PWA app with bottom-docked chrome (Ghostway iPhone, OF Android M3 bottom nav, DM cockpit mobile, DM Astro mobile), place primary/destructive CTAs in the bottom thumb-zone + pin single/dual primary CTA in a bottom ACTION-BAR (above nav-bar, above home indicator); nav-bar = 3–5 items (Q39); ALWAYS pad every bottom-fixed bar/control with `padding-bottom: env(safe-area-inset-bottom)`; target floor = Q8 (44pt iOS / 48dp Android / 24px WCAG); never rely on the absolutist 'no hamburger' rule (Q39 damage-control stands).
- **Rejected (Q153):** (1) 'never use hamburger menus' (absolutist iOS-skill Rule 2.2) → FALSE, conflicts verified Q39 (necessary evil + damage-control); (2) 'hard pixel thumb-zone map (Secondary/down/green = exact px)' → FALSE, Hoober 49/36/15 is 2013 pre-large-phone → directional only; (3) '16px font prevents iOS zoom-on-focus → thumb-zone concern' → misattribution, belongs to Q8/Q79; (4) 'all users are one-handed' → FALSE, 49% is a plurality not a majority, two-hand use grows with large phones.

## Q125 — Color picker / color-input component UX (2026-08-29)

**When to use which control**
- Fixed/curated palette (<10 named colors) → **swatch-radio group**: `<input type=radio name=...>` + `<label>` whose accessible name includes the COLOR NAME (e.g. "Red", not just a swatch). Wrap in a `<fieldset>`+`<legend>` (group label). Keyboard + SR pick by name, not by sight (WCAG 4.1.2 Name / 4.1.3 Status). Multi-select = checkbox group variant.
- Free precise color (theme/category tuning) → native `<input type=color>` (zero-JS baseline) OR a custom SV-square + hue + optional alpha + synced hex/RGB/HSL fields + presets/recent.
- Never ship a custom picker when a swatch set does the job — over-engineering (Linear/Notion use curated swatches).

**a11y contract**
- Swatch group = radio group with the color NAME in each label's name + `aria-checked` + `aria-live` status on selection change (4.1.3).
- Custom picker: `aria-label` + `aria-valuetext` announcing a readable color ("red, 80% saturation"); all controls keyboard-operable; ≥44×44pt touch targets (Q8).
- Never signal selected/state by COLOR ALONE — pair with icon/label/pattern (1.4.1).

**Contrast + storage**
- Build a LIVE contrast preview (text-on-color sample + WCAG ratio); warn on <4.5:1 text / <3:1 non-text (1.4.11). Reference luminance: white/black 21.0, #e66465/white 3.29, #0000ff/white 8.59, #777/white 4.48:1.
- Store the CANONICAL color as high-precision; format to string only on render. Display-rounded HSL drifts (#3a7bd5→#3a7ad5) — never round-trip the formatted string.
- Alpha → `#rrggbbaa` / `rgba()` / `hsla()`; parse both ways for round-trips.

**Native `<input type=color>` + EyeDropper**
- No longer alpha-free: MDN documents `alpha` boolean + `colorspace` (limited-srgb/display-p3) + value accepts any CSS color (oklab/alpha). Treat no-alpha as a DEFENSIVE default (Chromium 2024+ only; presentation varies per MDN) — OS-inconsistency caveat still holds.
- EyeDropper is Chromium-only → `if ('EyeDropper' in window)` feature-detect + hide on Firefox/Safari.
- OKLCH-internal picker math needs a browser-support floor (Q114).

**Rejected (Q125):** (1) building a custom SV/hue/alpha picker for every color field → over-engineering; swatch-radio wins for fixed sets; (2) 'native `<input type=color>` supports only #rrggbb, no alpha' → OUTDATED (MDN now supports alpha/colorspace/any-CSS-color; use defensively); (3) color swatches with no accessible color NAME → violate 4.1.2/4.1.3; (4) storing the displayed (rounded) HSL value → drifts on round-trip, store canonical.

## Q126 — Balanced text wrapping & rag/orphan control (2026-08-29)

Source: Chrome dev blog `text-wrap:balance` + MDN `text-wrap` + WebKit blog `pretty` PRIMARY — ledger Q126 B-row, 11/11 verified + 4 myth-busts. Direct users: DM Astro hero H1/H2 + body, Ghostway POI/card/route titles, DM cockpit record-card/table titles, Open Finance web tier. Pure-CSS, framework-agnostic (Hono/vanilla + Astro + PWA).

- **Headings → `text-wrap: balance`** — Chromium ≤6 / Firefox ≤10 wrapped lines; great for H1/H2, card/route titles.
- **Body → `text-wrap: pretty`** — orphan/rag fix; Safari = whole-paragraph, Chromium = last-4-lines (both spec-legal).
- **NEVER `*{ text-wrap: balance }`** — six-line render limit = wasted request on long content; scope to headings/cards.
- **No feature query** — unsupported degrades to normal wrap (MDN Baseline 2024).
- **`balance` needs `max-inline-size`** (Q7) + does NOT shrink-wrap (bad in bordered/shadowed cards); `white-space: nowrap` disables it.
- **Orphans:** `avoid-orphans`→`avoid-short-last-lines` (#11283) not shipped → use `pretty`.
- **Break control:** `overflow-wrap: break-word` last-resort (Q29) vs `word-break: break-all` (machine strings only).
- **Boundaries:** CJK `balance` can worsen breaks (Q75); `hanging-punctuation` Safari-only.

**One-shot build checklist line:** headings `text-wrap: balance`, body `text-wrap: pretty` (scoped, never `*`); `max-inline-size` on balanced blocks; orphans via `pretty`; `overflow-wrap: break-word` only as last resort. (Q126)

**Rejected (Q126):** (1) 'balance everything / global `*{}` rule' → perf cost on long content (six-line limit); (2) manual `<br>`/`&nbsp;` for line control → breaks on viewport/font/translation; (3) '`text-wrap: balance` shrink-wraps the box' → FALSE, leaves trailing space; (4) '`pretty` is free' → negative perf on long paragraphs; (5) 'use `text-wrap-style: avoid-orphans`' → not shipped (renamed `avoid-short-last-lines`, #11283).

## Q103 — Permission-aware / role-based UI: hide-vs-disable + 403 states · 2026-08-29

Source: MDN `aria-disabled` PRIMARY + Smashing/Friedman 2024 + Salomon hide-or-disable + uxpsychology "Hidden vs disabled states" + HashiCorp Helios design-system — ledger Q103 B-row, 6/6 verified (no mechanical test; design rule). Direct users: DM admin cockpit (Hono+SQLite, admin-vs-viewer roles, destructive admin actions), Open Finance (locked/premium/account-scoped), DM Astro. Ghostway N/A (single-user).

- **One decision question, per control:** "Will this user EVER be able to interact with this?" NO (permissions / access control / safety / admin-only) → **HIDE**. YES-but-not-now (temporary, filter-incompatible, relevant-not-editable, not-yet-available) → keep visible.
- **Never a disabled admin wall** — role-gated controls are hidden, not dimmed; a dimmed admin button advertises capability the user can never have and dead-ends keyboard users.
- **Default for visible-but-blocked = keep ENABLED and explain on interaction** (converges Q52/Q96), rather than pre-emptively disabling.
- **Upgrade/paywall-gated is the one exception** where disabled beats hidden (it teaches the UI) — pair with a "Hide all unavailable" toggle for power users.
- **A11y contract:** native `disabled` = removed from tab order, undiscoverable by keyboard, blocks form submit → only for truly unavailable-and-need-not-be-found controls. `aria-disabled="true"` = stays focusable and is announced ("dimmed"/"unavailable"), works on `<a>` and custom widgets, but you must suppress activation in JS and style it yourself → use whenever the control must stay discoverable and explainable.
- **No layout shift** when a control appears/disappears across roles (reserve space or reflow the whole group); never hide buttons or key filters by default.
- **403 state** = name what's restricted + who to ask for access; never a bare "Forbidden" (Q98 error anatomy).

**One-shot build checklist line:** every role-gated control HIDDEN (not disabled); visible-but-blocked controls stay enabled-with-explanation or use `aria-disabled` (never native `disabled`) so keyboard users can find them; no layout shift between roles; 403 says what + who to ask. (Q103)

**Rejected (Q103):** (1) "disable role-gated admin actions so users see what exists" → leaks capability + keyboard dead-end, hide instead; (2) "native `disabled` is the accessible way to block a control" → FALSE, it removes the control from the tab order entirely; (3) "never use disabled at all" (Helios maximalist) → OVERSTATES; upgrade-gated disabled is legitimate and `aria-disabled` is a valid blocked state; (4) "hide anything unavailable" → hiding buttons/key filters by default destroys discoverability and shifts layout.

## Q149 — Link UX & link affordance · 2026-08-30

Source: W3C 1.4.1/2.4.4/3.2.5 + G183 technique + MDN `:visited` + NN/g + WebAIM Million 2026 — ledger Q149 B-row, 9/9 verified + mechanical scratch/q149-link-contrast.js. Direct users: every Keaton surface (DM Astro, DM cockpit Hono+SQLite, Ghostway PWA, Open Finance web/Android) — all render inline prose + nav links.

- **Distinguishable without color alone (WCAG 1.4.1)** — a link must not be set apart by color only. G183 accepts a 3:1 link-vs-surrounding-text luminance difference PLUS a non-color cue; underline is the PREFERRED cue but NOT mandatory for inline prose when the 3:1 diff + a hover/focus cue already disambiguate.
- **Hard 4.5:1 link-vs-background floor (WCAG 1.4.3)** — mechanical: pale-blue #6699cc = 3.0:1 FAILS 1.4.3 while #0645ad = 8.5:1 passes → never ship the browser-default pale-blue link on a colored/photo background.
- **Context supplies the cue in nav** — nav menus, breadcrumbs, tablists already give a non-color cue (position/context), so underline there is OPTIONAL; inline-prose links MUST carry a persistent cue (underline OR 3:1 luminance diff + hover/focus).
- **Do NOT signal state via `:visited` color** — MDN: browsers privacy-limit `:visited` styling, so it is unreliable as a state signal.
- **Gate it automatically** — axe `link-in-text-block` (Q23) enforces the body-link cue; add it to the a11y/perf gate.

**One-shot build checklist line:** every link distinguishable from body text without color alone (WCAG 1.4.1) — inline-prose links get a persistent underline OR a 3:1 luminance diff (G183) + hover/focus cue; link-vs-background 4.5:1 (1.4.3), never the #6699cc pale-blue default on colored/photo backgrounds (#0645ad=8.5:1 passes); nav/breadcrumb/tablist links may drop the underline (context is the cue); do NOT signal state via `:visited` color; add axe `link-in-text-block` to the Q23 gate. (Q149)

**Rejected (Q149):** (1) 'links must always be underlined' → FALSE (G183 allows 3:1 luminance diff + non-color cue); (2) 'color alone distinguishes a link' → FALSE (1.4.1 needs a non-color cue — underline or 3:1 luminance diff); (3) 'browser-default pale-blue link is fine' → FALSE (#6699cc=3.0:1 fails 4.5:1 vs bg); (4) ':visited color = usable state signal' → FALSE (browsers privacy-limit `:visited` styling, MDN).

### Q142 — Glassmorphism / translucency & backdrop-filter UX · 2026-08-29
- **Contrast floor = worst-case compositing, NOT an alpha number** — light-glass (rgba(245,245,247)) under white text = 1.06:1 at EVERY alpha (mechanical q142 sweep) → 'alpha≥0.7 = accessible' is FALSE; only DARK glass reaches 4.5:1, at α≈0.58, so α≥0.7 is the safe-conservative floor for dark tints. Verify against the WORST-CASE backdrop behind the glass (Ghostway live map = moving/textured worst case), never a flat sample · MDN backdrop-filter (Baseline 2024) + mechanical q142_glass_contrast.py · 6/6 verified.
- **Solid-first fallback, glass as enhancement** — honor `prefers-reduced-transparency` + `prefers-contrast` with a solid text-on-solid default; the property is 'Limited availability' so do NOT rely on the media query to fix legibility — ship solid as the baseline, glass as progressive enhancement.
- **`-webkit-backdrop-filter` is legacy-only** — unprefixed `backdrop-filter` is Baseline 2024 (Safari18+/iOS18); keep the prefix for old Safari but don't treat it as required.
- **Perf: scope the repaint** — backdrop-filter repaints every covered pixel on change → avoid on large/scrolling surfaces; wrap with `contain`/`will-change` and prefer `backdrop-root` to limit repaint scope (nesting = whole-subtree repaint trap, confirmed by MDN backdrop-root semantics). Sticky toolbars OK if scoped.
- **Anti-slop** — full-bleed glass hero/nav reads as AI-generated (converges Q18); use translucency for depth accents, not as a default surface.
- Relevance: Ghostway glass over live map (worst-case legibility + paint cost), DM Astro glass hero/nav (slop tell), DM cockpit sticky glass toolbar.
- **One-shot build checklist line:** if the build uses glass/translucency, verify text contrast against the WORST-CASE backdrop behind the glass (light-glass+light-text fails at every alpha — only dark glass clears 4.5:1 at α≈0.58, so use α≥0.7 for dark tints); ship a solid text-on-solid default + honor `prefers-reduced-transparency`/`prefers-contrast`; `-webkit-backdrop-filter` is legacy-only (unprefixed Baseline 2024); scope repaint with `contain`/`backdrop-root`, avoid glass on large/scrolling surfaces; use glass for depth accents, not full-bleed hero/nav (anti-slop).
- **Rejected (Q142):** (1) 'alpha≥0.7 makes glass accessible' → FALSE for light glass (1.06:1 at all alphas); true only for dark glass; (2) '-webkit- prefix required' → unprefixed Baseline 2024 (Safari18+/iOS18); (3) 'blur hides the contrast problem' → blur changes texture, not the luminance floor; (4) 'glass = modern default surface' → AI-slop tell (Q18), use sparingly.

### Q150 — Focus-indicator (focus-ring) design craft · 2026-08-30
- **Ring recipe:** `:focus-visible` (Baseline) + `outline: 2px solid var(--focus-ring)` + `outline-offset: 2–4px`. Never `box-shadow`-only (vanishes in forced-colors/WHCM — WCAG 2.4.13 Note 1 excludes shadows — and gets clipped), never bare `outline:none` (2.4.7 AA failure, the most-cited audit defect + a top LLM-slop tell) · MDN `:focus-visible` + WCAG 2.4.7/1.4.11/2.4.13 PRIMARY · 10/10 verified + mechanical q150_focus_contrast.py.
- **Design to the 2.4.13 floor even on AA builds:** ≥2 CSS-px perimeter AND ≥3:1 contrast of the SAME pixels focused vs unfocused. MECHANICAL: pastel rings FAIL (lime 2.78, gray 2.64, amber-on-light 1.65); one deep-blue ring passes light (6.44) but FAILS dark (2.93) → per-theme token, verified against the component's real background, not the page background.
- **Double-ring** (inner surface-color + outer focus-color, macOS-style) when the focusable sits on its own surface: cards-as-links (Q62), table rows, list items, map markers (Q85).
- **Safe reset:** style `:focus-visible` first, then `:focus:not(:focus-visible){outline:none}`; add `@supports not selector(:focus-visible)` fallback. Apply to EVERY focusable incl. custom (`[tabindex]:not([tabindex="-1"])`, tabs Q45, option rows). Ring must survive sticky chrome (Q80 2.4.11/2.4.12) and clipped containers (positive offset). No animated ring outside `@media (prefers-reduced-motion: no-preference)` (Q12).
- Relevance: all Keaton surfaces — zero-dep DM cockpit + Ghostway iPhone custom focusables (map markers, POI rows) are where rings go missing.
- **One-shot build checklist line:** style `:focus-visible` with a per-theme `--focus-ring` token (`outline: 2px` + `outline-offset: 2–4px`) on EVERY focusable incl. custom; verify ≥3:1 focused-vs-unfocused against the real component bg in BOTH themes (no pastels); double-ring where the focusable owns its surface; safe reset + `@supports` fallback; no box-shadow-only ring, no bare `outline:none`, no animated ring without a reduced-motion guard.
- **Rejected (Q150):** (1) '`outline:none` for a clean look' → 2.4.7 failure; (2) 'box-shadow rings are fine' → fail forced-colors (Q60) + get clipped; (3) 'focus rings only matter on inputs' → 2.4.7 covers all focusables; (4) 'a soft pastel ring is enough' → measured 1.65–2.78:1, fails 3:1; (5) 'animate the ring for delight' → reduced-motion conflict.

## One-shot build checklist (agent-consumable)
- Focus rings: `:focus-visible` + `outline` 2px + `outline-offset` 2–4px, per-theme token ≥3:1 focused-vs-unfocused on the real component bg, every focusable incl. custom, double-ring on own-surface items; never box-shadow-only / bare `outline:none`. (Q150)
- Color selection: swatch-radio set (<10 named) with COLOR NAME in accessible name + group label + aria-live status; live contrast preview; store canonical, format on render; feature-detect EyeDropper; native input=color no-alpha = defensive default. (Q125)
The pre-generation spec checklist: everything an agent must be told up front so pass 1 lands.
Distilled from accepted strategies; kept ordered and mechanical.
- Link affordance: every link distinguishable from body text without color alone (WCAG 1.4.1) — inline-prose links get a persistent underline OR 3:1 luminance diff (G183) + hover/focus cue; link-vs-background 4.5:1, never the #6699cc pale-blue default on colored/photo backgrounds (#0645ad passes); nav/breadcrumb/tablist may drop the underline (context is the cue); no `:visited` state signal; add axe `link-in-text-block` to the Q23 gate. (Q149)

Type (Q1):
- [ ] One font family; 4–6 sizes on a body-first ramp (steps ~1.14–1.25, hand-tuned OK).
- [ ] Line-height inverse to size: display ~1.12, headings ~1.2–1.3, body ~1.5.
- [ ] Prose containers 50–75ch (~66 ideal); never >80ch.
- [ ] Lowercase for glanceable text; all-caps only for short labels, never passages.
- [ ] No golden-ratio (1.618) ramps; no letter-spacing values cited as "M3" unless verified.
- [ ] Letter-spacing inverse to size, values ONLY in type tokens — never free-adjust tracking
      (LLMs over-apply negative tracking); font-optical-sizing: auto on body.
- [ ] Eyebrow/kicker token = default-ban; if earned, <p>/<span>, never a heading element.
- [ ] Headings text-wrap: balance, paragraphs pretty; tabular-nums on numeric columns.

Font loading (Q34):
- [ ] Self-host WOFF2, subsetted + unicode-range; drop Google-Fonts all-weights CSS.
- [ ] font-display: swap for body, fallback for headings; never block (FOIT).
- [ ] Preload ≤2 critical faces with `crossorigin`; variable font; font-synthesis: none.
- [ ] size-adjust-matched fallback (portable metric; Safari<17 lacks ascent/descent-override) → 0 swap CLS; ~100KB budget.

Video & media player (Q76):
- [ ] Prefer native `<video controls>` / hosted player; custom control bar owes name+role+state + :focus-visible 2px + ≥24/44px targets + no trap.
- [ ] Captions = Level A (1.2.2 prerecorded, 1.2.4 live AA); closed `<track kind=captions>` (not burned-in); 4.5:1 on semi-transparent bg + resize to 200%; transcript provided.
- [ ] Never autoplay with sound (1.4.2); muted decorative only with `playsinline` + visible pause/stop (2.2.2 — muted NOT exempt) + suppressed under `prefers-reduced-motion`.
- [ ] Video is NOT the LCP: prioritized `<img fetchpriority=high>` as LCP, attach `<video>` src in `requestIdleCallback`, `preload=none`, bail on Save-Data; non-hero = `loading=lazy` + `preload=none` + AVIF/WebP poster.
- [ ] WebM+MP4 `<source>` + `aspect-ratio` reserve; custom-player keyboard map (Space/←→/↑↓/M/F) converges Q64; no flashing >3/s (2.3.1).

Date & time input (Q42):

Authentication (Q31):
- [ ] Login meets WCAG 2.2 3.3.8: no cognitive test beyond owned password; MFA + recovery also accessible.
- [ ] Never block paste/autofill on cred/OTP fields; OTP boxes accept full paste; no partial-password entry.
- [ ] NIST rev-4: length-not-composition (15 single-factor / 8 M3-only), max ≥64, no forced rotation/KBA/hints; allow managers + paste + show-password.
- [ ] OTP / 2FA code entry (Q117): ONE real input + `autocomplete="one-time-code"` in a `<form>` (never six per-digit boxes → fails WCAG 3.3.8 + crams on iOS26); `inputmode="numeric"` not `type=number`; paste works + sanitize `/\D/g`; per-digit positional aria-names; ≥48px cells + monospace; keep digits + resend on error; resend after 30–60s; prefer passkeys (Q70).
- [ ] Show-password control present; strength meter (if any) paired with breach blocklist, never the sole gate.
- [ ] Calendar picker ONLY for near-present/relation dates; always allow text entry (never JS-only).
- [ ] Known-date field → `<input type=date>` (single) OR 3 separate numeric day/month/year fields (document dates); never a calendar for a DOB.
- [ ] Custom range/blackout picker → WAI-ARIA APG: role=grid, arrow-key day nav, focus return, OK/Cancel, aria-describedby format.
- [ ] Day cells ≥24×24px (2.5.8); ≥44×44px on touch-field use (Ghostway iPhone).
- [ ] Store ISO 8601 (YYYY-MM-DD); display via Intl.DateTimeFormat; first-day-of-week from Intl.Locale.weekInfo.firstDay.

Length-limit / character-count input (Q120):
- [ ] Default = NO counter; add only on a real legal/backend limit or observed overrun (raise the backend limit instead of adding a counter).
- [ ] Soft limit + server-side validation (not hard `maxlength`); show count only past ~75% of the limit.
- [ ] Wording = REMAINING ("You have 23 characters remaining"); over-limit → "X characters too many" + `aria-invalid`.
- [ ] 3-element a11y split: static `aria-describedby` hint (focus) + visible counter that is NOT a live region + sr-only `aria-live="polite"` (aria-atomic) announcing after ~500ms–1s pause; no-JS static fallback present.

Account closure / DSAR (Q111):
- [ ] Account deletion discoverable in account settings (Privacy / Your-data section), NOT buried in support/FAQ.
- [ ] Ship BOTH channels for a server-side account: in-app deletion (Apple App Store Review Guideline 5.1.1(v) mandates it; Google Play also requires it for mobile apps) + a web-accessible deletion URL reachable after uninstall (Google Play Data safety).
- [ ] Never conflate sign-out / deactivate / export / delete — a hidden "delete" that only de-authenticates is GDPR-non-compliant.
- [ ] Preview before confirm: name the signed-in identity, what is deleted, what is legally retained (billing/tax), subscription/linked-app effects, blocking exceptions.
- [ ] Escalation ladder = re-auth + type-to-confirm (extends Q38); export-before-delete + truthful grace window; model deletion as a JOB with status + receipt (GDPR Art.17 ≤1 month); erase client-side storage on an installed PWA (localStorage/IDB/cookies/Cache Storage — converges Q30/Q100/Q107).

Language / locale switcher (Q101):
- [ ] Multilingual build only: each language option labeled in ITS OWN language ('français' not 'French').
- [ ] No flags as language selectors (country≠language); globe-icon + native label OK.
- [ ] Switcher VISIBLE at/near top of every page; switches to the equivalent page in the new locale.
- [ ] Real links: `<a href>` / `<link rel=alternate hreflang>` / HTTP header — never `<button>`/`<select>`-only JS switcher.
- [ ] Per-option `lang` attr; suggest (hreflang x-default + optional geo/Accept-Language prompt), never auto-redirect.

Orientation / landscape (Q106):
- [ ] Never lock to one orientation — build for BOTH portrait + landscape on every surface (WCAG 2.2 AA 1.3.4).
- [ ] Per-screen essential exemption ONLY for TV / check-capture / piano / VR goggles (removal 'fundamentally changes the content'); state it explicitly.
- [ ] No 'rotate your device' overlay (F100) and no CSS `@media` hide / manifest `orientation` pin / `screen.orientation.lock()` lock (F97).
- [ ] Short-viewport checklist: `dvh` + `max-height` + no `100vh` + keyboard-safe scroll (converges Q80); landscape + on-screen keyboard must not trap submit/unscrollable.
- [ ] iOS Safari has no `screen.orientation` API → don't rely on manifest lock / `screen.orientation.lock()` (silent no-op); Android Chrome honors lock, Android 16 ignores it below sw≥600dp.
- [ ] axe has no 1.3.4 rule → rotate-test in devtools/orientation emulation (manual remainder).

Session timeout / idle-logout (Q77):
- [ ] Authenticated/idle sessions: server-side timeout that is warned + extendable + non-destructive; prefer data-preservation (autosave draft, Q56/Q30) over a copy warning.
- [ ] Warning = `role=alertdialog` + focus on 'Stay signed in' + `aria-live=polite` countdown (visual-only countdown = no notice for SR) + verb buttons ('Stay signed in' / 'Sign out now') + Esc≠logout.
- [ ] Extend RESETS the whole timer; ≥20s WCAG floor (prefer 1–2 min lead on short sessions).
- [ ] DM cockpit + Open Finance ≈ AAL2 → 30-min idle + 12h absolute (NOT flat 15 min); NIST AAL3 = 12h/15-min idle.
- [ ] axe blind to server-side timeout → manual-audit remainder (Q23).

Manual screen-reader / AT pass (Q93):
- [ ] After axe/Lighthouse (Q23), run a MANUAL AT pass — automated tools catch only ~30–40% of issues.
- [ ] Min matrix (solo OSS floor): NVDA + Chrome or Firefox (Windows) + VoiceOver (macOS) + TalkBack + Chrome (Android).
- [ ] Ghostway tested on a REAL iPhone (macOS VoiceOver ≠ iOS VoiceOver).
- [ ] Per-flow script: keystroke | expected announcement | WCAG SC/APG pattern; triage order title→headings→landmarks→links→images→forms→tables; NVDA Speech Viewer = best sighted-tester evidence.
- [ ] Complete a core flow with the SR ON, then a monitor-off pass.

Theme / dark-mode switch (Q46):
- [ ] No-flash resolver: synchronous INLINE script sets data-theme before first paint (module/defer/src = FOUC).
- [ ] `<meta name="color-scheme" content="light dark">` early + `color-scheme` on `:root`.
- [ ] Priority explicit > system > light; 'system' does NOT write data-theme (CSS @media owns it).
- [ ] Both themes hold WCAG AA; 3-state control = radiogroup of 3 radios (not a switch).
- [ ] OS-only need → pure CSS @media + meta, no JS resolver/localStorage/FOUC.

Tooltips & popovers (Q43):
- [ ] Trigger on hover AND keyboard focus; 300–500ms show-delay (never 0ms); touch = tap/long-press.
- [ ] WCAG 1.4.13: dismissible (Esc), hoverable (pointer can enter it), persistent (until dismissed/focus-leaves).
- [ ] `role="tooltip"` + `aria-describedby` on trigger; NEVER `title` attr; contrast ≥4.5:1.
- [ ] Non-interactive only — links/buttons inside ⇒ use a popover (dialog semantics). Never bind to a disabled control (use aria-disabled, Q52).
- [ ] Essential info inline, not hidden in a tooltip (tooltips often the wrong solution).

Multi-step form / wizard (Q51):
- [ ] Wizard ONLY for novice/infrequent + step-dependent flows; repeated expert entry uses a single form.
- [ ] Progress indicator CONDITIONAL: complex/branching setup → step list + current highlight; short linear mobile flow → none.
- [ ] One thing per step; enforce linear order; persist + resume with a summary; Back link + unbroken browser-back.
- [ ] Indicator (if any) 3-state + never-color-only (Q17).

Swipe-to-action on list rows (Q55):
- [ ] Swipe = gesture accelerator only; every swipeable action has a non-gesture equivalent (inline button OR row kebab/overflow menu, Q53) discharging 2.5.7.
- [ ] Edge-differentiated swipe (left/right = different actions) ALSO has a 2.5.1 single-pointer path.

Modal / overlay / dialog (Q61):
- [ ] Modal ONLY for critical/irreversible/blocking/short/urgent content; otherwise in-page/nonmodal/inline.
- [ ] Native `<dialog>.showModal()` (no JS focus-trap on top); `aria-labelledby` title; focus return to trigger on close.
- [ ] Destructive dialog → `role="alertdialog"` + focus the LEAST-destructive (Cancel), not confirm.
- [ ] Never rely on `aria-modal="true"` alone for confinement (MDN: developer must implement inert/obscuring).
- [ ] Sequence nested modals (native `<dialog>` is single-instance; 2nd `showModal()` throws).
- [ ] Mobile → bottom sheet (scrim + 640dp cap + 28dp radius + ≥48dp drag-handle).
- [ ] Gesture handler gated on horizontal-dominant movement; never suppresses vertical scroll.
- [ ] Destructive swipe paired with undo snackbar (Q38); 1–2 actions → inline buttons only (Q53 when-NOT).

Navigation (Q39):
- [ ] Visible nav by default; hide (hamburger) only on small screens + label it ("Menu"/"Browse" + arrow + button signifier).
- [ ] Expose 4–5 primary items; `aria-current="page"` + visible (not color-only) on the active link.
- [ ] Breadcrumbs for deep hierarchy: hierarchy-not-history, current page not a link; mobile no-wrap + shorten.
- [ ] Left-vertical nav OK for broad hierarchies (>7–9 top-tier fine).

Spacing (Q2):
- [ ] Ladder stated: 4px steps INSIDE components (icon↔label, badge, form gap), 8pt steps
      BETWEEN components/sections; no strict-8pt-everywhere dogma.
- [ ] Grouped items separated by ≥1 scale step LESS than between groups (8px in-list, 24px
      between items, 64px between sections).
- [ ] Heading space-above > space-below; layout ranges (card-padding, grid-gap) pinned to ONE
      value; no magic numbers.
- [ ] Fluid spacing (if used) only for section-py + page-padding-x via clamp(); component-
      internal spacing stays static; remember phones get the static floor (vw slope ≥~1440px).

Color (Q3):
- [ ] Grayscale-first: hierarchy via spacing/size/weight before color; 2–3 colors max.
- [ ] Full shade set defined up front (~10 greys + 5–10 shades/hue); pick only from the set.
- [ ] Greys tinted with brand hue; semantic role tokens (primary/surface/error/on-surface).
- [ ] WCAG 2.2: text ≥4.5:1 (large ≥3:1), non-text UI/graphics ≥3:1, no color-only signals.
- [ ] Dark mode = own palette: #121212 floor, #E0E0E0 text, desaturated accents, tonal elevation.
- [ ] No 60-30-10 ratio (rejected); no inverted-light dark themes; OKLCH/HSLuv for scale gen.

Color-blind safety (Q17):
- [ ] Categorical/status palettes from Okabe-Ito 8-color (hexes in Q17 section); no
      red-vs-green-only status pairs; never encode meaning by hue alone.
- [ ] WCAG 1.4.1 redundant encoding: errors = icon + text, required = marker text, focus =
      visible ring, chart series = pattern/shape/direct label, links = underline.
- [ ] Semantic role tokens paired with redundant encoding (error = token + ✕/⚠ icon + text).

Forced-colors / prefers-contrast (Q60):
- [ ] Detect with `@media (forced-colors: active)`; make SMALL tweaks only (no separate design).
- [ ] Fix vanished UI with BORDERS not color: `border: 2px solid ButtonText`; focus = `outline: 2px solid Highlight` + offset (converges Q21).
- [ ] Prefer system-color keywords (`Canvas`/`ButtonText`/`Highlight`…) inside the query; use real `<button>` + border — never a `div[role=button]` (forced colors map by native semantics, not ARIA).
- [ ] Custom checkbox/toggle/radio get forced-colors border fallbacks (don't rely on bg/fill alone).
- [ ] Boundary: HCM = Windows + Android-web only; iOS Safari (Ghostway) + macOS (`prefers-contrast`) unaffected.

Motion (Q12):
- [ ] Feedback (press/hover/toggle) 100–200ms; enter/exit (overlays/reveals) 200–300ms;
      brand moments 500ms+ SPARINGLY. The "150–300ms" gate = enter/exit, not hover.
- [ ] Easing: ease-out for enter/user-triggered; ease-in for exits; symmetric for in-place;
      bounce/spring = accent-tier, max one.
- [ ] Animate transform + opacity only (clip-path OK); never width/height/top/left/margin/
      box-shadow-spread; `transition: transform, opacity` not `transition: all` (Q21).
- [ ] Motion budget: skip animation on frequent/low-novelty updates (list ticks, poll
      counters, trivial hovers); next-frame feedback instead (Q14); pause off-screen loops;
      stagger 30–80ms; press scale(0.97); hover gated to (hover:hover) and (pointer:fine);
      never scale(0).
- [ ] Reduced motion = fewer/gentler, not zero: keep opacity fades; drop position/scale/
      parallax (satisfies WCAG 2.3.3 + 2.2.2).
- [ ] Scroll-reveal (Q57): one-shot-stay → IntersectionObserver (`unobserve`); scroll-linked → CSS `view()`/`scroll()` only inside `@supports (animation-timeline: view())`; `animation-timeline` declared AFTER the `animation` shorthand; `overflow: clip` not `overflow-x: hidden` (steals view() binding); NO reveal above the fold or on dashboards/tools; reduced-motion → finished state fully visible, opacity-only fade only.

Depth & shape (Q4):
- [ ] One radius family per product; radii from tokens; size correlation (bigger surface =
      bigger radius); nested radii derived inner = outer − border − padding, clamped ≥0.
- [ ] Elevation stated: static content flat (no shadow), resting card sm, hover +1 step,
      overlays/modals top of scale; shadow level agrees with z-layer.
- [ ] Shadows tinted toward surface hue (not pure black) on tinted surfaces; layer count
      grows with elevation.
- [ ] Dark mode: tonal elevation, not shadows (shadows nearly invisible on dark).
- [ ] Hover shadow transitions 100–150ms ease-out; no floating shadows on static content.

Command palette / keyboard shortcuts (Q50):
- [ ] No "W3C command-palette pattern" — compose a modal dialog (focus-trapped, Esc closes, focus returns to opener, aria-modal+aria-label) wrapping a combobox (aria-controls [not aria-owns], aria-expanded, aria-autocomplete=list) + listbox + aria-activedescendant virtual highlight.
- [ ] Visible ✕/Close INSIDE the palette (APG: dialog tab sequence should include a visible close button; Esc-only palettes violate it; serves touch users).
- [ ] aria-modal=true ONLY when code truly inerts + obscures outside content; else omit.
- [ ] Discoverability REQUIRED: visible trigger + inline `<kbd>` hints on commands + `?` cheat-sheet (keyboard-only discoverability is refuted — shortcuts infrequently used, active-user paradox).
- [ ] Touch-primary surfaces (Ghostway iPhone, OF Android) = NO palette; core actions must be a visible search box / bottom sheet; only DM cockpit is a real ⌘K user.
- [ ] Perf: activeIndex in state; debounce filter 200–300ms (Q36); virtualize long lists; no sync work on keydown.
- [ ] DON'T add ⌘K to simple marketing sites (Q18 slop tell) or below ~15–20 keyboard-reachable actions.

Menus / overflow (kebab) (Q53):
- [ ] Trigger = real <button> with aria-haspopup="menu" + aria-expanded (explicitly "false" when closed, never removed); aria-controls optional.
- [ ] Opens on Enter AND Space; Tab moves focus OUT and closes (composite widget, don't trap); Escape closes + returns focus to the trigger (store the ref).
- [ ] Custom right-click is an ACCELERATOR only — always ship an always-visible kebab too (Firefox Shift+right-click bypasses preventDefault; contextmenu = "Limited availability").
- [ ] Touch: long-press ~0.5s opens; keep menu FLAT on field PWAs (iPhone/Android); submenus desktop pointer:fine only.
- [ ] Only 1–2 actions → inline them (Q29); don't build a full ARIA menu for trivial actions.

Icons (Q5):
- [ ] One icon set + one style (outline OR filled) + one stroke width product-wide; no
      mixing Lucide+Heroicons (AI-slop tell); no emoji-as-icons.
- [ ] 24×24 viewBox grid; icon sizes from tokens (12/16/20/24px), ≈ adjacent label text
      size; button icons one step ≤ standalone.
- [ ] Icon↔label gap 4–8px; icon aligns to the label's CAP HEIGHT, not line-box center.
- [ ] Filled variant = active/selected state (non-color-only signal); stroke width tuned
      at extremes (2px too thin ≥32px, too heavy ≤16px → 2.25–2.5).
- [ ] Inline SVG with currentColor (no icon fonts, no CDN); decorative icons aria-hidden;
      icon-only controls get an accessible label; icons pass 3:1 non-text contrast.

Tabs / accordions / disclosure (Q45):
- [ ] Tabs for few, clearly-grouped, related panels of UNEQUAL importance; accordions for
      mobile/limited space + short FAQ; in-page tabs NOT used as site navigation.
- [ ] ARIA tab pattern: tablist/tab/tabpanel + roving tabindex (active=0, others=-1) + Arrow
      moves focus + Enter/Space activates + aria-selected/controls/labelledby.
- [ ] Selected tab shown by ≥2 indicators (underline + bold), NOT color-only.
- [ ] One row, above the panel, no ALL CAPS, descriptive 1–2-word labels; automatic activation
      only for instant panels, else manual.
- [ ] Disclosure/accordion = <button> + aria-expanded + aria-controls + chevron right→down
      (not color-only); mobile overflow = scroll-snap strip or <select>/accordion (no carousel).
- [ ] Manual keyboard + roles check (axe/Lighthouse have NO tab-pattern ARIA rule).

Hero / landing (Q6):
- [ ] Hero earns the scroll: promise + proof + CTA above the fold (fold = gradient, not
      wall — 57% viewing time above it; never cram everything above, never ignore it).
- [ ] One primary CTA per page, repeated VERBATIM at hero + after proof + final offer;
      secondary actions = links, not buttons.
- [ ] 5-second test: stranger names what/who/next-step/main-benefit from the hero alone.
- [ ] Layout: left-aligned stack default (centered trio = AI-slop tell); real screenshot >
      stock photo; proof near CTA; strongest proof right after the first scroll.
- [ ] Mobile: promise + CTA inside first viewport at 390×844 (dvh); sub may fall below,
      headline+CTA must not; CTA ≥44px thumb-reachable.
- [ ] CTA visual: filled, ≥3:1 non-text contrast, 4 states, first-person verb label
      (principle — never quote lift % as law).

Grid / max-width / measure (Q7):
- [ ] Page max-width picked by density (prose/marketing 1280–1520px), paired with fluid
      padding-inline clamp(1.25rem, 4vw, 3rem); check 1440–2560px for dead space.
- [ ] Prose columns capped by their OWN measure token (65ch; 50–75ch, 80ch hard cap) —
      independent of the shell width.
- [ ] ch limits only trusted with a fixed font stack (ch = '0' width, ~50% font variance);
      otherwise use rem.
- [ ] Grid-gap pinned to ONE value; breakpoints treated as test checkpoints, not drivers.

Mobile/PWA (Q8):
- [ ] Touch targets ≥24px (24px square INSIDE bounds); field-use PWA/Android aim ≥44px.
- [ ] ≥24px spacing between adjacent targets if any target is under 24px.
- [ ] Full-height layouts use dvh (never 100vh); svh for fixed full-bleed elements.
- [ ] viewport-fit=cover + env(safe-area-inset-*) padding on edge-anchored UI.
- [ ] Component responsiveness via container queries (inline-size + cqi), not just media queries.
- [ ] Installed-PWA check = navigator.standalone OR display-mode:standalone (dual-check).
- [ ] Bottom-docked chrome: primary/destructive CTAs in the bottom thumb-zone; pin single/dual primary CTA in a bottom ACTION-BAR (above nav-bar, above home indicator); nav-bar = 3–5 items (Q39). [Q153]
- [ ] ALWAYS pad bottom-fixed bars/controls with `padding-bottom: env(safe-area-inset-bottom)` — a 56px bar without it collides with the 34px home-indicator band (mechanical proof.py). [Q153]
- [ ] Target floor = 44pt iOS / 48dp Android / 24px WCAG (Q8); never rely on absolutist 'no hamburger' rule (Q39 damage-control stands). [Q153]

Geolocation permission (Q33, if the build uses GPS):
- [ ] Location NEVER requested on page load — only on a user-gesture tap on an explicit
      "Use my location" button.
- [ ] Pre-prompt explains what + why; copy = "[app] would like your location so you can
      [benefit]" (benefit-framed, active voice).
- [ ] Manual-entry fallback (ZIP/address) sits NEXT TO the locate button.
- [ ] Denial handled via error code (not Permissions-API state — unreliable on iOS Safari);
      don't loop/re-ask; insecure-context/timeout get distinct copy.
- [ ] Standalone iOS PWA: getCurrentPosition wrapped in Promise.race ~4s timeout (it HANGS).

PWA install & launch (Q32, if installable):
- [ ] Manifest: name/short_name (<45/<12 chars), icons 192 AND 512px, start_url = app entry,
      display standalone, scope "/", background_color = splash match, id stable.
- [ ] apple-touch-icon 180×180 OPAQUE square PNG (no rounded corners/transparency) — iOS has
      NO install prompt; without it the home-screen icon = a page screenshot.
- [ ] Maskable icon: content inside the 40%-radius circle (~10% padding/side), no transparency.
- [ ] Android: beforeinstallprompt → preventDefault → stash → prompt() only from a user
      gesture; never prompt on page load; never fake install buttons.
- [ ] iOS: detect in-app browsers (FB/IG) → offer "open in Safari" for A2HS.
- [ ] Install promotion: dismissible + remember dismissal, snackbar 4–7s after interaction,
      post-conversion timing.
- [ ] Launch chrome keyed off display-mode dual-check (navigator.standalone OR matchMedia).

Android/M3 (Q10 — Open Finance):
- [ ] Bottom nav 3–5 destinations; if always-visible labels wanted, set LABELED explicitly
      (default AUTO drops labels at 4+ items).
- [ ] Sheets: pick standard (coexists) vs modal (blocks); 28dp corners; 640dp max-width;
      drag handle reserves 48dp touch zone.
- [ ] Dynamic Color only as opt-in with the app's own M3 scheme as fallback (error #B3261E).
- [ ] sp for text only; dp for padding/dimensions.
- [ ] Breakpoints from window size classes (compact <600dp), window-based not device-based;
      UI state survives runtime class changes.

States — loading/empty/error (Q11):
- [ ] Loading with known layout = shape-matched skeleton (same grid/box sizes; no CLS swap).
- [ ] Skeleton delayed ~200ms (no flash on fast loads); escalate at 5s; percent-done >10s.
- [ ] Spinner only for short indeterminate waits or overlay on existing content.
- [ ] Empty state routed by cause (first-use/cleared/filtered/no-results/401); each has
      WHY + next action + icon; never "No records" that later fills with data.
- [ ] Errors name the failure + recovery action + preserve user work; no "Something went
      wrong."; offline/5xx/401 copy split.
- [ ] Android: LoadingIndicator for <5s with showDelay set explicitly (default 0ms);
      dark theme gets its own error tone (#B3261E fails 3:1 on dark surfaces).

Perceived performance (Q14):
- [ ] Every long interaction shows visual feedback in the NEXT PAINTED FRAME (pressed
      state, instant open) — never silent latency.
- [ ] Timing tiers: ≤0.1s no feedback needed; ≤1s delay OK, control retained; >10s =
      percent-done bar (attention wall).
- [ ] 2–10s ops: subtle feedback, not percent-done (display inertia); INP budget
      ≤200ms (p75 field, mobile+desktop split).
- [ ] Optimistic UI only for lightweight high-success actions; idempotency keys; TanStack:
      cancelQueries + snapshot in onMutate, rollback in onError.
- [ ] Any narrated "working on it" progress must be REAL and must succeed — no fake/looping
      progress (labor illusion backfires on failure/bad outcomes).
- [ ] Frequent progress updates are preferred even though they lengthen duration estimates —
      give feedback anyway.

Search & autocomplete (Q36, if the build has search):
- [ ] Search is a VISIBLE box (not an icon that opens a field); top-of-page placement.
- [ ] Width shows the typical query without scrolling (~27–30ch convention, not a hard law).
- [ ] Suggestions only for queries WITH results; highlight the suggested direction; mobile = text only.
- [ ] No-results page states the miss + a path forward (no mockery); convergences Q11 empty-state.
- [ ] Results page echoes the query (editable) + result count + relevance sort.
- [ ] ARIA combobox (role=combobox + aria-expanded/controls/activedescendant) + debounce 200–300ms
      + 5–10 suggestions; axe has no combobox rule → manual keyboard/semantics check.

Images & media (Q35):
- [ ] Hero/first-viewport image is `eager` + `fetchpriority="high"`; NEVER `loading="lazy"` on it; ≤1–2 high-priority images max.
- [ ] Below-fold images use `loading="lazy"`; `preload` only when hidden from the preload scanner.
- [ ] Every `<img>` has explicit width/height (or aspect-ratio) — no dimensionless images (0×0 lazy-gallery trap).
- [ ] `<picture>` AVIF → WebP → JPEG; WebP pragmatic default, AVIF build-time-only.
- [ ] srcset `w`-descriptors + `sizes`; `decoding="async"` below-fold.

Anti-slop (Q18):
- [ ] Name the surface mode in the prompt: Persuade / Operate / Read / Experience (by SURFACE).
- [ ] No kicker/eyebrow chip above headings (default-ban; if earned, <p>/<span>, never <h*>).
- [ ] No gradient text, glass/blur decoration, border-left >1px, hard offset shadows, or
      sparkline/ring stand-ins for content.
- [ ] Page structure is NOT same-size card rows; no nested cards; no hero-metric template.
- [ ] No section numbers unless sequence carries info; no emoji-as-icons; icons drawn,
      one stroke + weight.
- [ ] Fonts off the overused list (Inter/Roboto/Open Sans/Lato/Montserrat + Fraunces/
      Instrument/Geist/Mona Sans/Plus Jakarta Sans/Space Grotesk/Recoleta); self-host a
      face matching the brand.
- [ ] Browser-surface theming (theme-color/meta) set in pass 1.
- [ ] Craft floor on the BUILT result: secondary text tinted from surface hue, shadows
      offset+blur, display ≤6rem, tracking ≥−0.04em, one authored motion moment, all states
      present with real content.
- [ ] Verification bounded: one batched inspection round (desktop+mobile) → one fix batch →
      at most one confirm round → stop. Run impeccable's detector if available.

Originality (Q19 — marketing/brand surfaces):
- [ ] ONE page grammar chosen BEFORE building (8 options in scroll-craft uniqueness.md);
      never blend two; filmic default carries burden of proof ("why not the other seven?").
- [ ] ONE signature move planned — bespoke to this build; tell-apart test: someone who's
      seen the other builds can name it (recoloured spotlight / tilt / easing ≠ signature).
- [ ] Fingerprint registry checked: new build differs from EVERY shipped row on ≥4 of 6
      dims (grammar/nav/hero/act-shape/close/signature); change the PLAN, not the log.
- [ ] Taste floor holds in EVERY aesthetic family (4.5:1, spacing scale, measure, focus,
      reduced-motion, real copy) — originality = structure+voice, never craft floor.
- [ ] Deviations brief-earned; commercial surfaces lean TYPICAL (MAYA), service/brand
      surfaces may carry more novelty.
- [ ] Squint test pre-ship: blurred page still names primary → secondary → groups in order.

LLM-output discipline (Q21):
- [ ] Fixed z-index layer scale defined once (0/10/20/30/40/50); no arbitrary z-*.
- [ ] Every interactive element gets hover/focus-visible/active/disabled in the prompt;
      focus-visible 2px outline + 2px offset; hover delta ~10% lightness.
- [ ] Letter-spacing untouched unless requested; +0.05–0.1em only for ALL CAPS;
      text-underline-offset 3–4px on links.
- [ ] Nested radii derived: inner = outer − (border + padding), clamped ≥0.
- [ ] Visible scrollbars styled dual-API (scrollbar-color + ::-webkit-scrollbar fallback
      for iOS <26.2); thumb ≥3:1, gutter stable, 8–10px min.
- [ ] h-dvh not h-screen; text-balance/text-pretty on headings; tabular-nums for numbers.

Build-prompt structure (Q20):
- [ ] Pass extracted LITERAL copy alongside any visual reference — never image alone.
- [ ] Front-load layout constraints (grid, max-width, section order, spacing scale) BEFORE
      content — layout is the model's failure axis.
- [ ] Long page? Generate section-wise (tag count = difficulty; long pages degrade).
- [ ] Per-section prompts = inventory + featured-element treatment + responsive rule + one
      concrete visual anchor (layout targets, not vibes).
- [ ] Don't bank on a critique/self-revision pass to fix layout on mid/weak models — get
      pass 1 right via inputs (frontier models can revise hard pages).
- [ ] Render-check: screenshot per section, compare to reference.

Reference-driven generation (Q22):
- [ ] Author a DESIGN.md per project (YAML tokens + prose, 8-section order) BEFORE building;
      reference it by path in the build prompt.
- [ ] Tokens named by intent with "when to use" notes (background-card, not gray-100).
- [ ] Prompt = DESIGN.md + reference screenshot + literal copy; iterate the system, not screens.
- [ ] Borrowing a brand file (awesome-design-md)? Verify key hexes vs the live site first.
- [ ] @google/design.md lint = ADVISORY (alpha); parse --format json for contrast warnings;
      never hard-CI-gate on it.

Semantic HTML (Q16):
- [ ] Exactly one h1 per page; no skipped heading levels (size via CSS, not level).
- [ ] Landmarks header/nav/main/footer each ONCE; aria-current="page" on active nav link.
- [ ] Modals = native <dialog> + showModal(); NO JS focus trap on top of native; show() ≠
      showModal() (non-modal).
- [ ] Skip link = first focusable element; sr-only text = clip-path:inset(50%) recipe.
- [ ] <button> not div/onClick; <a href> not div for nav; <label for> every input;
      <fieldset>/<legend> groups; <th scope> tables.

Dashboard / admin (Q9):
- [ ] tabular-nums on all live-updating numbers (tables, timers, "Ns ago" stamps, scores);
      system font stack for data columns; numbers/currency right-aligned.
- [ ] No font-weight change on hover/selected (layout shift).
- [ ] Feedback at the trigger: inline checkmark on copy, highlight the errored input —
      not a distant toast.
- [ ] Buttons disabled after submit; list items gap-free (grow padding, not margin);
      dropdowns open on mousedown.
- [ ] Focus = outline-first (2px + 2px offset); box-shadow ring only for Safari <16.4.
- [ ] Hover styles behind @media (hover:hover); inputs ≥16px (no iOS focus-zoom); no
      autofocus on touch.
- [ ] Feedback motion ≤200ms; skip animation on frequent/low-novelty updates; pause
      off-screen loops.
- [ ] No tooltip on disabled controls; ↑↓ + ⌘⌫ list nav; icon-only controls labeled.

Data tables (Q29 — if the build has tables):
- [ ] Table only if comparison across shared attributes matters (else cards/big-numbers).
- [ ] First column = human-readable identifier (never auto-ID); related columns adjacent.
- [ ] Freeze header row + identity column on tables taller/wider than one screen.
- [ ] Density tier chosen deliberately (Carbon: 24/32/40/48/64px); touch-first = lg 48+
      rows or separate ≥44px action targets (24px = conformance floor only).
- [ ] Zebra OR borders, pick ONE — tracking aid, never claimed as performance.
- [ ] Text left / numbers right + tabular-nums; dates one consistent side.
- [ ] Row actions: inline ≤2, else always-visible or keyboard-reachable kebab — never
      hover-hidden-only; batch = checkbox + Select All.
- [ ] Edit in non-modal panel/inline (modals cover adjacent rows); edit row marked.
- [ ] Mobile: priority columns / h-scroll + frozen identity / reflow cards; text never
      shrunk below readable.
- [ ] States: no-data vs no-results distinct; skeleton rows match layout; chrome + retry.

List-paging (Q37 — if the build has a paginated list):
- [ ] Pattern chosen by TASK: infinite scroll ONLY for homogeneous/goalless grazing; goal-driven find/compare lists (DM cockpit, Ghostway POI) use PAGINATION or Load More.
- [ ] Classic infinite scroll avoided for find/compare/low-bandwidth/a11y-heavy lists (6 NN/g costs: refinding, illusion-of-completeness, footer trap, a11y, load, SEO).
- [ ] List items link out → save + restore list position on Back (pogo-sticking).
- [ ] Page size: ONE default (10 or 20) + View All, not a 10/20/30/40 popup; cap View All ~100; persist choice.
- [ ] CLS: reserve space / skeleton-match / prefetch; ~500ms before counting a shift.
- [ ] A11y: role=feed + article + aria-posinset/setsize/busy + PageUp/PageDown/Ctrl-End; Load More = simpler accessible default.

Forms (Q13):
- [ ] Label ABOVE every input + required/optional marker; never placeholder-as-label.
- [ ] Validate on BLUR; after first error re-validate on every input (live-clear). Never
      keystroke-1, never submit-only.
- [ ] Error directly below the field (after help text); error border on input AND text;
      role="alert" on the message only; aria-describedby = help + error ids.
- [ ] Semantic autocomplete tokens (email/given-name/street-address/postal-code/cc-…);
      autocomplete="off" only for search/combobox.
- [ ] :-webkit-autofill styled on dark UIs (inset box-shadow + -webkit-text-fill-color +
      transition-delay:9999s); Firefox needs nothing.
- [ ] <fieldset>/<legend> groups; conditional fields inline; <details>/<summary> for
      advanced blocks.
- [ ] Long forms: submit-time error-summary box at top (role="alert", focus moved to it).

Map UI (Q27 — if the build has a map):
- [ ] Every multipoint/path gesture has a single-pointer alternative: +/− zoom buttons,
      step-pan/tap-to-center. Keyboard-only does NOT satisfy WCAG 2.5.1/2.5.7.
- [ ] cooperativeGestures ON only for maps embedded in scrolling pages; OFF for full-
      screen dedicated maps (Ghostway). Type is boolean — no options object.
- [ ] Controls ≥44×44px + 8px spacing for field use (MapLibre ships 29px — override);
      elementFromPoint hit-test each control (they float over the canvas).
- [ ] env(safe-area-inset-*) on control CONTAINERS (canvas bleeds, controls must not;
      shipped 10px margins sit under notch/home indicator on iPhone standalone).
- [ ] Attribution never display:none (OSM license); compact on mobile; 4.5:1 over
      imagery worst-case; overlays/popups = solid surface, no glass over terrain.
- [ ] No dark-basemap-by-default (category habit), no decorative 3D terrain, no
      compass-spin animations.

Manual refresh / pull-to-refresh (Q49 — if the build is a field PWA with manual refresh):
- [ ] A visible Refresh control exists (WCAG 2.5.1 single-pointer alternative — cite F105's tap-alternative test, not a W3C example).
- [ ] NO pull-to-refresh gesture on a pannable map surface (Material Don't list = pannable content/maps + nav drawers + home-screen widgets; converges Q27); the visible control doubles as the sync-queue trigger (Q30).
- [ ] Web: suppress browser pull-to-reload only with `overscroll-behavior: contain` on the scroll container (iOS Safari 16.0+ only); gesture bottom-anchored variant is legitimate (chat).
- [ ] Native platform control (M3 PullToRefresh Compose-only / SwipeRefreshLayout for Views / iOS UIRefreshControl), not hand-tuned px; keep indicator until done + restore scroll + error/retry.

Chart & data-viz (Q28 — if the build has charts):
- [ ] Chart type matches the question (comparison→bar, trend→line, part-whole→stacked bar not pie ≤2–3 slices, distribution→histogram, correlation→scatter, ranking→horizontal bar sorted).
- [ ] Bars start at zero baseline (line charts may not — label the axis).
- [ ] Direct labels in place, not legends (less decode look-away, more accessible).
- [ ] No magnitude encoded by HUE/unordered color; ordered/luminance ramps OK (heatmaps).
- [ ] a11y floor: non-text 3:1 + text 4.5:1 + text-alt or data-table fallback; series not hue-only.
- [ ] No chartjunk (3D/borders/decoration); grey-first + single accent.
- [ ] Dual-axis only for same-unit-related or indexed series; else split charts.
- [ ] Skip the chart for 1–3 points / exact-needed values → table or big-number.

Verification gate (Q23 — post-build, before "done"):
- [ ] `npx @axe-core/cli <url> --exit --tags wcag2a,wcag2aa,wcag21a,wcag21aa,wcag22aa`
      passes (wcag22aa tag REQUIRED — target-size 2.5.8 is disabled by default otherwise).
- [ ] JS-heavy/dashboard surfaces: @axe-core/playwright tier (open modals/menus first);
      CLI alone misses interactive-state + mobile touch-size violations.
- [ ] Lighthouse median of ≥3 runs with --budget-path; --form-factor=mobile default.
- [ ] Remember: gate = floor (~30–40% of WCAG). Manual pass: keyboard, focus, screen
      reader, reading order, accessible auth. Lighthouse 100 ≠ accessible.

Contrast + visual QA (Q24):
- [ ] Contrast computed, never eyeballed: 4.5:1 text / 3:1 large (≥24px or ≥18.5px bold) /
      3:1 non-text UI; NO rounding (4.499 FAILS); thin fonts → aim above nominal outdoors.
- [ ] APCA used in design phase only — never as the conformance gate (draft standard).
- [ ] Visual regression (web tier): Playwright toHaveScreenshot + stylePath + per-browser/
      per-OS goldens; pixelmatch from git (npm lacks windowSize) or vendored density fail.

Destructive actions (Q38):
- [ ] Reversible deletes get UNDO / snackbar, not a confirm dialog on every delete (habituation
      makes "Are you sure?" auto-Yes; reversibility is a data-model decision, not a modal).
- [ ] Confirm reserved for serious+irreversible; when shown: NAME the consequence, verb-labeled
      buttons (Delete/Cancel) not Yes/No, destructive control FAR from benign (proximity).
- [ ] Escalation ladder: undo → confirm → type-to-confirm → second-user; Cancel vs Close
      disambiguated (auto-save work; X is ambiguous).
- [ ] M3 Snackbar undo: one-at-a-time, ~1500/2750ms, swipe-dismiss, anchored above FAB/nav;
      capture pre-state before the action, restore exact object; defer hard-delete to timeout.

Button & action-hierarchy (Q52):
- [ ] One primary (filled/emphasized) action per screen/context; secondary actions = outlined/text/link, not a second filled button.
- [ ] Button vs link by FUNCTION: `<button>` for actions/events, `<a href>` for navigation — never restyle a link as a button (appearance must match role).
- [ ] Disabled state: use `aria-disabled="true"` (not HTML `disabled`) when the reason must stay discoverable; handler early-returns; web-only. Prefer keeping enabled + inline error on submit.
- [ ] Toggle = `aria-pressed` + STABLE label (label flips → drop aria-pressed); menu button = `aria-haspopup="menu"`.
- [ ] Dialog-launching buttons append "…"; Space+Enter activate; dialog open→focus inside / close→return to opener.
- [ ] Native `<button>` over `div role=button` (hand-rolled needs Space/Enter + focusability); target size ≥24px (Q8/Q23).

Offline-first (Q30):
- [ ] If a field PWA: decide offline-first vs offline-tolerant up front (~2× effort; field/offsync-critical only).
- [ ] Signal offline state with icon + TEXT (not color); queued/synced actions = visible markers + pending-sync count.
- [ ] Sync replays on app-open (iOS Safari has NO Background Sync / Periodic Sync / Background Fetch).
- [ ] No silent data loss: every offline write shows feedback + queued/synced status.

Carousel / sliders (Q48):
- [ ] No auto-rotating hero/promo carousel — static hero + scrolled sections (Q6); if a gallery, user-initiated swipe/next is fine (product/POI), with a non-swipe prev/next control (Q27).
- [ ] If rotation truly needed: visible control FIRST in tab order; stops on keyboard focus (no resume unless re-activated) + pauses on hover; pause/stop/hide satisfies WCAG 2.2.2 (no 5s loophole).
- [ ] Container role=region + aria-roledescription="carousel" + label without 'carousel'; tabbed variant = tabpanel + tablist 'Choose slide to display'.

Share & copy (Q68):
- [ ] Feature-detect `navigator.share` + ALWAYS ship Clipboard API (+ execCommand fallback); one native share button > social-icon grid.
- [ ] `AbortError` = user cancel / no targets → catch + ignore, never error-toast; prefer `url` alone over text+url.
- [ ] Copy microcopy 'Copied!' ~2s label-swap (no modal); Web Share Target manifest+SW for inbound.
- [ ] Call `share()` DIRECTLY in the handler — no `await` that consumes the gesture (NotAllowedError). Private-data share → confirm + narrow payload.

### Q40 — Filter & facet design UX · 2026-08-28
Verified 8/8 (2nd-source ×6 + mechanical scratch test). Distilled into uiux-one-shot-polish (pre-gen spec + Accepted-strategies Q40) + web-page-production-polish references/dashboard-uiux-audit.md § Filter & facet design.

**Rules:**
- Verify a facet earns its cost (facets > plain filter controls; Baymard ~34% of sites filter poorly) — don't facet by default.
- Mobile = deferred BATCH Apply (one ≥44px Apply button); instant/interactive filtering only for small/stable/fast desktop lists.
- Never scroll-yank on apply (no full reload / discarded scroll).
- `aria-live` result count = POLITE + debounced (instant filtering drowns SR users).
- Group controls in `<fieldset>`/`<legend>`; per-value counts; OR-within / AND-across facets; values prioritized/jargon-free.
- Mobile = tray/full-screen sheet that KEEPS results visible + live count — never a dead-end screen.
- Persist filter state in the URL (shareable/bookmarkable).

**One-shot build checklist line:** if the build has filterable lists, justify each facet; mobile uses a single deferred Apply (not instant); announce counts via polite+debounced `aria-live`; keep results visible; persist state in the URL.

**Rejected / counterexamples:** facets-everywhere; instant-apply-on-mobile ("tap-to-commit brutal"); scroll-discarding reload on apply; `aria-live` count without debounce; filter-state-not-in-URL.

**One-shot build checklist line:** if the build shows live/auto-refreshing data (DM cockpit dashboards, OF budget/txn views, Ghostway sync-status), never swap data for a spinner on refresh (stale-while-revalidate + subtle indicator); model a 6-state freshness machine, each with copy+recovery; show "Last updated HH:MM" + manual Refresh that keeps focus; announce only user-triggered refresh + state transitions (aria-live=off correct for tickers); tbody inserts = aria-live=polite aria-atomic=false; no layout jump (fix chart axes, carry prev data, aria-busy); guard stale writes with AbortController + ownership check.

## Audit of an EXISTING build (Q25 — review pass, not pre-gen):
- [ ] Scaffold: Nielsen's 10 heuristics + the fleet's accepted strategies as checklist.
- [ ] Narrow scope (one task/section/device per pass); two passes: learn, then evaluate.
- [ ] N≥3 independent passes (fresh sessions, no shared context) → UNION findings,
      MEAN severity; evaluators don't see each other's findings until done.
- [ ] Severity 0–4 (freq × impact × persistence); several 4s = don't ship; sort 4s+3s first.
- [ ] Trust LLM findings; LLM severity = proposal needing Keaton sign-off (56% exact).
- [ ] Violation ≠ bug; heuristics ≠ user research — Keaton field tests are the user check.
- [ ] Output = retrofit table (issue + heuristic + severity + fix); queue to Needs Keaton.

## Anti-slop design tells
What makes UI read as "AI-generated", and the concrete alternative for each tell.
(Filled 2026-08-27 from Q18 — impeccable, verified. Full record in Accepted strategies Q18
above + `uiux-one-shot-polish` → `references/anti-slop-tells.md`.)

| Tell | Concrete alternative |
|---|---|
| Same-size card rows as page structure | Editorial hierarchy: one featured element, prose, asymmetric layout; never nested cards |
| Hero-metric template (big number + label + stats) | Lead with the specific outcome/proof in words |
| Kicker/eyebrow chip above heading | Heading carries its own weight; if earned, use `<p>`/`<span>` — never a heading element |
| Section numbers 01/02/03 | Number only when sequence carries information |
| Gradient text, glass/blur, border-left >1px, hard offset shadows, sparkline stand-ins | Emphasis from weight/size; shadows need offset+blur; real content instead of decoration |
| Mono-as-technical costume, system display face, emoji icons, geometric photo masks | Real code/data; sourced self-hosted display face; drawn icons (one stroke+weight); real alpha matte or omit |
| Category-habit light/dark | Pick by use scene: who, where, ambient light |
| Overused fonts (Inter/Roboto/…/Fraunces/Geist/Space Grotesk/Recoleta) | Source + self-host a face matching the brand lettering |
| Identical entrance animation on every section | ONE authored motion moment, exponential ease-out from already-visible |
| Untouched browser chrome | Browser-surface theming — cheapest authenticity signal, models skip it most reliably |

Mechanical check: impeccable's detector (`node cli/engine/detect-antipatterns.mjs`, needs
htmlparser2/css-select/css-tree/domutils). Surface mode by surface not product:
Persuade (marketing) / Operate (dashboards) / Read (long-form) / Experience (immersive).

## Accessibility floor
The non-negotiable minimum every build ships with.
(Design side: pre-gen spec in `uiux-one-shot-polish`. Verification side filled 2026-08-28
from Q23 — verified gate.)
- Design floor: WCAG 2.2 AA contrast (4.5:1 text / 3:1 large + non-text UI), focus-visible
  everywhere, touch targets ≥24px square-inside (≥44px field use), semantic HTML (Q16
  concrete rules: one h1 + no skipped levels, landmarks once + aria-current, native
  <dialog>, skip link, clip-path sr-only — see Q16 section), no
  color-only signaling (WCAG 1.4.1 Level A — Q17 concrete rules: icon+text errors, marker
  text, visible focus ring, pattern/label chart series, underlined links; Okabe-Ito
  categorical palettes), prefers-reduced-motion honored.
- Mechanical floor: axe CLI gate with the wcag22aa tag (target-size 2.5.8 is disabled by
  default — without the tag a "WCAG 2.2" gate never tests it); Playwright tier for
  interactive states; Lighthouse median-of-3 for perf.
- Honesty floor: automation catches ~30–40% of WCAG. Ship = gate passes + manual keyboard/
  focus/screen-reader/reading-order pass. Gate is a floor, never certification.
- WCAG 2.2 AA scope (Q15): the gate asserts the SIX new 2.2 SCs — 2.4.11 Focus Not Obscured, 2.5.7 Dragging (Q27), 2.5.8 Target Size (axe wcag22aa tag + Mobile 24/44px), 3.2.6 Consistent Help, 3.3.7 Redundant Entry, 3.3.8 Accessible Auth (Q31) — on top of the 2.1 set. A "WCAG 2.2 AA" claim naming only 2.5.8 is PARTIAL.

- [ ] Dirty-state guard (editable records/forms): autosave/local-draft PRIMARY (converges Q30); beforeunload best-effort FALLBACK only (unreliable on iPhone field PWA, needs sticky activation); attach beforeunload ONLY while dirty + remove on save; in-app nav uses Navigation API `navigate` intercept; guard dialog role=alertdialog + aria-labelledby + aria-describedby, verb-labeled Save/Discard/Stay; no guard on autosaving/trivial/read-only surfaces (Q56).

### Q58 — Selection controls UX · 2026-08-28
- **Checkbox vs radio vs switch decided by WHEN-it-takes-effect, not "settings only".** Single checkbox = applies on Submit; switch = applies IMMEDIATELY (NN/g table is explicit; the immediacy column is the real discriminator). Never put a toggle inside a Submit-gated form (NN/g: separate instant from command controls); APG permits switch/checkbox/toggle-button interchange by semantics.
- **Switch label must NOT change with state** (APG: "Wi-Fi" stays "Wi-Fi") — pick ONE: stable label + `aria-checked`, OR flipping label + no `aria-checked`. Never both.
- **Never put `aria-checked` on a native `<input>`** — use the `checked` attribute (APG verbatim).
- **Indeterminate (3rd state) is checkbox/toggle-button only**; `aria-checked="mixed"` on role=switch/radio is INVALID. `indeterminate` is an IDL property (`::indeterminate` CSS), never a submitted value.
- **Group** with `<fieldset>`+`<legend>` or `role="group"`+`aria-labelledby`; extra text via `aria-describedby`.
- **Keyboard**: switch toggles on Space; Enter optional (don't rely on it, APG).
- **Server gotcha (silent data bug)**: an unchecked checkbox submits NEITHER name NOR value → handlers (DM cockpit Hono / OF web) must treat absence as false (`?? previousValue` or paired hidden input); "leave unchecked to disable" silently re-enables otherwise.
- **Don't ship native `switch` attribute** (`<input type=checkbox switch>`) — experimental, silently degrades to plain checkbox on unsupported browsers.
- Toggles reserved for instant-effect prefs; Submit/Apply-gated filters (Q40) use checkbox/radio.
Source: MDN `<input type=checkbox>` + W3C APG Switch + NN/g Toggle-Switch Guidelines — ledger Q58 B-row, 8/10 verified, 1 conflict resolved (switch=settings-only → two-gate: NN/g behavioural + APG semantic) + 3 net-new. Direct users: DM cockpit bulk-select + OF budget/txn filters + Ghostway POI multi-select (all Submit/Apply-gated → checkbox/radio; switches for instant prefs only).

- [ ] Selection controls: control chosen by WHEN-it-takes-effect (switch=immediate, checkbox/radio=on Submit; no toggle in a Submit-gated form); switch label stable (no flip) + `aria-checked`; native input uses `checked` not `aria-checked`; indeterminate checkbox-only (never aria-checked=mixed on switch/radio); grouped via fieldset/legend or role=group; Space toggles switch; server treats absent checkbox as false (`?? prev`/hidden input); no native `switch` attribute.

**One-shot build checklist line:** if the build has a functional activity log / changelog, use a chronological event stream (Actor+Verb+Object, `Intl.RelativeTimeFormat` <24h→absolute, type-colored not user-colored, IO unread + Mark-all-read, additive filters, virtualize >100, deep links, empty/loading states); bounded logs = `role=list`/`region`+headings (reserve W3C `role=feed` for streaming feeds).

## Q72 cookie-consent / privacy-compliance banner UX (2026-08-29)
Source: EDPB Guidelines 03/2022 + CNIL + GDPR Art 4(11)/7 + ePrivacy Art 5(3) + EAA/EN 301 549 + 5 independent 2nd-sources — ledger Q72 B-row, 6/6 verified. Direct users: DM Astro marketing site (GDPR/ePrivacy, highest relevance), Ghostway PWA, OF web, DM cockpit.

Verified rules:
- **Button parity** — Reject-all on the FIRST layer, identical size/shape/font-weight/contrast, 1-click ≡ Accept 1-click. Unequal prominence (big coloured Accept vs small grey Reject link) is an illegal dark pattern (EDPB 03/2022; CNIL + EDPB Taskforce Jan 2023).
- **No pre-selection / no implied consent** — non-essential categories NOT pre-ticked (CJEU Planet49 C-673/17); 'continued browsing = consent' invalid (GDPR Art 4(11) clear affirmative action).
- **Block before load** — ePrivacy Art 5(3): prior consent before ANY non-essential storage/access; trackers firing on page load = violation (CNIL SHEIN: 30+ cookies before banner appeared).
- **WCAG 2.2 AA a11y** — EAA enforceable 28 Jun 2025; EN 301 549 cites WCAG 2.1 AA (2.2 recommended): role=dialog + focus move/return (Q61), 2.4.11 Focus-Not-Obscured (sticky :fixed banner must not cover focused el), 1.4.3/1.4.11 contrast + 2.5.8 target size (Q8/Q15/Q17), real <button> (Q52).
- **No colour-only cues** (Q17); **plain microcopy** — parallel Accept All / Reject All / Manage Preferences, no guilt-label / confirm-shaming.
- Fines evidence: CNIL €325M Google + €150M SHEIN, both 3 Sep 2025.
- Boundary: GDPR/ePrivacy = EU law (Art 3 territorial); US = FTC + state privacy, not €-fines — but parity + block-before-load stay good UX universally. No project retrofit (DM Astro build-time; applies at build).

**One-shot build checklist line:** if the build sets any non-essential cookies/trackers (DM Astro marketing site, Ghostway PWA, OF web, DM cockpit), ship a consent banner with Reject-all on the first layer at IDENTICAL size/weight/contrast/1-click as Accept-all (no pre-ticked boxes, no 'continued browsing = consent'); block non-essential scripts until consent (ePrivacy Art 5(3)); a11y = role=dialog + focus move/return (Q61), 2.4.11 Focus-Not-Obscured for the sticky banner, 1.4.3/1.4.11 contrast + 2.5.8 target size, real <button> (Q52), no colour-only cues; plain parallel labels Accept All / Reject All / Manage Preferences, no confirm-shaming.

- **Q87 route-guidance (Ghostway TBT, 2026-08-29):** every guidance element readable in ONE ≤2s glance (NHTSA 2s/12s per-task); long tasks behind parked state; maneuver banner = current-step icon+distance+cue + optional lane (MAX 200dp) + ETA card, ≥1 maneuver + ≥1 action + end-nav button when TBT; day/night auto-theme (prefers-color-scheme + override, never light-only; Q46/Q3); voice short/few/maneuver-bound w/ distance parity (NOT free — AAA/Strayer ~27s); staged early→prepare→act (no 1500m transplant); maneuver truthfulness — off-route stated, stale GPS shown stale (Q11/Q84).

### Q81 — 404 / route-not-found page + PWA offline fallback page · 2026-08-29
Source: web.dev offline-fallback PRIMARY + NN/g Error-Message Guidelines + NN/g Improving the Dreaded 404 + 4× GH-Pages-404-status — ledger Q81 B-row, 8/8 verified. Direct users: Ghostway PWA ("Route not found in solo mode" dead-end + offline.html), DM Astro site 404, DM cockpit Hono+SQLite bad-record URLs, Open Finance web tier.

Verified rules:
- **Status-code honesty** — never serve a soft-404 (HTTP 200 with a 'not found' body): it wastes crawl budget + confuses indexing, and an SPA catch-all can't emit a real 404 status. Ship BOTH a real static `404.html` AND an in-app not-found VIEW. Ghostway specifically needs the view in BOTH routers (main + solo) — the lived "Route not found in solo mode" bug is a solo-router parity gap. GH Pages serves `404.html` at HTTP 404 on deep paths (×4 corroboration), so the SPA redirect hack returns a true 404, NOT a soft-200 → the in-app view is still required for true semantics.
- **404 copy (NN/g)** — the 404 page is the canonical plain-language violator: slightly-apologetic plain statement of what happened, specific (no blame words like 'invalid'/'illegal'/'not allowed'), a constructive next step; a short '404: Resource not found' is an acceptable plain message (convergent). Obscure diagnostic codes kept out of user-facing copy.
- **Five-element 404 anatomy (NN/g)** — slightly-apologetic plain statement + common-mistake list + close-match hyperlinks + a search field (converges Q36); layout stays SIMPLE (Q18 anti-slop: no hero illustration / gradient / emoji).
- **Offline fallback page (web.dev PRIMARY verbatim)** — precache a self-contained `offline.html` (inline CSS/JS, no external requests) via `cache.add(new Request(OFFLINE_URL,{cache:'reload'}))`; `skipWaiting()` + `registration.navigationPreload.enable()` on activate; the fetch handler intercepts ONLY `event.request.mode==='navigate'`. The page ships a manual Reload button + auto-reload on `'online'` + a server-reachability poll ('online' proves only a network link, NOT reachability → poll the server). `scratch/sw_offline_test.js` node --check PASSED.
- **Copy length = defaults, not constants** — keep 404/offline copy short (NN/g plain-language + W3C pragmatic); no primary for exact char counts.

**One-shot build checklist line:** if the build is a SPA/PWA or has dead-end URLs (Ghostway PWA offline.html + solo-router not-found, DM Astro 404, DM cockpit bad-record URLs, OF web), ship a real static `404.html` (HTTP 404, not soft-200) AND an in-app not-found view in EVERY router (solo-router parity for Ghostway); 404 copy = plain + specific + no blame words + search field, layout simple (Q18); precache a self-contained offline.html (inline CSS/JS) with manual Reload + 'online' auto-reload + server-reachability poll; SW intercepts only navigate requests; no hero/gradient on error pages.

### Q82 — UI microcopy & content-design system · 2026-08-29
Source: NN/g UX-writing FAQ + How-little-do-users-read (20–28%) + Tone/voice + federal HeadStart/SSA/plainlanguage.gov + M3/Apple live writing pages — ledger Q82 B-row, 8/8 verified. Direct users: DM Astro site UI chrome, DM cockpit Hono+SQLite (labels/toasts/confirm copy), Ghostway PWA field strings, Open Finance labels. (Q6/landing-page-copy = MARKETING copy only; Q11 = error/empty STATE mechanics; Q38 = confirm-button verb rule; Q52 = button semantics — no skill covered the product-wide copy system.)

Verified rules:
- **Reading-level floor = 6th–8th grade** (Flesch-Kincaid / Hemingway) · federal HeadStart/SSA/plainlanguage.gov corroborate NN/g · experts NOT exempt (even C-suite scan, busy, distracted) · concise writing RAISES the share-read, it does not reduce it.
- **Voice = constant, tone = contextual** · document brand voice as 3–5 attributes in one `VOICE.md` per project · tone shifts per surface (error = empathetic, onboarding = encouraging, policy = neutral) in per-component tone rows.
- **Label CASE = a PLATFORM rule, not taste** · Material 3 = sentence case for all UI text incl. buttons; Apple HIG = title case for buttons/menus/nav, sentence case for longer body · neither is 'correct' → CODIFY ONE per product, never mix · web PWA → sentence case (matches browser chrome) · ALL-CAPS only for chips/legal micro-labels + Q21 letter-spacing · converges Q18 eyebrow default-ban.
- **Banned labels (NN/g)** · 'Learn more' as a link = NEVER (no information scent) · no 'click here' / directional cues ('the button on the right') — break SR + touch · branded/invented terms = JARGON (replace with plain) · acronyms spelled out except universal (PDF/URL/FAQ) · headings LITERAL not clever ('Our approach' → the actual claim).
- **Error-copy writing layer** (converges Q11 state layer — this is the WORDS) · what happened + why + how to fix, in the USER's vocabulary, never the system's ('That card was declined' not 'Transaction error 4021') · never blame ('you entered an invalid email' → 'That email needs an @') · no 'Oops' · raw error codes go in a SECONDARY copyable detail line for support, never the primary sentence.
- **Per-component length budgets = LINT DEFAULTS, not research constants** · error 8–14 words / button 1–3 words / tooltip 1–2 sentences (Q43) / empty-state headline 3–7 words + body 1–2 sentences (Q11) / confirm title 3–5 words + body 1–2 sentences (Q38) · lint against them, don't quote as laws.
- **i18n-safe strings** (converges Q75) · no idioms/metaphors/humor/cultural refs · one string = one complete message · NEVER concatenate sentence fragments in code (breaks word order) · CORRECTION: 30–40% translation expansion is length-DEPENDENT (W3C/IBM: ≤10-char strings 200–300%, only >70-char text settles ≈30%) → build UI labels for ~2× English length (simplelocalize), NOT a flat 30–40%.
- **Placeholder-as-label ban** (converges Q13) · real visible `<label>` always · placeholder = FORMAT EXAMPLE only · must-know constraints live in HELPER TEXT before the mistake, not an error after it.

**One-shot build checklist line:** if the build has any user-facing copy (every Keaton surface — DM Astro/DM cockpit/Ghostway/OF), ship a one-project `VOICE.md` (3–5 voice attributes + per-surface tone rows); write to a 6th–8th-grade floor (Flesch-Kincaid check, experts included); codify ONE label case (sentence case for web PWA) + ALL-CAPS only for chips/legal; ban 'Learn more'/click-here/branded jargon/clever headings; error copy = what+why+fix, no blame, no 'Oops', code in secondary line; length budgets as lint defaults; i18n-safe (no fragment concat, ~2× label length for translation).

**Rejected (Q82):** '124–159% usability lift from concise copy' (1997 single-site pre-mobile, directional only — don't quote); '≤14 words = 90% comprehension' (no primary, laundered); 'plain language +25% comprehension' (unverified); '30–40% translation expansion flat' (length-dependent: ≤10ch 200–300%, >70ch ≈30% → build 2× for UI labels); emoji/exclamation-mark tone RULES (brand-dependent, not research).

### Q83 — Bulk / batch actions on record lists & tables · 2026-08-29
Source: NN/g "Bulk Actions: 3 Design Guidelines" + W3C APG Grid pattern + M3 Contextual Top App Bar — ledger Q83 B-row, 10/10 verified. Direct users: DM cockpit Hono+SQLite record tables (bulk status/delete/export), Open Finance transaction lists (bulk categorize), Ghostway saved POI/route lists. (Q58 = selection CONTROL primitive only, Q29 = table internals, Q38 = single destructive confirm/undo — no skill covered the bulk-OPERATION flow.)

Verified rules:
- **Selection + action are one system** — a sticky contextual action bar appears only when count>0; row highlight (not hover) marks selection; <~10 rows → skip bulk UI.
- **Select-All scope banner** (Gmail "All N on this page — Select all M matching") separates this-page from all-matching.
- **Persist selection by row ID** + warn if rows vanished (Q29 identity).
- **Pre-declare eligible actions**, disable+reason the rest (Q52/Q43); no submit-time failure.
- **Pre-flight confirm** names action+scope+count in one sentence (Q38 verb-label + type-to-confirm when destructive).
- **Batch progress = counted, not a spinner** (Q14); cancelable.
- **Partial-failure is the DEFAULT case** — per-row report + skip/retry; one bad row never rejects the batch.
- **Undo only if truthful-at-scale** (Q38): capture pre-state for the whole batch; else confirm-then-dry-run, not fake undo.
- **A11y floor (W3C APG Grid)**: `aria-selected` + `aria-multiselectable` (NOT native-checkbox-driven — double SR announce); roving-tabindex 2D arrows + Shift+Arrow/Ctrl+Space = keyboard range; header `aria-checked="mixed"` partial; row `aria-labelledby` ("Select row: X"); off-screen `aria-live` count announced WITHOUT moving focus; Escape-clears = convention not APG.

**One-shot build checklist line:** if a build has multi-select record lists (DM cockpit/OF/Ghostway), ship a contextual action bar that appears only at count>0; Select-All with this-page-vs-all-matching banner; persist by row ID; pre-declare eligible actions (disable+reason the rest); pre-flight confirm names action+scope+count; counted (not spinner) progress; design partial-failure as the default (per-row report + skip/retry); undo only if you captured the whole-batch pre-state; a11y via `aria-selected`+`aria-multiselectable` grid with `aria-checked="mixed"` header + off-screen `aria-live` count (never move focus to confirm).

**Rejected (Q83):** bulk-UI-on-small-lists (<~10 rows); native-checkbox-driven `aria-selected` grids (double JAWS/NVDA announce); spinner-for-batch-progress; fake-undo-without-pre-state-capture; Escape-clears-selection-as-APG-rule (convention only).

### Q84 — Live / auto-refreshing data UX · 2026-08-29
Source: WCAG 4.1.3 Understanding + MDN aria-live PRIMARY + NN/g system-status/response-time — ledger Q84 B-row, 10/10 verified. Direct users: DM cockpit Hono+SQLite dashboards (auto-refreshing panels), Open Finance budget/transaction views, Ghostway sync-status. (Q11 = static loading/empty/error states only, Q14 = perceived perf, Q49 = manual pull-to-refresh gesture, Q30 = offline cache strategy — no skill covered auto-refreshing/live data presentation.)

Verified rules:
- **Never replace on-screen data with a spinner on refresh** — branch `status` vs `fetchStatus`; default stale-while-revalidate. Converges Q11.
- **Freshness = 6-state machine** (current / stale / disconnected / partial / error / missing), each with its own copy + recovery action.
- **Explicit "Last updated HH:MM" + a manual Refresh control** that returns focus to the button.
- **Announce user-triggered refresh + state TRANSITIONS only, never every poll** — `aria-live=off` is CORRECT for tickers (MDN: SR users still hear updates if they navigate there); `role=status` implies `polite`+`atomic=true`.
- **tbody row-insertion** = `aria-live=polite aria-atomic=false` (reads only the new row).
- **No content jump on refresh** — reserve layout, fix chart axes, carry previous data (converges Q37/Q40); set `aria-busy` during replace.
- **Stale-write race guard** via `AbortController` + ownership check.
- Skeletons hidden from AT while reserving layout (Q11).

**One-shot build checklist line:** if the build shows live/auto-refreshing data (DM cockpit dashboards, OF budget/txn views, Ghostway sync-status), never swap data for a spinner on refresh (stale-while-revalidate + subtle indicator); model a 6-state freshness machine, each with copy+recovery; show "Last updated HH:MM" + manual Refresh that keeps focus; announce only user-triggered refresh + state transitions (aria-live=off correct for tickers); tbody inserts = aria-live=polite aria-atomic=false; no layout jump (fix chart axes, carry prev data, aria-busy); guard stale writes with AbortController + ownership check.

**Rejected (Q84):** hard-coded polling-interval / 1000–1200ms live-region throttle as a "rule" (convention only, no primary specifies one); spinner-in-place-of-data on refresh; announce-every-poll; focus-jump-into-refreshed-region.

### Q85 — Map marker / label / cluster design for MapLibre PWAs · 2026-08-29
Source: MapLibre spec primaries + mechanical contrast/tap-target test (scratch/q85) — ledger Q85 B-row, 9/9 verified. Direct users: Ghostway MapLibre PWA (POI markers, route labels, iPhone outdoor field use). (Q27 = map controls/gestures/attribution/popup legibility only; Q5 = icon-set consistency; Q8 = 24/44px targets; Q24 = contrast; Q17 = non-color-only; Q34 = glyph/font stack — no skill covered the marker/label/cluster RENDERING layer.)

Verified rules:
- **Collision is the default, not allow-overlap** — keep `icon-allow-overlap:false` + `text-optional:true` so the ICON survives when only the label collides; break ties with `symbol-sort-key` + `symbol-z-order:source` keyed to DATA priority (not id order).
- **Label legibility is mechanically proven** — dark-text-on-white-halo = 16.10:1, white-text-on-dark-basemap = 11.26:1 (both >4.5:1); dark-on-dark = 1.43:1 FAILS even WITH a halo → the halo is NOT a contrast substitute (Q24 holds; measure on device).
- **Marker tap target must clear 2.5.8/2.5.5** — a 24px sprite at `icon-size 0.3` renders 7.2px and FAILS; use a padded bbox or an invisible 44px circle hit-layer.
- **Clustering is scale-adaptive, not always-on** — clustered zoomed-out, individual zoomed-in; tiny-radius (2–8) clusters are perf-only; same-coordinate points → list-on-click default (product decision).
- **Ship a parallel accessible list** (name + distance + action) as the 2.5.1/2.5.7 alternative to the map (Q27/Q37/Q67); do not rely on markers alone for reachability.
- **Zoom symbol tiers** — one interpolated layer is the cheaper default; a 3-layer scheme only if collision demands (perf cost). [needs-evidence on street-scale tier distances left open.]
- **Halo perf** — no gl-js symbol-layer-halo primary found; keep "budget halos + zoom-gate labels ≥z13–14 + measure on device" as prudent engineering, not a hard law.

**One-shot build checklist line:** if the build renders map markers/labels (Ghostway MapLibre PWA iPhone field use), keep `icon-allow-overlap:false` + `text-optional:true` and break ties with `symbol-sort-key` on data priority; prove label contrast (dark-on-white-halo etc. >4.5:1 — halo is not a substitute, Q24); give every marker a ≥24px (44px-preferred) hit area via padded bbox / invisible circle layer; cluster scale-adaptively (zoom-out clustered, zoom-in individual, same-coordinate → list-on-click); ship a parallel accessible name+distance+action list as the 2.5.1/2.5.7 alternative; single interpolated symbol layer unless collision demands tiers; budget halos + zoom-gate labels ≥z13–14 + measure on device.

**Rejected (Q85):** "always cluster" / "bigger bubble = better" markers (vendor advocacy, no research support); "gl-js iOS massive halo slowdown" as a hard law (no gl-js primary — prudent budgeting only); relying on markers alone for reachability (needs the parallel accessible list, Q27); treating the halo as a contrast fix (dark-on-dark still fails, Q24).

### Q86 — Long-running / background job UX · 2026-08-29
Source: NN/g 'Designing for Long Waits' + 'Response Time Limits' + MDN/APG progressbar a11y PRIMARY — ledger Q86 B-row, 9/9 verified. Direct users: DM cockpit Hono+SQLite CSV/PDF export, Open Finance budget/tithing report generation, Ghostway offline-tile download. (Q11 = static loading/empty/error states, Q14 = perceived perf, Q59 = upload progress, Q44 = notifications, Q83 = bulk actions — none covered the JOB lifecycle.)

Verified rules:
- **State model = core four + extension states** — queued/running/completed/failed as CORE, plus cancelled/paused/retry/scheduled; 'exactly four' is FALSE (GitHub Actions = 9, AWS Batch = 7).
- **Waits >10s need % done OR time-remaining** (NN/g verbatim); if no accurate estimate, list completed+remaining steps + current step with a highly-salient indicator.
- **Cancel vs Close** — cancel = request-abort at a safe checkpoint (not guaranteed instant stop for atomic server ops); converges Q38.
- **Decouple from the component lifecycle** + keep a job list/history the user can return to.
- **Completion → its own notification channel** (converges Q44; iOS installed-PWA push install-gated).
- **Progressbar a11y floor** (MDN/APG): name REQUIRED; aria-valuenow required determinate / OMIT indeterminate; prefer native `<progress>`; aria-valuetext human string; aria-busy on region; reduced-motion spinner.
- Skeleton → Progress → Toast pairing.

**One-shot build checklist line:** if the build has long-running/background jobs (DM cockpit CSV/PDF export, OF report generation, Ghostway offline-tile download), model a core-four + extension state machine (not 'exactly four'); show % done OR time-remaining for waits >10s (else completed+remaining+current steps); Cancel = request-abort at safe checkpoint (not instant stop); decouple job from component lifecycle + keep a job list/history; completion → own notification (converges Q44); progressbar a11y floor (name required; omit aria-valuenow when indeterminate; prefer native <progress>; aria-busy on region; reduced-motion spinner); Skeleton→Progress→Toast handoff.

**Rejected (Q86):** 'exactly four job states' (GitHub Actions 9 / AWS Batch 7 counterexamples); AI-progress listicles with invented stat numbers (keep Nielsen 3 limits + NN/g 10s); treating 10s as a hardware threshold rather than a human-attention one (Nielsen 1993).

### Q87 — Turn-by-turn route-guidance UI for a nav PWA · 2026-08-29
Source: NHTSA Visual-Manual Distraction Guidelines (rosap.ntl.bts.gov) + SAE J2364 + Android Auto Navigation template (developer.android.com/developers.google.com) PRIMARY + Apple CarPlay day/night requirement + AAA/Strayer phase III 2015 — ledger Q87 B-row, 7/7 verified. Direct users: Ghostway MapLibre nav PWA (iPhone in-vehicle field use) ONLY; explicit PWA-vs-entitlement boundary (Ghostway borrows PRINCIPLES, cannot call CarPlay/Android-Auto APIs). (Q27 = map controls/gestures; Q85 = marker/label/cluster; Q11 = error states; Q84 = freshness; Q33 = geolocation; Q46 = theme — none covered active TBT guidance.)

Verified rules:
- **Glance budget is the governing constraint** — NHTSA = individual glance ≤2.0s + cumulative eyes-off-road ≤12.0s PER TASK (≥21/24 participants); everything on the guidance screen must be readable in ONE ≤2s glance; long tasks (destination entry, settings, list browsing) belong behind a parked/stationary state. SAE J2364 15s static-nav is the lineage. BOUNDARY: NHTSA has NO voice guideline → 2s/12s does NOT license voice.
- **Maneuver banner = the single primary element** (Android Auto Nav-template PRIMARY anatomy): routing card = current step (maneuver icon + distance-to-maneuver + cue text, may embed route-marker image spans) + optional lane guidance (MAX 200dp) + optional next step; a separate travel-estimate card = ETA + time-to-destination + remaining distance; MUST carry ≥1 maneuver + ≥1 action button; an end-navigation button is required when giving turn-by-turn.
- **Day/night auto-theme is a SAFETY requirement, not a theme preference** — CarPlay mandates day AND night map styles; Ghostway PWA equivalent = auto-switch on prefers-color-scheme AND a manual override, never a light-only map at night (converges Q46/Q3).
- **Voice is the distraction-mitigation channel but NOT free** — AAA/Strayer phase III 2015: residual cognitive impairment persists ~27s after a demanding voice task → keep prompts short, few, maneuver-bound, with distance parity to the on-screen banner (one truth, two channels).
- **Staged prompt-distance thresholds** (IEEE Access 2025 AR-HUD 1500m + gradient) are HIGHWAY/AR-HUD-scale ONLY — do NOT transplant 1500m onto phone street guidance; keep 'staged early-advisory→prepare→act' as a principle.
- **Maneuver TRUTHFULNESS is the cardinal rule** — displayed distances/lane counts/reroute events must match the road; render only truth; off-route/reroute MUST be stated explicitly, not silently swapped (converges Q11 error anatomy + Q84 freshness — a stale GPS fix must present as stale, not confident guidance).

**One-shot build checklist line:** if building turn-by-turn guidance (Ghostway nav PWA), every guidance-screen element must be readable in ONE ≤2s glance (NHTSA 2s/12s per-task); long tasks (destination entry/settings/list) behind a parked/stationary state; maneuver banner = current-step icon+distance+cue + optional lane guidance (MAX 200dp) + optional next step, plus a separate ETA/travel-estimate card, with ≥1 maneuver + ≥1 action button + end-navigation button when TBT; day/night auto-theme (prefers-color-scheme + manual override, never light-only at night — Q46/Q3); voice prompts short/few/maneuver-bound with distance parity to banner (NOT free — AAA/Strayer ~27s residual); staged early-advisory→prepare→act prompts (no 1500m transplant to street scale); maneuver truthfulness — off-route/reroute stated explicitly, stale GPS shown as stale (Q11/Q84).

**Rejected (Q87):** 'voice is free' (AAA/Strayer phase III 2015 residual-impairment evidence contradicts; voice is not a licence for verbose prompts); 'auto-advancing guidance banner = WCAG 2.2.2 Pause/Stop/Hide violation' (2.2.2 binds decorative auto-advancing content only, NOT task-essential guidance); transplanting highway/AR-HUD 1500m prompt distances onto phone street guidance (IEEE Access 2025 = AR-HUD-scale only); treating Ghostway's web PWA as able to call CarPlay/Android-Auto navigation APIs (PWA borrows PRINCIPLES, not entitlements).

**Q87 addendum · 2026-09-05** (RP vs TBT, pedestrian-specific guidance, landmarks, camera, mode choice — PLOS ONE 2026 Savino et al. + Google Cars Navigation Template + Mapbox Navigation SDK + VP0 + Uber Design + Apple Maps Glanceable Directions + MD3 — 10/10 verified on independent primaries):
- **RP = valid pedestrian default** — 44% prefer RP over TBT (PLOS ONE 2026 Savino et al. n=222); 76% prefer RP in familiar environments; no significant difference in navigation errors, phone glances, or spatial learning between RP and TBT (Study 2 n=195). RULE: for pedestrian nav, RP is NOT a degraded mode — offer TBT as opt-in.
- **Maneuver panel = primary/secondary/sub 3-tier** — Google Cars Navigation Template + Mapbox Navigation SDK document this structure. BOUNDARY: SDK convention, NOT empirically validated optimum.
- **Guidance screen = 3-zone max** — map canvas (focal) + maneuver panel (top/bottom banner) + progress strip (ETA + remaining distance). Never stack more than 3 layers.
- **Glanceability = ≤3 data points** — one arrow glyph + one distance figure + one street name readable in a single glance (VP0 + Uber Design).
- **Pedestrian ≠ driver guidance density** — pedestrians need less frequent prompts, tolerate richer visuals, benefit from exploration. Don't port driver-grade audio cues to pedestrian context.
- **Landmarks = high-priority pedestrian feature** — Savino Study 3 co-design (n=5): landmarks, intention-based routing, subtle orientation aids = top-3 priority.
- **Camera = heading-up follow + smooth** — map rotates to follow user heading; position ~60% from top to show more road ahead.
- **Alerts = non-blocking + auto-dismiss** — max 2 buttons per alert; dismiss on tap/timeout.
- **Mode choice = present RP + TBT at route start** — forced TBT frustrates experienced pedestrians.
- **Co-design confirmation** — Savino Study 3 confirms pedestrians want visible landmarks, street names, orientation aids, intention-based routing — not just "turn left in 200m".
- **One-shot build checklist line:** if building turn-by-turn guidance (Ghostway MapLibre PWA), RP = valid pedestrian default (offer TBT as opt-in); maneuver panel = primary/secondary/sub 3-tier; guidance screen = map + maneuver panel + progress strip (3-zone max); glanceability = ≤3 data points; pedestrian ≠ driver density (fewer prompts, more map-centric); landmarks = high-priority; camera = heading-up follow + smooth; alerts = non-blocking auto-dismiss; mode choice = present RP + TBT at route start.
- **Rejected (Q87):** (1) 'RP = degraded mode for pedestrians' → FALSE (44% prefer RP, no performance difference, PLOS ONE 2026); (2) '3-tier maneuver hierarchy = empirically validated optimum' → FALSE (SDK convention); (3) 'landmarks = nice-to-have' → FALSE (top-3 priority from Savino Study 3 co-design); (4) 'heading-up vs north-up preference validated for pedestrians' → FALSE (no primary study isolates this).

### Q89 — Autofill & identity-field input UX · 2026-08-29
Source: W3C Understanding 1.3.5 + Failure F107 + WHATWG #autofill + MDN autocomplete ref + web.dev Learn Forms — ledger Q89 B-row, 8/8 verified. Direct users: DM cockpit customer/lead forms, OF account/profile, DM Astro contact/lead, Ghostway address entry. (Q13 = generic form field UX only, Q31 = password/auth, Q74 = money input — none covered the 1.3.5 Input Purposes mandate or autocomplete-token semantics.)

Verified rules:
- **WCAG 2.2 1.3.5 Input Purposes = Level AA MANDATE** on fields collecting info ABOUT THE USER from the fixed 51-token Input Purposes list; F107 fail = missing/invalid token. Only purpose-list fields (combined user+email where tech can't take 2 purposes may omit).
- **Token-order grammar:** section-* (first) → shipping/billing → recipient type (home/work/mobile/fax/pager) → detail → webauthn.
- **Single name field preferred** (name-diversity is safe); split only when sorting is needed.
- **`new-password` / `current-password` / `one-time-code` are real tokens;** `autocomplete=off` is IGNORED by password managers on login (MDN) — never rely on it to block filling, and `off` is only legitimately valid for `one-time-code` + honeypot.
- **Structural preconditions for heuristic fill:** name/id + inside a `<form>` + a submit button.
- **One `<input>` per phone/card** (native control > custom); locale address levels exist (US/UK/CN/JP).
- **Always pair a VISIBLE label** (ACT rule 73f2c2 catches missing/invalid but NOT valid-but-wrong → manual remainder).

**One-shot build checklist line:** if the build has identity/contact fields (DM cockpit customer/lead, OF account, DM Astro contact, Ghostway address), add WCAG 2.2 1.3.5 Input Purposes tokens to user-info fields (name/email/tel/street-address/postal-code/country/one-time-code from the 51-token list; F107 fail = missing/invalid); token order section-* → shipping/billing → recipient → detail → webauthn; prefer a single name field; `autocomplete=off` is ignored by PW managers on login (legit off only for one-time-code + honeypot); keep a visible label.

**Rejected (Q89):** `bday-*` is Safari-only (FALSE — standard WHATWG cross-browser token, W3C birthday-cake icon is low-authority); '53 autocomplete tokens' (WCAG Input Purposes = 51; ~53–55 full HTML vocab, exact count immaterial); 'autofill lifts conversions X%' (unsourced claim, principle not number); relying on `autocomplete=off` to block password managers (ignored on login).

## Rejected / counterexamples
Popular advice that failed verification — kept so the fleet never re-adopts it.
- **Absolutist 'never use hamburger menus'** — rejected 2026-08-30 (Q153): conflicts verified Q39 (hamburger = necessary evil on small screens + damage-control checklist); keep Q39's calibrated version.
- **Hard-pixel thumb-zone map (Secondary/down/green = exact px zones)** — rejected 2026-08-30 (Q153): Hoober 49/36/15 grip split is 2013 pre-large-phone data → directional guidance only, flag currency; not a pixel-precise spec.
- **'16px font prevents iOS zoom-on-focus' as a thumb-zone rule** — rejected 2026-08-30 (Q153): misattribution, belongs to Q8 touch-target / Q79 1.4.4 resize-text.
- **'all users are one-handed'** — rejected 2026-08-30 (Q153): 49% one-handed is a plurality not a majority; two-hand use grows with large phones.
- **Q97 "content consistency is NN/g's #1 stated failure"** — corrected 2026-08-29: NN/g says "among the most important qualities"; top-tier, not literal #1 (the no-blank-cells rule itself stands).
- **Q97 "show every spec so buyers can compare thoroughly"** — rejected: unbounded attribute rows + >5 tiers wreck the compensatory decision; cut to decision-relevant attributes, cap columns.
- **Q97 "filters and a comparison table are interchangeable"** — rejected: filters = noncompensatory (one nonnegotiable factor, Q40); comparison tables = compensatory trade-offs.
- **90ch line length** — rejected 2026-08-27 (Q1): independent sources converge on 50–75ch;
  WCAG 1.4.8 caps at 80.
- **Soft-404 acceptable** — rejected 2026-08-29 (Q81): a 200 with a 'not found' body wastes crawl budget + confuses indexing; an SPA catch-all can't set a real 404 status → ship a static `404.html` (true HTTP 404) + an in-app not-found view.
- **404 pages need humor / branding** — rejected 2026-08-29 (Q81): NN/g names the 404 page the canonical plain-language violator; keep it plain, specific, no blame words, layout simple (Q18).
- **GH-Pages SPA redirect returns soft-200** — rejected 2026-08-29 (Q81): ×4 sources confirm it returns a true HTTP 404 on deep paths; the in-app not-found view is still required for real semantics.
- **Automated a11y tools catch most issues** — rejected 2026-08-29 (Q93): axe/Lighthouse catch only ~30–40% (Deque ~30% of criteria; GDS best 40%/WAVE 30%/axe 29%) → a manual screen-reader pass is mandatory before ship; fabricated '21.3%/24.7% of issues caught' + 'audit under 3 min' AI-content-farm stats are not real.
- **macOS VoiceOver validates the Ghostway iPhone PWA** — rejected 2026-08-29 (Q93): macOS VO and iOS VO are different engines/behaviour; test on a real iPhone.
- **'Test JAWS, it's the #1 reader'** — rejected 2026-08-29 (Q93): US-centric; WebAIM #10 shows regional inversion (NVDA 69.9% Africa/ME, 70.8% Asia); free NVDA+VO covers the global floor.
- **Hard-coded polling-interval / 1000–1200ms live-region throttle as a rule** — rejected 2026-08-29 (Q84): no primary specifies a polling cadence or live-region throttle number; it is a product decision / convention, not a rule; debounce is still good engineering.
- **Replace data with a spinner on refresh** — rejected 2026-08-29 (Q84): branch status vs fetchStatus, stale-while-revalidate; a spinner-in-place-of-data loses context (converges Q11) and breaks the live-region contract.
- **"Always cluster markers"** — rejected 2026-08-29 (Q85): clustering is scale-adaptive (zoomed-out clustered, zoomed-in individual), not a blanket default; vendor posts overstate it.
- **"Bigger bubble = better marker"** — rejected 2026-08-29 (Q85): unsupported; collision is resolved by symbol-sort-key priority, not bubble size.
- **"Halo makes map labels readable on any basemap"** — rejected 2026-08-29 (Q85): dark-on-dark = 1.43:1 even WITH a halo; contrast must be proven, not assumed (Q24).
- **Golden-ratio 1.618 type ramps** — rejected 2026-08-27 (Q1): hype; M3's tested scale and
  Refactoring UI's hand-tuned steps contradict it.
- **Strict 1.25 modular ratio as law** — rejected 2026-08-27 (Q1): Refactoring UI's actual
  ramp is hand-tuned 1.14–1.25; treat 1.25 as a starting point only.
- **Strict 8pt grid everywhere** — rejected 2026-08-28 (Q2): the 4/8pt ladder's half-steps
  (12/20px) are legitimate for in-component needs; 4px inside components / 8pt between is the
  rule — rigid 8pt-only spacing is cargo-cult (Tailwind's 4px base agrees).
- **Golden-ratio (1.618) spacing/dimensions** — rejected 2026-08-28 (Q2): same hype family as
  golden-ratio type ramps; no primary evidence spacing should follow φ.
- **"More whitespace always better"** — rejected 2026-08-28 (Q2): hierarchy needs the 4-vs-8
  contrast (tight groups, generous separation) — uniform max whitespace flattens grouping.
- **"Elevation requires shadow"** — rejected 2026-08-28 (Q4): borders and tonal lightness are
  equal elevation cues (Q3 dark-mode tonal, M3 surface-container); shadow is one cue, not the
  only one.
- **Bigger shadow = more premium** — rejected 2026-08-28 (Q4): elevation is hierarchy, not
  decoration; shadow level must agree with z-layer and stay on the token scale.
- **Glass/blur as depth** — rejected 2026-08-28 (Q4): same Q18 decoration-as-content family;
  blur is a material, not an elevation signal.
- **Pill-everything** — rejected 2026-08-28 (Q4): one radius FAMILY per product; pill is a
  family choice, not a default to sprinkle across components.
- **Asymmetric accept/reject weight** — rejected 2026-08-29 (Q72): EDPB 03/2022 lists unequal prominence (big coloured Accept vs small grey Reject link) as an illegal dark pattern; Reject must be 1-click + same layer/weight/contrast as Accept (CNIL €325M Google / €150M SHEIN).
- **Pre-ticked non-essential boxes / 'continued browsing = consent'** — rejected 2026-08-29 (Q72): CJEU Planet49 C-673/17 + GDPR Art 4(11) require prior clear affirmative action; implied consent is invalid.
- **Cookie wall / auto-dismiss** — rejected 2026-08-29 (Q72): blocking content behind consent or dismissing without explicit choice fails GDPR; banner must offer equal reject.
- **Reject behind a 2nd-layer 'Manage preferences'** — rejected 2026-08-29 (Q72): hiding Reject behind Manage = the #1 cited illegal pattern; Reject belongs on the first layer.
- **Composition-required passwords** (uppercase + number + symbol mandatory) — rejected 2026-08-28 (Q31): NIST 800-63B rev-4 SHALL NOT require composition; length (15 single-factor / 8 M3-only) is the lever; composition rules are the #1 cause of paste-blocking + manager-rejection.
- **Forced password rotation / KBA security questions** — rejected 2026-08-28 (Q31): NIST SHALL NOT mandate rotation or KBA; both memorization-hostile and fail 3.3.8.
- **Blocking paste/autofill on login** — rejected 2026-08-28 (Q31): verbatim FAILs WCAG 2.2 3.3.8 Accessible Authentication; also wrecks password-manager + mobile UX.
- **Per-character OTP boxes (enter 1st/3rd/5th char)** — rejected 2026-08-28 (Q31): partial-password entry verbatim FAILs 3.3.8; OTP boxes must accept a full paste.
- **Box-shadow focus rings instead of outline** — rejected 2026-08-28 (Q9): rauno's rule is
  stale — outline follows border-radius since Safari/iOS 16.4 (Mar 2023); outline-first,
  box-shadow fallback only for Safari <16.4.
- **Blanket disable-spellcheck on dashboard inputs** — rejected 2026-08-28 (Q9): overbroad
  for data-entry fields (rauno); scope it to search/command inputs only.
- **Mixing icon sets/styles/stroke widths** — rejected 2026-08-28 (Q5): canonical AI-slop
  tell; even within one named set styles sit on different grids (Heroicons 24 outline /
  20 solid). One set + one style + one stroke width product-wide.
- **Calendar picker for every date field** — rejected 2026-08-28 (Q42): native `<input type=date>` (single known date) or three separate numeric fields (document dates, GOV.UK/ONS/NHS) beat a calendar for known dates; reserve calendars for near-present/relation selection. AI custom calendars also routinely fail APG a11y.
- **"24px icons always"** — rejected 2026-08-28 (Q5): 24×24 is the GRID, not the render
  size — icon size follows the type scale (12/16/20/24px ≈ adjacent label size).
- **Icons always help** — rejected 2026-08-28 (Q5): icon-only is fine only when the label
   is redundant/established; default is icon paired with label.
- **"Just add `dir=rtl`" for RTL** — rejected 2026-08-29 (Q75): physical CSS (floats / translateX / left-right) won't mirror; RTL needs logical properties + `dir` on `<html>` from the locale.
- **"Mirror every icon in RTL"** — rejected 2026-08-29 (Q75): semantic icons (logo / clock / check / gear / camera) must keep orientation; only directional icons (back / chevron / progress) flip.
- **Global optical-tracking tokens** — rejected 2026-08-29 (Q75): Arabic letter-spacing MUST be 0 (W3C Arabic Text Layout — tightening joined glyphs is undesirable); a positive global tracking token breaks Arabic runs.
- **"Muted autoplay is a11y-safe"** — rejected 2026-08-29 (Q76): WCAG 2.2.2 requires a visible pause/stop control AND full `prefers-reduced-motion` suppression; muted does not exempt motion.
- **"Poster is enough for LCP"** — rejected 2026-08-29 (Q76): poster IS a valid Chromium LCP candidate, but a separate prioritized `<img fetchpriority=high>` gives reliable fetchpriority control.
- **"preload=metadata is the light option"** — rejected 2026-08-29 (Q76): `preload=none` is lightest for user-initiated video (metadata still fetches some bytes).
- **"Text expands ~30–40% everywhere"** — rejected 2026-08-29 (Q75): that rate is EUROPEAN (German/Finnish); Arabic expands only ~±15% — apply a +30–50% pseudo-locale test globally regardless.
- **"Users don't scroll" / "everything must be above the fold"** — rejected 2026-08-28
  (Q6): Nielsen retracted the 1997 no-scroll claim; users DO scroll when information scent
  earns it. But the inverse ("fold doesn't matter") is also a myth — ~57% of viewing time
  is still above the fold (NN/g eye-tracking). The fold is a gradient, not a wall.
- **Spring-everywhere / delight-that-delays** — cargo-cult flagged 2026-08-28 (Q12):
  spring/bounce is accent-tier (max one per surface); animation that costs perceived
  performance (Q14) is an anti-pattern, not polish. Exact-ms values are conventions, not
  laws — the duration RANGE (feedback 100–200 / enter-exit 200–300 / brand 500ms+) is the
  rule; individual ms are tunable.
- **Hardcoded colors / ignoring the OS preference** — rejected 2026-08-29 (Q46): a dark-mode build that doesn't follow `prefers-color-scheme` or breaks on the OS toggle is a one-shot failure; `color-scheme` + media query must be wired, not assumed.
- **Flash-on-load / cookies-not-localStorage for theme** — rejected 2026-08-29 (Q46): the no-flash resolver must be a synchronous inline script (deferred modules cause FOUC); localStorage is the correct store, not a cookie.
- **Animate-the-toggle-on-first-paint** — rejected 2026-08-29 (Q46): a global colour transition during load fights the synchronous resolver and produces a flash-swap; disable transition-on-load.
- **First-person CTA lift percentages as law (+90%, +266%, +371%)** — rejected 2026-08-28
  (Q6): canonical Aagaard 2014 study is real but single-test lifts vary 12–90%; "266%" is
  impossible (>100% framing), "37%" was self-scored AI data, "371%/1617%" was email not
  landing pages. Keep the principle (first-person verb + value), never quote the %.
- **Multiple competing CTAs per page** — rejected 2026-08-28 (Q6): Unbounce 2026 (44M
  conversions) — single CTA 13.5% vs 5+ CTAs 10.5%; long-form gains come from the SAME CTA
  repeated at scroll depths, not competing asks.
- **12-column grid mandatory** — rejected 2026-08-28 (Q7): grids serve the content density;
  a 12-col framework default is a tool, not a design law.
- **max-w-7xl (1280px) because it's the Tailwind default** — rejected 2026-08-28 (Q7):
  build-verified dead space at 1440–2560px; the cap protects measure + scan rhythm and is
  picked by density (1280–1520px prose/marketing), always with fluid padding-inline.
- **Visible CAPTCHA by default** — rejected 2026-08-29 (Q90): W3C captcha-accessibility Note lists honeypots as the first resort; a visible CAPTCHA taxes disabled users + fails the narrow 1.1.1 two-modality floor; reserve it for high-value public signup only (OSS ALTCHA fallback).
- **Audio CAPTCHA solves accessibility** — rejected 2026-08-29 (Q90): W3C confirms some disabled users still can't access audio CAPTCHAs AND modern bots do speech recognition; it is not an accessibility fix.
- **Turnstile / reCAPTCHA as the default bot-protection** — rejected 2026-08-29 (Q90): closed-source + false-positive on VPN/proxy (blocks legit users); violates Keaton OSS/self-host bias → prefer self-hosted ALTCHA (MIT) / Cap (Apache-2.0).
- **Labeled honeypot decoy field** — rejected 2026-08-29 (Q90): a decoy with its own label/focus = a silent-reject trap (confirmed mechanical in scratch/q90_honeypot); a suspected-bot rejection must return a human-readable error, never a dead-end.
- **Golden-ratio grid/layout** — rejected 2026-08-28 (Q7): same hype family as golden-ratio
  type/spacing (Q1/Q2); no primary evidence for φ-based layout.
- **Butterick's commercial-font bias** — rejected 2026-08-27 (Q1): OSS/self-hosted fonts are
  fine for Keaton's stack; the "buy a pro font" framing doesn't apply.
- **Auto-rotating hero/promo carousel** — rejected 2026-08-28 (Q48): reads as an ad
  (banner-blindness), hides content behind slide 1 (Runyon 2013: ~1% CTR, 84% on slide 1 of 5),
  fails WCAG 2.2.2 Pause/Stop/Hide unless pause/stop/hide is wired. Static hero + scrolled
  sections (Q6) is the one-shot default.
- **"Rotates <5s so it's WCAG-compliant"** — rejected 2026-08-28 (Q48): the 2.2.2 AUTO-UPDATING
  prong has NO five-second exception; auto-advancing = auto-updating in parallel with other
  content → pause/stop/hide required at ANY duration.
- **"Pause-on-hover/focus is enough"** — rejected 2026-08-28 (Q48): W3C verbatim, stopping only
  while focused then restarting on blur is NOT a pause mechanism; the visible rotation control is
  the conformance mechanism (hover/focus pause = APG usability, both required).
- **60-30-10 color split as numeric law** — rejected 2026-08-27 (Q3): interior-design origin
  confirmed by 3 sources; real UI coverage ≈85–95% bg, <2% accent. The underlying principle
  survives (one dominant color, accent small+deliberate, role-based tokens) — the ratio doesn't.
- **Maister wait-psychology numbers (36%, 30–40%, 40–60%, 5–8×)** — rejected 2026-08-27 (Q14):
  appear ONLY in blogs, no primary source; the qualitative principles (unoccupied > occupied,
  uncertain > known, unexplained > explained) survive.
- **"99.7% success rate" for optimistic UI** — rejected 2026-08-27 (Q14): single unverifiable
  blog claim.
- **"200ms defines the web"** — rejected 2026-08-27 (Q14): conflates 0.1s-instant (perception
  threshold) with INP-200ms (field responsiveness metric) — different constructs.
- **Tolerance anchors as laws (Nah 2s, Brutlag 0.4s→20% traffic, 47% expect ≤2s)** —
  downgraded 2026-08-27 (Q14): secondary-only, originals hard to locate; legacy directional
  evidence, not precise laws.
- **`transition-all duration-200` on everything** — rejected 2026-08-27 (Q21): conflicts
  with baseline-ui (never animate unless requested; never animate layout props) and Q12
  purpose-first motion; blanket transitions are an LLM cargo-cult.
- **Blanket dark-mode-default** — rejected 2026-08-27 (Q21): conflicts with impeccable
  use-scene rule (Q18) — light/dark picked by who/where/ambient light, not category habit.
- **Lighthouse 100 = accessible** — rejected 2026-08-28 (Q23): perf score and a11y
  conformance are different axes; a11y = axe gate + manual pass.
- **pa11y alongside axe-core** — rejected 2026-08-28 (Q23): redundant third engine (same
  HTMLCS core); one a11y engine + the manual remainder is the gate shape.
- **APCA replaces WCAG 2.x** — rejected 2026-08-28 (Q24): apca-w3's own README calls the
  standards "still developmental"; conformance today = WCAG 2.2. APCA = design-phase aid.
- **Single-screenshot diffing without stylePath/OS-segregated goldens** — rejected
  2026-08-28 (Q24): rendering varies by host OS/version/fonts/battery/headless → noise,
  not signal (Playwright primary warning).
- **Heuristic evaluation replaces user testing** — rejected 2026-08-28 (Q25): NN/g verbatim
  — "heuristic evaluations cannot replace user research"; Keaton's field tests = user check.
- **"75–90% of problems found per single pass" / "3–5 evaluators find ~75%+" as a
  guarantee** — rejected 2026-08-28 (Q25): the stat is 3–5-evaluator, and binomial math shows
  75% only holds at per-evaluator discovery rate p≥0.31 → ~65–85%, model-dependent.
- **Trusting LLM-assigned severity without human sign-off** — rejected 2026-08-28 (Q25):
  VL/HCC 2025 — severity exact agreement only 56% (Krippendorff α≈0, "requires human
  oversight"); detection (84%) is the reliable half.
- **"4.5:1 covers everything"** — rejected 2026-08-28 (Q24): ignores 1.4.11 non-text UI
  3:1 and 1.4.1 color-not-alone — both real success criteria.
- **"Mar-2026 Core Web Vitals update: INP good 150ms / LCP good 2.0s"** — rejected
  2026-08-28 (Q26): web.dev PRIMARY still publishes INP ≤200ms / LCP ≤2.5s p75 verbatim;
  mutually-exclusive threshold claims across SEO blogs = classic hype churn.
- **Magic-prompt-template (the right phrasing lands polish)** — rejected 2026-08-28 (Q20):
  Design2Code PRIMARY — INPUTS beat phrasing (extracted text + layout constraints up front);
  no prompt wording substitutes for missing reference material.
- **Self-revision/critique pass fixes layout** — rejected 2026-08-28 (Q20) w/ boundary:
  "few can self-revise their generation" (weak models catastrophic: Idefics2 46.7→12.3);
  frontier models CAN revise hard pages (Design2Code-HARD) — but mid/weak models need
  pass-1 inputs, not a critique loop.
- **Keystroke-1 inline validation (validate as the user types from the first
  character)** — rejected 2026-08-28 (Q13): 4/5 sources reject it (GOV.UK, NN/g, RHF
  defaults) — premature errors annoy before the user has finished; blur-first +
  live-clear-after-error is the consensus.
- **@keyframes animationName hack for :-webkit-autofill** — corrected 2026-08-28 (Q13):
  mislabel — the robust fix is inset box-shadow + -webkit-text-fill-color +
  transition-delay:9999s (Blink/WebKit only).
- **Dark basemap by default for maps** — rejected 2026-08-28 (Q27): category habit (Q18
  tell) — pick by use scene; outdoor field use often wants a light, high-contrast basemap.
- **Decorative 3D terrain / compass-spin animations** — rejected 2026-08-28 (Q27):
  decoration-as-content on maps; terrain and motion must serve the task.
- **Keyboard pan satisfies map gesture accessibility** — rejected 2026-08-28 (Q27): WCAG
  2.5.1 requires a single-POINTER alternative — arrow-key pan with no on-screen buttons
  still FAILS (W3C's own canonical map example ships +/− buttons).
- **Zebra striping improves reading/task speed** — rejected 2026-08-28 (Q29): ACM WWW'23
  (14k+ trials / 590 ppl) found NO objective speedup for zebra OR row borders — subjective
  preference only (conflicts with NN/g's endorsement; distilled as tracking aid, pick one,
  never claim performance).
- **Row-height px tiers as law (e.g. "Carbon 32/40–48/56 3 tiers")** — corrected 2026-08-28
  (Q29): Carbon v11 ships FIVE sizes 24/32/40/48/64px; 56px exists nowhere in Carbon.
  Tiers are real options; ACM gives direction (smaller padding faster on mobile), not
  canonical px; touch-first tables need lg 48+ or separate ≥44px targets (Q8).
- **Hover-hidden row actions as the default** — rejected 2026-08-28 (Q29): NN/g — hover-
  revealed actions are a discovery + accessibility failure; inline ≤2 actions, else
  always-visible or keyboard-reachable kebab.
- **Red=error / green=good as the sole signal** — rejected 2026-08-28 (Q17): ~8% of men
  (Northern-European; global pooled male red-green ≈4.5%) are red-green deficient — status
  must pair color with icon/text (WCAG 1.4.1 Level A).
- **Label-less color-coded dashboards** — rejected 2026-08-28 (Q17): hue-only status
  (DM cockpit / Open Finance risk) fails 1.4.1; every color-coded state needs a text or
  shape redundancy.
- **Hue-only chart series** — rejected 2026-08-28 (Q17): series identity via hue alone
  fails CVD users; use pattern/shape/direct labels (converges Q28 direct-labels-not-legends).

- **Pie chart as the default for part-whole** — rejected 2026-08-28 (Q28): pie is accurate only for ≤2–3 slices (Cleveland & McGill: angle/area far less accurate than length); default part-whole → stacked bar; pie valid only for genuinely simple splits.
- **3D bars / rainbow categorical palettes for magnitude** — rejected 2026-08-28 (Q28): 3D distorts the value axis; rainbow hue ramps are perceptually non-uniform and fail CVD users — use ordered/luminance ramps or a single accent.
- **Dual-axis as a normal pattern** — rejected 2026-08-28 (Q28): dual-axis misleads unless same-unit-related or indexed series; otherwise split into two charts.
- **Truncated (non-zero) bar baselines** — rejected 2026-08-28 (Q28): a truncated axis makes a 5.88× difference render as ~20×; bars MUST start at zero (line charts exempt — label the axis).

- **Prompt-for-location-on-page-load** — rejected 2026-08-28 (Q33): Chrome telemetry — 77% of
  no-intent prompts → 12% allow; post-interaction → 30%; never auto-request on mount/route load.
- **PERMISSION_DENIED as a single cause** — rejected 2026-08-28 (Q33): insecure context / framed /
  POSITION_UNAVAILABLE / timeout are distinct codes needing distinct recovery; permissions.query
  is unreliable on iOS Safari (stays "prompt" after grant) — branch on error code, not API state.
- **Nag-loop on geolocation denial** — rejected 2026-08-28 (Q33): re-prompting after denial is
  punished by browsers; detect via error code and offer settings guidance instead.
- **IP-geolocation as a substitute** — rejected 2026-08-28 (Q33): coarse + often wrong; ship an
  explicit manual-entry fallback, not a silent IP guess.

- **"PWAs see 3× engagement"** — rejected 2026-08-28 (Q32): single-source marketing stat
  (frontendchecklist); no primary evidence.
- **Install prompt on first page load** — rejected 2026-08-28 (Q32): web.dev explicit
  anti-pattern (permission-request class); prompt only from a user gesture after
  beforeinstallprompt.
- **Fake install buttons before beforeinstallprompt** — rejected 2026-08-28 (Q32): the button
  must be able to actually prompt; a dead button is worse than none.
- **App-store wrapping (BubbleWrap/PWABuilder) as default** — rejected 2026-08-28 (Q32):
  unnecessary for self-hosted OSS (Ghostway/DM); adds store overhead without user benefit.

- **Weirdness = originality** — rejected 2026-08-28 (Q19): novelty without a brief reason is
  the same failure class as default drift; MAYA + processing-fluency show fully novel =
  disfluent = less trusted. Originality lives in structure+voice on top of an un-flexed
  craft floor.
- **Premium-minimal as the default costume** — rejected 2026-08-28 (Q19): "four dark-or-
  paper pages with one accent each is what happens when nobody decides otherwise" — a
  category habit, not a decision (Q18 AI-purple/cream-and-brass family).
- **Serif = premium** — rejected 2026-08-28 (Q19): "it feels editorial" is not a reason;
  type choice must be brief-earned like any other deviation.

- **Confirm-on-every-destructive-action** — rejected 2026-08-28 (Q38): routine confirms are
  cry-wolf; habituation makes "Are you sure?" an automatic Yes (Raskin ALA #241) — the dialog
  stops being read. Reversible deletes get UNDO; confirm only for serious+irreversible.
- **"Are you sure?" as sufficient protection** — rejected 2026-08-28 (Q38): auto-Yes by
  habituation; reversibility must be a data-model decision, not a modal after the fact.
- **Yes/No confirmation buttons** — rejected 2026-08-28 (Q38): unlabeled, error-prone; use
  verb-labeled buttons (Delete / Cancel) — NN/g confirmation-dialog guideline verbatim.

- **"87% of users never click Load More"** — rejected 2026-08-28 (Q37): no source found
  for the figure in any 2026 verification pass; don't cite it. Infinite scroll's real
  costs are NN/g's six (refinding, illusion-of-completeness, footer trap, a11y, load, SEO).
- **Infinite scroll as the default for every list** — rejected 2026-08-28 (Q37): it fits
  ONLY homogeneous, goal-less grazing streams; goal-driven find/compare lists (DM cockpit,
  Ghostway POI) need PAGINATION or Load More.
- **Google's June-2024 search removal proves infinite scroll is always wrong** — rejected
  2026-08-28 (Q37): the removal was partly computational (AI Overviews replaced the
  feed); don't overgeneralize to all lists.

- **Lazy hero / lazy+high LCP image** — rejected 2026-08-28 (Q35): the above-fold image must be `eager` + `fetchpriority="high"`; `loading="lazy"` on it is the #1 LCP-killer; pairing lazy with high is pointless (browser already loads high-priority first).
- **Preload everything** — rejected 2026-08-28 (Q35): `preload` only when the image is hidden from the preload scanner (CSS background, JS-added, data-src); preloading visible `<img>`s wastes the preload budget.
- **Dimensionless images (no width/height)** — rejected 2026-08-28 (Q35): a 0×0 image lets a lazy gallery be judged all-in-viewport → browser loads EVERYTHING + CLS.
- **AVIF-for-everything / AVIF always smallest** — corrected 2026-08-28 (Q35): AVIF ≈94.65% global (Safari 16.4+ full); WebP is the pragmatic default, AVIF is build-time-only (slow encode) and was NOT smaller than WebP in a mechanical test.
- **Omitting `sizes` on srcset** — rejected 2026-08-28 (Q35): defaults to 100vw → over-download on every viewport.

- **font-display: block as default** — rejected 2026-08-28 (Q34): it hides text up to 3s (FOIT, invisible text) before swapping; use `swap`/`fallback`.
- **Google-Fonts all-weights CSS** — rejected 2026-08-28 (Q34): it lazy-loads every weight on first paint; self-host a subsetted WOFF2 + unicode-range.
- **font-display: optional as the default** — corrected 2026-08-28 (Q34): `optional` is immediate-or-never and silently skips the custom font on slow links; reserved for non-critical display faces only.

- **Pull-to-refresh on every list** — rejected 2026-08-28 (Q49): adds a discoverability gap + a WCAG 2.5.1 single-pointer burden where a visible Refresh button already satisfies both; reserve the gesture for homogeneous grazing feeds.
- **"W3C names pull-to-refresh as a 2.5.1 failing example"** — rejected 2026-08-28 (Q49): false — the Understanding doc has ZERO "refresh" hits; the rule stands by construction + F105's tap-alternative TEST. Cite the test, never an invented W3C example.
- **Treating browser/OS pull-to-reload as 2.5.1 in-scope** — rejected 2026-08-28 (Q49): 2.5.1 covers author-provided content only; UA/OS-provided refresh gestures are exempt.

- **"Command palette is a W3C pattern"** — rejected 2026-08-28 (Q50): no APG/W3C command-palette pattern exists; it is a dialog+combobox composition. Cite two APG patterns, never an invented W3C one.
- **Keyboard-only command discoverability** — rejected 2026-08-28 (Q50): refuted on peer-reviewed grounds (KeyMap deltas are over ExposeHK, not absolute; shortcuts infrequently used, active-user paradox). A visible trigger + inline shortcut hints + `?` cheat-sheet are required, not optional.
- **Esc-only palette with no visible Close** — rejected 2026-08-28 (Q50): violates APG's "dialog tab sequence should include a visible close button" recommendation; also breaks touch users with no Esc key.
- **⌘K on every site / palette on touch-primary or marketing sites** — rejected 2026-08-28 (Q50): not worth the duplicated entry-point + modal a11y surface below ~15–20 keyboard-reachable actions, on touch-primary surfaces, or as a slop tell on simple marketing sites (Q18).

- **"A toggle's label may freely change while keeping aria-pressed"** — rejected 2026-08-28 (Q52): APG verbatim — the label MUST NOT change when state changes; if it flips (Mute→Unmute), drop aria-pressed. Pick ONE: stable label + aria-pressed OR changing label + no aria-pressed. SLOT A's "may stay or change" was WRONG.
- **HTML `disabled` and `aria-disabled` are interchangeable** — rejected 2026-08-28 (Q52): HTML disabled destroys focusability/submit-participation and drops the control from the tab order (SR can't say why); aria-disabled preserves them but requires the handler to early-return. Use aria-disabled when the reason must stay discoverable; web-only (OF Android/Compose differs).
- **Hand-rolled `div role=button` as the default** — rejected 2026-08-28 (Q52): APG "a role is a promise" — a div without author-supplied Space/Enter + focusability is a broken promise; prefer native `<button>`.
- **"M3 five-tier emphasis ladder (Filled>Tonal>Elevated>Outlined>Text) is a verified fact"** — rejected 2026-08-28 (Q52): the tier NAMES are single-source (m3.material.io unextractable this run); only the one-primary-per-screen PRINCIPLE is verified (via Q6 Unbounce 44M-conversion data). The principle stands; the specific ladder + FAB/18–24dp specs are not primary-confirmed (Q26 maintenance-mode caveat).

- **"Custom right-click menu can be the only way to reach an action"** — rejected 2026-08-28 (Q53): Firefox Shift+right-click shows the native menu WITHOUT firing `contextmenu`, so `preventDefault()` cannot suppress it (MDN PRIMARY); a custom right-click menu is by spec/UA-behaviour NON-exclusive → it can only ever be an ACCELERATOR layered on an always-visible kebab, never the sole path. `contextmenu` is also "Limited availability" cross-browser.
- **"Arrow keys are required to OPEN an ARIA menu"** — rejected 2026-08-28 (Q53): APG makes Enter AND Space the REQUIRED open keys; arrow-keys are an optional accelerator. Also wrap-on-arrow-nav is OPTIONAL, not required.
- **"Remove aria-expanded when the menu is closed"** — rejected 2026-08-28 (Q53): APG sets aria-expanded explicitly to "false" when hidden; removing the attribute is not the APG pattern (store the trigger ref so Escape returns focus correctly).

- **"A swipe-to-reveal alternative must be ≥24px and visible without hover"** — rejected 2026-08-28 (Q55): mis-attributed to WCAG 2.5.7; 2.5.7 requires only an equivalent single-pointer, non-dragging path (W3C's carousel example allows visually-hidden-but-operable buttons). The 24/44px size floor is 2.5.8 (Q8/Q23) and the discoverability expectation is 2.4.11/Q9 — cite them SEPARATELY, never fold into 2.5.7.
- **"Keyboard support satisfies 2.5.7 for swipe rows"** — rejected 2026-08-28 (Q55): W3C verbatim — keyboard-only equivalence "does not automatically meet" 2.5.7 unless it ALSO provides controls clickable/tappable with a pointer; matches Q47. A row kebab/overflow menu (Q53) or inline buttons are the required non-gesture equivalent.
- **"iOS swipeActions (allowsFullSwipe, leading/trailing, .destructive) is verified spec"** — rejected 2026-08-28 (Q55): Apple SwiftUI docs + HIG are JS-gated and source-unverified in this fleet; file as convention, not verified. The "allowsFullSwipe=false for destructive actions" safety rule is sound reasoning either way — but label it convention.
- **"Swipe-to-action on every list row by default"** — rejected 2026-08-28 (Q55): swipe is a gesture ACCELERATOR, not the contract; the always-reachable kebab/inline buttons are what discharge 2.5.7. Where only 1–2 actions exist, inline buttons alone beat a swipe (Q53 when-NOT); desktop/table tier (Q29) needs no swipe.

- **"Social-icon share grid is best practice"** — rejected 2026-08-28 (Q68): one native `navigator.share()` button beats a Twitter/Facebook/email icon row (web.dev consensus; Ghostway flagship fit).
- **"'Copied to clipboard' is the right copy"** — rejected 2026-08-28 (Q68): use 'Copied!' (~2s label-swap, no modal); long copy is stale convention.
- **"AbortError = share failed"** — rejected 2026-08-28 (Q68): MDN — AbortError = user cancel OR no available targets; catch + ignore, never error-toast.
- **"Web Share is mobile-only / desktop unsupported"** — rejected 2026-08-28 (Q68): 2026 caniuse has Web Share on desktop Chrome/Edge/Safari macOS; only Firefox is the evergreen holdout; ship a clipboard fallback for that.

- **"Sortable table needs role=grid"** — rejected 2026-08-29 (Q78): APG uses plain HTML `<table>`; role=grid changes the keyboard model entirely and is only for focusable/interactive cells — never reach for it just to make a table sortable.
- **"Set aria-sort=none on every column"** — rejected 2026-08-29 (Q78): `none` is the DEFAULT value; set `aria-sort` only on the currently-sorted column (one at a time).
- **Color-only sort arrows** — rejected 2026-08-29 (Q78): direction cue must not be hue-only (WCAG 1.4.1); use a CSS arrow + off-screen `<caption>` instruction.
- **Silent re-sort** — rejected 2026-08-29 (Q78): announce the new order via `aria-live=polite`; re-sorting with no announcement leaves SR users unaware the order changed.

## Q79 — Zoom / reflow / text-spacing resilience (2026-08-29)

WCAG 2.2 AA floor (1.4.4 Resize Text + 1.4.10 Reflow + 1.4.12 Text Spacing) that responsive-only
builds silently miss. Verified by the fleet against W3C Understanding primaries + mechanical
`scratch/q79_zoom_math.js`. Landing: `uiux-one-shot-polish` (Accepted strategies Q79 + Polish
gate), `web-platform-quirks` (Zoom/reflow section). Applies at build time; no project retrofit.

### Accepted strategies (one-shot checklist lines)
- Reframe "mobile-first" to include **desktop 400% zoom**: 1.4.10 = NO 2-D scroll at 320×256 CSS px = 1280px@400% / 1024px@400%. A responsive mobile layout alone does NOT satisfy it.
- Use `max-width` not `width`; rem containers; no `white-space:nowrap` on text; slim persistent toolbars (they eat the 400%-zoom viewport).
- Named 2-D exception (maps/diagrams/video/games/presentations/data-tables + persistent toolbars) does NOT extend to surrounding content — Ghostway map CANVAS exempt, its control panels are not; a table scrolling inside its own container while the page reflows = conformant.
- 1.4.4 Resize Text (200% via any UA) is a SEPARATE failure axis from 1.4.10 (clipping vs horizontal scroll).
- 1.4.12 = SURVIVE user overrides (1.5 lh / 2× para / 0.12em letter / 0.16em word), don't ship them: `min-height` not `height`, no `overflow:hidden` on text, no `!important` on spacing.
- axe-core has NO rule for 1.4.4/1.4.10/1.4.12 → manual remainder + Playwright 320×256 `scrollWidth` assert + spacing-override injection (converges Q23 30–57% ceiling).
- Mechanical gate (reuse): `assert(document.documentElement.scrollWidth <= viewportWidth at 320px / 400% zoom)`; inject user-spacing and assert no clipping/overflow.

### Rejected / counterexamples
- **"Responsive ⇒ passes reflow"** — rejected 2026-08-29 (Q79): a fixed-width `width:960px` wrapper FAILS 1.4.10 at 400% zoom even with a perfect mobile breakpoint; responsive ≠ reflow-conformant.
- **"320px = mobile device width only"** — rejected 2026-08-29 (Q79): 320 CSS px ≈ 1280px viewport @400% zoom (W3C Note 1); the test is primarily a desktop-zoom test.
- **"Must ship 1.5 line-height to pass 1.4.12"** — rejected 2026-08-29 (Q79): 1.4.12 only requires SURVIVING user-set overrides, not shipping them.
- **"px text doesn't zoom"** — rejected 2026-08-29 (Q79): px text scales with page zoom like everything else; px is fine for 1.4.4.

## Q80 — Sticky / fixed header & persistent chrome + Focus Not Obscured (2026-08-29)

WCAG 2.2 AA floor (2.4.11 Focus Not Obscured Minimum + 2.4.12 Enhanced) that fixed sticky
chrome silently violates. Verified by the fleet against W3C Understanding primaries.
Landing: `uiux-one-shot-polish` (Accepted strategies Q80 + Polish gate), `web-platform-quirks`
(Sticky chrome section). Applies at build time; no project retrofit.

### Accepted strategies (one-shot checklist lines)
- Keep persistent header ≲10% of viewport height (~60–80px desktop / ~50–60px mobile) + ≤5 top-level items (logo + few links + ≤2 CTAs); no promos — guideline ceiling, not a law.
- 2.4.11 (AA, NEW in 2.2) = focused element must not be ENTIRELY hidden by author content; 2.4.12 (AAA) = not obscured AT ALL. Sticky headers/footers, cookie banners, chat widgets = canonical failures, in legal scope (ADA/508/EAA).
- Fix with `scroll-padding-top: <header-height + 16–20px>` on the scroll container + `:target,:focus { scroll-margin-top: same }`; keep as a token, recompute on resize from `header.getBoundingClientRect().height`. Reject the `*:focus{position:relative;z-index:9999}` hack.
- Anchor-offset is the same bug: `:target{scroll-margin-top}` + `tabindex="-1"` on non-interactive targets; smooth-scroll only under `prefers-reduced-motion: no-preference`.
- Sum all pinned regions (header + banner + chat + promo) into ONE sticky-height token + one z-index scale (Q21); disable stickiness at high zoom / short pages (Q79); pair iOS/PWA top chrome with `env(safe-area-inset-*)` + dvh/svh (Q8), watch CLS.
- axe-core has NO rule for 2.4.11/2.4.12 → manual-audit remainder.

### Rejected / counterexamples
- **"Sticky headers lift conversion by X%"** — rejected 2026-08-29 (Q80): every quantitative sticky stat (22%/36%/15–20%/64%/12–18% + '20–30% satisfaction drop') is an unverifiable laundered blog figure with no primary source; treat all as [needs-evidence] / reject.
- **`*:focus { position:relative; z-index:9999 }` fixes 2.4.11** — rejected 2026-08-29 (Q80): it breaks stacking and does not scroll the focused element clear of the sticky chrome.
- **`:target { scroll-margin-top }` alone is enough** — rejected 2026-08-29 (Q80): it fixes anchor jumps but misses keyboard `:focus` scroll clearance; `:focus` needs the same margin.
- **"Raise aria-label / z-index to satisfy 2.4.11"** — rejected 2026-08-29 (Q80): 2.4.11 requires the element be physically visible, not just announced or layered; axe-core is blind to it → manual check.

## Q98 — Client-side crash / partial-failure resilience & retry UX (2026-08-29)

PARTIAL-FAILURE ≠ PAGE-FAILURE: never blank a whole surface because one region failed; render
what succeeded and scope a fallback to the failed region. Verified by the fleet against NN/g
Error-Message Guidelines + React error-boundary docs + multi-vendor retry/Idempotency-Key.
Landing: `uiux-one-shot-polish` (Accepted strategies Q98 + Pre-generation spec + Pitfalls),
`frontend-component-build` references/state-design.md (§ Client-side crash resilience). Applies at
build time; no project retrofit.

### Accepted strategies (one-shot checklist lines)
- Contain failure to the region: coarse-to-fine (app shell > route/page > widget); ONE root boundary = zero isolation; vanilla-JS wraps each panel's fetch/render in its own try/catch → per-panel fallback.
- Fallback must answer what failed / is it my fault / what to do — no null, no raw `error.message`, no unstyled dump; min = styled UI + plain-language cause + ≥1 recovery action.
- Retry button adjacent to the FAILED component (not page-top banner), capped ~3 attempts then escalate; exponential backoff = BACKGROUND retries only, not a clicked button.
- Never auto-retry 4xx EXCEPT 429 (Retry-After) / 408 / 503-with-Retry-After; clamp Retry-After ~60s; non-idempotent POSTs send an Idempotency-Key (no key → 429-retry double-charges).
- Error boundaries don't catch event/async errors → vanilla needs per-panel try/catch + global onerror/unhandledrejection; preserve user input across failure (Q11/Q56).

### Rejected / counterexamples
- **Single root error boundary** — rejected 2026-08-29 (Q98): one try/catch around everything = zero isolation; a failure in one widget blanks the whole page.
- **Show `error.message` / stack to the user** — rejected 2026-08-29 (Q98): raw error text is an unstyled, blame-less, often-leaky dump; use plain-language cause + recovery.
- **"Never auto-retry any 4xx"** — corrected 2026-08-29 (Q98): over-reaches; 429/408/503-with-Retry-After ARE retryable.
- **Auto-retry a non-idempotent POST** — rejected 2026-08-29 (Q98): double-charges without an Idempotency-Key (mechanical proof).

## Q103 — Permission-aware / role-based UI: hide-vs-disable + unauthorized (403) states UX (2026-08-29)
Role-gated UI: the decision rule, the a11y contract, and the unauthorized surface. Verified 6/6 on PRIMARY MDN `aria-disabled` + 4 independent 2nd-sources (Friedman/Smashing 2024, Salomon, uxpsychology, HashiCorp Helios).

### Accepted strategies (one-shot checklist lines)
- Hide controls the user can NEVER use (don't render admin actions to non-admins); for visible-but-blocked use `aria-disabled="true"` + JS-suppressed activation + explain why/how; native `disabled` only when truly unavailable-undiscoverable.
- Default = keep enabled + explain on interaction; never pre-disable the submit button.
- Upgrade-gated features: disabled + "Hide all unavailable" toggle beats hidden.
- Never hide via `opacity:0`/off-screen — use `hidden`/`inert`/conditional render (no layout shift; converges Q92/Q60).
- Unauthorized = a proper 403 view (what happened / whose account / what to do), not a dead button (Q81 covers 404/offline only).

### Rejected / counterexamples
- **"Disable submit until form valid"** — rejected 2026-08-29 (Q103): contradicted by Friedman/Salomon/rauno-tier; keep enabled + explain on invalid submit.
- **"Tooltip explains a disabled button"** — rejected 2026-08-29 (Q103): disabled elements don't fire hover/focus (Q43); use `aria-disabled` + visible WHY text.
- **"Disabled = gray + keyboard-invisible is fine"** — rejected 2026-08-29 (Q103): WCAG has NO disabled-contrast minimum, so illegible disabled text still fails AA; keep ≥2–3 signals (opacity + cursor + color).
- **"Render a disabled wall of admin buttons to non-admins"** — rejected 2026-08-29 (Q103): hide permission-gated controls instead.
- **"A 403 is just another disabled button"** — rejected 2026-08-29 (Q103): 403 needs its own view copy (what/when/what-to-do).

## Q106 — Device orientation & landscape / adaptive-posture (WCAG 1.3.4 Orientation) (2026-08-29)
Never lock to one orientation (WCAG 2.2 AA 1.3.4). Verified 5/5 on PRIMARY W3C Understanding SC 1.3.4 + 2nd-source ×3 (WCAG22 Understanding, WAI techniques changelog, TestParty 2025, accessibility.build).

### Accepted strategies (one-shot checklist lines)
- Build every surface for BOTH portrait + landscape; do not lock orientation. Only a per-screen ESSENTIAL exemption is allowed (TV / check-capture / piano / VR goggles — where removal 'fundamentally changes the content').
- Failures to avoid: F97 = locking via manifest `orientation` pin / CSS `@media` hide / JS `screen.orientation.lock()`; F100 = a 'rotate your device' overlay even when content sits behind it.
- 'view AND operation' — landscape + on-screen keyboard trapping submit/unscrollable = failure. Short-viewport checklist: `dvh` + `max-height` + no `100vh` + keyboard-safe scroll (converges Q80).
- iOS Safari has NO `screen.orientation` API (undefined) → manifest `orientation` IGNORED + `screen.orientation.lock()` silently no-ops. The only live F97/F100 vectors on Ghostway iPhone are CSS-hide or a rotate-overlay — block both. Android Chrome honors manifest lock; Android 16 ignores lock below sw≥600dp (tablet).
- axe-core has NO 1.3.4 rule → manual device-rotation / devtools-orientation-emulation check (manual remainder, same class as Q80 2.4.11).

### Rejected / counterexamples
- **"Mobile app must be portrait"** — rejected 2026-08-29 (Q106): WCAG 2.2 AA 1.3.4 forbids restricting to one orientation unless essential.
- **"CSS @media(orientation:portrait) to hide landscape = fine"** — rejected 2026-08-29 (Q106): that IS failure F97.
- **"screen.orientation.lock() works everywhere"** — rejected 2026-08-29 (Q106): silently no-ops on iOS Safari (screen.orientation undefined).

## Q92 — Skip links / WCAG 2.4.1 Bypass Blocks + DOM-vs-visual source order (2026-08-29)
Skip link recipe + the flex/grid `order` source-order trap LLM layouts hit constantly. Verified 8/8 on primary (CSS Flexbox L1 + MDN + WebAIM). Landing: `uiux-one-shot-polish` (Accepted strategies Q92 + Polish gate), `frontend-component-build` references/accessibility-patterns.md (§ Skip link extended), vault playbook (this section). No project retrofit — applies at build time; DM Astro / DM cockpit / Ghostway / OF web all need a skip link + source-order discipline.

### Accepted strategies (one-shot checklist lines)
- **One-shot build checklist line:** if the build has more than a trivial page, ship a skip link as the FIRST focusable DOM element (`<a href="#main">Skip to main content</a>` → `<main id="main">`), hide it off-screen (not `display:none`), reveal on `:focus`; keep `tabindex="-1"` on the target (zero-cost, laggard-Safari safety).
- **One-shot build checklist line:** never reorder INTERACTIVE elements with CSS flex/grid `order` / `*reverse` / `grid-template-areas` / `auto-flow:dense` / absolute `position` — keyboard + SR order follow the DOM, so the visual reorder diverges and fails WCAG 1.3.2 + 2.4.3; reorder the HTML instead. Positive `tabindex` (>0) is banned (patches keyboard, not SR).

### Q95 — Spreadsheet / CSV data-import flow UX · 2026-08-29

Verified 7/7 (uxpatternsguide Bulk-import + csvbox + saasui.design + xlork + NN/g Error-Message Guidelines convergence; mechanical delimiter-sniff proof `scratch/q95_delimiter_proof.py`). Full recipe: `frontend-component-build/references/csv-import-flow.md`.

**Pipeline (fixed):** file → parse-PREVIEW → column MAP → row VALIDATE → COMMIT + report. Never a bare "Upload" that swallows the file.

**Preview states the interpreted facts:** delimiter, header-row yes/no, row count, columns + inferred types, first N rows AS PARSED. Mechanical: a `;`-delimited EU-Excel export naive-comma-parsed collapses to 1 garbage column and files silently; sniffing shows 3 columns and catches it.

**Mapping:** fuzzy-SUGGEST but never silently apply — explicit confirm is the binding rule; block commit until required fields are mapped; save mappings as reusable presets.

**Validation:** row+column-addressed errors with the fix ("Row 42 · Amount: '1,2O0' isn't a number — use 1200"), grouped counts, downloadable report; ONE bad row never rejects the file (Q11 copy floor).

**Partial-accept policy stated pre-commit:** "import valid / export invalid" vs all-or-nothing; MONEY imports (Open Finance) default to all-or-nothing + dry-run (Q74).

**Commit:** dry-run summary + verb-labeled button ("Import 105 records", not "OK" — Q38); idempotent with a dedupe key; batch ID so the whole import is rollbackable; ship a template CSV; >~10s → hand to the Q86 long-job lifecycle, not a modal spinner.

- **One-shot build checklist line:** if the build imports CSV/spreadsheet data (OF bank/txn — flagship, DM cockpit customer/lead, Ghostway POI/route lists), run the 4-stage pipeline (preview facts → confirmed mapping → row-level errors → dry-run commit), never silently auto-map, never reject a whole file for one bad row, use all-or-nothing + dry-run for money, and record a batch ID for undo.

### Rejected / counterexamples
- **"Fuzzy column matching can just auto-apply"** — rejected 2026-08-29 (Q95): fuzzy SUGGEST is the norm, silent application is forbidden — mis-filed columns are a trust-killer, especially on financial data.
- **"Reject the whole file if a row is invalid"** — rejected 2026-08-29 (Q95): one bad row must never reject the import; report row+column errors and state the partial-accept policy.
- **"Commit straight from the upload, report afterwards"** — rejected 2026-08-29 (Q95): no preview/dry-run = irreversible silent misparse; commit needs a verb-labeled summary, dedupe key, and batch-ID undo.
- **"WebAIM 96.3% of homepages fail = skip links are widely broken"** — rejected 2026-08-29 (Q92): that figure is AGGREGATE WCAG failures, NOT skip-link-specific; misattributed. Honest skip-link prevalence ~13.7–17% (secondary, [needs-evidence]).
- **`display:none` skip link that "appears on focus"** — rejected 2026-08-29 (Q92): `display:none`/`visibility:hidden` removes the link from the a11y tree entirely, so it is never focusable; use off-screen `position:absolute` revealed on `:focus`.
- **"Use `order` to put the CTA first in the tab order"** — rejected 2026-08-29 (Q92): `order` reorders visually only; tab/SR order follows DOM. Fix the DOM, don't patch with `tabindex`.
- **"Drop `tabindex=-1` on the target, it's obsolete"** — rejected 2026-08-29 (Q92): Matuzovic 2026 found modern browsers move focus on fragment nav without it, but RGAA/Safari historically lag — keep it (zero cost, guarantees focus).

## Q100 — App-update / "new version available" UX for PWAs (2026-08-29)
Waiting Service Worker surfaced to the user without destroying their work or shipping a broken shell. Verified 4/4 on web.dev PWA update + Service Worker Lifecycle PRIMARY + 5× independent 2nd-source (Jake Archibald lifecycle, MDN-sourced SO, sujeet.pro W3C spec quote, Workbox skipWaiting-danger, hivebook/danielhowells). Landing: `uiux-one-shot-polish` (Accepted strategies Q100 + Polish gate). No dedicated owning skill exists (only Q30 offline cache / Q32 install / Q81 offline page touch it) → umbrella-primary landing per Q50 precedent. No project retrofit — applies at build time (Ghostway MapLibre PWA flagship, OF web tier, DM cockpit, DM Astro all run a SW).

### Accepted strategies (one-shot checklist lines)
- Detect a waiting worker via `registration.waiting` OR `updatefound`→`installed` && `navigator.serviceWorker.controller` — the controller-check distinguishes UPDATE from FIRST-INSTALL, so brand-new visitors never see a stale toast.
- Default behavior is WAIT: a plain page reload does NOT activate a waiting worker (the #1 "my update won't ship" report). Show a DISMISSIBLE "update available" prompt; on confirm, `postMessage` SKIP_WAITING; on `controllerchange` reload ONCE, guarded by a single `let refreshing=false` flag.
- NEVER auto-reload silently under the user (converges Q56 dirty-state guard): auto-activation is acceptable ONLY for low-risk static shells (DM Astro); for anything with editable/unsaved state, require explicit user consent.
- `skipWaiting()` inside the `install` handler is DANGEROUS: old HTML + newly-hashed assets = a broken page. It is safe ONLY when the caching strategy is backward-compatible with already-loaded pages — prefer explicit user-consent SKIP_WAITING, never a blanket `skipWaiting:true` default.

### Rejected / counterexamples
- **"A plain reload activates the new service worker"** — rejected 2026-08-29 (Q100): web.dev PRIMARY — a waiting worker activates ONLY on full tab close or skipWaiting(); a plain reload does NOT, which is why updates silently fail to ship.
- **"skipWaiting() in install is fine / set it true by default"** — rejected 2026-08-29 (Q100): Workbox ships skipWaiting:FALSE by default for this reason; blanket true can serve new JS against old HTML and break the page. Safe only with backward-compatible caching + user consent.
- **"Auto-reload on update is good UX"** — rejected 2026-08-29 (Q100): auto-reload mid-unsaved-edit destroys form state (converges Q56/Q38); require an explicit consent prompt + single-reload guard.

## Applied-to log
date | project | what was applied | result/notes
(none yet)

## Q101 — Language / locale switcher control UX (2026-08-29)
Label each option in its own language + real links + suggest-don't-force; never flags, never JS-only `<button>`/`<select>` switchers, never geo auto-redirect. Verified 7/7 on W3C i18n PRIMARY (qa-navigation-select + qa-html-language-declarations + getting-started/language) + Google Search Central 2nd-source (localized-versions / hreflang). Landing: `uiux-one-shot-polish` (Accepted strategies Q101 + Pre-generation spec + Polish gate). No dedicated owning skill exists (Q75 covers RTL/bidi layout, Q65 dropdown, Q96 settings-row, Q39 nav — none covers the switcher CONTROL) → umbrella-primary landing per Q50 precedent. No project retrofit — applies at build time (DM Astro Spanish-speaking Utah County = flagship; Ghostway/OF web/DM cockpit downstream).

### Accepted strategies (one-shot checklist lines)
- Label each option in ITS OWN language — 'français' not 'French', 'Deutschland' not 'Germany', '日本語' not 'Japanese' (W3C qa-navigation-select verbatim). The user who needs the control reads the option in their language.
- NEVER use flags as language selectors — flags represent COUNTRIES, not languages (Switzerland has 4 official languages under one flag); globe-icon + native-language label is the accepted mobile compromise.
- Place the switcher VISIBLE at/near the top of EVERY page (W3C: 'at or near the top... top right increases visibility'); never bury it in an account menu / hamburger / popup-only.
- Switch to the EQUIVALENT page in the new locale ('on a page by page basis'), not the locale homepage — preserve the user's place.
- Use REAL progressive links: `<a href>`, `<link rel=alternate hreflang>`, HTTP `Link:` header, or XML sitemap. The real constraint is a link/alternate ELEMENT — never a `<button>` or `<select><option>` JS-only switcher (uncrawlable + screen readers can't voice-switch).
- Per-option `lang` attribute for screen-reader pronunciation switching (W3C qa-html-language-declarations); a `title` attribute in the wrong language = 'Bad code'.
- SUGGEST, don't FORCE: offer detected language + optional geo/Accept-Language hint with a DISMISSIBLE target-language prompt; hreflang `x-default` fallback. Never auto-redirect/geo-bounce (W3C: automatic negotiation 'not a replacement for providing links'; Google may surface versions without action).

### Rejected / counterexamples
- **'Flags as language selectors'** — rejected 2026-08-29 (Q101): W3C separates translation (language) from country sites; flags = country, not language; one flag can map to many languages.
- **'JS `<button>`/`<select>`-only language switcher'** — rejected 2026-08-29 (Q101): Google confirms hreflang valid on `<a href>` / `<link rel=alternate>` / HTTP header / XML sitemap, never `<button>`/`<option>`; JS-only switchers break crawl + SR voice-switch.
- **'Auto-redirect users to their detected locale (geo/IP)'** — rejected 2026-08-29 (Q101): W3C + Google — automatic negotiation is not a replacement for links; geo-bounce breaks back-button + SEO; suggest via x-default + prompt instead.

## Applied-to log
date | project | what was applied | result/notes

## Q109 — Low-bandwidth / data-saver & adaptive-loading UX (2026-08-29)
Treat Save-Data / `prefers-reduced-data` / Network Information `effectiveType` as PROGRESSIVE ENHANCEMENT ONLY — never a baseline mechanism. Verified 4/4 on caniuse BCD + MDN PRIMARY (Save-Data / prefers-reduced-data / Network Information API `effectiveType`). Landing: `uiux-one-shot-polish` (Accepted strategies Q109 + Pre-generation spec). No dedicated owning skill covers adaptive-loading (Q35 image delivery / Q98 failure-retry / Q30 offline are adjacent but don't cover the data-saver signal layer) → umbrella-primary landing per Q50 precedent. No project retrofit — applies at build time (Ghostway iPhone field PWA flagship, DM Astro marketing, OF web tier, DM cockpit Hono+SQLite).

### Accepted strategies (one-shot checklist lines)
- Treat all three data-saver signals as PROGRESSIVE ENHANCEMENT, never baseline: Save-Data request header (server variants, opt-in-EXEMPT client hint, NO Accept-CH), `prefers-reduced-data` CSS (front-end only), `navigator.connection.saveData` JS. Pick by where the asset decision lives.
- Support reality is the load-bearing fact: Save-Data header = Chromium/Opera ONLY (caniuse: Chrome/Edge/Opera yes; Firefox no; Safari 3.1–26.5 + TP no); `prefers-reduced-data` = ZERO browsers implement it (MDN verbatim) — SLOT A's "limited" understated; Network Information `effectiveType` = Chromium ONLY (Firefox/Safari none). → Ghostway iPhone Safari supports NONE → only real iOS lever is conservative-by-default payloads + Q30 offline caching.
- `effectiveType` is a COARSENED HINT (rtt+downlink-derived) — never branch CORRECTNESS on it.
- If you DO serve Save-Data variants: send `Vary: Save-Data` (MDN: `Vary: Accept-Encoding, Save-Data` separates cached variants; omit → CDN serves the low-res variant to full-bandwidth users).
- Feature-detect + degrade gracefully: no signal = full experience, never a broken one (the signals are bonuses, not requirements).

### Rejected / counterexamples
- **"Adaptive-loading is a baseline mechanism"** — rejected 2026-08-29 (Q109): all three signals are Chromium-only; on Safari/Firefox they don't fire at all, so a baseline-dependent path is simply broken for a large share of users.
- **"Use `prefers-reduced-data` to detect data-saving intent"** — rejected 2026-08-29 (Q109): MDN confirms zero browsers implement it; a `prefers-reduced-data` query is dead code today.
- **"Branch behavior on `effectiveType` for correctness"** — rejected 2026-08-29 (Q109): it's a coarsened rtt/downlink HINT, not a capability fact; treat as a perf hint, never a logic gate.
- **"Skip `Vary: Save-Data` on header-variant responses"** — rejected 2026-08-29 (Q109): without it the CDN caches one variant and serves the trimmed asset to full-bandwidth users (MDN).
(none yet)

## Q110 — Transactional / notification EMAIL design + accessibility (2026-08-29)
Email ≠ web. Build table-based layouts (nested tables + inline styles); ship a plain-text `multipart/alternative` part; set `lang`+`dir` on `<html>`, `role="presentation"` on every layout table, descriptive link text, ≥4.5:1 body contrast. Verified 5/5 on Email Markup Consortium 2026 report PRIMARY + 4 independent re-reports + accessibility.build/qualibooth/resend/asu + emailens.dev/caniemail. Landing: VAULT ONLY — no owning skill covers email (Q44 = in-app transient messaging, Q82 = microcopy are adjacent but don't cover the email channel); `uiux-one-shot-polish` Accepted-strategies patch is BLOCKED by the >100k skill_manage write limit (known Q95 blocker, Needs Keaton: split into references/) → vault-only landing per Q50 precedent. No project retrofit — applies at build time (DM Astro lead/contact-confirm + retainer client notices = flagship revenue-adjacent; DM cockpit Hono+SQLite export-ready/alert/report emails; Open Finance budget/tithing report email; Ghostway password/magic-link if ever).

### Accepted strategies (one-shot checklist lines)
- **EMAIL IS NOT THE WEB** — Classic Outlook (2007–2021) uses the Microsoft Word renderer: emailens.dev shows only 45/251 CSS properties supported; it ignores flexbox, grid, border-radius, background-image. Gmail strips `<style>` in many configs + rewrites classes. → Use nested-table layout + INLINE styles for anything sent to arbitrary recipients.
- **Table-soup fallback is TRANSITIONAL, not obsolete** — New Outlook (2024+, Edge WebView2/Chromium) renders flexbox/grid/border-radius, so the table fallback is a defensive tier, BUT it stays MANDATORY for unknown-recipient transactional email; Classic Outlook support ends ~Oct 2026.
- **`role="presentation"` on EVERY layout table — including nested ones** — accessibility.build's "linear document wearing a table costume" is the #1 email a11y technique (converges with Q92 source-order); makes the table invisible to AT so the linear content reads cleanly.
- **a11y floor (WCAG 2.2 AA):** `<html lang>` + `dir`; exactly one `<h1>` + sane heading order; descriptive `alt`; DESCRIPTIVE link text (never "click here" / "read more"); body text ≥4.5:1 contrast (Q24 gate); always ship a `multipart/alternative` plain-text part. Contrast + role=presentation + table-soup are axe-blind → manual check + plain-text part required (same ~30–40% automated ceiling as Q23/Q93).
- **EMC 2026 datum is the build checklist** — 376,348 emails analyzed (automated only), 99.88% had serious/critical issues, only 8 passed (0.002%); top failures: 97.41% missing `dir`, 58% insufficient contrast, non-descriptive link text. → Pre-flight: set `dir`, check contrast, rewrite link text.

### One-shot build checklist line
- **One-shot build checklist line:** if the build ever sends email (DM Astro lead/contact-confirm + retainer notices, DM cockpit export/alert/report emails, OF budget/tithing report, Ghostway magic-link), use table-based + inline-CSS layout (NOT flexbox/grid for unknown recipients), `role="presentation"` on every layout table, `<html lang>`+`dir`, one h1 + heading order, descriptive link text (never "click here"), ≥4.5:1 body contrast, and a `multipart/alternative` plain-text part — email a11y is axe-blind, so verify manually + keep the text part.

### Rejected / counterexamples
- **"Email = web, just use flexbox/grid"** — rejected 2026-08-29 (Q110): Classic Outlook Word-engine supports only 45/251 CSS (no flex/grid/border-radius/bg-image); Gmail strips `<style>` + rewrites classes. Use nested tables + inline styles.
- **"Link text 'click here' / 'read more' is fine"** — rejected 2026-08-29 (Q110): non-descriptive link text is a top-3 EMC 2026 failure (alongside missing `dir` + low contrast); use descriptive, destination-named link text.
- **"Automated/axe checks will catch email a11y"** — rejected 2026-08-29 (Q110): same ~30–40% automated ceiling as Q23/Q93; `role="presentation"` + table-soup are invisible to axe, and the plain-text part is never auto-checked → manual pass + multipart/alternative required.
- **"Dark-mode email CSS is standardized"** — retained [needs-evidence] 2026-08-29 (Q110): Litmus 3-behaviour dark-mode taxonomy is industry-tier, not primary-verified; do NOT hardcode dark-mode assumptions as fact.
(none yet)

## Q111 — Account closure / delete-my-account + personal-data-export (DSAR) UX (2026-08-29)
If the build has a server-side account or stores user data: deletion must be discoverable in account settings (a Privacy/Your-data section), NOT buried in support/FAQ (Apple: "easy to find, typically account settings"). Ship BOTH deletion channels for a server-side account: in-app deletion (Apple App Store Review Guideline 5.1.1(v), in force 2022-06-30, MANDATES it — deactivate/disable/sign-out insufficient; must remove the account record + associated data; all users regardless of location; social logins included) AND a web-accessible deletion URL reachable after uninstall (Google Play Data safety; Google Play ALSO requires in-app deletion for mobile apps — the web URL alone covers only the post-uninstall path). Never conflate sign-out ≠ deactivate ≠ export ≠ delete — a flag-only/hidden "delete" that only de-authenticates is GDPR-non-compliant. Preview BEFORE confirm: name the signed-in identity, what is deleted, what is legally retained (billing/tax), subscription/linked-app effects, blocking exceptions. Escalation ladder = re-auth + type-to-confirm (extends Q38); export-before-delete + truthful grace window; model deletion as a JOB with status + receipt (GDPR Art.17 ≤1 month); erase client-side storage on an installed PWA (localStorage/IDB/cookies/Cache Storage — converges Q30/Q100/Q107); verb-labeled buttons, no destructive default; WCAG 2.2 3.3.4/3.3.6 supports confirmation. BOUNDARY: applies ONLY where a server-side account exists — a device-only no-account app = uninstall = deletion. Landing: umbrella-primary (no owning skill covers account-closure/DSAR; converges Q38 confirmation/undo) + vault. No project retrofit — applies at build time (Open Finance = flagship, ship in-app + web deletion URL before store submission; Ghostway if app-store; DM cockpit client/lead erasure GDPR Art.17; DM Astro lead/contact erasure).

### Accepted strategies (one-shot checklist lines)
- **DISCOVERABILITY IN SETTINGS** — account deletion lives in a named Privacy/Your-data section of account settings, never buried in support/FAQ (Apple verbatim: "easy to find, typically account settings").
- **BOTH DELETION CHANNELS** — in-app deletion (Apple 5.1.1(v) mandates it for the App Store; Google Play ALSO requires in-app deletion for mobile apps) + a web-accessible deletion URL reachable AFTER uninstall (Google Play Data safety; the web URL alone only covers the post-uninstall path). Apple exception: account created purely off-app → web deletion allowed.
- **NEVER CONFLATE FOUR ACTIONS** — sign-out ≠ deactivate ≠ export ≠ delete; a hidden "delete" that only de-authenticates is GDPR-non-compliant (auditbuffet confirms sign-out≠deletion).
- **PREVIEW BEFORE CONFIRM** — name the signed-in identity, what is deleted, what is legally retained (billing/tax), subscription/linked-app effects, blocking exceptions.
- **ESCALATION = re-auth + type-to-confirm** — extends Q38; export-before-delete + truthful grace window; model deletion as a JOB with status + receipt (GDPR Art.17 ≤1 month); erase client-side storage on an installed PWA (localStorage/IDB/cookies/Cache Storage — converges Q30/Q100/Q107); verb-labeled buttons, no destructive default; WCAG 2.2 3.3.4/3.3.6.

### One-shot build checklist line
- **One-shot build checklist line:** if the build has a server-side account or stores user data, put account deletion in a Privacy/Your-data settings section (not support/FAQ), ship BOTH in-app deletion (Apple 5.1.1(v); Google Play also for mobile) + a web-accessible deletion URL reachable after uninstall, never conflate sign-out/deactivate/export/delete, preview scope+identity+retained-impact before confirm, and require re-auth + type-to-confirm (extends Q38) with deletion modeled as a JOB (status+receipt, GDPR ≤1 month) + client-side erasure on installed PWAs.

### Rejected / counterexamples
- **"Sign-out = account deletion"** — rejected 2026-08-29 (Q111): a hidden "delete" that only de-authenticates is GDPR-non-compliant; Apple 5.1.1(v) mandates actual account-record + associated-data removal.
- **"A web deletion URL satisfies Google Play"** — rejected 2026-08-29 (Q111): correction vs SLOT A — Google Play ALSO requires in-app deletion for MOBILE apps; the web URL alone covers only the post-uninstall path.
- **"Bury delete in support/FAQ"** — rejected 2026-08-29 (Q111): Apple requires it "easy to find, typically account settings"; buried delete fails App Store review.
- **"Instant delete, no confirm"** — rejected 2026-08-29 (Q111): Apple requires a confirmation step (type phrase / re-enter password); re-auth + type-to-confirm is mandated, extends Q38.

## Q121 — QR-code & barcode scan/generate UX (2026-08-29)
If the build shows or generates a QR/barcode (DM Astro flyers/yard signs, Ghostway share-route, OF receipt), generate dark-on-light with a 4-module quiet zone + ≤20–30% center logo using ECC-H, export SVG/EPS/300 DPI (never JPG); size to a ≥10:1 code-to-distance ratio + 2cm floor. The QR contrast floor is ISO PCS 0.6 (reflectance), NOT a WCAG 4.5:1 ratio. For SCAN, never rely on `BarcodeDetector` on iOS (flag-disabled through Safari 26.5) — feature-detect and ship `getUserMedia`+WASM + a mandatory file-input/`capture` fallback; always pair with a typed manual-entry alternative (WCAG 1.1.1). No owning skill covers QR/barcode → umbrella-primary landing; `uiux-one-shot-polish` Accepted-strategies patch is BLOCKED by the >100k skill_manage write limit → landed via direct file patch (per Q94/Q99 precedent). No project retrofit — build-time pattern (DM Astro, Ghostway, OF).

### Accepted strategies (one-shot checklist lines)
- **DARK-ON-LIGHT + QUIET ZONE + ECC-H + VECTOR** — black modules on white; 4-module quiet zone on all sides (ISO/IEC 18004 + GS1); center logo ≤20–30% with ECC-H (~30% recovery); SVG/EPS/300 DPI, never JPG.
- **CONTRAST FLOOR = ISO PCS 0.6, not WCAG** — the QR contrast authority is ISO PCS 0.6 (reflectance), not 4.5:1; inverted codes widely rejected.
- **SCAN FALLBACK CHAIN** — `BarcodeDetector` is flag-disabled on iOS Safari 17–26.5 → feature-detect + `getUserMedia`+WASM + mandatory file-input; typed manual-entry alternative for WCAG 1.1.1.

### One-shot build checklist line
- **One-shot build checklist line:** if the build shows/generates a QR or barcode, generate dark-on-light + 4-module quiet zone + ≤20–30% logo with ECC-H + SVG/300DPI (never JPG) at ≥10:1 + 2cm floor; for SCAN feature-detect BarcodeDetector + ship getUserMedia+WASM + mandatory file-input fallback (iOS flag-disabled); always provide a typed manual-entry alternative (WCAG 1.1.1).

### Rejected / counterexamples
- **"QR needs 4.5:1 WCAG contrast"** — rejected 2026-08-29 (Q121): the QR contrast authority is ISO PCS 0.6 (reflectance), not a WCAG ratio; borrowed WCAG figures are cargo-cult.
- **"Inverted white-on-dark QR codes are fine"** — rejected 2026-08-29 (Q121): widely rejected by decoders; keep dark-on-light.
- **"BarcodeDetector works on iOS"** — rejected 2026-08-29 (Q121): flag-disabled through Safari 26.5; ship WASM + file-input fallback.
- **"JPG QR export is fine"** — rejected 2026-08-29 (Q121): lossy artifacts break decoding; use SVG/EPS/300 DPI.
- **"Scan-only, no typed alternative"** — rejected 2026-08-29 (Q121): camera scan is pure-vision, fails WCAG 1.1.1; pair with manual entry.
- **"Free-text time field for booking"** — rejected 2026-08-29 (Q121-scheduling): accepts unparseable "930" without period/TZ; render a filtered slot list instead.
- **"Store recurring times as naked UTC"** — rejected 2026-08-29 (Q121-scheduling): drifts +1h across DST (mechanical proof); store wall-clock+TZID per RFC 5545.
- **"Explode recurrence into rows"** — rejected 2026-08-29 (Q121-scheduling): can't represent exceptions (Rule 0); model as RRULE+EXDATE.
- **"Edit one instance = edit whole series"** — rejected 2026-08-29 (Q121-scheduling): destroys intent; prompt THIS/ALL/FOLLOWING.
- **"Color-only availability"** — rejected 2026-08-29 (Q121-scheduling): fails non-color signaling (Q17).

## Q91 — Long-text input & character-count a11y (2026-08-29)
Character count for the multiline/long-text primitive (DM cockpit record notes, OF transaction
memo, Ghostway saved-place notes). Verified 11/11 on GOV.UK Design System character-count + W3C
ARIA textbox + USWDS + MDN `field-sizing`. OWNING reference = frontend-component-build
references/rich-text-editor.md §4 (extends Q113). COLLISION: the orphaned "Q91 in-app-help" was
RENUMBERED to **Q95** — do not confuse them. Converges Q96 (multiline textarea) + Q120
(char/word count) — same long-text family, do NOT re-distill.
### Accepted strategies (one-shot checklist lines)
- **COUNT = 3 PARTS** — native `maxlength` (hard cap) + static limit hint via `aria-describedby`
  (read once on focus) + a separate `role="status"` message updating when typing STOPS (debounced
  ~1s / at threshold %), not per keystroke (gcds#1110 SR-flood reproduced).
- **THRESHOLD SHOW** — show the counter only at a % of the limit (e.g. 85%), not "≤10% remaining";
  phrase as REMAINING + `aria-invalid` on overrun; update on `input` not `keyup`.
- **SOFT ≠ HARD** — soft limit (JS, let users exceed-then-warn) for human prose; reserve native
  `maxlength` for machine fields; counter = `aria-live="polite"` (REJECT assertive+atomic).
- **AUTOGROW + ESC** — `field-sizing:content` autogrow = progressive enhancement (`@supports`
  guard, older iOS fixed-box); default `rows="5"`; Tab-indent only with Esc-exit (2.1.2).
### One-shot build checklist line
- **One-shot build checklist line:** for any long-text/textarea field, ship a 3-part character
  count (`maxlength` + `aria-describedby` static hint + debounced `role="status"` message shown at
  a threshold %, phrased as remaining with `aria-invalid` on overrun, updated on `input`); use a
  soft JS limit for human prose (not silent `maxlength` truncation); counter `aria-live="polite"`;
  `rows="5"` + `field-sizing:content` autogrow under `@supports`; Tab-indent only with Esc-exit.
### Rejected / counterexamples
- **"Per-keystroke live character count"** — rejected 2026-08-29 (Q91): floods SR; GOV.UK updates
  on stop-typing; gcds#1110 reproduced the failure.
- **"Always show the counter"** — rejected 2026-08-29 (Q91): GOV.UK + USWDS show it only near the
  limit (editing needs thinking → counters raise submit time); test without a counter first.
- **"`assertive`+`atomic` counter"** — rejected 2026-08-29 (Q91): interrupts; GOV.UK uses implicit
  polite.
- **"Native `maxlength` is the character limit for prose"** — rejected 2026-08-29 (Q91): silently

## Q122 — OS-level user text-scaling respect (2026-08-30)
Build typography in rem/em so it honors the OS text-size setting. An installed iPhone PWA INHERITS the system font size via rem/em (WebKit `-apple-system-body`); use rem tokens/containers and NEVER ship `-webkit-text-size-adjust:none` (the suppressor that breaks OS dynamic-type inheritance — only WebView-embedded in-app browsers fail, not home-screen PWAs). Test at the TOP of the range: Apple Larger Text reaches AX5 ≈ 312% (87.2px vs 28px default) and Android 14 scales `sp` nonlinearly to 200% — a layout that only works at 100% fails real users (~1-in-3 iOS users run a non-default size; Ghostway iPhone field use is directly at risk). Landing: `uiux-one-shot-polish` (Accepted strategies Q122 + Pre-generation spec + Polish gate). No owning skill covers OS text-scaling (Q79 zoom/reflow is adjacent but doesn't cover the OS-dynamic-type axis) → umbrella-primary landing per Q50 precedent. No project retrofit — applies at build time (all Keaton web surfaces: DM Astro, DM cockpit Hono+SQLite, Ghostway PWA iPhone, Open Finance web/Android).

### Accepted strategies (one-shot checklist lines)
- **rem/em THROUGHOUT** — no px-fixed text containers; installed PWAs inherit OS font size via rem/em (WebKit `-apple-system-body`), so px-only text can't respond to Dynamic Type / Android sp scaling.
- **BAN `-webkit-text-size-adjust:none`** — it suppresses OS text-size inheritance in installed PWAs; only WebView-embedded in-app browsers break inheritance, not home-screen PWAs — leave `text-size-adjust` default.
- **TEST AT THE TOP OF THE RANGE** — Apple Larger Text AX5 ≈ 312% (87.2px vs 28px default), Android 14 `sp` nonlinear to 200%; a 100%-only layout fails ~1-in-3 iOS users.
- **REFLOW NOT CLIP** at 200%+ — converges Q79 (1.4.4 Resize Text / 1.4.10 Reflow); min-height not height, no `overflow:hidden` on text.

### One-shot build checklist line
- **One-shot build checklist line:** for any surface an audience may enlarge text (Ghostway iPhone flagship, all Keaton web), set typography in rem/em, ban `-webkit-text-size-adjust:none`, and verify the layout reflows (not clips) at iOS AX5 ≈ 312% / Android 200% sp before 'done'.

### Rejected / counterexamples
- **"`-webkit-text-size-adjust:none` for consistent cross-browser rendering"** — rejected 2026-08-30 (Q122): it suppresses OS dynamic-type inheritance in installed PWAs; ban it (only WebView-embedded in-app browsers legitimately fail inheritance, not home-screen PWAs).
- **"px text can't scale"** — rejected 2026-08-30 (Q122): px scales with page zoom, but NOT with OS dynamic-type — the gap is OS text-size, which requires rem/em.
- **"Mobile = fixed 16px base"** — rejected 2026-08-30 (Q122): ~1-in-3 iOS users run a non-default text size; a fixed 16px layout breaks them.
- **"Only test at 100% / default size"** — rejected 2026-08-30 (Q122): Apple Larger Text reaches ~312% and Android 14 `sp` to 200%; layouts must reflow at the top of the range.
  truncates human text = trap; use a soft JS cap that warns.

## Q89 — Rating / review / feedback-collection UI · 2026-08-30
INPUT = W3C APG radio-group pattern (`role=radiogroup` + one `tabindex=0` on the checked star else first + per-star `aria-label` 'one star'…'five stars' + Arrow keys move-and-check w/ wrap + Space checks only the unchecked state; native `<input type=radio>` + `aria-hidden` glyph is a valid alt). Forced-colors wiring: `currentColor` SVG stroke + `fill-opacity:0` rect + `forced-color-adjust:auto` (converges Q60); focus ring 2px + ≥2px gap + `cursor:pointer`. DISPLAY = SEPARATE non-interactive component: text-first name '4.2 out of 5, 128 ratings' + stars `aria-hidden` + ALWAYS show the count (avoids 1-review 5.0 illusion); never stars alone. NPS is CONTESTED (IEEE/TQM/ScienceDirect/JAMS 2021) → directional signal only, never 'the one number'; APG 'Rating Slider' (role=slider + aria-valuetext 10-pt) valid alt. Feedback-ask timing converges Q102. Landing: `uiux-one-shot-polish` (Pre-generation spec Q89 + Q102) + `frontend-component-build` references/rating-input.md. No project retrofit (build-time: DM Astro testimonials = display; DM cockpit feedback = input+ask; OF/Ghostway in-app feedback tab).

### Accepted strategies (one-shot checklist lines)
- **Star rating INPUT = APG radio-group** — `role=radiogroup` + ONE `tabindex=0` (checked star else first) + per-star `aria-label` + Arrow move-and-check + Space checks only the unchecked; never `tabindex=0` on every star (axe-blind, manual-AT).
- **Rating DISPLAY = text-first, count mandatory** — '4.2 out of 5, 128 ratings' + stars `aria-hidden` + always show the count; prevents the 1-review-5.0 illusion.
- **NPS = directional only** — IEEE/TQM/ScienceDirect/JAMS find it methodologically flawed; never ship it as 'the one number'.

### One-shot build checklist line
- **One-shot build checklist line:** for any star-rating surface, use the W3C APG radio-group pattern (one `tabindex=0`, per-star `aria-label`, Arrow move-and-check) for INPUT and a separate text-first 'X out of 5, N ratings' display (stars `aria-hidden`, count always shown); wire forced-colors via `currentColor`+`forced-color-adjust:auto`; present NPS as directional only.

### Rejected / counterexamples
- **"tabindex=0 on every star"** — rejected 2026-08-30 (Q89): 5 Tab stops breaks the radio contract; exactly Q21's LLM failure; axe won't catch it (manual-AT).
- **"Stars alone, no count"** — rejected 2026-08-30 (Q89): a 1-review 5.0 reads as social proof; always pair with the count (eBay Evolution).
- **"NPS is the one number to track"** — rejected 2026-08-30 (Q89): IEEE/TQM/ScienceDirect/JAMS 2021 find it methodologically flawed and a poor growth predictor; directional in-product signal only.
- **"There's a best rating scale (5-star vs thumbs vs NPS)"** — rejected 2026-08-30 (Q89): no primary comparison exists; it's a product decision, don't ship a stat.

### Q146 — Text selection & copy-friendliness · 2026-08-30
- **`user-select:none` is controls-chrome ONLY** — blanketing article/body/IDs/amounts/addresses/log panes is canonical harm (breaks copy-to-Clipboard/FieldRoutes/QB/coords, TTS/translate/extension). WebKit/Chromium (spec-VIOLATING) DO inherit `user-select` → re-enable descendants with `user-select:text` is MANDATORY. `::selection` ≥4.5:1 both themes (scratch/q146_selection_contrast.py: 1.00:1 invisible vs 6.27/16.75 OK; forced-colors overrides). `user-select:all` traps atomic copy → wrap in a copy button. Generated content (`::before/::after`) auto `none` → excluded from clipboard (use real text). Legit `none` only on buttons/tabs/handles/glyphs. · WHY: Keaton copies IDs/phones/amounts daily; `none` silently erases his data. · SOURCE: MDN `user-select` + MDN `::selection`. · VERIFIED: 7/8 + 1 inheritance CORRECTION + mechanical. 2026-08-30.
- **One-shot build checklist line:** if the build shows copyable data (IDs/phones/amounts/addresses/logs/coords — DM cockpit, Ghostway, OF), never `user-select:none` on that content; keep `::selection` ≥4.5:1 both themes; reserve `none` for interactive chrome only.
- **Rejected (Q146):** (1) '`user-select:none` protects content from copy' → FALSE, it harms users who need to copy and is not a protection; (2) 'set `none` once on the container and children inherit it correctly' → FALSE, WebKit/Chromium inherit it (spec-violating) so children ALSO lose selection unless re-enabled; (3) '`::selection` color doesn't need contrast' → FALSE, must be ≥4.5:1; (4) 'generated `::before/::after` text is copyable' → FALSE, auto `none`.

### Q160 — iOS Safari edge-swipe-back vs horizontal gesture surfaces · 2026-08-30
- **Diagnosis:** on iOS Safari / Chrome-iOS (all WebKit) a horizontal swipe STARTING at the left/right screen edge = OS back/forward nav; it hijacks map pan, carousels, swipe-rows, horizontal pickers and drops the user out of the page mid-task.
- **Primary fix:** `overscroll-behavior-x: contain` — HONORED on iOS Safari 16.0+ (caniuse BCD: Safari 16.0–26.5 + iOS Safari 16.0+). The "Safari ignores overscroll-behavior" claim PREDATES iOS 16 (Sept 2022) = stale folklore, do not repeat it.
- **Critical caveat (the actual real-world failure):** `contain` stops the gesture reliably on `html`/`body`, but on an INNER scroll element alone it may NOT prevent OS nav → set it on the gesture surface AND on `html`/`body`/ancestors.
- **Fallback:** ~10px edge `touchstart` + `preventDefault()` deadzone (iOS 13.4+), bound to the specific surface, never `document`. `touch-action` does NOT fix OS nav (wrong layer). Never disable edge-back app-wide.
- **Flagged:** standalone-PWA "edge strip" behavior is SINGLE-SOURCE (needs Apple PWA-doc corroboration). Untestable on macOS (no desktop edge-swipe-back) → real-iPhone verification only.
- · SOURCE: MDN `overscroll-behavior-x` + caniuse BCD + SO#55574478 + SO#79843778 + Hotwire post · VERIFIED 6/8 groups on independent convergence + 1 cargo-cult resolved + 1 scope correction.
- **One-shot build checklist line:** any surface owning horizontal drag (map canvas, carousel, swipe-row, horizontal scroller/picker) → `overscroll-behavior-x: contain` on the surface AND on `html`/`body`; don't rely on `touch-action`; optional ~10px edge deadzone on that surface only; verify on a real iPhone.
- **Rejected (Q160):** (1) 'iOS Safari ignores `overscroll-behavior-x`' → STALE (pre-iOS-16 only); (2) 'contain on the inner scroller is enough' → FALSE, needs html/body too; (3) '`touch-action` stops edge-swipe-back' → FALSE, wrong layer; (4) 'disable edge gestures app-wide' → REJECTED, breaks expected back nav everywhere.

### Q124 — Virtualized / windowed long-list & table UX · 2026-08-29
- **CSS-first, not JS-first** — when the bottleneck is RENDER TIME of many offscreen elements (not DOM-node count), `content-visibility:auto` + `contain-intrinsic-size:auto <len>` on each list item skips layout/paint offscreen with ZERO JS; framework-agnostic (fits Hono/vanilla + Ghostway iPhone). Apply to each child, NEVER the scroll container (it needs full layout to position children). · WHY: teams grab react-window-style libs by reflex when one CSS property does it. · SOURCE: MDN `content-visibility` + `contain-intrinsic-size` PRIMARY. · VERIFIED: 7/7 on primary convergence. 2026-08-29.
- **`content-visibility:auto` keeps find-in-page + a11y** — MDN verbatim: skipped content 'must still be available as normal to find-in-page, tab order navigation… and must be focusable and selectable as normal'. The 'content-visibility breaks Ctrl+F' claim is FALSE; that failure is JS windowing (which unmounts nodes). `hidden`/display:none DO remove content from find-in-page → never use for perf, only `auto`.
- **`contain-intrinsic-size` mandatory + `auto none` in grid/multicol** — without it offscreen = 0px → scrollbar collapse + CLS; `auto <length>` remembers real size. A fixed intrinsic height in GRID/multi-column card lists overflows parents → use `auto none` there.
- **a11y for JS windowing only** — `aria-setsize`/`aria-posinset` + full-set keyboard nav apply to the JS path; MDN says UNNECESSARY when all items are in the DOM (no-op on the CSS path). `contentvisibilityautostatechange` = hook for per-row canvas/chart (Q28).
- **JS windowing only for true DOM-node-count / memory caps** (tens of thousands of rows, Ghostway iPhone): scroll container + full-height spacer + visible slice moved via `transform:translateY`; variable height → measurement cache + estimated size + OVERSCAN ~5 rows.
- **One-shot build checklist line:** for any long list/table (DM cockpit thousands of rows, Ghostway iPhone POI/route lists), prefer `content-visibility:auto` + `contain-intrinsic-size:auto <len>` on each item (never the container) when render time is the bottleneck — preserves find-in-page + a11y with zero JS; reserve JS windowing for DOM-node-count/memory caps; never `hidden`/display:none offscreen rows for perf.
- **Rejected (Q124):** (1) 'grab a JS virtualizer (react-window) first' → FALSE, prefer CSS `content-visibility:auto` when render time — not DOM count — is the bottleneck; (2) 'content-visibility breaks Ctrl+F / a11y' → FALSE, MDN PRIMARY verbatim — only JS windowing unmounts nodes; (3) 'use `hidden`/display:none to hide offscreen rows for perf' → FALSE, removes them from find-in-page/tab-order/selection; (4) 'content-visibility is evergreen' → FALSE, Baseline 'Newly available' Sept 2024 (graceful no-op where unsupported).

## Q140 — Trash / archive / soft-delete & restore UX · 2026-08-30
- **Three-tier reversibility ladder (extends Q38)** — pick by ACTION LIFETIME: seconds → undo snackbar (M3 defers actual delete until the snackbar timeout); days → Trash / "Recently Deleted" soft-delete; forever → hard-purge behind explicit confirm. The snackbar alone is NOT enough for user-authored records — it dies on navigation. · why: seconds-scale undo doesn't survive a record a user may want back days later · source: Apple HIG + M3 + freedesktop Trash Spec, 9/9 verified primary · 2026-08-30.
- **Archive ≠ delete** — archive = keep-but-remove-from-active-view (no countdown, indefinite, non-destructive, no confirm); trash = countdown-to-destruction. Never label one as the other; if it still counts toward totals/reports it is NOT deleted.
- **Per-entity soft/hard decision** — SOFT = user-authored records (records/leads/docs/tasks/comments, budget rows, saved places/routes); HARD-immediate = sessions/tokens/caches/counters; NEVER hard-delete real accounting/financial records (invoices, posted txns, audit/payment logs) — '7y' is an IRS safe-harbor, NOT a mandate; a budget CATEGORY is soft-deletable.
- **30-day retention + per-item countdown** — dominant industry convention (iOS Photos/Notes/iCloud/Gmail all 30d; Android-Go 7d / SharePoint 93d variance); adopt 30d default; show "Deleted N days ago · M days left", never a bare list.
- **Discoverable top-level Trash** — grouped-by-time (Today / Yesterday / This week / Earlier) + show ORIGINAL PATH (freedesktop Trash Spec Path + DeletionDate); restore-to-origin with pre-state captured before delete (if parent gone, say where, don't silent-rehome); restore auditable + ideally undoable.
- **GDPR honesty** — soft-delete is STILL processing (Art.5(1)(e)); don't claim "deleted" if recoverable; the READ-query is the enforcement point (deleted rows leaking into queries = bug).
- **One-shot build checklist line:** if the build has user-authored records/leads/budget rows/saved places (DM cockpit record/lead + audit, Open Finance budget/txn + tithing, Ghostway saved-place/route), give recoverable deletes a Trash/Recently-Deleted tier (not just a Q38 undo snackbar — the snackbar dies on navigation); archive ≠ delete; soft-delete per-entity (never hard-delete financial/accounting records); 30d default + visible per-item countdown; top-level discoverable Trash grouped-by-time showing original path; restore-to-origin with pre-state capture; Empty-Trash = type-to-confirm; soft-delete is still processing under GDPR (filter in the read-query).
- **Rejected (Q140)** — (1) "always soft-delete" → unbounded soft-delete = table bloat + GDPR exposure + leaked queries; per-entity decision required; (2) "undo replaces confirmation everywhere" (Q38 already bounds this; days-scale loss needs Trash, not a longer toast); (3) "83% reduction in accidental permanent deletion (Apple internal telemetry)" → FABRICATION from a content-farm page, do NOT distill; (4) "7-year retention mandate" → downgraded to IRS safe-harbor, not a single mandate; (5) "recycle bin = free audit trail" → deletion state ≠ content history (soft delete is not versioning).

### Q154 — Address/place search-as-you-type (geocoder autocomplete) for map PWAs · 2026-08-30
- **AbortController MANDATORY — proven stale-overwrite bug** — a fast typer can fire A→B→C and get C→B→A responses; always abort the in-flight request before issuing the next (mechanical scratch/q154_geocode_outoforder.mjs proves the bug). · WHY: stale results mislead the user into selecting the wrong place. · SOURCE: OSMF Nominatim policy + W3C APG Combobox (Q36) + 4 2nd-sources (Google, Stadia, Jawg, PickPoint, Rijwind). · VERIFIED: 7/7 primary + mechanical.
- **autocomplete ≠ forward-geocode** — these are DIFFERENT endpoints; Nominatim `/search` returns candidates, `/reverse` returns a place from coordinates. Don't conflate them.
- **Proximity bias + layer scope = top relevance lever** — bias results to the map viewport (`viewbox` param) + scope to relevant layers (street/address/POI) so the top result is locally relevant.
- **Debounce 200–300ms** — unify with Q36; the 300–350ms figure OVERSTATES vs provider defaults (100ms MapLibre/Stadia). Both < NN/g 1s.
- **OSS/self-host bias** — self-host a Nominatim region extract or use Photon (OSS, no runtime keys) for Ghostway's privacy-first field use; avoid Google/Mapbox geocoders that leak queries.
- **Manual-entry fallback** — always ship a typed address/ZIP field next to the search box (converges Q33 geolocation manual-entry rule); a camera scan is pure-vision → fails WCAG 1.1.1.
- **One-shot build checklist line:** if the build has a map PWA with destination/place search (Ghostway MapLibre nav flagship, DM cockpit customer-address lookup), wire a geocoder autocomplete with AbortController (proven stale-overwrite guard), debounce 200–300ms, bias to viewport + layer scope, self-host (Nominatim/Photon) for OSS/privacy, and always pair with a manual-entry fallback.
- **Rejected (Q154):** (1) 'skip AbortController, responses come in order' → FALSE, proven stale-overwrite bug; (2) 'use the forward-geocode endpoint for autocomplete' → FALSE, different endpoints; (3) '300–350ms debounce' → overstates vs provider defaults, unify at 200–300ms; (4) 'Google Geocoding API is fine for a privacy PWA' → FALSE, leaks queries, self-host instead.

### Q152 — Data-grid / ARIA grid semantics · 2026-08-30
- **grid vs table decision (APG):** use `role=grid` ONLY when cells are interactive/editable/arrow-navigable. Static data → native `<table>`. grid = composite widget = exactly ONE child in tab sequence. · WHY: upgrading static tables adds cost + the double-focus bug. · SOURCE: W3C APG Grid pattern PRIMARY + accessible-data-interfaces + CoreUI + UIAnatomy + SvGrid. · VERIFIED: 11/11 primary + mechanical roving test.
- **Roving tabindex single-tab-stop:** exactly one cell has `tabindex=0`, all others `-1`; arrow keys move focus AND reassign tabindex. NEVER `tabindex=0` on every cell (grid-contract violation). NEVER roving on native `<table>` (double-focus bug).
- **Data-grid keyboard contract (APG):** Right/Left/Up/Down = one cell, NO wrap in data grids; Home/End = row ends; Ctrl+Home/Ctrl+End = grid ends; PageUp/Down = author-defined row jump + scroll.
- **Selection keys (APG):** Ctrl+Space = column, Shift+Space = row, Ctrl+A = all, Shift+Arrows = extend; `aria-selected=true`.
- **ARIA structure (APG):** `role=grid` on container OR native `<table>` (no duplicate ARIA); `aria-rowcount`/`aria-colcount` = TOTAL (even virtualized); `aria-rowindex`/`aria-colindex` per cell (4.1.2). No `aria-rowspan`/`aria-colspan` on native table.
- **Two-mode edit nav (APG, converges Q88):** Enter/F2 enters edit, Esc returns to nav. Do NOT use `role=application`.
- **Virtualization sync (converges Q124):** `aria-rowcount`/`colcount` = backend totals; sync roving focus during scroll.
- **Header sort (converges Q78):** `aria-sort` on sorted header; header focusable only if functional.
- **Boundaries:** no-wrap = data grids only; grid escalation is real — keep `<table>` for static data; AT announce of row/col index = manual remainder (Q93).
- **Cargo-cult rejected:** "upgrade every →table to grid" (FALSE); "aria-rowspan/colspan on native table" (FALSE, use HTML); "role=application helps" (FALSE, kills SR mode).
- **Stack:** DM cockpit zero-dep record tables (roving + virtualization = flagship); OF txn/budget; Ghostway POI/route tables.
- **One-shot build checklist line:** if the build has a large interactive/editable record table (DM cockpit zero-dep flagship, OF, Ghostway), use `role=grid` + roving single-tab-stop + NO wrap arrow nav + Enter/F2/Esc edit modes + selection keys + `aria-rowcount`/`colcount` = backend totals (incl virtualized) + `aria-sort` on sorted headers; never roving on native `<table>`; never `role=application`.

### Q161 — @-mention / mention autocomplete in notes & comments · 2026-08-30
- **Combobox architecture (W3C APG):** role=combobox + aria-expanded + aria-controls + aria-activedescendant; focus STAYS in the text input; listbox/option list; Enter accepts. Converges Q36 search-suggest + Q50 command palette.
- **Zero-dep recipe:** a plain `<textarea>` + mirror-div (caret-anchored popup) + `Selection`/`Range` is enough — NO Lexical/Tiptap needed (hype rejected). Insert the token via `document.execCommand('insertText')` or a Range so native undo is preserved; whole-token backspace deletes it in one keypress.
- **Trigger regex** `(?:^|\s)@(\S*)$` with whitespace/start anchoring: correctly suppresses mid-word and email ("user@example.com") and trailing-space; only start/whitespace-anchored @ opens the menu.
- **Keyboard:** Enter or Tab inserts + preventDefault; Esc closes WITHOUT clearing prior input (APG). onMouseDown+preventDefault (not onClick) keeps focus when clicking a suggestion (Algolia recipe).
- **Async hygiene:** debounce 100–200ms + AbortController / monotonic-seq guard so out-of-order responses never show stale results (reconciles Q36 200–300ms / Q154 300–350ms as local-vs-remote, both < NN/g 1s).
- **IME guard** compositionstart/end retained (JP-fleet relevant). aria-autocomplete="list" (NOT "both"=inline ghost) for mentions.
- **Boundary:** a textarea mention is an OPAQUE string ("@username "), NOT a semantic entity — true mention entities (clickable, removable, styled) need contenteditable + atomic `<span>`; plain-textarea mentions can't be re-parsed as entities.
- **When-NOT:** short plain-text fields with no mention need; don't bolt a combobox onto a one-line note.
- **One-shot build checklist line:** if the build has inline @-mention in notes/comments (DM cockpit Hono+SQLite zero-dep quality notes / record comments, Ghostway saved-place/route notes iPhone field, Open Finance txn memo), use a WAI-ARIA combobox over a plain textarea + mirror-div (zero-dep, no framework), trigger on `(?:^|\s)@(\S*)$`, insert as an atomic token via insertText (native undo preserved), debounce 100–200ms with a monotonic-seq/AbortController cancel, onMouseDown (not onClick) to keep focus, Esc closes without clearing input, aria-autocomplete="list"; true mention entities need contenteditable + atomic span, not a textarea string.
- **Rejected (Q161):** (1) "mentions need Lexical/Tiptap" → FALSE, plain textarea+mirror-div+Selection is zero-dep and works (APG combobox is framework-agnostic); (2) "@ anywhere triggers" → FALSE, mid-word/email @ must be suppressed (whitespace-anchor the regex); (3) aria-autocomplete="both" for mentions → FALSE, that's inline ghost-completion; mentions want "list"; (4) onClick to insert suggestion → FALSE, steals focus (use onMouseDown+preventDefault).

### Q162 — Virtual scrolling / list windowing UX · 2026-08-30
- **CSS-first, confirmed + currency refined (extends Q124):** `content-visibility:auto` + `contain-intrinsic-size:auto <len>` on each row preserves find-in-page + a11y with zero JS; it is Baseline 'Newly available' ~Sept 2025 (Chrome 85+ / FF 125+ / **Safari 18+ / iOS Safari 18+**). Older iOS (<18) SILENTLY IGNORES the property → safe graceful degrade, not a breakage (Ghostway iPhone fine on iOS 18+). MUST pair `contain-intrinsic-size` or offscreen rows collapse to 0px and CLS jumps to ~0.4 (solid-web measured 0.02→0.4). Apply to rows, never the container; never above-the-fold (LCP, Q35).
- **CSS skips hit-testing offscreen → interactive grids need JS windowing** — `content-visibility:auto` skips hit-testing of offscreen content, so offscreen rows carrying focusable CONTROLS can become unclickable though still in the a11y tree. Static/read-only lists: CSS path is enough. Interactive grids (DM cockpit editable/action rows): use JS windowing with a focus-pin.
- **Focus-pin (JS windowing):** never unmount the focused/selected row — PIN it in the DOM when scrolled out (else focus → `<body>`, converges Q144); defer `focus()` to `rAF` after the row recycles into view; prefer native roving focus (tabindex=0 active / -1 siblings) over `aria-activedescendant` (more robust cross-browser, accessible-data-interfaces PRIMARY). `aria-setsize`/`aria-posinset` + descendant-neutralization + scroll restoration for an ARIA listbox upgrade (Q84).
- **Thresholds/perf = conventions:** `<200 don't / >1000 do` varies by source (100/200/500/1000) → guidance not law; use `rAF` + passive listeners + memoized render for INP (Q141); pair windowing with an IntersectionObserver sentinel (Q37/Q49).
- **One-shot build checklist line:** for any long list/table (DM cockpit thousands of Hono+SQLite rows, Ghostway iPhone POI/route lists, OF txn lists) → prefer `content-visibility:auto` + `contain-intrinsic-size:auto <len>` per row (Safari 18+/iOS 18+ supported; older iOS degrades safely) when render time — not DOM count — is the bottleneck; reserve JS windowing (spacer + translateY slice + focus-pin + roving focus) for true DOM-count/memory caps AND for offscreen focusable controls; never use `hidden`/display:none for perf; never put `content-visibility` above the fold (LCP).
- **Rejected (Q162):** (1) 'content-visibility unsupported on iOS' → FALSE, Safari 18+/iOS 18+ ship it; older iOS just ignore it safely; (2) 'content-visibility breaks find-in-page/a11y' → FALSE (only JS windowing unmounts nodes; MDN PRIMARY verbatim); (3) 'CSS virtualization handles interactive offscreen controls' → FALSE, it skips hit-testing → JS windowing focus-pin required for offscreen focusable rows; (4) 'aria-activedescendant is the robust focus model for windowing' → FALSE, native roving focus is more cross-browser-robust (accessible-data-interfaces PRIMARY); (5) 'hard 200/1000-row windowing threshold' → FALSE, convention varies by source.

### Q127 — Progress indicators / progress-bar UX · 2026-08-29
- **Determinate vs indeterminate by the 10s-stall rule** — determinate %-bar when quantifiable (bounds anxiety; Apple HIG + M3 prefer it over spinners); indeterminate only to confirm activity when remaining is unknown; past ~10s users assume death (NN/g 2026, 1993 3-limit). · WHY: reflex spinner even when a count is known. · SOURCE: NN/g + W3C APG + MDN. · VERIFIED 12/12 primary + 2nd-source ×3.
- **Prefer native `<progress>`** — Baseline, implicit role=progressbar, stylable; ARIA role=progressbar only when native won't do; accessible NAME mandatory (in-tag text ≠ label); omit aria-valuenow when indeterminate; aria-busy on the region until done.
- **Announce completion ONCE, never every tick** — separate polite live region for "Done"; never aria-live on the bar (floods SR); throttle streaming aria-valuenow 250–500ms. Converges Q144/Q84.
- **Label + estimate, single fill, 3:1, reduced-motion** — name op + realistic estimate; one fill color; non-text contrast ≥3:1 (mechanical 4 palettes 4.19/7.63/3.93/3.10 PASS); wrap motion in prefers-reduced-motion:no-preference (looping indeterminate >5s can trip 2.2.2 Pause/Stop/Hide unless essential).
- **Cancel + non-blocking + never fake** — cancel affordance; non-blocking over modal (Q61); never fake a 0% or pad the bar (status region, Q14); Skeleton→Progress→Toast chain (uianatomy), Skeleton≠Progress.
- **One-shot build checklist line:** if the build has long-running work (DM cockpit CSV/PDF export, OF report gen, Ghostway offline-tile/sync) → determinate %-bar when quantifiable, indeterminate only when unknown (10s-stall); prefer native `<progress>` + accessible name; omit aria-valuenow when indeterminate; aria-busy on region; announce completion ONCE via separate polite live region (never aria-live on bar); throttle streaming valuenow 250–500ms; single fill + ≥3:1 + reduced-motion; offer cancel; non-blocking over modal; never fake (use status region); Skeleton≠Progress.
- **Rejected (Q127):** (1) 'circular always better on mobile' → NO primary (space/peripheral choice; only CHI'22=OHMD); (2) 'update aria-valuenow every tick' → FALSE, floods AT (separate region + throttle 250–500ms); (3) 'indeterminate spinners fine 30s+' → FALSE (10s-stall); (4) 'fake/padded bar to feel fast' → FALSE (status region).

### Q165 — Progress-indicator / busy & loading-state component UX · 2026-08-30
- **Choose indicator by MEANING (extends Q127)** — determinate bar/ring when a fraction is computable (bytes/total, step N of M); indeterminate spinner/shimmer when latency unknown; skeleton when layout is known but content pending (Q164); inline-button-busy for sub-second action buttons. Never a determinate ring for an indeterminate wait. Honesty: unknown completion → indeterminate; switch to determinate ASAP once an estimate exists; avoid a stuck-at-99% cliff (reserve buffer for finalize).
- **Start at 1% not 0%, monotonic** — determinate value begins at 1% to signal "begun", never decreases (Utah DS; convention).
- **Label ABOVE bar + meaningful text** — show value as % or "N of M" paired with a real op name ("Uploading invoice PDFs", "23 of 120 records"), not a bare %; label above (Utah).
- **1.4.11 ≥3:1 non-color signaling** — track vs fill meet WCAG 1.4.11 Non-text Contrast ≥3:1; pale fills FAIL (mechanical scratch/q165_contrast.mjs: #cfe2ff-on-white 1.31:1 FAIL); distinguishable without color alone (converges Q17).
- **Region-busy aria contract** — indicator describing a page REGION: set `aria-busy="true"` + `aria-describedby="progressbar-id"` on that region until done; do NOT put aria-live on the bar; announce status/completion ONCE via one separate live region (converges Q127/Q164/Q84). Indeterminate: OMIT aria-valuenow + aria-busy=true (W3C spec verbatim).
- **Inline button-busy (sub-second)** — Save/Submit/Export show the button's own busy state (spinner inside + disabled/aria-busy + retained "Saving…" label) for sub-second actions; keep the accessible name stable; use a determinate BAR only for measurable multi-second progress (export/upload) — that's Q86 long-job territory (converges Q52/Q159).
- **Bar vs ring** — linear for horizontal ranges/forms; circular/ring for compact/bounded (avatars, tiles); never a determinate ring for indeterminate; same aria contract both.
- **One-shot build checklist line:** if the build has progress/busy UI (OF budget/tithing bars + export, DM cockpit CSV/PDF export + sync, Ghostway offline-tile download + cancel) → choose indicator by MEANING (determinate % when computable / indeterminate spinner when unknown / skeleton when layout-known / inline-button-busy for sub-second Save); native `<progress>` preferred; role=progressbar + accessible name; OMIT aria-valuenow when indeterminate (aria-busy=true); start at 1% monotonic; label above + meaningful text; 1.4.11 ≥3:1 non-color; region aria-busy + aria-describedby + ONE separate live region announce-once; reduced-motion for indeterminate anim; bar-vs-ring same contract; never fake % (99%-cliff).
- **Rejected (Q165):** (1) 'indeterminate bars fine forever' → FALSE, minimize + transition to determinate (Utah); (2) 'always show a %' → FALSE for unknown-duration (omit aria-valuenow, APG); (3) 'skeleton = progress' → FALSE, distinct (Q164); (4) 'animate progress to look alive' → FALSE, only indeterminate anim + reduced-motion; (5) 'color-only fill/track' → FALSE (1.4.11).

### Q137 — Translucency / glass surfaces + prefers-reduced-transparency · 2026-08-30
- **Base-opaque authoring order is the sole safeguard** — author an OPAQUE base, add translucency only inside `@media (prefers-reduced-transparency: no-preference)`; an unknown media feature forces the whole query FALSE, so unsupported engines keep the opaque fallback. Safari/WebKit (incl 26.5) + Firefox DON'T implement prefers-reduced-transparency — only Chrome/Edge 118+ do, so on Ghostway iPhone the media query never matches (webkit bug); base-opaque order is the only real protection.
- **Worst-case-backdrop contrast** — text over glass must pass WCAG 1.4.3 against the REAL composited backdrop (live map tiles, photo hero), not the mock; fix with a solid tint/plate layer, NOT by raising blur (converges Q142/Q3/Q60/Q114).
- **Compositing-isolation trap (extend web-platform-quirks Q21)** — ancestor `opacity<1` / `filter` / `mix-blend-mode` / `mask` / `clip-path` becomes a NEW Backdrop Root, so `backdrop-filter` samples the ancestor, NOT the page behind; `transform:translateZ(0)` is SAFE (not a root trigger); `@supports (backdrop-filter: blur(1px))` gate with higher-alpha opaque fallback outside.
- **Blur cost budget** — cost ∝ area×radius×count; cap radius ~12–16px, keep ≤few simultaneous surfaces, never full-viewport blur, never animate blur radius (mechanical: full-viewport = 5.1× a small panel).
- **One-shot build checklist line:** if the build uses glass/translucency (DM Astro glass nav/cards, Ghostway translucent panels over live map, DM cockpit sticky toolbar, OF web tier) → author opaque base + `@supports` gate with opaque fallback, protect text with a solid plate over the worst-case backdrop, cap blur radius ~12–16px + ≤few surfaces, NEVER full-viewport/animated blur, and DON'T rely on `prefers-reduced-transparency` (Safari/Firefox don't ship it — base-opaque order is the safeguard); avoid ancestor `opacity/filter/mix-blend/mask/clip-path` over the blurred element (compositing-isolation trap).
- **Rejected (Q137):** (1) 'blur fixes contrast' → FALSE, only obscures; raise a solid text-plate alpha instead; (2) 'full-viewport frosted hero' → wasteful + worst perf; (3) 'alpha≥0.7 = contrast floor' (Q142's amended rule) → hue/backdrop-dependent, not a hard floor; (4) 'prefers-reduced-transparency is cross-browser' → FALSE, Chrome/Edge 118+ only.

### Q138 — Micro-typography & line-break quality · 2026-08-29
- **EXTENDS Q126 (text-wrap balance/pretty/stable)** — `hyphens: auto` is NOT automatic — it REQUIRES a `lang` attribute + leaves break points to the engine (tune `hyphenate-limit-chars`); without `lang` it does nothing. `hanging-punctuation` = Limited-availability + DECORATIVE-ONLY (MDN) — progressive enhancement only, never for legibility. `widows`/`orphans` CSS = FRAGMENTATION (page/region/column) ONLY, per MDN 'top of a page, region, or column' + Limited-availability → using them for on-screen orphans is a misapplication (busts cargo-cult). `avoid-orphans` text-wrap-style value 'not yet supported in any browser' (MDN) → use `pretty` not `avoid-orphans`.
- **balance = short-blocks-only** — MDN verbatim: 'six or less Chromium / ten or less Firefox'; headings/captions/blockquotes; `*{balance}` no-op past cap + waste. `pretty` = body-copy ('negative effect on performance... longer blocks'); targets trailing orphans. `stable` = contenteditable. `silent-ignore` = progressive-enhancement (MDN Baseline 2024; no `@supports` gate). NBSP/&shy; deterministic. Caps + letter-spacing ~0.02–0.08em = convention. Don't balance animating text = sound.
- **Boundary:** pretty perf cost real on long copy; balance no-op past cap; CJK balance can worsen (converges Q75). 'pretty = last 4 lines' Chrome scope = blog-tier convention; per-engine pretty dates + letter-spacing em range = convention.
- **One-shot build checklist line:** if the build has hero/heading rags or narrow titles (DM Astro flagship, Ghostway iPhone POI/route narrow titles, DM cockpit card/table headings, OF web tier) → extend Q126: add `hyphens: auto` ONLY with a `lang` attr + tune `hyphenate-limit-chars`; don't use `widows`/`orphans` for on-screen orphans (fragmentation-only); `hanging-punctuation` = Limited-availability decorative-only; use `pretty` not `avoid-orphans` (unshipped).
- **Rejected (Q138):** (1) 'balance fixes full paragraphs' → FALSE (capped 6/10 lines); (2) 'hyphens:auto works without lang' → FALSE (needs lang attr); (3) 'use widows/orphans for on-screen orphans' → FALSE (fragmentation-only); (4) 'hanging-punctuation is safe/reliable' → FALSE (Limited-availability, decorative); (5) 'avoid-orphans text-wrap-style is usable' → FALSE (unsupported anywhere).

### Q139 — Field/RUM UX-performance instrumentation + INP attribution · 2026-08-29
- **INP is FIELD-ONLY — Lighthouse lab CANNOT measure it** — INP is observed from real users via CrUX field data, never a lab trace; Q23's Lighthouse gate has a hard responsiveness ceiling (TBT = lab proxy only). · WHY: lab-only teams falsely ship "green" responsiveness while real iPhone field taps lag. · SOURCE: web.dev INP (2025-09-02) + web.dev field-measurement best-practices + GoogleChrome/web-vitals PRIMARY. · VERIFIED: 10/10 primary + 4 independent 2nd-sources.
- **p75 thresholds: Good ≤200ms / Needs-improvement 200–500ms / Poor >500ms** — post-2024; older 100/300 blogs are STALE → cargo-cult trap. INP = worst-interaction latency = inputDelay + processingDuration + presentationDelay; p75 + outlier-trim (1 per 50 interactions); 'average INP' is meaningless.
- **web-vitals/attribution breakdown = the core deliverable** — `interactionTarget` selector + `interactionType` (pointer/keyboard) + 3 phase durations; sendBeacon on `visibilitychange`/`pagehide`. 50ms long-task cutoff converged (Q141 owns the fix).
- **Myth-busts:** (1) 'scheduler.yield everywhere' → FALSE, Safari iPhone (incl 26.5) STILL does not implement `scheduler.yield` → the `setTimeout(0)` fallback is the LIVE Ghostway path; (2) 'web workers fix INP' → FALSE, compute-only not DOM; (3) 'Lighthouse 96 = responsive' → FALSE, INP is field-only (TBT proxy only); (4) 'debounce everything' → FALSE, hides one long task.
- **Boundary:** true field test needs web-vitals + RUM endpoint (self-host for OSS bias) — NOT scratch-reproducible (no browser); verified via web.dev PRIMARY (spec-authoritative).
- **One-shot build checklist line:** if the build has responsive surfaces (DM Astro LCP/CLS revenue, Ghostway MapLibre PWA INP on iPhone field taps, DM cockpit Hono+SQLite filter/sort/table INP, OF web tier) → measure INP via web-vitals field data (CrUX), NOT Lighthouse lab; report p75 + attribution breakdown (selector + type + 3 phases); sendBeacon on pagehide; self-host the RUM endpoint for OSS bias.
- **Rejected (Q139):** (1) 'Lighthouse lab INP = real responsiveness' → FALSE, INP is field-only, lab TBT is only a proxy; (2) 'average INP is the metric' → FALSE, use p75 + outlier-trim; (3) 'scheduler.yield is the way' → FALSE, Safari iPhone doesn't ship it → setTimeout fallback; (4) 'web workers fix INP' → FALSE, only for pure compute not DOM work.

### Q141 — INP remediation / main-thread yielding & responsive-handler design · 2026-08-30
- **A LONG TASK = >50ms on the main thread** (web.dev PRIMARY); the blocking period = total − 50ms. Any handler path that can exceed 50ms on a mid/low-tier phone must be chunked.
- **Paint-first handler shape** — INP stops counting at the next paint → in a click handler do (a) the minimum state change that produces visible feedback, (b) yield, (c) then the expensive work (save/network/analytics/re-render). web.dev's `saveSettings()` (5 functions = ONE task, user sees nothing until all finish) is the canonical anti-pattern.
- **Yield-API ladder** — `scheduler.yield()` (resumes at the FRONT of the queue → yield often without throughput penalty) > `scheduler.postTask({priority:'background'})` for genuinely low-priority work > `setTimeout(...,0)` fallback (resums at the BACK of the queue → correct but slower overall, so yield LESS often on the fallback path). Ship a 3-line `yieldToMain()` feature-detect helper; never hand-roll priority.
- **CRITICAL: Safari/iOS 26.5 STILL does NOT implement `scheduler.yield`** (caniuse + webperfclinic CONFIRM — throws TypeError if unguarded) → the `setTimeout(0)` fallback is the LIVE Ghostway iPhone path, INVERTING "just use scheduler.yield".
- **Chunk on a TIME budget, not a row count** — `performance.now()` against ~50ms, NOT "every 50 rows" (mechanical scratch/q141_yield.py: fixed-every-50-rows = 94ms long task that violates the budget; time-budget = 61.5ms cap).
- **Defer non-urgent boot work** — `requestIdleCallback` for analytics/heatmaps/third-party (Safari unsupported → `setTimeout` shim) or lazy-import.
- **Myth-busts:** (1) 'scheduler.yield everywhere' → FALSE, Safari iPhone doesn't ship it; (2) 'setTimeout(0) is the way' → outdated, and yielding often on setTimeout makes total job time noticeably worse; (3) 'Lighthouse 96 = responsive' → FALSE, INP is field-only (TBT proxy only, Q139); (4) 'web workers fix INP' → FALSE, compute-only not DOM work; (5) 'debounce everything' → FALSE, hides one long task at the end.
- **One-shot build checklist line:** if the build has responsive surfaces (DM cockpit Hono+SQLite filter/sort/table INP, Ghostway MapLibre PWA marker/route recompute on tap, OF web tier, DM Astro third-party boot) → use the paint-first handler shape (min state change → yield → heavy work); chunk list/table render on a TIME budget (~50ms) not a row count; feature-detect `scheduler.yield` with `setTimeout(0)` fallback (Safari/iPhone live path); defer boot work to `requestIdleCallback`/lazy-import.
- **Rejected (Q141):** (1) 'use scheduler.yield everywhere' → FALSE, ignores Safari/iPhone reality; (2) 'setTimeout(0) is the way to break up tasks' → outdated; (3) 'Lighthouse 96 = responsive' → FALSE, INP field-only; (4) 'web workers fix INP' → FALSE, only for pure compute; (5) 'debounce everything' → FALSE, still one long task at the end.

### Q128 — Third-party embed / iframe UX · 2026-08-29
- **`title` on every iframe is mandatory** — WCAG H64 / 4.1.2: without a descriptive `title` the SR announces only "frame" with zero context; the Q23 axe `frame-title` rule enforces it. Never ship an unlabeled embed.
- **Facade, not just `loading="lazy"`, for heavy embeds** — YouTube/map/social/chat need a placeholder + load-on-interaction (web.dev third-party-facades); `lazy` alone leaves the third-party SCRIPT blocking the main thread and blowing LCP (DM Astro's #1 LCP/TBT liability).
- **Sandbox + minimal `allow` tokens + `referrerpolicy`** — grant only the specific tokens the embed needs (HTML sandbox token table); over-permissive = XSS/clickjacking. Reserve width/height or `aspect-ratio` to prevent CLS (converges Q35/Q79). Consent-gate tracking embeds (Q72) but load content embeds independently. Cap an embed budget + defer non-critical. Always provide a link/static fallback for CSP / ad-block / no-JS / consent-denied.
- **One-shot build checklist line:** any third-party embed → give EVERY iframe a descriptive `title` (axe `frame-title`); use a FACADE (placeholder + load-on-interaction) for heavy embeds, not `loading="lazy"` alone; set `sandbox` + only the `allow` tokens needed + `referrerpolicy`; reserve width/height or `aspect-ratio` to prevent CLS (Q35); consent-gate tracking embeds (Q72) but load content embeds independently; cap an embed budget + defer non-critical; ALWAYS provide a link/static fallback.
- **Rejected (Q128):** (1) 'iframes don't need a title' → FALSE (WCAG H64/4.1.2); (2) 'loading=lazy fixes third-party embed perf' → FALSE (script still blocks main thread); (3) 'sandbox optional for trusted embeds' → FALSE (least-privilege allow); (4) 'ship an embed with no fallback' → FALSE (CSP/ad-block/no-JS break it).

### Q146 — Text selection & copy-friendliness of UI data · 2026-08-30
- **`user-select: none` belongs ONLY on interactive chrome** (buttons, tabs, toolbar labels, drag handles, nav pills, decorative glyphs). NEVER on content: article/body text, error messages, form results, code, IDs, amounts, addresses, log output. Blanket `* { user-select: none }` is the canonical failure (broad harm, zero benefit).
- **It inherits.** `none` on a parent silently disables every descendant. Apply at the leaf control and use `user-select: text` explicitly to re-enable inside a `none` container (drag-handle rows containing copyable data = the exact DM-cockpit/Ghostway case).
- **`user-select: none` also kills `::selection`** for that subtree — no visual highlight at all. It breaks a11y/translate/TTS/dictionary extensions that operate on the selection for low-vision, dyslexic, and non-native-English users. It is NOT content protection (DevTools defeats it in seconds) → never ship it as anti-scraping.
- **Copyable-data floor for dashboards:** identifiers, phone numbers, addresses, amounts and log output must be selectable AND round-trip cleanly (no zero-width/ellipsis chars inside the copied string — truncation must not truncate the DOM text, only the visual box; tabular column padding must not inject stray characters).
- **`::selection` styling must keep ≥4.5:1 text-on-selection contrast** and must be re-verified in BOTH themes — a custom brand-tinted selection color is a common invisible-text bug; forced-colors mode overrides it entirely.
- **To keep decorative glyphs out of the clipboard**, put them in CSS `::before/::after` generated content (not DOM text) — generated content is excluded from normal `Selection.toString()`/clipboard paths.
- **`user-select: all`** (one click selects the whole element) is a trap for partial-copy needs — prefer an explicit copy button over `all`; reserve `all` for atomic quotes/tokens meant to be copied whole.
- **Mobile conflict:** on iOS WebKit, `user-select: none` breaks `caretRangeFromPoint` and `selectstart` never fires for long-press selection → do NOT try to arbitrate long-press-select vs long-press-action in JS on iOS; make the app's long-press action live on a distinct affordance (kebab) and leave text selection native.
- **Cargo-cult busted:** "disable selection to protect content" (still widely posted, including framework docs recommending global `user-select:none` + `contextmenu` preventDefault) — zero protection, real harm; treat any global selection/context-menu kill as a defect.
- **One-shot build checklist line:** if the build has data surfaces (DM cockpit record tables/log panes, Ghostway POI/route + coordinates, OF txn/account ledgers, DM Astro code blocks) → audit `user-select:none` usage (move to leaf chrome only, re-enable with `user-select:text` on data containers), verify `::selection` contrast ≥4.5:1 in both themes, put decorative glyphs in `::before/::after` generated content, never use `user-select:none` as anti-scraping.
- **Rejected (Q146):** (1) 'disable selection to protect content' → FALSE (DevTools defeats it, zero protection, real harm); (2) 'user-select:none is fine on data panes' → FALSE (breaks copy, a11y, translate/TTS); (3) 'user-select:all is the easy copy solution' → FALSE (trap for partial-copy needs, use a copy button); (4) 'global contextmenu preventDefault is standard' → FALSE (breaks long-press native selection on iOS).
- · MDN `user-select` + CSS-Tricks/OpenReplay/browser-selection-tostring-and-pseudo-content + readest commit · 8/8 verified on primary convergence. 2026-08-30.

### Q147 — Native Popover API + CSS Anchor Positioning · 2026-08-30
- **Top layer by default.** `popover` (or `popover="auto"`) promotes the element to the browser top layer → escapes `z-index` wars AND `overflow:hidden`/`overflow:clip` ancestors. Replaces the portal + z-index-9999 pattern LLM-generated dashboards default to (converges Q21 z-index hygiene, Q112 overflow clipping).
- **Free behavior (do NOT hand-roll):** `popover="auto"` gives light-dismiss (outside click), Esc close, one-auto-popover-at-a-time (nested auto popovers exempt), toggle from a single `popovertarget` button, and focus RETURN to the invoker on Esc-close. Rule: delete custom click-outside / Esc / z-index / focus-return code when using popover.
- **Popover is a display mechanism, NOT a role.** `popovertarget` sets up an implicit `aria-details` + `aria-expanded` relationship, but `aria-details` SR support is historically weak. You MUST still add `role="menu"`/`"dialog"`/`"tooltip"` per Q43/Q53/Q61 and manage `aria-expanded` manually — popover alone satisfies no ARIA role contract.
- **Mode choice:** `auto` = menus/dropdowns/pickers (light dismiss, closes others); `manual` = toasts/persistent panels (no light dismiss, multiple open, Esc still closes); `hint` = hover tooltips (light dismiss but does NOT close open auto popovers).
- **iOS CRITICAL (WebKit bug 267688): outside-tap does NOT light-dismiss popover on affected Safari iOS versions.** Ghostway map-overlay popovers MUST ship an explicit, visible Close button (also serves touch users without Esc). Do not rely on free light-dismiss as the only dismissal path on iPhone.
- **Anchor positioning = 3 lines of CSS, not a library.** Trigger gets `anchor-name: --x`; floating element gets `position: absolute` (mandatory) + `position-anchor: --x` + placement via `position-area` (3×3 grid keywords) or `anchor(<side>)`. Browser re-resolves on scroll/resize with NO scroll listener. Popover+invoker pairs create an IMPLICIT anchor reference (no `anchor-name` needed).
- **Overflow fallback is mandatory:** `position-try-fallbacks: flip-block, flip-inline` = declarative viewport-collision flipping. Every anchored popover MUST declare at least `flip-block` or it clips on an iPhone (Ghostway / DM mobile).
- **UA-default reset:** `[popover]` ships UA styles (centered `inset`, margin, border, `display:none` when closed) → anchored popovers need `inset: auto; margin: 0` before anchor placement takes effect.
- **Animation:** transitions need `@starting-style` + `transition-behavior: allow-discrete` + `overlay` for the discrete display/top-layer properties. Popovers have NO backdrop by default and the page stays interactive (unlike modal `<dialog>`) — cross-ref Q61 modal decision.
- **Support gate / progressive enhancement:** Popover API = Baseline (Chrome/Edge 114+, Safari 17+, Firefox 125+; Baseline-wide since ~Apr 2025) → SAFE TO SHIP NOW. Anchor positioning = Chrome/Edge 125+, Safari 26+, Firefox 147+ → re-verify at date, gate regardless. Recipe: popover unconditionally + anchor positioning inside `@supports (anchor-name: --a)`, with a static/centered fallback for older browsers.
- **Cargo-cult busted:** "replaces Floating UI / no JS needed" holds only for Chromium + Safari-26+ users today; Firefox users get the fallback path. `manual` is NOT the right mode for tooltips — MDN's hover-tooltip mode is `hint`, and Q43 still requires the WCAG 1.4.13 dismissible/hoverable/persistent contract, which popover alone does NOT satisfy.
- **One-shot build checklist line:** if the build has dropdowns/menus/tooltips/filter panels (DM cockpit row kebab menus + filter panels, Ghostway map control popovers, OF web tier, DM Astro nav dropdowns) → use native `popover` + `popovertarget` (Baseline, ship now) + anchor positioning inside `@supports (anchor-name: --a)` with static fallback; add explicit role + aria-expanded; ship visible Close button (iOS light-dismiss bug); declare `position-try-fallbacks: flip-block`; reset `inset: auto; margin: 0`.
- **Rejected (Q147):** (1) 'popover satisfies the menu/dialog role by itself' → FALSE (display mechanism only, must add role + aria-expanded); (2) 'light-dismiss works on iOS Safari' → FALSE (WebKit bug 267688, must ship Close button); (3) 'manual mode is right for tooltips' → FALSE (MDN hover-tooltip mode is `hint`); (4) 'anchor positioning is safe without @supports gate' → FALSE (Firefox lags, gate with fallback).
- · MDN Popover API + MDN CSS Anchor Positioning PRIMARY + 2026 2nd-source convergence + caniuse BCD · 11/11 verified. 2026-08-30.

### Q168 — WebGL / Three.js 3D scene interaction UX · 2026-08-30
- **Canvas is AT-opaque — ship an equivalent HTML representation** — a `<canvas>` renders pixels: no DOM, no ARIA, no focus targets. Any 3D scene that CONVEYS info or ENABLES action needs an equivalent HTML representation (data table / list / labeled controls). `alt="3D visualisation"` is the canonical useless failure; WCAG 1.1.1 text alternative = equivalent PURPOSE, not a literal polygon inventory.
- **Keyboard camera path is NOT free (OrbitControls correction)** — OrbitControls keyboard = PAN ONLY (arrow keys via `listenToKeyEvents`; `keyPanSpeed` 7px/key); ROTATE (orbit) + DOLLY (zoom) are pointer-only by default → the "arrow-key orbit, +/- dolly" claim is FALSE. Author MUST add custom key handlers for rotate+zoom; WCAG 2.1.1 still demands a keyboard-operable camera path, so the rule's intent holds but the mechanism must be hand-built. Expose `reset()` (target0/position0/zoom0) via a visible "Reset view" button.
- **Reduced-motion = designed snapped cuts, not slowdown** — `@media (prefers-reduced-motion: reduce)` → instant/snapped camera moves instead of eased fly-to, pause ambient loops, kill pointer parallax, reveal final state immediately (converges Q12/Q57). Render-on-demand: only render frames on change — no continuous RAF loop.
- **Perf budget + dpr cap** — manual `devicePixelRatio` scaling, cap at 2 (`dpr={[1,2]}`) — on 3x phones higher burns GPU for zero gain; never blind `renderer.setPixelRatio(window.devicePixelRatio)`. InstancedMesh for repeated geometry; cap draw calls + texture size (converges Q109 hardware gating).
- **WebGL CONTEXT-LOSS is a frequent mobile failure** — handle `webglcontextlost` (`preventDefault`) + `webglcontextrestored` (rebuild); show graceful "3D unavailable / tap to retry" state, never a frozen black canvas (converges Q98 crash resilience, Q81 dead-end).
- **Touch hygiene on scrollable/iPhone pages** — default one-finger rotate can hijack vertical scroll; scope 3D interaction to the canvas, two-finger for zoom/pan, never make 3D the ONLY info path (Q27 2.5.1 cooperative gestures; Q166; Q115 keyboard).
- **Never draw TEXT/UI INTO the canvas** — canvas text becomes pixels: loses copy/paste, find-in-page, SR, zoom, autofill; use DOM `<div>` overlays / CSS2DRenderer positioned by projection, kept in the a11y tree (converges Q146 copy, Q99 truncation).
- **Decorative vs informative split** — purely decorative 3D → concise label or `aria-hidden` if adjacent HTML carries the message; informative/actionable 3D → equivalent + operable controls + exposed current state (selected object focusable). Color-only encoding fails color-blind users → shape/label legend (converges Q17). Prefer colorblind-safe colormaps (viridis/cividis) for data (converges Q3/Q114).
- **Linked dual representation** — 3D view + HTML equivalent = TWO VIEWS of ONE model; interaction in one updates the other. Announce 3D state changes via `aria-live` at a THROTTLED cadence, never per-frame.
- **One-shot build checklist line:** any 3D/WebGL surface (DM Astro Three.js hero/showcase, OF web 3D viz, any canvas viz) → canvas is AT-opaque so ship an equivalent HTML representation (WCAG 1.1.1 = purpose, not polygon count); real HTML camera controls + custom keyboard rotate/zoom (OrbitControls keyboard = pan-only by default) + visible Reset-view; reduced-motion = snapped cuts not slowdown + render-on-demand; cap setPixelRatio at 2; handle webglcontextlost/restored with retry state; never draw text/UI into canvas (DOM overlays/CSS2DRenderer); decorative-vs-informative split + colorblind-safe colormaps; throttled aria-live for 3D state.
- **Rejected (Q168):** (1) '3D improves everything' → FALSE (3D body-text/nav is an a11y + readability disaster, Q18); (2) 'arrow-key orbit + +/- dolly works out of the box' → FALSE (OrbitControls keyboard = pan only; custom handlers required); (3) 'HTML-in-Canvas Chrome origin-trial is shippable today' → FALSE (bleeding-edge, not current); (4) 'draw labels/text into the canvas for crispness' → FALSE (kills copy/find/SR/zoom/autofill).

### Q169 — Lightbox / fullscreen media-viewer overlay UX · 2026-08-31
- **Native `<dialog>.showModal()` is the foundation** — it gives focus trap, Esc dismissal, `aria-modal` and top-layer for free (converges Q131/Q61). Don't hand-roll a div-overlay focus trap.
- **Focus return to the trigger thumbnail is the #1 lightbox a11y failure** — store the activating element, `focus()` it on close (APG + MDN). Without it keyboard/SR users land at the top of the page and lose the gallery position (converges Q144).
- **Never Esc-only dismissal** — ship a visible, labeled Close button (touch-size per Q8) plus backdrop-click; Esc is an accelerator, not the affordance.
- **Prev/Next = real buttons + Arrow keys + a live slide counter** — announce "3 of 12" through one polite live region, not per-frame; disable/hide at the ends rather than silently no-oping (converges Q48/Q84).
- **Alt text is CONTENT here, not decoration** — in a media viewer the image IS the payload, so every item needs a meaningful alt/caption (WebAIM Million: >55% of images miss alt).
- **User-triggered only** — never auto-open a lightbox on load or scroll. Boundary correction: WCAG 3.2.5 Change on Request is **Level AAA**, so auto-open is an AAA + UX failure (NN/g Overuse of Overlays), *not* an AA audit failure — still ban it, but don't mislabel it in an OF AA report.
- **Sizing/zoom numbers are convention, not spec** — ~90vw/90vh frame and 1×–8× zoom are implementation defaults (pencere); pinch/double-tap zoom must keep a single-pointer alternative (Q47 2.5.7) and honor reduced motion on transitions (Q12).
- **When NOT to lightbox** — an inline grid or a plain link to a full-size page often scans better (NN/g); overlays cost markup, focus plumbing and mobile gesture conflicts (Q160 edge-swipe).
- **One-shot build checklist line:** any gallery/photo/receipt viewer (Ghostway POI photos, DM Astro portfolio, OF receipt view) → native `<dialog showModal()>`; focus-return-to-trigger; visible Close + backdrop dismiss (never Esc-only); Arrow-key prev/next + polite "N of M" counter; meaningful alt per item; user-triggered only; reduced-motion transitions; single-pointer alternative to pinch-zoom.
- **Rejected (Q169):** (1) 'div + custom focus trap is standard' → FALSE, native `<dialog>` already traps + Esc + top-layer; (2) 'Esc is enough to close' → FALSE, needs a visible Close; (3) 'auto-opening a lightbox fails WCAG AA' → FALSE, 3.2.5 is AAA (still ban it on UX grounds); (4) 'alt is optional inside a lightbox' → FALSE, the image is the content; (5) '90vw/1×–8× zoom are spec values' → FALSE, convention.

### Q180 — Long-list rendering: `content-visibility` first, true windowing last · 2026-08-30
- **Default move = CSS, not a virtualizer** — `row { content-visibility: auto; contain-intrinsic-size: auto <est-h> }`. MDN PRIMARY: skipped content "remains in the document object model and the accessibility tree", so Ctrl+F, tab order, focus, selection and SEO all keep working. Baseline 2024 (Chrome 85 / FF 125 / Safari 18) — older engines ignore it harmlessly.
- **`contain-intrinsic-size` is mandatory** — without it rows lay out at 0px → collapsed scrollbar + CLS jump (extends Q124/Q162).
- **NET-NEW measurement gotcha** — offscreen rows report **0** from `getBoundingClientRect()`/IntersectionObserver. Never apply `content-visibility:auto` to elements measured at load, to sticky headers, or to layouts that need all children laid out.
- **True DOM windowing only when it's genuinely huge or heavy** — >~1–2k rows, or rows carrying charts/iframes/media. Windowing **breaks find-in-page, anchor links and SEO** unless you also ship a hidden full-text index → for searchable record tables (DM cockpit) pick the CSS path deliberately.
- **Windowing contract** — full-height spacer (honest scrollbar thumb), ~5–10-row overscan (none = pop-in on fast flick), `aria-setsize` = FULL dataset length + `aria-posinset` = absolute index+1 (else AT truncates at the viewport), **never unmount the focused/selected row** — pin it or focus falls to `<body>` (Q144); defer `focus()` to rAF after recycle; selection/sort keyed by stable item ID, never DOM index (Q58/Q78/Q83); live region OUTSIDE the scroll container, throttled ~1.5s (Q84); persist `scrollTop` for Back (Q37/Q119).
- **Roving focus vs `aria-activedescendant` = implementation detail** — ARIA APG endorses both; the hard rule is the focus pin.
- **One-shot build checklist line:** any list/table that can exceed a few hundred rows → `content-visibility:auto` + `contain-intrinsic-size` on ROWS (not the container, not above-the-fold); only window past ~1–2k rows or heavy cells, and then spacer + overscan + setsize/posinset + focus-pin + id-keyed selection + scroll restore.
- **Rejected (Q180):** (1) "virtualize everything" → FALSE, under ~200 rows the overhead exceeds the benefit; (2) "the 200/500/1k/2k thresholds are law" → FALSE, blog-tier engineering convention, measure on the slowest device; (3) "roving focus is strictly better than aria-activedescendant" → single-source, demoted to a detail; (4) "content-visibility is a drop-in anywhere" → FALSE, it zeroes offscreen measurements (sticky/measured elements break).

### Q148 — Resizable split-pane / resize-handle (splitter) · 2026-08-31
- **APG Window Splitter contract** — `role="separator"` + `tabindex="0"` + `aria-valuenow/valuemin/valuemax` (primary pane size, one unit) + `aria-orientation` **perpendicular to the drag axis** + `aria-controls` the primary pane + an accessible name. Keyboard: Arrow steps, Home/End (or Shift+Arrow) to min/max, **Enter collapses ↔ restores**.
- **WCAG 2.5.7 explicitly names "split-pane resizers"** and keyboard equivalence does **not** satisfy it (spec: keyboard equivalence "does not automatically meet this success criterion, unless that equivalent keyboard operation also provides controls that can be clicked or tapped") → ship a real single-pointer alternative: click-the-track to jump, double-click/tap to collapse-restore, or a numeric width input. The "essential" drag exemption is freehand/sketch canvas only.
- **Implementation floor** — Pointer Events + `setPointerCapture` + `touch-action: none` (not mouse events); visible grip + `col-resize`/`row-resize` cursor + ≥3:1 non-text contrast + **≥24px hit target** even on a 1–4px divider; clamp min/max and keep a collapsed pane reachable (never a 0px handle); persist the ratio (localStorage/URL, Q119) and debounce relayout; instant reflow under reduced-motion (Q12); below the split breakpoint degrade to **stacked panes or tabs** (Q45/Q67).
- **Zero dependency** — CSS `resize` is the no-JS baseline but carries no ARIA (non-primary regions only); the full APG pattern is ~40 lines of vanilla JS (mechanically proven, `scratch/q148_verify.mjs` 9/9 PASS) → the DM cockpit needs no splitter library.
- **One-shot build checklist line:** any resizable split view (DM cockpit inspector/list, Ghostway map+POI list on tablet, OF budget/detail) = APG splitter contract **plus** a single-pointer alternative (track-click / double-click-collapse / numeric input), ≥24px handle at ≥3:1, Pointer Events + touch-action:none, clamped min/max, persisted ratio, no easing under reduced-motion, stack-or-tabs on phones.
- **Rejected (Q148):** (1) "keyboard support satisfies 2.5.7" → FALSE, the alternative must be clickable/tappable; (2) "you need a splitter library" → FALSE, ~40 lines of vanilla JS; (3) "make the divider itself 24px wide for the target" → wrong fix, pad the handle's hit area and keep the visual line 1–4px. **Boundaries:** the APG Window Splitter *example* is incomplete (ARIA 1.1 review, issues 129/130) → follow the role/state contract, not the demo; screen-reader announcement of `separator`+`valuenow` is a manual-AT remainder (no axe rule → Q93).

### Q182 — Payment / checkout form UX · 2026-08-31
- **GUEST-FIRST** — Baymard #GC050: 26% of US shoppers abandon when forced to create an account (#2 driver); let guests pay, offer post-purchase account creation.
- **SURPRISE EXTRA COSTS = #1 abandonment driver (~48%)** — show all costs (tax, shipping, fees) BEFORE the payment step, never spring them on the final screen.
- **MINIMIZE FIELDS** — combine name, use ZIP→city/state autocomplete, single-field card with autocomplete="cc-*" tokens (converges Q155/Q181), inputmode=numeric, never pre-disable submit until valid (converges Q13).
- **PCI-AWARE TOKENIZATION** — use Stripe Elements/Checkout, Adyen Components, or Braintree Hosted Fields so the card NEVER reaches your server (PCI SAQ A ≈22 controls vs SAQ D ≈330); SAQ A now also requires Req 6.4.3 script inventory + 11.6.1 payment-page change detection.
- **APPLE PAY** = W3C Payment Request + HTTPS + .well-known/apple-developer-merchantid domain verify + per-txn server-side merchant-session validation (WebKit blog). **GOOGLE PAY** = brand-enforced button + Business Console config.
- **WEBHOOK-AUTHORITATIVE** completion (idempotency key prevents double-charge).
- **BOUNDARIES:** wallet 30-40% mobile lift DEMOTED (blog tier, directional only); account-NEEDED products (subscription where the account IS the product, age/gift-card regulatory) = WHEN-NOT for guest-first; OSS-bias tension — pure-OSS card capture has no zero-PCI path (BTCPay Server = OSS alt still SAQ-A-EP).
- **One-shot build checklist line:** if the build has a checkout/payment surface (Open Finance budget/contribution + tithing, Deseret Marketing retainer payment capture) → guest-first (never force account creation), all-costs-upfront (no surprise fees), minimize fields (combined name, ZIP→city/state, single card field with cc-* autocomplete), use processor tokenization so the card never hits your server (PCI SAQ A), Apple/Google Pay where supported, webhook-authoritative completion with idempotency key, never pre-disable submit until valid.
- **Rejected (Q182):** (1) "force account creation before payment" → FALSE, Baymard 2024: 26% abandon when forced to create an account; (2) "show shipping/tax on the final screen" → FALSE, surprise costs = #1 abandonment driver; (3) "store card numbers on your own server" → FALSE, use processor tokenization (PCI SAQ A); (4) "disable submit until the form is valid" → FALSE, let them submit and show errors (converges Q13).

### Q183 — Token / tag multi-value input UX · 2026-08-31
- **TagInput = free-text field that commits typed values as inline removable chips**; value = accumulated token LIST (NOT a delimited string). Use for OPEN-ENDED user-defined values (skills, keywords, recipients, tags). Fixed list ≤~7 → multi-select/checkbox; constrained real estate → Combobox[multi] count.
- **ARIA = APG Combobox role** (`role="combobox"` + `aria-expanded` + `aria-controls`→listbox + `aria-autocomplete="list"` + `aria-activedescendant`) — focus STAYS on the input, never moves to the listbox. Each token a chip with its own remove `<button aria-label="Remove [tag]">`.
- **Keyboard contract:** Enter/comma commit, Backspace-empty removes last, Arrow nav chips, Delete on chip, Escape close, blur commits pending text.
- **Form submission = array, progressive enhancement:** one hidden `<input name="field[]">` per tag → native array post + server-render restore (no-JS-tolerant Hono stack); NEVER comma-joined string.
- **Variants:** free/strict/creatable + dup-gate + maxTags. Per-tag validation on commit; overflow wrap (never clip).
- **Boundaries / corrections:** combobox role is CORRECT only when a real listbox popup exists; pure free-text no-suggestion → downgrade to plain textbox. Remove glyph needs ≥3:1 (gray-400=2.54:1 FAIL / gray-500=4.83:1 PASS).
- **One-shot build checklist line:** any multi-value tag/token field (DM cockpit record tags / technician-assignee tokens, Ghostway POI category tags, OF transaction tags) → TagInput (APG combobox role + per-chip remove + Enter/comma/Backspace keyboard + hidden-input array); NOT contenteditable-div, NOT comma-joined string, NOT color-only categories; remove glyph ≥3:1; per-tag validation on commit; overflow wrap.
- **Rejected (Q183):** (1) "contenteditable div for tags" → FALSE, no semantics/a11y disaster (converges Q113); (2) "custom div chip-row with no real input" → FALSE; (3) "comma-joined single-string value" → FALSE; (4) "color-only tag categories" → FALSE (WCAG 3.3.1); (5) "tag input for a single value" → over-engineering → plain text input.
- · WAI-ARIA APG Combobox PRIMARY + taga11y/ebay evo-web/empire-ui/cascivo/NDS-vanilla + once-ui + mechanical scratch/q183_contrast.py + scratch/q183_taginput.html · 7/7 verified, ZERO conflict. 2026-08-31.

### Q184 — Third-party embed / iframe integration UX · 2026-08-31
- **`title` on every iframe is MANDATORY + DESCRIPTIVE for AT** — axe `frame-title` = serious (WCAG 4.1.2 A): without a descriptive `title` the SR announces only "frame" with zero context (worse than no embed for AT users). Uniqueness + matching-inner-`<title>` = Deque best-practice, NOT strict 4.1.2 floor → boundary noted; content-free/tracking frames = `title=""` + `aria-hidden` + `tabindex="-1"`.
- **Heavy embeds (YouTube/map/social/chat) need the FACADE pattern** — render a lightweight placeholder + load the real embed on user interaction; `loading="lazy"` alone is NOT enough because the third-party SCRIPT still blocks the main thread and blows LCP/CLS; `loading="lazy"` defers until near viewport (MDN verbatim), eager = default (above-fold); NEVER lazy functional hidden frames (MDN: lazy only defers when JS enabled, never-near-viewport frame won't load).
- **`sandbox` + grant ONLY the specific `allow` tokens the embed needs** — MDN: `allow` = Permissions Policy ADDITIONAL restriction on top of header (NEVER a replacement); `allowfullscreen`/`allowpaymentrequest` = legacy aliases for `allow="fullscreen *"`/`allow="payment *"`; `sandbox` empty = all restrictions, tokens lift; `allow-scripts` + `allow-same-origin` strongly discouraged; over-permissive sandbox = XSS/clickjacking.
- **Reserve dimensions via explicit width/height or `aspect-ratio`** so load doesn't shift layout (MDN default height = 150px → CLS; converges Q35/Q79). Facade/click-to-load doubles as the Q72 consent gate (precede 3rd-party request with consent).
- **Cap an EMBED BUDGET** — MDN: "every <iframe> requires increased memory" — audit + defer non-critical third-parties. FAILURE/DEGRADED MODE = visible fallback + link-out (cross-ref Q98/Q30/Q81: CSP / ad-block / no-JS / consent-denied / offline all break embeds — never a silent blank). Decorative frames safe with `role="none"`/`presentation`.
- **One-shot build checklist line:** any third-party embed (DM Astro YouTube/map/chat/testimonial, Ghostway help clip, OF web, DM cockpit doc views) → give EVERY iframe a descriptive `title` (axe `frame-title`); use a FACADE (placeholder + load-on-interaction) for heavy embeds, not `loading="lazy"` alone; set `sandbox` + only the `allow` tokens needed + `referrerpolicy`; reserve width/height or `aspect-ratio` to prevent CLS (Q35); consent-gate tracking embeds (Q72) but load content embeds independently; cap an embed budget + defer non-critical; ALWAYS provide a link/static fallback for CSP/ad-block/no-JS/consent-denied.
- **Rejected (Q184):** (1) "iframes don't need a title" → FALSE (WCAG 4.1.2 A; SR gets "frame" with no context); (2) "loading=lazy fixes third-party embed perf" → FALSE (the script still blocks the main thread / blows LCP; facade pattern required); (3) "sandbox is optional for trusted embeds" → FALSE (least-privilege allow tokens; over-permissive = XSS/clickjacking); (4) "drop an embed with no fallback" → FALSE (CSP/ad-block/no-JS/consent-denied / offline all break it — always link out).
- · MDN `<iframe>` PRIMARY + Deque axe `frame-title`/`frame-title-unique` + web.dev facades + HTML sandbox token table · 8/8 verified on primary convergence. 2026-08-31.

### Q176 — Selectable / radio / checkable card (choice-card) UX · 2026-09-01
- **A choice card is ONE of three distinct ARIA roles, NOT one prop** — RadioCard=`role="radio"`+`aria-checked` inside `role="radiogroup"` (single-select), CheckableCard=`role="checkbox"`+`aria-checked` (multi-select), ToggleCard=`role="switch"`/`aria-pressed` (on/off). `role="tab"`/`aria-selected` = fake-tab-widget FAIL (Q45/Q171). · WHY: plan/tier/payment pickers — AI code flattens 3 models into one isSelectable prop. · SOURCE: WAI-ARIA APG Radio Group PRIMARY + IBM Carbon Tile + USWDS input-tiles + GOV.UK/NHS + WCAG 4.1.2. · VERIFIED 10/10 + mechanical scratch/q176_contrast.mjs.
- **Single tab stop + roving** — radio arrows MOVE AND COMMIT (APG verbatim); checkbox arrows MOVE ONLY + Space/Enter toggles.
- **Card-as-label (simple) vs explicit role (rich)** — simple: whole card = `<label>` for visually-hidden input (opacity:0, not display:none). Rich: explicit `role` on card.
- **NESTED-INTERACTIVE PROHIBITION** — no button/link/input inside selectable card (WCAG 4.1.2, axe `nested-interactive`). Put secondary actions OUTSIDE the grid.
- **Selection NEVER color-only** — mechanical: light fill + white check = 1.11:1 FAILS; blue-border-on-white = 5.02:1 OK. ≥2 indicators mandatory.
- **Touch target ≥44px iOS / 48dp Android** — entire card = hit area. Never pre-select radio (NHS anti-pattern). 7+ options → select (Q65).
- **One-shot build checklist line**: choice cards (OF plan/payment, DM cockpit tiles, Ghostway map-style, DM Astro pricing) → 3 distinct roles; card-as-label vs role; no nested interactives; ≥2 indicators; 44/48dp; no pre-select; fieldset/legend; reduced-motion instant. Converges Q45/Q171/Q58/Q65/Q13/Q17.
- **Rejected (Q176):** (1) "whole-card div onclick" → FALSE; (2) "color border = selected" → FALSE; (3) "one isSelectable prop" → FALSE; (4) "nested Choose button" → FALSE; (5) "pre-select first radio" → FALSE.
- **Boundaries:** role=tab/aria-selected = WRONG; M3 uses RadioButton/Checkbox inside cards (APG authoritative); USWDS input-tiles = label-wrapped native input.

### Q170 — On-page table-of-contents / scrollspy in-page navigation UX · 2026-08-30
- **Landmark + semantics**: wrap the rail in `<nav aria-label="Table of contents">` (or "On this page") — a labeled navigation landmark, NOT `role="tab"` (NameThatUI: role=tab/aria-selected wrongly announces a tab widget that does not exist; this is non-modal, all sections stay in the DOM). Plain `<a href="#section-id">` links to real heading ids; works with zero JS (progressive enhancement) and keeps copyable destinations + no-script nav. · WHY: a sticky in-page TOC is the single most common way long-form marketing/docs pages fail a11y (either missing or mis-using tab semantics). · SOURCE: NameThatUI scrollspy PRIMARY + jargon-buster/observerviewport + appica/xtyle/collectivekit. · VERIFIED: 11/11 on 2nd-source ×4 convergence + mechanical band/tie-break/final-section sim (scratch/q170_scrollspy_band_test.mjs PASS).
- **Active state = exactly ONE link carries `aria-current="location"`** (NameThatUI + MDN-style TOC + CollectiveKit). Do NOT use aria-selected. The active indicator must not be color-only — pair a high-contrast vertical accent bar + stronger label weight/color (converges Q17).
- **Activation band (core math)**: IntersectionObserver with `rootMargin` to define a reading band, NOT "any part visible." Top offset = sticky-header height (e.g. `rootMargin: '-96px 0px -70% 0px'` → active = heading nearest the top reading line). Deterministic tie-break: when several short sections are visible, prefer the LAST heading that crossed the reading line. Handle the FINAL section explicitly (it can't scroll to the top → select it when within ~viewport-bottom threshold).
- **Focus discipline**: scroll observation MUST NOT steal keyboard focus (NameThatUI behavior contract). Clicking a link = ordinary same-page hash nav. Do NOT replaceState/pushState on the scroll observer (don't flood browser history or move focus merely because the highlight changed). If you sync the URL, use `history.replaceState()` only, no focus move.
- **Sticky header offset**: set `scroll-margin-top: 96px` (≥ sticky-header height) on each target section/heading so jumps aren't hidden under the sticky chrome (directly satisfies WCAG 2.4.11/2.4.12 Focus Not Obscured — converges Q80).
- **Smooth scroll + reduced motion**: `scroll-behavior: smooth` on the container, but gate with `@media (prefers-reduced-motion: reduce) { scroll-behavior: auto }` — instant jump for vestibular users (converges Q12).
- **Sticky rail + overflow**: `position: sticky; top: <header+gap>` keeps the TOC in view; if the outline is long, make the rail itself `overflow:auto` (converges Q112 scroll-container focusable) so it doesn't trap page scroll.
- **Nested depth**: indent nested entries by heading level (h2/h3), depth 2–6. Keep item order = document order. Labels short ("Overview", "Settings").
- **Mobile fold**: below the breakpoint, collapse to a wrapped row of chips, a `<details>` disclosure ("On this page"), or a top sticky bar — keep it a real `<nav>` with aria-label + working anchors; never drop it to display:none without an alternative.
- **Auto-generate**: build the outline by extracting h2/h3 with existing ids (slugify if missing) — don't hand-maintain; ensures ids always exist for the anchors.
- **One-shot build checklist line**: any long-form page with ≥3 sections (DM Astro marketing/docs/legal/pricing flagship, Ghostway/OF web doc pages) → wrap in `<nav aria-label="Table of contents">`; exactly-one `aria-current="location"`; IntersectionObserver rootMargin band offset by sticky-header height; never steal focus / replaceState only; scroll-margin-top for 2.4.11; reduced-motion smooth-scroll gate; mobile fold to details/chips; auto-generate from h2/h3.
- **Rejected (Q170)**: (1) `role="tab"`/`aria-selected"` on TOC links → announces a fake tab widget (NameThatUI); (2) observer root = viewport while sections scroll inside an `overflow` container → nothing highlights; (3) highlight snapping back after click because the scroll-triggered observer overrides the clicked section — debounce/lock the observer on click; (4) multiple sections visible with no deterministic rule → flicker (fix with the band + tie-break).
- **Boundaries**: rootMargin exact px = convention not spec (track actual sticky-header height per surface); final-section needs explicit near-bottom rule; role=tab/aria-selected = confirmed anti-pattern.

### Q169 — Payment / checkout / money-transfer flow UX · 2026-09-02
- **Checkout spine = order summary always visible** (items/qty/unit price/tax/shipping/discount/total) — sticky right on desktop, collapsible top on mobile, NEVER below the fold. Surprise fees at the final step = #1 abandonment reason (Baymard: ~7% conversion loss per unexpected cost; NN/g: "a total that grows at review is the #1 abandonment reason made flesh").
- **Fee transparency BEFORE confirm**: show "You send / They receive" + all fees + FX rate + settlement timing. Never hide FX margin inside an unlabeled combined number. Receipts downloadable/exportable/shareable — never buried behind support flows.
- **Guest checkout default**: guest path prominent and equal-or-better than sign-in. Account creation offered AFTER order placement ("save your details" — one password/passkey field, rest known). Forced login before payment = recoverable abandonment.
- **Payment method selector order**: saved cards first → wallets (Apple Pay/Google Pay) → manual entry. Recognizable brand marks. Selected method visually distinct. Express wallets lead on mobile — one tap, no form.
- **Failure-screen pattern** (the #1 fintech differentiator): declined payments are a STATE, not an exit. NEVER clear the form on decline. NEVER blame the user ("Your card was declined" beats "Payment failed"). Answer three questions in order: (a) Is my money safe? (b) Why did this happen? (c) What to do now?
- **Decline taxonomy** (convention, not law): ~30% bank fraud → "Call the number on the back of your card"; ~25% expired/wrong → "Update your card"; ~30% insufficient funds → "Use a different payment method"; ~15% network error → "Try again" is correct. One-size-fits-all "Try again" = right for 15%, wrong for 85%.
- **Intent confirmation for large/irreversible transfers**: have the person TYPE the amount, not just tap. "You're sending $5,000 to 'ABC Holdings LLC' — last sent: never." Instant rails = irreversible the moment you tap. Delayed rails (ACH/scheduled) = surface the cancel window as a feature with a visible cancel link.
- **3DS/bank-verification handoff**: blueprint the external actor — what does your screen show while they're gone? Session + cart preserved on return. Treat 3DS failure/timeout as a decline branch.
- **Trust checkpoints along the route**: address (why you need a phone), payment (security cues, known payment marks — 19% of abandoners distrust card-detail collection), review (no new numbers appearing), place order (button states the exact charge), confirmation (immediate receipt + what happens next).
- **Confirmation screen anatomy**: order number, itemized recap, delivery/settlement estimate, prominent "Track order"/"View receipt" action, receipt email fired same moment. For money transfers: sender/amount/recipient/reference/estimated arrival + "Share receipt" action.
- **Real-time inline validation**: card type auto-detected, format validated, errors next to the field. Preserve all valid inputs when one field errors. Focus the first field with an issue.
- **Processing state**: step-by-step status text explaining the delay, not a generic spinner. "Processing" → "Confirmed" with a clear status transition. Never leave the user staring at a blank screen.
- **HYPE BUSTED**: "frictionless = always better" (FALSE — friction-right wins for money); "one-click everywhere" (FALSE — for returning users with saved methods only); "remove all form fields" (FALSE — some legally required); "cheapest method first" (FALSE — saved/preferred method first).
- **One-shot build checklist line**: any checkout/payment surface (Open Finance budget/txn/tithing, Deseret Marketing retainer capture, DM cockpit payments) → order summary always visible + all fees before confirm + guest checkout default + saved-method-first selector + failure-screen = state not exit + typed confirmation for large transfers + 3DS handoff blueprint + trust checkpoints + confirmation screen with receipt + inline validation + step-by-step processing state.
- **Rejected**: (1) "force account creation before payment" → FALSE (Baymard 26% abandon); (2) "show fees on final screen" → FALSE (surprise costs = #1 abandonment driver); (3) "one-size-fits-all 'Try again'" → FALSE (wrong for 85%); (4) "cheapest payment method first" → FALSE (saved method first); (5) "frictionless = better for money" → FALSE (clear explanations at trust moments beat raw speed).
- · Stripe checkout best practices PRIMARY + Baymard Institute cart abandonment PRIMARY + Gummble State of Checkout UX 2026 + Visa decline code data + NN/g mobile checkout + detroit3d checkout blueprint + Pavle fintech UX + Auditbuffet graceful decline + ParallelHQ fintech trust + 925studios fintech patterns · 12/12 verified on primary-source convergence. 2026-09-02.

### Q201 — Illustration system design for product UI · 2026-09-02
- **4 empty-state types need distinct artwork + copy** — first-time-user (onboarding moment, highest stakes), cleared (celebration not problem), filtered (offer clear-filters path), error (look like an error). Never one generic "No data" for all four · pivotlog.net + Lightning Design System + eBay Playbook + SAP Fiori converge · 10/10 verified primary.
- **Generate illustrations as a SET, not one scene at a time** — scenes produced in one pass share palette, proportion, and line weight automatically; fix drift immediately — one off-style scene becomes the precedent for the next 5 · icora.io PRIMARY.
- **SVG vs PNG decision** — SVG wins flat/geometric/line-based (15-80KB vs 400KB+ PNG), dark mode without second export (fills inherit currentColor/CSS vars), editable after the fact. PNG wins painterly/textured/photographic (path count explodes), email (Outlook doesn't render SVG), Open Graph/social (crawlers expect raster). Rule of thumb: visible texture/photographic detail/>handful gradient meshes → raster · icora.io PRIMARY.
- **Dark mode illustration rules** — SVG fills inherit currentColor or CSS variables, never hardcode white backgrounds. For colored-background illustrations: keep white fills in foreground objects, never remove fills, never use white fill as background · icora.io + Lightning Design System converge.
- **Copywriting = 3-7 word verb-headline** · humanstandards.org · convention.
- **Sizing = large/small by context** — large for hero/empty states, small for inline/thumbnails · convention.
- **SVG optimization** — strip white backgrounds, add alt text, provide PNG companion for email/social · icora.io PRIMARY.
- **A11y floor** — optional icon + label for decorative illustrations; meaningful illustrations get alt text.
- **Inventory target = 25-30 illustrations** · convention.
- **5 hype flags rejected** — "one illustration style fits all contexts", "always use PNG for quality", "dark mode is just invert", "illustrations are decorative only", "more illustrations = better".
- One-shot build checklist line: if the build needs illustration (DM Astro hero + empty states + onboarding, Ghostway PWA empty states/error pages, OF web tier), define 4 empty-state types (first-time/cleared/filtered/error) with distinct artwork+copy, generate as a set, choose SVG vs PNG by style (flat→vector, textured→raster), dark mode via currentColor/CSS vars, 3-7 word verb-headlines, optimize SVGs, provide PNG companions for email/social, inventory 25-30.
- **Rejected (Q201):** (1) "one generic 'No data' illustration for all empty states" → FALSE, each type has distinct user need; (2) "generate illustrations one at a time as needed" → FALSE, produces style drift; (3) "PNG for all illustrations for max quality" → FALSE, SVG is smaller + editable + dark-mode-ready for flat styles; (4) "invert colors for dark mode" → FALSE, use currentColor/CSS vars; (5) "illustrations are purely decorative" → FALSE, empty-state illustrations are functional (conveys WHY + next action).
- Full spec: brand-identity references/identity-system-spec.md § Fleet-verified illustration rules.

### Q228 — Dashboard / Admin Cockpit UX · 2026-09-04
- **KPI CARD ANATOMY = 5 PARTS MAX** — label, value, comparison (vs NAMED baseline), ONE visual only (sparkline 7-30 points no chrome). Cards with >5 elements become panels. · SOURCE: getdashboardtemplates.com + saasui.design. · VERIFIED.
- **DIRECTION ≠ SENTIMENT** — arrow = direction, color = good/bad. Error rate rising = red-up (bad); churn falling = green-down (good). Decouple — green-up/red-down reflex misleads for "less is better" metrics. · SOURCE: saasui.design. · VERIFIED.
- **KPI CARD COUNT = 3-6 PER VIEW** — equals questions reader asks first. CSS Grid minmax(200px,1fr) to minmax(280px,1fr), auto-fill. One accent for deltas ONLY. · SOURCE: getdashboardtemplates.com + artofstream.com. · VERIFIED.
- **LAYOUT = SIDEBAR + 12-COLUMN GRID** — fixed sidebar 240-280px left (flex-shrink:0), main scrolls independently (flex:1, overflow-y:auto). 12-col, 24px gutters. CSS Grid auto-rows with minmax(200px,auto) aligns without JS. · SOURCE: artofstream.com. · VERIFIED.
- **ONE-SCREEN RULE** — fits on ONE SCREEN. Forces prioritization. EXCEPTION: drill-down fine; operational dashboards worked IN may scroll. · SOURCE: sharedcontext.ai + Stephen Few. · VERIFIED.
- **10% HIGHLIGHT RULE** — highlight ≤10% of surface. Alerts = ONLY vivid color. Grey baseline + red for anomalies. · SOURCE: sharedcontext.ai. · VERIFIED.
- **5-SECOND TEST** — look 5s, look away. State the single most important insight. Pass/fail gate before polish. · SOURCE: sharedcontext.ai. · VERIFIED.
- **DARK MODE = TASK-CONTEXT** — right for monitoring/NOC, real-time ops, low-light/shift-work, data-dense viz. WRONG for exec review, casual use, print/export. · SOURCE: fanruan.com. · VERIFIED.
- **COLOR RESTRAINT = 3-5 SEMANTIC COLORS MAX** — success, warning, error, info, neutral. Grayscale filter test: if info disappears = color-only encoding = a11y failure. · SOURCE: fanruan.com. · VERIFIED.
- **TYPOGRAPHY = 3 LEVELS MAX** — heading, subheading, body. Size + weight > color for scanning. · SOURCE: fanruan.com. · VERIFIED.
- **ELEVATION = SUBTLE** — light shadows or 1px borders. NOT heavy drop shadows. · SOURCE: fanruan.com. · VERIFIED.
- **DATA TABLE ALIGNMENT** — text left, numbers RIGHT-ALIGNED (digits line up by place value), dates consistent. · SOURCE: setproduct.com + eleken.co. · VERIFIED.
- **TABLE VS CARDS VS LIST** — table = comparison; cards = rich content; lists = shallow items. Mobile: table HARD, cards/lists easy. · SOURCE: setproduct.com. · VERIFIED.
- **SORTING STATE** — persistent indicator on sorted column, visible sort direction, DEFAULT sort state on load. · SOURCE: 137foundry.com. · VERIFIED.
- **SELECT ALL = ALL FILTERED ROWS** across all pages, not just visible. Display matching count. · SOURCE: 137foundry.com. · VERIFIED.
- **SERVER-SIDE THRESHOLD** — server-side sorting+filtering when dataset exceeds FEW HUNDRED ROWS. Virtualization for very long lists. · SOURCE: edana.ch. · VERIFIED.
- **CONSUMER VS INTERNAL = DIFFERENT PRODUCTS** — internal = bulk-action checkboxes + explicit empty states + high density. Consumer = sorting/filtering + visual clarity. · SOURCE: mantlr.com. · VERIFIED.
- **LOADING STATES = SKELETON SCREENS NOT SPINNERS** — content-shaped placeholders with shimmer (1.5-2s convention). Distinct from AI-processing indicator. · SOURCE: artofstream.com. · VERIFIED.
- **ACCESSIBILITY FLOOR** — WCAG AA 4.5:1 all text/data marks. CVD-safe. No color-only encoding. No 3D/gauges (use bullet graphs). Zero baselines on bar charts. Sparklines need context. · SOURCE: sharedcontext.ai. · VERIFIED.
- **DASHBOARD DESIGN ≠ DASHBOARD UI** — UI = components/spacing/color (cheap). Design = which metrics earn a place, what each is compared against, what gets LEFT OFF (expensive). · SOURCE: adminlte.io. · VERIFIED.
**One-shot build checklist line:** if the build is a dashboard/admin cockpit (DM admin cockpit flagship, OF admin, Ghostway admin), KPI = 5 parts max + 3-6 per view + sidebar + 12-col grid + one-screen rule + 10% highlight + 5s test + dark = operational + 3-5 semantic colors + 3 type levels + subtle elevation + text-left/numbers-right tables + persistent sort + select-all = filtered rows + skeleton screens + bullet graphs not gauges.
Source: getdashboardtemplates.com (PRIMARY) + saasui.design (PRIMARY) + artofstream.com (PRIMARY) + sharedcontext.ai (PRIMARY) + fanruan.com (PRIMARY) + setproduct.com (PRIMARY) + eleken.co (PRIMARY) + 137foundry.com (PRIMARY) + edana.ch (PRIMARY) + mantlr.com (PRIMARY) + adminlte.io (PRIMARY) + Stephen Few / Perceptual Edge (bullet graph) — ledger Q228 B-row, 5/5 [needs-evidence] flags resolved. Direct users: DM admin cockpit (flagship), Open Finance admin, Ghostway admin.

### Q211 — Japanese UI/UX design conventions for web and mobile apps · 2026-09-03
- **Japanese UX is a DISTINCT design system, not a translation layer** — applying Western minimalism to Japanese surfaces inverts local expectations and costs trust. Use ONLY for Japanese-targeting surfaces (JP-Lingo Japanese-lingo-lab flagship, any future Japan move, Deseret Marketing if targeting Japanese-speaking audiences in Utah County). For Western audiences, these patterns read as cluttered/overwhelming. · WHY: Keaton's Japan move (DM = U.S. LLC) + JP-Lingo flagship = direct strategic relevance. · SOURCE: ronantakizawa/japanese-webdesign PRIMARY + seraphim.vn + japanwebdesign.com + netwise.jp + corentings.dev + hibiki-press.tech + lobehub.com + claudemarketplaces.com + digital.go.jp JIS X 8341 + ndc.co.jp · VERIFIED 12/12 on primary-source convergence.
- **12 verified groups**: (1) Anshin (安心) = all info visible upfront (hiding creates suspicion); (2) Omotenashi (おもてなし) = anticipatory hospitality (proactive guidance, gentle inline validation); (3) information density = "more is trust" (dense grids 80-120px, exhaustive specs); (4) bento box layouts (≤9 boxes); (5) trust signals (staff photo, ISO, years, satisfaction %, full company, reviews, shipping badges); (6) confirmation culture (order summary → confirm → final verification → completion); (7) mega navigation > hamburger; (8) quiet micro-interactions (motion = trust, not celebration); (9) meiwaku (迷惑) = notification restraint (relationship, not gate); (10) JIS X 8341 accessibility (≈WCAG 2.2, Japan-specific methodology); (11) CJK typography (Hiragino/Yu Gothic, palt+kern, kinsoku shori, vertical-rl); (12) seasonal design + color conventions (avoid 4/9 in pricing).
- **One-shot build checklist line**: any Japanese-targeting surface → Anshin (all info visible upfront), Omotenashi (anticipatory hospitality), dense information design (80-120px grids, exhaustive specs), bento layouts (≤9 boxes), trust signals (staff photo, ISO, years, satisfaction %, full company, review text, shipping badges), confirmation culture (order summary → confirm → final verification → completion), mega-nav (avoid hamburger), quiet micro-interactions, meiwaku (notification restraint), JIS X 8341 accessibility, CJK typography (Hiragino/Yu Gothic stack, palt+kern, kinsoku shori), seasonal design, avoid 4/9 in pricing/counts. Converges Q75 (RTL/bidi layout), Q1 (type scale), Q39 (nav decision), Q12 (motion timing), Q82 (microcopy), Q15 (a11y floor), Q46 (theme switch), Q17 (non-color-only signaling).
- **Rejected**: (1) "apply Japanese density to Western surfaces" → FALSE (reads as cluttered); (2) "hamburger menus are fine for Japan" → FALSE (mega-nav preferred); (3) "more animations = more delight for Japan" → FALSE (restraint reads as trust); (4) "notification permission = gate to push through" → FALSE (meiwaku restraint); (5) "minimalism is universal" → FALSE (Anshin requires information visibility).
- **Boundaries**: JIS X 8341 ≠ WCAG 2.2 (Japan-specific methodology); 4/9 avoidance = pricing/counts only; CJK = Japanese surfaces only; Anshin = default visible, collapse only secondary; seasonal design = convention.

## Needs Keaton / project fleets
- **Q160 Ghostway edge-swipe hardening** (2026-08-30 → LANDED 2026-09-25, commit d564a73): `overscroll-behavior-x: contain` shipped on html/body/#map (verified by scripts/viewport-hardening-check.mjs). Residual: field-test edge swipes on Keaton's iPhone; only add the ~10px edge `touchstart` deadzone if the gesture still leaks.
- **Q168 WebGL/Three.js 3D interaction retrofit** (2026-08-30): audit DM Astro Three.js marketing hero/showcase for AT-opaque canvas (ship equivalent HTML + labeled controls; WCAG 1.1.1 = purpose not polygon count), real HTML camera controls + custom keyboard rotate/zoom (OrbitControls keyboard = pan-only), reduced-motion snapped cuts + render-on-demand, setPixelRatio cap 2, webglcontextlost/restored retry state, no canvas-drawn text (DOM overlays/CSS2DRenderer), decorative-vs-informative split + colorblind-safe colormaps. Build-time guidance; Ghostway 2D via Q166, OF web 3D viz secondary.
