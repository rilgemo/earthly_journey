# HP Containment Patch v1

## Authority and Scope

This containment contract follows `AGENTS.md` as the sole authority.

It is a read-only architectural constraint patch. It does not rename HP,
modify runtime behavior, alter tickManager or intentPipeline, change saves,
change UI rendering, modify tests, or implement an adapter.

## Containment Declaration

HP is classified as:

```text
LEGACY BOUND STATE (INERT)
```

This means:

- HP may remain where backward compatibility currently requires it.
- Existing behavior may continue until an explicit migration phase.
- HP must not gain new meanings, consumers, writers, or cross-layer paths.
- HP is not a simulation primitive, biological model, or independent system.

Containment freezes HP's dependency surface. It does not certify existing HP
dependencies as desirable or compliant.

## 1. HP Dependency Classification Map

### HP_RuntimeState

Definition:

> Existing legacy HP values held in runtime-shaped objects.

| Module | Existing Usage | Dependency Direction | Containment Status |
| --- | --- | --- | --- |
| `src/simulation/agentModel.js` | Initializes `agent.hp` | Factory -> agent runtime state | Frozen |
| `src/simulation/entitySchema.js` | Provides default `state.hp` values | Entity factory -> entity state | Frozen |
| `src/simulation/scenarios/playableWorldSlice.js` | Copies `agent.hp` into `state.hp` | Runtime state -> scenario state | Frozen |
| `src/simulation/identity/identityLock.js` | Exposes `agent.hp` in Decision view | Runtime state -> Decision input view | Frozen, must not gain consumers |
| `src/App.js` | Holds `baseStats.HP.cur/max` | Player runtime state -> UI/persistence | Frozen legacy branch |

Constraints:

- No new runtime HP shape may be introduced.
- No new module may become an HP writer.
- No existing HP representation may be declared canonical biological truth.

### HP_DisplayState

Definition:

> Existing HP values and presentation tokens used only for display.

| Module | Existing Usage | Dependency Direction | Containment Status |
| --- | --- | --- | --- |
| `src/components/LeftPanel.jsx` | Displays HP current/max bar | Player HP state -> UI | Allowed read-only legacy display |
| `src/App.js` | HP colors and display mapping | Player HP state -> UI props | Allowed read-only display role |
| Generic inspectors | May render HP in JSON payloads | Snapshot -> presentation | Allowed snapshot-only read |

Constraints:

- UI may display existing HP values.
- UI must not define HP semantics.
- No inspector or display component may mutate HP.
- No new gameplay or simulation logic may be placed in an HP display path.

### HP_PersistenceState

Definition:

> Existing HP values mirrored into backward-compatible save or serialized
> representations.

| Boundary | Existing Usage | Dependency Direction | Containment Status |
| --- | --- | --- | --- |
| `earthly_save` version 1 | Persists `baseStats.HP.cur/max` | Player state -> localStorage mirror | Frozen save contract |
| Generic replay/snapshot paths | May serialize HP-bearing payloads | Snapshot source -> serialized mirror | Passive only |

Constraints:

- Persistence mirrors existing values only.
- Persistence must not calculate, normalize, repair, or reinterpret HP.
- Save shape must not become a runtime source of semantic authority.
- No new persisted HP fields or formats may be introduced.

### HP_DerivedState

Definition:

> Existing logic that calculates from HP, changes HP, or uses HP as a proxy.

| Module | Existing Usage | Dependency Direction | Containment Status |
| --- | --- | --- | --- |
| `src/data/skills.js` | HP bonuses | Skill data -> player MaxHP | Frozen |
| `src/data/actions.js` | Skill HP bonuses and `hpRestore` | Action data -> player HP | Frozen |
| `src/App.js` | Recalculates MaxHP and applies restoration | Skills/actions -> HP runtime state | Frozen existing behavior |
| `src/simulation/demand/demandSources.js` | Converts HP deficit into injury/healing demand | HP -> demand -> intent context | Critical frozen causal path |
| `src/simulation/runner/scenarioRunner.js` | Uses HP as population/alive proxy | HP -> reporting/existence interpretation | Critical frozen authority conflict |
| Test fixtures/assertions | Assume HP/MaxHP shapes and bounds | Legacy contract -> tests | Frozen compatibility dependency |

Constraints:

- Existing derived paths may remain only to preserve current behavior.
- No new derived HP consumer may be added.
- No new proxy meaning may be inferred from HP.
- Existing derived paths must not be copied into new systems.

## 2. Cross-Layer Coupling Analysis

### Runtime to Decision-context coupling

Existing path:

```text
agent.hp
-> injury proxy
-> healing demand
-> demand index
-> intent scoring context
```

