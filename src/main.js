import { CONFIG, CAMERA_LAYER, isAlprCamera } from './config.js';
import { loadReports, addReport, removeReport, markPublished, publishReportToOsm } from './reports.js';
import { MapView } from './map-view.js';
import { CameraStore } from './camera-store.js';
import { searchPlaces, reverseGeocode } from './search.js';
import { planRoute } from './routing.js';
import { planRoutes, loadGraph, regionCovers, graphStatus, endpointsConnected, getGraphStats, resetGraphStats } from './router.js';
import { valhallaPlanRoutes } from './valhalla.js';
import { loadTraffic, loadNationalWzdx, closurePointsNear } from './traffic.js';
import { $, el, debounce, escHtml, fmtDistance, fmtDuration, fmtNavDistance, fmtSpeed, fmtArrive, haversine, haptic, pointToSegmentM, getUnits, setUnits } from './utils.js';
import { buildPanel, renderRouteCard, showStatus, clearStatus, showStatusWithRetry } from './ui.js';
import { icon, stepIconSvg } from './icons.js';
import { registerSW } from './pwa.js';
import { speak, phraseManeuver, phraseArrival, cancel as cancelVoice, toggleVoice, voiceEnabled, setVoiceEnabled } from './voice.js';

const app = {
  map: null,
  cameras: null,
  state: {
    from: null, // {coords, label}
    to: null,
    mode: localStorage.getItem('gw-mode') || 'strict', // strict | moderate | off — STRICT DEFAULT (camera avoidance IS the mission)
    avoid: true, // derived from mode !== 'off' (kept for legacy path)
    compactBanner: localStorage.getItem('gw-compact') !== '0',
    route: null,
    options: [], // engine route options
    chosen: 0,
    userLoc: null, // [lon,lat] last known GPS
    navigating: false,
    gpsWatch: null,
    stepIndex: 0,
  },
};

// F1: Splash progress text — occupy the wait (Maister: unoccupied time feels longer).
// Update the splash text as boot stages progress so the user always knows what's happening.
function setSplashText(msg) {
  const el = document.getElementById('splashText');
  if (el) el.textContent = msg;
}

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
  setSplashText('Map ready — loading your route engine…');
  // Apply a saved basemap preference (light/dark) before the splash clears.
  const savedBase = localStorage.getItem('gw-basemap');
  if (savedBase && savedBase !== 'standard' && CONFIG.basemaps[savedBase]) {
    app.map.setBasemap(savedBase);
    const bb = $('#basemapBtn');
    if (bb) { bb.classList.add('on'); bb.setAttribute('aria-pressed', 'true'); }
  }
  // Seed the distance-units button label from the saved preference.
  const ub0 = $('#unitsBtn');
  if (ub0) {
    const u0 = getUnits();
    ub0.textContent = u0;
    ub0.setAttribute('aria-pressed', String(u0 === 'mi'));
  }
  window.__gw = app; // test/diagnostic hook
  window.__gwRouter = { loadGraph, planRoutes, regionCovers, graphStatus, endpointsConnected, getGraphStats, resetGraphStats };

  // Open on the user's last-known position if we have one (feels personal);
  // otherwise the map keeps its neutral default view (CONFIG.mapCenter).
  const boot = cachedLoc();
  if (boot) app.map.map.jumpTo({ center: boot, zoom: 12 });

  // Splash: hide once tiles are actually on screen (or 4s max), fade out.
  {
    const splash = $('#splash');
    let hidden = false;
    const hideSplash = () => {
      if (hidden || !splash) return;
      hidden = true;
      splash.classList.add('leaving');
      setTimeout(() => { splash.hidden = true; }, 420);
      window.__ghostwaySplash = 'done';
    };
    app.map.map.once('idle', hideSplash);
    setTimeout(hideSplash, 4000); // never trap the user behind a splash
  }

  // F6: Map tile loading feedback — if the splash hides but tiles aren't
  // visually ready yet, show a subtle "Loading map…" so the user isn't
  // staring at a gray void (perceived performance).
  {
    const mapLoading = $('#mapLoading');
    if (mapLoading) {
      setTimeout(() => {
        if (window.__ghostwaySplash !== 'done') return; // splash still up
        // Splash is gone; check if tiles are actually rendered
        if (app.map.map.loaded() === 0) {
          mapLoading.hidden = false;
          app.map.map.once('load', () => { mapLoading.hidden = true; });
          app.map.map.once('idle', () => { mapLoading.hidden = true; });
        }
      }, 4100);
    }
  }

  // First-run onboarding (Workstream D).
  if (!localStorage.getItem('gw-onboarded')) startOnboarding();

  // Camera click -> info modal.
  app.map.onCameraClick(async (props, coords) => {
    openCameraModal(props, coords);
  });

  // Community reports: render layer + handle taps (details/delete).
  refreshReportLayer();
  app.map.onReportClick(async (props, coords) => {
    const reports = loadReports();
    const rec = reports.find((r) => Math.abs(r.lon - coords[0]) < 1e-6 && Math.abs(r.lat - coords[1]) < 1e-6);
    if (!rec) return;
    openModal(`
      <h3>📷 Community report</h3>
      <p><b>${{ alpr: 'ALPR / plate reader', redlight: 'Red-light camera', speed: 'Speed camera', fixed: 'Fixed camera', other: 'Camera (type unknown)' }[rec.kind] || 'Camera'}</b>${rec.brand ? ` — ${escHtml(rec.brand)}` : ''}</p>
      ${rec.note ? `<p class="muted">${escHtml(rec.note)}</p>` : ''}
      <p class="muted small">Reported ${new Date(rec.createdAt).toLocaleDateString()} · ${rec.publishedNoteId ? `Published to OSM note ${escHtml(rec.publishedNoteId)}` : 'Not yet published to OSM'}</p>
      <div class="rp-actions">
        ${rec.publishedNoteId ? '' : '<button id="rptPub" class="primary-btn" type="button">Publish to OSM</button>'}
        <button id="rptDel" class="ghost-btn" type="button">Delete report</button>
      </div>
    `);
    const pub = $('#rptPub');
    if (pub) pub.addEventListener('click', async () => {
      pub.disabled = true;
      pub.textContent = 'Publishing…';
      try {
        const noteId = await publishReportToOsm(rec);
        if (noteId) markPublished(rec.id, noteId);
        closeModal();
        refreshReportLayer();
        showStatus('Published to OpenStreetMap. Thank you!', 'info');
      } catch (e) {
        console.warn('OSM publish failed', e);
        pub.disabled = false;
        pub.textContent = 'Publish to OSM';
        showStatus('Publish failed — report stays local.', 'warn');
      }
    });
    $('#rptDel').addEventListener('click', () => {
      removeReport(rec.id);
      refreshReportLayer();
      closeModal();
      showStatus('Report deleted.', 'info');
    });
  });

  // Tap an alternative route line on the map to select it (Maps-parity: the
  // card lists options, but on a small screen the colored lines are the quick
  // picker). A tap on a non-chosen route line switches to that option.
  app.map.onRouteLineClick((optIndex) => {
    if (optIndex == null || optIndex === app.state.chosen) return;
    if (!app.state.options || !app.state.options[optIndex]) return;
    selectOption(optIndex);
  });

  showStatus('Tap the locate button to start from your location, or search a destination.', 'info');
  registerSW();
  applyModeUI();
  wireOfflineBanner();
}

// Maps-parity offline banner: the app still routes on-device when the network
// drops (bundled graph + cached tiles), but search/traffic/geocoding don't —
// say so instead of failing silently.
function wireOfflineBanner() {
  const banner = $('#offlineBanner');
  if (!banner) return;
  const update = () => { banner.hidden = navigator.onLine; };
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();
}

