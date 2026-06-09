# Condition + Capacity Model v1

## Authority

This model follows `AGENTS.md`.

Only the existing Execution Layer, coordinated by `tickManager`, may mutate
biological simulation state. Decision systems may read explicitly exposed
state but may not mutate it. Observation systems remain read-only.

## Core Model

Earthly survival is represented by multiple named biological dimensions:

```text
structural
metabolic
immune
neural
```

Each dimension has:

```text
Capacity  = sustainable capability state
Condition = current biological state
```

Capacity states:

```text
full | reduced | minimal
```

Condition states:

```text
sound | strained | impaired | collapsed
```

These states are categorical. They are not bars, pools, totals, maxima,
percentages, or interchangeable points.

## Survival Rule

No single scalar and no single dimension determines survival.

Current v1 life-support rule:

```text
zero or one collapsed dimensions -> life remains supported
two or more collapsed dimensions -> pending death
```

The collapse rule is evaluated by the Life Kernel under `tickManager`
authority. Removal remains deferred until final tick cleanup.

There is deliberately no aggregate biological score.

## Causal Integration

Existing ordering remains:

```text
Life evaluation
-> Intent Pipeline
-> Action Selection
-> Execution
-> Trace
-> Final death cleanup
```

The model does not:

- reorder `simulateAgent`
- inject actions
- directly affect resolution
- introduce a new runtime authority layer
- read observation outputs
- create hidden cross-tick state

## State Shape

```js
biology: {
  capacity: {
    structural: 'full',
    metabolic: 'full',
    immune: 'full',
    neural: 'full'
  },
  condition: {
    structural: 'sound',
    metabolic: 'sound',
    immune: 'sound',
    neural: 'sound'
  }
}
```

`life.alive` remains the canonical existence fact. `_pendingDeath` remains the
deferred cleanup marker.

## Demand Boundary

World Demand may derive contextual biological stress from the distribution of
dimension states.

It must not:

- convert biology into a survival score
- force action selection
- define death
- write biological state

## Removed Legacy Semantics

The simulation layer no longer contains a scalar hit-point field or maximum
hit-point field.

Population counting uses `life.alive`. Decision views expose the
multidimensional biological model rather than a scalar survival value.

## Guarantees

- No single scalar determines survival.
- No scalar survival pool exists in the simulation layer.
- Condition is not represented as a bar, pool, maximum pair, or percentage.
- Capacity is multidimensional and categorical.
- Death requires multidimensional collapse.
- `tickManager` remains the sole execution authority.
- `simulateAgent` causal ordering remains unchanged.
