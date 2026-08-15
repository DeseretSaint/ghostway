import { CONFIG } from './config.js';
import { haversine } from './utils.js';

// Geocoding via Photon (OpenStreetMap). Forward search + reverse geocode.
// Results are sorted by distance from the user's location when provided, so the
// closest match surfaces first.

export async function searchPlaces(query, limit = 6, near = null) {
  if (!query || query.trim().length < 2) return [];
  // Location-biased search: pass lat/lon to Photon so relevance favors the
  // user's area (fixes "Costco" returning Palm Desert/Bismarck/Tulsa), and
  // fetch a wider candidate pool so a nearby match isn't squeezed out of the
  // global top-N. Client-side distance sort still applies as a second pass.
  const bias = near ? `&lat=${near[1]}&lon=${near[0]}` : '';
  const pool = Math.max(limit * 3, 15);
  const url = `${CONFIG.photon}?q=${encodeURIComponent(query)}&limit=${pool}${bias}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('search failed');
  const j = await res.json();
  let places = (j.features || []).map((f) => {
    const p = f.properties;
    const name = [p.name, p.housenumber ? p.street : p.street]
      .filter(Boolean)
      .join(', ');
    const region = [p.city || p.town || p.village, p.state, p.country]
      .filter(Boolean)
      .join(', ');
    const coords = [f.geometry.coordinates[0], f.geometry.coordinates[1]];
    return {
      name: p.name || p.street || p.city || query,
      subtitle: [name, region].filter(Boolean).join(' · ') || p.osm_value,
      coords,
      raw: p,
    };
  });

  if (near && places.length > 1) {
    places = places
      .map((pl) => ({ ...pl, _d: haversine(near, pl.coords) }))
      .sort((a, b) => a._d - b._d);
  }
  return places.slice(0, limit);
}

export async function reverseGeocode(coords) {
  const url = `${CONFIG.photon}/reverse?lat=${coords[1]}&lon=${coords[0]}`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const j = await res.json();
    const f = j.features && j.features[0];
    if (!f) return null;
    const p = f.properties;
    return [p.name || p.street || p.city, [p.city || p.town, p.state].filter(Boolean).join(', ')]
      .filter(Boolean)
      .join(', ');
  } catch (_) {
    return null;
  }
}
