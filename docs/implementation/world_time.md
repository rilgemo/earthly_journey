# World Time Implementation Mapping

This document maps current world time to the future DF world simulation layer.

## Current State

World time is derived from real time using `Date.now()` and configuration constants.

It is displayed in the UI and may affect available actions.

## Future Function

World time is part of the DF layer.

It should support:

- Deterministic time derivation
- Time-period checks
- Environment updates
- Agent schedule checks
- Resource regeneration windows
- Traceable tick timing

## Mapping

| Current Time Concept | Future DF Concept |
| --- | --- |
| `getWorldTime()` | Time derivation function |
| `period` | Environmental context |
| Day/night | Visibility and action constraint |
| Refresh interval | UI update, not simulation authority |
| `EPOCH_MS` | World epoch anchor |

## Implementation Rule

Do not store the clock as mutable state.

Time should remain derived. Simulation systems may use time as input, but they should not own time.