// Lazily fetch the on-device road graph for the region a route enters — so a
// user outside every shipped region never downloads a graph they won't use.
// Called from the routing path; caches its promise so repeated calls are cheap.
let _localEngineLoading = null;
async function ensureLocalEngine(fromC, toC) {
  if (app._engineReady) return true;
  if (_localEngineLoading) return _localEngineLoading;
  // First route in a region downloads the ~6 MB graph — tell the user what
  // the wait is, instead of sitting on a static "Routing…".
  showStatus('Downloading map data…', 'info');
  setSplashText('Downloading map data…');
  _localEngineLoading = (async () => {
    try {
      const g = await loadGraph(fromC[0], fromC[1], (payload) => {
        // Backward-compat: string stage OR {loaded,total,stage} object.
        if (typeof payload === 'string') {
          if (payload === 'parse') {
            showStatus('Building route network…', 'info');
            setSplashText('Building route network…');
          }
          return;
        }
        if (payload.stage === 'parse') {
          showStatus('Building route network…', 'info');
          setSplashText('Building route network…');
        } else if (payload.stage === 'download' && payload.total > 0) {
          const got = (payload.loaded / 1048576).toFixed(1);
          const tot = (payload.total / 1048576).toFixed(1);
          showStatus(`Downloading map data… (${got} MB / ${tot} MB)`, 'info');
          setSplashText(`Downloading map data… (${got} MB / ${tot} MB)`);
        } else if (payload.stage === 'download') {
          showStatus('Downloading map data…', 'info');
          setSplashText('Downloading map data…');
        }
      });
      app._engineReady = true;
      window.__ghostwayEngine = 'ready';
      // Live traffic for the loaded region (UDOT for Wasatch, WZDx elsewhere).
      // Fire-and-forget: the UDOT spatial query can take 5-10 s (and retries up
      // to ~65 s when ArcGIS 504s), and awaiting it here would hold the FIRST
      // route hostage. Route renders on free-flow speeds now; incidents layer
      // in when they arrive. Skip if boot preload already fetched it.
      if (!app.traffic && !app._trafficLoading) {
        app._trafficLoading = true;
        loadTraffic(g.bbox).then((traffic) => {
          app.traffic = traffic;
          if (traffic.ok && traffic.events.length) {
            app.map.setIncidents(traffic.events);
            enginePill(`${icon('shield', { size: 13 })} Local engine ready · ${icon('warning', { size: 13 })} ${traffic.events.length} live traffic events`);
          } else {
            enginePill(`${icon('shield', { size: 13 })} Local camera-aware engine ready`);
          }
          window.__ghostwayTraffic = traffic.ok ? traffic.events.length : 'failed';
        }).catch((e) => {
          console.warn('traffic load failed', e);
          window.__ghostwayTraffic = 'failed';
        }).finally(() => { app._trafficLoading = false; });
      }
      return true;
    } catch (e) {
      console.warn('local engine load failed', e);
      app._engineReady = false;
      window.__ghostwayEngine = 'failed';
      return false;
    }
  })();
  return _localEngineLoading;
}

function enginePill(msg) {
  const s = $('#engineStatus');
  if (!s) return;
  // msg may contain inline SVG icons built by our own icon() helper — render
  // as markup, not literal text. Content is app-generated (never user input),
  // so innerHTML is safe here.
  s.innerHTML = msg;
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
  document.addEventListener('keydown', trapModalFocus);

  $('#gpsBtn').addEventListener('click', useMyLocation);
  $('#recenterBtn').addEventListener('click', () => setFollow(true));
  $('#zoomInBtn').addEventListener('click', () => app.map.zoomIn());
  $('#zoomOutBtn').addEventListener('click', () => app.map.zoomOut());
  // Compass (Maps parity): round-77's custom zoom control replaced the native
  // NavigationControl, which also carried the compass — leaving a rotated or
  // pitched map (two-finger twist, follow mode) with NO way back to north-up.
  // The button appears only when the camera is off-north/off-flat; its needle
  // always points true north; tapping resets north-up + flat (and pauses
  // follow mode so the next GPS tick doesn't instantly re-rotate).
  const compassBtn = $('#compassBtn');
  const compassIc = compassBtn.querySelector('.ic');
  const updateCompass = () => {
    const bearing = app.map.getBearing();
    const pitch = app.map.getPitch();
    compassBtn.hidden = Math.abs(bearing) < 2 && pitch < 2;
    compassIc.style.transform = `rotate(${-bearing}deg)`;
  };
  compassBtn.addEventListener('click', () => {
    if (app._followActive) setFollow(false);
    app.map.resetNorth();
  });
  app.map.onCameraChange(updateCompass);
  updateCompass();
  // Tap the banner (anywhere but its buttons) to open the full turn-by-turn list.
  $('#navBanner').addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    openSteps();
  });
  const stepsClose = $('#stepsClose');
  if (stepsClose) stepsClose.addEventListener('click', closeSteps);
  const stepsScrim = $('#stepsScrim');
  if (stepsScrim) stepsScrim.addEventListener('click', closeSteps);
  // Standard nav behavior: if the user pans/rotates during navigation, pause
  // follow mode and show the recenter button.
  app.map.onUserPan(() => {
    if (app.state.navigating && app._followActive) setFollow(false);
  });
  $('#camLayerBtn').addEventListener('click', () => {
    app._camLayerOn = !(app._camLayerOn ?? true);
    app.map.setCameraLayerVisible(app._camLayerOn);
    $('#camLayerBtn').classList.toggle('off', !app._camLayerOn);
  });

  // Maps-parity basemap switcher (light/dark). Same open provider — no new
  // third-party dependency. Preference persists in localStorage.
  $('#basemapBtn').addEventListener('click', () => {
    const next = app.map.getBasemap() === 'dark' ? 'standard' : 'dark';
    app.map.setBasemap(next);
    localStorage.setItem('gw-basemap', next);
    const btn = $('#basemapBtn');
    btn.classList.toggle('on', next === 'dark');
    btn.setAttribute('aria-pressed', String(next === 'dark'));
  });

  // Maps-parity distance units (miles / kilometres). Flips the persisted
  // pref and re-skins every distance in the current route card (the nav
  // banner picks it up on the next GPS tick via fmtNavDistance).
  const unitsBtn = $('#unitsBtn');
  if (unitsBtn) {
    unitsBtn.addEventListener('click', () => {
      const next = getUnits() === 'mi' ? 'km' : 'mi';
      setUnits(next);
      unitsBtn.textContent = next;
      unitsBtn.setAttribute('aria-pressed', String(next === 'mi'));
      haptic();
      if (app.state && app.state.route) renderRouteCard(app, app.state.route);
    });
  }

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
  document.querySelectorAll('.mode-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.mode === mode);
    b.setAttribute('aria-pressed', b.dataset.mode === mode ? 'true' : 'false');
  });
}

function setEndpoints(from, to) {
  app.state.from = from;
  app.state.to = to;
  $('#route-actions').hidden = false;
  $('#avoid-toggle').hidden = false;
  if (from) $('#fromInput').value = from.label || '';
  if (to) $('#toInput').value = to.label || '';
}

// ---- My-location: instant first fix, progressive refinement ----
// The old flow blocked the UI on a cold high-accuracy GPS fix (~3 s) AND on
// the reverse-geocode network call before showing anything. Now:
//   1. instant fix from session/persisted last-known position (0 ms),
//   2. fast low-accuracy fix (cached/network, ≤30 s old accepted),
//   3. high-accuracy GPS refines in the background — never blocks,
//   4. reverse-geocode fills the label async; "My location" shows at once.
const LOC_KEY = '***';

function cachedLoc(maxAgeMs = 24 * 3600 * 1000) {
  try {
    const raw = localStorage.getItem(LOC_KEY);
    if (!raw) return null;
    const { lon, lat, t } = JSON.parse(raw);
    if (typeof lon !== 'number' || typeof lat !== 'number' || !t) return null;
    if (Date.now() - t > maxAgeMs) return null;
    return [lon, lat];
  } catch {
    return null;
  }
}

function saveLoc(coords) {
  try {
    localStorage.setItem(LOC_KEY, JSON.stringify({ lon: coords[0], lat: coords[1], t: Date.now() }));
  } catch { /* private mode etc. */ }
}

function distM(a, b) {
  const latm = ((a[1] + b[1]) / 2) * Math.PI / 180;
  const dx = (b[0] - a[0]) * 111320 * Math.cos(latm);
  const dy = (b[1] - a[1]) * 111320;
  return Math.hypot(dx, dy);
}

function applyMyLocation(coords) {
  app.state.userLoc = coords;
  saveLoc(coords);
  setEndpoints({ coords, label: 'My location', isMyLoc: true }, app.state.to);
  app.map.flyTo(coords, 14);
  clearStatus();
  // Label arrives async — never block the route on it.
  reverseGeocode(coords)
    .then((l) => {
      if (l && app.state.from && app.state.from.isMyLoc) {
        app.state.from.label = l;
        const inp = $('#fromInput');
        if (inp && !inp.value.trim()) inp.value = l;
        else if (inp && inp.value === 'My location') inp.value = l;
      }
    })
    .catch(() => {});
  maybeAutoRoute();
}

