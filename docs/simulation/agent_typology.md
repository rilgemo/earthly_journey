# Agent Typology System v1

Subtitle: Causal Participation Classification System for Agents

## Objective

Agent Typology defines a non-RPG, non-class-based way to categorize agents based on how they participate in the simulation causality network.

Agent Typology does not define abilities.

Agent Typology defines interaction patterns.

## Core Principle

All agents share the same simulation primitives:

- Perception
- Memory
- Intent
- Action
- Behavior Signature

Agent Typology modifies weighting functions inside existing systems:

- How actions are selected
- How strongly fields influence agents
- How memory is weighted
- How agents interact with other agents
- How agents respond to environmental pressure

## Agent Type Model

```ts
type AgentTypeProfile = {
  typeId: string;
  stabilityProfile: string;
  fieldSensitivity: unknown;
  socialCouplingStrength: number;
  memoryPersistenceBias: number;
  actionVolatility: number;
  resourceDependenceProfile: unknown;
};
```

## Example Typologies

Human-like Agent:

- Balanced field sensitivity
- High social coupling
- Medium memory persistence
- Moderate volatility

Animal-like Agent:

- High field sensitivity
- Low symbolic memory persistence
- High environmental dependency
- Instinct-driven action volatility

Monster-like Agent:

- High aggression bias
- Low social coupling
- High local field responsiveness

Collective Agent:

- Distributed memory weighting
- Emergent decision aggregation
- Low individual volatility
- High system volatility

## Typology Does Not Do

- Does not assign skills
- Does not define professions
- Does not modify Action Registry
- Does not alter Tick execution order
- Does not create new simulation primitives

It only modifies scoring functions.

## Integration Points

Agent Typology influences:

- Intent Generator scoring weights
- Behavioral Signature interpretation
- Perception weighting sensitivity
- Resource Exchange likelihood
- Settlement clustering probability
- Migration Pressure response curves

## Flow

Tick flow remains unchanged:

```text
Perception -> Intent Generation (weighted by typology) -> Resolution -> Execution -> TraceCollector
```

## Trace Output

```ts
type AgentTypologySnapshot = {
  agentId: string;
  typeId: string;
  activeWeights: unknown[];
  influenceSummary: unknown;
  deviationFromBaseline: number;
};
```

## Boundary

Typology is not identity.

Typology is not skill.

Typology is not class.

Typology is a causal profile that influences additive weighting only.
