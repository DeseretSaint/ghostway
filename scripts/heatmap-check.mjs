// Mid-zoom heatmap check: the camera heatmap must dominate at low zoom, then
// fade out as individual camera dots take over (circle layer minzoom 11).
// Measures heatmap-colored pixel coverage at several zoom levels via real
// screenshots (sips -> BMP -> byte parse; no image deps).
//
// PASS criteria:
//  - low zoom (9.5): heatmap clearly present (coverage above floor)
//  - mid zoom (12.5): heatmap effectively gone (<= 12% of the z9.5 coverage)
//  - no page errors
import { execSync } from 'node:child_process';
import { readFileSync, unlinkSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const CENTER = [-111.93, 40.66]; // dense camera band (Salt Lake / West Valley)

function bmpPixels(path) {
  const buf = readFileSync(path);
  if (buf.toString('ascii', 0, 2) !== 'BM') throw new Error('not a BMP');
  const off = buf.readUInt32LE(10);
  const w = buf.readInt32LE(18);
  const h = Math.abs(buf.readInt32LE(22));
  const bpp = buf.readUInt16LE(28);
  if (bpp !== 24 && bpp !== 32) throw new Error('unexpected bpp ' + bpp);
  const rowSize = Math.ceil((w * (bpp / 8)) / 4) * 4;
  const up = buf.readInt32LE(22) > 0;
  const px = [];
  for (let y = 0; y < h; y++) {
    const srcY = up ? h - 1 - y : y;
    const base = off + srcY * rowSize;
    for (let x = 0; x < w; x++) {
      const i = base + x * (bpp / 8);
      px.push([buf[i + 2], buf[i + 1], buf[i]]); // BGR -> RGB
    }
  }
  return { w, h, px };
}

// Heatmap ramp colors: teal (58,214,197) -> orange (255,170,64) -> pink (255,77,109).
function isHeat([r, g, b]) {
  if (g > 160 && b > 140 && r < 140 && g > r + 30) return true; // teal
  if (r > 225 && g > 130 && g < 195 && b < 100) return true; // orange
  if (r > 180 && g < 130 && b < 145 && r > g + 45) return true; // pink/red
  return false;
}

const b = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--window-size=1100,800'],
});
const p = await b.newPage();
await p.setViewport({ width: 1100, height: 800 });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e.message)));
await p.evaluateOnNewDocument(() => {
  localStorage.setItem('gw-onboarded', '1');
  const mock = {
    getCurrentPosition: (cb) => cb({ coords: { longitude: -111.759, latitude: 40.364, speed: 0 } }),
    watchPosition: () => 0,
    clearWatch: () => {},
  };
  Object.defineProperty(navigator, 'geolocation', { value: mock, configurable: true });
});
await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });
await wait(2500); // camera vector tiles
// Isolate the heatmap: hide the circle-dot layer (its red/amber fills match the
// heat ramp colors and would be miscounted as heatmap residue at z>=11).
await p.evaluate(() =>
  window.__gw.map.map.setLayoutProperty('cameras-layer', 'visibility', 'none')
);

const results = {};
for (const z of [9.5, 10.5, 11.5, 12.5]) {
  await p.evaluate(
    ([c, zoom]) => window.__gw.map.map.jumpTo({ center: c, zoom }),
    [CENTER, z]
  );
  await wait(1800); // tiles + heatmap render
  const png = `tmp-heat-${z}.png`;
  const bmp = `tmp-heat-${z}.bmp`;
  await p.screenshot({ path: png });
  execSync(`sips -s format bmp "${png}" --out "${bmp}" >/dev/null`);
  const { w, h, px } = bmpPixels(bmp);
  let heat = 0;
  for (const c of px) if (isHeat(c)) heat++;
  results[z] = { coverage: +(100 * heat / (w * h)).toFixed(2), heatPx: heat, totalPx: w * h };
  try { unlinkSync(png); unlinkSync(bmp); } catch {}
}
console.log('heatmap coverage by zoom:', JSON.stringify(results));
console.log('ERRORS', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 3));

const low = results[9.5].coverage;
const mid = results[12.5].coverage;
const pass =
  errs.filter((e) => !/favicon|404/.test(e)).length === 0 &&
  low >= 1.0 && // heatmap visibly present at low zoom
  mid <= Math.max(0.3, low * 0.12); // faded out by mid zoom
console.log(pass
  ? `\nHEATMAP PASS ✅ — low-zoom density ${low}%, mid-zoom residue ${mid}%`
  : `\nHEATMAP FAIL ❌ — low ${low}% / mid ${mid}% (mid must be ≤ max(0.3, 12% of low))`);
// b.close() can hang forever under swiftshader; race it, then force-exit.
try { await Promise.race([b.close(), wait(5000)]); } catch {}
process.exit(pass ? 0 : 1); // explicit: puppeteer can leave handles open
