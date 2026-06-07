# Skill Emergence Model

This document defines behavior-driven capability growth for simulation agents.
It does not define player equipment skills, RPG classes, levels, XP, perks, or
talent trees.

## Runtime Authority

```text
Trait
  -> Skill
  -> Knowledge
  -> runtime behavior

Post-tick:
Skills -> Identity observation
```

- Traits are innate spawn attributes and influence skill growth rates.
- Skills are continuous capability values that grow through matching actions.
- Knowledge improves learning efficiency but never grants skill mastery.
- Identity is derived from current skills and is observability metadata only.

Identity is protected by `IDENTITY_LOCK_MODEL`: it is removed before decision
processing and re-derived only after tick processing completes.

`RESOLUTION_MODEL` remains the only final intent authority. `tickManager()`
remains the only mutation authority.

## Profession Migration

Profession is legacy spawn metadata only. At spawn it selects an initial skill
template, such as farming for a farmer or forging and mining for a blacksmith.
After initialization, runtime intent generation must not read profession.

```text
legacy profession -> initial skills -> runtime ends profession authority
```

Identity must never replace profession as a behavior authority. It is generated
from skills and may be displayed or traced, but intent generation must not read
it.

## Continuous Growth

Actions produce small gains in their matching skills. Growth uses diminishing
returns so practiced agents continue learning more slowly without levels or
threshold-based advancement.

Traits multiply growth for related skills. Learned or socially transferred
knowledge may increase learning efficiency for matching actions, but it does not
directly increase skill values.

## Trace Contract

Each agent trace may expose:

- `skillGain`
- `knowledgeLearned`
- `identityChanges`

These fields are read-only observability data and are preserved by Replay
Buffer snapshots.

## Forbidden

- Classes, levels, XP, perks, and talent trees
- Profession or identity based runtime scoring
- Knowledge that directly grants skill values
- Skill mutation outside `tickManager()`
