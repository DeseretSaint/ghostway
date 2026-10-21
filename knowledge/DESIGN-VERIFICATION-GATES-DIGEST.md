# Design/render verification gates digest

Source: `knowledge/DESIGN-RENDER-QUALITY-GATES.md` (18.6 KB). Extracted: the verification-gate part, the field-verified
defects, baseline hygiene and the honest read of what the baseline is missing.

Provenance: personal vault, pulled 2026-10-17.

---

## 1.3 Baseline hygiene (fix before relying on it)

- **10 duplicated Q labels**, including three genuine topic collisions — **Q89** = Autofill *and* Rating;
  **Q169** = Lightbox *and* Payment; **Q120** = hover/pointer capability *and* character-count. Q103 and Q146
  each appear three times. Safe citation must be `Q<n> @L<line>`.
- The doc self-reports **39 conflicts / 73 corrections / 4 refuted / 45 need-evidence** — i.e. it knows it
  carries unresolved contradictions. Unresolved-if-read-flat examples: reduced-motion "fewer not zero" vs Q57's
  "no animation"; disabled-control trio (hide vs `aria-disabled` vs never-disable); hamburger absolutism vs
  Q39's calibrated rule; zebra striping (NN/g endorses, ACM 14k-trial study found no speedup); body
  `font-display` (industry vs csswg inverted); adjacent-target spacing 24px (Q8) vs 8–10px (Q250).
- **Verification is explicitly capped at one fix batch** — there is no second-pass "taste" tier.

## 1.5 What real builds have already failed (field-verified defects)

23 defects mined from the Deseret Marketing verification reports. The pattern is always a *rendering* failure
that code-level checks passed:
- **iOS zoom-on-focus** from 14px inputs (`.cg-input` enforces 16px).
- **H1 "Marketing thatruns itself."** regressed 4–5× — root cause was CSS `display:block` collapsing the
  whitespace, not the HTML; the fix never deployed (stale CSS hash).
- **Sticky CTA shipped as a header text link**, not an email bar; missing entirely in two audits.
- **AI-blue/cyan gradient lived through 7+ audits** against the required amber `#E8A33D`; gradient text on H1.
- **Contrast 4.6:1 "barely passing"**; a simulated "128 live visitors" fake-proof counter in the markup.
- **`undefined` rendered into the UI**; no confirm on a destructive prune; queue total typo (33 vs 32).

## 1.6 Missing canon (the baseline is thinner than it reads)

`~/projects` **does not exist on this machine**. So the canonical sources behind our notes are absent:
`japanese-lingo-lab/FINDINGS/*` (human-check evidence, kids touchscreen/co-viewing research),
`writing-story-lab`, `game-design-lab`, `uiux-self-improvement/GOAL-LOOP.md` (the fleet ledger and its queue),
JP-Lingo `plans/UI` + `plans/GAMES` specs, all DM `fire-shots/*.png` screenshot evidence, and
`AGENT-HANDOFFS/SOUL-humanifier.md` — the source the five lenses were copied from. **Treat the vault as
summary-level; do not invent the missing detail.**

## 1.7 Honest read of the baseline

Strong: conformance (WCAG 2.2 AA), state completeness, platform quirks, interaction-pattern library,
rejection lists, anti-slop tells. Weak — and this is the actual gap Keaton is pointing at: **positive
authorship.** No craft-density budget (how many type sizes/rhythms per viewport), no method for *choosing* a
typeface, no content/voice density target, no page-rhythm rule (prose:card:media ratio), no way to *invent* a
signature move, no art direction for imagery beyond "real screenshot > stock", and no second-pass taste tier.

---

# PART 2 — EVIDENCE: what actually moves one-shot quality (new research)

Ranked by strength of evidence (full citations in `research-oneshot-quality.md`):

1. **Constrain the generator with a component library, not prose style guidance.** CHI 2026 EA: registry-based
   (pre-built components, 95.08% compliance) vs context-based (84.55%) vs full style-guide-in-prompt (70.98%).
   **The strongest measured lever we found.** Tooling expressions: Vercel JSON-Render, Macaron-A2UI, Lumen.