function onLocationFix(coords) {
  const prev = app.state.userLoc;
  if (!prev) {
    applyMyLocation(coords);
    return;
  }
  const moved = distM(prev, coords);
  if (moved < 25) return; // GPS jitter guard
  app.state.userLoc = coords;
  saveLoc(coords);
  if (moved > 200) app.map.flyTo(coords, 14); // stale cache corrected far away
  if (app.state.from && app.state.from.isMyLoc) {
    app.state.from.coords = coords;
    if (!app.state.navigating && moved > 40) maybeAutoRoute();
  }
  // Live ETA without active navigation (Keaton report 2026-08-27): after a
  // route exists, keep the distance/ETA readout current as the user drives —
  // without forcing a re-route. Throttled: only recompute after ≥100 m of
  // movement AND ≥30 s since the last update.
  if (!app.state.navigating && app.state.route && app.state.to) {
    const now = Date.now();
    app._etaState = app._etaState || { lastPos: coords, lastT: 0 };
    const st = app._etaState;
    const sinceMove = distM(st.lastPos || coords, coords);
    if (sinceMove >= 100 && now - st.lastT >= 30000) {
      st.lastPos = coords; st.lastT = now;
      updateLiveEta(coords);
    }
  }
}

// Recompute a lightweight time estimate from the current position to the
// destination and refresh the route card headline — no full re-route.
async function updateLiveEta(fromC) {
  try {
    const to = app.state.to;
    if (!to || !to.coords) return;
    // Prefer the local engine (same data the route was built from); fail soft.
    const { options } = await planRoutes(fromC, to.coords, { traffic: app.traffic || null, communityCams: communityCams() });
    const pick = pickOptionForMode(options);
    const o = options[pick];
    if (!o) return;
    // Update the stored route so re-renders (units toggle etc.) stay current.
    app.state.options = options;
    app.state.chosen = pick;
    app.state.route = { engine: true, options, chosen: pick };
    if (!app.state.navigating) renderRouteCard(app, app.state.route);
  } catch { /* ETA update is best-effort; never disrupt the UI */ }
}

async function useMyLocation() {
  if (!navigator.geolocation) {
    showStatus('Geolocation not available in this browser.', 'warn');
    return;
  }
  // 1) Instant first fix from last known position (this session or persisted).
  const instant = app.state.userLoc || cachedLoc();
  if (instant) {
    applyMyLocation(instant);
  } else {
    showStatus('Locating…', 'info');
  }
  // 2) Fast fix: accept a cached/network position up to 30 s old, 4 s timeout.
  navigator.geolocation.getCurrentPosition(
    (pos) => onLocationFix([pos.coords.longitude, pos.coords.latitude]),
    () => {}, // stage 3 gets the final word on errors
    { enableHighAccuracy: false, maximumAge: 30000, timeout: 4000 }
  );
  // 3) High-accuracy GPS refine — runs in the background, never blocks the UI.
  navigator.geolocation.getCurrentPosition(
    (pos) => onLocationFix([pos.coords.longitude, pos.coords.latitude]),
    (err) => {
      if (!app.state.userLoc) showStatus('Could not get location: ' + err.message, 'warn');
    },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 }
  );
}

function maybeAutoRoute() {
  if (app.state.from && app.state.to) onRoute();
}

function engineCovers(fromC, toC) {
  // Local engine is available for a corridor once it's loaded, OR (cheaper) we
  // can decide up-front using the configured coverage box — no download needed
  // to know *whether* the on-device graph would apply. The actual graph bytes
  // load lazily inside routeWithFallbacks before we call planRoutes().
  return regionCovers(fromC[0], fromC[1]) && regionCovers(toC[0], toC[1]);
}

// Community-reported cameras feed the local routing engine immediately.
function communityCams() {
  return loadReports().map((r) => ({ lon: r.lon, lat: r.lat, kind: r.kind }));
}

// Hard road closures near a corridor from the national WZDx snapshot
// (iteration 17 — nationwide traffic). Fails soft to [].
async function nationalClosures(fromC, toC) {
  try {
    const buf = 0.03;
    const bbox = [
      Math.min(fromC[0], toC[0]) - buf, Math.min(fromC[1], toC[1]) - buf,
      Math.max(fromC[0], toC[0]) + buf, Math.max(fromC[1], toC[1]) + buf,
    ];
    const wz = await loadNationalWzdx(bbox);
    if (!wz.ok) return [];
    return closurePointsNear(wz.zones, bbox, 20);
  } catch {
    return [];
  }
}

function pickOptionForMode(options) {
  // Honor the user's selected mode — the picker at search time IS the choice,
  // and the route card shows that mode's route (Keaton: "why choose a setting
  // if I scroll to choose the setting again?"). No cross-mode scoring.
  const byMode = { strict: 'strict', moderate: 'moderate', off: 'off' }[app.state.mode] || 'moderate';
  const i = options.findIndex((o) => o.mode === byMode);
  if (i !== -1) return i;
  // Requested mode unavailable (e.g. walled/budget fallback): prefer the
  // camera-avoiding option over Fastest so avoidance intent is preserved.
  const alt = options.findIndex((o) => o.mode !== 'off');
  return alt === -1 ? 0 : alt;
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
  setGoLoading(true);
  try {
    await routeWithFallbacks(from, to);
  } finally {
    setGoLoading(false);
  }
}

// Visual loading state on the Route button so taps feel acknowledged.
// F2: For long waits (>3s), add a subtle progress indicator to the button text
// so the user knows the wait is expected (Nielsen / Harrison: known duration calms).
function setGoLoading(on) {
  const btn = $('#goBtn');
  if (!btn) return;
  btn.classList.toggle('loading', on);
  btn.disabled = on;
  if (on) {
    btn.dataset.label = btn.textContent;
    btn.textContent = 'Routing…';
    clearTimeout(btn._progressTimer);
    btn._progressTimer = setTimeout(() => {
      if (btn.disabled) btn.textContent = 'Routing… (almost there)';
    }, 3000);
    btn._progressTimer2 = setTimeout(() => {
      if (btn.disabled) btn.textContent = 'Routing… (this route takes longer)';
    }, 10000);
  } else {
    clearTimeout(btn._progressTimer);
    clearTimeout(btn._progressTimer2);
    btn.textContent = btn.dataset.label || 'Route me clear';
  }
}

async function routeWithFallbacks(from, to) {
  // --- Ghostway's own camera-aware engine (in coverage) ---
  if (engineCovers(from.coords, to.coords)) {
    // Lazy-load the on-device graph for this region (no-op if already loaded).
    const ok = await ensureLocalEngine(from.coords, to.coords);
    if (ok) {
      // Disconnected graph components (a known data gap) can't be routed locally.
      // Detect it up front and fall back to Valhalla cleanly instead of throwing
      // 'No route found' and relying on the catch.
      if (!endpointsConnected(from.coords, to.coords)) {
        console.warn('local graph endpoints in different components — falling back to Valhalla');
      } else {
      try {
        const t0 = performance.now();
        const { options } = await planRoutes(from.coords, to.coords, { traffic: app.traffic || null, communityCams: communityCams() });
        const ms = Math.round(performance.now() - t0);
        app.state.options = options;
        // Default pick: closest to the user's mode preference.
        const chosen = pickOptionForMode(options);
        app.state.chosen = chosen;
        app.state.route = { engine: true, options, chosen };
        drawEngineRoutes();
        renderRouteCard(app, app.state.route);
        clearStatus();
        enginePill(`${icon('shield', { size: 13 })} Local engine · ${ms} ms · ${options.length} option${options.length > 1 ? 's' : ''}`);
        window.__ghostwayDebug = { routed: true, engine: true, options: options.length, ms };
        return;
      } catch (e) {
        console.warn('engine route failed, falling back', e);
      }
      }
    }
    // Engine unavailable or failed → fall through to Valhalla below.
  }

  // --- Valhalla fallback: national coverage + camera avoidance via
  //     exclude_locations (same options UX as the own engine). ---
  try {
    const t0 = performance.now();
    const mode = app.state.avoid ? (app.state.mode || 'moderate') : 'off';
    const closures = await nationalClosures(from.coords, to.coords);
    const { options } = await valhallaPlanRoutes(from.coords, to.coords, app.cameras, { mode, closures });
    const ms = Math.round(performance.now() - t0);
    app.state.options = options;
    const chosen = pickOptionForMode(options);
    app.state.chosen = chosen;
    app.state.route = { engine: true, source: 'valhalla', options, chosen };
    drawEngineRoutes();
    renderRouteCard(app, app.state.route);
    clearStatus();
    enginePill(`${icon('layers', { size: 13 })} Valhalla engine · ${ms} ms · ${options.length} option${options.length > 1 ? 's' : ''}`);
    window.__ghostwayDebug = { routed: true, engine: 'valhalla', options: options.length, ms };
    return;
  } catch (e) {
    console.warn('valhalla route failed, falling back to legacy', e);
  }

  // --- Legacy fallback (BRouter + OSRM; flaky but works everywhere) ---
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
    // F3: Recovery path, not a dead end. Explain what happened and offer
    // a clear next step so the user isn't left guessing (NN/g error recovery).
    showStatusWithRetry(
      'Routing failed — check your start and destination, or try a different route.',
      'warn',
      () => {
        clearStatus();
        onRoute();
      }
    );
  }
}

