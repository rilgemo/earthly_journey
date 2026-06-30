// Deterministic Replay Test
// Proves WorldExecute is deterministic — same input sequence produces
// identical trace output (modulo UUID commitment ids) across independent runs.

const { createWorldState } = require('./WorldState');
const { createAgentState } = require('./AgentState');
const { injectIntent } = require('./IntentBuffer');
const { worldExecute } = require('./WorldExecute');

function buildScenario() {
  const worldState = createWorldState();

  const player_A = createAgentState('player_A', { x: 0, y: 0 });
  const npc_B    = createAgentState('npc_B',    { x: 1, y: 0 });

  worldState.focus_map.set('player_A', { active_domain: 'LOCOMOTION', active_type: 'IDLE' });

  worldState.agents.set('player_A', player_A);
  worldState.agents.set('npc_B',    npc_B);

  return { worldState, player_A, npc_B };
}

function runScenario() {
  const { worldState } = buildScenario();

  injectIntent(worldState, 'player_A', { domain: 'ATTENTION', type: 'OBSERVE' });
  worldExecute(worldState); // tick 1: focus shift + commitment created

  const commitment = [...worldState.commitments][0];
  commitment.required_conditions.add({ id: 'target_in_range', check: () => false });

  worldExecute(worldState); // tick 2: commitment broken

  return worldState.trace_log;
}

function normalize(trace_log) {
  const id_map = new Map();
  let counter = 0;

  function normalizeId(id) {
    if (id === undefined || id === null) return id;
    if (!id_map.has(id)) {
      id_map.set(id, `commitment_${counter++}`);
    }
    return id_map.get(id);
  }

  return trace_log.map(event => {
    const normalized = { ...event };
    if ('commitment_id' in normalized) {
      normalized.commitment_id = normalizeId(normalized.commitment_id);
    }
    return normalized;
  });
}

const trace_A = normalize(runScenario());
const trace_B = normalize(runScenario());

console.log('trace_A event count:', trace_A.length);
console.log('trace_B event count:', trace_B.length);

let divergence = null;

function compareField(field) {
  const len = Math.min(trace_A.length, trace_B.length);
  for (let i = 0; i < len; i++) {
    const a = trace_A[i]?.[field];
    const b = trace_B[i]?.[field];
    if (a !== b) {
      if (!divergence) {
        divergence = { field, index: i, a, b };
      }
      return false;
    }
  }
  return trace_A.length === trace_B.length;
}

const event_types_match    = compareField('event_type');
const agent_ids_match      = compareField('agent_id');
const domains_match        = compareField('domain') && compareField('new_domain') && compareField('old_domain');
const failure_reasons_match = compareField('failure_reason');
const commitment_ids_match  = compareField('commitment_id');

console.log('event types match:', event_types_match);
console.log('agent_ids match:', agent_ids_match);
console.log('domains match:', domains_match);
console.log('failure_reasons match:', failure_reasons_match);

const all_match =
  trace_A.length === trace_B.length &&
  event_types_match &&
  agent_ids_match &&
  domains_match &&
  failure_reasons_match &&
  commitment_ids_match;

console.log('DETERMINISM:', all_match ? 'PASS' : 'FAIL');

if (!all_match && divergence) {
  console.log(`First divergence — field: ${divergence.field}, index: ${divergence.index}, A: ${JSON.stringify(divergence.a)}, B: ${JSON.stringify(divergence.b)}`);
}
