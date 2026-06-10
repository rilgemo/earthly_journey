'use strict';

/**
 * Lineage Snapshot
 *
 * Serializes a LineageHistory + lineageEngine into a portable JSON artifact.
 * Intended for future UI feeds, VSCode overlay, and external tooling.
 *
 * Pure IO wrapper — never computes lineage logic.
 */

const fs   = require('fs');
const path = require('path');

const SNAPSHOT_DIR = path.resolve(__dirname, '../../../docs/lineage');

/**
 * buildSnapshot(history, lineageEngine, agentIds, worldTick) → snapshot object
 *
 * Snapshot shape:
 * {
 *   world:     'earthly_journey',
 *   tick:      number,
 *   summary:   { totalAgents, maxGeneration, totalBirths, totalFamilies },
 *   generations: { [gen]: string[] },
 *   familyClusters: { [familyId]: string[] },
 *   timeline:  [{ tick, events }],
 *   agents:    [{ id, generation, familyId, fatherId, motherId, childrenIds, birthTick }]
 * }
 */
function buildSnapshot(history, lineageEngine, agentIds, worldTick) {
  const agents = (agentIds || [])
    .map(id => lineageEngine?.getRecord(id))
    .filter(Boolean)
    .map(rec => ({
      id:          rec.id,
      generation:  rec.generation,
      familyId:    rec.familyId,
      fatherId:    rec.fatherId,
      motherId:    rec.motherId,
      childrenIds: [...rec.childrenIds],
      birthTick:   rec.birthTick,
      parentIds:   [...rec.parentIds]
    }));

  return {
    world:          'earthly_journey',
    tick:           worldTick ?? null,
    summary:        history?.summary        ?? {},
    generations:    history?.generations    ?? {},
    familyClusters: history?.familyClusters ?? {},
    timeline:       history?.timeline       ?? [],
    agents
  };
}

/**
 * writeSnapshot(snapshot) → void
 *
 * Writes to:
 *   docs/lineage/latest.json
 *   docs/lineage/tick_XXXXXX.json
 *
 * Wrapped in try/catch — never throws.
 * Only call this when you have a real worldTick; otherwise skip.
 */
function writeSnapshot(snapshot) {
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

module.exports = { buildSnapshot, writeSnapshot, SNAPSHOT_DIR };
