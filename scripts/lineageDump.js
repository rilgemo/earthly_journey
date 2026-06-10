#!/usr/bin/env node
'use strict';

/**
 * Lineage Dump — debug CLI
 *
 * Reads docs/lineage/latest.json (written by lineageSnapshot.writeSnapshot)
 * and prints a human-readable world lineage report to stdout.
 *
 * Usage:
 *   node scripts/lineageDump.js [--format timeline|summary|tree|full]
 *
 * Alternatively, pipe a snapshot:
 *   cat docs/lineage/latest.json | node scripts/lineageDump.js
 *
 * Requires simulation to have run with:
 *   $env:EARTHLY_LINEAGE_SNAPSHOT="true"
 */

const fs   = require('fs');
const path = require('path');

const {
  formatTimeline,
  formatGenerationSummary,
  formatFullReport
} = require('../src/simulation/lineage/lineageFormatter');

const { createLineageEngine } = require('../src/simulation/lineageEngine');

const SNAPSHOT_PATH = path.resolve(__dirname, '../docs/lineage/latest.json');

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args   = process.argv.slice(2);
const fmtArg = args.find((_, i) => args[i - 1] === '--format') ?? 'full';
const FORMATS = ['timeline', 'summary', 'tree', 'full'];
const format  = FORMATS.includes(fmtArg) ? fmtArg : 'full';

// ─── read snapshot ────────────────────────────────────────────────────────────

function readSnapshot() {
  // Try file first, then stdin
  if (fs.existsSync(SNAPSHOT_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf-8'));
    } catch (err) {
      console.error(`[lineageDump] Failed to parse ${SNAPSHOT_PATH}: ${err.message}`);
      process.exit(1);
    }
  }

  console.error(
    '[lineageDump] No snapshot found.\n' +
    '  Run simulation with $env:EARTHLY_LINEAGE_SNAPSHOT="true"\n' +
    '  Expected: ' + SNAPSHOT_PATH
  );
  process.exit(1);
}

// ─── rebuild lineageEngine from snapshot ──────────────────────────────────────

function rebuildEngine(snapshot) {
  const engine = createLineageEngine();

  // Sort agents by generation so parents are registered before children
  const sorted = [...(snapshot.agents || [])].sort((a, b) => a.generation - b.generation);

  for (const rec of sorted) {
    if (rec.parentIds && rec.parentIds.length > 0) {
      // Register as newborn (uses registerBirth semantics, but engine won't
      // auto-update parents because those are already registered)
      engine.registerAgent({
        id: rec.id,
        lineage: {
          parentIds:   rec.parentIds,
          fatherId:    rec.fatherId,
          motherId:    rec.motherId,
          generation:  rec.generation,
          familyId:    rec.familyId,
          birthTick:   rec.birthTick
        }
      });
      // Manually link children to parents (snapshot already has final childrenIds)
      // We trust snapshot's childrenIds; engine will resolve relationships when queried.
    } else {
      engine.registerAgent({
        id: rec.id,
        lineage: {
          generation: rec.generation,
          familyId:   rec.familyId,
          birthTick:  rec.birthTick
        }
      });
    }
  }

  return engine;
}

// ─── build faux LineageHistory from snapshot ──────────────────────────────────

function historyFromSnapshot(snapshot) {
  return {
    timeline:       snapshot.timeline       || [],
    generations:    snapshot.generations    || {},
    familyClusters: snapshot.familyClusters || {},
    summary:        snapshot.summary        || {}
  };
}

// ─── main ────────────────────────────────────────────────────────────────────

function run() {
  const snapshot = readSnapshot();
  const history  = historyFromSnapshot(snapshot);
  const engine   = rebuildEngine(snapshot);

  // Collect gen-0 root ids for tree output
  const gen0ids = (snapshot.agents || [])
    .filter(a => a.generation === 0)
    .map(a => a.id);

  console.log(`[lineageDump] tick: ${snapshot.tick ?? '?'}  |  format: ${format}\n`);

  switch (format) {
    case 'timeline':
      process.stdout.write(formatTimeline(history));
      break;

    case 'summary':
      process.stdout.write(formatGenerationSummary(history));
      break;

    case 'tree':
      for (const rootId of gen0ids) {
        process.stdout.write(engine.printTree(rootId) + '\n');
      }
      break;

    case 'full':
    default:
      process.stdout.write(formatFullReport(history, engine, gen0ids));
      break;
  }
}

run();
