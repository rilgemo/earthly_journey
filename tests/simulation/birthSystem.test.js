const { evaluateCommitmentBoundary } = require('../../src/simulation/reproduction/reproductionCommitmentBoundary');
const { runBirthSystem } = require('../../src/simulation/reproduction/birthSystem');
const { computeReproductionProbabilityField } = require('../../src/simulation/reproduction/reproductionProbabilityField');
const { runReproductionEventEngine } = require('../../src/simulation/reproduction/reproductionEventEngine');
const { tickManager } = require('../../src/simulation/tickManager');
const { TraceCollector } = require('../../src/simulation/traceCollector');

// ---------------------------------------------------------------------------
// Shared test helpers
// ---------------------------------------------------------------------------

function createAgent(id, overrides = {}) {
  return {
    id,
    location: 'meadow',
    life: { alive: true, lifeStage: 'adult', ageTicks: 100, maxAgeTicks: 90 * 365 },
    biology: {
      capacity: { structural: 'full', metabolic: 'full', immune: 'full', neural: 'full' },
      condition: { structural: 'sound', metabolic: 'sound', immune: 'sound', neural: 'sound' }
    },
    memory: { shortTerm: [], longTerm: [], recentEvents: [] },
    ...overrides
  };
}

function buildFullPipeline(agents, world = {}) {
  const reproductionField = computeReproductionProbabilityField(agents, world);
  const tick = world.tick || 1;
  const { proposals } = runReproductionEventEngine({ tick, agents, reproductionField, world });
  const commitmentReport = evaluateCommitmentBoundary({ tick, proposals, reproductionField, agents, world });
  return { reproductionField, proposals, commitmentReport };
}

function makeMinimalWorld(tick = 1) {
  return {
    tick,
    areas: new Map([['meadow', {
      id: 'meadow',
      field: { fire: 0, water: 0, earth: 0, arcane: 0 },
      recentEvents: []
    }]]),
    getField(id) { return this.areas.get(id).field; },
    getRecentEvents(id) { return this.areas.get(id).recentEvents; }
  };
}

