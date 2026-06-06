# Earthly Journey — Copilot Execution Instructions (v1)

This file defines the project-level operating constraints for GitHub Copilot inside this repository.

The system is transitioning from a React RPG into a multi-agent simulation engine (DF x AI hybrid architecture).

---

# 1. CORE ARCHITECTURE PRINCIPLE

Earthly Journey is NOT a React application with game logic.

It is a simulation engine with a React rendering layer.

Architecture hierarchy:

Simulation Core (authoritative)
    ↓
AI Runtime Layer (/AI)
    ↓
Game State / World State
    ↓
React UI Layer (presentation only)

Core rule:

> Copilot must never decide simulation logic placement.
> Simulation layer is always authoritative over UI and AI definitions.

---

# 2. HARD LAYER SEPARATION RULES

## ❌ FORBIDDEN in React / UI layer:
- Game rules logic
- World simulation logic
- Agent decision logic
- Time progression logic
- Economy / NPC behavior logic
- Combat calculations
- Skill growth rules

React components must NEVER:
- mutate world rules
- compute simulation outcomes
- decide agent behavior

React = PURE PRESENTATION ONLY

---

## ✅ ALLOWED in React layer:
- Rendering state
- Calling simulation functions
- Displaying world state
- User input forwarding (intent only)

---

# 3. SIMULATION AUTHORITY RULE

All simulation logic MUST reside in:

/src/simulation/

or /AI (design-level only, not runtime execution in React)

---

# 4. WORLD MODEL PRINCIPLE

The world is agent-driven:

Agents include:
- Player
- NPC
- Animals
- Monsters

All agents:
- have tick-based behavior
- operate on shared world state
- do NOT depend on UI

---

# 5. TIME SYSTEM RULE

Time MUST be centralized:

- 15 real minutes = 1 in-game hour
- worldTime is derived from Date.now()
- NEVER store time in React state or localStorage

All systems MUST consume:
src/simulation/worldTime.js

---

# 6. TICK SYSTEM RULE

All world updates MUST go through:

tickManager()

Rules:
- No direct state mutation outside tick cycle
- All agent updates happen inside tick
- Deterministic simulation preferred

---

# 7. DATA-DRIVEN DESIGN RULE

All game content must come from:

/src/data/
- areas.js
- actions.js
- skills.js

DO NOT hardcode:
- actions in UI
- conditions in components
- gameplay rules in JSX

---

# 8. AGENT-FIRST THINKING

When implementing features, always convert:

Player Action → Intent → Simulation → Resolution → State Update → Render

NEVER:

UI click → direct state mutation

---

# 9. AI / SIMULATION MODULE RULES

/AI folder is:

- DESIGN + SPECIFICATION ONLY
- NOT runtime code
- NOT executed inside React

Copilot must NOT:
- implement AI runtime logic in /AI
- couple /AI logic directly into UI
- introduce new action keys without checking `AI/ACTION_SCHEMA_REGISTRY.md`

---

# 10. RESOLUTION RULE

Final state changes MUST follow:

RESOLUTION_MODEL (conceptual authority)

Only simulation layer may:
- finalize outcomes
- resolve conflicts
- apply world mutations

---

# 11. DEBUGGING & TRACE RULE

All emergent behavior must be traceable via:

TRACE_MODEL (observability layer)

No hidden state mutation is allowed.

---

# 12. DEVELOPMENT PRIORITY ORDER

When implementing features, follow order:

1. Simulation layer (/simulation)
2. Data layer (/data)
3. Integration glue (App.js minimal logic)
4. UI rendering (components)

---

# 13. COPILOT BEHAVIOR DIRECTIVE

Before writing code:

1. Identify correct layer (Simulation / Data / UI)
2. Prefer simulation layer for logic
3. Avoid adding logic inside React components
4. Ask if unsure about architecture placement

---

# 14. LONG-TERM VISION

This project will evolve into:

- Multi-agent ecosystem simulation
- Emergent economy system
- Autonomous NPC + animal + monster behavior
- Persistent world state evolution

React is only the visualization layer of this system.

---

# 15. QUOTA-AWARE COPILOT WORKFLOW

Use Copilot Chat / Agent mode only for:

- Architecture decisions
- Simulation model review
- Multi-file refactors
- Runtime authority changes
- DF vs AI boundary discussions

Prefer Inline Suggestions / Ghost Text for:

- Tests
- Schemas
- React components
- Registry updates
- Tick implementation details
- Utility functions

Before asking Chat or Agent to implement routine code:

1. Create the target file.
2. Write the function, test, or component skeleton.
3. Add TODO comments copied from project docs.
4. Pause and let inline suggestions complete the implementation.
5. Review against this instruction file and contract tests.

For routine code, prefer comments such as:

```js
// TODO:
// Protect tickManager as the only world mutation authority.
// registered action -> execute -> world mutated
// unregistered action -> no mutation
// tick -> trace emitted
```

Do not use Agent mode for single functions, narrow tests, small schemas, or one-file UI updates unless the architecture placement is unclear.

---

# 16. SEMANTIC INDEX HYGIENE

After major architecture, schema, or test-suite changes, rebuild the Copilot semantic index in VS Code:

```text
Ctrl + Shift + P
Copilot: Rebuild Codebase Index
```

or, depending on installed version:

```text
Copilot: Refresh Semantic Index
```

If the Codebase Semantic Index is out of date, expect worse suggestions and higher Chat usage.

---

# 17. EARTHLY INLINE PROMPTING STYLE

When using inline suggestions, seed Copilot with project-specific authority terms:

- ACTION_REGISTRY
- RESOLUTION_MODEL
- EXECUTION_CONTRACT
- tickManager
- WORLD_STATE
- TRACE_MODEL
- ENTITY_SCHEMA

Use pipeline comments to preserve architecture:

```js
// Intent -> Contract -> tickManager -> World State -> Trace
```

Routine implementation should be generated from local skeletons plus these comments, then verified by contract tests.

---

# END OF INSTRUCTIONS
