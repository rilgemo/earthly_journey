# Interaction Ontology — State Tracking

*This document is a Navigation / Exploration record, not a Canonical State document.
Nothing here is Frozen unless explicitly marked. Canonical, Frozen decisions live in
`docs/decisions/`; this file exists to preserve direction and working state across
sessions, so future work does not need to re-derive it from conversation memory.*

---

## Canonical (for reference — already Frozen in `docs/decisions/`)

| Decision | Status | File |
|---|---|---|
| Field Ontology Freeze v1 | Frozen | `docs/decisions/FIELD_ONTOLOGY_FREEZE_v1.md` |
| World Causality Boundary v1 | Frozen | `docs/decisions/WORLD_CAUSALITY_BOUNDARY_v1.md` |
| Qualification Ownership Boundary v1 | Frozen | `docs/decisions/QUALIFICATION_OWNERSHIP_BOUNDARY_v1.md` |

Qualification Ownership Boundary v1 conclusion (for quick reference):
**Qualification Ownership Cardinality is not ontologically predetermined.** No future
design may default to Entity/Interaction/Field/Relation-owned without a new, independent
decision. Composite/Distributed/Resolver models remain open, not frozen.

---

## Navigation State — Agent Interaction Ontology v1

```
Interaction Qualification    Completed  → Qualification Ownership Boundary v1
Interaction Nature            Open       ← current investigation focus
Interaction Medium             Open
Interaction Scope               Open
```

**Important:** No ordering among Nature / Medium / Scope is frozen. Any sequence
(e.g. "Nature before Medium before Scope") is a **Candidate Ordering Hypothesis**,
not an architecture dependency. It may be revised without reopening any frozen
decision.

---

## Exploration Record

### Agenda Structure Validation v0.1 — Candidate (Experimental Procedure Candidate)

Purpose: validate whether Nature / Medium / Scope represent independent ontological
questions, and whether any necessary ordering exists between them. Does **not**
validate the ontology itself — only the agenda structure.

Scope:
- Included: Nature, Medium, Scope (as classification questions)
- Excluded: interaction mechanics, ability implementation, field manipulation design

Method:

```
Round 1 — Structural Validity
  Q: Are the dimensions independently meaningful?

Round 2 — Frozen Principle Alignment
  1. Identify candidate Frozen Principles
  2. Direct-relation screening (discard Indirect-relation principles —
     they produce uniform Ambiguous results and have no discriminating value)
  3. Evaluate only applicable principles

Sufficiency Evaluation (per dimension, evaluated independently):
  A dimension is Sufficient when combined evidence from completed rounds
  produces a stable conclusion about the tested question.
  A round is NOT insufficient merely because:
    - no applicable Frozen Principle exists
    - a round does not eliminate candidates
    - a round intentionally only validates structure
  A dimension reaching Sufficient does not require re-validation because
  another dimension is Insufficient. Discrimination Check applies only
  to the Insufficient dimension(s).

Conflict Handling (when a Direct-relation Frozen Principle conflicts with
a Round 1 finding):
  1. If the principle invalidates the Round 1 assumption → revise the
     Round 1 interpretation (this is a normal correction, not a failure).
  2. If the principle creates multiple equally valid interpretations
     without resolution → classify as Insufficient, invoke Discrimination Check.

Conditional Discrimination Check (Reserved — invoke only if Round 1+2
return Insufficient Discrimination):
  - Component Independence Check
  - Mutual Reducibility Check
  - Counterfactual Relocation Test
  (Internal sufficiency judgment for this check is intentionally undefined —
  do not pre-design it before it is actually triggered.)
```

Naming note: deliberately avoids reusing the bare label "Stage 1.5" (already used
inside the Qualification Ownership process) to prevent a third bare-numeral
namespace collision, following the same pattern already observed with `Layer`
and `Stage`.

---

### Multi-framing Enumeration — Experimental Protocol (first application, no prior repository precedent)

Status: **Experimental**, not Method, not Principle. Promotion condition: demonstrated
usefulness across at least two independent ontology investigations.

**Interaction Nature — Multi-framing Enumeration (Experimental Trial #1)**

Status: Experimental (first application). This experiment evaluates whether multiple
framings naturally converge toward a stable candidate space for Interaction Nature.
It does not validate the ontology itself.

Objective: generate candidate classifications for Interaction Nature using multiple
independent conceptual framings. Purpose is to evaluate candidate coverage, not to
determine which candidate is correct.

Required Framings: use 2–3 substantially different conceptual framings. Examples
(illustrative only, may be substituted if genuinely independent):
- What fundamentally changes during an interaction?
- What irreducible property must every interaction possess?
- If interaction were removed from the ontology, what capability would disappear?

**Framing Independence Check** (perform before enumeration begins): verify the
selected framings are conceptually distinct, not merely phrased differently. Replace
a framing if it only rewords another while preserving the same underlying analytical
lens. Illustrative distinct lenses: property-oriented, process-oriented, functional,
counterfactual, constraint-oriented. Do not select 2-3 framings that all share the
same lens.

Independence Requirement: treat each framing as an independent derivation task. Do
not intentionally reuse, refine, merge, or optimize candidates generated by previous
framings. Final comparison occurs only after all framings are complete.

Experimental Limitation: this experiment occurs within a single continuous model
session → only **weak derivational independence** (independently *instructed*
derivation, not independently *derived* — residual context/attention persists across
framings). Any observed convergence is exploratory evidence only, not ontology
validation or enumeration-method validation.

Expected Output: for each framing — framing definition, independently derived
candidate list, brief rationale. After all framings — convergence summary, newly
emerged candidate categories, obvious overlaps, unresolved differences.

Do NOT perform in this trial: Structural Validity, Frozen Principle Alignment,
candidate ranking, candidate elimination, mechanism design, implementation discussion.
Those belong to later stages.

**Success Criterion:** the experiment is successful if it produces a candidate space
that can meaningfully enter Coverage Convergence Check — regardless of whether the
framings converge or diverge. Convergence and divergence are both valid outcomes;
divergence indicates either unstable enumeration or a real problem with the
classification itself, and either is useful information.

**Known Limitation:** framings are generated by a single reasoning process. The
experiment does not claim strong derivational independence. Observed convergence
or divergence must therefore be interpreted as experimental evidence, not proof
of classification completeness.

---

## Observations (deliberately not elevated — recorded, not proposed)

- **Evidence Independence**: future ontology investigations may benefit from
  explicit classification of evidence independence levels (weak/session-level vs.
  strong/cross-session vs. cross-model vs. repository-verified). Only one use case
  so far (this trial) — insufficient to formalize.
- **Protocol Template** (Task → Protocol → Execution Boundary → Success Criterion):
  a reusable structure may exist across future experimental protocols (Nature,
  Medium, Scope, and beyond). Not yet a Template — only observed once.
- **Repository Knowledge Governance**: three independent namespace-collision cases
  are now repository-verified (Layer, Edge Schema v0.1, Stage). Problem existence is
  proven; governance-model readiness is not. Remains Deferred.

---

## Next Action

Execute **Interaction Nature — Multi-framing Enumeration (Experimental Trial #1)**
per the protocol above. On return: (1) run Framing Independence Check retroactively
on the produced framings, (2) run Coverage Convergence Check, (3) decide whether to
proceed to Structural Validity.
