# Architecture Consolidation Audit v1

## Purpose

This audit verifies that Earthly Journey's implemented systems remain aligned with the authority model, causal model, semantic model, and layer boundaries defined in `/AGENTS.md`.

This document is read-only. It recommends clarification work only. It does not change runtime behavior, tick order, action selection, save formats, replay formats, or runtime APIs.

## Executive Summary

Overall status: stable with manageable documentation and naming risks.

The current implementation preserves the central authority rule:

```text
tickManager = only runtime mutation authority
```

The emergence chain is currently downstream-only:

```text
Action
-> Trace
-> Behavioral Patterns
-> Settlement / Culture
-> Civilization Memory
-> Civilization Myth
```

No evidence was found that Culture, Civilization Memory, Civilization Myth, Semantic Consistency, or Causal Isolation feed back into intent generation, resolution, field dynamics, settlement formation, or execution.

The main risks are semantic and documentation-level:

- `settlement` is runtime terminology, while the intended narrative term is `activity cluster`.
- `protoEconomy` is runtime terminology, while the intended narrative term is `resource exchange`.
- `migrationPressure` can sound like movement authority, but it is currently an imbalance/pressure observation field.
- Several snapshot helpers import `freezeSnapshot` from `behaviorTraceRecorder`, which is mechanically safe but semantically misleading because it makes behavior look like a shared utility authority.

## Layer Inventory

### Reality Layer

Implemented systems:

- Resource Geography
- Resource Flow
- Elemental Field System
- World Field
- World Demand
- Action Yield
- Migration Pressure

Primary responsibility:

- Maintain or derive physical, environmental, resource, and pressure state.

Authority:

- Runtime mutation is committed through `tickManager`.
- Field mutation is queued and committed through field dynamics.
- Demand is derived from world state.
- Action yield computes outcome magnitude, not decision authority.

### Decision Layer

Implemented systems:

- Traits
- Skills
- Knowledge
- Agent Typology
- Intent Pipeline
- Resolution Model
- Influence Field
- Memory and Social Memory
- Perception

Primary responsibility:

- Generate and score candidate intents from agent-local state and permitted modifiers.

Authority:

- Intent Pipeline owns phase boundaries.
- Resolution Model owns final intent selection.
- Typology, Demand, Field, Memory, Skills, and Traits contribute additive scoring signals only.

### Execution Layer

Implemented systems:

- `tickManager`
- Action registry filtering
- Action effect application
- Memory update
- Skill gain
- Knowledge learning
- Field perturbation queue

Primary responsibility:

- Validate and execute selected actions.
- Commit runtime mutations.

Authority:

- `tickManager` is the single mutation gate.

### Observation Layer

Implemented systems:

- Behavioral Signature
- Trace Collector
- Replay Buffer
- Decision Inspector
- Settlement Emergence
- Resource Exchange / Proto-Economy observation
- Culture Emergence
- Civilization Memory
- Civilization Myth
- Semantic Consistency Audit
- Causal Isolation
- Inspector Panels

Primary responsibility:

- Read traces, snapshots, and derived histories.
- Produce analysis, compression, visualization, and explanation.

Authority:

- No mutation authority.
- No decision authority.
- No execution authority.

## Authority Matrix

