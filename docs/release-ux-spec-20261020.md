# Ghostway release UX spec 2026-10-20

Status: draft for Sophia review. Scope per docs/CODEBASE-MAP.md designer lane.
Sources read: index.html onboarding block L242-255, src/main.js onboarding L2375-2449 and first run trigger L154-155, src/ui.js overlays and route card, src/styles.css onboarding L1753-1930 and touch sizes, src/config.js flags and about copy, src/map-view.js visual only, GHOSTWAY-UX-GOAL.md mission and victory list, knowledge canon cited per item below.

Design laws applied to everything below: Zen first, message shown never explained, one focal hierarchy per frame. Disputes go to Sophia.

House style note: all product copy in this spec ships as final strings. Straight quotes only. No em or en dashes. No promise words in product copy.

## 1. First run onboarding walkthrough

### 1.1 Verdict on current state

The current dialog at index.html L243-255 with steps defined in src/main.js L2382-2398 is a 3 screen instructional deck: avoid cameras, data stays, navigate like a pro. Per canon this is the weakest format. Playbook Q41 L1117 ranks deck of cards walkthroughs as not recommended because they are instructional and forgotten, and Q41 L1110 says to avoid dedicated onboarding and spend effort on usable UI instead. Q233 L1206 repeats the default no onboarding rule with 3 justified cases only. Ghostway qualifies under case (c), one genuinely novel interaction the UI itself cannot convey, which is camera avoidance routing, plus case (b), one time mode choice. So the correct move is not removal but reduction: keep the existing dialog shell and shrink it to 2 task based screens with Skip always visible, per Q41 L1118 which favors activation driven contextual form over instructional decks, and Q233 L1209 which caps benefit onboarding at 3 to 4 screens max.

One focal hierarchy per frame: each screen gets one icon, one head, one short body, one primary action. Zen first: cut the third screen entirely and let the empty route card do that job. The empty card in src/ui.js renderEmptyRouteCard already says Where to with a search prompt, which is the pull style guidance Q41 L1112 prefers.

### 1.2 Flow spec, uses existing shell, no new markup

Step count: 2. Dots: 2, first on at step 1. Buttons reuse obSkip, obBack, obNext.

Step 1: task. Head plus one line of how plus primary Next.
Step 2: trust plus first action plus primary Get started.
Back is hidden on step 1, visible on step 2. Skip is visible on both and finishes immediately, writing gw-onboarded 1, hiding the wrap, returning focus to menuBtn, same as current finish in src/main.js L2409-2425. Never show again once gw-onboarded is set. Tour relaunch from the drawer reuses the same 2 steps. Focus moves to obNext on open, same as current L2448. Reduced motion path already in styles.css stays as is.

Permission note: no location prompt inside onboarding. Permission timing stays in context at the locate button, per Q233 L1208 and the Q33 pattern referenced in the retrofit table.

### 1.3 Final copy blocks

Screen 1 eyebrow: none.
Screen 1 head: Plan a route that skips cameras
Screen 1 body: Type a start and a destination. Ghostway picks a path that avoids known plate readers. You choose how strict it is.
Screen 1 primary: Next
Screen 1 secondary: Skip

Screen 2 head: Nothing about you leaves this phone
Screen 2 body: No account. No tracking. Routing runs on your device where coverage exists. Skip the tour and try one search to see it work.
Screen 2 primary: Get started
Screen 2 secondary: Back
Skip button label, both screens: Skip

String checks: heads are verb led per empty state guidance Q11 L236-240. Bodies name the cause and the next action. No theme or color picker is requested, per Q41 L1115. Location and notification asks are absent here, per Q233 L1208.

### 1.4 Why this passes Q41

Task based beats walkthrough, cited at Q41 L1118 boundary note referencing task based results. Two screens sit inside the Q233 L1209 cap. Skip plus never show again follows Apple HIG rules cited at Q233 L1212. Cost boundary Q41 L1120 is respected by deleting a screen instead of adding one.

## 2. Developer mode entry

### 2.1 Recommendation

Ship ONE path: a visible Developer mode switch in a Settings sheet, default off. Reject the hidden multi tap path.

