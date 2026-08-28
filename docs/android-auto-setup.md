# Android Auto — install & enable (Ghostway sideload path)

**TL;DR:** Download `ghostway-android.apk` from
[Releases](https://github.com/DeseretSaint/ghostway/releases/tag/android-latest)
→ open it → allow "install unknown apps" → install. Then in the Android Auto
app: About → tap the version ~10× → Developer settings → "Unknown sources" ON.
Details below.

Android Auto does not require the Play Store. It runs **sideloaded APKs** once
you turn on developer mode and allow unknown sources. Ghostway's Android app
is built automatically on every push (workflow `android-apk.yml` → the
`android-latest` release, refreshed automatically).

## One-time setup (about 2 minutes)

1. Download the APK: **[Releases page](https://github.com/DeseretSaint/ghostway/releases/tag/android-latest)** → download **ghostway-android.apk** on the phone.
2. On the phone, open the **Android Auto** app (may be in Settings → apps).
3. Scroll to the bottom → **Version and permissions info** (or "About").
4. Tap the **version number ~10 times** until developer mode is offered.
   Confirm → Developer settings open.
5. In Developer settings, enable **"Unknown sources"**.
6. Open the downloaded APK and install it (allow "install unknown apps" if
   prompted — this is the standard sideload permission, Ghostway has no store).
7. Confirm Ghostway shows as installed, then plug the phone into the head unit
   (or open the AA app → drive mode). Ghostway appears in the AA launcher's
   navigation apps.
8. First launch on the head unit may ask to allow the app — accept once.

## What works in v1

- AA handshake + navigation-category declaration (appears on the head unit).
- The phone app (WebView) runs the full Ghostway PWA: routing, Strict camera
  avoidance, live map, voice.
- The car screen shows the Ghostway v1 template screen. Full turn-by-turn
  NavTemplate binding (ETA/steps mirrored from the phone session) is the next
  iteration — it needs a real head unit to verify against.

## CarPlay (iPhone)

Not available: Apple has no sideload path. Navigation apps need Apple's
`com.apple.developer.carplay-maps` entitlement (manual review). See the main
README for the plan.
