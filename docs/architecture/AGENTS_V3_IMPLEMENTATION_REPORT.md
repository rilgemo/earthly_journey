# AGENTS.md v3 Implementation Report

## Purpose

This report records the AGENTS.md v3 compliance pass for Earthly Journey.

AGENTS.md v3 is treated as the single source of truth for runtime architecture.

This pass did not introduce new simulation systems, new layers, new mechanics, balancing changes, runtime entity renames, save format changes, replay format changes, or tick order changes.

## Summary

Overall compliance status: compliant after minor inspector wiring correction.

The runtime still follows the required causal model:

```text
Perception -> Intent -> Resolution -> Execution -> Trace
```

The execution authority remains centralized:

```text
tickManager = sole runtime mutation authority
```

Observation systems remain downstream-only.

## Violations Found

### V1: Inspector panels computed downstream observation reports during render

Affected panels:

- `CultureEmergencePanel.jsx`
- `CivilizationMemoryPanel.jsx`
- `CivilizationMythPanel.jsx`
- `CausalIsolationPanel.jsx`

Issue:

These panels directly imported and invoked analysis/resolver modules during render. The computations were read-only and did not mutate runtime state, but AGENTS.md v3 states that inspector panels should remain display-only and Observation Layer systems should not become intermediate authority.

Severity:

- Low runtime risk
- Medium architectural clarity risk

Status:

- Corrected

## Corrections Applied

### C1: Culture panel changed to display-only

Changed:

- `src/inspector/panels/CultureEmergencePanel.jsx`

Before:

- Called `resolveCultureEmergence()` during render.

After:

- Reads precomputed `cultureReport`, `world.cultureEmergence`, `world.cultureReport`, `world.culture`, or `world.cultureTrace`.
- Does not import simulation culture modules.
- Does not compute culture during render.

### C2: Civilization Memory panel changed to display-only

Changed:

- `src/inspector/panels/CivilizationMemoryPanel.jsx`

Before:

- Called `resolveCultureEmergence()` and `buildCivilizationMemory()` during render.

After:

- Reads precomputed `civilizationMemoryReport`, `world.civilizationMemoryReport`, `world.civilizationMemoryResult`, `world.civilizationMemory`, or `world.civilizationMemoryTrace`.
- Does not import culture or civilization memory modules.
- Does not compute memory during render.

### C3: Civilization Myth panel changed to display-only

Changed:

- `src/inspector/panels/CivilizationMythPanel.jsx`

Before:

- Called `resolveCultureEmergence()`, `buildCivilizationMemory()`, and `generateCivilizationMyth()` during render.

After:

- Reads precomputed `mythReport`, `world.civilizationMythReport`, `world.mythReport`, `world.civilizationMyth`, `world.myth`, `world.civilizationMythTrace`, or `world.mythTrace`.
- Does not import culture, memory, or myth modules.
- Does not compute myth during render.

### C4: Causal Isolation panel changed to display-only

Changed:

- `src/inspector/panels/CausalIsolationPanel.jsx`

Before:

- Called `buildCrossLayerInfluenceMatrix()` during render.

After:

- Reads precomputed `world.causalIsolationReport.influenceMatrix` or `world.causalIsolationMatrix` if present.
- Still displays causal traces already present in runtime trace data.
- Does not import analysis modules.

## Confirmed Compliant Systems

### tickManager

Confirmed:

- Remains the sole execution/mutation authority.
- Coordinates demand calculation, perception, intent pipeline execution, resolution result usage, action effects, memory updates, skill gain, resource flow, field dynamics, emergence hooks, stability, identity derivation, and trace collector updates.

No correction applied.

### Intent Pipeline

Confirmed:

- Remains the decision-layer pipeline.
- Phase A scoring remains pure.
- Phase B enrichment remains non-invasive.
- Phase C resolution selects from provided candidates.
- No mutation authority.

No correction applied.

### Resolution Model

Confirmed:

- Selection-only.
- Uses candidate intents.
- Guarded against identity leakage.
- No execution or world mutation.

No correction applied.

### Demand System

Confirmed:

- Demand is derived from world state.
- Demand contributes additive opportunity pressure to scoring.
- Demand does not assign actions or override selection.

No correction applied.

### Typology

Confirmed:

