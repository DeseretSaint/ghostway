#!/usr/bin/env node
// scripts/aa-manifest-check.mjs
//
// Hermetic Android Auto wiring check — no device, no gradle, no network.
//
// Android Auto gives no useful runtime error when the wiring is wrong: the app
// simply does not appear on the head unit. That failure mode already cost us a
// release (automotive_app_desc.xml declared the legacy `navigation` capability
// instead of the Car App Library's `template`, so the AA host never discovered
// the CarAppService). This script pins every declaration the host checks, so
// the mistake cannot silently ship again.
//
// Sources of truth:
//   developer.android.com/training/cars/apps/auto            (template capability)
//   developer.android.com/training/cars/apps/navigation      (NAVIGATION category)
//   developer.android.com/training/cars/apps/auto  (meta-data + service shape)
//
// Exit 0 = wiring complete. Exit 1 = printed list of what the host will reject.

import { readFileSync, existsSync } from 'node:fs';

const R = (p) => readFileSync(p, 'utf8');
const MANIFEST = 'android/app/src/main/AndroidManifest.xml';
const DESC = 'android/app/src/main/res/xml/automotive_app_desc.xml';
const HOSTS = 'android/app/src/main/res/values/aa_hosts.xml';
const SERVICE = 'android/app/src/main/java/app/ghostway/GhostwayCarAppService.java';
const ACTIVITY = 'android/app/src/main/java/app/ghostway/MainActivity.java';
const NAVSTATE = 'android/app/src/main/java/app/ghostway/NavState.java';
const BRIDGE = 'src/nav-bridge.js';
const GRADLE = 'android/app/build.gradle';

const ERR = '\x1b[31m', GRN = '\x1b[32m', RST = '\x1b[0m';
let failed = 0;
const pass = (m) => console.log(`  ${GRN}OK${RST}   ${m}`);
const fail = (m) => { failed++; console.log(`  ${ERR}FAIL${RST} ${m}`); };
const check = (cond, okMsg, failMsg) => (cond ? pass(okMsg) : fail(failMsg));

function need(file) {
  if (!existsSync(file)) {
    fail(`missing file: ${file}`);
    return '';
  }
  return R(file);
}

// ── 1. automotive_app_desc: the capability the AA host reads ────────────────
console.log('\n1. Capability declaration (res/xml/automotive_app_desc.xml)');
const desc = need(DESC);
check(
  /<uses\s+name="template"\s*\/>/.test(desc),
  'declares <uses name="template"/> (Car App Library capability)',
  'MISSING <uses name="template"/> — AA host will not discover the CarAppService (this is the 2026-10-20 field bug)',
);
check(
  !/<uses\s+name="navigation"\s*\/>/.test(desc),
  'no legacy <uses name="navigation"/> left behind',
  'legacy <uses name="navigation"/> present — wrong capability for androidx.car.app',
);

// ── 2. Manifest: meta-data, service, category, permissions ─────────────────
console.log('\n2. Manifest declarations (AndroidManifest.xml)');
const man = need(MANIFEST);
check(
  /android:name="com\.google\.android\.gms\.car\.application"[\s\S]*?android:resource="@xml\/automotive_app_desc"/.test(man),
  'meta-data com.google.android.gms.car.application → @xml/automotive_app_desc',
  'MISSING com.google.android.gms.car.application meta-data — AA never reads the descriptor',
);
check(
  /android:name="androidx\.car\.app\.NAVIGATION_TEMPLATES"/.test(man),
  'uses-permission androidx.car.app.NAVIGATION_TEMPLATES',
  'MISSING androidx.car.app.NAVIGATION_TEMPLATES permission',
);

const serviceBlock = (man.match(/<service[\s\S]*?<\/service>/g) || [])
  .find((b) => b.includes('GhostwayCarAppService'));
check(Boolean(serviceBlock), 'CarAppService declared', 'CarAppService missing from manifest');
if (serviceBlock) {
  check(/android:exported="true"/.test(serviceBlock), 'service android:exported="true"',
    'service must be android:exported="true" (host cannot bind otherwise)');
  check(/<action\s+android:name="androidx\.car\.app\.CarAppService"\s*\/>/.test(serviceBlock),
    'intent-filter action androidx.car.app.CarAppService',
    'MISSING intent-filter action androidx.car.app.CarAppService');
  check(/<category\s+android:name="androidx\.car\.app\.category\.NAVIGATION"\s*\/>/.test(serviceBlock),
    'intent-filter category ...category.NAVIGATION',
    'MISSING category androidx.car.app.category.NAVIGATION — app not listed as a navigation app');
}
check(/android:name="\.?MainActivity"[\s\S]*?android\.intent\.category\.LAUNCHER/.test(man),
  'MainActivity is the launcher activity', 'MainActivity missing LAUNCHER intent-filter');

// ── 3. Host allowlist ──────────────────────────────────────────────────────
console.log('\n3. Host allowlist (res/values/aa_hosts.xml)');
const hosts = need(HOSTS);
check(/name="hosts_allowed"/.test(hosts), 'string-array hosts_allowed defined',
  'string-array hosts_allowed missing — createHostValidator(R.array.hosts_allowed) will not compile');