Rationale: hidden gestures are undiscoverable by definition and carry the same cost canon assigns to hidden navigation, which is measurably used less and later, Q39 L1620. A visible switch applies immediately with no Save bar, per Q96 L1919, and toggles apply instantly with the current value shown inline, per Q241 L1312 and Q241 L1318. Polite defaults apply, per Q241 L1315: off for every user until chosen. Role gating follows Q103 L1931: dev controls are hidden while the switch is off, never a wall of disabled buttons. The switch row uses plain language with no jargon, per Q241 L1316.

Placement: new Settings sheet opened from the drawer, grouped sections with clear headers, per Q241 L1311. Groups: Map, Voice, Units, Developer. Developer is the last group, above nothing destructive, since dev tools are not data destructive. If a full Settings sheet cannot ship in this release, the fallback position is a Developer row at the bottom of the drawer above View source on GitHub, same switch behavior, same copy.

### 2.2 Final copy blocks

Settings group header: Developer
Row label: Developer mode
Row state off: Off
Row state on: On
Row sub: Shows engine details and test tools. For debugging only.

Warning dialog, shown once when turning on:
Title: Turn on Developer mode
Body: This shows raw engine data and test tools that can clutter a normal trip. Your routes avoid known cameras the same way with it on or off.
Confirm: Turn on
Cancel: Not now

On state inline note under the row: On. Extra tools are for testing. Turn off for normal trips.
Off state: no note, no badge elsewhere, no persistent banner. A banner would violate Zen first for a non critical state.

Toast after change, per Q44 severity hierarchy and Q96 autosave confirmation L1920:
Turned on: Developer mode on. Test tools added to the menu.
Turned off: Developer mode off.

### 2.3 Behavior spec

Switch commits immediately on tap, no Save. Turning on opens the warning dialog first; Confirm commits, Cancel leaves it off. Focus follows Q61 L1635: into the dialog on open, back to the switch on close. Dev rows elsewhere stay hidden while off, appear while on, with no layout shift on the map canvas, per Q103 L1935. The flag persists in localStorage next to gw-mode and gw-onboarded. Reduced motion applies to the sheet per Q12 as already handled in styles.css.

## 3. Typed UI and QoL retrofit list

Severity: blocker means stop the release, should fix means land before release if possible, nit means polish when cheap. Each row cites its canon line. Wording avoids bold lead ins by design.

