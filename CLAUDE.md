# Earthly Journey

## 0. PROJECT SCOPE — TWO SYSTEMS

This repo contains two separate systems that share a codebase but must not be merged without an explicit design pass.

### Earthly Journey (player game)

- React UI: `src/components/` (LeftPanel, MainPanel, RightPanel, TickPanel)
- Data: `src/data/{areas,actions,skills,npcs}.js`
- Time: `src/utils/worldTime.js`, `src/utils/tickSystem.js` (1 tick = 1 ingame hour = 15 real minutes)
- This is what players experience. CLAUDE.md primarily documents this system.

### Simulation Sandbox (`src/simulation/`)

- Tick-based agent simulation: perception / intent / memory / reproduction / lineage
- Used to prototype and validate mechanics (memory decay, need systems, lineage, field dynamics) before a simplified version is designed into Earthly Journey
- Has its own tick concept (integer tick counter), its own agent model, its own world object — none of which are the same as the player game's worldTime or AGENTS
- NOT connected to the player game at runtime. Data does not flow between the two systems.

### Separation rules

- `src/simulation/` imports must not appear in player-game components (`LeftPanel`, `MainPanel`, `RightPanel`) or player-game data files
- The Simulation Sandbox UI (`SimulationInspector` / `TickPanel` / inspector hooks) is dev-only, gated behind `SHOW_SIMULATION_INSPECTOR = false` in `App.js`
- When a mechanic from the Sandbox is ready to migrate into Earthly Journey, it must be redesigned for the player game's data model — not imported directly

## LANGUAGE CONVENTION

- Code: variable names, keys, file names, comments, commit messages → English
- Display content: narrative, dialogue, UI labels, item/skill/agent names → Chinese
- Example: `AGENTS.lao_zhou.name = "老周"` (English key, Chinese display value)

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

For simulation logic, agent behavior, and DF x AI tick rules, consult root [AGENTS.md](AGENTS.md) and [AI/EXECUTION_MODEL.md](AI/EXECUTION_MODEL.md) before editing code.

For implementation bridges from the current React game to the future simulation kernel, consult [docs/implementation/phase1_mapping.md](docs/implementation/phase1_mapping.md).

## Specification Index

### World & Product Direction

> Priority: GDD defines player-facing intent and world principles.
> Technical specifications define implementation details and may evolve.
> If conflicts exist, raise explicitly instead of silently conforming.

- [GDD.md](docs/GDD.md) - Game design document: core vision, skill/attribute system, NPC ecology, world time, magic design principles (concept stage), Agent evolution draft (L1→L2→L3, design draft only)

### Architecture & Technical Design

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

- [AGENTS.md](AGENTS.md) - simulation architecture authority
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

Claude must not contain or reference simulation/system design logic. All design semantics belong in earthly-journey-sync.md only.

## Player Game Implementation Reference

NPC system (`src/data/npcs.js`) and tick system (`src/utils/tickSystem.js`) code-mapping details — schemas, APIs, XP/schedule-drift mechanics, current agent roster — live in [docs/player-game-implementation.md](docs/player-game-implementation.md), not here.
