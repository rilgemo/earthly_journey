# Reality vs Perception Model

Root `/AGENTS.md` is the sole architecture authority. This document records
implementation details only.

This model defines a strict one-way split between objective simulation truth
and subjective social cognition.

## Authority Boundary

```text
Reality -> Perception
Reality <-/ Perception
```

Reality includes authoritative tick snapshots, elemental fields, agent skills,
and true memory-event logs. Reality is produced by the existing runtime and is
not modified by this system.

Perception includes beliefs, interpreted events, perceived skills, perceived
identity, and confidence. Perception may be incomplete, distorted,
contradictory, or wrong.

Belief state is stored in an independent per-agent cognitive map. It must not be
attached to authoritative runtime agent or world-state objects.

## Perception Sources

- Direct observation with range-limited accuracy
- Social Memory Graph records
- Communication transfers
- Memory age and decay
- Trust in the information source

## Distortion

Perception distortion applies deterministic transformations:

- Distance lowers accuracy.
- Trust changes confidence.
- Older information loses reliability.
- Communication quality compresses event details.
- Contradictions coexist as separate beliefs.

The same seed and inputs must produce the same distortion.

## Forbidden Reverse Flow

Perception and belief state must never be read by:

- Intent Generator
- Resolution Model
- Skill, trait, identity, or knowledge authority
- Elemental Field Dynamics
- `tickManager()` world mutation logic

Perception does not change reality. It only creates cognitive and narrative
interpretations.

## Replay

Replay may map immutable reality frames to independent perception snapshots.
This mapping is read-only and does not alter the underlying Replay Buffer frame
or simulation truth.
