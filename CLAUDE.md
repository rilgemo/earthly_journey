# Earthly Journey

This file is the code and development constraint layer.

It defines how Earthly Journey must be built. Product meaning belongs in [README.md](README.md). Current tasks and backlog belong in [TODO.md](TODO.md).

## System Boundary

This file defines:

- Code structure rules
- React architecture rules
- UI constraints
- Data organization expectations
- Development workflow guidance

This file does not define:

- Simulation rules
- Agent behavior rules
- World physics rules
- DF x AI runtime semantics

Simulation rules are defined in `/AI` only.

See `/docs` for the full project specification.

For simulation logic, agent behavior, and DF x AI tick rules, consult [AI/AGENTS.md](AI/AGENTS.md) and [AI/EXECUTION_MODEL.md](AI/EXECUTION_MODEL.md) before editing code.

For implementation bridges from the current React game to the future simulation kernel, consult [docs/implementation/phase1_mapping.md](docs/implementation/phase1_mapping.md).

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

## AI Simulation Kernel

- [AI/AGENTS.md](AI/AGENTS.md) - AI agent operating memory
- [AI/SYSTEM_PROMPT.md](AI/SYSTEM_PROMPT.md) - DF x AI hybrid rules
- [AI/EXECUTION_MODEL.md](AI/EXECUTION_MODEL.md) - Tick flow and validation pipeline
- [AI/ARCHITECTURE.md](AI/ARCHITECTURE.md) - AI architecture index
- [AI/CONTRACT_TEST_SUITE.md](AI/CONTRACT_TEST_SUITE.md) - Authoritative contract tests for runtime protection

## Test Suite Authority

The **Simulation Contract Test Suite v1** (see [tests/README.md](tests/README.md)) is authoritative.

A runtime feature is not considered valid until protected by contract tests.

Required coverage:
- Action Registry enforcement (no unregistered actions execute)
- Execution Contract pipeline (Intent → Contract → TickManager)
- Trace integrity (all rejections traceable)
- Tick determinism (fixed seed = fixed result)
- Mana conservation (0 ≤ mana ≤ maxMana)
- Field stability (0 ≤ fields < MAX_FIELD)
- Smoke tests (daily sanity: 10 agents, 20 ticks, no crashes)

All new features must include at least one contract test before merging to main.

## Development Guidelines for AI

Prioritize current implementation over future systems.

When adding new features:

1. Follow existing schemas first.
2. Prefer extending data files over adding special-case code.
3. Do not implement future systems unless explicitly requested.

When in doubt, follow the data schemas and non-negotiable rules.
