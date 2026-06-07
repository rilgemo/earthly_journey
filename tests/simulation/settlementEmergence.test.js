const { ACTIONS_BY_ID } = require('../../src/simulation/actions');
const { createNPC } = require('../../src/simulation/agentModel');
const { generateIntents } = require('../../src/simulation/intentGenerator');
const { createIdentityFreeDecisionView } = require('../../src/simulation/identity/identityLock');
const { ReplayBuffer } = require('../../src/simulation/replayBuffer');
const { SettlementDetector } = require('../../src/simulation/settlement/settlementDetector');
const { evolveSettlements } = require('../../src/simulation/settlement/settlementGrowthModel');
const { TraceCollector } = require('../../src/simulation/traceCollector');

function tick(tickId, entries, demand = {}) {
  return {
    tickId,
    agents: entries.map(([agentId, actionSelected, position]) => ({
      agentId,
      actionSelected,
      position
    })),
    demand: { index: demand }
  };
}

function persistentTicks(tileId = 'tile-1-1', count = 3) {
  return Array.from({ length: count }, (_, index) => tick(index + 1, [
    ['a', 'farm', tileId],
    ['b', 'forge', tileId]
  ], { food: 80, tools: 60 }));
}

function detector(overrides = {}) {
  return new SettlementDetector({
    windowSize: 4,
    activityThreshold: 4,
    persistenceTicks: 3,
    minAgents: 2,
    ...overrides
  });
}

function intentFor(agent) {
  const decisionView = createIdentityFreeDecisionView(agent);
  return generateIntents(decisionView, [ACTIONS_BY_ID.get('farm')], {
    perception: { field: {}, nearbyAgents: [] },
    memories: [],
    needs: { profile: agent.needs },
    influenceProfile: {},
    demandIndex: {}
  });
}

describe('Persistent Activity Cluster Emergence Layer v1', () => {
  test('dense repeated multi-agent activity forms a persistent activity cluster', () => {
    const result = detector().loadTraceHistory(persistentTicks());

    expect(result.settlements).toHaveLength(1);
    expect(result.settlements[0]).toMatchObject({
      centerPoint: { tileId: 'tile-1-1' },
      agentCount: 2
    });
    expect(result.settlements[0].dominantActivities.map(entry => entry.action))
      .toEqual(expect.arrayContaining(['farm', 'forge']));
  });

  test('no activity cluster forms without persistence', () => {
    const result = detector().loadTraceHistory(persistentTicks('tile-1-1', 2));

    expect(result.settlements).toEqual([]);
  });

  test('a single agent cannot form an activity cluster', () => {
    const traces = Array.from({ length: 5 }, (_, index) => tick(index + 1, [
      ['solo', 'farm', 'tile-1-1'],
      ['solo', 'forge', 'tile-1-1']
    ]));

    expect(detector().loadTraceHistory(traces).settlements).toEqual([]);
  });

  test('activity cluster decays when activity leaves the history window', () => {
    const settlementDetector = detector({ windowSize: 3 });
    settlementDetector.loadTraceHistory(persistentTicks());

    const result = settlementDetector.loadTraceHistory([
      tick(4, []),
      tick(5, []),
      tick(6, [])
    ]);

    expect(result.settlements).toEqual([]);
  });

  test('replay reproduces activity cluster snapshots deterministically', () => {
    const replay = new ReplayBuffer();
    persistentTicks().forEach(trace => replay.push({ tick: trace.tickId, trace: [trace] }));
    const first = detector();
    const second = detector();

    expect(first.loadReplayFrames(replay.getAll())).toEqual(second.loadReplayFrames(replay.getAll()));
  });

  test('activity cluster analytics does not influence agent decisions', () => {
    const agent = createNPC({ id: 'agent', location: 'tile-1-1', skills: { farming: 20 }, rng: () => 0.5 });
    const before = intentFor(agent);

    detector().loadTraceHistory(persistentTicks());

    expect(intentFor(agent)).toEqual(before);
    expect(agent.settlement).toBeUndefined();
  });

  test('activity cluster metrics remain bounded', () => {
    const settlement = detector().loadTraceHistory(persistentTicks()).settlements[0];

    Object.values(settlement.metrics).forEach(value => {
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    });
    expect(settlement.densityScore).toBeGreaterThanOrEqual(0);
    expect(settlement.densityScore).toBeLessThanOrEqual(1);
    expect(settlement.persistenceScore).toBeGreaterThanOrEqual(0);
    expect(settlement.persistenceScore).toBeLessThanOrEqual(1);
  });

  test('growth model detects split and merge behavior', () => {
    const base = { activityCount: 10, persistenceScore: 1, metrics: {} };
    const merged = evolveSettlements([
      { ...base, id: 'left', tiles: ['tile-1-1'] },
      { ...base, id: 'right', tiles: ['tile-1-2'] }
    ], [
      { ...base, id: 'combined', tiles: ['tile-1-1', 'tile-1-2'] }
    ]);
    const split = evolveSettlements([
      { ...base, id: 'combined', tiles: ['tile-1-1', 'tile-1-2'] }
    ], [
      { ...base, id: 'left', tiles: ['tile-1-1'] },
      { ...base, id: 'right', tiles: ['tile-1-2'] }
    ]);

    expect(merged.events).toContainEqual(expect.objectContaining({ type: 'merge' }));
    expect(split.events).toContainEqual(expect.objectContaining({ type: 'split' }));
  });

  test('TraceCollector emits immutable activity cluster snapshots preserved by Replay Buffer', () => {
    const collector = new TraceCollector(20, 20, {
      windowSize: 3,
      activityThreshold: 4,
      persistenceTicks: 3,
      minAgents: 2
    });
    persistentTicks().forEach(trace => {
      collector.beginTick(trace.tickId, { areas: new Map() });
      collector.recordDemand(trace.demand);
      trace.agents.forEach(agentTrace => collector.recordAgent(agentTrace));
      collector.endTick();
    });
    const replay = new ReplayBuffer();
    replay.push({ tick: 3, trace: collector.getAll() });

    expect(collector.getLatest().settlements.settlements).toHaveLength(1);
    expect(Object.isFrozen(collector.getSettlementSnapshot())).toBe(true);
    expect(replay.latest().trace[2].settlements).toEqual(collector.getLatest().settlements);
  });
});
