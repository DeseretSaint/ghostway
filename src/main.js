import { CONFIG, CAMERA_LAYER } from './config.js';
import { MapView } from './map-view.js';
import { CameraStore } from './camera-store.js';
import { searchPlaces, reverseGeocode } from './search.js';
import { planRoute } from './routing.js';
import { planRoutes, loadGraph, inGraphRegion, graphStatus } from './router.js';
import { $, el, debounce, fmtDistance, fmtDuration, haversine, pointToSegmentM } from './utils.js';
import { buildPanel, renderRouteCard, showStatus, clearStatus } from './ui.js';
import { registerSW } from './pwa.js';

const app = {
  map: null,
  cameras: null,
  state: {
    from: null, // {coords, label}
    to: null,
    mode: localStorage.getItem('gw-mode') || 'moderate', // strict | moderate | off
    avoid: true, // derived from mode !== 'off' (kept for legacy path)
    route: null,
    options: [], // engine route options
    chosen: 0,
    userLoc: null, // [lon,lat] last known GPS
    navigating: false,
    gpsWatch: null,
    stepIndex: 0,
  },
};

async function init() {
  app.map = new MapView('map');
  app.cameras = new CameraStore();
  await app.cameras.loadFallback();

  // Expose nav controls to the UI module.
  app.startNav = startNav;
  app.stopNav = stopNav;
  app.selectOption = selectOption;

  buildPanel(app);
  wireApp();
  await app.map.ready();

  // Camera click -> info modal.
  app.map.onCameraClick(async (props, coords) => {
    openCameraModal(props, coords);
  });

  showStatus('Tap ◎ to start from your location, or search a destination.', 'info');
  registerSW();
  preloadEngine();
  applyModeUI();
}

// Load Ghostway's own routing graph in the background (~6 MB gz).
async function preloadEngine() {
  try {
    await loadGraph();
    app._engineReady = true;
    enginePill('🛡 Local camera-aware engine ready');
    window.__ghostwayEngine = 'ready';
  } catch (e) {
    console.warn('engine load failed', e);
    app._engineReady = false;
    window.__ghostwayEngine = 'failed';
  }
}

function enginePill(msg) {
  const s = $('#engineStatus');
  if (!s) return;
  s.textContent = msg;
  s.hidden = false;
  clearTimeout(s._t);
  s._t = setTimeout(() => (s.hidden = true), 4000);
}

function wireApp() {
  $('#menuBtn').addEventListener('click', openDrawer);
  $('#closeDrawer').addEventListener('click', closeDrawer);
  $('#scrim').addEventListener('click', () => {
    closeDrawer();
    closeModal();
  });
  $('#modalClose').addEventListener('click', closeModal);

  $('#gpsBtn').addEventListener('click', useMyLocation);

  $('#goBtn').addEventListener('click', onRoute);
  $('#swapBtn').addEventListener('click', swapEndpoints);
  $('#clearRouteBtn').addEventListener('click', clearRoute);

  // Camera avoidance mode switch (strict / moderate / off).
  $('#modeSwitch').addEventListener('click', (e) => {
    const btn = e.target.closest('.mode-btn');
    if (!btn) return;
    app.state.mode = btn.dataset.mode;
    localStorage.setItem('gw-mode', app.state.mode);
    app.state.avoid = app.state.mode !== 'off';
    applyModeUI();
    if (app.state.from && app.state.to) onRoute();
  });

  $('#camInfoBtn').addEventListener('click', openWhyModal);

  // Drawer actions.
  $('#drawer').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    closeDrawer();
    setTimeout(() => handleDrawer(action), 180);
  });
}

function applyModeUI() {
  const pill = $('#safety-pill');
  const mode = app.state.mode;
  pill.classList.toggle('off', mode === 'off');
  pill.querySelector('.label').textContent =
    mode === 'strict' ? 'Strict avoidance' : mode === 'moderate' ? 'Avoid cameras' : 'Fastest route';
  document.querySelectorAll('.mode-btn').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
}

