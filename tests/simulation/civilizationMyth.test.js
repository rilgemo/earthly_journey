const { generateCivilizationMyth } = require('../../src/simulation/civilizationMyth/mythGenerator');
const { mapSymbolicEntities } = require('../../src/simulation/civilizationMyth/symbolicMappingEngine');
const { detectContradictions } = require('../../src/simulation/civilizationMyth/mythStabilityAnalyzer');
const { buildCivilizationMemory } = require('../../src/simulation/civilizationMemory/civilizationMemoryBuilder');
const { scoreIntents } = require('../../src/simulation/intent/intentScorer');

function createMemoryInput() {
  return Object.freeze({
    cultureTraces: Object.freeze([
      Object.freeze({
        cultureId: 'culture:forage',
        timeWindow: 3,
        detectedPatterns: Object.freeze([
          Object.freeze({ action: 'forage', count: 4 }),
          Object.freeze({ action: 'rest', count: 2 })
        ])
      })
    ]),
    demandHistory: Object.freeze([
      Object.freeze({ tick: 1, food: 0.8 })
    ]),
    resourceHistory: Object.freeze([
      Object.freeze({ tick: 1, food: 10 })
    ])
  });
}

function createMemoryResult() {
  return buildCivilizationMemory(createMemoryInput());
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

describe('Civilization Myth Formation Layer v1', () => {
  test('myth generation is deterministic under identical memory input', () => {
    expect(generateCivilizationMyth(createMemoryResult())).toEqual(generateCivilizationMyth(createMemoryResult()));
  });

  test('no modification of upstream systems', () => {
    const input = createMemoryResult();
    const before = JSON.stringify(input);

    generateCivilizationMyth(input);

    expect(JSON.stringify(input)).toBe(before);
  });

  test('myths are derived only from Civilization Memory Layer', () => {
    const result = generateCivilizationMyth(createMemoryResult());

    expect(result.myth.originMemoryClusters.length).toBeGreaterThan(0);
    expect(result.mythTrace.narrativeClusters.length).toBeGreaterThan(0);
  });

  test('identical input produces identical myth graph', () => {
    expect(generateCivilizationMyth(createMemoryResult()).mythTrace.mythGraph)
      .toEqual(generateCivilizationMyth(createMemoryResult()).mythTrace.mythGraph);
  });

  test('symbolic mapping stable across runs', () => {
    const memory = createMemoryResult().civilizationMemoryTrace.memoryGraph;

    expect(mapSymbolicEntities(memory)).toEqual(mapSymbolicEntities(memory));
  });

  test('no feedback loop into simulation systems', () => {
    const { agent, actions, context } = createIntentInput();
    const before = scoreIntents(agent, actions, context);

    generateCivilizationMyth(createMemoryResult());

    expect(scoreIntents(agent, actions, context)).toEqual(before);
  });

  test('contradiction detection does not alter inputs', () => {
    const interpretations = Object.freeze([
      Object.freeze({ sourceMemory: 'x', interpretedCause: 'The Hunger' }),
      Object.freeze({ sourceMemory: 'x', interpretedCause: 'The Road' })
    ]);
    const before = JSON.stringify(interpretations);

    expect(detectContradictions(interpretations)).toHaveLength(1);
    expect(JSON.stringify(interpretations)).toBe(before);
  });
});
