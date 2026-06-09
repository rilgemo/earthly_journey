# Cross-Layer Dependency Graph v1

## Authority and Scope

This audit follows `AGENTS.md` as the sole authority.

It maps the implemented Earthly dependency graph across:

- read dependencies
- write dependencies
- same-tick visibility
- cross-tick propagation
- hidden coupling edges

This is a read-only causal audit. No runtime behavior, schema, test, or
simulation logic was modified.

## Executive Summary

Earthly currently operates as a single-writer sequential simulation kernel:

```text
Reality inputs
-> Decision derivation
-> Resolution
-> Execution mutation
-> Trace and observation
```

`tickManager` is the effective mutation authority.

The graph is mostly causally one-directional, with four important forms of
coupling:

1. **Immediate same-tick cross-agent coupling**
   through communication writing receiver memory.
2. **Deferred world coupling**
   through action-yield snapshots and field perturbation queues.
3. **Cross-tick control feedback**
   through emergence history and stability gains.
4. **Stateful observation**
   through `TraceCollector`, which maintains histories and derived snapshots
   but currently has no return edge into Decision or Execution.

No implemented Observation -> Decision or Observation -> Execution edge was
found.

## Layer Inventory

### Reality Layer

Implemented responsibilities:

- resource geography and resource maps
- elemental field state
- world demand
- action-yield context
- resource flow
- biological Condition/Capacity state

Primary state:

- `worldObj.areas[*].field`
- `worldObj.resourceMap`
- `worldObj.demandIndex`
- `agent.biology`
- agent location and environmental context

### Decision Layer

Implemented responsibilities:

- perception assembly
- memory recall inputs
- needs evaluation
- influence-field derivation
- action availability
- intent scoring
- typology weighting
- final intent selection

Primary outputs:

- scored intents
- enriched intents
- selected intent
- decision and intent traces

### Execution Layer

Implemented responsibilities:

- tick scheduling
- Life Kernel mutation
- action validation
- action effects
- communication memory transfer
- learning and need progression
- world phase commits
- identity snapshot lifecycle
- death cleanup and corpse generation

Primary writer:

- `tickManager`

### Observation Layer

Implemented responsibilities:

- agent traces and runtime snapshots
- behavioral signatures
- settlement emergence
- migration pressure snapshots
- resource exchange snapshots
- culture emergence
- civilization memory
- civilization myth
- replay and reporting
- semantic and causal audits
- inspector presentation

Observation systems may contain internal state, but no observation output is
currently consumed by intent scoring, resolution, or execution.

## Top-Level Dependency Graph

```text
AGENT + WORLD STATE
  |
  +-> Life Kernel ------------------------------+
  |      writes life / biology normalization    |
  |                                             v
  +-> Demand Calculation -> demandIndex -> Intent Scoring
  |
  +-> Perception ---------------------+
  +-> Memory / Needs / Skills --------+-> Intent Pipeline
  +-> Typology -----------------------+       |
  +-> Influence Field ----------------+       v
  |                                      Resolution
  |                                           |
  |                                           v
  |                                      Selected Action
  |                                           |
  |                                           v
  +-------------------------------------- Execution
                                              |
                 +----------------------------+-------------------------+
                 |                            |                         |
                 v                            v                         v
        Agent local mutation       Receiver memory mutation     Deferred world inputs
        memory/skills/needs        same-tick conditional        yields/field queue
                 |                            |                         |
                 +-> future tick              +-> later agent          v
                                                              Resource/Field Commit
                                                                      |
                                                                      v
                                                        Emergence + Stability Feedback
                                                                      |
                                                                      v
                                                                  future tick

Execution outputs -> TraceCollector -> Derived observation -> Inspector/Reports
                                      -X-> Decision
                                      -X-> Execution
```

## Authority and Dependency Matrix

