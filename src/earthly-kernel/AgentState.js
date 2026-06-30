// AgentState, PostureState, FocusState — per SIMULATION_SPEC Sections 1.2, 1.3, 1.4
// Data structures only. No logic, no mutation functions.

// SIMULATION_SPEC Section 1.3
const PostureState = Object.freeze({
  STANDING:     'STANDING',
  MOVING:       'MOVING',
  OBSERVING:    'OBSERVING',
  INTERACTING:  'INTERACTING',
});

// SIMULATION_SPEC Section 1.4 — domain axis and behavior verb enums
const FocusDomain = Object.freeze({
  LOCOMOTION:   'LOCOMOTION',
  MANIPULATION: 'MANIPULATION',
  ATTENTION:    'ATTENTION',
});

const FocusType = Object.freeze({
  APPROACH: 'APPROACH',
  OBSERVE:  'OBSERVE',
  HOLD:     'HOLD',
  IDLE:     'IDLE',
});

// FocusState factory — SIMULATION_SPEC Section 1.4
function createFocusState(active_domain, active_type) {
  return {
    active_domain,
    active_type,
  };
}

// AgentState factory — SIMULATION_SPEC Section 1.2
// position: Vector2 as { x, y }
// posture_state: PostureState (default STANDING)
// intent_buffer: null (edge-trigger signal, not persisted — see Section 3)
// focus: FocusState (default LOCOMOTION / IDLE)
function createAgentState(id, position = { x: 0, y: 0 }) {
  return {
    id,
    position,
    posture_state:  PostureState.STANDING,
    intent_buffer:  null,
    focus:          createFocusState(FocusDomain.LOCOMOTION, FocusType.IDLE),
  };
}

module.exports = {
  PostureState,
  FocusDomain,
  FocusType,
  createFocusState,
  createAgentState,
};
