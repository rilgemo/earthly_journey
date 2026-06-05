# Earthly Journey

This file is the constraint layer for AI and developer work.

It defines how Earthly Journey must be built. Product meaning belongs in [README.md](README.md). Current tasks and backlog belong in [TODO.md](TODO.md).

See `/docs` for the full project specification.

## Specification Index

- [00_overview.md](docs/00_overview.md) - Project overview, stack, core loop, and current file structure
- [01_core_architecture.md](docs/01_core_architecture.md) - Architecture boundaries and implementation rules
- [02_agent_system.md](docs/02_agent_system.md) - Agent model and future NPC ecology references
- [03_decision_system.md](docs/03_decision_system.md) - Future decision pipeline placeholder
- [04_memory_system.md](docs/04_memory_system.md) - Future memory model placeholder
- [05_skill_system.md](docs/05_skill_system.md) - Skill identity, stat derivation, XP, leveling, and slots
- [06_world_simulation.md](docs/06_world_simulation.md) - World time and simulation cycle
- [07_action_system.md](docs/07_action_system.md) - Action schema, requirements, costs, cooldowns, and resolver behavior
- [08_data_schemas.md](docs/08_data_schemas.md) - Canonical data schemas
- [09_ui_conventions.md](docs/09_ui_conventions.md) - UI layout, panel flow, colors, and rendering rules
- [10_future_roadmap.md](docs/10_future_roadmap.md) - Implementation status, planned systems, and long-term vision

## Development Guidelines for AI

Prioritize current implementation over future systems.

When adding new features:

1. Follow existing schemas first.
2. Prefer extending data files over adding special-case code.
3. Do not implement future systems unless explicitly requested.

When in doubt, follow the data schemas and non-negotiable rules.
