import { CONFIG, CAMERA_LAYER } from './config.js';
import { MapView } from './map-view.js';
import { CameraStore } from './camera-store.js';
import { searchPlaces, reverseGeocode } from './search.js';
import { planRoute } from './routing.js';
import { $, el, debounce, fmtDistance, fmtDuration } from './utils.js';
import { buildPanel, renderRouteCard, showStatus, clearStatus } from './ui.js';

const app = {
  map: null,
  cameras: null,
  state: {
    from: null, // {coords, label}
    to: null,
    avoid: true,
    route: null,
  },
};

async function init() {
  app.map = new MapView('map');
  app.cameras = new CameraStore();
  await app.cameras.loadFallback();

  buildPanel(app);
  wireApp();
  await app.map.ready();

  // Camera click -> info modal.
  app.map.onCameraClick(async (props, coords) => {
    openCameraModal(props, coords);
  });

  // Default view: Pleasant Grove, UT (Keaton's home turf) to demonstrate.
  showStatus('Tap ◎ to start from your location, or search a destination.', 'info');
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
  $('#avoidChk').addEventListener('change', (e) => {
    app.state.avoid = e.target.checked;
    updateSafetyPill();
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

function updateSafetyPill() {
  const pill = $('#safety-pill');
  const on = app.state.avoid;
  pill.classList.toggle('off', !on);
  pill.querySelector('.label').textContent = on ? 'Avoid cameras' : 'Fastest route';
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

async function onRoute() {
  const from = app.state.from || (await resolveInput('fromInput'));
  const to = app.state.to || (await resolveInput('toInput'));
  if (!from || !to) {
    showStatus('Set a start and a destination.', 'warn');
    return;
  }
  setEndpoints(from, to);
  showStatus('Routing…', 'info');

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
  app.state.from = null;
  app.state.to = null;
  $('#fromInput').value = '';
  $('#toInput').value = '';
  $('#toInput').value = '';
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
    <p class="muted">Toggle “Avoid surveillance cameras” off any time you’d rather take the fastest road.</p>
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
        <li><b>Routing:</b> BRouter + OSRM (OpenStreetMap)</li>
      </ul>
      <p class="muted small">All sources are open and free to use. No account, no tracking.</p>
    `);
  } else if (action === 'privacy') {
    openModal(`
      <h3>Privacy & how it works</h3>
      <p>Your searches and routes are sent to public open-source servers (Photon, BRouter, OSRM)
      to compute results — the same data any map needs. Ghostway itself stores nothing about you.</p>
      <p>Routes default to avoiding ALPR cameras using DeFlock’s open dataset. You can turn that
      off for the fastest road.</p>
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
