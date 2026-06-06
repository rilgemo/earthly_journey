# Earthly Decision Inspector v1

`DECISION_INSPECTOR v1` is an observability-only decision analysis layer.

It explains completed intent selection using existing candidate, influence, and resolution traces.

It is not a decision layer and it is not a simulation layer.

## Pipeline Position

```text
Memory / Social Memory / Influence Field
  -> Intent Generator
  -> RESOLUTION_MODEL
  -> Decision Trace
  -> Decision Inspector
```

Decision Inspector runs after resolution. It cannot affect the selected intent.

## Recorded Data

- Selected intent
- Candidate intents
- Candidate scores
- Candidate score breakdowns
- Influence contributions
- Final resolution result

## Boundary Rules

Decision Inspector may:

- Rank candidates for display
- Format score breakdowns
- Expose influence contributions
- Verify trace integrity
- Support Inspector UI and replay analysis

Decision Inspector may not:

- Modify scores
- Modify intent generation
- Modify resolution
- Select actions
- Execute actions
- Mutate world state
- Bypass `RESOLUTION_MODEL`
- Bypass `tickManager()`

Decision traces and inspection results must be immutable snapshots.
