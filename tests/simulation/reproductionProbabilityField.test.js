const {
  computeReproductionProbabilityField
} = require('../../src/simulation/reproduction/reproductionProbabilityField');
const { tickManager } = require('../../src/simulation/tickManager');
const { TraceCollector } = require('../../src/simulation/traceCollector');

function createAgent(id, overrides = {}) {
  return {
    id,
    location: 'meadow',
    life: { alive: true, lifeStage: 'adult' },
    biology: {
      capacity: { structural: 'full', metabolic: 'full', immune: 'full', neural: 'full' },
      condition: { structural: 'sound', metabolic: 'sound', immune: 'sound', neural: 'sound' }
    },
    memory: { shortTerm: [], longTerm: [], recentEvents: [] },
    ...overrides
  };
}

describe('Reproduction Probability Field v2', () => {
  test('is deterministic and produces stable unordered pairs', () => {
    const agents = [createAgent('b'), createAgent('a'), createAgent('c')];
    const world = { demandIndex: { food: 20 } };

    const first = computeReproductionProbabilityField(agents, world);
    const second = computeReproductionProbabilityField(agents, world);

    expect(first).toEqual(second);
    expect(first.map(result => result.pair)).toEqual([
      ['a', 'b'],
      ['a', 'c'],
      ['b', 'c']
    ]);
  });

  test('does not mutate agents or world', () => {
    const agents = [createAgent('a'), createAgent('b')];
    const world = { demandIndex: { food: 30 }, resourceMap: { meadow: { food: 5 } } };
    const beforeAgents = JSON.parse(JSON.stringify(agents));
    const beforeWorld = JSON.parse(JSON.stringify(world));

    computeReproductionProbabilityField(agents, world);

    expect(agents).toEqual(beforeAgents);
    expect(world).toEqual(beforeWorld);
  });

  test('emits component and attractor vectors without reproduction events', () => {
    const result = computeReproductionProbabilityField(
      [createAgent('a'), createAgent('b')],
      {}
    )[0];

    expect(result.components).toEqual(expect.objectContaining({
      bio: expect.any(Number),
      mating: expect.any(Number),
      competition: expect.any(Number),
      demand: expect.any(Number),
      structure: expect.any(Number)
    }));
    expect(result.probabilityVector).toEqual(expect.objectContaining({
      pairAttractor: expect.any(Number),
      groupAttractor: expect.any(Number),
      independentAttractor: expect.any(Number)
    }));
    expect(result.event).toBeUndefined();
    expect(Object.isFrozen(result)).toBe(true);
  });

  test('tick integration writes passive trace output after agent execution', () => {
    const world = {
      tick: 0,
      areas: new Map([['meadow', {
        id: 'meadow',
        field: { fire: 0, water: 0, earth: 0, arcane: 0 },
        recentEvents: []
      }]]),
      getField(areaId) {
        return this.areas.get(areaId).field;
      },
      getRecentEvents(areaId) {
        return this.areas.get(areaId).recentEvents;
      }
    };
    const agents = [
      createAgent('a', {
        type: 'human',
        needs: { hunger: 0, rest: 0, curiosity: 0 },
        affinities: {},
        mana: { capacity: 100, current: 50, stability: 1, affinity: {} },
        stamina: 100
      }),
      createAgent('b', {
        type: 'human',
        needs: { hunger: 0, rest: 0, curiosity: 0 },
        affinities: {},
        mana: { capacity: 100, current: 50, stability: 1, affinity: {} },
        stamina: 100
      })
    ];
    const traceCollector = new TraceCollector();

    tickManager(agents, world, traceCollector);

    const trace = traceCollector.getLatest();
    expect(trace.agents).toHaveLength(2);
    expect(trace.reproductionField).toHaveLength(1);
    expect(trace.reproductionField[0].pair).toEqual(['a', 'b']);
    expect(world.reproductionField).toBeUndefined();
    expect(agents.every(agent => agent.reproductionField === undefined)).toBe(true);
  });
});
