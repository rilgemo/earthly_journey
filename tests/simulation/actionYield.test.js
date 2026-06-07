const { ACTIONS_BY_ID } = require('../../src/simulation/actions');
const { createNPC } = require('../../src/simulation/agentModel');
const { computeActionYield } = require('../../src/simulation/actionYield/actionYieldEngine');
const { yieldResolver } = require('../../src/simulation/actionYield/yieldResolver');
const { generateIntents } = require('../../src/simulation/intentGenerator');
const { createIdentityFreeDecisionView } = require('../../src/simulation/identity/identityLock');
const { ReplayBuffer } = require('../../src/simulation/replayBuffer');
const { generateResourceMap } = require('../../src/simulation/resourceGeography/resourceGenerator');
const { resolveIntent } = require('../../src/simulation/resolutionModel');
const { tickManager } = require('../../src/simulation/tickManager');
const { TraceCollector } = require('../../src/simulation/traceCollector');
const { createArea } = require('../../src/simulation/worldField');

function world(resourceSeed = 1, field = {}) {
  const area = createArea('tile-1-1', field, { baselineField: field });
  return {
    tick: 0,
    areas: new Map([['tile-1-1', area]]),
    resourceMap: generateResourceMap({ width: 4, height: 4, seed: resourceSeed }),
    fieldPerturbationQueue: [],
    fieldDynamicsConfig: { diffusionRate: 0, conversionRate: 0, regenRate: 0 },
    getField(id) { return this.areas.get(id).field; },
    getRecentEvents() { return []; }
  };
}

function agent() {
  const npc = createNPC({ id: 'agent', location: 'tile-1-1', skills: { farming: 20 }, rng: () => 0.5 });
  npc.memory.bias.farm = 100;
  return npc;
}

function intentFor(subject) {
  const decisionView = createIdentityFreeDecisionView(subject);
  return generateIntents(decisionView, [ACTIONS_BY_ID.get('farm')], {
    perception: { field: {}, nearbyAgents: [] },
    memories: [],
    needs: { profile: subject.needs },
    influenceProfile: {},
    demandIndex: {}
  });
}

