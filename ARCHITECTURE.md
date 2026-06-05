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

## AI Simulation Kernel

- [AI/AGENTS.md](AI/AGENTS.md) - AI agent operating memory
- [AI/SYSTEM_PROMPT.md](AI/SYSTEM_PROMPT.md) - DF x AI hybrid system rules
- [AI/EXECUTION_MODEL.md](AI/EXECUTION_MODEL.md) - Simulation tick execution model
- [AI/MULTI_AGENT_RUNTIME.md](AI/MULTI_AGENT_RUNTIME.md) - Multi-agent cognitive runtime and social emergence layer
- [AI/EMERGENCE_TUNING.md](AI/EMERGENCE_TUNING.md) - Control plane for emergent behavior tuning and stability
- [AI/ARCHITECTURE.md](AI/ARCHITECTURE.md) - AI architecture index

## Authority Boundary

- `README.md` defines project meaning.
- `CLAUDE.md` defines AI and development constraints.
- `TODO.md` defines current execution state.
- `docs/*` defines the modular system specification.
- `AI/*` defines AI operating rules for simulation logic.
- `ARCHITECTURE.md` routes readers into `docs/*`.
