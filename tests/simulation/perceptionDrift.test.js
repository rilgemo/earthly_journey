const { applyBeliefUpdate, createBeliefState } = require('../../src/simulation/perception/beliefState');
const { convergeBeliefs } = require('../../src/simulation/perception/beliefConvergenceModel');
const { runPerceptionDriftTick } = require('../../src/simulation/perception/perceptionDriftController');
const { analyzeRumorStability } = require('../../src/simulation/perception/rumorStabilityAnalyzer');

function belief(claim, confidence = 0.8, source = 'source') {
  return applyBeliefUpdate(createBeliefState(), {
    eventKey: 'wolf-count',
    event: { eventKey: 'wolf-count', claim, source, tick: 0 },
    confidence,
    sourceId: source
  });
}

function latestClaim(state) {
  return state.perceivedEvents[state.perceivedEvents.length - 1].claim;
}

describe('Reality vs Perception Drift Stabilization Layer v1', () => {
  test('perception divergence increases over time without convergence', () => {
    const realityClaims = { 'wolf-count': 10 };
    let beliefStore = { villager: belief(10) };
    const initial = runPerceptionDriftTick({
      realityClaims,
      beliefStore,
      tick: 0,
      seed: 9
    });

    for (let tick = 1; tick <= 10; tick += 1) {
      beliefStore = runPerceptionDriftTick({
        realityClaims,
        beliefStore,
        tick,
        seed: 9
      }).beliefStore;
    }
    const later = runPerceptionDriftTick({
      realityClaims,
      beliefStore,
      tick: 11,
      seed: 9
    });

    expect(later.metrics.perceptionDriftIndex.villager)
      .toBeGreaterThan(initial.metrics.perceptionDriftIndex.villager);
  });

  test('high trust networks converge faster', () => {
    const store = { first: belief(4), second: belief(16) };
    const high = convergeBeliefs(store, {
      first: { second: 95 },
      second: { first: 95 }
    });
    const low = convergeBeliefs(store, {
      first: { second: 10 },
      second: { first: 10 }
    });
    const highGap = Math.abs(latestClaim(high.beliefStore.first) - latestClaim(high.beliefStore.second));
    const lowGap = Math.abs(latestClaim(low.beliefStore.first) - latestClaim(low.beliefStore.second));

    expect(highGap).toBeLessThan(lowGap);
    expect(high.metrics.convergenceScore).toBeGreaterThan(low.metrics.convergenceScore);
  });

  test('low trust networks preserve fragmented beliefs', () => {
    const store = { first: belief(4), second: belief(16) };
    const result = convergeBeliefs(store, {
      first: { second: 5 },
      second: { first: 5 }
    });

    expect(latestClaim(result.beliefStore.first)).toBe(4);
    expect(latestClaim(result.beliefStore.second)).toBe(16);
    expect(result.metrics.convergenceScore).toBe(0);
  });

  test('drift analysis leaves reality unchanged', () => {
    const realityClaims = { 'wolf-count': 10 };
    const before = JSON.stringify(realityClaims);

    runPerceptionDriftTick({
      realityClaims,
      beliefStore: { villager: belief(30) },
      tick: 10,
      seed: 4
    });

    expect(JSON.stringify(realityClaims)).toBe(before);
  });

  test('stable false rumor clusters persist without automatic correction', () => {
    const store = {
      first: belief(30, 0.9, 'hunter'),
      second: belief(30, 0.8, 'merchant')
    };
    const first = analyzeRumorStability({
      realityClaims: { 'wolf-count': 10 },
      beliefStore: store
    });
    const later = analyzeRumorStability({
      realityClaims: { 'wolf-count': 10 },
      beliefStore: store,
      previousClusters: first.clusters
    });

    expect(first.stableFalseBeliefs).toHaveLength(1);
    expect(later.metrics.misinformationPersistenceRate).toBe(1);
    expect(latestClaim(store.first)).toBe(30);
  });

  test('drift remains bounded under repeated updates', () => {
    const realityClaims = { 'wolf-count': 10 };
    let beliefStore = { villager: belief(10) };

    for (let tick = 1; tick <= 300; tick += 1) {
      beliefStore = runPerceptionDriftTick({
        realityClaims,
        beliefStore,
        tick,
        seed: 88,
        config: { maxDrift: 0.5, maxRate: 0.2 }
      }).beliefStore;
    }

    expect(latestClaim(beliefStore.villager)).toBeGreaterThanOrEqual(5);
    expect(latestClaim(beliefStore.villager)).toBeLessThanOrEqual(15);
  });

  test('controller exposes inspector-ready stability metrics', () => {
    const result = runPerceptionDriftTick({
      realityClaims: { 'wolf-count': 10 },
      beliefStore: { villager: belief(15) },
      tick: 3,
      seed: 7
    });

    expect(result.metrics).toEqual(expect.objectContaining({
      perceptionDriftIndex: expect.any(Object),
      globalBeliefEntropy: expect.any(Number),
      rumorClusterStrength: expect.any(Number),
      convergenceScore: expect.any(Number),
      misinformationPersistenceRate: expect.any(Number)
    }));
  });

  test('drift control is deterministic under the same seed', () => {
    const input = {
      realityClaims: { 'wolf-count': 10 },
      beliefStore: { villager: belief(12) },
      tick: 20,
      seed: 12345
    };

    expect(runPerceptionDriftTick(input)).toEqual(runPerceptionDriftTick(input));
  });
});