2. **Reference-driven generation beats adjective prompts.** Design2Code (NAACL'25): text-augmented prompting +
   self-revision lifts GPT-4V Block-Match 85.8 → 88.8; 2026's 1D-Bench: iteration raises rendering success
   63.6% → 93.2%. `DESIGN.md` (Google Stitch, Mar 2026) is the practitioner standard.
3. **Rubric critique loops work — naive self-critique makes things worse.** RubSE: GPT-5.2 self-refinement
   finished **below round 0 in 15/15** cases; a typed, single-defect rubric fixes it (+1.2 avg). CITL +17.8%
   over 3 cycles. WebGen-Agent: screenshot-feedback iteration 26.4% → 51.9%.
4. **Execution verification catches the largest failure class.** 68% of AI-generated pages have ≥1
   cross-browser/device issue (WebCompat). LongWebBench: visually plausible output fails multi-step
   interaction. MobileForge: navigation unreliable.
5. **Learn the failure taxonomy so you can target it.** DCGen: of mistaken elements, **omission 85.3%**,
   misarrangement 12.7%, distortion 2.6% — i.e. the machine tells are *missing and misplaced*, not ugly.
   Design2Code (484 real pages) GPT-4o: Block 93.0 / Position 85.5 / CLIP 90.4; humans rated GPT-4V output
   "replace-worthy" 49% of the time. UI-Bench expert TrueSkill ranks Orchids 30.12 → v0 #9, Replit #10;
   laggards distinguished by generic CTAs, repetitive card grids, weak responsiveness.

**VLM-as-judge, with limits:** screenshot-scored feedback reaches 93–96% agreement on WebGen-Agent-style
tasks and beats axe on fact-grounded tracks (UIJudgeBench L1 F1 0.715 vs axe 0.381), but for holistic design
quality single-score judges agree with humans only **48.5%** vs **69.5%** for multi-dimension rubric judges,
and position bias is real (150k-eval study), worst when candidates are close. Use as a loop signal, calibrate
before gating.

**AI-slop: evidenced vs folklore.** Evidenced as *statistical defaults*: indigo/violet ramps, hero + 3 equal
cards, Inter-without-a-type-system, aspirational copy. Folklore/unmeasured: emoji-as-icons, glassmorphism,
stock imagery, "generic shadow". **Corrections worth keeping: brand purple is not a tell (Stripe scores 0);
Inter is fine when a real type system is underneath (Linear).**

---

# PART 3 — HUMAN COMPREHENSION: the "common person" numbers

From `research-human-perception.md` (28 findings, primary sources):
- **Time budget is brutal.** Visual appeal is judged in **~50 ms** and stays stable across exposures
  (Lindgaard 2006, r=.89); credibility forms by **~3.4 s** (Robins & Holmes 2008) — *not* 50 ms, which is the
  commonly garbled version. Value proposition must land within **10 s**; most sessions end at 10–20 s.
- **Nobody reads.** ~**28% of words** are read on an average page (~20% realistically); 79% scan vs 16% read
  word-by-word (Morkes & Nielsen 1997). **57% of viewing time is above the fold, 74% in two screenfuls, 81% in
  three** (NN/g 2018 eyetracking).
- **Copy is the cheapest large win:** concise **+58%**, scannable **+47%**, objective **+27%**, all three
  **+124%** (controlled test). Target **8th-grade** readability — 43% of US adults read at Basic or Below-Basic
  (NAAL 2003). Easy-to-read text is also judged *truer* (Reber & Schwarz 1999).
- **Forms sink conversions:** average cart abandonment **70.22%** (Baymard, 50 studies); average US checkout has
  **23.48 form elements (14.88 fields) vs ~7–8 needed**; 17% abandon over "too long/complicated", 19% over card
  trust; fixed checkout UX ≈ **+35.3%** conversion ≈ $260B. Defaults move behaviour enormously (consent
  42% → 82%).
- **Design is the top stated trust cue:** design look = **46.1%** of credibility comments vs information
  structure 28.5% (Fogg 2002, N=2,684); same content, better design moves credibility **−0.55 → +1.05**
  (Robins & Holmes). Trust seals are weak and >2 can *reduce* purchase completion.
- **"Looks human" is avoidable-defaults, not magic.** Blind tests: people detect AI vs human design at only
  **54–64%** (logos ≈ chance) — but the clichés are enumerable. Craft signals: distinctive type pairing,
  deliberate spacing rhythm, specific imagery, specific copy, brand consistency, restrained motion.

**WebAIM Million 2026 (verified directly):** **95.9%** of top-1M home pages have detectable WCAG 2 failures
(up from 94.8%; 2020 was worse at 98.1%); **56.1 errors/page**, +10.1%; low-contrast text **83.9%** (up from
79.1%, ~34 instances/page), missing alt 53.1%, missing form labels 51%, empty links 46.3%, empty buttons
30.6%, missing `lang` 13.5%. Six categories = **96%** of all errors. Only 17.1% of pages have a skip link.

**Myth-check (do NOT enforce these):** the goldfish/8-second attention span (fabricated — Microsoft Canada
marketing report → Statistic Brain, no underlying data); "credibility judged in 50 ms" (that study measured
visual appeal); "75% judge credibility by design" (garbled sum of 46.1 + 28.5); the 3-click rule (no data;
8,000+ clicks studied, no click-3 spike); 7±2 nav items (misreading of Miller; working memory is 3–5 chunks);
universal choice overload (the jam study is real, but a 50-study meta-analysis shows ~zero overall effect);
"users never scroll" (outdated); "Inter = AI font" (observation, no controlled study).

---

# PART 4 — VERIFICATION GATES (tooling, with the honest ceiling)

`research-qa-tooling.md` carries the per-tool detail. The number that governs everything: **automated a11y
tools catch ~57% of issues by volume but only ~32% of WCAG 2.1 A/AA success criteria** — and quoting "57% of
WCAG" is a misquote (Deque 57.38% is *issue volume* across 13,000+ pages; another analysis puts WCAG 2.2 AA at
~13% reliably testable, 45% partially, **42% not automatable at all**). axe + Intelligent Guided Testing
reaches 80.39%. In one 142-known-issue study axe alone caught 27% and Pa11y 20%.
**Zero violations does not mean accessible; Lighthouse 100 does not mean accessible.**

