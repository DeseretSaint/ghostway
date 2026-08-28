# Android Auto — install & enable (Ghostway sideload path)

Android Auto does not require the Play Store. It runs **sideloaded APKs** once
you turn on developer mode and allow unknown sources. Ghostway ships its AA
wrapper as a debug APK built by CI (`android-apk.yml` → artifact
`ghostway-debug-apk`).

## One-time setup (about 2 minutes)

1. Download the APK: GitHub repo → **Actions** → latest **android-apk** run →
   **Artifacts** → `ghostway-debug-apk` (unzip it on the phone).
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
