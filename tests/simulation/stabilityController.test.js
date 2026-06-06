const { createArea } = require('../../src/simulation/worldField');
const { runStabilityController } = require('../../src/simulation/stability/stabilityController');
const { computeStabilityMetrics } = require('../../src/simulation/stability/stabilityMetrics');
const { tickManager } = require('../../src/simulation/tickManager');
const { emergenceTickHook } = require('../../src/simulation/coupledEmergence/emergenceTickHook');

function highInstabilityInput() {
  return {
    fieldDynamics: {
      preDiffusionState: { town: { fire: 0 } },
      postDiffusionState: { town: { fire: 8 } },
      finalFieldState: { town: { fire: 20 } }
    },
    emergence: {
      memoryImprintLog: [{ fields: { fire: 5 } }],
      finalPerturbationQueue: [{ fields: { fire: 10 } }]
    },
    agents: Array.from({ length: 12 }, (_, index) => ({ id: index, location: 'town' })),
    agentLog: Array.from({ length: 8 }, () => ({ action: 'attack', tileId: 'town' }))
  };
}

function createWorld() {
  const area = createArea('town', { fire: 0 }, { baselineField: { fire: 0 } });
  return {
    tick: 0,
    areas: new Map([['town', area]]),
    fieldPerturbationQueue: [{ tileId: 'town', perturbation: { fire: 20 } }],
    fieldDynamicsConfig: { diffusionRate: 0.1, conversionRate: 0, regenRate: 0.1 },
    emergenceHistory: {},
    getField(tileId) {
      return this.areas.get(tileId).field;
    },
    getRecentEvents() {
      return [];
    }
  };
}

describe('Stability Controller v1', () => {
  test('adjusts gains without modifying input state values', () => {
    const input = highInstabilityInput();
    const snapshot = JSON.parse(JSON.stringify(input));
    const result = runStabilityController(input);

    expect(result.adjustedGains.field.diffusionGain).toBeLessThan(1);
    expect(result.adjustedGains.field.equilibriumRestorationRate).toBeGreaterThan(1);
    expect(input).toEqual(snapshot);
  });

  test('field values remain untouched directly', () => {
    const world = createWorld();
    const fieldBefore = { ...world.areas.get('town').field };

    runStabilityController(highInstabilityInput());

    expect(world.areas.get('town').field).toEqual(fieldBefore);
  });

  test('emergence amplification is reduced under instability', () => {
    const result = runStabilityController(highInstabilityInput());
    const unregulated = emergenceTickHook({
      agentLog: [{ action: 'cast_spark', tileId: 'town' }]
    });
    const regulated = emergenceTickHook({
      agentLog: [{ action: 'cast_spark', tileId: 'town' }],
      config: { gains: result.adjustedGains }
    });

    expect(result.adjustedGains.emergence.emergenceCouplingGain).toBeLessThan(1);
    expect(result.adjustedGains.emergence.memoryImprintRate).toBeLessThan(1);
    expect(result.adjustedGains.emergence.repeatedActionReinforcementStrength).toBeLessThan(1);
    expect(regulated.perturbations[0].fields.arcane)
      .toBeLessThan(unregulated.perturbations[0].fields.arcane);
  });

  test('social clustering triggers dampening', () => {
    const result = runStabilityController(highInstabilityInput());

    expect(result.metrics.agentClusteringDensity).toBe(12);
    expect(result.adjustedGains.social.socialCouplingGain).toBeLessThan(1);
    expect(result.adjustedGains.social.memoryPropagationStrength).toBeLessThan(1);
  });

  test('metrics are computed from diagnostics only', () => {
    const metrics = computeStabilityMetrics({
      fieldDynamics: {
        preDiffusionState: { town: { fire: 0 } },
        postDiffusionState: { town: { fire: 0 } },
        finalFieldState: { town: { fire: 10 } }
      },
      agents: [],
      agentLog: [],
      emergence: {}
    });

    expect(metrics.fieldDeltaMagnitude).toBe(10);
    expect(metrics.fieldInstabilityIndex).toBe(1);
    expect(metrics.socialInstabilityIndex).toBe(0);
    expect(metrics.emergenceInstabilityIndex).toBe(0);
    expect(metrics.globalSystemStabilityScore).toBeCloseTo(2 / 3);
  });

  test('controller is deterministic under the same input', () => {
    const input = highInstabilityInput();
    expect(runStabilityController(input)).toEqual(runStabilityController(input));
  });

  test('controller does not interfere with agent decisions', () => {
    const input = highInstabilityInput();
    input.agentLog = [{ action: 'cast_spark', selectedIntent: 'cast_spark', score: 42 }];
    const decisionsBefore = JSON.parse(JSON.stringify(input.agentLog));

    const result = runStabilityController(input);

    expect(input.agentLog).toEqual(decisionsBefore);
    expect(result.selectedIntent).toBeUndefined();
    expect(result.resolutionResult).toBeUndefined();
  });

  test('tickManager stores stability gains for the next tick', () => {
    const world = createWorld();

    tickManager([], world);

    expect(world.lastStabilityTrace).toBeDefined();
    expect(world.stabilityGains).toEqual(world.lastStabilityTrace.adjustedGains);
    expect(world.stabilityGains.field.diffusionGain).toBeLessThan(1);
    expect(world.areas.get('town').field.fire)
      .toBe(world.lastFieldDynamicsTrace.finalFieldState.town.fire);
    expect(world.stabilityHistory).toHaveLength(1);
  });

  test('field gains regulate the next field tick without clamping state', () => {
    const tileA = createArea('a', { fire: 10 }, { neighbors: ['b'], baselineField: { fire: 10 } });
    const tileB = createArea('b', { fire: 0 }, { neighbors: ['a'], baselineField: { fire: 0 } });
    const world = {
      tick: 0,
      areas: new Map([['a', tileA], ['b', tileB]]),
      fieldPerturbationQueue: [],
      fieldDynamicsConfig: { diffusionRate: 0.1, conversionRate: 0, regenRate: 0 },
      stabilityGains: {
        field: { diffusionGain: 0.5, conversionGain: 1, equilibriumRestorationRate: 1 }
      },
      getField(tileId) {
        return this.areas.get(tileId).field;
      },
      getRecentEvents() {
        return [];
      }
    };

    tickManager([], world);

    expect(world.lastFieldDynamicsTrace.postDiffusionState.a.fire).toBeCloseTo(9.5);
    expect(world.lastFieldDynamicsTrace.postDiffusionState.b.fire).toBeCloseTo(0.5);
  });
});
