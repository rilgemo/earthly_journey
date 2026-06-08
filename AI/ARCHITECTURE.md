# Architecture Index

This project uses a DF x AI hybrid simulation model.

`AI/` defines AI operating rules for simulation work. `/docs` contains the modular system specification.

## Core AI Docs

- [../AGENTS.md](../AGENTS.md) - single simulation architecture authority
- [SYSTEM_PROMPT.md](SYSTEM_PROMPT.md) - Agent execution prompt and runtime output contract
- [EXECUTION_MODEL.md](EXECUTION_MODEL.md) - Runtime tick flow and validation pipeline
- [MULTI_AGENT_RUNTIME.md](MULTI_AGENT_RUNTIME.md) - Multi-agent cognition, social memory, influence, and emergent behavioral expressions
- [EMERGENCE_TUNING.md](EMERGENCE_TUNING.md) - Control plane for tuning emergent behavior probability and stability
- [RESOLUTION_MODEL.md](RESOLUTION_MODEL.md) - Final intent arbitration, conflict grouping, softmax selection, and reason tracing
- [TRACE_MODEL.md](TRACE_MODEL.md) - Observability, replay, conflict graph, and emergence debugging
- [AGENT_TYPOLOGY_MODEL.md](AGENT_TYPOLOGY_MODEL.md) - Causal participation profiles for agent weighting behavior
- [INTENT_PURITY_BOUNDARY.md](INTENT_PURITY_BOUNDARY.md) - Strict phase boundary for pure scoring, enrichment, and resolution
- [CULTURE_EMERGENCE_MODEL.md](CULTURE_EMERGENCE_MODEL.md) - Read-only cultural stabilization detection from traces
- [CIVILIZATION_MEMORY_MODEL.md](CIVILIZATION_MEMORY_MODEL.md) - Cross-temporal compression of persistent emergent structures
- [REPLAY_MODEL.md](REPLAY_MODEL.md) - Read-only time travel buffer for immutable tick snapshots
- [INFLUENCE_FIELD.md](INFLUENCE_FIELD.md) - Additive behavioral pressure layer, not decision or execution
- [DECISION_INSPECTOR.md](DECISION_INSPECTOR.md) - Observability-only decision analysis and immutable decision traces
- [ELEMENTAL_FIELD_SYSTEM.md](ELEMENTAL_FIELD_SYSTEM.md) - Continuous elemental world physics, not gameplay or resources
- [COUPLED_EMERGENCE_LAYER.md](COUPLED_EMERGENCE_LAYER.md) - Additive cross-system feedback propagation, not a decision or mutation layer
- [STABILITY_CONTROLLER.md](STABILITY_CONTROLLER.md) - Gain-based feedback regulation, not state clamping or decision logic
- [SKILL_EMERGENCE_MODEL.md](SKILL_EMERGENCE_MODEL.md) - Trait, skill, knowledge, and derived identity authority
- [IDENTITY_LOCK_MODEL.md](IDENTITY_LOCK_MODEL.md) - Hard anti-influence boundary for post-tick derived identity
- [REALITY_VS_PERCEPTION_MODEL.md](REALITY_VS_PERCEPTION_MODEL.md) - One-way reality-to-belief interpretation boundary
- [REALITY_PERCEPTION_DRIFT_MODEL.md](REALITY_PERCEPTION_DRIFT_MODEL.md) - Bounded cognitive drift and rumor stability diagnostics
- [BEHAVIORAL_SIGNATURE_MODEL.md](BEHAVIORAL_SIGNATURE_MODEL.md) - Observational action-sequence analytics with no runtime influence
- [WORLD_DEMAND_SYSTEM.md](WORLD_DEMAND_SYSTEM.md) - Smoothed persistent activity cluster pressure and additive opportunity signals
- [RESOURCE_GEOGRAPHY_MODEL.md](RESOURCE_GEOGRAPHY_MODEL.md) - Seeded environmental resource topology and read-only snapshots
- [RESOURCE_FLOW_MODEL.md](RESOURCE_FLOW_MODEL.md) - Dynamic resource depletion, regeneration, and diffusion
- [ACTION_YIELD_MODEL.md](ACTION_YIELD_MODEL.md) - Environmental action outcome magnitude, not decision logic
- [SETTLEMENT_EMERGENCE_MODEL.md](SETTLEMENT_EMERGENCE_MODEL.md) - Read-only persistent activity cluster observation
- [MIGRATION_PRESSURE_MODEL.md](MIGRATION_PRESSURE_MODEL.md) - Stability imbalance field, not movement logic
- [PROTO_ECONOMY_MODEL.md](PROTO_ECONOMY_MODEL.md) - Resource exchange emergence and reciprocity observation
- [ENTITY_SCHEMA.md](ENTITY_SCHEMA.md) - Canonical entity contract layer and lifecycle rules

