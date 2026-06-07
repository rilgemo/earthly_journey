# Intent System Purity Boundary v1

Subtitle: Separation of Intent Scoring and System Side-Effects

## Objective

Intent generation is split into a strict two-phase plus resolution model:

- Phase A: Pure Intent Scoring
- Phase B: Intent Resolution Context Assembly
- Phase C: Intent Resolution

No typology, demand, field, skill, or memory system may trigger side effects during scoring.

## Core Principle

```text
Scoring -> Pure computation only
Enrichment -> Controlled metadata layer
Resolution -> Final selection stage
```

## Modules

```text
src/simulation/intent/
|-- intentScorer.js
|-- intentEnricher.js
|-- intentResolver.js
|-- intentTraceBuilder.js
`-- intentPipeline.js
```

## Phase A: Intent Scorer

The scorer takes agent state, action definitions, environment signals, and system modifiers.

It outputs:

```ts
{
  intentScores: [],
  scoreBreakdown: {},
  deterministicSeedHash: string
}
```

Strict rules:

- No mutation
- No fallback logic
- No skill injection
- No default action injection
- No trace writing
- No runtime system calls

## Phase B: Intent Enricher

The enricher may attach:

- Metadata
- Skill suggestions
- Fallback candidate labels
- Trace labels

It must not:

- Modify scores
- Modify intent ordering
- Modify selection probabilities

## Phase C: Intent Resolver

The resolver selects the final intent from the enriched set only.

## Trace Output

`intentTraceBuilder.js` records:

- Phase A raw scores
- Modifier contributions
- Phase B enrichment additions
- Phase C final selection rationale

It must not mutate runtime state.

## Tick Integration

`tickManager` calls:

```text
intentPipeline.execute()
```

Tick order remains unchanged:

```text
Perception -> Intent Generation -> Resolution -> Execution -> TraceCollector
```

## Boundary

Typology, demand, field, skill, and memory may enter Phase A as score modifiers only.

They may not inject actions, trigger fallback behavior, change list size, or alter execution path.