| ID | Area | Finding in current scope | Fix | Severity | Canon cite |
|----|------|--------------------------|-----|----------|------------|
| R1 | Touch targets | Legend, dismiss, and chip buttons rely on text glyphs with unclear hit areas: legendBtn uses a text mark at index.html L85, staleDismiss and batteryDismiss are bare x buttons at L49 and L53, swapBtn uses a glyph at L137. Goal victory item 2 requires every interactive element at 44px or larger. | Give every map chip, dismiss, and row button a 44px or larger hit area with 8px spacing, pad the icon not the glyph, keep the 44px audit from R2.5 green. | blocker | Playbook Q8 L190-192 comfort floors 44pt iOS and 48dp Android; Q229 L1158 map overlay controls at 44px with 8px spacing; GHOSTWAY-UX-GOAL.md victory item 2 |
| R2 | Map controls | Zoom group exists at index.html L93-103 with plus and minus buttons, good. Legend panel at L105-111 and layers sheet at L74-83 can overlap the panel on small screens, and the compass only appears on rotation. | Keep plus and minus zoom buttons in hierarchy order away from search and locate, keep one legend entry point, anchor sheets above the bottom action bar with safe area padding. | should fix | Playbook Q229 L1157 zoom buttons positioned by hierarchy; Q8 L195-196 viewport fit cover plus safe area insets; Q229 L1156 map as canvas with bottom sheet detents |
| R3 | Mode picker | Two pickers now exist: mode switch in the search panel at index.html L143-147 and chip row in the route card from src/ui.js chip function. Two pickers for one choice splits the focal hierarchy. | One choice, one control per frame: panel picker before routing, card chip row after routing, same three labels, same order, same persisted gw-mode, selected state shown with more than color alone. | should fix | Playbook Q39 L1622 expose primaries, Q17 non color only signaling via Q39 L1623; GHOSTWAY-UX-GOAL.md one clear primary path |
| R4 | Zero scroll | Route card already expands the panel to fit without vertical scroll in src/ui.js renderRouteCard. Steps sheet list at styles.css L1053 scrolls by design. | Keep route card zero scroll. Give the steps scroll container keyboard focus with a name, keep the native bar visible when scrollable so iPhone panes show affordance. | should fix | Playbook Q112 L1966 scroll region must be keyboard focusable, L1969 overflow affordance with visible bar; UX goal calm motion and focus states |
| R5 | POI and route deletion semantics | Community report delete at src/main.js L195-200 deletes immediately with no undo. No confirm is correct for low stakes, but no recovery path loses work on a slip. Publish to OSM is one way, delete of a published note needs its own copy. | Local delete becomes undo via snackbar with verb labeled action, hard delete deferred until the snackbar times out. Published items name the consequence in the button, Delete report stays local only or say what happens on OSM. Keep destructive control far from benign actions. | should fix | Playbook Q38 L931-934 prefer undo over confirm, L946-949 snackbar undo with truthful restore, L939 proximity rule; Q242 L1339 never lose work |
| R6 | Camera layer toggles | Layers sheet at index.html L74-83 uses native checkboxes with titles and descriptions, good. Names overlap: Cameras versus Full camera database. Users cannot tell which one drives routing. | Keep native checkboxes. Rewrite rows in plain language with current state inline: Avoidance layer on or off, Full database shown or hidden. Note under the avoidance row: Drives route choices. Note under the full row: Map only, not routing. | should fix | Playbook Q241 L1316 plain labels no jargon plus L1318 show current state inline; src/config.js routing uses road relevant readers only |
| R7 | Search field | From and To inputs at index.html L120 and L130 lack explicit labels and rely on placeholder text, which fails when the user types. | Keep placeholders as hints, add persistent labels above each field, keep 16px input text to avoid iOS zoom, keep combobox wiring with expanded state. | should fix | Playbook Q232 L1195 placeholder is not a label; Q36 L975 combobox pattern; design verification digest field defect on iOS zoom from 14px inputs |
| R8 | Empty and error states | Empty route card in src/ui.js renderEmptyRouteCard names the first action, good. Offline banner at index.html L46 names state and consequence, good. Generic modal errors elsewhere should name what failed plus retry. | Keep empty card as the pull style first action pitch. Error copy format: what failed, what the user can do, retry where possible. Preserve typed endpoints on failure. | nit | Playbook Q11 L236-247 empty route by cause plus error anatomy; Q242 L1338 empty is first action pitch plus L1339 inline error with work preserved |
| R9 | Icon consistency | Mode icons already moved to SVG in src/ui.js modeEmoji. Remaining text glyphs as icons: legend mark, swap arrows, close x marks, clear x marks. | Replace text glyph buttons in chrome with the inline SVG set, currentColor, aria hidden icons with labeled buttons. | nit | Playbook Q5 L113-120 one set one style one grid; GHOSTWAY-UX-GOAL.md victory item 3 zero emoji as functional icons |
| R10 | Motion and focus | Card and step transitions exist with reduced motion guards in styles.css. Drawer exit animation shipped in R4. | Keep durations in the 100 to 500ms window, entrances ease out, keep opacity crossfades under reduced motion, keep visible focus rings on all interactive elements. | nit | Playbook Q235 L1230 duration window plus L1237 reduced motion keep opacity; GHOSTWAY-UX-GOAL.md visible focus states |

## 4. Tick report

Commands were run from /home/deseretcore/projects/ghostway on 2026-10-20. The spec file did not exist before this run, so this run created it, then checked it.

Command 1: write docs/release-ux-spec-20261020.md
Output: write_file verified true, file created.

Command 2: grep -P for em dash, en dash, and curly quotes in the new spec
Command: grep -P -n "[\x{2013}\x{2014}\x{2018}\x{2019}\x{201C}\x{201D}]" docs/release-ux-spec-20261020.md; echo exit=$?
Output: exit=1, no lines matched. Result: 0 em dashes, 0 en dashes, 0 curly quotes in this spec.

