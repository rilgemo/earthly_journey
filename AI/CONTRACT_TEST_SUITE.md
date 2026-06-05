# Simulation Contract Test Suite v1

This document defines the authoritative contract tests that protect the Earthly simulation kernel.

## Authority

Contract tests are **authoritative**. 

A runtime feature is not considered valid until protected by contract tests.

Every new runtime feature must add at least one contract test before merging to main.

## Required Coverage

The following layers must be protected by contract tests:

1. **Action Registry** — Only registered actions execute
2. **Execution Contract** — Intent → Contract → TickManager pipeline
3. **Trace Integrity** — All rejection events record reasons
4. **Tick Determinism** — Same seed = same result
5. **Mana Conservation** — No value explosion or negative state
6. **Field Stability** — Elemental fields bounded and stable
7. **Smoke Tests** — Daily regression sanity checks

## Test Suite Structure

```
tests/
├── contract/
│   ├── actionRegistry.test.js          # Test 1
│   ├── executionContract.test.js       # Test 2
│   ├── traceIntegrity.test.js          # Test 3
│   └── entitySchema.test.js
│
├── simulation/
│   ├── tickManager.test.js             # Test 4
│   ├── manaSystem.test.js              # Test 5
│   ├── worldField.test.js              # Test 6
│   └── determinism.test.js             # Test 4 (determinism focus)
│
└── regression/
    └── smoke.test.js                   # Test 7

tests/__fixtures__/
├── agents.json                         # Test data
├── world.json
└── traces.json
```

## Test 1: Action Registry Enforcement

**Goal**: Unknown actions never execute.

```
Unregistered Action === Permanent Rejection
```

**Tests**:
- Registered action in `action_registry.json` passes validation
- Unknown action returns false for `isRegisteredAction()`
- Execution contract rejects unregistered actions

**File**: `tests/contract/actionRegistry.test.js`

## Test 2: Execution Contract

**Goal**: Intent → Contract → TickManager pipeline is correct.

```
Intent
  ↓
Execution Contract Validation
  ↓ (passes)
TickManager
  ↓
World State Mutation
```

**Tests**:
- Valid registered intent executes
- Unregistered intent rejected with reason
- `result.executed` is boolean
- `result.rejectionReason` defined on reject
- Rejected intent never touches TickManager

**File**: `tests/contract/executionContract.test.js`

## Test 3: Trace Integrity

**Goal**: Every rejection is traceable.

```
actionRejected = true  ===  rejectionReason ≠ null
```

**Tests**:
- Rejected action creates trace with `actionRejected: true`
- `rejectionReason` is never null when `actionRejected: true`
- Valid action creates trace with `actionRegistered: true`
- Trace contains all required fields per `TRACE_MODEL`

**File**: `tests/contract/traceIntegrity.test.js`

## Test 4: Tick Determinism

**Goal**: Fixed seed = fixed output.

```
runSimulation(seed=12345, world, agents)
runSimulation(seed=12345, world, agents)
↓
result_a === result_b
```

**Tests**:
- Same seed produces identical tick results
- Agents perform same actions in same order
- World state diffs are identical
- Traces are bitwise identical (excluding timestamps)

**File**: `tests/simulation/determinism.test.js`

## Test 5: Mana Conservation

**Goal**: Agent mana never goes negative or infinite.

```
0 ≤ agent.mana ≤ agent.maxMana
```

**Tests**:
- Mana never < 0
- Mana never > maxMana (unless explicitly buffed)
- Mana drain/restore balanced per tick
- Long run (1000+ ticks) maintains bounds

**File**: `tests/simulation/manaSystem.test.js`

## Test 6: Field Stability

**Goal**: Elemental fields remain bounded.

```
0 ≤ fire,water,earth,arcane < MAX_FIELD
```

**Tests**:
- No field exceeds MAX_FIELD after 5000 ticks
- Fields oscillate within bounds
- Field decay works correctly
- No field goes negative

**File**: `tests/simulation/worldField.test.js`

## Test 7: Smoke Test

**Goal**: Daily sanity check.

```
20 ticks + 10 agents
→ no crash
→ no unregistered actions
→ no NaN
```

**Tests**:
- 10 agents simulate 20 ticks
- No exceptions thrown
- All executed actions registered
- No NaN in any numeric field
- World state remains valid

**File**: `tests/regression/smoke.test.js`

## Running Tests

```bash
# Run all contract tests
npm test

# Run specific suite
npm test -- actionRegistry

# Run with coverage
npm test -- --coverage

# Run smoke test (daily)
npm test -- smoke
```

## Exit Criteria

A feature is "contract-protected" when:

1. ✅ All 7 test categories have > 0 passing tests
2. ✅ No test marked as `.skip()`
3. ✅ Coverage ≥ 80% for core layers (Registry, Contract, Manager)
4. ✅ All fixtures load without error
5. ✅ CI/CD runs tests on every commit

## Future: Inspector UI

Once contract tests are passing, Simulation Inspector v1 can safely display:

- Trace conflict graphs
- Mana/field charts
- Action execution timeline
- Rejection reason heatmap

Because all data is now contract-verified.

## Non-Scope

The following are **not** tested in v1:

- Replay system (depends on trace stability)
- Heatmap visualization (depends on trace collection)
- Inspector UI (depends on contract tests)
- Emergence metrics (depends on long trace history)

These systems depend on stable Trace, which depends on stable Execution Contract, which we're establishing now.
