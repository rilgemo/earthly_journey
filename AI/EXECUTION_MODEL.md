# Simulation Tick Execution Model

## Tick Loop

For each world tick:

1. Update world state using DF rules.
2. Update environment simulation.
3. For each agent:
   - Update perception.
   - Generate base intent through AI.
   - Apply runtime context and EETS modifiers.
   - Resolve one final intent through `RESOLUTION_MODEL`.
   - Validate final intent against DF rules.
   - Execute the validated action.
   - Record outcome for memory update.
4. Resolve conflicts.
5. Commit world state.
6. Update memory systems.
7. Derive and freeze read-only identity observations.

## Layer Responsibilities

### Layer 1: World Simulation (DF Core)

DF owns physical reality and passive simulation:

- Time progression
- Hunger, fatigue, and environmental changes
- Resource generation and consumption
- Physical limits such as path, distance, terrain, visibility, and weather

DF has no behavioral choice. It only enforces rules and consequences.

### Layer 2: Agent Brain (AI System)

AI owns intention:

- Needs
- Memory
- Personality
- Traits
- Continuous skills
- Knowledge
- Utility model

AI output is an intent, not a direct mutation.

```ts
type Intent = {
  actionKey: string;
  target?: string;
  priority: number;
  confidence: number;
};
```

### Layer 3: Action Resolution Engine

The engine is the only execution layer.

Execution pipeline:

1. AI generates intent.
2. Runtime and EETS attach modifiers.
3. Resolution Model selects one final intent.
4. Engine validates final intent against DF rules.
5. Engine mutates world state.
6. Engine sends outcome to memory update hooks.

## Execution Contract Layer

The Execution Contract Layer is the required translation point between AI intent and simulation execution.
It ensures that intent is normalized, mapped to an action schema, and checked before any mutation occurs.

Contract checklist:

- Does this output modify world state? If yes, it must go through `tickManager()`.
- Is this output an AI intent? If yes, it must be resolved through `RESOLUTION_MODEL`.
- Is this output UI-only? If yes, it must not contain simulation or decision logic.
- Does this output bypass the simulation layer? If yes, it is forbidden.
- Is the action schema explicit and validated against DF rules before execution?
- Is the action key registered in `AI/ACTION_SCHEMA_REGISTRY.md` before use?

The contract layer prevents drift by making every AI-proposed action pass through a clearly defined validation and mapping stage.

## Validation Checks

Before execution, validate:

- Required stamina
- Required HP
- Required location
- Required item
- Required skill
- Target existence
- Weather or visibility constraints
- Cooldown availability
- Area permission

## Conflict Priority

Resolve multi-agent conflicts in this order:

1. DF constraints
2. Physical reality
3. Action cooldown and stamina
4. AI priority score
5. Random tie-breaker

## Memory Update

All outcomes feed back into the agent memory system.

Examples:

- Successful hunt -> reinforce hunting success
- Failed hunt with injury -> reinforce risk awareness
- Productive trade -> reinforce trust or economic preference

Successful behavior may produce small, diminishing continuous skill growth.
Traits affect growth rates and knowledge affects learning efficiency. Derived
identity and legacy profession metadata must not drive intent generation.

## Mutation Rule

Only the action resolution engine may commit mutations to world state.
