# Earthly Journey

## 0. PROJECT SCOPE — TWO SYSTEMS

This repo contains two separate systems that share a codebase but must not be merged without an explicit design pass.

### Earthly Journey (player game)

- React UI: `src/components/` (LeftPanel, MainPanel, RightPanel, TickPanel)
- Data: `src/data/{areas,actions,skills,npcs}.js`
- Time: `src/utils/worldTime.js`, `src/utils/tickSystem.js` (1 tick = 1 ingame hour = 15 real minutes)
- This is what players experience. CLAUDE.md primarily documents this system.

### Simulation Sandbox (`src/simulation/`)

- Tick-based agent simulation: perception / intent / memory / reproduction / lineage
- Used to prototype and validate mechanics (memory decay, need systems, lineage, field dynamics) before a simplified version is designed into Earthly Journey
- Has its own tick concept (integer tick counter), its own agent model, its own world object — none of which are the same as the player game's worldTime or AGENTS
- NOT connected to the player game at runtime. Data does not flow between the two systems.

### Separation rules

- `src/simulation/` imports must not appear in player-game components (`LeftPanel`, `MainPanel`, `RightPanel`) or player-game data files
- The Simulation Sandbox UI (`SimulationInspector` / `TickPanel` / inspector hooks) is dev-only, gated behind `SHOW_SIMULATION_INSPECTOR = false` in `App.js`
- When a mechanic from the Sandbox is ready to migrate into Earthly Journey, it must be redesigned for the player game's data model — not imported directly

## LANGUAGE CONVENTION

- Code: variable names, keys, file names, comments, commit messages → English
- Display content: narrative, dialogue, UI labels, item/skill/agent names → Chinese
- Example: `AGENTS.lao_zhou.name = "老周"` (English key, Chinese display value)

This file is the code and development constraint layer.

It defines how Earthly Journey must be built. Product meaning belongs in [README.md](README.md). Current tasks and backlog belong in [TODO.md](TODO.md).

## System Boundary

This file defines:

- Code structure rules
- React architecture rules
- UI constraints
- Data organization expectations
- Development workflow guidance

This file does not define:

- Simulation rules
- Agent behavior rules
- World physics rules
- DF x AI runtime semantics

Simulation rules are defined in `/AI` only.

See `/docs` for the full project specification.

For simulation logic, agent behavior, and DF x AI tick rules, consult root [AGENTS.md](AGENTS.md) and [AI/EXECUTION_MODEL.md](AI/EXECUTION_MODEL.md) before editing code.

For implementation bridges from the current React game to the future simulation kernel, consult [docs/implementation/phase1_mapping.md](docs/implementation/phase1_mapping.md).

## Specification Index

### World & Product Direction

> Priority: GDD defines player-facing intent and world principles.
> Technical specifications define implementation details and may evolve.
> If conflicts exist, raise explicitly instead of silently conforming.

- [GDD.md](docs/GDD.md) - Game design document: core vision, skill/attribute system, NPC ecology, world time, magic design principles (concept stage), Agent evolution draft (L1→L2→L3, design draft only)

### Architecture & Technical Design

- [00_overview.md](docs/00_overview.md) - Project overview, stack, core loop, and current file structure
- [01_core_architecture.md](docs/01_core_architecture.md) - Architecture boundaries and implementation rules
- [02_agent_system.md](docs/02_agent_system.md) - Agent model and future NPC ecology references
- [03_decision_system.md](docs/03_decision_system.md) - Future decision pipeline placeholder
- [04_memory_system.md](docs/04_memory_system.md) - Future memory model placeholder
- [05_skill_system.md](docs/05_skill_system.md) - Skill identity, stat derivation, XP, leveling, and slots
- [06_world_simulation.md](docs/06_world_simulation.md) - World time and simulation cycle
- [07_action_system.md](docs/07_action_system.md) - Action schema, requirements, costs, cooldowns, and resolver behavior
- [08_data_schemas.md](docs/08_data_schemas.md) - Canonical data schemas
- [09_ui_conventions.md](docs/09_ui_conventions.md) - UI layout, panel flow, colors, and rendering rules
- [10_future_roadmap.md](docs/10_future_roadmap.md) - Implementation status, planned systems, and long-term vision

## AI Simulation Kernel

- [AGENTS.md](AGENTS.md) - simulation architecture authority
- [AI/SYSTEM_PROMPT.md](AI/SYSTEM_PROMPT.md) - DF x AI hybrid rules
- [AI/EXECUTION_MODEL.md](AI/EXECUTION_MODEL.md) - Tick flow and validation pipeline
- [AI/ARCHITECTURE.md](AI/ARCHITECTURE.md) - AI architecture index
- [AI/CONTRACT_TEST_SUITE.md](AI/CONTRACT_TEST_SUITE.md) - Authoritative contract tests for runtime protection

## Test Suite Authority

The **Simulation Contract Test Suite v1** (see [tests/README.md](tests/README.md)) is authoritative.

A runtime feature is not considered valid until protected by contract tests.

