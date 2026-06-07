# Skill Emergence Model

This document defines behavior-driven capability growth for simulation agents.
It owns continuous capability growth. Player equipment skills, RPG labels,
levels, XP, perks, and talent trees are separate concepts outside this model.

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

## Initialization

Agents begin with explicit continuous skill values. Initialization may provide
spawn templates, while derived identity expressions and behavioral expressions
are produced from later runtime history. Identity is generated from skills for
observation only.

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

## Ownership and Consumption

Skill Emergence owns:

- trait-influenced continuous skill growth
- knowledge-assisted learning efficiency
- post-action skill gain trace output
- read-only derived identity inputs

Intent scoring consumes skills and knowledge through additive affinity. Identity
Lock owns the anti-influence boundary. `tickManager()` owns skill mutation.