This is the most important contained causal dependency. It is not permitted to
expand into direct intent scoring, resolution overrides, or additional demand
categories.

### Runtime to existence/reporting coupling

Existing path:

```text
agent.hp / state.hp
-> population counting
-> death and population reports
```

This reuses HP as an existence proxy even though Life state owns `alive`. The
path is frozen as legacy behavior and must not be reused by ecology, lineage,
reproduction, settlement, or civilization systems.

### Derived gameplay to UI and persistence coupling

Existing path:

```text
skills and actions
-> baseStats.HP.cur/max
-> UI display
-> save mirror
```

HP is used as both an output of gameplay calculations and an input to display
and persistence. This branch may remain for backward compatibility but must not
be connected to the simulation Life model.

### Implicit unrelated-system reuse

HP currently acts as a proxy for:

- Injury
- Healing demand
- Survival/existence
- Player combat durability
- Skill-derived durability

These meanings are not equivalent. Containment forbids adding further proxy
meanings such as nutrition, disease, ecology fitness, reproductive eligibility,
settlement stability, or cultural pressure.

### Multiple representation coupling

Existing representations:

```text
agent.hp
agent.state.hp
baseStats.HP.cur
baseStats.HP.max
```

No synchronization or precedence rule is added in this phase. Attempting to
synchronize them now would change behavior and create new authority. They remain
separate frozen compatibility representations until migration.

## 3. Formal Containment Rules

### Rule A: Semantic freeze

```text
HP MUST NOT gain new semantic usage.
```

Forbidden examples:

- HP becomes disease severity.
- HP becomes biological Condition.
- MaxHP becomes biological Capacity.
- HP becomes reproductive eligibility.
- HP becomes ecology fitness.

### Rule B: Dependency freeze

```text
HP MUST NOT be introduced into new systems.
```

No new simulation, analysis, UI, persistence, derived, or documentation
contract may depend on HP as an input or output.

### Rule C: Decision isolation

```text
HP MUST NOT influence intent generation directly or indirectly beyond the
already-existing frozen healing-demand path.
```

The existing path is documented legacy debt, not permission for expansion.

Forbidden additions:

- HP score modifier
- HP resolution override
- HP-based action injection
- HP-based typology weighting
- New HP-derived demand signals

### Rule D: Backward compatibility only

```text
HP MUST remain a backward-compatible field only.
```

HP may be retained to preserve current saves, UI, tests, and outputs. It must
not be treated as the basis of future biological architecture.

### Rule E: No new writers

```text
No new module may write HP.
```

Existing writers are frozen until isolated or deprecated. Simulation HP writes,
if any are introduced during later migration, must require separate authority
review and Execution Layer ownership.

### Rule F: Snapshot-only observation

```text
Analysis and Derived layers may read HP only from immutable snapshots.
```

They must not retain live references, write HP, or feed HP-derived conclusions
back into simulation.

### Rule G: No compatibility feedback

```text
Future Capacity/Condition MUST NOT automatically write back to HP during this
containment phase.
```

Bidirectional compatibility would create a hidden feedback loop and a second
state authority.

## 4. Conceptual Adapter Boundary

`HPAdapter` is a future conceptual compatibility boundary. It is explicitly
non-implemented in this phase.

### Intended responsibilities

- Read existing HP from declared simulation compatibility state.
- Expose a read-only HP view for UI compatibility.
- Provide a persistence mirror boundary for legacy saves.
- Prevent raw HP from entering new Decision or Analysis logic.
- Provide an explicit translation boundary for a future Capacity/Condition
  migration.

### Non-responsibilities

`HPAdapter` must never:

- Own HP state
- Mutate HP without Execution authority
- Generate intents
- Modify scores
- Define injury, disease, death, Capacity, or Condition
- Synchronize all existing HP shapes automatically
- Write Capacity/Condition values
- Become a new runtime system

### Conceptual read-only shape

```ts
type LegacyHPView = {
  current?: number;
  maximum?: number;
  sourceKind: 'agent.hp' | 'state.hp' | 'baseStats.HP';
  compatibilityOnly: true;
};
```

### Conceptual direction

```text
Existing legacy HP source
-> HPAdapter read-only compatibility view
   -> UI mirror
   -> persistence mirror

HPAdapter -X-> intentPipeline
HPAdapter -X-> resolution
HPAdapter -X-> biological authority
HPAdapter -X-> live mutation
```

### Explicit phase constraint

The adapter must not be implemented during HP Containment Patch v1. Its design
exists only to define the future isolation boundary.

## 5. System Interaction Constraints

### tickManager / Simulation Authority

- May own HP mutation only where existing behavior already requires it.
- Must not introduce new HP mutations or semantic uses.
- Must not route HP into new causal systems.
- Must not treat HP as Life state authority.

