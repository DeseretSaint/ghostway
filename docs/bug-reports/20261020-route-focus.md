# Bug report: route only renders after focusing current location (hidden dependency)

Date: 2026-10-20. Reported by Keaton (live, watching the bot drive the phone).
Screenshots: `docs/bug-reports/20261020-main.png` (map/search start), `docs/bug-reports/20261020-whereto.png` (Where-to? state, after `am start`).

## What Keaton observed
Whichever bot is driving the phone never clicks the **Route me clear** button — or clicks it and no route appears. Walking through the flow: the app shows **Your location** in the bottom sheet; **over to the right there is a dot you have to click first** so the map focuses on the current location; only then does **Route me clear** produce a visible route. A bot (or a new user) that doesn't know this hidden first step gets a blank route.

## What vision verified on 20261020-whereto.png (1080x2392)
- Bottom sheet: **Your location** field (~x50–870, y1321–1434), **Where to?** field below it. No "Route me clear" button in this state (it appears only after a destination is picked).
- Top right, inside a dark rounded-square button: a bare **teal glowing dot, no icon, no label** — center ≈ (747,183), dot ~18–22px. A white crosshair/recenter button sits next to it at ≈ (850,177); a second white crosshair sits inside the "Your location" row at ≈ (801,1387).
- No user-location puck visible on the map center; map is not focused on the user by default.

## Judgment
The teal dot is almost certainly the locate/recenter control but it reads as a status dot (no icon, no label, no tooltip) — which is exactly why Keaton said earlier it "serves no purpose", and why the bot does not click it before routing. This is a real UX design flaw, not just a bot behavior gap: **the route action has an invisible precondition.**

## Required fix direction (designer spec + coder implementation)
1. Make **Route me clear** work without the hidden precondition: either auto-focus the current location when a route is requested, or route from "Your location" regardless of map center.
2. Give the locate control a real affordance: an icon + label/tooltip (e.g. crosshair/compass), active state when focused — per canon "message shown never explained" and "every element earns its place".
3. State in the route UI when location is not yet focused (e.g. "Locating you…" until focused) instead of silently doing nothing.

## Acceptance for the fix
- A fresh session: pick destination → tap **Route me clear** → a route renders without any extra dot tap.
- The teal dot is either converted to an obvious locate control (icon + label + focused state) or removed/replaced.
- Vision-verified before/after screenshots of the destination screen + route state.
