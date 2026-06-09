# simulateAgent Causal Dependency Graph v1

## Scope

This document maps the actual causal structure of `simulateAgent` in
`src/simulation/tickManager.js`.

It is a read-only architecture report. No runtime behavior was changed.

## Executive Finding

`simulateAgent` is a sequentially executed causal DAG with interleaved mutation
points.

It is not a pure decision pipeline:

- agent memory and knowledge are mutated before scoring
- resolution is followed immediately by execution
- execution mutates the current agent and may mutate another agent
- post-action learning mutates inputs used by future decisions
- some trace inputs retain live references and can reflect later mutations

The strongest concise model is:

```text
simulateAgent =
  mostly isolated sequential causal unit
  + one confirmed hard cross-agent mutation channel
```

That hard channel is:

```text
communication -> recordMemory(receiver)
```

It is the only confirmed direct cross-agent write inside `simulateAgent`.

## Proposed Classification Validation

The proposed high-level classification is directionally correct, with the
following code-level qualifications:

| Proposed claim | Validation | Qualification |
| --- | --- | --- |
| Perception is read-only | Confirmed | `self.mana` and `self.needs` are live references, so later writes alter the returned perception trace |
| `recallMemories` is read-only | Conditional | It calls `ensureMemory`, which can initialize missing memory containers |
| `evaluateNeeds` is read-only | Confirmed | It derives a profile without mutation |
| Influence field is read-only | Confirmed | It derives sources, profile, and rankings |
| Demand index is a snapshot | Confirmed | It is fixed before the agent loop and shared by all agents |
| Decision-agent view is read-only | Conditional | The view performs no writes, but contains shallow references to mutable agent state |
| Intent pipeline is pure | Confirmed under supplied inputs | No world or agent writes were found in scoring, enrichment, or resolution |
| Typology snapshot and decision trace are pure | Confirmed | No mutation path was found |
| Action yield computation is pure | Confirmed | It returns a frozen derived snapshot |
| Communication is the only hard cross-agent write | Confirmed | `recordMemory(receiver)` is the only direct cross-agent mutation found |
| Local mutations are invisible to other agents | Confirmed under current perception contract | Later agents only perceive `id`, `type`, and `location` |
| All world mutations are deferred | Qualified | Field/resource commits are deferred, but the field perturbation queue is written immediately |
| Lifecycle mutations occur inside `simulateAgent` | Rejected | Life marking occurs before the agent loop; removal and corpses occur after it |

## Operation Classification

| Operation | Reads | Writes | Classification |
| --- | --- | --- | --- |
| `ensureMemory` | `npc.memory` | missing memory containers | Immediate self mutation |
| `createIdentityFreeDecisionView` | agent decision fields | none; returns shallow references | Derived view |
| `learnKnowledgeFromMemories` | memory, knowledge | `npc.knowledge` | Pre-decision self mutation |
| `decayAgentMemory` | memory arrays | replaces memory arrays | Pre-decision self mutation |
| `perceive` | committed field/events, all agents, self | none | Read transform with live self references |
| `recallMemories` | current memory | may initialize missing memory | Read transform with defensive mutation |
| `evaluateNeeds` | needs, mana | none | Pure derived state |
| `createInfluenceField` | field, recalled memories, needs | none | Pure derived state |
| `getAvailableActions` | decision-agent mana | none | Pure action filtering |
| `filterRegisteredActions` | proposed actions | console warning only | Validation transform |
| `intentPipeline.execute` | decision view and context | none found | Pure decision transform |
| `buildAgentTypologySnapshot` | agent and intents | none found | Observation transform |
| `createDecisionTrace` | candidates and resolution | none found | Observation transform |
| `prepareInformationTransfer` | source/receiver memory and trust | none | Pure transfer proposal |
| `recordMemory(receiver)` | receiver memory | receiver memory | Immediate cross-agent mutation |
| `applyActionEffects` | selected action and self state | stamina, mana, field queue | Immediate execution mutation |
| `updateManaAfterAction` | mana and perceived field | mana | Immediate self mutation |
| `queueWorldFeedback` | mana | field perturbation queue | Immediate deferred-world write |
| `computeActionYield` | action, world, field, action history | none found | Pure frozen snapshot |
| `recordActionOutcome` | current memory | recent events, bias, short-term memory | Post-action self mutation |
| `applySkillGain` | traits, knowledge, skills | skills | Post-action self mutation |
| `learnKnowledge` | knowledge | knowledge | Conditional post-action mutation |
| `advanceNeeds` | current needs and mana | needs | Post-action self mutation |
| `createRuntimeSnapshot` | all derived and outcome data | `npc.runtime` | Read-model mutation |

## Causal DAG

