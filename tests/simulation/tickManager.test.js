/**
 * Test 4: TickManager Mutation Authority
 *
 * Goal: Execution Contract -> TickManager -> World State is protected.
 *
 * Contract:
 *   tickManager = only world mutation authority
 */

const { TraceCollector } = require('../../src/simulation/traceCollector');

function createWorld(field = {}) {
  const area = {
    id: 'meadow',
    field: { fire: 0, water: 0, earth: 0, arcane: 0, ...field },
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

function createNpc(overrides = {}) {
  return {
    id: 'npc_001',
    location: 'meadow',
    needs: { hunger: 0, rest: 0, curiosity: 0 },
    affinities: { fire: 0, water: 0, earth: 0, arcane: 0 },
    mana: {
      capacity: 100,
      current: 50,
      stability: 0.8,
      affinity: { fire: 0, water: 0, earth: 0, arcane: 1 }
    },
    memory: { recentEvents: [], bias: {} },
    ...overrides
  };
}

function loadTickManagerWithActions(actions) {
  jest.resetModules();
  jest.doMock('../../src/simulation/actions', () => ({
    getAvailableActions: () => actions
  }));
  return require('../../src/simulation/tickManager').tickManager;
}

describe('Test 4: TickManager Mutation Authority', () => {
  afterEach(() => {
    jest.dontMock('../../src/simulation/actions');
  });

  test('registered action executes and mutates world', () => {
    const tickManager = loadTickManagerWithActions([
      {
        id: 'forage',
        type: 'work',
        baseUtility: 1,
        effects: { fieldChange: { earth: 0.01 }, manaChange: {} }
      }
    ]);
    const world = createWorld();
    const npc = createNpc();

    tickManager([npc], world);

    expect(world.areas.get('meadow').field.earth).toBeCloseTo(0.01);
    expect(npc.memory.bias.forage).toBeCloseTo(0.1);
  });

  test('unregistered action is rejected and does not mutate world', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const tickManager = loadTickManagerWithActions([
      {
        id: 'destroy_world',
        type: 'magic',
        baseUtility: 100,
        effects: { fieldChange: { fire: 999 }, manaChange: { current: -10 } }
      }
    ]);
    const world = createWorld();
    const npc = createNpc();
    const traceCollector = new TraceCollector();
    const manaBefore = npc.mana.current;

    const log = tickManager([npc], world, traceCollector);
    const trace = traceCollector.getLatest();

    expect(log[0].action).toBeNull();
    expect(trace.agents[0].actionRejected).toBe(true);
    expect(trace.agents[0].rejectionReason).toContain('destroy_world');
    expect(world.areas.get('meadow').field.fire).toBe(0);
    expect(npc.mana.current).toBe(manaBefore);
    expect(npc.memory.recentEvents).toHaveLength(0);
    console.warn.mockRestore();
  });

  test('tick emits trace through trace collector', () => {
    const tickManager = loadTickManagerWithActions([
      {
        id: 'forage',
        type: 'work',
        baseUtility: 1,
        effects: { fieldChange: { earth: 0.01 }, manaChange: {} }
      }
    ]);
    const world = createWorld();
    const npc = createNpc();
    const traceCollector = new TraceCollector();

    tickManager([npc], world, traceCollector);

    const trace = traceCollector.getLatest();
    expect(trace).not.toBeNull();
    expect(trace.tickId).toBe(1);
    expect(trace.agents).toHaveLength(1);
    expect(trace.agents[0].agentId).toBe('npc_001');
    expect(trace.agents[0].actionSelected).toBe('forage');
  });

  test('tick counter increments continuously', () => {
    const tickManager = loadTickManagerWithActions([
      {
        id: 'move',
        type: 'survival',
        baseUtility: 1,
        effects: {}
      }
    ]);
    const world = createWorld();
    const npc = createNpc();

    tickManager([npc], world);
    tickManager([npc], world);
    tickManager([npc], world);

    expect(world.tick).toBe(3);
  });

  test('registered magic action mutates the expected world field', () => {
    const tickManager = loadTickManagerWithActions([
      {
        id: 'cast_magic',
        type: 'magic',
        baseUtility: 10,
        effects: { fieldChange: { arcane: 0.05 }, manaChange: { current: -5 } }
      }
    ]);
    const world = createWorld();
    const npc = createNpc();

    tickManager([npc], world);

    expect(world.areas.get('meadow').field.arcane).toBeCloseTo(0.05);
    expect(npc.mana.current).toBeLessThan(50);
  });
});
