# Architecture Index

This project uses a DF x AI hybrid simulation model.

`AI/` defines AI operating rules for simulation work. `/docs` contains the modular system specification.

## Core AI Docs

- [AGENTS.md](AGENTS.md) - Codex and AI agent operating memory
- [SYSTEM_PROMPT.md](SYSTEM_PROMPT.md) - Compressed DF x AI hybrid rules
- [EXECUTION_MODEL.md](EXECUTION_MODEL.md) - Runtime tick flow and validation pipeline
- [MULTI_AGENT_RUNTIME.md](MULTI_AGENT_RUNTIME.md) - Multi-agent cognition, social memory, influence, and emergent roles
- [EMERGENCE_TUNING.md](EMERGENCE_TUNING.md) - Control plane for tuning emergent behavior probability and stability

## Core Project Docs

- [../docs/01_core_architecture.md](../docs/01_core_architecture.md) - Application boundaries and implementation rules
- [../docs/02_agent_system.md](../docs/02_agent_system.md) - Agent model and future NPC references
- [../docs/03_decision_system.md](../docs/03_decision_system.md) - Decision system placeholder and current action selection model
- [../docs/04_memory_system.md](../docs/04_memory_system.md) - Memory system placeholder and current persistence model
- [../docs/06_world_simulation.md](../docs/06_world_simulation.md) - World time and simulation scope
- [../docs/07_action_system.md](../docs/07_action_system.md) - Action validation and resolver behavior

## Rule

Always consult `/AI/AGENTS.md` and `/AI/EXECUTION_MODEL.md` before modifying simulation logic.

For multi-agent behavior, social memory, reputation, influence, or emergent roles, also consult `/AI/MULTI_AGENT_RUNTIME.md`.

For tuning, stability control, narrative emergence bias, or behavior probability shaping, also consult `/AI/EMERGENCE_TUNING.md`.

Do not duplicate architecture rules here. Link to the canonical docs instead.
