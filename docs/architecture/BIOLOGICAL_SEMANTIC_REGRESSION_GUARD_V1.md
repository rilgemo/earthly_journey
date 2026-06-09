# Biological Semantic Regression Guard v1

## Purpose

This guard prevents Earthly biological semantics from regressing into a scalar
survival model or crossing presentation boundaries.

It does not add biological behavior. It verifies the existing
Condition/Capacity contract.

## Protected Invariants

Condition and Capacity must remain:

- multidimensional
- categorical
- non-aggregated
- non-normalized
- owned by simulation execution authority

## Forbidden Representations

Simulation code must not introduce:

- hit-point or vitality-style scalar survival fields
- maximum-survival analogues
- biological totals, scores, ratios, percentages, or current/maximum pairs
- a UI or inspector import into simulation code
- a single biological dimension that independently determines survival

## Allowed Multidimensional Rules

Rules may evaluate named dimension sets.

For example, the current life-support rule checks whether multiple dimensions
have collapsed. This is a categorical quorum rule over explicit dimensions.
It does not expose, store, normalize, or persist a survival scalar.

## Verification

`semanticRegressionGuard.js` performs:

- simulation-source terminology scanning
- simulation-to-presentation import scanning
- canonical biology shape inspection

The regression test suite verifies:

- no scalar survival terminology exists in simulation source
- no simulation module imports UI or inspector authority
- canonical biology contains no aggregate or normalized fields
- Capacity remains multidimensional and categorical
- derived condition signals remain dimension lists
- no single collapsed dimension determines survival

## Boundary Rule

Presentation may render independent dimension states from immutable snapshots.
It must not calculate or write a biological survival score.

Simulation must never import presentation code or consume presentation-derived
values.
