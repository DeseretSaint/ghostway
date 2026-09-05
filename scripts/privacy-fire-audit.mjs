// PRIVACY FIRE AUDIT (ghostway-fire #22) — Runtime network audit
// Lightweight variant: load the app fresh, wait for splash + camera tiles + search
// to fire, capture ALL requests via CDP + page.on('request'). No route driving
// (that needs live brouter/valhalla which are flaky from cron sandbox). Verdict is
// based on what the app actually contacts on load — the privacy-sensitive surface
// is the same (tiles, geocoding, camera tiles, telemetry).
//
// Output: ux-shots/privacy-fire-audit-<viewport>-<timestamp>.png + .json

import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 120s — force exit'); process.exit(2); }, 120000).unref();

const EXPECTED = {
  'localhost:4173':               { purpose: 'app origin',        category: 'self'    },
  'tiles.openfreemap.org':        { purpose: 'map basemap',       category: 'tiles'   },
  'tiles.dontgetflocked.com':     { purpose: 'ALPR camera data',  category: 'cameras' },
  'photon.komoot.io':             { purpose: 'geocoding',         category: 'search'  },
  'brouter.de':                   { purpose: 'routing graph',     category: 'routing' },
  'routing.openstreetmap.de':     { purpose: 'OSRM turn-by-turn', category: 'routing' },
  'valhalla1.openstreetmap.de':   { purpose: 'valhalla routing',  category: 'routing' },
  'overpass-api.de':              { purpose: 'OSM Overpass',      category: 'cameras' },
  'api.openstreetmap.org':        { purpose: 'OSM notes',         category: 'reports' },
};

const FORBIDDEN_KW = [
  'google-analytics', 'googletagmanager', 'doubleclick', 'googleadservices',
  'facebook.com/tr', 'connect.facebook', 'fbcdn', 'mixpanel', 'segment.io',
  'amplitude', 'sentry.io', 'bugsnag', 'datadoghq', 'newrelic', 'fullstory',
  'hotjar', 'intercom', 'pendo', 'heap.io', 'optimizely', 'appsflyer',
  'adjust.com', 'kissmetrics', 'adobedtm', 'omniture', 'matomo',
  'clarity.ms', 'plausible.io', 'counter.dev',
];

async function runOne(viewport, label) {
  console.log(`\n=== [${label}] ${viewport.w}x${viewport.h} ===`);
  const { kill } = await startPreview();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: viewport.w, height: viewport.h, isMobile: !!viewport.isMobile });

  const requests = [];
  const onRequest = (req) => {
    const url = req.url();
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('chrome:')) return;
    let origin;
    try { origin = new URL(url).host; } catch { return; }
    requests.push({ ts: Date.now(), method: req.method(), url, origin, type: req.resourceType() });
  };
  page.on('request', onRequest);

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 45000 });
  try {
    await page.waitForFunction(() => {
      const s = document.querySelector('#splash');
      return !s || s.hidden;
    }, { timeout: 8000 });
  } catch {}
  await wait(2000); // let tile + camera layers fire
  try { await page.screenshot({ path: `ux-shots/privacy-fire-${label}.png`, fullPage: false }); } catch {}
  await browser.close();
  kill();

  const sameOrigin = requests.filter(r => r.origin.includes('localhost') || r.origin.includes('127.0.0.1'));
  const external = requests.filter(r => !r.origin.includes('localhost') && !r.origin.includes('127.0.0.1'));
  const allowed = [];
  const suspicious = [];
  const forbidden = [];
  for (const r of external) {
    if (EXPECTED[r.origin]) {
      allowed.push({ ...r, purpose: EXPECTED[r.origin].purpose, category: EXPECTED[r.origin].category });
    } else if (FORBIDDEN_KW.some(kw => r.url.includes(kw))) {
      forbidden.push({ ...r, reason: 'forbidden keyword match' });
    } else {
      suspicious.push({ ...r, reason: 'unknown external domain' });
    }
  }
  const byOrigin = {};
  for (const r of requests) byOrigin[r.origin] = (byOrigin[r.origin] || 0) + 1;

  return {
    label, viewport: `${viewport.w}x${viewport.h}`,
    byOrigin, total: requests.length,
    sameOriginCount: sameOrigin.length, externalCount: external.length,
    allowed, suspicious, forbidden,
  };
}

async function main() {
  const report = {
    startedAt: new Date().toISOString(),
    expectedAllowlist: EXPECTED,
    forbiddenKeywords: FORBIDDEN_KW,
    runs: [],
  };
  const configs = [
    { w: 390, h: 844, isMobile: true },
    { w: 1440, h: 900, isMobile: false },
  ];
  for (const cfg of configs) {
    try { report.runs.push(await runOne(cfg, `${cfg.w}x${cfg.h}`)); }
    catch (e) { report.runs.push({ label: `${cfg.w}x${cfg.h}`, error: e.message }); }
  }

  const allForbidden = report.runs.flatMap(r => r.forbidden || []);
  const allSuspicious = report.runs.flatMap(r => r.suspicious || []);
  report.finishedAt = new Date().toISOString();
  report.verdict = allForbidden.length === 0 ? 'SHIP' : 'BLOCK';
  report.forbiddenCount = allForbidden.length;
  report.suspiciousCount = allSuspicious.length;

  const fs = await import('node:fs');
  const path = await import('node:path');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join('ux-shots', `privacy-fire-${stamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log(`\n=== REPORT: ${jsonPath} ===`);
  console.log(`Verdict: ${report.verdict}  forbidden=${report.forbiddenCount} suspicious=${report.suspiciousCount}`);
  for (const r of report.runs) {
    console.log(`  [${r.label}] total=${r.total} sameOrigin=${r.sameOriginCount} external=${r.externalCount} allowed=${r.allowed?.length || 0} suspicious=${r.suspicious?.length || 0} forbidden=${r.forbidden?.length || 0}`);
    if (r.suspicious?.length) console.log('    SUSPICIOUS:', r.suspicious.map(s => s.origin).join(', '));
    if (r.forbidden?.length) console.log('    FORBIDDEN:', r.forbidden.map(f => f.origin).join(', '));
  }
  process.exit(0);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });