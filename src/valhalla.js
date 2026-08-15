// Valhalla integration — national-coverage fallback routing engine.
// Used when Ghostway's own graph doesn't cover the corridor (Wasatch Front
// only so far). Public demo server, key-free, CORS-open (valhalla1.openstreetmap.de).
//
// Camera avoidance: baseline route → scan DeFlock cameras near it → re-route
// with up to 40 cameras as `exclude_locations` (server caps ~50). Iterative.
//
// Self-hosted option: point CONFIG.valhallaUrl at Keaton's own Docker instance
// (docs/valhalla-docker.md) for higher limits + no rate risk.

import { CONFIG } from './config.js';
import { nearRouteFromList } from './camera-store.js';

const SERVER = CONFIG.valhallaUrl || 'https://valhalla1.openstreetmap.de';

export async function valhallaRoute(from, to, excludes) {
  const body = {
    locations: [
      { lat: from[1], lon: from[0] },
      { lat: to[1], lon: to[0] },
    ],
    costing: 'auto',
    costing_options: { auto: { use_living_streets: 0.8 } },
    directions_options: { units: 'kilometers' },
  };
  if (excludes && excludes.length) {
    body.exclude_locations = excludes.map((c) => ({ lat: c[1], lon: c[0] }));
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(`${SERVER}/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`Valhalla ${res.status}`);
    const j = await res.json();
    const leg = j.trip.legs[0];
    const coords = decodePolyline(leg.shape);
    // Count cameras passed using the caller-supplied pool.
    return { coords, distance: leg.summary.length * 1000, duration: leg.summary.time, maneuvers: leg.maneuvers };
  } finally {
    clearTimeout(t);
  }
}

// Valhalla-encoded polyline (6 digits) → [[lon,lat], ...]
function decodePolyline(str) {
  const arr = [];
  let index = 0, lat = 0, lng = 0;
  while (index < str.length) {
    let result = 0, shift = 0, byte;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : result >> 1;
    result = 0;
    shift = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : result >> 1;
    arr.push([lng / 1e6, lat / 1e6]);
  }
  return arr;
}

const MANEUVER_MAP = {
  0: 'Head out',
  1: 'Continue',
  2: 'Continue',
  3: 'Turn right',
  4: 'Turn right',
  5: 'Turn left',
  6: 'Turn left',
  7: 'U-turn',
  8: 'U-turn',
  9: 'Merge',
  10: 'Merge',
  11: 'Take the exit',
  12: 'Take the exit',
  13: 'Take the ramp',
  14: 'Take the ramp',
  15: 'Turn',
  16: 'Arrive',
  20: 'Enter the ferry',
  24: 'Arrive',
};

export function valhallaInstructions(maneuvers) {
  let cum = 0;
  const steps = [];
  for (const m of maneuvers) {
    const distM = m.length * 1000;
    steps.push({
      distance: distM,
      at: cum,
      instruction: MANEUVER_MAP[m.type] || m.instruction,
      name: (m.street_names || []).join(' / ') || '',
      cameras: 0,
    });
    cum += distM;
  }
  return steps;
}

// Full avoidance pipeline. Mirrors the own-graph engine's return shape closely
// enough for the UI: { options: [{ mode, label, route: {coords,...}, instructions, cameras, distance, duration, delay }] }.
export async function valhallaPlanRoutes(from, to, cameraStore, { mode = 'moderate' } = {}) {
  const baseline = await valhallaRoute(from, to, null);

  if (mode === 'off') {
    const opt = {
      mode: 'off', label: 'Fastest',
      route: baseline,
      coords: baseline.coords,
      distance: baseline.distance, duration: baseline.duration, delay: 0,
      cameras: 0, camerasKnown: false,
      instructions: valhallaInstructions(baseline.maneuvers),
    };
    return { options: [opt], source: 'valhalla' };
  }

  // Camera pool around the corridor (DeFlock tiles + cached fallback).
  const buf = 0.012;
  const bbox = [
    Math.min(from[0], to[0]) - buf, Math.min(from[1], to[1]) - buf,
    Math.max(from[0], to[0]) + buf, Math.max(from[1], to[1]) + buf,
  ];
  const pool = await cameraStore.getCameras(bbox).catch(() => []);

  // Iterative exclusion (Valhalla demo caps ~50 exclude_locations; we use 40).
  const MAX_EXCL = 40;
  const camWeight = mode === 'strict' ? 1 : 0.6;
  let current = baseline;
  let excludes = [];
  let iterations = 0;
  let avoidedCount = 0;
  while (iterations < 5) {
    iterations++;
    const onRoute = nearRouteFromList(current.coords, pool, CONFIG.avoidance.routeCorridorM);
    const fresh = onRoute.filter((f) => {
      const key = f.geometry.coordinates.join(',');
      return !excludes.some((c) => c[0].toFixed(5) + ',' + c[1].toFixed(5) === key);
    });
    if (!fresh.length) break;
    const add = fresh.slice(0, MAX_EXCL - excludes.length).map((f) => f.geometry.coordinates);
    if (!add.length) break;
    excludes = excludes.concat(add);
    let next;
    try {
      next = await valhallaRoute(from, to, excludes);
    } catch (e) {
      break; // server cap / timeout — keep the best route we have
    }
    const newOnRoute = nearRouteFromList(next.coords, pool, CONFIG.avoidance.routeCorridorM);
    const stillOn = newOnRoute.filter((f) => onRoute.includes(f)).length;
    avoidedCount += onRoute.length - stillOn;
    current = next;
    if (mode === 'moderate' && current.distance > baseline.distance * 1.35) {
      // moderate caps the detour
      current = baseline;
      break;
    }
  }

  const camerasNow = nearRouteFromList(current.coords, pool, CONFIG.avoidance.routeCorridorM);
  const applied = current !== baseline && Math.abs(current.distance - baseline.distance) > 1;
  const options = [];

  if (applied) {
    options.push({
      mode, label: mode === 'strict' ? 'Clearest' : 'Balanced',
      route: current,
      coords: current.coords,
      distance: current.distance, duration: current.duration, delay: 0,
      cameras: camerasNow.length,
      instructions: valhallaInstructions(current.maneuvers),
    });
  }
  options.push({
    mode: 'off', label: 'Fastest',
    route: baseline,
    coords: baseline.coords,
    distance: baseline.distance, duration: baseline.duration, delay: 0,
    cameras: nearRouteFromList(baseline.coords, pool, CONFIG.avoidance.routeCorridorM).length,
    instructions: valhallaInstructions(baseline.maneuvers),
  });

  return { options, source: 'valhalla', avoidedCount };
}
