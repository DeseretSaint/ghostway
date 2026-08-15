import { CONFIG } from './config.js';

// Routing backend.
//  - BRouter: route geometry + camera avoidance via `nogos` (per-camera circles).
//  - OSRM (routing.openstreetmap.de): turn-by-turn instructions only.
//
// Avoidance is ITERATIVE: we keep re-routing and adding the cameras that are
// still on the path as nogos, until the route stabilizes or we hit a cap. This
// is what makes Ghostway actually try to get you clear instead of giving up
// after a single detour attempt.

function brouterUrl(from, to, nogos) {
  const lonlats = `${from[0]},${from[1]}|${to[0]},${to[1]}`;
  let base = `${CONFIG.brouter}?lonlats=${lonlats}&profile=car-fast&alternativeidx=0&format=geojson&polyline=false`;
  if (nogos && nogos.length) {
    const parts = nogos.map((c) => `${c[0].toFixed(5)},${c[1].toFixed(5)},${CONFIG.avoidance.cameraRadiusM}`);
    base += `&nogos=${encodeURIComponent(parts.join('|'))}`;
  }
  return base;
}

async function brouterRoute(from, to, nogos) {
  const url = brouterUrl(from, to, nogos);
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 9000);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`BRouter ${res.status}`);
      const j = await res.json();
      const f = j.features && j.features[0];
      if (!f) throw new Error('BRouter returned no route');
      const coords = f.geometry.coordinates.map((c) => [c[0], c[1]]);
      const dist = Number(f.properties['track-length']) || 0;
      const time = Number(f.properties['total-time']) || 0;
      return { coords, distance: dist, duration: time };
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    } finally {
      clearTimeout(t);
    }
  }
  throw lastErr;
}

// Fallback routing via OSRM when BRouter is unavailable. No avoidance, but it
// gets the user a route instead of a dead end.
async function osrmRoute(from, to) {
  const url =
    `${CONFIG.osrm}/route/v1/driving/${from[0]},${from[1]};${to[0]},${to[1]}` +
    `?overview=full&geometries=geojson`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 9000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const j = await res.json();
    const r = j.routes && j.routes[0];
    if (!r) throw new Error('OSRM returned no route');
    const coords = r.geometry.coordinates.map((c) => [c[0], c[1]]);
    return { coords, distance: r.distance || 0, duration: r.duration || 0 };
  } finally {
    clearTimeout(t);
  }
}

const MANEUVER = {
  '': 'Continue',
  straight: 'Continue straight',
  slight_right: 'Slight right',
  slight_left: 'Slight left',
  right: 'Turn right',
  left: 'Turn left',
  sharp_right: 'Sharp right',
  sharp_left: 'Sharp left',
  'u-turn': 'U-turn',
  depart: 'Head out',
  arrive: 'Arrive at destination',
  roundabout: 'Take the roundabout',
  merge: 'Merge',
  fork: 'Take the fork',
  'end-of-road': 'At the end of the road',
};

async function osrmSteps(from, to) {
  const url =
    `${CONFIG.osrm}/route/v1/driving/${from[0]},${from[1]};${to[0]},${to[1]}` +
    `?steps=true&overview=false&geometries=geojson`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 9000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return [];
    const j = await res.json();
    if (!j.routes || !j.routes.length) return [];
    let acc = 0;
    const steps = j.routes[0].legs.flatMap((l) => l.steps).map((s) => {
      const startS = acc;
      acc += s.distance;
      return {
        instruction: MANEUVER[s.maneuver?.type] || s.maneuver?.modifier || 'Continue',
        modifier: s.maneuver?.modifier,
        distance: s.distance,
        duration: s.duration,
        name: s.name || '',
        startS,
      };
    });
    return steps;
  } finally {
    clearTimeout(t);
  }
}

function sameCam(a, b) {
  return Math.abs(a[0] - b[0]) < 1e-5 && Math.abs(a[1] - b[1]) < 1e-5;
}

function bboxOf(coords, bufDeg) {
  let w = 180, s = 90, e = -180, n = -90;
  for (const [lon, lat] of coords) {
    w = Math.min(w, lon); s = Math.min(s, lat);
    e = Math.max(e, lon); n = Math.max(n, lat);
  }
  return [w - bufDeg, s - bufDeg, e + bufDeg, n + bufDeg];
}

export async function planRoute(from, to, { avoid, cameraStore }) {
  // 1) Baseline (fastest) route. Prefer BRouter (supports avoidance); fall back
  //    to OSRM if BRouter is unreachable so the user still gets a route.
  let baseline;
  let usedFallback = false;
  try {
    baseline = await brouterRoute(from, to, null);
  } catch (e) {
    baseline = await osrmRoute(from, to);
    usedFallback = true;
  }

  if (!avoid) {
    const steps = await osrmSteps(from, to).catch(() => []);
    return {
      baseline,
      clear: baseline,
      avoid: false,
      applied: false,
      avoidedCount: 0,
      remainingCount: 0,
      detourFactor: 1,
      steps,
      from,
      to,
    };
  }

  // 2) Fetch the camera pool ONCE (cached by bbox in the store), then iterate.
  //    Skip iterative avoidance if we already fell back to OSRM (no nogo support).
  const buf = (CONFIG.avoidance.routeCorridorM * 2) / 111320;
  const pool = await cameraStore.getCameras(bboxOf(baseline.coords, buf)).catch(() => []);

  let current = baseline;
  let nogos = [];
  let iter = 0;
  const MAX_ITER = 6;
  if (!usedFallback) {
    while (iter < MAX_ITER) {
      const onRoute = cameraStore.nearRouteFromList(current.coords, pool, CONFIG.avoidance.routeCorridorM);
      if (!onRoute.length) break;
      const newOnes = onRoute
        .map((f) => f.geometry.coordinates)
        .filter((c) => !nogos.some((n) => sameCam(n, c)));
      if (!newOnes.length) break; // re-route didn't expose new cameras to avoid
      nogos = nogos.concat(newOnes).slice(0, CONFIG.avoidance.maxNogos);
      try {
        current = await brouterRoute(from, to, nogos);
      } catch (e) {
        break;
      }
      iter++;
    }
  }

  const avoidedCount = nogos.length;
  const remainingCount = cameraStore.nearRouteFromList(
    current.coords,
    pool,
    CONFIG.avoidance.routeCorridorM
  ).length;
  const applied = !usedFallback && Math.abs(current.distance - baseline.distance) > 1;
  const steps = await osrmSteps(from, to).catch(() => []);

  return {
    baseline,
    clear: current,
    avoid: true,
    applied,
    avoidedCount,
    remainingCount,
    detourFactor: baseline.distance ? current.distance / baseline.distance : 1,
    routerDown: usedFallback,
    steps,
    from,
    to,
  };
}
