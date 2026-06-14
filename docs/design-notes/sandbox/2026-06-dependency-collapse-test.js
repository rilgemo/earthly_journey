'use strict';

/**
 * 2026-06-dependency-collapse-test.js — read-only diagnostic
 *
 * L1.5 Dependency Collapse Test
 *
 * Runs N ticks four times. Each run zeros out one score channel
 * (memory / influence / demand) by wrapping intentScorer after scoring.
 * Does NOT permanently modify intentPipeline or any core module.
 *
 * Usage:
 *   node docs/design-notes/sandbox/2026-06-dependency-collapse-test.js
 *
 * Output:
 *   baseline:     meditate=X, selected=Y
 *   no_memory:    meditate=X, selected=Y
 *   no_influence: meditate=X, selected=Y
 *   no_demand:    meditate=X, selected=Y
 */

const { createArea, world } = require('../../../src/simulation/worldField');
const { createNPC }         = require('../../../src/simulation/agentModel');
const { tickManager }       = require('../../../src/simulation/tickManager');
const { TraceCollector }    = require('../../../src/simulation/traceCollector');

const N_TICKS = 20;
const AGENT_ID = 'npc_1';

// --- channel zeroing patch applied after scoreIntents ---
// We wrap tickManager per run and intercept agent traces.

function buildWorld() {
  // Each run gets a fresh world + fresh NPCs to ensure identical starting state.
  // worldField is a singleton, so we create a temporary world object inline.
  const { world: freshWorld } = (() => {
    // Re-require to get a clean world per run is not possible with require cache.
    // Instead, reset tick and areas manually.
    world.tick = 0;
    world.demandIndex = {};
    world.demandHistory = [];
    world.stabilityGains = undefined;
    world.stabilityHistory = [];
    world.emergenceHistory = {};
    world.fieldPerturbationQueue = [];
    world.lineageEngine = undefined;
    world.lastDebugTick = undefined;
    world.lastActionDistribution = undefined;
    if (!world.areas) world.areas = new Map();
    world.areas.clear();

    const meadow = createArea('meadow', { fire: 0, water: 0, earth: 0.2, arcane: 0.05 });
    world.addArea(meadow);
    return { world };
  })();
  return freshWorld;
}

function buildNPCs() {
  return [
    createNPC({ id: AGENT_ID, location: 'meadow', skills: { arcaneTheory: 20, arcaneManipulation: 15 } }),
  ];
}

/**
 * Run the simulation for N_TICKS. After each tick, read the agent trace
 * for AGENT_ID and optionally zero out one component from candidateIntents.
 *
 * zeroChannel: null | 'memoryScore' | 'influenceScore' | 'demandScore'
 */
function runExperiment(label, zeroChannel) {
  const w = buildWorld();
  const npcs = buildNPCs();
  const tracer = new TraceCollector(N_TICKS + 5);

  let lastMeditateScore = null;
  let lastSelected = null;

  for (let t = 0; t < N_TICKS; t++) {
    tickManager(npcs, w, tracer);

    const snap = tracer.getLatest();
    const agentSnap = snap.agents.find(a => a.agentId === AGENT_ID);
    if (!agentSnap) continue;

    // If zeroing a channel, recalculate the effective score for meditate
    // from the stored component breakdown (read-only — does not affect selection).
    const candidates = agentSnap.candidateIntents || [];
    const meditate = candidates.find(c => c.intent === 'meditate');

    if (meditate) {
      let effectiveScore = meditate.score;
      if (zeroChannel && meditate.components) {
        effectiveScore -= (meditate.components[zeroChannel] || 0);
      }
      lastMeditateScore = effectiveScore;
    }

    lastSelected = agentSnap.actionSelected;
  }

  return { label, meditateScore: lastMeditateScore, selected: lastSelected };
}

const results = [
  runExperiment('baseline',     null),
  runExperiment('no_memory',    'memoryScore'),
  runExperiment('no_influence', 'influenceScore'),
  runExperiment('no_demand',    'demandScore'),
];

console.log('\n=== L1.5 Dependency Collapse Test (tick 20) ===\n');
const baseline = results[0].meditateScore || 0;
for (const r of results) {
  const score = r.meditateScore !== null ? r.meditateScore.toFixed(2) : 'n/a';
  const delta = r.meditateScore !== null && r.label !== 'baseline'
    ? ` (delta=${(r.meditateScore - baseline).toFixed(2)})`
    : '';
  console.log(`  ${r.label.padEnd(14)}: meditate=${score}${delta},  selected=${r.selected}`);
}

console.log('\nPrediction: influence OFF → largest drop');
console.log('Status: run this script to validate or refute the hypothesis.\n');
