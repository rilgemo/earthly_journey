# Reality vs Perception Drift Stabilization Model

This model extends the Reality vs Perception Split with controlled long-term
cognitive drift.

## Core Principle

```text
Perception is unstable locally.
Perception is bounded globally.
Reality remains authoritative and unchanged.
```

Individual beliefs may diverge, rumors may persist, and social groups may form
different truth models. Drift control prevents unbounded confidence,
unbounded numeric deviation, infinite event growth, and uncontrolled
misinformation amplification.

## Components

### Drift Controller

Measures belief divergence from supplied immutable reality claims and applies a
deterministic, bounded drift velocity. Drift rate considers distance, trust,
memory age, and repetition.

The controller does not correct beliefs toward truth. It only limits how fast
and how far beliefs can drift.

### Belief Convergence Model

High-trust networks with repeated, high-confidence claims converge toward a
shared social belief. Convergence is between agents, not between perception and
Reality. A group may therefore converge on a false belief.

Low-trust or low-confidence networks preserve fragmentation.

### Rumor Stability Analyzer

Classifies and measures:

- Stable false beliefs
- Unstable truths
- Rumor cluster strength
- Misinformation persistence

The analyzer is diagnostic only and never corrects rumors.

## Boundedness

- Numeric beliefs remain within configured drift bounds around Reality.
- Drift velocity is capped per tick.
- Belief analysis uses the latest claim per topic and bounded event histories.
- Global belief entropy is diagnostic and bounded by finite agent/claim sets.

## Forbidden Reverse Flow

Drift metrics and belief states must never influence:

- `tickManager()`
- Intent Generator or Resolution Model
- Identity, skills, traits, or knowledge authority
- Elemental Field Dynamics

The Inspector may display drift metrics as read-only observability data.
