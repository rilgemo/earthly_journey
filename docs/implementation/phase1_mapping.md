# Phase 1 Implementation Mapping

This document maps the current playable RPG implementation to the future simulation kernel.

It is an engineering bridge, not a new system spec.

## Current State

The current game loop is direct and player-driven:

```text
Player clicks action
-> handleAction(actionKey)
-> validate current state inline
-> mutate player/game state
-> append message
-> render updated UI
```

Current implemented concepts:

- Area
- Action
- Skill
- Inventory
- Equipment
- Stamina
- World time
- Message feed

## Future State

The target simulation flow is:

```text
Agent
-> Perception
-> Candidate Intents
-> EETS modifiers
-> Resolution Model
-> Execution Model
-> World state mutation
-> Trace output
```

## Bridge Strategy

Do not rewrite the game all at once.

Instead, evolve the current action system in stages:

1. Keep player click as the input source.
2. Wrap clicked actions as player intents.
3. Move validation into a reusable action validation function.
4. Move mutation into a reusable action execution function.
5. Return structured action results.
6. Add trace output around action execution.
7. Reuse the same pipeline for the first autonomous agent.

## Current To Future Mapping

| Current Code Concept | Future Kernel Concept |
| --- | --- |
| Player click | Player-generated intent |
| Action key | Intent action |
| Action requirements | DF validation |
| Stamina cost | Execution cost |
| Action reward | World mutation |
| Message feed entry | Trace plus player-facing event |
| Skill XP gain | Memory reinforcement / structured learning |
| Area travel | Location mutation |

## First Engineering Target

The first target is not full multi-agent simulation.

The first target is:

```text
player action -> intent wrapper -> validation -> execution result -> trace
```

Once that exists, a simple autonomous entity can reuse the same execution path.
