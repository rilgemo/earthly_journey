# Life Continuity Causal Integration v1

## Authority and Scope

This document defines how birth, death, lineage, reproduction, and inheritance
may integrate with the existing `tickManager` and `simulateAgent` causal
structure.

It follows `AGENTS.md` as the sole authority.

This is a causal insertion and state-ownership contract only. It does not
modify runtime behavior, introduce a new authority layer, or define new
simulation mechanics.

## Core Constraint

Life Continuity must integrate through the existing causal order:

```text
Reality
-> Decision
-> Resolution
-> Execution
-> Trace
```

Only `tickManager`, acting as the existing Execution authority, may commit:

- births
- deaths
- population membership changes
- lineage facts
- inherited initial state

Life Continuity must not modify the internal causal ordering of
`simulateAgent`.

## Integration Model

Life Continuity is a split-phase responsibility inside the existing
`tickManager` boundary:

```text
Tick start
-> advance existing life state
-> mark pending deaths
-> run existing sequential simulateAgent loop unchanged
-> collect explicit reproduction outcomes
-> complete existing world phases
-> restore identity metadata
-> finalize deaths
-> commit births and initial inheritance
-> emit lifecycle traces
-> tick end
```

The exact ordering of birth commit relative to death cleanup must be fixed and
deterministic. The recommended boundary is:

```text
finalize deaths
-> commit births
```

This ensures newborn agents never participate in the tick that caused their
birth.

## Causal Insertion Points

### 1. Pre-Agent Life Advancement

Existing insertion point:

```text
world tick increment
-> runLifeKernel for every existing agent
-> identity-free tick preparation
-> demand calculation
-> agent loop
```

Owned effects:

- initialize missing life state
- increment age
- derive life stage
- update existence status
- mark `_pendingDeath`

Constraints:

- no reproduction occurs here
- no lineage is inferred here
- no inherited state is injected here
- no intent is generated here
- no agent is removed here

### 2. Existing Decision and Execution Path

Reproduction, if represented as agent behavior, must use the existing path:

```text
Perception
-> candidate intent
-> Resolution
-> validated Execution
-> explicit reproduction outcome/proposal
```

Constraints:

- Life Continuity must not inject reproduction intents
- Life Continuity must not force reproduction selection
- Life Continuity must not bypass action validation
- lineage, ancestry, or generation must not act as hidden scoring inputs
- `simulateAgent` ordering remains unchanged

Decision systems may only select from actions already supplied through the
existing action model. Execution may produce an explicit outcome, but must not
append a newborn directly to the live agent loop.

### 3. Reproduction Proposal Boundary

A successful reproduction execution may produce a deterministic, explicit
proposal owned by the current tick:

```text
ReproductionProposal
  parentIds
  originTick
  originLocation
  validatedOutcomeReference
  inheritanceSourceSnapshot
```

This is an execution output, not a new authority.

The proposal must be:

- explicit
- tick-scoped
- ordered deterministically
- traceable to a resolved and executed action
- unavailable as a hidden input to later decisions

The proposal must not:

- mutate population membership immediately
- create a newborn during `simulateAgent`
- modify another agent's decision state
- survive through an undeclared closure, cache, or module-global queue

### 4. End-of-Tick Death Commit

Existing insertion point:

```text
all agents finish
-> world phases finish
-> identity restoration
-> finalizePendingDeaths
-> corpse generation
```

Owned effects:

- remove agents marked `_pendingDeath`
- create corpse resources
- preserve deterministic removal ordering
- emit death lifecycle facts

Constraints:

- death remains mark-then-commit
- dead agents are not removed inside `simulateAgent`
- death cleanup must not rewrite prior decisions
- lineage facts survive parent death as historical simulation facts

### 5. End-of-Tick Birth Commit

Recommended insertion point:

```text
finalizePendingDeaths
-> deterministically validate pending reproduction proposals
-> materialize newborn agents
-> initialize life and lineage state
-> append newborns after the completed agent loop
-> emit birth lifecycle facts
```

Owned effects:

