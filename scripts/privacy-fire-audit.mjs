// PRIVACY FIRE AUDIT (ghostway-fire #22)
// Runtime network audit — drive a full route PG→Lindon at mobile-390 + desktop-1440,
// intercept EVERY request via page.on('request') + page.on('requestfinished'),
// classify each by origin against a known-good allowlist, and emit a JSON report.
//
// Output: ux-shots/privacy-audit-<timestamp>.json
//
// Triggered from the human-fire queue item #22 (PRIVACY/SECURITY NETWORK AUDIT).
// Complements the static PRIVACY-AUDIT-ghostway-2026-09-05.md (filed by ghostway-ux).

import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 150s timeout — force exit'); process.exit(2); }, 150000).unref();

// Allowlist of expected external domains + their purpose.
// Same-origin = http://localhost:4173
const EXPECTED = {
  'localhost:4173':               { purpose: 'app origin',       category: 'self'     },
  'tiles.openfreemap.org':        { purpose: 'map basemap',      category: 'tiles'    },
  'tiles.dontgetflocked.com':     { purpose: 'ALPR camera data', category: 'cameras'  },
  'photon.komoot.io':             { purpose: 'geocoding',        category: 'search'   },
  'brouter.de':                   { purpose: 'routing graph',    category: 'routing'  },
  'routing.openstreetmap.de':     { purpose: 'OSRM turn-by-turn',category: 'routing'  },
  'valhalla1.openstreetmap.de':   { purpose: 'valhalla routing', category: 'routing'  },
  'overpass-api.de':              { purpose: 'OSM Overpass',     category: 'cameras'  },
  'api.openstreetmap.org':        { purpose: 'OSM notes',        category: 'reports'  },
};

// Known-bad: third-party analytics, telemetry, ad networks, error reporting.
const FORBIDDEN_KEYWORDS = [
  'google-analytics', 'googletagmanager', 'doubleclick', 'googleadservices',
  'facebook.com', 'connect.facebook', 'fbcdn', 'mixpanel', 'segment.io',
  'amplitude', 'sentry.io', 'bugsnag', 'datadoghq', 'newrelic', 'fullstory',
  'hotjar', 'intercom', 'pendo', 'heap.io', 'optimizely', 'appsflyer',
  'adjust.com', 'kissmetrics', 'adobedtm', 'omniture', 'matomo',
  'clarity.ms', 'plausible.io', 'counter.dev',
];

async function runOne(viewport, label) {
  console.log(`\n=== [${label}] viewport ${viewport.w}x${viewport.h} ===`);
  const { kill } = await startPreview();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: viewport.w, height: viewport.h, isMobile: viewport.isMobile });

  const requests = [];
  const allowed = [];
  const suspicious = [];
  const forbidden = [];
  const sameOrigin = [];

  page.on('request', (req) => {
    const url = req.url();
    try {
      const u = new URL(url);
      const origin = u.host;
      const entry = {
        ts: Date.now(),
        method: req.method(),
        origin,
        path: u.pathname,
        type: req.resourceType(),
      };
      requests.push(entry);
      const matched = EXPECTED[origin];
      const isLocal = origin.startsWith('localhost') || origin.startsWith('127.');
      if (isLocal) {
        sameOrigin.push(entry);
      } else if (matched) {
        allowed.push({ ...entry, purpose: matched.purpose, category: matched.category });
      } else {
        const isForbidden = FORBIDDEN_KEYWORDS.some(kw => url.includes(kw));
        if (isForbidden) {
          forbidden.push({ ...entry, reason: 'matches forbidden telemetry/ad-network keyword' });
        } else {
          suspicious.push({ ...entry, reason: 'unknown external domain' });
        }
      }
    } catch (e) { /* data:, blob:, etc. */ }
  });

  // Drive a full route: PG → Lindon
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 45000 });
  try {
    await page.waitForFunction(() => {
      const s = document.querySelector('#splash');
      return !s || s.hidden;
    }, { timeout: 8000 });
  } catch {}
  await wait(800);

  // Pick FROM (Pleasant Grove, UT)
  async function pick(inputSel, query) {
    await page.click(inputSel, { clickCount: 3 });
    await page.type(inputSel, query, { delay: 30 });
    for (let i = 0; i < 14; i++) {
      await wait(300);
      const ok = await page.evaluate(() => {
        const el = document.querySelector('#suggestions .sugg');
        if (!el) return false;
        el.click();
        return true;
      });
      if (ok) break;
    }
    await wait(400);
  }

  try {
    await pick('#fromInput', 'Pleasant Grove, UT');
    await pick('#toInput', 'Lindon, UT');
  } catch (e) {
    console.error(`  [${label}] pick failed:`, e.message);
  }

  // Wait for route compute + camera overlay to load
  await wait(5000);

  // Capture screenshot for the audit doc
  await page.screenshot({
    path: `ux-shots/privacy-audit-${label}.png`,
    fullPage: false,
  });

  await browser.close();
  kill();

  // Summarize by origin
  const byOrigin = {};
  for (const r of requests) {
    byOrigin[r.origin] = (byOrigin[r.origin] || 0) + 1;
  }
  return { label, viewport, byOrigin, allowed, suspicious, forbidden, sameOriginCount: sameOrigin.length, total: requests.length };
}

async function main() {
  const report = {
    startedAt: new Date().toISOString(),
    expectedAllowlist: EXPECTED,
    forbiddenKeywords: FORBIDDEN_KEYWORDS,
    runs: [],
  };

  try {
    report.runs.push(await runOne({ w: 390, h: 844, isMobile: true }, 'mobile-390'));
  } catch (e) { report.runs.push({ label: 'mobile-390', error: e.message }); }

  try {
    report.runs.push(await runOne({ w: 1440, h: 900, isMobile: false }, 'desktop-1440'));
  } catch (e) { report.runs.push({ label: 'desktop-1440', error: e.message }); }

  // Final verdict
  let allForbidden = [];
  let allSuspicious = [];
  for (const r of report.runs) {
    if (r.forbidden) allForbidden = allForbidden.concat(r.forbidden);
    if (r.suspicious) allSuspicious = allSuspicious.concat(r.suspicious);
  }
  report.finishedAt = new Date().toISOString();
  report.verdict = allForbidden.length === 0 ? 'SHIP' : 'BLOCK';
  report.forbiddenCount = allForbidden.length;
  report.suspiciousCount = allSuspicious.length;

  const fs = await import('node:fs');
  const path = await import('node:path');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = path.join('ux-shots', `privacy-audit-${stamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\nReport written to ${outPath}`);
  console.log(`Verdict: ${report.verdict} (forbidden=${report.forbiddenCount}, suspicious=${report.suspiciousCount})`);
  if (allForbidden.length) console.log('FORBIDDEN:', JSON.stringify(allForbidden, null, 2));
  if (allSuspicious.length) console.log('SUSPICIOUS:', JSON.stringify(allSuspicious, null, 2));
  process.exit(0);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });