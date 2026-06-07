# 02 Agent System

## Current Status

The current implementation is player-focused. A full NPC agent system is not implemented yet.

Static ambient dialogue may exist through `localChat`, but it is not the NPC system.

## Agent Direction

Future NPCs should become player-like agents with:

- Skills
- Inventory
- Gold
- Location
- Relationships
- Needs
- Optional schedules

Animals, monsters, humans, and the player should eventually share the same conceptual agent foundation.

## Future NPC Schema Reference

```ts
type NPCSchedule = {
  period: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'night';
  action: string;
  location: string;
};

type NPC = {
  id: string;
  name: string;
  hp: number;
  stamina: number;
  gold: number;
  skills: Skill[];
  inventory: InventoryItem[];
  location: string;
  relationships: Record<string, number>;
  schedule?: NPCSchedule[];
  needs?: { hunger: number; sleep: number; social: number };
  age?: number;
  lifeExpectancy?: number;
};
```

## NPC Ecology Reference

Future NPC ecology is high-level design only.

- Goal: simulated town ecology with agents whose occupations emerge from repeated behavior
- NPCs will have full player-like attributes
- Offline progress is capped at `OFFLINE_PROGRESS_CAP_DAYS = 3`
- Full simulation only runs for NPCs in the player's loaded area
- Remote NPCs use simplified hourly simulation
