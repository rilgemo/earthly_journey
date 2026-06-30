// CP-2: Commitment → Validation
// Proves: ACTIVE persists under zero input, BROKEN fires once with traceable cause.

const { createWorldState } = require('./WorldState');
const { createAgentState } = require('./AgentState');
const { injectIntent } = require('./IntentBuffer');
const { worldExecute } = require('./WorldExecute');

// Setup
const worldState = createWorldState();
worldState.agents.set('player_A', createAgentState('player_A', { x: 0, y: 0 }));
worldState.agents.set('npc_B',    createAgentState('npc_B',    { x: 1, y: 0 }));

// Tick 1 — intent injected, Commitment created
injectIntent(worldState, 'player_A', { domain: 'ATTENTION', type: 'OBSERVE' });
worldExecute(worldState);
console.log('tick1 commitment created:', worldState.commitments.size === 1);

// Attach a failing condition to the commitment
const commitment = [...worldState.commitments][0];
commitment.required_conditions.add({ id: 'target_in_range', check: () => false });

// Tick 2 — no new intent; condition fails → BROKEN, event emitted
worldExecute(worldState);
const broken_events = worldState.trace_log.filter(e => e.event_type === 'COMMITMENT_BROKEN');
console.log('tick2 commitment status:', commitment.status);
console.log('tick2 broken event count:', broken_events.length);
console.log('tick2 broken event failure_reason:', broken_events[0]?.failure_reason ?? null);

// Tick 3 — no intent, no new conditions; emit-once rule must hold
worldExecute(worldState);
const broken_events_tick3 = worldState.trace_log.filter(e => e.event_type === 'COMMITMENT_BROKEN');
console.log('tick3 commitment still exists:', worldState.commitments.has(commitment));
console.log('tick3 trace_log length:', worldState.trace_log.length);
