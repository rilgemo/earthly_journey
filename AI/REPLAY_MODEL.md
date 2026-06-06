# Earthly Replay Model v1

`REPLAY_MODEL v1` is the read-only time travel layer for the Earthly simulation inspector.

It belongs under `TRACE_MODEL` and `OBSERVABILITY`.

It does not generate intents, select actions, execute actions, restore world state, branch simulation, or mutate runtime state.

## Authority Placement

```text
tickManager
  -> TraceCollector
  -> ReplayBuffer
  -> Simulation Inspector
```

## Purpose

Replay Buffer records what already happened.

It exists so the inspector can look backward across immutable tick frames without changing the live simulation.

## Replay Frame Shape

```ts
type ReplayFrame = {
  tick: number;
  worldSnapshot: {
    tick: number;
    fields: Record<string, number>;
    agents?: unknown[];
    areas?: unknown[];
  };
  trace: unknown[];
  timestamp: number;
};
```

## Snapshot Rule

Replay frames must not store mutable runtime references.

Every frame must clone:

- world snapshot
- trace list
- nested agent or area data

Use `structuredClone()` when available, otherwise use a JSON clone fallback for plain data.

## Boundary Rules

- Replay Model may store immutable snapshots.
- Replay Model may expose previous frames for visualization.
- Replay Model may support Inspector navigation.
- Replay Model may not mutate world state.
- Replay Model may not restore world state.
- Replay Model may not branch simulation.
- Replay Model may not execute tick logic.

## v1 Non-Scope

- Runtime rewind
- Runtime restore
- Branching simulation
- Replay file export
- Timeline scrubbing
- Heatmap visualization

These belong to Replay v2 or later.
