# DF x AI Hybrid System Rules

## Layer Separation

- DF = world simulation engine
- AI = agent decision engine
- Engine = execution validator

## Core Principles

- DF controls reality.
- AI controls intention.
- The action layer mediates everything.
- No system can bypass the validation layer.

## Forbidden

- AI cannot mutate world state directly.
- AI cannot spawn items directly.
- AI cannot override DF rules.
- AI cannot teleport agents.
- DF cannot choose behavior.
- DF cannot simulate personality choice.
- UI cannot contain game logic.

## Allowed Flow

```text
Intent -> Validate -> Execute -> Mutate -> Learn
```

## Conflict Resolution

DF rules always override AI intent.

Priority order:

1. DF constraints
2. Physical reality: space, time, path, weather
3. Action cooldown and stamina
4. AI priority score
5. Random tie-breaker

## Determinism

World state updates must remain deterministic at the DF layer.

AI may propose behavior, but only the engine may execute validated actions and mutate state.
