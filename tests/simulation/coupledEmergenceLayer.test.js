const { createArea } = require('../../src/simulation/worldField');
const { coupleActivityToFields } = require('../../src/simulation/coupledEmergence/activityFieldCoupler');
const { coupleSocialDensityToFields } = require('../../src/simulation/coupledEmergence/socialFieldCoupler');
const { imprintMemoryToFields } = require('../../src/simulation/coupledEmergence/memoryFieldImprint');
const { emergenceTickHook } = require('../../src/simulation/coupledEmergence/emergenceTickHook');
const { tickManager } = require('../../src/simulation/tickManager');
const { ACTION_PROFILES, PROFESSION_ACTIONS } = require('../../src/simulation/actions/actionProfiles');

function createWorld() {
  const area = createArea('town', { fire: 1 }, {
    baselineField: { fire: 1 },
    neighbors: []
  });

  return {
    tick: 0,
    areas: new Map([['town', area]]),
    fieldPerturbationQueue: [],
    fieldDynamicsConfig: { diffusionRate: 0, conversionRate: 0, regenRate: 0 },
    emergenceHistory: {},
    getField(tileId) {
      return this.areas.get(tileId).field;
    },
    getRecentEvents() {
      return [];
    }
  };
}

function createMage() {
  return {
    id: 'mage_1',
    role: 'mage',
    location: 'town',
    needs: { hunger: 0, fatigue: 0, manaNeed: 0, socialNeed: 0, safetyNeed: 0 },
    affinities: {},
    mana: {
      capacity: 100,
      current: 50,
      stability: 0.8,
      affinity: { arcane: 1 }
    },
    memory: { shortTerm: [], longTerm: [], recentEvents: [], bias: {} },
    trustMap: {}
  };
}

describe('Coupled Emergence Layer v1', () => {
  test('activity produces correct perturbation proposals', () => {
    const proposals = coupleActivityToFields([
      { action: 'forge_sword', tileId: 'town' },
      { action: 'cast_magic', tileId: 'town' }
    ]);

    expect(proposals[0]).toMatchObject({
      tileId: 'town',
      source: 'activity',
      fields: { fire: 0.13, earth: 0.09, arcane: 0.12 }
    });
    expect(proposals).toHaveLength(1);
  });

  test('social density creates stability and conflict pressure', () => {
    const agents = [
      { location: 'town' },
      { location: 'town' },
      { location: 'town' }
    ];
    const stable = coupleSocialDensityToFields(agents, []);
    const conflict = coupleSocialDensityToFields(agents, [{ action: 'attack', tileId: 'town' }]);

    expect(stable[0].fields.life).toBeGreaterThan(0);
    expect(stable[0].fields.water).toBeGreaterThan(0);
    expect(stable[0].fields.arcane).toBeGreaterThan(0);
    expect(conflict[0].fields.fire).toBeGreaterThan(0);
    expect(conflict[0].fields.earth).toBeLessThan(0);
  });

  test('repeated actions create persistent field drift proposals', () => {
    let history = {};
    const action = [{ action: 'forge_sword', tileId: 'town' }];

    history = imprintMemoryToFields(history, action).history;
    history = imprintMemoryToFields(history, action).history;
    const third = imprintMemoryToFields(history, action);
    const later = imprintMemoryToFields(third.history, []);

    expect(third.perturbations[0].fields.fire).toBeGreaterThan(0);
    expect(later.perturbations).toEqual(third.perturbations);
  });

  test('coupling layer does not directly mutate field state or inputs', () => {
    const world = createWorld();
    const fieldBefore = { ...world.areas.get('town').field };
    const history = {};

    const result = emergenceTickHook({
      agents: [{ location: 'town' }],
      agentLog: [{ action: 'cast_magic', tileId: 'town' }],
      history
    });

    expect(world.areas.get('town').field).toEqual(fieldBefore);
    expect(history).toEqual({});
    expect(result.perturbations[0].source).toBe('activity');
  });

  test('coupling runs after field tick and queues proposals for next tick', () => {
    const world = createWorld();
    const mage = createMage();

    tickManager([mage], world);
    const selectedAction = world.lastEmergenceTrace.activityCouplingLog[0].actions[0];
    const queuedArcane = ACTION_PROFILES[selectedAction].fieldAffinity.arcane;

    expect(world.lastEmergenceTrace.activityCouplingLog[0]).toMatchObject({
      tileId: 'town',
      source: 'activity'
    });
    expect(PROFESSION_ACTIONS.mage).toContain(selectedAction);
    expect(world.fieldPerturbationQueue[0].perturbation.arcane).toBe(queuedArcane);
    const firstFinalArcane = world.lastFieldDynamicsTrace.finalFieldState.town.arcane;

    tickManager([], world);
    expect(world.lastFieldDynamicsTrace.preDiffusionState.town.arcane)
      .toBeCloseTo(firstFinalArcane + queuedArcane);
  });

  test('perturbations are additive only', () => {
    const result = emergenceTickHook({
      agents: [{ location: 'town' }, { location: 'town' }],
      agentLog: [{ action: 'forge_sword', tileId: 'town' }]
    });

    expect(result.perturbations).toHaveLength(2);
    expect(result.perturbations.every(proposal => proposal.fields && proposal.source)).toBe(true);
    expect(result.selectedAction).toBeUndefined();
    expect(result.finalFieldState).toBeUndefined();
  });

  test('same input produces deterministic coupling output', () => {
    const input = {
      agents: [{ location: 'town' }, { location: 'town' }, { location: 'town' }],
      agentLog: [{ action: 'forge_sword', tileId: 'town' }],
      history: { town: { forge_sword: 2 } }
    };

    expect(emergenceTickHook(input)).toEqual(emergenceTickHook(input));
  });
});