function selectOption(i) {
  if (!app.state.options[i]) return;
  app.state.chosen = i;
  // Keep the route object's chosen index in sync too — renderEngineCard reads
  // result.chosen, so without this the card re-renders with the OLD selection
  // (map line updates, card aria-pressed/.chosen don't). Round-81 fix.
  if (app.state.route?.engine) app.state.route.chosen = i;
  drawEngineRoutes();
  renderRouteCard(app, app.state.route);
}

function drawEngineRoutes() {
  const { options, chosen } = app.state;
  // Distinct colors per option so the user can tell the alternatives apart on
  // the map and pick by sight (not just by the card). Chosen stays Ghostway-teal.
  const ALT_COLORS = ['#f4a259', '#9b8cff', '#5b6b80', '#e0c341'];
  const feats = [];
  let altIdx = 0;
  options.forEach((o, i) => {
    if (i === chosen) return;
    // optIndex lets a tap on the map line select this alternative.
    feats.push({
      type: 'Feature',
      properties: { color: ALT_COLORS[altIdx % ALT_COLORS.length], optIndex: i },
      geometry: { type: 'LineString', coordinates: o.coords },
    });
    altIdx++;
  });
  const sel = options[chosen];
  feats.push({
    type: 'Feature',
    properties: { color: '#3ad6c5', optIndex: chosen },
    geometry: { type: 'LineString', coordinates: sel.coords },
  });
  app.map.setRoute(feats);
  app.map.setEndpoints([
    { type: 'Feature', properties: { color: '#3ad6c5' }, geometry: { type: 'Point', coordinates: sel.coords[0] } },
    { type: 'Feature', properties: { color: '#ff4d6d' }, geometry: { type: 'Point', coordinates: sel.coords[sel.coords.length - 1] } },
  ]);
  app.map.fitTo(sel.coords, true);

  // Nav bookkeeping for the chosen option. IMPORTANT: steps carry cumulative
  // distances measured on the RAW arc path, so the progress tracker must also
  // use the raw coordinates (not the simplified render geometry) — otherwise
  // step advancement never fires.
  app._navSteps = (sel.instructions || []).map((s) => ({ ...s, startS: s.at || 0 }));
  const rawCoords = sel.route ? sel.route.coords : sel.coords;
  app._navRouteCoords = rawCoords;
  app._routeCum = cumulativeDistances(rawCoords);
  app._routeTotal = app._routeCum[app._routeCum.length - 1] || sel.distance;
  app._totalDuration = sel.duration;
  app._camPts = sel.cameraPoints || [];
  window.__ghostwayNavCoords = rawCoords;
  window.__ghostwayDebug = { ...(window.__ghostwayDebug || {}), navCoords: sel.coords.length };
}

async function resolveInput(id) {
  const v = $('#' + id).value.trim();
  if (!v) return null;
  // Location-biased resolution: without `near`, committing bare "Costco"
  // resolved to the global top hit (Tulsa!) — field report #7. Bias to the
  // user's position, falling back to the map center.
  const near = app.state.userLoc || (app.map ? app.map.getCenter() : null);
  const places = await searchPlaces(v, 8, near).catch(() => []);
  if (!places.length) return { coords: null, label: v };

  // Large-area POIs (airports, campuses, golf courses) resolve to a centroid
  // that snaps to an arbitrary — often dead-end — street (field report #8: the
  // app drove toward the airport interior instead of the terminal). Because
  // results are distance-sorted, the area POI may not be the top hit (a
  // nearby hotel can rank above it), so scan ALL results for a matching area
  // POI, then route to its entrance/terminal instead of its centroid.
  const area = places.find((r) => isAreaPoi(r) && nameMatchesQuery(r.name, v)) || (isAreaPoi(places[0]) ? places[0] : null);
  if (area) {
    let entrance = findEntrance(places, area);
    if (!entrance) {
      const more = await searchPlaces(area.name + ' terminal', 6, near).catch(() => []);
      entrance = findEntrance([...places, ...more], area);
    }
    if (entrance) return { coords: entrance.coords, label: area.name };
  }
  const p = places[0];
  return { coords: p.coords, label: p.name };
}

function nameMatchesQuery(name, q) {
  if (!name) return false;
  const n = name.toLowerCase();
  // Every meaningful query token should appear in the POI name.
  const tokens = q.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  if (!tokens.length) return true;
  return tokens.every((t) => n.includes(t));
}

function isAreaPoi(place) {
  const p = place.raw || {};
  return p.osm_value === 'aerodrome' || p.osm_value === 'campus' || p.osm_value === 'golf_course';
}

function findEntrance(results, area) {
  if (!results || !results.length) return null;
  const areaC = area.coords;
  let best = null, bestRank = 99, bestD = Infinity;
  for (const r of results) {
    if (r === area) continue;
    const rp = r.raw || {};
    // Skip lodging/food that merely has the airport in its name.
    if (/hotel|inn|suites|motel|lodging/i.test((rp.osm_key || '') + ' ' + (rp.osm_value || ''))) continue;
    let rank = 99;
    if (rp.osm_key === 'aeroway' && rp.osm_value === 'terminal') rank = 0;
    else if (rp.osm_value === 'entrance' || rp.osm_value === 'gate') rank = 1;
    else if (rp.osm_value === 'parking') rank = 2;
    else if (/terminal|departure|arrival/i.test(r.name || '') && rp.osm_key === 'aeroway') rank = 3;
    else if (rp.osm_key === 'building') rank = 6;
    if (rank > 6) continue;
    const d = haversine(areaC, r.coords);
    if (d < 8000 && (rank < bestRank || (rank === bestRank && d < bestD))) {
      bestRank = rank; bestD = d; best = r;
    }
  }
  return best;
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
  app._camPts = []; // legacy engine has no per-cluster positions
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
  app._navStart = Date.now();
  app._navLastPos = null;
  app._navLastT = 0;
  app._navSpeed = null; // m/s, smoothed
  app._voiceAnnounced = {}; // step index -> announced

  // Hide the planning panel, show the nav banner.
  $('#panel').hidden = true;
  showNavBanner();
  setFollow(true);

  const first = app._navSteps[0];
  if (first) {
    const msg = phraseManeuver(first.distance, first.instruction, first.name);
    speak(msg, { interrupt: true });
    announceNav(msg);
  }

  // Follow the user with GPS.
  if (navigator.geolocation) {
    app.state.gpsWatch = navigator.geolocation.watchPosition(
      (pos) => {
        const c = [pos.coords.longitude, pos.coords.latitude];
        app.state.userLoc = c;
        updateSpeed(pos);
        app.state.heading = updateHeading(pos, c);
        if (app._followActive) {
          app.map.followUser(c, app.state.heading);
        } else {
          app.map.setUserPosition(c, app.state.heading);
        }
        advanceStep(c);
        checkOffRoute(c);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 2000 }
    );
  }
}

