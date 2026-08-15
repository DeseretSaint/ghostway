# Ghostway

**Navigate beyond surveillance.**

Ghostway is a free, open-source turn-by-turn navigation app that — by default —
routes you around known automated license plate reader (ALPR) cameras, including
Flock Safety's. Your drive stays yours.

> Mission: get people where they need to go without being logged by mass
> surveillance cameras.

## Why

ALPRs (Flock Safety and others) photograph every passing vehicle and log its
location, time, and identifying features, then share that data with thousands
of agencies — usually without a warrant. Ghostway uses the open
[DeFlock](https://deflock.org) camera map to keep you off those roads by
default. Flip one toggle to take the fastest route instead.

## Stack (100% open, no API keys, no account)

| Need          | Source                                            | License            |
|---------------|---------------------------------------------------|--------------------|
| Base map      | OpenStreetMap via [OpenFreeMap](https://openfreemap.org) | ODbL         |
| Camera data   | [DeFlock](https://deflock.org) (OSM + volunteers) | ODbL / CC-BY       |
| Search        | [Photon](https://photon.komoot.io) (OSM)          | ODbL / AGPL        |
| Routing       | [BRouter](https://brouter.de) (OSM)               | GPL                |
| Directions    | [OSRM](https://routing.openstreetmap.de) (OSM)    | BSD                |
| Map engine    | [MapLibre GL JS](https://maplibre.org)            | BSD-3              |

No proprietary tile servers, no telemetry, no tracking.

## How avoidance works

1. A baseline (fastest) route is computed by BRouter.
2. Every DeFlock camera within ~600 m of that route is pulled (Overpass, or the
   bundled snapshot as fallback).
3. The route is re-computed with each of those cameras as a "no-go" circle
   (250 m radius), capped at the 40 nearest so we stay within public-router
   limits. You see the detour, the cameras avoided, and the extra time/distance.
4. Turn-by-turn text comes from OSRM and matches the line you see.

If no clear detour exists, Ghostway shows the fastest route and tells you
honestly that cameras are on the way.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

Build a static, self-hostable bundle:

```bash
npm run build      # -> dist/
npm run preview
```

Optional: bundle a camera snapshot for offline/routing fallback:

```bash
npm run fetch-cameras   # writes public/cameras/cameras.geojson
```

## Installable PWA

Ghostway is a Progressive Web App. After `npm run build`, the `dist/` folder is
fully installable: add it to your phone's home screen and it runs like a native
app (standalone, no browser chrome). A service worker caches the app shell plus
map and camera tiles as you use them, so a previously viewed area still renders
offline. Routing and search need a connection to the open servers above.

To host it: serve the static `dist/` from any HTTPS origin (required for
geolocation and installability on mobile).


Open `src/config.js` and set `CONFIG.donate.methods` / `CONFIG.donate.crypto`
to your own Ko-fi, GitHub Sponsors, Liberapay, or wallet addresses. The donate
prompt is encouraged but never blocks the app.

## Privacy

Ghostway itself stores nothing about you. Searches and routes go to the public
open-source servers listed above — the same data any map needs to function.
There is no account and no analytics.

## License

GPL-3.0-or-later. Built to stay free.
