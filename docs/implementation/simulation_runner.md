# Simulation Scenario Runner v1

The Simulation Scenario Runner is a deterministic validation environment for Earthly Core Runtime v1.

It is not a gameplay system and does not introduce an alternative runtime.

## Runtime Path

Each simulated day executes one existing world tick:

```text
Playable World Slice
  -> tickManager()
  -> TraceCollector
  -> ReplayBuffer
  -> Simulation Report
```

The runner reuses Agent Tick v2, Social Memory, Influence Field, Resolution, Elemental Field Dynamics, Coupled Emergence, Stability Controller, tick traces, and replay snapshots.

## Playable World Slice

- Grid: `20 x 20`
- Terrain expression seeds: human settlement expression, forest, river, mountain
- Population: 12 NPCs, 6 animals, 2 monsters
- Spawn templates: 3 farming-biased, 3 hunting-biased, 3 forging-biased, 3 arcane-biased humanoid agents

Initial field baselines:

| Terrain | Fields |
| --- | --- |
| Human settlement expression | life 60, arcane 20 |
| Forest | life 90, water 40 |
| River | water 100, life 30 |
| Mountain | earth 100, fire 20 |

All entities are validated through `ENTITY_SCHEMA` before simulation.

## Running A Scenario

```js
const { runScenario } = require('../../src/simulation/runner/scenarioRunner');

const result = runScenario({
  days: 30,
  seed: 12345,
  pretty: true
});

console.log(result.report);
```

Supported validation durations include 7, 30, and 90 days. Any positive integer duration is accepted.

## Metrics

The report contains:

- Population and deaths by registered entity type
- Existing action distribution
- Memory creation, transfer, and forgetting
- Fire, water, life, and arcane field drift
- Average stability indices
- Trace-derived combat, death, communication, and field event counts
- Replay frame count

`farm`, `forge`, combat, and death metrics remain zero until those behaviors exist in the registered runtime. The runner does not invent actions or lifecycle events.

## Event Stream Boundary

The current runtime exposes events through existing tick traces, communication traces, field conversion traces, and area recent events.

The runner summarizes those sources. It does not create a duplicate Event Stream implementation.

## Replay Boundary

Each simulated day pushes one immutable snapshot through the existing `ReplayBuffer`.

Scenario snapshots include a read-only summary compatible with the Inspector Scenario Summary panel:

- Current day
- Population
- Deaths
- Stability score

## Determinism

The seed controls scenario initialization. Runtime execution remains deterministic because all daily simulation work flows through the existing deterministic runtime path.
