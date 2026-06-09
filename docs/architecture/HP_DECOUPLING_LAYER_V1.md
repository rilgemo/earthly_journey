# HP Decoupling Layer v1

## Authority and Scope

This document follows `AGENTS.md` as the sole authority. It is an architectural
decomposition and refactor-preparation audit only.

No runtime, schema, save format, test, gameplay, or simulation-output change was
made. The proposed adapter is conceptual and is not implemented.

## Objective

HP currently behaves as a shared cross-layer variable. The decoupling goal is
not to remove HP immediately. It is to constrain HP behind compatibility
boundaries so that it no longer acts as an implicit authority shared by UI,
persistence, simulation, derived logic, and decision-adjacent systems.

Target role:

```text
HP: cross-layer causal variable
-> HP: bounded legacy compatibility interface
```

## 1. HP Dependency Graph

### Player/gameplay branch

```text
Skill definitions / unlocked skill rewards
    -> HP stat bonuses
    -> App skill-slot recalculation
    -> baseStats.HP.max
    -> baseStats.HP.cur adjustment
    -> LeftPanel HP display
    -> localStorage earthly_save.baseStats

Action hpRestore
    -> App action execution
    -> baseStats.HP.cur
    -> LeftPanel HP display
    -> localStorage earthly_save.baseStats
```

### Simulation branch

```text
createNPC
    -> agent.hp
       -> identity-free Decision view
       -> demand injury proxy
          -> healing demand
          -> demand index
          -> intent scoring context
       -> playableWorldSlice state.hp
          -> scenario population counting
          -> death and population reports

Entity factories
    -> state.hp
```

### Test and documentation branch

```text
Test fixtures
    -> hp / maxHp assumptions
    -> smoke-test HP bounds invariant

AI and docs contracts
    -> HP execution requirement
    -> HP survival override
    -> HP restoration
    -> HP-derived skill stats
    -> HP entity schemas
```

### Role and layer summary

| Usage | Layer | Classification | Causal Status |
| --- | --- | --- | --- |
| `agent.hp` initialization | Simulation runtime | HP_RuntimeState | Shared source |
| `state.hp` entity defaults | Schema/runtime boundary | HP_RuntimeState | Duplicate source |
| healing demand from HP deficit | Reality/Decision context boundary | HP_DerivedState | Simulation-critical |
| HP in identity-free decision view | Decision input boundary | HP_RuntimeState | Decision-adjacent |
| HP-based population count | Runner/reporting boundary | HP_DerivedState | Existence proxy |
| `baseStats.HP.cur/max` | Player gameplay runtime | HP_RuntimeState + HP_DisplayState | Separate shared source |
| HP skill bonuses | Derived gameplay logic | HP_DerivedState | Mutates maximum |
| `hpRestore` | Action/gameplay logic | HP_DerivedState | Mutates current |
| HP bar | UI | HP_DisplayState | Presentation-only consumer |
| localStorage `baseStats.HP` | Persistence | HP_PersistenceState | Persisted compatibility contract |
| fixtures and assertions | Tests | Compatibility dependency | Locks legacy shape |
| AI/docs HP contracts | Documentation | Documentation-only | Semantic authority risk |

## 2. Cross-Layer Coupling Analysis

### Violation A: HP is both runtime state and Decision Layer input

`agent.hp` is created as simulation state and copied into the identity-free
Decision Layer view.

```text
Simulation state -> Decision input
```

The intent scorer does not currently read HP directly, but the field is
available without a declared compatibility boundary. This is a latent coupling
edge.

### Violation B: HP is a proxy for healing demand

World Demand derives injury using:

```text
injury = 100 - agent.hp
```

This gives HP an indirect behavior influence:

```text
agent.hp
-> healing demand
-> demand index
-> action attractiveness
```

The concern is not that Demand influences attractiveness; `AGENTS.md` permits
that. The concern is that an ambiguous legacy field silently defines the input
meaning for a Reality/Decision pressure system.

### Violation C: HP is a proxy for existence

The scenario runner treats HP above zero as population membership. The Life
System separately owns `alive` and pending death.

```text
HP > 0 -> counted alive
Life.alive -> lifecycle existence
```

