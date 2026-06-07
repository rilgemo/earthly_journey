# Earthly Emergence Tuning System v1

EETS v1 is the control plane for the v2 Multi-Agent Cognitive Runtime.

It does not create behavior. It shapes the probability space where behavior emerges.

## Core Position

```text
EETS v1 = parameterized control plane
v2 Runtime = behavior execution plane
```

EETS tunes the probability and structural preference of emergent behavior. It does not define NPC behavior, write AI decision logic, control individual agents directly, or bypass validation.

## System Structure

```text
EETS v1
|-- 1. Perception Tuning
|-- 2. Memory Dynamics
|-- 3. Social Contagion Model
|-- 4. Decision Bias Field
|-- 5. Resource Exchange Pressure Model
|-- 6. Stability Controller
`-- 7. Narrative Emergence Bias
```

## Parameter Model

### 1. Perception Tuning

Controls what agents notice.

```ts
const PERCEPTION = {
  visibility_range: 1.0,
  relevance_threshold: 0.5,
  noise_ratio: 0.2,
  novelty_bias: 1.3,
};
```

Effects:

- Changes how far agents perceive
- Filters information entering attention
- Introduces informational distortion
- Raises or lowers sensitivity to novelty

### 2. Memory Dynamics

Controls how memory influences behavior.

```ts
const MEMORY = {
  decay_rate: 0.01,
  reinforcement_factor: 1.5,
  recall_bias: 0.8,
  emotional_weight: 1.2,
};
```

Effects:

- Agents can hold grudges
- Repeated events become habits
- Emotional events dominate long-term behavior
- Memory can bias future decisions without directly choosing actions

### 3. Social Contagion Model

Controls whether behavior and information spread socially.

```ts
const SOCIAL = {
  imitation_rate: 0.6,
  rumor_spread: 0.4,
  trust_weight: 1.2,
  authority_bias: 1.5,
};
```

Effects:

- Trend formation
- Group behavior
- Social consensus
- Rumor propagation
- Authority-driven behavior shifts

### 4. Decision Bias Field

Controls what agents tend to prefer.

```ts
const DECISION = {
  survival_bias: 1.5,
  greed_factor: 1.0,
  curiosity: 1.2,
  aggression: 0.8,
  cooperation: 1.3,
};
```

Effects:

- Higher survival bias creates survival-focused worlds
- Higher cooperation creates social-cluster-focused worlds
- Higher aggression creates more volatile worlds
- Higher curiosity creates more exploration and discovery

### 5. Resource Exchange Pressure Model

Controls how strongly resource asymmetry and exchange opportunity shape behavior.

```ts
const EXCHANGE = {
  scarcity_pressure: 1.4,
  resource_concentration: 0.7,
  exchange_frequency: 1.2,
  contribution_need: 1.5,
};
```

Effects:

- Derived identity expression emergence
- Behavioral expression differentiation
- Repeated exchange pattern frequency
- Resource competition
- Exchange structure cycles

### 6. Stability Controller

Controls collapse prevention and simulation damping.

```ts
const STABILITY = {
  chaos_dampening: 0.8,
  extreme_behavior_limit: 0.7,
  feedback_smoothing: 1.3,
  population_soft_cap: 60,
};
```

Regulates:

- Total social collapse
- Extreme behavior spirals
- Exchange structure runaway
- Population explosion
- All agents converging into the same behavior

### 7. Narrative Emergence Bias

Controls story-like clustering without scripting specific stories.

```ts
const NARRATIVE = {
  event_clustering: 1.4,
  conflict_probability: 1.2,
  coincidence_bias: 0.8,
  hero_emergence_rate: 0.6,
};
```

Effects:

- Event clusters
- Conflict arcs
- Coincidental encounters
- Legendary or hero-like NPC emergence

## Tick Hook

Each simulation tick:

1. v2 Runtime produces raw agent intents.
2. EETS modifies intent weights.
3. Adjusted intents go to `RESOLUTION_MODEL`.
4. Resolution Model selects one final intent.
5. Execution Model validates and applies the selected intent.
6. Results feed back into memory systems.

## Pseudocode

```ts
function applyEETS(agentIntent, worldState) {
  const intent = { ...agentIntent };

  intent.weight *= SOCIAL.imitation_rate;
  intent.weight *= MEMORY.recall_bias;
  intent.weight *= DECISION.curiosity;

  if (worldState.resourceScarcity > threshold) {
    intent.weight *= ECONOMY.scarcity_pressure;
  }

  if (worldState.stability < 0.5) {
    intent.weight *= STABILITY.chaos_dampening;
  }

  return intent;
}
```

## Design Philosophy

EETS does not:

- Define NPC behavior
- Write AI decision logic
- Control individual agents
- Mutate world state directly
- Override DF validation

EETS does:

- Shape world tendency
- Tune behavior probabilities
- Smooth unstable feedback loops
- Encourage narrative emergence
- Keep the simulation steerable without scripting it

## Value

Without EETS:

- Chaos simulator
- Unpredictable DF-like drift
- Weak narrative consistency

With EETS:

- Tunable DF x AI hybrid world
- Emergent but steerable agent collective structure
- Controllable storytelling engine

## Upgrade Path

```text
v1: Parameter control layer
v2: Multi-agent runtime
v3: Collective structure formalization layer
```

## Boundary Rule

EETS may tune intent weights.

EETS may not create behavior, choose final actions, override `RESOLUTION_MODEL`, or mutate state directly.

Only the action resolution engine may execute validated actions and commit world mutations.
