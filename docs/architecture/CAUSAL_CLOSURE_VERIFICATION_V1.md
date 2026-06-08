# Causal Closure Verification v1

## Scope

This verification audits the structural invariant defined by `AGENTS.md`:
Observation Layer outputs may be consumed by inspectors and reports only. They
must never influence Decision Layer or Execution Layer behavior.

## Detected Violations

### Corrected: Causal Isolation imported Decision Layer functions

`src/analysis/causalIsolation/phaseIsolationValidator.js` and
`deterministicReplayVerifier.js` previously imported and executed intent
scoring, enrichment, resolution, or the complete intent pipeline.

This created a structural Observation-to-Decision dependency even though the
modules were used for verification only.

The validators now compare externally supplied phase artifacts. They no longer
invoke Decision Layer authority.

## Confirmed Invariants

- Observation trace collection can be enabled or disabled without changing
  execution logs or world-state results.
- Observation modules do not import intent, resolution, or tick authority.
- Decision and Execution modules do not import Culture, Settlement,
  Civilization Memory, Civilization Myth, Semantic Audit, Causal Isolation, or
  Behavioral Signature systems.
- Culture, Civilization Memory, and Civilization Myth outputs are immutable
  downstream reports and preserve their source inputs.
- Inspectors consume computed reports and do not participate in simulation
  execution.

## Dependency Graph Snapshot

```text
Reality -> Decision -> Execution -> Trace
                                  |
                                  v
                Behavioral Patterns -> Culture
                                           |
                                           v
                           Civilization Memory -> Civilization Myth

Trace/Observation -> Inspector
Trace/Observation -> Verification Reports

Forbidden and verified absent:
Observation -X-> Decision
Observation -X-> Execution
Inspector   -X-> Runtime State
```

## Verification Harness

`tests/analysis/causalClosure.test.js` verifies:

1. The same initial state produces identical execution and world state with
   observation collection enabled or disabled.
2. Observation modules have no imports into Decision or Execution authority.
3. Decision and Execution modules have no imports into Observation systems.
4. Downstream observation reports are immutable and do not mutate inputs.

## Risk Assessment

### Low: string-based dependency scanning

The dependency invariant test scans source imports using forbidden authority
names. It is deterministic and useful as a repository guard, but aliases or
dynamic imports could evade it. Keep imports static and explicit.

### Low: mutable trace payload internals

Top-level observation reports are frozen. New report builders must continue to
freeze nested collections or return fresh values so consumers cannot mutate
shared trace data indirectly.

## Result

Causal closure is valid after correction of the Causal Isolation dependency.
No Observation-to-Decision or Observation-to-Execution edge remains in the
audited runtime structure.