function setEndpoints(from, to) {
  app.state.from = from;
  app.state.to = to;
  $('#route-actions').hidden = false;
  $('#avoid-toggle').hidden = false;
  if (from) $('#fromInput').value = from.label || '';
  if (to) $('#toInput').value = to.label || '';
}

async function useMyLocation() {
  showStatus('Locating…', 'info');
  if (!navigator.geolocation) {
    showStatus('Geolocation not available in this browser.', 'warn');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const coords = [pos.coords.longitude, pos.coords.latitude];
      app.state.userLoc = coords;
      const label = (await reverseGeocode(coords).catch(() => null)) || 'My location';
      setEndpoints({ coords, label }, app.state.to);
      app.map.flyTo(coords, 14);
      clearStatus();
      maybeAutoRoute();
    },
    (err) => {
      showStatus('Could not get location: ' + err.message, 'warn');
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function maybeAutoRoute() {
  if (app.state.from && app.state.to) onRoute();
}

function engineCovers(fromC, toC) {
  return app._engineReady && inGraphRegion(fromC[0], fromC[1]) && inGraphRegion(toC[0], toC[1]);
}

async function onRoute() {
  const from = app.state.from || (await resolveInput('fromInput'));
  const to = app.state.to || (await resolveInput('toInput'));
  if (!from || !to) {
    showStatus('Set a start and a destination.', 'warn');
    return;
  }
  setEndpoints(from, to);
  showStatus('Routing…', 'info');

  // --- Ghostway's own camera-aware engine (in coverage) ---
  if (engineCovers(from.coords, to.coords)) {
    try {
      const t0 = performance.now();
      const { options } = await planRoutes(from.coords, to.coords, {});
      const ms = Math.round(performance.now() - t0);
      app.state.options = options;
      // Default pick: closest to the user's mode preference.
      const modeRank = { strict: ['strict', 'moderate', 'off'], moderate: ['moderate', 'strict', 'off'], off: ['off', 'moderate', 'strict'] };
      const pref = modeRank[app.state.mode] || modeRank.moderate;
      let chosen = options.findIndex((o) => o.mode === pref[0]);
      if (chosen === -1) chosen = options.findIndex((o) => o.mode === pref[1]);
      if (chosen === -1) chosen = 0;
      app.state.chosen = chosen;
      app.state.route = { engine: true, options, chosen };
      drawEngineRoutes();
      renderRouteCard(app, app.state.route);
      clearStatus();
      enginePill(`🛡 Local engine · ${ms} ms · ${options.length} option${options.length > 1 ? 's' : ''}`);
      window.__ghostwayDebug = { routed: true, engine: true, options: options.length, ms };
      return;
    } catch (e) {
      console.warn('engine route failed, falling back', e);
    }
  }

  // --- Legacy fallback (outside coverage or engine failure) ---
  try {
    const result = await planRoute(from.coords, to.coords, {
      avoid: app.state.avoid,
      cameraStore: app.cameras,
    });
    app.state.route = result;
    drawRoute(result);
    renderRouteCard(app, result);
    clearStatus();
  } catch (err) {
    console.error(err);
    showStatus('Routing failed: ' + err.message, 'warn');
  }
}

function selectOption(i) {
  if (!app.state.options[i]) return;
  app.state.chosen = i;
  drawEngineRoutes();
  renderRouteCard(app, app.state.route);
}

function drawEngineRoutes() {
  const { options, chosen } = app.state;
  const feats = [];
  options.forEach((o, i) => {
    if (i === chosen) return;
    feats.push({
      type: 'Feature',
      properties: { color: '#5b6b80' },
      geometry: { type: 'LineString', coordinates: o.coords },
    });
  });
  const sel = options[chosen];
  feats.push({
    type: 'Feature',
    properties: { color: '#3ad6c5' },
    geometry: { type: 'LineString', coordinates: sel.coords },
  });
  app.map.setRoute(feats);
  app.map.setEndpoints([
    { type: 'Feature', properties: { color: '#3ad6c5' }, geometry: { type: 'Point', coordinates: sel.coords[0] } },
    { type: 'Feature', properties: { color: '#ff4d6d' }, geometry: { type: 'Point', coordinates: sel.coords[sel.coords.length - 1] } },
  ]);
  app.map.fitTo(sel.coords, true);

  // Nav bookkeeping for the chosen option.
  app._navSteps = (sel.instructions || []).map((s) => ({ ...s, startS: s.at || 0 }));
  app._routeCum = cumulativeDistances(sel.coords);
  app._routeTotal = app._routeCum[app._routeCum.length - 1] || 1;
  app._navRouteCoords = sel.coords;
  app._totalDuration = sel.duration;
}

async function resolveInput(id) {
  const v = $('#' + id).value.trim();
  if (!v) return null;
  const places = await searchPlaces(v, 1).catch(() => []);
  if (places.length) {
    const p = places[0];
    return { coords: p.coords, label: p.name };
  }
  return { coords: null, label: v };
}

function drawRoute(result) {
  const shown = result.avoid && result.applied ? result.clear : result.baseline;
  const alt = result.avoid && result.applied ? result.baseline : null;

  const feats = [];
  feats.push({
    type: 'Feature',
    properties: { color: '#3ad6c5' },
    geometry: { type: 'LineString', coordinates: shown.coords },
  });
  if (alt) {
    feats.push({
      type: 'Feature',
      properties: { color: '#5b6b80' },
      geometry: { type: 'LineString', coordinates: alt.coords },
    });
  }
  app.map.setRoute(feats);

  app.map.setEndpoints([
    { type: 'Feature', properties: { color: '#3ad6c5' }, geometry: { type: 'Point', coordinates: result.from } },
    { type: 'Feature', properties: { color: '#ff4d6d' }, geometry: { type: 'Point', coordinates: result.to } },
  ]);

  const all = [result.from, ...shown.coords, result.to];
  app.map.fitTo(all, true);
  window.__ghostwayDebug = { routed: true, applied: result.applied, avoided: result.avoidedCount };
  app._navSteps = result.steps || [];
  app._routeCum = cumulativeDistances(shown.coords);
  app._routeTotal = app._routeCum[app._routeCum.length - 1] || 1;
  app._navRouteCoords = shown.coords;
  app._totalDuration = shown.duration;
}

function cumulativeDistances(coords) {
  const cum = [0];
  for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + haversine(coords[i - 1], coords[i]));
  return cum;
}

// Fraction (0..1) of the route the user has traversed, by nearest point.
function routeFraction(userC) {
  const coords = app._navRouteCoords;
  if (!coords || coords.length < 2) return 0;
  let best = Infinity, bestFrac = 0;
  for (let i = 1; i < coords.length; i++) {
    const d = pointToSegmentM(userC, coords[i - 1], coords[i]);
    if (d < best) {
      best = d;
      const seg = haversine(coords[i - 1], coords[i]) || 1;
      const within = pointProject(userC, coords[i - 1], coords[i]);
      bestFrac = (app._routeCum[i - 1] + within * seg) / (app._routeTotal || 1);
    }
  }
  return Math.max(0, Math.min(1, bestFrac));
}

// Project point P onto segment AB; return t in [0,1] along A->B.
function pointProject(p, a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const latm = toRad((a[1] + b[1]) / 2);
  const ax = (b[0] - a[0]) * Math.cos(latm) * R;
  const ay = (b[1] - a[1]) * R;
  const px = (p[0] - a[0]) * Math.cos(latm) * R;
  const py = (p[1] - a[1]) * R;
  const len2 = ax * ax + ay * ay || 1;
  let t = (px * ax + py * ay) / len2;
  return Math.max(0, Math.min(1, t));
}

// ---- Turn-by-turn navigation mode ----
function startNav() {
  if (!app.state.route) return;
  app.state.navigating = true;
  app.state.stepIndex = 0;
  // Hide the planning panel, show the nav banner.
  $('#panel').hidden = true;
  showNavBanner();
  // Follow the user with GPS.
  if (navigator.geolocation) {
    app.state.gpsWatch = navigator.geolocation.watchPosition(
      (pos) => {
        const c = [pos.coords.longitude, pos.coords.latitude];
        app.state.userLoc = c;
        app.map.flyTo(c, 15);
        advanceStep(c);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 2000 }
    );
  }
}

function stopNav() {
  app.state.navigating = false;
  if (app.state.gpsWatch) {
    navigator.geolocation.clearWatch(app.state.gpsWatch);
    app.state.gpsWatch = null;
  }
  $('#navBanner').hidden = true;
  $('#panel').hidden = false;
  const sel = app.state.route?.engine ? app.state.options[app.state.chosen] : null;
  const fit = sel ? sel.coords : [app.state.from?.coords, app.state.to?.coords].filter(Boolean);
  app.map.fitTo(fit, true);
}

function advanceStep(userC) {
  const steps = app._navSteps || [];
  if (!steps.length || !app.state.navigating) return;
  const frac = routeFraction(userC);
  const traveled = frac * (app._routeTotal || 1);
  // Steps carry cumulative start distances (meters). Find the last step whose
  // start is at/before the user's traveled distance.
  let idx = 0;
  for (let i = 0; i < steps.length; i++) {
    if ((steps[i].startS || 0) <= traveled + 15) idx = i;
  }
  if (idx !== app.state.stepIndex) {
    app.state.stepIndex = idx;
    renderNavStep();
  }
}

function showNavBanner() {
  const banner = $('#navBanner');
  banner.hidden = false;
  renderNavStep();
}

function renderNavStep() {
  const steps = app._navSteps || [];
  if (!steps.length) return;
  const i = Math.min(app.state.stepIndex, steps.length - 1);
  const step = steps[i];
  const dist = step ? fmtDistance(step.distance) : '';
  const dir = step ? step.instruction : 'Continue';
  const name = step && step.name ? ` <b>${step.name}</b>` : '';
  // Remaining ETA: prefer per-step durations (legacy); else prorate total.
  let eta;
  if (step && step.duration != null) {
    eta = fmtDuration(steps.slice(i).reduce((a, s) => a + (s.duration || 0), 0));
  } else if (app._totalDuration) {
    eta = fmtDuration(app._totalDuration * (1 - routeFraction(app.state.userLoc || [0, 0])));
  } else {
    eta = '';
  }
  $('#navBanner').innerHTML = `
    <button id="navStop" class="nav-stop" aria-label="Stop navigation">■</button>
    <div class="nav-step">
      <div class="nav-dist">${dist}</div>
      <div class="nav-dir">${dir}${name}</div>
    </div>
    <div class="nav-eta">${eta}</div>`;
  const stop = $('#navStop');
  if (stop) stop.addEventListener('click', stopNav);
}

function swapEndpoints() {
  const { from, to } = app.state;
  app.state.from = to;
  app.state.to = from;
  if (from) $('#fromInput').value = from.label || '';
  if (to) $('#toInput').value = to.label || '';
  if (from && to) onRoute();
}

function clearRoute() {
  app.state.route = null;
  app.state.options = [];
  app.state.chosen = 0;
  app.state.from = null;
  app.state.to = null;
  $('#fromInput').value = '';
  $('#toInput').value = '';
  $('#search').hidden = false;
  $('#route-actions').hidden = true;
  $('#avoid-toggle').hidden = true;
  $('#route-card').hidden = true;
  app.map.setRoute([]);
  app.map.setEndpoints([]);
  clearStatus();
}

// ---- Modal / drawer helpers ----
function openDrawer() {
  $('#drawer').hidden = false;
  $('#scrim').hidden = false;
}
function closeDrawer() {
  $('#drawer').hidden = true;
  $('#scrim').hidden = true;
}
function openModal(html) {
  $('#modalBody').innerHTML = html;
  $('#modal').hidden = false;
  $('#scrim').hidden = false;
}
function closeModal() {
  $('#modal').hidden = true;
  if ($('#drawer').hidden) $('#scrim').hidden = true;
}

function openCameraModal(props, coords) {
  const brand = props.brand || 'Unknown';
  const op = props.operator || '';
  const kind = props.kind || 'camera';
  const isFlock = /flock/i.test(brand);
  openModal(`
    <h3>📷 ${brand}</h3>
    ${op ? `<p class="muted">Operator: ${op}</p>` : ''}
    <p>${kind === 'ALPR' ? 'Automated license plate reader (ALPR)' : 'Surveillance camera'}</p>
    <p class="muted">${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}</p>
    ${isFlock ? '<p class="warn-text">Flock Safety shares plate reads with thousands of agencies. Ghostway routes around these by default.</p>' : ''}
    <p class="muted small">Data: DeFlock / OpenStreetMap contributors</p>
  `);
}

function openWhyModal() {
  openModal(`
    <h3>Why avoid these cameras?</h3>
    <p>Automated license plate readers (ALPRs) — Flock Safety and others — photograph every
    passing vehicle and log its location, time, and identifying details, then share that data
    with thousands of agencies nationwide, usually without a warrant.</p>
    <p>Ghostway uses the open <a href="https://deflock.org" target="_blank" rel="noopener">DeFlock</a>
    camera map to route you around known camera locations by default.</p>
    <p><b>Strict</b> bends over backwards to pass zero cameras. <b>Moderate</b> avoids most while
    keeping the detour sensible. <b>Off</b> takes the fastest road.</p>
  `);
}

function handleDrawer(action) {
  if (action === 'about') {
    openModal(`<h3>${CONFIG.about.name}</h3><p class="tag">${CONFIG.about.tagline}</p><p>${CONFIG.about.body}</p>`);
  } else if (action === 'data') {
    openModal(`
      <h3>Data sources</h3>
      <ul class="src-list">
        <li><b>Base map:</b> OpenStreetMap via OpenFreeMap</li>
        <li><b>Cameras:</b> DeFlock (OpenStreetMap + volunteer ALPR map)</li>
        <li><b>Search:</b> Photon (OpenStreetMap)</li>
        <li><b>Routing:</b> Ghostway engine (Wasatch Front) · BRouter + OSRM fallback</li>
      </ul>
      <p class="muted small">All sources are open and free to use. No account, no tracking.</p>
    `);
  } else if (action === 'privacy') {
    openModal(`
      <h3>Privacy & how it works</h3>
      <p>Inside the Wasatch Front coverage area, routing happens <b>entirely on your device</b>
      using Ghostway's own prebuilt road graph — your destination never leaves your phone.</p>
      <p>Outside coverage, routes fall back to public open-source servers (Photon, BRouter, OSRM).
      Ghostway itself stores nothing about you.</p>
    `);
  } else if (action === 'donate') {
    openDonate();
  } else if (action === 'github') {
    window.open(CONFIG.github, '_blank', 'noopener');
  }
}

function openDonate() {
  const d = CONFIG.donate;
  const methods = d.methods
    .map((m) => `<li><a href="${m.url}" target="_blank" rel="noopener">${m.label}</a> <span class="muted">— ${m.note}</span></li>`)
    .join('');
  const crypto = d.crypto
    .map((c) => `<li><b>${c.label}</b><br><code class="addr">${c.addr}</code></li>`)
    .join('');
  openModal(`
    <h3>${d.title}</h3>
    <p>${d.blurb}</p>
    <ul class="src-list">${methods}</ul>
    ${crypto ? `<details><summary>Crypto</summary><ul class="src-list">${crypto}</ul></details>` : ''}
    <p class="muted small">Suggested: the price of a coffee. Totally optional.</p>
  `);
}

init();
