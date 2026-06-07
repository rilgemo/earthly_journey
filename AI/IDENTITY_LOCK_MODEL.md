# Identity Anti-Influence Lock

Identity is strictly read-only derived observation state.

It is not an intent source, influence source, action authority, learning
modifier, trait modifier, or resolution input.

## Correct Runtime Flow

```text
Traits -> skill growth modifiers
Skills -> intent affinity
Knowledge -> learning efficiency
Influence Field -> contextual pressure

-> Intent Generator
-> RESOLUTION_MODEL
-> tickManager execution
-> world and stability phases
-> Identity derivation (post-process only)
```

There is no reverse path from Identity into simulation behavior.

## Hard Runtime Boundary

`identityGuard.assertNoIdentityLeak(context)` rejects any identity-bearing
decision input with:

```text
Identity leakage into decision layer detected
```

The guard runs inside both Intent Generator and `RESOLUTION_MODEL`.

At the start of each tick, the previous read-only identity snapshot is removed
from the runtime agent before decision processing. After all agent, world,
emergence, and stability processing completes, Identity Lock derives and
installs a new frozen snapshot.

## Storage Contract

Identity may exist:

- Between ticks as a frozen observational snapshot
- In trace and replay output
- In Inspector read-only views

Identity must not exist:

- In pre-resolution agent views
- In candidate intents or resolution context
- In skill growth, knowledge learning, trait, influence, or field inputs

## Authority

- Skill System is authoritative for capability.
- `RESOLUTION_MODEL` is authoritative for final intent.
- `tickManager()` is authoritative for mutation.
- Identity is descriptive only.
