# 07 Action System

## Action Role

Actions are the primary player-facing interaction unit.

They connect area context, requirements, stamina cost, narrative output, rewards, skill XP, discoveries, and state changes.

## Action Schema

The canonical action schema registry is defined in `AI/ACTION_SCHEMA_REGISTRY.md`.
All executable action keys must be registered there before being referenced by AI intent or simulation execution.
Action definitions in `/src/data/actions.js` must align with the registry.

```ts
type Action = {
  key: string;
  label: string;
  narrative: string;
  stCost: 'vlow' | 'low' | 'mid' | 'high' | 'rest_tiny' | 'rest_part' | 'rest_full';
  requirements?: {
    skill?: { id: string; level?: number };
    item?: { id: string; qty?: number };
    gold?: number;
    hpAbove?: number;
    staminaAbove?: number;
    timePeriod?: string[];
    area?: string[];
  };
  cooldownSeconds?: number;
  log?: string;
  npcReply?: { speaker: string; text: string };
  unlockSkill?: Skill;
  giveItem?: { id: string; name: string; qty: number };
  equipDrop?: { slot: string; item: EquipmentItem };
  addActions?: Record<string, string[]>;
  removeActions?: string[];
  skillXp?: { id: string; xp: number };
  cost?: { gold: number };
  hpRestore?: number;
  stRestore?: 'tiny' | 'small' | 'medium' | 'large';
};
```

## Requirements

Actions may require:

- Skill id and optional level
- Item id and optional quantity
- Gold
- HP above a threshold
- Stamina above a threshold
- Time period
- Area

## Resolver Behavior

Action execution may:

- Add narrative text
- Add message feed entries
- Unlock skills
- Give items
- Drop equipment
- Add or remove actions
- Grant skill XP
- Spend gold
- Restore HP
- Restore stamina

## Stamina Thresholds

- Current stamina below 30% of max: attributes x0.7
- Current stamina below 10% of max: attributes x0.5 and most actions are blocked

## Cooldowns

Actions may use `cooldownSeconds?: number` to prevent spam.
