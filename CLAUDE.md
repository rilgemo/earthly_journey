# CLAUDE.md — Earthly Journey Development Guideline

## 1. PROJECT OVERVIEW

- **Type:** Single-player browser-based text RPG (React)
- **Core Loop:** Area exploration → action execution → skill growth & discovery
- **World Name:** Earthly
- **Long-term Vision:** A sandbox living world with simulated NPC ecology and economy

## 2. STACK

- **Framework:** React (Create React App)
- **Styling:** Inline CSS-in-JS
- **UI Libraries:** None
- **Color System:** Use `C` token object exported from `src/App.js`

## 3. FILE STRUCTURE (Current)

```text
src/
├── App.js                # Core state, game logic, layout shell
├── data/
│   ├── areas.js          # Area definitions
│   ├── actions.js        # Action definitions
│   ├── skills.js         # Skill definitions, slot limits, XP rules
│   └── config.js         # Constants (EPOCH_MS, TIME_MULTIPLIER)
├── utils/
│   └── worldTime.js      # getWorldTime() pure function
└── components/
    ├── LeftPanel.jsx     # HP/Stamina bars, stats, status display
    ├── MainPanel.jsx     # Narrative pane, action buttons, message feed
    └── RightPanel.jsx    # Skills, equipment, inventory display
```

## 4. DATA SCHEMAS (Non-negotiable)

> All game content must be defined in these shapes and stored in `/src/data/`. No hardcoding.

```ts
// ---- Core Types ----
type StatKey = 'hp' | 'stamina' | 'attack' | 'defense' | 'speed' | 'spirit' | 'dexterity';

type Player = {
  // Stored state only (derived stats are computed, not stored)
  hp: number;
  stamina: number;
  gold: number;
  currentArea: string;          // area key, e.g., 'newleaf_town/square'
  skills: Skill[];
  equippedSkills: string[];     // skill ids
  inventory: InventoryItem[];
  equipped: Record<string, EquipmentItem | null>;
  discoveredActions: Record<string, string[]>;  // area key → action keys
};

type Skill = {
  id: string;                   // unique, e.g., 'forging_101'
  name: string;                 // display name
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
  actions: string[];            // action keys
  travel: string[];             // area keys (destinations)
  localChat?: {                 // static ambient messages (not NPC system)
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
    timePeriod?: string[];      // e.g., ['dawn', 'night']
    area?: string[];            // area keys
  };
  cooldownSeconds?: number;
  log?: string;
  npcReply?: { speaker: string; text: string };
  unlockSkill?: Skill;
  giveItem?: { id: string; name: string; qty: number };
  equipDrop?: { slot: string; item: EquipmentItem };
  addActions?: Record<string, string[]>;   // area key → action keys
  removeActions?: string[];                // action keys to remove
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

// ---- Future - Combat (reference only) ----
type Enemy = {
  id: string;
  name: string;
  hp: number;
  stats: Partial<Record<StatKey, number>>;
  rewards?: {
    gold?: number;
    items?: InventoryItem[];
    skillXp?: Record<string, number>;  // skill id → xp
  };
};

// ---- Future - NPC (reference only) ----
type NPCSchedule = {
  period: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'night';
  action: string;
  location: string;
};

type NPC = {
  id: string;
  name: string;
  role: string;
  hp: number;
  stamina: number;
  gold: number;
  skills: Skill[];
  inventory: InventoryItem[];
  location: string;
  relationships: Record<string, number>;  // NPC id → reputation
  schedule?: NPCSchedule[];
  needs?: { hunger: number; sleep: number; social: number };
  age?: number;
  lifeExpectancy?: number;
};
```

## 5. NON-NEGOTIABLE RULES (CORE DESIGN)

- **Skills define all stats** — HP, attack, defense, etc. are derived from equipped skills. No separate stat point system.
- **Derived stats are computed, not stored** — `maxHp`, `maxStamina`, `attack`, `defense` are recalculated on demand from equipped skills.
- **Max stats calculation** — `maxHp = 50 + sum(skill.hp bonuses)`; `maxStamina = 100 + sum(skill.stamina bonuses)`.
- **Undiscovered = Invisible** — Locked skills and undiscovered actions must not render placeholders or hints in the UI.
- **Skill slots matter** — Players must choose which skills to equip.
- **Chat is authoritative** — All system, NPC, and player events appear in the unified message feed.
- **Data-driven only** — Do not hardcode logic like `if (area === 'town')` inside components. Use data from `/src/data/`.
- **Game logic belongs in App.js or hooks** — Components are presentation-focused. Avoid conditional game logic inside JSX.
- **State organization** — `App.js` is the single source of truth. When complexity grows, split into custom hooks (`usePlayer`, `useCombat`, `useWorldTime`, etc.). Do not create additional global stores.
- **Stamina thresholds** — Current stamina < 30% of max = attributes ×0.7; <10% = ×0.5 and most actions are blocked.
- **Action cooldown** — Actions may have `cooldownSeconds?: number` to prevent spam.

