const { createBehavioralSignature } = require('../../src/simulation/behavior/behavioralSignature');
const { createBeliefState, applyBeliefUpdate } = require('../../src/simulation/perception/beliefState');
const { runPerceptionDriftTick } = require('../../src/simulation/perception/perceptionDriftController');
const { createPopulationTensionMap } = require('../../src/simulation/migrationPressure/populationTensionMap');
const { calculatePressure } = require('../../src/simulation/migrationPressure/pressureModel');
const { ReplayBuffer } = require('../../src/simulation/replayBuffer');
const { TraceCollector } = require('../../src/simulation/traceCollector');

function settlement(overrides = {}) {
  return {
    id: 'settlement:tile-1-1',
    tiles: ['tile-1-1'],
    persistenceScore: 0.8,
    metrics: { activityStability: 0.8, demandAlignment: 0.4 },
    ...overrides
  };
}

function trace({ volatility = 0.1, demand = 20, communications = 0 } = {}) {
  return {
    tickId: 1,
    demand: { index: { totalDemand: demand } },
    agents: [
      { agentId: 'a', position: 'tile-1-1', actionSelected: 'farm', communicationTrace: communications ? {} : null },
      { agentId: 'b', position: 'tile-1-1', actionSelected: 'forge' }
    ],
    settlements: { settlements: [settlement()] },
    resourceFlow: {
      balance: {
        before: {
          foodPotential: 100,
          waterPotential: 100,
          materialPotential: 100,
          arcanePotential: 100
        },
        delta: {
          foodPotential: -100 * volatility,
          waterPotential: -50 * volatility,
          materialPotential: 25 * volatility,
          arcanePotential: 10 * volatility
        }
      }
    }
  };
}

function perceptionDrift(index = 0) {
  return {
    metrics: {
      perceptionDriftIndex: { a: index, b: index },
      globalBeliefEntropy: index
    }
  };
}

describe('Migration Pressure Layer v1', () => {
  test('migration pressure computation is deterministic from the same input', () => {
    const input = {
      trace: trace({ volatility: 0.2 }),
      settlements: { settlements: [settlement()] },
      perceptionDrift: perceptionDrift(0.1),
      trustNetwork: { a: { b: 70 }, b: { a: 70 } },
      behaviorSignatures: { a: createBehavioralSignature([]) }
    };

    expect(createPopulationTensionMap(input)).toEqual(createPopulationTensionMap(input));
  });

  test('no movement or relocation logic exists in output', () => {
    const result = createPopulationTensionMap({ trace: trace(), settlements: { settlements: [settlement()] } });
    const serialized = JSON.stringify(result).toLowerCase();

    expect(serialized).not.toContain('destination');
    expect(serialized).not.toContain('route');
    expect(serialized).not.toContain('relocation');
    expect(serialized).not.toContain('moveagent');
  });

  test('stability decreases as volatility increases', () => {
    const calm = calculatePressure({ settlement: settlement(), trace: trace({ volatility: 0.01 }) });
    const volatile = calculatePressure({ settlement: settlement(), trace: trace({ volatility: 0.8 }) });

    expect(volatile.stabilityScore).toBeLessThan(calm.stabilityScore);
    expect(volatile.pressureScore).toBeGreaterThan(calm.pressureScore);
  });

  test('anchoring reduces pressure', () => {
    const weak = calculatePressure({
      settlement: settlement({ persistenceScore: 0.1, metrics: { activityStability: 0.1 } }),
      trace: trace({ volatility: 0.4 }),
      trustNetwork: {}
    });
    const anchored = calculatePressure({
      settlement: settlement({ persistenceScore: 1, metrics: { activityStability: 1 } }),
      trace: trace({ volatility: 0.4, communications: 1 }),
      trustNetwork: { a: { b: 95 }, b: { a: 95 } }
    });

    expect(anchored.pressureScore).toBeLessThan(weak.pressureScore);
  });

  test('social cohesion stabilizes regions', () => {
    const isolated = calculatePressure({
      settlement: settlement(),
      trace: trace({ volatility: 0.3 }),
      trustNetwork: {}
    });
    const cohesive = calculatePressure({
      settlement: settlement(),
      trace: trace({ volatility: 0.3, communications: 1 }),
      trustNetwork: { a: { b: 100 }, b: { a: 100 } }
    });

    expect(cohesive.stabilityField.socialAnchoring).toBeGreaterThan(isolated.stabilityField.socialAnchoring);
    expect(cohesive.pressureScore).toBeLessThan(isolated.pressureScore);
  });

  test('perception mismatch increases instability', () => {
    const low = calculatePressure({
      settlement: settlement(),
      trace: trace({ volatility: 0.1 }),
      perceptionDrift: perceptionDrift(0)
    });
    const high = calculatePressure({
      settlement: settlement(),
      trace: trace({ volatility: 0.1 }),
      perceptionDrift: perceptionDrift(0.9)
    });

    expect(high.pressureScore).toBeGreaterThan(low.pressureScore);
    expect(high.dominantInstabilitySource).toBe('perceptionMismatch');
  });

  test('replay preserves migration pressure snapshots', () => {
    const collector = new TraceCollector();
    collector.beginTick(1, { areas: new Map() });
    trace().agents.forEach(agentTrace => collector.recordAgent(agentTrace));
    collector.current.resourceFlow = trace().resourceFlow;
    collector.current.demand = trace().demand;
    collector.current.settlements = { settlements: [settlement()] };
    collector.endTick();
    const replay = new ReplayBuffer();
    replay.push({ tick: 1, trace: collector.getAll() });

    expect(collector.getLatest().migrationPressureSnapshot).toBeDefined();
    expect(replay.latest().trace[0].migrationPressureSnapshot)
      .toEqual(collector.getLatest().migrationPressureSnapshot);
  });

  test('outputs are bounded between zero and one', () => {
    const result = createPopulationTensionMap({
      trace: trace({ volatility: 10, demand: 1000 }),
      settlements: { settlements: [settlement()] },
      perceptionDrift: perceptionDrift(10)
    });

    result.regionPressures.forEach(region => {
      expect(region.stabilityScore).toBeGreaterThanOrEqual(0);
      expect(region.stabilityScore).toBeLessThanOrEqual(1);
      expect(region.pressureScore).toBeGreaterThanOrEqual(0);
      expect(region.pressureScore).toBeLessThanOrEqual(1);
      expect(['stable', 'stressed', 'fragile', 'collapsing']).toContain(region.riskClassification);
    });
  });

  test('activity clusters remain structurally unchanged', () => {
    const original = { settlements: [settlement()] };
    const before = JSON.stringify(original);

    createPopulationTensionMap({ trace: trace(), settlements: original });

    expect(JSON.stringify(original)).toBe(before);
  });

  test('perception drift metrics can feed pressure without mutating beliefs', () => {
    const belief = applyBeliefUpdate(createBeliefState(), {
      eventKey: 'food',
      event: { eventKey: 'food', claim: 40 },
      confidence: 0.8
    });
    const drift = runPerceptionDriftTick({
      realityClaims: { food: 80 },
      beliefStore: { a: belief },
      tick: 2,
      seed: 1
    });
    const pressure = calculatePressure({
      settlement: settlement(),
      trace: trace({ volatility: 0.1 }),
      perceptionDrift: drift
    });

    expect(pressure.stabilityField.perceptionMismatch).toBeGreaterThan(0);
    expect(belief.perceivedEvents[0].claim).toBe(40);
  });
});
