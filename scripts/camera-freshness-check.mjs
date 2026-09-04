// Camera freshness guard (monthly data-safety check).
//
// Reads engine/data/cameras-usa.geojson, derives the snapshot date from the
// best available signal (top-level asOf → _meta.asOf → file mtime), and
// asserts the data is at most FRESH_MAX_DAYS old. Also verifies the
// graph-refresh.yml workflow is wired (cron schedule + fetch-cameras.mjs).
//
// The upstream dump (cameras-usa.geojson) has no embedded asOf — it is a
// raw DeFlock export (type + features only). The SHIPPED fallback
// (public/cameras/cameras.geojson) gets _meta.asOf from fetch-cameras.mjs,
// and both files are written in the same CI run, so either file's mtime is
// a reliable freshness proxy when metadata is absent.
//
// Usage: node scripts/camera-freshness-check.mjs
// Exit 0 = PASS, exit 1 = FAIL (stale data or miswired CI).

import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FRESH_MAX_DAYS = 7;
const FRESH_MAX_MS = FRESH_MAX_DAYS * 24 * 60 * 60 * 1000;

const CAM_ENGINE = join(ROOT, 'engine', 'data', 'cameras-usa.geojson');
const CAM_SHIPPED = join(ROOT, 'public', 'cameras', 'cameras.geojson');
const REFRESH_YML = join(ROOT, '.github', 'workflows', 'graph-refresh.yml');

function fail(msg) {
  console.error('FAIL:', msg);
  process.exit(1);
}

function pass(msg) {
  console.log('PASS:', msg);
}

// ---- (a) derive asOf from cameras-usa.geojson ----
function deriveSnapshotDate() {
  let asOf = null;
  let source = null;

  // 1) Try the engine dump directly.
  try {
    const stat = statSync(CAM_ENGINE);
    const raw = readFileSync(CAM_ENGINE, 'utf8');
    const data = JSON.parse(raw);
    if (data.asOf) {
      asOf = new Date(data.asOf);
      source = 'engine/data/cameras-usa.geojson (top-level asOf)';
    } else if (data._meta && data._meta.asOf) {
      asOf = new Date(data._meta.asOf);
      source = 'engine/data/cameras-usa.geojson (_meta.asOf)';
    } else {
      // No embedded timestamp → use file mtime (CI writes this file fresh).
      asOf = new Date(stat.mtimeMs);
      source = 'engine/data/cameras-usa.geojson (file mtime)';
    }
  } catch (e) {
    console.warn('Could not read engine dump:', e.message);
  }

  // 2) Cross-check against the shipped fallback (has _meta.asOf).
  try {
    const raw = readFileSync(CAM_SHIPPED, 'utf8');
    const data = JSON.parse(raw);
    if (data._meta && data._meta.asOf) {
      const shipped = new Date(data._meta.asOf);
      if (!asOf) {
        asOf = shipped;
        source = 'public/cameras/cameras.geojson (_meta.asOf)';
      } else if (Math.abs(shipped.getTime() - asOf.getTime()) > 24 * 60 * 60 * 1000) {
        // Disagreement >1 day between engine dump and shipped fallback.
        console.warn(
          `  warn: engine asOf ${asOf.toISOString()} vs shipped ${shipped.toISOString()} (>1d gap)`,
        );
      }
    }
  } catch (e) {
    console.warn('Could not read shipped fallback:', e.message);
  }

  if (!asOf || isNaN(asOf.getTime())) {
    fail('Could not derive snapshot timestamp from any source.');
  }

  return { asOf, source };
}

// ---- (c) verify graph-refresh.yml wiring ----
function verifyWorkflowWiring() {
  let yml;
  try {
    yml = readFileSync(REFRESH_YML, 'utf8');
  } catch (e) {
    fail(`Cannot read graph-refresh.yml: ${e.message}`);
  }

  // Must have a cron trigger.
  if (!/cron:\s*'[^']*'/.test(yml)) {
    fail('graph-refresh.yml missing cron schedule trigger.');
  }

  // Must call fetch-cameras.mjs (either directly or via npm run fetch-cameras).
  if (!/fetch-cameras\.mjs|npm\s+run\s+fetch-cameras/.test(yml)) {
    fail('graph-refresh.yml does not invoke fetch-cameras.mjs.');
  }

  pass('graph-refresh.yml has cron trigger + fetch-cameras.mjs call.');
}

// ---- main ----
console.log('=== Camera Freshness Check ===');

const { asOf, source } = deriveSnapshotDate();
const now = new Date();
const ageMs = now.getTime() - asOf.getTime();
const ageDays = (ageMs / (24 * 60 * 60 * 1000)).toFixed(1);

console.log(`  snapshot date: ${asOf.toISOString()} (via ${source})`);
console.log(`  age: ${ageDays} days (max ${FRESH_MAX_DAYS})`);

if (ageMs > FRESH_MAX_MS) {
  fail(
    `Camera data is ${ageDays} days old — exceeds ${FRESH_MAX_DAYS}-day window. ` +
      `graph-refresh.yml (2nd of month) may have failed silently. ` +
      `Run: node scripts/fetch-cameras.mjs && node engine/build-graph.mjs`,
  );
}

pass(`Snapshot is ${ageDays} days old (≤${FRESH_MAX_DAYS}d window).`);

// ---- CI wiring check ----
verifyWorkflowWiring();

console.log('');
console.log('ALL CHECKS PASSED');
