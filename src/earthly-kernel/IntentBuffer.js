// Intent Buffer lifecycle — per SIMULATION_SPEC Section 3
// Intent is an edge-trigger signal (not a persistent state).
// Semantic boundary: Intent = transient transport layer / Commitment = persistent execution artifact.

// injectIntent — SIMULATION_SPEC §3
// Intent is edge-trigger signal — consumed and cleared in same World_Execute cycle.
// Overwrites any existing intent_buffer — no queue semantics, no pending state.
function injectIntent(worldState, agent_id, intent) {
  worldState.agents.get(agent_id).intent_buffer = intent;
  return worldState;
}

// consumeIntent — SIMULATION_SPEC §3
// Intent is edge-trigger signal — consumed and cleared in same World_Execute cycle.
// Reads intent_buffer, clears it to null immediately, returns the consumed value.
// Returns null if no intent was buffered.
function consumeIntent(agent) {
  const intent = agent.intent_buffer;
  agent.intent_buffer = null;
  return intent;
}

// hasIntent — SIMULATION_SPEC §3
// Intent is edge-trigger signal — consumed and cleared in same World_Execute cycle.
// Returns true only if an unconsumed intent is present in this tick.
function hasIntent(agent) {
  return agent.intent_buffer !== null;
}

module.exports = { injectIntent, consumeIntent, hasIntent };
