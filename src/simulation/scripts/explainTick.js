'use strict';

/**
 * explainTick.js — read-only diagnostic
 *
 * Runs the standard simulation scenario for N ticks and prints the full
 * decision breakdown for every agent at tick N and tick N-1, so we can
 * design the Decision Observatory display format based on real data shapes.
 *
 * Usage: node src/simulation/scripts/explainTick.js
 */

const { createArea, world } = require('../worldField');
const { createNPC }         = require('../agentModel');
const { tickManager }       = require('../tickManager');
const { TraceCollector }    = require('../traceCollector');

// ── Same scenario as run_simulation.js ───────────────────────────────────────
const meadow = createArea('meadow', { fire: 0, water: 0, earth: 0.2, arcane: 0.05 });
const town   = createArea('town',   { fire: 0, water: 0, earth: 0,   arcane: 0.02 });
world.addArea(meadow);
world.addArea(town);

const npcs = [
  createNPC({ id: 'npc_1', location: 'meadow', skills: { farming: 20, lifeManipulation: 5 } }),
  createNPC({ id: 'npc_2', location: 'meadow', skills: { arcaneTheory: 20, arcaneManipulation: 15 } }),
  createNPC({ id: 'npc_3', location: 'town',   skills: { forging: 20, mining: 15, crafting: 5 } }),
];

const N = 5; // run N ticks; we'll inspect tick N and N-1
const tracer = new TraceCollector(500);

for (let t = 0; t < N; t++) {
  tickManager(npcs, world, tracer);
}

// ── Pull the last two snapshots ───────────────────────────────────────────────
const all    = tracer.getAll();
const tickN  = all[all.length - 1];
const tickN1 = all[all.length - 2];

// ── Formatting helpers ────────────────────────────────────────────────────────
function sep(label) {
  const bar = '─'.repeat(70);
  console.log(`\n${bar}`);
  console.log(label);
  console.log(bar);
}

function printAgentBreakdown(agentTrace, tickLabel) {
  const id = agentTrace.agentId;
  sep(`${tickLabel}  ·  agent: ${id}  (${agentTrace.agentType || '?'})`);

  // needProfile
  console.log('\n▸ needProfile:');
  console.log(JSON.stringify(agentTrace.needProfile, null, 2));

  // influenceProfile
  console.log('\n▸ influenceProfile:');
  console.log(JSON.stringify(agentTrace.influenceProfile, null, 2));

  // candidateIntents — full components as-is
  console.log('\n▸ candidateIntents:');
  if (!agentTrace.candidateIntents || agentTrace.candidateIntents.length === 0) {
    console.log('  (none)');
  } else {
    agentTrace.candidateIntents.forEach((c, i) => {
      console.log(`\n  [${i}] intent: ${c.intent}   score: ${c.score}`);
      console.log('       components:', JSON.stringify(c.components, null, 4)
        .replace(/^/gm, '       ')   // indent every line
        .trim());
      if (c.reasonTrace) {
        console.log('       reasonTrace:', JSON.stringify(c.reasonTrace, null, 4)
          .replace(/^/gm, '       ')
          .trim());
      }
    });
  }

  // resolutionTrace
  console.log('\n▸ resolutionTrace:');
  if (!agentTrace.resolutionTrace) {
    console.log('  (none)');
  } else {
    const rt = agentTrace.resolutionTrace;
    console.log(`  selected: ${rt.selectedAction}`);
    console.log('  reasonTrace:', JSON.stringify(rt.reasonTrace, null, 4)
      .replace(/^/gm, '  ')
      .trim());
    if (rt.rejectedIntents && rt.rejectedIntents.length > 0) {
      console.log('  rejectedIntents:');
      rt.rejectedIntents.forEach(r => {
        console.log(`    - ${r.action}: ${r.reason}`);
      });
    }
  }
}

function explainSnapshot(snapshot, label) {
  if (!snapshot) { console.log(`\n(no snapshot for ${label})`); return; }
  const tickLabel = `TICK ${snapshot.tickId ?? '?'}  [${label}]`;
  (snapshot.agents || []).forEach(agent => printAgentBreakdown(agent, tickLabel));
}

// ── Print ─────────────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(70)}`);
console.log(`explainTick — N=${N} ticks, inspecting final two ticks`);
console.log(`${'═'.repeat(70)}`);

explainSnapshot(tickN1, 'N-1');
explainSnapshot(tickN,  'N  ');

console.log(`\n${'═'.repeat(70)}`);
console.log('Done.');
