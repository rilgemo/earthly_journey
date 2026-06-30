# Reproduction Semantic Integrity Audit v1

**Date:** 2026-06-09
**Authority:** AGENTS.md (sole authority)
**Scope:** Life Continuity → Reproduction Probability Field v2 → Reproduction Event Engine v1
**Type:** Constitutional read-only audit — no runtime changes

---

## 1. Authority Map

The following authority assignments are audited against AGENTS.md causal layer doctrine.

| Module | Declared Layer | Actual Authority |
|---|---|---|
| `conditionCapacityModel.js` | Reality Layer | Field evaluation only — computes dimension signals, no state mutation |
| `reproductionProbabilityField.js` | Reality Layer | Field computation only — produces frozen probability vectors, no decisions |
| `reproductionEventEngine.js` | Reality / Observation boundary | Collapses field into proposals, no execution, no mutation |
| `tickManager.js` (RPF call, line 448) | Execution Layer | Reads field output, writes to trace only |
| `tickManager.js` (REE call, line 532) | Execution Layer | Reads proposals, writes to trace only |
| `tickManager.js` (finalizePendingDeaths) | Execution Layer | Sole population mutation authority — correct |

**No authority violations detected in the current module set.**

---

## 2. Semantic Boundary Map

### 2.1 reproductionProbabilityField.js

**Boundary:** Reality Layer — field evaluation only.

Inputs consumed (read-only):
- `agent.life` (alive, lifeStage)
- `agent.biology` (via conditionCapacityModel — dimension signals)
- `agent.memory` (bond signal extraction)
- `agent.location`, `world.resourceMap`, `world.demandIndex`

Outputs emitted:
- Frozen `ReproductionFieldResult[]` containing: `pair`, `probabilityVector`, `components`, `combinedField`

Outputs **not** emitted:
- No partner selection
- No offspring schema
- No lineage reference
- No relationship record
- No agent identifier assignment

**Boundary holds.**

---

### 2.2 reproductionEventEngine.js

**Boundary:** Reality → Observation transition — collapses field probability into proposals.

Inputs consumed (read-only):
- `tick` (number)
- `agents[]` (read-only — used only for population/fertility pressure calculation)
- `reproductionField` (frozen RPF output — read-only)
- `world` (read-only — `lastStabilityTrace.metrics.compositeStability` only)

Outputs emitted:
- Frozen `ReproductionEvent[]` with: `tick`, `parents`, `probability`, `confidence`, `mode`, `status: "proposed"`

Outputs **not** emitted:
- No newborn schema
- No lineage record
- No pregnancy state
- No relationship persistence
- No agent mutation

**Boundary holds.**

---

### 2.3 tickManager.js integration points

**Insertion order verified against LIFE_CONTINUITY_CAUSAL_INTEGRATION_V1.md:**

```
identity post-processing (line 526)   ← identity restored
→ runReproductionEventEngine (line 532) ← proposals generated
→ finalizePendingDeaths (line 542)    ← population mutation
```

This ordering is correct per the LIFE_CONTINUITY contract:

> "collect explicit reproduction outcomes → complete existing world phases → restore identity metadata → finalize deaths → commit births"

The engine runs after identity restoration and before death cleanup, which is architecturally safe. Proposals are written to `traceCollector.current.reproductionEvents` only — no world state write, no agent mutation.

**Boundary holds.**

---

## 3. Audit Questions — Detailed Findings

---

### Question 1: Has probability become authority?

**Finding: NO.**

`reproductionProbabilityField.js` computes three attractor values per pair:
- `pairAttractor` — sigmoid of combined field score
- `groupAttractor` — sigmoid with structure bonus and bond dampening
- `independentAttractor` — sigmoid of negative combined field

These are continuous probability expressions derived from environmental and relational signals. They do not:
- select a partner
- create an offspring
- enforce a relationship
- guarantee any outcome

The field is frozen on emission (`Object.freeze(results)`). No module downstream can mutate it.

**Verdict: Probability is not authority. PASS.**

---

### Question 2: Has proposal become execution?

**Finding: NO.**

