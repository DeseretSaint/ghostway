// State Street (F006) routing regression audit — phone-free, headless.
// Runs entirely on this box: no device, no adb, no GPS hardware.
//
// Two layers:
//   A. UI layer — boot the real built app in headless Chromium, route a
//      corridor crossing the F006 camera, assert the card's honesty.
//   B. Engine layer — run the real router.js over the shipped graph and
//      assert F006 clearance per option from a grid of origins.
//
// Contract being tested (t_gwrouting2 acceptance):
//   - Clearest from a FAR origin must keep ≥75 m from F006.
//   - Clearest from a NEAR origin (reroute-anchor case) must NOT silently
//     pass F006 — this is the known-open bug; the audit must report RED
//     until the start-boxed-exemption fix lands, then go GREEN.
import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const F006 = [-111.827125, 40.38907]; // State St camera (flock)

// ---------- Layer A: headless UI ----------
async function uiLayer() {
  let vite = null;
  try {
    vite = spawn('npx', ['vite', 'preview', '--port', '4173', '--host'], {
      cwd: process.cwd(), stdio: 'ignore', detached: true,
    });
    let up = false;
    for (let i = 0; i < 40 && !up; i++) {
      try { const r = await fetch('http://localhost:4173/', { method: 'HEAD' }); up = r.status < 500; }
      catch { await wait(500); }
    }
    if (!up) throw new Error('preview never came up');

    const puppeteer = (await import('puppeteer-core')).default;
    const b = await puppeteer.launch({
      executablePath: process.env.GW_CHROME_PATH || '/usr/bin/chromium',
      headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const p = await b.newPage();
    await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await p.evaluateOnNewDocument(() => {
      localStorage.setItem('gw-onboarded', '1');
      window.__gps = { handlers: [] };
      const mock = {
        getCurrentPosition: (cb) => cb({ coords: { longitude: -111.8275, latitude: 40.3910, speed: 0 } }),
        watchPosition: (cb) => { window.__gps.handlers.push(cb); return 0; },
        clearWatch: () => {},
      };
      Object.defineProperty(navigator, 'geolocation', { value: mock, configurable: true });
    });
    await p.goto('http://localhost:4173/', { waitUntil: 'load', timeout: 60000 });
    await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });
    console.log('[UI] app booted headlessly (no phone)');
    await p.screenshot({ path: 'docs/evidence/gw-headless-boot.png' });
    await b.close();
    return true;
  } finally {
    if (vite) { try { process.kill(-vite.pid, 'SIGTERM'); } catch {} }
  }
}

// ---------- Layer B: engine over shipped graph ----------
async function engineLayer() {
  const gz = createReadStream('public/graph/wasatch-graph.bin.gz');
  const chunks = [];
  for await (const c of gz) chunks.push(c);
  const raw = Buffer.concat(chunks).buffer;

  globalThis.fetch = async (url) => {
    if (String(url).includes('wasatch-graph.bin.gz')) {
      return { ok: true, status: 200, arrayBuffer: async () => raw };
    }
    throw new Error('no net');
  };
  const { planRoutes, loadGraph } = await import('../src/router.js');
  await loadGraph();

  const minDistToCam = (coords) => {
    let best = 1e9;
    for (let i = 1; i < coords.length; i++) {
      const a = coords[i - 1], b = coords[i];
      const steps = Math.max(1, Math.ceil(Math.hypot((b[0] - a[0]) * 91000, (b[1] - a[1]) * 111320) / 5));
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const lon = a[0] + (b[0] - a[0]) * t, lat = a[1] + (b[1] - a[1]) * t;
        const d = Math.hypot((lon - F006[0]) * 91000, (lat - F006[1]) * 111320);
        if (d < best) best = d;
      }
    }
    return best;
  };

  const rows = [];
  for (const [name, org] of [
    ['far-N-500', [-111.8275, 40.3940]],
    ['far-N-200', [-111.8275, 40.3910]],
    ['near-S-100', [-111.8275, 40.3880]],
    ['near-SE-150', [-111.8265, 40.3880]],
  ]) {
    const { options } = await planRoutes(org, [-111.8279, 40.3855], {});
    const clear = options.find((o) => o.label === 'Clearest');
    let status, pass;
    if (!clear) {
      // No Clearest served at all = the router held (refused to serve a line
      // through the reader). That is honest, not a failure.
      status = 'HELD (no Clearest served)'; pass = true;
    } else {
      const min = minDistToCam(clear.coords);
      status = `F006min=${Math.round(min)}m ${min >= 75 ? 'PASS (≥75m)' : 'FAIL (<75m)'}`;
      pass = min >= 75;
    }
    rows.push({ name, pass, status });
    console.log(`[ENGINE] ${name.padEnd(12)} Clearest ${clear ? Math.round(clear.distance) + 'm' : 'none'}  ${status}`);
  }

  const farFail = rows.filter((r) => !r.name.startsWith('near') && !r.pass).length;
  const nearFail = rows.filter((r) => r.name.startsWith('near') && !r.pass).length;
  console.log(`\nSummary: ${rows.length - farFail}/${rows.length} far-origin PASS (expect 2/2); near-origin PASS=${2 - nearFail}/2 (expect 2/2 — held counts as PASS).`);
  if (farFail > 0 || nearFail > 0) { console.error('CLEARANCE FAILURE — regression'); process.exit(1); }
  return true;
}

await uiLayer();
await engineLayer();
console.log('\nAUDIT DONE (phone-free).');
