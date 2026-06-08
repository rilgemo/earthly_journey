# Earthly Journey - Agent Operating Constitution v3 (Design Pass)

This document defines the authoritative simulation principles of Earthly Journey.

It governs:

* simulation structure
* layer boundaries
* causal rules
* emergence systems
* execution constraints

It does NOT describe implementation details.

---

# 1. Core Principle

Earthly is a deterministic layered simulation system.

The world is structured into three causal domains:

```text
Reality Layer → Decision Layer → Execution Layer
```

and one non-causal domain:

```text
Observation Layer (read-only)
```

---

## 1.1 Causal Rule

```text
Only Execution Layer may mutate world state.
```

```text
Decision Layer may only produce intent, never execution.
```

```text
Observation Layer may only interpret, never influence.
```

---

# 2. Layer Authority Matrix

---

## 2.1 Reality Layer

Owns:

* resource geography
* environmental fields
* world demand
* action yield context

Cannot:

* generate intent
* modify behavior
* interpret outcomes

---

## 2.2 Decision Layer

Owns:

* intent generation
* preference weighting
* action selection logic
* typology influence (weight-only)

Cannot:

* mutate world state
* observe historical truth directly without trace
* be influenced by observation layers

---

## 2.3 Execution Layer

Owns:

* validation
* state mutation
* action resolution
* tickManager authority

Cannot:

* generate intent
* modify decision logic

---

## 2.4 Observation Layer

Includes:

* Behavioral Signature
* Culture Emergence
* Settlement Emergence
* Civilization Memory
* Civilization Myth
* Semantic Audit
* Causal Isolation

Owns:

* trace interpretation
* pattern extraction
* historical compression

Cannot:

* influence decision layer
* influence execution layer
* modify world state

---

# 3. Emergence Chain (Downstream Only)

Emergent systems must strictly follow:

```text
Action
→ Trace
→ Behavioral Patterns
→ Culture
→ Civilization Memory
→ Civilization Myth
```

---

## 3.1 Emergence Rule

```text
Emergence layers are descriptive only.
They never feed back into causality.
```

---

# 4. Key Systems Definitions

---

## 4.1 Typology System

Typology is a causal weighting profile.

It may influence:

* intent scoring
* preference weighting

It must NOT define:

* profession
* class
* role authority

---

## 4.2 Demand System

Demand is a contextual pressure field.

It may influence:

* action attractiveness score

It must NOT:

* generate actions
* enforce behaviors
* override intent selection

---

## 4.3 Settlement System

Settlements are emergent clustering of persistent agent activity.

They are:

* observational constructs only

They are NOT:

* governing entities
* decision authorities

---

## 4.4 Myth System

Myth is a symbolic interpretation layer.

It produces narrative projections of Civilization Memory.

It must NOT:

* influence intent
* influence behavior
* influence world state

---

## 4.5 Culture System

Culture is a convergence pattern of repeated behaviors across agents.

It is:

* descriptive
* statistical
* emergent

It must NOT:

* act as causal input

---

## 4.6 Civilization Memory

Civilization Memory is a compressed historical structure of trace data.

It is:

* archival
* structural
* non-causal

---

# 5. Execution Model

All simulation must follow:

```text
Perception → Intent → Resolution → Execution → Trace Update
```

---

## 5.1 Tick Authority

```text
tickManager is the sole execution authority.
```

No system may bypass tickManager.

---

# 6. Architectural Red Flags

The following patterns are strictly forbidden:

```text
Culture → Intent injection
Myth → Behavior modification
Settlement → Skill authority
Observation → Decision influence
Demand → Forced action selection
Typology → Role enforcement
```

---

# 7. Simulation Integrity Rule

Earthly simulation must remain:

* deterministic
* layered
* non-referential across observation boundaries
* causally one-directional

---

# 8. Source of Truth Hierarchy

1. AGENTS.md (this document)
2. /AI/ system prompts
3. /docs architecture definitions
4. runtime implementation (lowest authority)

---

# End of Constitution v3 Design Pass
