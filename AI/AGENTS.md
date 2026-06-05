# Earthly Journey - Agent Operating Memory

You are working inside Earthly Journey, an agent-based simulation game.

## Core Principle

The world follows a DF x AI hybrid simulation model:

- DF (World Layer): defines physical reality, constraints, and simulation rules
- AI (Agent Layer): defines intention, decision-making, and behavior
- Engine Layer: validates and executes actions

DF controls what is possible.

AI controls what is desired.

Engine decides what actually happens.

## Execution Rule

All actions must follow:

```text
Perception -> Intent -> Validation (DF) -> Execution -> Memory Update
```

No agent may bypass the validation layer.

## Non-Negotiable Rules

- DF controls what is possible.
- AI controls what is desired.
- Engine resolves final outcome.
- No direct state mutation from the AI layer.
- No behavior logic inside UI components.
- All behavior must go through the action system.
- Simulation rules must remain data-driven.

## System Priority

When intent and reality conflict, resolve in this order:

1. DF constraints
2. Physical constraints
3. Action validation
4. Agent decision priority
5. Random tie-breakers

## Memory System

Agents evolve through:

- Experience accumulation
- Reinforcement signals
- Skill-like behavior adaptation

Skill XP is a structured form of memory reinforcement.

## Code Guidelines

- Follow the modular data-driven architecture.
- Do not hardcode game logic in components.
- Route all behavior through the action system.
- Keep world-layer simulation deterministic.
- Keep AI intent generation separate from execution.

## Docs Source of Truth

Primary documentation lives in `/docs/`.

AI operating specification:

- `/AI/SYSTEM_PROMPT.md`
- `/AI/EXECUTION_MODEL.md`
- `/AI/MULTI_AGENT_RUNTIME.md`
- `/AI/EMERGENCE_TUNING.md`
- `/AI/RESOLUTION_MODEL.md`
- `/AI/TRACE_MODEL.md`
- `/docs/01_core_architecture.md`
- `/docs/02_agent_system.md`
- `/docs/06_world_simulation.md`
- `/docs/07_action_system.md`
