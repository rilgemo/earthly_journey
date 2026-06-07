const { createNPC } = require('../../src/simulation/agentModel');
const { ReplayBuffer } = require('../../src/simulation/replayBuffer');
const { createResourceMap } = require('../../src/simulation/resourceGeography/resourceMap');
const { createResourceSnapshot } = require('../../src/simulation/resourceGeography/resourceSnapshot');
const { runResourceFlowTick } = require('../../src/simulation/resourceFlow/resourceFlowEngine');
const { totalResourceValue } = require('../../src/simulation/resourceFlow/resourceBalance');
const { tickManager } = require('../../src/simulation/tickManager');
const { TraceCollector } = require('../../src/simulation/traceCollector');
const { createArea } = require('../../src/simulation/worldField');

function map(values = {}) {
  return createResourceMap({
    width: 3,
    height: 1,
    tiles: {
      'tile-0-0': { foodPotential: 80, waterPotential: 20, materialPotential: 20, arcanePotential: 20, ...values.left },
      'tile-1-0': { foodPotential: 20, waterPotential: 20, materialPotential: 20, arcanePotential: 20, ...values.mid },
      'tile-2-0': { foodPotential: 20, waterPotential: 20, materialPotential: 20, arcanePotential: 20, ...values.right }
    }
  });
}

function world(resourceMap = map(), baselineMap = map()) {
  const area = createArea('tile-1-0', { life: 50, water: 50, earth: 50, arcane: 10 }, {
    baselineField: { life: 50, water: 50, earth: 50, arcane: 10 }
  });
  return {
    tick: 0,
    areas: new Map([['tile-1-0', area]]),
    resourceMap,
    resourceBaselineMap: baselineMap,
    fieldPerturbationQueue: [],
    fieldDynamicsConfig: { diffusionRate: 0, conversionRate: 0, regenRate: 0 },
    getField(id) { return this.areas.get(id)?.field || {}; },
    getRecentEvents() { return []; }
  };
}

function yieldSnapshot(actionId = 'forage', amount = 10, tileId = 'tile-1-0') {
  return {
    actionId,
    tileContext: { tileId },
    finalYield: { food: amount }
  };
}

