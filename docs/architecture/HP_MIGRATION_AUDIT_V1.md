# HP Migration Audit v1

## Authority and Scope

This audit follows `AGENTS.md` as the sole authority. It is read-only. No
runtime, schema, save format, test, or existing documentation file was modified.

The audit identifies the complete known migration surface from legacy HP/MaxHP
semantics toward the future biological model:

```text
Capacity  = maximum sustainable biological state
Condition = current biological state
Condition <= Capacity
```

## Executive Summary

HP is not one isolated field in Earthly. It currently represents several
different concepts across two partially separate runtime models:

1. The React player/gameplay model uses `baseStats.HP.cur/max`, skill HP bonuses,
   recovery actions, UI display, and localStorage persistence.
2. The simulation model uses `agent.hp` and `state.hp` as defaults, an injury
   proxy, a population-alive check, and a field exposed to the decision view.

No active damage system currently mutates simulation-agent HP. This lowers the
immediate algorithmic migration risk, but HP is already structurally embedded
in schemas, saves, fixtures, documentation, UI, and decision-adjacent inputs.

The migration must separate meanings before renaming fields.

## 1. Runtime Inventory

### React player/gameplay runtime

| File / Location | Purpose | Classification | Migration Concern |
| --- | --- | --- | --- |
| `src/App.js:20` | HP bar colors | UI display | Low-risk visual rename |
| `src/App.js:58` | Initializes `baseStats.HP.cur/max` | Biological/combat state placeholder | Persists current and maximum HP authority |
| `src/App.js:159` | Exposes HP in `displayStats` | UI display | Display contract assumes HP |
| `src/App.js:172-182` | Recalculates maximum HP from equipped skills and preserves current HP | Skill-derived combat state | Conflicts with aging-defined Capacity |
| `src/App.js:233` | Applies `hpRestore` action effect | Recovery/combat state | Candidate future Condition recovery |
| `src/components/LeftPanel.jsx:39` | Displays HP current/max bar | UI display | Direct user-facing terminology |
| `src/data/skills.js:20,26,38` | Skills grant HP stat bonuses | Combat/RPG abstraction | High semantic conflict with biological Capacity |
| `src/data/actions.js:71,346,408` | Unlocked skills grant HP bonuses | Combat/RPG abstraction | Couples learning to biological maximum |

### Simulation runtime

| File / Location | Purpose | Classification | Migration Concern |
| --- | --- | --- | --- |
| `src/simulation/agentModel.js:16` | Initializes every created agent with `hp: 100` | Biological state placeholder | Top-level HP authority parallel to `agent.life` |
| `src/simulation/entitySchema.js:64,81,97` | Default NPC, monster, and animal `state.hp` | Schema placeholder | Separate nested HP representation |
| `src/simulation/identity/identityLock.js:19` | Copies `agent.hp` into identity-free Decision Layer view | Decision-adjacent biological state | Makes HP available to scoring even if currently unused |
| `src/simulation/demand/demandSources.js:31` | Calculates injury as `100 - agent.hp` | Biological state and demand input | Active HP-to-world-demand dependency |
| `src/simulation/scenarios/playableWorldSlice.js:109` | Copies `agent.hp` into scenario `state.hp` | Schema/snapshot bridge | Duplicates top-level and nested HP |
| `src/simulation/runner/scenarioRunner.js:16` | Counts population only when HP is above zero | Survival/existence authority | Conflicts directly with `agent.life.alive` |

### Terms not found as active runtime fields

- No `health`, `healthPoints`, or `health_points` runtime fields were found.
- No active `vitality` runtime field remains.
- `maxHp` appears in test infrastructure, not current production simulation
  runtime.

## 2. Schema Inventory

### Required versus optional

`validateEntity()` requires an entity `state` object but does not validate or
require an HP field. Therefore:

- `state.hp` is present in default entity factories.
- `state.hp` is not formally required by the generic entity validator.
- Top-level `agent.hp` is created by `createNPC()` but is not governed by the
  generic entity schema.
- HP is operationally assumed by demand and scenario-runner code despite not
  being schema-required.

This is a state-ownership ambiguity:

```text
agent.hp
agent.state.hp
baseStats.HP.cur
baseStats.HP.max
```

All can represent physical state, but they have different owners and lifecycle
rules.

### Persistence and serialization

#### Player save format

