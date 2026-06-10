'use strict';

/**
 * Narrative Snapshot
 *
 * Serializes the narrativeMemory window into a portable JSON artifact.
 * Intended for replay, VSCode overlay, and external tooling.
 *
 * Pure IO wrapper — never computes narrative logic.
 * Only writes when EARTHLY_NARRATIVE_SNAPSHOT=true.
 */

const fs   = require('fs');
const path = require('path');

const SNAPSHOT_DIR = path.resolve(__dirname, '../../../docs/narrative');

/**
 * buildNarrativeSnapshot(memory, worldTick) → snapshot object
 *
 * {
 *   world:    'earthly_journey',
 *   tick:     number,
 *   stats:    { tickCount, totalBirths, totalDeaths, totalViolations, maxGeneration },
 *   outputs:  NarrativeOutput[]  (all entries in window)
 * }
 */
function buildNarrativeSnapshot(memory, worldTick) {
  if (!memory) {
    return { world: 'earthly_journey', tick: worldTick ?? null, stats: {}, outputs: [] };
  }

  return {
    world:   'earthly_journey',
    tick:    worldTick ?? null,
    stats:   memory.stats(),
    outputs: memory.all()
  };
}

/**
 * writeNarrativeSnapshot(snapshot) → void
 *
 * Writes:
 *   docs/narrative/latest.json
 *   docs/narrative/tick_XXXXXX.json   (immutable per-tick record)
 *
 * Wrapped in try/catch — never throws.
 */
function writeNarrativeSnapshot(snapshot) {
  try {
    if (!fs.existsSync(SNAPSHOT_DIR)) {
      fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
    }

    const json       = JSON.stringify(snapshot, null, 2);
    const latestPath = path.join(SNAPSHOT_DIR, 'latest.json');
    fs.writeFileSync(latestPath, json, 'utf-8');

    if (typeof snapshot.tick === 'number') {
      const tickPath = path.join(
        SNAPSHOT_DIR,
        `tick_${String(snapshot.tick).padStart(6, '0')}.json`
      );
      fs.writeFileSync(tickPath, json, 'utf-8');
    }
  } catch (_) {
    // Snapshot writes must never crash the simulation
  }
}

module.exports = { buildNarrativeSnapshot, writeNarrativeSnapshot, SNAPSHOT_DIR };
