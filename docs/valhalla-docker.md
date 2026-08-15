# Self-hosted Valhalla for Ghostway (optional, Workstream A.4)

Ghostway ships with a three-tier routing stack:

1. **Own camera-aware graph** (Wasatch Front) — on-device A*, ~100 ms, no network.
2. **Valhalla** — national coverage + camera avoidance via `exclude_locations`.
   Default endpoint: `https://valhalla1.openstreetmap.de` (key-free, CORS-open,
   but rate-limited and capped at ~50 exclude points).
3. **Legacy** BRouter + OSRM (flaky, last resort).

Running your own Valhalla removes rate limits, removes the demo-server
dependency, and raises the exclude-locations cap (configurable to hundreds).
Valhalla is MIT-licensed.

## Requirements

- Docker (not currently installed on Keaton's Mac)
- Disk: ~2 GB for the Utah extract, ~40 GB for full North America.
  (Check `df -h /` first — the build host had only ~2.3 GB free at evaluation
  time, which is why this stays optional.)
- RAM: 2 GB minimum, 8 GB comfortable.

## Run it

```bash
# One-time: fetch + build the Utah tile set (~20 min, ~2 GB)
docker run -d --name valhalla \
  -p 8002:8002 \
  -v valhalla-data:/custom_files \
  -e tile_urls=https://download.geofabrik.de/north-america/us/utah-latest.osm.pbf \
  ghcr.io/gis-ops/valhalla/valhalla:latest
```

First boot builds the tile set; subsequent boots start in seconds. Verify:

```bash
curl -s http://localhost:8002/route \
  -H 'Content-Type: application/json' \
  -d '{"locations":[{"lat":40.364,"lon":-111.759},{"lat":40.394,"lon":-111.834}],"costing":"auto"}' | head -c 200
```

Then expose it on Tailscale (the Mac is already reachable at
`100.101.147.65`) and point Ghostway at it:

```js
// src/config.js
valhallaUrl: 'http://100.101.147.65:8002',
```

That's it — the app auto-uses it; no other code changes. (For HTTPS/phone
access outside the Tailscale network, serve behind a reverse proxy with
`Access-Control-Allow-Origin: *`.)

## Evaluation findings (2026-08-15)

- Public demo (`valhalla1.openstreetmap.de`): works, CORS `*`, real maneuvers,
  `exclude_locations` verified to change routes (46.5 km → 56.8 km detour on a
  Denver→Boulder test). Server accepts up to ~50 exclude points (60 → 400).
- `avoid_locations` (costing_options) is silently ignored by the demo — use
  top-level `exclude_locations`.
- Valhalla polyline decoder gotcha: standard decoder starts `result = 0` with
  `|=` accumulation. The common `result = 1` / `+=` variant corrupts the
  zigzag sign bit and mirrors geometry (caught by the Denver→Boulder test).
