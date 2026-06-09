# Tick Decomposition Audit v1

## Authority and Scope

This audit follows `AGENTS.md` as the sole authority. It evaluates whether the
current `tickManager` can be decomposed into separable phases without changing
determinism, causality, state ownership, or subsystem invariants.

It does not modify runtime, propose a refactor implementation, introduce new
systems, or change execution order.

## Executive Verdict

```text
Overall feasibility: PARTIAL DECOMPOSITION ONLY
```

The current tick has recognizable phase boundaries, but several boundaries are
not safely executable as independent phases.

The strongest blocker is the sequential per-agent mini-tick:

```text
for each agent:
  cognition
  -> selection
  -> execution
  -> reinforcement
```

Splitting this into:

```text
all-agent cognition
-> all-agent execution
```

would change same-tick visibility, communication effects, mutation timing, and
possibly action selection. That would violate the audit constraints.

## 1. Decomposition Hypothesis

Proposed conceptual phases:

1. Life Phase
2. Cognition Phase
3. Action Execution Phase
4. Ecology / World Physics Phase
5. Stability & Emergence Phase
6. Observation / Trace Phase

These are useful analytical labels. They are not all currently separable
execution units.

## 2. Current Tick Execution Ground Truth

Actual order:

```text
1. Increment world tick
2. Run Life kernel for all agents
3. Remove derived identity metadata
4. Begin TraceCollector tick
5. Calculate and commit demand
6. Sequentially simulate each agent
   a. mutate memory/knowledge through initialization, learning, and decay
   b. perceive current world and nearby agents
   c. evaluate needs and recall memory
   d. build influence field
   e. generate and resolve intents
   f. execute selected action
   g. mutate communication target when applicable
   h. calculate action yield
   i. mutate memory, skills, knowledge, needs, and runtime diagnostics
   j. append agent trace
7. Commit resource flow from all action-yield snapshots
8. Commit field dynamics from queued perturbations
9. Run coupled emergence and queue future perturbations
10. Run stability controller and commit future gains
11. Restore derived identity metadata
12. Finalize pending deaths and create corpse resources
13. Attach Life trace
14. End TraceCollector tick
```

## 3. Structural Observations

### 3.1 Life is split-phase

Pre-execution:

- Age progression
- Life-stage resolution
- Alive-state calculation
- Pending-death marking

Post-execution:

- Pending-death removal
- Corpse resource creation
- Life trace completion

Critical fact:

Agents marked pending death still complete cognition and execution during the
same tick.

Implication:

Life can be described as a phase domain, but it cannot be represented as one
atomic contiguous phase without changing current behavior.

### 3.2 Cognition and execution are fused inside `simulateAgent()`

`simulateAgent()` contains:

- Pre-decision memory and knowledge mutation
- Perception
- Needs and influence calculation
- Intent generation and resolution
- Action execution
- Communication mutation
- Post-action reinforcement and need advancement
- Diagnostic trace construction

Implication:

Cognition and execution are conceptually distinct but operationally fused.
Separating them requires preserving every intermediate input and mutation timing.

### 3.3 Agent processing is sequential, not batch-isolated

The loop executes one complete `simulateAgent()` call before moving to the next
agent.

Potential same-tick visibility:

- Communication may mutate another agent's memory before that agent's turn.
- Agent state mutations occur before later agents perceive the world/nearby
  agents.
- Field perturbations are queued during earlier actions, although field physics
  commits later.

Implication:

Agent order is part of current deterministic behavior. Batch-phase
decomposition would not preserve semantics automatically.

### 3.4 Ecology depends on execution outputs

Resource flow consumes action-yield snapshots generated during agent execution.
Field dynamics consumes queued field perturbations generated during execution
and carried from previous emergence output.

Implication:

Ecology must remain downstream of agent execution unless equivalent immutable
execution artifacts are guaranteed.

### 3.5 Emergence and Stability form causal feedback

Coupled Emergence:

- Reads agent action/location aggregates.
- Writes emergence history.
- Queues field perturbations for a later physics commit.

Stability:

- Reads current field-dynamics and emergence traces.
- Writes gains that influence future physics and emergence.

Implication:

These are causal controller phases, not passive observation phases. Their order
and next-tick effects are invariant-sensitive.

### 3.6 Observation is interleaved

TraceCollector:

- Begins before demand calculation.
- Receives demand during the tick.
- Receives each agent trace immediately after each agent mini-tick.
- Receives resource, field, emergence, stability, and life data later.
- Finalizes at tick end.

