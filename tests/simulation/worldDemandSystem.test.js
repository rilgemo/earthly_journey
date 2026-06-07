const { ACTIONS_BY_ID } = require('../../src/simulation/actions');
const { createNPC } = require('../../src/simulation/agentModel');
const { createDemandIndex } = require('../../src/simulation/demand/demandIndex');
const { calculateWorldDemand, getDemandOpportunityScore } = require('../../src/simulation/demand/demandModel');
const { calculateDemandSources } = require('../../src/simulation/demand/demandSources');
const { generateIntents } = require('../../src/simulation/intentGenerator');
const { createIdentityFreeDecisionView } = require('../../src/simulation/identity/identityLock');
const { ReplayBuffer } = require('../../src/simulation/replayBuffer');
const { resolveIntent } = require('../../src/simulation/resolutionModel');
const { tickManager } = require('../../src/simulation/tickManager');
const { TraceCollector } = require('../../src/simulation/traceCollector');
const { createArea } = require('../../src/simulation/worldField');

function world(signals = {}) {
  const area = createArea('tile', { arcane: 20 }, { baselineField: { arcane: 20 } });
  return {
    tick: 0,
    areas: new Map([['tile', area]]),
    demandSignals: signals,
    fieldPerturbationQueue: [],
    fieldDynamicsConfig: { diffusionRate: 0, conversionRate: 0, regenRate: 0 },
    getField(id) { return this.areas.get(id).field; },
    getRecentEvents() { return []; }
  };
}

function agent() {
  return createNPC({ id: 'agent', location: 'tile', skills: { farming: 20 }, rng: () => 0.5 });
}

function scoreFor(subject, actionId, demandIndex) {
  const decisionView = createIdentityFreeDecisionView(subject);
  return generateIntents(decisionView, [ACTIONS_BY_ID.get(actionId)], {
    perception: { field: {}, nearbyAgents: [] },
    memories: [],
    needs: { profile: subject.needs },
    influenceProfile: {},
    demandIndex
  })[0];
}

describe('World Demand System v1', () => {
  test('food shortage increases food demand', () => {
    const low = calculateDemandSources(world({ populationConsumption: 20, foodProduction: 20 }), []);
    const high = calculateDemandSources(world({ populationConsumption: 80, foodProduction: 10 }), []);

    expect(high.food).toBeGreaterThan(low.food);
  });

  test('tool shortage increases tools demand', () => {
    const low = calculateDemandSources(world({ toolDecay: 10, toolCreation: 10 }), []);
    const high = calculateDemandSources(world({ toolDecay: 80, toolCreation: 5 }), []);

    expect(high.tools).toBeGreaterThan(low.tools);
  });

  test('arcane instability increases arcane demand', () => {
    const stable = calculateDemandSources(world({ manaInstability: 0, fieldImbalance: 0, arcaneConsumption: 0 }), []);
    const unstable = calculateDemandSources(world({ manaInstability: 50, fieldImbalance: 30, arcaneConsumption: 10 }), []);

    expect(unstable.arcane).toBeGreaterThan(stable.arcane);
  });

  test('demand index values are bounded and immutable', () => {
    const index = createDemandIndex({ food: 999, tools: -50, safety: Infinity });

    expect(index.food).toBe(100);
    expect(index.tools).toBe(0);
    expect(index.safety).toBe(0);
    expect(Object.isFrozen(index)).toBe(true);
  });

  test('configurable damping smooths demand changes', () => {
    const result = calculateWorldDemand(
      world({ populationConsumption: 100, foodProduction: 0 }),
      [],
      createDemandIndex({ food: 0 }),
      { damping: 0.2 }
    );

    expect(result.index.food).toBe(20);
  });

  test('demand contributes additive intent scoring', () => {
    const subject = agent();
    const noDemand = scoreFor(subject, 'farm', createDemandIndex());
    const foodDemand = scoreFor(subject, 'farm', createDemandIndex({ food: 100 }));

    expect(foodDemand.components.demandScore).toBeGreaterThan(noDemand.components.demandScore);
    expect(foodDemand.score).toBeGreaterThan(noDemand.score);
  });

  test('demand does not select, execute, or guarantee an action', () => {
    const demand = createDemandIndex({ food: 100 });
    const result = calculateWorldDemand(world(), [], demand);
    const intents = [
      { intent: 'farm', score: getDemandOpportunityScore('farm', demand) },
      { intent: 'rest', score: 100 }
    ];

    expect(result.selectedAction).toBeUndefined();
    expect(result.executedAction).toBeUndefined();
    expect(resolveIntent(intents).intent).toBe('rest');
  });

  test('demand calculation does not mutate world, skills, identity, perception, or fields', () => {
    const runtimeWorld = world({ populationConsumption: 100, foodProduction: 0 });
    const subject = agent();
    subject.identities = Object.freeze(['Farmer']);
    const before = {
      signals: { ...runtimeWorld.demandSignals },
      field: { ...runtimeWorld.areas.get('tile').field },
      skills: { ...subject.skills },
      identities: [...subject.identities]
    };

    calculateWorldDemand(runtimeWorld, [subject], createDemandIndex());

    expect(runtimeWorld.demandSignals).toEqual(before.signals);
    expect(runtimeWorld.areas.get('tile').field).toEqual(before.field);
    expect(subject.skills).toEqual(before.skills);
    expect(subject.identities).toEqual(before.identities);
    expect(subject.perception).toBeUndefined();
  });

  test('demand calculation is deterministic', () => {
    const inputWorld = world({ populationConsumption: 60, foodProduction: 10, toolDecay: 20 });
    const previous = createDemandIndex({ food: 5 });

    expect(calculateWorldDemand(inputWorld, [], previous))
      .toEqual(calculateWorldDemand(inputWorld, [], previous));
  });

  test('tick trace and Replay Buffer preserve demand history', () => {
    const subject = agent();
    const runtimeWorld = world({ populationConsumption: 100, foodProduction: 0 });
    const traceCollector = new TraceCollector();
    const replay = new ReplayBuffer();

    tickManager([subject], runtimeWorld, traceCollector);
    const trace = traceCollector.getLatest();
    replay.push({
      tick: runtimeWorld.tick,
      worldSnapshot: { demand: runtimeWorld.demandIndex, demandHistory: runtimeWorld.demandHistory },
      trace
    });

    expect(trace.demand.index.food).toBeGreaterThan(0);
    expect(replay.latest().trace.demand).toEqual(trace.demand);
    expect(replay.latest().worldSnapshot.demandHistory).toHaveLength(1);
  });
});
