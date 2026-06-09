# State Authority Model v1

## Authority and Purpose

This contract follows `AGENTS.md` as the sole authority. It defines state
ownership and access permissions for Earthly without changing implementation,
runtime behavior, schemas, saves, tests, or simulation output.

Its purpose is to establish:

```text
one authoritative writer per state domain
many permitted readers
explicit write prohibition outside authority
```

No state may be jointly owned by multiple layers.

## Core Ownership Rules

### Single-writer rule

Every mutable simulation-state domain has exactly one writer:

```text
tickManager / Execution Layer
```

Systems may calculate proposals, intents, validation results, snapshots, and
reports. These outputs do not grant authority to mutate live simulation state.

### Output ownership is not simulation ownership

A system may own the creation of its own output without owning the state that
the output describes.

Examples:

- `intentPipeline` owns intent-output generation.
- Resolution owns final-selection output.
- Trace systems own immutable trace-output generation.
- Analysis systems own report-output generation.

None of these systems may directly mutate agent or world state.

### Snapshot-only boundary

Every non-simulation layer receives immutable snapshots or immutable read
models. A reference to live mutable simulation state must never cross into
Presentation, Persistence, Derived State, or Analysis layers.

## 1. Layer Definitions

### 1.1 Simulation Authority Layer

Role:

> Sole authority for live causal state.

Includes:

- `tickManager`
- Execution validation and action application invoked under tickManager
- Reality updates committed under tickManager
- Final lifecycle cleanup committed under tickManager

Owns live mutable state:

- Agent state
- Life state
- Position state
- Interaction outcomes
- Environmental and resource state
- Birth and death events
- Action effects
- Tick progression

May read:

- Current live simulation state
- Approved Decision Layer outputs
- Approved Reality Layer inputs and rules
- Passive restore payloads after validation

Must not read:

- UI component state
- Inspector state
- Analysis reports
- Culture, myth, civilization memory, or semantic-audit output
- Persistence metadata as causal input

### 1.2 Decision Output Layer

Role:

> Produce intent and selection outputs without mutating live state.

Includes:

- Perception interpretation
- Intent scoring and enrichment
- Intent resolution and final selection
- Typology weighting

Owns:

- Immutable candidate-intent outputs
- Immutable score breakdowns
- Immutable final-selection outputs

May read:

- Approved simulation-state views
- Reality context required for scoring
- Memory and needs exposed by simulation contracts

Must not:

- Mutate agent or world state
- Execute actions
- Read UI, inspector, persistence, or analysis state
- Consume Observation Layer interpretations

### 1.3 Derived State Layer

Role:

> Build read models and historical interpretations from immutable snapshots.

Includes:

- Culture
- Civilization Memory
- Civilization Myth
- Settlement emergence
- Behavioral signatures

Owns:

- Immutable derived outputs only

May read:

- Immutable traces
- Immutable snapshots
- Previously derived immutable outputs in downstream order

Must not:

- Write live simulation state
- Influence intent or resolution
- Influence execution
- Become an intermediate mutation authority

### 1.4 Persistence Layer

Role:

> Serialize and restore state without defining state semantics.

Owns:

- Serialized payloads
- Save-version metadata
- Passive loading results

May read:

- Approved immutable simulation snapshots

May propose:

- A restore payload for validation and application by Simulation Authority

Must not:

- Mutate live simulation state directly
- Compute behavioral or biological meaning
- Transform semantics during save/load
- Feed persistence metadata into decisions
- Become the owner of fields merely because they are persisted

### 1.5 Presentation Layer

Role:

> Render read-only views for players and developers.

Includes:

- UI
- Inspector panels
- Debug views
- Simulation overlays

Owns:

- Local presentation state only, such as selected tabs or visual filters

May read:

- Immutable presentation models
- Immutable simulation snapshots
- Immutable derived and analysis reports

Must not:

- Mutate or enrich simulation state
- Invoke analyzers during render
- Execute simulation actions outside approved command boundaries
- Write derived results back into runtime
- Treat UI state as simulation authority

