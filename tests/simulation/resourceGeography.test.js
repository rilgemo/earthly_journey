const { ReplayBuffer } = require('../../src/simulation/replayBuffer');
const { generateResourceMap } = require('../../src/simulation/resourceGeography/resourceGenerator');
const { RESOURCE_TYPES, getTileResourceContext } = require('../../src/simulation/resourceGeography/resourceMap');
const { calculateResourceMetrics } = require('../../src/simulation/resourceGeography/resourceMetrics');
const { createResourceSnapshot } = require('../../src/simulation/resourceGeography/resourceSnapshot');
const { SettlementDetector } = require('../../src/simulation/settlement/settlementDetector');
const { TraceCollector } = require('../../src/simulation/traceCollector');

function maxNeighborDelta(resourceMap) {
  let max = 0;
  Object.values(resourceMap.tiles).forEach(tile => {
    const right = getTileResourceContext(resourceMap, { x: tile.x + 1, y: tile.y });
    const down = getTileResourceContext(resourceMap, { x: tile.x, y: tile.y + 1 });
    [right, down].filter(Boolean).forEach(neighbor => {
      RESOURCE_TYPES.forEach(type => {
        max = Math.max(max, Math.abs(tile[type] - neighbor[type]));
      });
    });
  });
  return max;
}

function farDelta(resourceMap) {
  const first = getTileResourceContext(resourceMap, 'tile-0-0');
  const last = getTileResourceContext(resourceMap, `tile-${resourceMap.width - 1}-${resourceMap.height - 1}`);
  return Math.max(...RESOURCE_TYPES.map(type => Math.abs(first[type] - last[type])));
}

describe('Resource Geography Layer v1', () => {
  test('resource generation is deterministic from seed', () => {
    expect(generateResourceMap({ width: 8, height: 8, seed: 99 }))
      .toEqual(generateResourceMap({ width: 8, height: 8, seed: 99 }));
  });

  test('trace and replay preserve resource snapshots', () => {
    const resourceMap = generateResourceMap({ width: 4, height: 4, seed: 11 });
    const collector = new TraceCollector();
    collector.beginTick(1, { areas: new Map(), resourceMap });
    collector.endTick();
    const replay = new ReplayBuffer();
    replay.push({ tick: 1, trace: collector.getAll() });

    expect(collector.getLatest().resourceGeography).toEqual(createResourceSnapshot(resourceMap));
    expect(replay.latest().trace[0].resourceGeography).toEqual(collector.getLatest().resourceGeography);
  });

  test('resource values are bounded environmental potentials', () => {
    const resourceMap = generateResourceMap({ width: 10, height: 10, seed: 7 });

    Object.values(resourceMap.tiles).forEach(tile => {
      RESOURCE_TYPES.forEach(type => {
        expect(tile[type]).toBeGreaterThanOrEqual(0);
        expect(tile[type]).toBeLessThanOrEqual(100);
      });
    });
  });

  test('neighboring tiles show spatial coherence', () => {
    const resourceMap = generateResourceMap({ width: 12, height: 12, seed: 15 });

    expect(maxNeighborDelta(resourceMap)).toBeLessThan(35);
    expect(farDelta(resourceMap)).toBeGreaterThan(0);
  });

  test('richness metrics are valid and bounded', () => {
    const metrics = calculateResourceMetrics(generateResourceMap({ width: 6, height: 6, seed: 1 }));

    expect(metrics.regionalRichness).toBeGreaterThanOrEqual(0);
    expect(metrics.regionalRichness).toBeLessThanOrEqual(1);
    expect(metrics.richestRegions.length).toBeGreaterThan(0);
  });

  test('diversity metrics are valid and bounded', () => {
    const metrics = calculateResourceMetrics(generateResourceMap({ width: 6, height: 6, seed: 2 }));

    expect(metrics.resourceDiversity).toBeGreaterThanOrEqual(0);
    expect(metrics.resourceDiversity).toBeLessThanOrEqual(1);
    expect(metrics.resourceEntropy).toBeGreaterThanOrEqual(0);
    expect(metrics.resourceEntropy).toBeLessThanOrEqual(1);
  });

  test('concentration metrics are valid and bounded', () => {
    const metrics = calculateResourceMetrics(generateResourceMap({ width: 6, height: 6, seed: 3 }));

    expect(metrics.resourceConcentration).toBeGreaterThanOrEqual(0);
    expect(metrics.resourceConcentration).toBeLessThanOrEqual(1);
  });

  test('activity cluster analytics does not modify geography', () => {
    const resourceMap = generateResourceMap({ width: 4, height: 4, seed: 5 });
    const before = JSON.parse(JSON.stringify(resourceMap));
    const detector = new SettlementDetector({ windowSize: 3, activityThreshold: 4, persistenceTicks: 3 });
    [1, 2, 3].forEach(tickId => detector.recordTick({
      tickId,
      resourceGeography: createResourceSnapshot(resourceMap),
      agents: [
        { agentId: 'a', actionSelected: 'farm', position: 'tile-1-1' },
        { agentId: 'b', actionSelected: 'mine', position: 'tile-1-1' }
      ]
    }));

    expect(resourceMap).toEqual(before);
    expect(Object.isFrozen(resourceMap)).toBe(true);
  });

  test('geography snapshots do not force activity cluster creation', () => {
    const resourceMap = generateResourceMap({ width: 4, height: 4, seed: 8 });
    const detector = new SettlementDetector({ windowSize: 3, activityThreshold: 4, persistenceTicks: 3 });
    const result = detector.loadTraceHistory([
      { tickId: 1, resourceGeography: createResourceSnapshot(resourceMap), agents: [] },
      { tickId: 2, resourceGeography: createResourceSnapshot(resourceMap), agents: [] },
      { tickId: 3, resourceGeography: createResourceSnapshot(resourceMap), agents: [] }
    ]);

    expect(result.settlements).toEqual([]);
  });

  test('tile resource context is immutable and does not expose inventory', () => {
    const context = getTileResourceContext(generateResourceMap({ width: 3, height: 3, seed: 4 }), 'tile-1-1');

    expect(Object.isFrozen(context)).toBe(true);
    expect(context.inventory).toBeUndefined();
    expect(context.foodPotential).toEqual(expect.any(Number));
  });
});
