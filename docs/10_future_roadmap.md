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

Future systems are references only. Current implementations consume them only
when explicitly requested.

### Combat System

- Turn-based combat
- Travel and most actions locked during combat
- Uses existing skill stats for calculations
- Combat log appears in message feed

### Exchange Structure

- External value injection and removal may be modeled as bounded exchange inputs
- Examples include traveling agents, commissions, and requested assistance
- Player starts with 50G as external injection, not part of human settlement expression balance

## Long-Term Vision

- Dynamic agent collective structures where agents are born, act, exchange, and die
- Player actions reshape persistent activity clusters across hundreds of in-game days
- Hidden skill synergies and discoveries emerge from gameplay, not UI hints
- Future potential: external threats, factions, cluster expansion, and multiple human settlement expressions

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
