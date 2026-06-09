# Tick Decomposition Constraint Validation Pass v1

## Scope

This report validates the actual execution constraints inside
`src/simulation/tickManager.js` against the authority rules in `AGENTS.md`.

No runtime code was modified.

The validation focuses on:

- `simulateAgent` execution order
- cross-agent sequential visibility
- within-tick mutation propagation
- whether cognition and execution can be separated without changing behavior

## Executive Verdict

The sequential mini-tick hypothesis is **confirmed**.

Each agent completes its cognition, resolution, execution, learning, need
advancement, and runtime snapshot before the next agent begins.

However, the resulting sequential visibility is selective rather than global:

- direct cross-agent memory writes are visible to later agents in the same tick
- committed world fields and resource flow are not updated until all agents finish
- queued field perturbations are shared during the loop but are not read by agent cognition
- earlier-agent stamina, mana, skill, need, and memory changes are not exposed through
  nearby-agent perception

Therefore, a global `all cognition -> all execution` decomposition is **not
behavior-preserving** under the current implementation.

## Ground-Truth Tick Order

The implemented order is:

1. Increment world tick.
2. Run Life Kernel for every agent.
3. Remove identity snapshots from every agent.
4. Begin trace collection.
5. Calculate and commit world demand.
6. For each agent, sequentially run the complete `simulateAgent` mini-tick.
7. Commit resource flow from all action-yield snapshots.
8. Commit field dynamics from queued perturbations.
9. Run coupled emergence and queue its perturbations.
10. Run stability control.
11. Restore derived identities.
12. Finalize pending deaths and generate corpse resources.
13. End trace collection.

## `simulateAgent` Execution Order

For each agent, `simulateAgent` performs:

1. Initialize missing memory structures.
2. Create an identity-free decision view.
3. Learn knowledge from existing memories.
4. Decay memory.
5. Perceive committed world state and nearby agent identity/location.
6. Recall memories.
7. Evaluate needs.
8. Build influence field.
9. Discover and validate available actions.
10. Run intent scoring, enrichment, and resolution.
11. Build typology and decision traces.
12. Execute the selected action.
13. Compute action yield.
14. Record action outcome into memory.
15. Apply skill gain and optional knowledge gain.
16. Advance needs.
17. Write the agent runtime snapshot.

This confirms that cognition and execution are interleaved per agent, not
batched by phase across the population.

## Cross-Agent Sequential Visibility

### Confirmed Same-Tick Visibility

Communication actions create a real cross-agent sequential dependency:

```text
earlier agent communicates
-> recordMemory(receiver, heardMemory)
-> later receiver begins simulateAgent
-> receiver learns, decays, recalls, and scores using the updated memory
```

If the receiver has already completed its mini-tick, the same write cannot
affect its decision until the next tick.

Agent iteration order can therefore change decisions even when the initial
world state and seed are otherwise identical.

### Not Visible to Later Agents Through Perception

Nearby-agent perception exposes only:

- `id`
- `type`
- `location`

It does not expose the earlier agent's:

- memory
- needs
- stamina
- mana
- skills
- knowledge
- runtime snapshot

Current action execution does not mutate location in `tickManager.js`.
Consequently, earlier-agent internal mutations are not currently visible to
later agents through the perception boundary.

### Shared but Deferred World Mutations

Action execution queues field perturbations immediately, but agent perception
reads committed area fields rather than the perturbation queue.

Therefore:

```text
agent action -> fieldPerturbationQueue
```

is shared within the tick, but does not affect later-agent cognition until
field dynamics commit after the complete agent loop.

Action-yield snapshots are similarly accumulated through agent traces and only
consumed by resource flow after all agents finish.

## Within-Tick Mutation Visibility Map

| Mutation | Writer timing | Visible to current decision | Visible to later agents this tick | Effective boundary |
| --- | --- | --- | --- | --- |
| Life state and pending death | Before agent loop | Yes | Yes, but not exposed by nearby perception | Tick start |
| Identity removal | Before agent loop | Yes | Yes | Tick start |
| Demand index | Before agent loop | Yes | Yes, fixed for all agents | Tick start |
| Knowledge learned from memory | Before current agent scoring | Yes | No direct cross-agent exposure | Current mini-tick |
| Memory decay | Before current agent scoring | Yes | Only if the same agent is later read directly | Current mini-tick |
| Communication receiver memory | During earlier agent execution | No for sender's completed decision | Yes if receiver runs later | Immediate shared write |
| Stamina and mana | During current agent execution | No for already-selected action | No through perception | Current mini-tick / future tick |
| Action outcome memory and bias | After current action | No for already-selected action | No direct exposure | Future decision |
| Skill gain and needs advancement | After current action | No for already-selected action | No direct exposure | Future decision |
| Runtime snapshot | End of current mini-tick | No | No causal reader found | Inspector/read model |
| Field perturbation queue | During action execution | No | Queue exists, but is not read by cognition | Post-agent field commit |
| Resource map changes | After all agents | No | No | Post-agent resource commit |
| Field state changes | After all agents | No | No | Post-agent field commit |
| Emergence and stability changes | After all agents | No | No | Next tick inputs |
| Identity restoration | After all agents | No | No | Tick end |
| Death removal and corpse generation | After all agents | No | No | Tick cleanup |