| Layer | Inputs | Outputs | Authority | Mutation Rights | Consumers |
| --- | --- | --- | --- | --- | --- |
| Resource Geography | Seed/config/environment | Resource maps, topology, metrics | Reality derivation | Via runtime/world state only | Resource Flow, Inspector, Culture/Memory as read-only |
| Resource Flow | Resource maps, action yield snapshots | Depletion/regeneration/diffusion trace | Reality update support | Via `tickManager` assignment | Inspector, Civilization Memory as read-only |
| Elemental Field | Field state, perturbation queue | Field dynamics trace, final field state | Physical reality | Via `commitFieldDynamics` in `tickManager` | Intent scoring as field input, Inspector |
| World Demand | World state, agents, previous demand | Demand index/history | Opportunity pressure | Derived only; assigned by `tickManager` | Intent scoring, Inspector, Memory/Culture as read-only |
| Action Yield | Action, field, resource context | Yield snapshot | Outcome magnitude | None directly | Resource Flow, Inspector |
| Migration Pressure | Population/resource/stability snapshots | Pressure metrics | Observation/pressure analytics | None | Inspector, Culture/Memory as read-only |
| Traits | Agent trait state | Trait score contribution | Agent property | Initialized/owned by agent setup | Intent scorer |
| Skills | Agent skills, action mapping | Skill affinity, skill gain | Capability model | Skill gain during execution only | Intent scorer, Identity derivation |
| Knowledge | Agent knowledge/memory | Knowledge score, learned knowledge | Learning model | Learning during execution/memory processing | Intent scorer |
| Identity | Agent post-tick state | Derived identities and identity changes | Observation-only derived identity | Post-tick derivation only; blocked from decisions | Inspector, trace |
| Typology | Agent type/profile | Typology score modifiers, snapshots | Causal profile weighting | None | Intent scorer, Inspector |
| Intent Pipeline | Agent decision view, actions, context | Scored/enriched/resolved intent trace | Intent phase boundary | None | `tickManager`, Inspector |
| Resolution Model | Candidate intents | Selected intent | Final selection | None | `tickManager`, Decision Inspector |
| tickManager | Agents, world, trace collector | Runtime mutations, tick trace | Execution authority | Yes, single gate | All runtime state |
| Behavioral Signature | Action history | Pattern analytics | Observation | None | Inspector, Culture/Memory |
| Settlement Emergence | Trace history | Activity clusters | Observation | Internal detector history only | Inspector, Culture/Memory |
| Resource Exchange | Trace/resource/social snapshots | Exchange/reciprocity observations | Observation | None | Inspector, Culture/Memory |
| Culture Emergence | Traces, settlement/context snapshots | Culture and cultureTrace | Observation/compression | None | Inspector, Civilization Memory |
| Civilization Memory | Culture traces and histories | civilizationMemoryTrace | Post-simulation compression | None | Inspector, Civilization Myth |
| Civilization Myth | Civilization Memory | mythTrace | Interpretive explanation | None | Inspector |
| Semantic Consistency | Terms/labels/docs/test descriptions | SemanticConsistencyReport | Audit | None | Inspector/docs |
| Causal Isolation | Intent traces/pipeline outputs | Isolation reports/graphs | Audit | None | Inspector/docs |
| Inspector Panels | World/trace/report props | UI display | Presentation | None | Human operator |

## Dependency Graph

High-level runtime chain:

```text
tickManager
-> World Demand
-> Perception
-> Intent Pipeline
   -> Intent Scorer
   -> Intent Enricher
   -> Intent Resolver
-> Resolution Model
-> Action Execution
-> Memory / Skill / Knowledge updates
-> Resource Flow
-> Field Dynamics
-> Coupled Emergence
-> Stability Controller
-> Identity derivation
-> Trace Collector
```

Observation chain:

```text
Trace Collector
-> Behavioral Signature
-> Settlement Emergence
-> Resource Exchange
-> Culture Emergence
-> Civilization Memory
-> Civilization Myth
```

Audit chain:

```text
Code/docs/labels/test terms -> Semantic Consistency
Intent traces/pipeline outputs -> Causal Isolation
```

Inspector chain:

```text
world + trace + reports -> Inspector Panels
```

## Dependency Findings

No blocking circular dependency was found during this audit.

No evidence was found that downstream observation layers import `tickManager`, `intentPipeline`, `resolutionModel`, `worldField`, `elementalField`, or `demand` for mutation or decision control.

Relevant findings:

- `resolutionModel` and `intentPipeline` import `identityGuard`, which is appropriate because identity must be blocked from decision context.
- `tickManager` imports `identityLock` and applies identity after execution, which preserves the intended post-tick derivation boundary.
- `traceCollector` imports Behavioral Signature and Settlement Detector. This is acceptable because it records and derives observation snapshots after runtime events.
- Snapshot utilities such as Resource Geography, Resource Flow, Proto-Economy, Settlement, and Action Yield import `freezeSnapshot` or `cloneSnapshot`. This is mechanically safe but semantically noisy because these utilities currently live under behavior/replay modules.

## Authority Findings

### Finding A1: tickManager remains the single runtime mutation gate

Evidence:

- Action effects, memory updates, skill gains, resource flow assignment, field dynamics commit, emergence history, stability gains, and post-tick identity changes are coordinated inside `tickManager`.

Severity: pass.

Recommendation:

- Keep all future runtime writes routed through `tickManager` or explicit helpers called only by `tickManager`.

### Finding A2: Resolution authority remains centralized

Evidence:

- Intent Pipeline resolves final intent through the resolver path.
- Resolution Model remains the selection authority.

Severity: pass.

Recommendation:

- Avoid adding selection behavior inside Typology, Demand, Culture, Memory, or Inspector systems.

