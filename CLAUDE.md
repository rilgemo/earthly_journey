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
## Project
Text-based sandbox MMORPG. Browser-based React app.
Repo: https://github.com/rilgemo/earthly_journey

## Stack
- React (Create React App), no external UI libraries
- CSS-in-JS inline styles only
- Colour tokens exported from `src/App.js` as `export const C = {...}`

## File Structure
- src/App.js — state management, game logic, layout shell
- src/data/areas.js — area definitions (label, breadcrumb, intro, actions, travel)
- src/data/actions.js — action definitions (narrative, stCost, triggers, unlockSkill etc.)
- src/data/skills.js — skill metadata, SKILL_TYPE_COLOR, SKILL_SLOTS, XP_PER_LEVEL
- src/components/LeftPanel.jsx — HP/stamina bars, stats, equipment slots
- src/components/MainPanel.jsx — narrative, action buttons, event log
- src/components/RightPanel.jsx — skill panel (equipped/unequipped), inventory

## UI Conventions
- Three-column layout: 190px | 1fr | 220px
- Top bar: breadcrumb navigation (e.g. 新叶镇 / 铁砧锻造铺), time, weather, gold
- Each area in areas.js must include `breadcrumb: string[]`

### Centre Panel (MainPanel) Layout — top to bottom:
1. Narrative text — scrollable, flex 1
2. Action buttons — vertical stack, immediately below narrative, no section labels
3. Event log — fixed at bottom, maxHeight 80px

### Action Button Styles:
- 行动: border #44445a, text #d4d0c8, bg transparent
- 休息: border #5a9e6f, text #5a9e6f, prefix ♦, bg transparent
- 前往: bg #3d3666, border #7c6fcd, text #7c6fcd, prefix ▶
- All: textAlign left, width 100%, borderRadius 4, padding 5px 14px, fontSize 13
- Divider line between 行动/休息 group and 前往 group

## Core Design Rules
1. Skills define all character attributes — no separate stat points
2. Undiscovered skills are completely invisible — no locked previews
3. Skill slots are limited — equip choices create build identity
4. Actions unlock chain-style — players only see what they have discovered
5. Hidden skill synergies exist — no UI hints, discovered through play
6. Stamina thresholds: warn <30% (×0.7 attrs), critical <10% (×0.5 attrs, block actions)

## Data Conventions
### actions.js fields:
- stCost: 'vlow'|'low'|'mid'|'high'|'rest_tiny'|'rest_part'|'rest_full'
- stRestore: 'tiny' (small restore alongside normal action)
- unlockSkill: { name, type, desc, stats }
- giveItem: { name, qty }
- equipDrop: { slot, item: { id, name, icon, stats } }
- addActions: { areaKey: [actionName] }
- removeActions: [actionName]
- skillXp: { name, xp }
- cost: { gold }
- hpRestore: number

## Pending Systems (Phase 1)
- Combat system (enemies.js, combat state in App.js, lock travel during combat)
- Skill evolution (EVOLUTIONS in skills.js, trigger after XP gain)
- Skill fusion (FUSIONS in skills.js, check on equip)
- Save/load (localStorage, auto-save on state change)
- Crafting/commission system (shops.js, pendingOrders state)

## 13. NPC SYSTEM

### Initial Population (新叶镇, 21 NPCs)

Production Core:
  blacksmith ×1     — weapons/tools
  leatherworker ×1  — armour
  apothecary ×1     — potions
  farmer ×2         — food materials
  cook ×1           — inn food processing
  miner ×2          — raw materials
  woodcutter ×2     — timber + woodworking

Service Core:
  innkeeper ×1      — lodging/meals/ingredient purchasing
  merchant ×1       — general goods trading
  mayor ×1          — governance/event trigger
  guard/adventurer ×2 — combat NPC/town security

Transient:
  traveller ×2      — random arrivals, external goods/info

Family Units:
  married couples ×2 (blacksmith+spouse, farmer couple)
  children ×2        (inherit parent skill tendencies)

### NPC Full Attribute Schema
Same as player — all fields:
  life:   hp, stamina, hunger, sleep
  combat: 物攻, 防御, 魔攻, 魔防, 速度, 精神, 灵巧
  skills: same slot system as player
  economy: gold (personal account), inventory[], property[]
  social:  family{}, relationships{}, reputation
  needs:   priority stack [hunger > sleep > work > social]
  lifecycle: birthDay, lifeExpectancy, age

### NPC Skill Rules
- Primary skill: inherited at birth (blacksmith child has forging tendency)
- Growth: unlocked and levelled through daily actions (same as player)
- Childhood: children accumulate base XP by proximity to parent's work
- On death: skills lost; property inherited by family or mayor

