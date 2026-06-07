# Perception Drift Stabilization

Perception Drift Stabilization v1 supports persistent misinformation and social
fragmentation while keeping cognitive divergence bounded.

## Processing Flow

```text
immutable Reality claims + independent belief store
  -> bounded deterministic drift
  -> trust-based social convergence
  -> rumor stability analysis
  -> read-only metrics
```

No step modifies Reality or automatically corrects a false belief.

## Drift Controller

`runPerceptionDriftTick()` returns a new belief store, metrics, rumor analysis,
and logs. Numeric drift has a configurable maximum deviation and per-tick
velocity. Stable seeded bias lets divergence accumulate over time without
becoming unbounded.

## Convergence

`convergeBeliefs()` identifies repeated claims across agents. High average
network trust and high claim confidence allow claims to move toward a shared
social consensus. Low-trust networks remain fragmented.

Social convergence is not truth correction. False consensus remains possible.

## Rumor Analysis

`analyzeRumorStability()` groups beliefs by topic and claim, compares them to
read-only Reality claims, and classifies stable false beliefs and unstable
truths. Previous cluster snapshots provide misinformation persistence metrics.

## Inspector Metrics

The read-only Perception Drift panel accepts:

- Per-agent perception drift index
- Global belief entropy
- Rumor cluster strength
- Convergence score
- Misinformation persistence rate

Consumers may expose the controller result at `world.perceptionDrift` in an
Inspector snapshot. Authoritative runtime world state must not store or read
belief data.