`src/App.js` persists `baseStats` into localStorage under:

```text
save key: earthly_save
save version: 1
path: baseStats.HP.cur / baseStats.HP.max
```

HP is therefore an active persisted save-format dependency.

#### Simulation replay and snapshots

- Scenario agent creation copies `agent.hp` to `agent.state.hp`.
- Replay snapshots currently summarize population and fields rather than full
  agent HP state in the scenario runner.
- Generic replay and clone utilities can serialize HP whenever a supplied frame
  contains agents or traces with HP.
- Test-world snapshots contain `hp` and `maxHp`.

HP is not universally persisted in simulation replay, but replay payloads and
fixtures are structurally capable of carrying it.

## 3. System Dependency Audit

```text
Skills / Equipment
    -> baseStats.HP.max
    -> baseStats.HP.cur adjustment
    -> UI HP bar
    -> localStorage save

Action hpRestore
    -> baseStats.HP.cur

createNPC
    -> agent.hp
    -> identity-free Decision view
    -> demand injury signal
    -> healing demand

createNPC
    -> playableWorldSlice state.hp
    -> scenario population counting
    -> death/population reports
```

| System | HP Usage | Migration Complexity |
| --- | --- | --- |
| Player stat system | Owns current/max HP pair | High |
| Skill/equipment system | Increases maximum HP | High |
| Action system | Restores current HP | Medium |
| Local save system | Persists `baseStats.HP` | High |
| Agent creation | Initializes `agent.hp` | Medium |
| Entity factories | Initialize `state.hp` | Medium |
| Identity-free Decision view | Exposes HP to Decision Layer | Medium |
| World Demand | Converts HP deficit into healing demand | High |
| Scenario population runner | Treats HP above zero as alive | High |
| Replay/snapshot utilities | May serialize HP transitively | Medium |
| Damage system | No active production dependency found | Low/currently absent |
| Ecology system | No active HP dependency found | Low/currently absent |

### Decision influence assessment

No direct use of HP was found in the current intent scorer. However,
`createIdentityFreeDecisionView()` exposes `hp`, and World Demand derives a
healing signal from HP. Demand is allowed to affect action attractiveness under
`AGENTS.md`.

Therefore HP has an indirect causal path:

```text
agent.hp -> healing demand -> demand index -> intent scoring context
```

This makes HP migration behaviorally sensitive even before a damage system
exists.

## 4. UI Inventory

### Displayed

- `LeftPanel` displays an HP current/max bar.
- `App.js` defines HP-specific colors.
- `displayStats` exposes HP as a first-class player stat.

### Edited or mutated

- Skill-slot recalculation changes maximum HP.
- Recalculation adjusts current HP when maximum HP changes.
- Actions with `hpRestore` increase current HP.
- Loading a save restores `baseStats`, including HP.
- Reset removes the entire save, including HP.

### Inspector and debug views

No dedicated inspector panel was found that explicitly displays or edits HP.
Generic JSON inspector views may display HP when it exists in supplied payloads.

## 5. Test Inventory

| File / Location | Test Role | Coupling Type |
| --- | --- | --- |
| `tests/testUtils.js:87-88` | Creates test agents with `hp` and `maxHp` | Shared fixture/schema coupling |
| `tests/regression/smoke.test.js:143-144` | Asserts HP remains between zero and MaxHP | Explicit HP invariant |
| `tests/simulation/actionExpansion.test.js:35` | Agent fixture includes HP | Fixture-only dependency |
| `tests/simulation/agentTypology.test.js:14` | Agent fixture includes HP | Fixture-only dependency |
| `tests/simulation/skillEmergence.test.js:19` | Agent fixture includes HP | Fixture-only dependency |

### Test-risk classification

- The smoke test contains the only explicit HP/MaxHP behavioral invariant.
- Simulation tests mostly include HP because common agent shapes expect it.
- No test currently validates damage, HP recovery, HP-driven death, or HP-driven
  intent scoring.
- Existing test coverage is insufficient to prove a safe semantic migration to
  Capacity/Condition.

## 6. Documentation Inventory

### Active conflicting documentation

