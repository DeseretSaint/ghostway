# Ghostway 1.0.0 release notes (draft for review)

Status: draft. Not published. Publish is gated on Keaton's token (G-60); this
file is the text to paste into the GitHub release when the gate opens. Tag
candidate: `v1.0.0` on the commit that ships this file (do not tag before the
gate).

---

Ghostway is a free, open-source navigation app that routes you around known
ALPR and Flock Safety plate readers by default. Version 1.0.0 is the first
release with a single version number across web and Android, an Android Auto
path that the Auto host can actually discover, and an avoidance audit that
holds the same 75 m floor the engine promises.

## What changed

Camera avoidance is audited at the promise, not below it. The engine already
refused strict routes within about 75 m of a plate reader; the audit only
checked 30 m, so a route could pass review while being inside the promise's
failure band. Both audits now assert 75 m over the full served polyline, with
no endpoint tolerance, and the fixed corpus carries seven named regression
cases (K1 to K6 plus the Home Depot American Fork case) tied to the field
reports they protect. A clear corridor that collapses to best-effort fails
with the report id in the message.

Android Auto was broken by a one-line capability typo, and it failed
silently. `automotive_app_desc.xml` declared `navigation`, which is the legacy
Auto capability; the Car App Library requires `template`. The Auto host never
discovered Ghostway's `CarAppService`, so the app never appeared on the head
unit no matter how unknown sources were set. That file now declares `template`,
and `scripts/aa-manifest-check.mjs` pins every declaration the host validates
so the mistake cannot ship again.

Camera data is current to 2026-10-20T23:01:30Z: 351,914 camera features in the
national snapshot, and the Wasatch routing graph was rebuilt from that
snapshot so its camera exposure bytes match it.

First run is shorter. Onboarding is two task-based screens instead of three
instructional ones, and it still never asks for location. Developer mode is a
visible switch at the bottom of the drawer, off for everyone until chosen;
turning it on adds an Engine details row showing engine state, app version,
route summary and the camera snapshot date.

## Install

Web: open the app in a browser and add it to your home screen. It works
offline for routing where the regional graph is bundled.

Android: download `ghostway-android.apk` from the `android-latest` release and
sideload it. Android Auto needs developer mode and unknown sources enabled in
the Auto app; step by step in `docs/android-auto-setup.md`.

## Known limitations

- Android Auto is not head-unit-verified for this release. The wiring is checked
  statically and by the APK build; the APK was installed on a phone, but no Auto
  host or head unit was attached to observe a bound `CarAppService`.
- Camera-walled destinations, or ones whose clear path breaks the detour
  budget, are served as honest best-effort, labelled as such, never as clear.
- Ghostway avoids known camera locations. It does not make you invisible, and
  the release notes do not claim that it does.

## Verify it yourself

The full battery that gated this release is in the repo:
`npm run build`, `scripts/engine-check.mjs`, `scripts/snap-dist-check.mjs`,
`scripts/avoidance-audit.mjs`, `scripts/avoidance-audit-random.mjs` (fresh
`SEED`), `scripts/engine-e2e.mjs`, `scripts/interact-check.mjs`,
`scripts/overflow-check.mjs`, `scripts/dot-feeds-check.mjs`,
`scripts/apk-webview-a11y-check.mjs`, `scripts/aa-manifest-check.mjs`.
