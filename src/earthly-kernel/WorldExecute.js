// World_Execute pipeline — per SIMULATION_SPEC Section 2
// STATE(t+1) = World_Execute(STATE(t), INPUT(t))
// worldExecute is the ONLY legal function that may modify WorldState (Invariant 12.2).

const { hasIntent, consumeIntent } = require('./IntentBuffer');
const { createCommitment } = require('./Commitment');

// Step 1 — Resolve Agent Inputs
// Drain each agent's intent_buffer into the pipeline for this tick.
// intent_buffer is cleared immediately after consumption (edge-trigger, not persisted).
//
// _resolvedIntents is a transient scratch field,
// NOT part of canonical WorldState schema.
// Created in step 1, consumed in step 3, deleted after step 3.
function resolveAgentInputs(worldState) {
  worldState._resolvedIntents = new Map();
  for (const [agent_id, agent] of worldState.agents) {
    if (hasIntent(agent)) {
      const intent = consumeIntent(agent);
      worldState._resolvedIntents.set(agent_id, intent);
    }
  }
  return worldState;
}

// Step 2 — Apply Focus Transition Rules
// For each agent with a pending focus change, update focus_map[agent_id].
// Emit FOCUS_CHANGED trace event (cost_delta recorded in Trace only, not stored in WorldState).
// If new domain matches an existing Commitment's domain, mark that Commitment OVERRIDDEN.
function applyFocusTransitionRules(worldState) {
  return worldState;
}

// Step 3 — Generate / Update Commitments
// For each agent whose intent_buffer was consumed in Step 1, create a new Commitment.
// Commitment.origin_state_snapshot = deep copy of agent state at this moment (Invariant 12.4).
// No Intent → no new Commitment.
function generateUpdateCommitments(worldState) {
  for (const [agent_id, intent] of worldState._resolvedIntents) {
    const agent = worldState.agents.get(agent_id);
    const commitment = createCommitment(agent_id, intent.domain, intent.type, agent);
    worldState.commitments.add(commitment);
  }
  delete worldState._resolvedIntents;
  return worldState;
}

// Step 4 — Validate Commitments (World Validation)
// Step 4 is read-only projection — must not modify any Execution Layer state.
// MAY write: commitment.status (→ BROKEN), commitment.failure_reason
// MUST NOT: delete commitments, create commitments, touch agents/focus_map/trace_log
// First failing condition wins; break after first failure per commitment.
function validateCommitments(worldState) {
  const { CommitmentStatus } = require('./Commitment');
  for (const commitment of worldState.commitments) {
    if (commitment.status !== CommitmentStatus.ACTIVE) continue;
    const agent = worldState.agents.get(commitment.agent_id);
    for (const condition of commitment.required_conditions) {
      if (condition.check(worldState, agent) === false) {
        commitment.status = CommitmentStatus.BROKEN;
        commitment.failure_reason = condition.id;
        break;
      }
    }
  }
  return worldState;
}

// Step 5 — Resolve Broken Events
// Emit-once rule: scan trace_log before emitting — do not re-emit for commitments
// already present in trace_log (BROKEN → BROKEN on tick N+1 produces no new event).
// failure_reason must not be null (SIMULATION_SPEC §6.3, §13).
function resolveBrokenEvents(worldState) {
  const emitted = new Set(
    worldState.trace_log
      .filter(e => e.event_type === 'COMMITMENT_BROKEN')
      .map(e => e.commitment_id)
  );
  for (const commitment of worldState.commitments) {
    if (commitment.status !== 'BROKEN') continue;
    if (emitted.has(commitment.id)) continue;
    worldState.trace_log.push({
      event_type:     'COMMITMENT_BROKEN',
      commitment_id:  commitment.id,
      failure_reason: commitment.failure_reason,
      timestamp:      worldState._currentTick ?? 0,
    });
  }
  return worldState;
}

// Step 6 — Emit Trace Events
// Append raw TraceEvents to worldState.trace_log for all state changes this tick.
// Allowed event types: COMMITMENT_CREATED, COMMITMENT_BROKEN, COMMITMENT_COMPLETED,
//   COMMITMENT_OVERRIDDEN, FOCUS_CHANGED, POSITION_UPDATED.
// No semantic labeling — raw event data only (Invariant: no delta_value, no derived labels).
function emitTraceEvents(worldState) {
  return worldState;
}

// Step 7 — Commit New WorldState
// Finalize and return the updated WorldState as the canonical state for tick t+1.
// All mutations in this pipeline are complete by this point.
function commitNewWorldState(worldState) {
  return worldState;
}

// worldExecute — SIMULATION_SPEC Section 2
// Executes all 7 steps in strict order for a single tick.
// This is the ONLY entry point for WorldState mutation.
function worldExecute(worldState) {
  worldState._currentTick = (worldState._currentTick ?? -1) + 1;
  worldState = resolveAgentInputs(worldState);
  worldState = applyFocusTransitionRules(worldState);
  worldState = generateUpdateCommitments(worldState);
  worldState = validateCommitments(worldState);
  worldState = resolveBrokenEvents(worldState);
  worldState = emitTraceEvents(worldState);
  worldState = commitNewWorldState(worldState);
  return worldState;
}

module.exports = { worldExecute };
