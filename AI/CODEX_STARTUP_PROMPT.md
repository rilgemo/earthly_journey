# Earthly Codex Startup Prompt

Use this prompt when starting a Codex session for Earthly Journey.

## Read First

Read:

1. `AGENTS.md`
2. `CLAUDE.md`
3. `AI/ARCHITECTURE.md`
4. `TODO.md`

Then load task-specific files only as needed.

## Before Editing

- Understand the current implementation state.
- Check existing schemas.
- Check `ACTION_SCHEMA_REGISTRY`.
- Check `ENTITY_SCHEMA`.
- Check existing tests for the target layer.

## Never

- Invent new entity structures.
- Invent new action keys.
- Create duplicate runtime systems.
- Add world mutations outside `tickManager()`.
- Put simulation rules inside React components.
- Build Inspector UI before contract-protecting the data it displays.

## Preferred Workflow

```text
Schema
  -> Contract
  -> Test
  -> Runtime
  -> Trace
  -> UI
```

Always update tests when runtime behavior changes.

## Runtime Authority Chain

```text
ACTION_REGISTRY
  -> RESOLUTION_MODEL
  -> EXECUTION_CONTRACT
  -> tickManager
  -> WORLD_STATE
```

`tickManager()` is the only world mutation authority.

`RESOLUTION_MODEL` is the only final intent authority.

`TRACE_MODEL` is the observability authority.
