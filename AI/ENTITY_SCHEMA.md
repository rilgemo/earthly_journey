# Entity Schema Contract

This document defines the canonical entity contract layer for the simulation.
It is a schema governance document, not a content design file.

## Purpose

- Lock allowed entity types and fields.
- Prevent AI from inventing ad hoc entity structures.
- Ensure entity state and lifecycle remain consistent with the simulation runtime.
- Define what AI may perceive and what the simulation may mutate.

## Entity Types Registry

Allowed entity types:

- `player`
- `npc`
- `animal`
- `monster`
- `object`
- `environment`

Entities must not introduce new top-level types outside this registry without explicit schema extension documentation.

## Base Entity Interface

```ts
type Entity = {
  id: string;
  type: 'player' | 'npc' | 'animal' | 'monster' | 'object' | 'environment';
  location: string;
  state: Record<string, unknown>;
  memory?: Record<string, unknown>;
  attributes?: Record<string, number | string | boolean>;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
};
```

## Mutation Rules

- Only `tickManager()` may mutate entity state.
- AI may propose intent about entities, but may not directly mutate entity state.
- Entity mutations must follow defined lifecycle rules.
- Entities may not self-create new schema types.
- Entity state fields must remain within approved schemas.

## Perception Format

AI perception of entities should be filtered and partial.
Perception must include:

- `id`
- `type`
- `location`
- relevant `state` fields
- visible `attributes`
- contextual tags or status effects

AI should not receive full internal state unless explicitly required by the simulation contract.

## Lifecycle Rules

Entities should obey a minimal lifecycle model:

- `spawn`
- `active`
- `dormant`
- `decay` / `death`

Entity lifecycle transitions must be governed by simulation rules and resolved through the execution contract layer.

## Related Documentation

- `AI/ACTION_SCHEMA_REGISTRY.md` — canonical action registry for executable intents
- `AI/EXECUTION_MODEL.md` — execution contract and validation checklist
- `docs/01_core_architecture.md` — architecture boundaries and layer responsibilities
- `/src/simulation/` — authoritative runtime implementation
