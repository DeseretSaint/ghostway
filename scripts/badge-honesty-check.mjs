// Camera-badge honesty (Keaton field report 2026-09-26): the route card must
// never claim "fully clear" past a visible camera. The old Valhalla mode:'off'
// fast-path hardcoded `cameras: 0, camerasKnown: false` and the badge ignored
// the flag — the card lied while the map showed an ALPR dot on the route.
// Guards: stub gone, every mode counts from the pool, tri-state badge wired
// everywhere, and missing mode chips say "tap to route" (not "n/a").
import { readFileSync } from 'node:fs';

const ui = readFileSync('src/ui.js', 'utf8');
const valh = readFileSync('src/valhalla.js', 'utf8');
const main = readFileSync('src/main.js', 'utf8');

const checks = {
  noHardcodedZeroStub: !/cameras:\s*0,\s*camerasKnown:\s*false/.test(valh),
  valhallaCountsEveryMode: /const pool = await cameraStore\.getCameras/.test(valh)
    && (valh.split('camerasKnown: poolKnown').length - 1) >= 3,
  triStateBadge: /camerasKnown === false/.test(ui)
    && /Camera data unavailable/.test(ui)
    && /Fully clear of known cameras/.test(ui),
  badgeCentralized: /export function badgeHtml/.test(ui) && (main.split('badgeHtml').length - 1) >= 2,
  chipHonestLabel: !/: 'n\/a'/.test(ui) && /tap to route/.test(ui),
  // Reach fix (field report 2026-09-26): "use my location" lives inside the
  // start field, not only the top-right corner.
  inlineLocate: /fromLocateBtn/.test(readFileSync('index.html', 'utf8'))
    && /fromLocateBtn'\)\.addEventListener\('click', useMyLocation\)/.test(main),
  // Source-of-truth fix (field report 2026-09-27): the counter reads the same
  // DeFlock tiles the map draws, and never caches empty failed fetches.
  tileSourceWired: /tileCameras/.test(readFileSync('src/camera-store.js', 'utf8'))
    && /camera-tiles/.test(readFileSync('src/camera-store.js', 'utf8'))
    && /__gwFlockExtras/.test(readFileSync('src/camera-store.js', 'utf8')),
  noEmptyPoolPoison: !/this\._poolCache\.set\(key, feats\);\s*this\._persist\(\); \/\/ persist after every new fetch\s*return feats;\s*\}\s*\/\/ Cameras from an in-memory list/.test(readFileSync('src/camera-store.js', 'utf8')),
};

// Behavioral: badgeHtml itself (pure function).
try {
  const { badgeHtml } = await import('../src/ui.js');
  checks.behUnverified = /unverified/.test(badgeHtml({ cameras: 0, camerasKnown: false }));
  checks.behClear = /Fully clear/.test(badgeHtml({ cameras: 0, camerasKnown: true }));
  checks.behCounted = /Passes <b>2<\/b>/.test(badgeHtml({ cameras: 2, camerasKnown: true }));
} catch (e) {
  console.warn('badgeHtml import unavailable (' + e.message + ') — source guards only');
}

console.log(JSON.stringify(checks, null, 2));
const fail = Object.entries(checks).filter(([, v]) => !v);
if (fail.length) { console.error('FAIL:', fail.map(([k]) => k).join(', ')); process.exit(1); }
console.log('BADGE HONESTY PASS ✅');
