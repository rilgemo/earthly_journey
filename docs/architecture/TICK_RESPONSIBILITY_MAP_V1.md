# Tick Responsibility Map v1

## Authority and Scope

This document follows `AGENTS.md` as the sole authority. It extracts the actual
responsibilities currently implemented in `src/simulation/tickManager.js`.

It is not a refactor plan. It introduces no systems and changes no runtime
behavior.

## Executive Classification

`tickManager.js` is currently a:

```text
Monolithic Simulation Kernel
+ deterministic temporal scheduler
+ single-writer execution authority
+ multi-domain orchestration boundary
+ trace emission hub
```

It coordinates Life, demand, cognition, action execution, internal agent
evolution, resource flow, field physics, coupled emergence, stability,
identity metadata, death cleanup, and trace collection within one tick.

## 1. Actual Tick Order

The implemented order is:

```text
1. Advance world tick
2. Run Life kernel for every agent
3. Remove identity metadata for identity-free decision views
4. Begin trace collection
5. Calculate and commit world demand
6. Simulate each agent
   a. memory initialization, learning, and decay
   b. perception, recall, and need evaluation
   c. influence-field construction
   d. action availability filtering
   e. intentPipeline execution and selection
   f. action execution and agent/world mutation
   g. action yield, memory, skill, knowledge, needs, and runtime snapshot updates
   h. record agent trace
7. Commit resource flow
8. Commit field dynamics
9. Run coupled emergence and queue future field perturbations
10. Run stability controller and commit gains/history
11. Restore derived identity metadata
12. Finalize pending deaths and create corpse resource entries
13. Attach Life trace
14. End trace collection
```

No subsystem has independent time authority.

## 2. Responsibility Domains

### 2.1 Time and Lifecycle Domain

Ownership:

```text
Hard-owned by tickManager / Execution Authority
```

Functions:

- `resolveLifeStage()`
- `createInitialLife()`
- `runLifeKernel()`
- `createCorpseResourceEntry()`
- `finalizePendingDeaths()`

Reads:

- `worldObj.tick`
- Existing `agent.life`
- Agent identity and location for corpse records

Writes:

- `worldObj.tick`
- `agent.life`
- `agent._pendingDeath`
- Agent-array membership during final cleanup
- `worldObj.resourceEntries`

Causal role:

- Advances temporal age.
- Defines lifecycle status.
- Marks death at tick start.
- Removes dead agents and creates corpse artifacts at tick end.

Actual coupling truth:

- The Life kernel has no dependency on intent, cognition, memory, resources, or
  environmental state.
- Life does not currently gate same-tick cognition or execution.
- Agents marked `_pendingDeath` still complete agent simulation during that tick
  and are removed only during final cleanup.

### 2.2 World Demand Domain

Ownership:

```text
Subsystem semantics owned by Demand; state commit owned by tickManager
```

Subsystem:

- `calculateWorldDemand()`

Reads:

- Current world
- Current agent collection
- Previous `worldObj.demandIndex`

Writes:

- `worldObj.demandIndex`
- `worldObj.demandHistory`
- Demand trace output

Causal role:

- Produces contextual pressure before agent cognition.
- Supplies `demandIndex` to intent scoring context.

Coupling:

- World and population state -> Demand -> agent intent context.
- Demand does not directly choose actions.

### 2.3 Agent Cognition Orchestration Domain

Ownership:

```text
tickManager orchestrates; external subsystems own decision semantics
```

Entry point:

- `simulateAgent()`

Subsystems and functions:

- `perceive()`
- `evaluateNeeds()`
- `recallMemories()`
- `createInfluenceField()`
- `getAvailableActions()`
- `filterRegisteredActions()`
- `intentPipeline.execute()`
- `buildAgentTypologySnapshot()`
- `createDecisionTrace()`

Reads:

- Approved agent state
- World field and recent events
- Nearby agents
- Memories and needs
- World demand index

Outputs:

- Candidate intents
- Final selected intent
- Decision and intent traces
- Typology snapshot

Causal role:

- Produces the selected behavioral decision.

