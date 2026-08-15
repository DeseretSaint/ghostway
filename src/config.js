// Ghostway — central configuration & endpoints.
// Every dependency is an open, non-proprietary service. No API keys required.

export const CONFIG = {
  // --- Base map tiles (OpenStreetMap data, served by OpenFreeMap — free, no key) ---
  mapStyle: 'https://tiles.openfreemap.org/styles/liberty',

  // --- ALPR / Flock camera data (DeFlock, open ODbL/CC-BY data) ---
  // Two ways to get cameras:
  //  1) Vector tiles (fast, on-demand, recommended) — used for the live map.
  cameraTileUrl: 'https://tiles.dontgetflocked.com/cameras/{z}/{x}/{y}.mvt',
  //  2) Full GeoJSON (bundled snapshot) — used as a fallback / for offline & routing.
  cameraGeojson: '/cameras/cameras.geojson',

  // --- Geocoding / search (Photon, OpenStreetMap-based, no key) ---
  photon: 'https://photon.komoot.io/api',

  // --- Routing (BRouter, open routing engine; supports per-camera "nogos") ---
  brouter: 'https://brouter.de/brouter',

  // --- Turn-by-turn (OSRM, used only for human-readable instructions) ---
  osrm: 'https://routing.openstreetmap.de/routed-car',

  // --- Avoidance tuning ---
  avoidance: {
    // Radius (meters) of the no-go circle placed around each camera.
    cameraRadiusM: 400,
    // When there are many cameras near a route, we only avoid the ones close to it.
    routeCorridorM: 600,
    // Hard cap on how many cameras we send as nogos in a single request.
    maxNogos: 40,
    // If the avoidance detour adds more than this multiple, we warn but still show it.
    sanityMaxFactor: 3,
  },

  // Brand / donation (configurable — point at whatever you like).
  donate: {
    title: 'Support Ghostway',
    blurb:
      'Ghostway is free and always will be. It runs on open data and open infrastructure. ' +
      'If it helps you move freely, a small donation keeps it alive — no pressure.',
    methods: [
      { label: 'Ko-fi', url: 'https://ko-fi.com/ghostway', note: 'One-off or monthly' },
      { label: 'GitHub Sponsors', url: 'https://github.com/sponsors/ghostway', note: 'Recurring' },
      { label: 'Liberapay', url: 'https://liberapay.com/ghostway', note: 'Anonymous recurring' },
    ],
    crypto: [
      { label: 'Monero (XMR)', addr: 'YOUR_XMR_ADDRESS_HERE' },
      { label: 'Bitcoin (BTC)', addr: 'YOUR_BTC_ADDRESS_HERE' },
    ],
  },

  github: 'https://github.com/ghostway/ghostway',
  about: {
    name: 'Ghostway',
    tagline: 'Navigate beyond surveillance.',
    body:
      'Ghostway is a free, open-source navigation app built on OpenStreetMap and DeFlock data. ' +
      'Its core mission: get you where you need to go without being logged by automated license ' +
      'plate readers (ALPRs) — the Flock Safety cameras and others that photograph every passing ' +
      'vehicle and share the data with thousands of agencies. By default, Ghostway routes you around ' +
      'known camera locations. You stay in control: flip the toggle to take the fastest road instead.',
  },
};

// Camera vector-tile layer + property names (from DeFlock's PMTiles schema).
export const CAMERA_LAYER = {
  sourceId: 'deflock',
  layerId: 'cameras-layer',
  heatId: 'cameras-heat',
  layer: 'cameras', // vector layer name inside the MVT
  brandKey: 'brand',
};
