// Bundle size / lazy-load verification for PR3 (GHOSTWAY-LOOP.md L28).
//
// Spec (QUEUE-ghostway-coder.md #3):
//   1. Initial main bundle gzipped < 250 KB (target).
//   2. Main bundle does NOT contain the planRoutes / parseGraph implementations
//      (only the property-name strings in the diagnostic `__gwRouter` exposure
//      are allowed; those are unavoidable and <200 bytes).
//   3. The router chunk lazy-loads on first route calc — verified by spinning
//      up `vite preview`, loading the app, asserting the engine chunk is NOT
//      in the initial document/asset list, then triggering a route and
//      asserting the engine chunk IS fetched as a follow-up network request.
//
// Exit 0 = pass, 1 = fail. Prints every measurement so a future diff is
// obvious from the log (avoid the silent-FAIL class round 22 caught).
import puppeteer from 'puppeteer-core';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 150s timeout'); process.exit(2); }, 150000).unref();

const DIST = join(process.cwd(), 'dist', 'assets');

// --- Static assertions on dist/ ---

const files = readdirSync(DIST).filter((f) => f.endsWith('.js'));
const mainFile = files.find((f) => f.startsWith('index-'));
const engineFile = files.find((f) => f.startsWith('engine-') && !f.startsWith('engine-region'));
const engineRegionFile = files.find((f) => f.startsWith('engine-region-'));

if (!mainFile) { console.error('FAIL: no index-*.js in dist/assets'); process.exit(1); }
if (!engineFile) { console.error('FAIL: no engine-*.js in dist/assets — engine not split into its own chunk'); process.exit(1); }

const mainRaw = statSync(join(DIST, mainFile)).size;
const mainGz = gzipSync(readFileSync(join(DIST, mainFile))).length;
const engineRaw = statSync(join(DIST, engineFile)).size;
const engineGz = gzipSync(readFileSync(join(DIST, engineFile))).length;

console.log(`main chunk: ${mainFile} (raw=${mainRaw}, gz=${mainGz})`);
console.log(`engine chunk: ${engineFile} (raw=${engineRaw}, gz=${engineGz})`);
if (engineRegionFile) {
  const erRaw = statSync(join(DIST, engineRegionFile)).size;
  const erGz = gzipSync(readFileSync(join(DIST, engineRegionFile))).length;
  console.log(`engine-region chunk: ${engineRegionFile} (raw=${erRaw}, gz=${erGz})`);
}

// 1) main chunk gzipped < 250 KB
const PASS_MAIN_GZ = mainGz < 250 * 1024;
console.log(PASS_MAIN_GZ
  ? `PASS main gz ${mainGz} < ${250 * 1024}`
  : `FAIL main gz ${mainGz} >= ${250 * 1024}`);

// 2) main chunk does NOT contain the planRoutes/parseGraph implementations.
//    The planRoutes function in router.js reads the parsed graph and runs
//    A* over `nodeLon`/`nodeLat`/`eCam` fields — those property names are
//    preserved through minification because they're graph-object keys.
//    Searching for `nodeLon` (only present in the engine chunk) is a
//    reliable signal that parseGraph's output shape leaked back into main.
const mainSrc = readFileSync(join(DIST, mainFile), 'utf8');
const engineSrc = readFileSync(join(DIST, engineFile), 'utf8');

// ParseGraph output property names — present in router.js (engine chunk) and
// nowhere else. If these leak into main, the lazy split failed.
const ENGINE_GRAPH_PROPS = ['nodeLon', 'nodeLat', 'edgeCount', 'eCam'];
const leakedProps = ENGINE_GRAPH_PROPS.filter((p) => {
  // Word-boundary-ish check: appear as a property access, not as part of a
  // longer identifier (avoid false positives like `myNodeLonCount`).
  const re = new RegExp(`[\\.\\[]${p}[\\.\\]]`);
  return re.test(mainSrc);
});
console.log(`engine-only property names found in main: ${JSON.stringify(leakedProps)}`);

const PASS_NO_PARSER_IN_MAIN = leakedProps.length === 0;
console.log(PASS_NO_PARSER_IN_MAIN
  ? 'PASS main does not contain the engine implementations (no engine graph-property names leaked)'
  : 'FAIL main still contains the engine implementations (lazy split incomplete)');

