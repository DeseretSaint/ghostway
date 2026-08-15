import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CONFIG, CAMERA_LAYER } from './config.js';

// Wraps MapLibre GL, the OpenFreeMap base style, and the DeFlock camera
// vector tiles. Exposes simple methods the rest of the app drives.

export class MapView {
  constructor(container) {
    this.map = new maplibregl.Map({
      container,
      style: CONFIG.mapStyle,
      center: [-111.7646, 40.3778],
      zoom: 11.5,
      attributionControl: false,
      maxPitch: 0,
    });
    this.map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    this.map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    this.routeSource = null;
    this.camSourceReady = false;
    this._clickHandlers = [];

    this.map.on('load', () => this._onLoad());
  }

  _onLoad() {
    // Camera vector tiles.
    this.map.addSource(CAMERA_LAYER.sourceId, {
      type: 'vector',
      tiles: [CONFIG.cameraTileUrl],
      minzoom: 0,
      maxzoom: 14,
    });

    // Heatmap (visible when zoomed out) — density of cameras.
    this.map.addLayer({
      id: CAMERA_LAYER.heatId,
      type: 'heatmap',
      source: CAMERA_LAYER.sourceId,
      'source-layer': CAMERA_LAYER.layer,
      maxzoom: 13,
      paint: {
        'heatmap-weight': 1,
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 9, 1, 13, 3],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 9, 14, 13, 34],
        'heatmap-opacity': 0.75,
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(0,0,0,0)',
          0.2, 'rgba(58,214,197,0.35)',
          0.5, 'rgba(58,214,197,0.6)',
          0.85, 'rgba(255,170,64,0.8)',
          1, 'rgba(255,77,109,0.95)',
        ],
      },
    });

    // Camera points (visible when zoomed in).
    this.map.addLayer({
      id: CAMERA_LAYER.layerId,
      type: 'circle',
      source: CAMERA_LAYER.sourceId,
      'source-layer': CAMERA_LAYER.layer,
      minzoom: 11,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 4, 14, 7],
        'circle-color': [
          'case',
          ['==', ['get', CAMERA_LAYER.brandKey], 'Flock Safety'], '#ff4d6d',
          '#ffaa40',
        ],
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#0b0f17',
        'circle-opacity': 0.95,
      },
    });

    // Route line source/layers.
    this.map.addSource('route', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    this.map.addLayer({
      id: 'route-glow',
      type: 'line',
      source: 'route',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#0a2a3a', 'line-width': 12, 'line-opacity': 0.5 },
    });
    this.map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 4, 16, 8],
      },
    });

    // Route endpoint markers source.
    this.map.addSource('endpoints', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    this.map.addLayer({
      id: 'endpoint-dots',
      type: 'circle',
      source: 'endpoints',
      paint: {
        'circle-radius': 7,
        'circle-color': ['get', 'color'],
        'circle-stroke-width': 2.5,
        'circle-stroke-color': '#ffffff',
      },
    });

    this.camSourceReady = true;
    this._wireCameraClicks();
    this._readyResolve && this._readyResolve();
  }

  ready() {
    if (this.camSourceReady) return Promise.resolve();
    return new Promise((res) => (this._readyResolve = res));
  }

  _wireCameraClicks() {
    const onCam = (e) => {
      const f = this.map.queryRenderedFeatures(e.point, { layers: [CAMERA_LAYER.layerId] });
      if (f.length) {
        const p = f[0].properties;
        this._clickHandlers.forEach((h) => h(p, f[0].geometry.coordinates));
      }
    };
    this.map.on('click', CAMERA_LAYER.layerId, onCam);
    this.map.on('mouseenter', CAMERA_LAYER.layerId, () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', CAMERA_LAYER.layerId, () => {
      this.map.getCanvas().style.cursor = '';
    });
  }

  onCameraClick(handler) {
    this._clickHandlers.push(handler);
  }

  setRoute(features) {
    const src = this.map.getSource('route');
    if (src) src.setData({ type: 'FeatureCollection', features });
  }

  setEndpoints(features) {
    const src = this.map.getSource('endpoints');
    if (src) src.setData({ type: 'FeatureCollection', features });
  }

  fitTo(coords, withRoute = false) {
    if (!coords.length) return;
    if (coords.length === 1) {
      this.map.flyTo({ center: coords[0], zoom: 14 });
      return;
    }
    const b = new maplibregl.LngLatBounds();
    coords.forEach((c) => b.extend(c));
    this.map.fitBounds(b, { padding: withRoute ? 80 : 50, maxZoom: 15, duration: 800 });
  }

  flyTo(coords, zoom) {
    this.map.flyTo({ center: coords, zoom: zoom ?? this.map.getZoom(), duration: 700 });
  }

  getCenter() {
    const c = this.map.getCenter();
    return [c.lng, c.lat];
  }
}
