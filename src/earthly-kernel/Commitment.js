// Commitment — per SIMULATION_SPEC Section 1.5
// Data structure only. No mutation functions.
// Invariant 12.4: origin_state_snapshot is immutable after creation.

const CommitmentStatus = Object.freeze({
  ACTIVE:     'ACTIVE',
  BROKEN:     'BROKEN',
  COMPLETED:  'COMPLETED',
  OVERRIDDEN: 'OVERRIDDEN',
});

let _counter = 0;
function _generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `commitment_${Date.now()}_${++_counter}`;
}

// createCommitment — SIMULATION_SPEC Section 1.5
//
// domain:                FocusDomain value (LOCOMOTION | MANIPULATION | ATTENTION)
// type:                  FocusType value   (APPROACH | OBSERVE | HOLD | IDLE)
// origin_state_snapshot: deep copy of AgentState at creation time (Invariant 12.4)
// required_conditions:   Set<Condition> — empty at creation, caller populates
// status:                ACTIVE (default)
function createCommitment(agent_id, domain, type, origin_state_snapshot) {
  return {
    id:                    _generateId(),
    agent_id,
    domain,
    type,
    origin_state_snapshot: structuredClone(origin_state_snapshot),
    required_conditions:   new Set(),
    status:                CommitmentStatus.ACTIVE,
  };
}

module.exports = { CommitmentStatus, createCommitment };