Command 3: grep for bold lead ins in the new spec
Command: grep -n "^\s*[-0-9| ]*\*\*" docs/release-ux-spec-20261020.md; echo exit=$?
Output: exit=1, no lines matched. Result: no bolded lead ins.

Command 4: scope presence check
Command: ls -l docs/release-ux-spec-20261020.md && grep -c "Q41\|Q229\|Q38\|Q96\|Q241\|Q103\|Q112\|Q39" docs/release-ux-spec-20261020.md
Output: file present, 16 canon cite lines. Every recommendation above carries at least one cite.

## 5. Not verified

I did not run npm run build, screenshot, or contrast scripts. This lane delivers specs and strings, never code edits, so build state is unchanged by this run. I did not re measure touch targets with a headless pass, I read styles.css values and markup only. I did not test the Settings sheet because it does not exist yet, the spec defines it. I did not verify OSM delete semantics against the notes API, the spec asks the implementer to confirm whether Delete report affects a published note. Contrast and focus ring claims for new copy assume existing tokens, the implementer should re run the contrast check.

## 6. Live device visual defect deltas, 20261020 bug report shot

Vision pass: I loaded docs/bug-reports/20261020-main.png with vision_analyze before writing this section. The pass confirmed defect 1, a dead zone between the top left hamburger and the info button about 2 to 3 button heights tall, roughly 150 to 200px of empty space against tight spacing inside the stack below. It confirmed defect 2, a dark rounded square top right holding only a small centered teal dot with no icon, text, or label, next to the crosshair button. The same pass noted other items in the shot: repeated Where to text in the bottom panel, the mi text chip breaking icon uniformity in the left stack, the diamond mark floating without a container, a map street label partly covered by the top left buttons, heavy glow on the red map dots, and loose empty space inside the bottom panel. Only the two Keaton reported defects are spec'd below. The rest are logged at the end of this section for triage, not spec'd here.

Design laws on both items: Zen first, message shown never explained, one focal hierarchy per frame.

### D1. Left stack gap between menu button and info button

Root element: button#menuBtn.icon-btn in header#topbar at index.html L28-31, versus the chip stack button#legendBtn.map-chip at index.html L85, button#basemapBtn at L87, button#unitsBtn at L91, button#layersBtn at L70. Position rules: .map-chip base at src/styles.css L1425-1442, offsets #legendBtn L1452, #basemapBtn L1453, #unitsBtn L1457, #layersBtn L1459.

Cause: absolute positioning with disconnected origins, not a flex spacer. The topbar ends near 62px CSS top plus 52px height while the first chip opens near top plus 116px CSS, which scales to the reported 160 to 170px device gap at phone density. One full 52px step in that distance is dead: the stylesheet still carries a #camLayerBtn sibling rule at L1448 for an element no longer in the markup, so the stack keeps an empty first slot.

Change, implementation ready, keeps the 44px touch size and the 8px inter chip rhythm with a 52px step equal to 44 plus 8:

```
#legendBtn { top: calc(max(70px, env(safe-area-inset-top) + 64px)); }
#basemapBtn { top: calc(max(70px, env(safe-area-inset-top) + 64px) + 52px); }
#unitsBtn { top: calc(max(70px, env(safe-area-inset-top) + 64px) + 104px); }
#layersBtn { top: calc(max(70px, env(safe-area-inset-top) + 64px) + 156px); }
.layers-sheet { top: calc(max(70px, env(safe-area-inset-top) + 64px) + 208px); }
```

Plus: delete or retarget the stale #camLayerBtn rules at src/styles.css L1448-1450, and mirror the minus 52px shift in the four #navBanner:not([hidden]) rules at L1450, L1456, L1458, L1461 so the stack still drops clear of the banner during navigation. Intended rhythm after the fix: 12px CSS from the topbar bottom to the first chip, then 8px CSS between chips, which reads as a steady 20 to 30px rhythm at device pixels. No new copy. No new element.

Rationale: Playbook Q229 L1158 map overlay controls at 44px with 8px spacing, pad the icon not the glyph. Playbook Q2 L45-47 4px inside components and 8pt multiples between components, plus Q2 L50-55 pin ranges to one value per project. GHOSTWAY-UX-GOAL.md victory item 2 at 44px or larger and item 6 consistent spacing rhythm on a 4/8 grid. Removing dead space serves Zen first. Nothing is added, so the focal hierarchy is unchanged.