`reproductionEventEngine.js` emits proposals with `status: "proposed"`. No proposal:
- creates an agent
- modifies `agent.*` fields
- modifies `world.*` fields
- writes lineage data
- triggers a birth callback
- survives past the current tick as declared state

The output is written only to `traceCollector.current.reproductionEvents` — a trace sink. No downstream consumer exists in the current codebase that reads this as an execution trigger.

The engine is a pure function: `({ tick, agents, reproductionField, world }) → { proposals }`. It holds no module-level state, no closures, no queues.

**Verdict: Proposal is not execution. PASS.**

---

### Question 3: Has biological implementation leaked into reproduction semantics?

**Finding: NO — with one minor observation worth tracking.**

The reproduction pipeline is fully role-neutral. No module uses:
- male / female
- father / mother
- husband / wife
- reproductive role labels

Parents are identified only as `parentA / parentB` (in the field as `pair: [idA, idB]`) or `parents: [idA, idB]` in proposals. The pair is sorted lexicographically by agent ID at the field level, making it a stable unordered set, not a role assignment.

`biologicalField()` evaluates `lifeStage === 'adult'` and Condition/Capacity signals — these are biological eligibility conditions, not reproductive role definitions.

**Minor observation:** The term `biologicalField` in RPF is a local function name. It encodes biological viability as a numeric field component. This is architecturally correct — it is Reality Layer input, not biological role authority. No leak detected, but the name could be confused with the broader biological model in future audits. Not a current violation.

**Verdict: No biological role leakage. PASS.**

---

### Question 4: Has coupling become relationship authority?

**Finding: NO.**

Proposals are transient, tick-scoped, and emitted without persistence:

- No proposal writes to `agent.relationships`, `agent.bonds`, or any relationship field.
- No proposal creates a bond record.
- Proposals do not persist across tick boundaries — they exist in trace only.
- `bondField()` in RPF reads existing memory to derive a bidirectional signal, but does not write back to memory. The read is one-directional and non-destructive.

`mode: "pair" | "asymmetric" | "cluster" | "suppression"` describes the attractor geometry at proposal time. It does not create a lasting relationship category or couple-ownership record.

**Verdict: Coupling has not become relationship authority. PASS.**

---

### Question 5: Has selection become authority?

**Finding: CONDITIONAL PASS — mechanism is sound but warrants a documented boundary note.**

The engine applies two selection mechanisms:

1. **Dynamic threshold filtering:** pairs below `computeDynamicThreshold()` are excluded. The threshold is derived from population pressure, fertility pressure, and stability modifier. This reduces the probability space — it does not choose a specific outcome.

2. **Top-K competition:** per agent, the top 3 candidate partners by `pairAttractor` are kept. Candidates beyond top-K are dropped.

The concern here is whether top-K constitutes authority rather than probability reduction.

**Analysis:**

Top-K does reduce candidates to a subset, but:
- It does not create a birth. Proposals are still only proposals.
- Birth authority remains entirely absent from the current system.
- The ranked subset is not acted on — nothing downstream consumes `reproductionEvents` as an execution trigger.
- The ranking uses a deterministic comparator (probability descending, then lexicographic ID), making it order-stable and reproducible.

Top-K functions as a **trace-space filter**, not an execution selector. It limits which pairs are recorded as proposals, not which births occur.

**Risk level: LOW.** When Birth System v1 is introduced, this boundary will need re-examination. If the birth system takes proposals as direct input and materializes births for every proposal, top-K will have become de facto selection authority. That transition requires an explicit constitutional note at birth system design time.

**Verdict: Selection is not yet authority. CONDITIONAL PASS. See risk register.**

---

### Question 6: Has future birth logic already leaked into current reproduction systems?

**Finding: NO.**

A full grep of reproduction modules confirms no birth-adjacent logic:

- No `agent.push()` or population append
- No `newborn`, `infant`, `child` construction
- No lineage record creation
- No `birthTick` assignment outside the existing lifecycle kernel
- No `_pendingBirth` flag analogous to `_pendingDeath`
- No birth callback registration