// Heading: prefer GPS heading while moving; hold the last stable heading when
// stopped or crawling (GPS jitter at a stop made the follow camera spin);
// derive from displacement only when the device actually moved ~8 m.
function updateHeading(pos, coords) {
  const speed = pos.coords.speed; // m/s, may be null
  const h = pos.coords.heading;

  // Stopped / crawling: keep the last stable heading, never spin.
  if (speed != null && speed < 1.2) {
    app._lastHeadingPos = coords;
    return app.state.heading || 0;
  }

  let candidate = null;
  if (h != null && !isNaN(h) && (speed == null || speed > 2)) {
    candidate = h;
  } else {
    const anchor = app._headingAnchor || coords;
    const latm = ((anchor[1] + coords[1]) / 2) * Math.PI / 180;
    const dx = (coords[0] - anchor[0]) * 111320 * Math.cos(latm);
    const dy = (coords[1] - anchor[1]) * 111320;
    const dist = Math.hypot(dx, dy);
    if (dist > 8) {
      candidate = ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
      app._headingAnchor = coords;
    }
  }
  app._lastHeadingPos = coords;
  if (candidate == null) return app.state.heading || 0;

  // Shortest-path smoothing so bearing changes animate, never snap/spin.
  const prev = app.state.heading;
  if (prev == null) return candidate;
  let d = candidate - prev;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return (prev + d * 0.45 + 360) % 360;
}

function setFollow(on) {
  app._followActive = on;
  $('#recenterBtn').hidden = on || !app.state.navigating;
  if (on) app._lastHeadingPos = null;
}

function updateSpeed(pos) {
  const now = Date.now();
  let spd = pos.coords.speed; // m/s from GPS, may be null
  if (spd == null && app._navLastPos) {
    const dt = (now - app._navLastT) / 1000;
    if (dt > 0.5) spd = haversine(app._navLastPos, [pos.coords.longitude, pos.coords.latitude]) / dt;
  }
  if (spd != null) {
    // exponential smoothing
    app._navSpeed = app._navSpeed == null ? spd : app._navSpeed * 0.6 + spd * 0.4;
  }
  app._navLastPos = [pos.coords.longitude, pos.coords.latitude];
  app._navLastT = now;
  const chip = $('#speedChip');
  if (chip) {
    // C12 #126: speed chip is over-speed-only during nav. While moving under
    // the limit the driver has no business looking at it. checkOverSpeed()
    // sets the `.over` class; visibility tracks that, NOT just speed presence.
    const over = checkOverSpeed();
    chip.textContent = fmtSpeed(app._navSpeed);
    chip.hidden = app._navSpeed == null || !over;
  }
}

// Over-speed alert (Workstream C): compare smoothed GPS speed against the
// current step's posted limit. Visual: red chip. Voice: at most once/minute.
// Returns true when the driver is over the limit so callers can gate visibility
// (C12 #126: speed chip renders ONLY in this state).
function checkOverSpeed() {
  const chip = $('#speedChip');
  if (!chip || !app.state.navigating || app._navSpeed == null) return false;
  const steps = app._navSteps || [];
  const step = steps[Math.min(app.state.stepIndex, steps.length - 1)];
  const limitKmh = step && step.speedLimit;
  if (!limitKmh) {
    chip.classList.remove('over');
    return false;
  }
  const speedKmh = app._navSpeed * 3.6;
  const over = speedKmh > limitKmh + 8; // tolerance ~5 mph
  chip.classList.toggle('over', over);
  const now = Date.now();
  if (over && (!app._lastOverVoice || now - app._lastOverVoice > 60000)) {
    app._lastOverVoice = now;
    // Voice + chip follow the persisted units pref (round-75 toggle).
    const msg = getUnits() === 'mi'
      ? `You're over the ${Math.round(limitKmh * 0.621371 / 5) * 5} mile per hour limit.`
      : `You're over the ${Math.round(limitKmh / 5) * 5} kilometer per hour limit.`;
    speak(msg);
    announceNav(msg);
  }
  if (!over) app._lastOverVoice = 0;
}

function stopNav(arrived = false) {
  app.state.navigating = false;
  cancelVoice();
  setFollow(false);
  app.map.unfollow();
  if (app.state.gpsWatch) {
    navigator.geolocation.clearWatch(app.state.gpsWatch);
    app.state.gpsWatch = null;
  }
  $('#navBanner').hidden = true;
  $('#panel').hidden = false;
  if (arrived) {
    showArrivalScreen();
  } else {
    const sel = app.state.route?.engine ? app.state.options[app.state.chosen] : null;
    const fit = sel ? sel.coords : [app.state.from?.coords, app.state.to?.coords].filter(Boolean);
    app.map.fitTo(fit, true);
  }
}

function showArrivalScreen() {
  const sel = app.state.route?.engine ? app.state.options[app.state.chosen] : app.state.route?.clear || app.state.route?.baseline;
  const elapsed = app._navStart ? Math.round((Date.now() - app._navStart) / 1000) : 0;
  // Prefer the LIVE tracked count (what the drive actually passed) over the
  // planned estimate — the chip updates it continuously during navigation.
  const cams = app._camPassed != null ? app._camPassed : sel ? (sel.cameras ?? 0) : 0;
  openModal(`
    <h3>🏁 You've arrived</h3>
    <p class="arrival-cams">${
      cams === 0
        ? '<b>Zero cameras passed.</b> You moved through without a single plate read.'
        : `You passed <b>${cams}</b> camera${cams === 1 ? '' : 's'} on this trip.`
    }</p>
    <ul class="src-list">
      ${sel ? `<li><b>Distance:</b> ${fmtDistance(sel.distance)}</li>` : ''}
      ${sel ? `<li><b>Estimated:</b> ${fmtDuration(sel.duration)}</li>` : ''}
      ${elapsed ? `<li><b>Driving time:</b> ${fmtDuration(elapsed)}</li>` : ''}
    </ul>
    <p class="muted small">Ghostway never logged your route. Safe travels.</p>
  `);
}

// Off-route detection: if the user is far from the line for a while, re-route
// from their current position to the destination through the same engine.
function checkOffRoute(userC) {
  const coords = app._navRouteCoords;
  if (!coords || coords.length < 2) return;
  let best = Infinity;
  for (let i = 1; i < coords.length; i++) {
    const d = pointToSegmentM(userC, coords[i - 1], coords[i]);
    if (d < best) best = d;
  }
  const now = Date.now();
  if (best > 120) {
    if (!app._offSince) app._offSince = now;
    if (now - app._offSince > 6000 && !app._rerouting) {
      app._rerouting = true;
      speak('Rerouting.', { interrupt: true });
      announceNav('Rerouting.');
      reRoute(userC);
    }
  } else {
    app._offSince = 0;
  }
}

async function reRoute(fromC) {
  const to = app.state.to;
  if (!to) {
    app._rerouting = false;
    return;
  }
  try {
    if (engineCovers(fromC, to.coords) && (await ensureLocalEngine(fromC, to.coords))) {
      const { options } = await planRoutes(fromC, to.coords, { traffic: app.traffic || null, communityCams: communityCams() });
      app.state.options = options;
      app.state.chosen = pickOptionForMode(options);
      app.state.route = { engine: true, options, chosen: app.state.chosen };
      drawEngineRoutes();
    } else {
      // Outside own-graph coverage: try Valhalla (national + camera avoidance),
      // then the legacy BRouter/OSRM path.
      let done = false;
      try {
        const mode = app.state.avoid ? (app.state.mode || 'moderate') : 'off';
        const closures = await nationalClosures(fromC, to.coords);
        const { options } = await valhallaPlanRoutes(fromC, to.coords, app.cameras, { mode, closures });
        app.state.options = options;
        app.state.chosen = pickOptionForMode(options);
        app.state.route = { engine: true, source: 'valhalla', options, chosen: app.state.chosen };
        drawEngineRoutes();
        done = true;
      } catch (ve) {
        console.warn('reroute valhalla failed', ve);
      }
      if (!done) {
        const result = await planRoute(fromC, to.coords, { avoid: app.state.avoid, cameraStore: app.cameras });
        app.state.route = result;
        drawRoute(result);
      }
    }
    app.state.stepIndex = 0;
    app._voiceAnnounced = {};
    showNavBanner();
    renderNavStep();
  } catch (e) {
    console.warn('reroute failed', e);
  } finally {
    app._rerouting = false;
    app._offSince = 0;
  }
}