Additional diagnostics are written directly to:

- `npc.runtime`
- `worldObj.lastResourceFlowTrace`
- `worldObj.lastFieldDynamicsTrace`
- `worldObj.lastEmergenceTrace`
- `worldObj.lastStabilityTrace`

Implication:

Observation can be conceptually downstream, but current trace assembly is
stateful and interleaved. It is not a pure terminal phase.

### 3.7 Identity is also split-phase

Pre-decision:

- Existing derived identities are removed.

Post-execution:

- Derived identities are recalculated and installed.

Implication:

Identity boundary enforcement must bracket cognition/execution. It cannot be
moved wholly into a final derived-state phase without changing decision inputs.

## 4. Phase Feasibility Matrix

| Proposed Phase | Feasibility | Current Boundary Quality | Primary Constraint |
| --- | --- | --- | --- |
| Life | High conceptually, split required | Clear local functions | Pre-mark and post-cleanup must remain separated |
| Cognition | Low to Medium | Embedded in `simulateAgent()` | Pre-decision mutations and sequential agent visibility |
| Action Execution | Medium | Embedded in `simulateAgent()` | Side effects occur immediately after selection |
| Ecology / World Physics | High | Already subsystem-oriented | Must remain after action outputs; perturbation timing matters |
| Stability & Emergence | High with strict order | Clear subsystem calls | Closed-loop feedback affects later ticks |
| Observation / Trace | Low as pure terminal phase | Interleaved and stateful | Collector lifecycle and direct trace attachment |

## 5. Detailed Feasibility Analysis

### 5.1 Life Phase

Feasibility:

```text
HIGH, but only as a split lifecycle bracket
```

Safely identifiable boundaries:

- Pre-agent Life update
- Post-agent death cleanup

Invariant requirements:

- Preserve age update before demand and cognition.
- Preserve pending-death agents' final same-tick execution.
- Preserve removal after identity post-processing.
- Preserve corpse creation before trace finalization.

Unsafe simplification:

- Removing pending-death agents before cognition.
- Treating Life as one atomic phase.

### 5.2 Cognition Phase

Feasibility:

```text
LOW to MEDIUM
```

Conceptually separable calculations:

- Perception
- Need evaluation
- Influence calculation
- Intent generation and resolution

Blocking couplings:

- Memory initialization, learning, and decay mutate state before cognition.
- Decision views are created after identity removal.
- Cognition uses current world and agent state at each sequential turn.
- Output is immediately consumed by execution.

Invariant risk:

A global cognition batch would give all agents a common pre-execution snapshot,
which differs from current sequential mini-tick semantics.

### 5.3 Action Execution Phase

Feasibility:

```text
MEDIUM, only if per-agent ordering is preserved
```

Conceptually separable effects:

- Action validation
- Stamina/mana mutation
- Communication transfer
- Field perturbation queueing
- Action-yield generation
- Outcome memory and skill/knowledge reinforcement

Blocking couplings:

- Execution is inside `simulateAgent()`.
- Communication mutates another agent immediately.
- Reinforcement and needs advance before the next agent turn.
- Execution artifacts are assembled alongside traces.

Invariant risk:

Deferring all action execution until after all cognition changes same-tick
communication and agent-order effects.

### 5.4 Ecology / World Physics Phase

Feasibility:

```text
HIGH, with strict input and ordering contracts
```

Already distinct operations:

- Resource flow
- Field dynamics

Required order:

```text
all sequential agent mini-ticks
-> resource flow
-> field dynamics
```

Invariant requirements:

- Resource flow receives the complete ordered tick's action-yield set.
- Field dynamics receives all queued action perturbations.
- Resource baseline initialization remains identical.
- Field perturbation queue is cleared at the same point.

### 5.5 Stability and Emergence Phase

Feasibility:

```text
HIGH, but the internal order is mandatory
```

Required order:

```text
field dynamics
-> coupled emergence
-> queue future perturbations
-> stability controller
-> commit future gains
```

Invariant requirements:

- Emergence reads completed aggregate agent logs.
- Stability reads current field-dynamics and emergence outputs.
- Emergence perturbations remain queued for later field processing.
- Stability gains affect future ticks, not previously committed phases.

### 5.6 Observation / Trace Phase

Feasibility:

```text
LOW as a single post-processing phase
```

Current stateful requirements:

