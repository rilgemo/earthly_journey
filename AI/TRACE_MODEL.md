# Earthly Trace Model v1

`TRACE_MODEL v1` is the observability and debugging layer for the Earthly simulation kernel.

It is not a runtime behavior layer. It does not generate intents, tune weights, select actions, execute actions, or mutate world state.

## Core Purpose

Trace Model v1 records why a tick produced a specific outcome.

It exists to make emergent behavior explainable, replayable, and debuggable.

## What To Trace

Each agent tick should be able to record:

- Intent generation trace
- Memory influence trace
- Social influence trace
- EETS modulation trace
- Resolution decision reason
- Execution outcome diff
- Memory feedback updates

## Trace Event Shape

```ts
type TickTrace = {
  tick_id: string;
  agent_id: string;
  perception_summary: string;
  candidate_intents: IntentTrace[];
  influence_trace: InfluenceTrace[];
  resolution_trace: ResolutionTrace;
  execution_diff?: ExecutionDiff;
  memory_updates?: MemoryUpdateTrace[];
};

type IntentTrace = {
  action: string;
  target?: string;
  category: 'survival' | 'social' | 'economic' | 'exploration' | 'combat';
  base_weight: number;
  urgency: number;
  confidence: number;
  source: string;
};

type InfluenceTrace = {
  source: 'memory' | 'social' | 'eets' | 'environment' | 'system';
  modifier: number;
  reason: string;
};

type ResolutionTrace = {
  selected_action: string;
  selected_target?: string;
  certainty: number;
  reason_trace: string[];
  rejected_intents: {
    action: string;
    reason: string;
  }[];
};

type ExecutionDiff = {
  hpChange?: number;
  staminaChange?: number;
  itemGain?: string[];
  itemLoss?: string[];
  locationChange?: string;
  timeAdvance?: number;
  worldFlagsChanged?: string[];
};

type MemoryUpdateTrace = {
  memory_key: string;
  delta: number;
  reason: string;
};
```

## Conflict Graph

Resolution traces may be represented as a conflict graph.

```ts
type ConflictGraph = {
  nodes: {
    id: string;
    action: string;
    finalWeight: number;
  }[];
  edges: {
    from: string;
    to: string;
    influence: 'competes_with' | 'boosted_by' | 'suppressed_by';
    source: string;
  }[];
  resolution_path: string[];
};
```

## Replay Requirements

A replayable tick should include enough information to reconstruct:

1. What the agent perceived
2. Which intents were generated
3. Which modifiers affected each intent
4. Which conflicts were resolved
5. Which final intent was selected
6. What execution changed
7. Which memories were reinforced or decayed

## Boundary Rules

- Trace Model may record simulation events.
- Trace Model may format debug output.
- Trace Model may support replay and visualization.
- Trace Model may not alter weights.
- Trace Model may not select intents.
- Trace Model may not execute actions.
- Trace Model may not mutate world state.

## Debugging Value

Trace Model v1 enables:

- Tick replay
- Decision path visualization
- Bias attribution
- Conflict graph inspection
- Emergence debugging
- Regression comparison between tuning changes
