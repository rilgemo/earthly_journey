// Human Review Runner — First Contact Loop
// Pure observation output. No assertions, no pass/fail.

const { createWorldState } = require('./WorldState');
const { createAgentState } = require('./AgentState');
const { injectIntent } = require('./IntentBuffer');
const { worldExecute } = require('./WorldExecute');

const worldState = createWorldState();

const player_A = createAgentState('player_A', { x: 0, y: 0 });
const npc_B    = createAgentState('npc_B',    { x: 1, y: 0 });

worldState.focus_map.set('player_A', { active_domain: 'LOCOMOTION', active_type: 'IDLE' });

worldState.agents.set('player_A', player_A);
worldState.agents.set('npc_B',    npc_B);

function printTick(n) {
  const agent = worldState.agents.get('player_A');
  const focus = worldState.focus_map.get('player_A') ?? { active_domain: null, active_type: null };
  const commitments = [...worldState.commitments];
  const last_commitment = commitments[commitments.length - 1];
  const events_this_tick = worldState.trace_log.filter(e => e.timestamp === worldState._currentTick);

  console.log(`--- Tick ${n} ---`);
  console.log(`agent: player_A | posture: ${agent.posture_state} | focus: ${focus.active_domain}/${focus.active_type}`);
  console.log(`intent_buffer: ${agent.intent_buffer}`);
  console.log(`commitments: ${commitments.length} | status: ${last_commitment ? last_commitment.status : 'none'}`);
  console.log(`trace events this tick: ${events_this_tick.map(e => e.event_type).join(', ')}`);
  console.log('');
}

// Tick 1 — intent injected, focus shift + commitment created
injectIntent(worldState, 'player_A', { domain: 'ATTENTION', type: 'OBSERVE' });
worldExecute(worldState);
printTick(1);

// Tick 2 — no new intent (IPS state), commitment persists
worldExecute(worldState);
printTick(2);

// Tick 3 — add failing condition, commitment breaks
const commitment = [...worldState.commitments][0];
commitment.required_conditions.add({ id: 'npc_moved_away', check: () => false });
worldExecute(worldState);
printTick(3);

// Tick 4 — no new intent, world continues, broken commitment persists
worldExecute(worldState);
printTick(4);

console.log('=== Full Trace Log ===');
worldState.trace_log.forEach((event, i) => {
  const fields = Object.entries(event)
    .filter(([k]) => k !== 'event_type' && k !== 'agent_id')
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');
  console.log(`[${i}] ${event.event_type} | ${event.agent_id ?? '-'} | ${fields}`);
});