### 1.6 Analysis Layer

Role:

> Verify, compare, and explain immutable simulation artifacts.

Includes:

- Causal Isolation
- Semantic Audit
- Architecture verification reports
- Deterministic replay comparison

Owns:

- Immutable analysis reports only

May read:

- Immutable snapshots
- Immutable traces
- Immutable Decision/Execution artifacts supplied for verification

Must not:

- Import and execute Decision or Execution authority
- Mutate source artifacts
- Influence tick execution
- Feed reports into simulation or intent systems

## 2. Write/Read Permissions Matrix

Legend:

- `W`: may write the named state domain
- `R`: may read through an approved view or immutable snapshot
- `P`: may produce its own immutable output only
- `-`: access forbidden

| Layer | Live Agent/World State | Intent/Selection Outputs | Trace/Snapshots | Derived Reports | Save Payloads | UI State |
| --- | --- | --- | --- | --- | --- | --- |
| Simulation Authority | W/R | R | P | - | R after validation | - |
| Decision Output | R via approved view | P | - | - | - | - |
| Derived State | - | - | R | P/R downstream | - | - |
| Persistence | - | - | R | - | P/R | - |
| Presentation | - | - | R | R | - | W/R local only |
| Analysis | - | R immutable artifacts | R | P/R | - | - |

### Permission interpretation

`R` never means permission to retain a live mutable reference. It means reading
through an approved view or immutable snapshot.

`P` never means permission to commit output into live simulation state.

## 3. State Ownership Graph

```text
Reality inputs/rules
        |
        v
Decision Output Layer
  perception -> intent -> resolution output
        |
        v
Simulation Authority Layer
  validate -> execute -> mutate -> commit
        |
        +--------------------+
        |                    |
        v                    v
Immutable Trace        Immutable Snapshot
        |                    |
        v                    +------------------+
Derived State Layer                           |
  behavior -> settlement -> culture           |
  -> civilization memory -> myth              |
        |                                      |
        v                                      v
Presentation Layer                      Persistence Layer

Immutable Trace/Snapshot
        |
        v
Analysis Layer

Forbidden reverse edges:
Presentation -X-> Simulation Authority
Persistence  -X-> live state mutation
Derived      -X-> Decision/Execution
Analysis     -X-> Decision/Execution
```

## 4. State Domain Ownership Table

| State Domain | Single Writer | Permitted Readers | Write Forbidden |
| --- | --- | --- | --- |
| World tick | Simulation Authority | Decision views, snapshots, reports | All other layers |
| Agent physical/life state | Simulation Authority | Approved Decision views, snapshots | UI, Persistence, Derived, Analysis |
| Agent position | Simulation Authority | Approved readers and snapshots | All other layers |
| Memory/skills/traits/knowledge | Simulation Authority | Approved Decision views, traces | All other layers |
| Environment/resources/fields | Simulation Authority | Reality/Decision views, snapshots | All other layers |
| Intent candidates | Decision Output producer | Resolution, trace/analysis artifacts | Simulation mutation consumers |
| Final selected intent | Resolution output producer | Simulation Authority, trace/analysis | All other layers |
| Trace history | Trace-output producer | Derived, Analysis, Presentation | Simulation/Decision as causal input |
| Culture/settlement/signatures | Derived-output producer | Downstream derived systems, UI | Simulation/Decision/Execution |
| Civilization Memory/Myth | Derived-output producer | Presentation, downstream reports | Simulation/Decision/Execution |
| Analysis reports | Analysis-output producer | Presentation/developers | Simulation/Decision/Execution |
| Save payload | Persistence-output producer | Persistence and validated restore boundary | Direct live-state mutation |
| UI local state | Presentation | Presentation only | Simulation and other layers |

## 5. HP Placement Clarification

HP is not a system and is not a cross-layer authority.

Under this contract:

```text
HP, while it remains supported, is a field inside Simulation Authority state.
```

### Canonical placement

- Simulation Authority is the only permitted writer of simulation HP.
- Decision systems may read HP only through an explicitly approved simulation
  view.
