# UI/UX build + audit digest (extracted, not whole)

Source: `knowledge/UI-UX-ONE-SHOT-PLAYBOOK.md` (640 KB, 253 sections). This digest carries only the sections a lane can
EXECUTE: the core rule, the one-shot build checklist, the audit pass for an existing build, the anti-slop design tells,
and the agent-consumable checklist line.

**Read the source file for a specific component question** (pricing tables, colour pickers, role-based UI, link affordance,
text wrapping) - it is indexed by section heading. Do not load the whole file into context.

Provenance: personal vault, pulled 2026-10-17 with the owner's instruction.

---

## Core rule

- A CUSTOM pull-to-refresh gesture is a PATH-BASED gesture (top-of-scroll vertical drag w/ direction+distance+speed thresholds) → it MUST have a single-pointer alternative under WCAG 2.5.1. **CORRECTION:** the W3C Understanding doc contains ZERO occurrences of "refresh" and names NO pull-to-refresh failing example — F105's only examples are the "Z"-gesture undo + swipe-to-reveal. The rule still stands by construction, and 2.5.7 (Dragging) covers it if classed as a drag. Cite **F105's tap-alternative TEST**, NEVER a W3C-named example. A visible Refresh button satisfies the rule — and is the discoverability fix too.
- 2.5.1 covers **author-provided content only**; the browser's own pull-to-reload and native iOS/Android refresh controls are OUT of scope (only a custom JS pull-to-refresh is author content).

## Cargo-cult rejected (Q49)

- "Pull-to-refresh on every list" (adds discoverability + 2.5.1 burden where a button suffices).
- "W3C names pull-to-refresh as a failing example" (FALSE — cite F105's tap-alternative test).
- Treating UA/OS-provided refresh gestures as in-scope for 2.5.1 (author content only).

## Agent-consumable checklist line

- [ ] Manual refresh: visible Refresh control exists (WCAG 2.5.1 alternative); NO gesture on a pannable map (Material Don't list + Q27); control doubles as sync-queue trigger (Q30); web uses `overscroll-behavior: contain` (iOS Safari 16.0+) or a visible button on older iOS; native platform control, not hand-tuned px.

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
