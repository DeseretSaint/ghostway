# Android Auto — install & enable (Ghostway sideload path)

**TL;DR:** Download `ghostway-android.apk` from
[Releases](https://github.com/DeseretSaint/ghostway/releases/tag/android-latest)
→ open it → allow "install unknown apps" → install. Then in the Android Auto
app: About → tap the version ~10× → Developer settings → "Unknown sources" ON.
Details below. Then it's plug-and-play: **start a route on the phone and the
car screen becomes the turn panel by itself.**

Android Auto does not require the Play Store. It runs **sideloaded APKs** once
you turn on developer mode and allow unknown sources. Ghostway's Android app
is built automatically on every push to `src/`, `dist/`, or `android/` (workflow
`android-apk.yml` → the `android-latest` release, refreshed automatically),
plus a nightly 04:00 UTC build as a safety net.

## One-time setup (about 2 minutes)

1. Download the APK: **[Releases page](https://github.com/DeseretSaint/ghostway/releases/tag/android-latest)** → download **ghostway-android.apk** on the phone.
2. On the phone, open the **Android Auto** app (may be in Settings → apps).
3. Scroll to the bottom → **Version and permissions info** (or "About").
4. Tap the **version number ~10 times** until developer mode is offered.
   Confirm → Developer settings open.
5. In Developer settings, enable **"Unknown sources"**.
6. Open the downloaded APK and install it (allow "install unknown apps" if
   prompted — this is the standard sideload permission, Ghostway has no store).
7. Confirm Ghostway shows as installed (and toggled on in AA → Customize
   launcher), then plug the phone into the head unit (or open the AA app →
   drive mode). Ghostway appears in the AA launcher's navigation apps.
8. First launch on the head unit may ask to allow the app — accept once.

## What works in v2 (plug-and-play turn-by-turn)

- AA handshake + navigation-category declaration (appears on the head unit).
- The phone app (WebView) runs the full Ghostway PWA: routing, Strict camera
  avoidance, live map, voice.
- **Turn panel (NavigationTemplate) on the car screen, automatically:** maneuver
  icon, instruction, road name, and distance to the maneuver — mirrored live
  from the phone session (`src/nav-bridge.js` → `AABridge.navState()` →
  `NavState`). Start navigation on the phone → the panel replaces the home list
  within ~1 s. Stop → the home list returns. No menus to poke in the car.
- Home screen reflects live status (waiting / arrived) and its app icon opens
  the phone app.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Ghostway tile missing from the AA launcher | Sideload + "Unknown sources" off, or launcher not refreshed | Do step 5 (AA Developer settings → Unknown sources ON), toggle Ghostway off/on in Customize launcher, replug. |
| Tile opens but only shows the home list | Navigation not active on the phone | Start a route in the phone app (home screen's row says so). The panel takes over automatically. |
| Turn panel froze on an old instruction | Phone WebView suspended in the background | Bring Ghostway on the phone to the foreground once; exclude it from battery optimisation to prevent it. |
| Navigation stopped but car still shows the panel | Car session died between pushes | Reopen the Ghostway tile — the session restarts on the current state. |
| Install refused on the phone | "Install unknown apps" not granted for your file manager/browser | Grant it once in the install prompt (step 6). |
| Map or route planning inside the car | By design | AA is a mirror, not a second UI — the phone computes, the car displays. |

## Known follow-ups (documented, not built)

- **Trip / TravelEstimate feeds** (`NavigationManager.updateTrip`): feeds the
  instrument cluster and lets Android Auto mute its own prompts during Ghostway
  navigation. API shape: `Trip.Builder.addStep(Step, TravelEstimate)` — the
  `TravelEstimate` factory still needs signature verification; the turn panel
  works without it.
- **MapActionStrip / pan-mode** (car API 2): the phone owns the map; the car
  stays a display surface by design.

## Data note

The phone app's camera layer includes the published Flock Safety research
dataset (`flocksurveillance.org`): road plate readers (red dots) feed avoidance
routing, and the full device set (indoor/facility/planned — blue dots) is a
map-only "Flock" toggle. See `scripts/fetch-cameras.mjs` for the merge policy.

## CarPlay (iPhone)

Not available: Apple has no sideload path. Navigation apps need Apple's
`com.apple.developer.carplay-maps` entitlement (manual review). See the main
README for the plan.