import { CONFIG } from './config.js';

// Routing backend.
//  - BRouter: route geometry + camera avoidance via `nogos` (per-camera circles).
//  - OSRM (routing.openstreetmap.de): turn-by-turn instructions only, derived
//    from the same endpoints so the directions match the line you see.

function brouterUrl(from, to, nogos) {
  const lonlats = `${from[0]},${from[1]}|${to[0]},${to[1]}`;
  let base = `${CONFIG.brouter}?lonlats=${lonlats}&profile=car-fast&alternativeidx=0&format=geojson&polyline=false`;
  if (nogos && nogos.length) {
    const parts = nogos.map(
      (c) => `${c[0].toFixed(5)},${c[1].toFixed(5)},${CONFIG.avoidance.cameraRadiusM}`
    );
    base += `&nogos=${encodeURIComponent(parts.join('|'))}`;
  }
  return base;
}

async function brouterRoute(from, to, nogos) {
  const res = await fetch(brouterUrl(from, to, nogos));
  if (!res.ok) throw new Error(`BRouter ${res.status}`);
  const j = await res.json();
  const f = j.features && j.features[0];
  if (!f) throw new Error('BRouter returned no route');
  const coords = f.geometry.coordinates.map((c) => [c[0], c[1]]);
  const dist = Number(f.properties['track-length']) || 0;
  const time = Number(f.properties['total-time']) || 0;
  return { coords, distance: dist, duration: time };
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
  'roundabout': 'Take the roundabout',
  'merge': 'Merge',
  'fork': 'Take the fork',
  'end-of-road': 'At the end of the road',
};

async function osrmSteps(from, to) {
  const url =
    `${CONFIG.osrm}/route/v1/driving/${from[0]},${from[1]};${to[0]},${to[1]}` +
    `?steps=true&overview=false&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const j = await res.json();
  if (!j.routes || !j.routes.length) return [];
  const steps = j.routes[0].legs.flatMap((l) => l.steps);
  return steps.map((s) => ({
    instruction: MANEUVER[s.maneuver?.type] || s.maneuver?.modifier || 'Continue',
    modifier: s.maneuver?.modifier,
    distance: s.distance,
    duration: s.duration,
    name: s.name || '',
  }));
}

export async function planRoute(from, to, { avoid, cameraStore }) {
  // 1) Baseline (fastest) route.
  const baseline = await brouterRoute(from, to, null);

  let clear = baseline;
  let avoidedCameras = [];

  if (avoid) {
    // 2) Find cameras near the baseline route.
    avoidedCameras = await cameraStore.camerasNearRoute(baseline.coords);
    if (avoidedCameras.length) {
      const nogos = avoidedCameras.map((f) => f.geometry.coordinates);
      try {
        clear = await brouterRoute(from, to, nogos);
      } catch (err) {
        // If avoidance routing fails (e.g. no detour possible), fall back.
        clear = baseline;
      }
    }
  }

  // 3) Turn-by-turn from OSRM for whichever line we show.
  const shown = avoid && clear !== baseline ? clear : baseline;
  const steps = await osrmSteps(from, to).catch(() => []);

  const detourFactor = baseline.distance ? clear.distance / baseline.distance : 1;

  return {
    baseline, // {coords, distance, duration}
    clear, // {coords, distance, duration}
    avoid, // boolean
    applied: avoid && clear !== baseline && avoidedCameras.length > 0,
    avoidedCount: avoidedCameras.length,
    detourFactor,
    steps,
    from,
    to,
  };
}