describe('Action Yield Layer v1', () => {
  test('yield is deterministic from seeded resource geography', () => {
    const first = world(42, { life: 50, water: 50 });
    const second = world(42, { life: 50, water: 50 });

    expect(computeActionYield('farm', { world: first, tileId: 'tile-1-1', field: first.getField('tile-1-1') }))
      .toEqual(computeActionYield('farm', { world: second, tileId: 'tile-1-1', field: second.getField('tile-1-1') }));
  });

  test('resource geography influences yield magnitude', () => {
    const low = {
      resourceMap: generateResourceMap({ width: 4, height: 4, seed: 1 }),
      getField: () => ({})
    };
    const high = {
      resourceMap: {
        width: 4,
        height: 4,
        tiles: {
          'tile-1-1': { x: 1, y: 1, foodPotential: 100, waterPotential: 100, materialPotential: 0, arcanePotential: 0 },
          'tile-2-1': { x: 2, y: 1, foodPotential: 100, waterPotential: 100, materialPotential: 0, arcanePotential: 0 },
          'tile-0-1': { x: 0, y: 1, foodPotential: 100, waterPotential: 100, materialPotential: 0, arcanePotential: 0 },
          'tile-1-2': { x: 1, y: 2, foodPotential: 100, waterPotential: 100, materialPotential: 0, arcanePotential: 0 },
          'tile-1-0': { x: 1, y: 0, foodPotential: 100, waterPotential: 100, materialPotential: 0, arcanePotential: 0 }
        }
      },
      getField: () => ({})
    };

    expect(yieldResolver('farm', { world: high, tileId: 'tile-1-1' }).totalYield)
      .toBeGreaterThan(yieldResolver('farm', { world: low, tileId: 'tile-1-1' }).totalYield);
  });

  test('elemental fields influence yield magnitude', () => {
    const dry = world(5, { water: 0, life: 0 });
    const fertile = world(5, { water: 100, life: 100 });

    expect(computeActionYield('farm', { world: fertile, tileId: 'tile-1-1', field: fertile.getField('tile-1-1') }).totalYield)
      .toBeGreaterThan(computeActionYield('farm', { world: dry, tileId: 'tile-1-1', field: dry.getField('tile-1-1') }).totalYield);
  });

  test('identical action and tile produce identical output', () => {
    const runtimeWorld = world(9, { life: 20 });
    const context = { world: runtimeWorld, tileId: 'tile-1-1', field: runtimeWorld.getField('tile-1-1') };

    expect(yieldResolver('forage', context)).toEqual(yieldResolver('forage', context));
  });

  test('yield is bounded and cannot explode', () => {
    const runtimeWorld = world(2, { water: 9999, life: 9999, arcane: 9999 });
    const result = computeActionYield('farm', { world: runtimeWorld, tileId: 'tile-1-1', field: runtimeWorld.getField('tile-1-1') });

    Object.values(result.finalYield).forEach(value => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    });
    expect(result.environmentalMultiplier).toBeLessThanOrEqual(81);
  });

  test('yield calculation does not affect intent or resolution', () => {
    const subject = agent();
    const beforeIntent = intentFor(subject);
    const beforeResolution = resolveIntent(beforeIntent);

    computeActionYield('farm', { world: world(4), tileId: 'tile-1-1', field: {} });

    expect(intentFor(subject)).toEqual(beforeIntent);
    expect(resolveIntent(intentFor(subject))).toEqual(beforeResolution);
    expect(subject.skills.farming).toBe(20);
  });

  test('tick trace and Replay Buffer preserve yield snapshots', () => {
    const runtimeWorld = world(7, { water: 50, life: 50 });
    const subject = agent();
    const collector = new TraceCollector();
    const replay = new ReplayBuffer();

    tickManager([subject], runtimeWorld, collector);
    replay.push({ tick: runtimeWorld.tick, trace: collector.getAll() });

    expect(collector.getLatest().agents[0].actionYieldSnapshot.actionId).toBe('farm');
    expect(replay.latest().trace[0].agents[0].actionYieldSnapshot)
      .toEqual(collector.getLatest().agents[0].actionYieldSnapshot);
  });

  test('spatial variation changes yield across tiles', () => {
    const runtimeWorld = world(123, { water: 40, life: 40 });
    const first = computeActionYield('forage', {
      world: runtimeWorld,
      tileId: 'tile-0-0',
      field: runtimeWorld.getField('tile-1-1')
    });
    const second = computeActionYield('forage', {
      world: runtimeWorld,
      tileId: 'tile-3-3',
      field: runtimeWorld.getField('tile-1-1')
    });

    expect(first.totalYield).not.toBe(second.totalYield);
  });

  test('yield does not mutate world, demand, perception, identity, or inventory', () => {
    const runtimeWorld = world(6, { water: 30, life: 30 });
    runtimeWorld.demandIndex = Object.freeze({ food: 80 });
    const subject = agent();
    subject.identities = Object.freeze(['Farmer']);
    const before = {
      world: JSON.parse(JSON.stringify(runtimeWorld.resourceMap)),
      demand: runtimeWorld.demandIndex,
      skills: { ...subject.skills },
      identities: [...subject.identities]
    };

    computeActionYield('farm', { world: runtimeWorld, tileId: 'tile-1-1', field: runtimeWorld.getField('tile-1-1') });

    expect(runtimeWorld.resourceMap).toEqual(before.world);
    expect(runtimeWorld.demandIndex).toBe(before.demand);
    expect(subject.skills).toEqual(before.skills);
    expect(subject.identities).toEqual(before.identities);
    expect(subject.inventory).toBeUndefined();
    expect(subject.perception).toBeUndefined();
  });
});
