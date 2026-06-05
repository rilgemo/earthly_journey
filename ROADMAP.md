# Earthly Journey Roadmap

This file tracks the long-term evolution path.

Current task execution lives in [TODO.md](TODO.md). Development rules live in [CLAUDE.md](CLAUDE.md). Simulation kernel specifications live in [AI/](AI/).

## Phase 1: Core RPG

Goal: make the current playable loop stable.

- Area exploration
- Action execution
- Skill discovery and equip flow
- Inventory and equipment basics
- Stamina thresholds
- World time display
- Save/load persistence
- First combat loop

## Phase 2: Engine Mapping

Goal: map current code to the future simulation kernel without rewriting everything.

- Define current direct-action flow
- Map player action clicks to future intent flow
- Separate action validation from action execution
- Add trace-friendly action results
- Create first implementation hooks for future agent runtime

## Phase 3: NPC Runtime V0

Goal: introduce the first autonomous entity.

- One simple non-player agent
- Basic needs
- Basic perception
- Candidate intent generation
- Resolution-compatible intent output
- Execution through existing action engine
- Trace output for each decision

## Phase 4: Economic Simulation

Goal: make resource movement affect behavior.

- Resource production and consumption
- Simple trade intent
- Basic scarcity pressure
- NPC inventory and gold flow
- EETS economy pressure integration

## Phase 5: Agent Society

Goal: connect agents through social memory and influence.

- Social memory graph
- Reputation changes
- Hearsay propagation
- Group behavior shifts
- Emergent roles

## Phase 6: Civilization Emergence

Goal: move from local agent behavior to society-level change.

- Factions
- Migration
- Governance pressure
- Large-scale conflict
- Culture formation

## Current Engineering Priority

The next major milestone is not another theory layer.

The next milestone is a first autonomous agent that uses the future pipeline shape:

```text
Perception -> Intent -> Resolution -> Execution -> Trace
```

It may be simple. The important part is that it runs through the architecture instead of bypassing it.