- UI may display HP only through an immutable presentation model.
- Persistence may mirror HP only as serialized state.
- Analysis and Derived layers may observe HP only through immutable snapshots.

### Forbidden HP interpretations

- UI state must not become canonical HP state.
- Persisted HP must not define runtime semantics.
- Derived reports must not write HP.
- Analysis results must not modify HP.
- HP must not independently define existence when Life state owns `alive`.
- Multiple HP shapes must not be treated as multiple writers.

### Compatibility status

Legacy HP representations may continue to exist during migration, but they must
be interpreted as compatibility views of Simulation Authority state, not shared
state owned by several layers.

## 6. Cross-Layer Violation Rules

The following patterns violate this contract:

### Shared writer violations

```text
UI writes agent state
Persistence directly restores into live state
Analysis mutates source snapshots
Derived systems mutate world state
Decision systems execute actions
```

### Reverse influence violations

```text
Culture -> intent score
Myth -> behavior
Inspector state -> tick execution
Analysis report -> resolution
Save metadata -> decision weighting
```

### Snapshot violations

```text
Passing live agent/world references to inspector panels
Passing mutable trace objects to analyzers
Retaining mutable state references inside persistence
Writing derived properties onto source snapshots
```

### Ownership ambiguity violations

```text
Two fields independently define the same state fact
Two modules both commit updates to one state domain
A mirrored value becomes a second source of truth
A compatibility adapter becomes a mutation authority
```

## 7. Determinism Guarantees

The State Authority Model requires:

```text
Simulation(initial state, seed, commands)
= identical final state and execution trace
```

regardless of:

- UI enabled or disabled
- Inspector panels active or inactive
- Analysis systems enabled or disabled
- Derived reports generated or omitted
- Save serialization performed or omitted

### Determinism conditions

1. Non-simulation layers receive immutable snapshots only.
2. Analysis and Derived outputs never feed back into causality.
3. Presentation state is never read by simulation execution.
4. Persistence serialization has no side effects.
5. Restore payloads are validated and committed only by Simulation Authority.
6. Decision outputs are deterministic under identical approved inputs.
7. Only Simulation Authority commits live-state mutations.

## 8. Enforcement Checklist

This checklist is non-code guidance for reviews and future implementation
passes.

### State definition

- Does every new field have one named owner?
- Is the field live state, an immutable output, a snapshot, or a mirror?
- Is there exactly one writer?
- Are mirrored or derived representations explicitly non-authoritative?

### Dependency review

- Does any non-simulation module import live mutation authority?
- Does Decision read only approved simulation views?
- Does Simulation read any UI, analysis, derived, or inspector output?
- Does any report feed back into scoring, validation, or execution?

### Mutation review

- Is every live-state mutation committed under tickManager/Execution authority?
- Does persistence restore through a validated simulation boundary?
- Are UI handlers limited to commands and local presentation state?
- Do analyzers operate without mutating inputs?

### Snapshot review

- Are snapshots immutable or safely cloned?
- Are live references prevented from crossing layer boundaries?
- Are traces descriptive outputs rather than causal inputs?
- Are inspectors display-only?

### HP review

- Is HP treated as Simulation Authority state only?
- Are UI and persistence representations read-only mirrors?
- Is any system inferring existence, biology, or behavior from HP without an
  explicit compatibility contract?
- Has any new direct HP dependency been introduced?

### Determinism review

- Does disabling UI leave outcomes unchanged?
- Does disabling Analysis leave outcomes unchanged?
- Does omitting Derived report generation leave outcomes unchanged?
- Does serialization leave live state unchanged?
- Does identical input produce identical Decision and Execution outputs?

## Contract Summary

```text
Simulation Authority writes causal state.
Decision produces intent outputs.
Derived and Analysis layers interpret immutable artifacts.
Persistence mirrors state.
Presentation renders state.
No non-authority layer writes live simulation state.
```

State Authority Model v1 establishes single-writer simulation integrity and eliminates cross-layer state ambiguity.