| Document | HP Meaning | Classification |
| --- | --- | --- |
| `AI/EXECUTION_MODEL.md` | Required HP validation | Active/conflicting |
| `AI/RESOLUTION_MODEL.md` | HP survival threshold overrides intents | Active/conflicting |
| `docs/03_decision_system.md` | Current HP influences decisions | Active/conflicting |
| `docs/05_skill_system.md` | HP and MaxHP derived from equipped skills | Active/high conflict |
| `docs/07_action_system.md` | HP thresholds and HP restoration | Active/conflicting |
| `docs/08_data_schemas.md` | HP in player, enemy, NPC, and stat schemas | Active/schema conflict |
| `docs/implementation/player_model.md` | HP described as physical state | Active/conflicting |
| `docs/implementation/action_engine.md` | HP restoration and requirements | Active/conflicting |
| `docs/02_agent_system.md` | Future NPC schema includes HP | Future/conflicting |
| `docs/00_overview.md` | HP bar description | Active UI terminology |

### Historical/audit references

`docs/architecture/LIFE_MODEL_SEMANTIC_AUDIT_V1.md` discusses HP as legacy
terminology and migration debt. These references are historical/audit context,
not active HP authority.

### Health terminology

`AI/ACTION_SCHEMA_REGISTRY.md` uses the narrative phrase “recovering health and
stamina.” This is narrative terminology rather than a schema field, but it will
need semantic alignment once Condition recovery is canonical.

### Vitality terminology

No active vitality model was found. Vitality appears only in audit discussion
as rejected/legacy terminology.

### AGENTS.md

`AGENTS.md` contains no HP, health, or vitality authority. This is favorable:
the constitutional layer does not block Capacity/Condition migration.

## 7. Migration Risk Assessment

### HP -> Condition

**Risk: High**

Reasons:

- HP currently means player current combat state, simulation-agent injury
  proxy, and population existence.
- HP deficit actively changes healing demand.
- HP is exposed to the Decision Layer view.
- HP is persisted in the player save format.
- Top-level `agent.hp`, nested `state.hp`, and `baseStats.HP.cur` are separate
  authorities.
- Current tests do not cover the semantic distinctions required by Condition.

Mapping current HP directly to Condition would preserve some meanings but would
incorrectly merge combat damage, biological state, and existence.

### MaxHP -> Capacity

**Risk: High**

Reasons:

- Player MaxHP is derived from equipped skills.
- Future Capacity is intended to be biological and primarily shaped by aging.
- Existing skill bonuses would make biological Capacity an RPG build stat.
- MaxHP is persisted inside `baseStats`.
- Production simulation agents do not consistently define MaxHP, so migration
  would be asymmetric.

MaxHP must not be mechanically renamed to Capacity without first resolving
whether combat durability remains a separate concept.

### Lower-risk surfaces

- HP-specific UI labels and colors are low-risk after semantic ownership is
  settled.
- Fixture-only HP fields are low-risk to update after canonical schemas exist.
- Narrative “health” wording is low-risk but should be updated last.

## 8. Recommended Migration Order

This is a sequencing recommendation only, not an implementation proposal.

1. Define canonical ownership and invariants for Capacity, Condition, Alive, and
   pending death.
2. Decide whether combat durability remains separate from biological Condition.
3. Resolve the three competing state paths: `agent.hp`, `state.hp`, and
   `baseStats.HP`.
4. Remove HP as population/existence authority in favor of canonical lifecycle
   state.
5. Reclassify HP-derived injury and healing demand into Condition-deficit
   semantics.
6. Remove HP exposure from Decision Layer inputs unless explicitly required by
   the future biological decision contract.
7. Define save-version migration for `earthly_save.baseStats.HP`.
8. Reclassify skill/equipment HP bonuses so they do not automatically define
   biological Capacity.
9. Update action requirements and recovery effects.
10. Update schema factories, fixtures, and test invariants.
11. Update UI terminology and presentation.
12. Update active AI/docs terminology after runtime and schema authority are
    stable.

## HP Migration Readiness Verdict

**Not ready for a direct field rename. Ready for a staged semantic migration.**

Earthly has a clear future Capacity/Condition model and `AGENTS.md` does not
preserve HP as constitutional authority. However, HP currently spans player
saves, skill-derived stats, UI, simulation schemas, world demand, Decision
Layer inputs, population reporting, fixtures, and active documentation.

The migration's critical task is not replacing the word HP. It is separating
biological Condition, biological Capacity, combat durability, and existence
state into non-competing authorities before any field rename occurs.
