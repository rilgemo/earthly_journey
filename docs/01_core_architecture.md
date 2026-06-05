# 01 Core Architecture

## Architecture Boundaries

- `App.js` is the single source of truth for current game state.
- Game logic belongs in `App.js` or custom hooks.
- Components are presentation-focused and should avoid conditional game logic inside JSX.
- Data files in `/src/data/` define game content.
- Utility files in `/src/utils/` contain pure helpers such as world time calculation.

## State Organization

`App.js` owns core state management. When complexity grows, split logic into custom hooks such as:

- `usePlayer`
- `useCombat`
- `useWorldTime`

Do not create additional global stores unless the architecture is intentionally redesigned.

## Data-Driven Rule

All game behavior should prefer data definitions over special-case conditions.

Avoid hardcoded logic such as:

```js
if (area === 'town') {
  // special behavior
}
```

Use data from `/src/data/` instead.

## Current Implementation Rules

- Components must not contain game content.
- Components render data only.
- Areas belong in `areas.js`.
- Actions belong in `actions.js`.
- Skills belong in `skills.js`.
- Future enemies belong in `enemies.js`.
- Future NPCs belong in `npcs.js`.

## Non-Negotiable Core Rules

- Derived stats are computed, not stored.
- `maxHp`, `maxStamina`, `attack`, and `defense` are recalculated on demand from equipped skills.
- Chat is authoritative: all system, NPC, and player events appear in the unified message feed.
- Undiscovered skills and actions must not render placeholders or hints in the UI.
- Action cooldowns may use `cooldownSeconds?: number` to prevent spam.
