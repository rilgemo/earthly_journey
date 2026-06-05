# Earthly Journey TODO

This file is the execution layer for current work and backlog.

Rules are defined in [CLAUDE.md](CLAUDE.md). Product meaning is described in [README.md](README.md).

Last updated: 2026-05-29

Current phase: Phase 1 - Core Systems

## Done

- [x] Three-panel layout: left status, center narrative, right skills and inventory
- [x] Top bar with location, time, weather, and gold display
- [x] Narrative text area with event log
- [x] Dynamic action button system with unlocks and chain triggers
- [x] Travel system with area-to-area movement and stamina cost
- [x] Stamina system with drain, warning threshold, critical threshold, and attribute debuff
- [x] Rest system: paid inn full restore, free campsite partial restore, auto trickle recovery
- [x] Skill discovery through exploration, interaction, and items
- [x] Skill equip and unequip through slot system
- [x] Skill attribute contribution through equipped skills
- [x] Equipment slots: head, body, hands, feet, main hand, off hand, accessories
- [x] Equipment stat bonuses apply to displayed attributes
- [x] Town locations: starting square, inn, restaurant, apothecary, blacksmith, leather armour shop
- [x] Starter narrative and world lore seeds
- [x] localStorage save/load

## In Progress

- [ ] None

## Phase 1 - Remaining Core Systems

### Combat System

- [ ] Basic turn-based combat encounter structure
- [ ] Combat actions determined by equipped skills
- [ ] Enemy definition format: stats, loot, narrative
- [ ] First enemy: Wild Boar in south forest area
- [ ] First enemy: Cave Creature in north mine shallow layer
- [ ] Damage calculation using attack and defense
- [ ] Status effects: poison, paralysis, curse, confusion
- [ ] Flee action
- [ ] Victory and defeat outcomes
- [ ] Lock travel buttons during combat

### Skill Evolution

- [ ] Define evolution conditions per skill
- [ ] Check evolution trigger after skill XP gain
- [ ] Add narrative hint before evolution
- [ ] Replace base skill with evolved skill on trigger
- [ ] First evolution path: Gathering Lv.5 -> Precise Gathering

### Skill Fusion

- [ ] Define fusion recipes
- [ ] Require both source skills to be equipped
- [ ] Trigger fusion check on equip action
- [ ] First fusion: Herbal Knowledge Lv.3 + Alchemy Basics Lv.2 -> Herbal Alchemy

### Hidden Synergy System

- [ ] Define synergy pairs and bonus effects
- [ ] Check synergy when skill loadout changes
- [ ] Apply hidden stat bonus silently
- [ ] Unlock hidden combat actions through synergy
- [ ] First synergy: Swordsmanship + Light Step -> speed bonus and Sword Dance action

## Phase 2 - Content And Systems Expansion

### Code Refactor

- [ ] Split `App.js` into focused component and hook files
- [ ] Extract `data/areas.js`
- [ ] Extract `data/actions.js`
- [ ] Extract `data/skills.js`
- [ ] Extract `data/enemies.js`
- [ ] Extract `data/recipes.js`

### Skills And Discovery

- [ ] Expand base skill list to 20-30 discoverable skills
- [ ] Add hidden skills without UI hints
- [ ] Add item-triggered skill unlocks
- [ ] Add location-triggered skill unlocks

### Town Expansion

- [ ] Blacksmith commission crafting
- [ ] Apothecary material selling
- [ ] Leather shop custom commission system
- [ ] Inn rumor system
- [ ] Town noticeboard with rotating posts and world events

### World Expansion

- [ ] South Forest deeper layers
- [ ] North Mine mid and deep layers
- [ ] Eastern Plains area
- [ ] Ruined Outpost area
- [ ] Day/night availability effects
- [ ] Weather effects for gathering quality and enemy behavior

### Inventory

- [ ] Item categories
- [ ] Consumable item usage
- [ ] Item descriptions and lore text
- [ ] Inventory capacity limit

## Phase 3 - World And Social

- [ ] Persistent backend
- [ ] User accounts
- [ ] Shared world state
- [ ] Player chat system
- [ ] Player-to-player trading
- [ ] Guild and party foundation
- [ ] World map view
- [ ] Shared world events
- [ ] Discovery log

## Phase 4 - Endgame And Operations

- [ ] PVP zones
- [ ] Large-scale world events
- [ ] Developer admin tools
- [ ] Skill slot unlock conditions for slots 4-9
- [ ] Slot 10 hidden unlock condition

## Blocked

- [ ] None

## Decisions Needed

- [ ] Finalize world name
- [ ] Finalize Chinese/English attribute naming consistency
- [ ] Decide whether MP or mana is independent or skill-derived
- [ ] Decide whether negative skill stat penalties remain
- [ ] Finalize skill slot unlock conditions for slots 4-9
- [ ] Define hidden synergy scope for Phase 1 versus Phase 2

## Known Issues

- [ ] Stamina auto-recovery interval resets on re-render
- [ ] Skill XP bar calculation is tied to fixed 20 XP per level
- [ ] Equipment bought auto-equips immediately; Phase 2 should move to inventory-first flow
