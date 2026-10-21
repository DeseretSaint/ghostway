# Ghostway Codebase Map

Single reference for what lives where and who should read what.
**Read only your scope.** Loading modules outside it wastes tokens and is the failure mode this map exists to prevent.

Repo: `/home/deseretcore/projects/ghostway` (origin `github.com/DeseretSaint/ghostway`, branch `main`). Version `1.0.0`.

## Layout (top level)

| Path | What it is | Read by |
|---|---|---|
| `index.html` | PWA shell; onboarding dialog `#onboarding`; markup for map + controls | designer, coder (small) |
| `src/main.js` | App entry, bootstrapping (~100KB — **targeted reads only**, never whole) | coder |
| `src/router.js` | Route engine: camera-avoidance, route building, "Clear means clear" logic | coder |
| `src/routing.js` | Routing orchestration / request handling | coder |
| `src/engine-loader.js`, `src/engine-region.js` | Engine bootstrap + region data | coder |
| `src/valhalla.js` | Valhalla routing provider client | coder |
| `src/camera-store.js`, `src/camera-tiles.js` | Camera data store + tile rendering | coder |
| `src/traffic.js` | Traffic layer | coder (rare) |
| `src/config.js` | Config/feature flags | coder, designer |
| `src/map-view.js` | Map rendering/pan/zoom | coder, designer (visual) |
| `src/ui.js` | UI state, panels, modals | designer, coder |
| `src/nav-bridge.js` | Feeds NavState to Android Auto (the AA bridge) | coder |
| `src/search.js`, `src/share.js`, `src/reports.js`, `src/voice.js`, `src/calendar.js`, `src/icons.js`, `src/pwa.js`, `src/utils.js` | Feature modules | coder as needed |
| `src/styles.css` | All styling | designer |
| `src/data/dot-feeds.js` | DOT/work-zone feed registry | coder |
| `data-archive/flock-cameras-latest.tsv.gz` | Monthly Flock camera snapshot archive | coder |
| `engine/` | Build/analysis scripts: `build-graph.mjs` (Wasatch graph), `extract-osm.mjs`, `prepare-roads.mjs`, `fetch-wzdx.mjs`, `analyze-cameras.mjs` | coder |
| `scripts/` | Verification battery (`engine-check`, `avoidance-audit*`, `engine-e2e`, `dot-feeds-check`, `apk-webview-a11y-check`, …) | coder (run), fire (grade) |
| `android/app/src/main/java/app/ghostway/` | `MainActivity.java` (WebView host), `GhostwayCarAppService.java` (AA templates), `NavState.java` | coder |
| `android/app/src/main/res/values/aa_hosts.xml`, `xml/automotive_app_desc.xml` | AA host + app declarations | coder |
| `android/app/src/main/AndroidManifest.xml` | Manifest | coder |
| `docs/android-auto-setup.md` | Sideload + AA dev-mode protocol | coder, fire |
| `docs/valhalla-docker.md` | Local Valhalla setup | coder |
| `GHOSTWAY-LOOP.md` | Ledger (~590KB — **tail/search only, never whole**) | all (brief) |
| `GHOSTWAY-ROUTE-GOAL.md`, `GHOSTWAY-UX-GOAL.md` | Goal docs | coder / designer |
| `knowledge/` | Canon copy (UI/UX digests, playbook, coding practice, design gates) | designer, fire |
| `.github/workflows/` | `tests.yml`, `android-apk.yml`, `deploy.yml` (Pages), `camera-refresh.yml`, `flock-archive.yml`, `graph-refresh.yml`, `wzdx-national-refresh.yml` | coder |
| `dist/`, `public/` | Built output + static assets (public/graph = deployed graph tiles) | coder (verify) |
| `FINDINGS`, `VERIFY-SWEEP-2026-09-05.md` | Historical audit records | fire when grading |

## Lane scope

### gw-coder (engineering) — read this, skip the rest
- `src/router.js`, `src/routing.js`, `src/engine-loader.js`, `src/engine-region.js`, `src/valhalla.js`
- `src/camera-store.js`, `src/camera-tiles.js`, `src/nav-bridge.js`, `src/config.js`, `src/data/dot-feeds.js`
- `engine/` build scripts; `data-archive/flock-cameras-latest.tsv.gz`
- `scripts/` — the battery you run (listed in your SOUL)
- `android/app/src/main/java/app/ghostway/*` + `AndroidManifest.xml` + `res/values/aa_hosts.xml` + `res/xml/automotive_app_desc.xml`
- `.github/workflows/` (CI), `docs/android-auto-setup.md`, `docs/valhalla-docker.md`
- **Never whole:** `src/main.js`, `GHOSTWAY-LOOP.md`. **Not yours:** `src/ui.js`, `src/styles.css`, `index.html` (read only to wire the spec), `knowledge/`.

### gw-designer (UX/copy) — read this, skip the rest
- `index.html` (onboarding `#onboarding`, surface structure), `src/ui.js`, `src/styles.css`, `src/config.js` (flags), `src/map-view.js` (visual only)
- `knowledge/` canon — cite the section/Q-line for every recommendation
- `GHOSTWAY-UX-GOAL.md`, `docs/release-ux-spec-20261020.md` (your spec)
- **Never:** engine/router internals, `engine/`, `scripts/` battery sources, Android code, `dist/`.

### gw-fire (verification) — read this, skip the rest
- The artifact under grade + its evidence (hashes, command outputs) — nothing else
- `docs/release-ux-spec-20261020.md` (blind, artifact only)
- The acceptance criteria from the card/brief
- Pre-release checklist: version, tag, artifacts (`SHA256SUMS`), live parity
- **Never:** whole source modules, `GHOSTWAY-LOOP.md` (tail only if needed for provenance).

## Data currency map (coder)
- Cameras: `scripts/fetch-cameras.mjs` + `flock-archive.yml` -> `data-archive/flock-cameras-latest.tsv.gz` (monthly snapshot; date in evidence).
- Graph: `engine/build-graph.mjs` rebuild if cameras changed -> `public/graph`; live graph sha256 must be byte-identical after deploy.
- Work zones: `engine/fetch-wzdx.mjs` (national, daily CI) + `src/data/dot-feeds.js` registry -> `dot-feeds-check.mjs` (>=3 states).

## Verification battery (coder runs; fire grades)
`npm run build` · `engine-check.mjs` · snap-dist-check · `avoidance-audit.mjs` + `avoidance-audit-random.mjs` (FRESH seed) · `engine-e2e.mjs` (ERRORS []) · interact-check · overflow-check · `dot-feeds-check.mjs` · `apk-webview-a11y-check.mjs`.

---
Written by Sophia 2026-10-20. Update this map when the layout changes — it is the scope contract for the fleet.