function advanceStep(userC) {
  const steps = app._navSteps || [];
  if (!steps.length || !app.state.navigating) return;
  const frac = routeFraction(userC);
  const traveled = frac * (app._routeTotal || 1);

  // Arrival: within 40m of the route end and past 97% of the route.
  if (traveled > app._routeTotal - 40 && frac > 0.97) {
    const msg = phraseArrival();
    speak(msg, { interrupt: true });
    announceNav(msg);
    haptic();
    stopNav(true);
    return;
  }

  // Steps carry cumulative start distances (meters). The "current" step is the
  // one the user is driving; the banner shows the distance to its maneuver.
  let idx = 0;
  for (let i = 0; i < steps.length; i++) {
    if ((steps[i].startS || 0) <= traveled + 15) idx = i;
  }

  if (idx !== app.state.stepIndex) {
    app.state.stepIndex = idx;
    haptic();
    renderNavStep();
    if (!$('#stepsSheet') || !$('#stepsSheet').hidden) renderStepsList();
    // Announce the new maneuver ahead.
    const s = steps[idx];
    if (s && idx > 0 && !app._voiceAnnounced[idx]) {
      app._voiceAnnounced[idx] = 1;
      const distToManeuver = Math.max(0, (s.startS || 0) - traveled + s.distance);
      const msg = phraseManeuver(distToManeuver, s.instruction, s.name);
      speak(msg);
      announceNav(msg);
    }
  } else {
    // Same step — refresh the countdown display.
    updateCountdown(traveled);
    // Distance-triggered callout at ~200m before the step's maneuver.
    const s = steps[idx];
    if (s && idx > 0 && !app._voiceAnnounced[idx + '_near']) {
      const distToManeuver = (steps[idx + 1]?.startS ?? app._routeTotal) - traveled;
      if (distToManeuver <= 220) {
        app._voiceAnnounced[idx + '_near'] = 1;
        const msg = phraseManeuver(Math.max(30, distToManeuver), s.instruction, s.name);
        speak(msg);
        announceNav(msg);
      }
    }
    // Camera-ahead warning from route camera clusters — the same positions the
    // 📷 counter chip uses (iteration 19: the old step-based check missed
    // cameras inside the CURRENT step, so some passes went unannounced).
    const camPts = app._camPts || [];
    for (const c of camPts) {
      if (app._voiceAnnounced['camPt' + c.at]) continue;
      const distToCam = c.at - traveled;
      if (distToCam > 0 && distToCam <= 250) {
        app._voiceAnnounced['camPt' + c.at] = 1;
        const msg = 'Camera ahead. You will pass it in about 200 meters.';
        speak(msg);
        announceNav(msg);
        haptic();
        break;
      }
    }
  }
}

function updateCountdown(traveled) {
  const steps = app._navSteps || [];
  const idx = Math.min(app.state.stepIndex, steps.length - 1);
  const next = steps[idx + 1];
  const el = $('#navDist');
  if (!el) return;
  if (next) {
    el.textContent = fmtNavDistance(Math.max(0, next.startS - traveled));
  } else {
    el.textContent = fmtNavDistance(Math.max(0, (app._routeTotal || 0) - traveled));
  }
  updateProgress(traveled);
  updateEta(traveled);
  updateCamChip(traveled);
  updateApproach(traveled);
}

// Visual maneuver-proximity emphasis (Maps parity): within ~220 m of the next
// maneuver — the same threshold as the voice callout — the banner switches to
// an urgent state so the upcoming turn is unmissable at a glance.
function updateApproach(traveled) {
  const banner = $('#navBanner');
  const steps = app._navSteps || [];
  if (!banner || !steps.length) return;
  const idx = Math.min(app.state.stepIndex, steps.length - 1);
  const next = steps[idx + 1];
  const d = next ? next.startS - traveled : (app._routeTotal || 0) - traveled;
  banner.classList.toggle('approach', d <= 220);
}

// Keep the banner ETA live: renderNavStep only re-runs on step changes, so a
// long step would otherwise show a stale remaining time (Maps parity).
// Screen-reader mirror of voice guidance: maneuver/reroute/arrival/camera
// announcements go through speechSynthesis only, so SR users (or anyone with
// voice toggled off) get NOTHING. Write them to a visually-hidden aria-live
// region too — one control point for all nav announcements.
function announceNav(text) {
  const el = $('#navLive');
  if (!el || !text) return;
  el.textContent = '';
  // Clear-then-set on the next frame so identical back-to-back phrases
  // re-announce instead of being swallowed by the live region.
  requestAnimationFrame(() => { el.textContent = text; });
}
function updateEta(traveled) {
  // C12 #126: arrival clock removed from the active-nav banner — ETA is the
  // one time signal. The arrival clock still lives in the steps list / arrival
  // screen for users who want it.
  const etaEl = $('#navEta');
  if (!etaEl || !app._totalDuration) return;
  const frac = Math.min(1, Math.max(0, traveled / (app._routeTotal || 1)));
  const remain = app._totalDuration * (1 - frac);
  etaEl.textContent = fmtDuration(remain);
}

// Thin route-progress bar along the banner's bottom edge (Maps parity):
// fills left→right as the drive advances, so progress is visible at a glance.
function updateProgress(traveled) {
  const fill = $('#navProgressFill');
  if (!fill) return;
  const pct = Math.min(100, Math.max(0, (traveled / (app._routeTotal || 1)) * 100));
  fill.style.width = pct.toFixed(1) + '%';
}

// Live camera accounting during navigation: counts camera clusters already
// passed and flags the next one within 250 m as "ahead" (mission visibility).
// Camera chip = the mission signal (Workstream C12 #126). Three states:
//   - empty route (zero cameras): shieldCheck + "Clear" (green, prominent) —
//     this is the payoff, the whole reason Ghostway exists.
//   - camera ahead (≤250 m): warning + "Cam {d}" (amber, pulsing).
//   - passed some, none ahead: camera icon + "passed/total" (muted).
// In compact mode the chip is the ONLY data element in the side column; the
// speed chip demotes to over-speed-only and ETA is the only time signal.
function updateCamChip(traveled) {
  const chip = $('#camChip');
  const pts = app._camPts || [];
  if (!chip) return;
  if (!pts.length) {
    chip.innerHTML = `<span class="cam-clear-ic">${icon('shieldCheck', { size: 16 })}</span> Clear`;
    chip.classList.remove('ahead', 'passed');
    chip.classList.add('clear');
    chip.title = 'This route passes zero known cameras';
    app._camPassed = 0;
    return;
  }
  let passed = 0;
  let nextCam = null;
  for (const c of pts) {
    if (c.at <= traveled) passed++;
    else if (!nextCam) nextCam = c;
  }
  const ahead = nextCam && nextCam.at - traveled <= 250;
  const total = pts.length;
  chip.classList.remove('clear');
  if (ahead) {
    const d = fmtNavDistance(Math.max(0, nextCam.at - traveled));
    chip.innerHTML = `<span class="cam-ahead-ic">${icon('warning', { size: 16 })}</span> Cam ${d}`;
    chip.title = `Camera ${d} ahead · ${passed}/${total} passed on this route`;
  } else {
    chip.innerHTML = `${icon('camera', { size: 16 })} ${passed}/${total}`;
    chip.title = `${passed} of ${total} camera${total === 1 ? '' : 's'} passed on this route`;
  }
  chip.classList.toggle('ahead', !!ahead);
  chip.classList.toggle('passed', passed > 0 && !ahead);
  // Remember the live count so the arrival screen can report what ACTUALLY
  // happened, not just the planned estimate (mission honesty).
  app._camPassed = passed;
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
  const next = steps[i + 1];
  // Banner shows distance to the NEXT maneuver (what you're driving toward).
  const traveled = routeFraction(app.state.userLoc || [0, 0]) * (app._routeTotal || 1);
  const dist = next
    ? fmtNavDistance(Math.max(0, next.startS - traveled))
    : fmtNavDistance(Math.max(0, step.distance));
  const dir = next ? next.instruction : step.instruction;
  const road = next && next.name ? ` onto <b>${escHtml(next.name)}</b>` : next && step.name ? ` onto <b>${escHtml(step.name)}</b>` : '';
  const maneuverIcon = next ? stepIcon(next.modifier) : stepIcon(step.modifier);
  const eta = app._totalDuration ? fmtDuration(app._totalDuration * (1 - routeFraction(app.state.userLoc || [0, 0]))) : '';
  const voiceOn = voiceEnabled();
  const compact = app.state.compactBanner;
  // C12 #126: compact banner is the active-nav default (driver safety). It
  // strips the banner to 6 elements: stop / icon / distance+direction cluster /
  // voice / ETA / camera chip. The "then" preview, speed-limit badge, progress
  // bar, arrival clock, and density toggle are all demoted — they're either
  // available in the steps list (then / arrival) or in the planning panel
  // (density) where the user is stationary. Full mode is still reachable via
  // the toggle in the route card before nav starts.

  $('#navBanner').innerHTML = `
    <button id="navStop" class="nav-stop" aria-label="Stop navigation">${icon('close', { size: 18 })}</button>
    <div class="nav-icon" aria-hidden="true">${maneuverIcon}</div>
    <div class="nav-step">
      <div class="nav-dist" id="navDist">${dist}</div>
      <div class="nav-dir">${escHtml(dir)}${road}</div>
      ${!compact && next ? `<div class="nav-then">then ${stepIcon(step.modifier)} ${escHtml(lower(step.instruction))}${step.name ? ` · ${escHtml(step.name)}` : ''}</div>` : ''}
    </div>
    <div class="nav-side">
      <div class="nav-side-row">
        <button id="voiceBtn" class="nav-voice ${voiceOn ? 'on' : ''}" aria-label="Toggle voice" aria-pressed="${voiceOn}" title="Voice guidance">${icon(voiceOn ? 'volume' : 'volumeOff', { size: 16 })}</button>
      </div>
      <div id="speedChip" class="speed-chip" hidden></div>
      <div id="camChip" class="cam-chip mission-signal" title="Cameras passed / ahead on this route">${icon('shieldCheck', { size: 16 })} Clear</div>
      <div class="nav-eta" id="navEta">${eta}</div>
    </div>
    <div class="nav-progress" aria-hidden="true"><div class="nav-progress-fill" id="navProgressFill"></div></div>`;
  $('#navBanner').classList.toggle('compact', !!compact);
  $('#navStop').addEventListener('click', () => stopNav(false));
  $('#voiceBtn').addEventListener('click', () => {
    const on = toggleVoice();
    $('#voiceBtn').classList.toggle('on', on);
    $('#voiceBtn').setAttribute('aria-pressed', on ? 'true' : 'false');
    if (on) speak('Voice guidance on.');
  });
  // Initialize the camera chip + progress bar from the real progress, not a hardcoded 0.
  updateCamChip(traveled);
  updateProgress(traveled);
  updateApproach(traveled);
}

