// CP-1: Intent → Commitment
// Proves that an intent injected into an agent produces a Commitment in worldState.

const { createWorldState } = require('./WorldState');
const { createAgentState } = require('./AgentState');
const { injectIntent } = require('./IntentBuffer');
const { worldExecute } = require('./WorldExecute');

// 1. Create worldState
const worldState = createWorldState();

// 2. Create agents
const player_A = createAgentState('player_A', { x: 0, y: 0 });
const npc_B    = createAgentState('npc_B',    { x: 1, y: 0 });

// 3. Register agents
worldState.agents.set('player_A', player_A);
worldState.agents.set('npc_B',    npc_B);

// 4. Inject intent into player_A only
injectIntent(worldState, 'player_A', { domain: 'ATTENTION', type: 'OBSERVE' });

// 5. Run one tick
worldExecute(worldState);

// 6. Read results
const commitments = [...worldState.commitments];
const c = commitments[0];
const agent_after = worldState.agents.get('player_A');

console.log('commitments count:', commitments.length);
console.log('commitment domain:', c ? c.domain : 'undefined');
console.log('commitment type:',   c ? c.type   : 'undefined');
console.log('commitment status:', c ? c.status  : 'undefined');
console.log('player_A intent_buffer after:', agent_after.intent_buffer);
