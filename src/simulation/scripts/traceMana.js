'use strict';

/**
 * traceMana.js — read-only diagnostic
 *
 * Prints mana.current (before/after tick) and manaNeed for each agent
 * across ticks 1-5.
 *
 * Usage: node src/simulation/scripts/traceMana.js
 */

const { createArea, world } = require('../worldField');
const { createNPC }         = require('../agentModel');
const { tickManager }       = require('../tickManager');
const { TraceCollector }    = require('../traceCollector');
const { getNeedProfile }    = require('../needSystem');

const meadow = createArea('meadow', { fire: 0, water: 0, earth: 0.2, arcane: 0.05 });
const town   = createArea('town',   { fire: 0, water: 0, earth: 0,   arcane: 0.02 });
world.addArea(meadow);
world.addArea(town);

const npcs = [
  createNPC({ id: 'npc_1', location: 'meadow', skills: { farming: 20, lifeManipulation: 5 } }),
  createNPC({ id: 'npc_2', location: 'meadow', skills: { arcaneTheory: 20, arcaneManipulation: 15 } }),
  createNPC({ id: 'npc_3', location: 'town',   skills: { forging: 20, mining: 15, crafting: 5 } }),
];

// Print initial state
console.log('\n--- Initial state (before any tick) ---');
for (const npc of npcs) {
  const need = getNeedProfile(npc);
  console.log(`${npc.id}: mana.current=${npc.mana.current.toFixed(4)}  mana.capacity=${npc.mana.capacity}  needs.manaNeed=${npc.needs.manaNeed}  computed manaNeed=${need.manaNeed.toFixed(4)}`);
}

const N = 5;
const tracer = new TraceCollector(500);
const rows = [];

for (let t = 0; t < N; t++) {
  // Snapshot mana BEFORE tick
  const before = {};
  for (const npc of npcs) {
    before[npc.id] = npc.mana.current;
  }

  tickManager(npcs, world, tracer);

  const snap = tracer.getLatest();
  for (const agent of snap.agents) {
    const npc = npcs.find(n => n.id === agent.agentId);
    const manaAfter = npc.mana.current;
    rows.push({
      tick: snap.tickId,
      agent: agent.agentId,
      manaBefore: before[agent.agentId],
      manaAfter,
      manaNeed: agent.needProfile.manaNeed,
      action: agent.actionSelected,
      manaChange: agent.manaAfter?.current - agent.manaBefore?.current
    });
  }
}

// Table
console.log('\ntick | agent  | mana before | mana after | delta  | manaNeed | action');
console.log('-----|--------|-------------|------------|--------|----------|-------');
for (const r of rows) {
  const delta = (r.manaAfter - r.manaBefore).toFixed(4);
  console.log(
    `  ${String(r.tick).padEnd(3)} | ${r.agent.padEnd(6)} | ${r.manaBefore.toFixed(4).padEnd(11)} | ${r.manaAfter.toFixed(4).padEnd(10)} | ${delta.padStart(6)} | ${String(r.manaNeed).padEnd(8)} | ${r.action}`
  );
}

// Also show the manaNeed formula inputs at final tick
console.log('\n--- Final tick manaNeed formula inputs ---');
for (const npc of npcs) {
  const cap  = npc.mana.capacity;
  const cur  = npc.mana.current;
  const formulaValue = 1 - (cur / cap);
  const scaled = formulaValue <= 1 ? formulaValue * 100 : formulaValue;
  const clamped = Math.max(0, Math.min(100, scaled));
  const storedManaNeed = npc.needs?.manaNeed;
  console.log(`${npc.id}: mana.current=${cur.toFixed(4)} cap=${cap} | 1-(cur/cap)=${formulaValue.toFixed(4)} → scaled=${scaled.toFixed(4)} → manaNeed=${clamped.toFixed(4)} | stored needs.manaNeed=${storedManaNeed}`);
}