- create newborn agent state
- assign deterministic agent identity
- initialize `birthTick`, `ageTicks`, `lifeStage`, and `alive`
- materialize lineage links
- apply initial inherited state

Constraints:

- newborns do not act in their birth tick
- newborns do not affect demand, perception, ecology, or stability until the
  next tick
- birth commit cannot call `simulateAgent`
- birth commit cannot alter completed intent or execution outcomes

## State Ownership Contract

| State | Single writer | Readers | Forbidden writers |
| --- | --- | --- | --- |
| `agent.life` | `tickManager` Life execution boundary | Decision views only if explicitly allowed; traces and inspectors | Observation, UI, lineage analysis |
| `_pendingDeath` | `tickManager` Life execution boundary | End-of-tick cleanup and trace | Decision, observation, UI |
| live agent collection | `tickManager` population commit boundary | Reality/Decision snapshots and observation | `simulateAgent` helpers, observation, UI |
| reproduction proposals | Existing Execution path under `tickManager` | End-of-tick birth commit and trace | Decision, observation, UI |
| lineage facts | `tickManager` birth commit boundary | Simulation snapshots and observation | Culture, myth, inspector, decision scoring |
| inherited initial state | `tickManager` birth commit boundary | Future simulation systems | Observation and UI |
| lifecycle traces | Trace/Observation boundary | Analysis and inspector | Decision and Execution |

## Birth Ownership

Birth is a population mutation and therefore belongs exclusively to the
Execution Layer.

```text
validated reproduction outcome
-> explicit tick-owned proposal
-> deterministic end-of-tick birth commit
-> newborn exists next tick
```

Birth must never be:

- inferred by an observation system
- committed by a reproduction helper directly
- triggered by lineage metadata alone
- appended during iteration of the live agent collection

## Death Ownership

Death remains split-phase:

```text
Life advancement or valid execution outcome
-> `_pendingDeath`
-> agent completes the current established tick behavior
-> end-of-tick removal
-> corpse artifact
```

The current implementation marks age-based death before the agent loop and
removes pending agents after the loop. Future death causes must preserve the
same mark-then-commit ownership unless the architecture constitution is
explicitly revised.

## Reproduction Ownership

Reproduction has two distinct responsibilities:

### Decision Responsibility

The existing Decision Layer may score and select a reproduction action only as
an ordinary candidate action.

It may not:

- create agents
- write lineage
- apply inheritance
- guarantee reproductive success

### Execution Responsibility

The existing Execution Layer may validate the selected action and produce a
reproduction proposal.

Only the end-of-tick population commit may materialize the newborn.

## Lineage Ownership

Lineage is a simulation fact created at birth commit:

```text
childId
parentIds
birthTick
generation reference
```

Lineage is not:

- Identity authority
- Typology authority
- profession or role authority
- a hidden intent modifier
- an observation-derived rewrite

Observation systems may derive family histories or generational patterns from
lineage snapshots and lifecycle traces. They must not modify canonical lineage
facts.

Lineage may only influence future behavior if a future, explicitly authorized
causal rule consumes a declared simulation-state field through the normal
Decision path. No such influence is defined by this contract.

## Inheritance Ownership

Inheritance is a one-time deterministic state initialization performed during
birth commit.

It must use an explicit source snapshot captured by the validated execution
outcome or deterministically read at commit time under a documented rule.

Allowed conceptual flow:

```text
validated parent state
-> explicit inheritance source snapshot
-> deterministic inheritance transform
-> newborn initial state
```

Inheritance must not:

- mutate parent state
- copy runtime snapshots or inspector data
- copy observation outputs such as culture, myth, or civilization memory
- inject memories without an explicit causal transfer rule
- continue applying silently across future ticks
- act as a hidden scoring modifier

Inherited values become ordinary newborn-owned state after commit. There is no
continuing inheritance authority.

## Cross-Tick State Rule

No Life Continuity operation may rely on hidden cross-tick state.

Permitted persistent state:

