# Architecture

This project architecture is defined in `/docs`.

`ARCHITECTURE.md` is an index only. It does not define rules, schemas, systems, or implementation behavior.

Simulation AI operating rules are defined in `/AI`.

## Start Here

- [docs/00_overview.md](docs/00_overview.md) - Project overview, stack, core loop, and current file structure
- [docs/01_core_architecture.md](docs/01_core_architecture.md) - Core architecture authority: application boundaries, state ownership, and implementation rules
- [docs/02_agent_system.md](docs/02_agent_system.md) - Agent model and future NPC ecology references
- [docs/03_decision_system.md](docs/03_decision_system.md) - Current action selection model and future decision system placeholder
- [docs/04_memory_system.md](docs/04_memory_system.md) - Current persistence model and future memory system placeholder
- [docs/05_skill_system.md](docs/05_skill_system.md) - Skill identity, stat derivation, XP, leveling, and slots
- [docs/06_world_simulation.md](docs/06_world_simulation.md) - World time and simulation scope
- [docs/07_action_system.md](docs/07_action_system.md) - Action resolver behavior, requirements, costs, and cooldowns
- [docs/08_data_schemas.md](docs/08_data_schemas.md) - Canonical data schemas
- [docs/09_ui_conventions.md](docs/09_ui_conventions.md) - UI layout, panel flow, colors, and rendering rules
- [docs/10_future_roadmap.md](docs/10_future_roadmap.md) - Implementation status, planned systems, and long-term vision
- [docs/implementation/phase1_mapping.md](docs/implementation/phase1_mapping.md) - Bridge from current code to future simulation kernel

## AI Simulation Kernel

- [AGENTS.md](AGENTS.md) - simulation architecture authority
- [AI/SYSTEM_PROMPT.md](AI/SYSTEM_PROMPT.md) - Agent execution prompt and runtime output contract
- [AI/EXECUTION_MODEL.md](AI/EXECUTION_MODEL.md) - Simulation tick execution model
- [AI/MULTI_AGENT_RUNTIME.md](AI/MULTI_AGENT_RUNTIME.md) - Multi-agent cognitive runtime and social emergence layer
- [AI/EMERGENCE_TUNING.md](AI/EMERGENCE_TUNING.md) - Control plane for emergent behavior tuning and stability
- [AI/RESOLUTION_MODEL.md](AI/RESOLUTION_MODEL.md) - Final intent arbitration and explainable decision selection
- [AI/TRACE_MODEL.md](AI/TRACE_MODEL.md) - Observability, replay, and emergence debugging
- [AI/ARCHITECTURE.md](AI/ARCHITECTURE.md) - AI architecture index

## Authority Boundary

- `README.md` defines project meaning.
- `CLAUDE.md` defines AI and development constraints.
- `TODO.md` defines current execution state.
- `ROADMAP.md` defines long-term phase direction.
- `docs/*` defines the modular system specification.
- `docs/implementation/*` maps theory to current code.
- `AI/*` defines AI operating rules for simulation logic.
- `ARCHITECTURE.md` routes readers into `docs/*`.

## Anti-Drift Alignment

This repository enforces a strict layer separation:

- `UI Layer` = React rendering only
- `Simulation Layer` = authoritative runtime
- `AI Layer` = design and specification only
- `Data Layer` = static content definitions

Core rule:

> Copilot must never decide simulation logic placement.
> Simulation layer is always authoritative over UI and AI definitions.

All state mutation must converge through `tickManager()` in `/src/simulation/`.

## Execution Contract Layer

The Execution Contract Layer sits between AI intent and simulation mutation.
It defines the translation rules that prevent drift from AI proposals into world state changes.

```
        ┌──────────────┐
        │   AI Layer    │
        │ (Intent Flow) │
        └──────┬───────┘
               │ RESOLUTION_MODEL
               ▼
   ┌──────────────────────────┐
   │ Execution Contract Layer │
   │ - intent normalization    │
   │ - action schema mapping   │
   │ - DF rule validation     │
   │ - canonical action registry│
   └──────────┬───────────────┘
              ▼
   ┌──────────────────────────┐
   │ Simulation Layer         │
   │ tickManager() ONLY       │
   └──────────┬───────────────┘
              ▼
   ┌──────────────────────────┐
   │ World State              │
   └──────────────────────────┘
```

Hard rules for the contract layer:

- AI may propose intent, never mutate world state.
- RESOLUTION_MODEL normalizes intent into a validated action.
- The simulation layer is the only authority that commits mutations.
- `tickManager()` is the single mutation gate.
- Any mapping from intent to action schema must be explicit, documented, and checked.
