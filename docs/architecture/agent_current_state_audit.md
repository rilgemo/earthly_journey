# Agent Architecture — Current State Audit

Version: v1
Status: Authoritative pre-P0 baseline
Last updated: 2026-06-12
Purpose: Establish module-by-module compatibility with L3 Conscious Agent target before any P0 implementation begins.

See [agent_consciousness_l3_target.md](agent_consciousness_l3_target.md) for the L3 target spec.

---

## Audit Format

Each module is assessed against:

1. **Responsibility** — what does it own?
2. **Input / Output** — data contract
3. **L3 Compatibility** — Safe / Review Required / Conflict
4. **Conflict Points** — specific issues that will surface during P0/P1 build
5. **Migration Path** — recommended action

---

## 1. intentPurity (Intent Pipeline + Identity Guard)

**Files:** `src/simulation/intent/intentPipeline.js`, `src/simulation/identity/identityGuard.js`

**Responsibility:**
Orchestrates the 4-stage per-tick intent pipeline: score → enrich → resolve → trace. The identity guard (`assertNoIdentityLeak`) fires before scoring and throws if identity keys are detected in the decision context.

**Input / Output:**

```
Input:  agent, actions[], context
Output: { scoringResult, enrichmentResult, resolutionResult, intentTrace, finalIntent }
```

**L3 Compatibility: Review Required**

**Conflict Points:**

1. **Identity guard will block L3 wiring.** The guard currently throws on any object containing `identity`, `identities`, or `identityChanges` in the decision context. When the Identity Engine (P0) produces an `identityProfile`, the pipeline must receive it as input. The guard's hard block is correct architecture — but the allowed key set needs a deliberate expansion policy.

2. **Scoring has no emotion or memory axis.** The intent scorer has 10+ components (need, skill, trait, knowledge, environment, influence, demand, typology) but no `emotionScore` or `episodicMemoryScore`. Adding these will require new component slots and weight recalibration.

3. **Intent trace is tick-local.** The intentTrace captures one tick's causal chain but has no autobiographical continuity. There is no mechanism to connect "why I chose X at tick 321" to a later self-reflection.

**Migration Path:**

- Expand the identity guard allowlist to permit `identityProfile` as a read-only input (no mutation).
- Add `emotionScore` and `memoryScore` as optional components in `intentScorer.js` — zero-weighted until the engines exist.
- Do not modify the trace structure yet; the autobiographical layer belongs to Memory Engine.

---

## 2. perceptionSplit (Perception Subsystem)

**Files:** `src/simulation/perception/perceptionModel.js`, `beliefState.js`, `perceptionDistortion.js`, `perceptionDriftController.js`, `informationPropagation.js`, `rumorStabilityAnalyzer.js`, `beliefConvergenceModel.js`

**Responsibility:**
Models the gap between world reality and agent belief. `perceptionDistortion.js` applies distance-decay and memory-decay to incoming events. `beliefState.js` holds perceived world, perceived identity, perceived skills, confidence map, and belief version. `perceptionModel.js` assembles the full per-agent perceived snapshot.

**Input / Output:**

```
Input:  agent, world events, tick, distance/range, confidenceMap
Output: beliefState { perceivedWorld, perceivedIdentity, perceivedSkills,
                      perceivedEvents, confidenceMap, confidenceScore, beliefVersion }
```

**L3 Compatibility: Review Required**

**Conflict Points:**

1. **beliefState has `perceivedIdentity` but no persistent identity.** The field exists as an array but is populated from external event injection, not from a canonical Identity Engine. Once the Identity Engine exists, `perceivedIdentity` must be derived from `identityProfile`, not from ad-hoc event data.

2. **Distortion is tick-local.** `perceptionDistortion.js` computes distance-accuracy and memory-accuracy per event, but there is no cross-tick belief accumulation. Beliefs reset each tick rather than persisting and drifting.

