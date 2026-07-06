// CP-5: Unattended Presence (G5)
// Proves: a Commitment receives ZERO protection under sustained zero-Intent
// input -- World Validation continues to run and can BREAK it, identically
// to the IPS case, with no code path distinguishing "presence" at all.

const { createWorldState } = require('./WorldState');
const { createAgentState } = require('./AgentState');
const { injectIntent } = require('./IntentBuffer');
const { worldExecute } = require('./WorldExecute');

const worldState = createWorldState();
worldState.agents.set('player_A', createAgentState('player_A', { x: 0, y: 0 }));
worldState.agents.set('npc_B',    createAgentState('npc_B',    { x: 1, y: 0 }));

injectIntent(worldState, 'player_A', { domain: 'ATTENTION', type: 'OBSERVE' });
worldExecute(worldState);

const commitment = [...worldState.commitments][0];
commitment.required_conditions.add({ id: 'npc_left_range', check: () => false });

console.log('tick0 commitment status:', commitment.status);

for (let t = 1; t <= 20; t++) {
  worldExecute(worldState);
}

const broken_events = worldState.trace_log.filter(e => e.event_type === 'COMMITMENT_BROKEN');

console.log('final commitment status:', commitment.status);
console.log('broken event count (must be exactly 1):', broken_events.length);
console.log('failure_reason:', broken_events[0]?.failure_reason ?? null);
console.log('final trace_log length after 21 ticks:', worldState.trace_log.length);
console.log('commitments count (must still be 1):', worldState.commitments.size);

const fs = require('fs');
const kernelFiles = ['WorldExecute.js', 'Commitment.js', 'AgentState.js', 'IntentBuffer.js', 'WorldState.js'];
const forbidden = /online|connected|presence|gateway/i;
const violations = kernelFiles.filter(f => forbidden.test(fs.readFileSync(f, 'utf8')));

console.log('files referencing connectivity concepts (must be empty):', violations);
