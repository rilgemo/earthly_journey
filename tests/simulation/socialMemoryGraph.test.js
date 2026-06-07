/**
 * Social Memory Graph v1
 *
 * Goal: knowledge propagates only through explicit communication.
 */

const { prepareInformationTransfer } = require('../../src/simulation/communicationSystem');
const { decayAgentMemory } = require('../../src/simulation/memoryDecay');
const { recordMemory } = require('../../src/simulation/memorySystem');
const { TraceCollector } = require('../../src/simulation/traceCollector');

function createAgent(id, location = 'meadow') {
  return {
    id,
    type: 'npc',
    location,
    needs: { hunger: 10, fatigue: 10, manaNeed: 10, socialNeed: 80, safetyNeed: 20 },
    affinities: { fire: 0, water: 0, earth: 0, arcane: 0 },
    mana: {
      capacity: 100,
      current: 50,
      stability: 0.8,
      affinity: { fire: 0, water: 0, earth: 0, arcane: 1 }
    },
    memory: { shortTerm: [], longTerm: [], recentEvents: [], bias: {} },
    trustMap: {}
  };
}

function createWorld() {
  const area = {
    id: 'meadow',
    field: { fire: 0, water: 0, earth: 0, arcane: 0 },
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

function loadTickManagerWithShareAction() {
  jest.resetModules();
  jest.doMock('../../src/simulation/actions', () => ({
    getAvailableActions: () => [{
      id: 'share_information',
      type: 'social',
      baseUtility: 10,
      requirements: { nearbyAgent: true, memory: true },
      effects: {}
    }]
  }));
  return require('../../src/simulation/tickManager').tickManager;
}

describe('Social Memory Graph v1', () => {
  afterEach(() => {
    jest.dontMock('../../src/simulation/actions');
  });

  test('memory transfers from A to B through explicit communication', () => {
    const source = createAgent('villager_a');
    const receiver = createAgent('villager_b');
    receiver.trustMap.villager_a = 80;
    recordMemory(source, {
      type: 'danger',
      target: 'wolf',
      location: 'meadow',
      strength: 100,
      tick: 1
    });

    const transfer = prepareInformationTransfer(source, receiver, { tick: 2 });

    expect(transfer.heardMemory.type).toBe('heard_danger');
    expect(transfer.heardMemory.source).toBe('villager_a');
    expect(transfer.heardMemory.strength).toBeCloseTo(72);
  });

  test('high trust produces stronger transferred memory than low trust', () => {
    const source = createAgent('hunter');
    const highTrust = createAgent('villager_high');
    const lowTrust = createAgent('villager_low');
    highTrust.trustMap.hunter = 90;
    lowTrust.trustMap.hunter = 20;
    recordMemory(source, { type: 'danger', target: 'wolf', strength: 100 });

    const high = prepareInformationTransfer(source, highTrust);
    const low = prepareInformationTransfer(source, lowTrust);

    expect(high.heardMemory.strength).toBeGreaterThan(low.heardMemory.strength);
  });

  test('heard memory decays faster than observed memory', () => {
    const agent = createAgent('villager');
    agent.memory.shortTerm = [
      { type: 'danger', sourceType: 'self', strength: 10 },
      { type: 'heard_danger', sourceType: 'heard', strength: 10 }
    ];

    decayAgentMemory(agent, 1);

    expect(agent.memory.shortTerm[0].strength).toBe(9);
    expect(agent.memory.shortTerm[1].strength).toBe(8);
  });

  test('no direct telepathy without communication', () => {
    const source = createAgent('villager_a');
    const uninvolved = createAgent('villager_c');
    recordMemory(source, { type: 'danger', target: 'wolf', strength: 100 });

    expect(uninvolved.memory.shortTerm).toHaveLength(0);
    expect(uninvolved.memory.longTerm).toHaveLength(0);
  });

  test('tickManager executes share_information and creates heard memory', () => {
    const tickManager = loadTickManagerWithShareAction();
    const source = createAgent('villager_a');
    const receiver = createAgent('villager_b');
    receiver.trustMap.villager_a = 80;
    recordMemory(source, {
      type: 'danger',
      target: 'wolf',
      location: 'meadow',
      strength: 100
    });
    const traceCollector = new TraceCollector();

    tickManager([source, receiver], createWorld(), traceCollector);

    const heardMemory = receiver.memory.shortTerm.find(memory => memory.sourceType === 'heard');
    const sourceTrace = traceCollector.getLatest().agents[0];

    expect(heardMemory).toBeDefined();
    expect(heardMemory.target).toBe('wolf');
    expect(sourceTrace.communicationTrace.receiverId).toBe('villager_b');
  });
});
