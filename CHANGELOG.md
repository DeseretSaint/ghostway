# Changelog

All notable changes to Ghostway. Format follows Keep a Changelog; versions
follow Semantic Versioning. Dates are UTC.

## [1.0.0] - 2026-10-20

First public release. The app version is now a single number carried by
`package.json`, `src/config.js` (`CONFIG.version`) and
`android/app/build.gradle` (`versionName`). The Android `versionName` string is
reset from the old internal `1.0.3` to `1.0.0` so the store-free APK and the web
build report the same version. The Android `versionCode` moves to 11, above the
internal update-flow verification builds (code 9 and 10), so a sideloaded
1.0.0 APK installs over them.

### Routing and camera avoidance

- The shipped Strict floor is now the audited floor. `scripts/avoidance-audit.mjs`
  and `scripts/avoidance-audit-random.mjs` assert a 75 m minimum over the full
  served polyline with no endpoint tolerance (mid-route figure is reported for
  information only, G-71). The engine's `HARD_CAM_EXPOSURE` of 64 forbids strict
  edges within about 75 m of a plate reader. This replaces the old 30 m
  threshold that passed routes
  the product calls clear. The random audit takes `FLOOR` and `NEAR_CAM` from
  the environment but defaults to the shipped promise.
- The fixed audit corpus now carries named regression cases keyed to the field
  reports they protect: K1 PG to Costco Lehi, K2 PG to BYU Provo, K3 Lehi to
  SLC Downtown, K4 Orem to SLC Airport, K5 American Fork to Park City,
  K6 State St N to S across F#006 (600 m trip), and homedepot-flock
  (PG to Home Depot American Fork, the live route that hugged a plate reader).
  Each case declares an expectation of `clear` or `best-effort`; a `clear` case
  that falls back to best-effort now fails the audit with a line naming the
  report id.
- Code comments in both audits record why the floor is 75 m instead of the
  bare plate-reader range, so a future edit that weakens the audit is visible
  as a contract change rather than a tuning tweak.

### Camera data

- Flock camera snapshot refreshed to `2026-10-20T23:01:30Z` (in-repo was
  `2026-10-01T13:38:52Z`). The snapshot carries 351,914 camera features
  (`_meta`: 143,912 DeFlock + 208,002 Flock research, 119,736 matched).
- The Wasatch routing graph was rebuilt from the new snapshot
  (`public/graph/wasatch-graph.bin.gz`, sha256
  `6197852f4c4ddf05729d0d7e1da098a9dfe241678deeb3229dafe19132fe4af5`), built
  five minutes after the snapshot file so its camera exposure bytes reflect
  this snapshot.

### Android Auto

- Root cause of the reported "Ghostway never appears on the head unit":
  `android/app/src/main/res/xml/automotive_app_desc.xml` declared the legacy
  `navigation` capability. Apps built on the Android for Cars App Library must
  declare `template`; with the wrong declaration the Auto host never
  discovers the `CarAppService`, and the failure is silent. The file now
  declares `template` and the history is recorded in the file itself.
- Added `scripts/aa-manifest-check.mjs`, a hermetic check of everything the
  Auto host validates: capability, `com.google.android.gms.car.application`
  meta-data, service export plus `CarAppService` action and `NAVIGATION`
  category, `NAVIGATION_TEMPLATES` permission, host allowlist, service
  behaviour (host validator, NavigationTemplate, ListTemplate, NavState
  listener lifecycle), the WebView `AABridge` to `NavState` path, and the
  Gradle dependencies and compile SDK.
- `docs/android-auto-setup.md` rewritten where it was stale and given an
  install and first-use protocol that matches the shipped APK.

### App

- First-run onboarding reduced from three instructional screens to two
  task-based screens (plan a route that skips cameras; nothing about you
  leaves this phone). Skip is present on both, back on the second only, and
  the tour relaunches from the drawer with the same two steps.
- Developer mode is now a visible switch at the bottom of the drawer, off by
  default, committing on tap and persisting in `localStorage` under
  `gw-devmode`. Turning it on asks once. While on, an Engine details row
  appears showing engine state, app version, route summary and the camera
  snapshot date. Turning it off hides the row immediately.
- House style pass on shipping copy: em and en dashes replaced with plain
  punctuation in `index.html` and in the user-facing strings of `src/config.js`;
  curly apostrophes straightened. The `CONFIG` source comments still carry
  them and are stripped from the bundle. Em dashes remain inside strings in
  `src/ui.js`; that file is outside this release's edit scope and is listed as
  open work below.

### Release engineering

- `docs/release-ux-spec-20261020.md` records the design spec this release
  implements (sections 1 and 2 landed; the retrofit table in section 3 is
  tracked, not shipped).
- Verdict battery is the release gate: build, engine-check, snap-dist-check,
  avoidance-audit, avoidance-audit-random with a fresh seed, engine-e2e,
  interact-check, overflow-check, dot-feeds-check, apk-webview-a11y-check,
  aa-manifest-check, and release-version-check (added here to keep the web
  and Android version strings in lockstep). The `v1.0.0` tag is not cut until
  every one of those exits 0 on the tagged commit; this entry does not claim
  a green result for a check that has not produced one.

### Known limitations

- Android Auto is not head-unit-verified in this release. The APK installs and
  its WebView surface was exercised on a device, but no Android Auto host or
  head unit was available, so a bound `CarAppService` on the Auto host was not
  observed. The Auto wiring is asserted statically by `aa-manifest-check.mjs`
  plus the APK build.
- Em dashes remain in the built bundle (41 occurrences), mostly user-facing
  strings in `src/ui.js` plus one character-map table inside a bundled
  dependency. House style is not fully met on that surface yet; fixing the
  copy is a UI-lane change, not a routing or release-engineering one.
- Destinations that are genuinely camera-walled, or whose clear path breaks
  the detour budget, are still served as honest best-effort. Cases K2 and K5
  in the audit corpus are that shape by design.