## 6. UI LAYOUT & CONVENTIONS

- **Layout:** 3-column grid with widths `190px | 1fr | 220px`
- **Top bar:** Includes breadcrumb, world time, and gold
- **Colors:** Always reference `C` token from `src/App.js`. Do not hardcode color values.

### MainPanel flow (top to bottom)

1. **Narrative text** — Scrollable area for current action/area description
2. **Action buttons** — Vertical stack, no section labels
3. **Message feed** — Fixed at bottom, auto-scroll to newest entry

### Button styles

- **Action:** Transparent background, `C.border` border, `C.text` text
- **Rest:** Transparent background, `C.green` border, prefixed with `♦`
- **Travel:** `C.accentDim` background, `C.accent` border, prefixed with `▶`

- A divider separates Action/Rest from Travel buttons

## 7. WORLD TIME SYSTEM

- **Formula:** In-game minutes = real minutes × 4
- **Scale:** 15 real minutes = 1 in-game hour; 6 real hours = 1 in-game day; 1 real day = 4 in-game days
- **Storage:** Do NOT store clock in localStorage. Always derive from `Date.now()` and `EPOCH_MS` in `src/data/config.js`
- **Refresh:** Every 15 real seconds (1 in-game minute)

### worldTime object (derived, never stored)

```ts
{
  totalMinutes: number;   // Total in-game minutes since epoch
  day: number;            // Day number (1-indexed)
  hour: number;           // 0–23
  minute: number;         // 0–59
  timeOfDay: number;      // 0–1439 (minutes since midnight)
  isDay: boolean;         // true if 06:00–17:59
  period: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'night' | 'midnight';
  label: string;          // e.g., "Day 3 · 06:42"
}
```

- Day/Night: `06:00–17:59` = day, `18:00–05:59` = night

## 8. IMPLEMENTATION STATUS

### Implemented
- Core state management
- localStorage save/load
- Area travel with breadcrumb
- Action chaining and discovery
- Skill system (equip/unequip, XP, leveling)
- World time display
- Unified message feed with filters
- Inventory (basic: items, giveItem)

### In Progress
- None

### Planned (Phase 1)
- Combat system (turn-based, uses skill stats)
- Skill evolution / fusion

### Backlog
- Inventory UI improvements (stacking, categories, sorting)
- Crafting system
- Quest system

## 9. FUTURE SYSTEMS (Design References)

> **Future systems are references only. They must not influence current implementations unless explicitly requested.**

### Combat System
- Turn-based combat
- Travel and most actions locked during combat
- Uses existing skill stats for calculations
- Combat log appears in message feed

### NPC Ecology
- Not implemented — high-level design only
- Goal: simulated town economy with ~21 initial NPCs (blacksmith, farmer, merchant, innkeeper, etc.)
- NPCs will have full player-like attributes (skills, inventory, gold, needs)
- Offline progress capped at `OFFLINE_PROGRESS_CAP_DAYS = 3`
- Full simulation only for NPCs in player's loaded area; remote NPCs use simplified hourly simulation

### Economy (Future)
- External gold injection/removal required to prevent deadlock
- Examples: traveling merchant, guild commissions, Adventurer's Guild quests
- Player starts with 50G (external injection, not part of town balance)

## 10. CONTENT RULES

- **Areas** belong in `areas.js`
- **Actions** belong in `actions.js`
- **Skills** belong in `skills.js`
- **Future enemies** belong in `enemies.js`
- **Future NPCs** belong in `npcs.js`
- **Components must not contain game content** — they render data only
- **Game logic belongs in App.js or hooks** — Components should be presentation-focused

## 11. LONG-TERM VISION (Sandbox Living World)

- A dynamic town where NPCs are born, work, trade, and die
- Player actions reshape the town across hundreds of in-game days
- Hidden skill synergies and discoveries emerge from gameplay, not UI hints
- Future potential: external threats, factions, city expansion, multiple towns

---

## Development Guidelines for AI

**Prioritize current implementation over future dreams.**

When adding new features:

1. **Follow existing schemas first.**
2. **Prefer extending data files over adding special-case code.**
3. **Do not implement future systems unless explicitly requested.**

When in doubt, follow the data schemas and non-negotiable rules.

---

## 最终修正汇总

| # | 问题 | 修正 |
|---|------|------|
| 1 | `NPCSchedule` 未定义 | 已补充最小定义 |
| 2 | `Player.area` 命名模糊 | 改为 `currentArea` |
| 3 | `Skill` 无 id | 增加 `id` 字段，`equippedSkills` 存 id |
| 4 | `removeActions` 歧义 | 注释说明 "action keys" |
| 5 | `localChat` 过早 | 改为 optional + 注释 "static ambient messages" |
| 6 | `cooldown` 单位不明确 | 改为 `cooldownSeconds` |
| 7 | 缺少组件行为约束 | 增加 "Game logic belongs in App.js or hooks" |
| 8 | Future 与 Current 分界 | 增加引用声明块 |
