# CLAUDE.md — Earthly Journey Dev Reference

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
 - Equipment slots displayed at top of 背包 tab in RightPanel
 - LeftPanel: status bars and stats only (equipment section removed, space reserved)

### Centre Panel (MainPanel) Layout — top to bottom:
1. Narrative text — scrollable, flex 1
2. Action buttons — vertical stack, flows directly into narrative with no gap or divider, no section labels
3. Event log — fixed at bottom, maxHeight 80px

### Travel Button Display:
- 前往 button labels strip the current top-level location prefix from display text
- Example: if current area breadcrumb is ["新叶镇", ...], destination "新叶镇 · 晨星旅店" displays as "晨星旅店"
- Full label still used for navigation logic; only display is trimmed

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

## Pending Design Decisions

- World name: Earthly ✓
