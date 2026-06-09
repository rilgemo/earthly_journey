# Life Model Semantic Refactor Audit v1

## Authority and Scope

This audit follows `AGENTS.md` as the sole authority. It reviews terminology
only. No runtime behavior, field names, tests, save formats, or schemas were
modified.

## Executive Finding

The current Life System is a deterministic temporal lifecycle kernel, but its
terminology is not yet ready for Earthly's future biological model.

The most important semantic conflict is:

```text
Current `lifeCondition` = alive/deceased classification
Future `condition`      = current sustainable biological state
```

These are different concepts. The current field should not become the future
biological Condition without an explicit migration.

The broader runtime also still uses `hp` as a physical-state authority. HP
appears in schemas, UI, demand calculation, population counting, tests, skills,
and architecture documents. This conflicts with the intended Capacity/Condition
model and is the largest semantic migration risk.

## Current Lifecycle Model

The Life System currently exists inside `src/simulation/tickManager.js`.

| Current Field | Current Meaning | Classification |
| --- | --- | --- |
| `agent.life.birthTick` | Tick inferred or recorded as temporal origin | Stable temporal fact |
| `agent.life.ageTicks` | Number of elapsed ticks since birth | Stable temporal fact |
| `agent.life.lifeStage` | `juvenile`, `adult`, or `elder` from age thresholds | Stable derived category |
| `agent.life.lifeCondition` | String label: `alive` or `deceased` | Semantic placeholder |
| `agent.life.alive` | Boolean existence status | Stable lifecycle fact |
| `agent.life.maxAgeTicks` | Hard lifespan threshold | Transitional policy field |
| `agent._pendingDeath` | Deferred end-of-tick removal marker | Stable execution mechanism |

Current death rule:

```text
ageTicks >= maxAgeTicks
-> alive = false
-> lifeCondition = deceased
-> _pendingDeath = true
-> final tick cleanup removes agent
```

This is deterministic and causally isolated, but it represents lifespan expiry,
not biological Condition collapse.

## Semantic Inconsistencies

### 1. `lifeCondition` is not biological Condition

`lifeCondition` currently duplicates the meaning of `alive` using string values.
It does not describe the current biological state and cannot represent injury,
disease, starvation, recovery, or environmental stress.

Future Condition must be able to vary while an agent remains alive.

### 2. `alive` and `lifeCondition` overlap

Current values:

```text
alive: true  <-> lifeCondition: "alive"
alive: false <-> lifeCondition: "deceased"
```

This creates two authorities for the same fact. The boolean is the clearer
existence-state authority. The string field is a placeholder that will conflict
with future Condition semantics.

### 3. `maxAgeTicks` currently acts as direct death authority

Age currently causes death at a fixed threshold. The proposed biological model
instead requires:

```text
Aging reduces Capacity.
Injury, disease, starvation, and stress reduce Condition.
Death emerges when Condition collapses.
```

`maxAgeTicks` can remain useful as a lifespan tendency, species profile, or
capacity-decay parameter, but it should not remain the final semantic definition
of death.

### 4. HP remains a competing biological model

HP terminology appears in:

- Runtime agent and entity schemas
- Demand injury calculation
- Scenario population counting
- Identity snapshots
- Player UI and data definitions
- Skill-derived stats
- Action requirements and restoration
- Tests
- AI execution and resolution documentation
- Core data-schema and agent-system documentation

HP currently behaves as a mixed concept:

- current physical state
- survival threshold
- injury proxy
- population-alive check
- skill-derived maximum
- action restoration target

This overlaps both future Capacity and future Condition and would create
competing biological authorities.

### 5. Documentation contains multiple lifecycle models

Current documentation describes:

- HP-based survival and restoration
- optional `age` and `lifeExpectancy`
- entity lifecycle states such as spawn/active/dormant/decay/death
- current tick-based `ageTicks` and `maxAgeTicks`

These concepts are individually usable, but they do not yet form one canonical
biological semantic model.

## Recommended Capacity/Condition Model

### Canonical meanings

```text
Age
= elapsed biological time.

Life Stage
= derived developmental category based on age and biological profile.

Capacity
= maximum sustainable biological state at the current time.

Condition
= current biological state, bounded by Capacity.

Alive
= existence-state fact.

Death
= lifecycle transition produced by Condition collapse.
```

Required invariant:

```text
0 <= condition <= capacity
```

Recommended causal relationship:

```text
Age -> Capacity trajectory

Injury
Disease
Starvation
Environmental stress
-> Condition changes

Condition collapse
-> Pending death
-> End-of-tick removal
-> Corpse artifact
```

## Semantic Mapping

