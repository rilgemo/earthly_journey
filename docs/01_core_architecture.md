# 01 Core Architecture

## Architecture Alignment Map

```
Human Input → Copilot / Code Layer (.vscode instructions)
        │
        ▼
  UI Layer (React only)
        │
        ▼
Simulation Core (/src/simulation)
        │
        ▼
   Data Layer (/src/data)
```

This repository is an authoritative simulation engine with a React visualization layer.

## Layer Responsibilities

### UI Layer

- React components must render state only.
- UI may forward player intent and display world state.
- UI may call simulation functions but must not mutate world state directly.
- UI must never implement decision logic, simulation rules, or agent behavior.

### Simulation Core

- `/src/simulation/` is the authoritative world runtime.
- `tickManager()` is the single entrypoint for world mutation.
- All time progression, state updates, and rule execution happen inside the simulation layer.
- Simulation resolves conflicts and applies deterministic outcomes.

### Data Layer

- `/src/data/` contains static definitions: areas, actions, skills, and content.
- Data files define what exists, not how the system behaves.
- Do not place game rules or behavior logic in data files.

### AI Runtime Layer

- `/AI/` defines design-level behavior, decision models, tuning, and observability.
- `/AI/` is specification only and must not execute game runtime logic.
- AI docs may define probabilities, emergent behavior models, and intent resolution rules.
- AI may not mutate React state or replace the simulation runtime.

## Non-Negotiable Anti-Drift Rules

- Copilot must never decide simulation logic placement.
- Simulation layer is always authoritative over UI and AI definitions.
- No direct UI → world mutation.
- No UI decision making.
- No AI runtime logic inside React components.
- All world updates must converge to `tickManager()`.

## Simulation Authority

Whenever a feature is implemented, follow this order:

1. Simulation layer (`/src/simulation`)
2. Data layer (`/src/data`)
3. Integration glue (`App.js` minimal wiring)
4. UI rendering (`src/components`)

This order prevents architecture drift and keeps the simulation core authoritative.