Ownership boundary:

- Decision subsystems own calculation outputs only.
- `simulateAgent()` immediately crosses into execution after selection.
- Decision logic does not own live-state mutation authority.

### 2.4 Action Execution Domain

Ownership:

```text
Hard-owned by tickManager execution path
```

Functions:

- `applyActionEffects()`
- `updateManaAfterAction()`
- `queueFieldPerturbation()`
- `queueWorldFeedback()`
- communication transfer block inside `simulateAgent()`
- action-registry execution validation

Reads:

- Selected intent/action
- Perception field
- Nearby-agent references
- Registered action definitions

Writes:

- Agent stamina
- Agent mana current/stability
- World field perturbation queue
- Receiver memory during communication

Causal role:

- Converts selected intent into committed state mutation.

Boundary truth:

- This domain has execution authority but no action-selection authority.
- Communication execution directly mutates the receiver's memory within the
  same agent-simulation loop.

### 2.5 Agent Internal Evolution Domain

Ownership:

```text
Subsystem semantics are mixed; mutation is executed under tickManager
```

Subsystems:

- Memory initialization, decay, recall, and recording
- Knowledge learning
- Need evaluation and advancement
- Skill gain
- Runtime snapshot construction

Functions:

- `ensureMemory()`
- `learnKnowledgeFromMemories()`
- `decayAgentMemory()`
- `recordMemory()`
- `recordActionOutcome()`
- `applySkillGain()`
- `learnKnowledge()`
- `advanceNeeds()`
- `createRuntimeSnapshot()`

Writes:

- Agent memory
- Skills
- Knowledge
- Needs
- `npc.runtime`

Causal role:

- Evolves agent internal state before and after action execution.

Coupling truth:

- Memory and knowledge can change before intent generation.
- Action outcome, skill gain, explicit knowledge gain, and needs advancement
  occur after execution.
- `npc.runtime` is a mutable diagnostic/read-model cache stored on the live
  agent object.

### 2.6 Resource and Economic Flow Domain

Ownership:

```text
ResourceFlow owns transformation logic; tickManager owns commit
```

Subsystem:

- `runResourceFlowTick()`

Reads:

- Current resource map
- Baseline resource map
- Agent action-yield snapshots
- World and flow configuration

Writes:

- `worldObj.resourceBaselineMap` initialization
- `worldObj.resourceMap`
- `worldObj.lastResourceFlowTrace`

Causal role:

- Applies resource depletion, regeneration, and redistribution after all agent
  actions.

Coupling:

```text
Agent selected actions
-> action yield snapshots
-> resource flow
-> next-tick world/resource context
```

### 2.7 World Field Physics Domain

Ownership:

```text
Field subsystem owns physics calculations; tickManager owns commit
```

Functions and subsystems:

- `commitFieldDynamics()`
- `runFieldDynamicsTick()`
- `createFieldState()`

Reads:

- Field perturbation queue
- Area field states
- Field dynamics configuration
- Stability field gains

Writes:

- Area field states
- Clears `worldObj.fieldPerturbationQueue`
- `worldObj.lastFieldDynamicsTrace`

Causal role:

- Commits queued action/world feedback and passive field dynamics.

Coupling:

- Depends indirectly on agent actions through queued field perturbations.
- Depends on previous stability-controller gains.

### 2.8 Coupled Emergence Domain

Ownership:

```text
Emergence subsystem owns calculations; tickManager owns history and queue commit
```

Subsystem:

- `emergenceTickHook()`

Reads:

- Current agents
- Aggregate agent action/location log
- Previous emergence history
- Emergence configuration and stability gains

Writes:

- `worldObj.emergenceHistory`
- Queues field perturbations for later field-physics processing
- `worldObj.lastEmergenceTrace`

Causal role:

- Converts aggregate activity into future environmental perturbations.

Critical truth:

- Coupled Emergence is causal, not purely observational.
- Its perturbations are queued after the current field-dynamics commit and
  therefore normally affect a subsequent tick.

### 2.9 Stability Regulation Domain

Ownership:

```text
Stability subsystem owns adjustment logic; tickManager owns commit
```

