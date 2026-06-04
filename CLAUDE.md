# CLAUDE.md — Earthly Journey Dev Reference

## 1. PROJECT OVERVIEW
Browser-based React text RPG with area exploration, action chains, stamina, skills, equipment, and unified chat.
World name: Earthly.
Designed for Copilot Chat / Inline Suggestions as a compact game reference.

## 2. STACK & STRUCTURE
- Tech stack: React + inline CSS-in-JS, no external UI libraries.

- src/App.js — main state, game logic, colour tokens, layout shell.
- src/data/areas.js — area metadata: label, breadcrumb, intro, actions, travel, localChat.
- src/data/actions.js — action definitions: narrative, stCost, effects, unlocks, chat triggers.
- src/data/skills.js — skill definitions, type metadata, slot limits, XP rules.
- src/components/LeftPanel.jsx — HP/stamina bars, stats, status display.
- src/components/MainPanel.jsx — narrative pane, action buttons, message feed, filters.
- src/components/RightPanel.jsx — skills, equipment slots, inventory display.

## 3. COLOUR TOKENS
- Exported from App.js as `export const C = {...}`
- Import as: `import { C } from '../App'`

```js
C = {
  bg: "#0e0e12", panel: "#141418", border: "#2a2a35", borderHi: "#44445a",
  text: "#d4d0c8", textDim: "#6b6880", textHi: "#e8e4dc",
  accent: "#7c6fcd", accentDim: "#3d3666",
  green: "#5a9e6f", red: "#9e5a5a", gold: "#b89a4a",
  log0: "#c4c0b8", log1: "#7a7890",
  hp: "#8b3a3a", hpFill: "#c05050",
  stFull: "#4a9e6f", stOk: "#8a9e3a", stWarn: "#c07830", stCrit: "#c03030",
}
```

## 4. DATA SCHEMAS
```ts
// Area object
type Area = {
  key: string;
  label: string;
  breadcrumb: string[];
  intro: string;
  actions: string[];
  travel: string[];
  localChat: { speaker: string; text: string }[];
};

// Action object
type Action = {
  key: string;
  label: string;
  narrative: string;
  stCost: 'vlow' | 'low' | 'mid' | 'high' | 'rest_tiny' | 'rest_part' | 'rest_full';
  log?: string;
  npcReply?: { speaker: string; text: string };
  unlockSkill?: Skill;
  giveItem?: { id: string; name: string; qty: number };
  equipDrop?: { slot: string; item: EquipmentItem };
  addActions?: Record<string, string[]>;
  removeActions?: string[];
  skillXp?: { name: string; xp: number };
  cost?: { gold: number };
  hpRestore?: number;
  stRestore?: 'tiny' | 'small' | 'medium' | 'large';
};

// Skill object
type Skill = {
  name: string;
  type: string;
  desc: string;
  stats: Record<string, number>;
  xp: number;
  level: number;
};

// Message object
type Message = {
  id: number;
  type: 'system' | 'event' | 'npc' | 'player';
  speaker?: string;
  text: string;
};

// Equipment item object
type EquipmentItem = {
  id: string;
  name: string;
  icon: string;
  stats: Record<string, number>;
};
```

## 5. CONSTANTS & ENUMS
```ts
const ST_COST = {
  vlow: 2,
  low: 5,
  mid: 10,
  high: 18,
  rest_tiny: 15,
  rest_part: 50,
  rest_full: 100,
};
const SKILL_TYPES = ['战斗', '生产', '采集', '辅助', '隐藏'];
const EQUIP_SLOTS = ['head', 'body', 'hands', 'feet', 'main', 'off', 'acc1', 'acc2'];
const MESSAGE_TYPES = {
  system: '#7a7890',
  event: '#c4c0b8',
  npc: { speaker: '#b89a4a', text: '#d4d0c8' },
  player: '#d4d0c8',
};
```

