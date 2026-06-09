# Reproduction Commitment Boundary v1

**Authority:** AGENTS.md (sole authority)
**Date:** 2026-06-09
**Status:** Architectural constitution — no runtime implementation
**Scope:** Causal firewall between Reproduction Event Engine and future Birth System v1

---

## Purpose

This document defines a hard causal separation between reproductive proposal
generation and reproductive outcome commitment.

It establishes the Reproduction Commitment Boundary as a required structural
layer that all reproduction data must cross before any birth authority may act
on it.

This boundary is not a module that generates outcomes. It is the definition of
what may and may not cross the proposal-to-commitment threshold.

---

## Core Statements

```text
Reproduction proposals are NOT commitments.
Reproduction probabilities are NOT selections.
Reproduction events are NOT births.
Mode labels are NOT execution directives.
Rankings are NOT authority assignments.
```

No system downstream of the Probability Field may collapse these distinctions
without explicitly passing through the Commitment Boundary as defined here.

---

## 1. Layer Model

The reproduction pipeline is divided into four causally isolated layers.

```text
┌─────────────────────────────────────────────────────────────────┐
│  Layer A — Probability Field (Physics Layer)                    │
│                                                                 │
│  Computes: attraction, biological eligibility, environmental    │
│            pressure, social bond signals                        │
│  Output:   frozen probability vectors (ReproductionFieldResult) │
│  Authority: NONE — pure evaluation                              │
│  May NOT: select, decide, persist, mutate                       │
└────────────────────────────┬────────────────────────────────────┘
                             │  probability vectors only
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Layer B — Event Engine (Social Dynamics Layer)                 │
│                                                                 │
│  Computes: threshold collapse, ranking, competition reduction   │
│  Output:   frozen reproduction proposals (ReproductionEvent)    │
│  Authority: NONE — structural reduction of probability space    │
│  May NOT: select final parents, determine outcomes, persist     │
└────────────────────────────┬────────────────────────────────────┘
                             │  proposals only
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Layer C — Commitment Boundary (THIS DOCUMENT)                  │
│                                                                 │
│  Role:     causal firewall and eligibility validation gate      │
│  Output:   reproductionCommitmentReport (read-only structure)   │
│  Authority: NONE — validation and structural transformation     │
│  May NOT: generate births, mutate agents, commit lineage        │
└────────────────────────────┬────────────────────────────────────┘
                             │  commitment report only
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Layer D — Birth System (Future — NOT IMPLEMENTED)              │
│                                                                 │
│  Role:     sole population mutation authority                   │
│  Sole consumer of reproductionCommitmentReport                  │
│  Only layer permitted to create agents, lineage, inheritance    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Boundary Model

### 2.1 What the Boundary Receives

```text
Input A: reproductionField v2 output
         Type: ReproductionFieldResult[] (frozen, read-only)
         Source: Reproduction Probability Field (Layer A)

Input B: reproductionEventEngine v1 output
         Type: ReproductionEvent[] (frozen, read-only, status: "proposed")
         Source: Reproduction Event Engine (Layer B)

Input C: world snapshot
         Type: WorldStateSnapshot (read-only reference)
         Source: tickManager at commitment evaluation time
```

### 2.2 What the Boundary Produces

```text
Output: reproductionCommitmentReport
        Type: read-only structure
        Consumer: Birth System v1 ONLY
```

The `reproductionCommitmentReport` is a structural transformation of Layer B
output. It does not add outcome determination. It does not add birth facts. It
adds only commitment eligibility metadata that the Birth System v1 may read as
advisory context.

### 2.3 reproductionCommitmentReport Schema

```text
reproductionCommitmentReport:
  tick: number
  evaluatedAt: tick (must equal source proposal tick)
  eligibleCandidates: CommitmentCandidate[]
  suppressedCandidates: CommitmentCandidate[]
  boundaryMetadata: BoundaryMetadata

