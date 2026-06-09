const { evaluateBirthConsistencyContract } = require('../../src/simulation/reproduction/birthConsistencyContract');
const { tickManager } = require('../../src/simulation/tickManager');
const { TraceCollector } = require('../../src/simulation/traceCollector');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeNewborn(id, tick, parentIds, overrides = {}) {
  return {
    id: id || `newborn:${tick}:a:b`,
    type: 'newborn',
    location: 'meadow',
    life: {
      birthTick: tick,
      ageTicks: 0,
      lifeStage: 'juvenile',
      lifeCondition: 'alive',
      alive: true,
      maxAgeTicks: 90 * 365
    },
    biology: {
      capacity: { structural: 'full', metabolic: 'full', immune: 'full', neural: 'full' },
      condition: { structural: 'sound', metabolic: 'sound', immune: 'sound', neural: 'sound' }
    },
    lineage: Object.freeze({
      parentIds: Object.freeze(parentIds || ['a', 'b']),
      birthTick: tick,
      originTick: tick
    }),
    infantDependency: Object.freeze({ birthTick: tick, stage: 'infant', active: true }),
    needs: { hunger: 0, rest: 0, curiosity: 0 },
    memory: { shortTerm: [], longTerm: [], recentEvents: [] },
    affinities: {},
    mana: { capacity: 10, current: 10, stability: 1, affinity: {} },
    stamina: 50,
    ...overrides
  };
}

function makeParent(id) {
  return { id, location: 'meadow', life: { alive: true } };
}

