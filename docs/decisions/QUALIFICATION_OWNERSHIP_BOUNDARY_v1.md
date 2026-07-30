# Qualification Ownership Boundary v1

**Status:** Frozen
**Scope:** Ontology Layer
**Related Agenda:** Agenda 1 — Agent Interaction Ontology v1 → Interaction Qualification → Qualification Ownership

---

## 1. Decision

> Qualification Ownership Cardinality is not ontologically predetermined.

The Ontological definition of Qualification does not require, and does not currently justify, the existence of a single Ontological Owner. Single, Composite, and other valid representations all remain open possibilities.

---

## 2. Frozen

### 2.1 Ownership Cardinality Neutrality

Qualification Ownership Cardinality is not ontologically predetermined. This does not mean Qualification has no owner — it means the number and nature of its owner(s) is not fixed as an Ontology-layer fact.

### 2.2 No Implicit Ownership Assumption

Future designs must not default to assuming that Qualification belongs to Entity, Interaction, Field, or Relation, unless a subsequent, independent Decision explicitly proves or selects one.

### 2.3 Layer Separation

**Simulation Layer Separation:**

| Concern | Layer |
|---|---|
| Information source | Ontology |
| Evaluation logic | Rules |
| Storage | Implementation |

**Governance Boundary (separate axis):**

| Concern | Layer |
|---|---|
| Concept authority | Governance |

This Decision is distinct from, and does not modify, the Governance **Single Owner Principle**. Single Owner Principle governs *who has authority to define a concept in the repository*; Qualification Ownership governs *where a simulation property resides*. These are two unrelated concepts that happen to share similar vocabulary.

---

## 3. Not Frozen (Explicitly Deferred)

The following remain open and are **not** decided by this boundary:

- Qualification is Composite / Distributed.
- A Qualification Resolver exists (as a stateful authority).
- Multiple Owners are required.
- Qualification has no ontologically defined location. *(Note: this is not the same as "Qualification belongs nowhere" — the former states an absence of current definition; the latter would be an overreaching ontological negation.)*

---

## 4. Reopen Condition

This boundary may only be reconsidered when future Ontology investigation introduces a new, independent principle capable of proving or disproving the necessity of a specific Qualification Ownership Cardinality.

Implementation convenience, performance considerations, or local system requirements alone are **insufficient** grounds for reopening this boundary.

---

## 5. Repository Evidence

**Stage 1 — Ownership Candidate Exploration**
- Round 1 (Structural Validity): Entity-owned, Interaction-owned, Field-owned, and Relation-owned candidates all passed internal-consistency and ownership-sufficiency checks. Result: Insufficient Discrimination.
- Round 2 (Frozen Principle Alignment): Existing frozen principles ("Earthly exists independently of players"; "Growth = trajectory deformation, not attribute accumulation") were reviewed via Structural Analogy Check. Neither principle provided decisive constraint on any candidate (partial review; no canonical Frozen Principle inventory exists in the repository).

**Stage 1.5 — Ownership Cardinality Check**
- Mutual Reducibility Check: No candidate could be shown to fully and losslessly absorb the others without semantic shift or external information injection.
- Component Independence Check: Five information components (Historical Continuity, Accumulated Consequence, Current Condition, Interaction Context, External State) were confirmed pairwise independent using a minimal abstract scenario set (S1a/S1b/S2/S3/S4).
- Counterfactual Relocation Test / Type B methodology finding: The test protocol (Decision-Relevant Irreducibility Test v1.0) was proven — via a Method Validation on Current Condition — to be satisfiable by *any* independent component, given permission to construct a component-specific Qualification rule. It therefore cannot discriminate between Single, Composite, or Distributed Cardinality.

**Evidence Note:** This evidence establishes the *necessity of this boundary* — it does not establish, and must not be read as establishing, a final Qualification ownership model (e.g., Composite). The methodology limitation discovered in Stage 1.5 is itself the primary finding, not a side note.

---

## 6. Migration Note

If a future Decision selects a specific ownership model (Single, Composite, or otherwise), it does **not** require revoking this boundary. It should be recorded as a new, separate Decision (e.g., `Qualification Ownership Decision v2` or `Qualification Evaluation Model v1`), explicitly noting that it operates *within* this boundary rather than replacing it.

---

*This document was produced through a structured, multi-round adversarial review process (ChatGPT: divergent generation; Claude: convergent review; Yongkit: freeze authority), following the Earthly Journey Claude Collaboration Charter.*