CommitmentCandidate:
  proposalId: string (stable deterministic identifier, not an agent ID)
  participants: string[] (symmetric — no role ordering)
  probabilityVector: ProbabilityVector (from Layer A, carried forward)
  contextFactors: ContextFactors (read-only summary of field inputs)
  rankMetadata: RankMetadata (non-authoritative — describes ranking, does not enforce it)
  eligibilityStatus: "eligible" | "suppressed" | "deferred"

BoundaryMetadata:
  sourceProposalCount: number
  eligibleCount: number
  suppressedCount: number
  boundaryVersion: "v1"

ContextFactors:
  populationPressure: number (0–1)
  fertilityPressure: number (0–1)
  stabilityModifier: number (bounded)
  dominantMode: "pair" | "asymmetric" | "cluster" | "suppression"

RankMetadata:
  rankAmongParticipantCandidates: number (1-based, informational only)
  probabilityMargin: number (distance above threshold)
```

### 2.4 What the Boundary May NOT Add

The `reproductionCommitmentReport` must not contain:

- a birth outcome
- a newborn schema
- a lineage fact
- a parent role assignment
- a coupling record
- a reproduction execution flag
- a population delta
- any field that implies outcome determination

---

## 3. Forbidden Causal Edges

The following data flows are structurally forbidden. Any implementation that
creates these edges constitutes a causal violation regardless of whether birth
actually occurs.

```text
Layer A (field) ──────────────────────────────► Birth System     ❌
Layer B (proposals) ──────────────────────────► Birth System     ❌
Layer B (proposals) ──────────────────────────► intentPipeline   ❌
Layer B (proposals) ──────────────────────────► agent.memory     ❌
Layer B (proposals) ──────────────────────────► world state      ❌
Layer C (report) ─────────────────────────────► agent state      ❌
Layer C (report) ─────────────────────────────► world state      ❌
Layer C (report) ─────────────────────────────► observation      ❌
Layer C (report) ─────────────────────────────► intentPipeline   ❌
mode label ───────────────────────────────────► birth decision   ❌
ranking position ─────────────────────────────► birth decision   ❌
suppression flag ─────────────────────────────► birth prohibition❌
probability ─────────────────────────────────► guaranteed birth  ❌
```

Permitted data flows:

```text
Layer A ──► Layer B (probability vectors)              ✓
Layer B ──► Layer C (frozen proposals)                 ✓
Layer A ──► Layer C (probability vectors, read-only)   ✓
Layer C ──► traceCollector (read-only snapshot)        ✓
Layer C ──► Birth System v1 (commitment report only)   ✓ (future)
```

---

## 4. Allowed Outputs Schema

Any output produced by Layers A, B, or C must conform to one of the following
permitted output types. Any structure containing forbidden fields is a boundary
violation regardless of whether it is acted on.

```text
PERMITTED OUTPUT FIELDS:
  proposalId              — stable identifier for this candidate evaluation
  participantIds          — symmetric list, no role ordering
  probabilityVector       — pairAttractor, groupAttractor, independentAttractor
  contextFactors          — environmental signals (read-only summary)
  rankMetadata            — informational rank position, non-authoritative
  eligibilityStatus       — "eligible" | "suppressed" | "deferred"
  dominantMode            — descriptive label only
  tick                    — origin tick
  boundaryVersion         — format version string

FORBIDDEN OUTPUT FIELDS:
  newborn                 — any schema describing an agent-to-be-created
  lineage                 — any ancestry, parentage, or generation record
  birthOutcome            — any field implying a birth has been decided
  parentRole              — parentA/parentB, mother/father, dominant/passive
  couplingRecord          — any persistent relationship binding
  executionFlag           — any flag that triggers downstream execution
  populationDelta         — any count or list modification of live agents
  agentMutation           — any modification to an existing agent field
