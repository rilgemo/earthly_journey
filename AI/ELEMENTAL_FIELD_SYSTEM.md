# Earthly Elemental Field Dynamics v1

`ELEMENTAL_FIELD_SYSTEM v1` is the world physics layer for continuous elemental environmental state.

It is not gameplay logic, agent AI, or a resource system.

## Core Principle

Elemental fields are not consumable resources.

Fields:

- Evolve over time
- Redistribute spatially
- Transform between elements
- Return toward local equilibrium
- Receive indirect agent perturbations

Fields must never be directly reduced as an action or mana cost.

## Supported Fields

Each tile contains continuous numeric values for:

- `fire`
- `water`
- `air`
- `earth`
- `life`
- `arcane`

Committed field values remain finite and non-negative.

## World Physics Pipeline

The world field phase runs in this order:

```text
Agent Perturbation Queue
  -> Diffusion
  -> Cross-Field Conversion
  -> Equilibrium Restoration
  -> tickManager Commit
```

Only `tickManager()` may commit the final field state.

## Agent Perturbation Boundary

Agents may submit perturbation requests:

```js
{
  tileId: 'meadow',
  perturbation: {
    fire: 10,
    air: 5,
    life: -3
  }
}
```

Submitting a request does not mutate field state.

The request becomes physical reality only when processed and committed by `tickManager()`.

## Conversion Rule

Conversions redistribute field values between types.

Conversions do not consume total field energy.

v1 conversion paths:

- fire -> air
- fire -> earth
- fire -> life
- water -> life
- water -> earth
- life -> arcane
- arcane -> fire

## Boundary Rules

Elemental Field Dynamics may:

- Process perturbation requests
- Diffuse fields between neighboring tiles
- Redistribute values through conversion
- Restore fields toward baselines
- Produce read-only debug traces

Elemental Field Dynamics may not:

- Define agent behavior
- Generate or select intents
- Execute actions
- Treat fields as consumable resources
- Subtract fields as mana or skill costs
- Allow agents to directly mutate field state
- Commit world state outside `tickManager()`
