# Settlement Emergence Model

Root `/AGENTS.md` is the sole architecture authority. This document records
implementation details only.

Settlement Emergence is an observational analytics layer. A settlement is a
persistent spatial cluster of completed multi-agent activity. It is never a
predefined map object, spawn zone, behavior authority, or city-management
system.

## Input Flow

```text
completed action traces
  -> spatial aggregation
  -> persistence and multi-agent checks
  -> cluster detection
  -> bounded settlement metrics
  -> Trace, Replay, and Inspector
```

TraceCollector is the primary input. Replay Buffer can reproduce the same
analytics deterministically. Behavioral Signature and World Demand may be read
only as analytic correlation inputs.

## Emergence Contract

A settlement requires:

- Activity above a configured density threshold
- Activity across multiple ticks
- At least two distinct agents
- Spatially adjacent active tiles

Settlements may grow, decay, split, merge, shift center, or change radius as
the trace window changes.

## No Reverse Flow

Settlement analytics must never:

- Assign agents, jobs, roles, or actions
- Modify Intent Generation or Resolution Model
- Modify skills, identity, perception, demand, or fields
- Mutate world or agent state

Settlement snapshots are read-only observations of completed behavior.
