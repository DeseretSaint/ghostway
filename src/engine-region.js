// Tiny shared helper — does a (lon, lat) point fall inside any shipped
// engine region's coverage bbox?
//
// Lives outside router.js so the sync `engineCovers` check in main.js does
// NOT have to wait on the lazy engine chunk to be fetched. The chunk loads
// only when the user actually triggers a route calc (loadGraph + planRoutes).
//
// router.js imports `regionCovers` from here too — keeps a single source of
// truth for the coverage boxes (CONFIG.engineRegions).
import { CONFIG } from './config.js';

function inBox(lon, lat, [w, s, e, n]) {
  return lon >= w && lon <= e && lat >= s && lat <= n;
}

export function regionCovers(lon, lat) {
  return CONFIG.engineRegions.some((r) => inBox(lon, lat, r.bbox));
}