### Finding A3: Identity remains guarded from decision input

Evidence:

- `createIdentityFreeDecisionView` is used before intent pipeline execution.
- `assertNoIdentityLeak` exists in Intent Pipeline and Resolution Model.

Severity: pass.

Recommendation:

- Keep identity derivation post-tick and display-only.

## Semantic Findings

### Finding S1: settlement vs activity cluster

Runtime term:

- `settlement`

Narrative term:

- `Activity Cluster`

Risk:

- `settlement` can imply a town/civilization system with social authority, while the current implementation is an observation of persistent activity clusters.

Recommendation:

- Do not rename runtime APIs now.
- Continue documenting `settlement = activity cluster observation`.
- Prefer inspector labels such as "Activity Cluster" where user-facing wording matters.

### Finding S2: protoEconomy vs resource exchange

Runtime term:

- `protoEconomy`

Narrative term:

- `Resource Exchange System`

Risk:

- `economy` can imply a formal market system or policy layer. Current implementation observes exchange traces, reciprocity, and trust relationships.

Recommendation:

- Keep runtime term for compatibility.
- Use "Resource Exchange" in docs and panels.

### Finding S3: migrationPressure vs distribution pressure

Runtime term:

- `migrationPressure`

Narrative term:

- `Distribution Pressure Field`

Risk:

- `migration` may sound like movement execution. Current implementation is pressure/imbalance analytics, not movement logic.

Recommendation:

- Document clearly that Migration Pressure does not move agents.

### Finding S4: typology vs profession

Runtime term:

- `agentTypology`

Risk:

- Typology can be mistaken for class/profession if not framed carefully.

Recommendation:

- Continue using "causal participation profile" in docs.
- Never let typology assign skills, roles, professions, or identities.

### Finding S5: myth and civilization memory naming

Runtime terms:

- `civilizationMemory`
- `civilizationMyth`

Risk:

- These can sound like runtime belief systems. Current implementation is post-simulation compression and interpretation.

Recommendation:

- Keep "downstream-only", "post-simulation", and "interpretive" in docs and panel descriptions.

## Boundary Findings

### Finding B1: Observation-to-decision leakage

Status: no active violation found.

Observed systems:

- Behavioral Signature
- Culture Emergence
- Civilization Memory
- Civilization Myth
- Semantic Consistency
- Causal Isolation

Finding:

- These systems are not imported into Intent Pipeline, Resolution Model, or tickManager execution logic as decision inputs.

Recommendation:

- Maintain this dependency direction.

### Finding B2: Interpretation-to-causal leakage

Status: no active violation found.

Finding:

- Civilization Myth reads Civilization Memory and emits myth/mythTrace only.
- It does not feed back into culture, memory, demand, settlement, intent, or execution systems.

Recommendation:

- Treat Myth as inspector/report output only.

### Finding B3: Snapshot utility ownership ambiguity

Status: minor architectural smell.

Finding:

- Several non-behavior systems import `freezeSnapshot` from `behaviorTraceRecorder`.

Risk:

- This makes a behavior observation module look like a shared infrastructure owner.

Recommendation:

- Future cleanup only: move `freezeSnapshot` into a neutral utility module such as `src/simulation/utils/snapshot.js`, then re-export from old locations for compatibility.

### Finding B4: Action Yield is reality-adjacent but not execution authority

Status: acceptable.

Finding:

- Action Yield computes outcome magnitude and feeds Resource Flow.

Risk:

- It could be mistaken for action execution if expanded carelessly.

Recommendation:

- Keep Action Yield outputs as snapshots and modifiers only. Do not let it select actions or commit mutations directly.

## Observation Layer Audit

Behavioral Signature:

- Reads action histories.
- Produces pattern analytics.
- Does not influence scoring or execution.

Settlement Emergence:

- Reads traces.
- Produces activity clusters.
- Maintains detector history internally for observation.
- Does not directly move agents or allocate resources.

Culture Emergence:

- Reads traces, settlement snapshots, and environmental context.
- Produces culture/cultureTrace.
- Does not feed back into runtime systems.

Civilization Memory:

- Reads culture traces and histories.
- Compresses persistent structures.
- Does not affect culture, settlement, demand, field, intent, or execution.

Civilization Myth:

- Reads Civilization Memory.
- Produces symbolic/narrative interpretation.
- Does not affect upstream memory or runtime.

Semantic Consistency:

- Reads terminology inputs.
- Produces reports.
- Does not affect runtime.