check(hosts.includes('com.google.android.projection.gearhead'),
  'Android Auto phone host (projection.gearhead) allowed',
  'gearhead host signature missing from hosts_allowed');

// ── 4. Service behaviour ───────────────────────────────────────────────────
console.log('\n4. CarAppService implementation');
const svc = need(SERVICE);
check(/extends\s+CarAppService/.test(svc), 'extends androidx.car.app.CarAppService', 'service does not extend CarAppService');
check(/createHostValidator\s*\(\s*\)/.test(svc), 'overrides createHostValidator()', 'createHostValidator() not overridden');
check(/addAllowedHosts\(R\.array\.hosts_allowed\)/.test(svc), 'validator uses R.array.hosts_allowed',
  'validator does not use R.array.hosts_allowed');
check(/onCreateSession\s*\(\s*\)/.test(svc), 'onCreateSession() overridden', 'onCreateSession() not overridden');
check(/new NavigationTemplate\.Builder\(\)/.test(svc), 'renders NavigationTemplate while navigating',
  'NavigationTemplate not used — navigation category implies turn-by-turn');
check(/new ListTemplate\.Builder\(\)/.test(svc), 'renders ListTemplate when idle', 'no idle template (car screen would be blank)');
check(/NavState\.addListener/.test(svc) && /NavState\.removeListener/.test(svc),
  'subscribes and unsubscribes from NavState', 'NavState listener lifecycle incomplete (leak or no redraw)');

// ── 5. Phone → car bridge ──────────────────────────────────────────────────
console.log('\n5. PWA → car state bridge');
const activity = need(ACTIVITY);
check(/addJavascriptInterface\([^,]+,\s*"AABridge"\)/.test(activity),
  'WebView exposes window.AABridge', 'MainActivity does not register the AABridge JS interface');
// The PWA must load over a real secure origin, not file://: Chromium's fetch()
// refuses the file: scheme outright, so under file:// loadGraph() and the
// camera snapshot both fail and every route silently falls back to Valhalla.
// WebViewAssetLoader serves the same assets/www over
// https://appassets.androidplatform.net, which is what makes fetch(),
// geolocation and the service worker behave as they do on the web build.
check(/addPathHandler\(\s*"\/assets\/"\s*,\s*new WebViewAssetLoader\.AssetsPathHandler\(this\)\s*\)/.test(activity),
  'WebView serves bundled assets via WebViewAssetLoader (/assets/)',
  'MainActivity does not register a WebViewAssetLoader AssetsPathHandler — the PWA assets have no secure origin');
check(/loadUrl\(\s*APP_URL\s*\)/.test(activity) && /"https:\/\/"\s*\+\s*ASSET_HOST/.test(activity),
  'WebView loads the bundled PWA (https://appassets.androidplatform.net/assets/www/index.html)',
  'MainActivity does not load the bundled PWA over the asset-loader origin');
check(!/loadUrl\(\s*"file:\/\//.test(activity),
  'no file:// page load (fetch() is dead under file://)',
  'MainActivity still loadUrl()s a file:// page — asset fetches will fail on device');
check(/NavState\.set\(/.test(activity), 'AABridge.navState() writes NavState', 'JsBridge does not push into NavState');
const navState = need(NAVSTATE);
check(/public static void set\(String stateJson\)/.test(navState), 'NavState.set(String) exists', 'NavState.set(String) missing');
check(/volatile String json/.test(navState), 'NavState snapshot is volatile (cross-thread safe)',
  'NavState.json is not volatile — car thread may read a stale snapshot');
const bridge = need(BRIDGE);
check(/window\.AABridge/.test(bridge) && /navState\(JSON\.stringify/.test(bridge),
  'src/nav-bridge.js pushes JSON through window.AABridge.navState',
  'src/nav-bridge.js does not push through AABridge');
check(/state\.active !== lastActive/.test(bridge), 'transitions always flush (no throttle on start/stop)',
  'start/stop transitions can be throttled — car misses the panel switch');

// ── 6. Build config ────────────────────────────────────────────────────────
console.log('\n6. Build config (android/app/build.gradle)');
const gradle = need(GRADLE);
check(/androidx\.car\.app:app:/.test(gradle), 'depends on androidx.car.app:app', 'androidx.car.app dependency missing');
check(/androidx\.car\.app:app-projected:/.test(gradle), 'depends on androidx.car.app:app-projected (Android Auto)',
  'androidx.car.app:app-projected dependency missing — projected (AA) support not built in');
check(/compileSdk\s+34|compileSdk\s*=\s*34/.test(gradle), 'compileSdk 34', 'compileSdk should be 34 (car app 1.7.0 requires 34)');

console.log('');
if (failed) {
  console.log(`${ERR}AA MANIFEST CHECK FAILED${RST} — ${failed} problem(s) the Android Auto host will reject.`);
  process.exit(1);
}
console.log(`${GRN}AA MANIFEST CHECK PASS${RST} — capability, service, bridge and build wiring all present.`);
