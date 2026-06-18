## Observation Result (post manaNeed fix)

After fixing manaNeed freeze, meditate still dominates all 20 ticks.
manaNeed is now correctly 0 (mana.current = 100 = capacity).

meditate score breakdown at tick 20:
  memory:    2.46
  skill:     3.54
  influence: 6.93
  demand:    4.37
  need:      1.85
  Total:    ~21.7 vs next best (rest: 17.1)

## Revised Conclusion

Convergence is confirmed. But the four score sources are NOT independent.
Likely dependency chain:

  skill → action success → memory → influence → demand adaptation
                                                       ↓
                                              all feed back to meditate

This is one success path amplified four times, not four independent votes.
These two diagnoses lead to completely different fixes:
  - If truly independent → systems are too conservative → reduce weights
  - If coupled → dependency chain is too tight → decouple sources

Do not treat score sources as independent until dependency is isolated.
Do not act on "demand score" as next target — it may be symptom, not cause.

Current result proves convergence exists.
Root dependency not yet isolated.

## Next Experiment: L1.5 Dependency Collapse Test

Goal: not "who gives meditate score" but "who gives it first"

Three controlled runs, one variable disabled per run:

  Experiment A: memory score = 0 (forced)
    → does meditate remain dominant?

  Experiment B: influence score = 0 (forced)
    → does meditate drop significantly?

  Experiment C: demand score = 0 (forced)
    → does meditate change?

Record dominance_delta for each:
  baseline meditate score: ~21.7
  A: ?
  B: ?
  C: ?

Prediction (hypothesis, not conclusion):
  influence OFF → largest drop
  memory OFF → small change
  demand OFF → medium change

If confirmed: influence is acting as "world will" rather than
agent preference, which directly affects L2 design.

Status: experiment not yet run. Hypothesis only.

## Resolution: Identity-Physiology Decoupling (Implemented)

Root cause confirmed: Responsibility Contamination, not duplicate
calculation. influenceField had `needs` as a DIRECT input alongside
field/memories/social, causing physiological state (similar across all
agents) to dominate over skill-based identity (which differs per agent).

Fix implemented:
1. needs removed from createInfluenceField signature — influenceField
   is now world-signal-only (field-driven + memory-driven + social-driven)
2. needScore remains independent in intentPipeline, additive and unmasked
   — represents agent urgency, not feasibility constraint
3. Per-action feasibility mask added via computeFeasibilityMask(action,
   needProfile), using max-reduction across simultaneous needs to avoid
   compounding collapse

Acceptance tests (14/14 pass):
  T1: forge(10.35) beats meditate(7.90) under fatigue=80/hunger=60/forging=80
  T2: farmer/blacksmith/arcane produce 3 different winning actions
      under identical fatigue=80
  T3 (Longitudinal, 72 ticks, randomized fatigue/hunger):
      farmer→forage 100%, smith→forge 100%, arcane→study_arcane 100%
      (threshold was >35%, actual far exceeds — identity is stable
      under physiological noise)

Status: L1→L2 identity preservation confirmed at score-flow level.
meaningLayer (selection based on "what fits who I am becoming") can now
be built on top of a skillScore signal that is no longer drowned by need.

This was a score-flow and channel-ownership correction, not a new system.
No new learning mechanisms, no memory restructuring, no agent rewrite.
