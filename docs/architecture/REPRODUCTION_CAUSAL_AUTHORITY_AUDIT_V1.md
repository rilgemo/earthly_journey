# Reproduction System — Causal Authority Audit v1

**Authority:** AGENTS.md (sole authority)
**Date:** 2026-06-10
**Type:** Structural integrity verification — read-only, no runtime changes
**Scope:** src/simulation/reproduction/* + tickManager.js (integration edges only)

> This audit is not about correctness, bugs, or performance.
> It is about: **"Who has authority to make reality happen in the system?"**

---

## Executive Summary

| Invariant | Status | Severity of Deviation |
|---|---|---|
| 1. Authority Isolation | **PASS** | — |
| 2. Causal Direction | **PASS** | — |
| 3. Materialization Boundary | **PASS** | — |
| 4. Non-Selection Rule | **PARTIAL** | MEDIUM |
| 5. Trace Isolation | **PASS** | — |
| 6. Temporal Integrity | **PASS** | — |
| 7. Determinism | **PASS** | — |

**Overall verdict: PASS WITH MEDIUM RISK**

No hard failure conditions are triggered. One structural concern — probability-ordered top-K exclusion in the Event Engine — creates an implicit birth eligibility gate that belongs semantically to the non-selection boundary.

---

## 1. Authority Matrix

| Module | Declared Layer | Allowed Actions (Verified) | Forbidden Actions (Verified Absent) |
|---|---|---|---|
| `reproductionProbabilityField.js` | Reality | Read agents[], world; compute sigmoid field signals; emit frozen pair vectors | Select partners; create offspring; mutate state; generate intent |
| `reproductionEventEngine.js` | Reality boundary | Read frozen field vectors; apply probability threshold; apply top-K; emit frozen proposals | Create agents; mutate state; act on outcomes; determine birth success |
| `reproductionCommitmentBoundary.js` | Reality/Observation boundary | Read frozen proposals and field; classify viability (alive + adult + not pendingDeath); emit frozen report | Create agents; mutate world; determine birth outcomes; enforce coupling |
| `birthSystem.js` | Execution (via tickManager) | Read eligibleCandidates; verify post-death survival; create newborn objects; return births | Push to population (tickManager owns this); modify existing agents; run probability or ranking logic |
| `birthConsistencyContract.js` | Observation | Read births, previousTickState, currentAgents; emit frozen validation report | Modify births; modify agents; block simulation; influence execution |
| `tickManager.js` (hooks only) | Execution authority | Call each reproduction module in order; write all outputs to traceCollector; push newborns to npcs | Bypass any layer; allow back-channel data flows |

**Import dependency audit:**

```
reproductionProbabilityField.js  → conditionCapacityModel (Reality)  ✓
reproductionEventEngine.js       → (no imports)                       ✓
reproductionCommitmentBoundary.js → (no imports)                      ✓
birthSystem.js                   → conditionCapacityModel (Reality)   ✓
birthConsistencyContract.js      → createConditionCapacity (unused)   ⚠ F-01
```

No module imports from Decision Layer, Observation Layer, or UI code.

---

## 2. Causal Graph Verification

### 2.1 Data Flow Map

```
tickManager
 │
 ├─[A]─► computeReproductionProbabilityField(npcs, worldObj)
 │           reads: agent.life, agent.biology, agent.memory,
 │                  agent.location, world.demandIndex, world.resourceMap
 │           writes: NONE
 │           output: frozen ReproductionFieldResult[]
 │
 ├──────► [resource flow, field dynamics, emergence, stability — world mutations]
 ├──────► [identity post-processing]
 │
 ├─[B]─► runReproductionEventEngine(tick, npcs, reproductionField, worldObj)
 │           reads: reproductionField (frozen), agent.life,
 │                  agent._pendingDeath, world.lastStabilityTrace
 │           writes: NONE
 │           output: frozen ReproductionEvent[]
 │
 ├─[C]─► evaluateCommitmentBoundary(tick, proposals, reproductionField, npcs, worldObj)
 │           reads: proposals (frozen), reproductionField (frozen),
 │                  agent.life, agent._pendingDeath, world.lastStabilityTrace
 │           writes: NONE
 │           output: frozen reproductionCommitmentReport
 │
 ├──────► finalizePendingDeaths(npcs, worldObj)
 │           writes: npcs array (remove dead), worldObj.resourceEntries
 │
 ├─[D]─► runBirthSystem(commitmentReport, npcs, worldObj)
 │           reads: commitmentReport.eligibleCandidates (frozen),
 │                  agent.id (survivingAgentIndex), agent.location
 │           writes: NONE (births returned, not pushed)
 │           output: frozen { births[], rejectedCommitments[], tick }
 │
 ├──────► npcs.push(newborn) per birth  [tickManager — Execution authority]
 │           writes: npcs population array
 │
 ├─[E]─► evaluateBirthConsistencyContract(tick, births, prevSnapshot, npcs, ...)
 │           reads: births (frozen), id-only prevSnapshot, npcs
 │           writes: NONE
 │           output: frozen birthConsistencyReport
 │
 └──────► traceCollector.endTick()
```

### 2.2 Cycle Detection

Examining all edges for reverse influence:

| Edge | Direction | Reverse possible? |
|---|---|---|
| A → B (field → proposals) | forward | B reads A output. A does not read B output. ✓ |
| B → C (proposals → report) | forward | C reads B output. B does not read C output. ✓ |
| C → D (report → births) | forward | D reads C output. C does not read D output. ✓ |
| D → npcs (births → population) | forward | npcs is an input to A, B, C — but this is the `npcs` snapshot at the **next** tick invocation. ✓ |
| E → anything | none | E reads births and agents; emits to traceCollector only. ✓ |
| traceCollector → any reproduction module | none | No reproduction module reads traceCollector. ✓ |
| worldObj.lastStabilityTrace → B, C | forward input | Stability state is written by the stability controller (before B), then read by B and C. Not a reproduction cycle. ✓ |

**No cycles detected. The causal graph is a strict DAG.**

```
A ──► B ──► C ──► D ──► [npcs mutation] ──► E(observer)
                                              │
                                              └──► traceCollector (terminal)
```

---

## 3. Invariant Verification

---

### Invariant 1 — Authority Isolation

**Claim:** No reproduction module selects agents for reproduction, determines birth outcomes, mutates world state outside birthSystem, or influences tick order.

**Verification:**

**Selection authority** — Does any module choose specific agents as reproductive participants?

- `reproductionProbabilityField.js`: Evaluates all pairs. Does not select. Emits all pair results. ✓
- `reproductionEventEngine.js`: Applies threshold and top-K. Reduces probability space but does not execute births. Produces proposals, not selections. See Invariant 4 for nuance.
- `reproductionCommitmentBoundary.js`: Classifies viability (alive + adult + not pendingDeath). Does not choose between viable agents. ✓
- `birthSystem.js`: Iterates eligible candidates in order. Applies post-death survival check. Creates one newborn per surviving pair. Does not rank or pick among eligible pairs. ✓
- `birthConsistencyContract.js`: Observer only. ✓

**Birth outcome authority** — Does any module decide whether a birth succeeds?

- Only `birthSystem.js` creates newborn objects. Outcome is deterministic: eligible pair whose participants survived death cleanup → newborn materialized. No probability is consulted. ✓

**World state mutation** — Does any module write to world state outside tickManager-owned writes?

- All `worldObj.*` writes in the reproduction path are performed by `tickManager` (lines 566, 453, 542, 553, 568, 584). No reproduction module writes to `worldObj` directly. ✓

**Tick order influence** — Does any reproduction module change execution ordering?

- All modules are pure functions called sequentially by tickManager. None register callbacks, modify the agent loop, or alter tick structure. ✓

**Verdict: PASS**

---

### Invariant 2 — Causal Direction

**Claim:** Data flows only forward along `A → B → C → D → E`. No reverse influence exists.

**Verification:** See Causal Graph §2.2 above. No cycles found. No backward edges detected.

The one structural observation: `npcs` (the live agent array) is passed into modules B, C, and D as a read input. After births are appended (post-D), the mutated `npcs` array becomes input to the NEXT tick's A invocation. This is correct tick-boundary behavior — a new tick is a new causal chain, not a cycle within the current tick.

**Verdict: PASS**

---

### Invariant 3 — Materialization Boundary

**Claim:** Only `birthSystem.js` creates new agents, only `tickManager` appends to population, and the Commitment Boundary instantiates nothing.

**Verification:**

**Agent creation:**

```
grep: materializeNewborn()  →  birthSystem.js:23 only
grep: new agent object {}   →  birthSystem.js:28 only
```

No other reproduction module constructs an agent-shaped object.

**Population mutation:**

```
grep: npcs.push(newborn)    →  tickManager.js:566 only
grep: npcs.splice           →  tickManager.js:103 (finalizePendingDeaths, not reproduction)
```

`runBirthSystem` returns a frozen `births[]` array. It does not push to `npcs`. The push is tickManager's exclusive act.

**Commitment boundary instantiation:**

`evaluateCommitmentBoundary` creates only `CommitmentCandidate` descriptor objects — frozen metadata structures. These are not agents, not world state, and not population entries. They are report data.

**Verdict: PASS**

---

### Invariant 4 — Non-Selection Rule

**Claim:** EventEngine and CommitmentBoundary must not filter based on outcome desirability, enforce survival decisions, or act as selection filters.

**Verification:**

#### 4A — REE Probability Threshold (Lines 49, 54–55)

```js
const threshold = computeDynamicThreshold(agents, world);
// ...
if (probability < threshold) continue;
```

The dynamic threshold gates which pairs become proposals. Pairs below threshold are never emitted and can never be born. The threshold is computed from population pressure, fertility pressure, and stability — all physics-layer environmental signals. It functions as a signal discriminator: "is this field signal strong enough to constitute a proposal?"

**Assessment:** Acceptable Reality Layer gate. The threshold is not agent-specific or desirability-specific — it is a global environmental cutoff. This is structurally equivalent to a quantum field producing no observable event below measurement threshold. **Not a selection filter.**

#### 4B — REE Top-K Probability-Ordered Exclusion (Lines 70–71)

```js
candidates.sort((a, b) => b.probability - a.probability || a.otherId.localeCompare(b.otherId));
const topK = candidates.slice(0, TOP_K_CANDIDATES);  // TOP_K_CANDIDATES = 3
```

For each agent, this:
1. Ranks all surviving-threshold candidate partners by `pairAttractor` descending
2. Discards all partners ranked 4th or lower

Partners excluded by top-K cannot enter the commitment report and cannot be born.

This constitutes **probability-ordered exclusion from birth eligibility**. It is a filter ordered by outcome desirability (`pairAttractor` = reproductive attraction signal). Pairs with lower attraction are permanently excluded for this tick regardless of whether they meet viability criteria.

This deviates from the Non-Selection Rule's prohibition on "filter based on outcome desirability."

**The distinction from Invariant 4A:** The threshold gate uses a physics-grounded universal cutoff. The top-K cut uses a per-agent relative ranking — it is explicitly comparative and desirability-ordered. A pair that is above threshold for both agents can still be excluded if one agent has three stronger alternatives.

**Assessment:** The top-K mechanism is a pre-birth eligibility filter ordered by pairAttractor probability. This meets the definition of "act as selection filters" in the Non-Selection Rule.

**Severity: MEDIUM — Semantic leakage.** The REE reduces the probability space in a way that is ordered by reproductive desirability, not by a neutral structural criterion. No birth directly results from top-K selection, and the birth system applies its own independent gate. The filter is not winner-takes-all. However, it does restrict who can be born based on relative probability rank.

#### 4C — CommitmentBoundary Viability Filter (Lines 123–124)

```js
const allViable = participants.every(id => viabilityIndex.get(id) === true);
const eligibilityStatus = allViable ? 'eligible' : 'suppressed';
```

Viability index requires: `agent.life?.alive !== false && !agent._pendingDeath && agent.life?.lifeStage === 'adult'`.

**Assessment:** This is a biological precondition check, not a desirability-ordered filter. An agent being alive and adult is a structural reality constraint, not a preference ranking. Dead or juvenile agents cannot contribute to reproduction — this is a physics rule, not a selection preference. The filter does not choose among viable agents; it only excludes structurally ineligible ones. **Not a selection filter.**

**Verdict: PARTIAL — top-K in REE is probability-ordered exclusion (MEDIUM)**

---

### Invariant 5 — Trace Isolation

**Claim:** All intermediate reproduction outputs are trace-only, read-only, non-causal, and non-consumable by future ticks.

**Verification:**

**Intermediate output persistence on worldObj:**

```
worldObj.reproductionField      → NOT written (only in traceCollector)
worldObj.reproductionEvents     → NOT written (only in traceCollector)
worldObj.reproductionCommitment → NOT written (only in traceCollector)
worldObj.lineageGraph           → read at tickManager:580, NEVER written by reproduction
```

No reproduction intermediate output is stored on `worldObj` where future ticks could read it.

**traceCollector consumption across ticks:**

```
traceCollector.current.reproductionField      → trace terminal
traceCollector.current.reproductionEvents     → trace terminal
traceCollector.current.reproductionCommitment → trace terminal
traceCollector.current.birthSystem            → trace terminal
traceCollector.current.birthConsistency       → trace terminal
```

No reproduction module reads from `traceCollector`. No future tick logic reads from `traceCollector.current.*` — each tick begins a new `traceCollector.beginTick()` cycle.

**commitmentReport and proposals scope:**

Both exist as local variables within the `tickManager` function body. They are not stored on `worldObj`, not assigned to module-level state, and not accessible after `tickManager` returns.

**Verdict: PASS**

---

### Invariant 6 — Temporal Integrity

**Claim:** `birthTick === currentTick` for all births, and newborns do not appear in the current tick agent loop.

**Verification:**

**birthTick correctness:**

```js
// birthSystem.js:60
const tick = world.tick;

// birthSystem.js:32–33
life: {
  birthTick: tick,
  ageTicks: 0,
  ...
}
```

`world.tick` is incremented by tickManager at line 418 (`worldObj.tick = (worldObj.tick || 0) + 1`) before any reproduction module runs. The birth system receives this already-incremented tick value. `birthTick === currentTick` is structurally guaranteed. ✓

**Newborn exclusion from current tick loop:**

```
tickManager agent loop:  lines 435–449   (simulateAgent for each npc)
reproductionField:       line 451        (after loop)
runBirthSystem:          line 565        (after loop, after finalizePendingDeaths)
npcs.push(newborn):      line 566        (after loop — newborn enters npcs array here)
```

Newborns are pushed to `npcs` at line 566. The `simulateAgent` loop completed at line 449. No newborn participates in the current tick's decision cycle. ✓

**Verdict: PASS**

---

### Invariant 7 — Determinism

**Claim:** Same input state must produce identical outputs at every stage.

**Verification:**

| Stage | Determinism mechanism |
|---|---|
| `reproductionProbabilityField` | Input agents sorted by `String(id).localeCompare` before processing (line 97); sigmoid is deterministic; outputs frozen |
| `reproductionEventEngine` | Threshold computed deterministically from stable inputs; top-K sort uses `b.probability - a.probability \|\| a.otherId.localeCompare(b.otherId)` (stable tiebreak); final sort is `b.probability - a.probability \|\| a.parents[0].localeCompare(b.parents[0])` |
| `evaluateCommitmentBoundary` | Iterates proposals in the order received (already deterministically ordered); viability index keyed by agent ID; all sorts are ID-based |
| `runBirthSystem` | Iterates eligibleCandidates in order; `buildNewbornId` is `tick:sorted(participants).join(':')`; `emittedIds` Set prevents duplicates |
| `evaluateBirthConsistencyContract` | Pure function; violation arrays accumulated in deterministic order |

No `Math.random()`, `Date.now()`, or unordered Map/Set iteration over non-ID keys exists in any reproduction module.

**Verdict: PASS**

---

## 4. Hidden Selection Channel Scan

### 4.1 Top-K Influencing Births

**Finding: CONFIRMED**

Path: `REE.top-K` → `CommitmentBoundary.eligibleCandidates` → `BirthSystem.births`

Any agent pair excluded by top-K (ranked 4th or lower per agent) is absent from `proposals`, absent from `eligibleCandidates`, and cannot be materialized as a newborn. The top-K cut is directly upstream of birth materialization.

**Severity: MEDIUM**

The mechanism is not winner-takes-all (multiple pairs per agent can be born), and the birth system applies its own independent gate. But the probability-ordered exclusion is a structural birth eligibility filter.

### 4.2 rankMetadata Reused as Authority

**Finding: ABSENT**

`rankMetadata` is generated in the Commitment Boundary (lines 115–119) and attached to each `CommitmentCandidate`. In `birthSystem.js`, the iteration over `eligibleCandidates` reads only `candidate.participants` and `candidate.proposalId` — never `candidate.rankMetadata`. The rank is correctly confined to trace.

```js
// birthSystem.js:81–100 — only reads:
candidate.participants  (for ID and location lookup)
candidate.proposalId    (for rejection record)
```

**Verdict: CLEAN**

### 4.3 Probability Vector Used Outside Trace

**Finding: PARTIAL**

`pairAttractor` is used in two non-trace contexts inside the REE:
1. **Threshold gate** (line 55): `if (probability < threshold) continue` — determines proposal eligibility
2. **Top-K ranking** (line 70): `candidates.sort((a, b) => b.probability - a.probability ...)` — determines exclusion order

After proposals leave the REE, the `probabilityVector` is carried forward through the Commitment Boundary into the commitmentReport as informational metadata. In `birthSystem.js`, the `probabilityVector` is **not read at all** — births are materialized from participant IDs only.

In `birthConsistencyContract.js`, the `probabilityVector` is **not read** — the contract validates structural schema, not probability values.

**Assessment:** Probability is used authoritatively inside the REE for threshold filtering and top-K ranking. It is correctly trace-only from the Commitment Boundary onward. The threshold use is acceptable (physics gate); the top-K use is the MEDIUM finding identified in §4.1.

---

## 5. Cross-Tick Leakage Scan

### 5.1 Agent Mutation During birthSystem

**Finding: ABSENT**

`birthSystem.js` builds a `survivingAgentIndex` Map (line 75) holding live agent references. The only agent read from this Map is `agent.location` (line 18 in `resolveNewbornLocation`). No field is written to any agent in the Map.

`materializeNewborn` constructs a fresh object using `createConditionCapacity()`, fixed literals, and the derived `location` value. It does not mutate any existing agent.

**Verdict: CLEAN**

### 5.2 Trace Influencing Next Tick Decisions

**Finding: ABSENT**

All reproduction trace outputs (`reproductionField`, `reproductionEvents`, `reproductionCommitment`, `birthSystem`, `birthConsistency`) are written to `traceCollector.current.*`. No reproduction module reads from `traceCollector`. The intent pipeline, decision scorer, memory system, and demand system do not read these trace fields. Verified by searching all imports and consumption points.

**Verdict: CLEAN**

### 5.3 Persistence of Intermediate Proposal Objects

**Finding: ABSENT**

`reproductionField`, `proposals`, and `commitmentReport` are local variables inside the `tickManager` function. They are not assigned to:
- `worldObj.*` (verified: no reproduction variable written to worldObj except via traceCollector)
- module-level state (all reproduction modules are stateless)
- agent fields (no agent acquires a proposal reference)

`worldObj.lineageGraph` is referenced at tickManager:580 as a pass-through input to the consistency contract. It is `null` in all current runs — no lineage graph is written by any reproduction module.

**Verdict: CLEAN**

---

## 6. Materialization Isolation Check

### 6.1 Only birthSystem Writes Agent Creation

**Verified:** `materializeNewborn()` is the sole agent-construction function in the reproduction pipeline. It exists exclusively in `birthSystem.js`. No other module produces an agent-shaped object with `id`, `life`, `biology`, `lineage`, `infantDependency`.

### 6.2 No Other Module Calls Population Mutation

**Verified:** `npcs.push(newborn)` appears at `tickManager.js:566` only. `birthSystem.js` returns a frozen `births[]` array and performs no push. The Commitment Boundary, Event Engine, and RPF perform zero writes to `npcs`.

### 6.3 Commitment Layer Does Not Instantiate Anything

**Verified:** `evaluateCommitmentBoundary` creates only `CommitmentCandidate` descriptor objects — frozen metadata structures for the report. These contain no agent identity, no lifecycle state, and no lineage facts. They are not agents and cannot be mistaken for agents by any downstream consumer.

---

## 7. Hard Failure Condition Check

| Condition | Status | Evidence |
|---|---|---|
| Selection logic outside EventEngine | **ABSENT** | CommitmentBoundary and BirthSystem use structural preconditions only |
| Birth creation outside birthSystem | **ABSENT** | `materializeNewborn` in birthSystem.js exclusively |
| Cross-layer agent mutation | **ABSENT** | No agent field written by any non-tickManager code in the pipeline |
| Probability used as decision authority | **CONDITIONAL** | `pairAttractor` used in REE threshold gate (acceptable) and top-K rank (MEDIUM) |
| Tick-order reordering by reproduction modules | **ABSENT** | All modules are pure functions; tickManager controls ordering |

**No hard failure conditions triggered.**

---

## 8. Violation Register

| ID | Location | Finding | Classification | Risk Level |
|---|---|---|---|---|
| V-01 | `reproductionEventEngine.js:70–71` | top-K sorts by `pairAttractor` descending and excludes rank 4+ pairs; probability-ordered birth eligibility gate upstream of materialization | Non-Selection Rule — "filter based on outcome desirability" | **MEDIUM — Semantic leakage** |
| V-02 | `birthConsistencyContract.js:6` | `createConditionCapacity` imported and never called | Dead import | **LOW — Trace noise** |
| V-03 | `reproductionCommitmentBoundary.js:94–100` | `contextFactors.dominantMode` derived from `proposals[0].mode` only; shared across all candidates | Per-candidate field carries tick-level summary value | **LOW — Semantic inaccuracy** |
| V-04 | `reproductionEventEngine.js` and `reproductionCommitmentBoundary.js` | `computePopulationPressure`, `computeFertilityPressure`, `computeStabilityModifier` independently implemented in both modules | Signal computation duplication | **LOW — Maintenance drift risk** |
| V-05 | `tickManager.js:564` | `previousTickAgentSnapshot` named and positioned as if prior-tick, but is captured post-`finalizePendingDeaths` within the current tick | Naming semantic inversion | **LOW — Trace noise** |
| V-06 | `birthSystem.js:75` | `survivingAgentIndex` Map holds live mutable agent references; `materializeNewborn` reads `agent.location` through it | Mutable reference held in pure function — safe now, latent mutation risk | **LOW — Latent authority leakage** |
| V-07 | `birthConsistencyContract.js:200` | `agent.id.startsWith('newborn:')` used to identify and skip newborns during cross-tick mutation check | String prefix heuristic for structural identity | **LOW — Fragile observation rule** |
| V-08 | `tickManager.js:528–543` | REE and CommitmentBoundary run after identity post-processing, contrary to the spec diagram in REPRODUCTION_COMMITMENT_BOUNDARY_V1.md | Spec deviation with no practical effect | **LOW — Documentation drift** |

---

## 9. V-01 Deep Analysis — The Top-K Authority Question

V-01 is the only MEDIUM-severity finding and warrants full analysis.

**The mechanism:**

```js
// reproductionEventEngine.js:70–71
candidates.sort((a, b) => b.probability - a.probability || a.otherId.localeCompare(b.otherId));
const topK = candidates.slice(0, TOP_K_CANDIDATES);  // TOP_K_CANDIDATES = 3
```

For each agent, all above-threshold candidate partners are ranked by `pairAttractor` descending. Only the top 3 proceed. The rest are permanently absent from the proposal set for this tick.

**Why this qualifies as semantic leakage:**

The Non-Selection Rule prohibits "filter based on outcome desirability." `pairAttractor` is an outcome-desirability signal — it encodes how strongly two agents are drawn toward reproductive contact. Sorting by it and cutting at rank 4 is filtering by desirability rank, not by a neutral structural criterion.

**Why this does NOT constitute a hard failure:**

1. The cut is not winner-takes-all. All top-3 pairs per agent can be born.
2. The birth system applies its own independent survival gate.
3. The excluded pairs were above the physics threshold — they are not biologically ineligible, only outcompeted by stronger signals.
4. No single pair is "chosen"; the REE produces a proposal set, not a selection.

**The constitutional risk:**

When Birth System v2 is designed, if it adopts the commitment report's eligible set as exhaustive (i.e., assumes all biologically valid pairs are present), it will silently miss the pairs excluded by top-K. The top-K cut will appear to be a neutral structural limit but is in fact a probability-ordered birth eligibility gate.

**Resolution path (not implemented here):**

The REPRODUCTION_COMMITMENT_BOUNDARY_V1.md (DFM-02) anticipated this. The resolution at Birth System v2 design time: the birth system must apply its own independent viability gate rather than treating the eligible set as exhaustively representing all viable pairs. This is already documented as a design constraint.

---

## 10. Constitutional Compliance Table

| AGENTS.md Rule | Compliance |
|---|---|
| Only Execution Layer may mutate world state | ✓ — all writes owned by tickManager |
| Decision Layer may only produce intent, never execution | ✓ — no Decision Layer involvement in reproduction pipeline |
| Observation Layer may only interpret, never influence | ✓ — birthConsistencyContract is pure observer, output is terminal |
| Emergence layers are descriptive only, never feed back into causality | ✓ — no emergence output read by any reproduction module |
| tickManager is the sole execution authority | ✓ — population mutation exclusively at tickManager:566 |
| Simulation must remain deterministic | ✓ — all sort orders are stable; no randomness |
| Causality is one-directional | ✓ — strict DAG, no cycles |
| Non-referential across observation boundaries | ✓ — no reproduction output consumed by non-observer systems |

---

## 11. Risk Summary by Classification

**CRITICAL (causal break) — 0 findings**

No module bypasses the causal chain. No birth occurs outside birthSystem. No reverse causal edge exists.

**HIGH (authority drift) — 0 findings**

No module acquires authority it is not permitted to hold. Selection authority remains in birthSystem (structural gate). Population mutation authority remains in tickManager.

**MEDIUM (semantic leakage) — 1 finding**

V-01: REE top-K sorts eligible candidates by pairAttractor and excludes lower-ranked pairs from birth eligibility. This is a probability-ordered filter on birth space that lies in the grey zone between "structural reduction" and "selection filter." The mechanism is contained within the REE, does not produce a single winner, and is downstream-gated by the birth system's independent check. The risk is semantic, not causal.

**LOW (trace noise / latent risk) — 7 findings**

V-02 through V-08: Dead import, naming inaccuracies, signal duplication, mutable reference in pure function, observation heuristic fragility, documentation drift. None constitute active causal violations.

---

*Structural integrity verification only. No runtime changes. No refactoring. Sole authority: AGENTS.md.*
