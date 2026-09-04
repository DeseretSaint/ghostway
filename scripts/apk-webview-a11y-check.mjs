#!/usr/bin/env node
// scripts/apk-webview-a11y-check.mjs — #22
// Verifies the published android-latest APK actually contains the a11y changes
// (ARIA hooks + battery hint) in the bundled assets, not just that the build
// succeeded. Build success ≠ runtime correct.

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const RELEASE = 'android-latest';
const APK_PATH = join(tmpdir(), 'gw-apk', 'ghostway-android.apk');
const EXTRACT_DIR = join(tmpdir(), 'gw-apk-extract');
const ERR = '\x1b[31m', GRN = '\x1b[32m', RST = '\x1b[0m', BLD = '\x1b[1m';

function step(label) { console.log(`\n${BLD}▶ ${label}${RST}`); }
function ok(label) { console.log(`  ${GRN}✓${RST} ${label}`); }
function fail(label) { console.log(`  ${ERR}✗${RST} ${label}`); FAILED = true; }

let FAILED = false;

// 1. Download the APK
step(`Downloading ${RELEASE} APK`);
execFileSync('gh', ['release', 'download', RELEASE, '-D', join(tmpdir(), 'gw-apk'),
  '-p', 'ghostway-android.apk', '--clobber'], { stdio: 'inherit' });
ok(`APK → ${APK_PATH}`);

// 2. Extract bundled assets from APK
step('Extracting bundled assets from APK');
if (existsSync(EXTRACT_DIR)) rmSync(EXTRACT_DIR, { recursive: true });
mkdirSync(EXTRACT_DIR, { recursive: true });

// Get asset paths from APK
const zipListRaw = execFileSync('unzip', ['-l', APK_PATH], { encoding: 'utf8' });
const zipList = zipListRaw
  .split('\n')
  .filter(l => l.includes('assets/www/') && !l.trim().endsWith('/'))
  .map(l => {
    const parts = l.trim().split(/\s{2,}/);
    return parts[parts.length - 1];
  })
  .filter(p => p.startsWith('assets/www/'));

const assetsDir = join(EXTRACT_DIR, 'assets', 'www');
mkdirSync(assetsDir, { recursive: true });

for (const asset of zipList) {
  const rel = asset.replace('assets/www/', '');
  const dest = join(assetsDir, rel);
  const destDir = dest.split('/').slice(0, -1).join('/');
  mkdirSync(destDir, { recursive: true });
  try {
    const buf = execFileSync('unzip', ['-p', APK_PATH, asset]);
    writeFileSync(dest, buf);
  } catch { /* skip */ }
}
ok(`Extracted ${zipList.length} assets to ${EXTRACT_DIR}`);

// 3. Check (a): index.html contains the route-card ARIA region
step('Checking (a): route-card ARIA region markup');
const indexHtml = readFileSync(join(assetsDir, 'index.html'), 'utf8');
const regionMatch = indexHtml.includes('role="region"') && indexHtml.includes('aria-label="Route options"');
if (regionMatch) {
  ok('index.html contains role="region" + aria-label="Route options"');
} else {
  fail('index.html MISSING role="region" or aria-label="Route options"');
}

// 4. Find the JS + CSS bundles by name pattern from the APK listing
const jsAsset = zipList.find(l => /assets\/www\/assets\/index-.*\.js$/.test(l));
const cssAsset = zipList.find(l => /assets\/www\/assets\/index-.*\.css$/.test(l));

if (!jsAsset || !cssAsset) {
  fail(`Could not find JS (${!!jsAsset}) or CSS (${!!cssAsset}) bundle in APK`);
}

const jsBundle = readFileSync(join(assetsDir, jsAsset.replace('assets/www/', '')), 'utf8');
const cssBundle = readFileSync(join(assetsDir, cssAsset.replace('assets/www/', '')), 'utf8');

// 5. Check (b): batteryHint + batteryDismiss literals
step('Checking (b): batteryHint + batteryDismiss in bundled JS');
const batteryChecks = [
  ['batteryHint', /batteryHint/],
  ['batteryDismiss', /batteryDismiss/],
];
for (const [name, re] of batteryChecks) {
  if (re.test(jsBundle)) ok(`JS bundle contains ${name}`);
  else fail(`JS bundle MISSING ${name}`);
}

// 6. Check (c): a11y-related JS literals
// NOTE: minification renames function names like `wireBatteryHint` to shorter
// identifiers. We verify behaviorally: the battery hint strings, ARIA attrs,
// and event listeners must survive the build.
step('Checking (c): a11y-related JS literals');
const jsChecks = [
  ['aria-pressed', /aria-pressed/],
  ['aria-live', /aria-live/],
];
for (const [name, re] of jsChecks) {
  if (re.test(jsBundle)) ok(`JS bundle contains ${name}`);
  else fail(`JS bundle MISSING ${name}`);
}

// 6b. Behavioral signals survive minization
step('Checking (6b): battery hint behavioral signals');
const behavioralChecks = [
  ['"Battery low (%) — keep phone plugged in"', /Battery low.*keep phone plugged in/],
  ['levelchange', /levelchange/],
  ['chargingchange', /chargingchange/],
];
for (const [name, re] of behavioralChecks) {
  if (re.test(jsBundle)) ok(`JS bundle contains ${name}`);
  else fail(`JS bundle MISSING ${name}`);
}

// 6c. CSS .battery-hint rule
step('Checking (d): .battery-hint CSS rule');
if (cssBundle.includes('.battery-hint')) ok('CSS contains .battery-hint');
else fail('CSS MISSING .battery-hint');

// 7. Summary
console.log(`\n${'─'.repeat(50)}`);
if (FAILED) {
  console.log(`${ERR}${BLD}RESULT: FAIL — a11y changes NOT in published APK${RST}`);
  process.exit(1);
} else {
  console.log(`${GRN}${BLD}RESULT: PASS — android-latest APK serves a11y changes${RST}`);
  process.exit(0);
}
