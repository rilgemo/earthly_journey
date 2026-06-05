# Simulation Contract Test Suite

This directory contains the authoritative contract tests for the Earthly simulation kernel.

See [../AI/CONTRACT_TEST_SUITE.md](../AI/CONTRACT_TEST_SUITE.md) for the complete specification.

## Quick Start

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- actionRegistry
npm test -- executionContract
npm test -- traceIntegrity
npm test -- determinism
npm test -- manaSystem
npm test -- worldField
npm test -- smoke

# Watch mode (for development)
npm test -- --watch

# With coverage
npm test -- --coverage
```

## Directory Structure

### `/contract/`
Layer protection tests for the core execution pipeline.

- `actionRegistry.test.js` — Only registered actions execute
- `executionContract.test.js` — Intent → Contract → TickManager pipeline
- `traceIntegrity.test.js` — All rejections are traceable
- `entitySchema.test.js` — Data schema validation (future)

### `/simulation/`
Runtime tests for the simulation kernel.

- `determinism.test.js` — Fixed seed = fixed output
- `manaSystem.test.js` — Agent mana conservation
- `worldField.test.js` — Elemental field stability
- `tickManager.test.js` — Tick loop correctness (future)

### `/regression/`
Daily sanity checks.

- `smoke.test.js` — 10 agents, 20 ticks, no crashes, no NaN

### `/__fixtures__/`
Test data and fixtures.

- `agents.json` — Prebuilt agent test data
- `world.json` — Prebuilt world test data
- `traces.json` — Example traces

## Test Authority

**Contract tests are authoritative.**

1. A runtime feature is **not valid** until protected by contract tests.
2. All new features must add at least one contract test before merging.
3. CI/CD must pass all tests on every commit.
4. Coverage target: ≥ 80% for core layers (Registry, Contract, Manager).

## Key Rules

### Do's
- ✅ Test one behavior per test
- ✅ Use descriptive test names
- ✅ Include boundary conditions
- ✅ Test determinism with fixed seeds
- ✅ Validate state invariants

### Don'ts
- ❌ Don't test UI-only code
- ❌ Don't skip tests without a ticket
- ❌ Don't assume async behavior completes
- ❌ Don't rely on global state between tests
- ❌ Don't add tests for future features

## Test Utils

[testUtils.js](testUtils.js) provides:

- `ACTION_REGISTRY` — Authorized actions
- `isRegisteredAction(action)` — Validation
- `ExecutionContract` — Contract layer
- `WorldState` — Simulation state
- `SeededRandom` — Deterministic RNG
- `TickManager` — Tick runner

## Exit Criteria for v1

✅ All 7 test categories > 0 passing tests
✅ No tests marked `.skip()`
✅ Coverage ≥ 80% (Registry, Contract, Manager)
✅ Smoke test passes daily
✅ CI/CD integrated

## Future Scope

Once contract tests are stable:

1. Replay system (depends on trace stability)
2. Simulation Inspector v1 (depends on contract verification)
3. Heatmap visualization
4. Emergence metrics

These require trustworthy Trace, which depends on stable Execution Contract, which is what we're establishing now.

## Debugging

If a test fails:

1. Check the error message for the contract violation
2. Look at the trace history: `manager.contract.getHistory()`
3. Validate world state: `manager.world.validateState()`
4. Check for NaN: `isNaN(value)`
5. Verify determinism: same seed = same result?

## Contributing

When adding a new test:

1. Place it in the correct directory (contract/simulation/regression)
2. Name it after what it protects
3. Add boundary conditions
4. Update this README if adding a new category
5. Ensure it passes locally before pushing
