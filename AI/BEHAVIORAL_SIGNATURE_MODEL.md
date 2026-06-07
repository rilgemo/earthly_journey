# Behavioral Signature Model

Behavioral Signature is a pure analytics model that extracts statistical
structure from completed agent action histories.

It is not a class, profession, identity, capability, or behavior authority.

## Input Boundary

```text
tickManager completed action
  -> TraceCollector
  -> Behavior Trace Recorder
  -> Pattern and metric extraction
  -> Behavioral Signature
  -> Inspector
```

The preferred input is the existing TraceCollector post-action record.
Replay Buffer traces may be used for deterministic offline analysis.

## Signature Shape

```js
{
  dominantActions: [],
  transitionMatrix: {},
  loopPatterns: [],
  explorationIndex: 0,
  stabilityScore: 0,
  entropyScore: 0
}
```

Additional metrics may include behavioral drift, cycle strength, variation
index, frequent sequences, stable cycles, and sample size.

## Analytics Rules

- History is stored in configurable sliding windows.
- Snapshot histories are immutable copies.
- Signatures are deterministic for identical action histories.
- Pattern extraction describes behavior and never classifies the agent.

## Forbidden Reverse Flow

Behavioral histories, metrics, and signatures must never be read by:

- Intent Generator
- Resolution Model
- Skill, identity, trait, or knowledge systems
- Perception or belief systems
- Elemental Field Dynamics

Behavioral Signature may only be displayed, compared, replayed, or reported.
