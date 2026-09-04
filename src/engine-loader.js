// Lazy loader for the on-device routing engine.
//
// Why this file exists
// --------------------
// The engine (router.js + its A*/graph code) is ~half the production bundle
// (was 254 KB gz of a 254 KB gz main chunk before this loader). It's also
// pure infrastructure the user can't need until they hit "Calculate" — a user
// who just opens the map, browses cameras, and never routes shouldn't pay the
// parse-graph cost (or the JS parse cost) at boot.
//
// What this file does
// -------------------
// Exposes `loadEngine()` which:
//   1. Dynamic-imports `./router.js` so Vite emits it as its own chunk
//      (gated by the manualChunks rule in vite.config.js → "engine" chunk).
//   2. Caches the resolved namespace on the `app` object (single import per
//      session — second caller awaits the same promise, not a second import).
//   3. Publishes the namespace on `window.__gwRouter` for the speed-check
//      diagnostic (reads `getGraphStats`/`resetGraphStats` during a real route
//      in scripts/speed-check.mjs).
//   4. Returns the namespace, so call sites do:
//        const engine = await loadEngine(app);
//        await engine.loadGraph(lon, lat);
//        const { options } = await engine.planRoutes(from, to, opts);
//
// Invariants preserved (test contract)
// -------------------------------------
// - `__ghostwayEngine` still flips to "ready" / "failed" — set inside
//   main.js's `ensureLocalEngine` exactly as before, after the lazy import
//   resolves and loadGraph completes. The 13 puppeteer suites that wait on
//   `window.__ghostwayEngine === "ready"` keep working because they only
//   observe the flag AFTER kicking off a route (which triggers the lazy
//   import + loadGraph) — never at boot.
// - First-route UX is unchanged: `routeWithFallbacks` awaits
//   `loadEngine(app)` before calling `loadGraph`, so the chunk fetch +
//   parse are sequential with the graph download (both fire under the
//   splash's "Routing…" status).
//
// Why a wrapper instead of inlining `await import('./router.js')` everywhere
// -------------------------------------------------------------------------
// Centralizes the cache, the `__gwRouter` exposure, and the failure message.
// Every call site stays a one-liner (`const engine = await loadEngine(app)`)
// instead of duplicating the caching pattern.
export async function loadEngine(app) {
  if (app && app._engine && app._engine.loadGraph) return app._engine;
  if (app && app._engineLoading) return app._engineLoading;
  const loader = (async () => {
    try {
      const engine = await import('./router.js');
      if (app) {
        app._engine = engine;
        // speed-check.mjs (CDP-throttled download probe) reads these from the
        // page to verify ≥3 download progress events fired during graph load.
        // The exposure is diagnostic only — no production code touches it.
        window.__gwRouter = {
          loadGraph: engine.loadGraph,
          planRoutes: engine.planRoutes,
          regionCovers: engine.regionCovers,
          graphStatus: engine.graphStatus,
          endpointsConnected: engine.endpointsConnected,
          getGraphStats: engine.getGraphStats,
          resetGraphStats: engine.resetGraphStats,
        };
      }
      return engine;
    } catch (e) {
      console.warn('engine chunk failed to load', e);
      // Surface the failure to the same UI path as a graph-load error so the
      // user sees one consistent "Routing failed" recovery message.
      window.__ghostwayEngine = 'failed';
      throw e;
    }
  })();
  if (app) app._engineLoading = loader;
  const engine = await loader;
  if (app) {
    app._engineLoading = null;
    return app._engine;
  }
  return engine;
}