## Core Project Docs

- [../docs/01_core_architecture.md](../docs/01_core_architecture.md) - Application boundaries and implementation rules
- [../docs/02_agent_system.md](../docs/02_agent_system.md) - Agent model and future NPC references
- [../docs/03_decision_system.md](../docs/03_decision_system.md) - Decision system placeholder and current action selection model
- [../docs/04_memory_system.md](../docs/04_memory_system.md) - Memory system placeholder and current persistence model
- [../docs/06_world_simulation.md](../docs/06_world_simulation.md) - World time and simulation scope
- [../docs/07_action_system.md](../docs/07_action_system.md) - Action validation and resolver behavior

## Rule

Always consult root `/AGENTS.md` and `/AI/EXECUTION_MODEL.md` before modifying simulation logic.

For multi-agent behavior, social memory, reputation, influence, or emergent behavioral expressions, also consult `/AI/MULTI_AGENT_RUNTIME.md`.

For tuning, stability control, narrative emergence bias, or behavior probability shaping, also consult `/AI/EMERGENCE_TUNING.md`.

For final intent selection, conflict arbitration, stochastic selection, or decision traceability, also consult `/AI/RESOLUTION_MODEL.md`.

For tick replay, decision explainability, conflict graphs, or bias attribution, also consult `/AI/TRACE_MODEL.md`.

For agent causal participation profiles, weighting modifiers, or typology trace output, also consult `/AI/AGENT_TYPOLOGY_MODEL.md`.

For intent scoring purity, enrichment boundaries, or intent pipeline work, also consult `/AI/INTENT_PURITY_BOUNDARY.md`.

For culture detection, cross-agent behavioral stabilization, or downstream-only cultural traces, also consult `/AI/CULTURE_EMERGENCE_MODEL.md`.

For civilization memory, cross-temporal compression, persistence graphs, or drift resistance analysis, also consult `/AI/CIVILIZATION_MEMORY_MODEL.md`.

For simulation-agent traits, continuous skill growth, knowledge-assisted
learning or derived identities, also consult
`/AI/SKILL_EMERGENCE_MODEL.md`.

For any identity derivation, display, trace, or runtime boundary work, also
consult `/AI/IDENTITY_LOCK_MODEL.md`.

For belief state, information distortion, social interpretation, or asymmetric
knowledge work, also consult `/AI/REALITY_VS_PERCEPTION_MODEL.md`.

For cognitive drift, belief convergence, rumor persistence, or perception
stability metrics, also consult `/AI/REALITY_PERCEPTION_DRIFT_MODEL.md`.

For action-history analytics, behavior loops, transition metrics, or behavioral
signatures, also consult `/AI/BEHAVIORAL_SIGNATURE_MODEL.md`.

For persistent activity cluster pressure, opportunity signals, demand smoothing, or demand
trace work, also consult `/AI/WORLD_DEMAND_SYSTEM.md`.

## Influence Boundary

All influence layers must be additive only.

`MULTI_AGENT_RUNTIME`, `EMERGENCE_TUNING`, memory systems, social systems, and environment systems may only contribute modifiers, signals, or candidate intents.

Only `RESOLUTION_MODEL` may normalize competing influences and finalize decision selection.

No other module may perform final normalization, conflict arbitration, or final intent selection.

Do not duplicate architecture rules here. Link to the canonical docs instead.
