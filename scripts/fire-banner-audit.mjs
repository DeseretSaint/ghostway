// Verify nav banner rendering: geometry, bg color, chip contrast in both themes
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function audit(variant) {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: variant }]);
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  
  // Stub geolocation
  await page.evaluateOnNewDocument(() => {
    const stub = {
      watchPosition: (ok) => { try { ok && ok({ coords: { longitude: -111.6406, latitude: 40.3644, speed: 0, heading: 0, accuracy: 5 }, timestamp: Date.now() }); } catch {} return 1; },
      clearWatch: () => {},
      getCurrentPosition: (ok) => { try { ok && ok({ coords: { longitude: -111.6406, latitude: 40.3644, speed: 0, heading: 0, accuracy: 5 }, timestamp: Date.now() }); } catch {} },
    };
    Object.defineProperty(navigator, 'geolocation', { value: stub, configurable: true });
    navigator.geolocation.__gwStubbed = true;
  });
  
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.evaluate(() => { try { localStorage.setItem('gw-onboarded', '1'); } catch {} });
  await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForFunction('window.__gw !== undefined', { timeout: 30000 });
  await wait(2000);
  await page.evaluate(() => { document.querySelector('#obSkip')?.click(); });
  await wait(300);
  await page.type('#fromInput', 'Pleasant Grove, Utah');
  await wait(800);
  await page.type('#toInput', 'Lindon, Utah');
  await wait(800);
  page.evaluate(() => document.querySelector('#goBtn').click());
  await page.waitForFunction(() => window.__ghostwayDebug?.routed === true, { timeout: 20000 }).catch(()=>{});
  await wait(1500);
  page.evaluate(() => window.__gw.startNav());
  await wait(1000);
  
  const result = await page.evaluate(() => {
    const banner = document.querySelector('.nav-banner');
    if (!banner) return { error: 'no .nav-banner' };
    const rect = banner.getBoundingClientRect();
    if (rect.width === 0) return { error: 'banner has zero width', bannerExists: true, rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height } };
    const cs = getComputedStyle(banner);
    
    // Find chip
    const chip = banner.querySelector('.cam-chip');
    const chipRect = chip ? chip.getBoundingClientRect() : null;
    const chipCs = chip ? getComputedStyle(chip) : null;
    
    // Find distance text
    const dist = banner.querySelector('#navDist');
    const distRect = dist ? dist.getBoundingClientRect() : null;
    const distCs = dist ? getComputedStyle(dist) : null;
    
    // Find turn instruction
    const dir = banner.querySelector('.nav-dir');
    const dirRect = dir ? dir.getBoundingClientRect() : null;
    const dirCs = dir ? getComputedStyle(dir) : null;
    
    // Sample banner bg color at multiple points
    const bannerBgPoints = [];
    for (const [lx, ly] of [[0.1, 0.5], [0.3, 0.5], [0.5, 0.5], [0.7, 0.5], [0.9, 0.5]]) {
      const x = rect.left + rect.width * lx;
      const y = rect.top + rect.height * ly;
      bannerBgPoints.push({ x: x|0, y: y|0 });
    }
    
    return {
      banner: {
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        bg: cs.backgroundColor,
        border: cs.borderColor,
        display: cs.display,
      },
      chip: chipRect ? {
        rect: { x: chipRect.x|0, y: chipRect.y|0, w: chipRect.width|0, h: chipRect.height|0 },
        bg: chipCs.backgroundColor,
        color: chipCs.color,
        text: chip.textContent.trim(),
      } : null,
      dist: distRect ? {
        rect: { x: distRect.x|0, y: distRect.y|0, w: distRect.width|0, h: distRect.height|0 },
        color: distCs.color,
        fontSize: distCs.fontSize,
        text: dist.textContent.trim(),
      } : null,
      dir: dirRect ? {
        rect: { x: dirRect.x|0, y: dirRect.y|0, w: dirRect.width|0, h: dirRect.height|0 },
        color: dirCs.color,
        fontSize: dirCs.fontSize,
        text: dir.textContent.trim(),
      } : null,
      colorScheme: getComputedStyle(document.documentElement).colorScheme,
    };
  });
  
  await browser.close();
  return { variant, result };
}

const day = await audit('light');
const night = await audit('dark');

console.log('\n=== DAY (light) ===');
console.log(JSON.stringify(day, null, 2));
console.log('\n=== NIGHT (dark) ===');
console.log(JSON.stringify(night, null, 2));
