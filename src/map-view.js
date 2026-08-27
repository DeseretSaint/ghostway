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
    this._waypointData = null;
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

    // Draggable waypoint handle (Workstream C: route preview editing).
    this._addSource('waypoint', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    this._addLayer({
      id: 'waypoint-halo',
      type: 'circle',
      source: 'waypoint',
      paint: { 'circle-radius': 14, 'circle-color': '#ffb454', 'circle-opacity': 0.22 },
    });
    this._addLayer({
      id: 'waypoint-dot',
      type: 'circle',
      source: 'waypoint',
      paint: {
        'circle-radius': 8,
        'circle-color': '#ffb454',
        'circle-stroke-width': 2.5,
        'circle-stroke-color': '#ffffff',
      },
    });
  }

  _onLoad() {
    this._addAppLayers();
    this._waypointDragHandlers = [];
    this._waypointTapHandlers = [];
    this._reportClickHandlers = [];
    this._wireWaypoint();
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
      this._wireWaypointLayer();
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
    this.setWaypoint(this._waypointData || null);
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

  // ---- Waypoint drag (Workstream C) ----
  setWaypoint(coords) {
    this._waypointData = coords;
    const src = this.map.getSource('waypoint');
    if (!src) return;
    src.setData({
      type: 'FeatureCollection',
      features: coords
        ? [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: coords } }]
        : [],
    });
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

  onWaypointDrag(handler) {
    this._waypointDragHandlers.push(handler);
  }

  onWaypointTap(handler) {
    this._waypointTapHandlers.push(handler);
  }

  _wireWaypoint() {
    this._wireWaypointLayer();
    if (this._wpGlobalWired) return;
    this._wpGlobalWired = true;

    const onMove = (e) => {
      if (!this._wpDragging) return;
      e.preventDefault();
      this._wpMoved = true;
      const c = e.lngLat ? [e.lngLat.lng, e.lngLat.lat] : null;
      if (c) this._waypointDragHandlers.forEach((h) => h(c, false));
    };
    this.map.on('mousemove', onMove);
    this.map.on('touchmove', onMove);

    const onUp = (e) => {
      if (!this._wpDragging) return;
      this._wpDragging = false;
      this.map.getCanvas().style.cursor = '';
      if (!this._wpMoved && this._wpDragStart) {
        // Treat as a tap on the waypoint handle.
        this._waypointTapHandlers.forEach((h) => h());
        return;
      }
      const c = e.lngLat ? [e.lngLat.lng, e.lngLat.lat] : null;
      if (c) this._waypointDragHandlers.forEach((h) => h(c, true));
    };
    this.map.on('mouseup', onUp);
    this.map.on('touchend', onUp);
  }

  // Layer-specific waypoint bindings (must be re-applied after a basemap
  // switch wipes the layers). Global move/up listeners live in _wireWaypoint.
  _wireWaypointLayer() {
    const LAYER = 'waypoint-dot';
    this.map.on('mousedown', LAYER, (e) => {
      e.preventDefault();
      this._wpDragging = true;
      this._wpMoved = false;
      this._wpDragStart = e.point;
      this.map.getCanvas().style.cursor = 'grabbing';
    });
    this.map.on('touchstart', LAYER, (e) => {
      if (e.points.length !== 1) return;
      e.preventDefault();
      this._wpDragging = true;
      this._wpMoved = false;
      this._wpDragStart = e.point;
    });
    this.map.on('mouseenter', LAYER, () => {
      if (!this._wpDragging) this.map.getCanvas().style.cursor = 'grab';
    });
    this.map.on('mouseleave', LAYER, () => {
      if (!this._wpDragging) this.map.getCanvas().style.cursor = '';
    });
  }

  setRoute(features) {
    this._routeData = features;
    const src = this.map.getSource('route');
    if (src) src.setData({ type: 'FeatureCollection', features });
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
    this.map.fitBounds(b, { padding: withRoute ? 80 : 50, maxZoom: 15, duration: 800 });
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