| System | Reads | Writes | Consumers | Visibility |
| --- | --- | --- | --- | --- |
| Life Kernel | prior life, biology, tick | `agent.life`, `agent.biology`, `_pendingDeath` | agent loop, trace, cleanup | Before all agents |
| Demand | world, agents, previous demand | `world.demandIndex`, `demandHistory` through tickManager | intent scorer, trace | Fixed for current agent loop |
| Perception | committed fields/events, live agent list | none | intent context, trace | Current mini-tick |
| Memory learning/decay | agent memory/knowledge | agent memory/knowledge | current scoring and future ticks | Immediate self |
| Needs evaluation | needs, mana | none | influence and scoring | Current mini-tick |
| Influence field | field, recalled memory, needs | none | intent scorer | Current mini-tick |
| Typology | agent type/profile, demand/needs context | none | intent scorer and trace | Current mini-tick |
| Intent scorer | agent/action/context | none | enrichment/resolution | Current mini-tick |
| Intent enrichment | scored intents/actions | none | resolution/trace | Current mini-tick |
| Resolution | enriched intents | none | execution | Current mini-tick |
| Action execution | selected action, agent, field | stamina, mana, field queue | yield, later world commit | Immediate self / deferred world |
| Communication | source/receiver memory/trust | receiver memory | later receiver cognition | Immediate cross-agent |
| Action yield | action, resource map, field, action history | none | resource flow | Deferred post-agent |
| Skill/knowledge gain | action, traits, skills, knowledge | skills/knowledge | future decisions | Immediate write, future effect |
| Need advancement | current needs/mana | needs | future decisions | Immediate write, future effect |
| Resource flow | resource map, yields, baseline | `world.resourceMap`, resource trace | future yield context, observation | Post-agent commit |
| Field dynamics | committed fields, perturbation queue, gains | area fields, queue reset, trace | future perception, emergence/stability | Post-agent commit |
| Coupled emergence | agent log, agents, history, gains | emergence history and queued perturbations through tickManager | future field dynamics, stability | Post-agent / cross-tick |
| Stability controller | field/emergence traces, agents, prior gains | `world.stabilityGains`, history | future field/emergence phases | Cross-tick |
| Identity lifecycle | skills, traits, knowledge, memory | agent identity metadata | future snapshots/observation | End-of-tick |
| Death cleanup | `_pendingDeath`, agent list | population list, corpse resources | future world and observation | End-of-tick |
| TraceCollector | world snapshots, agent traces, demand | internal traces, behavior, settlement, pressure, exchange state | inspector, replay, reports | Observation only |
| Culture | traces, settlement snapshots, context | derived culture result only | inspector/future analysis | Downstream only |
| Civilization Memory | culture/behavior/demand histories | derived memory graph only | myth/inspector | Downstream only |
| Civilization Myth | civilization memory | derived myth graph only | inspector | Downstream only |
| Inspector | immutable/derived snapshots | UI state only | user | Presentation only |

## Same-Tick Visibility Graph

### Population-Wide Pre-Loop Writes

```text
tick increment
-> Life Kernel for all agents
-> identity removal for all agents
-> demand calculation and commit
-> sequential agent loop
```

These writes are visible to every agent in the current tick.

### Per-Agent Sequential Mini-Tick

```text
pre-decision self mutation
-> perception and recall
-> intent scoring and resolution
-> execution
-> post-action self mutation
-> next agent
```

Pre-decision memory and knowledge mutations affect the current agent's
decision. Post-action memory, skills, knowledge, and needs affect future
decisions.

### Immediate Cross-Agent Edge

```text
Agent A communication action
-> recordMemory(Agent B)
-> Agent B pre-decision learning/decay/recall
-> Agent B intent scoring
```

This edge exists only when Agent B appears later in iteration order.

It is the only confirmed direct same-tick cross-agent mutation edge.

### Shared but Not Same-Tick Causal

The following writes occur during the agent loop but do not affect later-agent
decisions:

- field perturbation queue
- action-yield snapshots
- current agent runtime snapshot
- current agent skill/need/outcome changes

Later-agent perception reads committed field state, not the perturbation queue.
Nearby-agent perception exposes only identity and location.

## Deferred Post-Agent Graph

```text
all selected actions
-> action-yield snapshots
-> resource flow
-> committed resource map
-> future action-yield context

all queued field perturbations
-> field dynamics
-> committed area fields
-> future perception

agent action log + agents + emergence history
-> coupled emergence proposals
-> queued field perturbations
-> next tick field dynamics
```

Resource and field effects are deliberately deferred until every agent has
completed its mini-tick.

## Cross-Tick Propagation Graph

### Agent Internal Feedback

```text
selected action
-> outcome memory bias
-> skill gain
-> knowledge gain
-> need advancement
-> next tick decision inputs
```

### Demand Feedback

```text
world/agent state + previous demand
-> next tick demand calculation
-> demandIndex
-> intent attractiveness
```

Current-tick actions do not directly rewrite the current demand index.

### Field and Resource Feedback

```text
action
-> deferred field/resource commit
-> next tick reality inputs
-> next tick perception and yields
-> future actions
```

### Emergence and Stability Feedback

```text
agent logs + committed field dynamics
-> emergence history / perturbations
-> stability metrics
-> adjusted stability gains
-> next tick field and emergence parameters
```

This is a real causal control loop across ticks.

It is not an Observation Layer loop, despite producing trace-like logs. Its
outputs alter future simulation parameters and therefore belong to the causal
Execution/Reality control boundary.

### Life Continuity Feedback

```text
biology condition dimensions
-> Life Kernel life-support evaluation
-> pending-death mark
-> end-of-tick removal
-> next tick population and demand
```

## Observation Dependency Graph

```text
tickManager
-> agent traces
-> TraceCollector.recordAgent
-> BehaviorTraceRecorder
-> behavioral signatures

tick trace + behavioral signatures
-> SettlementDetector
-> settlement snapshot

tick trace + settlements + behavioral signatures
-> migration pressure snapshot

tick trace + behavioral signatures + reciprocity state
-> exchange events
-> exchange snapshot

trace histories + settlement snapshots
-> culture
-> civilization memory
-> civilization myth

world/trace/replay snapshots
-> inspector panels
```

No return edge from these observation outputs into Decision or Execution was
found.

## Stateful Observation Boundaries

`TraceCollector` is stateful:

