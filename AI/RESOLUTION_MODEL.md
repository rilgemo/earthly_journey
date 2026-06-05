# Earthly Resolution Model v1

`RESOLUTION_MODEL v1` is the final decision arbitration layer.

It collects all sources that influence an agent's intent, normalizes them, resolves conflicts, and outputs one final executable intent.

## Pipeline Position

```text
AGENTS -> RUNTIME -> EETS -> RESOLUTION -> EXECUTION
```

## Core Responsibility

Resolution Model v1 does only four things:

1. Collect all intent sources.
2. Normalize weights onto shared scales.
3. Resolve conflicts.
4. Output one final executable intent.

## Forbidden

Resolution Model v1 does not:

- Generate behavior
- Modify world state
- Decide story
- Perform AI reasoning
- Perform EETS tuning
- Execute actions

## System Priority Rule

`RESOLUTION_MODEL` is the only authority for final intent selection.

No other system may directly execute actions or override final intent.

## Input Structure

```ts
type IntentBundle = {
  baseIntent: Intent;
  memoryInfluence: IntentModifier;
  socialInfluence: IntentModifier;
  eetsModifier: IntentModifier;
  environmentModifier: IntentModifier;
  systemOverride?: IntentModifier;
};

type Intent = {
  action: string;
  target?: string;
  weight: number;
  urgency: number;
  confidence: number;
};

type IntentModifier = {
  source: string;
  weight: number;
  reason?: string;
};
```

## Resolution Pipeline

### Step 1: Normalization

All modifiers are normalized onto bounded scales.

```text
memory      in [0.5, 1.5]
social      in [0.3, 2.0]
eets        in [0.2, 2.5]
environment in [0.5, 2.0]
```

### Step 2: Weight Composition

```ts
finalWeight =
  baseWeight
  * memoryInfluence
  * socialInfluence
  * eetsModifier
  * environmentModifier;
```

### Step 3: Conflict Grouping

Competing intents are grouped by category:

- Survival
- Social
- Economic
- Exploration
- Combat

Example:

```text
harvest   0.62 -> economic
socialize 0.58 -> social
rest      0.55 -> survival
```

### Step 4: Priority Resolution

Rule set v1:

1. Survival overrides all other intents if HP is below the survival threshold.
2. Immediate threats override EETS tuning.
3. Social bonding overrides economic behavior only if trust is above threshold.
4. Economic intent dominates if scarcity is above threshold.
5. Exploration is allowed only when no high-urgency intents exist.

### Step 5: Stochastic Selection

Selection uses softmax, not max-win.

```ts
P(intent) = exp(finalWeight / temperature) / sum(exp(weight / temperature));
```

Softmax keeps behavior probabilistic, debuggable, and tunable.

### Step 6: Final Lock

Resolution outputs one final intent.

```ts
type FinalIntent = {
  action: string;
  target?: string;
  certainty: number;
  reasonTrace: string[];
};
```

## Explainability

Every final behavior must be traceable.

Example reason trace:

```text
baseIntent: hunt
memory: x1.2 because previous hunting succeeded
social: x0.8 because group hunting norm is weak
eets: x1.3 because scarcity is high
environment: x0.9 because visibility is reduced
final: selected by softmax
```

## Stability Integration

Resolution Model v1 helps prevent chaos explosion through:

- Softmax temperature control
- Urgency gating
- Survival override rules
- Category conflict grouping
- Bounded modifier normalization

## Resolution Tuning

These tuning values may be controlled by EETS.

```ts
const RESOLUTION_TUNING = {
  temperature: 1.0,
  survival_threshold: 0.3,
  social_weight: 1.0,
  economic_weight: 1.0,
  exploration_weight: 0.8,
};
```

## Full Tick Flow

```text
1. Agents generate base intents.
2. Runtime attaches memory and social context.
3. EETS modifies probability space.
4. Resolution Model merges sources and resolves conflicts.
5. Execution Model applies validated action.
6. World state updates.
7. Memory updates through feedback loop.
```

## Boundary Summary

```text
EETS shapes probability space.
RESOLUTION_MODEL selects outcome.
EXECUTION_MODEL applies reality.
```

Resolution Model v1 is the decision judiciary system of Earthly.