describe('Resource Flow Layer v1', () => {
  test('evolution is deterministic from the same state and yield inputs', () => {
    const input = {
      resourceMap: map(),
      baselineMap: map(),
      actionYieldSnapshots: [yieldSnapshot()],
      world: world(),
      config: { regenRate: 0.02, diffusionRate: 0.04 }
    };

    expect(runResourceFlowTick(input)).toEqual(runResourceFlowTick(input));
  });

  test('depletion reduces resource from action yield consumption', () => {
    const result = runResourceFlowTick({
      resourceMap: map({ mid: { foodPotential: 50 } }),
      baselineMap: map({ mid: { foodPotential: 50 } }),
      actionYieldSnapshots: [yieldSnapshot('forage', 20)],
      world: world(),
      config: { depletionRate: 0.1, regenRate: 0, diffusionRate: 0 }
    });

    expect(result.resourceMap.tiles['tile-1-0'].foodPotential).toBeCloseTo(48);
    expect(result.trace.depletionHeatmap['tile-1-0'].foodPotential).toBeCloseTo(2);
  });

  test('regeneration restores slowly toward baseline', () => {
    const result = runResourceFlowTick({
      resourceMap: map({ mid: { foodPotential: 20 } }),
      baselineMap: map({ mid: { foodPotential: 80 } }),
      actionYieldSnapshots: [],
      world: world(),
      config: { regenRate: 0.1, diffusionRate: 0 }
    });

    expect(result.resourceMap.tiles['tile-1-0'].foodPotential).toBeGreaterThan(20);
    expect(result.resourceMap.tiles['tile-1-0'].foodPotential).toBeLessThan(80);
  });

  test('diffusion spreads gradients from high to low neighboring tiles', () => {
    const result = runResourceFlowTick({
      resourceMap: map({ left: { foodPotential: 100 }, mid: { foodPotential: 0 }, right: { foodPotential: 0 } }),
      baselineMap: map({ left: { foodPotential: 100 }, mid: { foodPotential: 0 }, right: { foodPotential: 0 } }),
      actionYieldSnapshots: [],
      world: world(),
      config: { regenRate: 0, diffusionRate: 0.1, maxTransfer: 10 }
    });

    expect(result.resourceMap.tiles['tile-0-0'].foodPotential).toBeLessThan(100);
    expect(result.resourceMap.tiles['tile-1-0'].foodPotential).toBeGreaterThan(0);
    expect(result.trace.diffusionVectors.length).toBeGreaterThan(0);
  });

  test('resources do not explode under repeated flow ticks', () => {
    let resourceMap = map({ mid: { foodPotential: 99, waterPotential: 99, materialPotential: 99, arcanePotential: 99 } });
    const baselineMap = resourceMap;
    const runtimeWorld = world(resourceMap, baselineMap);

    for (let index = 0; index < 20; index += 1) {
      const result = runResourceFlowTick({
        resourceMap,
        baselineMap,
        actionYieldSnapshots: [],
        world: runtimeWorld,
        config: { regenRate: 0.2, diffusionRate: 0.1 }
      });
      resourceMap = result.resourceMap;
    }

    Object.values(resourceMap.tiles).forEach(tile => {
      ['foodPotential', 'waterPotential', 'materialPotential', 'arcanePotential'].forEach(resource => {
        expect(tile[resource]).toBeLessThanOrEqual(100);
      });
    });
  });

  test('resource values never become negative', () => {
    const result = runResourceFlowTick({
      resourceMap: map({ mid: { foodPotential: 1 } }),
      baselineMap: map({ mid: { foodPotential: 1 } }),
      actionYieldSnapshots: [yieldSnapshot('forage', 999)],
      world: world(),
      config: { depletionRate: 1, regenRate: 0, diffusionRate: 0 }
    });

    expect(result.resourceMap.tiles['tile-1-0'].foodPotential).toBe(0);
  });

  test('trace and replay preserve resource flow deterministically', () => {
    const runtimeWorld = world(map({ mid: { foodPotential: 80 } }), map({ mid: { foodPotential: 80 } }));
    const subject = createNPC({ id: 'agent', location: 'tile-1-0', skills: { farming: 20 }, rng: () => 0.5 });
    subject.memory.bias.farm = 100;
    const collector = new TraceCollector();
    const replay = new ReplayBuffer();

    tickManager([subject], runtimeWorld, collector);
    replay.push({ tick: runtimeWorld.tick, trace: collector.getAll() });

    expect(collector.getLatest().resourceFlow).toBeDefined();
    expect(replay.latest().trace[0].resourceFlow).toEqual(collector.getLatest().resourceFlow);
  });

  test('soft conservation remains within stability bounds', () => {
    const resourceMap = map({ left: { foodPotential: 100 }, mid: { foodPotential: 0 } });
    const result = runResourceFlowTick({
      resourceMap,
      baselineMap: resourceMap,
      actionYieldSnapshots: [],
      world: world(),
      config: { regenRate: 0, diffusionRate: 0.08 }
    });

    expect(Math.abs(totalResourceValue(result.resourceMap) - totalResourceValue(resourceMap))).toBeLessThan(0.000001);
    expect(result.trace.balance.stabilityRatio).toBeCloseTo(1);
  });

  test('activity cluster data does not affect resource flow directly', () => {
    const input = {
      resourceMap: map(),
      baselineMap: map(),
      actionYieldSnapshots: [yieldSnapshot()],
      world: {
        ...world(),
        settlements: { settlements: [{ id: 'settlement:test', densityScore: 1 }] }
      },
      config: { depletionRate: 0.1, regenRate: 0, diffusionRate: 0 }
    };
    const withoutSettlement = runResourceFlowTick({ ...input, world: world() });
    const withSettlement = runResourceFlowTick(input);

    expect(withSettlement.resourceMap).toEqual(withoutSettlement.resourceMap);
  });

  test('resource flow final state becomes the trace resource geography snapshot', () => {
    const runtimeWorld = world(map({ mid: { foodPotential: 80 } }), map({ mid: { foodPotential: 80 } }));
    const subject = createNPC({ id: 'agent', location: 'tile-1-0', skills: { farming: 20 }, rng: () => 0.5 });
    subject.memory.bias.farm = 100;
    const collector = new TraceCollector();

    tickManager([subject], runtimeWorld, collector);

    expect(collector.getLatest().resourceGeography)
      .toEqual(createResourceSnapshot(runtimeWorld.resourceMap));
  });
});
