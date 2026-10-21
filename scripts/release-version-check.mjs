#!/usr/bin/env node
// Release version lockstep check.
//
// The release claims one version number across the web bundle and the Android
// APK. That claim is only true if all three carriers agree, so this script
// reads them and fails rather than trusting the changelog:
//   package.json                 "version"
//   src/config.js                CONFIG.version
//   android/app/build.gradle     versionName (+ versionCode floor)
//
// Hermetic: files only, no network, no browser, no graph load.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

const fail = [];
const ok = [];

// 1. package.json
const pkgVersion = JSON.parse(read('package.json')).version;
ok.push(`package.json version: ${pkgVersion}`);

// 2. src/config.js: CONFIG.version, parsed from source (no bundling needed)
const cfg = read('src/config.js');
const cfgMatch = cfg.match(/\bversion:\s*'([^']+)'/);
if (!cfgMatch) {
  fail.push('src/config.js: could not find `version: \'...\'`');
} else {
  ok.push(`src/config.js CONFIG.version: ${cfgMatch[1]}`);
}

// 3. android/app/build.gradle: versionName and versionCode
const gradle = read('android/app/build.gradle');
const nameMatch = gradle.match(/versionName\s+'([^']+)'/);
const codeMatch = gradle.match(/versionCode\s+(\d+)/);
if (!nameMatch) fail.push('android/app/build.gradle: could not find versionName');
else ok.push(`build.gradle versionName: ${nameMatch[1]}`);
if (!codeMatch) fail.push('android/app/build.gradle: could not find versionCode');
else ok.push(`build.gradle versionCode: ${codeMatch[1]}`);

// Versions must be identical strings.
if (cfgMatch && nameMatch && pkgVersion !== cfgMatch[1]) {
  fail.push(`version mismatch: package.json ${pkgVersion} != src/config.js ${cfgMatch[1]}`);
}
if (cfgMatch && nameMatch && cfgMatch[1] !== nameMatch[1]) {
  fail.push(`version mismatch: src/config.js ${cfgMatch[1]} != build.gradle versionName ${nameMatch[1]}`);
}

// versionCode must stay above the internal update-flow verification builds
// (codes 9 and 10) so a sideloaded release installs over them.
const CODE_FLOOR = 11;
if (codeMatch && Number(codeMatch[1]) < CODE_FLOOR) {
  fail.push(`versionCode ${codeMatch[1]} is below the floor ${CODE_FLOOR} (internal builds used 9 and 10)`);
}

// Semver shape, so a stray "1.0" cannot pass as a release version.
if (pkgVersion && !/^\d+\.\d+\.\d+$/.test(pkgVersion)) {
  fail.push(`package.json version "${pkgVersion}" is not MAJOR.MINOR.PATCH`);
}

for (const line of ok) console.log(`  OK   ${line}`);

if (fail.length) {
  for (const line of fail) console.log(`  FAIL ${line}`);
  console.log('\nRELEASE VERSION CHECK FAIL');
  process.exit(1);
}
console.log('\nRELEASE VERSION CHECK PASS — web and Android carry one version');