- `beginTick()` establishes current trace context.
- `recordDemand()` and `recordAgent()` are called during execution.
- Several subsystem traces are directly attached to `traceCollector.current`.
- `endTick()` triggers additional derived trace processing.

Invariant risk:

Moving trace construction entirely to the end would require retaining complete
immutable artifacts for every intermediate mutation and reproducing collector
side effects in identical order.

## 6. Critical Coupling Constraints

### Constraint A: `simulateAgent()` is a sequential mini-tick

It combines cognition, execution, internal evolution, and trace assembly for one
agent before the next agent begins.

This is the primary barrier to global phase separation.

### Constraint B: Agent order is behaviorally significant

The current loop can expose earlier-agent mutations to later agents during the
same tick. Any decomposition must preserve this ordering unless behavior change
is explicitly approved.

### Constraint C: Ecology requires complete execution artifacts

Resource and field updates depend on action-yield and perturbation outputs.
These artifacts must remain complete and deterministic.

### Constraint D: Stability and Emergence are closed-loop controllers

They consume current execution measurements and alter future causal parameters.
They cannot be classified or moved as pure Observation.

### Constraint E: Observation is stateful and interleaved

TraceCollector accumulates mutable in-progress trace state during the tick.
Observation cannot become a terminal-only phase without architectural change.

### Constraint F: Identity brackets Decision

Identity removal and post-tick derivation surround the decision/execution
window. Moving either boundary changes whether identity can influence behavior.

### Constraint G: Life is split around execution

Pending death is marked before agent processing and resolved afterward. This
split is current behavior, not incidental formatting.

## 7. Determinism Preservation Conditions

Any future decomposition would need to preserve:

1. Exact top-level phase order.
2. Exact agent iteration order.
3. Immediate communication-memory mutation timing.
4. Pre-intent memory/knowledge mutation timing.
5. Post-action reinforcement and need-advance timing.
6. Identity removal before Decision and restoration after execution.
7. Complete action-yield collection before resource flow.
8. Field perturbation queue contents and clear timing.
9. Emergence perturbations remaining future-facing.
10. Stability gains affecting the same future phases as today.
11. TraceCollector call and append ordering.
12. Pending-death agents receiving the same final tick.

Preserving final state alone is insufficient. Intermediate artifacts, action
selection, trace ordering, and replay output must also remain identical.

## 8. State Ownership Preservation Conditions

Safe conceptual decomposition must not create new writers.

| State Domain | Required Writer After Any Decomposition |
| --- | --- |
| World tick and live world state | tickManager / Execution Authority |
| Agent life and pending death | Execution Authority |
| Agent action effects | Execution Authority |
| Agent memory/needs/skills/knowledge | Execution Authority invoking owning semantics |
| Resource map and field state | Execution Authority committing subsystem outputs |
| Emergence history and stability gains | Execution Authority |
| Intent and resolution outputs | Decision-output producers only |
| Trace history | Trace-output producer only |

Phase extraction must not turn subsystem modules into independent mutation
authorities.

## 9. Safe Conceptual Boundaries

The following boundaries are already structurally visible:

```text
Tick opening
Life pre-update
Demand commit
Sequential agent mini-ticks
Resource-flow commit
Field-physics commit
Emergence commit
Stability commit
Identity post-update
Life cleanup
Trace finalization
```

These can be documented and verified independently without changing runtime.

They must not be interpreted as permission to reorder, batch, parallelize, or
assign independent state ownership.

## 10. Decomposition Verdict

### Safely separable at orchestration level

- Resource Flow
- Field Dynamics
- Coupled Emergence
- Stability Controller
- Life pre-update and Life cleanup as separate brackets

These already have identifiable input/output boundaries, but commit authority
must remain with tickManager.

### Not safely separable without internal redesign

- Cognition from Action Execution
- Per-agent internal evolution from execution
- Observation into one terminal phase
- Identity into one terminal derived phase

### Unsafe without behavior change

- All-agent cognition followed by all-agent execution
- Early removal of pending-death agents
- Reordering field dynamics, emergence, and stability
- Moving trace collection entirely after execution
- Parallelizing agent mini-ticks

## Final Assessment

The current tick can be described and verified as phases, but it cannot be
cleanly decomposed into independent phase executors while preserving all
existing semantics.

The safe model is:

```text
partial orchestration decomposition
+ preserved sequential agent mini-tick
+ preserved split lifecycle bracket
+ preserved interleaved observation
+ single-writer tickManager authority
```

Overall feasibility: **PARTIAL DECOMPOSITION ONLY**.
