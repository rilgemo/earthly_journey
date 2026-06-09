const { generateIntents } = require('../../src/simulation/intentGenerator');
const { simulateAgent } = require('../../src/simulation/tickManager');
const { TraceCollector } = require('../../src/simulation/traceCollector');
const { resolveAgentTypology, resolveTypologyWeights } = require('../../src/simulation/agentTypology/typologyResolver');
const { applyTypologyToScore } = require('../../src/simulation/agentTypology/interactionModifier');
const { buildAgentTypologySnapshot } = require('../../src/simulation/agentTypology/typeTraceBuilder');
const { createBehavioralSignature } = require('../../src/simulation/behavior/behavioralSignature');

function createAgent(overrides = {}) {
  return {
    id: 'agent_1',
    type: 'npc',
    location: 'meadow',
    stamina: 100,
    traits: {},
    skills: {},
    knowledge: [],
    needs: { hunger: 20, fatigue: 20, manaNeed: 20, socialNeed: 20, safetyNeed: 20 },
    affinities: { fire: 0, water: 0, earth: 0.2, arcane: 0.1 },
    mana: {
      capacity: 100,
      current: 50,
      stability: 0.8,
      affinity: { fire: 0, water: 0, earth: 0, arcane: 1 }
    },
    memory: { shortTerm: [], longTerm: [], recentEvents: [], bias: {} },
    trustMap: {},
    ...overrides
  };
}

function createWorld() {
  const area = {
    id: 'meadow',
    field: { fire: 0, water: 0, earth: 0.2, arcane: 0.1 },
    recentEvents: []
  };

  return {
    tick: 0,
    areas: new Map([['meadow', area]]),
    getField(areaId) {
      return this.areas.get(areaId).field;
    },
    getRecentEvents(areaId) {
      return this.areas.get(areaId).recentEvents;
    }
  };
}

const ACTIONS = Object.freeze([
  Object.freeze({ id: 'rest', type: 'survival', baseUtility: 1, effects: {} }),
  Object.freeze({ id: 'trade', type: 'social', baseUtility: 1, effects: {} }),
  Object.freeze({ id: 'attack', type: 'combat', baseUtility: 1, effects: {} })
]);

function createContext(agent) {
  return {
    perception: {
      field: { fire: 0, water: 0, earth: 0.2, arcane: 0.1 },
      nearbyAgents: [{ id: 'neighbor' }]
    },
    memories: agent.memory.shortTerm,
    needs: { profile: agent.needs, urgency: 1 },
    demandIndex: { food: 20, safety: 10 }
  };
}

function loadTickManagerWithActions(actions) {
  jest.resetModules();
  jest.doMock('../../src/simulation/actions', () => ({
    getAvailableActions: () => actions
  }));
  return require('../../src/simulation/tickManager').tickManager;
}

describe('Agent Typology System v1', () => {
  afterEach(() => {
    jest.dontMock('../../src/simulation/actions');
  });

  test('typology does not modify runtime execution order', () => {
    const source = simulateAgent.toString();

    expect(source.indexOf('intentPipeline.execute')).toBeLessThan(source.indexOf('applyActionEffects'));
    expect(source.indexOf('applyActionEffects')).toBeLessThan(source.indexOf('recordActionOutcome'));
  });

  test('typology only affects weighting outputs', () => {
    const human = createAgent({ id: 'human', type: 'human' });
    const animal = createAgent({ id: 'animal', type: 'animal' });
    const humanBefore = JSON.stringify(human);
    const animalBefore = JSON.stringify(animal);

    const humanWeights = resolveTypologyWeights(human, ACTIONS[0], createContext(human));
    const animalWeights = resolveTypologyWeights(animal, ACTIONS[0], createContext(animal));
    const humanScore = applyTypologyToScore(10, humanWeights.influence);
    const animalScore = applyTypologyToScore(10, animalWeights.influence);

    expect(humanWeights.scoreModifier).toBeDefined();
    expect(animalWeights.scoreModifier).toBeDefined();
    expect(animalScore).not.toBe(humanScore);
    expect(JSON.stringify(human)).toBe(humanBefore);
    expect(JSON.stringify(animal)).toBe(animalBefore);
  });

  test('deterministic behavior under same seed/input', () => {
    const agent = createAgent({ type: 'monster' });
    const first = generateIntents(agent, ACTIONS, createContext(agent));
    const second = generateIntents(agent, ACTIONS, createContext(agent));

    expect(first).toEqual(second);
  });

  test('separation from skill and identity systems', () => {
    const agent = createAgent({
      type: 'animal',
      skills: Object.freeze({ forging: 10 }),
      derivedIdentity: 'blacksmith'
    });
    const profile = resolveAgentTypology(agent);
    const signature = createBehavioralSignature([{ action: 'rest' }, { action: 'trade' }]);

    expect(profile.typeId).toBe('animal_like');
    expect(agent.skills.forging).toBe(10);
    expect(agent.derivedIdentity).toBe('blacksmith');
    expect(signature.dominantActions[0].action).toBeDefined();
  });

  test('consistent mapping across ticks', () => {
    const agent = createAgent({ type: 'rabbit' });

    expect(resolveAgentTypology(agent).typeId).toBe('animal_like');
    expect(resolveAgentTypology(agent).typeId).toBe('animal_like');
  });

  test('no mutation of core agent state', () => {
    const agent = Object.freeze(createAgent({ type: 'monster' }));
    const before = JSON.stringify(agent);

    resolveTypologyWeights(agent, ACTIONS[2], createContext(agent));
    buildAgentTypologySnapshot(agent, [{ action: 'attack', category: 'combat', modifier: 1.5 }]);

    expect(JSON.stringify(agent)).toBe(before);
  });

  test('replay consistency preserved', () => {
    const localTickManager = loadTickManagerWithActions([
      { id: 'rest', type: 'survival', baseUtility: 1, profile: { staminaCost: 1 }, effects: {} }
    ]);

    const firstWorld = createWorld();
    const secondWorld = createWorld();
    const firstAgent = createAgent({ type: 'animal' });
    const secondAgent = createAgent({ type: 'animal' });
    const firstTrace = new TraceCollector();
    const secondTrace = new TraceCollector();

    localTickManager([firstAgent], firstWorld, firstTrace);
    localTickManager([secondAgent], secondWorld, secondTrace);

    expect(firstTrace.getLatest().agents[0].agentTypologySnapshot).toEqual(
      secondTrace.getLatest().agents[0].agentTypologySnapshot
    );
    expect(firstTrace.getLatest().agents[0].actionSelected).toBe(
      secondTrace.getLatest().agents[0].actionSelected
    );
  });
});