Causal Isolation:

- Reads pipeline outputs/traces.
- Produces verification reports.
- Does not affect runtime.

Inspector Panels:

- Render world/trace/report data.
- Should remain read-only and avoid computing authoritative state.

## Emergence Pipeline Audit

Current pipeline:

```text
Action
-> Trace
-> Behavioral Signature
-> Settlement / Resource Exchange observation
-> Culture Emergence
-> Civilization Memory
-> Civilization Myth
```

Status: pass.

Notes:

- Culture is derived from trace and cluster data.
- Civilization Memory is derived from culture/history data.
- Civilization Myth is derived from Civilization Memory.
- No downstream layer currently feeds back into action selection or mutation.

## AGENTS.md Compliance Audit

### DF controls possibility

Status: pass.

Evidence:

- Action execution and field/resource mutation remain under tickManager-controlled runtime.

### AI controls desire

Status: pass.

Evidence:

- Intent Pipeline scores and resolves candidate intents without committing mutations.

### Engine controls execution

Status: pass.

Evidence:

- `tickManager` remains the execution authority.

### No direct state mutation outside engine

Status: mostly pass.

Notes:

- Several helper systems mutate data when called by tickManager, such as memory learning and skill gain. This is acceptable when invoked from the execution path.
- Observation systems should not call these helpers.

### Identity is derived

Status: pass.

Evidence:

- Identity derivation occurs post-tick.
- Identity guard exists in decision paths.

### Profession has no runtime authority

Status: pass.

Evidence:

- No profession system was found as a runtime authority.
- Typology is implemented as scoring modifier, not profession/class.

### Observation layers remain observational

Status: pass with minor utility-location recommendation.

Evidence:

- Observation systems produce reports/traces/panels and do not feed back into runtime decision or mutation systems.

## Overlap Findings

### Overlap O1: Influence Field, Demand, Typology, and Intent Scoring

Risk:

- Multiple systems affect intent scoring.

Current status:

- This is controlled by Intent Pipeline and scoring components.

Recommendation:

- Continue treating all as additive contributors only.
- Keep final selection authority in Resolution Model.

### Overlap O2: Culture, Civilization Memory, and Civilization Myth

Risk:

- These can blur if docs are imprecise.

Current status:

- Culture detects stabilized behavior.
- Civilization Memory compresses persistent structures.
- Civilization Myth interprets memory symbolically.

Recommendation:

- Keep this exact vocabulary in docs and panel headings.

### Overlap O3: Settlement and Culture

Risk:

- Settlement clusters and cultural clusters may both describe "where behavior stabilizes".

Current status:

- Settlement is spatial/activity clustering.
- Culture is behavioral stabilization derived partly from settlement context.

Recommendation:

- Keep settlement as spatial observation and culture as cross-agent behavior interpretation.

## Recommendations

1. Add a neutral snapshot utility module in a future cleanup.

   Suggested path:

   ```text
   src/simulation/utils/snapshot.js
   ```

   Move or mirror `freezeSnapshot` and `cloneSnapshot` there to reduce semantic coupling to behavior/replay modules.

2. Keep `AGENTS.md` as the top authority file for runtime architecture.

   The current AI docs are rich, but `AGENTS.md` is now the clearest executable boundary contract.

3. Add a short "Layer Position" block to new simulation modules.

   Recommended format:

   ```text
   Layer: Observation
   Mutation: none
   Feeds runtime: no
   Inputs: trace snapshots
   Outputs: report/trace
   ```

4. Avoid adding any feedback path from Culture, Civilization Memory, or Myth.

   If future gameplay wants myths to affect agent behavior, that should be implemented as a separate explicit system, not by allowing Myth to influence intent directly.

5. Continue using Semantic Consistency Audit for terminology drift.

   Prioritize terms:

   - settlement / Activity Cluster
   - protoEconomy / Resource Exchange
   - migrationPressure / Distribution Pressure Field
   - typology / causal participation profile
   - civilizationMemory / post-simulation compression
   - civilizationMyth / interpretive narrative output

6. Keep inspector panels read-only.

   Panels should accept `world`, `trace`, and reports as inputs and never call mutation helpers.

## Final Assessment

Earthly Journey currently preserves its core architecture:

```text
Reality constrains.
Agents desire.
Resolution selects.
tickManager executes.
Observation explains.
```

The system is becoming broad, but the layer boundaries are still coherent.

The next consolidation priority should be small utility cleanup and documentation consistency, not behavioral refactor.
