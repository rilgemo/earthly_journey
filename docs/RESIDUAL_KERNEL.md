# RESIDUAL KERNEL v1 — Deterministic Eligibility Filter (Phase 1 Compatible)

## 1. Purpose

Residual Kernel defines a deterministic eligibility filter that determines whether a Residual Propagation edge is eligible to be considered for emission into World_Execute.

It does NOT execute simulation logic.
It does NOT modify system state.
It does NOT introduce stochastic behavior.

---

## 2. Input Model

Residual Kernel operates only on:

- Graph Edge Metadata
- System Time (global tick)

No additional runtime state is introduced.

---

## 3. Derived Residual Strength

Residual strength is NOT stored.

It is computed dynamically:


residual_strength(edge) =
f(edge.persistence_type, time_since_origin)


Where:

- instant → strength = 0
- decaying → strength decreases over time
- accumulating → strength increases until saturation
- persistent → strength = constant high baseline

---

## 4. Eligibility Function (Deterministic)

An edge is marked eligible-for-emission IF:


IF edge.persistence_type != instant
AND residual_strength(edge) > threshold
AND schema_match == true
AND scope_match == true
THEN eligible_for_emission = true


---

## 5. Scope Rules

Residual Kernel applies ONLY to:

- D2 → A-class edges in Residual Propagation Graph v1.1

Explicitly excludes:

- A → A interactions
- B-class event logic
- execution logic (World_Execute)
- probabilistic or sampling systems

---

## 6. Output

Output of Residual Kernel is a deterministic flag:


eligible_for_emission: boolean


No ranking, weighting, or probability is produced.

---

## 7. Design Constraints

- No stochastic behavior
- No simulation execution
- No state mutation
- No hidden variables

---

## 8. System Position

Graph → Residual Kernel → World_Execute

Residual Kernel acts as a **pre-execution deterministic filter layer only**.

---

## 9. World_Execute Interface Contract (Phase 2+ Activation)

Status: PENDING — declared but inactive in Phase 1.
This section defines the future coupling contract only.
It does NOT affect current Phase 1 execution behavior.

### Interface Declaration

When World_Execute is extended to consume residual inputs (Phase 2+):

Input channel:
  source: Residual Kernel v1
  format: eligible_for_emission boolean flags per edge

Processing rule:
  IF edge.eligible_for_emission == true
  THEN include edge in execution consideration set
  ELSE ignore edge

### Constraints (binding at activation)

- No recomputation of residual_strength inside World_Execute
- No re-evaluation of persistence_type inside World_Execute
- Residual Kernel is the ONLY authority for eligibility filtering
- World_Execute must not modify or override eligible_for_emission flags

### Phase Isolation Rule

This contract must NOT be compiled into Phase 1 execution logic.
Activation occurs only when Phase 2 boundary is explicitly reached
and documented in MILESTONES.md.

Retroactive reinterpretation of Phase 1 event history
via Residual Kernel is FORBIDDEN after activation.
Phase 1 B-class records are immutable regardless of Phase 2 state.