```text
npc.memory
  -> ensureMemory [WRITE]
  -> learnKnowledgeFromMemories [WRITE npc.knowledge]
  -> decayAgentMemory [WRITE memory arrays]
  -> recallMemories
  -> influenceField
  -> intentPipeline

npc + identity-free state
  -> decisionAgent
  -> getAvailableActions
  -> registeredActions
  -> intentPipeline

world committed field/events + allNpcs identity/location
  -> perception
  -> influenceField
  -> intentPipeline

npc.needs + npc.mana
  -> evaluateNeeds
  -> influenceField
  -> intentPipeline

world.demandIndex
  -> intentPipeline

intentPipeline
  -> enriched intents
  -> resolution
  -> selected action
  -> execution branch

selected communication action
  -> prepareInformationTransfer
  -> recordMemory(receiver) [CROSS-AGENT WRITE]
  -> later receiver cognition when receiver has not yet run

selected non-communication action
  -> applyActionEffects [WRITE stamina/mana/field queue]
  -> updateManaAfterAction [WRITE mana]
  -> queueWorldFeedback [WRITE field queue]

selected action + pre-outcome action history + perceived field
  -> computeActionYield
  -> deferred resource-flow input

selected action
  -> recordActionOutcome [WRITE self memory]
  -> applySkillGain [WRITE self skills]
  -> optional learnKnowledge [WRITE self knowledge]
  -> optional recordMemory [WRITE self memory]
  -> future decisions

current self state
  -> advanceNeeds [WRITE needs]
  -> future decisions

all derived state + outcomes
  -> createRuntimeSnapshot [WRITE npc.runtime]
  -> inspector/read model
```

## True Data Dependencies

### Read-After-Write Dependencies

| Earlier write | Later read | Effect |
| --- | --- | --- |
| `ensureMemory` initializes memory | learning, decay, recall, outcome recording | Makes all later memory operations valid |
| `learnKnowledgeFromMemories` writes knowledge | intent scoring reads decision-agent knowledge | Can affect current-tick knowledge score |
| `decayAgentMemory` replaces memory arrays | `recallMemories` | Current-tick recall uses decayed memory |
| receiver memory written by earlier agent | later receiver learning/decay/recall/scoring | Same-tick cross-agent decision influence |
| action mutates mana | `queueWorldFeedback`, `advanceNeeds`, runtime snapshot | Changes queued feedback and future need profile |
| action outcome writes memory | skill learning multiplier does not read memory; future scoring does | Deferred self-feedback |
| optional knowledge learning | runtime snapshot and future scoring | Deferred decision influence |

### Write-After-Read Boundaries

| Earlier read | Later write | Consequence |
| --- | --- | --- |
| mana read for action availability and scoring | execution mutates mana | Selected action is based on pre-execution mana |
| needs read for scoring | `advanceNeeds` mutates needs | Current intent uses pre-advance needs |
| memory recalled for scoring | outcome recording mutates memory | Current intent excludes its own outcome |
| action history read by action yield | outcome appended afterward | Yield excludes the current action from diminishing-return history |
| perceived committed field read | field perturbation queued afterward | Current and later-agent perception use pre-commit field |

## Shallow Reference Boundaries

`createIdentityFreeDecisionView` is a shallow view. Its `knowledge`, `memory`,
`needs`, `mana`, `skills`, and other nested fields remain references to agent
state.

This creates an important ordering dependency:

- the view is created before knowledge learning and memory decay
- knowledge learning mutates the referenced knowledge array
- memory decay replaces arrays inside the referenced memory object
- scoring therefore observes these pre-decision mutations through the shallow view

`perceive` also stores live references:

```text
perception.self.mana  -> npc.mana
perception.self.needs -> npc.needs
```

Execution and need advancement mutate those objects after perception creation.
As a result, the returned perception trace can display post-execution self
values even though scoring consumed pre-execution values.

This is a trace-semantic mutation leak, not a reverse influence into the
already-completed decision.

## Same-Tick Visibility Edges

### Immediate and Causal

```text
Agent A communication execution
-> receiver Agent B memory write
-> Agent B pre-decision learning/decay/recall
-> Agent B intent score
```

This edge exists only when Agent B appears later in the agent iteration order.

This is the only confirmed real-time inter-agent causal shortcut inside
`simulateAgent`.

### Immediate but Deferred in Effect

| Write | Immediate storage | First causal consumer |
| --- | --- | --- |
| self memory outcome | current agent | future agent tick |
| self skill gain | current agent | future agent tick |
| self knowledge gain after action | current agent | future agent tick |
| self need advancement | current agent | future agent tick |
| field perturbation | shared queue | post-agent field dynamics |
| runtime snapshot | agent read model | inspector/observation |

