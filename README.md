# Earthly Journey

A browser-based text RPG sandbox where **discovery is the reward**.

You enter the world with nothing — no skills, no direction, no map. Every skill you gain, every mechanic you uncover, every hidden synergy you find — all of it comes from exploring the world on your own terms.

---

## What Makes This Game Different

**Skills define your character, not stats.**
There are no attribute points to allocate. Your character's strength, speed, and abilities are entirely determined by the skills you have equipped. Swap your skills, change your identity.

**You can't see what you haven't found.**
Locked skills are invisible. There are no hint systems, no skill trees to browse. New abilities surface naturally in the event log as you act, explore, and interact with the world.

**Every skill has depth.**
Even "useless" gathering or crafting skills contribute to your overall attributes. A dedicated crafter isn't weak — they're built differently. Combining unexpected skills can unlock hidden synergies that no one told you existed.

**Skill slots create real choices.**
You can only equip a limited number of skills at a time. Choosing what to keep equipped — and what to leave behind — shapes how you grow.

**The world is shared.**
Earthly Journey is designed as an MMO. All players inhabit the same persistent world, and the player community becomes part of how knowledge spreads.

---

## Current State

> Phase 1 — Core Systems (In Development)

- [x] Three-panel UI (Status / Narrative / Skills & Inventory)
- [x] Area-based exploration with narrative text
- [x] Dynamic action system (actions unlock through play)
- [x] Skill discovery and equip system
- [x] Skill slot system with attribute contribution
- [x] Stamina system with rest mechanics
- [x] Equipment slots (head, body, hands, feet, main hand, off hand, accessories)
- [x] Town facilities: Inn, Apothecary, Blacksmith, Leather Armour Shop
- [ ] Combat system
- [ ] Skill evolution (level-up upgrades)
- [ ] Skill fusion (multi-skill combination unlocks)
- [ ] Save/load system
- [ ] Backend & multiplayer foundation

---

## Tech Stack

- React (Create React App)
- Plain CSS-in-JS (no external UI libraries)
- GitHub for version control

---

## Getting Started

```bash
git clone https://github.com/rilgemo/earthly_journey.git
cd earthly_journey
npm install
npm start
```

Open `http://localhost:3000` in your browser.

---

## Project Structure

```
src/
├── App.js              # Main game component
├── data/               # Game data (areas, actions, skills) — to be separated in Phase 2
└── components/         # UI panels — to be separated in Phase 2
```

## UI Conventions

- Top bar shows breadcrumb navigation (e.g. 新叶镇 / 铁砧锻造铺)
- Action, Rest, and Travel buttons are vertically stacked (left-aligned), not inline wrap
- Event log is compact (maxHeight: 72px)
- Each area in areas.js includes a breadcrumb: string[] field

---

## License

Private project. All rights reserved.
