import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';

// Baked at build time: the in-app update check compares this commit against
// the android-latest release's build marker (appended by android-apk.yml).
let commit = 'dev';
try { commit = execSync('git rev-parse --short HEAD').toString().trim(); } catch { /* tarball builds */ }

export default defineConfig({
  base: './',
  define: {
    __GW_COMMIT__: JSON.stringify(commit),
    __GW_BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
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
