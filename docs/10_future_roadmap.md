# 10 Future Roadmap

## Implementation Status

### Implemented

- Core state management
- localStorage save/load
- Area travel with breadcrumb
- Action chaining and discovery
- Skill system: equip, unequip, XP, leveling
- World time display
- Unified message feed with filters
- Basic inventory: items and `giveItem`

### In Progress

- None

### Planned: Phase 1

- Combat system: turn-based, uses skill stats
- Skill evolution
- Skill fusion

### Backlog

- Inventory UI improvements: stacking, categories, sorting
- Crafting system
- Quest system

## Future Systems

Future systems are references only. They must not influence current implementations unless explicitly requested.

### Combat System

- Turn-based combat
- Travel and most actions locked during combat
- Uses existing skill stats for calculations
- Combat log appears in message feed

### Economy

- External gold injection and removal are required to prevent deadlock
- Examples include traveling merchant, guild commissions, and Adventurer's Guild quests
- Player starts with 50G as external injection, not part of town balance

## Long-Term Vision

- A dynamic town where NPCs are born, work, trade, and die
- Player actions reshape the town across hundreds of in-game days
- Hidden skill synergies and discoveries emerge from gameplay, not UI hints
- Future potential: external threats, factions, city expansion, and multiple towns

## Historical Correction Summary

| # | Issue | Correction |
|---|-------|------------|
| 1 | `NPCSchedule` was undefined | Added minimal definition |
| 2 | `Player.area` naming was ambiguous | Changed to `currentArea` |
| 3 | `Skill` had no id | Added `id`; `equippedSkills` stores ids |
| 4 | `removeActions` was ambiguous | Clarified as action keys |
| 5 | `localChat` was too early | Made optional and marked as static ambient messages |
| 6 | `cooldown` unit was unclear | Changed to `cooldownSeconds` |
| 7 | Component behavior constraints were missing | Added "Game logic belongs in App.js or hooks" |
| 8 | Future/current boundary was unclear | Added reference-only future system statement |