- trace history
- behavior history
- settlement detector state
- reciprocity state

This state is internal observation state. It is written during trace
collection, but no causal runtime module reads it as a decision or execution
input.

The stateful nature is therefore not itself a causal violation.

Risk condition:

```text
TraceCollector-derived settlement / pressure / exchange output
-> future scoring, resolution, or execution
```

No such edge currently exists.

## Static Import Graph Versus Causal Graph

Not every import is a causal dependency.

Examples:

- Inspector `ActionPanel` imports action profiles for display. This is
  Simulation -> Presentation static access, not Presentation -> Simulation
  influence.
- Semantic audit imports the action registry to compare terminology. This is
  read-only observation.
- `inspectorStream` imports `tickManager` to operate a separate inspector-owned
  simulation instance. It does not inject inspector values into an existing
  runtime tick.
- Observation modules live under `src/simulation`, but their causal role is
  defined by read/write behavior, not directory placement.

## Hidden Coupling Edges

### 1. Agent Iteration Order

Communication memory transfer makes agent array order behavior-significant.

```text
same initial state + different agent order
-> different same-tick memory availability
-> potentially different later-agent decisions
```

### 2. Shallow Decision View

The identity-free decision view contains shallow references to mutable nested
agent state. Pre-decision knowledge and memory mutations are visible through
that view.

### 3. Live Perception References

`perception.self.mana` and `perception.self.needs` retain live references.
Later mutations can change the values visible in the returned trace even
though scoring already completed.

This is observation-semantic drift, not a reverse causal edge.

### 4. Demand to Decision Coupling

Demand belongs to Reality context but contributes to intent scores.

This is explicitly allowed by `AGENTS.md` as action attractiveness pressure,
provided it never injects or forces an action.

### 5. Typology to Decision Coupling

Typology contributes a score modifier and is therefore a declared Decision
dependency. It currently has no write or execution authority.

### 6. Emergence Naming Ambiguity

`coupledEmergence` is causal because it queues future field perturbations.

It must not be confused with descriptive emergence systems such as settlement,
culture, civilization memory, or myth.

### 7. Runtime Snapshot on Agent State

`npc.runtime` is written by execution for inspector consumption. No Decision
reader was found.

Because it is stored on the live agent object, it remains a latent coupling
surface. Any future Decision read from `npc.runtime` would create an
Observation -> Decision violation.

### 8. Non-Deterministic Observation Timestamp

`TraceCollector.beginTick` uses `Date.now()` for trace timestamps.

This does not alter simulation output, but trace payloads are not fully
bit-identical across runs unless timestamp fields are excluded or controlled.

## Boundary Findings

### Confirmed Compliant

- Decision pipeline produces derived intents without world mutation.
- Resolution selects only from supplied intents.
- Action and world mutation remain coordinated by `tickManager`.
- Observation systems do not feed Decision or Execution.
- Inspector panels consume derived data only.
- Culture, Civilization Memory, and Myth are downstream-only.
- Settlement and migration pressure remain derived TraceCollector outputs.

### Causal but Constitution-Compatible

- Demand influences action attractiveness.
- Typology influences scoring.
- Communication writes receiver memory during the same tick.
- Coupled emergence and stability modify future simulation parameters.
- Life state determines pending death and future population.

### Latent Risks

- `npc.runtime` shares the live agent object with causal state.
- trace fields may contain live nested references.
- iteration order is a hidden behavioral input.
- directory naming obscures whether an emergence module is causal or
  observational.
- TraceCollector state could become causal if reused by Decision or Execution.

## Layer-to-Layer Edge Summary

| From | To | Edge type | Status |
| --- | --- | --- | --- |
| Reality | Decision | field/resource/demand reads | Allowed |
| Decision | Execution | selected intent | Required |
| Execution | Reality | committed mutations | Required |
| Execution | Decision of later agent | communication memory write | Same-tick hard coupling |
| Execution | Future Decision | memory/skills/needs/world updates | Cross-tick feedback |
| Execution | Observation | traces/snapshots | Required downstream |
| Observation | Observation | culture/memory/myth compression | Allowed downstream |
| Observation | Decision | none found | Invariant confirmed |
| Observation | Execution | none found | Invariant confirmed |
| Presentation | Simulation | none found | Invariant confirmed |

## Causal Closure Verdict

The implemented Earthly system currently satisfies Observation Layer causal
closure:

```text
Observation -X-> Decision
Observation -X-> Execution
Observation -X-> World mutation
```

The simulation is not globally phase-isolated because sequential agent
execution permits immediate communication memory transfer. This is a declared
causal interaction, not an Observation Layer leak.

## Final Dependency Graph Statement

Earthly is a deterministic single-writer simulation with:

- contextual Reality -> Decision reads
- pure Decision derivation and resolution
- sequential Execution authority
- one immediate cross-agent memory channel
- deferred world commits
- explicit cross-tick control feedback
- downstream stateful observation without causal return edges

The most important preservation rule is:

```text
Never allow trace, settlement, migration pressure, exchange, culture,
civilization memory, myth, inspector, or audit outputs to become Decision or
Execution inputs.
```
