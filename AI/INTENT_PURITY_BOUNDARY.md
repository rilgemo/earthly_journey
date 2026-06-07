# Intent System Purity Boundary v1

Intent generation must be auditable and side-effect free during scoring.

## Runtime Rule

```text
Perception -> Pure Scoring -> Controlled Enrichment -> Resolution -> Execution
```

## Phase Authority

Phase A: Scoring

- Pure computation only
- No mutation
- No fallback injection
- No skill injection
- No runtime writes

Phase B: Enrichment

- Metadata only
- Trace labels only
- No score changes
- No ordering changes

Phase C: Resolution

- Selects final intent from provided enriched candidates only

## System Boundary

Typology, demand, field, memory, and skill systems may provide additive scoring modifiers.

They may not trigger behavior, inject actions, modify execution path, or bypass resolution.

## Implementation Authority

The implementation lives in:

```text
src/simulation/intent/
```

The compatibility facade lives in:

```text
src/simulation/intentGenerator.js
```
