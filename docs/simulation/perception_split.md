# Reality and Perception Split

Reality vs Perception Split v1 adds subjective belief modeling without changing
simulation physics or decision authority.

## Data Flow

```text
Reality snapshot
  -> observation / social memory / communication
  -> deterministic distortion
  -> independent belief state
  -> replay and narrative mapping
```

There is no return path from belief state into Reality.

## Modules

- `perceptionModel.js`: creates frozen truth snapshots and derives observations
- `perceptionDistortion.js`: applies distance, trust, age, and compression
- `beliefState.js`: stores evolving and potentially contradictory beliefs
- `informationPropagation.js`: maps Social Memory Graph communication into
  belief updates without recording or mutating reality

## Belief State

```js
{
  perceivedWorld: {},
  perceivedIdentity: [],
  perceivedSkills: {},
  perceivedEvents: [],
  confidenceMap: {},
  confidenceScore: 0,
  beliefVersion: 0
}
```

Belief updates return new state objects. Contradictory claims remain available
for social and narrative inspection instead of being collapsed into truth.

## Runtime Boundary

Belief states are stored independently by agent id instead of being attached to
authoritative runtime agent objects. `createBeliefStore()` initializes this
separate cognitive map and `updateAgentBelief()` returns updated copies.

The new modules are called explicitly by social, narrative, or observability
consumers. `tickManager`, Resolution Model, Elemental Field Dynamics, Skill
System, Identity Lock, and runtime agent state remain unchanged.

## Replay Mapping

`mapReplayFrameToPerception()` pairs an immutable reality frame with independent
per-agent belief snapshots. Multiple mapped frames may share identical reality
while showing belief divergence over time.
