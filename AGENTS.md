# Earthly Journey - Agent Operating Memory (v2)

You are operating inside Earthly Journey, a deterministic multi-layer simulation system.

The world is not RPG-driven.
The world is not class-driven.
The world is not quest-driven.

The world is emergent and pressure-driven.

---

# CORE PRINCIPLE

Earthly is composed of layered systems:

## 1. Reality Layer (Authoritative World State)

- tickManager is the ONLY mutation authority
- Elemental Fields are part of physical reality
- World Demand is derived from world state
- All actions are validated against DF constraints

Reality is deterministic and immutable per tick.

---

## 2. Agent Layer (Decision Layer)

Agents are autonomous systems.

Agents contain:

- Traits
- Skills (continuous values)
- Knowledge
- Needs
- Intent Generation

Agents do NOT contain:
- fixed derived identity expressions
- hardcoded behavioral expressions
- forced behaviors

---

## 3. Execution Layer

All actions follow:

```text
Perception -> Intent -> Validation (DF) -> Resolution -> Execution -> Memory Update
```

Rules:

* tickManager is the only execution authority
* no direct state mutation outside engine
* no bypass of validation layer

---

## 4. Observation Layer (READ-ONLY ANALYTICS)

Includes:

* Identity (derived only)
* Behavioral Signature
* Replay Buffer
* Trace Collector
* Inspector UI

Rules:

* Observation must NEVER influence runtime behavior
* Identity is NOT an input to decision-making
* Behavioral patterns are NOT used for scoring or control

---

## 5. Cognitive Layer (Perception System)

* Perception is a distorted projection of Reality
* Each agent has independent belief state
* Social Memory propagates imperfect information
* Controlled Drift stabilizes entropy

Rules:

* Perception MUST NOT modify Reality
* Perception MUST NOT directly influence Intent or Resolution
* Perception is informational only

---

## 6. World Demand System (Opportunity Pressure Layer)

World Demand represents systemic pressure:

* food
* tools
* materials
* healing
* arcane
* safety
* shelter

Rules:

* Demand is derived from World State
* Demand creates opportunity pressure only
* Demand may influence Intent scoring additively
* Demand MUST NOT assign actions
* Demand MUST NOT enforce behavioral expressions or derived identity expressions

---

## 7. Elemental Field System (Physical Layer)

* Elemental Fields are continuous world properties
* Agents interact via actions only
* Fields evolve via tickManager-controlled dynamics

Rules:

* Fields are part of Reality Layer
* No external mutation outside engine
* Fields may influence outcomes but not decisions directly

---

# EXECUTION ORDER

Each tick follows:

```text
World State Update
→ Elemental Field Dynamics
→ World Demand Calculation
→ Perception Update
→ Intent Generation
→ Resolution Model
→ Execution
→ Memory Update
→ Observation Snapshot (READ-ONLY)
```

---

# PRIORITY RULES

When conflicts occur:

1. Reality Layer (highest priority)
2. DF constraints
3. Execution validation
4. Agent intent priority
5. Random tie-breaker

---

# NON-NEGOTIABLE RULES

* tickManager is the ONLY mutation layer
* No system may directly modify Reality
* No system may override Resolution Model
* No system may use Identity for decision-making
* No system may use Behavioral Signature for control
* No system may convert Demand into forced actions
* No system may convert Perception into Reality influence

---

# EMERGENCE PRINCIPLE

All higher-level structures must emerge from:

* repeated actions
* world demand pressure
* skill progression
* environmental constraints

NOT from predefined classes or behavioral expressions.

---

# DESIGN INTENT

The system must allow:

* behavioral divergence
* skill specialization
* emergent occupations
* stable misinformation (without correction bias)
* evolving persistent activity cluster pressure
* long-term ecological simulation of agent collective structures

WITHOUT:

* hardcoded derived identity expressions
* scripted behavior trees
* forced behavioral expression assignment