3. **No emotional coloring.** Distortion applies geometric decay (distance, time) but not affective decay — a traumatic event should remain perceptually sharp long after tick distance would normally reduce it.

4. **playerPerspectiveEngine duplicates some logic.** Both systems do field degradation and nearby-agent filtering. As L3 matures, one should own subjective perception; the other should consume it.

**Migration Path:**

- Persist `beliefState` across ticks in the agent object (not recomputed from scratch each tick).
- When Emotion Engine (P0) exists, introduce `emotionalSalience` as a multiplier on `memoryAccuracy` in `perceptionDistortion.js`.
- When Identity Engine (P0) exists, wire `identityProfile → perceivedIdentity` as a read-through, not an overwrite.
- Reconcile with `playerPerspectiveEngine`: perception subsystem owns belief formation; perspective engine owns first-person expression of that belief.

---

## 3. decisionInspector

**File:** `src/simulation/decisionInspector.js`

**Responsibility:**
Post-hoc read-only audit of a decision trace. Sorts candidates by score, verifies trace integrity (selected intent matches resolution result), returns a frozen inspection object.

**Input / Output:**

```
Input:  decisionTrace { agentId, tick, selected, candidates, breakdown,
                        influenceContributions, resolutionResult }
Output: frozen { agentId, tick, selected, candidateRanking, breakdown,
                  influenceContributions, resolutionResult }
        + hasTraceIntegrity() → boolean
```

**L3 Compatibility: Safe**

**Conflict Points:**

None critical. The inspector is a pure read-only audit tool. It has no opinion about what drives intent — it only verifies structural integrity of the trace.

Minor: when emotion and memory scores are added to the intent pipeline, `breakdown` will contain new keys. The inspector will expose them automatically with no changes needed.

**Migration Path:**

No changes required for P0. Monitor `breakdown` key coverage as new scoring components are added.

---

## 4. replayBuffer

**File:** `src/simulation/replayBuffer.js`

**Responsibility:**
Circular buffer (default 500 frames) of simulation snapshots. Clones each frame on push (deep copy via `structuredClone` or JSON round-trip). Provides indexed, latest, and bulk-read access.

**Input / Output:**

```
Input:  any serializable frame object
Output: ReplayBuffer instance; frame access via get(i), latest(), getAll()
```

**L3 Compatibility: Safe**

**Conflict Points:**

None. The replay buffer is schema-agnostic — it stores whatever it is given. As agent state grows to include `emotionState`, `identityProfile`, `goalStack`, and `memory[]`, those fields will be stored automatically.

Watch point: frame size will grow significantly once L3 agent state is added. 500 frames × large agent objects may become a memory concern. This is not a compatibility issue, it is a capacity planning concern.

**Migration Path:**

No changes required for P0. After L3 state is live, re-evaluate `maxFrames` default and consider field-level snapshot compression.

---

## 5. lineageEngine

**File:** `src/simulation/lineageEngine.js`

**Responsibility:**
Queryable genealogical index. Tracks parent/child relationships, generation depth, family ID, and birth tick. API: `registerAgent`, `registerBirth`, `getAncestors`, `getDescendants`, `getFamilyTree`, `getGenerationDistribution`, `getRecord`, `printTree`, `size`.

**Input / Output:**

```
Input:  agent objects with lineage.parentIds; newborns via registerBirth
Output: lineage records { id, fatherId, motherId, parentIds, childrenIds,
                          generation, familyId, birthTick }
        + tree / distribution queries
```

**L3 Compatibility: Review Required**

**Conflict Points:**

1. **Relationship Engine (P1) will supersede this.** The lineageEngine models exactly one relationship type: parent/child biological descent. The Relationship Engine target covers: parent, friend, enemy, mentor, partner, faction. LineageEngine data should become the `biological` sub-graph of the full relationship graph, not a standalone system.

2. **No relationship strength or history.** The lineage record stores structural facts (who begat whom) but not relationship quality — no trust score, no interaction history, no affinity drift. These belong in the Relationship Engine.