// Tap-the-banner turn-by-turn directions (Maps parity): a full list of every
// upcoming maneuver, so the driver can scan the whole route without voice.
// The banner click handler (wired once in wireApp, ignoring in-banner buttons)
// opens it; Escape / the close button / the scrim close it.
function renderStepsList() {
  const list = $('#stepsList');
  if (!list) return;
  const steps = app._navSteps || [];
  if (!steps.length) { list.innerHTML = ''; return; }
  const idx = app.state.stepIndex || 0;
  list.innerHTML = steps.map((s, i) => {
    const road = s.name ? ` onto <b>${escHtml(s.name)}</b>` : '';
    const distFmt = i === 0 ? '' : fmtNavDistance(s.startS || 0);
    return `<div class="steps-row ${i === idx ? 'current' : ''}" role="listitem">
      <div class="si" aria-hidden="true">${stepIcon(s.modifier)}</div>
      <div class="st"><div class="sd">${escHtml(s.instruction)}${road}</div>
      <div class="sroad">${i === 0 ? 'Start' : 'Step ' + i}</div></div>
      <div class="sdist">${distFmt}</div>
    </div>`;
  }).join('');
}
function openSteps() {
  const sheet = $('#stepsSheet');
  const scrim = $('#stepsScrim');
  if (!sheet || !app.state.navigating) return;
  renderStepsList();
  sheet.hidden = false;
  if (scrim) scrim.hidden = false;
  const c = $('#stepsClose');
  if (c) c.focus();
}
function closeSteps() {
  const sheet = $('#stepsSheet');
  const scrim = $('#stepsScrim');
  if (sheet) sheet.hidden = true;
  if (scrim) scrim.hidden = true;
}

function lower(s) {
  return (s || '').replace(/^./, (c) => c.toLowerCase());
}

function stepIcon(mod) {
  return stepIconSvg(mod, 20);
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
  app.state.waypoint = null;
  app.state.from = null;
  app.state.to = null;
  $('#fromInput').value = '';
  $('#toInput').value = '';
  $('#search').hidden = false;
  $('#route-actions').hidden = true;
  $('#avoid-toggle').hidden = true;
  $('#route-card').hidden = true;
  $('#panel').classList.remove('panel--expanded');
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
  const drawer = $('#drawer');
  const scrim = $('#scrim');
  // Play the exit animation, then hide. Respect reduced-motion (no anim).
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || drawer.hidden) {
    drawer.hidden = true;
    scrim.hidden = true;
    return;
  }
  drawer.classList.add('closing');
  scrim.classList.add('closing');
  let finished = false;
  const done = () => {
    if (finished) return;
    finished = true;
    drawer.hidden = true;
    scrim.hidden = true;
    drawer.classList.remove('closing');
    scrim.classList.remove('closing');
  };
  drawer.addEventListener('animationend', done, { once: true });
  // Safety: if animationend never fires, still hide.
  setTimeout(done, 260);
}
let modalReturnFocus = null;
// Focus trap: while the modal is open, Tab / Shift+Tab cycle within the
// dialog's focusable elements instead of escaping to the background page.
// aria-modal="true" is a hint; without a real trap, keyboard users can still
// tab out to controls behind the scrim.
function trapModalFocus(e) {
  const modal = $('#modal');
  if (modal.hidden || e.key !== 'Tab') return;
  const card = document.querySelector('.modal-card');
  if (!card) return;
  const sel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const list = Array.from(card.querySelectorAll(sel)).filter((el) => !el.hidden);
  if (list.length === 0) { e.preventDefault(); return; }
  const first = list[0];
  const last = list[list.length - 1];
  if (e.shiftKey) {
    if (document.activeElement === first || !card.contains(document.activeElement)) {
      e.preventDefault(); last.focus();
    }
  } else if (document.activeElement === last || !card.contains(document.activeElement)) {
    e.preventDefault(); first.focus();
  }
}
function openModal(html) {
  $('#modalBody').innerHTML = html;
  // Dialog semantics: label from the modal's heading so screen readers
  // announce what opened (every openModal body starts with an <h3>).
  const card = document.querySelector('.modal-card');
  const h = $('#modalBody').querySelector('h3, h2');
  if (card) card.setAttribute('aria-label', h ? h.textContent.trim() : 'Details');
  modalReturnFocus = document.activeElement;
  $('#modal').hidden = false;
  $('#scrim').hidden = false;
  // Move focus into the dialog so keyboard users land on a control.
  $('#modalClose').focus();
}
function closeModal() {
  $('#modal').hidden = true;
  if ($('#drawer').hidden) $('#scrim').hidden = true;
  // Return focus to the element that opened the modal.
  if (modalReturnFocus && typeof modalReturnFocus.focus === 'function') {
    try { modalReturnFocus.focus(); } catch { /* detached */ }
  }
  modalReturnFocus = null;
}

function openCameraModal(props, coords) {
  const brand = props.brand || 'Unknown';
  const op = props.operator || '';
  const isAlpr = isAlprCamera(props);
  const dir = typeof props.direction === 'number'
    ? `${props.direction}° (${['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(props.direction / 45) % 8]})`
    : null;
  const mount = props.mountType || '';
  const age = props.osmTimestamp
    ? `Mapped ${new Date(props.osmTimestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}`
    : '';
  openModal(`
    <h3>📷 ${escHtml(brand)}</h3>
    ${op && op.toLowerCase() !== brand.toLowerCase() ? `<p class="muted">Operator: ${escHtml(op)}</p>` : ''}
    <p>${isAlpr ? '<b>Automated license plate reader (ALPR)</b> — reads every passing plate.' : 'Surveillance camera.'}</p>
    <p class="muted">
      ${dir ? `Faces ${dir}. ` : ''}${mount ? `Mounted on ${escHtml(mount.replace(/_/g, ' '))}. ` : ''}${age}
    </p>
    <p class="muted">${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}</p>
    ${isAlpr ? '<p class="warn-text">Plate reads from cameras like this are shared with thousands of agencies. Ghostway routes around them by default.</p>' : ''}
    <p class="muted small">Data: DeFlock / OpenStreetMap contributors</p>
  `);
}

