# Continuous Biological Semantic Drift Detection v1

## Purpose

This observation system continuously detects semantic pressure toward:

- scalar survivability models
- aggregated biological scores
- UI-derived simulation shortcuts
- Capacity interpreted as maximum health
- AI or debug compression of multidimensional biology

It does not change simulation behavior.

## Authority Boundary

The detector belongs to the Observation Layer.

It may:

- read source text
- classify terminology
- produce immutable reports
- distinguish active specifications from historical audit records

It must not:

- write simulation state
- enter intent or resolution inputs
- alter execution
- rewrite documentation automatically
- suppress historical records

## Detection Scopes

| Scope | Meaning |
| --- | --- |
| `critical` | Simulation causal implementation |
| `authority-risk` | AI prompts and active specifications |
| `compression-risk` | Inspector and debug representation |
| `historical` | Migration and architecture audit history |
| `observation` | Detector documentation that names forbidden patterns |

Historical and observation findings remain visible but do not count as active
semantic drift.

## Report Contract

```js
{
  timestamp,
  activeDriftCount,
  historicalReferenceCount,
  observationReferenceCount,
  countsByType,
  activeFindings,
  historicalFindings,
  semanticIntegrity
}
```

Reports are deterministic and frozen.

## Drift Types

- `scalar-survival-model`
- `aggregated-biological-score`
- `ui-derived-simulation-shortcut`
- `capacity-max-analogue`
- `ai-debug-semantic-compression`

## Continuous Verification

The Jest analysis suite scans the current repository on every test run.

This provides continuous detection without introducing a runtime hook, tick
dependency, inspector feedback path, or simulation mutation authority.