- **Web minimum gate:** eslint-jsx-a11y (36 active rules) → axe-core with the `wcag22aa` tag over a
  route × state matrix → Playwright `toHaveScreenshot` baselines → Lighthouse CI budgets (perf ≥90, a11y ≥95,
  bytes) → linkinator 0 broken → textstat FRE ≥60 → then **human**: keyboard + screen-reader spot check and a
  heuristics pass over the screenshot gallery.
- **Compose/Android minimum gate:** Paparazzi record/verify (or Google's official Compose Preview Screenshot
  Testing plugin, `updateScreenshotTest`/`validateScreenshotTest`) over a screen × state × config matrix →
  Compose UI tests → custom lint banning raw `Color`/`dp`/`sp` literals → semantics/a11y checks; human review
  of the PNG gallery in dark mode and at large font scale.
- **Core Web Vitals p75 budgets:** LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1.
- **Visual-regression notes:** Lost Pixel is sunset (team joined Figma) — don't adopt. Chromatic free 5k/mo.
  Argos open-core free 5k/mo. Percy pricing conflicted across sources — verify before paying.
- **Design-token drift:** Style Dictionary v4 (DTCG) + Stylelint token-lint rules to ban raw literals.
  Theo is deprecated.

---

# PART 5 — THE PIPELINE (how the pieces compose)

The baseline covers *rejection and conformance*. The research says one-shot quality comes from *constraint +
reference + rubric + execution*. Compose them:

0. **Load the baseline** — playbook checklist (L2386+), the one-shot skill, the five humanifier lenses.
1. **Write a positive-craft brief** (the missing tier): craft-density budget per viewport, chosen typeface with
   a stated reason, content/voice density target (specific numbers, real names, real nouns — no placeholders),
   page rhythm (prose : card : media ratio per section), one deliberate signature move, and the imagery art
   direction. *This is what the baseline never asked for.*
2. **Generate against a component registry + real reference** — not adjectives. Pin tokens and states, not prose.
3. **Rubric critique loop** — typed, single-defect rubrics, bounded rounds; never bare "improve this".
4. **Execution verification** — render every route × state, cross-browser/device, a11y, CWV, links, contrast
   computed.
5. **Comprehension pass** — front-loaded headings, first-2-words rule, 8th-grade copy, ≤7–8 form fields,
   value prop inside 10 s, everything important in the first two screenfuls.
6. **Humanifier pass** — the five lenses, verdict SHIP / FIX / BLOCK, written to `HUMAN-CHECK-<artifact>.md`.
7. **Evidence record** — screenshots + gate output + the verdict, so the next build starts from proof.

# PART 6 — FIX LIST for the baseline itself
1. Reconcile the two divergent `uiux-one-shot-polish` copies (pick one, sync, note the hash).
2. Either restore the 9 missing owning skills or rewrite the skill's pointers to existing ones — today they
   dead-end, so the skill silently under-enforces.
3. Re-number the duplicated Q labels and adopt `Q<n> @L<line>` citation everywhere.
4. Resolve the 8 flat-read contradictions (reduced-motion, disabled-controls, hamburger, zebra, font-display,
   measure 50–75 vs 65ch, adjacent-target spacing 24 vs 8–10px).
5. Accept that `~/projects` canon is gone on this machine: re-derive the five lenses' evidence or mark the
   lenses as the standing rule.
6. Add the missing positive-craft tier (Part 5 step 1) and a second-pass taste tier.

# Sources
Vault baseline: `UI-UX One-Shot Playbook.md` (with line anchors above) · `JP-Lingo/humanifier-research.md` ·
`ai-index/design-systems-ui.md`, `ai-index/writing-code-quality-anti-slop.md` ·
`UX-UI-Audit-OpenFinance-2026-08-07.md` · `DM/DM-CODER-STATIC-MOBILE-AUDIT-20260909.md`,
`DM/TICK-REPORT-dm-coder-20260909-cro-audit.md`, `DM/TICK-REPORT-dm-coder-20260909-critique-g7prep.md`,
`DM/MATERIALS-AUDIT-20260909.md` · `Coding-Practices/`. Skill roots: `.hermes/skills`,
`.hermes/profiles/{personal,work}/skills`. External: Design2Code (NAACL'25), 1D-Bench (2026), CHI 2026 EA
component-registry study, WebGen-Agent, CITL (Amazon AGI), RubSE, DCGen taxonomy, UI-Bench, UIJudgeBench,
Lindgaard 2006, Robins & Holmes 2008, Fogg 2002 (N=2,684), Morkes & Nielsen 1997, NN/g 2018 eyetracking,
Baymard checkout research, WebAIM Million 2026, Deque coverage report (57.38% by volume), accessible.org
WCAG 2.2 AA testability split, web.dev CWV thresholds. Full URLs in the cache artifacts.
