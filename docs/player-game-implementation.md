# Player Game Implementation

This file is the **Player Game Implementation Layer** — code structure and runtime behavior mapping for the systems players actually experience (`src/data/`, `src/utils/`, `src/components/`). It is not the AI runtime governance file ([CLAUDE.md](../CLAUDE.md)) and not the Simulation Sandbox design doc ([docs/earthly-journey-sync.md](earthly-journey-sync.md)).

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

**Schedule drift (Phase 0.6):**

Each agent carries `skillHabit: { forge, fishing }` — counters incremented by 1 per ingame hour spent on the corresponding activity, via `tickSkillHabit(agent, activity, ticksElapsed)` (pure). This accumulates alongside XP/actionLog in the same tick handler.

```js
driftSchedule(agent) → schedule   // pure, computed from BASE_SCHEDULE (not agent.schedule)
```

Once per ingame day boundary (checked via `worldTime.day` changing, not every tick), `driftSchedule(agent)` reads `skillHabit` imbalance and nudges the forge/fishing block boundary by a small bounded amount (max ±2 ingame hours from the original schedule shape, floor of 30min per block). This lets long-term behavioral dominance show up as a real shift in the action distribution, giving Phase 0.5's "deepening dominance" narrative branch in `describeIdentityNarrative` something genuine to detect — no changes to that function were needed.

**Observation memory (Phase 0.7):**

`observeHistory` is PLAYER-side state in `App.js` (`{ lao_zhou: [{ tick, narrative, distributionSummary }] }`), not agent state — it represents what the player remembers having seen, not anything lao_zhou knows about himself. It is persisted in the localStorage save file alongside other player progress fields, capped at the last 10 entries per agent.

```js
buildDistributionSummary(actionLog) → { topActivity, topPercent, secondActivity, secondPercent } | null   // pure
compareIdentityNarrative(actionLog, priorSummary) → string[]   // pure
```

When the player re-triggers "观察老周最近的状态" at least `MIN_OBSERVE_GAP_TICKS` (72 ticks / ~3 ingame days) after their last observation, `compareIdentityNarrative` is used instead of a fresh `describeIdentityNarrative` snapshot. It compares the current dominance tier (weak / moderate / strong, bucketed from `topPercent`) against the tier stored in the prior observation's `distributionSummary` — tier comparison rather than a raw percentage-point delta, so a few points of rolling-window noise doesn't get reported as "change." If the tier rose, it's reported as deepening; if it fell (or the dominant activity itself changed), as a weakening; if unchanged, "老周还是老样子。" First observation, or insufficient elapsed time, falls back to the plain snapshot. This is the first instance of "world changed + player noticed = meaning" — the comparison is always derived from real `actionLog`/`skillHabit`-driven data, never hardcoded.

Verified acceptance run (3 checkpoints, EPOCH_MS-accelerated):

- Day 1: baseline snapshot (first observation, no comparison yet)
- Day 8: "和你记忆里的样子比，他最近似乎越来越少离开炉台了。" (schedule drift from Phase 0.6 had deepened the forge dominance tier since day 1)
- Day 31: "老周还是老样子。" (drift had already capped by ~day 7 per Phase 0.6's ±2h bound — correctly reports no further change rather than inventing one)

Combined with Phase 0.6 (schedule drift via `skillHabit`) and Phase 0.5 (narrative-only observation, no raw stats), the full chain now reads: real behaviour accumulates → schedule nudges within a bounded range → player-facing narrative reflects the shift honestly, including reporting "no change" when that is true.

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
