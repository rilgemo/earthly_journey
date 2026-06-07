# Action Yield Model

Root `/AGENTS.md` is the sole architecture authority. This document records
implementation details only.

Action Yield is an environmental outcome resolution layer. It computes the
magnitude of completed action outcomes from read-only environmental context.

It is consumed by Trace, Replay, Resource Flow, and exchange observation. Intent
generation, skill growth, inventory, and success/failure authority are owned by
their existing layers.

## Input Boundary

Action Yield may read:

- Resource Geography potentials
- Elemental field pressures
- Tile and neighboring tile context
- The already-selected action type

It runs after action execution authority has selected and validated an action.

## Output Shape

```js
{
  actionType,
  baseYield,
  environmentalMultiplier,
  finalYield,
  breakdown
}
```

The result is written to traces for Replay and Inspector. It does not write
items, mutate world state, alter skills, or update demand.

## Ownership and Consumption

Action Yield owns:

- environmental outcome magnitude for completed actions
- deterministic yield breakdowns
- read-only action yield trace snapshots

Intent Generation owns candidate scoring. Resolution Model owns selection.
Skill, identity, perception, demand, inventory, and resource exchange systems
consume only the snapshots they are permitted to observe.