## Hidden Shared-State Paths

### Active Causal Leak: Receiver Memory

`simulateAgent` receives the live `npcs` array. Communication resolves a receiver
from that array and directly calls `recordMemory` on the receiver.

This is the only confirmed path where one agent's completed execution can alter
a later agent's cognition during the same loop.

### Latent Shared-State Surfaces

The following shared structures are mutated during the loop but have no current
same-tick decision reader:

- `worldObj.fieldPerturbationQueue`
- `npc.runtime`
- trace collector state

They are not current causal leaks, but decomposition must preserve their
existing consumption boundaries.

### No Confirmed Observation Feedback

No read path was found from trace collector state or `npc.runtime` inspector
data back into intent scoring, resolution, or action execution.

## Cognition-to-Execution Separation Validation

### Unsafe: Global Batched Cognition Then Execution

The following transformation is not behavior-preserving:

```text
all agents decide
-> all agents execute
```

It would prevent a later agent from using a memory communicated by an earlier
agent during the same tick.

### Unsafe: Deferred Cross-Agent Writes

Deferring communication memory writes until after all decisions would change:

- receiver memory available during scoring
- knowledge learned from memory
- recalled memories
- influence field inputs
- selected intent

### Unsafe: Moving Pre-Decision Mutations After Scoring

Knowledge learning and memory decay currently occur before perception, recall,
and scoring. Moving them outside that boundary would change current-tick
decision inputs.

### Conditionally Safe: Preserve Per-Agent Adjacency

Cognition and execution may be represented as explicit internal stages only if:

- each agent still completes all stages before the next agent begins
- communication writes remain immediate
- pre-decision memory and knowledge operations retain their order
- post-action learning and need changes remain after selection
- world physics commits remain after all agents

This would clarify structure, but it would not create independently schedulable
population-wide phases.

## Safe and Unsafe Decomposition Assumptions

| Assumption | Classification | Reason |
| --- | --- | --- |
| Life initialization can remain a pre-loop step | Safe | Already population-wide and ordered before decisions |
| Death cleanup can remain a post-loop step | Safe | Already deferred until all agents finish |
| Demand can be calculated once before the agent loop | Safe | All agents currently read the same committed index |
| Resource flow can remain after all agents | Safe | It consumes accumulated action-yield snapshots |
| Field dynamics can remain after all agents | Safe | Cognition reads committed fields, not queued perturbations |
| Stability and emergence can remain post-agent phases | Safe | Their outputs affect later boundaries, not current agent decisions |
| Trace can be treated as causally read-only | Safe under current code | No decision/execution reads from trace state were found |
| All agents can decide before any agent executes | Unsafe | Breaks same-tick communication-to-memory visibility |
| Agent order is behavior-neutral | Unsafe | Communication effects depend on whether receiver runs later |
| `simulateAgent` is a pure cognition function | Unsafe | It mutates agents, receivers, world queues, skills, needs, and memory |
| Cognition and execution can be independently scheduled | Unsafe | Current cross-agent writes require per-agent adjacency |
| Queued field effects influence later agents immediately | Rejected | Later agents read committed field state only |
| Earlier internal-state changes are visible through perception | Rejected | Nearby perception exposes only identity and location |

## Constraint Validation Summary

The current tick is a deterministic single-writer kernel with a sequential
series of agent mini-ticks.

The strongest decomposition constraint is not field or resource propagation.
It is immediate cross-agent communication memory mutation.

Any future decomposition that changes agent ordering, batches cognition, or
defers communication writes will change runtime behavior. Phase naming alone is
safe; phase rescheduling is not.

## Final Validation

**Sequential mini-tick hypothesis: CONFIRMED.**

**Global cognition-to-execution separation: NOT behavior-preserving.**

**Partial structural decomposition: conditionally safe only when existing
per-agent ordering and mutation visibility boundaries are preserved exactly.**
