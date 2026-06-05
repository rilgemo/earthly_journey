const { createArea, world } = require('./worldField');
const { createNPC } = require('./agentModel');
const { tickManager } = require('./tickManager');
const { TraceCollector } = require('./traceCollector');

// setup
const meadow = createArea('meadow', { fire: 0, water: 0, earth: 0.2, arcane: 0.05 });
const town = createArea('town', { fire: 0, water: 0, earth: 0, arcane: 0.02 });
world.addArea(meadow);
world.addArea(town);

const npcs = [
  createNPC({ id: 'npc_1', role: 'farmer', location: 'meadow' }),
  createNPC({ id: 'npc_2', role: 'mage', location: 'meadow' }),
  createNPC({ id: 'npc_3', role: 'blacksmith', location: 'town' })
];

console.log('Starting simulation tick loop (v1)');
const tracer = new TraceCollector(500);
for (let t=0;t<20;t++) {
  const log = tickManager(npcs, world, tracer);
  const latest = tracer.getLatest();
  console.log('Tick', t, JSON.stringify(log));
  if (latest) {
    console.log('Trace Tick', latest.tickId, 'agents:', latest.agents.map(a=>({id:a.agentId, action:a.actionSelected, total: a.scoreBreakdown ? a.scoreBreakdown.total : null}))); 
  }
}

console.log('Final world fields:', {
  meadow: world.getField('meadow'),
  town: world.getField('town')
});
