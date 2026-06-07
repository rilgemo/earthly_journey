# Earthly Multi-Agent Cognitive Runtime v2

This document extends the DF x AI hybrid simulation kernel from individual agent behavior into group cognition and social emergence.

## Core Shift

v1:

```text
Agent = independent decision unit
```

v2:

```text
Agent = node in shared cognitive ecosystem
```

## Runtime Definition

```text
Earthly Journey v2 =
  DF-based physical simulator
  + AI-driven agent cognition
  + emergent social graph system
```

## New v2 Systems

### 1. Shared Perception Layer

World knowledge is partial, noisy, and socially influenced.

```ts
type Perception = {
  directVision: unknown;
  memory: unknown;
  hearsay: unknown;
  inference: unknown;
};
```

Perception sources:

- Direct vision: what the agent can observe directly
- Memory: what the agent previously experienced
- Hearsay: what other agents communicated
- Inference: what the agent concludes from available signals

Hearsay allows information to propagate through agent collective structures:

- A blacksmith hears about a monster near the forest.
- A guard hears that the player attacked a merchant.
- A human settlement expression slowly forms a shared belief about danger, trust, or scarcity.

### 2. Social Memory Graph

Memory is no longer only an isolated per-agent log.

```text
Memory = personal + social + reputation-based
```

Memory layers:

- Personal memory: direct lived experience
- Social memory: information received from others
- Reputation memory: group evaluation of an entity

Example:

```text
Player kills wolf -> nearby agent hears -> social cluster reputation shifts
```

### 3. Influence Field

Agent utility is shaped by personal, social, and environmental pressure.

```text
Utility =
  Needs
  + Personality
  + Memory
  + SocialPressure
  + LocalWorldState
```

Social pressure examples:

- Group fear of monsters
- Agents following powerful entities
- Agents imitating successful behavior
- Social cluster avoidance of dangerous places

### 4. Emergent Behavioral Expression System

Behavioral expressions are dynamic behavior patterns, not fixed labels.

```text
Behavioral Expression = weighted behavior pattern over time
```

Examples:

- Farmer -> warrior
- Farming expression -> repeated exchange pattern
- Farmer -> leader
- Farmer -> outcast

Behavioral expression emergence is driven by repeated behavior, social feedback, resources, memory, and world constraints.

## v2 Tick Flow

For each tick:

1. DF world update
   - Time
   - Environment
   - Resource flow
2. Social field update
   - Reputation changes
   - Rumor propagation
   - Influence field recalculation
3. For each agent:
   - Perceive direct, social, and inferred context
   - Update memory
   - Generate intent through AI
   - Adjust intent through influence field
   - Validate through DF rules
   - Execute through engine
4. Resolve social effects
   - Reputation changes
   - Group behavior shifts
5. Consolidate memory

## Conflict Model v2

v1 conflict rule:

```text
DF overrides AI
```

v2 adds social override:

```text
DF rules
> physical constraints
> social consensus pressure
> AI intent
> randomness
```

Social pressure cannot violate DF constraints. It can only reshape intent priority, fallback selection, avoidance, cooperation, and reputation response.

## Unified Learning Model v2

```text
Skill XP = personal learning
Memory = personal + social reinforcement
Reputation = external behavior constraint
```

XP affects internal capability growth.

Memory affects behavior bias.

Reputation affects how other agents respond.

## World Model v2

v1:

```text
World = physical simulation
```

v2:

```text
World = physical + social + informational system
```

## Boundary Rules

- DF remains the authority for physical possibility.
- AI remains the authority for agent intention.
- Social systems may influence intent but cannot mutate world state directly.
- Only the action resolution engine may commit world mutations.
- Reputation and social memory must be treated as world state, not UI state.

## Future v3 Direction

v3 may extend into a Collective Structure Emergence Layer:

- Factions
- Exchange structure collapse
- Migration
- War systems
- Collective memory expression formation

```text
v1 = agents act
v2 = agents influence each other
v3 = agents reshape collective structures
```
