# Earthly Stability Controller v1

`STABILITY_CONTROLLER v1` is a regulatory control layer for Elemental Field Dynamics and Coupled Emergence.

It regulates amplification speed without modifying simulation state, agent behavior, resolution output, or world physics rules.

## Control Loop

```text
Elemental Field Dynamics Commit
  -> Coupled Emergence Proposals
  -> Stability Metrics
  -> Stability Governors
  -> Next Tick Gains
```

The controller observes the completed tick and returns parameter gains for the next tick. Only `tickManager()` stores these gains.

## Diagnostics

- `fieldInstabilityIndex`
- `socialInstabilityIndex`
- `emergenceInstabilityIndex`
- `globalSystemStabilityScore`

Metrics are diagnostic only.

## Controlled Parameters

Field controls:

- Diffusion gain
- Conversion gain
- Equilibrium restoration rate gain

Social controls:

- Social influence weight
- Memory propagation strength
- Social coupling gain

Emergence controls:

- Emergence coupling gain
- Memory imprint rate
- Repeated action reinforcement strength

Only gains used by existing system boundaries are applied. Social influence and memory propagation gains remain observable control outputs and do not bypass agent or resolution authority.

## Boundary Rules

Stability Controller may:

- Read completed field, social, activity, and emergence diagnostics
- Adjust bounded system-level gains
- Produce logs and metrics

Stability Controller may not:

- Clamp or mutate field values
- Modify agent intents or decisions
- Modify resolution results
- Execute actions
- Remove emergent behavior
- Commit world state