- canonical agent life state
- canonical lineage facts
- explicit unresolved execution proposals, only if stored as declared
  simulation state with owner, origin tick, and deterministic resolution rule
- immutable lifecycle trace history for observation only

Forbidden persistent state:

- module-global pending birth arrays
- closure-held reproduction outcomes
- inspector-managed lifecycle state
- trace-derived values reused as decision inputs
- implicit parent references without stable identifiers
- inherited modifiers that are applied repeatedly without explicit state

Any proposal that crosses a tick boundary must become declared simulation state
owned by `tickManager`. Otherwise it must be resolved or discarded before the
current tick ends.

## Same-Tick Visibility Rules

| Effect | Visibility rule |
| --- | --- |
| Age and pending death | Visible from tick start according to the existing Life Kernel |
| Reproduction intent | Visible only through the acting agent's normal decision trace |
| Reproduction proposal | Execution output; must not affect later-agent decisions |
| Newborn agent | Not visible until the next tick |
| Lineage facts | Created with newborn at birth commit; visible next tick |
| Inherited initial state | Created with newborn; visible next tick |
| Death removal | Applied after all agents complete |
| Corpse resource | Created during final death cleanup |

The existing communication memory write remains the only confirmed immediate
cross-agent mutation channel inside `simulateAgent`. Life Continuity must not
create a second shortcut.

## Deterministic Ordering Rules

Life Continuity must preserve determinism by requiring:

1. Stable ordering of reproduction proposals.
2. Stable newborn identifier derivation.
3. Stable parent identifier ordering.
4. Stable inheritance transformation for identical inputs.
5. No wall-clock time, unordered iteration, or observation-derived input.
6. Birth commit only after the live agent loop completes.
7. Newborn participation beginning on the following tick.
8. Death cleanup and birth commit order fixed by contract.

## Causal Graph

```text
TICK START
  -> life advancement for existing agents
  -> pending-death marking
  -> existing demand and identity preparation
  -> sequential simulateAgent loop unchanged
       -> ordinary intent scoring and resolution
       -> validated reproduction execution, if selected
       -> explicit reproduction proposal
       -> no population mutation
  -> existing resource / field / emergence / stability phases
  -> identity restoration
  -> pending-death cleanup
       -> agent removal
       -> corpse artifact
  -> birth commit
       -> validate ordered proposals
       -> create newborn state
       -> materialize lineage facts
       -> apply one-time inheritance
       -> append newborn for next tick
  -> lifecycle trace
TICK END
```

## Forbidden Causal Edges

```text
Lineage -> forced intent
Inheritance -> repeated hidden modifier
Culture -> reproduction success
Myth -> lineage rewrite
Civilization Memory -> inherited state
Inspector -> birth/death mutation
Trace -> reproduction decision
Reproduction helper -> direct population append
Newborn -> same-tick perception or demand
Life Continuity -> simulateAgent reordering
```

## Validation Checklist

- [ ] `simulateAgent` internal order is unchanged.
- [ ] No newborn is appended during live agent iteration.
- [ ] All births trace to validated execution outcomes.
- [ ] Birth proposals are explicit and deterministically ordered.
- [ ] Birth commit occurs at one declared `tickManager` boundary.
- [ ] Newborns first participate on the next tick.
- [ ] Death remains mark-then-commit.
- [ ] Lineage has one writer and no observation-layer writer.
- [ ] Inheritance is one-time initialization, not continuing authority.
- [ ] No culture, myth, settlement, or trace output enters reproduction logic.
- [ ] No hidden queue or closure carries lifecycle state across ticks.
- [ ] Observation and inspector systems remain read-only.

## Final Contract

Life Continuity is not a new runtime authority layer.

It is a set of lifecycle responsibilities committed by the existing
`tickManager` Execution authority at declared causal boundaries:

```text
Life advancement before agent execution
Reproduction proposal through normal execution
Death cleanup after agent execution
Birth, lineage, and inheritance commit at tick end
```

This preserves the existing sequential `simulateAgent` causal structure while
making population continuity explicit, deterministic, and ownership-safe.
