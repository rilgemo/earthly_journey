// World_Execute pipeline — per SIMULATION_SPEC Section 2
// STATE(t+1) = World_Execute(STATE(t), INPUT(t))
// worldExecute is the ONLY legal function that may modify WorldState (Invariant 12.2).

const { hasIntent, consumeIntent } = require('./IntentBuffer');
const { createCommitment, CommitmentStatus } = require('./Commitment');

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

// Step 2 — Apply Focus Transition Rules (SIMULATION_SPEC §4)
// Reads _resolvedIntents (from step 1). Updates focus_map. Emits FOCUS_CHANGED.
// Same-domain existing ACTIVE Commitment → OVERRIDDEN (§4.2).
// NO delta_value in trace event — raw event only (M.O.B 4).
function applyFocusTransitionRules(worldState) {
  for (const [agent_id, intent] of worldState._resolvedIntents) {
    const old_focus = worldState.focus_map.get(agent_id) ?? { active_domain: null, active_type: null };
    const new_focus = { active_domain: intent.domain, active_type: intent.type };

    // §4.2 — same-domain existing ACTIVE Commitment is OVERRIDDEN by the new focus
    if (old_focus.active_domain === new_focus.active_domain) {
      for (const commitment of worldState.commitments) {
        if (
          commitment.agent_id === agent_id &&
          commitment.domain   === new_focus.active_domain &&
          commitment.status   === CommitmentStatus.ACTIVE
        ) {
          commitment.status = CommitmentStatus.OVERRIDDEN;
        }
      }
    }

    worldState.focus_map.set(agent_id, new_focus);

    worldState.trace_log.push({
      event_type: 'FOCUS_CHANGED',
      agent_id,
      old_domain: old_focus.active_domain,
      old_type:   old_focus.active_type,
      new_domain: new_focus.active_domain,
      new_type:   new_focus.active_type,
      timestamp:  worldState._currentTick ?? 0,
    });
  }
  return worldState;
}

// Step 3 — Generate / Update Commitments
// For each agent whose intent_buffer was consumed in Step 1, create a new Commitment.
// Commitment.origin_state_snapshot = deep copy of agent state at this moment (Invariant 12.4).
// No Intent → no new Commitment.
function generateUpdateCommitments(worldState) {
  // _newCommitments is a transient scratch list for step 6 (emitTraceEvents).
  // Created here, consumed and deleted in step 6.
  worldState._newCommitments = [];
  for (const [agent_id, intent] of worldState._resolvedIntents) {
    const agent = worldState.agents.get(agent_id);
    const commitment = createCommitment(agent_id, intent.domain, intent.type, agent);
    worldState.commitments.add(commitment);
    worldState._newCommitments.push(commitment);
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
// Emits COMMITMENT_CREATED for each new Commitment generated this tick.
// Raw event only — no stat deltas, no level fields, no delta_value (M.O.B 4).
// _newCommitments scratch list consumed and deleted here.
function emitTraceEvents(worldState) {
  for (const commitment of worldState._newCommitments) {
    worldState.trace_log.push({
      event_type:     'COMMITMENT_CREATED',
      commitment_id:  commitment.id,
      agent_id:       commitment.agent_id,
      domain:         commitment.domain,
      type:           commitment.type,
      origin_posture: commitment.origin_state_snapshot.posture_state,
      timestamp:      worldState._currentTick ?? 0,
    });
  }
  delete worldState._newCommitments;
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