3. **No expiry or mutation.** Lineage records are permanent and immutable once written. This is correct for genealogy but insufficient for social relationships (friendships break, enmities form and dissolve).

**Migration Path:**

- Keep lineageEngine unchanged through all P0 work. It is genealogically stable and safe.
- When building Relationship Engine (P1): lineageEngine becomes a read-only data source that pre-populates the `biological` edge type. Do not merge the two — composition is cleaner than inheritance here.
- Expose a `toRelationshipEdges()` adapter from lineageEngine when P1 begins.

---

## 6. narrativeEngine

**File:** `src/simulation/narrative/narrativeEngine.js`

**Responsibility:**
Pure transform: `NarrativeEvent[] → NarrativeOutput`. Maps event types (BIRTH, DEATH, RELATIONSHIP, STRUCTURE, ECOLOGY) to deterministic sentence builders. Derives world state metrics (births, deaths, violations, generation peak). Builds a tick summary string.

**Input / Output:**

```
Input:  NarrativeEvent[] { tick, type, actors, data, severity }
Output: NarrativeOutput { tick, summary, sentences[{text,type,severity}],
                          worldState, types }
```

**L3 Compatibility: Safe (with planned expansion)**

**Conflict Points:**

1. **Sentences are agent-neutral.** All sentences are written in third person from a god-view (`"Adam and Eve brought Cain into the world"`). Once agents have emotions and identity, the Perspective Engine should be able to request a first-person narrative of the same event. The engine itself doesn't need to change — but a new `SENTENCE_BUILDERS_FIRST_PERSON` set will be needed.

2. **No emotional weighting on severity.** Event `severity` drives sentence selection in the perspective engine but the narrative engine itself ignores severity when building the summary — all BIRTH events produce the same sentence regardless of emotional significance to any agent.

3. **No EMOTION or GOAL event types.** As the Emotion Engine and Goal Engine come online, new event types will be produced (`EMOTION_SPIKE`, `GOAL_FORMED`, `GOAL_ABANDONED`, etc.). SENTENCE_BUILDERS will need new entries.

**Migration Path:**

- No changes required for P0 build.
- When Emotion Engine (P0) goes live: add `EMOTION` type to `SENTENCE_BUILDERS` and `eventCollector.js`.
- When Goal Engine (P0) goes live: add `GOAL` type.
- First-person sentence builders are a P1 concern (tied to Perspective Engine expansion).

---

## 7. playerPerspectiveEngine

**File:** `src/simulation/perspective/playerPerspectiveEngine.js`

**Responsibility:**
Filters the world through one agent's eyes. Produces self-view (alive/dead, energy, life stage), nearby agents, degraded field labels, event perception (direct vs. distant), lineage awareness, energy-biased narrative, and a weighted uncertainty score.

**Input / Output:**

```
Input:  { tick, agentId, world, agents, events, lineageEngine, narrativeMemory }
Output: PlayerPerspective { tick, self, perceivedWorld, perceivedEvents,
                             perceivedLineage, narrativeBias, uncertainty }
```

**L3 Compatibility: Expansion Target**

**Conflict Points:**

1. **Bias is energy-only.** `biasNarrative()` modifies summaries based on `life.energy` — high energy amplifies, low energy dims. This is a placeholder for emotional bias. Once the Emotion Engine exists, the bias function should read `emotionState` (fear, trust, sadness, etc.) not just energy level. Current implementation will produce wrong coloring once emotions exist.

