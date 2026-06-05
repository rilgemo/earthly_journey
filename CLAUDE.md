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
// ---- Core ----
type Player = {
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  gold: number;
  area: string;
  skills: Skill[];
  equippedSkills: string[];
  inventory: InventoryItem[];
  equipped: Record<string, EquipmentItem | null>;
  discoveredActions: Record<string, string[]>;
};

type Skill = {
  name: string;
  type: 'combat' | 'production' | 'gathering' | 'support' | 'hidden';
  desc: string;
  stats: Record<string, number>;
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
  localChat: { speaker: string; text: string }[];
};

type Action = {
  key: string;
  label: string;
  narrative: string;
  stCost: 'vlow' | 'low' | 'mid' | 'high' | 'rest_tiny' | 'rest_part' | 'rest_full';
  requirements?: {
    skill?: { name: string; level?: number };
    item?: { id: string; qty?: number };
    gold?: number;
    hpAbove?: number;
    staminaAbove?: number;
  };
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

type InventoryItem = {
  id: string;
  name: string;
  qty: number;
};

type EquipmentItem = {
  id: string;
  name: string;
  icon: string;
  stats: Record<string, number>;
};

type Message = {
  id: number;
  type: 'system' | 'event' | 'npc' | 'player';
  speaker?: string;
  text: string;
};
```

## 5. NON-NEGOTIABLE RULES (CORE DESIGN)

- **Skills define all stats** — HP, attack, defense, etc. are derived from equipped skills. No separate stat point system.
- **Max stats calculation** — `maxHp = 50 + sum(skill HP bonuses)`; `maxStamina = 100 + sum(skill stamina bonuses)`.
- **Undiscovered = Invisible** — Locked skills and undiscovered actions must not render placeholders or hints in the UI.
- **Skill slots matter** — Players must choose which skills to equip.
- **Chat is authoritative** — All system, NPC, and player events appear in the unified message feed.
- **Data-driven only** — Do not hardcode logic like `if (area === 'town')` inside components. Use data from `/src/data/`.
- **State organization** — `App.js` is the single source of truth. When complexity grows, split into custom hooks (`usePlayer`, `useCombat`, `useWorldTime`, etc.). Do not create additional global stores.
- **Stamina thresholds** — <30% = attributes ×0.7; <10% = ×0.5 and most actions are blocked.

## 6. UI LAYOUT & CONVENTIONS

- Layout: 3-column grid with widths `190px | 1fr | 220px`
- Top bar includes breadcrumb, time, and gold

### MainPanel flow

1. Narrative text: scrollable current action / area description
2. Action buttons: vertical stack, no section labels
3. Message feed: fixed at bottom, auto-scroll to newest entry

### Button styles

- **Action:** transparent background, `C.border` border, `C.text` text
- **Rest:** transparent background, `C.green` border, prefixed with `♦`
- **Travel:** `C.accentDim` background, `C.accent` border, prefixed with `▶`

- A divider separates Action/Rest from Travel buttons

## 7. WORLD TIME SYSTEM

- Formula: In-game minutes = real minutes × 4
- 15 real minutes = 1 in-game hour
- 1 real hour = 4 in-game hours
- 6 real hours = 1 in-game day
- 1 real day = 4 in-game days

- Do not store the clock in localStorage. Always derive from `Date.now()` and `EPOCH_MS` in `src/data/config.js`.

### worldTime object

```ts
{
  totalMinutes: number;
  day: number;
  hour: number;
  minute: number;
  timeOfDay: number;
  isDay: boolean;
  period: string;
  label: string;
}
```

- Example label: `Day 3 Dawn 06:42`
- Day/Night: `06:00–17:59` = day, `18:00–05:59` = night
- Refresh on mount and update every real minute / 15 real seconds for one in-game minute

## 8. IMPLEMENTATION STATUS

### Implemented
- Core state management
- localStorage save/load
- area travel
- action chaining
- skill system (equip/unequip)
- world time display
- unified message feed

### In Progress
- None

### Planned (Phase 1)
- Combat system
- Skill evolution / fusion

### Backlog
- Crafting
- Full inventory system
- Quests

## 9. FUTURE SYSTEMS (Design References)

### Combat System
- Introduce enemy schema and combat state in `App.js`
- Lock travel during combat
- Use existing skill stats for combat actions

### NPC Ecology
- Not implemented yet
- High-level design only
- Goal: simulated town economy with ~21 initial NPCs (blacksmith, farmer, merchant, etc.)

### Economy (Future)
- External gold injection/removal prevents deadlock
- Examples: traveling merchant, guild commissions
- Player starts with 50G external injection, not part of town economy
- Rule: gold should be conserved within the town economy
- Limit offline progress with `OFFLINE_PROGRESS_CAP_DAYS = 3`
- Simulate only NPCs in the player's loaded area

## 10. LONG-TERM VISION (Sandbox Living World)

- A dynamic town where NPCs are born, work, trade, and die
- Player actions reshape the town across hundreds of in-game days
- Hidden skill synergies and discoveries emerge from gameplay, not UI hints
- Future potential: external threats, factions, and city expansion

> For developers: prioritize current implementation over future dreams. When in doubt, follow the data schemas and non-negotiable rules.
