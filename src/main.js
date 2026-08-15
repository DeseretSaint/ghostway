import { CONFIG, CAMERA_LAYER, isAlprCamera } from './config.js';
import { MapView } from './map-view.js';
import { CameraStore } from './camera-store.js';
import { searchPlaces, reverseGeocode } from './search.js';
import { planRoute } from './routing.js';
import { planRoutes, loadGraph, inGraphRegion, graphStatus } from './router.js';
import { valhallaPlanRoutes } from './valhalla.js';
import { loadTraffic } from './traffic.js';
import { $, el, debounce, fmtDistance, fmtDuration, fmtNavDistance, fmtSpeed, haversine, haptic, pointToSegmentM } from './utils.js';
import { buildPanel, renderRouteCard, showStatus, clearStatus } from './ui.js';
import { registerSW } from './pwa.js';
import { speak, phraseManeuver, phraseArrival, cancel as cancelVoice, toggleVoice, voiceEnabled, setVoiceEnabled } from './voice.js';

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
  window.__gw = app; // test/diagnostic hook

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

  // First-run onboarding (Workstream D).
  if (!localStorage.getItem('gw-onboarded')) startOnboarding();

  // Camera click -> info modal.
  app.map.onCameraClick(async (props, coords) => {
    openCameraModal(props, coords);
  });

  // Waypoint drag: live-move the handle, re-route on drop (Workstream C).
  app.map.onWaypointDrag((coords, commit) => {
    if (!app.state.route || !app.state.route.engine) return;
    app.state.waypoint = coords;
    app.map.setWaypoint(coords);
    if (commit) reRouteViaWaypoint();
  });
  // Tap the waypoint handle: remove the via-point and re-route direct.
  // (The default mid-route handle is a drag affordance only — no tap action.)
  app.map.onWaypointTap(() => {
    if (!app.state.route || !app.state.route.via || !app.state.waypoint) return;
    app.state.waypoint = null;
    app.map.setWaypoint(null);
    onRoute();
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
    window.__ghostwayEngine = 'ready';
  } catch (e) {
    console.warn('engine load failed', e);
    app._engineReady = false;
    window.__ghostwayEngine = 'failed';
    return;
  }
  // Live traffic: fetch UDOT events for the graph bbox, then show them on the
  // map. Fails silently -> free-flow routing (Workstream B degrade path).
  try {
    const g = await loadGraph();
    const traffic = await loadTraffic(g.bbox);
    app.traffic = traffic;
    if (traffic.ok && traffic.events.length) {
      app.map.setIncidents(traffic.events);
      enginePill(`🛡 Engine ready · 🚧 ${traffic.events.length} live traffic events`);
    } else {
      enginePill('🛡 Local camera-aware engine ready');
    }
    window.__ghostwayTraffic = traffic.ok ? traffic.events.length : 'failed';
  } catch (e) {
    console.warn('traffic load failed', e);
    window.__ghostwayTraffic = 'failed';
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
  $('#recenterBtn').addEventListener('click', () => setFollow(true));
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

function pickOptionForMode(options) {
  const modeRank = { strict: ['strict', 'moderate', 'off'], moderate: ['moderate', 'strict', 'off'], off: ['off', 'moderate', 'strict'] };
  const pref = modeRank[app.state.mode] || modeRank.moderate;
  let chosen = options.findIndex((o) => o.mode === pref[0]);
  if (chosen === -1) chosen = options.findIndex((o) => o.mode === pref[1]);
  if (chosen === -1) chosen = 0;
  return chosen;
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
      const { options } = await planRoutes(from.coords, to.coords, { traffic: app.traffic || null });
      const ms = Math.round(performance.now() - t0);
      app.state.options = options;
      // Default pick: closest to the user's mode preference.
      const chosen = pickOptionForMode(options);
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

  // --- Valhalla fallback: national coverage + camera avoidance via
  //     exclude_locations (same options UX as the own engine). ---
  try {
    const t0 = performance.now();
    const mode = app.state.avoid ? (app.state.mode || 'moderate') : 'off';
    const { options } = await valhallaPlanRoutes(from.coords, to.coords, app.cameras, { mode });
    const ms = Math.round(performance.now() - t0);
    app.state.options = options;
    const chosen = pickOptionForMode(options);
    app.state.chosen = chosen;
    app.state.route = { engine: true, source: 'valhalla', options, chosen };
    drawEngineRoutes();
    renderRouteCard(app, app.state.route);
    clearStatus();
    enginePill(`🌐 Valhalla engine · ${ms} ms · ${options.length} option${options.length > 1 ? 's' : ''}`);
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
    showStatus('Routing failed: ' + err.message, 'warn');
  }
}

function selectOption(i) {
  if (!app.state.options[i]) return;
  app.state.chosen = i;
  drawEngineRoutes();
  renderRouteCard(app, app.state.route);
}

// ---- Waypoint ("via point") routing: from → via → to, two stitched legs ----
async function reRouteViaWaypoint() {
  const from = app.state.from, to = app.state.to, via = app.state.waypoint;
  if (!from || !to || !via) return;
  showStatus('Rerouting via waypoint…', 'info');
  try {
    const mode = app.state.avoid ? (app.state.mode || 'moderate') : 'off';
    let opt1, opt2, source;
    const local = engineCovers(from.coords, via) && engineCovers(via, to.coords);
    if (local) {
      source = 'local';
      const r1 = await planRoutes(from.coords, via, { traffic: app.traffic || null });
      const r2 = await planRoutes(via, to.coords, { traffic: app.traffic || null });
      opt1 = r1.options[pickOptionForMode(r1.options)];
      opt2 = r2.options[pickOptionForMode(r2.options)];
    } else {
      source = 'valhalla';
      const r1 = await valhallaPlanRoutes(from.coords, via, app.cameras, { mode });
      const r2 = await valhallaPlanRoutes(via, to.coords, app.cameras, { mode });
      opt1 = r1.options[pickOptionForMode(r1.options)];
      opt2 = r2.options[pickOptionForMode(r2.options)];
    }
    // Stitch the two legs into one through-route.
    const leg2Steps = (opt2.instructions || []).map((s) => ({ ...s, at: (s.at || 0) + opt1.distance }));
    const rawCoords = [...(opt1.route ? opt1.route.coords : opt1.coords), ...(opt2.route ? opt2.route.coords : opt2.coords).slice(1)];
    const stitched = {
      mode,
      label: 'Via waypoint',
      coords: [...opt1.coords, ...opt2.coords.slice(1)],
      route: { coords: rawCoords }, // nav bookkeeping uses raw geometry
      distance: opt1.distance + opt2.distance,
      duration: opt1.duration + opt2.duration,
      delay: (opt1.delay || 0) + (opt2.delay || 0),
      cameras: (opt1.cameras || 0) + (opt2.cameras || 0),
      instructions: [...(opt1.instructions || []), ...leg2Steps],
    };
    app.state.options = [stitched];
    app.state.chosen = 0;
    app.state.route = { engine: true, source, via: true, options: [stitched], chosen: 0 };
    drawEngineRoutes();
    app.map.setWaypoint(via);
    renderRouteCard(app, app.state.route);
    clearStatus();
    window.__ghostwayDebug = { ...(window.__ghostwayDebug || {}), viaRoute: true, viaSource: source };

    // If navigating, refresh the live step bookkeeping without restarting nav.
    if (app.state.navigating) {
      app._navSteps = stitched.instructions.map((s) => ({ ...s, startS: s.at || 0 }));
      app._navRouteCoords = stitched.coords;
      app._routeCum = cumulativeDistances(stitched.coords);
      app._routeTotal = app._routeCum[app._routeCum.length - 1] || stitched.distance;
      app._voiceAnnounced = {};
      renderNavStep();
    }
  } catch (e) {
    console.warn('via reroute failed', e);
    showStatus('Could not route via that waypoint.', 'warn');
  }
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

  // Waypoint grab-handle: keep an existing via position, else offer the
  // midpoint of the chosen route as a draggable handle (Workstream C).
  if (app.state.route && app.state.route.via && app.state.waypoint) {
    app.map.setWaypoint(app.state.waypoint);
  } else if (!app.state.navigating) {
    app.state.waypoint = sel.coords[Math.floor(sel.coords.length / 2)];
    app.map.setWaypoint(app.state.waypoint);
  } else {
    app.map.setWaypoint(null);
  }

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
  window.__ghostwayNavCoords = rawCoords;
  window.__ghostwayDebug = { ...(window.__ghostwayDebug || {}), navCoords: sel.coords.length };
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
  app._navStart = Date.now();
  app._navLastPos = null;
  app._navLastT = 0;
  app._navSpeed = null; // m/s, smoothed
  app._voiceAnnounced = {}; // step index -> announced

  // Hide the planning panel, show the nav banner.
  $('#panel').hidden = true;
  app.map.setWaypoint(null); // no drag handle while driving
  showNavBanner();
  setFollow(true);

  const first = app._navSteps[0];
  if (first) speak(phraseManeuver(first.distance, first.instruction, first.name), { interrupt: true });

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

// Heading: prefer GPS heading; otherwise derive from consecutive positions.
function updateHeading(pos, coords) {
  const prev = app._lastHeadingPos;
  app._lastHeadingPos = coords;
  const h = pos.coords.heading;
  if (h != null && !isNaN(h) && (pos.coords.speed == null || pos.coords.speed > 1)) return h;
  if (prev) {
    const [lon1, lat1] = prev;
    const latm = ((lat1 + coords[1]) / 2) * Math.PI / 180;
    const dx = (coords[0] - lon1) * Math.cos(latm);
    const dy = coords[1] - lat1;
    if (Math.hypot(dx, dy) > 1e-6) {
      return ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
    }
  }
  return app.state.heading || 0;
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
    chip.textContent = fmtSpeed(app._navSpeed);
    chip.hidden = app._navSpeed == null;
    checkOverSpeed();
  }
}

// Over-speed alert (Workstream C): compare smoothed GPS speed against the
// current step's posted limit. Visual: red chip. Voice: at most once/minute.
function checkOverSpeed() {
  const chip = $('#speedChip');
  if (!chip || !app.state.navigating || app._navSpeed == null) return;
  const steps = app._navSteps || [];
  const step = steps[Math.min(app.state.stepIndex, steps.length - 1)];
  const limitKmh = step && step.speedLimit;
  if (!limitKmh) {
    chip.classList.remove('over');
    return;
  }
  const speedKmh = app._navSpeed * 3.6;
  const over = speedKmh > limitKmh + 8; // tolerance ~5 mph
  chip.classList.toggle('over', over);
  const now = Date.now();
  if (over && (!app._lastOverVoice || now - app._lastOverVoice > 60000)) {
    app._lastOverVoice = now;
    speak(`You're over the ${Math.round(limitKmh * 0.621371 / 5) * 5} mile per hour limit.`);
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
  const cams = sel ? (sel.cameras ?? 0) : 0;
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
    if (engineCovers(fromC, to.coords)) {
      const { options } = await planRoutes(fromC, to.coords, { traffic: app.traffic || null });
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
        const { options } = await valhallaPlanRoutes(fromC, to.coords, app.cameras, { mode });
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
    speak(phraseArrival(), { interrupt: true });
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
    // Announce the new maneuver ahead.
    const s = steps[idx];
    if (s && idx > 0 && !app._voiceAnnounced[idx]) {
      app._voiceAnnounced[idx] = 1;
      const distToManeuver = Math.max(0, (s.startS || 0) - traveled + s.distance);
      speak(phraseManeuver(distToManeuver, s.instruction, s.name));
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
        speak(phraseManeuver(Math.max(30, distToManeuver), s.instruction, s.name));
      }
    }
    // Camera-ahead warning: find the nearest later step that passes cameras;
    // if we're within ~250m of entering it, alert once.
    for (let k = idx + 1; k < steps.length; k++) {
      if (!steps[k].cameras) continue;
      if (app._voiceAnnounced['cam' + k]) continue; // already warned for this one
      const distToCam = steps[k].startS - traveled;
      if (distToCam > 0 && distToCam <= 250) {
        app._voiceAnnounced['cam' + k] = 1;
        speak('Camera ahead. You will pass it in about 200 meters.');
        haptic();
      }
      break; // only ever consider the nearest camera step
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
  const road = next && next.name ? ` onto <b>${next.name}</b>` : next && step.name ? ` onto <b>${step.name}</b>` : '';
  const icon = next ? stepIcon(next.modifier) : stepIcon(step.modifier);
  const limit = (next && next.speedLimit) || step.speedLimit;
  const limitMph = limit ? Math.round(limit * 0.621371 / 5) * 5 : null;
  const eta = app._totalDuration ? fmtDuration(app._totalDuration * (1 - routeFraction(app.state.userLoc || [0, 0]))) : '';
  const voiceOn = voiceEnabled();

  $('#navBanner').innerHTML = `
    <button id="navStop" class="nav-stop" aria-label="Stop navigation">✕</button>
    <div class="nav-icon" aria-hidden="true">${icon}</div>
    <div class="nav-step">
      <div class="nav-dist" id="navDist">${dist}</div>
      <div class="nav-dir">${dir}${road}</div>
      ${next ? `<div class="nav-then">then ${stepIcon(step.modifier)} ${lower(step.instruction)}${step.name ? ` · ${step.name}` : ''}</div>` : ''}
    </div>
    <div class="nav-side">
      <button id="voiceBtn" class="nav-voice ${voiceOn ? 'on' : ''}" aria-label="Toggle voice" title="Voice guidance">🔊</button>
      ${limitMph ? `<div class="speed-limit"><span class="sl-num">${limitMph}</span><span class="sl-lbl">MAX</span></div>` : ''}
      <div id="speedChip" class="speed-chip" hidden></div>
      <div class="nav-eta">${eta}</div>
    </div>`;
  $('#navStop').addEventListener('click', () => stopNav(false));
  $('#voiceBtn').addEventListener('click', () => {
    const on = toggleVoice();
    $('#voiceBtn').classList.toggle('on', on);
    if (on) speak('Voice guidance on.');
  });
}

function lower(s) {
  return (s || '').replace(/^./, (c) => c.toLowerCase());
}

function stepIcon(mod) {
  return (
    {
      left: '↰',
      right: '↱',
      slight_left: '↰',
      slight_right: '↱',
      straight: '↑',
      sharp_left: '⤺',
      sharp_right: '⤻',
      'u-turn': '⮌',
      depart: '◎',
      arrive: '⊗',
    }[mod] || '↑'
  );
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
  app.map.setRoute([]);
  app.map.setEndpoints([]);
  app.map.setWaypoint(null);
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
  const isAlpr = isAlprCamera(props);
  const dir = typeof props.direction === 'number'
    ? `${props.direction}° (${['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(props.direction / 45) % 8]})`
    : null;
  const mount = props.mountType || '';
  const age = props.osmTimestamp
    ? `Mapped ${new Date(props.osmTimestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}`
    : '';
  openModal(`
    <h3>📷 ${brand}</h3>
    ${op && op.toLowerCase() !== brand.toLowerCase() ? `<p class="muted">Operator: ${op}</p>` : ''}
    <p>${isAlpr ? '<b>Automated license plate reader (ALPR)</b> — reads every passing plate.' : 'Surveillance camera.'}</p>
    <p class="muted">
      ${dir ? `Faces ${dir}. ` : ''}${mount ? `Mounted on ${mount.replace(/_/g, ' ')}. ` : ''}${age}
    </p>
    <p class="muted">${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}</p>
    ${isAlpr ? '<p class="warn-text">Plate reads from cameras like this are shared with thousands of agencies. Ghostway routes around them by default.</p>' : ''}
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
    openModal(`
      <h3>${CONFIG.about.name}</h3><p class="tag">${CONFIG.about.tagline}</p><p>${CONFIG.about.body}</p>
      <h3 style="margin-top:14px">Map legend</h3>
      <ul class="src-list legend">
        <li><span class="lg-dot flock"></span> Plate reader risk (Flock, Motorola, Rekor… or traffic-facing)</li>
        <li><span class="lg-dot other"></span> Other surveillance camera</li>
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
        <li><b>Live traffic:</b> UDOT open events (roadwork, closures, incidents)</li>
        <li><b>Search:</b> Photon (OpenStreetMap)</li>
        <li><b>Routing:</b> Ghostway engine (Wasatch Front) · Valhalla (national) · BRouter + OSRM fallback</li>
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

// ---- First-run onboarding (Workstream D) ----
function startOnboarding() {
  const wrap = $('#onboarding');
  const stepEl = $('#obStep');
  if (!wrap || !stepEl) return;

  const steps = [
    {
      icon: '🛡️',
      title: 'Avoid surveillance cameras',
      body: 'Ghostway routes you around Flock and ALPR cameras by default. You pick how hard it tries: Strict, Moderate, or Off.',
    },
    {
      icon: '🗺️',
      title: 'Your data stays with you',
      body: 'Routing and search run in your browser against open data. No account, no telemetry, no history sent anywhere.',
    },
    {
      icon: '🧭',
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
}
