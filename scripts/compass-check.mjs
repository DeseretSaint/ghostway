// Hermetic UI smoke for the Maps-parity compass (#compassBtn in #zoomCtrl).
// Round-77's custom zoom control replaced the native NavigationControl, which
// also carried the compass — this guard proves the replacement works: hidden
// when north-up + flat, appears when the camera rotates/pitches, needle
// points true north, and tapping resets north-up + flat. Spawns its own vite
// preview (lib-preview).
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 150s timeout'); process.exit(2); }, 150000).unref();

const preview = await startPreview({ port: 4173 });
let code = 1;
try {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e.message)));
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));

  await p.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded', '1'); });
  await p.goto(preview.url, { waitUntil: 'networkidle2', timeout: 60000 });
  await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });
  await p.waitForSelector('#compassBtn', { timeout: 10000 });
  await p.waitForFunction(() => { const s = document.querySelector('#splash'); return !s || s.hidden; }, { timeout: 20000 });
  await wait(600);

  // 1) North-up + flat at boot → compass hidden.
  const hiddenAtBoot = await p.evaluate(() => document.querySelector('#compassBtn').hidden);

  // 2) Rotate the camera (simulates a two-finger twist) → compass appears,
  //    needle rotated to point true north (-bearing).
  await p.evaluate(() => window.__gw.map.map.setBearing(45));
  await wait(300);
  const shownRotated = await p.evaluate(() => !document.querySelector('#compassBtn').hidden);
  const needleDeg = await p.evaluate(() => {
    const t = document.querySelector('#compassBtn .ic').style.transform;
    const m = /rotate\((-?[\d.]+)deg\)/.exec(t || '');
    return m ? parseFloat(m[1]) : null;
  });

  // 3) Pitched camera alone also reveals it (follow-mode style view).
  await p.evaluate(() => { window.__gw.map.map.setBearing(0); window.__gw.map.map.setPitch(55); });
  await wait(300);
  const shownPitched = await p.evaluate(() => !document.querySelector('#compassBtn').hidden);

  // 4) Tap the real button → north-up + flat again, compass hides.
  await p.evaluate(() => window.__gw.map.map.setBearing(45));
  await wait(200);
  const cover = await p.evaluate(() => {
    const r = document.querySelector('#compassBtn').getBoundingClientRect();
    const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return el ? (el.id || el.closest('button')?.id || el.tagName) : null;
  });
  await p.click('#compassBtn');
  await wait(900); // easeTo duration 450ms + settle
  const after = await p.evaluate(() => ({
    bearing: window.__gw.map.map.getBearing(),
    pitch: window.__gw.map.map.getPitch(),
    hidden: document.querySelector('#compassBtn').hidden,
  }));

  console.log('hidden at boot:', hiddenAtBoot);
  console.log('shown when rotated:', shownRotated, '| needle deg:', needleDeg, '(expect -45)');
  console.log('shown when pitched:', shownPitched);
  console.log('hit-test cover:', cover);
  console.log('after tap: bearing', after.bearing.toFixed(1), 'pitch', after.pitch.toFixed(1), 'hidden', after.hidden);

  const ok = hiddenAtBoot === true
    && shownRotated === true
    && needleDeg !== null && Math.abs(needleDeg - (-45)) < 1
    && shownPitched === true
    && cover === 'compassBtn'
    && Math.abs(after.bearing) < 1 && after.pitch < 1 && after.hidden === true;
  console.log('compass hidden/appears/needle/reset all correct:', ok);
  console.log('page errors:', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 5));
  if (ok && errs.filter((e) => !/favicon|404/.test(e)).length === 0) code = 0;
  try { await Promise.race([b.close(), wait(5000)]); } catch { }
} catch (e) {
  console.error('compass-check failed:', e.message);
  code = 1;
} finally {
  preview.kill();
}
process.exit(code);