### intentPipeline / Resolution

- Must not read HP.
- Must not receive HP-derived modifiers.
- Must not use HP for fallback, urgency, scoring, selection, or override.
- Must not read future HPAdapter output.

### Demand and derived causal logic

- Existing healing-demand derivation is frozen.
- No new HP-derived demand source may be added.
- Existing HP injury proxy must not be reused by other systems.

### Analysis and Derived systems

- May read HP only from immutable snapshots.
- Must not infer canonical biological truth from HP.
- Must not write HP or influence simulation using HP-derived reports.

### UI and Inspector

- Read-only for simulation HP.
- May display existing compatibility values.
- Must not compute new simulation semantics from HP.
- Must not write HP into simulation state.

### Persistence

- Mirror-only.
- Must preserve existing save compatibility.
- Must not transform HP semantics.
- Must not create new HP fields.

### Documentation and schemas

- Existing HP references may remain until migration.
- New architectural documents and schemas must not introduce HP as a new
  authority or recommended primitive.
- Any unavoidable HP mention must label it legacy compatibility state.

## 6. Migration Phases Roadmap

### Phase 1: Freeze HP semantics

- Declare HP legacy bound state.
- Prohibit new meanings and writers.
- Preserve current behavior.

### Phase 2: Stop HP expansion

- Reject new HP dependencies during review.
- Prevent HP from entering new systems, schemas, or contracts.
- Track the frozen dependency inventory.

### Phase 3: Isolate HP usage per layer

- Separate runtime reads, UI display, persistence mirrors, and derived legacy
  calculations behind explicit boundaries.
- Preserve exact outputs.

### Phase 4: Introduce Capacity/Condition in parallel

- Establish new canonical biological state independently.
- Do not automatically synchronize it with HP.
- Validate authority and determinism before translation.

### Phase 5: Deprecate HP usage gradually

- Retire HP consumers by role.
- Preserve compatibility for saves and UI only as long as required.
- Remove HP from causal decision paths before presentation paths.

### Phase 6: Remove HP

- Optional future step.
- Requires save migration, schema migration, test migration, documentation
  migration, and explicit compatibility retirement.

## 7. Risk Assessment Matrix

| Risk | Current Severity | Expansion Risk | Containment Rule |
| --- | --- | --- | --- |
| HP-derived healing demand affects intent context | High | High | Freeze path; prohibit new Decision influence |
| HP used as alive/population proxy | High | High | Prohibit reuse outside current runner |
| Skill-derived MaxHP treated as biological Capacity | High | High | Semantic freeze |
| Player HP embedded in save version 1 | High | Medium | Persistence mirror-only |
| HP exposed in Decision view | Medium | High | No new consumers |
| Multiple HP representations | High | High | No new shapes or synchronization |
| HP UI display | Low | Low | Read-only display |
| HP fixture/test assumptions | Medium | Medium | Freeze until migration |
| New docs reintroducing HP authority | Medium | High | Label legacy; reject new authority |
| Future adapter becoming a new authority | High | High | Adapter remains translation-only |

## 8. Enforcement Checklist

### New-code review

- Does the change introduce `hp`, `HP`, `maxHp`, `hpRestore`, or `hpAbove`?
- Does a new system read raw HP?
- Does a new module write HP?
- Does HP enter an intent, resolution, typology, demand, or execution input?
- Does HP gain a new semantic meaning?

Any yes answer requires rejection or a separately approved migration phase.

### Layer review

- Is UI reading HP only for display?
- Is persistence mirroring HP without interpretation?
- Are Analysis and Derived systems using immutable snapshots only?
- Is Simulation Authority the only possible writer?
- Is intentPipeline free of HP reads and HP-derived modifiers?

### Authority review

- Is HP being used as a proxy for `alive`, Condition, Capacity, disease, injury,
  nutrition, ecology, or reproduction?
- Has a mirrored HP value become a second source of truth?
- Has a compatibility helper gained mutation or decision authority?

### Determinism review

- Does enabling/disabling UI leave simulation outcomes unchanged?
- Does serialization leave live HP unchanged?
- Do Analysis and Derived reads leave source snapshots unchanged?
- Does removal of HP display or inspection leave simulation behavior unchanged?

### Documentation review

- Are new HP references clearly labeled legacy compatibility state?
- Does any new document recommend HP as a simulation primitive?
- Does any new schema grant HP new authority?

## Containment Verdict

The existing HP dependency surface is frozen as legacy compatibility debt.
Containment does not make current cross-layer uses correct; it prevents those
uses from multiplying before Capacity/Condition migration can establish a clean
biological authority model.

HP is confirmed as a legacy bound state and must be prevented from expanding across simulation layers.
