# `docs/decisions/FIELD_ONTOLOGY_FREEZE_v1.md`

# Field Ontology Freeze v1

Status: Frozen
Supersedes-scope-of: `docs/earthly-journey-sync.md` §FIELD SYSTEM（已锁定）(commit d978aeb, v3.6 baseline)

## Why this decision exists

The original `FIELD SYSTEM [IMMUTABLE]` freeze (commit `d978aebf`, "freeze v3.6 -
baseline simulation + propagation model") bundled two propositions of different
maturity into one 3154-line baseline commit, with no independent qualification
trail for the second:

1. Field is world substrate; phenomena emerge as configurations of fields.
2. There are exactly five Physical Fields: Life, Water, Earth, Fire, Arcana.

Repository archaeology (git blame) confirmed both propositions were authored in
the same commit, with no separate deliberation record for proposition 2. This
decision corrects the freeze granularity: it keeps proposition 1 as Immutable
and re-qualifies proposition 2 against explicit criteria.

## Frozen Scope

### 1. Field Ontology (unchanged, remains Immutable)

```
Field is a world substrate.
Material, biological, and systemic phenomena emerge as stable or unstable
configurations of fields.
Field = how the world exists, not a tool the world provides.
```

Not included in this freeze: Field numeric model, diffusion, conversion,
saturation curve, settlement rule. These remain Dynamics — separate, future
decisions.

### 2. Physical Field Qualification Criteria v0.1

A candidate qualifies as a Physical Field only if it satisfies both:

1. **Independent Ontological Dimension** — at Earthly's simulation scale, the
   phenomenon cannot be fully expressed as a combination of already-qualified
   Physical Fields.
2. **Temporal-Spatial Continuity** — the candidate is a continuous
   spatial-temporal distribution, not a single event, an Agent action, or a
   derived state.

Excluded from this criteria (different question, not evaluated here): impact
breadth on other systems (engineering priority, not ontological validity);
"produces stable configurations" (this is a Field *output* property per
Ontology, not a qualifying *input* test — using it as a filter is circular).

### 3. Physical Field Set (Frozen)

```
Physical Fields:
  Earth — structural stability, mass, geological process
  Water — fluid dynamics, circulation, erosion, purification
  Fire  — energy conversion, combustion, transformation
  Life  — biological flow, growth, healing, decay, self-organization
```

### 4. Explicit Rejections

| Candidate | Status | Reason |
|---|---|---|
| Air | Rejected as independent Physical Field candidate | Expressible as Earth + Water + Fire interaction (e.g. wind = temperature differential + pressure differential + water cycle). Fails Independent Ontological Dimension. Future reconsideration requires a concrete simulation need that cannot be expressed via Earth/Water/Fire. |
| Light | Rejected as independent Physical Field candidate | Not an independent substrate. Candidate interpretations (solar radiation → Fire; photosynthesis trigger → Life; revelation/truth → Semantic Field) all resolve to existing systems. Future reconsideration requires a concrete simulation need. |
| Dark | Rejected as independent Physical Field candidate | Describes a low-value state of another Field (or absence), not an independent existing dimension. Future reconsideration requires a concrete simulation need. |
| Gravity | Rejected as independent Physical Field candidate | Current simulation requirements can represent gravity-related phenomena without introducing a separate Field — it behaves as a Core Simulation Law (uniform, non-distributed), not a distributed Physical Field (Earthly would not describe a location as having "high Gravity" the way it describes "high Fire Field"). Future reconsideration requires a concrete simulation need (e.g. floating islands, gravity anomalies). |
| Time / Space | Rejected as independent Physical Field candidate | Already Kernel coordinates (the container the world exists in), not a distribution within the world. Future reconsideration requires a concrete simulation need. |

### 5. Arcana Decision

**World Arcana Field: Rejected.**

Reason: does not need to exist as World substrate. What it was invented to
explain is already covered by existing mechanisms:

- *Residual* effects ("this place carries lingering magical disturbance") —
  already covered by Field Fatigue / Geological Memory, applied per-Field
  (e.g. elevated Fire + Earth Field Fatigue at an ancient battlefield), no
  fifth dimension required.
- *Primordial* effects ("this place is inherently magical, which is why mages
  settle there") — expressible as a rare stable configuration of the four
  qualified Physical Fields (analogous to how Wood = stable configuration of
  Earth + Life). A "magic tower" location is a Field configuration, not an
  Arcana reading.

**Entity ability to influence Fields: Deferred.**

The mechanism allowing entities to alter Field configurations is not yet
defined. Not frozen as Capability. `Identity = Capability + History +
Constraints + Relationships` is an existing, load-bearing model — inserting
this mechanism into the Capability slot without verifying it fits (open
question: does a plant have this ability? Plants are not currently in scope
of the Identity/Capability model at all) would repeat the same
premature-binding mistake this decision exists to correct.

**The historical term "Arcana" is not reserved as the final name for this
mechanism.** It is carried here only as a pointer to prior discussion, so a
future session can find the context — not as a naming commitment. Left open
for the future **Agent Interaction Ontology** decision to resolve: whether
this is a Capability, an Interaction Potential, an Entity property, or
something else, and what it should be called.

## Explicitly NOT Decided Here (remain Deferred)

- Field ↔ Agent Growth relationship (does Field influence trajectory
  deformation, or are the two systems fully decoupled?)
- Agent Interaction Ontology (why/how an Agent can act on Field at all;
  where Arcana ultimately lives)
- Magic System mechanics (only the boundary is frozen: magic is not caused
  by a World Arcana Field; magic emerges from Agent-side interaction ability
  + World Field configuration — the specific mechanism is future work)
- Field Dynamics (numeric model, diffusion, saturation, settlement rule)

## Changelog

```
Previous (v3.6 baseline, commit d978aebf):
  Five Fields: Life, Water, Earth, Fire, Arcana — bundled with Field Ontology
  under a single IMMUTABLE tag, no independent qualification trail.

Current (this decision):
  Field Ontology: unchanged, remains Immutable.
  Physical Field enumeration: re-qualified, revised to four
  (Earth, Water, Fire, Life). World Arcana Field removed.
  Entity-side ability to influence Fields: deferred to
  Agent Interaction Ontology — "Arcana" not reserved as final name.
```
