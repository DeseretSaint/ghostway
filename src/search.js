import { CONFIG } from './config.js';

// Geocoding via Photon (OpenStreetMap). Forward search + reverse geocode.

export async function searchPlaces(query, limit = 6) {
  if (!query || query.trim().length < 2) return [];
  const url = `${CONFIG.photon}?q=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('search failed');
  const j = await res.json();
  return (j.features || []).map((f) => {
    const p = f.properties;
    const name = [p.name, p.housenumber ? p.street : p.street]
      .filter(Boolean)
      .join(', ');
    const region = [p.city || p.town || p.village, p.state, p.country]
      .filter(Boolean)
      .join(', ');
    return {
      name: p.name || p.street || p.city || query,
      subtitle: [name, region].filter(Boolean).join(' · ') || p.osm_value,
      coords: [f.geometry.coordinates[0], f.geometry.coordinates[1]],
      raw: p,
    };
  });
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