### D2. Top right dot only button

Decision: keep it and give it a readable purpose. Remove is rejected.

Root element: button#safety-pill.safety-pill at index.html L36-38 with span.dot styled at src/styles.css L239-244 and span.label beside it. Behavior in src/main.js: click cycles Strict to Balanced to Fastest, persists gw-mode, and applyModeUI rewrites the label per mode. Collapse rule at src/styles.css L911-921 hides .safety-pill .label at max-width 420px, which is exactly Keaton's phone width, leaving the 8px dot centered alone in the pill. The function exists but the visible message is a dot with no name, so it reads as a dead indicator.

Change, implementation ready:

1. Delete the `.safety-pill .label { display: none; }` line inside the max-width 420px query. The label stays visible at every width.
2. Shorten the visible pill labels so they fit a phone topbar, with the full state in aria-label and title. Final strings:
   Strict visible: Strict
   Strict aria and title: Camera avoidance Strict, tap to change mode
   Balanced visible: Avoiding
   Balanced aria and title: Camera avoidance Balanced, tap to change mode
   Off visible: Fastest
   Off aria and title: Camera avoidance off, tap to change mode
3. Keep the dot as a state signal with the existing .off treatment, always paired with the text label, and keep the 44px pill height with ellipsis truncation if the topbar crowds.

Rationale: every element earns its place, and a lone dot earns nothing, so the dot alone goes and the labeled control stays. Message shown never explained: the pill now names its state and its tap action in place. Playbook Q241 L1316 plain labels with no jargon plus L1318 show current state inline. Playbook Q17 non color only signaling via Q39 L1623, dot plus text instead of dot alone. Playbook Q44 severity hierarchy plus the Q44 rejected list, a lone dot reads as badge noise. The pill is the only top level avoidance state with one tap mode cycle, which is why removal would cost the mission signal.

### Logged for triage, not spec'd in this section

Repeated Where to placeholder plus heading: owned by retrofit R8 empty states. Text mi chip among SVG icons: owned by retrofit R9 icon consistency. Floating diamond brand mark: brand lockup, needs its own critique round. Street label under top left buttons and red dot glow rendering: map canvas, coder lane in src/map-view.js. Bottom panel loose space: panel detents per Q229 map as canvas pattern, separate pass with keyboard open and closed states.

## 7. Tick supplement for section 6

Command 5: vision pass on the bug report shot
Tool: vision_analyze on docs/bug-reports/20261020-main.png
Output: both defects confirmed, gap estimated at 2 to 3 button heights and dot only button with no icon or label confirmed, plus six extra observations logged above. Result: acceptance item 1 met.

Command 6: root element grep for the pill behavior and the stale chip slot
Command: grep -n "safety-pill" src/main.js index.html; grep -n "camLayerBtn" src/styles.css index.html
Output: src/main.js click cycle plus applyModeUI label rewrite present, index.html L36-38 pill with dot plus label, src/styles.css L1448 stale #camLayerBtn rule with no matching element in index.html. Result: D1 cause and D2 cause named above.

Command 7: house style check on this spec after appending section 6 and 7
Command: grep -P -n "[\x{2013}\x{2014}\x{2018}\x{2019}\x{201C}\x{201D}]" docs/release-ux-spec-20261020.md; echo exit=$?; grep -n "^\s*[-0-9| ]*\*\*" docs/release-ux-spec-20261020.md; echo exit=$?
Output: exit=1 on both, no lines matched. Result: 0 em dashes, 0 en dashes, 0 curly quotes, no bolded lead ins.

## 8. Not verified in section 6

I did not capture a fresh live device screenshot, the device address in the card was not reachable from this run, so before and after device shots stay with gw-coder at implementation time. I did not run npm run build, this lane ships specs and strings, never code edits. I did not measure the new chip offsets on hardware, values are computed from the stylesheet tokens and need one headless shot pass plus one live shot pass to confirm. I did not test the shortened pill labels for topbar overflow at 360px, the implementer should check 360 and 390 widths with the longest label.
