# Behavioral Signature Model

Behavioral Signature is a pure analytics model that extracts statistical
structure from completed agent action histories.

It owns observation of action-sequence statistics. Derived identity, skill
capability, and runtime behavior authority are owned by their own layers.

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

## Ownership and Consumption

Behavioral Signature owns:

- sliding action-history windows
- transition and loop extraction
- exploration, stability, entropy, and variation metrics
- replay-safe signature snapshots

Inspector, reports, Replay, and higher-order analytics consume signatures.
Intent, resolution, skill, identity, trait, knowledge, perception, and elemental
field systems own their own runtime inputs.
