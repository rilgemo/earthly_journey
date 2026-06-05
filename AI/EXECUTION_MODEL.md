# Simulation Tick Execution Model

## Tick Loop

For each world tick:

1. Update world state using DF rules.
2. Update environment simulation.
3. For each agent:
   - Update perception.
   - Generate intent through AI.
   - Validate intent against DF rules.
   - Execute the validated action.
   - Record outcome for memory update.
4. Resolve conflicts.
5. Commit world state.
6. Update memory systems.

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
- Skillset
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
2. Engine validates intent against DF rules.
3. Engine resolves conflicts.
4. Engine mutates world state.
5. Engine sends outcome to memory update hooks.

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

Skill XP is a structured form of memory reinforcement.

## Mutation Rule

Only the action resolution engine may commit mutations to world state.