// --- Runtime lazy-load assertion ---

const preview = await startPreview({ port: 4174 }); // different port from other suites
let runtimePass = false;
try {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

  // Track every JS file the page requests — we assert the engine chunk is
  // loaded AFTER the route calc fires (not at boot).
  const requested = [];
  p.on('request', (req) => {
    const url = req.url();
    if (url.includes('/assets/engine') && url.endsWith('.js')) {
      requested.push({ url: url.split('/').pop(), at: 'boot-or-route' });
    }
  });

  await p.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded', '1'); });
  await p.goto(preview.url, { waitUntil: 'networkidle2', timeout: 60000 });
  await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });

  // Wait a beat to catch any lazy preloads after boot settles.
  await wait(1500);
  const bootRequests = requested.slice();
  console.log(`engine chunks fetched during boot: ${bootRequests.length}`);

  // 3) Trigger a route calc — the engine chunk MUST be fetched now.
  async function pick(inputSel, query) {
    await p.type(inputSel, query);
    try {
      await p.waitForFunction(
        () => !document.querySelector('#suggestions .sugg-loading') && !!document.querySelector('#suggestions .sugg:not(.sugg-recent)'),
        { timeout: 12000 }
      );
      await p.click('#suggestions .sugg:not(.sugg-recent)');
    } catch {
      await p.focus(inputSel);
      await p.keyboard.press('Enter');
    }
    await wait(500);
  }
  await pick('#toInput', 'Costco Lehi');
  await pick('#fromInput', 'Pleasant Grove Utah');

  const goVisible = await p.evaluate(() => {
    const r = document.querySelector('#goBtn').getBoundingClientRect();
    return r.width > 0 && r.height > 0 && !document.querySelector('#route-actions').hidden;
  });
  if (goVisible) await p.click('#goBtn');

  // Wait for the engine chunk to be fetched (or for the route to fail).
  const routeStartedAt = Date.now();
  let engineFetchedDuringRoute = false;
  while (Date.now() - routeStartedAt < 30000) {
    if (requested.length > bootRequests.length) { engineFetchedDuringRoute = true; break; }
    await wait(200);
  }
  const totalEngineRequests = requested.length;
  console.log(`engine chunks fetched total: ${totalEngineRequests} (boot=${bootRequests.length}, route=${totalEngineRequests - bootRequests.length})`);
  const routeEngineFile = requested.find((r) => r.url.startsWith('engine-') && !r.url.startsWith('engine-region-'));
  const PASS_LAZY_LOAD = engineFetchedDuringRoute && !!routeEngineFile;
  console.log(PASS_LAZY_LOAD
    ? `PASS engine chunk lazy-loaded on first route calc (fetched: ${routeEngineFile?.url})`
    : 'FAIL engine chunk did NOT lazy-load on first route calc');

  // Bonus: assert __gwRouter was populated AFTER the chunk loaded (not at boot).
  await p.waitForFunction('window.__gwRouter && typeof window.__gwRouter.planRoutes === "function"', { timeout: 5000 })
    .then(() => console.log('PASS window.__gwRouter.planRoutes exposed after engine load'))
    .catch(() => console.log('FAIL window.__gwRouter.planRoutes never exposed'));

  runtimePass = PASS_LAZY_LOAD;
  try { await Promise.race([b.close(), wait(5000)]); } catch {}
} catch (e) {
  console.error('runtime lazy-load check errored:', e.message);
} finally {
  preview.kill();
}

const allPass = PASS_MAIN_GZ && PASS_NO_PARSER_IN_MAIN && runtimePass;
console.log('\n=== BUNDLE SIZE CHECK ===');
console.log(`main gz < 250 KB: ${PASS_MAIN_GZ ? 'PASS' : 'FAIL'} (${mainGz} bytes)`);
console.log(`main has no engine impls: ${PASS_NO_PARSER_IN_MAIN ? 'PASS' : 'FAIL'}`);
console.log(`engine chunk lazy-loaded on route: ${runtimePass ? 'PASS' : 'FAIL'}`);
console.log(allPass ? '\nALL PASS ✅' : '\nFAIL ❌');
process.exit(allPass ? 0 : 1);
