'use strict';

/**
 * traceRepeatSuccess.js — read-only diagnostic
 *
 * Prints repeat_success value and selected action for each agent across
 * ticks 1-5, to understand how the value accumulates and whether it decays.
 *
 * Usage: node src/simulation/scripts/traceRepeatSuccess.js
 */

const { createArea, world } = require('../worldField');
const { createNPC }         = require('../agentModel');
const { tickManager }       = require('../tickManager');
const { TraceCollector }    = require('../traceCollector');

const meadow = createArea('meadow', { fire: 0, water: 0, earth: 0.2, arcane: 0.05 });
const town   = createArea('town',   { fire: 0, water: 0, earth: 0,   arcane: 0.02 });
world.addArea(meadow);
world.addArea(town);

const npcs = [
  createNPC({ id: 'npc_1', location: 'meadow', skills: { farming: 20, lifeManipulation: 5 } }),
  createNPC({ id: 'npc_2', location: 'meadow', skills: { arcaneTheory: 20, arcaneManipulation: 15 } }),
  createNPC({ id: 'npc_3', location: 'town',   skills: { forging: 20, mining: 15, crafting: 5 } }),
];

const N = 5;
const tracer = new TraceCollector(500);

for (let t = 0; t < N; t++) {
  tickManager(npcs, world, tracer);
}

const all = tracer.getAll();

// Header
console.log('\ntick | agent  | repeat_success (influenceProfile) | selected action');
console.log('-----|--------|-----------------------------------|----------------');

for (const snap of all) {
  for (const agent of snap.agents) {
    const rs = agent.influenceProfile?.repeat_success ?? '(absent)';
    const action = agent.actionSelected ?? '(none)';
    console.log(
      `  ${String(snap.tickId).padEnd(3)} | ${agent.agentId.padEnd(6)} | ${String(rs).padEnd(35)} | ${action}`
    );
  }
}

// Also show memory shortTerm success entries at final tick
console.log('\n--- memory.shortTerm success entries at tick 5 (from agent runtime) ---');
for (const npc of npcs) {
  const successMems = (npc.memory?.shortTerm || []).filter(m => m.type === 'success');
  console.log(`\n${npc.id} — ${successMems.length} success memories:`);
  successMems.forEach(m => {
    console.log(`  tick:${m.tick}  action:${m.action}  strength:${m.strength}`);
  });
}