Subsystem:

- `runStabilityController()`

Reads:

- Current field-dynamics trace
- Current emergence trace
- Current agents
- Aggregate action/location log
- Current stability gains

Writes:

- `worldObj.stabilityGains`
- `worldObj.lastStabilityTrace`
- Bounded `worldObj.stabilityHistory`

Causal role:

- Adjusts parameters that influence later field and emergence behavior.

Critical truth:

- Stability is a causal feedback controller, not an Observation Layer system.
- It reads traces as causal measurement inputs and commits future control gains.

### 2.10 Identity Drift and Continuity Hook Domain

Ownership:

```text
Identity subsystem owns derivation semantics; tickManager owns hook timing
```

Functions:

- `beginIdentityFreeTick()`
- `createIdentityFreeDecisionView()`
- `applyPostTickIdentity()`

Reads:

- Skills
- Traits
- Knowledge
- Social memory
- Previous identities

Writes:

- Temporarily deletes `agent.identities`
- Restores derived immutable identity metadata
- Updates identity-change trace/runtime metadata

Causal role:

- Prevents derived identity from influencing decisions.
- Derives identity only after causal execution.

Boundary truth:

- Identity metadata is derived and non-authoritative.
- The hook mutates agent metadata but must not define lineage, profession, role,
  or behavior.

### 2.11 Observation and Trace Domain

Ownership:

```text
TraceCollector owns trace semantics; tickManager owns emission timing
```

Trace outputs:

- Demand snapshot
- Agent traces
- Decision/intent traces
- Action-yield snapshots
- Resource-flow trace
- Field-dynamics trace
- Coupled-emergence trace
- Stability trace
- Life trace and corpse entries

Writes:

- `traceCollector.current` and collector history through collector APIs
- `npc.runtime` diagnostic snapshot
- `worldObj.last*Trace` diagnostic fields

Causal role:

- Primarily records and exposes execution history.

Boundary truth:

- TraceCollector does not feed decisions or execution in the current tick path.
- tickManager directly attaches several subsystem traces to
  `traceCollector.current`.
- `worldObj.lastFieldDynamicsTrace`, `lastEmergenceTrace`,
  `lastStabilityTrace`, and stability gains are not all purely observational:
  stability and emergence traces are inputs to causal regulation.

## 3. Ownership Boundary Map

| Domain | Semantic Owner | Commit Authority | Primary Output |
| --- | --- | --- | --- |
| Time/Life | tickManager-local Life kernel | tickManager | Life state, removal, corpse |
| Demand | Demand subsystem | tickManager | Demand index/history |
| Cognition | Decision subsystems | Output only | Intent and selection |
| Action execution | Execution helpers | tickManager | Agent/world mutation |
| Agent internal evolution | Memory/Need/Skill/Knowledge systems | tickManager path | Internal agent state |
| Resource flow | ResourceFlow subsystem | tickManager | Resource map |
| Field physics | ElementalField subsystem | tickManager | Area fields |
| Coupled emergence | CoupledEmergence subsystem | tickManager | History and queued perturbations |
| Stability | Stability subsystem | tickManager | Future control gains |
| Identity | Identity subsystem | tickManager hook | Derived metadata |
| Trace | TraceCollector and trace builders | Output only | Historical/debug artifacts |

## 4. Causal Authority Zones

### Hard mutation authority

- World tick advancement
- Life-state mutation
- Pending-death cleanup
- Corpse resource creation
- Action effects
- Communication memory transfer
- World demand commit
- Resource-map commit
- Field-state commit
- Emergence history and perturbation queue
- Stability gains/history
- Agent memory, needs, skill, knowledge, and identity metadata updates

All occur inside tickManager's execution boundary.

### Decision-output authority

- Perception view
- Intent scoring/enrichment
- Intent resolution
- Typology weighting

These produce outputs but do not own live-state mutation.

### Observation-output authority

- Decision traces
- Intent traces
- Agent traces
- Life traces
- Collector history
- Runtime diagnostic snapshots

