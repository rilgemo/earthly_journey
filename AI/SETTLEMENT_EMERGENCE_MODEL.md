# Persistent Activity Cluster Emergence Model

Root `/AGENTS.md` is the sole architecture authority. This document records
implementation details only.

Persistent Activity Cluster Emergence owns spatial clustering observation. A
cluster is a persistent spatial density of completed multi-agent activity. The
current runtime keeps `settlement` file and snapshot names for compatibility,
but the architectural concept is agent-centric and species-neutral.

## Input Flow

```text
completed action traces
  -> spatial aggregation
  -> persistence and multi-agent checks
  -> cluster detection
  -> bounded activity cluster metrics
  -> Trace, Replay, and Inspector
```

TraceCollector is the primary input. Replay Buffer can reproduce the same
analytics deterministically. Behavioral Signature and World Demand may be read
only as analytic correlation inputs.

## Emergence Contract

A persistent activity cluster derives from:

- Activity above a configured density threshold
- Activity across multiple ticks
- At least two distinct agents
- Spatially adjacent active tiles

Clusters may grow, decay, split, merge, shift center, or change radius as the
trace window changes. Human settlement expressions, animal settlement
expressions, and species settlement expressions can all be observed through the
same cluster model.

## Ownership and Consumption

Persistent Activity Cluster analytics owns:

- cluster detection from completed traces
- bounded density, persistence, growth, and decay metrics
- read-only snapshots for Trace, Replay, and Inspector

Cluster snapshots are consumed by higher-order observability systems. Intent,
resolution, skill, identity, perception, demand, and field systems own their
own runtime authority.