The only birth-adjacent document is `LIFE_CONTINUITY_CAUSAL_INTEGRATION_V1.md`, which defines the future birth commit boundary as belonging to `tickManager` after `finalizePendingDeaths`. This is a specification document, not leaked implementation.

**Verdict: No birth authority leakage. PASS.**

---

### Question 7: Does the current reproduction architecture support continuity without becoming continuity itself?

**Finding: YES — with a structural note on the continuity contract.**

Earthly's continuity principles (per AGENTS.md and LIFE_CONTINUITY contract) require:

| Principle | Current Status |
|---|---|
| Individuals are not continuity | PASS — agents are mortal, proposals are transient |
| Lineage is fact | DEFERRED — no lineage system exists yet; no violation |
| Influence continues | DEFERRED — no inheritance system; no violation |
| Memory does not continue | PASS — no memory is transferred by current modules |
| Death remains meaningful | PASS — death is mark-then-commit via `_pendingDeath`; reproduction proposals do not bypass it |
| Life may pursue continuation | PASS — reproduction is modeled as ecological pressure, not guaranteed behavior |
| Continuity must emerge from interactions | PASS — bond signals are derived from memory of past interactions, not imposed externally |

The reproduction pipeline does not assume continuity. It evaluates ecological conditions and social signals, and emits proposals that describe where continuity *might* emerge — but does not enact it.

**Verdict: Architecture supports continuity without becoming it. PASS.**

---

## 4. Risk Register

| ID | Description | Severity | Location | Trigger Condition |
|---|---|---|---|---|
| R-01 | Top-K candidate selection becomes de facto birth selection when Birth System v1 consumes proposals | LOW (latent) | `reproductionEventEngine.js:71` | Birth system naively iterates all proposals without independent viability check |
| R-02 | `pairAttractor` is used as the sole probability signal for thresholding; other attractor types (`groupAttractor`, `independentAttractor`) are not currently used for filtering | LOW | `reproductionEventEngine.js:54` | If group or cluster reproduction modes are added, pairAttractor-only threshold may misrepresent group viability |
| R-03 | `world.lastStabilityTrace` read is an undeclared dependency — if stability trace is absent, modifier silently returns 0, which may bias threshold downward in unstable world states | LOW | `reproductionEventEngine.js:18–21` | Missing stability trace in test worlds or early-tick states |
| R-04 | `computeFertilityPressure` reads `lifeStage === 'adult'` directly, coupling to the life stage vocabulary — if life stages change (e.g., `mature`, `reproductive`), the engine silently breaks | LOW | `reproductionEventEngine.js:10` | Life stage terminology migration |
| R-05 | `mode: "suppression"` is emitted as a proposal type — if a future birth system interprets suppression proposals as signal to block other births (rather than simply describing the field state), it could introduce causal feedback from observation into execution | LOW (latent) | `reproductionEventEngine.js:32` | Birth system reads mode as authority rather than description |

---

## 5. Constitutional Verdict

```
PASS WITH RISKS
```

### Summary

The reproduction pipeline correctly implements a three-layer causal stack:

```
conditionCapacityModel  →  Reality Layer signal evaluation
reproductionProbabilityField  →  Reality Layer field computation
reproductionEventEngine  →  Proposal emission only (no execution)
tickManager integration  →  Trace sink only (no population mutation)
```

All causal boundaries are respected. No birth authority exists. No mutation occurs. No role semantics have been introduced. The system is deterministic, frozen at output, and has no module-level state.

The five flagged risks are all latent — they describe conditions that could arise when Birth System v1 is designed, not violations present in the current implementation. They are documented for that future design pass.

### Risks to resolve before Birth System v1

1. **R-01 (top-K → selection authority):** Birth system must apply its own viability gate rather than treating every proposal as a birth mandate.
2. **R-05 (suppression mode → causal feedback):** Birth system must treat `mode` as a descriptive label, not a birth-control authority.
3. **R-02 (group attractor unused):** If cluster/group modes are ever executed, the threshold function must be expanded.

### No refactor required for current state.

The current reproduction architecture is safe to extend into Birth System v1 provided the risks in this register are explicitly reviewed at that design boundary.

---

*Audit performed 2026-06-09. Sole authority: AGENTS.md.*
