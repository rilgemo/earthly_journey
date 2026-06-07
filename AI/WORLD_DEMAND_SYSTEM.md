# World Demand System

Root `/AGENTS.md` is the sole architecture authority. This document records
implementation details only.

World Demand v1 is the Persistent Activity Cluster Pressure and Opportunity Layer.

Demand represents unmet world and cluster-level pressures. It contributes
additive opportunity pressure to candidate intent scores. Derived identity
expressions, occupations, and quest structures are produced by other layers.

## Authority Flow

```text
World state
  -> Demand Sources
  -> smoothed immutable Demand Index
  -> additive opportunity score
  -> Intent Generator
  -> RESOLUTION_MODEL
  -> tickManager execution
```

`RESOLUTION_MODEL` remains the only final intent authority. `tickManager()`
remains the only state mutation authority.

## Demand Types

- food
- tools
- materials
- healing
- arcane
- safety
- shelter

Every demand is a deterministic continuous value in `[0, 100]`.

## Sources

Demand sources compare cluster pressure with available production,
capacity, stability, or safety signals. Demand Model applies configurable
damping to avoid spikes and creates an immutable index with dominant demand,
total demand, and demand entropy.

## Action Opportunity Mapping

Only registered actions may receive opportunity pressure. V1 maps demand to
existing actions such as `farm`, `forage`, `hunt`, `forge`, `mine`, `rest`,
`study_arcane`, `meditate`, `defend`, and `attack`.

Unregistered future actions such as `build`, `patrol`, `brew_potion`, or
`gather_herbs` are not invented by this system.

## Ownership and Consumption

World Demand owns:

- smoothed demand derivation from world state
- additive opportunity signals consumed by Intent Generator
- deterministic demand snapshots for Trace, Replay, and Inspector

Resolution owns final selection. tickManager owns mutation. Skill, perception,
identity, and elemental field layers own their own state transitions.