```

---

## 5. Non-Authority Guarantee Statement

The Reproduction Commitment Boundary makes the following non-negotiable
guarantees:

**Guarantee 1 — No Outcome Generation**
The boundary does not determine whether a birth will occur. It determines only
whether a proposal is structurally eligible to be evaluated by a birth system.
Eligibility is not selection. A report of "eligible" does not mandate birth.

**Guarantee 2 — No State Mutation**
The boundary does not write to any agent, world state, memory system, or
persistent queue. The only permitted write targets are the trace collector and
the commitment report structure itself.

**Guarantee 3 — Symmetric Participants**
All participants in a commitment candidate are listed as a symmetric set. No
role, rank, or asymmetric label is assigned to any participant by this layer.
Role assignment, if ever needed, is the exclusive right of a future explicitly
authorized semantic system — not this boundary.

**Guarantee 4 — Mode Descriptiveness**
The `dominantMode` field carried through the commitment report describes the
attractor geometry of the field at proposal time. It is not an instruction. A
mode of `"suppression"` does not prohibit birth. A mode of `"pair"` does not
mandate a dyadic birth. The Birth System v1 must derive its own eligibility
logic and may not treat mode as an authority input.

**Guarantee 5 — Rank Non-Authority**
`rankMetadata` describes the relative probability position of a candidate among
its participant's evaluated candidates. It does not confer priority, selection
right, or execution order on any candidate. The Birth System v1 must not
implement a rule that takes rank 1 as "the chosen parent."

**Guarantee 6 — No Cross-Tick Persistence**
No commitment report, proposal, or field output may be stored as simulation
state across tick boundaries. If a birth does not occur in the tick of the
commitment report, the report is discarded. The following tick produces a new
field, new proposals, and a new commitment evaluation from scratch.

**Guarantee 7 — Sole Consumer Rule**
The `reproductionCommitmentReport` is produced for Birth System v1 exclusively.
No other system — observation, culture, myth, settlement, inspector, demand,
identity, or decision — may consume this report. Any consumption by a
non-birth system constitutes an authority boundary violation.

---

## 6. Drift Failure Modes

The following patterns represent semantic collapse of this boundary. Each
constitutes a violation of the causal model regardless of whether it produces
a visible bug.

### DFM-01 — Probability Collapse to Selection

**Description:** A downstream system reads `pairAttractor > X` as "this pair
reproduces." The continuous probability field becomes a binary selection rule.

**Trigger:** Birth System iterates proposals and creates births for all
candidates above a threshold without a separate viability gate.

**Detection signal:** Birth rate correlates 1:1 with proposal count.

---

### DFM-02 — Rank Becomes Authority

**Description:** Birth System treats rank-1 candidates as "the selected pair"
per agent. Top-K filtering in the Event Engine silently becomes parent
selection.

**Trigger:** Birth System creates births for rank ≤ N candidates only, using
rank as the birth eligibility criterion.

**Detection signal:** Birth always involves the highest-ranked proposal per
agent, not a viability-weighted draw.

---

### DFM-03 — Mode Becomes Execution Directive

**Description:** Birth System branches on `dominantMode`. A `"pair"` mode
triggers dyadic birth logic. A `"suppression"` mode skips the agent from birth
consideration permanently.

**Trigger:** Birth System contains `if (proposal.mode === 'suppression') skip`.

**Detection signal:** Agents in suppression-mode proposals can never participate
in birth regardless of field state in subsequent ticks.

---

### DFM-04 — Proposal Persistence

**Description:** Unfulfilled proposals are stored in an agent field, module
global, or world cache and re-evaluated on the next tick without regenerating
from the field.

**Trigger:** A pending-birth queue carries over tick boundaries like
`_pendingDeath`.

**Detection signal:** Birth can occur in a tick where the reproduction field
was never computed. Birth correlates with a prior tick's conditions, not the
current tick's field state.

---

### DFM-05 — Role Asymmetry Injection

**Description:** The commitment boundary or birth system assigns parentA and
parentB as asymmetric roles — one as genetic contributor, one as gestating
party — without an explicit authorized biological model.

**Trigger:** Birth initialization reads `parents[0]` as the "primary" parent
for inheritance weighting.

**Detection signal:** Inheritance results differ when parent order is reversed
despite inputs being otherwise identical.

---

### DFM-06 — Observation Feedback Loop

**Description:** Culture, civilization memory, or behavioral signature output
is consumed as an input to the commitment boundary or birth system, creating a
feedback from observation into execution.

**Trigger:** Commitment eligibility is raised for agents who appear in culture
clusters or historical reproduction patterns.

**Detection signal:** Agent reproduction rate correlates with prior observation
outputs rather than current field state.

---

### DFM-07 — Commitment Report Broadcast

**Description:** The `reproductionCommitmentReport` is made available to
systems other than Birth System v1 — for example, exposed to the intent
pipeline, demand system, or UI.

**Trigger:** `traceCollector.current.commitmentReport` is read by a decision
scorer to adjust agent preferences.

**Detection signal:** Agent intent scores shift in response to reproduction
field outcomes that the agent's decision system was not authorized to observe.

---

## 7. Integration Diagram

```text
TICK START
  │
  ├─► Life advancement (age, lifeStage, _pendingDeath)
  │
  ├─► simulateAgent loop (unchanged — no reproduction injection)
  │
  ├─► Layer A: computeReproductionProbabilityField
  │     Input:  agents[], world snapshot
  │     Output: ReproductionFieldResult[] (frozen)
  │     Trace:  traceCollector.current.reproductionField
  │
  ├─► Layer B: runReproductionEventEngine
  │     Input:  tick, agents[], reproductionField, world
  │     Output: ReproductionEvent[] (frozen, status: "proposed")
  │     Trace:  traceCollector.current.reproductionEvents
  │
  ├─► Layer C: evaluateCommitmentBoundary  [DEFINED HERE, NOT YET IMPLEMENTED]
  │     Input:  reproductionField, reproductionEvents, world snapshot
  │     Output: reproductionCommitmentReport (read-only)
  │     Trace:  traceCollector.current.reproductionCommitment
  │     State writes: NONE
  │
  ├─► identity post-processing
  │
  ├─► finalizePendingDeaths
  │
  ├─► Layer D: Birth System v1  [NOT IMPLEMENTED]
  │     Input:  reproductionCommitmentReport ONLY
  │     Output: newborn agents (next tick), lineage facts
  │     State writes: population append, lineage record
  │
  └─► trace finalization
