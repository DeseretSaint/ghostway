// Local APK build — mirrors .github/workflows/android-apk.yml for local verification.
// Produces android/app/build/outputs/apk/debug/ghostway-android.apk + SHA256SUMS.txt.
// Requires: npm, JDK 17, Android SDK (ANDROID_HOME or local.properties), Gradle 8.7.
// Usage: node scripts/local-apk-build.mjs
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const OUT_DIR = 'android/app/build/outputs/apk/debug';
const APK = `${OUT_DIR}/ghostway-android.apk`;
const ASSETS_DIR = 'android/app/src/main/assets/www';

function sh(cmd, opts = {}) {
  console.log(`$ ${cmd}`);
  const r = spawnSync('bash', ['-lc', cmd], { stdio: 'inherit', ...opts });
  if (r.status !== 0) throw new Error(`command failed: ${cmd}`);
}

// Clean previous build assets
if (existsSync(ASSETS_DIR)) {
  rmSync(ASSETS_DIR, { recursive: true, force: true });
}

// 1. Build PWA (dist/)
sh('npm run build');

// 2. Bundle PWA into Android assets (copy only — skip uncompressed duplicates)
sh('mkdir -p android/app/src/main/assets/www');
sh('cp -r dist/* android/app/src/main/assets/www/');

// Remove uncompressed duplicates that cause Android asset merger to fail
// (it chokes on both wasatch-graph.bin + .bin.gz, wzdx-national.json + .json.gz)
for (const sub of ['graph', 'data']) {
  const dir = join('android/app/src/main/assets/www', sub);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir)) {
    if (f.endsWith('.bin') || (f.endsWith('.json') && !f.endsWith('.json.gz'))) {
      rmSync(join(dir, f), { force: true });
    }
  }
}

// 3. Build debug APK
sh('cd android && ./gradlew assembleDebug --no-daemon');

// 4. Rename + checksum
sh(`cp ${OUT_DIR}/app-debug.apk ${APK}`);
const sha = createHash('sha256').update(readFileSync(APK)).digest('hex');
writeFileSync(`${OUT_DIR}/SHA256SUMS.txt`, `${sha}  ghostway-android.apk\n`);

const stat = existsSync(APK) ? readFileSync(APK).length : 0;
console.log(`\nLocal APK build OK`);
console.log(`  APK: ${APK} (${(stat / 1048576).toFixed(1)} MB)`);
console.log(`  SHA: ${sha}`);
console.log(`  To install: adb install ${APK}`);
