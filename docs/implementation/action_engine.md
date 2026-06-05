# Action Engine Implementation Mapping

This document describes how to evolve the current action flow into a reusable execution path.

## Current Action Role

Actions currently carry:

- Label
- Narrative
- Stamina cost
- Requirements
- Rewards
- Skill XP
- Added or removed actions
- HP or stamina restoration
- Message output

## Future Action Engine Shape

The action engine should eventually split into three parts:

```text
validateAction(intent, worldState)
resolveAction(intent, worldState)
applyActionResult(result, worldState)
```

## Validation

Validation checks whether reality allows the action.

Examples:

- Enough stamina
- Enough HP
- Required skill
- Required item
- Required gold
- Valid area
- Valid time period
- Cooldown availability

## Execution Result

Execution should return structured results before mutation.

```ts
type ActionResult = {
  valid: boolean;
  reason?: string;
  hpChange?: number;
  staminaChange?: number;
  goldChange?: number;
  itemGain?: string[];
  itemLoss?: string[];
  skillXp?: { id: string; xp: number };
  locationChange?: string;
  messages: string[];
};
```

## Bridge Target

Keep current behavior, but begin shaping action execution around structured results.

This makes actions reusable by both player clicks and autonomous agents.