- Typology is a causal weighting profile.
- It modifies scoring weights only.
- It does not assign skills, professions, roles, identities, or execution authority.

No correction applied.

### Identity

Confirmed:

- Identity is derived post-tick.
- Decision view uses `createIdentityFreeDecisionView`.
- Intent and resolution paths use identity leak guards.

No correction applied.

### Behavioral Signature

Confirmed:

- Observational action-history analytics.
- No scoring or control path found.

No correction applied.

### Settlement Emergence

Confirmed:

- Activity cluster observation over trace history.
- Does not govern behavior or movement.

No correction applied.

### Culture Emergence

Confirmed:

- Downstream trace-derived detection layer.
- Does not feed into decision, settlement formation, demand, field, or execution systems.

Inspector wiring corrected to display-only.

### Civilization Memory

Confirmed:

- Post-simulation compression layer.
- Does not feed into culture, settlement, demand, field, decision, or execution.

Inspector wiring corrected to display-only.

### Civilization Myth

Confirmed:

- Downstream interpretive layer.
- Does not feed into memory, culture, demand, settlement, decision, behavior, or execution.

Inspector wiring corrected to display-only.

### Semantic Consistency Audit

Confirmed:

- Analysis-only terminology report.
- No runtime mutation or decision influence.

No correction applied.

### Causal Isolation

Confirmed:

- Verification-only analysis layer.
- No runtime mutation or decision influence.

Inspector wiring corrected to display-only.

### Inspector Panels

Confirmed after correction:

- Inspector panels display derived data.
- No panel now computes Culture, Civilization Memory, Civilization Myth, or Causal Isolation reports during render.
- Panels remain read-only.

## Dependency Findings

### Runtime dependency direction

No observation-to-decision import path was found for:

- Culture -> Intent
- Civilization Memory -> Intent
- Civilization Myth -> Intent
- Semantic Audit -> Intent
- Causal Isolation -> Intent

No observation-to-execution import path was found for:

- Culture -> tickManager
- Civilization Memory -> tickManager
- Civilization Myth -> tickManager

### Reality to Decision boundary

Reality-derived values such as Field and Demand are passed as scoring context. This remains allowed under AGENTS.md v3 because they are additive scoring inputs and do not generate intent or select actions.

### Utility ownership note

Some reality/observation modules still import `freezeSnapshot` from `behaviorTraceRecorder`. This is not a behavioral violation, but it remains a semantic utility-location risk.

Recommended future cleanup:

```text
src/simulation/utils/snapshot.js
```

No correction applied in this pass because it would be utility refactor beyond the minimum compliance fix.

## Remaining Risks

### R1: Derived reports now need explicit producer wiring

Because inspector panels no longer compute Culture, Civilization Memory, Civilization Myth, or Causal Isolation reports during render, those reports must be produced by an upstream read-only analytics path if they are expected to display.

This is intentional for AGENTS.md v3 compliance.

Recommendation:

- Add a future read-only report assembly path outside React render if needed.
- Do not compute reports inside inspector panels.

### R2: Snapshot utility semantic coupling

`freezeSnapshot` and `cloneSnapshot` are still sourced from behavior/replay modules in several places.

Recommendation:

- Move snapshot helpers to a neutral utility module in a future non-behavioral cleanup.

### R3: Documentation breadth

The architecture has many AI/docs files. AGENTS.md v3 is now the authority, but older docs may use softer language.

Recommendation:

- When conflicts appear, AGENTS.md wins.
- Future docs should include a short "Layer / Mutation / Feeds runtime" block.

## Verification

Full test suite:

```text
npx jest --runInBand
39 test suites passed
334 tests passed
```

Production build:

```text
npm run build
Compiled successfully
```

Build emitted the existing `fs.F_OK` deprecation warning only.

## Final Compliance Statement

AGENTS.md v3 maps to current runtime behavior after this pass:

- No observation layer influences the decision layer.
- No hidden feedback loop was found from Culture, Civilization Memory, or Myth.
- `tickManager` remains the sole execution authority.
- Intent Pipeline remains decision-only.
- Resolution remains selection-only.
- Execution remains mutation-only.
- Trace and Inspector systems remain observational-only.

The system is compliant with AGENTS.md v3, with remaining risks limited to utility naming/placement and future report-production wiring.
