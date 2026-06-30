// WorldState — per SIMULATION_SPEC Section 1.1
// Data structure only. No execution logic.

/**
 * Creates an empty WorldState.
 *
 * WorldState {
 *   agents:      Map<AgentID, AgentState>
 *   commitments: Set<Commitment>
 *   focus_map:   Map<AgentID, FocusState>
 *   trace_log:   List<TraceEvent>
 * }
 *
 * Mutation contract (SIMULATION_SPEC Section 12.2):
 *   WorldState may only be modified inside World_Execute.
 *   All reads outside World_Execute are projections only.
 */
function createWorldState() {
  return {
    agents:      new Map(),
    commitments: new Set(),
    focus_map:   new Map(),
    trace_log:   [],
  };
}

module.exports = { createWorldState };