This creates competing ownership of agent existence.

### Violation D: HP is both derived output and mutable input

In the player branch:

- Skills derive maximum HP.
- Current HP is adjusted when maximum HP changes.
- Actions restore current HP.
- UI reads both values.
- Persistence stores both values.

HP is simultaneously:

```text
derived from skills
mutated by actions
rendered by UI
persisted by saves
```

No adapter or owner isolates these responsibilities.

### Violation E: Three incompatible HP state shapes coexist

```text
agent.hp
agent.state.hp
baseStats.HP.cur / baseStats.HP.max
```

These values have no declared synchronization or precedence rules. Consumers
select whichever representation is locally convenient.

### Violation F: UI state is also persistence state

`baseStats.HP` is both React runtime state and the persisted save contract. UI
refactors therefore risk save compatibility, while save compatibility constrains
UI semantics.

### Violation G: Documentation grants HP more authority than runtime

AI and docs describe HP as:

- an execution requirement
- a survival override input
- a decision input
- a restorable action field
- a skill-derived stat

Some of these contracts are not implemented in production simulation runtime.
This creates semantic coupling pressure for future code to reintroduce HP as a
strong causal authority.

## 3. HP Role Classification Map

### HP_RuntimeState

Definition:

> Legacy HP values currently treated as authoritative mutable or readable
> runtime state.

Assigned usages:

- `src/simulation/agentModel.js`: `agent.hp`
- `src/simulation/entitySchema.js`: default `state.hp`
- `src/simulation/scenarios/playableWorldSlice.js`: `state.hp` copy
- `src/simulation/identity/identityLock.js`: Decision view HP exposure
- `src/App.js`: `baseStats.HP.cur/max`

Boundary requirement:

- Runtime consumers must not access arbitrary HP shapes directly after
  isolation.
- A single compatibility reader must define precedence.

### HP_DisplayState

Definition:

> HP representation used only for presentation.

Assigned usages:

- `src/components/LeftPanel.jsx`: HP bar
- `src/App.js`: HP colors and `displayStats.HP`
- Generic inspector JSON rendering when HP happens to be present

Boundary requirement:

- Display state must consume a read-only view.
- UI must not become the owner of biological or simulation state.

### HP_PersistenceState

Definition:

> Legacy HP representation embedded in persisted data contracts.

Assigned usages:

- `earthly_save` version 1
- `baseStats.HP.cur`
- `baseStats.HP.max`
- Generic replay frames when HP-bearing payloads are supplied

Boundary requirement:

- Persistence translation must be isolated from live state ownership.
- Legacy saves must remain readable until an explicit save-version migration.

### HP_DerivedState

Definition:

> Values or decisions calculated from HP, or calculations that mutate HP.

Assigned usages:

- Skill and equipment HP bonuses
- Skill-slot MaxHP recalculation
- `hpRestore`
- HP-derived injury signal
- Healing demand
- HP-based population count
- HP/MaxHP bound assertions

Boundary requirement:

- Derived consumers must state the semantic meaning they need.
- Consumers should not infer injury, existence, Capacity, or Condition directly
  from raw HP without a compatibility translation.

## 4. Conceptual HP Adapter Boundary

The adapter is a compatibility boundary, not a new causal system.

It must not:

- create behavior
- select actions
- mutate world state outside Execution authority
- redefine biological truth
- change save formats
- silently synchronize unrelated HP representations

Conceptual interface:

```ts
interface HPAdapter {
  readHP(source): LegacyHPView;
  writeHP(target, nextHP, executionContext): LegacyHPWriteResult;
  toCondition(source): ConditionCompatibilityView;
  toCapacity(source): CapacityCompatibilityView;
}
```

### `readHP(agent)`

Purpose:

- Read legacy HP through one declared precedence rule.
- Return a bounded compatibility view.

Conceptual output:

```ts
{
  current,
  maximum,
  sourceKind,
  compatibilityOnly: true
}
```

It must not declare HP to be canonical biological truth.

### `writeHP(agent)`

Purpose:

- Centralize legacy HP writes while HP remains supported.
- Require Execution Layer authority for simulation mutations.

It must not:

