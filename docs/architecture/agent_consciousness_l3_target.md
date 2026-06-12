# Agent Consciousness L3 Target — Architecture Charter

Version: v1
Status: Authoritative
Last updated: 2026-06-12

---

## Vision

Earthly Journey does not aim to simulate NPC behavior.

Earthly Journey aims to create persistent artificial life capable of:

- forming identity
- retaining memory
- developing emotions
- creating relationships
- evolving goals
- interacting meaningfully with players

Player and high-tier agents eventually exist under the same consciousness architecture.

---

## Consciousness Layer Model

### L0 — World Layer

Purpose: Physical and environmental reality.

Contains: world state, fields, resources, events, simulation rules.

**Current Earthly status: Operational**

---

### L1 — Biological Agent

Purpose: Reactive survival entity.

Required capability: state machine, needs, survival response, local perception.

**Current Earthly status: Partial**

Present: action execution, need system, life cycle, mana/energy model.
Missing: coherent state machine, structured survival response, formalized local perception boundary.

---

### L2 — Social Agent

Purpose: Persistent social actor.

Required capability: relationship formation, long-term memory, preference drift, social influence.

**Current Earthly status: Infrastructure prepared**

Infrastructure present: lineageEngine, narrativeEngine, worldObservationEngine, socialGraph, civilizationMemory, perception subsystem.

Not present: formal relationship graph (beyond lineage), preference persistence API, social influence feedback loop into decisions.

> **Important:** L2 infrastructure exists but L2 is not complete. Do not treat the presence of these modules as evidence that L2 requirements are fully satisfied.

---

### L3 — Conscious Agent

Purpose: Self-aware persistent identity.

Required capability: self model, autobiographical continuity, emotional persistence, intention hierarchy, narrative understanding.

**Current Earthly status: Not started**

---

## Required Agent Foundation Modules

These modules must exist and be operational before Player Embodiment can begin.

---

### 1. Memory Engine `[P0]`

Purpose: Preserve experiences across ticks.

Required sub-systems:

**Episodic Memory**
- what happened, where, when
- Example: `Tick 321: Met another traveler.`

**Emotional Memory**
- event + emotional impact
- Example: `Trust increased after exchange.`

**Relationship Memory**
- interaction history + affinity score

Output: `memory[]`

---

### 2. Emotion Engine `[P0]`

Purpose: Convert events into internal state.

Core emotions: curiosity, fear, trust, anger, joy, sadness.

Rule: `emotion = f(memory, fields, perception)`

Output: `emotionState`

---

### 3. Identity Engine `[P0]`

Purpose: Maintain continuity of self.

Required: self-perception, personality, values, preference persistence.

Example: `I prefer solitude.`

Output: `identityProfile`

---

### 4. Goal Engine `[P0]`

Purpose: Generate internal motivation.

Goal hierarchy:

```
survival
  → belonging
    → purpose
      → transcendence
```

Output: `goalStack`

---

### 5. Relationship Engine `[P1]`

Purpose: Generalize lineage into full social structure.

Current foundation: lineageEngine (parent/child only).

Target relationship types: parent, friend, enemy, mentor, partner, faction.

Output: `relationshipGraph`

---

### 6. Perspective Engine `[P1]`

Purpose: Separate world reality from agent perception.

Rule: `world reality ≠ agent perception`

Current foundation: playerPerspectiveEngine v1 (partial — covers energy/bias/uncertainty, lacks emotion and memory integration).

Output: `subjectiveWorld`

---

## Player Embodiment Gate

Player Embodiment cannot begin until all four P0 modules are operational:

- [ ] Memory Engine
- [ ] Emotion Engine
- [ ] Identity Engine
- [ ] Goal Engine

---

## Existing Module Compatibility

**Safe (no changes required):**
- Action Registry
- Execution Contract
- Trace Collector
- Replay Buffer
- Observation Engine (worldObservationEngine)

**Review Required:**
- Intent Pipeline / intentPurity — identity guard is a hard boundary; must remain clean as Identity Engine is introduced
- Lineage Engine — will be subsumed into Relationship Engine (P1); API must remain stable during transition

**Expansion Targets:**
- Narrative Engine — needs emotion-weighted sentence generation once Emotion Engine exists
- Perspective Engine (playerPerspectiveEngine) — needs emotion + memory integration (currently energy-only bias)

---

## Full L3 Formula

```
Agent = Identity + Memory + Emotion + Goal + Relationship + Perspective
```

Only after all six layers exist can an agent be considered L3 Conscious.
