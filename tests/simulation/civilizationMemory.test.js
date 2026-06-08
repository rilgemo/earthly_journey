const { buildCivilizationMemory } = require('../../src/simulation/civilizationMemory/civilizationMemoryBuilder');
const { compressPatterns } = require('../../src/simulation/civilizationMemory/memoryCompressionEngine');
const { calculateCivilizationDrift } = require('../../src/simulation/civilizationMemory/civilizationDriftModel');
const { scoreIntents } = require('../../src/simulation/intent/intentScorer');

function createInput() {
  return Object.freeze({
    cultureTraces: Object.freeze([
      Object.freeze({
        cultureId: 'culture:forage',
        timeWindow: 3,
        detectedPatterns: Object.freeze([
          Object.freeze({ action: 'forage', count: 4 }),
          Object.freeze({ action: 'rest', count: 2 })
        ])
      }),
      Object.freeze({
        cultureId: 'culture:forage',
        timeWindow: 3,
        detectedPatterns: Object.freeze([
          Object.freeze({ action: 'forage', count: 3 })
        ])
      })
    ]),
    settlementSnapshots: Object.freeze([
      Object.freeze({ settlements: Object.freeze([Object.freeze({ id: 'settlement:meadow' })]) })
    ]),
    behavioralHistory: Object.freeze([
      Object.freeze({ dominantActions: Object.freeze([Object.freeze({ action: 'forage', count: 4 })]) })
    ]),
    demandHistory: Object.freeze([
      Object.freeze({ tick: 1, food: 0.8 }),
      Object.freeze({ tick: 2, food: 0.7 })
    ]),
    resourceHistory: Object.freeze([
      Object.freeze({ tick: 1, food: 10 })
    ]),
    startTick: 1,
    endTick: 3
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

describe('Civilization Memory Formation Layer v1', () => {
  test('memory formation is deterministic under identical traces', () => {
    expect(buildCivilizationMemory(createInput())).toEqual(buildCivilizationMemory(createInput()));
  });

  test('no runtime system is affected', () => {
    const { agent, actions, context } = createIntentInput();
    const before = scoreIntents(agent, actions, context);

    buildCivilizationMemory(createInput());

    expect(scoreIntents(agent, actions, context)).toEqual(before);
  });

  test('memory only depends on trace inputs', () => {
    const result = buildCivilizationMemory(createInput());

    expect(result.civilizationMemory.persistentPatterns.length).toBeGreaterThan(0);
    expect(result.civilizationMemoryTrace.memoryGraph.nodes[0].id).toBeDefined();
  });

  test('identical history produces identical memory graph', () => {
    expect(buildCivilizationMemory(createInput()).civilizationMemoryTrace.memoryGraph)
      .toEqual(buildCivilizationMemory(createInput()).civilizationMemoryTrace.memoryGraph);
  });

  test('drift model is stable and reproducible', () => {
    const graph = buildCivilizationMemory(createInput()).civilizationMemoryTrace.memoryGraph;
    const stability = { structuralStabilityScore: 0.5, crossAgentPersistenceIndex: 0.5 };

    expect(calculateCivilizationDrift(graph, stability)).toEqual(calculateCivilizationDrift(graph, stability));
  });

  test('compression does not alter source trace integrity', () => {
    const input = createInput();
    const before = JSON.stringify(input);

    buildCivilizationMemory(input);
    compressPatterns([{ key: 'culture:forage', type: 'Cultural Stability Memory', source: 'culture', count: 1 }]);

    expect(JSON.stringify(input)).toBe(before);
  });

  test('no feedback loop into simulation systems', () => {
    const result = buildCivilizationMemory(createInput());

    expect(result.civilizationMemoryTrace.memoryGraph.nodes.every(node => !node.execute && !node.intent)).toBe(true);
    expect(result.civilizationMemoryTrace.driftEvents.every(event => !event.mutate)).toBe(true);
  });
});