function baseInput(overrides = {}) {
  const tick = 5;
  const parents = [makeParent('a'), makeParent('b')];
  const newborn = makeNewborn(`newborn:${tick}:a:b`, tick, ['a', 'b']);
  return {
    tick,
    births: [newborn],
    previousTickState: { agents: parents },
    currentAgents: [...parents, newborn],
    lineageGraph: null,
    worldSnapshot: null,
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// Output contract
// ---------------------------------------------------------------------------

describe('BirthConsistencyContract — output schema', () => {
  test('returns frozen report with all required fields', () => {
    const report = evaluateBirthConsistencyContract(baseInput());
    expect(Object.isFrozen(report)).toBe(true);
    expect(['PASS', 'FAIL']).toContain(report.status);
    expect(Array.isArray(report.violations)).toBe(true);
    expect(Object.isFrozen(report.violations)).toBe(true);
    expect(typeof report.summary.totalBirths).toBe('number');
    expect(typeof report.summary.validBirths).toBe('number');
    expect(typeof report.summary.invalidBirths).toBe('number');
    expect(typeof report.metadata.duplicateCheck).toBe('boolean');
    expect(typeof report.metadata.lineageIntegrity).toBe('boolean');
    expect(typeof report.metadata.temporalConsistency).toBe('boolean');
  });

  test('returns PASS with empty violations for zero births', () => {
    const report = evaluateBirthConsistencyContract({
      tick: 1, births: [], previousTickState: { agents: [] },
      currentAgents: [], lineageGraph: null, worldSnapshot: null
    });
    expect(report.status).toBe('PASS');
    expect(report.violations).toHaveLength(0);
    expect(report.summary.totalBirths).toBe(0);
  });

  test('PASS for a valid newborn', () => {
    const report = evaluateBirthConsistencyContract(baseInput());
    expect(report.status).toBe('PASS');
    expect(report.violations).toHaveLength(0);
    expect(report.summary.validBirths).toBe(1);
    expect(report.summary.invalidBirths).toBe(0);
  });

  test('is deterministic — same inputs produce identical report', () => {
    const input = baseInput();
    const r1 = evaluateBirthConsistencyContract(input);
    const r2 = evaluateBirthConsistencyContract(input);
    expect(r1.status).toBe(r2.status);
    expect(r1.violations).toHaveLength(r2.violations.length);
    expect(r1.summary).toEqual(r2.summary);
  });

  test('is read-only — does not mutate births, agents, or world', () => {
    const input = baseInput();
    const birthsBefore = JSON.parse(JSON.stringify(input.births));
    const agentsBefore = JSON.parse(JSON.stringify(input.currentAgents));

    evaluateBirthConsistencyContract(input);

    expect(JSON.parse(JSON.stringify(input.births))).toEqual(birthsBefore);
    expect(JSON.parse(JSON.stringify(input.currentAgents))).toEqual(agentsBefore);
  });
});

// ---------------------------------------------------------------------------
// Rule 1 — No Duplicate Birth IDs
// ---------------------------------------------------------------------------

describe('Rule 1 — No Duplicate Birth IDs', () => {
  test('FAIL when two births share the same id in this tick batch', () => {
    const tick = 3;
    const nb1 = makeNewborn('newborn:3:a:b', tick, ['a', 'b']);
    const nb2 = makeNewborn('newborn:3:a:b', tick, ['a', 'b']);
    const parents = [makeParent('a'), makeParent('b')];

    const report = evaluateBirthConsistencyContract({
      tick, births: [nb1, nb2],
      previousTickState: { agents: parents },
      currentAgents: [...parents, nb1, nb2],
      lineageGraph: null, worldSnapshot: null
    });

    expect(report.status).toBe('FAIL');
    expect(report.violations.some(v => v.rule === 'NO_DUPLICATE_BIRTH_IDS')).toBe(true);
    expect(report.metadata.duplicateCheck).toBe(false);
  });

  test('FAIL when birth id already exists in previous tick state', () => {
    const tick = 4;
    const existingAgent = makeParent('newborn:3:a:b');
    const newborn = makeNewborn('newborn:3:a:b', tick, ['a', 'b']);

    const report = evaluateBirthConsistencyContract({
      tick, births: [newborn],
      previousTickState: { agents: [existingAgent] },
      currentAgents: [existingAgent, newborn],
      lineageGraph: null, worldSnapshot: null
    });

    expect(report.status).toBe('FAIL');
    expect(report.violations.some(v => v.rule === 'NO_DUPLICATE_BIRTH_IDS')).toBe(true);
  });

  test('PASS when all birth ids are unique and new', () => {
    const report = evaluateBirthConsistencyContract(baseInput());
    expect(report.metadata.duplicateCheck).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Rule 2 — No Ghost Births
// ---------------------------------------------------------------------------

describe('Rule 2 — No Ghost Births', () => {
  test('FAIL when a parent id is not in previousTickState or currentAgents', () => {
    const tick = 5;
    const newborn = makeNewborn(`newborn:${tick}:ghost:b`, tick, ['ghost', 'b']);
    const parentB = makeParent('b');

    const report = evaluateBirthConsistencyContract({
      tick, births: [newborn],
      previousTickState: { agents: [parentB] },
      currentAgents: [parentB, newborn],
      lineageGraph: null, worldSnapshot: null
    });

    expect(report.status).toBe('FAIL');
    const ghosts = report.violations.filter(v => v.rule === 'NO_GHOST_BIRTHS');
    expect(ghosts.length).toBeGreaterThan(0);
    expect(ghosts[0].missingParentId).toBe('ghost');
    expect(report.metadata.lineageIntegrity).toBe(false);
  });

  test('PASS when all parents exist in previousTickState', () => {
    const report = evaluateBirthConsistencyContract(baseInput());
    expect(report.metadata.lineageIntegrity).toBe(true);
  });

  test('PASS when parents exist in currentAgents (post-death-cleanup survivors)', () => {
    const tick = 5;
    const parentA = makeParent('a');
    const parentB = makeParent('b');
    const newborn = makeNewborn(`newborn:${tick}:a:b`, tick, ['a', 'b']);

    const report = evaluateBirthConsistencyContract({
      tick, births: [newborn],
      previousTickState: { agents: [] }, // not in previous
      currentAgents: [parentA, parentB, newborn], // but in current
      lineageGraph: null, worldSnapshot: null
    });

    expect(report.metadata.lineageIntegrity).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Rule 3 — No Temporal Leakage
// ---------------------------------------------------------------------------

describe('Rule 3 — No Temporal Leakage', () => {
  test('FAIL when birth.life.birthTick does not equal current tick', () => {
    const tick = 10;
    const nb = makeNewborn(`newborn:${tick}:a:b`, 7, ['a', 'b']); // wrong birthTick
    const parents = [makeParent('a'), makeParent('b')];

    const report = evaluateBirthConsistencyContract({
      tick, births: [nb],
      previousTickState: { agents: parents },
      currentAgents: [...parents, nb],
      lineageGraph: null, worldSnapshot: null
    });

    expect(report.status).toBe('FAIL');
    expect(report.violations.some(v => v.rule === 'NO_TEMPORAL_LEAKAGE')).toBe(true);
    expect(report.metadata.temporalConsistency).toBe(false);
  });

  test('FAIL when birth id already existed in previous tick state', () => {
    const tick = 5;
    const preExisting = { id: `newborn:${tick}:a:b` };
    const nb = makeNewborn(`newborn:${tick}:a:b`, tick, ['a', 'b']);
    const parents = [makeParent('a'), makeParent('b')];

    const report = evaluateBirthConsistencyContract({
      tick, births: [nb],
      previousTickState: { agents: [...parents, preExisting] },
      currentAgents: [...parents, nb],
      lineageGraph: null, worldSnapshot: null
    });

    expect(report.status).toBe('FAIL');
    expect(report.violations.some(v => v.rule === 'NO_TEMPORAL_LEAKAGE')).toBe(true);
  });

  test('PASS when birthTick matches current tick and id is new', () => {
    const report = evaluateBirthConsistencyContract(baseInput());
    expect(report.metadata.temporalConsistency).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Rule 4 — Structural Stability
// ---------------------------------------------------------------------------

describe('Rule 4 — Structural Stability', () => {
  test('FAIL when biology has invalid capacity state', () => {
    const tick = 5;
    const nb = makeNewborn(`newborn:${tick}:a:b`, tick, ['a', 'b'], {
      biology: {
        capacity: { structural: 'high', metabolic: 'full', immune: 'full', neural: 'full' },
        condition: { structural: 'sound', metabolic: 'sound', immune: 'sound', neural: 'sound' }
      }
    });
    const parents = [makeParent('a'), makeParent('b')];

    const report = evaluateBirthConsistencyContract({
      tick, births: [nb],
      previousTickState: { agents: parents },
      currentAgents: [...parents, nb],
      lineageGraph: null, worldSnapshot: null
    });

    expect(report.status).toBe('FAIL');
    expect(report.violations.some(v => v.rule === 'STRUCTURAL_STABILITY')).toBe(true);
  });

  test('FAIL when lineage is not frozen', () => {
    const tick = 5;
    const nb = makeNewborn(`newborn:${tick}:a:b`, tick, ['a', 'b']);
    nb.lineage = { parentIds: ['a', 'b'], birthTick: tick, originTick: tick }; // unfrozen

    const parents = [makeParent('a'), makeParent('b')];
    const report = evaluateBirthConsistencyContract({
      tick, births: [nb],
      previousTickState: { agents: parents },
      currentAgents: [...parents, nb],
      lineageGraph: null, worldSnapshot: null
    });

    expect(report.status).toBe('FAIL');
    expect(report.violations.some(v => v.rule === 'STRUCTURAL_STABILITY')).toBe(true);
  });

  test('FAIL when lifeStage is not juvenile', () => {
    const tick = 5;
    const nb = makeNewborn(`newborn:${tick}:a:b`, tick, ['a', 'b'], {
      life: { birthTick: tick, ageTicks: 0, lifeStage: 'adult', lifeCondition: 'alive', alive: true, maxAgeTicks: 90 * 365 }
    });
    const parents = [makeParent('a'), makeParent('b')];

    const report = evaluateBirthConsistencyContract({
      tick, births: [nb],
      previousTickState: { agents: parents },
      currentAgents: [...parents, nb],
      lineageGraph: null, worldSnapshot: null
    });

    expect(report.status).toBe('FAIL');
    expect(report.violations.some(v => v.rule === 'STRUCTURAL_STABILITY')).toBe(true);
  });

  test('FAIL when ageTicks is not 0', () => {
    const tick = 5;
    const nb = makeNewborn(`newborn:${tick}:a:b`, tick, ['a', 'b'], {
      life: { birthTick: tick, ageTicks: 5, lifeStage: 'juvenile', lifeCondition: 'alive', alive: true, maxAgeTicks: 90 * 365 }
    });
    const parents = [makeParent('a'), makeParent('b')];

    const report = evaluateBirthConsistencyContract({
      tick, births: [nb],
      previousTickState: { agents: parents },
      currentAgents: [...parents, nb],
      lineageGraph: null, worldSnapshot: null
    });

    expect(report.status).toBe('FAIL');
    expect(report.violations.some(v => v.rule === 'STRUCTURAL_STABILITY')).toBe(true);
  });

  test('PASS for a fully compliant newborn', () => {
    const report = evaluateBirthConsistencyContract(baseInput());
    expect(report.violations.filter(v => v.rule === 'STRUCTURAL_STABILITY')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Rule 5 — No Cross-Tick Mutation
// ---------------------------------------------------------------------------

describe('Rule 5 — No Cross-Tick Mutation', () => {
  test('FAIL when an existing (non-newborn) agent has a lineage field', () => {
    const tick = 5;
    const mutatedParent = {
      id: 'a',
      location: 'meadow',
      life: { alive: true },
      lineage: { parentIds: Object.freeze(['x', 'y']), birthTick: 1, originTick: 1 }
    };
    const parentB = makeParent('b');
    const nb = makeNewborn(`newborn:${tick}:a:b`, tick, ['a', 'b']);

    const report = evaluateBirthConsistencyContract({
      tick, births: [nb],
      previousTickState: { agents: [makeParent('a'), parentB] },
      currentAgents: [mutatedParent, parentB, nb],
      lineageGraph: null, worldSnapshot: null
    });

    expect(report.status).toBe('FAIL');
    expect(report.violations.some(v => v.rule === 'NO_CROSS_TICK_MUTATION')).toBe(true);
  });

  test('PASS when existing agents have no birth-exclusive fields', () => {
    const report = evaluateBirthConsistencyContract(baseInput());
    expect(report.violations.filter(v => v.rule === 'NO_CROSS_TICK_MUTATION')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// tickManager integration
// ---------------------------------------------------------------------------

describe('BirthConsistencyContract — tickManager integration', () => {
  function makeTickAgent(id) {
    return {
      id,
      type: 'human',
      location: 'meadow',
      life: { alive: true, lifeStage: 'adult', ageTicks: 100, maxAgeTicks: 90 * 365 },
      biology: {
        capacity: { structural: 'full', metabolic: 'full', immune: 'full', neural: 'full' },
        condition: { structural: 'sound', metabolic: 'sound', immune: 'sound', neural: 'sound' }
      },
      memory: { shortTerm: [], longTerm: [], recentEvents: [] },
      needs: { hunger: 0, rest: 0, curiosity: 0 },
      affinities: {},
      mana: { capacity: 100, current: 50, stability: 1, affinity: {} },
      stamina: 100
    };
  }

  function makeWorld() {
    return {
      tick: 0,
      areas: new Map([['meadow', {
        id: 'meadow',
        field: { fire: 0, water: 0, earth: 0, arcane: 0 },
        recentEvents: []
      }]]),
      getField(id) { return this.areas.get(id).field; },
      getRecentEvents(id) { return this.areas.get(id).recentEvents; }
    };
  }

  test('birthConsistency trace is written to traceCollector', () => {
    const world = makeWorld();
    const agents = [makeTickAgent('a'), makeTickAgent('b')];
    const tc = new TraceCollector();

    tickManager(agents, world, tc);

    const trace = tc.getLatest();
    expect(trace).toHaveProperty('birthConsistency');
    expect(['PASS', 'FAIL']).toContain(trace.birthConsistency.status);
    expect(Array.isArray(trace.birthConsistency.violations)).toBe(true);
  });

  test('birthConsistency report is PASS when Birth System v1 produces valid output', () => {
    const world = makeWorld();
    const agents = [makeTickAgent('a'), makeTickAgent('b')];
    const tc = new TraceCollector();

    tickManager(agents, world, tc);

    const trace = tc.getLatest();
    // All births from Birth System v1 should pass the consistency contract
    // (they were produced by our own materializeNewborn with compliant schema)
    expect(trace.birthConsistency.status).toBe('PASS');
  });

  test('contract does not block simulation — tick completes even if violations found', () => {
    // We cannot easily inject bad births via the normal pipeline, but we can confirm
    // that a direct call with violations does not throw and returns a FAIL report
    const report = evaluateBirthConsistencyContract({
      tick: 99,
      births: [{
        id: 'bad-newborn',
        type: 'newborn',
        location: 'meadow',
        life: { birthTick: 1, ageTicks: 100, lifeStage: 'adult', lifeCondition: 'alive', alive: true },
        biology: { capacity: { structural: 'broken' }, condition: {} },
        lineage: { parentIds: ['ghost-parent'], birthTick: 1, originTick: 1 },
        infantDependency: Object.freeze({ birthTick: 1, stage: 'infant', active: true })
      }],
      previousTickState: { agents: [] },
      currentAgents: [],
      lineageGraph: null,
      worldSnapshot: null
    });

    // Does not throw, returns FAIL with violations
    expect(report.status).toBe('FAIL');
    expect(report.violations.length).toBeGreaterThan(0);
  });

  test('contract report tick matches worldObj.tick', () => {
    const world = makeWorld();
    const agents = [makeTickAgent('a'), makeTickAgent('b')];
    const tc = new TraceCollector();

    tickManager(agents, world, tc);

    const trace = tc.getLatest();
    expect(trace.birthConsistency.tick).toBe(world.tick);
  });
});
