#!/usr/bin/env node
'use strict';

/**
 * CI Graph Diff — git hook entry point
 *
 * Usage:
 *   node scripts/ci-graph-diff.js [--from <tick>] [--to <tick>] [--threshold <0-1>]
 *
 * Exit codes:
 *   0 — PASS (drift within threshold, no blocking violations)
 *   1 — FAIL (drift exceeds threshold or CAUSAL_REVERSAL / LAYER_DRIFT detected)
 *
 * As a pre-commit hook (.husky/pre-commit or .git/hooks/pre-commit):
 *   node scripts/ci-graph-diff.js
 */

const fs   = require('fs');
const path = require('path');
const { compareGraphs } = require('../src/simulation/architecture-ci/ciGraphDiffEngine');

const GRAPH_DIR       = path.resolve(__dirname, '../docs/ci/graph');
const DEFAULT_THRESHOLD = 0.6;

// ─── CLI arg parsing ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let fromTick  = null;
let toTick    = null;
let threshold = DEFAULT_THRESHOLD;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--from'      && args[i + 1]) { fromTick  = parseInt(args[++i], 10); }
  if (args[i] === '--to'        && args[i + 1]) { toTick    = parseInt(args[++i], 10); }
  if (args[i] === '--threshold' && args[i + 1]) { threshold = parseFloat(args[++i]); }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function readIR(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function tickFile(tick) {
  return path.join(GRAPH_DIR, `tick_${String(tick).padStart(6, '0')}.json`);
}

function latestTickFiles() {
  if (!fs.existsSync(GRAPH_DIR)) return [];
  return fs.readdirSync(GRAPH_DIR)
    .filter(f => /^tick_\d+\.json$/.test(f))
    .sort()
    .map(f => path.join(GRAPH_DIR, f));
}

// ─── resolve prev + next IR ──────────────────────────────────────────────────

function resolveIRPair() {
  if (fromTick !== null && toTick !== null) {
    return [readIR(tickFile(fromTick)), readIR(tickFile(toTick))];
  }

  // default: last two tick snapshots
  const files = latestTickFiles();
  if (files.length < 2) return [null, null];
  return [readIR(files[files.length - 2]), readIR(files[files.length - 1])];
}

// ─── main ────────────────────────────────────────────────────────────────────

function run() {
  const [prevIR, nextIR] = resolveIRPair();

  if (!prevIR || !nextIR) {
    console.log('[CI DIFF] Not enough tick snapshots to compare — skipping.');
    process.exit(0);
  }

  let diff;
  try {
    diff = compareGraphs(prevIR, nextIR);
  } catch (err) {
    console.error('[CI DIFF] Engine error:', err.message);
    process.exit(1);
  }

  // ─── report ────────────────────────────────────────────────────────────────
  console.log(`[CI DIFF] tick ${diff.fromTick} → tick ${diff.toTick}`);
  console.log(`  causalDriftScore : ${diff.causalDriftScore}`);
  console.log(`  nodes added      : ${diff.nodeDiff.added.length}`);
  console.log(`  nodes removed    : ${diff.nodeDiff.removed.length}`);
  console.log(`  layer changes    : ${diff.nodeDiff.layerChanged.length}`);
  console.log(`  edges added      : ${diff.edgeDiff.added.length}`);
  console.log(`  edges removed    : ${diff.edgeDiff.removed.length}`);
  console.log(`  reversals        : ${diff.edgeDiff.reversed.length}`);

  if (diff.violations.length > 0) {
    console.log('\n  violations:');
    for (const v of diff.violations) {
      console.log(`    [${v.type}] ${v.reason}`);
    }
  }

  // ─── guard rules ───────────────────────────────────────────────────────────
  const hasReversal   = diff.violations.some(v => v.type === 'CAUSAL_REVERSAL');
  const hasLayerDrift = diff.violations.some(v => v.type === 'LAYER_DRIFT');
  const highDrift     = diff.causalDriftScore > threshold;

  if (hasReversal || hasLayerDrift || highDrift) {
    console.error('\n[CI DIFF] FAIL — commit blocked');
    if (hasReversal)   console.error('  reason: CAUSAL_REVERSAL detected');
    if (hasLayerDrift) console.error('  reason: LAYER_DRIFT detected');
    if (highDrift)     console.error(`  reason: drift score ${diff.causalDriftScore} > threshold ${threshold}`);
    process.exit(1);
  }

  console.log('\n[CI DIFF] PASS');
  process.exit(0);
}

run();
