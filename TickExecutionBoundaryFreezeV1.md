# Tick Execution Boundary Freeze v1

## Status

This report freezes the observed execution boundaries of `src/simulation/tickManager.js`.

It is a structural description only. No runtime code, execution order, simulation behavior, or subsystem authority was changed.

## Boundary Tags

| Tag | Meaning |
| --- | --- |
| `READ_ONLY` | Reads state or derives values without mutating simulation state. |
| `SAME_TICK_MUTATION` | Writes state immediately during the current tick. |
| `POST_TICK_MUTATION` | Applies mutations after the sequential agent loop or during final cleanup. |
| `CROSS_AGENT_EFFECT` | Writes state owned by an agent other than the currently executing agent. |
| `OBSERVATION_ONLY` | Writes or derives trace/debug data that has no causal runtime authority. |

## Strict Execution Phase Diagram

```text
PRE-AGENT PHASE
  tick increment
  -> Life Kernel for every agent
  -> identity-free snapshots
  -> trace begin
  -> demand snapshot

PER-AGENT SEQUENTIAL MINI-TICKS
  for each agent, in array order:
    local preparation and reads
    -> intent derivation and resolution
    -> immediate local execution mutations
    -> optional cross-agent communication memory write
    -> deferred world-effect queues / action-yield snapshots
    -> local learning, needs, runtime trace

POST-AGENT WORLD RESOLUTION
  resource flow commit
  -> field dynamics commit
  -> emergence hook
  -> stability controller
  -> identity post-tick update

FINAL CLEANUP AND OBSERVATION
  pending death finalization
  -> corpse generation
  -> trace finalization
```

## Strict Execution Order

The following order is behavior-significant and frozen:

1. Increment world tick.
2. Run Life Kernel for all agents.
3. Begin identity-free tick snapshots.
4. Begin trace collection.
5. Calculate and commit the current demand snapshot.
6. Execute each agent sequentially through `simulateAgent`.
7. Commit resource-flow results from accumulated action-yield snapshots.
8. Commit queued field dynamics.
9. Run the emergence hook.
10. Run the stability controller.
11. Apply post-tick identity metadata.
12. Finalize pending deaths and generate corpse resources.
13. Finalize life and tick traces.

## Top-Level Boundary Classification

| Operation | Classification | Visibility / authority |
| --- | --- | --- |
| Tick increment | `SAME_TICK_MUTATION` | Establishes current temporal state before all phases. |
| `runLifeKernel` | `SAME_TICK_MUTATION` | Writes lifecycle state before Decision processing; does not generate intent. |
| `beginIdentityFreeTick` | `SAME_TICK_MUTATION` | Writes identity metadata only. |
| `traceCollector.beginTick` | `OBSERVATION_ONLY` | Opens mutable trace collection state. |
| Demand calculation | `READ_ONLY` | Derives one demand snapshot used by all agents this tick. |
| Demand/history commit | `SAME_TICK_MUTATION` | Writes Reality-layer contextual state before agent execution. |
| Sequential `simulateAgent` loop | mixed | Contains reads, local writes, deferred world effects, and one cross-agent channel. |
| `runResourceFlowTick` | `POST_TICK_MUTATION` | Consumes all action-yield snapshots after agents finish. |
| `commitFieldDynamics` | `POST_TICK_MUTATION` | Applies queued field perturbations after agents finish. |
| `emergenceTickHook` | `POST_TICK_MUTATION` | Causal future-field feedback despite its emergence-oriented name. |
| `runStabilityController` | `POST_TICK_MUTATION` | Writes control gains affecting future ticks. |
| `applyPostTickIdentity` | `POST_TICK_MUTATION` | Writes derived identity metadata after causal execution. |
| `finalizePendingDeaths` | `POST_TICK_MUTATION` | Removes agents and generates corpse resources only at cleanup. |
| Trace completion | `OBSERVATION_ONLY` | Records completed execution without runtime authority. |

## simulateAgent Boundary Classification