## 6. COMPONENT PROPS
- LeftPanel: `{ baseStats, stamina, displayStats, debuffed, stPct, equipped, onUnequipGear, slots, skills, onUnequipSkillSlot }`
- MainPanel: `{ narrative, messages, curActions, curRest, travel, stPct, curArea, onAction, onTravel, pushMessage }`
- RightPanel: `{ skills, slots, gold, items, equipped, onEquipSkill, onUnequipSkillSlot, onUnequipGear }`

## 7. UI CONVENTIONS
- Layout grid: left 190px, centre flexible, right 220px.
- Breadcrumb logic: show current path segments; travel labels hide current top-level prefix.
- Action button styles:
  - 行动: border `#44445a`, text `#d4d0c8`, bg transparent.
  - 休息: border `#5a9e6f`, text `#5a9e6f`, prefix `♦`, bg transparent.
  - 前往: bg `#3d3666`, border `#7c6fcd`, text `#7c6fcd`, prefix `▶`.
- Centre panel flow: narrative → actions → chat panel.
- Chat panel: unified feed, filter buttons [全部, 本地, 系统], disabled input placeholder.
- Message feed: newest at bottom, auto-scroll to bottom on new message.

## 8. CORE DESIGN RULES
1. Keep state flat in App.js and pass only needed props to panels.
2. Only visible actions are rendered; hidden actions remain absent.
3. Skills and equipment drive all stat changes.
4. Chat feed is authoritative source for system/npc/player events.
5. Travel and action labels may differ from internal keys.
6. No combat UI until combat system is implemented.

## 9. CURRENT STATE
- Completed features ✓
  - localStorage auto-save and load on start ✓
  - Reset button in top bar ✓
  - Unified message feed with type filters ✓
  - NPC reply on actions (npcReply field) ✓
  - Area localChat injected on travel ✓
  - Dual-tab replaced by unified feed ✓
- Pending systems (priority):
  1. Combat system
  2. Skill evolution / fusion
  3. Inventory/crafting extensions
  - Save/load system ✓ (localStorage, auto-save on state change, reset button in top bar)

## 10. PENDING DESIGN DECISIONS
- Chat input: placeholder only until local chat is implemented.
- Equipment slot count and slot names may expand.
- Whether travel destinations become gated by skill checks.

## 11. COMMIT CONVENTIONS
- `feat:` new feature
- `ui:` layout or style changes
- `fix:` bug fixes
- `content:` data additions (areas, actions, npc dialogue)
- `refactor:` code restructure
- `docs:` CLAUDE.md or README updates

## 12. WORLD TIME SYSTEM

### Time Scale
- Formula: In-Game Minutes = Real Minutes × 4
- 15 real min = 1 in-game hour
- 1 real hour = 4 in-game hours
- 6 real hours = 1 in-game day
- 1 real day = 4 in-game days

### Clock Storage
Store as total in-game minutes since epoch (Unix-style):
  totalIngameMinutes = (Date.now() - EPOCH_MS) / 1000 / 60 * 4
Derive:
  timeOfDay = totalIngameMinutes % 1440        // 0–1439
  hour = Math.floor(timeOfDay / 60)            // 0–23
  minute = timeOfDay % 60                      // 0–59
  dayNumber = Math.floor(totalIngameMinutes / 1440) + 1

### Epoch
Set EPOCH_MS to a fixed real-world timestamp (e.g. game launch date).
Store in src/data/config.js as:
  export const EPOCH_MS = new Date('2026-06-04T00:00:00Z').getTime();
  export const TIME_MULTIPLIER = 4;

### Day/Night
  06:00–17:59 in-game → Day
  18:00–05:59 in-game → Night

### Key Rules
- Clock runs continuously, never pauses on logout
- Do NOT store clock in localStorage — always derive from real Date.now()
- In-game date advances +4 per real day
- Same real login time = same in-game time of day every day

### worldTime object (derived, never stored)
  {
    totalMinutes: number,   // derived from Date.now()
    day: number,
    hour: number,
    minute: number,
    isDay: boolean,
    label: string           // e.g. "第3天 清晨 06:42"
  }

### Usage
- Computed once on mount and refreshed every real minute via setInterval
- Passed as prop to all panels that need time context
- NPC schedules, commission completions, offline progress all reference totalMinutes