### Economy Rules
- Gold is conserved — never created or destroyed within the town
- Initial total: ~500G distributed across all NPCs
- Initial distribution:
    merchant 120G, innkeeper 80G, blacksmith 80G,
    leatherworker 60G, apothecary 60G, mayor 50G,
    miners 40G, farmers 40G, woodcutters 40G,
    guards 40G, travellers 30G, children 0G
- Player starts with 50G (external injection, does not affect town balance)

### Economic Institutions (post-player-arrival)
- Adventurers Guild: quest board, reward management, player economy interface
- Crafters Guild: player-made goods trading, quality certification
- Travelling Merchant: periodic visitor, imports external goods,
  exports town surplus, connects to other towns
  (East Town → South/West/North → Central City)

### Minimum Economic Loop
  farmer → food → cook/inn → meal revenue
  miner → ore → blacksmith → weapons → merchant → sales
  gatherer → herbs → apothecary → potions → merchant → sales
  all NPCs → inn consumption → innkeeper revenue cycle

### NPC Behaviour Layers
  Layer 1: schedule-based (Phase 2)       — fixed daily routine
  Layer 2: state-driven (Phase 2.5)       — needs/mood affect decisions
  Layer 3: NPC-to-NPC economy (Phase 3)  — real goods/gold transfer
  Layer 4: emergent behaviour (Phase 4)  — population growth, factions

### Ecology Growth Timeline
  Day 1-10:   establishment — NPCs follow schedules, economy circulates
  Day 10-30:  growth — children mature, surpluses/shortages emerge (20-25 pop)
  Day 30-100: differentiation — wealth gap, travellers may settle (25-40 pop)
  Day 100+:   emergence — new facilities, factions, external threats (cap ~60)


## 13. NPC SYSTEM

### Initial Population (新叶镇, 21 NPCs)

Production Core:
  blacksmith ×1     — weapons/tools
  leatherworker ×1  — armour
  apothecary ×1     — potions
  farmer ×2         — food materials
  cook ×1           — inn food processing
  miner ×2          — raw materials
  woodcutter ×2     — timber + woodworking

Service Core:
  innkeeper ×1      — lodging/meals/ingredient purchasing
  merchant ×1       — general goods trading
  mayor ×1          — governance/event trigger
  guard/adventurer ×2 — combat NPC/town security

Transient:
  traveller ×2      — random arrivals, external goods/info

Family Units:
  married couples ×2 (blacksmith+spouse, farmer couple)
  children ×2        (inherit parent skill tendencies)

### NPC Full Attribute Schema
Same as player — all fields:
  life:   hp, stamina, hunger, sleep
  combat: 物攻, 防御, 魔攻, 魔防, 速度, 精神, 灵巧
  skills: same slot system as player
  economy: gold (personal account), inventory[], property[]
  social:  family{}, relationships{}, reputation
  needs:   priority stack [hunger > sleep > work > social]
  lifecycle: birthDay, lifeExpectancy, age

### NPC Skill Rules
- Primary skill: inherited at birth (blacksmith child has forging tendency)
- Growth: unlocked and levelled through daily actions (same as player)
- Childhood: children accumulate base XP by proximity to parent's work
- On death: skills lost; property inherited by family or mayor

### Economy Rules
- Gold is conserved — never created or destroyed within the town
- Initial total: ~500G distributed across all NPCs
- Initial distribution:
    merchant 120G, innkeeper 80G, blacksmith 80G,
    leatherworker 60G, apothecary 60G, mayor 50G,
    miners 40G, farmers 40G, woodcutters 40G,
    guards 40G, travellers 30G, children 0G
- Player starts with 50G (external injection, does not affect town balance)

### Economic Institutions (post-player-arrival)
- Adventurers Guild: quest board, reward management, player economy interface
- Crafters Guild: player-made goods trading, quality certification
- Travelling Merchant: periodic visitor, imports external goods,
  exports town surplus, connects to other towns
  (East Town → South/West/North → Central City)

### Minimum Economic Loop
  farmer → food → cook/inn → meal revenue
  miner → ore → blacksmith → weapons → merchant → sales
  gatherer → herbs → apothecary → potions → merchant → sales
  all NPCs → inn consumption → innkeeper revenue cycle

### NPC Behaviour Layers
  Layer 1: schedule-based (Phase 2)       — fixed daily routine
  Layer 2: state-driven (Phase 2.5)       — needs/mood affect decisions
  Layer 3: NPC-to-NPC economy (Phase 3)  — real goods/gold transfer
  Layer 4: emergent behaviour (Phase 4)  — population growth, factions

### Ecology Growth Timeline
  Day 1-10:   establishment — NPCs follow schedules, economy circulates
  Day 10-30:  growth — children mature, surpluses/shortages emerge (20-25 pop)
  Day 30-100: differentiation — wealth gap, travellers may settle (25-40 pop)
  Day 100+:   emergence — new facilities, factions, external threats (cap ~60)