| Current Field or Concept | Recommended Future Field or Concept | Meaning |
| --- | --- | --- |
| `birthTick` | `birthTick` | Temporal origin; retain |
| `ageTicks` | `ageTicks` | Elapsed biological time; retain |
| `lifeStage` | `lifeStage` | Derived developmental category; retain |
| `lifeCondition` | Do not directly reuse as `condition` | Current field is only a lifecycle-status label |
| `alive` | `alive` | Canonical existence-state fact; retain |
| `maxAgeTicks` | lifespan profile / capacity-decay parameter | Aging tendency, not direct death authority |
| `_pendingDeath` | `_pendingDeath` | Deferred execution marker; retain |
| `hp` current value | `condition` | Current biological state |
| `maxHp` / skill HP bonuses | Not automatically `capacity` | Biological Capacity should not be defined by RPG skill bonuses |
| `hpAbove` action requirement | condition threshold, if biologically relevant | Execution precondition |
| `hpRestore` | condition recovery effect | Recovery, not generic HP restoration |
| HP-derived injury metric | condition deficit | Difference between Capacity and Condition |
| `lifeExpectancy` | lifespan profile | Statistical/biological tendency |

## Field Ownership Recommendation

Future Life state should have one semantic authority:

```ts
life: {
  birthTick,
  ageTicks,
  lifeStage,
  capacity,
  condition,
  alive
}
```

Interpretation:

- `ageTicks` is temporal truth.
- `lifeStage` is derived from age and lifecycle profile.
- `capacity` is the current biological ceiling.
- `condition` is the current biological state.
- `alive` is the existence-state result.
- `_pendingDeath` remains an execution-only cleanup marker outside the
  descriptive Life state.

This is a semantic recommendation only. It is not a runtime migration plan.

## Future Compatibility Review

### Disease System

Compatible after Capacity/Condition separation.

Disease should primarily reduce Condition and may reduce Capacity when chronic.
The current binary `lifeCondition` cannot represent disease severity.

### Injury System

Compatible after HP authority is retired or explicitly translated.

Injury should reduce Condition, potentially impose temporary Capacity limits,
and never require a parallel HP authority.

### Ecology Layer

Compatible if ecology changes Condition or Capacity through Execution Layer
rules. Environmental state must not directly bypass tick authority.

### Reproduction

Age and Life Stage are suitable foundations. Reproduction will require lifecycle
eligibility and continuity rules, but should not redefine Condition.

### Life Continuity

`birthTick`, `ageTicks`, `alive`, deferred death, and corpse generation provide
a useful base. Condition-collapse death is still semantically missing.

### Lineage

Current Life fields do not conflict with lineage, but no ancestry, parentage,
generation, or inherited-profile semantics currently exist.

## Architecture Document Findings

### Vitality references

No active `vitality` references were found in the audited `AI/*.md` and
`docs/**/*.md` set.

### HP-like references

HP remains widely documented as:

- a skill-derived stat
- an action requirement
- a restorable action effect
- an NPC/player/enemy schema field
- a survival override input
- an execution validation input

These references are incompatible with a single-authority Capacity/Condition
model unless they are later reclassified or migrated.

### Lifespan-based death references

Documentation contains future `lifeExpectancy` concepts, while runtime currently
uses `maxAgeTicks` as direct death authority. No canonical document currently
defines death as Condition collapse.

## Migration Readiness Assessment

| Area | Readiness | Assessment |
| --- | --- | --- |
| Temporal age tracking | High | `birthTick` and `ageTicks` are suitable |
| Life-stage derivation | High | Current stages are simple but semantically sound |
| Existence status | High | `alive` and deferred death cleanup are suitable |
| Biological Condition | Low | Current `lifeCondition` is only a binary label |
| Biological Capacity | Missing | No canonical field or ownership model exists |
| Death semantics | Low | Currently age-threshold driven |
| HP retirement/migration | Low | HP is widely coupled across runtime and docs |
| Disease/Injury compatibility | Low | Requires Capacity/Condition authority first |
| Reproduction/Lineage compatibility | Partial | Temporal base exists; continuity semantics do not |

Overall semantic migration readiness: **Partial, with a clear target model but
significant HP authority debt.**

## Recommendations

These are recommendations only:

1. Reserve `condition` for numeric current biological state.
2. Reserve `capacity` for numeric maximum sustainable biological state.
3. Treat `alive` as the sole existence-state fact.
4. Treat `lifeCondition` as a transitional placeholder, not the future
   Condition field.
5. Treat age and lifespan as inputs to Capacity, not final death authority.
6. Define death canonically as Condition collapse before adding Disease,
   Injury, Nutrition, Ecology, Reproduction, or Lineage.
7. Resolve HP's ownership and migration semantics before introducing any new
   biological subsystem.

## Conclusion

The current Life System is a clean temporal substrate, but its semantic model is
incomplete.

Age, Life Stage, `alive`, deferred death, and corpse generation are good
foundations. `lifeCondition`, `maxAgeTicks`, and the broader HP model are not yet
compatible with Earthly's intended biological semantics.

The stable future model should be:

```text
Age shapes Capacity.
Events shape Condition.
Condition cannot exceed Capacity.
Death follows Condition collapse.
```
