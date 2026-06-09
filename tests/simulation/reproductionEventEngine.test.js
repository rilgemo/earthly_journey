const { runReproductionEventEngine } = require('../../src/simulation/reproduction/reproductionEventEngine');
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
    memory: {
      shortTerm: [],
      longTerm: [],
      recentEvents: []
    },
    ...overrides
  };
}

function makeField(agents, world = {}) {
  return computeReproductionProbabilityField(agents, world);
}

describe('ReproductionEventEngine', () => {
  test('returns frozen proposals array', () => {
    const agents = [createAgent('a'), createAgent('b')];
    const field = makeField(agents);
    const result = runReproductionEventEngine({ tick: 1, agents, reproductionField: field, world: {} });

    expect(result).toHaveProperty('proposals');
    expect(Array.isArray(result.proposals)).toBe(true);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.proposals)).toBe(true);
  });

  test('is deterministic: same inputs produce identical proposals', () => {
    const agents = [createAgent('a'), createAgent('b'), createAgent('c')];
    const world = { demandIndex: { food: 10 } };
    const field = makeField(agents, world);

    const first = runReproductionEventEngine({ tick: 5, agents, reproductionField: field, world });
    const second = runReproductionEventEngine({ tick: 5, agents, reproductionField: field, world });

    expect(first.proposals).toEqual(second.proposals);
  });

  test('proposals have required fields with correct types', () => {
    const agents = [createAgent('a'), createAgent('b')];
    const field = makeField(agents, { demandIndex: {} });
    const { proposals } = runReproductionEventEngine({ tick: 3, agents, reproductionField: field, world: {} });

    for (const proposal of proposals) {
      expect(typeof proposal.tick).toBe('number');
      expect(Array.isArray(proposal.parents)).toBe(true);
      expect(proposal.parents).toHaveLength(2);
      expect(typeof proposal.probability).toBe('number');
      expect(typeof proposal.confidence).toBe('number');
      expect(['pair', 'asymmetric', 'cluster', 'suppression']).toContain(proposal.mode);
      expect(proposal.status).toBe('proposed');
      expect(Object.isFrozen(proposal)).toBe(true);
    }
  });

  test('does not mutate agents, reproductionField, or world', () => {
    const agents = [createAgent('a'), createAgent('b')];
    const world = { demandIndex: { food: 20 }, resourceMap: { meadow: { food: 5 } } };
    const field = makeField(agents, world);

    const agentsBefore = JSON.parse(JSON.stringify(agents));
    const worldBefore = JSON.parse(JSON.stringify(world));
    const fieldBefore = JSON.parse(JSON.stringify(field));

    runReproductionEventEngine({ tick: 1, agents, reproductionField: field, world });

    expect(agents).toEqual(agentsBefore);
    expect(world).toEqual(worldBefore);
    expect(JSON.parse(JSON.stringify(field))).toEqual(fieldBefore);
  });

  test('returns empty proposals when reproductionField is empty', () => {
    const agents = [createAgent('a'), createAgent('b')];
    const { proposals } = runReproductionEventEngine({ tick: 1, agents, reproductionField: [], world: {} });
    expect(proposals).toHaveLength(0);
  });

  test('proposals carry tick value from input', () => {
    const agents = [createAgent('a'), createAgent('b')];
    const field = makeField(agents);
    const { proposals } = runReproductionEventEngine({ tick: 42, agents, reproductionField: field, world: {} });
    for (const proposal of proposals) {
      expect(proposal.tick).toBe(42);
    }
  });

  test('proposal count is bounded by TOP_K competition per agent', () => {
    const agents = Array.from({ length: 8 }, (_, i) => createAgent(`agent${i}`));
    const field = makeField(agents, { demandIndex: {} });
    const { proposals } = runReproductionEventEngine({ tick: 1, agents, reproductionField: field, world: {} });

    expect(proposals.length).toBeGreaterThanOrEqual(0);
    expect(proposals.length).toBeLessThanOrEqual((agents.length * (agents.length - 1)) / 2);
  });

  test('proposals are sorted by descending probability', () => {
    const agents = [createAgent('a'), createAgent('b'), createAgent('c')];
    const field = makeField(agents, { demandIndex: {} });
    const { proposals } = runReproductionEventEngine({ tick: 1, agents, reproductionField: field, world: {} });

    for (let i = 1; i < proposals.length; i++) {
      expect(proposals[i].probability).toBeLessThanOrEqual(proposals[i - 1].probability);
    }
  });

  test('non-adult agents produce lower probability proposals', () => {
    const adultAgents = [createAgent('a'), createAgent('b')];
    const juvenileAgents = [
      createAgent('x', { life: { alive: true, lifeStage: 'juvenile' } }),
      createAgent('y', { life: { alive: true, lifeStage: 'juvenile' } })
    ];
    const world = {};

    const adultField = makeField(adultAgents, world);
    const juvenileField = makeField(juvenileAgents, world);

    const { proposals: adultProposals } = runReproductionEventEngine({
      tick: 1, agents: adultAgents, reproductionField: adultField, world
    });
    const { proposals: juvenileProposals } = runReproductionEventEngine({
      tick: 1, agents: juvenileAgents, reproductionField: juvenileField, world
    });

    const adultProb = adultProposals[0]?.probability ?? 0;
    const juvenileProb = juvenileProposals[0]?.probability ?? 0;
    expect(adultProb).toBeGreaterThanOrEqual(juvenileProb);
  });

  test('no reproduction event proposals are created — only proposals emitted', () => {
    const agents = [createAgent('a'), createAgent('b')];
    const field = makeField(agents);
    const { proposals } = runReproductionEventEngine({ tick: 1, agents, reproductionField: field, world: {} });

    for (const proposal of proposals) {
      expect(proposal.status).toBe('proposed');
      expect(proposal).not.toHaveProperty('newborn');
      expect(proposal).not.toHaveProperty('lineage');
      expect(proposal).not.toHaveProperty('child');
    }
  });
});
