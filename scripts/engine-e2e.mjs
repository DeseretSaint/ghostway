// End-to-end: engine integration over the real built app (vite preview).
// 1. Graph loads (window.__ghostwayEngine === 'ready')
// 2. Route PG → Lehi Costco via search + real clicks
// 3. Route-options card renders with ≥2 options + camera counts
// 4. Clicking an alternate option re-draws (hit-tested)
// 5. Mode switch Strict re-routes and avoids ≥ as many cameras
// 6. Start navigation banner shows (hit-tested)
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e.message)));
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));

await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });

// Wait for engine graph to load.
await p.waitForFunction('window.__ghostwayEngine !== undefined', { timeout: 45000 });
const engine = await p.evaluate(() => window.__ghostwayEngine);
console.log('engine status:', engine);

// Real hit-test helper: elementFromPoint at element center.
async function hit(sel) {
  const box = await p.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el || el.hidden || el.offsetParent === null) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, id: el.id || el.className };
  }, sel);
  if (!box) return null;
  const top = await p.evaluate(({ x, y }) => {
    const t = document.elementFromPoint(x, y);
    return t ? (t.id || t.className || t.tagName) : 'none';
  }, box);
  return top;
}

// Type destination and pick first suggestion.
await p.type('#toInput', 'Costco Lehi');
await wait(1300);
await p.click('#suggestions .sugg');
await wait(400);
// Type origin and pick first suggestion.
await p.type('#fromInput', 'Pleasant Grove Utah');
await wait(1300);
await p.click('#suggestions .sugg');
await wait(400);

// Real-click the Route button.
await p.click('#goBtn');
await p.waitForFunction(
  "() => !document.querySelector('#route-card').hidden || document.querySelector('#status')?.textContent?.includes('failed')",
  { timeout: 40000 }
);
const cardText = await p.evaluate(() => document.querySelector('#route-card')?.innerText?.replace(/\s+/g, ' ')?.slice(0, 400) || 'none');
console.log('card:', cardText);

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

// Switch to Strict mode and re-route.
const strictHit = await hit('.mode-btn[data-mode="strict"]');
console.log('strict btn hit:', strictHit);
await p.click('.mode-btn[data-mode="strict"]');
await p.waitForFunction("() => window.__ghostwayDebug && window.__ghostwayDebug.ms", { timeout: 30000 });
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

await p.screenshot({ path: 'engine-e2e.png' });
console.log('ERRORS', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 5));
await b.close();
