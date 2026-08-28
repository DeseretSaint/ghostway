# Android Auto / CarPlay support for Ghostway — research + recommendation

Status: researched 2026-08-27 (slot-B, queue item 3 from the 16:15 Waze-feedback
priority block). Implementation is a follow-up run; this doc is the spec.

## Constraints (unchanged)

- 100% open source, no API keys at runtime, no telemetry.
- Ghostway is a PWA (Vite + vanilla JS + MapLibre, custom Wasatch graph engine).
- Keaton's head unit: Android Auto confirmed working with SIDELOADED APKs —
  AA developer mode ("Unknown sources", enabled by tapping the AA version ~10x
  in About) runs non-Play-Store apps that declare AA head-unit support
  (Keaton verified himself with NewPipe). This removes the Play Store blocker.

## Android Auto — RECOMMENDED, do this first

### How AA apps work
Android Auto does NOT render your app's UI. It renders Google's templates from
metadata your app supplies via the **Android for Cars App Library**
(`androidx.car.app:app`, Apache-2.0, samples: github.com/android/car-samples →
car_app_library). Navigation apps get `NavTemplate` (turn-by-turn steps,
distance, ETA, route preview) plus `MapTemplate`/`RoutePreview`/list templates
for search & route options. Requirements:

- minSdk 23; manifest permission `androidx.car.app.NAVIGATION_TEMPLATES`.
- A `CarAppService` declared with intent-filter
  `androidx.car.app.CarAppService` + category `androidx.car.app.category.NAVIGATION`.
- Template step-count cap (~5 steps per flow) — route options must be shallow:
  search → route preview → navigating. This fits Ghostway's flow exactly.
- Testing: Desktop Head Unit (DHU) or a real head unit; both require
  "Unknown sources" enabled in AA developer settings — the same toggle that
  makes sideloaded APKs work.

### The two approaches Keaton asked about
1. **car-app-library (NavTemplate)** — the real path for turn-by-turn nav.
   You supply route steps/ETA; AA draws the native head-unit UI. This is what
   every AA nav app uses. RECOMMENDED.
2. **"Force existing app into AA" via intent declaration** — only media/POI/
   messaging categories work this way; there is no "project my existing UI"
   mode for navigation. A bare WebView wrapper with no CarAppService will NOT
   appear on the head unit. NOT VIABLE for nav.

### Proposed architecture (keeps the JS engine, no rewrite)
- **Capacitor** (Apache-2.0) wraps the existing PWA unchanged → phone app with
  a WebView running today's code (map, routing, camera data all stay as-is).
- Add a small native **CarAppService** module (Kotlin, ~1 file per screen):
  - Search screen: `SearchTemplate` backed by the same photon geocoder the PWA
    already calls (or a local recent-destinations list for zero-network).
  - Route screen: call the JS engine through the WebView bridge
    (`planRoutes()` already returns structured options: distance, duration,
    cameras, steps) → render as `RoutePreview` rows = Fastest / Balanced /
    Clearest (+ "Without highways" modifier), mirroring the route-card
    taxonomy shipped in 3439baa.
  - Nav screen: `NavTemplate` fed by the existing step list + nav state
    (banner text, ETA, camera-ahead alerts → AA's alert surface).
- The phone stays the computer; the head unit is a templated display. No keys,
  no telemetry, no store: `adb install` / direct APK + AA Unknown sources.
- Build/CI: a GitHub Actions job producing the APK keeps the "Push = release"
  pattern; APK + checksums alongside the web deploy.

### Effort estimate
Capacitor scaffold + CarAppService with NavTemplate ≈ 1-2 dedicated runs for a
v1 (search → route preview → turn-by-turn), since all routing/search/step data
already exists in JS. Polish (camera alerts as AA notifications, voice) after.

## CarPlay — later, gated on Apple

- CarPlay has **no sideload path and no web apps**. Only entitlement-approved
  native apps appear. Navigation requires the `com.apple.developer.carplay-maps`
  entitlement, requested via Apple's contact form + CarPlay Entitlement
  Addendum; manual review, days-to-weeks, and Apple rejects "works fine on a
  phone" apps — the pitch must be the camera-avoidance driving use case.
- Tech: `CPTemplateApplicationScene` (separate scene), `CPMapTemplate` /
  `CPNavigationSession` for turn-by-turn; Swift only; templates are Apple-drawn
  (glanceable rules: no scrolling content, big controls).
- iPhone "mirroring" of the PWA over CarPlay is NOT a thing — only
  entitlement-approved CarPlay scenes render on the head unit.
- Prerequisites: Apple Developer account ($99/yr), entitlement approval, then a
  native Swift CarPlay scene that talks to the same JS engine via WKWebView
  bridge (same pattern as the AA module) or a Swift port of the cost model.
- Recommendation: park until AA v1 proves the bridge pattern; then apply for
  the entitlement (the privacy-first, no-account angle is a genuine
  differentiator in the request).

## Recommendation (summary)

1. **Now:** Capacitor + androidx.car.app NavTemplate Android app, sideloaded
   via AA developer-mode Unknown sources. Fully open source, no keys, no store
   review, works on Keaton's head unit today.
2. **Later:** CarPlay via entitlement application + native Swift scene, reusing
   the WebView-bridge pattern from (1).
3. Keep the PWA as the canonical app; both car surfaces are thin templated
   views over the same engine — zero logic duplication.

## Sources
- developer.android.com/training/cars/navigation (Cars App Library, NavTemplate)
- developer.android.com/training/cars/testing (DHU, Unknown sources)
- github.com/android/car-samples/car_app_library (Apache-2.0 samples)
- HERE SDK Android Auto tutorial (manifest/service declaration specifics)
- telusdigital/willowtree AA case studies (step-count cap, dev-settings gotchas)
- grokipedia CarPlay Maps App Approval + kanopylabs CarPlay guide 2026
  (entitlement process, category restrictions, CPTemplate architecture)
- Keaton field verification: AA Unknown sources runs sideloaded APKs (NewPipe).
