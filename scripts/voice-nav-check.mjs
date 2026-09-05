#!/usr/bin/env node
// scripts/voice-nav-check.mjs — UX #28: hermetic voice navigation TTS test.
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 120s'); process.exit(2); }, 120000).unref();

const pv = await startPreview();
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true });

await p.evaluateOnNewDocument(() => {
  localStorage.setItem('gw-onboarded', '1');
  localStorage.removeItem('gw-voice-muted');
  window.__gps = { handlers: [] };
  const mock = {
    getCurrentPosition: (cb) => cb({ coords: { longitude: -111.759, latitude: 40.364, speed: 0 } }),
    watchPosition: (cb) => { window.__gps.handlers.push(cb); return 0; },
    clearWatch: () => {},
  };
  Object.defineProperty(navigator, 'geolocation', { value: mock, configurable: true });
  window.__said = [];
  class FakeUtterance { constructor(text) { this.text = text; } }
  Object.defineProperty(window, 'speechSynthesis', {
    value: {
      speak: (u) => { window.__said.push(u.text); if (u.onend) setTimeout(u.onend, 10); },
      cancel: () => {},
      getVoices: () => [],
    },
    configurable: true,
  });
  window.SpeechSynthesisUtterance = FakeUtterance;
});

await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });

async function pick(inputSel, query) {
  await p.type(inputSel, query);
  try { await p.waitForFunction(() => !document.querySelector('#suggestions .sugg-loading') && !!document.querySelector('#suggestions .sugg:not(.sugg-recent)'), { timeout: 12000 }); await p.click('#suggestions .sugg:not(.sugg-recent)'); }
  catch { await p.focus(inputSel); await p.keyboard.press('Enter'); }
  await wait(500);
}

await pick('#toInput', 'Costco Lehi');
await pick('#fromInput', 'Pleasant Grove Utah');
await p.waitForFunction('window.__ghostwayDebug?.routed === true', { timeout: 30000 });
await wait(1000);

await p.click('#startNavBtn');
await wait(1000);

const hasVoiceBtn = await p.evaluate(() => !!document.getElementById('voiceBtn'));
console.log('voiceBtn in banner:', hasVoiceBtn);

// Drive the route.
const drove = await p.evaluate(async () => {
  const coords = window.__ghostwayNavCoords;
  if (!coords || !coords.length) return 0;
  let last = null;
  for (let i = 0; i < coords.length; i++) {
    const [lon, lat] = coords[i];
    let heading = 0;
    if (last) { const dx = lon - last[0], dy = lat - last[1]; if (Math.hypot(dx, dy) > 1e-8) heading = ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360; }
    last = [lon, lat];
    window.__gps.handlers[0]({ coords: { longitude: lon, latitude: lat, speed: 15, heading } });
    await new Promise((r) => setTimeout(r, 25));
  }
  return coords.length;
});
console.log('drove points:', drove);
await wait(500);

const said = await p.evaluate(() => window.__said);
console.log('said:', JSON.stringify(said));

// Toggle mute via evaluate (avoid stale element ref).
if (hasVoiceBtn) {
  await p.evaluate(() => document.getElementById('voiceBtn').click());
  await wait(300);
  const prefAfterMute = await p.evaluate(() => localStorage.getItem('gw-voice'));
  console.log('after mute click, gw-voice:', prefAfterMute);

  await p.evaluate(() => document.getElementById('voiceBtn').click());
  await wait(300);
  const prefAfterUnmute = await p.evaluate(() => localStorage.getItem('gw-voice'));
  console.log('after unmute click, gw-voice:', prefAfterUnmute);
}

const checks = {
  voiceBtnInBanner: hasVoiceBtn,
  firstStepSpoken: said.length > 0 && said[0].length > 0,
  stepChangeSpoken: said.length > 1,
  arrivalSpoken: said.some((t) => /arrived/i.test(t)),
};
console.log('Checks:', JSON.stringify(checks, null, 2));

const pass = checks.voiceBtnInBanner && checks.firstStepSpoken && checks.stepChangeSpoken;
console.log(pass ? '\nVOICE-NAV PASS ✅' : '\nVOICE-NAV FAIL ❌');

try { await Promise.race([b.close(), wait(5000)]); } catch {}
pv.kill();
process.exit(pass ? 0 : 1);
