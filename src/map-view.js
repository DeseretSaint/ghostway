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
      // Neutral default view (CONFIG.mapCenter). main.js jumps to the user's
      // cached location right after map ready, so this only flashes on a true
      // first launch with no saved position.
      center: CONFIG.mapCenter.center,
      zoom: CONFIG.mapCenter.zoom,
      attributionControl: false,
      maxPitch: 60,
    });
    this.map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    this.routeSource = null;
    this.camSourceReady = false;
    this._clickHandlers = [];
    this._userLayerReady = false;
    this._basemap = 'standard';
    this._wpGlobalWired = false;
    this._wpDragging = false;
    this._wpMoved = false;
    this._wpDragStart = null;
    this._routeData = null;
    this._endpointData = null;
    this._reports = null;
    this._incidents = null;
    this._userPos = null;
    this._userHeading = null;
    this._camVisible = true;

    this.map.on('load', () => this._onLoad());
  }

  // Idempotent source/layer insertion — setStyle() diffs the new base style
  // and may keep or drop our custom layers, so re-adding must never throw.
  _addSource(id, def) {
    const s = this.map;
    if (!s.getSource(id)) s.addSource(id, def);
  }
  _addLayer(def) {
    const s = this.map;
    if (!s.getLayer(def.id)) s.addLayer(def);
  }

  _addAppLayers() {
    // Camera vector tiles.
    this._addSource(CAMERA_LAYER.sourceId, {
      type: 'vector',
      tiles: [CONFIG.cameraTileUrl],
      minzoom: 0,
      maxzoom: 14,
    });

    // Heatmap (visible when zoomed out) — density of cameras.
    this._addLayer({
      id: CAMERA_LAYER.heatId,
      type: 'heatmap',
      source: CAMERA_LAYER.sourceId,
      'source-layer': CAMERA_LAYER.layer,
      maxzoom: 13,
      paint: {
        'heatmap-weight': 1,
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 9, 1, 13, 3],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 9, 14, 13, 34],
        // Crossfade out as individual camera dots take over (circle minzoom 11):
        // full density through z10.5, gone by z12.5 — no mid-zoom blob noise.
        'heatmap-opacity': [
          'interpolate', ['linear'], ['zoom'],
          9, 0.75, 10.5, 0.75, 11.5, 0.35, 12.5, 0,
        ],
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
    this._addLayer({
      id: CAMERA_LAYER.layerId,
      type: 'circle',
      source: CAMERA_LAYER.sourceId,
      'source-layer': CAMERA_LAYER.layer,
      minzoom: 11,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 4, 14, 7],
        // Red = ALPR risk (plate-reader brand or traffic-facing camera),
        // amber = other surveillance. Matches isAlprCamera() in config.js.
        'circle-color': [
          'case',
          [
            'any',
            ['==', ['get', 'surveillanceZone'], 'traffic'],
            ['in', 'flock', ['downcase', ['to-string', ['get', 'brand']]]],
            ['in', 'rekor', ['downcase', ['to-string', ['get', 'brand']]]],
            ['in', 'platesmart', ['downcase', ['to-string', ['get', 'brand']]]],
            ['in', 'motorola', ['downcase', ['to-string', ['get', 'brand']]]],
            ['in', 'genetec', ['downcase', ['to-string', ['get', 'brand']]]],
            ['in', 'leonardo', ['downcase', ['to-string', ['get', 'brand']]]],
          ],
          '#ff4d6d',
          '#ffaa40',
        ],
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#0b0f17',
        'circle-opacity': 0.95,
      },
    });

    // Route line source/layers.
    this._addSource('route', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    // Drop shadow under the whole route (depth on light/satellite basemaps).
    this._addLayer({
      id: 'route-shadow',
      type: 'line',
      source: 'route',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#0a0f1a',
        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 11, 16, 16],
        'line-opacity': 0.32,
      },
    });
    // White casing so the colored route reads on any basemap (Maps parity).
    this._addLayer({
      id: 'route-casing',
      type: 'line',
      source: 'route',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#ffffff',
        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 8, 16, 13],
        'line-opacity': 0.92,
      },
    });
    this._addLayer({
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
    this._addSource('endpoints', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    this._addLayer({
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
  }

  _onLoad() {
    this._addAppLayers();
    this._reportClickHandlers = [];
    this.camSourceReady = true;
    this._wireCameraClicks();
    this._readyResolve && this._readyResolve();
  }

  getBasemap() { return this._basemap; }

  // Custom zoom buttons (Maps-parity look) drive the map directly.
  zoomIn() { this.map.zoomIn(); }
  zoomOut() { this.map.zoomOut(); }

  // Compass support (Maps parity): the UI draws a live north needle from the
  // camera orientation; tapping it resets to north-up + flat.
  getBearing() { return this.map.getBearing(); }
  getPitch() { return this.map.getPitch(); }
  resetNorth() {
    this.map.easeTo({ bearing: 0, pitch: 0, duration: 450 });
  }
  onCameraChange(handler) {
    this.map.on('rotate', handler);
    this.map.on('pitch', handler);
  }

  // Switch the base style. map.setStyle() wipes ALL custom sources/layers, so
  // on the resulting 'style.load' we rebuild them and replay last-known data.
  setBasemap(key) {
    const url = CONFIG.basemaps && CONFIG.basemaps[key];
    if (!url || this._basemap === key) return;
    this._basemap = key;
    let rebuilt = false;
    const rebuild = () => {
      if (rebuilt) return;
      rebuilt = true;
      this._addAppLayers();
      this._wireCameraClicks();
      this._reapplyData();
    };
    // diff: false — MapLibre's default style-diff path silently REMOVES our
    // custom sources/layers (they're absent from the new base style) and never
    // fires 'style.load', so the rebuild handler below would never run and the
    // route/camera/endpoint layers would stay wiped. Force a full style swap,
    // which always fires 'style.load'.
    this.map.setStyle(url, { diff: false });
    this.map.once('style.load', rebuild);
  }

  _reapplyData() {
    this.setRoute(this._routeData || []);
    this.setEndpoints(this._endpointData || []);
    if (this._reports) this.setReports(this._reports);
    if (this._incidents) this.setIncidents(this._incidents);
    if (this._userPos) this.setUserPosition(this._userPos, this._userHeading);
    this.setCameraLayerVisible(this._camVisible !== false);
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

  // Community camera reports layer (distinct styling from known cameras).
  setReports(features) {
    this._reports = features;
    const src = this.map.getSource('reports');
    if (src) {
      src.setData({ type: 'FeatureCollection', features });
      return;
    }
    this._addSource('reports', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features },
    });
    this._addLayer({
      id: 'reports-dots',
      type: 'circle',
      source: 'reports',
      minzoom: 10,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 5, 14, 8],
        'circle-color': '#c77dff',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#0b0f17',
      },
    });
    this.map.on('click', 'reports-dots', (e) => {
      const f = e.features && e.features[0];
      if (f) this._reportClickHandlers.forEach((h) => h(f.properties, f.geometry.coordinates));
    });
    this.map.on('mouseenter', 'reports-dots', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', 'reports-dots', () => {
      this.map.getCanvas().style.cursor = '';
    });
  }

  onReportClick(handler) {
    this._reportClickHandlers.push(handler);
  }

  // Tap an alternative route line → select that option (index carried on the
  // feature's optIndex property, set by drawEngineRoutes in main.js). When
  // multiple route lines overlap at the tap point, prefer the one that is NOT
  // already chosen — that's the alternative the user is trying to pick.
  onRouteLineClick(handler) {
    if (this._routeLineWired) return;
    this._routeLineWired = true;
    this.map.on('click', 'route-line', (e) => {
      const fs = (e.features || []).filter((f) => f.properties && f.properties.optIndex != null);
      if (!fs.length) return;
      const chosen = window.__gw && window.__gw.state ? window.__gw.state.chosen : -1;
      const alt = fs.find((f) => f.properties.optIndex !== chosen) || fs[0];
      handler(alt.properties.optIndex);
    });
  }


  setRoute(features) {
    this._routeData = features;
    const src = this.map.getSource('route');
    if (src) src.setData({ type: 'FeatureCollection', features });
    // Route-proximity camera emphasis: when a route is shown, dim camera
    // markers that are NOT near the route line so the map agrees with the
    // route card's camera count ("0 cameras" must not look like 2 cameras
    // ON the road). Near-route markers keep full opacity; others fade.
    this._applyCameraRouteFilter(features);
    // Re-run the proximity pass as the viewport changes (projections shift).
    if (!this._camMoveHooked) {
      this._camMoveHooked = true;
      this.map.on('moveend', () => {
        if (this._routeData && this._routeData.length) {
          this._applyCameraRouteFilter(this._routeData);
        }
      });
    }
  }

  // Compute a screen-accurate proximity test using MapLibre's queryRendered
  // geometry: project route coords to screen px and check each rendered
  // camera point against a 24 px corridor (~matches the router's ~30 m
  // exposure corridor at typical street zooms). Cheap and projection-safe.
  _applyCameraRouteFilter(features) {
    const hasRoute = Array.isArray(features) && features.length > 0;
    if (!this.map.getLayer(CAMERA_LAYER.layerId)) return;
    if (!hasRoute) {
      this.map.setPaintProperty(CAMERA_LAYER.layerId, 'circle-opacity', 0.95);
      return;
    }
    try {
      // Collect route screen points.
      const pts = [];
      for (const f of features) {
        const g = f.geometry;
        const ring = g.type === 'LineString' ? g.coordinates
          : (g.type === 'MultiLineString' ? g.coordinates.flat() : []);
        for (const [lon, lat] of ring) {
          const p = this.map.project([lon, lat]);
          pts.push([p.x, p.y]);
        }
      }
      if (!pts.length) return;
      // Which rendered camera pixels fall INSIDE the route corridor?
      const r = 24; // px corridor ≈ the visual width that reads as "passing it"
      const near = this.map.queryRenderedFeatures(pts.map((p) => [
        [p[0] - r, p[1] - r], [p[0] + r, p[1] + r],
      ]).flat(), { layers: [CAMERA_LAYER.layerId] });
      const nearKeys = new Set(
        near.map((f) => `${f.geometry.coordinates[0]},${f.geometry.coordinates[1]}`)
      );
      const all = this.map.queryRenderedFeatures(undefined, {
        layers: [CAMERA_LAYER.layerId],
      });
      this._camNearKeys = nearKeys;
      this._renderNearRouteCameras(near, all.length);
    } catch { /* projection not ready — leave markers as-is */ }
  }

  _renderNearRouteCameras(nearFeats, totalOnScreen) {
    const near = {
      type: 'FeatureCollection',
      features: (nearFeats || []).map((f) => ({
        type: 'Feature',
        properties: f.properties,
        geometry: f.geometry,
      })),
    };
    if (!this.map.getSource('cam-near-route')) {
      this._addSource('cam-near-route', {
        type: 'geojson', data: near,
      });
      this._addLayer({
        id: 'cam-near-route-dots',
        type: 'circle',
        source: 'cam-near-route',
        minzoom: 11,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 5, 14, 9],
          'circle-color': '#ff4d6d',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#0b0f17',
        },
      });
    } else {
      this.map.getSource('cam-near-route').setData(near);
    }
    const hasRoute = !!(this._routeData && this._routeData.length);
    // With a route active: base camera dots fade to 22% (ambient surveillance
    // context), and ONLY near-route cameras render bright in the overlay —
    // the map then visually matches the route card's camera count.
    this.map.setPaintProperty(
      CAMERA_LAYER.layerId, 'circle-opacity', hasRoute ? 0.22 : 0.95,
    );
  }

  // Show/hide the camera heatmap + points (Workstream D: layer toggle).
  setCameraLayerVisible(on) {
    this._camVisible = on;
    if (!this.camSourceReady) return;
    const v = on ? 'visible' : 'none';
    const heat = this.map.getLayer(CAMERA_LAYER.heatId);
    const pts = this.map.getLayer(CAMERA_LAYER.layerId);
    if (heat) this.map.setLayoutProperty(CAMERA_LAYER.heatId, 'visibility', v);
    if (pts) this.map.setLayoutProperty(CAMERA_LAYER.layerId, 'visibility', v);
  }

  // Live traffic incident markers from UDOT (Workstream B).
  setIncidents(events) {
    this._incidents = events;
    const feats = (events || []).map((ev) => ({
      type: 'Feature',
      properties: { severity: ev.severity, label: ev.label || ev.category, road: ev.road || '' },
      geometry: { type: 'Point', coordinates: [ev.lon, ev.lat] },
    }));
    const src = this.map.getSource('incidents');
    if (src) {
      src.setData({ type: 'FeatureCollection', features: feats });
      return;
    }
    this._addSource('incidents', { type: 'geojson', data: { type: 'FeatureCollection', features: feats } });
    this._addLayer({
      id: 'incident-halos',
      type: 'circle',
      source: 'incidents',
      minzoom: 9,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 5, 14, 12],
        'circle-color': [
          'match', ['get', 'severity'],
          'closure', '#ff3355',
          'emergency', '#ff5533',
          'incident', '#ff7744',
          'lane', '#ffaa40',
          'roadwork', '#ffd05c',
          '#8fa0b8',
        ],
        'circle-opacity': 0.28,
      },
    });
    this._addLayer({
      id: 'incident-dots',
      type: 'circle',
      source: 'incidents',
      minzoom: 10.5,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 10.5, 3.5, 14, 6],
        'circle-color': [
          'match', ['get', 'severity'],
          'closure', '#ff3355',
          'emergency', '#ff5533',
          'incident', '#ff7744',
          'lane', '#ffaa40',
          'roadwork', '#ffd05c',
          '#8fa0b8',
        ],
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#0b0f17',
      },
    });
  }

  setEndpoints(features) {
    this._endpointData = features;
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
    let padding = withRoute ? 80 : 50;
    if (withRoute) {
      // The route card is a bottom sheet (max-height 52vh): with uniform
      // padding the route — and the draggable waypoint handle at its midpoint —
      // can land UNDER the panel, unreachable on phone viewports (390×844).
      // Fit into the visible area ABOVE the panel instead (Google-Maps pattern).
      const panel = document.getElementById('panel');
      if (panel && !panel.hidden && panel.offsetHeight > 0) {
        const ch = this.map.getContainer().clientHeight || 600;
        const bottom = Math.min(panel.offsetHeight + 40, Math.round(ch * 0.6));
        padding = { top: 80, right: 50, bottom, left: 50 };
      }
    }
    this.map.fitBounds(b, { padding, maxZoom: 15, duration: 800 });
  }

  flyTo(coords, zoom) {
    this.map.flyTo({ center: coords, zoom: zoom ?? this.map.getZoom(), duration: 700 });
  }

  // ---- Follow mode (Workstream C): bearing-rotated driving camera ----
  _ensureUserLayer() {
    if (this._userLayerReady) return;
    this._addSource('user-pos', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    this._addLayer({
      id: 'user-halo',
      type: 'circle',
      source: 'user-pos',
      paint: { 'circle-radius': 16, 'circle-color': '#3ad6c5', 'circle-opacity': 0.18 },
    });
    this._addLayer({
      id: 'user-dot',
      type: 'circle',
      source: 'user-pos',
      paint: {
        'circle-radius': 7,
        'circle-color': '#3ad6c5',
        'circle-stroke-width': 2.5,
        'circle-stroke-color': '#ffffff',
      },
    });
    this._userLayerReady = true;
  }

  setUserPosition(coords, headingDeg) {
    this._userPos = coords;
    this._userHeading = headingDeg;
    this._ensureUserLayer();
    const src = this.map.getSource('user-pos');
    if (src) {
      src.setData({
        type: 'FeatureCollection',
        features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: coords } }],
      });
    }
  }

  // Smoothly follow the user: rotate to heading, pitch for driving, keep them
  // centered in the lower third so the road ahead is visible.
  followUser(coords, headingDeg, zoom = 16.5) {
    this._ensureUserLayer();
    this.setUserPosition(coords, headingDeg);
    const h = this.map.getContainer().clientHeight;
    this.map.easeTo({
      center: coords,
      zoom,
      bearing: -headingDeg, // map rotates so heading points up
      pitch: 55,
      padding: { top: h * 0.28, bottom: 0, left: 0, right: 0 },
      duration: 900,
      easing: (t) => t * (2 - t), // ease-out
    });
  }

  // Exit follow mode: level the camera, no rotation, restore padding.
  unfollow() {
    this.map.easeTo({ bearing: 0, pitch: 0, padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: 600 });
  }

  // Notify when the user manually moves the map (pan / rotate / zoom). Used to
  // pause follow mode until they tap recenter. Programmatic camera moves
  // (easeTo/flyTo) also fire these events but WITHOUT an originalEvent, so we
  // filter those out.
  onUserPan(handler) {
    const wrap = (e) => {
      if (e && e.originalEvent) handler();
    };
    this.map.on('dragstart', wrap);
    this.map.on('rotatestart', wrap);
    this.map.on('zoomstart', wrap);
  }

  getCenter() {
    const c = this.map.getCenter();
    return [c.lng, c.lat];
  }
}
