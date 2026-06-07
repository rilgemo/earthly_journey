const { scoreIntents } = require('../../src/simulation/intent/intentScorer');
const { enrichIntents } = require('../../src/simulation/intent/intentEnricher');
const { resolveFinalIntent } = require('../../src/simulation/intent/intentResolver');
const intentPipeline = require('../../src/simulation/intent/intentPipeline');
const { generateIntents } = require('../../src/simulation/intentGenerator');

function createAgent(overrides = {}) {
  return {
    id: 'agent_1',
    type: 'animal',
    location: 'meadow',
    traits: { curious: 2 },
    skills: { hunting: 4, tracking: 2 },
    knowledge: [{ action: 'hunt', key: 'hunt:tracks' }],
    needs: { hunger: 30, fatigue: 10, manaNeed: 0, socialNeed: 5, safetyNeed: 20 },
    affinities: { fire: 0, water: 0, earth: 0.3, arcane: 0 },
    mana: {
      capacity: 100,
      current: 10,
      stability: 0.5,
      affinity: { fire: 0, water: 0, earth: 0, arcane: 1 }
    },
    memory: {
      shortTerm: [{ type: 'success', action: 'hunt', strength: 10 }],
      longTerm: [],
      recentEvents: [],
      bias: {}
    },
    ...overrides
  };
}

const ACTIONS = Object.freeze([
  Object.freeze({ id: 'hunt', type: 'combat', baseUtility: 2, effects: {} }),
  Object.freeze({ id: 'rest', type: 'survival', baseUtility: 1, effects: {} }),
  Object.freeze({ id: 'trade', type: 'social', baseUtility: 1, effects: {} })
]);

function createContext(agent) {
  return {
    perception: {
      field: { fire: 0, water: 0, earth: 0.4, arcane: 0 },
      nearbyAgents: [{ id: 'neighbor' }]
    },
    memories: agent.memory.shortTerm,
    needs: { profile: agent.needs, urgency: 1 },
    influenceProfile: { hunt: 2 },
    demandIndex: { food: 20, safety: 10 }
  };
}

describe('Intent System Purity Boundary v1', () => {
  test('scorer produces identical output for identical input', () => {
    const agent = createAgent();
    const context = createContext(agent);

    expect(scoreIntents(agent, ACTIONS, context)).toEqual(scoreIntents(agent, ACTIONS, context));
  });

  test('scorer has zero mutation side effects', () => {
    const agent = createAgent({ skills: {} });
    const context = createContext(agent);
    const before = JSON.stringify({ agent, actions: ACTIONS, context });

    scoreIntents(agent, ACTIONS, context);

    expect(JSON.stringify({ agent, actions: ACTIONS, context })).toBe(before);
    expect(agent.skills).toEqual({});
  });

  test('enricher does not change score ordering', () => {
    const scoring = scoreIntents(createAgent(), ACTIONS, createContext(createAgent()));
    const beforeOrder = scoring.intentScores.map(intent => intent.intent);
    const beforeScores = scoring.intentScores.map(intent => intent.score);
    const enriched = enrichIntents(scoring, ACTIONS);

    expect(enriched.enrichedIntents.map(intent => intent.intent)).toEqual(beforeOrder);
    expect(enriched.enrichedIntents.map(intent => intent.score)).toEqual(beforeScores);
    expect(enriched.enrichmentSummary.scoreOrderingPreserved).toBe(true);
  });

  test('resolver only selects from provided set', () => {
    const scoring = scoreIntents(createAgent(), ACTIONS, createContext(createAgent()));
    const enriched = enrichIntents(scoring, ACTIONS);
    const resolved = resolveFinalIntent(enriched.enrichedIntents);

    expect(resolved.selectionSet).toContain(resolved.selectedIntentId);
    expect(enriched.enrichedIntents.some(intent => intent.intent === resolved.selectedIntentId)).toBe(true);
  });

  test('typology affects only score values, not structure', () => {
    const human = createAgent({ type: 'human' });
    const animal = createAgent({ type: 'animal' });
    const humanScores = scoreIntents(human, ACTIONS, createContext(human));
    const animalScores = scoreIntents(animal, ACTIONS, createContext(animal));

    expect(animalScores.intentScores.map(intent => intent.intent)).toEqual(
      humanScores.intentScores.map(intent => intent.intent)
    );
    expect(animalScores.intentScores.length).toBe(humanScores.intentScores.length);
    expect(animalScores.intentScores[0].score).not.toBe(humanScores.intentScores[0].score);
  });

  test('no fallback injection occurs during scoring phase', () => {
    const scoring = scoreIntents(createAgent(), ACTIONS.slice(0, 1), createContext(createAgent()));

    expect(scoring.intentScores).toHaveLength(1);
    expect(scoring.intentScores[0].intent).toBe('hunt');
  });

  test('deterministic replay consistency', () => {
    const agent = createAgent();
    const context = createContext(agent);
    const first = intentPipeline.execute(agent, ACTIONS, context);
    const second = intentPipeline.execute(agent, ACTIONS, context);

    expect(first.intentTrace).toEqual(second.intentTrace);
    expect(first.finalIntent.intent).toBe(second.finalIntent.intent);
  });

  test('compatibility facade returns enriched intents', () => {
    const intents = generateIntents(createAgent(), ACTIONS, createContext(createAgent()));

    expect(intents[0].reasonTrace).toBeDefined();
    expect(intents[0].enrichment).toBeDefined();
  });
});
