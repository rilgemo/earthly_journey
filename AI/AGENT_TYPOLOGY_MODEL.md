# Agent Typology Model v1

Subtitle: Causal Participation Classification System for Agents

Agent Typology defines how agents participate in simulation causality.

It does not define abilities, RPG classes, professions, or identities.

## Core Rule

All agents share the same primitives:

```text
Perception -> Memory -> Intent -> Action -> Behavior Signature
```

Typology modifies weighting functions only.

It must not alter tick execution order, action registry, skills, identity systems, or world mutation authority.

## Causal Profile

```ts
type AgentTypeProfile = {
  typeId: string;
  stabilityProfile: string;
  fieldSensitivity: object;
  socialCouplingStrength: number;
  memoryPersistenceBias: number;
  actionVolatility: number;
  resourceDependenceProfile: object;
};
```

## Example Types

- `human_like`: balanced field sensitivity, high social coupling, medium memory persistence
- `animal_like`: high field sensitivity, low symbolic memory persistence, high environmental dependency
- `monster_like`: high aggression bias, low social coupling, high local field responsiveness
- `collective`: distributed memory weighting, emergent decision aggregation

## Runtime Boundary

Typology may influence:

- Intent scoring weights
- Perception sensitivity coefficients
- Memory weighting coefficients
- Social coupling modifiers
- Resource pressure response curves

Typology may not:

- Assign skills
- Define professions
- Modify actions
- Select final intents
- Execute actions
- Mutate runtime state
- Use identity as decision input

## Trace Requirement

Typology effects must be traceable through `agentTypologySnapshot`.
