// CP-3: Execution → Trace (M.O.B 1 + M.O.B 4)
// M.O.B 1: Focus shift produces measurable state delta.
// M.O.B 4: Trace records raw events without value mutation.

const { createWorldState } = require('./WorldState');
const { createAgentState } = require('./AgentState');
const { injectIntent } = require('./IntentBuffer');
const { worldExecute } = require('./WorldExecute');

// Setup
const worldState = createWorldState();
worldState.agents.set('player_A', createAgentState('player_A', { x: 0, y: 0 }));
worldState.agents.set('npc_B',    createAgentState('npc_B',    { x: 1, y: 0 }));

// Initialize focus_map for player_A (starting domain: LOCOMOTION)
worldState.focus_map.set('player_A', { active_domain: 'LOCOMOTION', active_type: 'IDLE' });

// Tick 1 — shift focus from LOCOMOTION to ATTENTION
injectIntent(worldState, 'player_A', { domain: 'ATTENTION', type: 'OBSERVE' });
worldExecute(worldState);

// Basic trace results
const focus_after = worldState.focus_map.get('player_A');
console.log('tick1 focus domain after:', focus_after.active_domain);
console.log('tick1 trace_log length:', worldState.trace_log.length);
console.log('tick1 trace event types:', worldState.trace_log.map(e => e.event_type).join(', '));

// M.O.B 1 — measurable state delta: old_domain ≠ new_domain in FOCUS_CHANGED event
const focus_event = worldState.trace_log.find(e => e.event_type === 'FOCUS_CHANGED');
console.log('old snapshot domain in FOCUS_CHANGED event:', focus_event?.old_domain ?? null);
console.log('new domain in FOCUS_CHANGED event:', focus_event?.new_domain ?? null);

// M.O.B 4 — no delta_value field on any trace entry
const has_delta_value = worldState.trace_log.some(e => 'delta_value' in e);
console.log('any delta_value field found:', has_delta_value);
