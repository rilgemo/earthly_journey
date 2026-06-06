# Architecture Index

This project uses a DF x AI hybrid simulation model.

`AI/` defines AI operating rules for simulation work. `/docs` contains the modular system specification.

## Core AI Docs

- [AGENTS.md](AGENTS.md) - Codex and AI agent operating memory
- [SYSTEM_PROMPT.md](SYSTEM_PROMPT.md) - Agent execution prompt and runtime output contract
- [EXECUTION_MODEL.md](EXECUTION_MODEL.md) - Runtime tick flow and validation pipeline
- [MULTI_AGENT_RUNTIME.md](MULTI_AGENT_RUNTIME.md) - Multi-agent cognition, social memory, influence, and emergent roles
- [EMERGENCE_TUNING.md](EMERGENCE_TUNING.md) - Control plane for tuning emergent behavior probability and stability
- [RESOLUTION_MODEL.md](RESOLUTION_MODEL.md) - Final intent arbitration, conflict grouping, softmax selection, and reason tracing
- [TRACE_MODEL.md](TRACE_MODEL.md) - Observability, replay, conflict graph, and emergence debugging
- [REPLAY_MODEL.md](REPLAY_MODEL.md) - Read-only time travel buffer for immutable tick snapshots
- [INFLUENCE_FIELD.md](INFLUENCE_FIELD.md) - Additive behavioral pressure layer, not decision or execution
- [DECISION_INSPECTOR.md](DECISION_INSPECTOR.md) - Observability-only decision analysis and immutable decision traces
- [ELEMENTAL_FIELD_SYSTEM.md](ELEMENTAL_FIELD_SYSTEM.md) - Continuous elemental world physics, not gameplay or resources
- [COUPLED_EMERGENCE_LAYER.md](COUPLED_EMERGENCE_LAYER.md) - Additive cross-system feedback propagation, not a decision or mutation layer
- [STABILITY_CONTROLLER.md](STABILITY_CONTROLLER.md) - Gain-based feedback regulation, not state clamping or decision logic
- [ENTITY_SCHEMA.md](ENTITY_SCHEMA.md) - Canonical entity contract layer and lifecycle rules

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

For final intent selection, conflict arbitration, stochastic selection, or decision traceability, also consult `/AI/RESOLUTION_MODEL.md`.

For tick replay, decision explainability, conflict graphs, or bias attribution, also consult `/AI/TRACE_MODEL.md`.

## Influence Boundary

All influence layers must be additive only.

`MULTI_AGENT_RUNTIME`, `EMERGENCE_TUNING`, memory systems, social systems, and environment systems may only contribute modifiers, signals, or candidate intents.

Only `RESOLUTION_MODEL` may normalize competing influences and finalize decision selection.

No other module may perform final normalization, conflict arbitration, or final intent selection.

Do not duplicate architecture rules here. Link to the canonical docs instead.