2. **No memory integration.** The perspective engine reads `narrativeMemory` (the world's narrative log) but has no access to the agent's own episodic memory. An agent should bias their world-view based on *their own past*, not just recent world events. This requires Memory Engine (P0).

3. **Self-view has no identity.** `buildSelfView()` returns `{ id, state, energy, lifeStage }`. There is no `values`, `personality`, `goals`, or `name` (self-concept). Identity Engine (P0) must feed into self-view.

4. **Proximity is index-based.** `_filterNearby()` uses array index distance as a spatial proxy. This is a known limitation. When a spatial model exists, this must be replaced.

5. **Perspective and perception subsystem overlap.** Both `playerPerspectiveEngine` and the `perception/` subsystem do subjective filtering. They need clear ownership once L3 is underway.

**Migration Path:**

- P0: When Emotion Engine exists, replace `biasNarrative()` energy-check with `emotionState` read.
- P0: When Memory Engine exists, add `perceivedMemory` field to output (agent's own episodic recalls relevant to current events).
- P0: When Identity Engine exists, extend `buildSelfView()` to include `identityProfile` fields.
- P1: Resolve overlap with perception subsystem — designate one as belief formation authority, the other as expression layer.

---

## 8. actionRegistry

**File:** `src/simulation/actionRegistry.js`

**Responsibility:**
Static allowlist of valid action IDs. Mirror of `AI/action_registry.json`. Any action not in the registry is rejected at the Execution Contract layer. Currently 21 actions: forage, rest, move, farm, gather_water, hunt, chop_wood, mine, forge, craft_item, cast_magic, channel_arcane, study_arcane, meditate, communicate, share_information, trade, teach, attack, defend, flee.

**Input / Output:**

```
Input:  none (static constant)
Output: ACTION_REGISTRY (frozen string[])
```

**L3 Compatibility: Safe (with anticipated additions)**

**Conflict Points:**

1. **No introspective or emotional actions.** The current registry covers biological and social survival. L3 agents will need actions that express interiority: `reflect`, `recall`, `express_emotion`, `form_goal`, `abandon_goal`, `seek_meaning`. These do not exist yet.

2. **Registry is a static mirror.** It must stay synchronized with `AI/action_registry.json`. Adding L3 actions requires updating both files simultaneously — the dual-source requirement is a process risk.

**Migration Path:**

- No changes required for P0 build. The four P0 engines (Memory, Emotion, Identity, Goal) are internal state systems that do not produce agent actions yet.
- When Goal Engine produces agentic intent, new action types will be needed. At that point: add to `AI/action_registry.json` first, then sync `actionRegistry.js`. Never the reverse.
- Consider a registry linting test that asserts `actionRegistry.js` equals `AI/action_registry.json` to prevent drift.

---

## Audit Summary

| Module | L3 Compatibility | Action Required |
|--------|-----------------|-----------------|
| intentPurity | Review Required | Expand identity guard allowlist; add emotion/memory score slots (zero-weighted) |
| perceptionSplit | Review Required | Persist beliefState across ticks; add emotional salience; wire identityProfile |
| decisionInspector | Safe | None |
| replayBuffer | Safe | Monitor frame size growth after L3 state lands |
| lineageEngine | Review Required | Stable through P0; expose adapter for Relationship Engine at P1 |
| narrativeEngine | Safe (expansion) | Add EMOTION + GOAL event types when engines are live |
| playerPerspectiveEngine | Expansion Target | Three wiring points: emotion bias, episodic memory, identity self-view |
| actionRegistry | Safe (expansion) | New action types needed at Goal Engine stage; enforce sync with AI registry |

---

## Pre-P0 Verdict

No existing module needs to be destroyed or rewritten before P0 begins.

Three modules need deliberate wiring plans to avoid breakage during P0 build:

1. **intentPurity** — identity guard boundary must be intentionally relaxed (not accidentally bypassed) when Identity Engine feeds the pipeline.
2. **perceptionSplit** — belief persistence must be introduced before emotional salience can be meaningful.
3. **playerPerspectiveEngine** — the energy-bias shortcut is load-bearing for tests; the replacement must be swapped atomically when Emotion Engine arrives.

Recommended P0 build order based on dependency depth:

```
Memory Engine      (no dependencies on other P0 modules)
  → Emotion Engine (reads memory)
    → Identity Engine (reads emotion history + memory)
      → Goal Engine (reads identity + emotion)
```
