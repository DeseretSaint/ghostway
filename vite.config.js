import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { host: true, port: 5173 },
  build: {
    target: 'es2020',
    outDir: 'dist',
    // Belt-and-braces: Vite already splits dynamic imports into their own
    // chunks, but naming them explicitly makes the bundle-size check
    // (scripts/bundle-size-check.mjs) deterministic — it can grep for the
    // 'engine-' prefix rather than scanning chunk names for heuristic matches.
    //
    // engine: src/router.js + its transitive imports (loaded via
    //   dynamic import() in src/engine-loader.js on first route calc).
    // engine-region: tiny sync bbox check (src/engine-region.js).
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/src/router.js')) return 'engine';
          if (id.includes('/src/engine-region.js')) return 'engine-region';
        },
      },
    },
    chunkSizeWarningLimit: 600, // engine chunk is ~300 KB raw, well under 500
  },
});