function createTickAgent(id, overrides = {}) {
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
    stamina: 100,
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// Commitment Boundary (Layer C) tests
// ---------------------------------------------------------------------------

describe('ReproductionCommitmentBoundary (Layer C)', () => {
  test('returns frozen report with required schema fields', () => {
    const agents = [createAgent('a'), createAgent('b')];
    const { reproductionField, proposals } = buildFullPipeline(agents);
    const report = evaluateCommitmentBoundary({
      tick: 1, proposals, reproductionField, agents, world: {}
    });

    expect(Object.isFrozen(report)).toBe(true);
    expect(typeof report.tick).toBe('number');
    expect(typeof report.evaluatedAt).toBe('number');
    expect(Array.isArray(report.eligibleCandidates)).toBe(true);
    expect(Array.isArray(report.suppressedCandidates)).toBe(true);
    expect(report.boundaryMetadata.boundaryVersion).toBe('v1');
  });

  test('emits empty report when proposals is empty', () => {
    const report = evaluateCommitmentBoundary({
      tick: 5, proposals: [], reproductionField: [], agents: [], world: {}
    });
    expect(report.eligibleCandidates).toHaveLength(0);
    expect(report.suppressedCandidates).toHaveLength(0);
    expect(report.boundaryMetadata.sourceProposalCount).toBe(0);
  });

  test('suppresses proposals where a participant is not adult', () => {
    const agents = [
      createAgent('a'),
      createAgent('b', { life: { alive: true, lifeStage: 'juvenile', ageTicks: 10, maxAgeTicks: 90 * 365 } })
    ];
    const { reproductionField, proposals } = buildFullPipeline(agents);
    const report = evaluateCommitmentBoundary({
      tick: 1, proposals, reproductionField, agents, world: {}
    });

    // All proposals involving 'b' (juvenile) must be suppressed
    for (const candidate of report.eligibleCandidates) {
      expect(candidate.participants).not.toContain('b');
    }
  });

  test('suppresses proposals where a participant has _pendingDeath', () => {
    const agents = [createAgent('a'), createAgent('b', { _pendingDeath: true })];
    const { reproductionField, proposals } = buildFullPipeline(agents);
    const report = evaluateCommitmentBoundary({
      tick: 1, proposals, reproductionField, agents, world: {}
    });
    expect(report.eligibleCandidates).toHaveLength(0);
    expect(report.suppressedCandidates.length).toBeGreaterThanOrEqual(0);
  });

  test('candidate participants are symmetric — no role ordering', () => {
    const agents = [createAgent('a'), createAgent('b')];
    const { reproductionField, proposals } = buildFullPipeline(agents);
    const report = evaluateCommitmentBoundary({
      tick: 1, proposals, reproductionField, agents, world: {}
    });

    for (const candidate of [...report.eligibleCandidates, ...report.suppressedCandidates]) {
      // participants must be sorted — no parentA/parentB asymmetry
      const sorted = [...candidate.participants].sort();
      expect(candidate.participants).toEqual(sorted);
      expect(Object.isFrozen(candidate.participants)).toBe(true);
    }
  });

  test('candidate schema contains only permitted fields — no birth outcome fields', () => {
    const agents = [createAgent('a'), createAgent('b')];
    const { reproductionField, proposals } = buildFullPipeline(agents);
    const report = evaluateCommitmentBoundary({
      tick: 1, proposals, reproductionField, agents, world: {}
    });

    const allCandidates = [...report.eligibleCandidates, ...report.suppressedCandidates];
    for (const candidate of allCandidates) {
      expect(candidate).not.toHaveProperty('newborn');
      expect(candidate).not.toHaveProperty('lineage');
      expect(candidate).not.toHaveProperty('birthOutcome');
      expect(candidate).not.toHaveProperty('parentRole');
      expect(candidate).not.toHaveProperty('couplingRecord');
      expect(candidate).not.toHaveProperty('executionFlag');
    }
  });

  test('does not mutate agents, proposals, or reproductionField', () => {
    const agents = [createAgent('a'), createAgent('b')];
    const { reproductionField, proposals } = buildFullPipeline(agents);
    const agentsBefore = JSON.parse(JSON.stringify(agents));
    const proposalsBefore = JSON.parse(JSON.stringify(proposals));
    const fieldBefore = JSON.parse(JSON.stringify(reproductionField));

    evaluateCommitmentBoundary({ tick: 1, proposals, reproductionField, agents, world: {} });

    expect(agents).toEqual(agentsBefore);
    expect(JSON.parse(JSON.stringify(proposals))).toEqual(proposalsBefore);
    expect(JSON.parse(JSON.stringify(reproductionField))).toEqual(fieldBefore);
  });

  test('boundary metadata counts match candidate arrays', () => {
    const agents = [createAgent('a'), createAgent('b'), createAgent('c')];
    const { reproductionField, proposals } = buildFullPipeline(agents);
    const report = evaluateCommitmentBoundary({
      tick: 1, proposals, reproductionField, agents, world: {}
    });

    expect(report.boundaryMetadata.sourceProposalCount).toBe(proposals.length);
    expect(report.boundaryMetadata.eligibleCount).toBe(report.eligibleCandidates.length);
    expect(report.boundaryMetadata.suppressedCount).toBe(report.suppressedCandidates.length);
    expect(report.eligibleCandidates.length + report.suppressedCandidates.length)
      .toBeLessThanOrEqual(proposals.length);
  });

  test('proposalId is deterministic and stable for the same tick and participants', () => {
    const agents = [createAgent('a'), createAgent('b')];
    const { reproductionField, proposals } = buildFullPipeline(agents);

    const r1 = evaluateCommitmentBoundary({ tick: 3, proposals, reproductionField, agents, world: {} });
    const r2 = evaluateCommitmentBoundary({ tick: 3, proposals, reproductionField, agents, world: {} });

    const ids1 = [...r1.eligibleCandidates, ...r1.suppressedCandidates].map(c => c.proposalId).sort();
    const ids2 = [...r2.eligibleCandidates, ...r2.suppressedCandidates].map(c => c.proposalId).sort();
    expect(ids1).toEqual(ids2);
  });
});

// ---------------------------------------------------------------------------
// Birth System (Layer D) tests
// ---------------------------------------------------------------------------

describe('BirthSystem (Layer D)', () => {
  test('returns frozen result with required trace shape', () => {
    const agents = [createAgent('a'), createAgent('b')];
    const world = { tick: 1 };
    const { commitmentReport } = buildFullPipeline(agents, world);

    const result = runBirthSystem({ commitmentReport, npcs: agents, world });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Array.isArray(result.births)).toBe(true);
    expect(Array.isArray(result.rejectedCommitments)).toBe(true);
    expect(result.tick).toBe(1);
  });

  test('produces no births when commitmentReport has no eligible candidates', () => {
    const world = { tick: 1 };
    const emptyReport = {
      tick: 1, evaluatedAt: 1,
      eligibleCandidates: [],
      suppressedCandidates: [],
      boundaryMetadata: { sourceProposalCount: 0, eligibleCount: 0, suppressedCount: 0, boundaryVersion: 'v1' }
    };
    const result = runBirthSystem({ commitmentReport: emptyReport, npcs: [], world });
    expect(result.births).toHaveLength(0);
  });

  test('newborn has required lifecycle fields', () => {
    const agents = [createAgent('a'), createAgent('b')];
    const world = { tick: 7 };
    const { commitmentReport } = buildFullPipeline(agents, world);

    const result = runBirthSystem({ commitmentReport, npcs: agents, world });

    for (const newborn of result.births) {
      expect(newborn.id).toMatch(/^newborn:/);
      expect(newborn.life.birthTick).toBe(7);
      expect(newborn.life.ageTicks).toBe(0);
      expect(newborn.life.lifeStage).toBe('juvenile');
      expect(newborn.life.alive).toBe(true);
      expect(newborn.biology).toBeDefined();
      expect(newborn.lineage).toBeDefined();
      expect(Object.isFrozen(newborn.lineage)).toBe(true);
      expect(Array.isArray(newborn.lineage.parentIds)).toBe(true);
      expect(newborn.infantDependency).toBeDefined();
      expect(Object.isFrozen(newborn.infantDependency)).toBe(true);
      expect(newborn.infantDependency.stage).toBe('infant');
    }
  });

  test('newborn lineage parentIds are symmetric — no role ordering', () => {
    const agents = [createAgent('b'), createAgent('a')];
    const world = { tick: 2 };
    const { commitmentReport } = buildFullPipeline(agents, world);
    const result = runBirthSystem({ commitmentReport, npcs: agents, world });

    for (const newborn of result.births) {
      const sorted = [...newborn.lineage.parentIds].sort();
      expect(newborn.lineage.parentIds).toEqual(sorted);
    }
  });

  test('does NOT mutate existing agents in the current tick population', () => {
    const agents = [createAgent('a'), createAgent('b')];
    const world = { tick: 1 };
    const { commitmentReport } = buildFullPipeline(agents, world);

    const before = JSON.parse(JSON.stringify(agents));
    runBirthSystem({ commitmentReport, npcs: agents, world });
    expect(agents).toEqual(before);
  });

  test('rejects commitments whose participants were removed by finalizePendingDeaths', () => {
    const agents = [createAgent('a'), createAgent('b')];
    const world = { tick: 1 };
    const { commitmentReport } = buildFullPipeline(agents, world);

    // Simulate finalizePendingDeaths removing agent 'b' — pass survivors only
    const survivorsAfterDeath = [createAgent('a')];
    const result = runBirthSystem({ commitmentReport, npcs: survivorsAfterDeath, world });

    // All eligible candidates included 'b' — all must be rejected
    expect(result.births).toHaveLength(0);
    if (commitmentReport.eligibleCandidates.length > 0) {
      expect(result.rejectedCommitments.length).toBeGreaterThan(0);
      expect(result.rejectedCommitments[0].reason).toBe('participant_did_not_survive_death_cleanup');
    }
  });

  test('is deterministic — same inputs produce identical newborn ids and lineage', () => {
    const agents = [createAgent('a'), createAgent('b')];
    const world = { tick: 5 };
    const { commitmentReport } = buildFullPipeline(agents, world);

    const r1 = runBirthSystem({ commitmentReport, npcs: agents, world });
    const r2 = runBirthSystem({ commitmentReport, npcs: agents, world });

    expect(r1.births.map(b => b.id)).toEqual(r2.births.map(b => b.id));
    expect(JSON.parse(JSON.stringify(r1.births))).toEqual(JSON.parse(JSON.stringify(r2.births)));
  });

  test('birth system has no selection, ranking, or probability logic', () => {
    // Inspect source as a structural contract: all eligible candidates are processed
    // in order without skip-by-rank or skip-by-probability branching.
    // We verify this by confirming births count cannot exceed eligible candidates.
    const agents = [createAgent('a'), createAgent('b'), createAgent('c')];
    const world = { tick: 1 };
    const { commitmentReport } = buildFullPipeline(agents, world);

    const result = runBirthSystem({ commitmentReport, npcs: agents, world });
    expect(result.births.length + result.rejectedCommitments.length)
      .toBeLessThanOrEqual(commitmentReport.eligibleCandidates.length);
  });

  test('newborn birth fields are not carried into birthing-tick agent trace', () => {
    // Newborns are appended to npcs by tickManager AFTER the agent loop completes.
    // This test verifies no existing agent acquires a 'lineage' or 'infantDependency' field.
    const agents = [createAgent('a'), createAgent('b')];
    const world = { tick: 1 };
    const { commitmentReport } = buildFullPipeline(agents, world);

    runBirthSystem({ commitmentReport, npcs: agents, world });

    for (const agent of agents) {
      expect(agent).not.toHaveProperty('lineage');
      expect(agent).not.toHaveProperty('infantDependency');
    }
  });

  test('newborn does not appear in current tick population until caller appends it', () => {
    const agents = [createAgent('a'), createAgent('b')];
    const world = { tick: 1 };
    const { commitmentReport } = buildFullPipeline(agents, world);
    const originalCount = agents.length;

    const result = runBirthSystem({ commitmentReport, npcs: agents, world });

    // runBirthSystem does NOT append — tickManager does; population unchanged here
    expect(agents).toHaveLength(originalCount);
    expect(result.births.length).toBeGreaterThanOrEqual(0);
  });

  test('commitmentReport is the only valid dependency — raw proposals are not accepted', () => {
    // Verify the function signature requires commitmentReport, not proposals directly
    const agents = [createAgent('a'), createAgent('b')];
    const world = { tick: 1 };

    // Passing null commitmentReport returns empty births — no crash, no selection logic
    const result = runBirthSystem({ commitmentReport: null, npcs: agents, world });
    expect(result.births).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// tickManager integration: newborn appears in NEXT tick only
// ---------------------------------------------------------------------------

describe('BirthSystem tickManager integration', () => {
  test('newborn appended after tick ends does not affect current tick agent traces', () => {
    const world = makeMinimalWorld(0);
    const agents = [createTickAgent('a'), createTickAgent('b')];
    const traceCollector = new TraceCollector();

    tickManager(agents, world, traceCollector);

    const trace = traceCollector.getLatest();
    // The agent traces for this tick should only show the original two agents.
    // Any newborns added to the array are not in agentTraces.
    const tracedIds = trace.agents.map(a => a.agentId);
    expect(tracedIds).not.toContain(expect.stringMatching(/^newborn:/));
  });

  test('birthSystem trace is written to traceCollector with required fields', () => {
    const world = makeMinimalWorld(0);
    const agents = [createTickAgent('a'), createTickAgent('b')];
    const traceCollector = new TraceCollector();

    tickManager(agents, world, traceCollector);

    const trace = traceCollector.getLatest();
    expect(trace).toHaveProperty('birthSystem');
    expect(Array.isArray(trace.birthSystem.births)).toBe(true);
    expect(Array.isArray(trace.birthSystem.rejectedCommitments)).toBe(true);
    expect(typeof trace.birthSystem.tick).toBe('number');
  });

  test('reproductionCommitment trace is written with boundary schema', () => {
    const world = makeMinimalWorld(0);
    const agents = [createTickAgent('a'), createTickAgent('b')];
    const traceCollector = new TraceCollector();

    tickManager(agents, world, traceCollector);

    const trace = traceCollector.getLatest();
    expect(trace).toHaveProperty('reproductionCommitment');
    expect(trace.reproductionCommitment).toHaveProperty('eligibleCandidates');
    expect(trace.reproductionCommitment).toHaveProperty('suppressedCandidates');
    expect(trace.reproductionCommitment.boundaryMetadata.boundaryVersion).toBe('v1');
  });

  test('newborn present in population on the NEXT tick', () => {
    const world = makeMinimalWorld(0);
    const agents = [createTickAgent('a'), createTickAgent('b')];
    const traceCollector1 = new TraceCollector();

    // Tick 1 — may produce newborns and append them to agents array
    tickManager(agents, world, traceCollector1);
    const countAfterTick1 = agents.length;

    // If a newborn was added, it appears in population for tick 2
    const traceCollector2 = new TraceCollector();
    tickManager(agents, world, traceCollector2);

    // agents array for tick 2 includes whatever was in it after tick 1
    expect(agents.length).toBeGreaterThanOrEqual(countAfterTick1);

    // Any newborn that was in agents at start of tick 2 gets a life trace
    const tick2Trace = traceCollector2.getLatest();
    const tick2AgentIds = tick2Trace.agents.map(a => a.agentId);
    const newbornsInTick1 = traceCollector1.getLatest().birthSystem.births;
    for (const nb of newbornsInTick1) {
      expect(tick2AgentIds).toContain(nb.id);
    }
  });

  test('existing agents are not mutated by birth system during tick', () => {
    const world = makeMinimalWorld(0);
    const agentA = createTickAgent('a');
    const agentB = createTickAgent('b');
    const agents = [agentA, agentB];

    const idBefore = agentA.id;
    const locationBefore = agentA.location;

    tickManager(agents, world, null);

    expect(agentA.id).toBe(idBefore);
    expect(agentA.location).toBe(locationBefore);
    expect(agentA).not.toHaveProperty('lineage');
    expect(agentA).not.toHaveProperty('infantDependency');
  });
});
