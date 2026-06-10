const { computeMatingEvents } = require('../../src/simulation/mating/matingEventSystem');
const { computeReproductionProbabilityField } = require('../../src/simulation/reproduction/reproductionProbabilityField');

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

describe('Mating Event System', () => {
  test('emits no events when agents are at different locations', () => {
    const agents = [
      createAgent('a', { location: 'forest' }),
      createAgent('b', { location: 'meadow' })
    ];
    expect(computeMatingEvents(agents)).toEqual([]);
  });

  test('emits no events when agents have no bond signal', () => {
    const agents = [createAgent('a'), createAgent('b')];
    expect(computeMatingEvents(agents)).toEqual([]);
  });

  test('emits a mating event when two adults share location and mutual bond signal', () => {
    const agents = [
      createAgent('a', {
        memory: {
          shortTerm: [{ agentId: 'b', strength: 80 }],
          longTerm: [],
          recentEvents: []
        }
      }),
      createAgent('b', {
        memory: {
          shortTerm: [{ agentId: 'a', strength: 70 }],
          longTerm: [],
          recentEvents: []
        }
      })
    ];

    const events = computeMatingEvents(agents);
    expect(events.length).toBe(1);
    expect(events[0].pair).toEqual(['a', 'b']);
    expect(events[0].affinity).toBeGreaterThan(0);
    expect(events[0].affinity).toBeLessThanOrEqual(1);
  });

  test('emits no events for non-adult agents', () => {
    const agents = [
      createAgent('a', { life: { alive: true, lifeStage: 'juvenile' } }),
      createAgent('b', {
        memory: { shortTerm: [{ agentId: 'a', strength: 80 }], longTerm: [], recentEvents: [] }
      })
    ];
    expect(computeMatingEvents(agents)).toEqual([]);
  });

  test('emits no events for dead agents', () => {
    const agents = [
      createAgent('a', { life: { alive: false, lifeStage: 'adult' } }),
      createAgent('b', {
        memory: { shortTerm: [{ agentId: 'a', strength: 80 }], longTerm: [], recentEvents: [] }
      })
    ];
    expect(computeMatingEvents(agents)).toEqual([]);
  });

  test('is deterministic with same inputs', () => {
    const agents = [
      createAgent('b', { memory: { shortTerm: [{ agentId: 'a', strength: 60 }], longTerm: [], recentEvents: [] } }),
      createAgent('a', { memory: { shortTerm: [{ agentId: 'b', strength: 60 }], longTerm: [], recentEvents: [] } }),
      createAgent('c', { memory: { shortTerm: [{ agentId: 'a', strength: 60 }], longTerm: [], recentEvents: [] } })
    ];

    const first = computeMatingEvents(agents);
    const second = computeMatingEvents(agents);
    expect(first).toEqual(second);
  });

  test('does not mutate input agents', () => {
    const agents = [createAgent('a'), createAgent('b')];
    const before = JSON.parse(JSON.stringify(agents));
    computeMatingEvents(agents);
    expect(agents).toEqual(before);
  });

  test('mating events are frozen (ephemeral, no mutation)', () => {
    const agents = [
      createAgent('a', { memory: { shortTerm: [{ agentId: 'b', strength: 80 }], longTerm: [], recentEvents: [] } }),
      createAgent('b', { memory: { shortTerm: [{ agentId: 'a', strength: 80 }], longTerm: [], recentEvents: [] } })
    ];
    const events = computeMatingEvents(agents);
    expect(Object.isFrozen(events)).toBe(true);
    if (events.length > 0) {
      expect(Object.isFrozen(events[0])).toBe(true);
      expect(Object.isFrozen(events[0].pair)).toBe(true);
    }
  });
});

describe('Reproduction Probability Field causal isolation', () => {
  test('Bond does NOT appear as input — reproductionProbabilityField only accepts matingEvents', () => {
    const agents = [
      createAgent('a', {
        memory: { shortTerm: [{ agentId: 'b', strength: 99 }], longTerm: [], recentEvents: [] }
      }),
      createAgent('b', {
        memory: { shortTerm: [{ agentId: 'a', strength: 99 }], longTerm: [], recentEvents: [] }
      })
    ];
    const world = {};

    // Without mating events: bond memory present but not consumed
    const fieldWithoutMating = computeReproductionProbabilityField(agents, world, []);
    // With mating events derived from bond signal
    const matingEvents = computeMatingEvents(agents);
    const fieldWithMating = computeReproductionProbabilityField(agents, world, matingEvents);

    // pairAttractor should be higher when mating events provide signal
    const pairWithout = fieldWithoutMating[0].probabilityVector.pairAttractor;
    const pairWith = fieldWithMating[0].probabilityVector.pairAttractor;
    expect(pairWith).toBeGreaterThan(pairWithout);

    // Verify component key is 'mating', not 'bond'
    expect(fieldWithMating[0].components).toHaveProperty('mating');
    expect(fieldWithMating[0].components).not.toHaveProperty('bond');
  });

  test('matingEvents is the only upstream signal for pair attraction beyond biology', () => {
    const agentA = createAgent('a');
    const agentB = createAgent('b');
    const world = {};

    const noMating = computeReproductionProbabilityField([agentA, agentB], world, []);
    const withMating = computeReproductionProbabilityField([agentA, agentB], world, [
      Object.freeze({ pair: Object.freeze(['a', 'b']), affinity: 1 })
    ]);

    expect(withMating[0].components.mating).toBe(1);
    expect(noMating[0].components.mating).toBe(0);
  });
});
