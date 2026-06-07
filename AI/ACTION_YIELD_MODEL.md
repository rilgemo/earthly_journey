# Action Yield Model

Root `/AGENTS.md` is the sole architecture authority. This document records
implementation details only.

Action Yield is an environmental outcome resolution layer. It computes the
magnitude of completed action outcomes from read-only environmental context.

It is not an intent source, reward generator, inventory system, skill system,
economy system, or success/failure model.

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

## Forbidden Reverse Flow

Action Yield must never:

- Influence Intent Generation
- Influence Resolution Model
- Modify agent decisions
- Modify skill growth rules
- Modify identity, perception, or demand
- Create inventory or economy behavior
