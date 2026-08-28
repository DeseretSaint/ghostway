# Ghostway for Android — install in 3 minutes

You are downloading the **Ghostway Android app** (`ghostway-android.apk`).
It is the same Ghostway you use in the browser — camera-avoiding navigation,
no ads, no tracking — wrapped as a phone app, and registered to appear in
**Android Auto** on your car's screen.

## Step 1 — Download (on your Android phone)

Tap this file below to download it: **ghostway-android.apk**

(If you're reading this on a computer, download it here and copy it to your
phone, or just open this page on the phone.)

Your phone will say *"this type of file can harm your device"* — that is the
standard warning for **any** app downloaded outside the Play Store. It's fine:
this app comes from your own GitHub build, no store, no middleman. Tap
**Download anyway**.

## Step 2 — Install

1. Open the downloaded file (pull down the notifications shade, tap it —
   or find it in your **Files** app under Downloads).
2. Android asks: *"install unknown apps — allow from this source?"*
   Tap **Settings** → toggle **Allow from this source** → **Back** → **Install**.
3. You now have the Ghostway app on your phone, with a map, search, and
   camera-avoiding routes. Open it and try a route before driving.

## Step 3 — Make it show in Android Auto (one-time)

Android Auto hides non-store apps by default. Unlock it:

1. Open the **Android Auto** app on your phone
   (if you can't find it: **Settings → search "Android Auto"**).
2. Scroll to the bottom and tap **Version and permissions info** (or "About").
3. **Tap the version number about 10 times** — a dialog offers
   **developer settings**. Accept.
4. In the new **Developer settings**, toggle **"Unknown sources"** ON.
5. Connect the phone to your car (USB or wireless, as usual). Ghostway now
   appears in the **Android Auto app launcher** under navigation apps.

In the car, Ghostway shows the v1 car screen (status + tips). Full
turn-by-turn on the car screen is the next iteration — routing, camera
avoidance, and voice all run on the phone, which is the computer.

## Updating

Re-download `ghostway-android.apk` from this page anytime and install it —
it replaces the old version, keeping your settings. This page is rebuilt
automatically on every update to Ghostway.

## Verify the download (optional)

`SHA256SUMS.txt` below has the file's SHA-256 checksum. On a computer:
`shasum -a 256 ghostway-android.apk` and compare.

## Questions

- **Is this safe?** It's built by an automated GitHub Actions job from the
  open-source code at github.com/DeseretSaint/ghostway (GPL-3.0). No telemetry,
  no API keys, no tracking.
- **Why not the Play Store?** Not needed — the developer-mode "Unknown sources"
  toggle exists exactly for apps like this. Store listing may come later.
- **iPhone?** Apple doesn't allow sideloading car apps. CarPlay requires an
  Apple entitlement (in progress — see docs/android-auto-carplay.md).
