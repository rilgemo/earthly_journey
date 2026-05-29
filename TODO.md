# Earthly Journey — Development TODO

> Last updated: 2026-05-29
> Current phase: Phase 1 — Core Systems

---

## ✅ Completed

- [x] Three-panel layout (left: status / centre: narrative / right: skills & inventory)
- [x] Top bar — location, time, weather, gold display
- [x] Narrative text area with event log
- [x] Dynamic action button system (actions unlock through play, chain triggers)
- [x] Travel system — area-to-area movement with stamina cost
- [x] Stamina system — drain on actions, warning/critical thresholds, attribute debuff
- [x] Rest system — inn (paid, full restore), campsite (free, partial), auto trickle recovery
- [x] Skill discovery — triggered by exploration, interaction, items
- [x] Skill equip/unequip via slot system (10 slots, all open in test mode)
- [x] Skill attribute contribution — equipped skills modify character stats
- [x] Equipment slots — head, body, hands, feet, main hand, off hand, 2× accessory
- [x] Equipment stat bonuses apply to displayed attributes
- [x] Town: Starting square, Inn/Restaurant, Apothecary, Blacksmith, Leather Armour Shop
- [x] Starter narrative and world lore seeds (notice board, fountain inscription, etc.)

---

## 🔧 Phase 1 — Remaining Core Systems

### Combat System
- [ ] Basic combat encounter structure (turn-based, menu-driven)
- [ ] Combat actions determined by equipped skills
- [ ] Enemy definition format (stats, loot, narrative)
- [ ] First enemy: Wild Boar (south forest area)
- [ ] First enemy: Cave Creature (north mine shallow layer)
- [ ] Damage calculation using ATK / DEF
- [ ] Status effects: physical (poison, paralysis) and mental (curse, confusion)
- [ ] Flee action
- [ ] Victory / defeat outcomes
- [ ] Lock travel buttons during combat

### Skill Evolution
- [ ] Define evolution conditions per skill (level threshold)
- [ ] Evolution trigger check after skill XP gain
- [ ] Narrative hint before evolution ("you feel your understanding approaching a limit…")
- [ ] Replace base skill with evolved skill in slot on trigger
- [ ] First evolution path: 【採集 Lv.5】→【精準採集】

### Skill Fusion
- [ ] Define fusion recipes (skill A + skill B + conditions → new skill)
- [ ] Fusion check: both skills must be simultaneously equipped
- [ ] Fusion trigger: passive check on equip action
- [ ] First fusion: 【草药知识 Lv.3】+【炼金入门 Lv.2】→【药草炼金】

### Hidden Synergy System
- [ ] Define synergy pairs and their bonus effects
- [ ] Passive check when skill loadout changes
- [ ] Apply hidden stat bonus silently (no UI notification)
- [ ] Unlock hidden combat actions via synergy (e.g. 剑舞)
- [ ] First synergy: 【剑术】+【轻步】→ SPD +15%, unlock 剑舞 action

### Save System
- [ ] Define save data schema (area, skills, slots, stats, inventory, equipment, log)
- [ ] Auto-save to localStorage on every action
- [ ] Load on page open
- [ ] Manual save button (optional)

---

## 🏗️ Phase 2 — Content & Systems Expansion

### Code Refactor
- [ ] Split `App.js` into separate component files
- [ ] Extract `data/areas.js`
- [ ] Extract `data/actions.js`
- [ ] Extract `data/skills.js` (with separate `skills.md` design document)
- [ ] Extract `data/enemies.js`
- [ ] Extract `data/recipes.js` (fusion recipes)

### Skills & Discovery
- [ ] Expand base skill list (target: 20–30 discoverable skills)
- [ ] Add hidden skills (developer-placed, no hints)
- [ ] Item-triggered skill unlocks (e.g. holding a specific book → unlock skill)
- [ ] Location-triggered skill unlocks (deep area exploration)

### Town Expansion
- [ ] Blacksmith: commission crafting system (materials + gold + wait time)
- [ ] Apothecary: sell gathered materials to NPC
- [ ] Leather shop: custom commission system (hide materials)
- [ ] Inn: NPC rumours that hint at hidden content
- [ ] Town noticeboard: rotating posts, world events

### World Expansion
- [ ] South Forest: deeper layers, new encounters
- [ ] North Mine: mid and deep layers, stronger enemies
- [ ] New area: Eastern Plains
- [ ] New area: Ruined Outpost
- [ ] Day/night cycle (affects available actions and encounters)
- [ ] Weather system (affects gathering quality, enemy behaviour)

### Inventory
- [ ] Item categories (materials, consumables, equipment, key items)
- [ ] Use consumables from inventory (potions, food)
- [ ] Item descriptions and lore text
- [ ] Inventory capacity limit

---

## 🌐 Phase 3 — World & Social

- [ ] Persistent backend (user accounts, shared world state)
- [ ] Player chat system
- [ ] Player-to-player trading
- [ ] Guild / party foundation
- [ ] World map view
- [ ] Shared world events (developer-triggered)
- [ ] Player leaderboard / discovery log ("first to discover X")

---

## ⚔️ Phase 4 — Endgame & Operations

- [ ] PVP zones
- [ ] Large-scale world events
- [ ] Developer admin tools (trigger events, add content without redeploy)
- [ ] Skill slot unlock conditions (finalize slots 4–9)
- [ ] Slot 10 hidden unlock condition (deep exploration reward)

---

## 📋 Design Decisions Pending

- [ ] World name — finalise (current placeholder: 天赋)
- [ ] Attribute naming — finalise Chinese/English consistency
- [ ] MP / Mana — independent attribute or skill-derived?
- [ ] Negative skill stat penalties — keep or remove? (current: keep)
- [ ] Skill slot unlock conditions for slots 4–9
- [ ] Hidden synergy scope for Phase 1 vs Phase 2

---

## 🐛 Known Issues

- Stamina auto-recovery interval resets on re-render (minor, address in refactor)
- Skill XP bar calculation tied to fixed 20 XP per level (needs scaling formula)
- Equipment bought auto-equips immediately — need inventory-first flow in Phase 2
