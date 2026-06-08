const { resolveCultureEmergence } = require('../../src/simulation/culture/cultureEmergenceResolver');
const { detectCulturePatterns } = require('../../src/simulation/culture/culturePatternDetector');
const { calculateBehavioralConvergence } = require('../../src/simulation/culture/behavioralConvergenceModel');
const { calculateCultureStabilityIndex } = require('../../src/simulation/culture/cultureStabilityIndex');
const { scoreIntents } = require('../../src/simulation/intent/intentScorer');

function createTrace() {
  return Object.freeze([
    Object.freeze({
      tickId: 1,
      agents: Object.freeze([
        Object.freeze({ agentId: 'a1', actionSelected: 'forage', position: 'meadow', agentTypologySnapshot: { typeId: 'human_like' } }),
        Object.freeze({ agentId: 'a2', actionSelected: 'forage', position: 'meadow', agentTypologySnapshot: { typeId: 'animal_like' } })
      ])
    }),
    Object.freeze({
      tickId: 2,
      agents: Object.freeze([
        Object.freeze({ agentId: 'a1', actionSelected: 'forage', position: 'meadow', agentTypologySnapshot: { typeId: 'human_like' } }),
        Object.freeze({ agentId: 'a2', actionSelected: 'rest', position: 'meadow', agentTypologySnapshot: { typeId: 'animal_like' } })
      ])
    }),
    Object.freeze({
      tickId: 3,
      agents: Object.freeze([
        Object.freeze({ agentId: 'a1', actionSelected: 'forage', position: 'meadow', agentTypologySnapshot: { typeId: 'human_like' } }),
        Object.freeze({ agentId: 'a2', actionSelected: 'forage', position: 'meadow', agentTypologySnapshot: { typeId: 'animal_like' } })
      ])
    })
  ]);
}

function createSettlementSnapshot() {
  return Object.freeze({
    settlements: Object.freeze([
      Object.freeze({ id: 'settlement:meadow', tiles: Object.freeze(['meadow']), dominantActivities: Object.freeze([{ action: 'forage', count: 5 }]) })
    ])
  });
}

function createIntentInput() {
  const agent = {
    id: 'a1',
    type: 'human',
    location: 'meadow',
    traits: {},
    skills: {},
    knowledge: [],
    needs: { hunger: 10, fatigue: 10, manaNeed: 0, socialNeed: 0, safetyNeed: 0 },
    affinities: { earth: 0, fire: 0, water: 0, arcane: 0 },
    mana: { stability: 0, affinity: { arcane: 0 } },
    memory: { shortTerm: [], longTerm: [], recentEvents: [], bias: {} }
  };
  const actions = [{ id: 'rest', type: 'survival', baseUtility: 1 }];
  const context = {
    perception: { field: {}, nearbyAgents: [] },
    memories: [],
    needs: { profile: agent.needs },
    demandIndex: {}
  };
  return { agent, actions, context };
}

describe('Culture Emergence System v1', () => {
  test('culture detection does not mutate runtime state', () => {
    const traces = createTrace();
    const before = JSON.stringify(traces);

    resolveCultureEmergence({ traces, settlementSnapshot: createSettlementSnapshot() });

    expect(JSON.stringify(traces)).toBe(before);
  });

  test('culture is fully derived from traces only', () => {
    const result = resolveCultureEmergence({ traces: createTrace() });

    expect(result.culture.cultureId).toContain('forage');
    expect(result.cultureTrace.detectedPatterns[0].action).toBe('forage');
  });

  test('identical input traces produce identical culture output', () => {
    expect(resolveCultureEmergence({ traces: createTrace(), settlementSnapshot: createSettlementSnapshot() }))
      .toEqual(resolveCultureEmergence({ traces: createTrace(), settlementSnapshot: createSettlementSnapshot() }));
  });

  test('no influence on intent/resolution/field systems', () => {
    const { agent, actions, context } = createIntentInput();
    const before = scoreIntents(agent, actions, context);

    resolveCultureEmergence({ traces: createTrace(), settlementSnapshot: createSettlementSnapshot() });

    expect(scoreIntents(agent, actions, context)).toEqual(before);
  });

  test('deterministic replay consistency', () => {
    const first = calculateCultureStabilityIndex(createTrace());
    const second = calculateCultureStabilityIndex(createTrace());

    expect(first).toEqual(second);
  });

  test('stable clustering under same seed', () => {
    const first = resolveCultureEmergence({ traces: createTrace(), settlementSnapshot: createSettlementSnapshot() });
    const second = resolveCultureEmergence({ traces: createTrace(), settlementSnapshot: createSettlementSnapshot() });

    expect(first.cultureTrace.clusterMapping).toEqual(second.cultureTrace.clusterMapping);
  });

  test('no feedback loop into simulation engine', () => {
    const patterns = detectCulturePatterns(createTrace());
    const convergence = calculateBehavioralConvergence(createTrace());

    expect(patterns[0].action).toBe('forage');
    expect(convergence.convergenceIndex).toBeGreaterThanOrEqual(0);
    expect(patterns.every(pattern => !Object.prototype.hasOwnProperty.call(pattern, 'execute'))).toBe(true);
  });
});