TICK END
```

---

## 8. Boundary Validation Checklist

The following conditions must hold for any implementation of Layer C and Layer D
to be considered compliant with this document.

**Layer C (Commitment Boundary) — when implemented:**

- [ ] Receives only frozen Layer A and Layer B outputs
- [ ] Reads world state snapshot without mutation
- [ ] Produces `reproductionCommitmentReport` only
- [ ] Writes to traceCollector only — no agent or world mutation
- [ ] `eligibilityStatus` is advisory — not a birth mandate
- [ ] All participants are listed symmetrically — no role labels
- [ ] Report is discarded if not consumed within the same tick
- [ ] No module-level state, closure, or queue survives tick boundary

**Layer D (Birth System v1) — when implemented:**

- [ ] Consumes `reproductionCommitmentReport` exclusively — never raw proposals
- [ ] Does not treat `eligibilityStatus: "eligible"` as birth mandate
- [ ] Does not treat `rankMetadata.rank === 1` as parent selection
- [ ] Does not treat `dominantMode` as an execution directive
- [ ] Applies its own independent viability gate
- [ ] Appends newborns only after `finalizePendingDeaths` completes
- [ ] Newborns do not participate in the tick of their birth
- [ ] Lineage is written by Birth System only — not inferred by observation
- [ ] Inheritance is a one-time initialization — not a continuing modifier

---

## 9. Source of Truth Hierarchy

This document derives from:

1. AGENTS.md — sole constitutional authority
2. LIFE_CONTINUITY_CAUSAL_INTEGRATION_V1.md — causal insertion contract
3. REPRODUCTION_SEMANTIC_INTEGRITY_V1.md — semantic audit (R-01, R-05 risks)
4. REPRODUCTION_COMMITMENT_BOUNDARY_V1.md (this document)

Any conflict between this document and a lower-authority source resolves in
favor of AGENTS.md.

---

*Architectural constitution only. No runtime implementation. No behavior modified.*