// ---- Report-a-camera flow (Workstream camera layer / ecosystem give-back) ----
// Two stages: (1) pick a location on the map, (2) fill the details form.
// Reports are stored locally (privacy-first) and feed routing immediately;
// publishing to OSM notes is opt-in, anonymous, key-free.
function openReportModal(stage, coords) {
  if (!stage) {
    openModal(`
      <h3>📷 Report a camera</h3>
      <p>Spotted a camera that's not on the map? Report it — it protects
      everyone who uses Ghostway, and (if you choose) gets submitted to
      OpenStreetMap so the DeFlock project can verify it.</p>
      <p class="muted">Nothing leaves your device unless you publish to OSM —
      and even then it's an anonymous map note, no account.</p>
      <button id="reportPick" class="primary-btn" style="margin-top:8px">📍 Pick location on map</button>
    `);
    $('#reportPick').addEventListener('click', () => {
      closeModal();
      startReportPlacement();
    });
    return;
  }
  if (stage === 'form') {
    const [lon, lat] = coords;
    openModal(`
      <h3>📷 Camera report</h3>
      <p class="muted small">Location: ${lat.toFixed(5)}, ${lon.toFixed(5)}</p>
      <label class="rp-label" for="rpKind">Camera type</label>
      <select id="rpKind" class="rp-input">
        <option value="alpr" selected>ALPR / license plate reader</option>
        <option value="redlight">Red-light camera</option>
        <option value="speed">Speed camera</option>
        <option value="fixed">Fixed surveillance camera</option>
        <option value="other">Other / not sure</option>
      </select>
      <label class="rp-label" for="rpBrand">Brand or model (if known)</label>
      <input id="rpBrand" class="rp-input" type="text" maxlength="40" placeholder="e.g. Flock Safety" autocomplete="off" />
      <label class="rp-label" for="rpNote">Notes (optional)</label>
      <input id="rpNote" class="rp-input" type="text" maxlength="120" placeholder="e.g. on pole facing northbound" autocomplete="off" />
      <div class="rp-actions">
        <button id="rpSave" class="primary-btn" type="button">Save report</button>
        <button id="rpCancel" class="ghost-btn" type="button">Cancel</button>
      </div>
      <p class="muted small" style="margin-top:10px">After saving you can optionally publish it to OpenStreetMap (anonymous, no account) — that's how it reaches the DeFlock map.</p>
    `);
    $('#rpCancel').addEventListener('click', closeModal);
    $('#rpSave').addEventListener('click', () => {
      const rec = addReport({
        lon, lat,
        kind: $('#rpKind').value,
        brand: $('#rpBrand').value.trim(),
        note: $('#rpNote').value.trim(),
      });
      refreshReportLayer();
      closeModal();
      offerPublish(rec);
    });
    return;
  }
}

function offerPublish(rec) {
  openModal(`
    <h3>✅ Report saved</h3>
    <p>Ghostway already routes around it on this device.</p>
    <p>Want to publish it to <b>OpenStreetMap</b> as an anonymous note?
    Mappers can then verify it and add it to OSM — which feeds the DeFlock
    camera map for everyone.</p>
    <div class="rp-actions">
      <button id="pubYes" class="primary-btn" type="button">Publish to OSM</button>
      <button id="pubNo" class="ghost-btn" type="button">Keep it local</button>
    </div>
  `);
  $('#pubNo').addEventListener('click', closeModal);
  $('#pubYes').addEventListener('click', async () => {
    const btn = $('#pubYes');
    btn.disabled = true;
    btn.textContent = 'Publishing…';
    try {
      const noteId = await publishReportToOsm(rec);
      if (noteId) markPublished(rec.id, noteId);
      closeModal();
      showStatus(
        noteId
          ? `Published to OpenStreetMap (note ${noteId}). Thank you!`
          : 'Published. Thank you for contributing!',
        'info'
      );
    } catch (e) {
      console.warn('OSM publish failed', e);
      btn.disabled = false;
      btn.textContent = 'Publish to OSM';
      showStatus('Publish failed — report is saved locally and still protects routes.', 'warn');
    }
  });
}

function startReportPlacement() {
  app._reportMode = true;
  showStatus('Tap the map where the camera is.', 'info');
  app.map.map.getCanvas().style.cursor = 'crosshair';
  const once = (e) => {
    if (!app._reportMode) return;
    app._reportMode = false;
    app.map.map.getCanvas().style.cursor = '';
    app.map.map.off('click', once);
    clearStatus();
    openReportModal('form', [e.lngLat.lng, e.lngLat.lat]);
  };
  app.map.map.on('click', once);
}

// Render community reports as distinct markers on the map.
function refreshReportLayer() {
  const reports = loadReports();
  app.map.setReports(
    reports.map((r) => ({
      type: 'Feature',
      properties: { kind: r.kind, brand: r.brand || '', published: r.publishedNoteId ? 1 : 0 },
      geometry: { type: 'Point', coordinates: [r.lon, r.lat] },
    }))
  );
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
  if (action === 'report') {
    openReportModal();
    return;
  }
  if (action === 'about') {
    openModal(`
      <h3>${CONFIG.about.name}</h3><p class="tag">${CONFIG.about.tagline}</p><p>${CONFIG.about.body}</p>
      <h3 style="margin-top:14px">Map legend</h3>
      <ul class="src-list legend">
        <li><span class="lg-dot flock"></span> Plate reader risk (Flock, Motorola, Rekor… or traffic-facing)</li>
        <li><span class="lg-dot other"></span> Other surveillance camera</li>
        <li><span class="lg-dot report"></span> Community-reported camera (purple)</li>
        <li><span class="lg-halo"></span> Heatmap halo = camera density</li>
        <li><span class="lg-line teal"></span> Your chosen route</li>
        <li><span class="lg-line grey"></span> Alternative route</li>
        <li><span class="lg-dot closure"></span> Live closure (UDOT)</li>
        <li><span class="lg-dot roadwork"></span> Live roadwork / lane closure (UDOT)</li>
      </ul>
    `);
  } else if (action === 'data') {
    openModal(`
      <h3>Data sources</h3>
      <ul class="src-list">
        <li><b>Base map:</b> OpenStreetMap via OpenFreeMap</li>
        <li><b>Cameras:</b> DeFlock (OpenStreetMap + volunteer ALPR map)</li>
        <li><b>Live traffic:</b> UDOT open events (Utah) + WZDx work-zone data (nationwide)</li>
        <li><b>Search:</b> Photon (OpenStreetMap)</li>
        <li><b>Routing:</b> Ghostway engine (on-device, where a road graph ships) · Valhalla (national) · BRouter + OSRM fallback</li>
      </ul>
      <p class="muted small">All sources are open and free to use. No account, no tracking.</p>
    `);
  } else if (action === 'privacy') {
    openModal(`
      <h3>Privacy & how it works</h3>
      <p>Where Ghostway ships a road graph (currently the Wasatch Front), routing happens
      <b>entirely on your device</b> — your destination never leaves your phone.</p>
      <p>Everywhere else, routes fall back to public open-source servers (Valhalla, Photon, BRouter, OSRM).
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

// ---- First-run onboarding (Workstream D) ----
function startOnboarding() {
  const wrap = $('#onboarding');
  const stepEl = $('#obStep');
  if (!wrap || !stepEl) return;

  const steps = [
    {
      icon: icon('shield', { size: 44 }),
      title: 'Avoid surveillance cameras',
      body: 'Ghostway routes you around Flock and ALPR cameras by default. You pick how hard it tries: Strict, Moderate, or Off.',
    },
    {
      icon: icon('lock', { size: 44 }),
      title: 'Your data stays with you',
      body: 'Routing and search run in your browser against open data. No account, no telemetry, no history sent anywhere.',
    },
    {
      icon: icon('compass', { size: 44 }),
      title: 'Navigate like a pro',
      body: 'Pick a destination, choose a route, then start navigation for voice guidance, live speed, and camera-ahead warnings.',
    },
  ];
  let i = 0;

  const render = () => {
    const s = steps[i];
    stepEl.innerHTML = `<div class="ob-icon">${s.icon}</div><h3>${s.title}</h3><p>${s.body}</p>`;
    document.querySelectorAll('.ob-dot').forEach((d, k) => d.classList.toggle('on', k === i));
    $('#obBack').hidden = i === 0;
    $('#obNext').textContent = i === steps.length - 1 ? 'Get started' : 'Next';
  };

  const finish = () => {
    localStorage.setItem('gw-onboarded', '1');
    wrap.hidden = true;
    window.__ghostwayOnboarded = 'done';
  };

  $('#obNext').addEventListener('click', () => {
    if (i < steps.length - 1) { i++; render(); }
    else finish();
  });
  $('#obBack').addEventListener('click', () => {
    if (i > 0) { i--; render(); }
  });
  $('#obSkip').addEventListener('click', finish);

  render();
  wrap.hidden = false;
  // Move focus into the dialog so keyboard/SR users land on it, not the map.
  $('#obNext').focus();
}