### Not Same-Tick Visible Through Perception

Later agents cannot perceive earlier agents' changed:

- memory
- mana
- stamina
- needs
- skills
- knowledge

Nearby-agent perception exposes only `id`, `type`, and `location`.

## Deferred Effects

```text
action yield snapshot
-> agent trace
-> post-loop resource flow
-> future world resource context

field perturbation queue
-> post-loop field dynamics
-> future committed field perception

self memory/skills/knowledge/needs mutations
-> future simulateAgent invocation
-> future intent scoring
```

## Hidden Feedback Loops

### Communication Reinforcement Loop

```text
Agent A memory
-> communication action
-> Agent B heard memory
-> Agent B scoring
-> Agent B action
-> new memory
```

This loop can begin within the same tick and continue across later ticks.

### Self-Reinforcement Loop

```text
selected action
-> outcome memory bias + skill gain + knowledge
-> future intent score
-> increased/decreased action selection tendency
```

### Environment Feedback Loop

```text
selected action
-> queued field perturbation / action yield
-> post-loop field and resource commit
-> future perception
-> future intent
```

This loop is deferred across the post-agent commit boundary.

### Demand Feedback Loop

The demand loop is delayed, but it is not a direct
`action -> demandIndex` dependency:

```text
actions
-> mutations and post-loop world updates
-> future world/agent state
-> next tick calculateWorldDemand
-> next tick demandIndex
-> next tick intent score
```

`calculateWorldDemand` reads world state, agents, and previous demand before the
agent loop. Current-tick actions do not directly rewrite the current demand
index.

### Influence Field Soft Feedback

```text
committed field + recalled memory + evaluated needs
-> influence field
-> intent score
-> action
-> deferred world/self mutation
-> future influence field
```

The influence field itself is non-mutating. Its feedback exists through future
inputs rather than direct state writes.

### Trace Reference Drift

```text
perception captures live self references
-> later self mutation
-> returned trace reflects mutated values
```

This does not affect runtime choice, but it can make causal inspection report a
different state from the one used during scoring.

## Immediate Versus Deferred Mutation Matrix

| Mutation target | Immediate write | Same-agent current selection affected | Later agent current-tick decision affected | Future tick affected |
| --- | --- | --- | --- | --- |
| receiver memory | Yes | No | Yes, conditionally | Yes |
| self stamina/mana | Yes | No | No through current perception model | Yes |
| self memory/bias | Yes | No | No | Yes |
| self skills/knowledge | Yes | No | No | Yes |
| self needs | Yes | No | No | Yes |
| field perturbation queue | Yes | No | No | Yes, after commit |
| resource state | No; post-loop commit | No | No | Yes |
| runtime snapshot | Yes | No | No causal reader found | Inspector only |

## Causal Boundary Conclusions

1. `simulateAgent` contains both Decision and Execution authority coordinated by
   `tickManager`.
2. The intent pipeline itself is pure under the supplied inputs, but those
   inputs are produced after pre-decision agent mutations.
3. Communication creates the only confirmed immediate cross-agent
   read-after-write path affecting same-tick decisions.
4. World feedback is staged: actions write queues and snapshots, while world
   state commits after the full agent loop.
5. Post-action learning forms deferred feedback into future decisions.
6. Live references inside perception create observational drift between the
   state scored and the state later reported.

## Lifecycle Boundary Outside `simulateAgent`

Lifecycle behavior belongs to the enclosing tick graph, not the internal
`simulateAgent` DAG:

```text
runLifeKernel for all agents
-> agent.life update + _pendingDeath mark
-> sequential simulateAgent loop
-> finalizePendingDeaths
-> corpse resource generation
```

Pending-death marking is immediate before cognition, while structural removal
and corpse generation are deferred until after every agent finishes. A pending
death does not currently remove the agent from the same tick's execution loop.

## Parallelization Consequence

Sequential execution is behavior-significant because:

- an early agent can write memory into a later agent
- the later agent can learn, decay, recall, and score using that memory
- reversing agent order can defer the same influence until the next tick

A parallel or globally batched execution model would therefore change:

- social learning timing
- memory propagation timing
- later-agent intent inputs
- resulting emergent interaction order

Life Continuity, Bond, and Lineage systems must not assume batch-isolated
agents if they consume or extend this same immediate communication boundary.

## Final Statement

`simulateAgent` is a sequential causal DAG with interleaved Decision,
Execution, and deferred feedback boundaries. Its behavior depends on exact
operation order, shallow-reference semantics, and immediate communication
writes.

Its only confirmed hard cross-agent mutation channel is:

```text
communication -> recordMemory(receiver)
```

Any causal analysis must preserve those distinctions.