- write from UI display code into simulation state
- bypass tickManager for simulation entities
- update Capacity/Condition implicitly

### `toCondition(agent)`

Purpose:

- Provide an explicit transitional interpretation when a legacy consumer needs
  Condition-like meaning.

It must return a compatibility projection, not canonical Condition.

### `toCapacity(agent)`

Purpose:

- Provide an explicit transitional interpretation when a legacy consumer needs
  Capacity-like meaning.

It must not map skill-derived MaxHP directly to biological Capacity without a
declared policy.

### Proposed dependency direction

```text
Legacy HP sources
    -> HPAdapter compatibility view
       -> UI display
       -> legacy persistence translator
       -> explicitly approved derived consumers

Future Capacity/Condition
    -X-> automatic write-back to HP

HP
    -X-> direct Decision Layer input
    -X-> direct existence authority
```

## 5. Migration Phases Roadmap

### Phase 0: Freeze HP semantics

- Declare all existing HP fields legacy compatibility fields.
- Prevent new direct HP dependencies.
- Record current read/write consumers and save paths.
- Do not alter behavior.

Exit condition:

- No new system may treat HP as canonical biological state.

### Phase 1: Isolate UI dependency

- Define a read-only display view for HP.
- Separate display labels/colors from live-state ownership.
- Preserve current rendering and behavior.

Exit condition:

- UI only consumes compatibility display state.

### Phase 2: Isolate persistence dependency

- Define an explicit persistence translation boundary for save version 1.
- Preserve `earthly_save.baseStats.HP`.
- Prevent persistence shape from defining runtime ownership.

Exit condition:

- Save/load compatibility is isolated from runtime semantics.

### Phase 3: Isolate simulation dependency

- Route HP reads used by demand, population reporting, and Decision views
  through explicit compatibility interpretations.
- Remove raw HP as an undeclared cross-layer input.
- Preserve existing outputs during this phase.

Exit condition:

- No simulation consumer reads raw HP without declaring its required meaning.

### Phase 4: Introduce Capacity/Condition parallel model

- Establish canonical Capacity and Condition ownership.
- Keep HP as a compatibility projection only.
- Verify deterministic equivalence for all legacy consumers.

Exit condition:

- Capacity/Condition are authoritative; HP is derived compatibility state.

### Phase 5: Deprecate HP runtime usage

- Remove direct HP reads and writes after save, UI, tests, and documentation use
  compatibility paths.
- Retain legacy translation only as long as old saves require it.

Exit condition:

- HP has no causal runtime authority.

## 6. Risk Assessment

### High Risk

- Healing demand currently derives from HP and can influence intent scoring.
- Population reporting treats HP as existence authority.
- Player HP is persisted in save version 1.
- Skill-derived MaxHP conflicts with biological Capacity semantics.
- Multiple HP shapes have no canonical precedence.

### Medium Risk

- Decision view exposes HP even though current scoring does not directly use it.
- `hpRestore` and future damage logic can expand HP authority.
- Generic replay/snapshot paths may preserve HP transitively.
- Active AI/docs contracts may encourage new HP dependencies.

### Low Risk

- HP color tokens and display labels.
- Fixture-only HP fields after compatibility factories exist.
- Narrative “health” wording after canonical semantics are stable.

### Adapter-specific risks

- An adapter could accidentally become a second biological authority.
- Bidirectional synchronization could create hidden feedback loops.
- `toCondition()` and `toCapacity()` could be mistaken for canonical models.
- A write adapter could violate tickManager mutation authority if not restricted.

Mitigation principle:

```text
The adapter translates legacy state.
It never decides biological truth.
```

## 7. Recommended Next Implementation Step

The next implementation step should be a narrow Phase 0 contract pass:

1. Define and document a single read-only legacy HP view.
2. Inventory every direct HP read and write against that view.
3. Add boundary tests proving no new direct HP dependency is introduced.
4. Do not yet change runtime outputs, saves, tests, or HP field names.

The first implementation should not introduce Capacity/Condition or migrate
data. Its only purpose should be to make existing HP access explicit and
traceable while preserving exact behavior.

## Final Requirement

HP is confirmed as a cross-layer shared state variable and must be isolated before any Capacity/Condition migration.