Required coverage:
- Action Registry enforcement (no unregistered actions execute)
- Execution Contract pipeline (Intent → Contract → TickManager)
- Trace integrity (all rejections traceable)
- Tick determinism (fixed seed = fixed result)
- Mana conservation (0 ≤ mana ≤ maxMana)
- Field stability (0 ≤ fields < MAX_FIELD)
- Smoke tests (daily sanity: 10 agents, 20 ticks, no crashes)

All new features must include at least one contract test before merging to main.

## Development Guidelines for AI

Prioritize current implementation over future systems.

When adding new features:

1. Follow existing schemas first.
2. Prefer extending data files over adding special-case code.
3. Do not implement future systems unless explicitly requested.

When in doubt, follow the data schemas and non-negotiable rules.

## NPC SYSTEM v1

**File:** `src/data/npcs.js`

Agents are individuals with skills and a time-based schedule. "铁匠" is a social label players may use; it is not a data field. Agent identity is an English key; the display name is Chinese.

**Schema:**

```js
AGENTS[agentId] = {
  id: string,        // English key, e.g. "lao_zhou"
  name: string,      // Chinese display value, e.g. "老周"
  skills: [{ name, level }],
  schedule: [{ from: minuteOfDay, to: minuteOfDay, activity, location }],
  defaultLocation: string,   // area key
  defaultActivity: string,
  actionLog: [{ tick, activity }],  // last 168 entries (7 game-days × 24 ticks)
}
```

**API:**

```js
getAgentStatus(agentId, timeOfDay) → { location, activity }
```

`agentId` is the English key (e.g. `"lao_zhou"`). `location` is an area key matching `AREAS`. `timeOfDay` is minutes since midnight (0–1440).

**Skill XP accumulation:**

Agents earn XP once per ingame hour (tick boundary) via `tickAgentSkillXp(agent, activity, 60)` — a pure function returning an updated agent object. Level = `floor(xp / 200) + 1`. Agent state is held in React `useState`, initialized from `AGENTS`. XP settlement is registered as a tick handler (see TICK SYSTEM below).

```js
tickAgentSkillXp(agent, activity, minutesElapsed) → agent
// XP rates: 锻造 → 锻造入门 +1/min, 钓鱼 → 钓鱼 +1/min
```

The player can observe an agent's live skill level via specific actions (e.g., "看到老周在钓鱼" shows current 钓鱼 Lv). These actions use a dedicated handler (`onZhouFishing`) that injects the live level into the narrative at click time.

**Action log and identity summary:**

Each agent carries `actionLog: [{ tick, activity }]`, capped at 168 entries (7 game-days). Populated once per ingame hour via `pushActionLog(agent, tick, activity)` — a pure function. The log enables:

```js
pushActionLog(agent, tick, activity) → agent   // pure, trims to last 168
summarizeIdentity(actionLog) → [{ activity, count, percent }]  // sorted desc
```

The action "观察老周最近的状态" (available when lao_zhou is at 锻造铺) calls `summarizeIdentity` at click time and generates Chinese narrative:

- log < 20 entries → "你认识老周还不够久，还看不出什么规律。"
- top activity > 50% → "老周最近大半时间都在{activity}。"
- top two within 15% → "老周最近在{A}和{B}之间，似乎找到了某种节奏。"

This is the first instance of player-observable identity in the player game.

**Presence-gated actions:**

Actions that require an agent to be physically present are filtered in `MainPanel.jsx`. When the agent is absent, those actions are hidden and a narrative line is shown based on their current activity. New action buttons (e.g., "看到老周在钓鱼") are injected when the agent is present at that location.

**Current agents:**

- **lao_zhou** (name: "老周") — skills: 锻造入门 (200xp/level), 钓鱼 (200xp/level)
  - Schedule: 06:00–20:00 锻造(铺) → 20:00–21:00 用餐(旅店) → 21:00–22:00 锻造(铺) → 22:00–23:00 钓鱼(南边林地)
  - Actions gated on his forge presence: 与铁匠搭话, 靠近铁匠铺观摩锻造, 购买采矿镐（40G）, 观察老周最近的状态

## TICK SYSTEM

**File:** `src/utils/tickSystem.js`

1 tick = 1 ingame hour = 15 real minutes.

On each tick boundary, all registered handlers fire to settle and summarize what happened during the elapsed hour, and may push a message to the feed.

```js
onTick(handler)                          // register a handler (call once, in useEffect)
checkTick(worldTime, pushMessage)        // call every 15s in the worldTime interval
// handler signature: (worldTime, ticksElapsed, pushMessage) => void
```

`checkTick` compares `day * 24 + hour` to detect hour boundaries. If multiple hours elapsed (e.g., after a tab sleep), `ticksElapsed > 1` and handlers receive the full count.

**Currently registered handlers:**

- **lao_zhou skill XP settlement** — on each tick, calls `tickAgentSkillXp(agent, activity, ticksElapsed * 60)`. If a skill levels up, pushes a system feed message: `"老周的${skillName}更熟练了（Lv.N）。"`

**Extension pattern:**

Future systems (shop restocking, weather change, other agent XP) register their own handler via `onTick(handler)` inside a `useEffect(() => { ... }, [])` in App.js or the relevant component.
