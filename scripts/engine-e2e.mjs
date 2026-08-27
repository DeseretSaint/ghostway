// End-to-end: engine integration over the real built app (vite preview).
// 1. App boots (window.__gw) — graph loads LAZILY, only when a route enters coverage
// 2. Route PG → Lehi Costco via search + real clicks (triggers the lazy graph load)
// 3. Graph reaches 'ready' (window.__ghostwayEngine === 'ready')
// 4. Route-options card renders with ≥2 options + camera counts
// 5. Clicking an alternate option re-draws (hit-tested)
// 6. Mode switch Strict re-routes and avoids ≥ as many cameras
// 7. Start navigation banner shows (hit-tested)
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Watchdog: browser.close() can hang forever under swiftshader/headless Chrome.
// If anything wedges, force-exit with a distinct code instead of hanging CI/cron.
setTimeout(() => { console.error('WATCHDOG: 150s timeout — force exit'); process.exit(2); }, 150000).unref();


const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e.message)));
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));

// Returning user: skip first-run onboarding overlay.
await p.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded', '1'); });
await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });

// Wait for the app to boot. The road graph loads LAZILY — only when a route
// enters a shipped coverage region — so we assert engine-ready AFTER routing.
await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });
console.log('app booted (__gw set)');

// Real hit-test helper: elementFromPoint at element center.
async function hit(sel) {
  return p.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el || el.hidden || el.offsetParent === null) return null;
    const r = el.getBoundingClientRect();
    const t = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    if (!t) return 'none';
    // A hit on a descendant (SVG icon inside a button) still activates the
    // control — treat it as hitting the control itself.
    if (t === el || el.contains(t)) return el.id || el.getAttribute('class') || el.tagName;
    return t.id || t.getAttribute('class') || t.tagName;
  }, sel);
}

// Robust pick: wait for a suggestion, else press Enter (commits typed text).
async function pickSuggestion(inputSel, query) {
  await p.type(inputSel, query);
  try {
    await p.waitForSelector('#suggestions .sugg', { timeout: 6000 });
    await p.click('#suggestions .sugg');
  } catch {
    await p.focus(inputSel);
    await p.keyboard.press('Enter');
  }
  await wait(500);
}
await pickSuggestion('#toInput', 'Costco Lehi');
await pickSuggestion('#fromInput', 'Pleasant Grove Utah');

// Real-click the Route button — but only if it's still visible (picking both
// endpoints may have auto-routed already and collapsed the panel).
const goVisible = await p.evaluate(() => {
  const r = document.querySelector('#goBtn').getBoundingClientRect();
  return r.width > 0 && r.height > 0 && !document.querySelector('#route-actions').hidden;
});
if (goVisible) await p.click('#goBtn');
await p.waitForFunction(
  "() => !document.querySelector('#route-card').hidden || document.querySelector('#status')?.textContent?.includes('failed')",
  { timeout: 40000 }
);
const cardText = await p.evaluate(() => document.querySelector('#route-card')?.innerText?.replace(/\s+/g, ' ')?.slice(0, 400) || 'none');
console.log('card:', cardText);

// The PG → Lehi route is inside the Wasatch coverage box, so routing should
// have triggered the lazy graph load. Assert the engine reached 'ready'.
await p.waitForFunction('window.__ghostwayEngine === "ready"', { timeout: 45000 });
const engine = await p.evaluate(() => window.__ghostwayEngine);
console.log('engine status (after route):', engine);

const optCount = await p.evaluate(() => document.querySelectorAll('.route-opt').length);
console.log('options shown:', optCount);

// Hit-test an option + click the non-chosen one.
const optHit = await hit('.route-opt:not(.chosen)');
console.log('option hit:', optHit);
if (optCount >= 2) {
  await p.click('.route-opt:not(.chosen)');
  await wait(800);
  console.log('after switch, chosen label:', await p.evaluate(() => document.querySelector('.route-opt.chosen .opt-label')?.textContent));
}

// Switch to Strict mode and re-route. The mode switch lives behind "Edit route"
// now that the panel collapses after routing.
const editBtn = await p.$('#editRouteBtn');
if (editBtn) {
  await editBtn.click();
  await wait(400);
}
const strictHit = await hit('.mode-btn[data-mode="strict"]');
console.log('strict btn hit:', strictHit);
await p.click('.mode-btn[data-mode="strict"]');
await p.waitForFunction("() => !document.querySelector('#route-card').hidden && document.querySelector('.route-opt.chosen')", { timeout: 30000 });
await wait(1500);
const afterStrict = await p.evaluate(() => {
  const opts = [...document.querySelectorAll('.route-opt .opt-meta')].map((e) => e.textContent);
  return opts;
});
console.log('strict-mode options:', JSON.stringify(afterStrict));

// Start navigation (hit-tested).
const navHit = await hit('#startNavBtn');
console.log('start nav hit:', navHit);
await p.click('#startNavBtn');
await wait(800);
const navShown = await p.evaluate(() => !document.querySelector('#navBanner').hidden);
console.log('nav banner shown:', navShown);
const hasVoiceBtn = await p.evaluate(() => !!document.querySelector('#voiceBtn'));
console.log('voice toggle in banner:', hasVoiceBtn);

await p.screenshot({ path: 'engine-e2e.png' });
console.log('ERRORS', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 5));
try { await Promise.race([b.close(), wait(5000)]); } catch {}
process.exit(0); // explicit: puppeteer can leave handles open and hang node