These describe execution and must not become reverse causal inputs unless
explicitly classified as causal-controller measurements.

## 5. Implicit Coupling Clusters

### High Coupling Zone A: `simulateAgent()`

`simulateAgent()` combines:

```text
memory/knowledge preprocessing
-> perception and decision
-> action execution
-> communication mutation
-> action yield
-> memory/skill/knowledge reinforcement
-> need advancement
-> diagnostic trace construction
```

It is the densest cognition-to-execution boundary in the file.

### High Coupling Zone B: Agent Action to Ecology Feedback

```text
field perception
-> influence field
-> intent selection
-> action effects / yield
-> field perturbation and resource flow
-> future perception context
```

This is an intentional emergent causal loop across ticks.

### High Coupling Zone C: Stability Feedback

```text
field dynamics + emergence + aggregate actions
-> stability metrics
-> stability gains
-> future field/emergence behavior
```

The controller consumes execution measurements and changes future system
parameters.

### High Coupling Zone D: Internal Reinforcement

```text
selected action
-> outcome memory
-> skill gain / knowledge
-> future decision inputs
```

Behavior reinforcement is embedded in the action-execution path.

### Medium Coupling Zones

- Needs -> influence field -> intent scoring
- Demand -> intent scoring context
- Action yield -> resource flow
- Agent aggregate activity -> coupled emergence
- Field dynamics and emergence -> stability controller
- Identity-free pre-hook -> Decision view -> post-tick identity derivation

### Low Reverse-Coupling Zones

- TraceCollector history
- Decision trace output
- Intent trace output
- Life trace attachment
- Corpse trace attachment

These are downstream in current implementation and do not feed back into intent
or execution.

## 6. Structural Corrections to Common Assumptions

### Life does not currently gate same-tick execution

`runLifeKernel()` marks `_pendingDeath`, but every agent is still passed to
`simulateAgent()` before `finalizePendingDeaths()` removes it.

### World physics is not independent of agents

Resource flow consumes action-yield snapshots, field dynamics consumes
action-generated perturbations, and coupled emergence consumes aggregate action
logs.

### Observation and causal control are adjacent but distinct

TraceCollector is observational. Stability and Coupled Emergence are causal
feedback systems even though they consume trace-like measurements and emit
trace artifacts.

### Runtime snapshots are live-agent mutations

`createRuntimeSnapshot()` writes `npc.runtime`. Its content is diagnostic, but
the storage location is the live agent object.

### Identity hooks perform metadata mutation

Identity remains derived and non-causal, but the implementation deletes and
reinstalls identity metadata around decision execution.

## 7. Hidden System Roles

tickManager currently acts as:

- Single-writer world-state authority
- Temporal scheduler
- Lifecycle coordinator
- Demand scheduler
- Decision-to-execution bridge
- Agent-internal evolution coordinator
- Resource and field physics coordinator
- Emergent feedback coordinator
- Stability-control coordinator
- Identity boundary enforcer
- Trace emission hub

## 8. Key Architectural Truths

### Truth 1

tickManager is not a simple loop controller. It is the unified execution kernel
for several causal domains.

### Truth 2

The Life System is embedded as local tickManager functions and has no
independent module or time authority.

### Truth 3

Cognition and ecology are indirectly but intentionally coupled through action
effects, action yield, resource flow, field perturbations, emergence, and future
perception.

### Truth 4

Decision calculation is externally owned, but decision orchestration and action
execution are colocated inside `simulateAgent()`.

### Truth 5

Observation output is mostly downstream, but trace-like measurements also feed
causal Stability and Emergence controllers. Classification must follow use, not
data shape.

### Truth 6

No subsystem advances time independently. All domain progression is scheduled
inside one deterministic tick boundary.

## 9. Non-Action Statement

This map:

- Does not propose extraction or refactoring.
- Does not recommend new modules.
- Does not alter authority.
- Does not change runtime, schemas, saves, tests, or outputs.
- Records current structural truth only.

## Final Statement

tickManager is a unified execution kernel coordinating Life + Cognition + Ecology + Physics + Meta-Observation within a single deterministic tick boundary.
