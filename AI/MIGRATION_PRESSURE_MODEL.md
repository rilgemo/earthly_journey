# Migration Pressure Model

Root `/AGENTS.md` is the sole architecture authority. This document records
implementation details only.

Migration Pressure v1 owns stability evaluation for agent distribution tension.
It produces regional stress fields consumed by Trace, Replay, Inspector, and
future pressure-analysis layers.

## Inputs

Migration Pressure may read completed snapshots from:

- Resource Geography and Resource Flow
- Action Yield distribution
- Persistent Activity Cluster Emergence
- Social Memory and trust data
- Perception Drift metrics
- Behavioral Signatures

## Output

Each region produces:

```js
{
  stabilityScore,
  pressureScore,
  dominantInstabilitySource,
  riskClassification,
  breakdown
}
```

All outputs are bounded in `[0, 1]` where applicable and are replay
deterministic.

## Ownership and Consumption

Migration Pressure owns:

- regional stability scoring
- pressure source breakdowns
- anchoring and perception mismatch diagnostics
- deterministic pressure snapshots

Movement, routing, relocation triggers, intent, resolution, activity cluster
placement, skill, identity, demand, resource flow, and perception are owned by
their existing layers.
