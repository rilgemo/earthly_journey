# 08 Data Schemas

All game content must be defined in these shapes and stored in `/src/data/`. No hardcoding.

## Core Types

```ts
type StatKey = 'hp' | 'stamina' | 'attack' | 'defense' | 'speed' | 'spirit' | 'dexterity';

type Player = {
  hp: number;
  stamina: number;
  gold: number;
  currentArea: string;
  skills: Skill[];
  equippedSkills: string[];
  inventory: InventoryItem[];
  equipped: Record<string, EquipmentItem | null>;
  discoveredActions: Record<string, string[]>;
};

type Skill = {
  id: string;
  name: string;
  type: 'combat' | 'production' | 'gathering' | 'support' | 'hidden';
  desc: string;
  stats: Partial<Record<StatKey, number>>;
  xp: number;
  level: number;
};

type Area = {
  key: string;
  label: string;
  breadcrumb: string[];
  intro: string;
  actions: string[];
  travel: string[];
  localChat?: {
    speaker: string;
    text: string;
  }[];
};

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

type InventoryItem = {
  id: string;
  name: string;
  qty: number;
};

type EquipmentItem = {
  id: string;
  name: string;
  icon: string;
  stats: Partial<Record<StatKey, number>>;
};

type Message = {
  id: number;
  type: 'system' | 'event' | 'npc' | 'player';
  speaker?: string;
  text: string;
};
```

## Future Combat Reference

```ts
type Enemy = {
  id: string;
  name: string;
  hp: number;
  stats: Partial<Record<StatKey, number>>;
  rewards?: {
    gold?: number;
    items?: InventoryItem[];
    skillXp?: Record<string, number>;
  };
};
```

## Future NPC Reference

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
