# Skill Emergence Implementation

Skill Emergence v1 defines continuous capability authority for simulation
agents.

## Runtime Flow

```text
explicit initial skill state
  -> innate traits + initial skills
  -> skills + traits + knowledge inform intent scores
  -> RESOLUTION_MODEL selects intent
  -> tickManager executes action
  -> matching skills grow
  -> identity is re-derived
  -> trace and replay preserve the change
```

## Modules

- `traitSystem.js`: deterministic innate traits and growth affinities
- `skillSystem.js`: canonical continuous skills and action-skill mappings
- `skillGain.js`: slow, diminishing action-driven growth
- `knowledgeSystem.js`: learned topics and learning-efficiency modifiers
- `identityDerivation.js`: read-only identities derived from skill thresholds

## Authority Boundary

```text
traits + skills + knowledge -> additive intent affinity
RESOLUTION_MODEL -> final intent
skills -> derived identity for observability only
```

Agents do not store profession, job, class, or role authority.

## Knowledge and Social Memory

Knowledge remains distinct from skill. It can be learned directly or discovered
from existing social-memory records. Knowledge increases matching action
learning efficiency and never writes skill values directly.

## Observability

The Skill Panel displays top skills, latest skill growth, knowledge count, and
derived identities. Agent traces expose `skillGain`, `knowledgeLearned`, and
`identityChanges`; Replay Buffer preserves these traces through immutable
snapshots.
