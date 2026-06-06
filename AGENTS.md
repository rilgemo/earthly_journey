# Earthly Journey Agent Context Loader

This file is the project-level execution bootstrap contract for AI agents.

Read this file first before any architecture review, code change, test change, or documentation change.

## Context Loading Order

Before making code changes, read context in this order:

1. `README.md`
2. `CLAUDE.md`
3. `ROADMAP.md`
4. `TODO.md`
5. `AI/ARCHITECTURE.md`

Then read specific referenced files as needed for the task.

For simulation logic, always consult:

- `AI/AGENTS.md`
- `AI/EXECUTION_MODEL.md`

For action, entity, resolution, or trace behavior, consult:

- `AI/ACTION_SCHEMA_REGISTRY.md`
- `AI/ENTITY_SCHEMA.md`
- `AI/RESOLUTION_MODEL.md`
- `AI/TRACE_MODEL.md`

## Authority Hierarchy

`README.md`

- Project vision
- Core experience
- Product meaning

`CLAUDE.md`

- Development rules
- React architecture
- UI constraints
- Test authority

`AI/*`

- Simulation authority
- Agent runtime
- World behavior
- Tick execution
- Resolution and trace rules

`docs/*`

- Detailed implementation specifications
- Modular system references

`TODO.md`

- Current execution state
- Active backlog
- Known issues

`ROADMAP.md`

- Long-term evolution
- Phase direction

## Core Rules

- Do not create new architecture layers.
- Do not bypass authority boundaries.
- Do not implement future systems unless explicitly requested.
- `tickManager()` is the only world mutation authority.
- `RESOLUTION_MODEL` is the only final intent authority.
- `ACTION_SCHEMA_REGISTRY` is the only action authority.
- `ENTITY_SCHEMA` is the only entity authority.
- React must remain presentation and input forwarding only.
- Runtime changes must be protected by contract tests.

## Preferred Execution Workflow

Use this order for runtime work:

```text
Schema
  -> Contract
  -> Test
  -> Runtime
  -> Trace
  -> UI
```

Do not build UI for data that is not contract-protected.

## When Uncertain

Follow existing schema and authority definitions rather than creating new systems.

If a task conflicts with authority files, stop and surface the conflict before editing.

## Deprecated Entry Point

`PROJECT_CONTEXT.md` was a transitional context loader.

The stable project entry point is now:

```text
Read AGENTS.md first.
```