| Operation | Classification | Notes |
| --- | --- | --- |
| `ensureMemory` | `SAME_TICK_MUTATION` | Defensive local initialization. |
| Identity-free decision view | `READ_ONLY` | Shallow view; nested references remain live. |
| Knowledge learning from memories | `SAME_TICK_MUTATION` | Local agent write before intent generation. |
| Memory decay | `SAME_TICK_MUTATION` | Local agent write before intent generation. |
| Perception, memory recall, needs evaluation | `READ_ONLY` | Derive Decision inputs from currently visible state. |
| Influence field and available-action derivation | `READ_ONLY` | Context and candidate derivation only. |
| `intentPipeline.execute` | `READ_ONLY` | Decision/Resolution output; no world mutation authority. |
| Decision and typology trace creation | `OBSERVATION_ONLY` | Describes the decision result. |
| Local action effects and mana updates | `SAME_TICK_MUTATION` | Immediate current-agent execution writes. |
| Communication receiver `recordMemory` | `SAME_TICK_MUTATION`, `CROSS_AGENT_EFFECT` | The only confirmed same-tick cross-agent write. |
| Field perturbation queue writes | `SAME_TICK_MUTATION` | Queue changes immediately; field reality changes after the agent loop. |
| World feedback queue writes | `SAME_TICK_MUTATION` | Deferred causal input, not immediate committed world mutation. |
| Action-yield computation | `READ_ONLY` | Produces a snapshot consumed by post-agent resource flow. |
| Outcome memory, skill gain, knowledge, needs advance | `SAME_TICK_MUTATION` | Local writes after current action selection; primarily affect future decisions. |
| Runtime snapshot and agent trace writes | `OBSERVATION_ONLY` | Stored on live structures but currently has no causal consumer. |

## Critical Cross-Layer Mutation List

### Confirmed same-tick cross-agent path

```text
earlier agent communication action
  -> prepareInformationTransfer
  -> recordMemory(later receiver)
  -> later receiver reads changed memory
  -> later receiver may select a different intent in the same tick
```

This is the only confirmed direct cross-agent state write inside `simulateAgent`.

### Deferred world-effect paths

```text
agent action
  -> action-yield snapshot
  -> post-agent resource-flow commit

agent action
  -> field perturbation queue
  -> post-agent field-dynamics commit

field/emergence result
  -> stability gains or queued perturbations
  -> future-tick behavior
```

### Lifecycle split boundary

```text
pre-agent Life Kernel
  -> lifecycle state and pending-death marking

post-agent cleanup
  -> agent removal and corpse generation
```

Pending-death marking does not remove an agent during the sequential agent loop.

## Sequential Integrity Validation

- `simulateAgent` is sequential and is **not parallel-safe**.
- Agent array order is a behavior-significant input.
- Earlier communication actions can alter later agents' memory before their mini-ticks.
- Agents that have already executed cannot react to later communication until a future tick.
- World resource and field changes are deferred or batched until every agent completes.
- Life processing runs before Decision processing and has no intent-generation authority.

## Hidden Execution Leakage Risks

These are reported only; no corrections were applied.

| Risk | Classification | Consequence |
| --- | --- | --- |
| Live `allNpcs` reference permits direct receiver memory writes | Same-tick shared-state exposure | Makes loop order causally significant. |
| Identity-free decision view is shallow | Shared-reference risk | Nested mutable state may remain visible across boundaries. |
| Perception exposes live mana/needs references | Trace-semantic risk | A derived view may reflect later local mutations. |
| `npc.runtime` observation output is stored on a live agent | Latent observation leakage surface | No current causal reader, but future runtime reads would violate Observation isolation. |
| `traceCollector.current` is mutable during execution | Observation mutation exposure | Safe only while Decision and Execution never read it. |
| Emergence hook queues causal field effects | Naming/authority ambiguity | It must not be classified as an observational emergence system. |
| Stability controller writes future causal gains | Cross-tick causal feedback | It is a control mechanism, not observation-only. |

No currently confirmed Observation Layer output feeds Decision or Execution.

## Unsafe Parallelization Notes

The following transformations are forbidden unless semantics are intentionally redesigned:

- Parallelizing the per-agent loop.
- Batch-computing all intents before all executions.
- Moving communication memory writes after the agent loop.
- Committing field dynamics before all agents finish.
- Moving resource-flow resolution before all action-yield snapshots exist.
- Finalizing pending deaths during an individual agent mini-tick.
- Allowing trace, runtime snapshot, settlement, culture, memory-compression, or myth outputs to enter Decision or Execution.

## Frozen Boundary Invariants

1. `tickManager` remains the sole execution authority.
2. Life Kernel remains outside Decision authority.
3. Per-agent execution remains sequential.
4. Communication-to-receiver-memory remains the only confirmed same-tick cross-agent mutation path.
5. Resource and field reality commits remain post-agent.
6. Stability and causal emergence effects remain downstream and future-facing.
7. Pending deaths remain mark-first and cleanup-later.
8. Observation outputs remain non-causal.

## Freeze Verdict

`tickManager` is a deterministic, single-writer execution kernel with a behavior-significant sequential agent loop. Its boundaries are partially phase-separated, but the per-agent mini-tick intentionally interleaves Decision derivation, Execution mutation, and observation recording. Any reordering, batching, or parallelization must be treated as a behavioral change.
