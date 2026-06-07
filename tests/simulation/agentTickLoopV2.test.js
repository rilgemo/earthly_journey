/**
 * Agent Tick Loop v2
 *
 * Goal: agents remember, evaluate needs, generate intents, and update memory
 * while tickManager remains the only mutation authority.
 */

const { getNeedProfile } = require('../../src/simulation/needSystem');
const { decayAgentMemory } = require('../../src/simulation/memoryDecay');
const { generateIntents } = require('../../src/simulation/intentGenerator');
const { resolveIntent } = require('../../src/simulation/resolutionModel');
const { TraceCollector } = require('../../src/simulation/traceCollector');

function createWorld() {
  const area = {
    id: 'meadow',
    field: { fire: 0, water: 0, earth: 0.2, arcane: 0.05 },
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

function createAgent() {
  return {
    id: 'npc_001',
    role: 'mage',
    location: 'meadow',
    needs: { hunger: 20, fatigue: 30, manaNeed: 70, socialNeed: 10, safetyNeed: 40 },
    affinities: { fire: 0, water: 0, earth: 0, arcane: 1 },
    mana: {
      capacity: 100,
      current: 50,
      stability: 0.8,
      affinity: { fire: 0, water: 0, earth: 0, arcane: 1 }
    },
    memory: {
      shortTerm: [{ type: 'success', action: 'cast_magic', strength: 10, location: 'meadow', tick: 1 }],
      longTerm: [],
      recentEvents: [],
      bias: {}
    }
  };
}

function loadTickManagerWithActions(actions) {
  jest.resetModules();
  jest.doMock('../../src/simulation/actions', () => ({
    getAvailableActions: () => actions
  }));
  return require('../../src/simulation/tickManager').tickManager;
}

describe('Agent Tick Loop v2', () => {
  afterEach(() => {
    jest.dontMock('../../src/simulation/actions');
  });

  test('memory decay reduces short-term memory strength', () => {
    const agent = createAgent();

    decayAgentMemory(agent, 2);

    expect(agent.memory.shortTerm[0].strength).toBe(8);
  });

  test('need profile supports v2 need fields', () => {
    const agent = createAgent();
    const profile = getNeedProfile(agent);

    expect(profile.hunger).toBe(20);
    expect(profile.fatigue).toBe(30);
    expect(profile.manaNeed).toBe(70);
    expect(profile.safetyNeed).toBe(40);
  });

  test('intent generation includes memory and need scores', () => {
    const agent = createAgent();
    const actions = [
      { id: 'rest', type: 'survival', baseUtility: 0.5, effects: {} },
      { id: 'cast_magic', type: 'magic', baseUtility: 2, effects: {} }
    ];
    const needs = { profile: getNeedProfile(agent), urgency: 1 };

    const intents = generateIntents(agent, actions, {
      perception: { field: { fire: 0, water: 0, earth: 0.2, arcane: 0.05 } },
      memories: agent.memory.shortTerm,
      needs
    });
    const selected = resolveIntent(intents);

    expect(intents).toHaveLength(2);
    expect(intents[1].components.memoryScore).toBeGreaterThan(0);
    expect(selected.intent).toBeDefined();
  });

  test('tick trace exposes memory, needs, intents, and memory updates', () => {
    const tickManager = loadTickManagerWithActions([
      {
        id: 'cast_magic',
        type: 'magic',
        baseUtility: 2,
        effects: { manaChange: { current: -5 }, fieldChange: { arcane: 0.05 } }
      }
    ]);
    const world = createWorld();
    const agent = createAgent();
    const traceCollector = new TraceCollector();

    tickManager([agent], world, traceCollector);

    const trace = traceCollector.getLatest().agents[0];

    expect(trace.memoryRecall).toHaveLength(1);
    expect(trace.needProfile.manaNeed).toBe(70);
    expect(trace.candidateIntents[0].intent).toBe('cast_magic');
    expect(trace.resolutionTrace.selectedAction).toBe('cast_magic');
    expect(trace.memoryUpdates[0].type).toBe('success');
    expect(agent.memory.shortTerm.length).toBeGreaterThan(0);
    expect(agent.runtime.lastSelectedIntent).toBe('cast_magic');
  });
});
